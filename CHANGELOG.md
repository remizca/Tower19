# Changelog

All notable changes to Tower19 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Nov 8, 2025)
- **2D Drawing Engine: ISO-Compliant Dimensioning System (Phase 2)**: Automatic dimension generation per ISO 129-1
  - Created `src/drawing/dimensions.ts` (600+ lines) - Core dimensioning logic
    - Type system: `Dimension`, `LinearDimension`, `RadialDimension`, `AngularDimension` interfaces
    - `DEFAULT_DIMENSION_CONFIG` with ISO-compliant spacing (8mm offset, 6mm between dims)
    - `generateDimensions()`: Main API for automatic dimension creation
    - `generateBoundingBoxDimensions()`: Creates 6 overall dimensions (width/height/depth per view)
    - `generateFeatureDimensions()`: Detects cylinders, creates diameter dimensions with Ø prefix
    - `formatDimensionValue()`: ISO text formatting (no trailing zeros, minimal decimals)
    - Priority system for collision resolution (100=bounding box, 80=features)
  - Created `src/drawing/dimensionsSVG.ts` (350+ lines) - SVG rendering module
    - `renderDimensions()`: Main rendering API, filters by view
    - Component renderers: extension lines (with gaps), arrowheads (3mm×1mm filled polygons), dimension text (Arial 3.5mm)
    - `renderLinearDimension()`: Complete linear dimensions with proper offsets
    - `renderRadialDimension()`: Leader lines at 45°, center marks (crossed chain lines), R/Ø prefixes
    - All styling per ISO 128-24 (thin lines 0.35mm, black, filled arrowheads)
  - Integrated with SVG generator (`src/drawing/svg.ts`)
    - Dimensions render above edges, scaled 2:1 for clarity
    - Console logging for dimension count per drawing
  - Test validation: `npm run test:svg` generates `block-hole.svg` with 7 dimensions
    - 6 bounding box dimensions (2 per view: width/height in front, width/depth in top, depth/height in right)
    - 1 cylinder diameter dimension (Ø20 in top view with center mark)
  - Separation of concerns: logic (dimensions.ts) vs rendering (dimensionsSVG.ts)
- **2D Drawing Engine: ISO Standards Specification**: Comprehensive technical reference for engineering drawings
  - Created `docs/specs/iso-drawing-standards.md` (500+ lines)
  - **Projection systems**: ISO first-angle (default) and third-angle projection per ISO 5456-2
  - **Line standards**: Complete ISO 128-24 line types (thick/thin, solid/dashed/chain) with SVG implementation
  - **Title block**: ISO 7200 requirements (part name, scale, projection symbol, units, date, seed)
  - **Dimensioning**: ISO 129-1 rules for linear, radial, angular dimensions with automatic placement algorithms
  - **Section views**: ISO 128-50 standards (cutting planes, hatch patterns, section labeling)
  - **Sheet sizes**: ISO 5457 A-series paper sizes and drawing areas with margins
  - **Scales**: ISO 5455 standard scales (2:1, 1:1, 1:2, 1:5) with auto-selection algorithm
  - **View arrangement**: First-angle layout strategies for 2-3 orthographic views
  - **Implementation roadmap**: 5 phases from basic projection to advanced features
  - **SVG examples**: Code snippets for hatching, dimensions, title blocks, projection symbols
  - Ready to implement Phase 2 (dimensioning system)
- **2D Drawing Engine: SVG Integration Complete**: Integrated edge extraction with SVG renderer
  - Updated `src/drawing/svg.ts` to use `extractRecipeEdges()` from edges module
  - Removed legacy 105-line `extractEdges()` function - single source of truth
  - SVG generation now processes triangulated mesh edges correctly
  - Test suite validates edge counts in orthographic views (front/top/right)
  - Generated SVG includes:
    - Visible edges (solid black lines, 0.7 stroke-width)
    - Hidden edges (dashed black lines, 0.5 stroke-width)
    - Proper view separation and title blocks
  - Test fixture `block-hole.svg` generated successfully with 76-83 edges per view
  - Edge counts within expected ranges for 32-segment cylinder geometry
  - Build passing, all TypeScript types correct
- **2D Drawing Engine: Edge Extraction Testing**: Comprehensive fixture validation
  - Created `tests/test-all-fixtures.ts` for end-to-end edge extraction testing
  - Validated edge extraction with all 4 test fixtures:
    - **Block-Hole**: 222 edges (1 box + 1 cylinder, simple subtraction)
    - **L-Bracket**: 444 edges (2 boxes + 2 cylinders, union + mounting holes)
    - **T-Bracket**: 666 edges (3 boxes + 3 cylinders, complex union assembly)
    - **Cylinder-Cutout**: 1251 edges (1 box + 1 torus, torus cutout)
  - All fixtures pass with correct edge structure (start/end Vector3 properties)
  - Edge counts validated against expected ranges for primitive complexity
  - Demonstrates edge extraction works for all primitive types: box, cylinder, torus
  - Confirms extraction handles transforms and multiple operations correctly
- **2D Drawing Engine: Edge Extraction Module**: Created robust mesh-based edge extraction system
  - New `src/drawing/edges.ts` module with comprehensive edge analysis capabilities
  - `extractSharpEdges()`: Analyzes BufferGeometry to detect sharp edges based on face angles
    - Uses 30° angle threshold to distinguish sharp edges from smooth surfaces
    - Detects boundary edges (single adjacent face) and interior sharp edges (face angle > threshold)
    - Returns Edge objects with start/end Vector3 points
  - `extractSilhouetteEdges()`: Identifies silhouette edges where one face is front-facing and other is back-facing
    - Essential for correct hidden line rendering in orthographic projections
    - View-direction aware edge classification
  - `classifyEdgeVisibility()`: Ray-casting based visibility detection
    - Tests multiple points along edge (start, end, midpoint) for occlusion
    - Uses Three.js Raycaster for accurate intersection detection
    - Returns ClassifiedEdge with visible/hidden status
  - `extractRecipeEdges()`: Convenience function to extract all edges from PartRecipe
    - Supports all primitive types: box, cylinder, sphere, cone, torus
    - Handles transforms: position, rotation (degrees to radians), scale
    - Backward compatible with legacy axis parameter for cylinders
  - `createPrimitiveGeometry()`: Factory for creating Three.js geometries from recipe primitives
  - `applyPrimitiveTransform()`: Applies position/rotation/scale transforms to geometries
  - Tested with block-hole fixture: 222 edges extracted from box + cylinder assembly
  - Ready for integration with CSG renderer for final mesh analysis
- **SVG Projection Updates**: Updated svg.ts to use new Edge type
  - Changed from tuple `[Vector3, Vector3]` to object `{ start: Vector3, end: Vector3 }`
  - Added viewDirection to ViewConfig for future silhouette edge support
  - Maintains backward compatibility with existing projection logic
  - Builds successfully, ready for full integration

### Added (Nov 7, 2025)
- **Ribs and Webs Features**: Completed structural reinforcement feature generators
  - Added beginner strategies:
    - 'Block with Support Ribs': Flat base with 2-4 parallel ribs for structural support
    - 'Bracket with Web Reinforcement': L-bracket with 1-2 diagonal webs connecting legs
  - Extended features.ts with three new helpers:
    - `generateRibFeatures()`: Parallel ribs perpendicular to base surface
    - `generateWebFeatures()`: Thin plates connecting structural elements with configurable rotation
    - `generateRadialRibFeatures()`: Ribs radiating from center point for circular structures
  - Now 16 total beginner strategies (up from 14)
  - Completes all planned feature generators (patterns, chamfers, fillets, ribs, webs)
- **Intermediate Difficulty Generator**: Implemented complete intermediate-level generator with 4 strategies
  - Multi-Feature Block: Combines linear patterns, pockets, and corner chamfers (5-8 primitives)
  - Patterned Bracket: L-bracket with circular pattern on vertical face and linear pattern in base (6-9 primitives)
  - Complex Cylinder Assembly: Cylinder with flanges, bolt patterns, and central bore (8-15 primitives)
  - Symmetric Mounting Plate: Block with symmetric corner holes, circular center pattern, and side slots (11-14 primitives)
  - All strategies use 5-8+ primitives with mixed union/subtract operations
  - Integrated with UI via difficulty selector dropdown
- **Shared Features Module**: Created `src/generators/features.ts` with reusable helpers
  - `generateChamferFeatures()`: Parameterized chamfer generation using rotated box subtraction
  - `generateFilletFeatures()`: Parameterized fillet generation using cylinder subtraction
  - `generateLinearPattern()`: Generic linear array pattern with optional perpendicular variation
  - `generateCircularPattern()`: Generic circular pattern with configurable axis and angle offset
  - `EDGE_CONFIGS`: Standard edge configurations (all corners, front/back, left/right)
  - Enables consistent feature generation across all difficulty levels
- **Feature Generators**: Fillets and Chamfers
  - Added beginner strategies:
    - 'Block with Chamfered Edges' (45° edge cuts using rotated box subtraction)
    - 'Block with Edge Fillets' (rounded external edges using cylinder subtraction)
  - Approximations use existing primitives and boolean operations, consistent with CSG constraints
- **Pattern Generators**: Implemented linear and circular hole pattern strategies
  - 'Block with Linear Hole Pattern': 3-5 holes evenly spaced along X axis with slight Y variation
  - 'Cylinder with Circular Hole Pattern': 4-8 holes arranged in circular pattern around cylinder axis
  - Both patterns use transform.position for precise hole placement
  - Now 14 total beginner strategies (up from 12)
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
