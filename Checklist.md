# Implode — Work Checklist

A flat, tick-as-you-go list of every concrete task across all phases. Work through them in order — each phase builds on the last.

---

### Phase 1 — Foundation
- [ ] Scaffold `cmd/server` entrypoint (main.go, graceful shutdown)
- [ ] Load config from env vars (`PORT`, `WORK_DIR`, `DOCKER_REGISTRY`)
- [ ] Implement `/healthz` endpoint
- [ ] Add structured request/error logging
- [ ] Implement workspace allocation (UUID-named dirs under `WORK_DIR`)
- [ ] Implement workspace cleanup on failure
- [ ] Implement `git clone` with URL validation and timeout
- [ ] Check Docker socket accessibility on startup, fail fast if unavailable
- [ ] Wire up hardcoded smoke pipeline (clone → build → run one known repo)

### Phase 2 — .NET Detection
- [ ] Walk workspace for `.csproj` files
- [ ] Handle zero-found and multiple-found cases with clear errors
- [ ] Respect optional subfolder path when searching for projects
- [ ] Parse `TargetFramework` from `.csproj`
- [ ] Parse `global.json` for pinned SDK version
- [ ] Fall back to latest LTS SDK when version is undetectable
- [ ] Classify application type (`Sdk.Web`, `OutputType=Exe`)
- [ ] Detect exposed port from application type
- [ ] Define and return `DetectionResult` struct

### Phase 3 — Container Generation
- [ ] Write multi-stage Dockerfile template for ASP.NET Core
- [ ] Write single-stage Dockerfile template for console/worker apps
- [ ] Select correct template from `DetectionResult`
- [ ] Inject `EXPOSE` and `ASPNETCORE_URLS` for web apps
- [ ] Support `ENV` directives for environment variables
- [ ] Support `-e` flag passthrough for runtime env vars
- [ ] Implement image tag generation (`implode/<repo-slug>:<short-sha>`)
- [ ] Apply optional `DOCKER_REGISTRY` prefix to image tag

### Phase 4 — Deployment Engine
- [ ] Run `docker build` and capture output line by line
- [ ] Run `docker run -d` and store container ID
- [ ] Allocate a free host port automatically
- [ ] Implement SSE or WebSocket log streaming endpoint (`GET /deployments/:id/logs`)
- [ ] Implement deployment state machine (pending → cloning → detecting → building → running → succeeded/failed)
- [ ] Persist state transitions to SQLite (`deployments` table)
- [ ] Persist log lines to SQLite (`deployment_logs` table)
- [ ] Record failing stage and last log lines on failure
- [ ] Add concurrency guard (reject/queue duplicate repo deployments)

### Phase 5 — Web UI
- [ ] Build deploy form (repo URL, subfolder, env vars editor)
- [ ] Add client-side validation to deploy form
- [ ] Build deployment status view with live log panel (SSE/WS consumer)
- [ ] Show status badge reflecting current pipeline stage
- [ ] Build deployment history list (paginated)
- [ ] Link history rows to deployment detail view
- [ ] Display application URL when container is running
- [ ] Add one-click copy for application URL
- [ ] Show failing stage and last log lines on error

### Phase 6 — Hardening & Operations
- [ ] Stop container from UI (`POST /deployments/:id/stop`)
- [ ] Restart container from UI (`POST /deployments/:id/restart`)
- [ ] Redeploy: pull latest, rebuild, replace container
- [ ] Remove old containers and images on redeploy
- [ ] Add configurable workspace retention/cleanup
- [ ] Probe container HTTP port and expose health status
- [ ] Show health status in deployment list
- [ ] Write `docker-compose.yml` for running Implode itself
- [ ] Write quickstart README section (Docker + bare-metal)
- [ ] Write example `.env` file documenting all config vars

### Phase 7 — Repository & Auth
- [ ] Support personal access tokens for GitHub, GitLab, Bitbucket
- [ ] Support SSH key authentication for Git cloning
- [ ] Store credentials encrypted at rest
- [ ] Implement Git webhook receiver
- [ ] Trigger auto-deployment on push event
- [ ] Add branch selection to deploy form

### Phase 8 — Routing & Networking
- [ ] Integrate reverse proxy (Caddy or Traefik)
- [ ] Generate per-deployment subdomain
- [ ] Support custom domain configuration
- [ ] Configure automatic HTTPS via Let's Encrypt

### Phase 9 — Advanced Builds
- [ ] Enable Docker layer caching between deployments
- [ ] Detect and deploy a single project from a `.sln` file
- [ ] Support build argument passthrough
- [ ] Support pre-build and post-build hook scripts

### Phase 10 — Future / Stretch
- [ ] Deployment rollback to any previous image
- [ ] Deploy to remote Docker hosts
- [ ] Kubernetes manifest generation and deployment
- [ ] Per-container resource usage dashboard (CPU, memory)
- [ ] Team access and per-deployment permissions
- [ ] CLI client (`implode deploy <repo>`)
