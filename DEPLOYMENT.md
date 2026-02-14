# odot Deployment Guide

## Prerequisites

- Docker installed on your build machine
- Docker (or Portainer) on your server
- A GitHub account with a Personal Access Token (PAT) that has `write:packages` and `read:packages` scopes

## Building the Docker Image

Build for linux/amd64 (required when building on Apple Silicon for an x86 server):

```bash
docker build --platform linux/amd64 -t ghcr.io/effem/odot:latest .
```

If your server also runs ARM (e.g. Raspberry Pi, Oracle Cloud ARM), you can omit `--platform`:

```bash
docker build -t ghcr.io/effem/odot:latest .
```

## Publishing to GitHub Container Registry

Login to ghcr.io (use your PAT as password):

```bash
docker login ghcr.io -u effem
```

Push the image:

```bash
docker push ghcr.io/effem/odot:latest
```

Build and push in one step:

```bash
docker build --platform linux/amd64 -t ghcr.io/effem/odot:latest . && docker push ghcr.io/effem/odot:latest
```

Make sure the package visibility is set to **Public** on GitHub under your profile > Packages > odot > Package settings, otherwise pulls will require authentication.

## Deploying with Docker Compose

The `docker-compose.yml` runs two services:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `odot` | `ghcr.io/effem/odot:latest` | 3000 | Web app (nginx) |
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
# Pull latest code
git pull

# Rebuild and push
docker build --platform linux/amd64 -t ghcr.io/effem/odot:latest . && docker push ghcr.io/effem/odot:latest

# On the server (or via Portainer "Pull and redeploy")
docker compose pull && docker compose up -d
```

## Local Development (without Docker)

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. By default it syncs to `wss://free.evoluhq.com` unless overridden in the app settings.
