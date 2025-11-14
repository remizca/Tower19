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
import { extractGeometryEdges, extractRecipeEdges } from '../drawing/edges'
import type { Dimension } from '../drawing/dimensions'
import { generateDimensions, DEFAULT_DIMENSION_CONFIG } from '../drawing/dimensions'
import type { BufferGeometry, Matrix4 } from 'three'
import { Matrix4 as ThreeMatrix4, Vector3 as ThreeVec3 } from 'three'

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

type View = 'front' | 'top' | 'right'

interface ViewConfig {
  matrix: Matrix4
  name: string
}

// Minimal view configuration (no offsets; DXF uses direct mm coordinates)
const VIEW_CONFIGS: Record<View, ViewConfig> = {
  front: {
    matrix: new ThreeMatrix4(),
    name: 'Front View'
  },
  top: {
    matrix: new ThreeMatrix4().makeRotationX(-Math.PI / 2),
    name: 'Top View'
  },
  right: {
    matrix: new ThreeMatrix4().makeRotationY(Math.PI / 2),
    name: 'Right View'
  }
}

function projectEdgesForView(allEdges: Edge[], view: View): { visible: Edge[]; hidden: Edge[] } {
  const cfg = VIEW_CONFIGS[view]
  const visible: Edge[] = []
  const hidden: Edge[] = []

  allEdges.forEach((edge) => {
    const v1 = edge.start.clone().applyMatrix4(cfg.matrix) as ThreeVec3
    const v2 = edge.end.clone().applyMatrix4(cfg.matrix) as ThreeVec3

    // Skip degenerate edges after projection
    if (Math.abs(v2.x - v1.x) < 0.01 && Math.abs(v2.y - v1.y) < 0.01) {
      return
    }

    // Viewer looks along -Z in our convention; more negative Z is closer
    const p1InFront = v1.z < -0.0001
    const p2InFront = v2.z < -0.0001
    const p1Behind = v1.z > 0.0001
    const p2Behind = v2.z > 0.0001

    // If both endpoints are behind the view plane, skip
    if (p1Behind && p2Behind) {
      return
    }

    // DXF coordinates: keep Y up (no SVG flip)
    const start = new ThreeVec3(v1.x, v1.y, 0)
    const end = new ThreeVec3(v2.x, v2.y, 0)

    const classified: Edge = { start, end }
    if (p1InFront || p2InFront) {
      visible.push(classified)
    } else {
      hidden.push(classified)
    }
  })

  return { visible, hidden }
}

function buildEdgesByView(recipe: PartRecipe, geometry?: BufferGeometry) {
  const baseEdges = geometry ? extractGeometryEdges(geometry) : extractRecipeEdges(recipe)
  return {
    front: projectEdgesForView(baseEdges, 'front'),
    top: projectEdgesForView(baseEdges, 'top'),
    right: projectEdgesForView(baseEdges, 'right')
  }
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
  } catch (error) {
    console.error('[DXF Export] Failed:', error)
    throw new Error(`DXF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convenience API: export directly from a recipe and optional CSG geometry.
 * Builds edges (per view) and dimensions, then writes a DXF file.
 */
export function exportToDXFFromRecipe(params: {
  recipe: PartRecipe
  geometry?: BufferGeometry | null
  filename?: string
  scale?: number
}): void {
  const { recipe, geometry, filename, scale = 1 } = params
  const edges = buildEdgesByView(recipe, geometry ?? undefined)
  const dimensions = generateDimensions(recipe, DEFAULT_DIMENSION_CONFIG)

  exportToDXF({
    recipe,
    edges,
    dimensions,
    filename,
    scale
  })
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
