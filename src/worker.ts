export interface Env {
  DB?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  APP_VERSION?: string;
  CF_VERSION_METADATA?: {
    id: string;
    tag: string;
    timestamp: string;
  };
}

interface D1Record {
  table: string;
  recordId: string;
  data: any;
  updatedAt: string;
  deviceId: string;
  version: number;
  isDeleted?: boolean;
}

interface D1Image {
  imageId: string;
  dataUrl: string;
  deviceId: string;
  updatedAt: string;
}

// In-memory active devices and images (image persistence to R2 is out of scope for this sprint)
const memoryImages = new Map<string, D1Image>();
const activeDevices = new Set<string>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

async function getDb(env: Env) {
  if (!env || !env.DB) {
    throw new Error("[D1 Database Error]: Cloudflare D1 binding (env.DB) is not configured or unavailable.");
  }
  return env.DB;
}

let tableInitialized = false;
async function ensureD1Table(db: any) {
  if (tableInitialized) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS records (
      key TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT,
      updated_at TEXT NOT NULL,
      device_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )
  `).run();
  tableInitialized = true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    };

    // Worker API Routes
    if (path.startsWith("/api/")) {
      try {
        if (path === "/api/health") {
          const version = env?.APP_VERSION || "1.0.20";
          const cfMeta = env?.CF_VERSION_METADATA;
          return json({
            status: "ok",
            version,
            runtime: "cloudflare-workers",
            cfVersionId: cfMeta?.id || null,
            cfVersionTag: cfMeta?.tag || null,
            cfVersionTimestamp: cfMeta?.timestamp || null,
            timestamp: new Date().toISOString()
          });
        }

        if (path === "/api/sync" || path === "/api/sync/" || path === "/api/sync/status") {
          const db = await getDb(env);
          await ensureD1Table(db);

          if (request.method === "GET") {
            const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
            const serverRecordCount = Number(countRes?.total ?? 0);
            const version = env?.APP_VERSION || "1.0.20";
            const cfMeta = env?.CF_VERSION_METADATA;
            return json({
              status: "online",
              version,
              endpoint: path,
              runtime: "cloudflare-workers",
              serverRecordCount,
              serverTimestamp: new Date().toISOString(),
              cfVersionId: cfMeta?.id || null,
              cfVersionTag: cfMeta?.tag || null,
              cfVersionTimestamp: cfMeta?.timestamp || null
            });
          }

          if (request.method === "POST") {
            const body: any = await request.json().catch(() => ({}));
            const { deviceId, items } = body;
            if (!Array.isArray(items)) {
              return json({ error: "Invalid sync request format: items array required" }, 400);
            }

            if (deviceId) activeDevices.add(deviceId);

            let processedCount = 0;
            const nowIso = new Date().toISOString();

            for (const item of items) {
              if (!item.table || !item.recordId) continue;
              const key = `${item.table}:${item.recordId}`;
              const isDeleted = item.action === "delete" ? 1 : 0;
              const itemData = item.action === "delete" ? null : (typeof item.data === "string" ? item.data : JSON.stringify(item.data ?? null));
              const updatedAt = item.updatedAt || nowIso;
              const devId = item.deviceId || deviceId || "UNKNOWN";
              const version = item.version || Date.now();

              // Query existing record to check version/timestamp conflict
              const existing = await db.prepare("SELECT version, updated_at FROM records WHERE key = ?").bind(key).first();

              let shouldUpdate = true;
              if (existing) {
                const existingVer = Number(existing.version) || 0;
                const existingUpdated = String(existing.updated_at || "");
                if (version < existingVer && updatedAt < existingUpdated) {
                  shouldUpdate = false;
                }
              }

              if (shouldUpdate) {
                await db.prepare(
                  `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET
                     data = excluded.data,
                     updated_at = excluded.updated_at,
                     device_id = excluded.device_id,
                     version = excluded.version,
                     is_deleted = excluded.is_deleted`
                ).bind(key, item.table, item.recordId, itemData, updatedAt, devId, version, isDeleted).run();
                processedCount++;
              }
            }

            const totalRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
            const totalServerRecords = Number(totalRes?.total ?? 0);

            return json({
              success: true,
              processedCount,
              serverTimestamp: nowIso,
              totalServerRecords
            });
          }
        }

        if (path === "/api/changes") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const sinceParam = url.searchParams.get("since") || "0";
          const deviceIdParam = url.searchParams.get("deviceId") || "";

          if (deviceIdParam) activeDevices.add(deviceIdParam);

          const sinceTime = sinceParam === "0" ? 0 : (new Date(sinceParam).getTime() || 0);

          const { results } = await db.prepare(
            `SELECT key, table_name as "table", record_id as recordId, data, updated_at as updatedAt, device_id as deviceId, version, is_deleted as isDeleted FROM records`
          ).all();

          const changes: D1Record[] = [];
          for (const row of (results || [])) {
            let parsedData = null;
            if (row.data) {
              try {
                parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
              } catch {
                parsedData = row.data;
              }
            }

            const rec: D1Record = {
              table: row.table as string,
              recordId: row.recordId as string,
              data: parsedData,
              updatedAt: row.updatedAt as string,
              deviceId: row.deviceId as string,
              version: Number(row.version),
              isDeleted: Boolean(row.isDeleted)
            };

            const recordTime = new Date(rec.updatedAt).getTime() || rec.version || 0;
            if (sinceTime === 0) {
              if (!deviceIdParam || rec.deviceId !== deviceIdParam) {
                changes.push(rec);
              }
            } else {
              if (recordTime > sinceTime && (!deviceIdParam || rec.deviceId !== deviceIdParam)) {
                changes.push(rec);
              }
            }
          }

          const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
          const serverRecordCount = Number(countRes?.total ?? 0);

          return json({
            success: true,
            serverTimestamp: new Date().toISOString(),
            serverRecordCount,
            changes
          });
        }

        if (path === "/api/images") {
          if (request.method === "POST") {
            const body: any = await request.json().catch(() => ({}));
            const { imageId, dataUrl, deviceId } = body;
            if (!imageId || !dataUrl) {
              return json({ error: "imageId and dataUrl required" }, 400);
            }

            memoryImages.set(imageId, {
              imageId,
              dataUrl,
              deviceId: deviceId || "UNKNOWN",
              updatedAt: new Date().toISOString()
            });

            return json({ success: true, imageId });
          }
        }

        if (path.startsWith("/api/images/")) {
          const imageId = path.replace("/api/images/", "");
          const img = memoryImages.get(imageId);
          if (!img) {
            return json({ error: "Image not found in Cloud D1 replica" }, 404);
          }
          return json({ success: true, imageId: img.imageId, dataUrl: img.dataUrl });
        }

        if (path === "/api/record") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const body: any = await request.json().catch(() => ({}));
          const { table, recordId, deviceId, action } = body;
          if (!table || !recordId) {
            return json({ error: "table and recordId required" }, 400);
          }

          const key = `${table}:${recordId}`;
          const isDeleted = action === "delete" || request.method === "DELETE" ? 1 : 0;
          const updatedAt = new Date().toISOString();
          const devId = deviceId || "UNKNOWN";
          const version = Date.now();
          const recordData = isDeleted ? null : (typeof body.data === "string" ? body.data : JSON.stringify(body.data ?? null));

          await db.prepare(
            `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET
               data = excluded.data,
               updated_at = excluded.updated_at,
               device_id = excluded.device_id,
               version = excluded.version,
               is_deleted = excluded.is_deleted`
          ).bind(key, table, recordId, recordData, updatedAt, devId, version, isDeleted).run();

          return json({ success: true, table, recordId, isDeleted: Boolean(isDeleted) });
        }

        if (path === "/api/sync/status") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
          const serverRecordCount = Number(countRes?.total ?? 0);

          return json({
            status: "online",
            runtime: "cloudflare-workers",
            serverRecordCount,
            totalStoredImages: memoryImages.size,
            activeDevices: Array.from(activeDevices),
            serverTimestamp: new Date().toISOString()
          });
        }

        return json({ error: `API route not found: ${request.method} ${path}` }, 404);
      } catch (err: any) {
        console.error("[Worker API Error]:", err);
        return json({ error: err?.message || "Internal Worker D1 Error" }, 500);
      }
    }

    // Serve static frontend assets via env.ASSETS if available
    if (env && env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response("FSOS Cloudflare Worker Application Active", {
      headers: { "Content-Type": "text/html", ...corsHeaders }
    });
  }
};
