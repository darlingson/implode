 # Implode

A self-hosted, one-click deployment interface for .NET applications. Powered by Go.

## Overview

Implode UI is a lightweight, self-hosted web application that automates the deployment of .NET projects. Simply paste a repository link, configure environment variables, and let the platform handle the rest — from platform detection to containerized deployment.

## Features

- **One-Click Deploy** — Deploy .NET applications with a single click from a clean web interface
- **Repo Link Integration** — Add any Git repository link to begin the deployment process
- **Environment Variables** — Configure and manage environment variables directly in the UI before deployment
- **Subfolder Support** — If your .NET project lives in a subfolder, simply provide the relative path and the tool handles the rest
- **Auto-Detection** — Automatically detects:
  - .NET SDK version
  - C# language version
  - Project structure and entry points
- **Auto-Generated Containers** — Creates optimized `Dockerfile` and `docker-compose.yml` files tailored to your specific .NET version and project configuration
- **Build & Run** — Automatically builds the Docker image and starts the compose stack

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Go |
| Target Platform | .NET (all versions) |
| Containerization | Docker & Docker Compose |

## Getting Started

### Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

```bash
# Clone the repository
git clone https://github.com/darlingson/implode.git
cd implode

# Build the Go application
go build -o deploy-ui ./cmd/server

# Run the server
./deploy-ui
```

The UI will be available at `http://localhost:8080`.

### Docker (Self-Hosted)

```bash
docker build -t implode .
docker run -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock implode
```

> **Note:** Mounting the Docker socket is required so the UI can build and run containers on your host.

## Usage

1. **Open the UI** — Navigate to `http://localhost:8080`
2. **Add Repository** — Paste your .NET project repository URL
3. **Set Project Path** *(Optional)* — If your `.csproj` or `.sln` is not at the repository root, enter the relative folder path
4. **Configure Environment Variables** — Add any `appsettings.json` overrides or runtime environment variables
5. **Deploy** — The platform will:
   - Clone the repository
   - Detect your .NET and C# versions
   - Generate an optimized `Dockerfile` and `docker-compose.yml`
   - Build and start your application

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `PORT` | Port the UI server listens on | `8080` |
| `WORK_DIR` | Directory for cloning and building projects | `./workspace` |
| `DOCKER_REGISTRY` | Optional registry prefix for built images | *(none)* |

## Project Structure

```
.
├── cmd/server          # Go application entrypoint
├── internal/
│   ├── detector        # .NET / C# version detection
│   ├── builder         # Dockerfile & compose generator
│   └── deployer        # Docker build and compose runner
├── web/                # Static UI assets
├── Dockerfile
└── docker-compose.yml
```

## Roadmap

- [ ] Support for private repositories (SSH keys / PAT)
- [ ] Multi-project solution detection
- [ ] Pre-deployment health checks
- [ ] Deployment history and rollback
- [ ] Kubernetes manifest generation

---

**Self-hosted. Simple. Deploy .NET in seconds.**
