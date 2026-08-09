/* =====================================================
   D1 WORKER AUTHORITATIVE PERSISTENCE TESTS (d1Worker.test.ts)
   ===================================================== */
import worker from '../worker';

interface MockD1Row {
  key: string;
  table_name: string;
  record_id: string;
  data: string | null;
  updated_at: string;
  device_id: string;
  version: number;
  is_deleted: number;
}

class MockD1Database {
  public rows = new Map<string, MockD1Row>();
  public shouldFail = false;

  prepare(sql: string) {
    const self = this;
    let boundArgs: any[] = [];

    const stmt = {
      bind(...args: any[]) {
        boundArgs = args;
        return stmt;
      },
      async run() {
        if (self.shouldFail) {
          throw new Error("D1 Database connection failed (Simulated outage)");
        }

        if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
          return { success: true };
        }

        if (sql.includes("INSERT INTO records")) {
          const [key, table_name, record_id, data, updated_at, device_id, version, is_deleted] = boundArgs;
          self.rows.set(key, {
            key,
            table_name,
            record_id,
            data,
            updated_at,
            device_id,
            version: Number(version),
            is_deleted: Number(is_deleted)
          });
          return { success: true };
        }

        return { success: true };
      },
      async first() {
        if (self.shouldFail) {
          throw new Error("D1 Database query failed (Simulated outage)");
        }

        if (sql.includes("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0")) {
          let count = 0;
          for (const row of self.rows.values()) {
            if (row.is_deleted === 0) count++;
          }
          return { total: count };
        }

        if (sql.includes("SELECT version, updated_at FROM records WHERE key = ?")) {
          const [key] = boundArgs;
          const row = self.rows.get(key);
          if (!row) return null;
          return { version: row.version, updated_at: row.updated_at };
        }

        return null;
      },
      async all() {
        if (self.shouldFail) {
          throw new Error("D1 Database fetch failed (Simulated outage)");
        }

        if (sql.includes("SELECT key, table_name as \"table\"")) {
          const results = Array.from(self.rows.values()).map(r => ({
            key: r.key,
            table: r.table_name,
            recordId: r.record_id,
            data: r.data,
            updatedAt: r.updated_at,
            deviceId: r.device_id,
            version: r.version,
            isDeleted: r.is_deleted === 1
          }));
          return { results };
        }

        return { results: [] };
      }
    };

    return stmt;
  }
}

export async function runD1WorkerTests(): Promise<{ success: boolean; log: string[] }> {
  const log: string[] = [];
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      log.push(`✅ PASS: ${message}`);
    } else {
      log.push(`❌ FAIL: ${message}`);
      passed = false;
    }
  }

  const mockDb = new MockD1Database();
  const env = { DB: mockDb };

  try {
    // A. Create record: Client -> Worker -> D1 -> successful response
    const createReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "machines",
        recordId: "M-101",
        deviceId: "DEV-A",
        data: { machineNo: "TRUMPF-3030", powerKw: 6 }
      })
    });
    const createRes = await worker.fetch(createReq, env);
    const createJson = await createRes.json();
    assert(createRes.status === 200 && createJson.success === true, "A. Create record returned HTTP 200 and success: true");
    assert(mockDb.rows.has("machines:M-101"), "A. Record persisted directly in D1 storage");

    // B. Update record: Client -> Worker -> D1 -> updated value retrievable
    const updateReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "machines",
        recordId: "M-101",
        deviceId: "DEV-A",
        data: { machineNo: "TRUMPF-3030-UPDATED", powerKw: 10 }
      })
    });
    const updateRes = await worker.fetch(updateReq, env);
    assert(updateRes.status === 200, "B. Update record returned HTTP 200");
    const d1RecordB = mockDb.rows.get("machines:M-101");
    assert(d1RecordB && d1RecordB.data?.includes("TRUMPF-3030-UPDATED"), "B. D1 contains updated record values");

    // C. Read records: Worker reads from D1
    const readSyncReq = new Request("https://worker.dev/api/sync", { method: "GET" });
    const readSyncRes = await worker.fetch(readSyncReq, env);
    const readSyncJson = await readSyncRes.json();
    assert(readSyncJson.serverRecordCount === 1, "C. Worker reads record count directly from D1");

    // D. Changes endpoint: /api/changes obtains authoritative state from D1
    const changesReq = new Request("https://worker.dev/api/changes?since=0&deviceId=DEV-B", { method: "GET" });
    const changesRes = await worker.fetch(changesReq, env);
    const changesJson = await changesRes.json();
    assert(changesJson.success === true, "D. /api/changes returned HTTP 200 success");
    assert(changesJson.changes.length === 1 && changesJson.changes[0].data.machineNo === "TRUMPF-3030-UPDATED", "D. /api/changes pulled authoritative D1 state");

    // E. Persistence after worker instance reset:
    // Create new mock env instance referencing same D1 database
    const newWorkerInstanceEnv = { DB: mockDb };
    const persistReq = new Request("https://worker.dev/api/changes?since=0", { method: "GET" });
    const persistRes = await worker.fetch(persistReq, newWorkerInstanceEnv);
    const persistJson = await persistRes.json();
    assert(persistJson.changes.length === 1, "E. Record remains retrievable from D1 after fresh Worker request environment");

    // F. D1 Failure: A failed D1 operation must NOT return false success
    mockDb.shouldFail = true;
    const failReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "machines", recordId: "M-999", data: {} })
    });
    const failRes = await worker.fetch(failReq, env);
    const failJson = await failRes.json();
    assert(failRes.status === 500, "F. Failed D1 operation returned HTTP 500 status");
    assert(failJson.error && failJson.error.includes("D1 Database"), "F. Error details returned instead of false success");

  } catch (err: any) {
    log.push(`❌ EXCEPTION DURING D1 TESTS: ${err?.message || String(err)}`);
    passed = false;
  }

  log.push(`\nD1 Worker Tests Result: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return { success: passed, log };
}
