# 2D Drawing Engine Specification (Detailed)

This document defines the 2D drawing engine for producing ISO-style orthographic drawings from generated 3D PartRecipes. It is written to be implementable in code and includes data shapes, projection math, algorithms for view/layout, dimensioning heuristics, and export considerations (SVG, PDF, DXF).

## Goals / Contract
- Input: Part geometry (Three.js BufferGeometry or equivalent) and `PartRecipe` metadata (units in mm, scale, name, seed).
- Output: One or more 2D drawing pages (SVG primary, optionally exported to PDF/DXF) containing orthographic views, dimensions, title block, and optional section views.
- Error modes: missing geometry, extremely small features (near-zero), invalid units. Engine should return a validation error rather than a broken drawing.

## Standards
- Primary: ISO 128 (presentation), ISO 129 (dimensioning), ISO 5456 (projection), ISO 7200 (title block metadata).
- Use first-angle projection by default (configurable to third-angle if needed).

## Data shapes

Part input (conceptual):

```ts
interface DrawingInput {
  id: string;
  geometry: BufferGeometry; // indexed or non-indexed
  units: 'mm' | 'inch';
  scale?: number; // e.g., 1 means 1:1
  name?: string;
  seed?: number;
}
```

Generated output structure:

```ts
interface DrawingPage {
  widthMm: number;
  heightMm: number;
  viewports: Viewport[];
  titleBlock: TitleBlock;
}

interface Viewport {
  name: 'Front' | 'Top' | 'Right' | 'Isometric' | string;
  transform: string; // SVG transform or view transform matrix
  paths: string[]; // SVG path data for visible edges, hidden, centers
  dimensions: Dimension[];
}
```

## Projection math

- Use first-angle projection:
  - Front view: project onto YZ plane (camera along +X)
  - Top view: project onto XZ plane (camera along -Y)
  - Right view: project onto YZ plane from +X (or XZ depending on conventions)
- Implementation: transform all 3D vertices by view matrix, then orthographically project by dropping one coordinate and scaling by units.

Pseudocode for orthographic projection (front):

```
for each vertex v in geometry:
  v_view = camera_matrix * v
  projected = (v_view.y * scale, v_view.z * scale) // mm -> drawing units

collect edges by triangle adjacency; compute visible edges by backface culling and edge-face counts
```

## Edge classification

1. Visible edges: edges between a visible face and another face (or edge on convex hull).
2. Hidden edges: edges not directly visible from the chosen view (backface or occluded). Compute via depth test or by checking triangle normals and z-order.
3. Center lines: for circular/arc features, compute center line primitives separately.

Algorithm notes:
- Use face normal sign in view space for basic visibility (backface culling).
- For occlusion between non-adjacent geometry (e.g., an internal cavity), use a 2D depth buffer / painter's algorithm on projected primitives (triangles) for robust hidden-line detection.

## Dimensioning algorithm (heuristic)

1. Feature detection: detect primitives and important features (extents, holes, radii, centerlines).
2. Prioritize dimensions: overall bounding box dimensions (height/width/depth) first, then hole positions, then radii/diameters.
3. Placement rules:
   - Place outside the object when possible.
   - Keep a minimum margin (e.g., 5 mm) from visible geometry.
   - Avoid overlapping text and dimension lines by simple collision checks; if conflict, move dimension to alternate side or create a dedicated detail view.

Pseudocode snippet (linear dimensions):

```
bbox = computeBoundingBox(projectedVertices)
placeDimension('width', bbox.left, bbox.right, y = bbox.top + margin)
for each hole:
  placePositionDimension(hole.center.x, nearestEdge, outside)
```

## Section generation

- Heuristic: generate sections only if internal features are detected or requested.
- Choose cutting plane to pass through feature centers (e.g., hole centers or large pockets).
- For each section:
  - Intersect geometry with cutting plane to produce contours
  - Fill hatched areas for cut faces (45° hatch, spacing based on scale)

## Line styles and weights

- Visible lines: solid, stroke-width mapped to drawing scale (default 0.7 mm at 1:1)
- Hidden lines: dashed (dash/gap scaled to drawing scale)
- Center lines: chain, lighter weight
- Section hatch: thin lines at 45° with spacing depending on scale

## Title block

- Standard fields: Drawing number, Part name, Scale, Units, Date, Author, Revision
- Place at bottom-right of the page, with field widths sized for legibility at common paper sizes (A4, A3).

Title block data shape:

```ts
interface TitleBlock { drawingNumber?: string; partName?: string; scale: string; units: string; date?: string; author?: string; }
```

## Export formats

- SVG (primary): compose pages as scalable vector graphics. Keep one `viewBox` per page matching the physical mm page size (e.g., A4 in mm). Use groups/layers for line types (visible, hidden, center, hatch).
- PDF: convert generated SVG to PDF while preserving scale. Ensure fonts are embedded or use simple sans-serif fallback.
- DXF: create DXF entities with layers corresponding to line types (0=visible, 1=hidden, 2=center, 3=hatch). Dimension entities exported as native DXF dimensions where possible.

## Implementation notes and libraries

- Use Three.js for geometry handling and triangulated meshes.
- For robust hidden-line removal and contour extraction, consider rasterizing projected triangles into a 2D depth buffer (pixel grid) or using exact planar boolean/contour clipping libraries.
- For SVG generation: use a minimal templating step to convert paths into SVG `path` elements. Use transforms to keep mm units consistent: set `viewBox="0 0 <widthMm> <heightMm>"` and `width`/`height` in mm if exporting to PDF.

## Tests / Fixtures

- Provide small geometry fixtures for unit tests:
  - Simple block with a centered hole ✅ (Created: `tests/fixtures/block-hole.ts`)
  - L-shaped part ✅ (Created: `tests/fixtures/l-bracket.ts`)
  - T-shaped bracket ✅ (Created: `tests/fixtures/t-bracket.ts`)
  - Cylinder with cutouts ✅ (Created: `tests/fixtures/cylinder-cutout.ts`)
- For each fixture, assert that produced SVG contains expected number of visible edges, hidden lines, and at least one dimension for each primary axis.

## Implementation Progress

> **Note**: Implementation progress and roadmap have been moved to dedicated documents for better organization.

**Current Status**:
- ✅ **Phase 1 Complete**: Edge extraction, orthographic projection, visible/hidden lines
- ✅ **Phase 2 Complete**: Dimensioning system with ISO-compliant formatting
- 🔄 **Phase 3 In Progress**: Line weights, center lines, scale selection

**Related Documents**:
- **[2D Drawing Engine Roadmap](../roadmaps/2d-drawing-engine.md)** - Phased implementation plan
- **[Progress Tracking](../progress/PROGRESS.md)** - Detailed implementation notes
- **[ISO Drawing Standards](iso-drawing-standards.md)** - Complete technical specification


