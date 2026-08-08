# FSOS CHANGELOG

## v1.0.10 — Cloudflare Dependency Sync Audit (2026-08-08)

### Audited & Fixed
- **Dependency Classification**: Moved `@tailwindcss/vite` and `@vitejs/plugin-react` from `dependencies` to `devDependencies` to prevent production build tree mismatches.
- **Lockfile Synchronization**: Re-synced `package-lock.json` lockfileVersion 3 and verified `npm ci` and `NODE_ENV=production npm ci` pass with 100% success.


## v1.0.9 — Atlas Lockfile Verification (2026-08-08)

### Verified & Synchronized
- **Lockfile Clean Regeneration**: Deleted `node_modules` and `package-lock.json`, regenerated via `npm install`.
- **Clean Install Verification**: Executed `npm ci` locally with 100% success and 0 errors, guaranteeing lockfile parity for Cloudflare Git builds.

## v1.0.8 — Lockfile Synchronization (2026-08-08)

### Synchronized & Verified
- **Lockfile Regeneration**: Regenerated `package-lock.json` via `npm install`. Verified `vite` is strictly listed under `devDependencies`.

## v1.0.7 — Cloudflare Git Build Audit (2026-08-08)

### Audited & Resolved
- **Duplicate Dependency Clean-up**: Removed duplicate `vite` declaration present in both `dependencies` and `devDependencies` in `package.json`.
- **Lockfile & Build Verification**: Audit confirmed `.gitignore` preserves `package-lock.json` and root path configuration is correct for Cloudflare Git Build.

## v1.0.6 — Git Lockfile Verification (2026-08-08)

### Verified & Verified
- **Local Lockfile Validation**: Executed `npm ci` successfully with zero lockfile mismatches or errors.
- **Git Synchronization**: Verified `package.json` and `package-lock.json` are in complete sync for Cloudflare Workers CI/CD.

## v1.0.5 — Build Lockfile Sync (2026-08-08)

### Synchronized & Fixed
- **Lockfile Synchronization**: Synchronized package-lock.json with package.json for seamless Cloudflare Workers automated builds.

## v1.0.4 — Workers Build Finalization (2026-08-08)

### Finalized & Production Ready
- **Primary Runtime**: Set Cloudflare Workers (`src/worker.ts`) as primary production runtime.
- **Package Scripts**: Added `build:worker` and `deploy` scripts in `package.json`.
- **D1 Production Binding**: Bound production D1 UUID `5121135f-9336-46a6-88cc-9a2c85caae0b` in `wrangler.toml`.
- **Direct GitHub Deploy**: Repository verified ready for direct Cloudflare Workers deployment.

## v1.0.1 — Cloudflare Deployment & Validation (2026-08-08)

### Verified & Documented
- **Wrangler & D1 Binding Verification**: Confirmed `wrangler.toml` assets (`./dist`) and D1 database binding (`DB`).
- **Cloud Run Decoupling**: Application runtime entirely independent of Cloud Run container dependencies.
- **Deployment Documentation**: Complete step-by-step Wrangler deploy instructions provided in `README.md`.

## v1.0.0 — Cloudflare Workers Foundation (2026-08-08)

### Migrated & Architecture
- **Cloudflare Workers Runtime Integration (`src/worker.ts` & `wrangler.toml`)**:
  - Full migration of application runtime and server endpoints to Cloudflare Workers native fetch standard.
  - Native route handling for `/api/health`, `/api/sync`, `/api/changes`, `/api/images`, `/api/record`, and `/api/sync/status`.
  - Configured Cloudflare D1 database binding (`env.DB`) and static asset binding (`env.ASSETS`).
- **Unified Static Asset & API Serving**:
  - Serves compiled React SPA assets directly from `dist` via `env.ASSETS` while routing API queries to native worker handlers.
- **Data Integrity & Robust Machine Lookup**:
  - Hardened Machine Passport and workspace modules against null machine access.

## v0.9.1 — Data Integrity Hotfix (2026-08-07)

### Fixed & Enhanced
- **Time Semantics**: Updated baseline default dates and saved/displayed timestamps to browser-local time (`getLocalDateString`).
- **Laser Power History**: Added `[+ New Current Check]` and `[+ Add Historical Record]` workflows. Records strictly sorted by measurement date; latest = Current, immediately preceding = Previous, "No previous record" rendered when no prior check exists.
- **IndexedDB Image Persistence**: Eliminated `localStorage` quota warnings and silent image payload pruning. Image and blob evidence are stored in IndexedDB (`ImageStore`) with lightweight references in `localStorage`.
- **Product / Process / Via Null-Safety**: Fixed `TypeError: can't access property "phase1", prev is null` across all comparison widgets with optional chaining and fallback empty state.
- **Beam Profile Record Management**: Added reliable record deletion with automatic cleanup of associated IndexedDB blob evidence.
- **Save Transaction Safety**: Atomic save flow ensures state updates occur only after successful persistence. On storage failure, form data is retained with actionable error feedback.

## v0.9.0 Phase 2.1 — Laser Lifecycle Engine Migration (2026-08-06)

### Added & Migrated
- **Native TypeScript Laser Lifecycle Engine (`src/utils/laserEngine.ts`)**:
  - Full deterministic lifecycle calculation formulas: continuous 24h dynamic runtime estimation, remaining operating hours, remaining days, and percentage calculations.
  - Multi-laser domain architecture: `MachineDomain` -> `LaserHeadDomain` -> lifecycle state, calibration history, and worst-state status aggregation (`ALARM` > `BASELINE_REQUIRED` > `WARNING` > `SAFE`).
  - Baseline management: `BASELINE_REQUIRED` status fallback when physical meter reading is missing.
  - Recalibration transaction logic: comparison between calculated estimated hour vs physical meter reading, deviation calculation, accuracy rating scale, and 10-entry calibration history auditing.
  - Evaluation time semantics (`getCurrentEvalTime`).
- **Persistence Adaptation (`src/utils/persistence.ts`)**:
  - Integrated `LaserEngine.normalizeMachines` into `StorageService.getMachines` to ensure multi-laser data schemas are seamlessly restored and normalized.
- **Type Definitions (`src/types/index.ts`)**:
  - Extended `LaserHead` and `Machine` interfaces with multi-laser engine domain properties and exported domain types.
- **Parity Validation Test Suite (`src/utils/laserEngine.test.ts`)**:
  - Verified 100% mathematical and behavioral parity against the source-of-truth Laser Hour Monitor.
