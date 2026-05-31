import "dotenv/config";
import { createFileRoute } from "@tanstack/react-router";
import { isCoralAvailable, getCoralSchema, getConnectedSources } from "@/lib/coral";

export const Route = createFileRoute("/api/schema")({
  server: {
    handlers: {
      GET: async () => {
        const available = await isCoralAvailable();

        if (!available) {
          return new Response(
            JSON.stringify({
              available: false,
              sources: [],
              tables: [],
              mode: "demo",
            }),
            { headers: { "content-type": "application/json" } }
          );
        }

        const [sources, tables] = await Promise.all([
          getConnectedSources(),
          getCoralSchema(),
        ]);

        const grouped: Record<string, string[]> = {};
        for (const t of tables) {
          if (!grouped[t.schema_name]) grouped[t.schema_name] = [];
          grouped[t.schema_name].push(t.table_name);
        }

        return new Response(
          JSON.stringify({
            available: true,
            sources,
            tables: grouped,
            totalTables: tables.length,
            mode: "live",
          }),
          { headers: { "content-type": "application/json" } }
        );
      },
    },
  },
});
