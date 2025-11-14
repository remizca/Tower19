# Implementation Progress

This document tracks detailed implementation progress and technical decisions for each major feature area. While TODO.md shows high-level task status, this document captures the specifics of what has been implemented.

## Core Data Model ✓
- ✅ Defined PartRecipe type system in TypeScript
- ✅ Created JSON schema for validation
- ✅ Added Ajv validation helpers
- ✅ Implemented migration from legacy BeginnerRecipe format
- ✅ Added TypeScript strict checks

## 3D Generator Algorithms ✓
- ✅ Specified difficulty-based generation rules
- ✅ Documented heuristics for part complexity
- ✅ Listed required Three.js + CSG libraries
- ✅ Defined primitive generation approach
- ✅ Specified boolean operation rules
- ✅ **NEW (Nov 7, 2025)**: Implemented varied part generation strategies
  - 6 different part types for beginner level
  - Deterministic variety using seed-based RNG
  - Test fixtures created for L-bracket, T-bracket, cylinder-cutout
  - Verification test confirms variety (`npm run test:generator`)
  - Details: `docs/progress/generator-variety.md`

## CSG Implementation ✓
- ✅ Integrated @react-three/csg library
- ✅ Implemented boolean subtraction for holes
- ✅ Verified correct rendering in R3F
- ✅ Added type definitions for CSG operations

## UI/UX and Interactions ✅ COMPLETE (2D Viewer - Nov 11, 2025)
- ✅ Orbit controls (3D viewer)
- ✅ Pan controls (3D viewer)
- ✅ Zoom controls (3D viewer)
- ✅ View mode switcher (3D/2D tabs) (UI-02 - Nov 11, 2025)
- ✅ 2D Drawing Viewer component (UI-01 - Nov 11, 2025)
  - Interactive pan/zoom controls for 2D drawings
  - Download SVG functionality
  - Part information overlay
  - Zoom percentage display
- ✅ Timer integration (UI-03 - Nov 11, 2025)
  - Automatic timer start when viewing 2D drawings
  - Real-time display in MM:SS format
- ✅ Save/bookmark functionality
- ✅ Difficulty selector (Beginner/Intermediate)
- [ ] View presets (quick front/top/right views)
- [ ] Export options (PDF/DXF/STP)

## Client-side Storage (In Progress)
- [ ] IndexedDB schema design
- [ ] Migration utilities
- [ ] Bookmark storage implementation
- [ ] Export generation
- [ ] Offline support configuration

## 2D Drawing Engine ✅ COMPLETE
A centralized, actionable checklist for the 2D drawing engine lives here. Subtasks are tracked in the managed todo list as well (see in-repo todo). The high-level objective is to produce ISO-compliant orthographic drawings (SVG) with dimensions, title block, and optional sections.

**Overall Status**: Phase 4 Complete ✅ (Nov 11, 2025)

- ✅ ISO standard compliance (references added)
- ✅ Projection system documented (first-angle)
- ✅ Dimensioning rules (heuristics drafted)
- ✅ Line types (weights & patterns documented)
- ✅ Title block generation (template drafted)
- ✅ **Phase 1: Basic Projection & Rendering** (COMPLETE - Nov 7, 2025)
- ✅ **Phase 2: Dimensioning System** (COMPLETE - Nov 8, 2025)
- ✅ **Phase 3: Enhanced Drawing Features** (COMPLETE - Nov 8–11, 2025)
- ✅ **Phase 4: Section Views** (COMPLETE - Nov 11, 2025)

Detailed sub-tasks (tree):

1. **Phase 1: Basic Projection & Rendering** ✅ COMPLETE (Nov 7, 2025)
   - ✅ Edge extraction from primitives (src/drawing/edges.ts - 410 lines)
   - ✅ Sharp edge detection (30° angle threshold)
   - ✅ Silhouette edge detection for view-dependent visibility
   - ✅ Orthographic projection (front/top/right views)
   - ✅ Visible/hidden line classification
   - ✅ SVG rendering with proper styling (solid/dashed lines)
   - ✅ Test suite validation (60-100 edges per view)

2. **Phase 2: Dimensioning System** ✅ COMPLETE (Nov 8, 2025)
   - ✅ Core dimension types (Linear, Radial, Angular)
   - ✅ Bounding box dimensions (6 total across 3 views)
   - ✅ Feature dimensions (cylinder diameters with Ø prefix)
   - ✅ Automatic placement per ISO 129-1 (8mm offset, 6mm spacing)
   - ✅ Extension lines with gaps (2mm) and overhangs (3mm)
   - ✅ Arrowheads (filled polygons, 3mm×1mm, 3:1 ratio)
   - ✅ Dimension text formatting (Arial 3.5mm, no trailing zeros)
   - ✅ Center marks for radial features (crossed chain lines)
   - [x] SVG integration and rendering (src/drawing/dimensionsSVG.ts - 350 lines)
   - [x] Test validation (7 dimensions in block-hole.svg)

3. **Phase 3: Enhanced Drawing Features** ✅ COMPLETE (Nov 8–11, 2025)
   - [x] 2D-20: Line weight implementation (✅ Complete - Nov 8, 2025)
     - goal: Thick lines (0.7mm) for outlines, thin (0.35mm) for dimensions/hatching per ISO 128-24
     - acceptance: SVG has proper stroke-width attributes for different line types
     - **status**: ✅ Created `src/drawing/lineTypes.ts` with comprehensive ISO 128-24 line type system
     - **implemented**: LineType enum, LINE_STYLES mapping, CSS generation, all line types defined
     - **line types**: visible-edge (0.7mm), hidden-edge (0.35mm dashed), dimension (0.35mm), center-line (0.35mm chain), etc.
   - [x] 2D-21: Center lines for cylindrical features (✅ Complete - Nov 8, 2025)
     - goal: Crossed chain lines showing axes of cylinders, cones
     - acceptance: Center lines render with proper dasharray (8,2,2,2) pattern
     - **status**: ✅ Created `src/drawing/centerLines.ts` (400+ lines) with full center line system
     - **implemented**: extractCenterLines(), extractCylinderCenterLines(), extractConeCenterLines(), renderCenterLines()
     - **features**: Cross lines for end-on views, axis lines for side views, extends 5mm beyond features, min 10mm diameter threshold
     - **tested**: block-hole fixture shows crossed center lines in front view, axis lines in top/right views
   - [x] 2D-22: Scale selection algorithm (✅ Complete - Nov 8, 2025)
     - goal: Automatically select standard scale (1:1, 1:2, 2:1, etc.) to fit drawing on page
     - acceptance: Drawing fits within A4/A3 margins with appropriate scale
     - **status**: ✅ Integrated scale selection into `src/drawing/svg.ts` with ISO 5455 compliant scales
     - **implemented**: Page layout (2×2 grid with margins/gaps), per-view bounding calculation, standard scale array [10, 5, 2, 1, 0.5, 0.25, 0.2, 0.1], global fit constraint selection, dynamic view centering, title block scale label formatting
     - **algorithm**: Computes usable area after margins (15mm) and gaps (10mm), divides into slots for front/top/right views, estimates mm extents from bounding box, calculates max scale fitting each view, selects largest standard scale ≤ global limit
     - **tested**: Test suite validates 1:1 (default 100×50×25mm part), 1:2 (large 250×200×150mm part), 5:1 (tiny 20×10×10mm part)
   - [x] 2D-23: Dimension collision detection (✅ Complete - Nov 11, 2025)
     - goal: Detect overlapping dimensions and text, relocate to prevent collisions
     - acceptance: No overlapping dimension text or extension lines in output
     - **status**: ✅ Implemented view-aware collision detection and priority-based resolution
     - **implemented**: 
       - Bounding box calculation: `getDimensionBounds()` computes accurate AABB for linear/radial/angular dimensions
       - Type-specific bounds: `getLinearDimensionBounds()`, `getRadialDimensionBounds()`, `getAngularDimensionBounds()`
       - Text approximation: `getTextBounds()` uses character count × 0.6 × textHeight
       - Collision detection: `boundsOverlap()` checks AABB overlap with configurable margin (1mm default)
       - View filtering: Only checks collisions within same view (front/top/right are separate)
       - Priority-based resolution: Higher-priority dimensions (bbox=100) placed first, lower-priority relocated
       - Relocation strategies: Linear (increase offset), radial (extend leader), angular (increase radius)
       - Extension line exclusion: Only dimension line and text included in bounds (extensions allowed to cross)
     - **algorithm**: Groups by view → sorts by priority descending → for each dimension, checks collision with already-placed dimensions → relocates up to 10 attempts if collision detected
     - **fixes applied**:
       - Initial perpendicular dimension offsets increased by `minSpacingBetween + 4mm` to avoid corner collisions
       - Extension lines excluded from bounds calculation to allow traditional drafting crossovers
       - View-based collision filtering prevents false positives from cross-view overlaps
     - **tested**: `npm run test:collision` validates block-hole fixture has zero collisions after resolution

4. **Phase 4: Section Views** ✅ COMPLETE (Nov 11, 2025)
   - [x] 2D-24: Section plane selection and cutting
     - Implemented `selectCuttingPlane()` with midplane heuristic (perpendicular to largest axis)
     - CuttingPlane includes id, type, position, normal, viewDirection, parentView
   - [x] 2D-25: Contour extraction from cut geometry
     - **Dual-mode slicing**:
       - CSG mode: `sliceGeometryCSG()` with plane-triangle intersection, segment extraction, loop stitching
       - Simplified mode: Rectangular bounds + cylindrical holes (fallback when geometry unavailable)
     - Classify contours as outer (ccw) and inner (cw) via relative area
     - Automatic fallback ensures robustness
   - [x] 2D-26: Hatch pattern rendering (45° lines, 3mm spacing)
     - `generateHatchLines()` with polygon clipping
     - `clipLineToPolygon()` + `lineSegmentIntersection()` implementations
     - SVG rendering via `renderSectionView()` and `renderHatchLines()`
     - Thick (0.7mm) outlines, thin (0.35mm) hatch per ISO 128-50
   - [x] 2D-27: CSG slicing implementation (Complete Nov 11, 2025)
     - **status**: ✅ Created `src/drawing/slicing.ts` (560+ lines) with accurate geometry slicing
     - **implemented**:
       - `sliceGeometryCSG()`: Main entry point accepting BufferGeometry and cutting plane
       - `extractIntersectionSegments()`: Iterates all triangles, finds plane intersections
       - `intersectTriangleWithPlane()`: Geometric algorithm using signed distances
       - `projectSegmentsTo2D()`: Establishes cutting plane coordinate system (X/Y perpendicular to normal)
       - `stitchSegmentsIntoLoops()`: Graph traversal to connect segments within tolerance (0.001mm)
       - `buildLoop()`: Recursive path builder for closed contours
       - `classifyLoops()`: Relative area-based classification (largest = outer, same sign = outer, opposite = inner)
     - **algorithm details**: For each triangle: compute signed distances of vertices to plane → classify as above/on/below → find 2 edge-plane intersection points → collect all segments → project to 2D plane coordinates → build edge graph → stitch into loops matching endpoints → classify by area
     - **tested**: `npm run test:slicing` → Box: 8 vertices, 1 outer contour; Cylinder: 64 vertices, 1 outer contour
   - [x] 2D-28: SVG integration with layout and indicators (Complete Nov 11, 2025)
     - **status**: ✅ Section views fully integrated into main drawing layout
     - **implemented**:
       - Modified `generateDrawing()` to accept optional BufferGeometry parameter
       - Automatic section view generation when part has subtraction operations
       - Section positioned in bottom-right quadrant (below right view)
       - Cutting plane indicator rendered in parent orthographic view with:
         - Chain-thick line style (2× center line weight per ISO 128-50)
         - Arrowheads pointing in viewing direction
         - A-A labels at line ends
       - View bounds calculation for proper indicator placement
       - Error handling with graceful fallback
     - **integration details**: 
       - Section view placement: `marginU + slotW + gapU + slotW/2` (right side), `marginU + slotH + gapU + slotH/2` (bottom)
       - Parent view determined by `plane.parentView` property ('front' | 'top' | 'right')
       - Cutting plane indicator drawn with `renderCuttingPlaneIndicator()` in parent view coordinate system
       - Both simplified and CSG modes supported with automatic fallback
     - **tested**: `npm run test:svg-integration` → All 6 checks passed:
       - Simplified mode: section view ✓, cutting plane ✓, hatch pattern ✓
       - CSG mode: section view ✓, cutting plane ✓, hatch pattern ✓
       - Output files: `tests/output/drawing-simplified.svg`, `tests/output/drawing-csg.svg`
   - [x] Projection & classification utilities
     - `projectContours()`: Scales & orients 2D cut to view space
     - `classifyContours()`: Separates hatched (outer) vs outline-only (inner holes)
   - **Test Coverage**:
     - `npm run test:slicing` → Box: 8 vertices, Cylinder: 64 vertices (2/2 passed)
     - `npm run test:hatch` → 19 hatch lines for 50×30 rectangle
     - `npm run test:section` → Validates both simplified and CSG modes (2 contours vs 1 contour)
     - `npm run test:svg-integration` → Validates complete drawing with section + indicator (6/6 passed)
   - **Phase 4 Summary**: Complete section view system with dual-mode slicing (CSG + simplified), hatch rendering, and full SVG integration. Cutting plane indicators properly placed in parent views with ISO-compliant styling. All test suites passing.5. Prototype & renderer (Legacy tasks - integrated above)
   - [x] 2D-15: Prototype Block+Hole SVG renderer (✅ Complete - Phase 1)
     - goal: output single-page SVG for Block+Hole fixture
     - acceptance: SVG contains expected visible/hidden edge counts and a title block
     - **status**: COMPLETE - Edge extraction and SVG generation working

6. Tests & fixtures (Legacy tasks - integrated above)
   - [x] 2D-16: Add unit test fixtures (Block+Hole, L-shape, internal pocket)
     - goal: provide deterministic geometry fixtures and test assertions
     - **status**: ✅ Complete - Created fixtures for:
       - `tests/fixtures/block-hole.ts` - Simple block with holes
       - `tests/fixtures/l-bracket.ts` - L-shaped bracket
       - `tests/fixtures/t-bracket.ts` - T-shaped bracket
       - `tests/fixtures/cylinder-cutout.ts` - Cylinder with box cutouts
     - **used in**: Phase 1 and Phase 2 testing

7. Export & examples (Future work)
   - [ ] 2D-17: Implement rendering/export examples (SVG → PDF, DXF) for prototype
     - goal: show scale-preserved PDF and a DXF with layers for line types

8. Dimensioning refinement (Moved to Phase 3)
   - [ ] 2D-18: Dimension collision heuristics → **Now 2D-23** (Phase 3)
     - goal: implement simple collision detection and automatic relocation of overlapping dims

9. Sections & hatch (Phase 4)
   - [ ] 2D-19: Section generation prototype → **Now 2D-24, 2D-25, 2D-26** (Phase 4)
     - goal: select cutting plane, extract contour, render 45° hatch for cut faces

**Current Focus**: Phase 4 complete. 2D Drawing Viewer UI integration complete (Nov 11, 2025). Next priorities: Export pipeline (PDF/DXF), advanced features (extended section types, angular dimensions), expert difficulty generator.

**Recent Completion (Nov 11, 2025)**: UI Integration
- ✅ Created `src/viewers/DrawingViewer.tsx` - Interactive 2D drawing viewer component
  - Pan/zoom controls using mouse (drag to pan, wheel to zoom)
  - Reset view button to restore default viewport
  - Download SVG button for offline practice
  - Timer display in MM:SS format
  - Part information overlay (name, dimensions, primitive/operation counts)
  - Zoom percentage display
- ✅ Modified `src/App.tsx` - View mode switcher and CSG geometry extraction
  - Added 3D/2D tab buttons for seamless navigation
  - CSG geometry extraction via ref callback on mesh
  - Passes BufferGeometry to DrawingViewer for accurate section views
  - Conditional rendering based on view mode state
- ✅ Test results: Dev server running, UI fully functional, no compilation errors

Notes:
- Each numbered sub-task maps to the managed in-repo todo items (2D-15..2D-19) so status is visible in both the todo list and this PROGRESS document.
- When a sub-task moves, update both the managed todo and the checklist here to keep them synchronized.

Files changed:
- `docs/specs/2d-drawing.md` — detailed specification (progress & next steps moved to this file)

## Testing (Not Started)
- [ ] Unit test framework setup
- [ ] Browser testing configuration
- [ ] Example model generation
- [ ] Offline capability testing

## Development Infrastructure ✓
- ✅ GitHub repository setup
- ✅ Vercel deployment configuration
- ✅ Build process optimization
- ✅ TypeScript project references
- ✅ Static deployment verification