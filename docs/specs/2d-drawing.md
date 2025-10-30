# 2D Drawing Engine Specification

## ISO Standards Compliance

### Required Standards
- ISO 128: Technical drawings - General principles of presentation
- ISO 129: Technical drawings - Dimensioning
- ISO 5456: Technical drawings - Projection methods
- ISO 7200: Technical documentation - Data fields in title blocks

### Projection System
- First angle projection (European)
- Three standard views minimum
- Additional views as needed for clarity

## Drawing Elements

### Line Types
1. **Visible Lines**
   - Solid, thick
   - Weight: 0.7mm

2. **Hidden Lines**
   - Dashed
   - Weight: 0.35mm
   - Pattern: 3mm dash, 1mm gap

3. **Center Lines**
   - Chain
   - Weight: 0.35mm
   - Pattern: 10mm dash, 2mm gap

4. **Section Lines**
   - Solid, thin
   - Weight: 0.35mm
   - 45° angle standard

### Dimensioning
1. **Linear Dimensions**
   - Extension lines
   - Dimension lines
   - Arrowheads
   - Text placement

2. **Angular Dimensions**
   - Radius indicators
   - Degree symbols
   - Arc length

3. **Special Dimensions**
   - Diameters
   - Radii
   - Chamfers
   - Threads

## Title Block
1. **Required Fields**
   - Drawing number
   - Part name
   - Scale
   - Units
   - Date
   - Author

2. **Optional Fields**
   - Material
   - Surface finish
   - Tolerances
   - Revision history

## Section Views
1. **Cutting Plane**
   - Line indication
   - Direction arrows
   - Section identifiers

2. **Section Types**
   - Full sections
   - Half sections
   - Offset sections
   - Revolved sections

## Programmatic Generation

### View Generation
1. Calculate optimal view arrangement
2. Determine necessary additional views
3. Apply projection rules
4. Generate section cuts as needed

### Dimensioning Algorithm
1. Identify critical features
2. Calculate dimension placement
3. Avoid overlapping
4. Group related dimensions

### Line Generation
1. Calculate visible edges
2. Determine hidden lines
3. Generate center lines
4. Apply line styles

## Technical Implementation

### SVG Generation
1. Define viewports for each projection
2. Generate path data for lines
3. Create text elements for dimensions
4. Apply styles and patterns

### PDF Export
1. Convert SVG to PDF
2. Maintain scale accuracy
3. Include title block
4. Add multiple pages if needed

### DXF Export
1. Convert geometry to DXF entities
2. Maintain layers for line types
3. Include dimension entities
4. Export title block