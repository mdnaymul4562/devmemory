# DevMemory - Design Brief for Claude Design

## What this is

DevMemory is a product that gives engineering teams **organizational memory**. It connects to GitHub, Sentry, Slack, and Linear via Coral SQL, and lets anyone ask a natural language question about their team's engineering history. It answers with evidence-backed narratives - not raw data dumps.

Tagline: **"Your engineering team never forgets."**

## The design problem

Most AI chat UIs look like ChatGPT clones - a centered chat column, white bubbles, nothing else. That's a conversation tool. DevMemory is **not a conversation tool**. It's a **knowledge retrieval product** that happens to use natural language as its input.

The difference:
- ChatGPT: the VALUE is in the text response
- DevMemory: the VALUE is in the **evidence** - the actual GitHub PRs, Sentry errors, Slack threads, Linear issues that back up the answer. The text is the synthesis. The evidence is the proof.

## Product context

- This is an enterprise engineering tool (not consumer, not fun, not playful)
- Users are senior engineers, engineering managers, SREs, tech leads
- They come here during: onboarding, incident investigation, decision archaeology, risk assessment, sprint planning
- Design reference products: **Linear**, **Raycast**, **Arc browser**, **Vercel dashboard**, **Notion** (the structured data parts, not the docs parts)

## Information architecture

The app has ONE main view with three regions:

### 1. Navigation bar (top, thin)
- Product name + icon (DevMemory)
- Connected sources indicator (small badges showing GitHub, Sentry, Slack, Linear are connected - this is a PRODUCT DIFFERENTIATOR, show it subtly but clearly)
- "Powered by Coral" attribution (small, not dominant)

### 2. Evidence/Results area (main body, takes ~70% of the viewport)
This is the HERO area. Not the chat. This is where the VALUE lives.

When empty (first load):
- Show a compelling empty state that communicates what DevMemory does
- Not "start chatting" - instead something like a knowledge graph visualization, or source connection diagram, or example queries with previews of what they'd return
- Should feel like a product dashboard landing, not a chat welcome screen

When populated (after a query):
- **Narrative answer** at the top - the AI-synthesized response in clean, readable typography. This is 3-5 sentences, not a wall of text.
- **Evidence timeline** below - chronologically ordered evidence cards from multiple sources. Each card shows:
  - Source badge (GitHub/Sentry/Slack/Linear with distinctive but muted iconography)
  - Timestamp
  - Title
  - Description/excerpt
  - Author
  - Metadata (PR additions/deletions, error count, message reactions, issue priority)
  - Optional: link out to original source
- The timeline has a vertical line connecting events. Think: git history visualization meets audit trail.
- **Source summary bar** - a thin horizontal bar showing "4 sources queried · 6 evidence items · GitHub (3) · Sentry (1) · Slack (2)" - reinforces the cross-source power

### 3. Input area (bottom, fixed, like Linear's command bar)
- This is NOT a chat history panel. It's a **command input**.
- Single-line text input that expands when focused
- Subtle suggested queries when empty (not as buttons, more like ghost text or a small dropdown)
- Send button
- Show "Querying across 4 sources..." when processing (reinforces Coral's value)
- After a query, the previous question stays visible as context, but the area doesn't become a scrollable chat log. Think: search bar that shows your last query, not a message thread.

## Design principles

1. **Evidence over conversation.** The evidence timeline is the product, not the chat. Size and position accordingly.

2. **Density is a feature.** Engineers want information density. Don't over-pad, don't use huge fonts. Think Linear issue list density - compact but readable.

3. **Source attribution is a product feature, not decoration.** The source badges (GitHub, Sentry, Slack, Linear) should be immediately scannable. The user should be able to glance at the evidence timeline and instantly see "3 GitHub items, 1 Sentry item, 2 Slack items" without reading anything.

4. **Dark mode only.** This is a dev tool. No light mode. But dark doesn't mean black - use zinc-950/zinc-900 backgrounds with proper elevation through subtle border-zinc-800 and shadow, not brightness changes.

5. **Muted color palette.** Source icons get the ONLY color in the UI:
   - GitHub: neutral (zinc-400)
   - Sentry: muted rose/red (for errors - semantic)
   - Slack: muted sky/blue
   - Linear: muted violet/purple
   Everything else is zinc scale. No accent colors. No gradients. No glow effects.

6. **Typography hierarchy matters more than color.** Differentiate heading vs body vs metadata through weight and size, not color. Use the Geist font family (already installed).

7. **Motion should be informational, not decorative.** Animate evidence cards sliding in (shows they're arriving from a query). Don't animate borders, backgrounds, or hover effects beyond opacity changes.

8. **The empty state IS the pitch.** First-time users should understand the product's value from the empty state alone. Show the four connected sources. Show example queries. Show a preview of what a result looks like. Don't just say "ask a question."

## What the design deliverable should include

1. **Full-page layout** at 1440px wide showing:
   - Empty state (landing)
   - Populated state (after a query like "Why does auth fail on Tuesdays?")

2. **Evidence card component** showing:
   - GitHub PR card
   - Sentry error card
   - Slack message card
   - Linear issue card
   (Each should feel like the same component with source-specific metadata)

3. **Input area** at bottom showing:
   - Idle state with suggestions
   - Active/focused state
   - Loading state ("Querying across sources...")

4. **Narrative answer block** showing how the synthesized AI response renders above the evidence timeline

## Constraints

- Next.js + Tailwind CSS + Framer Motion + shadcn/ui (don't design anything that can't be built with these)
- Must feel production-grade, not like a hackathon demo
- Must work at 1280px and above (laptop screens minimum)
- Mobile is secondary but the input area should work on mobile
- Total page should not scroll - evidence area scrolls internally

## What this is NOT

- Not a ChatGPT clone with colored bubbles
- Not a dashboard with charts and graphs
- Not a Slack/Discord-style messaging app
- Not a dark-theme template with neon accents and glass morphism
- Not a landing page - this is the APP itself

## Key question to answer through design

How do you make **cross-source data correlation** feel tangible and valuable in a UI? The user should FEEL that data from 4 different tools was just unified into one answer. That's the entire product thesis.
