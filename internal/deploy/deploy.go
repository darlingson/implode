// Package deploy runs container deployment jobs: clone, detect, build, run.
//
// A job is kicked off with Deployer.Start and runs in the background while
// callers poll Deployer.Get. Statuses: cloning → building → running → live,
// or failed from any stage.
package deploy

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

const (
	StatusCloning  = "cloning"
	StatusBuilding = "building"
	StatusRunning  = "running"
	StatusFailed   = "failed"
	StatusLive     = "live"
)

// terminal reports whether no further transitions will happen.
func terminal(s string) bool {
	return s == StatusFailed || s == StatusLive
}

var (
	// ErrInProgress is returned when the repo already has an active job.
	ErrInProgress = fmt.Errorf("deployment already in progress for this repo")
	// ErrUnknownBuildType is returned for an unrecognized build_type override.
	ErrUnknownBuildType = fmt.Errorf("unknown build_type")
)

var namePattern = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{0,63}$`)

// Request is the POST /api/deploy payload.
type Request struct {
	Name      string `json:"name"` // app name → image/container name
	RepoURL   string `json:"repo"`
	Ref       string `json:"ref"`                  // branch/tag, default "main"
	BuildType string `json:"build_type,omitempty"` // override detection
}

// Validate fills defaults and rejects bad input before any job is created.
func (r *Request) Validate() error {
	r.Name = strings.ToLower(strings.TrimSpace(r.Name))
	r.RepoURL = strings.TrimSpace(r.RepoURL)
	r.Ref = strings.TrimSpace(r.Ref)
	r.BuildType = strings.ToLower(strings.TrimSpace(r.BuildType))

	if !namePattern.MatchString(r.Name) {
		return fmt.Errorf("name: must be 1-64 chars, lowercase letters, digits, '.', '_' or '-', starting with a letter or digit")
	}
	if !isGitURL(r.RepoURL) {
		return fmt.Errorf("repo: must be an http(s) or SSH git URL")
	}
	if r.Ref == "" {
		r.Ref = "main"
	}
	if r.BuildType != "" && !knownType(r.BuildType) {
		return fmt.Errorf("build_type: %w %q (known: %s)", ErrUnknownBuildType, r.BuildType, knownNames())
	}
	return nil
}

func isGitURL(s string) bool {
	if strings.HasPrefix(s, "git@") || strings.HasPrefix(s, "ssh://") {
		return len(s) > len("git@")
	}
	if strings.HasPrefix(s, "https://") || strings.HasPrefix(s, "http://") {
		u, err := url.Parse(s)
		return err == nil && u.Host != ""
	}
	return false
}

// Job is a single deployment attempt.
type Job struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Repo        string   `json:"repo"`
	Status      string   `json:"status"`
	FailingStep string   `json:"failing_step,omitempty"`
	ContainerID string   `json:"container_id,omitempty"`
	HostPort    int      `json:"host_port,omitempty"`
	Logs        []string `json:"logs"`
}

const maxLogLines = 2000

// Deployer tracks jobs and runs pipelines in the background.
type Deployer struct {
	mu      sync.Mutex
	workDir string
	jobs    map[string]*Job
}

// New creates a Deployer using workDir for per-job workspaces.
func New(workDir string) *Deployer {
	return &Deployer{workDir: workDir, jobs: make(map[string]*Job)}
}

// Start validates the request, registers a job, and kicks off the pipeline.
// It returns ErrInProgress when the repo already has an active job.
func (d *Deployer) Start(req Request) (*Job, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	d.mu.Lock()
	for _, j := range d.jobs {
		if j.Repo == req.RepoURL && !terminal(j.Status) {
			d.mu.Unlock()
			return nil, ErrInProgress
		}
	}
	job := &Job{
		ID:     newID(),
		Name:   req.Name,
		Repo:   req.RepoURL,
		Status: StatusCloning,
		Logs:   []string{fmt.Sprintf("accepted deploy %q from %s (ref %s)", req.Name, req.RepoURL, req.Ref)},
	}
	d.jobs[job.ID] = job
	d.mu.Unlock()

	go d.run(job.ID, req)
	cp := *job
	cp.Logs = append([]string(nil), job.Logs...)
	return &cp, nil
}

// Get returns a copy of the job, or false when unknown.
func (d *Deployer) Get(id string) (*Job, bool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	j, ok := d.jobs[id]
	if !ok {
		return nil, false
	}
	cp := *j
	cp.Logs = append([]string(nil), j.Logs...)
	return &cp, true
}

func (d *Deployer) setStatus(id, status string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if j, ok := d.jobs[id]; ok {
		j.Status = status
	}
}

func (d *Deployer) appendLog(id, line string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	j, ok := d.jobs[id]
	if !ok {
		return
	}
	j.Logs = append(j.Logs, line)
	if len(j.Logs) > maxLogLines {
		j.Logs = append([]string(nil), j.Logs[len(j.Logs)-maxLogLines:]...)
	}
}

func (d *Deployer) fail(id, step string, err error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	j, ok := d.jobs[id]
	if !ok {
		return
	}
	j.Status = StatusFailed
	j.FailingStep = step
	j.Logs = append(j.Logs, fmt.Sprintf("failed in %s: %v", step, err))
}

// run executes the pipeline: clone → detect → build → run.
func (d *Deployer) run(id string, req Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
	defer cancel()

	dst := filepath.Join(d.workDir, id)
	if err := os.MkdirAll(d.workDir, 0o755); err != nil {
		d.fail(id, StatusCloning, err)
		return
	}

	// 1. Clone.
	cloneCtx, cancelClone := context.WithTimeout(ctx, 3*time.Minute)
	commit, err := Clone(cloneCtx, req.RepoURL, req.Ref, dst)
	cancelClone()
	if err != nil {
		d.fail(id, StatusCloning, err)
		return
	}
	short := commit
	if len(short) > 7 {
		short = short[:7]
	}
	d.appendLog(id, fmt.Sprintf("cloned %s @ %s", req.RepoURL, short))

	// 2. Detect build type.
	bt, err := Detect(dst, req.BuildType)
	if err != nil {
		d.fail(id, StatusCloning, err)
		return
	}
	d.appendLog(id, fmt.Sprintf("detected %s (container port %d)", bt.name, bt.port))

	// 3. Build.
	d.setStatus(id, StatusBuilding)
	if err := d.buildImage(ctx, id, req.Name, short, dst, bt); err != nil {
		d.fail(id, StatusBuilding, err)
		return
	}

	// 4. Run.
	d.setStatus(id, StatusRunning)
	if err := d.runContainer(ctx, id, req.Name, short, bt); err != nil {
		d.fail(id, StatusRunning, err)
		return
	}
}

// buildImage writes a Dockerfile when the repo has none and runs docker build.
func (d *Deployer) buildImage(ctx context.Context, id, name, short, dst string, bt buildType) error {
	tag := fmt.Sprintf("implode/%s:%s", name, short)

	dockerfile := filepath.Join(dst, "Dockerfile")
	if _, err := os.Stat(dockerfile); os.IsNotExist(err) {
		if err := os.WriteFile(dockerfile, []byte(bt.template), 0o644); err != nil {
			return err
		}
		d.appendLog(id, "generated Dockerfile from "+bt.name+" template")
	} else {
		d.appendLog(id, "using repository Dockerfile")
	}

	if _, err := exec.LookPath("docker"); err != nil {
		return fmt.Errorf("docker not available: %w", err)
	}

	buildCtx, cancel := context.WithTimeout(ctx, 12*time.Minute)
	defer cancel()
	cmd := exec.CommandContext(buildCtx, "docker", "build", "-t", tag, dst)
	d.appendLog(id, "docker build -t "+tag)
	return d.streamLogs(id, cmd)
}

// runContainer starts the built image on a free host port.
func (d *Deployer) runContainer(ctx context.Context, id, name, short string, bt buildType) error {
	if _, err := exec.LookPath("docker"); err != nil {
		return fmt.Errorf("docker not available: %w", err)
	}
	port, err := freePort()
	if err != nil {
		return err
	}
	tag := fmt.Sprintf("implode/%s:%s", name, short)
	cname := fmt.Sprintf("implode-%s", id)

	runCtx, cancel := context.WithTimeout(ctx, time.Minute)
	defer cancel()
	out, err := exec.CommandContext(runCtx, "docker", "run", "-d",
		"--name", cname,
		"-p", fmt.Sprintf("%d:%d", port, bt.port),
		tag,
	).CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %w", strings.TrimSpace(string(out)), err)
	}

	d.mu.Lock()
	if j, ok := d.jobs[id]; ok {
		j.ContainerID = strings.TrimSpace(string(out))
		j.HostPort = port
		j.Status = StatusLive
		j.Logs = append(j.Logs,
			fmt.Sprintf("container %s listening on host port %d", cname, port),
			fmt.Sprintf("application live at http://localhost:%d", port),
		)
	}
	d.mu.Unlock()
	return nil
}

// streamLogs runs cmd and appends each output line to the job log.
func (d *Deployer) streamLogs(id string, cmd *exec.Cmd) error {
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	cmd.Stderr = cmd.Stdout
	if err := cmd.Start(); err != nil {
		return err
	}
	sc := bufio.NewScanner(stdout)
	sc.Buffer(make([]byte, 64*1024), 1024*1024)
	for sc.Scan() {
		d.appendLog(id, sc.Text())
	}
	if err := sc.Err(); err != nil {
		return err
	}
	return cmd.Wait()
}

// Clone shallow-clones url@ref into dst and returns the HEAD commit SHA.
func Clone(ctx context.Context, url, ref, dst string) (commit string, err error) {
	args := []string{"clone", "--depth", "1", "--quiet"}
	if ref != "" {
		args = append(args, "--branch", ref)
	}
	args = append(args, url, dst)

	if out, err := exec.CommandContext(ctx, "git", args...).CombinedOutput(); err != nil {
		return "", fmt.Errorf("clone: %s: %w", strings.TrimSpace(string(out)), err)
	}
	out, err := exec.CommandContext(ctx, "git", "-C", dst, "rev-parse", "HEAD").Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

// buildType describes a detectable stack.
type buildType struct {
	name     string
	files    []string // match if ANY exists (basenames)
	suffixes []string // match if ANY file ends with these (e.g. .csproj)
	port     int      // container port the app listens on
	template string
}

var known = []buildType{
	{"dotnet", []string{"global.json"}, []string{".csproj", ".sln"}, 8080, dotnetDockerfile},
	{"go", []string{"go.mod"}, nil, 8080, goDockerfile},
	{"node", []string{"package.json"}, nil, 80, nodeDockerfile},
	{"python", []string{"requirements.txt", "pyproject.toml"}, nil, 8000, pythonDockerfile},
	{"rust", []string{"Cargo.toml"}, nil, 8080, rustDockerfile},
}

func knownType(name string) bool {
	for _, b := range known {
		if b.name == name {
			return true
		}
	}
	return false
}

func knownNames() string {
	names := make([]string, 0, len(known))
	for _, b := range known {
		names = append(names, b.name)
	}
	return strings.Join(names, ", ")
}

// Detect identifies the stack from workspace contents, or honors override.
func Detect(root, override string) (buildType, error) {
	if override != "" {
		for _, b := range known {
			if b.name == override {
				return b, nil
			}
		}
		return buildType{}, fmt.Errorf("%w %q", ErrUnknownBuildType, override)
	}

	found := make(map[string]bool)
	var suffixHit []string
	err := filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // tolerate unreadable entries during detection
		}
		if info.IsDir() && info.Name() == ".git" {
			return filepath.SkipDir
		}
		if info.IsDir() {
			return nil
		}
		found[info.Name()] = true
		for _, s := range []string{".csproj", ".sln"} {
			if strings.HasSuffix(info.Name(), s) {
				suffixHit = append(suffixHit, s)
			}
		}
		return nil
	})
	if err != nil {
		return buildType{}, err
	}

	for _, b := range known {
		for _, f := range b.files {
			if found[f] {
				return b, nil
			}
		}
		for _, s := range b.suffixes {
			for _, hit := range suffixHit {
				if hit == s {
					return b, nil
				}
			}
		}
	}
	return buildType{}, fmt.Errorf("no recognizable project found (looked for %s)", knownNames())
}

func freePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func newID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b[:])
}
