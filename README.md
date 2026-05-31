# DevMemory

**Your engineering team never forgets.**

DevMemory is an AI agent that acts as organizational engineering memory. It connects to your team's tools through [Coral](https://withcoral.com)'s SQL interface and answers any question about your engineering history with evidence-backed narratives.

Ask "Why does auth fail on Tuesdays?" and DevMemory queries across GitHub, Sentry, Linear, Notion, Hacker News, and more in a single Coral SQL query, then synthesizes a narrative answer backed by real evidence from each source.

**Track 1: Enterprise Agent** | Pirates of the Coral-Bean Hackathon (WeMakeDevs x Coral)

## The Problem

Context switching costs engineering teams **$50,000 per developer per year**. When developers leave, switch teams, or forget past decisions, critical knowledge is scattered across GitHub (code), Sentry (errors), Linear (tickets), Slack (conversations), and Notion (docs).

No tool connects all these dots. Until now.

## How It Works

```
User asks a natural language question
    |
    v
LLM generates Coral SQL with cross-source JOINs
    |
    v
Coral executes query across connected sources
    |
    +---> GitHub (PRs, issues, commits)
    +---> Sentry (errors, events)
    +---> Linear (issues, sprints, teams)
    +---> Notion (pages, databases)
    +---> Hacker News (discussions)
    +---> Claude (session history)
    +---> Crates.io (Rust packages)
    +---> Remotive (job listings)
    +---> Codex (code sessions)
    |
    v
LLM synthesizes evidence-backed narrative
    |
    v
UI renders answer + evidence timeline with source attribution
```

## Coral Features Used

| Feature | How DevMemory Uses It |
|---------|----------------------|
| **SQL Interface** | Every query is Coral SQL executed via CLI |
| **Cross-Source JOINs** | JOIN Linear issues with Sentry errors, GitHub PRs with HN discussions |
| **Schema Learning** | `/api/schema` discovers available tables dynamically from `coral.tables` |
| **Caching** | Query execution time tracked, cache hits detected (<200ms) |
| **MCP Integration** | `mcp-config.json` included for Claude Code / Cursor integration |

## Connected Sources

**9 sources connected, 411 tables queryable:**

| Source | Tables | Type |
|--------|--------|------|
| GitHub | 362 | Code repository, PRs, issues, commits |
| Sentry | 12 | Error tracking, events, projects |
| Notion | 12 | Documentation, pages, databases |
| Linear | 8 | Issue tracking, sprints, teams |
| Hacker News | 8 | Tech discussions, stories, search |
| Crates.io | 6 | Rust package registry |
| Claude | 2 | Local Claude Code session events |
| Remotive | 1 | Remote job listings |
| Codex | 0 | Code session logs |

## Example Queries

**Demo scenarios (pre-built with evidence):**
- "Why does auth fail on Tuesdays?"
- "What happened last time we deployed on a Friday?"
- "What led to the March 15th outage?"
- "Who has the most context about our search infrastructure?"
- "What technical debt should we tackle first?"
- "How is the billing system doing?"

**Live Coral queries (real data):**
- "Show me all urgent issues in Linear"
- "What errors are in Sentry?"
- "Show me open issues on the withcoral/coral GitHub repo"
- "What's trending on Hacker News?"

## Tech Stack

- **Frontend:** TanStack Start + Tailwind CSS + Framer Motion
- **LLM:** OpenRouter (model-agnostic: Gemini Flash, DeepSeek, etc.)
- **Data Layer:** Coral SQL via CLI subprocess
- **Sources:** 9 connected (GitHub, Sentry, Linear, Notion, HN, Claude, Crates.io, Remotive, Codex)
- **Deploy:** Vercel (demo mode) + Local (live Coral mode)

## Setup

### Prerequisites
- Node.js 20+
- [Coral CLI](https://withcoral.com/docs/getting-started/installation)
- [OpenRouter API key](https://openrouter.ai/keys)

### Install

```bash
git clone https://github.com/mdnaymul4562/devmemory.git
cd devmemory
npm install
```

### Configure Coral Sources

```bash
# Install Coral
curl -fsSL https://withcoral.com/install.sh | sh

# Add sources
coral source add github          # needs GitHub token
coral source add --interactive sentry   # needs Sentry org + token
coral source add linear          # needs Linear API key
coral source add notion          # needs Notion integration token

# No-auth sources
coral source add claude          # reads local Claude Code sessions
git clone https://github.com/withcoral/coral.git /tmp/coral-repo
coral source add --file /tmp/coral-repo/sources/community/hn/manifest.yaml
coral source add --file /tmp/coral-repo/sources/community/crates_io/manifest.yaml
coral source add --file /tmp/coral-repo/sources/community/remotive/manifest.yaml

# Verify
coral source list
coral sql "SELECT schema_name, COUNT(*) FROM coral.tables GROUP BY 1"
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your OpenRouter API key
```

### Run

```bash
npm run dev
# Open http://localhost:8080
```

## Architecture

```
src/
  routes/
    index.tsx          # Main UI: chat, evidence timeline, convergence diagram
    api/
      chat.ts          # POST /api/chat - LLM + Coral query execution
      schema.ts        # GET /api/schema - Schema learning endpoint
  lib/
    coral.ts           # Coral CLI wrapper: executeCoralQuery, getCoralSchema
    demo-data.ts       # Pre-built scenarios for reliable demos
  components/
    BrandIcon.tsx      # SVG icons for all data sources
mcp-config.json        # MCP server config for Claude Code / Cursor
```

**Request flow:**
1. Check demo scenarios first (instant, reliable)
2. If no match + Coral available: LLM generates SQL -> Coral executes -> LLM synthesizes
3. If no match + no Coral: LLM generates response directly

## Judging Criteria Alignment

| Criterion | How DevMemory Addresses It |
|-----------|---------------------------|
| **Best Use of Coral** | 9 sources, cross-source JOINs, schema learning, caching, MCP config |
| **Potential Impact** | $50K/dev/year context switching cost, $72M/year knowledge loss |
| **Creativity & Originality** | No existing tool does cross-source engineering memory |
| **Technical Implementation** | Real Coral SQL, OpenRouter LLM, structured JSON output |
| **Aesthetics & UX** | Cream paper aesthetic, evidence timeline, source-attributed cards |
| **Learning & Growth** | First-time Coral user, learned SQL interface + cross-source JOINs |

## Live Demo

- **Deployed:** [coralhackathon.vercel.app](https://coralhackathon.vercel.app) (demo mode)
- **YouTube:** [3-min demo video](https://youtube.com/watch?v=TODO)

## License

MIT

---

Built for the [Pirates of the Coral-Bean Hackathon](https://www.wemakedevs.org/hackathons/coral) by WeMakeDevs x Coral.
