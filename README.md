<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=200&text=SERVER%20STATUS%20HUB&fontAlignY=38&desc=UPTIME%20%E2%80%A2%20LATENCY%20%E2%80%A2%20TCP%20HEALTH&descAlignY=58&color=0:050505,55:202020,100:5a1616&fontColor=f5f5f5&descColor=d4d4d4" width="100%" />

![Node](https://img.shields.io/badge/Node.js-20%2B-111111?style=for-the-badge&logo=nodedotjs)
![Network](https://img.shields.io/badge/network-TCP%20probes-2b2b2b?style=for-the-badge)
![Status](https://img.shields.io/badge/status-live%20monitor-7a1f1f?style=for-the-badge)

**A lightweight game-server monitor for the kind of VPS and Minecraft infrastructure I already work with.**

</div>

---

## What it tracks

- online / offline state
- TCP latency
- observed uptime percentage
- rolling check history
- multiple configured targets
- `/api/status` JSON endpoint
- `/health` endpoint
- responsive browser dashboard

## Architecture

```txt
configured services
       ↓
Node TCP probes
       ↓
rolling in-memory state
    ↙         ↘
 JSON API   dashboard
```

## Run

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

Requires Node 20+. No runtime dependencies.

## Why I built it

Sometimes I do not need a full monitoring stack. I just need to know whether a game service is alive, whether latency is getting ugly, and how reliable it has been across the recent check window.

## Next

`persistent history` · `Discord alerts` · `Minecraft protocol status` · `Prometheus metrics` · `incident timeline`

---

<div align="center"><sub>YukiShinobi // visibility before guesswork.</sub></div>
