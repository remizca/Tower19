# Implementation Progress

This document tracks implementation status for each major feature area. For detailed roadmaps, see `docs/roadmaps/`. For task tracking, see `TODO.md`.

## Core Systems ✅ COMPLETE

### Data Model

- ✅ `PartRecipe` type system with JSON schema validation
- ✅ Migration from legacy formats
- ✅ TypeScript strict checks

### 3D Generation & CSG

- ✅ Procedural generators: 6 beginner + 4 intermediate strategies
- ✅ @react-three/csg boolean operations (union, subtract, intersect)
- ✅ Primitives: box, cylinder, sphere, cone, torus
- ✅ Features: patterns, fillets, chamfers, ribs, webs
- ✅ Full transform support (position, rotation, scale)
- ✅ Test fixtures for validation

### 2D Drawing Engine (ISO-Compliant)

**Status**: Phases 1-4 Complete ✅

- ✅ Mesh-based edge extraction with sharp edge detection (30° threshold)
- ✅ Orthographic projection (front/top/right views)
- ✅ Visible/hidden line classification
- ✅ Dimensioning system (linear, radial) per ISO 129-1
- ✅ Line weights and types per ISO 128-24
- ✅ Center lines for cylindrical features
- ✅ Automatic scale selection (ISO 5455)
- ✅ Dimension collision detection and resolution
- ✅ Section views with dual-mode slicing and hatch patterns (ISO 128-50)
- ✅ SVG rendering with title block
- ✅ PDF export (A4 landscape, metadata)
- ✅ DXF export (R12 format, layers, dimensions)

**Key Files**:

- `src/drawing/edges.ts` (410 lines) - Edge extraction
- `src/drawing/dimensions.ts` (600+ lines) - Dimension logic
- `src/drawing/svg.ts` - SVG generation
- `src/exporters/pdf.ts` - PDF export
- `src/exporters/dxf.ts` - DXF export

### UI/UX

- ✅ 3D viewer with orbit/pan/zoom (Three.js + R3F)
- ✅ 2D drawing viewer with pan/zoom/download
- ✅ View mode switcher (3D/2D tabs)
- ✅ Timer tracking for drawing sessions
- ✅ Generate button with seed/difficulty controls
- ✅ Bookmark/save with localStorage
- ✅ Export buttons: SVG, PDF, DXF

### Build & Deployment

- ✅ GitHub + Vercel deployment
- ✅ Build optimizations (manual chunk splitting)
- ✅ TypeScript project references

## Current Focus: CAD Kernel Migration

**Objective**: Migrate from mesh-based CSG to analytic CAD kernel (OpenCascade WASM) for:

- Precise B-Rep topology (accurate edges, faces)
- True fillet/chamfer operations
- Parametric feature layer
- Analytic edge export (DXF arcs vs polylines)

**Status**: Adapter interface scaffold complete; WASM spike baseline metrics recorded (init time FAIL, primitives PASS, fillet BORDERLINE, triangulation PASS); performance analysis in progress.

**Key Files**:

- `src/geometry/backend.ts` - Abstract `GeometryBackend` interface, registry
- `src/geometry/meshBackend.ts` - Baseline mesh CSG adapter

**Spike Results (Nov 14, 2025)**:

- Init: 6.2–8.8s (FAIL vs <2s goal; trimming required)
- Box primitive: 2ms (PASS)
- Cylinder primitive: ~3–4ms (PASS after overload fix)
- Fillet (24 edges, 5mm): 716ms (BORDERLINE → needs async/offload)
- Mesh triangulation: 52–102ms for 616v / 788t (PASS)
- Boolean subtract: timing pending (overload corrections applied; retest queued)

**Next Steps**:

1. Retest boolean timing & robustness (100 random cases)
2. Create trimmed OCCT build (exclude visualization, STEP/IGES, extras) & benchmark
3. Worker offload prototype for fillet/chamfer/boolean operations
4. Decide migration mode: full vs hybrid (mesh preview + OCCT on-demand)
5. Implement `OpenCascadeBackend` with normalized factory wrappers
6. Parity testing harness (mesh vs OCCT comparison)
7. Feature metadata layer in `PartRecipe`
8. Parametric regeneration API

**Roadmap**: `docs/roadmaps/cad-kernel-evaluation.md`

## Pending Features

### Expert Generator

- [ ] 8-12+ primitives per part
- [ ] Advanced feature combinations (ribs+webs+fillets)
- [ ] Complex assembly strategies

### Advanced 2D Features

- [ ] Angular dimensions for chamfers/bevels
- [ ] Extended section types (half, offset, broken-out)
- [ ] Analytic edge extraction (via CAD kernel)
- [ ] True DXF dimension entities

### Infrastructure Enhancements

- [ ] IndexedDB migration (from localStorage)
- [ ] Offline support / service worker
- [ ] CI pipeline (GitHub Actions)
- [ ] Browser testing framework

## Testing

Test suites in `tests/`:

- ✅ `test:svg` - SVG generation validation
- ✅ `test:slicing` - Section view slicing
- ✅ `test:section` - Full section integration
- ✅ `test:collision` - Dimension collision detection
- ✅ `test:generator` - Generator variety

## References

- **Specifications**: `docs/specs/iso-drawing-standards.md`
- **Roadmaps**: `docs/roadmaps/2d-drawing-engine.md`, `docs/roadmaps/cad-kernel-evaluation.md`
- **Task Tracking**: `TODO.md`
- **Deployment**: Vercel (auto-deploy from main)
