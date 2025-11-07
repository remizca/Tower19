# Changelog

All notable changes to Tower19 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Nov 7, 2025)
- **More Primitives**: Added sphere, cone (frustum), and torus primitive types
  - Generator includes new strategies: Block with Spherical Pockets, Block with Countersinks, Block with Torus Cutout
  - 3D renderer updated to support subtraction/union with these primitives
- **Generator Variety**: Expanded beginner generator to create 6 different part types instead of just blocks with holes
  - New part types: L-Bracket, T-Bracket, Cylinder-with-cutouts, Stacked-blocks, Corner-bracket
  - Each part uses 2-6 primitives with varied boolean operations (union, subtract)
  - Deterministic variety using seed-based random number generation
  - All shapes render correctly in 3D viewer
- **Test Fixtures**: Created diverse test fixtures for 2D renderer development
  - `tests/fixtures/l-bracket.ts` - L-shaped bracket with mounting holes
  - `tests/fixtures/t-bracket.ts` - T-shaped bracket with symmetrical holes
  - `tests/fixtures/cylinder-cutout.ts` - Cylindrical part with box cutouts
  - `tests/fixtures/block-hole.ts` - Original simple block with holes
- **Testing**: Added generator variety verification test
  - New npm script: `npm run test:generator`
  - Validates that multiple seeds produce different part types
  - Confirms 4+ unique part types from sample seeds
- **Documentation**: Created comprehensive documentation
  - `docs/progress/generator-variety.md` - Detailed implementation summary
  - Updated `README.md` with current status and priorities
  - Updated `docs/progress/TODO.md` with completed tasks
  - Updated `docs/progress/PROGRESS.md` with milestone details

### Changed (Nov 7, 2025)
- Refactored `src/generators/beginner.ts` with strategy pattern
  - Each part type has dedicated generation function
  - Improved code organization and maintainability
  - Backward compatible with legacy `generateBeginner()` function
- Updated `tsconfig.json` to exclude test files from main build
- Fixed TypeScript compilation warnings in `src/drawing/svg.ts`
- Updated `package.json` with new test script

### Fixed (Nov 7, 2025)
- TypeScript build errors related to test file compilation
- Unused variable warnings in SVG rendering code

## [0.1.0] - 2025-11-06

### Initial Release
- Project scaffold with React + TypeScript + Three.js + Vite
- Basic 3D viewer with OrbitControls
- Simple procedural generator for blocks with holes
- CSG boolean subtraction for holes using @react-three/csg
- Local bookmarking with localStorage
- Deployment to Vercel
- Basic 2D SVG projection (incomplete)

---

## Upcoming Work

### Next Priorities
1. Implement robust edge visibility for 2D renderer (depth-buffer or ray-casting)
2. Add transformation support (rotation, scale) to generators
3. Create intermediate difficulty generator with more complex features
4. Implement proper dimensioning system for 2D drawings
5. Add timer functionality for practice sessions
6. Migrate storage from localStorage to IndexedDB

### Future Features
- Expert difficulty generator with advanced features
- Section view generation with hatch patterns
- Export to PDF and DXF formats
- Pattern generators (linear, circular arrays)
- Fillet and chamfer features
- Multi-difficulty selection in UI
