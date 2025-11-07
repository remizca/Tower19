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
- ✅ **2D Drawing Engine: Phase 1 Complete**
  - **Edge Extraction Module**: Mesh-based edge extraction with sharp edge detection (30° angle threshold)
  - **SVG Integration**: Integrated extractRecipeEdges() with SVG renderer, removed legacy code
  - **Orthographic Views**: Front/Top/Right views with visible (solid) and hidden (dashed) lines
  - **Test Suite**: Validates edge counts (60-100 edges per view for block-hole fixture)
  - **SVG Output**: Generated `tests/output/block-hole.svg` with proper styling
  - Silhouette edge detection for view-dependent visibility
  - Ray-casting visibility classification framework
  - Support for all primitive types (box, cylinder, sphere, cone, torus)
  - Transform handling (position, rotation, scale)
- ⚠️ **Next**: Dimensioning system, section views, edge simplification

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
- 2D SVG renderer edge visibility integration pending (edge extraction module complete, needs CSG integration)
- Expert difficulty generator not yet implemented

Next steps (prioritized)
1. **[HIGH PRIORITY]** Complete 2D renderer integration
   - Integrate edge extraction module with CSG renderer for final merged geometry
   - Replace Z-depth heuristics with ray-casting visibility in projectEdges()
   - Test with all fixtures (block-hole, L-bracket, T-bracket, cylinder-cutout)
2. Create expert difficulty generator (8-12+ primitives, advanced features, combined ribs/webs/fillets)
3. Migrate bookmarking/storage from localStorage to IndexedDB
4. Add timer functionality and local records storage
5. Add CI (GitHub Actions) that runs `npm run build` on PRs
6. Add comprehensive tests and example models

See `TODO.md` and `docs/` for project tracking and technical notes.
