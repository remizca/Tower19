# 2D Drawing Engine Implementation Roadmap

**Document Version**: 1.0  
**Date**: November 8, 2025  
**Source**: Extracted from `docs/specs/iso-drawing-standards.md`  
**Purpose**: Track implementation phases for ISO-compliant 2D engineering drawings

## Overview

This roadmap defines the phased implementation approach for the 2D Drawing Engine, progressing from basic orthographic projection to advanced features like section views and auxiliary projections. Each phase builds upon the previous, ensuring stable incremental progress.

## Phase 1: Basic Projection & Rendering ✅ COMPLETE

**Status**: ✅ Implemented  
**Completion Date**: November 8, 2025

### Completed Features
- [x] Basic SVG generation
- [x] Orthographic projection (front, top, right views)
- [x] Edge extraction from 3D geometry
- [x] Visible/hidden line classification
- [x] Simple title block with essential fields

### Implementation Details
- Created `src/drawing/edges.ts` (410 lines) with mesh-based edge extraction
- Sharp edge detection using face angle analysis (30° threshold)
- Silhouette edge detection for view-dependent visibility
- Ray-casting framework for occlusion testing
- Support for all 5 primitive types: box, cylinder, sphere, cone, torus
- Integrated with SVG renderer in `src/drawing/svg.ts`
- Test suite validates edge counts (60-100 edges per view)

### Known Limitations
- Visibility uses simple Z-depth heuristics
- Per-primitive extraction (no CSG mesh integration)
- Triangulated mesh edges shown (more than logical drawing edges)

---

## Phase 2: Dimensioning System ✅ COMPLETE

**Status**: ✅ Implemented  
**Completion Date**: November 8, 2025

### Completed Features
- [x] Linear dimension generation (horizontal, vertical, aligned)
- [x] Radial dimension generation (R, Ø)
- [x] Dimension placement algorithm
- [x] Automatic bounding box dimensions
- [x] Cylinder feature detection and diameter dimensions
- [x] Text formatting per ISO 3098-2

### Implementation Details
- Created `src/drawing/dimensions.ts` (600+ lines) - core logic
  - Type system: Dimension, LinearDimension, RadialDimension, AngularDimension
  - DEFAULT_DIMENSION_CONFIG with ISO 129-1 spacing (8mm offset, 6mm between)
  - generateDimensions(): Main API for automatic dimension creation
  - generateBoundingBoxDimensions(): 6 overall dimensions (width/height/depth × 3 views)
  - generateFeatureDimensions(): Detects cylinders, creates Ø dimensions
  - formatDimensionValue(): ISO text formatting (no trailing zeros)
- Created `src/drawing/dimensionsSVG.ts` (350+ lines) - rendering
  - Extension lines with 2mm gaps and 3mm overhangs
  - Filled arrowheads (3mm×1mm, 3:1 ratio per ISO)
  - Dimension text: Arial 3.5mm, centered, optional rotation
  - Center marks with crossed chain lines
- Test validation: 7 dimensions in block-hole.svg (6 bbox + 1 cylinder Ø20)

### Known Limitations
- Basic placement (no collision detection yet)
- Only detects cylindrical features
- Angular dimensions not yet implemented

### Deferred Enhancements
- Collision detection and resolution (priority-based algorithm stubbed)
- Angular dimensions for chamfers and bevels
- Hole callouts (counterbores, countersinks)
- Feature detection: slots, pockets, bosses

---

## Phase 3: Enhanced Drawing 🔄 PLANNED

**Status**: 🔄 Next Phase  
**Estimated Start**: November 2025

### Planned Features
- [ ] Proper line weights (thick/thin per ISO 128-24)
- [ ] Center lines for cylindrical features
- [ ] Projection symbol in title block (first-angle/third-angle indicator)
- [ ] Scale selection algorithm (auto-select 2:1, 1:1, 1:2, 1:5)
- [ ] View arrangement optimization (dynamic layout)
- [ ] Dimension collision detection and resolution

### Implementation Tasks

#### Line Weights (ISO 128-24)
- Implement thick continuous lines (0.7mm) for visible edges
- Implement thin continuous lines (0.35mm) for dimension lines, hatching
- Implement chain lines (thin, dashed 8-2-2-2) for center lines
- Implement proper SVG stroke-width scaling based on view scale

#### Center Lines
- Detect all cylindrical features (holes, bosses, shafts)
- Generate crossed center marks for circular features
- Extend center lines 2-3mm beyond feature outline
- Ensure symmetry about center point

#### Projection Symbol
- Add first-angle projection symbol to title block (truncated cone, circle on left)
- Support third-angle projection symbol (circle on right)
- Make projection system configurable (default: first-angle)

#### Scale Selection
- Implement auto-scale algorithm based on bounding box and sheet size
- Support standard scales: 2:1, 1:1, 1:2, 1:5, 1:10
- Round calculated scale to nearest standard scale
- Display scale in title block: "SCALE: 1:2"

#### View Arrangement
- Dynamic layout based on number of views (2-view, 3-view)
- Calculate optimal view spacing and margins
- Support first-angle and third-angle view layouts
- Handle view labels (Front View, Top View, Right View)

---

## Phase 4: Section Views 📋 PLANNED

**Status**: 📋 Specification Complete  
**Target**: Q1 2026

### Planned Features
- [ ] Cutting plane definition (position, normal, type)
- [ ] Geometry slicing (intersection with plane)
- [ ] Hatch pattern generation (45° lines, 3mm spacing)
- [ ] Section view projection (orthographic)
- [ ] Multi-section support (A-A, B-B, C-C)

### Section Types to Support

#### 1. Full Section
- Cutting plane passes completely through part
- One half removed, other half shown
- Most common section type

#### 2. Half Section
- For symmetric parts only
- One quarter removed
- Shows both external and internal features
- Center line divides section from external view

#### 3. Offset Section
- Cutting plane follows stepped path
- Used to show multiple features not on same plane
- Offsets not shown in section view

#### 4. Broken-Out Section
- Small local section to show internal detail
- Irregular break line bounds the section area
- Used when full section is unnecessary

### Implementation Algorithm

1. **Define Cutting Plane**
   ```typescript
   interface CuttingPlane {
     position: Vector3;    // Point on plane
     normal: Vector3;      // Plane normal vector
     type: 'full' | 'half' | 'offset' | 'broken';
   }
   ```

2. **Slice Geometry**
   - Intersect cutting plane with BufferGeometry
   - Extract contour edges (closed loops)
   - Classify interior (hatched) vs exterior (outline)

3. **Generate Section View**
   - Project contour onto view plane
   - Draw outline with thick continuous line
   - Fill with hatch pattern
   - Add section label (SECTION A-A)

4. **Show Cutting Plane in Parent View**
   - Draw chain thick line at plane position
   - Add arrowheads pointing in viewing direction
   - Label with letters (A, B, C, etc.)

### Hatching Standards (ISO 128-50)
- Line type: Thin continuous (0.35mm)
- Angle: 45° to main outline (or 30°/60° if 45° parallel to edge)
- Spacing: 2-3mm between lines (adjust for scale)
- Boundaries: Hatch within cut surface only
- Exclusions: Don't hatch ribs, spokes, webs if cut lengthwise

### Plane Selection Heuristics
- **Automatic**: Choose plane that reveals most internal features
- **Manual**: Allow user to specify plane position/angle
- **Common planes**: X=0, Y=0, Z=0 (midplane sections)
- **Feature-aligned**: Plane through center of holes/features

---

## Phase 5: Advanced Features 🔮 FUTURE

**Status**: 🔮 Future Enhancement  
**Target**: 2026+

### Planned Features
- [ ] Detail views (enlarged local areas)
- [ ] Break lines for long parts
- [ ] Auxiliary views (angled features)
- [ ] Notes and symbols (surface finish, welding)
- [ ] Material specification in title block
- [ ] Surface finish symbols (roughness)
- [ ] Geometric tolerancing (GD&T)

### Detail Views
- Enlarge small features for clarity
- Typical scales: 2:1, 5:1, 10:1
- Circle detail area in parent view
- Label: "DETAIL A (SCALE 2:1)"

### Break Lines
- For long uniform parts (shafts, bars)
- Show ends with break lines in middle
- Saves drawing space
- Show full dimensions with break note

### Auxiliary Views
- For features at angles to principal planes
- Project perpendicular to angled feature
- Show true size and shape
- Common for angled holes, chamfers

### Notes and Symbols
- Surface finish symbols (ISO 1302)
- Welding symbols (ISO 2553)
- General notes (manufacturing instructions)
- Reference dimensions (in parentheses)

---

## Implementation Priorities

### High Priority (Current/Next)
1. ✅ Phase 1: Basic projection and rendering
2. ✅ Phase 2: Dimensioning system
3. 🔄 Phase 3: Enhanced drawing features

### Medium Priority (Q1-Q2 2026)
4. Phase 4: Section views
5. Dimension collision detection
6. Advanced feature detection

### Low Priority (Future)
7. Phase 5: Advanced features
8. GD&T support
9. Multiple sheet sizes
10. PDF/DXF export optimization

---

## Success Criteria

### Phase 1 ✅
- [x] Generate SVG with 3 orthographic views
- [x] Classify visible/hidden edges correctly
- [x] Include basic title block
- [x] Test with multiple fixture types

### Phase 2 ✅
- [x] Generate bounding box dimensions
- [x] Detect and dimension cylindrical features
- [x] Proper ISO formatting (no trailing zeros)
- [x] Extension lines, arrowheads, text per ISO 129-1

### Phase 3 (Pending)
- [ ] Proper line weights throughout drawing
- [ ] Center lines on all circular features
- [ ] Auto-scale selection working
- [ ] Projection symbol in title block
- [ ] No dimension overlaps (collision resolution)

### Phase 4 (Pending)
- [ ] Generate full section view from cutting plane
- [ ] Proper hatch pattern (45°, 3mm spacing)
- [ ] Section label and cutting plane indication
- [ ] Support for multiple sections (A-A, B-B)

---

## Dependencies and Blockers

### Technical Dependencies
- ✅ Three.js geometry handling
- ✅ @react-three/csg for boolean operations
- ✅ Edge extraction from triangulated meshes
- ⏳ Plane-mesh intersection algorithm (Phase 4)
- ⏳ 2D polygon clipping library (Phase 4)

### Known Blockers
- None currently

### Deferred Items
- CSG mesh integration (improves edge accuracy)
- Ray-casting visibility (improves hidden line detection)
- PDF export with embedded fonts
- DXF export with native dimension entities

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 8, 2025 | Initial roadmap extracted from iso-drawing-standards.md |
| 1.1 | Nov 8, 2025 | Updated Phase 1 and Phase 2 to COMPLETE status |

---

**Next Review**: After Phase 3 implementation  
**Document Owner**: Tower19 Development Team  
**Related Documents**: 
- `docs/specs/iso-drawing-standards.md` - Technical specification
- `docs/specs/2d-drawing.md` - Detailed algorithms
- `TODO.md` - Active task list
