# Implode — Feature List

A phased breakdown of everything needed to get from zero to a fully working self-hosted .NET deployment platform.

---

## Phase 1 — Foundation

The goal of this phase is a running Go server that can prove the full pipeline works end-to-end against a known test repository.

### HTTP Server
- `cmd/server` entrypoint with graceful startup/shutdown
- Config via environment variables (`PORT`, `WORK_DIR`, `DOCKER_REGISTRY`)
- `/healthz` liveness endpoint
- Structured logging (request logs, error logs)

### Workspace Management
- Allocate an isolated directory per deployment (UUID-based)
- Clean up workspace on failure
- Configurable base directory via `WORK_DIR`

### Repository Cloning
- Clone public Git repositories via `git clone`
- URL validation with clear, user-facing error messages
- Timeout and error capture on clone failure

### Docker Proof-of-Life
- Verify Docker socket is accessible on startup
- Fail fast with a clear message if Docker is unavailable

### Hardcoded Smoke Pipeline
- Clone → build → run against one known test repository
- Validates the full pipeline before any dynamic detection logic is added

---

## Phase 2 — .NET Detection

Automatically determine how to build and run the project from repository contents alone — no user configuration required beyond an optional project path.

### Project Discovery
- Walk the workspace for `.csproj` files
- Single project found → use it
- Zero or multiple projects found → surface a clear error (multiple projects require a subfolder hint)
- Respect the optional subfolder path provided by the user

### SDK Version Detection
- Parse `TargetFramework` from the `.csproj` (e.g. `net8.0`, `net9.0`)
- Support `global.json` to honour pinned SDK versions
- Fall back to latest LTS if no version can be determined

### Entry Point Classification
- Detect application type: `Sdk.Web` (ASP.NET Core), `OutputType=Exe` (console/worker)
- Check for `Program.cs` as a secondary signal
- Determine the correct exposed port (`5000`/`8080` for web apps, none for workers)

### Detection Result Contract
- `DetectionResult` struct: `projectPath`, `sdkVersion`, `framework`, `isWeb`, `port`
- Returned by the detector and consumed by the container generator

---

## Phase 3 — Container Generation

Turn the detection result into a working Docker configuration without requiring a `Dockerfile` in the repository.

### Dockerfile Templates
- Multi-stage `Dockerfile` for ASP.NET Core web applications
- Single-stage `Dockerfile` for console and worker applications
- Written to a temp location; never committed to the repository

### Port Handling
- `EXPOSE` the correct container port based on the detected application type
- Pass `ASPNETCORE_URLS` for ASP.NET Core apps

### Environment Variable Injection
- Support `ENV` directives in the generated `Dockerfile`
- Pass runtime env vars via `-e` flags at container start

### Image Naming
- Tag format: `implode/<repo-slug>:<short-sha>`
- Optional `DOCKER_REGISTRY` prefix for pushing to a registry

---

## Phase 4 — Deployment Engine

Orchestrate the full deployment lifecycle, persist state, and stream output back to the caller.

### Build Step
- Run `docker build` with full output captured per line
- Surface build errors with the failing stage identified

### Run Step
- Start the container in detached mode (`docker run -d`)
- Store the container ID against the deployment record
- Allocate a free host port automatically

### Log Streaming
- Real-time log streaming via SSE or WebSocket endpoint
- Per-deployment log endpoint: `GET /deployments/:id/logs`
- Build logs and runtime logs served from the same endpoint, in order

### Deployment State Machine
```
pending → cloning → detecting → building → running → succeeded
                                                    ↘ failed
```
- Each stage transition is persisted to the database
- Failure records which stage failed and the last captured log lines

### SQLite Persistence
- `deployments` table: `id`, `repo_url`, `subfolder`, `status`, `container_id`, `host_port`, `image_tag`, `created_at`, `updated_at`
- `deployment_logs` table: `deployment_id`, `line`, `stream` (build/runtime), `timestamp`

### Concurrency Safety
- Prevent two deployments of the same repository from running simultaneously
- Queue or reject concurrent deployment requests

---

## Phase 5 — Web UI

A clean, minimal interface for deploying and monitoring applications.

### Deploy Form
- Repository URL input with validation
- Optional subfolder/project path input
- Key-value environment variable editor (add, edit, remove rows)
- Deploy button with loading state

### Deployment Status View
- Status badge reflecting the current pipeline stage
- Live log panel that streams output as the deployment progresses
- Clear error message when a deployment fails, showing the failing stage

### Deployment History
- Paginated list of all past and active deployments
- Columns: repository, status, deployed at, host port
- Click a row to navigate to the deployment detail view

### Application Access
- Display the application URL (`http://host:port`) once the container is running
- One-click copy of the URL

### Error UX
- Show the failing pipeline stage prominently
- Display the last N relevant log lines alongside the error

---

## Phase 6 — Hardening & Operations

Everything needed to run Implode reliably day-to-day.

### Container Lifecycle Controls
- Stop a running container from the UI
- Restart a stopped container without re-deploying
- Redeploy: pull latest commits, rebuild image, replace container

### Cleanup
- Remove old containers and images on redeploy
- Configurable retention policy for deployment workspaces

### Health & Observability
- Application-level health check endpoint per deployment (probe the container's HTTP port)
- Show health status in the deployment list
- Structured deployment event log for debugging

### Packaging & Distribution
- `docker-compose.yml` for running Implode itself
- `README` quickstart covering Docker and bare-metal setups
- Example `.env` file documenting all configuration variables

---

## Phase 7 — Repository & Auth

Expand beyond public repositories.

- Private repository support via personal access tokens (GitHub, GitLab, Bitbucket)
- SSH key authentication for Git cloning
- Secure credential storage (encrypted at rest)
- Git webhook receiver for automatic deployments on push
- Branch selection: deploy from any branch, not just the default

---

## Phase 8 — Routing & Networking

Make deployed applications accessible without manually managing ports.

- Reverse proxy integration (Caddy or Traefik) to route traffic to containers
- Generated subdomains per deployment (e.g. `myapp.implode.local`)
- Custom domain support
- Automatic HTTPS via Let's Encrypt

---

## Phase 9 — Advanced Builds

Performance and flexibility improvements for larger projects.

- Docker layer caching between deployments (reuse unchanged layers)
- Multi-project solution support (detect and deploy one project from a `.sln`)
- Build argument passthrough
- Pre-build and post-build hook scripts

---

## Phase 10 — Future / Stretch

Longer-horizon ideas, not yet scheduled.

- Deployment rollback to any previous image
- Multiple deployment targets (deploy to remote Docker hosts)
- Kubernetes manifest generation and deployment
- Dashboard with resource usage (CPU, memory per container)
- Team access and per-deployment permissions
- CLI client (`implode deploy <repo>`)

