/**
 * DXF export functionality for technical drawings
 * 
 * Converts drawing data to DXF R12 format (AutoCAD compatible) with:
 * - Proper layer organization (OUTLINE, HIDDEN, DIMENSIONS, CENTERLINES)
 * - Line types (continuous, dashed, center)
 * - Accurate geometry coordinates
 * - Text entities for dimensions
 */

import type { PartRecipe } from '../types/part'
import type { Edge } from '../drawing/edges'
import type { Dimension } from '../drawing/dimensions'

export interface DXFExportOptions {
  /** Part recipe for metadata */
  recipe: PartRecipe
  /** Drawing edges organized by view and visibility */
  edges: {
    front: { visible: Edge[]; hidden: Edge[] }
    top: { visible: Edge[]; hidden: Edge[] }
    right: { visible: Edge[]; hidden: Edge[] }
  }
  /** Dimensions to export */
  dimensions: Dimension[]
  /** Optional filename (defaults to part name) */
  filename?: string
  /** Scale factor (mm to DXF units) */
  scale?: number
}

/**
 * DXF layer definitions
 */
const DXF_LAYERS = {
  OUTLINE: { name: 'OUTLINE', color: 7, lineType: 'CONTINUOUS' }, // White, solid
  HIDDEN: { name: 'HIDDEN', color: 8, lineType: 'DASHED' },       // Gray, dashed
  DIMENSIONS: { name: 'DIMENSIONS', color: 6, lineType: 'CONTINUOUS' }, // Magenta, solid
  CENTERLINES: { name: 'CENTERLINES', color: 4, lineType: 'CENTER' },  // Cyan, center
  TEXT: { name: 'TEXT', color: 7, lineType: 'CONTINUOUS' }       // White, solid
}

/**
 * Generate DXF header section
 */
function generateDXFHeader(): string {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
0.0
20
0.0
30
0.0
9
$EXTMAX
10
1000.0
20
1000.0
30
0.0
0
ENDSEC
`
}

/**
 * Generate DXF tables section (layers, linetypes)
 */
function generateDXFTables(): string {
  let dxf = `0
SECTION
2
TABLES
0
TABLE
2
LTYPE
70
3
`

  // Define linetypes
  dxf += `0
LTYPE
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
LTYPE
2
DASHED
70
0
3
Dashed line
72
65
73
2
40
0.75
49
0.5
49
-0.25
0
LTYPE
2
CENTER
70
0
3
Center line
72
65
73
4
40
1.25
49
0.75
49
-0.25
49
0.125
49
-0.25
`

  dxf += `0
ENDTAB
0
TABLE
2
LAYER
70
${Object.keys(DXF_LAYERS).length}
`

  // Define layers
  Object.values(DXF_LAYERS).forEach(layer => {
    dxf += `0
LAYER
2
${layer.name}
70
0
62
${layer.color}
6
${layer.lineType}
`
  })

  dxf += `0
ENDTAB
0
ENDSEC
`

  return dxf
}

/**
 * Generate DXF entities section
 */
function generateDXFEntities(options: DXFExportOptions): string {
  const { edges, dimensions, scale = 1 } = options
  
  let dxf = `0
SECTION
2
ENTITIES
`

  // Add visible edges (OUTLINE layer)
  const allVisibleEdges = [
    ...edges.front.visible,
    ...edges.top.visible,
    ...edges.right.visible
  ]
  
  allVisibleEdges.forEach(edge => {
    dxf += `0
LINE
8
${DXF_LAYERS.OUTLINE.name}
10
${(edge.start.x * scale).toFixed(3)}
20
${(edge.start.y * scale).toFixed(3)}
30
0.0
11
${(edge.end.x * scale).toFixed(3)}
21
${(edge.end.y * scale).toFixed(3)}
31
0.0
`
  })

  // Add hidden edges (HIDDEN layer)
  const allHiddenEdges = [
    ...edges.front.hidden,
    ...edges.top.hidden,
    ...edges.right.hidden
  ]
  
  allHiddenEdges.forEach(edge => {
    dxf += `0
LINE
8
${DXF_LAYERS.HIDDEN.name}
10
${(edge.start.x * scale).toFixed(3)}
20
${(edge.start.y * scale).toFixed(3)}
30
0.0
11
${(edge.end.x * scale).toFixed(3)}
21
${(edge.end.y * scale).toFixed(3)}
31
0.0
`
  })

  // Add dimension lines (simplified - full dimension entities would be more complex)
  dimensions.forEach(dim => {
    if (dim.type === 'linear') {
      const linear = dim as any
      // Extension line 1
      dxf += `0
LINE
8
${DXF_LAYERS.DIMENSIONS.name}
10
${(linear.p1.x * scale).toFixed(3)}
20
${(linear.p1.y * scale).toFixed(3)}
30
0.0
11
${(linear.dimLine1.x * scale).toFixed(3)}
21
${(linear.dimLine1.y * scale).toFixed(3)}
31
0.0
`
      // Extension line 2
      dxf += `0
LINE
8
${DXF_LAYERS.DIMENSIONS.name}
10
${(linear.p2.x * scale).toFixed(3)}
20
${(linear.p2.y * scale).toFixed(3)}
30
0.0
11
${(linear.dimLine2.x * scale).toFixed(3)}
21
${(linear.dimLine2.y * scale).toFixed(3)}
31
0.0
`
      // Dimension line
      dxf += `0
LINE
8
${DXF_LAYERS.DIMENSIONS.name}
10
${(linear.dimLine1.x * scale).toFixed(3)}
20
${(linear.dimLine1.y * scale).toFixed(3)}
30
0.0
11
${(linear.dimLine2.x * scale).toFixed(3)}
21
${(linear.dimLine2.y * scale).toFixed(3)}
31
0.0
`
      // Dimension text
      dxf += `0
TEXT
8
${DXF_LAYERS.TEXT.name}
10
${(linear.textPos.x * scale).toFixed(3)}
20
${(linear.textPos.y * scale).toFixed(3)}
30
0.0
40
3.5
1
${dim.value.toFixed(1)}
`
    }
  })

  dxf += `0
ENDSEC
`

  return dxf
}

/**
 * Generate DXF footer
 */
function generateDXFFooter(): string {
  return `0
EOF
`
}

/**
 * Export drawing data to DXF format
 * 
 * @param options - Export configuration
 */
export function exportToDXF(options: DXFExportOptions): void {
  try {
    // Generate DXF file content
    let dxf = ''
    dxf += generateDXFHeader()
    dxf += generateDXFTables()
    dxf += generateDXFEntities(options)
    dxf += generateDXFFooter()

    // Create blob and download
    const blob = new Blob([dxf], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const filename = options.filename || 
      `${options.recipe.name.replace(/\s+/g, '-')}-drawing.dxf`
    a.download = filename
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('[DXF Export] Successfully exported:', filename)
  } catch (error) {
    console.error('[DXF Export] Failed:', error)
    throw new Error(`DXF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if DXF export is supported in current browser
 */
export function isDXFExportSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof Blob !== 'undefined' &&
           typeof URL !== 'undefined'
  } catch {
    return false
  }
}
