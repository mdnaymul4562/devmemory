import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env"), override: true });

import { createFileRoute } from "@tanstack/react-router";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { matchDemoScenario } from "@/lib/demo-data";
import { executeCoralQuery, isCoralAvailable, getCoralSchema } from "@/lib/coral";

const EvidenceSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  excerpt: z.string(),
  author: z.string(),
  when: z.string(),
  meta: z.string(),
});

const ResponseSchema = z.object({
  answer: z
    .string()
    .describe(
      "2-4 sentence narrative. Use **bold** for key facts. Reference evidence with [label](#evidence-id)."
    ),
  evidence: z.array(EvidenceSchema),
  sourceCounts: z.record(z.string(), z.number()),
  coralQueries: z
    .array(
      z.object({
        sql: z.string().describe("The Coral SQL query"),
        purpose: z.string().describe("What this query retrieves"),
      })
    )
    .describe("Coral SQL queries with cross-source JOINs used to retrieve data"),
});

const SYSTEM_PROMPT = `You are DevMemory, an AI agent that answers questions about engineering teams by querying multiple data sources through Coral SQL.

You have access to these REAL connected sources via Coral:
- github.* (issues, pulls, commits, org_repos, etc.) - code activity
- claude.events - local Claude Code session data
- hn.* (search, front_page, show_hn, ask_hn, jobs) - Hacker News discussions
- crates_io.* (crates, categories, crate_versions) - Rust package registry
- remotive.jobs - remote job listings

IMPORTANT RULES FOR CORAL SQL:
- GitHub tables require WHERE owner = '...' AND repo = '...' for issues, pulls, commits
- HN search requires WHERE query = '...' AND tags = 'story' (or 'comment')
- Use LIMIT to avoid huge result sets
- Cross-source JOINs work: you can JOIN github.issues with hn.search in one query
- All queries run locally through Coral, no data leaves the machine

Return structured JSON with:
- answer: narrative synthesis with **bold** and [citation](#evidence-id) links
- evidence: items from the query results, each with id, source, title, excerpt, author, when, meta
- sourceCounts: how many items per source
- coralQueries: the actual SQL queries you would run, showing cross-source JOINs`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { question }: { question: string } = await request.json();

        const demoResult = matchDemoScenario(question);
        if (demoResult) {
          return jsonResponse({
            question,
            answer: demoResult.answer,
            evidence: demoResult.evidence,
            sourceCounts: demoResult.sourceCounts,
            coralQueries: demoResult.coralQueries || [],
            mode: "demo",
          });
        }

        const coralReady = await isCoralAvailable();
        if (coralReady) {
          return await handleWithCoral(question);
        }

        return await handleWithLLM(question);
      },
    },
  },
});

async function handleWithCoral(question: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "OPENROUTER_API_KEY not set" }, 500);
  }

  const schema = await getCoralSchema();
  const schemaStr = schema
    .map((t) => `${t.schema_name}.${t.table_name}`)
    .join(", ");

  try {
    const openrouter = createOpenRouter({ apiKey });

    const { object: plan } = await generateObject({
      model: openrouter(process.env.LLM_MODEL || "google/gemini-2.5-flash"),
      system: `You generate Coral SQL queries to answer engineering questions.

CONNECTED SOURCES AND KEY TABLES:

linear.issues: identifier, title, description, priority (0=None,1=Urgent,2=High,3=Medium,4=Low), priority_label, state_name, state_type, assignee_name, created_at, team_key='MUN', project_name, label_names, url
linear.teams: id, name, key
linear.users: id, name, email, displayName

sentry.issues: id, short_id, title, status, level (fatal|error|warning), count, user_count, first_seen, last_seen, project=4511479232659456
sentry.projects: id, slug='platform-api'

github.issues: number, title, state, created_at, user__login (needs WHERE owner='...' AND repo='...')
github.pulls: number, title, state, merged_at, user__login, additions, deletions (needs WHERE owner='...' AND repo='...')
github.commits: sha, message, author__login, date (needs WHERE owner='...' AND repo='...')
github.org_repos: name, stargazers_count, language (needs WHERE org='...')

notion.pages: id, created_time, last_edited_time, url
notion.search: id, title (use: WHERE query='...')

hn.search: title, url, author, points, num_comments (needs WHERE query='...' AND tags='story')
hn.front_page: title, url, points, num_comments

claude.events: timestamp, type, subtype, sessionId
crates_io.categories: id, category, crates_cnt

RULES:
- Use LIMIT 10 by default
- For sentry.issues always use WHERE project = 4511479232659456
- For linear.issues use WHERE team_key = 'MUN'
- Priority in Linear is a number: 1=Urgent, 2=High, 3=Medium
- Generate 1-3 queries that together answer the question
- Prefer cross-source JOINs when data from multiple sources is relevant
- Do NOT use functions like DAYOFWEEK, DATEPART, etc. Use simple comparisons`,
      prompt: question,
      schema: z.object({
        queries: z.array(
          z.object({
            sql: z.string(),
            purpose: z.string(),
          })
        ),
      }),
    });

    const queryResults = [];
    for (const q of plan.queries) {
      const result = await executeCoralQuery(q.sql);
      queryResults.push({
        ...q,
        rows: result.rows.slice(0, 20),
        columns: result.columns,
        executionTimeMs: result.executionTimeMs,
        cached: result.cached,
        error: result.error,
      });
    }

    const { object: response } = await generateObject({
      model: openrouter(process.env.LLM_MODEL || "deepseek/deepseek-v4-flash"),
      system: SYSTEM_PROMPT,
      prompt: `Question: "${question}"

Coral query results:
${JSON.stringify(queryResults, null, 2)}

Synthesize these real query results into a structured response. The evidence should come from the actual data returned.`,
      schema: ResponseSchema,
    });

    return jsonResponse({
      question,
      answer: response.answer,
      evidence: response.evidence,
      sourceCounts: response.sourceCounts,
      coralQueries: queryResults.map((q) => ({
        sql: q.sql,
        purpose: q.purpose,
        executionTimeMs: q.executionTimeMs,
        cached: q.cached,
        rowCount: q.rows.length,
        error: q.error,
      })),
      mode: "live",
    });
  } catch (err) {
    console.error("Coral+LLM error:", err);
    const demoResult = matchDemoScenario(question);
    if (demoResult) {
      return jsonResponse({
        question,
        answer: demoResult.answer,
        evidence: demoResult.evidence,
        sourceCounts: demoResult.sourceCounts,
        coralQueries: [],
        mode: "demo-fallback",
      });
    }
    return await handleWithLLM(question);
  }
}

async function handleWithLLM(question: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "OPENROUTER_API_KEY not set" }, 500);
  }

  try {
    const openrouter = createOpenRouter({ apiKey });
    const { object } = await generateObject({
      model: openrouter(process.env.LLM_MODEL || "deepseek/deepseek-v4-flash"),
      system: SYSTEM_PROMPT,
      prompt: question,
      schema: ResponseSchema,
    });

    return jsonResponse({
      question,
      answer: object.answer,
      evidence: object.evidence,
      sourceCounts: object.sourceCounts,
      coralQueries: object.coralQueries,
      mode: "llm",
    });
  } catch (err) {
    console.error("LLM error:", err);
    return jsonResponse({
      question,
      answer: "Unable to process this query. Try asking about GitHub issues, code history, or Hacker News discussions.",
      evidence: [],
      sourceCounts: {},
      coralQueries: [],
      mode: "error",
      error: String(err),
    });
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
