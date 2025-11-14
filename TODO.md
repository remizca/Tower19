# Todo List

## Core Features

- ✅ Draft app outline & feature suggestions
  - Produce a detailed outline of the app's features, UI flows, data model, ISO-compliant 2D drawing approach, difficulty levels, timer/bookmark/export behavior, and a prioritized roadmap.
- ✅ Setup deployment pipeline
  - ✅ GitHub + Vercel configured and working
  - ✅ Build optimizations: manual chunk splitting for react/three/r3f
  - ✅ Fixed Vercel build errors (Ajv import resolved, outputDirectory configured)
  - ✅ 3D viewer renders correctly in production
- ✅ Design core data model
  - Define JSON schema for generated parts (primitives, operations, parameters, units mm, seed, difficulty, name, function, timestamps).

## 3D Model Generation ✅ CORE COMPLETE

- ✅ Procedural generator with 6 beginner + 4 intermediate strategies
- ✅ CSG boolean operations (union, subtract, intersect)
- ✅ Primitives: box, cylinder, sphere, cone, torus
- ✅ Features: patterns, fillets, chamfers, ribs, webs
- ✅ Full transform support (position, rotation, scale)
- ✅ Test fixtures and validation

### Generator Enhancements Pending

- [ ] Expert difficulty generator (8-12+ primitives, combined features)
- [ ] True fillet/chamfer geometry (requires CAD kernel)

## 2D Drawing Engine ✅ COMPLETE (Phases 1-4)

- ✅ ISO-compliant orthographic projection (front/top/right views)
- ✅ Mesh-based edge extraction with visible/hidden classification
- ✅ Dimensioning system (linear, radial; ISO 129-1 compliant)
- ✅ Line weights and types (ISO 128-24)
- ✅ Center lines for cylindrical features
- ✅ Automatic scale selection (ISO 5455)
- ✅ Dimension collision detection and resolution
- ✅ Section views with dual-mode slicing and hatch patterns
- ✅ SVG, PDF, and DXF export
- **Reference**: `docs/specs/iso-drawing-standards.md`, `docs/roadmaps/2d-drawing-engine.md`

### Drawing Engine Enhancements Pending

- [ ] Angular dimensions for chamfers/bevels
- [ ] Extended section types (half, offset, broken-out)
- [ ] Analytic edge extraction (requires CAD kernel migration)

## UI/UX and Integration ✅ COMPLETE

- ✅ 3D viewer with orbit/pan/zoom controls
- ✅ 2D drawing viewer with pan/zoom/download
- ✅ View mode switcher (3D/2D tabs)
- ✅ Timer tracking for drawing sessions
- ✅ Generate button with seed display
- ✅ Difficulty selector (Beginner/Intermediate)
- ✅ Bookmark/save with localStorage
- ✅ Export: SVG, PDF, DXF

### UI Enhancements Pending

- [ ] View presets (front/top/right quick views)
- [ ] Migrate to IndexedDB for better storage
- [ ] Offline support / service worker

## Infrastructure

- ✅ Add `tsconfig.node.json` for project reference
  - Create the node-specific tsconfig file so `tsconfig.json` project reference resolves (fix missing reference error).

## CAD Kernel Evaluation & Geometry Upgrade

**Objective**: Migrate from mesh-based CSG to analytic CAD kernel (OpenCascade WASM) for precise geometry, true fillets, and parametric features.

**Status**: ✅ COMPLETE - Web Worker solution implemented and validated. Eliminates blocking init time (0ms vs 6000ms) while maintaining full OCCT functionality. Recommended for production.

**Roadmap**: See `docs/roadmaps/cad-kernel-evaluation.md`

### Tasks

- ✅ Search for existing CAD kernels (verified absence)
- ✅ Create `GeometryBackend` interface and mesh CSG adapter (baseline)
- ✅ Research & catalog browser CAD options
  - Identified `opencascade.js` v1.1.1 (64MB unpacked; init currently 6.2–8.8s; exceeds <2s target)
  - Alternatives: JSCAD (2MB), verb.js (500KB) recorded
- ✅ WASM spike: OpenCascade baseline evaluation
  - Spike branch + HTML harness (`spike/worker-demo.html`)
  - Init time measured (6.2–8.8s) → FAIL threshold
  - Box primitive: 2ms; Cylinder: ~3–4ms after overload fix → PASS
  - Fillet (24 edges, 5mm): 716ms → BORDERLINE (needs async/offload)
  - Mesh triangulation: 52–102ms for 616v / 788t → PASS
  - Boolean subtract timing: Fixed via direct property access (no type casting)
  - JSON export of metrics implemented (`occt-benchmark.json`)
- ✅ Performance analysis COMPLETE
  - Boolean timing & robustness: 100% success rate (414 cuts, 438ms avg) → PASS
  - Trim build investigation: Feasible but NOT RECOMMENDED (high effort, borderline improvement, loses exceptions)
  - Web Worker implementation: ✅ COMPLETE (0ms blocking, 4.7s background init, full error handling)
  - Worker architecture: `oc-worker.ts` + `oc-worker-client.ts` + `worker-demo.html`
- [ ] Adapter parity testing harness (generate 100 random parts, compare mesh vs OCCT)
- [ ] Feature metadata layer in `PartRecipe`
- [ ] Implement `OpenCascadeBackend` (post trim decision)
- [ ] Hybrid strategy evaluation (mesh immediate, OCCT on-demand) if init > 3s after trimming
- [ ] Go/No-Go decision after trimmed build benchmark

### Spike Metrics Snapshot

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Import Time | 159–373 ms | < 500 ms | PASS |
| WASM Init (blocking) | 6.2–8.8 s | < 2 s (ideal) / < 3 s (acceptable) | FAIL |
| **WASM Init (Web Worker)** | **0 ms blocking** | **< 100 ms blocking** | **✅ PASS** |
| Background Init | 4.7 s | N/A | Non-blocking |
| Box Creation | 2–12 ms | < 20 ms | PASS |
| Cylinder Creation | 3–4 ms | < 20 ms | PASS |
| Boolean Cut | 438 ms avg | < 120 ms (ideal) | BORDERLINE |
| Boolean Robustness | 100% (414 cuts) | > 95% | PASS |
| Fillet (24 edges) | 716 ms | < 500 ms (interactive) | BORDERLINE |
| Mesh Triangulation | 52–102 ms | < 150 ms | PASS |

### Immediate Next Actions

1. ✅ Boolean timing validated (100% success, 438ms avg)
2. ✅ Trim build investigation complete (verdict: NOT WORTH EFFORT)
3. ✅ Web Worker implementation complete and validated
4. **RECOMMENDED**: Adopt Web Worker architecture for production
5. Draft `OpenCascadeBackend` factory wrappers using worker client pattern

### Risks & Mitigations

- ✅ High init time → **SOLVED** with Web Worker (0ms blocking, 4.7s background init)
- Overload instability → Wrapper factories mapping to stable signature set.
- Heavy feature ops → Web Worker architecture already handles async operations.
- Bundle bloat → Accept 12-15MB for full OCCT features (better than trimmed build maintenance).

Refer to updated roadmap: `docs/roadmaps/cad-kernel-evaluation.md` for expanded performance section.
