import http from 'node:http';
import net from 'node:net';

const PORT = Number(process.env.PORT ?? 8787);
const CHECK_INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS ?? 15000);

export const targets = [
  { id: 'survival', name: 'Survival', host: process.env.SURVIVAL_HOST ?? '127.0.0.1', port: Number(process.env.SURVIVAL_PORT ?? 25565) },
  { id: 'proxy', name: 'Proxy', host: process.env.PROXY_HOST ?? '127.0.0.1', port: Number(process.env.PROXY_PORT ?? 25577) }
];

const state = new Map(targets.map(target => [target.id, {
  ...target,
  online: false,
  latencyMs: null,
  checkedAt: null,
  checks: 0,
  successfulChecks: 0,
  history: []
}]));

export function checkTcp(target, timeoutMs = 2500) {
  return new Promise(resolve => {
    const started = performance.now();
    const socket = net.createConnection({ host: target.host, port: target.port });
    let settled = false;

    const finish = online => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        online,
        latencyMs: online ? Math.max(1, Math.round(performance.now() - started)) : null,
        checkedAt: new Date().toISOString()
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

export async function runChecks() {
  await Promise.all(targets.map(async target => {
    const result = await checkTcp(target);
    const current = state.get(target.id);
    current.checks += 1;
    if (result.online) current.successfulChecks += 1;
    current.online = result.online;
    current.latencyMs = result.latencyMs;
    current.checkedAt = result.checkedAt;
    current.history.push({ online: result.online, latencyMs: result.latencyMs, at: result.checkedAt });
    current.history = current.history.slice(-60);
  }));
}

export function snapshot() {
  return [...state.values()].map(item => ({
    ...item,
    uptimePercent: item.checks ? Number(((item.successfulChecks / item.checks) * 100).toFixed(2)) : 0
  }));
}

function dashboardHtml() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Server Status Hub</title>
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#08090b;color:#f4f4f5}body{margin:0;min-height:100vh;background:radial-gradient(circle at top right,#281217 0,transparent 34%),#08090b}.wrap{max-width:1050px;margin:auto;padding:52px 22px}.eyebrow{color:#a1a1aa;letter-spacing:.16em;text-transform:uppercase;font-size:.75rem}h1{font-size:clamp(2.2rem,7vw,5rem);margin:.3rem 0 1rem;letter-spacing:-.05em}.sub{color:#a1a1aa;max-width:650px;line-height:1.7}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:34px}.card{background:#111317;border:1px solid #27272a;border-radius:18px;padding:20px;box-shadow:0 18px 60px #0007}.top{display:flex;justify-content:space-between;align-items:center}.dot{width:10px;height:10px;border-radius:50%}.on{background:#22c55e;box-shadow:0 0 16px #22c55e}.off{background:#7f1d1d;box-shadow:0 0 16px #7f1d1d}.metric{font-size:1.7rem;font-weight:700;margin-top:18px}.muted{color:#71717a;font-size:.85rem}button{margin-top:24px;background:#7a1f1f;color:white;border:0;padding:12px 16px;border-radius:10px;cursor:pointer}</style></head>
<body><main class="wrap"><div class="eyebrow">YukiShinobi / live infrastructure</div><h1>Server Status Hub</h1><p class="sub">A lightweight monitor I can point at game servers, proxies or any TCP service. It tracks availability, latency and a rolling uptime window without needing a heavy monitoring stack.</p><div id="grid" class="grid"></div><button onclick="load()">Refresh now</button></main>
<script>
async function load(){var data=await fetch('/api/status').then(function(r){return r.json()});document.getElementById('grid').innerHTML=data.map(function(s){return '<section class="card"><div class="top"><strong>'+s.name+'</strong><span class="dot '+(s.online?'on':'off')+'"></span></div><div class="metric">'+(s.online?'ONLINE':'OFFLINE')+'</div><p>'+(s.latencyMs==null?'—':s.latencyMs)+' ms latency</p><p>'+s.uptimePercent+'% observed uptime</p><div class="muted">'+s.host+':'+s.port+'<br>'+(s.checkedAt||'waiting for first check')+'</div></section>'}).join('')}
load();setInterval(load,15000);
</script></body></html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(JSON.stringify(snapshot()));
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, targets: targets.length }));
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(dashboardHtml());
});

if (process.env.NODE_ENV !== 'test') {
  await runChecks();
  setInterval(runChecks, CHECK_INTERVAL_MS).unref();
  server.listen(PORT, () => console.log(`Server Status Hub listening on http://localhost:${PORT}`));
}
