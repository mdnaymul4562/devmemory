# DevMemory - Coral Bean Hackathon Project

## Project
**DevMemory** - "Your engineering team never forgets."
An AI agent that acts as organizational engineering memory, using Coral's cross-source SQL JOINs to answer any question about your team's engineering history across GitHub, Sentry, Slack, and Linear.

**Track:** 1 (Enterprise Agent)
**Hackathon:** Pirates of the Coral-Bean (WeMakeDevs x Coral)
**Deadline:** May 31, 2025 23:59 IST
**Team:** Solo

## First Principles Rules

1. **Think from first principles always.** Don't copy patterns blindly. Ask "why" before "how."
2. **Don't overestimate or underestimate.** Be honest about scope, complexity, and time. A polished MVP beats an unfinished ambitious project.
3. **Ask for more context when needed.** Don't assume - clarify.
4. **Push back if the direction is wrong.** Challenge bad ideas respectfully, even from the user.
5. **We need the BEST project.** Every decision should optimize for winning against the judging criteria.
6. **We need an ACCEPTED project.** Must have: deployed link, GitHub repo, 3-min YouTube demo. No shortcuts on submission requirements.

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + Framer Motion + shadcn/ui
- **LLM:** OpenRouter (model-agnostic routing to Claude/GPT-4/Gemini)
- **Data Layer:** Coral SQL via MCP server or CLI subprocess
- **Sources:** GitHub + Sentry + Linear + Slack (4 bundled Coral sources)
- **Deploy:** Vercel

## Design Aesthetic
- Refined, tasteful, NOT flashy
- Thoughtful typography with clean sans-serif and proper hierarchy
- Generous whitespace and spacing
- Muted, sophisticated color palette - no neon, no garish colors
- Subtle micro-interactions, not overdone animations
- Clear information hierarchy
- Professional but warm
- Reference aesthetic: Linear, Raycast, Arc browser
- Dark mode by default with high contrast readability
- Source icons/badges should be recognizable but understated

## Coral-Specific Rules
- **Maximize cross-source JOINs** - this is Coral's killer feature and the #1 judging criterion
- **Use MCP integration** when possible, fall back to CLI subprocess
- **Leverage schema learning** - show the agent discovering available tables
- **Use caching** - demonstrate smart caching for repeated queries
- **4+ sources minimum** - GitHub, Sentry, Linear, Slack
- Every major feature should involve data from 2+ sources joined together

## Judging Criteria (prioritized)
1. **Best Use of Coral** - SQL interface, cross-source JOINs, caching (CRITICAL)
2. **Potential Impact** - Meaningful problem ($50K/dev/year context switching cost)
3. **Creativity & Originality** - No existing tool does cross-source engineering memory
4. **Technical Implementation** - Quality of Coral integration, SQL queries, agent architecture
5. **Aesthetics & UX** - Beautiful, intuitive chat + evidence timeline UI
6. **Learning & Growth** - Document the Coral learning journey

## Architecture
```
User question (natural language)
  -> Next.js API route
  -> OpenRouter LLM (generates Coral SQL)
  -> Coral MCP/CLI (executes cross-source query)
  -> GitHub + Sentry + Slack + Linear
  -> LLM synthesizes narrative answer
  -> UI: chat message + evidence timeline + source cards
```

## What NOT to Do
- Don't build a generic dashboard - this is a MEMORY, not a dashboard
- Don't hardcode data - all data comes through Coral queries
- Don't use flashy colors or overdone animations
- Don't build features that don't showcase Coral's cross-source JOINs
- Don't skip the demo video - it's required for submission
- Don't forget to star the Coral GitHub repo and join Discord
