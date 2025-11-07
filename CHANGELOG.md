# Changelog

All notable changes to Tower19 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Nov 7, 2025)
- **Pattern Generators**: Implemented linear and circular hole pattern strategies
  - 'Block with Linear Hole Pattern': 3-5 holes evenly spaced along X axis with slight Y variation
  - 'Cylinder with Circular Hole Pattern': 4-8 holes arranged in circular pattern around cylinder axis
  - Both patterns use transform.position for precise hole placement
  - Now 14 total generator strategies (up from 12)
  
- **Feature Generators**: Fillets and Chamfers
  - Added beginner strategies:
    - 'Block with Chamfered Edges' (45° edge cuts using rotated box subtraction)
    - 'Block with Edge Fillets' (rounded external edges using cylinder subtraction)
  - Approximations use existing primitives and boolean operations, consistent with CSG constraints
- **Full Transform Support**: Implemented complete rotation (x, y, z Euler angles in degrees) and scale (x, y, z) support
  - `computeTransform()` helper in App.tsx handles position/rotation/scale from transform objects
  - Rotation values in recipes are in degrees, converted to radians for Three.js
  - Scale support for non-uniform scaling of primitives
  - Backward compatible with axis-based rotation fallback
  - New generator strategy: 'Block with Angled Holes' demonstrates rotation transforms (15-45° angles)
- **Production Deployment**: Fixed and verified working deployment to Vercel
  - Added seed display next to Generate button for visibility
  - Added debug console logs for ModelRenderer state tracking
  - All features working in production environment
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
- **Build Configuration**: Optimized for production deployment
  - Added manual chunk splitting in vite.config (react, three, r3f separate bundles)
  - Raised chunkSizeWarningLimit to 1500 KB to reduce build noise
  - Configured Vercel buildCommand and outputDirectory explicitly
- **Validation**: Replaced Ajv with lightweight shape validator
  - Removed Ajv from client bundle to avoid import resolution issues
  - Uses `isMinimalPartRecipe` for runtime validation
  - Significantly reduces bundle size (~115 KB saved)
- **Renderer**: Applied transforms to CSG brushes
  - `Addition`/`Subtraction` now read `tool.transform.position` (in mm) and apply dm scaling
  - Axis-based rotation supported via `params.axis` ('x'|'y'|'z')
  - Preserves CSG requirement of direct geometry+material children (no extra groups)
- Refactored `src/generators/beginner.ts` with strategy pattern
  - Each part type has dedicated generation function
  - Improved code organization and maintainability
  - Backward compatible with legacy `generateBeginner()` function
- Updated `tsconfig.json` to exclude test files from main build
- Fixed TypeScript compilation warnings in `src/drawing/svg.ts`
- Updated `package.json` with new test script

### Fixed (Nov 7, 2025)
- **Critical Rendering Fix**: Removed `<group>` wrappers inside CSG `<Geometry>`
  - @react-three/csg requires direct geometry+material pairs as children
  - Fixes blank canvas issue in production deployment
  - All primitive types now render correctly (box, cylinder, sphere, cone, torus)
- **Vercel Build Errors**: 
  - Resolved Rollup import resolution failure for 'ajv' module
  - Fixed blank page by configuring proper output directory
  - Build now succeeds on Vercel with optimized chunks
- **UI Interaction**: Ensured overlay controls have pointer-events for clickability
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
