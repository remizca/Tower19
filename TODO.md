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
  - [Next] Full rotation (rx, ry, rz) and scale support in recipes and renderer
- [ ] Implement feature generators
  - Patterns (linear, circular)
  - Fillets and chamfers
  - Ribs and webs
- [ ] Create intermediate difficulty generator
  - 5-8 primitives per part
  - More complex boolean combinations
  - Patterns and symmetry

## 2D Drawing Engine (Priority: Medium)

- [ ] Specify 2D drawing engine & ISO conventions
  - Detail projection (ISO first-angle), standards to follow (ISO 128, 129, 5456, 7200), dimensioning rules, line types, title block, section-view rules and how to generate them programmatically.
- [-] Implement SVG projection and rendering
  - **Current**: Basic orthographic projection for simple shapes
  - **Blocker**: Edge visibility classification needs robust solution for varied geometry
  - **Action**: Now that generator creates varied shapes, implement depth-buffer or ray-casting for general occlusion detection
  - **Test fixtures available**: Block-hole, L-bracket, T-bracket, Cylinder-cutout
- [ ] Edge visibility classification
  - Implement software z-buffer rasterization OR ray-casting approach
  - Test with varied shapes (block, L-bracket, T-bracket, cylinder)
  - Support all primitive types (box, cylinder, future: sphere, cone)
- [x] Create varied test fixtures for 2D rendering
  - ✅ Block+hole (simple case)
  - ✅ L-shapes, T-shapes
  - ✅ Parts with curved surfaces (cylinder)
  - Future: Multi-feature assemblies
- [ ] Add dimensioning system
  - Automatic dimension placement
  - Collision detection and resolution
  - Support for different dimension types (linear, radial, angular)
- [ ] Section view generation
  - Section plane selection
  - Contour extraction
  - Hatch pattern rendering

## UI/UX and Integration

- [-] UI/UX and interactions
  - ✅ Orbit, pan, zoom controls working
  - ✅ Generate button with seed display
  - ✅ Bookmark/save functionality with localStorage
  - [ ] View presets (front/top/right quick views)
  - [ ] 2D viewer with scale selection
  - [ ] Start timer on 2D view
  - [ ] Export to PDF/DXF/STP
  - [ ] Difficulty selector (currently hardcoded to Beginner)
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