# Census — Superteam Agentic Engineering Grant Application

---

## Project Name
**Census**

## Tagline
*Real-time global map and speed-tracker for Solana's most decentralized and performant RPC nodes.*

---

## What Are You Building?

Census is a live, open-source intelligence layer for the Solana network — a real-time global map and latency tracker that helps developers, dApp builders, and infrastructure teams discover the **fastest** and **most decentralized** RPC nodes on Solana.

Developers currently choose RPC nodes based on anecdote, blog posts, or vendor marketing claims. There is no neutral, real-time, publicly accessible tool that measures node latency from multiple geographic vantage points, scores nodes by decentralization metrics, and presents this data in an intuitive global map interface.

Census changes that. It continuously pings a curated and community-contributed set of Solana RPC endpoints, aggregates latency data across global probe locations, scores nodes against decentralization heuristics (stake concentration, geographic distribution, operator independence), and surfaces this as a live-updating dashboard with a globe visualization.

---

## The Problem

Solana processed over 33 billion transactions in 2025, making the quality of RPC infrastructure directly tied to application performance and user experience. Yet the current selection process for RPC nodes is fundamentally broken:

- **No neutral benchmark exists.** Provider comparisons are either self-reported (biased) or from commercial tools like CompareNodes, which are behind paywalls and not open-source.
- **Centralization risk is invisible.** Many developers default to 2-3 major providers (Helius, Alchemy, QuickNode), concentrating reliance on centralized infrastructure — undermining the decentralization Solana promises.
- **Latency varies by geography.** A developer in Lagos, Nairobi, or Jakarta experiences dramatically different node performance than one in San Francisco, but has no tooling to find a better regional node.
- **No real-time, global view.** The ecosystem lacks a live "census" of what's actually running, where, and how fast.

---

## The Solution: Census

Census is three things in one:

### 1. Real-Time Latency Prober
A distributed probe network — initially deployed across 6 regions (NA, EU, APAC, Africa, LATAM, Middle East) — that continuously benchmarks Solana RPC nodes using `getSlot`, `getBlockHeight`, and `getLatestBlockhash` methods. Results are aggregated into median, p95, and p99 latency scores updated every 30 seconds.

### 2. Decentralization Scorer
Each node is scored against a Decentralization Index built from:
- **Operator Independence Score** — is the node operated by a known large provider or an independent?
- **Geographic Diversity Score** — node concentration by country/ASN
- **Stake Distribution Score** — validator-linked nodes are scored against Solana's Nakamoto coefficient contribution

### 3. Global Map Dashboard
A live globe visualization showing all indexed nodes as points of light, color-coded by latency tier and scaled by decentralization score. Developers can filter, sort, and export node lists optimized for their region and decentralization preference.

---

## Why Now?

- Solana's validator count exceeds 4,500 globally, including 3,100+ RPC nodes — enough signal to build a meaningful intelligence layer
- Post-Firedancer deployment, performance variance across node operators has widened, making node selection more impactful than ever
- Africa, Southeast Asia, and Latin America are growing Solana developer markets with the worst coverage in existing tooling — Census directly serves these emerging builders
- The ecosystem has no open-source equivalent of Ethernodes or ETH NodeWatch for Solana RPC

---

## Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Probe Workers | Node.js + `@solana/web3.js`, deployed via Cloudflare Workers (edge, global) |
| Data Aggregation | Hono.js API on Cloudflare Workers, time-series data in Cloudflare D1 + KV |
| Backend Indexer | TypeScript, cron-scheduled via Cloudflare Cron Triggers |
| Frontend | Next.js 14 (App Router), Three.js globe, Tailwind CSS |
| Node Registry | JSON-based community registry (GitHub), auto-submitted via PR |
| AI Agent Layer | Claude claude-sonnet-4-20250514 via Anthropic API — agentic node health analyst |

### AI Agentic Component
Census includes an **agentic node health monitor** powered by Claude. The agent:
- Monitors node performance trends over 24h windows
- Detects anomalies (sudden latency spikes, geographic clustering of failures)
- Generates plain-English "network health briefings" published to the dashboard
- Responds to natural language queries ("Which node is fastest from West Africa right now?")
- Proactively suggests optimal node configurations based on user's dApp type

This makes Census not just a dashboard but an **intelligent infrastructure advisor** — fulfilling the Agentic Engineering mandate of the grant.

---

## Milestones

| Week | Deliverable |
|---|---|
| 1–2 | Probe worker network live (6 regions), latency data pipeline, Cloudflare D1 schema |
| 3–4 | REST API + WebSocket live feed, community node registry (GitHub) |
| 5–6 | Frontend dashboard + globe visualization, latency filtering, node detail pages |
| 7 | Decentralization scoring system + Decentralization Index v1 |
| 8 | Claude agentic health monitor integration, natural language query interface |
| 9 | Public beta launch, Superteam community distribution, open-source release |
| 10 | Documentation, developer SDK (npm package `@census/solana`), feedback loop |

---

## Who Is Building This?

The project is being built by a developer based in Lagos, Nigeria — a first-hand witness to the infrastructure gap that African and emerging-market Solana builders face. Nigeria is one of the largest crypto-adopting countries in the world and has a fast-growing Solana developer community, yet finds itself underserved by existing RPC tooling designed for North American or European latency profiles.

Census is built to serve Lagos as much as San Francisco.

---

## Grant Ask

**Amount Requested:** $200 USDG (initial milestone sprint)

**Allocation:**
- Cloudflare Workers + D1 + KV infrastructure costs: $60
- Anthropic API credits (Claude agentic layer): $40
- Domain + hosting (census.so or similar): $20
- Developer time — 10 weeks part-time: In-kind
- Open-source tooling & dependencies: Free/OSS

---

## Why This Fits the Agentic Engineering Grant

Census embeds AI agency at its core, not as an afterthought. The Claude-powered monitoring agent:
- Takes autonomous action (anomaly detection, health briefings without human trigger)
- Uses tools (Anthropic tool use for querying the Census API, parsing node data)
- Reasons over time-series data and produces developer-readable insights
- Responds to natural language queries — making infrastructure intelligence accessible to non-expert builders

This is infrastructure tooling that thinks.

---

## Open Source Commitment

Census will be fully open-source under MIT license. All probe workers, the aggregation API, the node registry, and the frontend will be published to GitHub. The community node registry will accept PRs — anyone can add a node to be monitored.

---

## Links & Contact

- **GitHub (to be created):** github.com/[handle]/census-solana
- **Demo (planned):** census.so
- **X / Twitter:** [handle]
- **Email:** [email]
- **Superteam Earn Profile:** [profile link]

---

*Built for the builders who live outside the latency sweet spot. Census makes the invisible visible.*
