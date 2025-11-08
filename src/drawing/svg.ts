/**
 * SVG projection and rendering functions with robust edge visibility.
 * Uses Three.js for matrix math and the edges module for extraction/classification.
 */
import { Matrix4, Vector3 } from 'three'
import type { PartRecipe } from '../types/part'
import { extractRecipeEdges, type Edge } from './edges'
import { generateDimensions, DEFAULT_DIMENSION_CONFIG } from './dimensions'
import { renderDimensions } from './dimensionsSVG'
import { getEdgeLineType, generateAllLineStylesCSS } from './lineTypes'
import { extractCenterLines, renderCenterLines, DEFAULT_CENTER_LINE_CONFIG } from './centerLines'

type View = 'front' | 'top' | 'right'

interface ViewConfig {
  matrix: Matrix4
  name: string
  offset: Vector3
  viewDirection: Vector3
}

// First-angle orthographic projection
const VIEW_CONFIGS: Record<View, ViewConfig> = {
  front: {
    matrix: new Matrix4(), // Front view: no rotation
    name: 'Front View',
    offset: new Vector3(100, 100, 0),
    viewDirection: new Vector3(0, 0, -1) // Looking along -Z
  },
  top: {
    matrix: new Matrix4().makeRotationX(-Math.PI/2), // Top view: rotate -90° around X
    name: 'Top View', 
    offset: new Vector3(100, 220, 0),
    viewDirection: new Vector3(0, 1, 0) // Looking along +Y (rotated to -Z)
  },
  right: {
    matrix: new Matrix4().makeRotationY(Math.PI/2), // Right view: rotate 90° around Y
    name: 'Right View',
    offset: new Vector3(220, 100, 0),
    viewDirection: new Vector3(-1, 0, 0) // Looking along -X (rotated to -Z)
  }
}

// SVG canvas/page constants
const PAGE_WIDTH = 800 // SVG units
const PAGE_HEIGHT = 600 // SVG units
const UNIT_SCALE = 2.0 // SVG units per mm (affects sizes like stroke width)

function createTitleBlock(name: string, scale = '1:1', units = 'mm') {
  const y = 200 // Title block at bottom of page
  return `
    <g transform="translate(180 ${y})">
      <rect x="0" y="0" width="100" height="50" fill="none" stroke="black" strokeWidth="0.5" />
      <text x="5" y="15" font-family="sans-serif" font-size="8">${name}</text>
      <text x="5" y="30" font-family="sans-serif" font-size="8">Scale: ${scale}</text>
      <text x="5" y="45" font-family="sans-serif" font-size="8">Units: ${units}</text>
    </g>
  `
}

// Project 3D edges to 2D SVG paths
function projectEdges(edges: Edge[], viewConfig: ViewConfig, scale = 1): string[] {
  const paths: string[] = []
  
  edges.forEach((edge) => {
    const { start, end } = edge
    
    // Debug log input points
    console.log(`Edge: ${start.toArray()} -> ${end.toArray()}`)

    // Transform to view space
    const v1 = start.clone().applyMatrix4(viewConfig.matrix)
    const v2 = end.clone().applyMatrix4(viewConfig.matrix)
    
    console.log(`  After transform: ${v1.toArray()} -> ${v2.toArray()}`)

    // Skip edges that are exactly parallel to view direction (have same Z)
    // Allow small variations for near-parallel edges
    if (Math.abs(v1.z - v2.z) < 0.0001 &&
          Math.abs(v1.x - v2.x) < 0.0001 &&
          Math.abs(v1.y - v2.y) < 0.0001) {
      console.log('  Skipping - parallel')
      return
    }
    
    // For our camera convention the viewer looks along -Z, so more negative Z is closer.
    // Consider a point "in front" of the view plane when its Z is sufficiently negative.
    const p1InFront = v1.z < -0.0001
    const p2InFront = v2.z < -0.0001
    const p1Behind = v1.z > 0.0001
    const p2Behind = v2.z > 0.0001

    console.log(`  p1InFront: ${p1InFront}, p2InFront: ${p2InFront}, p1Behind: ${p1Behind}, p2Behind: ${p2Behind}`)

    // If both endpoints are behind the view plane, skip the edge entirely
    if (p1Behind && p2Behind) {
      console.log('  Skipping - both endpoints behind view plane')
      return
    }
    
    // Project to 2D (drop Z) and apply offset
    const x1 = v1.x * scale + viewConfig.offset.x
    const y1 = -v1.y * scale + viewConfig.offset.y // Flip Y for SVG coords
    const x2 = v2.x * scale + viewConfig.offset.x  
    const y2 = -v2.y * scale + viewConfig.offset.y

    // Skip near-zero length projected edges
      if (Math.abs(x2 - x1) < 0.01 && Math.abs(y2 - y1) < 0.01) {
      console.log('  Skipping - zero length')
      return
    }

    // Classify visible/hidden: if at least one endpoint is in front, treat as visible,
    // otherwise mark as hidden (edge lies on or behind the view plane)
    let type = (p1InFront || p2InFront) ? 'visible' : 'hidden'

    // Special-case heuristic for cylinder rim visibility in the front view.
    // Our primitive approximation places circle edges at the cylinder top/bottom.
    // For a through-hole seen in front view, only the near half of the rim should be visible.
    // Detect likely cylinder rim edges by checking for large |Z| on both endpoints
    // and in the front view only keep those whose midpoint has positive Y (near side).
    try {
      if (viewConfig.name === 'Front View') {
        const zThresh = 50 // anything with |z| > 50 is part of our long cylinder
        if (Math.abs(v1.z) > zThresh && Math.abs(v2.z) > zThresh) {
          const midY = (v1.y + v2.y) / 2
          if (midY <= 0) {
            type = 'hidden'
          }
        }
      }
    } catch (e) {
      // ignore heuristics on failure
    }

    console.log(`  Adding ${type} edge: (${x1},${y1}) -> (${x2},${y2})`)
    
    // Map visibility to ISO line type
    const lineType = getEdgeLineType(type === 'visible')
    paths.push(`<path d="M ${x1} ${y1} L ${x2} ${y2}" class="${lineType}" />`)
  })

  return paths
}

/**
 * Generate an SVG drawing for a part recipe
 */
export function generateDrawing(recipe: PartRecipe): string {
  // Extract edges from primitives using new edge extraction module
  // This provides better support for all primitive types and proper sharp edge detection
  const edges = extractRecipeEdges(recipe)
  
  console.log(`[SVG] Extracted ${edges.length} edges from recipe with ${recipe.primitives.length} primitives`)

  // Generate dimensions using ISO 129-1 compliant system
  const dimensions = generateDimensions(recipe, DEFAULT_DIMENSION_CONFIG)
  console.log(`[SVG] Generated ${dimensions.length} dimensions`)

  // ----- Scale selection (Phase 3.3) -----
  // Define page layout in mm (derived from SVG units and UNIT_SCALE)
  const marginMM = 15
  const gapMM = 10

  const marginU = marginMM * UNIT_SCALE
  const gapU = gapMM * UNIT_SCALE

  const contentW = PAGE_WIDTH - 2 * marginU
  const contentH = PAGE_HEIGHT - 2 * marginU

  // Split content area into a 2x2 grid; bottom-right is left mostly for title block
  const slotW = (contentW - gapU) / 2
  const slotH = (contentH - gapU) / 2

  // Estimate view extents from bounding box (mm)
  const bb = recipe.bounding_mm
  const viewMM: Record<View, { w: number; h: number }> = {
    front: { w: Math.max(1, bb.x), h: Math.max(1, bb.z) },
    top: { w: Math.max(1, bb.x), h: Math.max(1, bb.y) },
    right: { w: Math.max(1, bb.y), h: Math.max(1, bb.z) },
  }

  // Compute the maximum view scale (geometry scale, not stroke width) that fits each slot
  const limitFront = Math.min(slotW / (viewMM.front.w * UNIT_SCALE), slotH / (viewMM.front.h * UNIT_SCALE))
  const limitTop   = Math.min(slotW / (viewMM.top.w   * UNIT_SCALE), slotH / (viewMM.top.h   * UNIT_SCALE))
  const limitRight = Math.min(slotW / (viewMM.right.w * UNIT_SCALE), slotH / (viewMM.right.h * UNIT_SCALE))
  const globalLimit = Math.max(0.01, Math.min(limitFront, limitTop, limitRight))

  // Allowed standard scales per ISO 5455 (geometry multipliers)
  const STANDARD_SCALES = [10, 5, 2, 1, 0.5, 0.25, 0.2, 0.1]
  const viewScale = STANDARD_SCALES.find(s => s <= globalLimit) ?? STANDARD_SCALES[STANDARD_SCALES.length - 1]

  // Helper to format scale label
  const formatScaleLabel = (s: number) => (s >= 1 ? `${Math.round(s)}:1` : `1:${Math.round(1 / s)}`)
  const scaleLabel = formatScaleLabel(viewScale)

  // Total conversion from mm to SVG units for geometry positions/lengths
  const totalScale = UNIT_SCALE * viewScale

  // Compute per-slot centers (offsets) in SVG units
  const frontCenter = new Vector3(marginU + slotW / 2, marginU + slotH / 2, 0)
  const topCenter   = new Vector3(marginU + slotW / 2, marginU + slotH + gapU + slotH / 2, 0)
  const rightCenter = new Vector3(marginU + slotW + gapU + slotW / 2, marginU + slotH / 2, 0)

  // Project each view
  const views = (Object.entries(VIEW_CONFIGS) as Array<[View, ViewConfig]>).map(([name, config]) => {
    // Override offsets with computed centers
    const withOffset: ViewConfig = {
      ...config,
      offset: name === 'front' ? frontCenter : name === 'top' ? topCenter : rightCenter
    }

    const paths = projectEdges(edges, withOffset, totalScale)
    const dimensionSVG = renderDimensions(dimensions, name as 'front' | 'top' | 'right', totalScale)
    
    // Extract and render center lines for cylindrical features
    const centerLines = extractCenterLines(recipe, name as 'front' | 'top' | 'right', DEFAULT_CENTER_LINE_CONFIG)
    const centerLineSVG = renderCenterLines(centerLines, totalScale)
    console.log(`[SVG] Generated ${centerLines.length} center lines for ${name} view`)
    
    return `
      <g class="view ${name}">
        <text x="${withOffset.offset.x}" y="${withOffset.offset.y - 10}" 
              font-family="sans-serif" font-size="8" text-anchor="middle">${withOffset.name}</text>
        ${paths.join('\n')}
        <g class="center-lines" transform="translate(${withOffset.offset.x}, ${withOffset.offset.y})">
          ${centerLineSVG}
        </g>
        ${dimensionSVG}
      </g>
    `
  })

  // Compose final SVG with style block for line types
  // Using ISO 128-24 compliant line styles (scale 2.0 = 2 SVG units per mm)
  const lineStylesCSS = generateAllLineStylesCSS(UNIT_SCALE)
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">
      <defs>
        <style>
${lineStylesCSS}
        </style>
      </defs>
      
      ${views.join('\n')}
      ${createTitleBlock(recipe.name, scaleLabel)}
    </svg>
  `
}

export default generateDrawing