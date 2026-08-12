import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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

// Simulated Cloudflare D1 replica storage
const d1Database = new Map<string, D1Record>();
const d1Images = new Map<string, D1Image>();
const activeDevices = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Enable CORS & handle OPTIONS preflight to prevent 405 Method Not Allowed & cross-device errors
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Worker API: Bulk Sync Upload & Status (POST & GET /api/sync)
  app.all(["/api/sync", "/api/sync/"], (req, res) => {
    try {
      if (req.method === "GET") {
        return res.json({
          status: "online",
          endpoint: "/api/sync",
          serverRecordCount: d1Database.size,
          serverTimestamp: new Date().toISOString()
        });
      }

      const { deviceId, items } = req.body || {};
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid sync request format: items array required" });
      }

      if (deviceId) {
        activeDevices.add(deviceId);
      }

      let processedCount = 0;
      const nowIso = new Date().toISOString();

      items.forEach((item: any) => {
        if (!item.table || !item.recordId) return;

        const key = `${item.table}:${item.recordId}`;
        const existing = d1Database.get(key);

        // Conflict handling: Latest timestamp / version wins
        if (!existing || (item.version && item.version >= existing.version) || item.updatedAt >= existing.updatedAt) {
          d1Database.set(key, {
            table: item.table,
            recordId: item.recordId,
            data: item.action === "delete" ? null : item.data,
            updatedAt: item.updatedAt || nowIso,
            deviceId: item.deviceId || deviceId || "UNKNOWN",
            version: item.version || Date.now(),
            isDeleted: item.action === "delete"
          });
          processedCount++;
        }
      });

      return res.json({
        success: true,
        processedCount,
        serverTimestamp: nowIso,
        totalServerRecords: d1Database.size
      });
    } catch (err: any) {
      console.error("[Worker API /api/sync Error]:", err);
      return res.status(500).json({ error: err?.message || "Sync execution failed" });
    }
  });

  // 2. Worker API: Cross-Device Changes Download (GET /api/changes)
  app.get("/api/changes", (req, res) => {
    try {
      const sinceParam = (req.query.since as string) || "0";
      const deviceIdParam = (req.query.deviceId as string) || "";

      if (deviceIdParam) {
        activeDevices.add(deviceIdParam);
      }

      const sinceTime = sinceParam === "0" ? 0 : (new Date(sinceParam).getTime() || 0);
      const changes: D1Record[] = [];

      d1Database.forEach((rec) => {
        const recordTime = new Date(rec.updatedAt).getTime() || rec.version || 0;
        // If since === 0, fetch ALL active non-deleted records to hydrate device
        if (sinceTime === 0) {
          if (!rec.isDeleted) {
            changes.push(rec);
          }
        } else {
          // Incremental updates: return records updated after sinceTime from OTHER devices
          if (recordTime > sinceTime && (!deviceIdParam || rec.deviceId !== deviceIdParam)) {
            changes.push(rec);
          }
        }
      });

      res.json({
        success: true,
        serverTimestamp: new Date().toISOString(),
        serverRecordCount: d1Database.size,
        changes
      });
    } catch (err: any) {
      console.error("[Worker API /api/changes Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to fetch cloud changes" });
    }
  });

  // 3. Worker API: Separate Image Persistence (POST /api/images)
  app.post("/api/images", (req, res) => {
    try {
      const { imageId, dataUrl, deviceId } = req.body || {};
      if (!imageId || !dataUrl) {
        return res.status(400).json({ error: "imageId and dataUrl required" });
      }

      d1Images.set(imageId, {
        imageId,
        dataUrl,
        deviceId: deviceId || "UNKNOWN",
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, imageId });
    } catch (err: any) {
      console.error("[Worker API /api/images Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to persist image" });
    }
  });

  // 4. Worker API: Fetch Image Payload (GET /api/images/:imageId)
  app.get("/api/images/:imageId", (req, res) => {
    const { imageId } = req.params;
    const img = d1Images.get(imageId);
    if (!img) {
      return res.status(404).json({ error: "Image not found in Cloud D1 replica" });
    }
    res.json({ success: true, imageId: img.imageId, dataUrl: img.dataUrl });
  });

  // 5. Worker API: Record Deletion / Mutation (Supports ALL methods: DELETE, POST, etc.)
  app.all("/api/record", (req, res) => {
    try {
      const { table, recordId, deviceId, action } = req.body || {};
      if (!table || !recordId) {
        return res.status(400).json({ error: "table and recordId required" });
      }

      const key = `${table}:${recordId}`;
      const isDeleted = action === "delete" || req.method === "DELETE";

      d1Database.set(key, {
        table,
        recordId,
        data: isDeleted ? null : req.body.data,
        updatedAt: new Date().toISOString(),
        deviceId: deviceId || "UNKNOWN",
        version: Date.now(),
        isDeleted
      });

      res.json({ success: true, table, recordId, isDeleted });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to process record" });
    }
  });

  // 6. Worker API: Status & Device Telemetry (GET /api/sync/status)
  app.get("/api/sync/status", (req, res) => {
    res.json({
      status: "online",
      serverRecordCount: d1Database.size,
      totalStoredImages: d1Images.size,
      activeDevices: Array.from(activeDevices),
      serverTimestamp: new Date().toISOString()
    });
  });

  // 7. AI Finding Assistance (POST /api/generate-finding)
  app.post("/api/generate-finding", express.json(), async (req, res) => {
    try {
      const { component, conditions, actionRecommendation, engineerNote } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Convert these optical/mechanical laser inspection facts into a professional technical report summary (1-2 clear sentences).
Facts:
- Component: ${component || 'Not specified'}
- Observed Damage/Conditions: ${Array.isArray(conditions) ? conditions.join(', ') : 'None'}
- Action / Recommendation: ${actionRecommendation || 'None'}
- Engineer Note: ${engineerNote || 'None'}

Rules:
1. Use ONLY the facts provided. Do NOT invent measurements, causes, or unrecorded damage.
2. Return ONLY the final professional report wording without commentary or bullet points.`;

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = result?.text?.trim();
        if (text) {
          return res.json({ wording: text });
        }
      }

      // Local fallback if no API key or empty response
      const condStr = Array.isArray(conditions) && conditions.length > 0 ? conditions.join(', ').toLowerCase() : 'observed issue';
      const fallback = `Inspection of ${component || 'component'} revealed ${condStr}.${engineerNote ? ` Observation: ${engineerNote}.` : ''} Action taken/recommended: ${actionRecommendation || 'Review required'}.`;
      res.json({ wording: fallback });
    } catch (err: any) {
      console.warn('[AI Generate Finding Warning]:', err?.message);
      res.json({ 
        wording: `Inspection of ${req.body?.component || 'component'} revealed ${Array.isArray(req.body?.conditions) ? req.body.conditions.join(', ') : 'observed issue'}. Action: ${req.body?.actionRecommendation || 'Review required'}.`
      });
    }
  });

  // Catch-all 404 handler for unhandled /api/* requests to ensure JSON is always returned instead of HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FSOS Cloudflare Worker API & Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
