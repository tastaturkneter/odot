# odot Deployment Guide

## Prerequisites

- Docker installed on your build machine (only for local builds)
- Docker (or Portainer) on your server
- A GitHub account with push access to the repository

## Versioning

The project uses [Semantic Versioning](https://semver.org/). The version in `package.json` is the single source of truth. The build version displayed in Settings includes both the version number and a build timestamp (e.g. `v1.0.0 (2026-02-15 14:30)`).

## Release Workflow (Recommended)

Releases are automated via GitHub Actions. Pushing a version tag triggers a Docker build and push to `ghcr.io`.

```bash
# 1. Make sure everything is committed
git status

# 2. Bump version (creates a commit + git tag automatically)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 3. Push commit + tag → GitHub Action builds & pushes Docker image
git push && git push --tags
```

The GitHub Action (`.github/workflows/docker.yml`) will:
1. Build the Docker image
2. Push it as `ghcr.io/tastaturkneter/odot:<version>` and `ghcr.io/tastaturkneter/odot:latest`

You can follow the build at https://github.com/tastaturkneter/odot/actions.

## Manual Docker Build (Optional)

If you need to build locally instead of using GitHub Actions:

```bash
# Build with version tags
npm run docker:build

# Push to registry
npm run docker:push
```

Build for linux/amd64 (required when building on Apple Silicon for an x86 server):

```bash
docker build --platform linux/amd64 \
  -t ghcr.io/tastaturkneter/odot:latest .
```

## Deploying with Docker Compose

The `docker-compose.yml` runs two services:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `odot` | `ghcr.io/tastaturkneter/odot:latest` | 3000 | Web app (nginx) |
| `relay` | `evoluhq/relay:latest` | 4000 | Evolu sync server |

### Quick Start

```bash
docker compose up -d
```

The app is available at `http://localhost:3000`.

### Deploying with Portainer

1. Go to **Stacks** > **Add stack**
2. Paste the contents of `docker-compose.yml`
3. Adjust the `SYNC_URL` environment variable to match your setup
4. Click **Deploy the stack**

## Configuration

### Sync URL

The `SYNC_URL` environment variable controls which sync server the app connects to. This is set at **container startup** (no rebuild needed).

```yaml
environment:
  SYNC_URL: "ws://localhost:4000"
```

| Scenario | Value |
|----------|-------|
| Local development | `ws://localhost:4000` |
| Server without SSL | `ws://your-server-ip:4000` |
| Production with SSL | `wss://sync.yourdomain.com` |

When `SYNC_URL` is not set, the app falls back to `wss://free.evoluhq.com` (Evolu's public relay).

Users can also override the sync URL in the app settings (stored in localStorage).

### Ports

Change the host ports in `docker-compose.yml` as needed:

```yaml
ports:
  - "8080:80"   # app on port 8080 instead of 3000
```

```yaml
ports:
  - "4001:4000" # relay on port 4001 instead of 4000
```

## Production Setup with Reverse Proxy

For production, place a reverse proxy (Caddy, Traefik, nginx) in front of both services to handle SSL.

Example with Caddy:

```
app.yourdomain.com {
    reverse_proxy odot:80
}

sync.yourdomain.com {
    reverse_proxy relay:4000
}
```

Then set:

```yaml
environment:
  SYNC_URL: "wss://sync.yourdomain.com"
```

## Updating

```bash
# On the server (or via Portainer "Pull and redeploy")
docker compose pull && docker compose up -d
```

## Local Development (without Docker)

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. By default it syncs to `wss://free.evoluhq.com` unless overridden in the app settings.
