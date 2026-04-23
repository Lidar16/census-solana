# Census 🌍

**Real-time global map and speed-tracker for Solana's fastest and most decentralized RPC nodes.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF.svg)](https://solana.com)
[![Powered by Claude](https://img.shields.io/badge/AI-Claude%20claude-sonnet-4-20250514-orange.svg)](https://anthropic.com)

---

## What is Census?

Census is an open-source intelligence layer for the Solana network. It continuously benchmarks RPC nodes from 6 global probe regions and surfaces the results as a live, interactive globe visualization — helping developers find the fastest and most decentralized node for their location.

No more guessing. No more trusting vendor benchmarks. Just live data.

---

## Features

- 🌐 **Live Globe** — Animated world map showing all indexed Solana RPC nodes as live signals
- ⚡ **Real-Time Latency** — Median / p95 / p99 latency from 6 global probe regions, updated every 30s
- 🔒 **Decentralization Index** — Proprietary score weighing operator independence, geographic distribution, and stake concentration
- 🤖 **AI Network Advisor** — Claude-powered agent that monitors anomalies, writes health briefings, and answers "which node should I use?" in plain English
- 📡 **WebSocket Feed** — Subscribe to live latency updates for any node
- 🗂️ **Open Registry** — Community-contributed node list — add your node via GitHub PR
- 📦 **Developer SDK** — `npm install @census/solana` — drop-in node selection with automatic regional routing

---

## Quick Start

### Use the Dashboard
Visit [census.so](https://census.so) — no sign-up required.

### Use the SDK

```bash
npm install @census/solana
```

```typescript
import { getBestNode } from '@census/solana';

// Get the fastest node from your region
const node = await getBestNode({ region: 'AF', minDecentralScore: 50 });
console.log(node.url); // e.g. "https://fast-lagos-node.example.com"

// Or ask in natural language
const advisor = new CensusAgent();
const answer = await advisor.ask("Which Solana node is fastest from West Africa right now?");
console.log(answer);
```

### Run Locally

```bash
git clone https://github.com/[your-handle]/census-solana
cd census-solana

# Install dependencies
pnpm install

# Start the aggregation API (requires Cloudflare Wrangler)
cd packages/aggregation-api && wrangler dev

# Start the frontend
cd apps/web && pnpm dev
```

---

## Architecture

```
Community Registry (nodes.json on GitHub)
         │
         ▼
Probe Workers × 6 Regions (Cloudflare Edge Workers)
   NA / EU / APAC / Africa / LATAM / Middle East
         │ POST latency readings every 30s
         ▼
Aggregation API (Hono.js on Cloudflare Workers)
   ├── Cloudflare D1 (time-series history, 7d retention)
   └── Cloudflare KV (latest snapshots, sub-ms reads)
         │
    REST + WebSocket
         │
   Next.js Frontend
   ├── Three.js Globe
   ├── Node Table + Filters
   └── AI Chat (Census Agent)
         │
   Claude claude-sonnet-4-20250514 (Agentic Layer)
   ├── Anomaly detection
   ├── 24h health briefings
   └── Natural language node advisor
```

---

## Decentralization Index

Each node is scored 0–100:

| Component | Weight | Description |
|---|---|---|
| Operator Independence | 40 pts | Independent operators score higher than major providers |
| Geographic Diversity | 30 pts | Nodes in underrepresented regions (Africa, LATAM, ME) score higher |
| Stake Distribution | 30 pts | Nodes not linked to top-10 validators by stake score higher |

---

## Adding a Node to the Registry

Submit a PR to `packages/registry/nodes.json`:

```json
{
  "id": "your-node-id",
  "name": "Your Node Name",
  "url": "https://your-rpc-endpoint.com",
  "operator": "Your Name / Org",
  "country": "NG",
  "region": "AF",
  "lat": 6.5244,
  "lon": 3.3792,
  "is_public": true
}
```

See `packages/registry/CONTRIBUTING.md` for validation steps.

---

## Roadmap

- [x] Architecture & grant application
- [ ] Probe worker network (6 regions)
- [ ] Aggregation API + D1 schema
- [ ] Community node registry
- [ ] Frontend dashboard + globe
- [ ] Decentralization Index v1
- [ ] Claude agentic monitor
- [ ] Public beta
- [ ] SDK (`@census/solana`)

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — free to use, fork, and deploy.

---

*Built in Lagos for the builders who live outside the latency sweet spot.*
