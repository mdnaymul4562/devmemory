import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CORAL_BIN = process.env.CORAL_BIN_PATH || `${process.env.HOME}/.local/bin/coral`;

export interface CoralQueryResult {
  columns: string[];
  rows: Record<string, string | number | null>[];
  rawOutput: string;
  query: string;
  executionTimeMs: number;
  cached: boolean;
  error?: string;
}

export async function isCoralAvailable(): Promise<boolean> {
  try {
    await execAsync(`${CORAL_BIN} --version`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function executeCoralQuery(
  sql: string
): Promise<CoralQueryResult> {
  const cleanSql = sql.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  const start = Date.now();

  try {
    const { stdout, stderr } = await execAsync(
      `${CORAL_BIN} sql "${cleanSql.replace(/"/g, '\\"')}" --format json`,
      { timeout: 30000, maxBuffer: 1024 * 1024 * 10 }
    );

    const executionTimeMs = Date.now() - start;
    const cached = executionTimeMs < 200;

    if (stderr && !stdout) {
      return {
        columns: [],
        rows: [],
        rawOutput: stderr,
        query: cleanSql,
        executionTimeMs,
        cached: false,
        error: stderr.split("\n").find((l) => l.startsWith("Error:")) || stderr,
      };
    }

    try {
      const parsed = JSON.parse(stdout);
      const rows = Array.isArray(parsed) ? parsed : parsed.rows || [];
      const columns =
        rows.length > 0 ? Object.keys(rows[0]) : parsed.columns || [];

      return { columns, rows, rawOutput: stdout, query: cleanSql, executionTimeMs, cached };
    } catch {
      return {
        columns: [],
        rows: [],
        rawOutput: stdout,
        query: cleanSql,
        executionTimeMs,
        cached: false,
      };
    }
  } catch (err: unknown) {
    const executionTimeMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const errorLine = message.split("\n").find((l) => l.includes("Error:")) || message;
    return {
      columns: [],
      rows: [],
      rawOutput: "",
      query: cleanSql,
      executionTimeMs,
      cached: false,
      error: errorLine,
    };
  }
}

export async function getCoralSchema(): Promise<
  { schema_name: string; table_name: string }[]
> {
  const result = await executeCoralQuery(
    "SELECT schema_name, table_name FROM coral.tables ORDER BY 1, 2"
  );
  return result.rows as { schema_name: string; table_name: string }[];
}

export async function getConnectedSources(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`${CORAL_BIN} source list --format json`, {
      timeout: 10000,
    });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed.map((s: { name: string }) => s.name) : [];
  } catch {
    try {
      const { stdout } = await execAsync(`${CORAL_BIN} source list`, {
        timeout: 10000,
      });
      return stdout
        .trim()
        .split("\n")
        .slice(2)
        .map((l) => l.split(/\s+/)[0])
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}
