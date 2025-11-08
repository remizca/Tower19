# ISO Drawing Standards Specification

**Document Version**: 1.0  
**Date**: November 8, 2025  
**Purpose**: Technical specification for ISO-compliant 2D engineering drawings in Tower19

## Overview

This document specifies the ISO standards and conventions to be followed when generating 2D technical drawings from procedurally generated 3D CAD parts. The goal is to produce drawings that match industry-standard CAD software output (Fusion 360, SolidWorks, Inventor).

## 1. Projection System

### 1.1 First-Angle vs Third-Angle Projection

**Decision**: Use **ISO First-Angle Projection** as default (European standard)

- **First-Angle**: Object is between observer and projection plane
  - Front view: Shows what you see from the front
  - Top view: Placed BELOW the front view
  - Right view: Placed on the LEFT of the front view
  - Symbol: Truncated cone with circular end on left

- **Third-Angle**: Projection plane is between observer and object (US standard)
  - Top view: Placed ABOVE the front view
  - Right view: Placed on the RIGHT of the front view
  - Symbol: Truncated cone with circular end on right

**Implementation**:
```typescript
enum ProjectionSystem {
  FIRST_ANGLE = 'first-angle',  // ISO default
  THIRD_ANGLE = 'third-angle'   // ASME/ANSI
}

interface DrawingConfig {
  projection: ProjectionSystem;
  // ... other settings
}
```

**View Layout** (First-Angle):
```
┌─────────────┬─────────────┬─────────────┐
│             │             │   LEFT      │
│             │    TOP      │   VIEW      │
│             │    VIEW     │             │
├─────────────┼─────────────┼─────────────┤
│   REAR      │   FRONT     │   RIGHT     │
│   VIEW      │   VIEW      │   VIEW      │
│             │  (PRIMARY)  │             │
├─────────────┼─────────────┼─────────────┤
│             │   BOTTOM    │             │
│             │    VIEW     │             │
│             │             │             │
└─────────────┴─────────────┴─────────────┘
```

### 1.2 Orthographic Projection Standards

**Reference**: ISO 5456-2:1996 - Technical drawings — Projection methods

- **Parallel projection**: All projection rays parallel to each other
- **Perpendicular to projection plane**: Rays at 90° to viewing plane
- **True size and shape**: Faces parallel to projection plane shown at true size
- **Foreshortening**: Faces at angle shown shorter/distorted

**Implementation Requirements**:
- Use orthographic camera (no perspective distortion)
- Each view must be independently projected
- Maintain consistent scale across all views
- Align views properly based on projection system

## 2. Line Types and Weights

### 2.1 ISO 128-24:2014 Line Standards

**Line Type Definitions**:

| Line Type | ISO Code | Width Ratio | Usage | SVG Implementation |
|-----------|----------|-------------|-------|-------------------|
| **Continuous thick** | 01.1 | 1.0 | Visible edges, outlines | `stroke-width: 0.7, stroke: black, solid` |
| **Continuous thin** | 01.2 | 0.5 | Dimension lines, hatching, construction | `stroke-width: 0.35, stroke: black, solid` |
| **Dashed thick** | 02.1 | 1.0 | Hidden edges (rarely used) | `stroke-width: 0.7, stroke: black, dashed` |
| **Dashed thin** | 02.2 | 0.5 | Hidden edges | `stroke-width: 0.5, stroke: black, stroke-dasharray: 3,2` |
| **Chain thin** | 04.2 | 0.5 | Center lines, pitch lines | `stroke-width: 0.35, stroke: black, stroke-dasharray: 8,2,2,2` |
| **Chain thick** | 04.1 | 1.0 | Cutting planes | `stroke-width: 0.7, stroke: black, stroke-dasharray: 8,2,2,2` |

**Line Width Standards**:
- **Base width**: 0.35mm for thin lines (1:1 scale at A3/A4)
- **Thick lines**: 2× base = 0.7mm
- **Width ratio**: Always maintain 2:1 ratio between thick and thin
- **SVG scaling**: Adjust stroke-width based on view scale

**Dash Pattern Standards** (ISO 128-24):
- **Dashed**: Dash 3mm, gap 2mm (at 1:1 scale)
- **Chain (center line)**: Long dash 8mm, gap 2mm, short dash 2mm, gap 2mm
- **Scale adjustment**: Multiply all lengths by view scale factor

### 2.2 Line Type Usage Rules

**Visible Edges** (Continuous thick):
- All edges visible from the view direction
- Include sharp edges, boundaries, and silhouettes
- Draw on top of all other line types (highest z-index)

**Hidden Edges** (Dashed thin):
- Edges obscured by material in front
- Only show if they clarify the drawing
- Omit if view becomes cluttered (use section view instead)
- Do NOT show hidden edges behind visible edges in same line

**Center Lines** (Chain thin):
- Mark centers of cylindrical features (holes, bosses)
- Extend slightly beyond feature outline (2-3mm)
- Cross at centers of circular features
- Must be symmetric about center point

**Cutting Plane Lines** (Chain thick with arrows):
- Show where section is taken
- Arrows point in viewing direction
- Label with letters (A-A, B-B, etc.)
- Only in view where section plane is visible

## 3. Title Block Standards

### 3.1 ISO 7200:2004 - Title Blocks

**Required Information**:
1. **Part name/description** - Generated from recipe metadata
2. **Drawing number** - Could use seed value or unique ID
3. **Scale** - e.g., "1:2", "1:1", "2:1"
4. **Projection symbol** - First-angle or third-angle icon
5. **Units** - "mm" (all Tower19 parts use millimeters)
6. **Date** - Drawing generation timestamp
7. **Material** - Optional (not specified in procedural generation)
8. **Mass** - Optional (could calculate from volume)

**Layout** (Bottom-right corner of sheet):
```
┌─────────────────────────────────────────┐
│ PART NAME: Block with Centered Hole    │ 
├──────────────┬──────────────────────────┤
│ SCALE: 1:1   │ UNITS: mm                │
├──────────────┼──────────────────────────┤
│ PROJECTION:  │ DATE: 2025-11-08         │
│   [⌐ ]       │ SEED: 12345              │
└──────────────┴──────────────────────────┘
```

**Dimensions**:
- Minimum width: 170mm (for A4/A3 sheets)
- Height: ~50-70mm
- Position: 10mm from bottom and right edges
- Use thin continuous lines (0.35mm)

### 3.2 SVG Implementation

```typescript
interface TitleBlock {
  partName: string;
  scale: string;          // "1:1", "1:2", "2:1"
  projection: ProjectionSystem;
  units: 'mm' | 'in';
  date: string;           // ISO 8601 format
  seed?: number;
  drawingNumber?: string;
  material?: string;
  mass?: number;
}

function createTitleBlock(info: TitleBlock, sheetSize: Size): SVGElement {
  // Position in bottom-right corner
  const x = sheetSize.width - 180;
  const y = sheetSize.height - 70;
  
  // Create bordered box with fields
  // Include projection symbol (SVG icon)
  // Format text with proper font sizes
  // Return SVG <g> element
}
```

## 4. Dimensioning Standards

### 4.1 ISO 129-1:2018 - Dimensioning General Principles

**Dimension Components**:
1. **Dimension line** - Thin line with arrowheads at ends
2. **Extension lines** - Thin lines extending from feature
3. **Dimension value** - Numerical measurement
4. **Arrowheads** - Closed, filled, 3mm long

**Dimension Line Rules**:
- Use thin continuous lines (0.35mm)
- Place preferably outside the view
- Parallel to measured feature
- Break for dimension text insertion
- Minimum spacing: 8mm from outline, 6mm between dimension lines

**Extension Line Rules**:
- Start 1-2mm from outline (small gap)
- Extend 2-3mm beyond dimension line
- Perpendicular to dimension line
- Can cross other extension lines (not dimension lines)
- Can cross object outlines if necessary

**Arrowhead Standards**:
- Closed and filled (solid black)
- Length: 3mm (at 1:1 scale)
- Width: 1mm (length-to-width ratio 3:1)
- Touch but don't cross dimension line endpoint

### 4.2 Dimension Types

**Linear Dimensions** (ISO 129-1):
- **Horizontal**: Dimension line parallel to X-axis
- **Vertical**: Dimension line parallel to Y-axis
- **Aligned**: Dimension line parallel to measured edge
- **Stacked**: Multiple parallel dimensions (smallest inside)
- **Chain**: End-to-end dimensions along a line

**Radial Dimensions** (ISO 129-1):
- **Radius (R)**: Leader line from arc to dimension text "R10"
- **Diameter (Ø)**: Across center, dimension text "Ø20"
- **Symbol**: Use Unicode Ø (U+2300) or "DIA" prefix

**Angular Dimensions** (ISO 6410-1):
- Dimension arc between two lines
- Arrowheads at both ends
- Degree symbol: ° (U+00B0)
- Format: "45°", "90°", "120°"

### 4.3 Dimension Placement Algorithm

**Automatic Placement Strategy**:

1. **Identify Dimensionable Features**:
   - Bounding box dimensions (overall width/height/depth)
   - Hole diameters and positions
   - Feature spacings
   - Chamfer/fillet sizes

2. **Priority Order**:
   - Overall dimensions first (outermost)
   - Major features (holes, pockets)
   - Secondary features (chamfers, fillets)
   - Detail dimensions (small radii, etc.)

3. **Collision Detection**:
   - Check overlap with existing dimensions
   - Check overlap with view geometry
   - Maintain minimum spacing (8mm from outline, 6mm between)
   - Adjust placement if collision detected

4. **View Selection**:
   - Choose view where feature is most visible
   - Prefer dimensions on front view when possible
   - Use multiple views to avoid clutter
   - Dimension circles/holes on view showing circle (not rectangle)

**Implementation Pseudocode**:
```typescript
function generateDimensions(recipe: PartRecipe, views: View[]): Dimension[] {
  const dimensions: Dimension[] = [];
  
  // 1. Overall dimensions (bounding box)
  dimensions.push(...createBoundingBoxDimensions(recipe.bounding_mm));
  
  // 2. Feature dimensions (holes, pockets)
  for (const primitive of recipe.primitives) {
    if (primitive.kind === 'cylinder') {
      dimensions.push(createRadialDimension(primitive));
    }
  }
  
  // 3. Spacing dimensions (hole patterns)
  dimensions.push(...createSpacingDimensions(recipe.primitives));
  
  // 4. Resolve collisions and optimize placement
  return optimizeDimensionPlacement(dimensions, views);
}
```

### 4.4 Dimension Text Formatting

**Text Standards** (ISO 3098-2):
- **Font**: Sans-serif, preferably Arial or similar
- **Height**: 3.5mm (at 1:1 scale)
- **Orientation**: Horizontal preferred, can be aligned with dimension
- **Precision**: 
  - Whole numbers: "20" (no decimal)
  - Decimals: "20.5" (one decimal for > 10mm)
  - Precision: "10.25" (two decimals for < 10mm)
  - Never use trailing zeros: "20.5" not "20.50"

**Symbol Prefixes**:
- Diameter: `Ø` (U+2300) - e.g., "Ø20"
- Radius: `R` - e.g., "R10"
- Square: `□` (U+25A1) - e.g., "□15"
- Spherical diameter: `SØ` - e.g., "SØ30"
- Spherical radius: `SR` - e.g., "SR15"

## 5. Section Views

### 5.1 ISO 128-50:2001 - Sectioning Rules

**Section View Purpose**:
- Show internal features that would be hidden
- Clarify complex internal geometry
- Reveal wall thicknesses, internal passages

**Section Types**:

1. **Full Section**:
   - Cutting plane passes completely through part
   - One half removed, other half shown
   - Most common section type

2. **Half Section** (for symmetric parts):
   - One quarter removed
   - Shows both external and internal features
   - Center line divides section from external view

3. **Offset Section**:
   - Cutting plane follows stepped path
   - Used to show multiple features not on same plane
   - Offsets not shown in section view

4. **Broken-Out Section**:
   - Small local section to show internal detail
   - Irregular break line bounds the section area
   - Used when full section is unnecessary

5. **Rotated Section**:
   - Section perpendicular to main views
   - Rotated 90° to show cross-section
   - Used for ribs, spokes, arms

**Section Identification**:
- Label cutting plane with letters: A-A, B-B, C-C, etc.
- Show cutting plane line in view (chain thick line)
- Add arrows pointing in viewing direction
- Label section view: "SECTION A-A"

### 5.2 Hatching Standards (ISO 128-50)

**Hatch Pattern Rules**:
- **Line type**: Thin continuous (0.35mm)
- **Angle**: 45° to main outline (or 30°/60° if 45° parallel to edge)
- **Spacing**: 2-3mm between lines (adjust for scale)
- **Boundaries**: Hatch within cut surface only
- **Excluded**: Don't hatch ribs, spokes, webs if cut lengthwise

**Material-Specific Hatching**:
- **General (unknown)**: 45° lines, 3mm spacing
- **Steel**: 45° lines, 3mm spacing
- **Aluminum**: 45° lines, wider spacing (4mm)
- **Plastic**: 45° and 135° crossed lines
- **Wood**: Special grain pattern (rare in mechanical)

**Multiple Parts**:
- Different hatch angles for adjacent parts (45°, 135°)
- Or same angle with different spacing
- Or offset phase of pattern

**SVG Implementation**:
```typescript
interface HatchPattern {
  angle: number;        // degrees, typically 45
  spacing: number;      // mm, typically 3
  lineWidth: number;    // mm, typically 0.35
}

function generateHatchPattern(
  contour: Point2D[],
  pattern: HatchPattern
): SVGElement {
  // 1. Calculate bounding box of contour
  // 2. Generate parallel lines at angle
  // 3. Clip lines to contour boundary
  // 4. Return SVG <g> with <line> elements
}
```

### 5.3 Section View Generation Algorithm

**Implementation Strategy**:

1. **Define Cutting Plane**:
   ```typescript
   interface CuttingPlane {
     position: Vector3;    // Point on plane
     normal: Vector3;      // Plane normal vector
     type: 'full' | 'half' | 'offset' | 'broken';
   }
   ```

2. **Slice Geometry**:
   - Intersect cutting plane with BufferGeometry
   - Extract contour edges (closed loops)
   - Classify interior (hatched) vs exterior (outline)

3. **Generate Section View**:
   - Project contour onto view plane
   - Draw outline with thick continuous line
   - Fill with hatch pattern
   - Add section label (SECTION A-A)

4. **Show Cutting Plane in Parent View**:
   - Draw chain thick line at plane position
   - Add arrowheads pointing in viewing direction
   - Label with letters (A, B, C, etc.)

**Plane Selection Heuristics**:
- **Automatic**: Choose plane that reveals most internal features
- **Manual**: Allow user to specify plane position/angle
- **Common planes**: X=0, Y=0, Z=0 (midplane sections)
- **Feature-aligned**: Plane through center of holes/features

## 6. Scale and Sheet Sizes

### 6.1 ISO 5457:1999 - Sheet Sizes

**Standard Paper Sizes** (A-series):
- **A0**: 841 × 1189 mm
- **A1**: 594 × 841 mm
- **A2**: 420 × 594 mm
- **A3**: 297 × 420 mm
- **A4**: 210 × 297 mm (most common)

**Drawing Area** (with margins):
- **Margin**: 10mm on all sides (20mm on left for binding)
- **Usable area**: Sheet size minus margins
- **Example A4**: 180mm × 277mm usable area

**Orientation**:
- **Landscape**: Preferred for multi-view drawings (width > height)
- **Portrait**: Acceptable for tall parts

### 6.2 ISO 5455:1979 - Scale Designation

**Preferred Scales**:

**Enlargement** (for small parts):
- 50:1, 20:1, 10:1, 5:1, 2:1

**Full Size**:
- 1:1 (preferred when parts fit)

**Reduction** (for large parts):
- 1:2, 1:5, 1:10, 1:20, 1:50, 1:100

**Scale Selection Algorithm**:
```typescript
function selectOptimalScale(
  boundingBox: BoundingBox3D,
  sheetSize: Size,
  numViews: number
): number {
  // Calculate space per view
  const viewArea = {
    width: (sheetSize.width - 40) / 2,  // 2 views side-by-side
    height: (sheetSize.height - 80) / 2  // 2 rows of views
  };
  
  // Find largest dimension
  const maxDim = Math.max(
    boundingBox.x,
    boundingBox.y,
    boundingBox.z
  );
  
  // Calculate scale to fit
  const requiredScale = maxDim / Math.min(viewArea.width, viewArea.height);
  
  // Round to nearest standard scale
  return roundToStandardScale(requiredScale);
}
```

**Scale Notation**:
- Show in title block: "SCALE: 1:2"
- If views have different scales: "SCALE: AS SHOWN"
- Individual view labels: "A (2:1)" next to view title

## 7. View Selection and Arrangement

### 7.1 View Selection Strategy

**Minimum Views** (ISO 128):
- Enough views to fully define the part
- Typically 2-3 orthogonal views
- Choose views showing most features clearly

**Standard View Set**:
1. **Front view**: Primary view, most information
2. **Top view**: Shows width and depth
3. **Right view**: Shows height and depth

**When to Add Views**:
- **Auxiliary views**: For angled features
- **Detail views**: For small features (enlarged)
- **Section views**: For internal features
- **Isometric view**: Optional, for clarity

**View Omission**:
- Skip views that don't add information
- Symmetric parts: may only need 2 views
- Simple parts: may only need 1 view + note "SYMMETRIC"

### 7.2 View Arrangement Layouts

**Three-View Layout** (First-Angle):
```
┌─────────────┬─────────────┐
│   TOP VIEW  │             │
│             │             │
├─────────────┼─────────────┤
│  FRONT VIEW │ RIGHT VIEW  │
│  (PRIMARY)  │             │
└─────────────┴─────────────┘
```

**Two-View Layout**:
```
┌──────────────────────────┐
│      FRONT VIEW          │
│      (PRIMARY)           │
├──────────────────────────┤
│       TOP VIEW           │
│                          │
└──────────────────────────┘
```

**With Section**:
```
┌─────────────┬─────────────┐
│ FRONT VIEW  │ SECTION A-A │
│    [A]-→    │             │
├─────────────┼─────────────┤
│  TOP VIEW   │ DETAIL B    │
│             │  (SCALE 2:1)│
└─────────────┴─────────────┘
```

## 8. Implementation Roadmap

> **Note**: Detailed implementation roadmap has been moved to a dedicated document for better organization and tracking.

See **[2D Drawing Engine Roadmap](../roadmaps/2d-drawing-engine.md)** for:
- ✅ Phase 1: Basic Projection & Rendering (COMPLETE)
- ✅ Phase 2: Dimensioning System (COMPLETE)
- 🔄 Phase 3: Enhanced Drawing (IN PROGRESS)
- 📋 Phase 4: Section Views (PLANNED)
- 🔮 Phase 5: Advanced Features (FUTURE)

**Quick Status**:
- **Phase 1** ✅: Edge extraction, orthographic projection, visible/hidden lines
- **Phase 2** ✅: Linear and radial dimensions, automatic placement, ISO formatting
- **Phase 3** 🔄: Line weights, center lines, scale selection, collision detection

For detailed task lists, success criteria, and implementation notes, consult the roadmap document.

## 9. References

### ISO Standards (Referenced)
- **ISO 128** series - Technical drawings — General principles of presentation
  - ISO 128-1:2003 - Introduction and fundamental requirements
  - ISO 128-20:1996 - Basic conventions for lines
  - ISO 128-24:2014 - Lines on mechanical engineering drawings
  - ISO 128-50:2001 - Basic conventions for representing areas on cuts and sections
- **ISO 129** series - Technical drawings — Dimensioning
  - ISO 129-1:2018 - General principles, definitions, methods of execution
- **ISO 3098** series - Technical product documentation — Lettering
  - ISO 3098-2:2000 - Latin alphabet, numerals and marks
- **ISO 5455:1979** - Technical drawings — Scales
- **ISO 5456-2:1996** - Technical drawings — Projection methods
- **ISO 5457:1999** - Technical product documentation — Sizes and layout of drawing sheets
- **ISO 6410-1:1993** - Technical drawings — Screw threads and threaded parts
- **ISO 7200:2004** - Technical product documentation — Data fields in title blocks

### External Resources
- [Engineering Drawing Standards](https://en.wikipedia.org/wiki/Engineering_drawing)
- [Orthographic Projection Guide](https://en.wikipedia.org/wiki/Orthographic_projection)
- [Technical Drawing Tutorial](https://www.engineeringtoolbox.com/)

### CAD Software Reference
For visual reference of expected output:
- Fusion 360: File → Export → Drawing (DXF/PDF)
- SolidWorks: File → Make Drawing
- Inventor: Create → Drawing

## 10. Design Decisions for Tower19

### 10.1 Chosen Defaults
- **Projection**: First-angle (ISO default)
- **Units**: Millimeters (mm)
- **Sheet**: A4 landscape (297 × 210 mm)
- **Scale**: Auto-select from 2:1, 1:1, 1:2, 1:5
- **Views**: Front + Top + Right (three-view layout)
- **Line weights**: 0.7mm thick, 0.35mm thin
- **Dimension precision**: 0 decimals for > 10mm, 1 decimal for < 10mm

### 10.2 Simplifications (Phase 1)
- No threaded features (threads omitted)
- No surface finish symbols
- No geometric tolerances (GD&T)
- No welding symbols
- No material specifications
- Simplified title block (no revision history)
- Automatic view selection (no manual override yet)
- No auxiliary views (only orthogonal views)

### 10.3 Future Enhancements
- User selection of projection system (first/third angle)
- Support for metric and imperial units
- Multiple sheet sizes
- Custom scale override
- Manual view arrangement
- PDF export with proper fonts
- DXF/DWG export for CAD import
- 3D PDF with embedded model

---

**Document Status**: Draft v1.0  
**Last Updated**: November 8, 2025  
**Next Review**: After Phase 2 implementation
