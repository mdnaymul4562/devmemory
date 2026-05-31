import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, CornerDownLeft, ExternalLink } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevMemory - your engineering team never forgets" },
      {
        name: "description",
        content:
          "Ask any question about your engineering history. DevMemory unifies GitHub, Sentry, Slack and Linear into one evidence-backed answer.",
      },
    ],
  }),
  component: DevMemoryApp,
});

type SourceKey = string;

const SOURCES: Record<string, { label: string; color: string; desc: string }> = {
  github: { label: "GitHub", color: "var(--color-github)", desc: "code repository" },
  sentry: { label: "Sentry", color: "var(--color-sentry)", desc: "error tracking" },
  linear: { label: "Linear", color: "var(--color-linear)", desc: "issue tracking" },
  notion: { label: "Notion", color: "oklch(0.45 0 0)", desc: "documentation" },
  claude: { label: "Claude", color: "oklch(0.6 0.14 35)", desc: "session history" },
  hn: { label: "Hacker News", color: "oklch(0.6 0.12 50)", desc: "tech discussions" },
  crates_io: { label: "Crates.io", color: "oklch(0.55 0.1 40)", desc: "Rust packages" },
  remotive: { label: "Remotive", color: "oklch(0.55 0.1 150)", desc: "remote jobs" },
  codex: { label: "Codex", color: "oklch(0.5 0.1 280)", desc: "code sessions" },
  slack: { label: "Slack", color: "var(--color-slack)", desc: "team chat" },
  jira: { label: "Jira", color: "oklch(0.55 0.15 250)", desc: "project tracking" },
  datadog: { label: "Datadog", color: "var(--color-linear)", desc: "monitoring" },
  pagerduty: { label: "PagerDuty", color: "oklch(0.55 0.12 150)", desc: "on-call alerts" },
  grafana: { label: "Grafana", color: "oklch(0.6 0.13 50)", desc: "dashboards" },
  confluence: { label: "Confluence", color: "oklch(0.55 0.15 250)", desc: "team wiki" },
  stripe: { label: "Stripe", color: "oklch(0.55 0.15 280)", desc: "payments" },
};

const HEADER_KEYS = ["github", "sentry", "linear", "notion", "hn", "claude"];

const EXAMPLE_QUERIES = [
  "Why does auth fail on Tuesdays?",
  "What happened last time we deployed on a Friday?",
  "Who has the most context about our search infrastructure?",
  "Riskiest files in our codebase right now",
  "What led to the March 15th outage?",
  "Summary of this week's engineering activity",
];

type Evidence = {
  id: string;
  source: SourceKey;
  title: string;
  excerpt: string;
  author: string;
  when: string;
  meta: string;
  href?: string;
};

interface ChatResponse {
  question: string;
  answer: string;
  evidence: Evidence[];
  sourceCounts: Record<SourceKey, number>;
  coralQuery: string;
  error?: string;
}

type LoadingStep = {
  label: string;
  activeSource?: SourceKey;
};

const LOADING_STEPS: LoadingStep[] = [
  { label: "Generating Coral SQL…" },
  { label: "Querying GitHub…", activeSource: "github" },
  { label: "Scanning Sentry errors…", activeSource: "sentry" },
  { label: "Joining Linear issues…", activeSource: "linear" },
  { label: "Searching Notion docs…", activeSource: "notion" },
  { label: "Reading Claude sessions…", activeSource: "claude" },
  { label: "Checking Hacker News…", activeSource: "hn" },
  { label: "Browsing Crates.io…", activeSource: "crates_io" },
  { label: "Scanning Remotive jobs…", activeSource: "remotive" },
  { label: "Cross-referencing across 9 sources…" },
  { label: "Synthesizing evidence-backed answer…" },
];

interface SchemaInfo {
  available: boolean;
  sources: string[];
  tables: Record<string, string[]>;
  totalTables: number;
  mode: string;
}

function DevMemoryApp() {
  const [query, setQuery] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/schema")
      .then((r) => r.json())
      .then((d) => setSchema(d))
      .catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  const submit = async (q: string) => {
    const v = q.trim();
    if (!v || loading) return;
    setQuery("");
    setPendingQuestion(v);
    setLoading(true);
    setLoadingStepIndex(0);
    scrollToBottom();

    const fetchPromise = fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: v }),
    }).then((res) => res.json());

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 350);

    const minimumDelay = new Promise((r) => setTimeout(r, 3500));

    try {
      const [data] = await Promise.all([fetchPromise, minimumDelay]);
      clearInterval(stepInterval);
      setHistory((prev) => [...prev, data as ChatResponse]);
      setPendingQuestion(null);
      scrollToBottom();
    } catch (err) {
      clearInterval(stepInterval);
      setHistory((prev) => [
        ...prev,
        {
          question: v,
          answer: "Failed to query. Check your connection and try again.",
          evidence: [],
          sourceCounts: { github: 0, sentry: 0, slack: 0, linear: 0 },
          coralQuery: "",
          error: String(err),
        },
      ]);
      setPendingQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    setQuery("");
    setPendingQuestion(null);
    setHistory([]);
    setHighlightId(null);
  };

  const focusEvidence = useCallback((id: string) => {
    const el = document.getElementById(`evidence-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    window.setTimeout(
      () => setHighlightId((cur) => (cur === id ? null : cur)),
      1800
    );
  }, []);

  const hasHistory = history.length > 0 || loading;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Header onHome={goHome} />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-28">
          <div className="mx-auto max-w-[760px] px-6 pt-4">
            {!hasHistory && <EmptyState onPick={submit} schema={schema} />}

            {history.map((resp, i) => (
              <div key={i} className={i > 0 ? "mt-10 border-t border-border pt-8" : ""}>
                <PopulatedState
                  question={resp.question}
                  answer={resp.answer}
                  evidence={resp.evidence}
                  sourceCounts={resp.sourceCounts}
                  coralQueries={resp.coralQueries || (resp.coralQuery ? [{sql: resp.coralQuery, purpose: "Query"}] : [])}
                  mode={resp.mode || "demo"}
                  highlightId={highlightId}
                  onCite={focusEvidence}
                />
              </div>
            ))}

            {loading && pendingQuestion && (
              <div className={history.length > 0 ? "mt-10 border-t border-border pt-8" : ""}>
                <LoadingState query={pendingQuestion} stepIndex={loadingStepIndex} />
              </div>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5 pt-3 bg-gradient-to-t from-background via-background to-transparent">
          <div className="mx-auto max-w-[760px]">
            <CommandBar
              value={query}
              onChange={setQuery}
              onSubmit={() => submit(query)}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-6 px-6 pt-5 pb-3">
      <button
        type="button"
        onClick={onHome}
        className="group flex items-baseline gap-3 text-left"
        aria-label="Back to home"
      >
        <h1 className="font-hand text-[34px] leading-none tracking-tight text-ink transition-colors group-hover:text-[var(--accent-coral)]">
          DevMemory
        </h1>
        <span className="font-serif-display italic text-[15px] text-ink-soft">
          "your engineering team never forgets"
        </span>
      </button>

      <div className="flex items-center gap-1.5">
        {HEADER_KEYS.map((key) => {
          const s = SOURCES[key];
          return (
            <span
              key={key}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-ink-soft"
            >
              <BrandIcon brand={key} size={12} />
              {s?.label || key}
            </span>
          );
        })}
        <span className="text-[11px] text-ink-faint ml-1">
          +95 more
        </span>
      </div>

      <div className="font-hand text-[19px] text-ink-faint">
        powered by{" "}
        <span className="font-hand text-[22px] text-[var(--accent-coral)]">
          Coral
        </span>
      </div>
    </header>
  );
}

/* ---------------- Empty state ---------------- */

const CARD_KEYS = ["github", "sentry", "linear", "notion", "claude", "hn", "crates_io", "remotive"];

function EmptyState({ onPick, schema }: { onPick: (q: string) => void; schema: SchemaInfo | null }) {
  return (
    <div className="flex flex-col items-center pt-8">
      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="font-serif-display italic text-[15px] text-[var(--accent-coral)]">
          Organizational engineering memory
        </div>
        <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-ink">
          Ask anything about your team's{" "}
          <span className="hand-underline font-hand text-[36px]">
            engineering history
          </span>
          .
        </h2>
        <p className="mt-4 max-w-lg mx-auto text-[15px] leading-relaxed text-ink-soft">
          DevMemory unifies GitHub, Sentry, Slack, and Linear into one
          queryable memory. Every answer is an evidence-backed narrative,
          not a data dump.
        </p>
      </motion.div>

      {/* Convergence diagram with all sources */}
      <div className="mt-6 w-full">
        <ConvergenceDiagram />
      </div>

      {/* Example queries */}
      <div className="mt-2 w-full">
        <div className="font-hand text-[16px] text-ink-faint mb-3">
          Try a memory query
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EXAMPLE_QUERIES.map((q, i) => (
            <motion.button
              key={q}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.35 }}
              onClick={() => onPick(q)}
              className="group flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3 text-left text-[14px] text-ink transition-colors hover:border-ink/40 hover:bg-card"
            >
              <span className="font-serif-display italic text-[15px] text-ink-soft group-hover:text-ink">
                "{q}"
              </span>
              <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConvergenceDiagram() {
  const nodes: { key: string; cx: number; cy: number }[] = [
    { key: "github", cx: 40, cy: 38 },
    { key: "sentry", cx: 160, cy: 28 },
    { key: "linear", cx: 280, cy: 38 },
    { key: "notion", cx: 400, cy: 28 },
    { key: "hn", cx: 520, cy: 38 },
    { key: "claude", cx: 90, cy: 88 },
    { key: "crates_io", cx: 220, cy: 93 },
    { key: "remotive", cx: 370, cy: 93 },
    { key: "codex", cx: 500, cy: 88 },
  ];
  const uniqueNodes = nodes;
  const targetX = 315;
  const targetY = 175;

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 630 220"
        className="mx-auto block h-[200px] w-full max-w-[630px]"
      >
        {uniqueNodes.map((n, i) => {
          const color = SOURCES[n.key]?.color || "var(--ink-faint)";
          return (
            <motion.path
              key={`line-${n.key}`}
              d={`M ${n.cx} ${n.cy + 18} Q ${(n.cx + targetX) / 2} ${n.cy + 50 + (i % 3) * 8}, ${targetX} ${targetY - 8}`}
              fill="none"
              stroke={color}
              strokeWidth={1.2}
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: "easeOut" }}
            />
          );
        })}

        {uniqueNodes.map((n, i) => {
          const color = SOURCES[n.key]?.color || "var(--ink-faint)";
          return (
            <motion.g
              key={`node-${n.key}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <circle cx={n.cx} cy={n.cy} r={15} fill="var(--card)" stroke={color} strokeWidth={1.3} />
              <foreignObject x={n.cx - 9} y={n.cy - 9} width={18} height={18}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color }}>
                  <BrandIcon brand={n.key} size={14} />
                </div>
              </foreignObject>
              <text x={n.cx} y={n.cy + 28} textAnchor="middle" className="fill-[var(--ink-faint)]" style={{ fontFamily: "var(--font-hand)", fontSize: 13 }}>
                {SOURCES[n.key]?.label || n.key}
              </text>
            </motion.g>
          );
        })}

        <motion.g
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.35 }}
        >
          <rect x={targetX - 100} y={targetY - 8} width={200} height={48} rx={8} fill="var(--card)" stroke="var(--rule)" />
          <rect x={targetX - 80} y={targetY + 6} width={120} height={5} rx={2.5} fill="var(--rule)" />
          <rect x={targetX - 80} y={targetY + 16} width={95} height={5} rx={2.5} fill="var(--rule)" opacity={0.6} />
          <text x={targetX} y={targetY + 36} textAnchor="middle" fill="var(--accent-coral)" style={{ fontFamily: "var(--font-hand)", fontSize: 14 }}>
            one answer
          </text>
        </motion.g>
      </svg>
    </div>
  );
}

/* ---------------- Loading ---------------- */

function LoadingState({ query, stepIndex }: { query: string; stepIndex: number }) {
  return (
    <div className="mx-auto flex h-full max-w-[720px] flex-col items-center justify-center text-center">
      <div className="font-serif-display italic text-[20px] text-ink-soft">
        "{query}"
      </div>

      <div className="mt-8 flex items-center gap-3">
        {LOADING_STEPS.filter((st) => st.activeSource).map((st, i) => {
          const key = st.activeSource!;
          const s = { key, color: SOURCES[key]?.color || "var(--ink-faint)" };
          const step = LOADING_STEPS[stepIndex];
          const isActive = step?.activeSource === key;
          const isPast = LOADING_STEPS.slice(0, stepIndex).some(
            (ls) => ls.activeSource === key
          );
          return (
            <motion.div
              key={s.key}
              className="flex flex-col items-center gap-2"
              animate={{
                opacity: isActive ? 1 : isPast ? 0.8 : 0.3,
                scale: isActive ? 1.15 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
                style={{
                  borderColor: isActive || isPast ? s.color : "var(--rule)",
                  background: isActive
                    ? `color-mix(in oklab, ${s.color} 12%, transparent)`
                    : "var(--card)",
                }}
              >
                <span style={{ color: isActive || isPast ? s.color : "var(--ink-faint)" }}>
                  <BrandIcon brand={s.key} size={18} />
                </span>
              </div>
              {isPast && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-medium"
                  style={{ color: s.color }}
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="font-hand text-[18px] text-ink"
          >
            {LOADING_STEPS[stepIndex]?.label}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-rule/50">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--accent-coral)" }}
          animate={{ width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ---------------- Populated ---------------- */

function PopulatedState({
  question,
  answer,
  evidence,
  sourceCounts,
  coralQueries,
  mode,
  highlightId,
  onCite,
}: {
  question: string;
  answer: string;
  evidence: Evidence[];
  sourceCounts: Record<string, number>;
  coralQueries: { sql: string; purpose: string; executionTimeMs?: number; cached?: boolean; rowCount?: number }[];
  mode: string;
  highlightId: string | null;
  onCite: (id: string) => void;
}) {
  const [showQuery, setShowQuery] = useState(false);

  return (
    <div className="pt-6">
      <div className="font-hand text-[16px] text-ink-faint">you asked</div>
      <h2 className="font-serif-display text-[26px] italic leading-tight text-ink">
        "{question}"
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-5 text-[15.5px] leading-relaxed text-ink"
      >
        <AnswerWithCitations text={answer} onCite={onCite} />
      </motion.div>

      {evidence.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border/70 py-2.5 text-[12.5px] text-ink-soft">
            <span className="font-hand text-[15px] text-ink">
              {Object.values(sourceCounts).filter((c) => c > 0).length} sources
              queried · {evidence.length} evidence items
            </span>
            <span className="text-ink-faint">·</span>
            {Object.entries(sourceCounts)
              .filter(([, count]) => count > 0)
              .map(([key, count]) => {
                const src = SOURCES[key];
                return (
                  <span key={key} className="flex items-center gap-1.5">
                    <span
                      className="flex h-3.5 w-3.5 items-center justify-center"
                      style={{ color: src?.color || "var(--ink-faint)" }}
                    >
                      <BrandIcon brand={key} size={12} />
                    </span>
                    {src?.label || key} ({count})
                  </span>
                );
              })}
            {coralQueries.length > 0 && (
              <>
                <span className="text-ink-faint">·</span>
                <button
                  onClick={() => setShowQuery(!showQuery)}
                  className="font-hand text-[14px] text-[var(--accent-coral)] hover:underline"
                >
                  {showQuery ? "hide" : "show"} coral {coralQueries.length === 1 ? "query" : `${coralQueries.length} queries`}
                </button>
              </>
            )}
            {mode === "live" && (
              <span className="flex items-center gap-1 text-[11px] text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                live
              </span>
            )}
          </div>

          {showQuery && coralQueries.length > 0 && (
            <div className="mt-2 space-y-2">
              {coralQueries.map((q, qi) => (
                <div key={qi} className="rounded-lg border border-border bg-paper-soft px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-ink-soft">{q.purpose}</span>
                    <div className="flex items-center gap-2 text-[10px] text-ink-faint">
                      {q.executionTimeMs != null && <span>{q.executionTimeMs}ms</span>}
                      {q.cached && <span className="text-green-600">cached</span>}
                      {q.rowCount != null && <span>{q.rowCount} rows</span>}
                    </div>
                  </div>
                  <pre className="overflow-x-auto text-[12px] leading-relaxed text-ink-soft">
                    <code>{q.sql}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="relative mt-6 pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <AnimatePresence>
              {evidence.map((e, i) => (
                <EvidenceCard
                  key={e.id}
                  e={e}
                  index={i}
                  highlighted={highlightId === e.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceCard({
  e,
  index,
  highlighted,
}: {
  e: Evidence;
  index: number;
  highlighted: boolean;
}) {
  const color = `var(--color-${e.source})`;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.015)" },
          { transform: "scale(1)" },
        ],
        { duration: 600, easing: "ease-out" }
      );
    }
  }, [highlighted]);

  return (
    <motion.div
      id={`evidence-${e.id}`}
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.1, duration: 0.4 }}
      className="relative mb-3 scroll-mt-6"
      style={{
        boxShadow: highlighted
          ? `0 0 0 2px var(--accent-coral), 0 8px 24px -10px color-mix(in oklab, var(--accent-coral) 40%, transparent)`
          : undefined,
        borderRadius: 14,
        transition: "box-shadow 250ms ease",
      }}
    >
      <span
        className="absolute -left-[22px] top-3 h-3 w-3 rounded-full ring-4 ring-[var(--card)]"
        style={{ background: color }}
      />
      <div className="paper-card px-4 py-3">
        <div className="flex items-center gap-2 text-[12px]">
          <span
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-medium uppercase tracking-wide"
            style={{
              background: `color-mix(in oklab, ${color} 16%, transparent)`,
              color,
            }}
          >
            <BrandIcon brand={e.source} size={11} />
            {e.source}
          </span>
          <span className="text-ink-faint">{e.when}</span>
          <span className="ml-auto text-ink-faint">{e.meta}</span>
        </div>
        <div className="mt-1.5 text-[14.5px] font-semibold text-ink">
          {e.title}
        </div>
        <div className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
          {e.excerpt}
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-ink-faint">
          <span>{e.author}</span>
          {e.href ? (
            <a
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-ink"
            >
              open <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="flex items-center gap-1 opacity-40">
              open <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Command bar ---------------- */

function CommandBar({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="paper-card flex items-center gap-3 px-4 py-3"
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            background: loading ? "var(--accent-coral)" : "var(--ink-faint)",
            animation: loading
              ? "pulse-dot 1.2s ease-in-out infinite"
              : undefined,
          }}
        />
        <input
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          placeholder="Ask anything about your engineering history…"
          className="flex-1 bg-transparent text-[15px] font-serif-display italic text-ink outline-none placeholder:text-ink-faint"
          disabled={loading}
        />
        <span className="hidden items-center gap-1 text-[12px] text-ink-faint sm:flex">
          <kbd className="rounded border border-border bg-paper-soft px-1.5 py-0.5 font-sans text-[11px]">
            ↵
          </kbd>
          to query
        </span>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-paper transition-opacity disabled:opacity-40"
          aria-label="Ask"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
  );
}

/* ---------------- Answer with clickable citations ---------------- */

function AnswerWithCitations({
  text,
  onCite,
}: {
  text: string;
  onCite: (id: string) => void;
}) {
  const paragraphs = text.split(/\n\n/);

  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={pi > 0 ? "mt-3" : ""}>
          {parseInline(para, onCite)}
        </p>
      ))}
    </>
  );
}

function parseInline(
  text: string,
  onCite: (id: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\[.*?\]\(#evidence-.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>
          {renderLineBreaks(text.slice(lastIndex, match.index))}
        </span>
      );
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(
        <strong key={`b-${match.index}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(#evidence-([^)]+)\)/);
      if (linkMatch) {
        const [, label, evidenceId] = linkMatch;
        parts.push(
          <button
            key={`c-${match.index}`}
            type="button"
            onClick={() => {
              onCite(evidenceId);
              const el = document.getElementById(`evidence-${evidenceId}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="hand-underline font-medium text-ink transition-colors hover:text-[var(--accent-coral)]"
          >
            {label}
          </button>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-${lastIndex}`}>
        {renderLineBreaks(text.slice(lastIndex))}
      </span>
    );
  }

  return parts;
}

function renderLineBreaks(text: string): React.ReactNode[] {
  return text.split("\n").flatMap((line, i, arr) =>
    i < arr.length - 1 ? [line, <br key={`br-${i}`} />] : [line]
  );
}
