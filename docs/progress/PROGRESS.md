# Implementation Progress

This document tracks detailed implementation progress and technical decisions for each major feature area. While TODO.md shows high-level task status, this document captures the specifics of what has been implemented.

## Core Data Model ✓
- [x] Defined PartRecipe type system in TypeScript
- [x] Created JSON schema for validation
- [x] Added Ajv validation helpers
- [x] Implemented migration from legacy BeginnerRecipe format
- [x] Added TypeScript strict checks

## 3D Generator Algorithms ✓
- [x] Specified difficulty-based generation rules
- [x] Documented heuristics for part complexity
- [x] Listed required Three.js + CSG libraries
- [x] Defined primitive generation approach
- [x] Specified boolean operation rules
- [x] **NEW (Nov 7, 2025)**: Implemented varied part generation strategies
  - 6 different part types for beginner level
  - Deterministic variety using seed-based RNG
  - Test fixtures created for L-bracket, T-bracket, cylinder-cutout
  - Verification test confirms variety (`npm run test:generator`)
  - Details: `docs/progress/generator-variety.md`

## CSG Implementation ✓
- [x] Integrated @react-three/csg library
- [x] Implemented boolean subtraction for holes
- [x] Verified correct rendering in R3F
- [x] Added type definitions for CSG operations

## UI/UX and Interactions (In Progress)
- [ ] Orbit controls
- [ ] Pan controls
- [ ] Zoom controls
- [ ] View presets
- [ ] 2D viewer scale selection
- [ ] Timer integration
- [ ] Save/bookmark functionality
- [ ] Export options (PDF/DXF/STP)
- [ ] Difficulty selector

## Client-side Storage (In Progress)
- [ ] IndexedDB schema design
- [ ] Migration utilities
- [ ] Bookmark storage implementation
- [ ] Export generation
- [ ] Offline support configuration

## 2D Drawing Engine (In Progress)
A centralized, actionable checklist for the 2D drawing engine lives here. Subtasks are tracked in the managed todo list as well (see in-repo todo). The high-level objective is to produce ISO-compliant orthographic drawings (SVG) with dimensions, title block, and optional sections.

**Overall Status**: Phase 2 Complete ✅ | Phase 3 In Progress 🔄

- [x] ISO standard compliance (references added)
- [x] Projection system documented (first-angle)
- [x] Dimensioning rules (heuristics drafted)
- [x] Line types (weights & patterns documented)
- [x] Title block generation (template drafted)
- [x] **Phase 1: Basic Projection & Rendering** (COMPLETE - Nov 7, 2025)
- [x] **Phase 2: Dimensioning System** (COMPLETE - Nov 8, 2025)
- [ ] **Phase 3: Enhanced Drawing Features** (IN PROGRESS - Started Nov 8, 2025)
- [ ] Section view generation (algorithm drafted, needs prototyping)

Detailed sub-tasks (tree):

1. **Phase 1: Basic Projection & Rendering** ✅ COMPLETE (Nov 7, 2025)
   - [x] Edge extraction from primitives (src/drawing/edges.ts - 410 lines)
   - [x] Sharp edge detection (30° angle threshold)
   - [x] Silhouette edge detection for view-dependent visibility
   - [x] Orthographic projection (front/top/right views)
   - [x] Visible/hidden line classification
   - [x] SVG rendering with proper styling (solid/dashed lines)
   - [x] Test suite validation (60-100 edges per view)

2. **Phase 2: Dimensioning System** ✅ COMPLETE (Nov 8, 2025)
   - [x] Core dimension types (Linear, Radial, Angular)
   - [x] Bounding box dimensions (6 total across 3 views)
   - [x] Feature dimensions (cylinder diameters with Ø prefix)
   - [x] Automatic placement per ISO 129-1 (8mm offset, 6mm spacing)
   - [x] Extension lines with gaps (2mm) and overhangs (3mm)
   - [x] Arrowheads (filled polygons, 3mm×1mm, 3:1 ratio)
   - [x] Dimension text formatting (Arial 3.5mm, no trailing zeros)
   - [x] Center marks for radial features (crossed chain lines)
   - [x] SVG integration and rendering (src/drawing/dimensionsSVG.ts - 350 lines)
   - [x] Test validation (7 dimensions in block-hole.svg)

3. **Phase 3: Enhanced Drawing Features** 🔄 IN PROGRESS (Started Nov 8, 2025)
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
   - [ ] 2D-22: Scale selection algorithm
     - goal: Automatically select standard scale (1:1, 1:2, 2:1, etc.) to fit drawing on page
     - acceptance: Drawing fits within A4/A3 margins with appropriate scale
   - [ ] 2D-23: Dimension collision detection
     - goal: Detect overlapping dimensions and text, relocate to prevent collisions
     - acceptance: No overlapping dimension text or extension lines in output

4. **Phase 4: Section Views** 📋 PLANNED
   - [ ] 2D-24: Section plane selection and cutting
   - [ ] 2D-25: Contour extraction from cut geometry
   - [ ] 2D-26: Hatch pattern rendering (45° lines, 2mm spacing)

5. Prototype & renderer (Legacy tasks - integrated above)
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

**Current Focus**: Phase 3 - Line weights, center lines, scale selection, collision detection

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
- [x] GitHub repository setup
- [x] Vercel deployment configuration
- [x] Build process optimization
- [x] TypeScript project references
- [x] Static deployment verification