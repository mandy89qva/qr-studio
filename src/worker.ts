import { neon } from "@neondatabase/serverless";

interface Env {
  ASSETS: Fetcher;
  DATABASE_URL?: string;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      let response: Response;

      if (url.pathname === "/api/health" && request.method === "GET") {
        if (!env.DATABASE_URL) {
          response = json({
            status: "degraded",
            database: "not_configured",
          }, 503);
        } else {
          try {
            const sql = neon(env.DATABASE_URL);
            await sql`SELECT 1 AS connected`;

            response = json({
              status: "ok",
              service: "QR Studio API",
              database: "connected",
            });
          } catch {
            response = json({
              status: "degraded",
              database: "unavailable",
            }, 503);
          }
        }
      } else {
        response = json(
          { error: "Endpoint no disponible todavía." },
          404
        );
      }

      const headers = new Headers(response.headers);

      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};