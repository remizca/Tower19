# Tower19 — Procedural CAD Practice Generator

Lightweight web app to procedurally generate 3D practice parts (in millimetres), present an interactive 3D viewer, and produce ISO-compliant 2D CAD drawings (orthographic views + optional sections). The app is intended as a training aid for CAD users who want random part practice to rebuild in Fusion 360, Inventor, SolidWorks, or similar.

Key features
- Procedural 3D models with deterministic seeds and difficulty levels (Beginner / Intermediate / Expert)
- Interactive 3D inspection (orbit/pan/zoom) using Three.js
- Generate ISO-style orthographic 2D drawings (Front/Top/Right) in mm, with dimensioning and title block
- Optional section views and hatch patterns for internal features
- Timer starts when the 2D drawing is viewed; users can save completion times
- Bookmark/save generated parts locally (IndexedDB) and export PDFs/SVGs for practice

Deployment
- Intended to deploy as a static web app (Vercel recommended) so users can access it without installation.

Current Status
- ✅ Project scaffold with React + TypeScript + Three.js + Vite
- ✅ Interactive 3D viewer with OrbitControls
- ✅ Local bookmarking with localStorage
- ✅ **Deployed to Vercel and working in production**
- ✅ CSG boolean operations (subtraction and union) working with @react-three/csg
- ✅ **Procedural generators for Beginner and Intermediate difficulty**
  - **Beginner**: 16 strategies (2-6 primitives, comprehensive feature coverage)
  - **Intermediate**: 4 strategies (5-15 primitives, complex assemblies, symmetric features)
  - Box, cylinder, sphere, cone (frustum), and torus primitives supported
  - **Feature strategies**: Spherical pockets, countersinks, torus cutouts, angled holes, linear/circular patterns, chamfers, edge fillets, support ribs, web reinforcement
  - **Structural strategies**: L-bracket, T-bracket, Cylinder-cutouts, Stacked blocks, Corner bracket, Block-with-holes
  - Full transform support: position, rotation (Euler angles), and scale
  - Shared features module for reusable chamfer/fillet/pattern/rib/web helpers
- ✅ **UI difficulty selector** for switching between Beginner and Intermediate
- ✅ Build optimizations: manual chunk splitting, reduced bundle size
- ✅ **2D Drawing Engine: Phases 1-4 Complete** (Nov 7-11, 2025)
  - **Phase 1: Edge Extraction Module**: Mesh-based edge extraction with sharp edge detection (30° angle threshold)
  - **Phase 1: SVG Integration**: Integrated extractRecipeEdges() with SVG renderer, removed legacy code
  - **Phase 1: Orthographic Views**: Front/Top/Right views with visible (solid) and hidden (dashed) lines
  - **Phase 2: Dimensioning System**: ISO-compliant dimensioning with automatic placement
  - **Phase 3: Line Weights, Center Lines, Scale Selection, Collision Detection**: All ISO 128-24 compliant
  - **Phase 4: Section Views**: Dual-mode slicing (CSG + simplified), hatch patterns, cutting plane indicators
  - **Test Suite**: Comprehensive coverage with `test:svg`, `test:slicing`, `test:section`, `test:svg-integration`
  - **SVG Output**: Generated drawings with dimensions, center lines, and section views
  - Silhouette edge detection for view-dependent visibility
  - Ray-casting visibility classification framework
  - Support for all primitive types (box, cylinder, sphere, cone, torus)
  - Transform handling (position, rotation, scale)
- ⚠️ **Next**: UI integration (2D viewer), export pipeline (PDF/DXF), advanced features

Recent Progress (Nov 11, 2025)
- ✅ **Phase 4 Complete - Section Views**: ISO-compliant section views with dual-mode slicing
  - CSG slicing: Plane-triangle intersection with loop stitching (accurate geometry slicing)
  - Simplified slicing: Rectangular bounds + cylindrical holes (fallback mode)
  - Hatch pattern rendering: 45° lines at 3mm spacing per ISO 128-50
  - SVG integration: Section views positioned in layout with cutting plane indicators
  - Cutting plane indicators: Chain-thick lines with arrows and A-A labels in parent views
  - Test coverage: `test:slicing`, `test:hatch`, `test:section`, `test:svg-integration` all passing
- ✅ **Phase 3.4 Complete - Dimension Collision Detection**: View-aware collision resolution
  - Priority-based relocation algorithm prevents overlapping dimensions
  - Bounding box calculation for all dimension types (linear, radial, angular)
  - Extension lines excluded from bounds (allowed to cross per drafting conventions)
  - Test suite validates zero collisions in output

Recent Progress (Nov 8, 2025)
- ✅ **SVG Integration Complete**: Edge extraction now powering SVG renderer
  - Replaced 105-line legacy extractEdges() function
  - SVG generation working with triangulated mesh edges
  - Test passing with 76-83 edges per view
  - Output file: `tests/output/block-hole.svg`
  - Visible/hidden line classification working
  - Build passing, all types correct
- ✅ **Edge extraction testing**: Validated all 4 fixtures with comprehensive test suite
  - Block-Hole: 222 edges (box + cylinder)
  - L-Bracket: 444 edges (union + mounting holes)
  - T-Bracket: 666 edges (complex assembly)
  - Cylinder-Cutout: 1251 edges (box + torus)
  - All edge structures validated, counts within expected ranges
  - Confirms extraction works for all primitive types
- ✅ **Edge extraction module**: Created `src/drawing/edges.ts` with robust mesh analysis
  - Sharp edge detection using face angle analysis
  - Silhouette edge extraction for orthographic views
  - Ray-casting based visibility classification
  - Tested with 222 edges from block-hole fixture
  - Ready for CSG integration

Recent Progress (Nov 8, 2025)
- ✅ **Phase 2 Complete - Dimensioning System**: ISO-compliant dimensioning with automatic placement
  - Linear dimensions (horizontal/vertical) with extension lines and arrowheads
  - Radial dimensions (Ø prefix) with center marks and leader lines
  - Automatic text formatting (no trailing zeros: "100" not "100.0")
  - 6 bounding box dimensions + feature dimensions (cylinder diameters)
  - Proper spacing per ISO 129-1 (8mm offset, 6mm between dimensions)
- ✅ **Phase 3.1 Complete - Line Weight System**: ISO 128-24 compliant line types
  - Thick lines (0.7mm) for visible edges and outlines
  - Thin lines (0.35mm) for dimensions, hidden edges, center lines
  - 11 line types: visible-edge, hidden-edge, dimension, extension, leader, hatching, center-line, pitch-circle, phantom, cutting-plane
  - Proper dasharray patterns for hidden (3,1.5) and chain lines (8,2,2,2)
- ✅ **Phase 3.2 Complete - Center Lines**: Automatic center line generation for cylindrical features
  - Crossed center lines for cylinders viewed end-on (circular profile)
  - Axis center lines for cylinders viewed from side (rectangular profile)
  - Chain line pattern (8,2,2,2 dasharray) per ISO 128-24
  - Extends 5mm beyond feature boundaries, 10mm diameter minimum threshold
  - Supports cylinders and cones with any axis orientation (x, y, z)
- ✅ **Phase 3.3 Complete - Scale Selection**: Automatic drawing scale fitting with ISO 5455 scales
  - Standard scales: 10:1, 5:1, 2:1, 1:1, 1:2, 1:4, 1:5, 1:10
  - Automatic page layout with 2×2 grid (front/top/right views + title block area)
  - Computes optimal scale fitting all views within margins (15mm) and gaps (10mm)
  - Dynamic view centering in allocated slots
  - Title block displays selected scale (e.g., "Scale: 1:2")
  - Tested with default (1:1), large (1:2), and tiny (5:1) parts

Recent Progress (Nov 11, 2025)
- ✅ **Phase 4 Complete - Section Views with Cutting Planes**: Full SVG integration
  - CSG-based and simplified slicing modes for section view generation
  - Hatch patterns at 45° with 3mm spacing using thin lines
  - Cutting plane indicators in parent views (chain-thick lines with A-A labels)
  - Section views positioned in bottom-right quadrant of 2×2 layout
- ✅ **2D Drawing Viewer UI**: Interactive viewer with pan/zoom controls
  - View mode switcher (3D/2D tabs) for seamless navigation
  - Timer tracking time spent viewing drawings
  - Download SVG functionality for offline practice
  - Real-time CSG geometry extraction for accurate section views
  - Overlay controls with part info and zoom percentage
- ✅ **PDF Export**: Professional printable documents
  - ISO A4 page format with landscape orientation
  - Automatic scaling with margins
  - Metadata includes part name, difficulty, seed, and timestamp
  - jsPDF integration with high-quality SVG rendering
- ✅ **Drawing Accuracy Fix**: CSG geometry integration
  - Fixed artifacts showing subtraction tools as solid parts
  - Edges now extracted from final CSG boolean result
  - Accurate 2D representation matches 3D model exactly

Recent Progress (Nov 7, 2025)
- ✅ **Ribs and webs features**: Complete structural reinforcement generators (ribs, webs, radial ribs)
- ✅ **Intermediate difficulty generator implemented**: 4 complex strategies with 5-15 primitives each
- ✅ **Shared features module**: Reusable helpers for chamfers, fillets, linear/circular patterns, ribs, webs
- ✅ **UI difficulty selector**: Dropdown allows switching between Beginner and Intermediate
- ✅ **Feature generators**: Added chamfers and fillets to beginner strategies
- ✅ **Fixed production deployment**: Resolved Vercel build errors and blank page issue
- ✅ **Fixed 3D rendering**: Removed invalid CSG structure (group wrappers) causing blank canvas
- ✅ Added sphere, cone (frustum), and torus primitive support to generator and renderer
- ✅ Expanded beginner generator to 16 strategies with comprehensive feature coverage
- ✅ Build optimizations: replaced Ajv with lightweight validator, manual chunk splitting
- ✅ Created test fixtures and variety validation tests
- ✅ **Full transform support**: Implemented rotation (Euler angles) and scale in renderer and generator
- ✅ **Pattern generators**: Linear and circular hole patterns using position transforms

Known Issues
- Expert difficulty generator not yet implemented
- Mesh-based CSG limits analytic edge fidelity (no true fillet/chamfer curves yet)

Recent Progress (Nov 14, 2025)

- ✅ **DXF Export Complete (UI-06)**: Client-side R12 DXF writer with orthographic view projection
  - Visible/hidden edge classification mapped to layers (OUTLINE/HIDDEN)
  - Dimension entities exported as line + text pairs (DIAMETER / BBOX)
  - Center lines emitted on CENTER layer with chain pattern metadata
  - Convenience API `exportToDXFFromRecipe()` wired to UI button
  - Manual chunk splitting keeps DXF bundle minimal (lazy-loaded)

Next steps (prioritized)

1. **CAD Kernel WASM Spike**: Evaluate OpenCascade.js performance (bundle size, init time, API ergonomics)
2. **Advanced 2D features**: Angular dimensions, extended section types (half, offset, broken-out)
3. Create expert difficulty generator (8-12+ primitives, advanced features, combined ribs/webs/fillets)
4. Migrate bookmarking/storage from localStorage to IndexedDB
5. Add CI (GitHub Actions) that runs `npm run build` on PRs
6. DXF enhancements: true DXF dimension entities, layer linetype/style refinement

See `TODO.md`, `docs/progress/PROGRESS.md`, and `docs/roadmaps/` for project tracking and technical notes.

CAD Kernel upgrade planning underway: see `docs/roadmaps/cad-kernel-evaluation.md`.

**Current Sprint (Nov 14, 2025)**: OpenCascade.js WASM spike baseline captured (init 6.2–8.8s FAIL vs <2s target; primitives fast; fillet 716ms for 24 edges; triangulation 52–102ms). Proceeding with trimming strategy + boolean timing retest and evaluating hybrid vs full migration.
