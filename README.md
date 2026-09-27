# Server Status Hub

A lightweight game-server monitor I built around Node's native networking APIs. It checks TCP reachability, measures latency, keeps a rolling history and serves both a JSON status API and a dark browser dashboard.

## What it shows

- online/offline state
- TCP latency
- observed uptime percentage
- rolling check history
- multiple configured targets
- `/api/status` JSON endpoint
- `/health` endpoint
- responsive dashboard

I wanted this to feel useful for the kind of Minecraft/VPS work I already do without pulling in a full monitoring stack just to answer "is the service alive and how bad is the latency?"

## Run it

```bash
npm start
```

Optional environment variables:

```env
PORT=8787
CHECK_INTERVAL_MS=15000
SURVIVAL_HOST=play.example.com
SURVIVAL_PORT=25565
PROXY_HOST=proxy.example.com
PROXY_PORT=25577
```

Requires Node 20+ and no runtime dependencies.

## Architecture

```text
configured targets
      ↓
Node TCP probes
      ↓
rolling in-memory state
   ↙        ↘
JSON API   browser dashboard
```

This is intentionally small enough to understand in one sitting, but structured so persistent history, alerts, Minecraft protocol status, Prometheus metrics or Discord notifications can be added later.
