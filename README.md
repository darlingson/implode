# Implode

A self-hosted, one-click deployment platform for .NET applications. Powered by Go.

## Overview

Implode is a lightweight, self-hosted deployment platform for .NET applications.

Paste a Git repository URL, configure your environment variables, select the project path if necessary, and deploy.

Implode handles the deployment process from source code to a running container:

```text
Repository
    │
    ▼
   Clone
    │
    ▼
 Detect .NET
    │
    ▼
 Generate Docker configuration
    │
    ▼
 Build image
    │
    ▼
 Run container
    │
    ▼
 Application running
```

The goal is simple:

> **Give me a .NET repository and get the application running.**

## Features

### One-Click Deployment

Deploy a .NET application from a Git repository through a simple web interface.

### Repository Integration

Provide a Git repository URL and Implode clones the project into an isolated workspace before deployment.

### Automatic .NET Detection

Implode analyzes the repository to determine the project's .NET configuration, including:

* .NET SDK version
* Project files
* Solution structure
* Application entry point
* Project location

### Subfolder Support

.NET projects do not have to live at the repository root.

For example:

```text
my-repository/
├── README.md
├── src/
│   └── MyApplication/
│       └── MyApplication.csproj
└── tests/
```

Implode can be configured to deploy from:

```text
src/MyApplication
```

### Environment Variables

Configure runtime environment variables before deploying the application.

### Automatic Containerization

Implode generates the Docker configuration required to build and run the application without requiring the repository to contain a Dockerfile.

### Build & Run

Implode builds the application into a Docker image and starts the resulting container.

### Deployment Logs

Deployment output can be viewed while the deployment is running, making it possible to see exactly where a deployment succeeds or fails.

## Deployment Model

Each deployment follows a predictable pipeline:

1. Clone the repository
2. Determine the project location
3. Detect the .NET configuration
4. Generate the required Docker configuration
5. Build the Docker image
6. Start the application container
7. Report deployment status
8. Stream logs to the UI

The deployment engine, rather than the generated Docker configuration, is responsible for controlling this process.

## Tech Stack

| Component           | Technology          |
| ------------------- | ------------------- |
| Platform Backend    | Go                  |
| Target Applications | .NET / ASP.NET Core |
| Containerization    | Docker              |
| Source Control      | Git                 |
| Frontend            | Web UI              |
| Deployment Host     | Self-hosted         |

## Getting Started

### Prerequisites

* Go 1.21+
* Docker
* Docker Compose

### Installation

Clone the repository:

```bash
git clone https://github.com/darlingson/implode.git
cd implode
```

Build the application:

```bash
go build -o deploy-ui ./cmd/server
```

Run the server:

```bash
./deploy-ui
```

The UI will be available at:

```text
http://localhost:8080
```

### Docker

Implode can also run inside a Docker container:

```bash
docker build -t implode .
```

```bash
docker run \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  implode
```

The Docker socket is required because Implode uses Docker on the host to build and run deployed applications.

> **Security note:** Access to the Docker socket effectively provides control over the Docker host. Implode should therefore only be exposed to trusted users and should be deployed with appropriate host-level security.

## Usage

### 1. Open Implode

Navigate to:

```text
http://localhost:8080
```

### 2. Add a Repository

Paste the URL of the Git repository containing the .NET application.

### 3. Configure the Project Path

If the project is not located at the repository root, provide its relative path.

Example:

```text
src/MyApplication
```

### 4. Configure Environment Variables

Add the environment variables required by the application.

Example:

```text
ASPNETCORE_ENVIRONMENT=Production
DATABASE_URL=...
```

### 5. Deploy

Click **Deploy**.

Implode will clone the repository, inspect the project, generate the required container configuration, build the image, and start the application.

## Configuration

| Environment Variable | Description                               | Default       |
| -------------------- | ----------------------------------------- | ------------- |
| `PORT`               | Port the Implode server listens on        | `8080`        |
| `WORK_DIR`           | Directory used for deployment workspaces  | `./workspace` |
| `DOCKER_REGISTRY`    | Optional registry prefix for built images | None          |

## Project Structure

```text
.
├── cmd/
│   └── server/             # Application entrypoint
│
├── internal/
│   ├── detector/           # .NET project detection
│   ├── builder/             # Docker configuration generation
│   └── deployer/            # Docker build and container lifecycle
│
├── web/                    # Web UI
│
├── Dockerfile
└── docker-compose.yml
```

The project structure may evolve as the deployment engine grows.

## Roadmap

### Core Deployment

* [ ] Clone public Git repositories
* [ ] Detect .NET projects
* [ ] Detect .NET SDK/runtime version
* [ ] Support projects in subdirectories
* [ ] Generate Dockerfiles
* [ ] Build Docker images
* [ ] Start application containers
* [ ] Display deployment logs
* [ ] Display application logs

### Platform

* [ ] Deployment status tracking
* [ ] Deployment history
* [ ] Redeploy
* [ ] Stop/restart applications
* [ ] Environment variable management
* [ ] Application health checks
* [ ] Application routing
* [ ] Generated application URLs

### Repository Support

* [ ] Private repositories
* [ ] Personal access tokens
* [ ] SSH authentication
* [ ] Git webhooks
* [ ] Automatic deployments

### Future

* [ ] Deployment rollback
* [ ] Multiple deployment targets
* [ ] Custom domains
* [ ] HTTPS
* [ ] Build caching
* [ ] Multi-project solution support
* [ ] Kubernetes support

## Design Goals

Implode is intentionally focused.

It is not trying to be a hosted cloud platform.

The goal is to provide the convenience of a modern deployment platform while keeping the infrastructure under the user's control.

```text
Simple UI
    +
Automatic detection
    +
Docker isolation
    +
Self-hosted infrastructure
```

## Status

🚧 **Early development**

The initial implementation is focused on the core deployment pipeline:

```text
Git → Detect → Build → Docker → Run
```

## License

MIT

---

**Self-hosted. Simple. Deploy .NET.**
