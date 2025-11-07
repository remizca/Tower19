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

- [x] ISO standard compliance (references added)
- [x] Projection system documented (first-angle)
- [x] Dimensioning rules (heuristics drafted)
- [x] Line types (weights & patterns documented)
- [x] Title block generation (template drafted)
- [ ] Section view generation (algorithm drafted, needs prototyping)

Detailed sub-tasks (tree):

1. Prototype & renderer
   - [~] 2D-15: Prototype Block+Hole SVG renderer (minimal projection + hidden-line) — **PAUSED**
     - goal: output single-page SVG for Block+Hole fixture
     - acceptance: SVG contains expected visible/hidden edge counts and a title block
     - **blocker**: Edge visibility classification needs robust algorithm for varied geometry
     - **decision**: Paused to expand generator variety first; now unblocked with varied shapes available

2. Tests & fixtures
   - [x] 2D-16: Add unit test fixtures (Block+Hole, L-shape, internal pocket)
     - goal: provide deterministic geometry fixtures and test assertions
     - **status**: ✅ Complete - Created fixtures for:
       - `tests/fixtures/block-hole.ts` - Simple block with holes
       - `tests/fixtures/l-bracket.ts` - L-shaped bracket
       - `tests/fixtures/t-bracket.ts` - T-shaped bracket
       - `tests/fixtures/cylinder-cutout.ts` - Cylinder with box cutouts
     - **next**: Use these fixtures to test 2D renderer with varied geometry

3. Export & examples
   - [ ] 2D-17: Implement rendering/export examples (SVG → PDF, DXF) for prototype
     - goal: show scale-preserved PDF and a DXF with layers for line types

4. Dimensioning refinement
   - [ ] 2D-18: Dimension collision heuristics
     - goal: implement simple collision detection and automatic relocation of overlapping dims

5. Sections & hatch
   - [ ] 2D-19: Section generation prototype
     - goal: select cutting plane, extract contour, render 45° hatch for cut faces

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