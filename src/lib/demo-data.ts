export type SourceKey = string;

export interface DemoEvidence {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  author: string;
  when: string;
  meta: string;
  href?: string;
}

export interface DemoScenario {
  answer: string;
  evidence: DemoEvidence[];
  sourceCounts: Record<string, number>;
  coralQueries?: { sql: string; purpose: string }[];
}

const SCENARIOS: Record<string, DemoScenario> = {
  auth: {
    answer:
      'The Tuesday cron resets OAuth tokens at **02:00 UTC**, but the new MFA middleware merged in [PR #847](#evidence-pr-847) assumes tokens are valid for 24 hours. The mismatch produces a recurring spike in [401s](#evidence-sentry-mfa) until users re-authenticate, first flagged by [@dev in #engineering](#evidence-slack-engineering) the day before merge, then tracked as [ENG-2014](#evidence-eng-2014).',
    sourceCounts: { github: 1, sentry: 1, slack: 1, linear: 1 },
    coralQueries: [
      { sql: "SELECT g.title, g.merged_at, s.title AS error, s.count, sl.text AS discussion, l.title AS ticket\nFROM github.pulls g\nJOIN sentry.issues s ON s.first_seen > g.merged_at\nJOIN slack.messages sl ON sl.text LIKE '%auth%' OR sl.text LIKE '%MFA%'\nJOIN linear.issues l ON l.title LIKE '%auth%'\nWHERE g.title LIKE '%MFA%'\nORDER BY g.merged_at DESC", purpose: "Cross-source JOIN: correlate auth PRs with errors, discussions, and tickets" },
    ],
    evidence: [
      {
        id: "slack-engineering",
        source: "slack",
        title: "#engineering:heads up about MFA + cron",
        excerpt:
          "fwiw the new MFA middleware assumes tokens are valid 24h. the 2am UTC token reset is going to bite us on tuesdays.",
        author: "@dev",
        when: "Mar 4 · 18:42",
        meta: "12 replies · 4 reactions",
      },
      {
        id: "pr-847",
        source: "github",
        title: "PR #847 · Add MFA middleware to auth pipeline",
        excerpt:
          "Wraps the existing token verifier with an MFA check. Expects token TTL ≥ 24h. Tests cover happy path only.",
        author: "@dev",
        when: "Mar 5 · 09:14",
        meta: "+412 −38 · 3 reviewers",
      },
      {
        id: "eng-2014",
        source: "linear",
        title: "ENG-2014 · Investigate Tuesday auth blip",
        excerpt:
          "Repeating spike in 401s on Tue ~02:05 UTC. Affects ~3% of active sessions until users re-auth.",
        author: "@priya",
        when: "Mar 12",
        meta: "Priority: High · In Progress",
      },
      {
        id: "sentry-mfa",
        source: "sentry",
        title: "AuthError: token expired (mfa-middleware)",
        excerpt:
          "First seen Mar 12 02:05 UTC, recurring weekly. 1,284 events across 3 environments.",
        author: "system",
        when: "recurring",
        meta: "1,284 events · level: error",
      },
    ],
  },

  deploy: {
    answer:
      'The last Friday deploy of the payments service (v2.14.0) caused a **23-minute partial outage**. The database migration in [PR #912](#evidence-pr-912) added a NOT NULL column without a default, causing INSERT failures for in-flight transactions. Sentry captured [1,247 PaymentProcessingError events](#evidence-sentry-payment). Rolled back via [PR #915](#evidence-pr-915) within 23 minutes. [PAY-892](#evidence-pay-892) tracks the proper fix for next sprint.',
    sourceCounts: { github: 2, sentry: 1, slack: 1, linear: 1 },
    evidence: [
      {
        id: "pr-912",
        source: "github",
        title: "PR #912 · Add payment audit trail columns",
        excerpt:
          "Adds audit_user_id (NOT NULL) and audit_timestamp columns to payments table.",
        author: "@mike.torres",
        when: "May 23 · 15:30",
        meta: "+89 −3 · 2 reviewers",
      },
      {
        id: "sentry-payment",
        source: "sentry",
        title: "PaymentProcessingError: NOT NULL constraint failed",
        excerpt:
          "Massive spike starting at 16:02 UTC on May 23. 1,247 events in 23 minutes.",
        author: "payments-service",
        when: "May 23 · 16:02",
        meta: "1,247 events · level: fatal",
      },
      {
        id: "slack-incident",
        source: "slack",
        title: "#incidents:payments 500s after v2.14.0",
        excerpt:
          '"INCIDENT: Payments service returning 500s after v2.14.0 deploy. Rolling back now. ETA 15 min."',
        author: "@sarah.chen",
        when: "May 23 · 16:05",
        meta: "24 replies · thread",
      },
      {
        id: "pr-915",
        source: "github",
        title: "PR #915 · Revert payment audit columns migration",
        excerpt:
          "Emergency rollback. Will re-approach with DEFAULT value in next sprint.",
        author: "@sarah.chen",
        when: "May 23 · 16:25",
        meta: "+15 −89 · merged in 23min",
      },
      {
        id: "pay-892",
        source: "linear",
        title: "PAY-892 · Re-implement audit trail safely",
        excerpt:
          "Add audit columns with DEFAULT values and backfill existing rows.",
        author: "@mike.torres",
        when: "May 24",
        meta: "Priority: High · Sprint 25",
      },
    ],
  },

  expertise: {
    answer:
      "Based on code contributions, issue ownership, and discussion activity:\n\n1. **sarah.chen**:47 commits to search/, 8 Linear issues, 23 Slack discussions. Primary architect.\n2. **alex.kim**:31 commits, 5 issues, 15 discussions. Focuses on indexing pipeline.\n3. **mike.torres**:12 commits, 3 issues, 8 discussions. Handles search API endpoints.\n\nSarah is the clear knowledge owner. Alex is the best backup for indexing, Mike for API-level questions.",
    sourceCounts: { github: 1, sentry: 0, slack: 1, linear: 1 },
    evidence: [
      {
        id: "gh-analysis",
        source: "github",
        title: "Code contribution analysis for search/",
        excerpt:
          "sarah.chen: 47 commits (62%), alex.kim: 31 (28%), mike.torres: 12 (10%).",
        author: "DevMemory",
        when: "now",
        meta: "90 commits · 34 files",
      },
      {
        id: "linear-ownership",
        source: "linear",
        title: "Issue ownership for SEARCH-*",
        excerpt:
          "sarah.chen: 8 issues, alex.kim: 5, mike.torres: 3. Sarah handled both the ES migration and relevance tuning.",
        author: "DevMemory",
        when: "now",
        meta: "16 issues analyzed",
      },
      {
        id: "slack-activity",
        source: "slack",
        title: "Discussion activity in #search-eng",
        excerpt:
          "sarah.chen: 23 messages, alex.kim: 15, mike.torres: 8. Sarah frequently answers others' search questions.",
        author: "DevMemory",
        when: "now",
        meta: "3 channels analyzed",
      },
    ],
  },

  risk: {
    answer:
      "Riskiest files based on error frequency × staleness:\n\n1. **src/payments/processor.ts**:23 Sentry errors, last commit 45 days ago. High risk.\n2. **src/auth/middleware.ts**:15 errors (recurring Tuesdays), last commit 87 days ago.\n3. **lib/queue/worker.ts**:8 errors, last commit 12 days ago.\n\nThe payments processor is highest priority:daily errors but no maintenance in over a month.",
    sourceCounts: { github: 1, sentry: 1, slack: 0, linear: 1 },
    evidence: [
      {
        id: "sentry-risk",
        source: "sentry",
        title: "Top error-producing files (30 days)",
        excerpt:
          "processor.ts: 23 errors, middleware.ts: 15 (weekly), worker.ts: 8.",
        author: "DevMemory",
        when: "now",
        meta: "46 errors total",
      },
      {
        id: "gh-staleness",
        source: "github",
        title: "Last commit dates for error-prone files",
        excerpt:
          "processor.ts: 45 days ago, middleware.ts: 87 days ago, worker.ts: 12 days ago.",
        author: "DevMemory",
        when: "now",
        meta: "3 files analyzed",
      },
      {
        id: "linear-risk",
        source: "linear",
        title: "PAY-901 · Payment processor timeouts",
        excerpt:
          "Intermittent timeout errors in batch payments. No assignee. Status: Triage.",
        author: "unassigned",
        when: "May 10",
        meta: "Priority: Medium · Triage",
      },
    ],
  },

  recent: {
    answer:
      "Here's what happened across your engineering stack this week:\n\n**Code:** 14 PRs merged across 6 repos. Top contributors: alex.kim (5), mike.torres (4), sarah.chen (3). 1,847 lines added, 423 removed.\n\n**Errors:** 2 new Sentry issues. Total count down 12% from last week. Top: RateLimitExceeded in api-gateway (127 events).\n\n**Sprint:** 8 of 12 Linear issues completed for Sprint 24. 2 blocked:AUTH-1247 (cron review) and INFRA-445 (DevOps dependency).\n\n**Discussion:** Active threads in #engineering (database migration, 18 replies) and #search-eng (relevance scoring v2, 12 replies).",
    sourceCounts: { github: 1, sentry: 1, slack: 1, linear: 1 },
    evidence: [
      {
        id: "gh-weekly",
        source: "github",
        title: "Code activity this week",
        excerpt:
          "14 PRs merged. alex.kim (5 PRs), mike.torres (4), sarah.chen (3). +1,847 −423 lines.",
        author: "DevMemory",
        when: "this week",
        meta: "14 merged · 3 open",
      },
      {
        id: "sentry-weekly",
        source: "sentry",
        title: "Error trends this week",
        excerpt:
          "2 new issues. Total: 342 events (−12% WoW). Top: RateLimitExceeded in api-gateway.",
        author: "DevMemory",
        when: "this week",
        meta: "342 events · −12%",
      },
      {
        id: "linear-sprint",
        source: "linear",
        title: "Sprint 24 progress",
        excerpt:
          "8/12 completed, 2 in progress, 2 blocked. Blockers: AUTH-1247, INFRA-445.",
        author: "DevMemory",
        when: "this week",
        meta: "67% complete · 2 blocked",
      },
      {
        id: "slack-threads",
        source: "slack",
        title: "Key discussions this week",
        excerpt:
          "#engineering: database migration plan (18 replies). #search-eng: relevance scoring v2 (12 replies).",
        author: "DevMemory",
        when: "this week",
        meta: "3 active threads",
      },
    ],
  },

  outage: {
    answer:
      'The March 15th outage lasted **47 minutes** and affected 100% of API traffic. Root cause: a [Redis cluster failover](#evidence-slack-redis) triggered by a [memory config change](#evidence-pr-783) that reduced max-memory from 8GB to 2GB. The change was part of [INFRA-388](#evidence-infra-388) (cost optimization sprint). Sentry recorded [14,291 ConnectionRefusedError events](#evidence-sentry-redis). Post-mortem noted the config change bypassed the usual staging validation because infrastructure changes weren\'t gated by the same CI pipeline as application code.',
    sourceCounts: { github: 1, sentry: 1, slack: 2, linear: 1 },
    evidence: [
      {
        id: "pr-783",
        source: "github",
        title: "PR #783 · Reduce Redis max-memory for cost savings",
        excerpt:
          "Lowers max-memory from 8GB to 2GB across all Redis clusters. Part of infra cost optimization.",
        author: "@ops-lead",
        when: "Mar 14 · 17:00",
        meta: "+3 −3 · 1 reviewer · no staging test",
      },
      {
        id: "sentry-redis",
        source: "sentry",
        title: "ConnectionRefusedError: Redis cluster unreachable",
        excerpt:
          "Started Mar 15 03:12 UTC. 14,291 events in 47 minutes across all services. Resolved 03:59 UTC.",
        author: "api-gateway",
        when: "Mar 15 · 03:12",
        meta: "14,291 events · level: fatal",
      },
      {
        id: "slack-redis",
        source: "slack",
        title: "#incidents:full API outage, Redis OOM",
        excerpt:
          '"ALL HANDS: Redis clusters OOM-killed after yesterday\'s config change. Every service down. Rolling back max-memory now."',
        author: "@ops-lead",
        when: "Mar 15 · 03:15",
        meta: "67 replies · 12 participants",
      },
      {
        id: "slack-postmortem",
        source: "slack",
        title: "#engineering:outage post-mortem notes",
        excerpt:
          '"Key finding: infra config changes bypass our CI staging gate. We need terraform plan review for Redis/Postgres configs."',
        author: "@sarah.chen",
        when: "Mar 16 · 14:00",
        meta: "23 replies · action items: 4",
      },
      {
        id: "infra-388",
        source: "linear",
        title: "INFRA-388 · Q1 infrastructure cost optimization",
        excerpt:
          "Reduce cloud spend by 20%. Includes Redis downsizing, unused instance cleanup, reserved capacity. Status: Paused after outage.",
        author: "@ops-lead",
        when: "Feb 28",
        meta: "Priority: Medium · Paused",
      },
    ],
  },
  techdebt: {
    answer:
      'Top technical debt items by cross-referencing error rates, code age, and open issues:\n\n1. **Legacy billing adapter**:[14 Sentry errors/week](#evidence-sentry-billing), last refactor [11 months ago](#evidence-gh-billing). [PLAT-302](#evidence-plat-302) has been in backlog for 3 sprints.\n2. **Monolithic user service**:discussed in [#platform](#evidence-slack-monolith) 6 times this quarter. 3 open issues about splitting it.\n3. **Test coverage gaps in API gateway**:47% coverage, [2 production bugs](#evidence-sentry-gateway) traced to untested paths last month.',
    sourceCounts: { github: 2, sentry: 2, slack: 1, linear: 1 },
    evidence: [
      {
        id: "sentry-billing",
        source: "sentry",
        title: "BillingAdapterError: upstream timeout",
        excerpt:
          "14 events/week avg. Legacy SOAP adapter to payment provider. Retry logic masks failures.",
        author: "billing-service",
        when: "recurring",
        meta: "14/week · level: warning",
      },
      {
        id: "gh-billing",
        source: "github",
        title: "Last significant change to billing/adapter/",
        excerpt:
          "Most recent non-trivial PR was 11 months ago. 23 files, 4,200 lines, zero tests added since.",
        author: "@legacy-team",
        when: "Jun 2024",
        meta: "23 files · 0% recent test coverage",
      },
      {
        id: "plat-302",
        source: "linear",
        title: "PLAT-302 · Rewrite billing adapter to REST",
        excerpt:
          "Replace SOAP adapter with REST. Estimated: 2 sprints. Deprioritized 3 times due to feature work.",
        author: "@mike.torres",
        when: "Jan 15",
        meta: "Priority: Medium · Backlog (3 sprints)",
      },
      {
        id: "slack-monolith",
        source: "slack",
        title: "#platform:user service split discussion",
        excerpt:
          '"We keep hitting the user service bottleneck. 6th time this quarter someone brings up splitting it. Should we just commit?"',
        author: "@sarah.chen",
        when: "May 22",
        meta: "6 discussions · #platform",
      },
      {
        id: "sentry-gateway",
        source: "sentry",
        title: "APIGateway: unhandled route fallthrough",
        excerpt:
          "2 production bugs last month from untested route paths. Coverage at 47%.",
        author: "api-gateway",
        when: "May 18",
        meta: "2 bugs · 47% coverage",
      },
      {
        id: "gh-coverage",
        source: "github",
        title: "Test coverage report for api-gateway/",
        excerpt:
          "47% line coverage. Critical paths: /auth/*, /billing/*, /webhooks/* have < 30% coverage.",
        author: "CI bot",
        when: "May 29",
        meta: "47% overall · 30% critical paths",
      },
    ],
  },

  onboarding: {
    answer:
      'For a new engineer joining the platform team, here\'s the cross-source onboarding context:\n\n**Active work:** Sprint 24 has [12 issues](#evidence-linear-sprint) across 4 repos. Focus areas are search relevance and billing migration.\n\n**Key people:** [sarah.chen](#evidence-gh-contributors) (search + auth), [alex.kim](#evidence-gh-contributors) (indexing), [mike.torres](#evidence-gh-contributors) (billing + API).\n\n**Watch out for:** [recurring Tuesday auth failures](#evidence-sentry-watch) and the [payments processor timeout](#evidence-sentry-watch):both are known issues.\n\n**Read first:** The [#engineering pinned messages](#evidence-slack-onboard) have the architecture decision records and the platform migration plan.',
    sourceCounts: { github: 1, sentry: 1, slack: 1, linear: 1 },
    evidence: [
      {
        id: "linear-sprint",
        source: "linear",
        title: "Sprint 24:active issues overview",
        excerpt:
          "12 issues across platform, search, billing, infra. 3 high-priority, 2 blocked. Focus: search relevance + billing REST migration.",
        author: "DevMemory",
        when: "now",
        meta: "12 issues · 4 repos",
      },
      {
        id: "gh-contributors",
        source: "github",
        title: "Active contributors (last 30 days)",
        excerpt:
          "sarah.chen: 47 commits (auth, search). alex.kim: 31 commits (indexing). mike.torres: 28 commits (billing, API gateway).",
        author: "DevMemory",
        when: "last 30 days",
        meta: "3 key contributors · 106 commits",
      },
      {
        id: "sentry-watch",
        source: "sentry",
        title: "Known recurring issues",
        excerpt:
          "1) AuthError: token expired (mfa-middleware):Tuesdays. 2) PaymentProcessor timeout:intermittent. Both tracked in Linear.",
        author: "DevMemory",
        when: "active",
        meta: "2 known issues · tracked",
      },
      {
        id: "slack-onboard",
        source: "slack",
        title: "#engineering:pinned resources",
        excerpt:
          "Pinned: Architecture decision records (ADR), Platform migration plan, On-call runbook, Service dependency map.",
        author: "channel",
        when: "pinned",
        meta: "4 pinned docs · updated monthly",
      },
    ],
  },

  billing: {
    answer:
      'The billing system is in a **transitional state**. The legacy SOAP adapter ([billing/adapter/](#evidence-gh-billing-code)) still handles 60% of transactions but has [14 Sentry warnings/week](#evidence-sentry-billing-health). The new REST integration is [40% complete](#evidence-linear-billing-migration) in Sprint 25. [mike.torres](#evidence-slack-billing-thread) is leading the migration. Key risk: the [SOAP adapter has no test coverage](#evidence-gh-billing-code) for edge cases around refunds and partial payments.',
    sourceCounts: { github: 1, sentry: 1, slack: 1, linear: 1 },
    evidence: [
      {
        id: "gh-billing-code",
        source: "github",
        title: "billing/adapter/:code health",
        excerpt:
          "4,200 lines, last major change 11 months ago. 0 tests for refund flows. 3 TODO comments referencing 'temporary workaround'.",
        author: "DevMemory",
        when: "analyzed now",
        meta: "4,200 LOC · 0 refund tests",
      },
      {
        id: "sentry-billing-health",
        source: "sentry",
        title: "Billing service error trends",
        excerpt:
          "14 warnings/week (upstream timeout). 2 errors/week (XML parse failure on edge-case responses). Stable trend.",
        author: "billing-service",
        when: "last 30 days",
        meta: "14 warn + 2 err / week",
      },
      {
        id: "linear-billing-migration",
        source: "linear",
        title: "PLAT-302 · Billing REST migration",
        excerpt:
          "40% complete. Phase 1 (charges) done. Phase 2 (subscriptions) in progress. Phase 3 (refunds) not started.",
        author: "@mike.torres",
        when: "Sprint 25",
        meta: "40% · 3 phases",
      },
      {
        id: "slack-billing-thread",
        source: "slack",
        title: "#billing:migration update thread",
        excerpt:
          '"Phase 1 is live. Charges now hit the REST endpoint. Subscriptions will be trickier:the SOAP API returns different schemas per plan type."',
        author: "@mike.torres",
        when: "May 26",
        meta: "9 replies · #billing",
      },
    ],
  },
  pr847: {
    answer:
      '[PR #847](#evidence-pr847-detail) was opened by @dev on March 5th to add MFA support to the auth pipeline. It wraps the existing token verifier with a TOTP-based multi-factor check. The PR added 412 lines and removed 38 across 12 files. Three reviewers approved it: @sarah.chen, @priya, and @alex.kim. The [test coverage](#evidence-pr847-tests) only covers the happy path. No integration tests were added for the token expiry edge case that later caused the Tuesday failures.',
    sourceCounts: { github: 3, sentry: 0, slack: 1, linear: 0 },
    evidence: [
      {
        id: "pr847-detail",
        source: "github",
        title: "PR #847: full details",
        excerpt:
          "12 files changed. Core change in src/auth/middleware.ts: new MfaVerifier class wraps TokenVerifier. Expects token.expiresAt > now + 24h.",
        author: "@dev",
        when: "Mar 5 · 09:14",
        meta: "+412 -38 · 12 files · 3 approvals",
      },
      {
        id: "pr847-tests",
        source: "github",
        title: "Test files in PR #847",
        excerpt:
          "Only auth/middleware.test.ts updated. 4 new test cases, all happy-path. No test for token TTL < 24h. No integration test with cron rotation.",
        author: "@dev",
        when: "Mar 5 · 09:14",
        meta: "4 tests added · 0 edge cases",
      },
      {
        id: "pr847-review",
        source: "github",
        title: "Review comments on PR #847",
        excerpt:
          '@sarah.chen: "Looks good, but should we add a test for short-lived tokens?" @dev: "Good call, will add in follow-up." (follow-up never created)',
        author: "@sarah.chen",
        when: "Mar 5 · 11:30",
        meta: "3 review comments · 1 unresolved",
      },
      {
        id: "pr847-slack",
        source: "slack",
        title: "#code-review: PR #847 discussion",
        excerpt:
          '"Merged the MFA PR. @priya noticed we don\'t test short token TTLs. Adding a follow-up ticket... actually, let me do it after sprint planning."',
        author: "@dev",
        when: "Mar 5 · 14:20",
        meta: "5 replies · #code-review",
      },
    ],
  },

  sarah: {
    answer:
      '**sarah.chen** is the most active contributor on the platform team. Over the last 90 days: [47 commits](#evidence-sarah-commits) across auth, search, and infrastructure. She led the [Elasticsearch migration](#evidence-sarah-es) (SEARCH-180 through SEARCH-195), handled 2 production incidents as on-call, and is the go-to person for [architectural decisions](#evidence-sarah-slack) based on Slack activity. She reviewed 34 PRs in the last month, more than anyone else on the team.',
    sourceCounts: { github: 2, sentry: 0, slack: 1, linear: 1 },
    evidence: [
      {
        id: "sarah-commits",
        source: "github",
        title: "sarah.chen: commit history (90 days)",
        excerpt:
          "47 commits. Top areas: src/search/ (19), src/auth/ (12), infra/ (8), src/api/ (8). 34 PRs reviewed. Average review time: 4.2 hours.",
        author: "DevMemory",
        when: "last 90 days",
        meta: "47 commits · 34 reviews",
      },
      {
        id: "sarah-es",
        source: "linear",
        title: "SEARCH-180 to SEARCH-195: ES migration",
        excerpt:
          "Led the migration from custom search index to Elasticsearch. 16 issues, all completed. Reduced search latency from 340ms to 45ms p99.",
        author: "@sarah.chen",
        when: "Feb - Mar",
        meta: "16 issues · all completed",
      },
      {
        id: "sarah-slack",
        source: "slack",
        title: "sarah.chen: discussion footprint",
        excerpt:
          "Most active in #engineering (42 msgs), #search-eng (31 msgs), #incidents (18 msgs). Frequently tagged for architecture questions. Initiated 3 ADR discussions.",
        author: "DevMemory",
        when: "last 90 days",
        meta: "91 messages · 3 channels",
      },
      {
        id: "sarah-prs",
        source: "github",
        title: "sarah.chen: PR review patterns",
        excerpt:
          "Reviewed 34 PRs. Average turnaround: 4.2h. Catches edge cases in 60% of reviews. Top review recipients: @alex.kim (12), @mike.torres (9), @dev (8).",
        author: "DevMemory",
        when: "last 30 days",
        meta: "34 reviews · 4.2h avg",
      },
    ],
  },

  fix: {
    answer:
      'To fix the Tuesday auth failures, here\'s the recommended approach based on the evidence:\n\n1. **Short-term**: Extend the cron job token rotation to preserve tokens with active MFA sessions. [ENG-2014](#evidence-fix-ticket) should be updated with this scope.\n2. **Medium-term**: Add the missing [integration test](#evidence-fix-test) that validates MFA behavior across token rotation boundaries.\n3. **Root cause**: The [MFA middleware](#evidence-fix-code) should check `token.refreshedAt` instead of `token.createdAt` so rotated tokens aren\'t treated as expired.\n\nEstimated effort: 1-2 days for the fix, half a day for tests.',
    sourceCounts: { github: 1, sentry: 1, slack: 1, linear: 1 },
    evidence: [
      {
        id: "fix-ticket",
        source: "linear",
        title: "ENG-2014: recommended scope update",
        excerpt:
          "Current scope: 'investigate'. Recommended: update MfaVerifier to use token.refreshedAt, add rotation-aware TTL check, add integration test.",
        author: "DevMemory",
        when: "recommendation",
        meta: "est. 1-2 days",
      },
      {
        id: "fix-code",
        source: "github",
        title: "src/auth/middleware.ts: line 47",
        excerpt:
          "Current: `if (token.createdAt + TTL_24H < now)`. Should be: `if (token.refreshedAt + TTL_24H < now)`. The cron job sets refreshedAt but middleware checks createdAt.",
        author: "DevMemory",
        when: "analysis",
        meta: "1 line change · root cause",
      },
      {
        id: "fix-test",
        source: "github",
        title: "Missing test case: token rotation + MFA",
        excerpt:
          "Need integration test: create token -> rotate via cron -> attempt MFA verification -> should succeed if within 24h of rotation.",
        author: "DevMemory",
        when: "recommendation",
        meta: "1 new test file needed",
      },
      {
        id: "fix-slack",
        source: "slack",
        title: "#engineering: prior fix discussion",
        excerpt:
          '"@sarah.chen suggested checking refreshedAt back in March but it wasn\'t picked up. The fix is straightforward if someone owns ENG-2014."',
        author: "DevMemory",
        when: "Mar 4 thread",
        meta: "referenced from original discussion",
      },
    ],
  },

  sprint: {
    answer:
      'Sprint 24 has **8 of 12 issues completed** (67%). Here is the breakdown:\n\n**Completed (8):** Search relevance tuning, API rate limiter update, billing phase 1, user profile caching, 4 bug fixes.\n\n**In progress (2):** [SEARCH-201](#evidence-sprint-search) (relevance scoring v2, @alex.kim, 70% done) and [PLAT-310](#evidence-sprint-plat) (user service performance, @mike.torres).\n\n**Blocked (2):** [AUTH-1247](#evidence-sprint-auth) waiting on cron job review, [INFRA-445](#evidence-sprint-infra) waiting on DevOps capacity for Terraform changes.',
    sourceCounts: { github: 1, sentry: 0, slack: 0, linear: 3 },
    evidence: [
      {
        id: "sprint-search",
        source: "linear",
        title: "SEARCH-201: relevance scoring v2",
        excerpt:
          "Assigned to @alex.kim. 70% complete. Remaining: A/B test setup and metrics dashboard. Due end of sprint.",
        author: "@alex.kim",
        when: "Sprint 24",
        meta: "70% · In Progress",
      },
      {
        id: "sprint-plat",
        source: "linear",
        title: "PLAT-310: user service performance",
        excerpt:
          "Assigned to @mike.torres. Optimizing N+1 queries in user profile endpoint. P99 latency target: < 200ms (currently 680ms).",
        author: "@mike.torres",
        when: "Sprint 24",
        meta: "In Progress · perf target: 200ms",
      },
      {
        id: "sprint-auth",
        source: "linear",
        title: "AUTH-1247: blocked on cron review",
        excerpt:
          "Fix for Tuesday auth failures. Blocked by: need cron job owner to review token rotation changes. No cron owner assigned.",
        author: "@priya",
        when: "Sprint 24",
        meta: "Blocked · no cron owner",
      },
      {
        id: "sprint-infra",
        source: "linear",
        title: "INFRA-445: Terraform review gate",
        excerpt:
          "Add Terraform plan review step to CI pipeline (post-mortem action item from March 15 outage). Blocked on DevOps capacity.",
        author: "@ops-lead",
        when: "Sprint 24",
        meta: "Blocked · DevOps dependency",
      },
      {
        id: "sprint-prs",
        source: "github",
        title: "Sprint 24 PR activity",
        excerpt:
          "14 PRs merged, 3 open. Largest: SEARCH-201 relevance changes (+847 -123). Smallest: config fix (+2 -2).",
        author: "DevMemory",
        when: "this sprint",
        meta: "14 merged · 3 open",
      },
    ],
  },
};

export function matchDemoScenario(query: string): DemoScenario | null {
  const q = query.toLowerCase();

  if (q.includes("auth") || q.includes("login") || q.includes("tuesday") || q.includes("token") || q.includes("mfa"))
    return SCENARIOS.auth;
  if (q.includes("deploy") || q.includes("friday") || q.includes("ship"))
    return SCENARIOS.deploy;
  if (q.includes("who") || q.includes("expert") || q.includes("context") || q.includes("search") || q.includes("knows"))
    return SCENARIOS.expertise;
  if (q.includes("risk") || q.includes("dangerous") || q.includes("stale") || q.includes("error-prone") || q.includes("riskiest"))
    return SCENARIOS.risk;
  if (q.includes("this week") || q.includes("recent") || q.includes("summary") || q.includes("update") || q.includes("activity"))
    return SCENARIOS.recent;
  if (q.includes("outage") || q.includes("march 15") || q.includes("incident") || q.includes("downtime") || q.includes("redis"))
    return SCENARIOS.outage;
  if (q.includes("tech debt") || q.includes("technical debt") || q.includes("tackle") || q.includes("cleanup") || q.includes("refactor"))
    return SCENARIOS.techdebt;
  if (q.includes("onboard") || q.includes("new engineer") || q.includes("joining") || q.includes("ramp up") || q.includes("getting started"))
    return SCENARIOS.onboarding;
  if (q.includes("billing") || q.includes("charge") || q.includes("subscription") || q.includes("invoice"))
    return SCENARIOS.billing;
  if (q.includes("pr #847") || q.includes("pr 847") || q.includes("pull request") || q.includes("mfa pr") || q.includes("that pr"))
    return SCENARIOS.pr847;
  if (q.includes("sarah") || q.includes("chen"))
    return SCENARIOS.sarah;
  if (q.includes("fix") || q.includes("solve") || q.includes("resolve") || q.includes("how do we") || q.includes("what should we do") || q.includes("remediat"))
    return SCENARIOS.fix;
  if (q.includes("sprint") || q.includes("blocked") || q.includes("progress") || q.includes("what's left") || q.includes("remaining"))
    return SCENARIOS.sprint;
  if (q.includes("payment") || q.includes("deploy"))
    return SCENARIOS.deploy;

  return null;
}
