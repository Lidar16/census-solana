# Census — Technical Architecture Document

## System Overview

Census is a distributed, real-time intelligence layer for Solana RPC nodes. It consists of five core subsystems:

1. **Probe Network** — Edge workers that continuously benchmark RPC endpoints
2. **Aggregation API** — Time-series data store and REST/WebSocket API
3. **Node Registry** — Community-contributed, GitHub-hosted list of nodes to monitor
4. **Frontend Dashboard** — Globe visualization + filtering interface
5. **AI Agent Layer** — Claude-powered health monitor and natural language interface

---

## Directory Structure

```
census/
├── apps/
│   ├── web/                        # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── page.tsx            # Globe dashboard (homepage)
│   │   │   ├── nodes/
│   │   │   │   └── [id]/page.tsx   # Individual node detail page
│   │   │   ├── api/
│   │   │   │   └── chat/route.ts   # Natural language query endpoint (Claude)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── Globe.tsx           # Three.js globe visualization
│   │   │   ├── NodeCard.tsx        # Node summary card
│   │   │   ├── LatencyBadge.tsx    # Color-coded latency indicator
│   │   │   ├── DecentralScore.tsx  # Decentralization index badge
│   │   │   ├── NodeTable.tsx       # Sortable/filterable node list
│   │   │   ├── AgentChat.tsx       # AI chat interface
│   │   │   └── HealthBriefing.tsx  # Agent-generated network briefing
│   │   ├── lib/
│   │   │   ├── api.ts              # API client (Census REST + WebSocket)
│   │   │   └── types.ts            # Shared TypeScript types
│   │   └── package.json
│   │
│   └── agent/                      # Claude agentic health monitor
│       ├── index.ts                # Agent entrypoint (cron + query handler)
│       ├── tools/
│       │   ├── query-nodes.ts      # Tool: fetch node stats from Census API
│       │   ├── detect-anomalies.ts # Tool: statistical anomaly detection
│       │   └── generate-briefing.ts # Tool: write network health summary
│       ├── prompts/
│       │   └── system.ts           # Claude system prompt for the agent
│       └── package.json
│
├── packages/
│   ├── probe-worker/               # Cloudflare Worker — latency prober
│   │   ├── src/
│   │   │   ├── index.ts            # Worker entrypoint
│   │   │   ├── probe.ts            # RPC ping logic
│   │   │   ├── methods.ts          # Solana JSON-RPC methods to test
│   │   │   └── reporter.ts         # POSTs results to aggregation API
│   │   └── wrangler.toml
│   │
│   ├── aggregation-api/            # Hono.js API on Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts            # Hono app entrypoint
│   │   │   ├── routes/
│   │   │   │   ├── nodes.ts        # GET /nodes, GET /nodes/:id
│   │   │   │   ├── metrics.ts      # GET /metrics/:nodeId
│   │   │   │   ├── briefing.ts     # GET /briefing (AI health report)
│   │   │   │   └── websocket.ts    # WS /live — real-time feed
│   │   │   ├── db/
│   │   │   │   ├── schema.sql      # D1 database schema
│   │   │   │   └── queries.ts      # Typed D1 query helpers
│   │   │   └── scoring/
│   │   │       ├── latency.ts      # Latency tier classification
│   │   │       └── decentralization.ts # Decentralization Index calculator
│   │   └── wrangler.toml
│   │
│   └── registry/                   # Community node registry
│       ├── nodes.json              # List of monitored RPC endpoints
│       ├── schema.json             # JSON schema for node entries
│       └── CONTRIBUTING.md         # How to add a node
│
├── scripts/
│   ├── seed-registry.ts            # Bootstrap probe workers from nodes.json
│   └── validate-node.ts            # Test a node before adding to registry
│
└── README.md
```

---

## Data Flow

```
[Community Registry: nodes.json]
         │
         ▼
[Probe Workers × 6 Regions]          [Cloudflare Cron — every 30s]
  CF Worker (NA)  CF Worker (EU)  CF Worker (APAC)
  CF Worker (AF)  CF Worker (LATAM) CF Worker (ME)
         │
         │ POST /ingest (latency readings)
         ▼
[Aggregation API — Hono on CF Workers]
         │
   ┌─────┴──────┐
   │            │
  [D1 DB]    [KV Store]
  (history)  (latest snapshot)
         │
    ┌────┴────┐
    │         │
[REST API]  [WebSocket]
    │         │
    └────┬────┘
         │
   [Next.js Frontend]
    ├── Globe visualization
    ├── Node table + filters
    └── Agent chat UI
         │
         ▼
   [AI Agent — Claude claude-sonnet-4-20250514]
    ├── Scheduled: 24h health briefings
    ├── On-demand: natural language queries
    └── Autonomous: anomaly detection alerts
```

---

## Database Schema (Cloudflare D1)

```sql
-- nodes.json-backed registry (synced to DB on startup)
CREATE TABLE nodes (
  id          TEXT PRIMARY KEY,        -- e.g. "helius-mainnet-us"
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  operator    TEXT,                    -- "Helius", "independent", etc.
  country     TEXT,
  region      TEXT,                    -- "NA" | "EU" | "APAC" | "AF" | etc.
  lat         REAL,
  lon         REAL,
  is_public   INTEGER DEFAULT 1,
  added_at    TEXT DEFAULT (datetime('now'))
);

-- Raw probe readings (retained 7 days)
CREATE TABLE probe_readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id     TEXT REFERENCES nodes(id),
  probe_region TEXT,                   -- which CF worker took this reading
  method      TEXT,                    -- "getSlot" | "getBlockHeight" etc.
  latency_ms  REAL,
  success     INTEGER DEFAULT 1,
  slot_lag    INTEGER,                 -- slots behind tip
  recorded_at TEXT DEFAULT (datetime('now'))
);

-- Aggregated snapshots (updated every 30s by cron)
CREATE TABLE node_snapshots (
  node_id     TEXT REFERENCES nodes(id),
  probe_region TEXT,
  median_ms   REAL,
  p95_ms      REAL,
  p99_ms      REAL,
  success_rate REAL,
  slot_lag_avg INTEGER,
  decentral_score REAL,
  latency_tier TEXT,                   -- "fast" | "ok" | "slow" | "down"
  snapshot_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (node_id, probe_region)
);

-- AI agent briefings
CREATE TABLE briefings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  content     TEXT,
  generated_at TEXT DEFAULT (datetime('now'))
);
```

---

## Probe Worker Logic (`packages/probe-worker/src/probe.ts`)

```typescript
import { Connection } from '@solana/web3.js';

export interface ProbeResult {
  nodeId: string;
  method: string;
  latencyMs: number;
  success: boolean;
  slotLag?: number;
  timestamp: string;
}

const METHODS_TO_TEST = ['getSlot', 'getBlockHeight', 'getLatestBlockhash'];

export async function probeNode(
  nodeId: string,
  rpcUrl: string,
  networkTipSlot: number
): Promise<ProbeResult[]> {
  const conn = new Connection(rpcUrl, 'confirmed');
  const results: ProbeResult[] = [];

  for (const method of METHODS_TO_TEST) {
    const start = Date.now();
    try {
      let slotLag: number | undefined;

      if (method === 'getSlot') {
        const slot = await conn.getSlot();
        slotLag = networkTipSlot - slot;
      } else if (method === 'getBlockHeight') {
        await conn.getBlockHeight();
      } else if (method === 'getLatestBlockhash') {
        await conn.getLatestBlockhash();
      }

      results.push({
        nodeId,
        method,
        latencyMs: Date.now() - start,
        success: true,
        slotLag,
        timestamp: new Date().toISOString(),
      });
    } catch {
      results.push({
        nodeId,
        method,
        latencyMs: Date.now() - start,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}
```

---

## Decentralization Index Algorithm

Each node receives a score from 0–100 composed of three sub-scores:

```typescript
// packages/aggregation-api/src/scoring/decentralization.ts

interface DecentralizationScore {
  total: number;        // 0-100 composite
  operatorScore: number;  // 0-40: independent operators score higher
  geoScore: number;       // 0-30: nodes in underrepresented regions score higher
  stakeScore: number;     // 0-30: nodes not associated with top-10 validators score higher
}

const TOP_CENTRALIZED_OPERATORS = ['Helius', 'Alchemy', 'QuickNode', 'Triton One', 'GetBlock'];

// Underrepresented regions get a geo bonus
const GEO_BONUS: Record<string, number> = {
  AF: 30, LATAM: 25, ME: 20, APAC: 15, EU: 5, NA: 0
};

export function scoreDecentralization(node: Node): DecentralizationScore {
  const operatorScore = TOP_CENTRALIZED_OPERATORS.includes(node.operator ?? '')
    ? 5 : 40;

  const geoScore = GEO_BONUS[node.region] ?? 10;

  // stakeScore: fetched from Solana validator set (placeholder 15 default)
  const stakeScore = node.validatorLinked ? 30 : 15;

  const total = operatorScore + geoScore + stakeScore;
  return { total, operatorScore, geoScore, stakeScore };
}
```

---

## AI Agent System Prompt (`apps/agent/prompts/system.ts`)

```typescript
export const AGENT_SYSTEM_PROMPT = `
You are the Census Network Agent — an intelligent infrastructure advisor for the Solana ecosystem.

You have access to real-time data about Solana RPC nodes including:
- Latency measurements (median, p95, p99) from 6 global probe regions
- Node uptime and success rates
- Geographic location and operator identity  
- Decentralization scores

Your responsibilities:
1. MONITORING: Detect and flag anomalies — sudden latency spikes, regional outages, provider-wide degradation
2. BRIEFINGS: Generate clear, plain-English 24-hour network health summaries
3. ADVISOR: Answer developer questions about which node to use for their use case and region
4. ALERTS: Proactively surface risks (e.g., "3 of the top 5 fastest nodes are operated by the same provider")

Tone: Direct, technical, developer-friendly. No marketing speak. State facts, give recommendations, flag risks.

When answering questions, always cite the specific node ID, latency figure, and timestamp of the data you're referencing.
`;
```

---

## AI Agent Tools

```typescript
// apps/agent/tools/query-nodes.ts
export const queryNodesTool = {
  name: 'query_nodes',
  description: 'Fetch current node stats from Census API. Can filter by region, latency tier, or decentralization score.',
  input_schema: {
    type: 'object',
    properties: {
      region: { type: 'string', enum: ['NA', 'EU', 'APAC', 'AF', 'LATAM', 'ME', 'all'] },
      min_decentral_score: { type: 'number', description: 'Minimum decentralization score (0-100)' },
      latency_tier: { type: 'string', enum: ['fast', 'ok', 'slow', 'down', 'all'] },
      limit: { type: 'number', default: 10 }
    },
    required: ['region']
  }
};

// apps/agent/tools/detect-anomalies.ts
export const detectAnomaliesTool = {
  name: 'detect_anomalies',
  description: 'Run statistical anomaly detection over the last N hours of probe data.',
  input_schema: {
    type: 'object',
    properties: {
      hours: { type: 'number', description: 'Lookback window in hours', default: 24 },
      threshold_stddev: { type: 'number', description: 'Std deviation threshold for flagging', default: 2.5 }
    }
  }
};
```

---

## Node Registry Format (`packages/registry/nodes.json`)

```json
[
  {
    "id": "helius-mainnet-us-1",
    "name": "Helius Mainnet (US)",
    "url": "https://mainnet.helius-rpc.com",
    "operator": "Helius",
    "country": "US",
    "region": "NA",
    "lat": 37.7749,
    "lon": -122.4194,
    "is_public": true
  },
  {
    "id": "public-mainnet-solana",
    "name": "Solana Public RPC",
    "url": "https://api.mainnet-beta.solana.com",
    "operator": "Solana Foundation",
    "country": "US",
    "region": "NA",
    "lat": 37.3382,
    "lon": -121.8863,
    "is_public": true
  }
]
```

---

## Environment Variables

```env
# Aggregation API (Cloudflare)
CENSUS_API_SECRET=           # Shared secret for probe worker auth
CF_ACCOUNT_ID=               # Cloudflare account
CF_D1_DATABASE_ID=           # D1 database binding

# Frontend (Next.js)
NEXT_PUBLIC_CENSUS_API_URL=  # Public API base URL
NEXT_PUBLIC_WS_URL=          # WebSocket endpoint

# Agent
ANTHROPIC_API_KEY=           # Claude API key
CENSUS_API_URL=              # Internal API URL for agent tool calls
```

---

## Open Source License

MIT — all code, schemas, and the community node registry.
