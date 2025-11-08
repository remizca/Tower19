# Todo List

## Core Features

- [x] Draft app outline & feature suggestions
  - Produce a detailed outline of the app's features, UI flows, data model, ISO-compliant 2D drawing approach, difficulty levels, timer/bookmark/export behavior, and a prioritized roadmap.
- [x] Setup deployment pipeline
  - ✅ GitHub + Vercel configured and working
  - ✅ Build optimizations: manual chunk splitting for react/three/r3f
  - ✅ Fixed Vercel build errors (Ajv import resolved, outputDirectory configured)
  - ✅ 3D viewer renders correctly in production
- [x] Design core data model
  - Define JSON schema for generated parts (primitives, operations, parameters, units mm, seed, difficulty, name, function, timestamps).

## 3D Model Generation (Priority: High)

- [x] Expand procedural generator for shape variety
  - **Status**: ✅ Complete - Now generates 6 different part types
  - **Implemented**: Block-with-holes, L-bracket, T-bracket, Cylinder-with-cutouts, Stacked-blocks, Corner-bracket
  - **Beginner**: Simple combinations (2-4 primitives, basic subtractions and unions)
  - **Next**: Intermediate and Expert difficulty levels
  - **Details**: See `docs/progress/generator-variety.md`
- [x] Implement CSG boolean operations
  - ✅ @react-three/csg working for subtraction and union operations
  - ✅ Fixed CSG Geometry structure (removed group wrappers that broke rendering)
  - ✅ Supports box, cylinder, sphere, cone, torus primitives
- [x] Create diverse test fixtures
  - ✅ L-shapes (`tests/fixtures/l-bracket.ts`)
  - ✅ T-shapes (`tests/fixtures/t-bracket.ts`)
  - ✅ Cylinder with cutouts (`tests/fixtures/cylinder-cutout.ts`)
  - ✅ Block with holes (`tests/fixtures/block-hole.ts`)
- [x] Add more primitive types to generators
  - ✅ Implemented sphere, cone (frustum), and torus primitives in generator
  - ✅ Updated 3D renderer to support subtraction/union with these primitives
  - ✅ Applied transforms for operation tools (position + axis-based rotation) in CSG renderer
  - ✅ Full rotation (rx, ry, rz) and scale support implemented in recipes and renderer
  - ✅ Added 'Block with Angled Holes' strategy demonstrating rotation transforms
- [x] Implement feature generators
  - ✅ Patterns: linear array (3-5 holes along axis) and circular pattern (4-8 holes around cylinder)
  - ✅ Fillets and chamfers (added beginner strategies: Block with Chamfered Edges, Block with Edge Fillets)
  - ✅ Created shared features.ts module with reusable helpers for chamfers, fillets, linear/circular patterns
  - ✅ Ribs and webs (added beginner strategies: Block with Support Ribs, Bracket with Web Reinforcement)
  - ✅ Extended features.ts with generateRibFeatures(), generateWebFeatures(), generateRadialRibFeatures()
- [x] Create intermediate difficulty generator
  - ✅ 5-8 primitives per part
  - ✅ More complex boolean combinations (unions + subtractions)
  - ✅ Patterns and symmetry (circular, linear, mirror)
  - ✅ 4 strategies: Multi-Feature Block, Patterned Bracket, Complex Cylinder Assembly, Symmetric Mounting Plate
  - ✅ Wired to UI with difficulty selector dropdown

## 2D Drawing Engine (Priority: Medium)

- [x] Specify 2D drawing engine & ISO conventions
  - ✅ Created comprehensive specification: `docs/specs/iso-drawing-standards.md`
  - ✅ Documented ISO first-angle projection system (ISO 5456-2)
  - ✅ Line types and weights per ISO 128-24 (thick/thin, solid/dashed/chain)
  - ✅ Title block requirements per ISO 7200 (part name, scale, projection, units, date)
  - ✅ Dimensioning rules per ISO 129-1 (linear, radial, angular with placement algorithms)
  - ✅ Section view standards per ISO 128-50 (cutting planes, hatching, labeling)
  - ✅ Sheet sizes and scales per ISO 5457 and ISO 5455
  - ✅ View selection and arrangement strategies
  - ✅ Implementation roadmap with 5 phases
  - **Reference**: All standards documented with SVG implementation examples
- [x] Implement SVG projection and rendering (PHASE 1 COMPLETE)
  - **Status**: ✅ Edge extraction and basic SVG generation complete
  - **Progress**: 
    - ✅ Created `src/drawing/edges.ts` with mesh-based edge extraction (410 lines)
    - ✅ Sharp edge detection using face angle analysis (30° threshold)
    - ✅ Silhouette edge detection for view-dependent visibility
    - ✅ Ray-casting framework for occlusion testing (classifyEdgeVisibility)
    - ✅ Support for all 5 primitive types: box, cylinder, sphere, cone, torus
    - ✅ Transform handling (position, rotation, scale)
    - ✅ Integrated with SVG renderer - replaced 105-line legacy extractEdges()
    - ✅ Orthographic projection working (front/top/right views)
    - ✅ Visible/hidden line classification with proper SVG styling
    - ✅ Test suite validates edge counts (60-100 edges per view for block-hole fixture)
    - ✅ SVG output generated: `tests/output/block-hole.svg`
  - **Known Limitations**:
    - Visibility uses simple Z-depth heuristics (not ray-casting yet)
    - Per-primitive extraction (no CSG mesh integration)
    - Triangulated mesh edges shown (many more than logical drawing edges)
  - **Deferred Enhancements**:
    - Ray-casting visibility in projectEdges() (requires mesh access)
    - CSG mesh integration for accurate post-boolean edge visibility
    - Edge simplification/consolidation for cleaner drawings
- [x] Add dimensions and annotations (PHASE 2 COMPLETE)
  - **Status**: ✅ ISO-compliant dimensioning system implemented
  - **Progress**:
    - ✅ Created `src/drawing/dimensions.ts` (600+ lines) - core logic module
    - ✅ Type system: Dimension, LinearDimension, RadialDimension, AngularDimension
    - ✅ Automatic dimension placement per ISO 129-1 (8mm offset, 6mm spacing)
    - ✅ Bounding box dimensions: 6 total (width/height/depth across 3 views)
    - ✅ Feature dimensions: Cylinder diameters with Ø prefix and center marks
    - ✅ Created `src/drawing/dimensionsSVG.ts` (350+ lines) - rendering module
    - ✅ Extension lines with gaps (2mm) and overhangs (3mm)
    - ✅ Arrowheads: Filled polygons (3mm×1mm, 3:1 ratio per ISO)
    - ✅ Dimension text: Arial 3.5mm, no trailing zeros, minimal decimals
    - ✅ Radial dimensions: Leader lines at 45°, crossed chain-line center marks
    - ✅ All styling per ISO 128-24 (thin lines 0.35mm, black)
    - ✅ Integrated with SVG generator (dimensions render above edges)
    - ✅ Test validation: 7 dimensions in block-hole.svg (6 bbox + 1 cylinder Ø20)
  - **Current Capabilities**:
    - Linear dimensions (horizontal/vertical) with extension lines
    - Radial dimensions (diameter for cylinders) with center marks
    - Automatic text formatting (no trailing zeros: "100" not "100.0")
    - Priority-based system for future collision resolution
  - **Known Limitations**:
    - Basic placement (no collision detection yet)
    - Only detects cylindrical features (no holes, slots, or complex features)
    - Angular dimensions not yet implemented
  - **Deferred Enhancements**:
    - Collision detection and resolution (priority-based algorithm stubbed)
    - Angular dimensions for chamfers and bevels
    - Hole callouts (counterbores, countersinks)
    - Feature detection: slots, pockets, bosses
    - Dimension stacking for multiple parallel dimensions
- [ ] Section view generation
  - Section plane selection
  - Contour extraction
  - Hatch pattern rendering

## UI/UX and Integration

- [-] UI/UX and interactions
  - ✅ Orbit, pan, zoom controls working
  - ✅ Generate button with seed display
  - ✅ Bookmark/save functionality with localStorage
  - ✅ Difficulty selector (Beginner / Intermediate)
  - [ ] View presets (front/top/right quick views)
  - [ ] 2D viewer with scale selection
  - [ ] Start timer on 2D view
  - [ ] Export to PDF/DXF/STP
- [-] Client-side persistence and export
  - ✅ Bookmarking with localStorage
  - ✅ Legacy migration support for old data format
  - [ ] Migrate to IndexedDB for better storage
  - [ ] Client-side PDF/SVG generation
  - [ ] Offline support / service worker
- [ ] Scoring and timer implementation
  - Implement client-side timer, local records storage, prepare for optional cloud features later.
- [x] MVP implementation
  - ✅ Static web app with React + Three.js + Vite
  - ✅ Fully client-side, deployed to Vercel
  - ✅ Random 3D part generation working
  - ✅ CSG boolean operations rendering correctly
- [ ] Testing and documentation
  - Implement browser tests, document offline capabilities, create example models.

## Infrastructure

- [x] Add `tsconfig.node.json` for project reference
  - Create the node-specific tsconfig file so `tsconfig.json` project reference resolves (fix missing reference error).