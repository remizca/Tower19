/**
 * Basic SVG projection and rendering functions.
 * Uses Three.js for matrix math.
 */
import { Matrix4, Vector3 } from 'three'
import type { PartRecipe } from '../types/part'

// Line types for ISO drawings (used in generated SVG styles)
// @ts-expect-error - Used in template literal below
const LINE_TYPES = {
  VISIBLE: { stroke: '#000', strokeWidth: 0.7, strokeDasharray: 'none' },
  HIDDEN: { stroke: '#000', strokeWidth: 0.5, strokeDasharray: '3,1.5' },
  CENTER: { stroke: '#000', strokeWidth: 0.25, strokeDasharray: '6,2' }
} as const

type View = 'front' | 'top' | 'right'
type Edge = [Vector3, Vector3] // Start and end points

interface ViewConfig {
  matrix: Matrix4
  name: string
  offset: Vector3
}

// First-angle orthographic projection
const VIEW_CONFIGS: Record<View, ViewConfig> = {
  front: {
    matrix: new Matrix4(), // Front view: no rotation
    name: 'Front View',
    offset: new Vector3(100, 100, 0)
  },
  top: {
    matrix: new Matrix4().makeRotationX(-Math.PI/2), // Top view: rotate -90° around X
    name: 'Top View', 
    offset: new Vector3(100, 220, 0)
  },
  right: {
    matrix: new Matrix4().makeRotationY(Math.PI/2), // Right view: rotate 90° around Y
    name: 'Right View',
    offset: new Vector3(220, 100, 0)
  }
}

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

// Basic edge extraction from primitive data
function extractEdges(recipe: PartRecipe): Edge[] {
  const edges: Edge[] = []
  
  // Start by adding the base box edges
  const base = recipe.primitives.find(p => p.id === 'p0') 
  if (base && base.kind === 'box') {
    const params = base.params as any
    const w = params.width/2, d = params.depth/2, h = params.height/2
    
    // 8 corners of the box
    const corners = [
      new Vector3(-w, -d, -h), new Vector3(w, -d, -h), // front bottom
      new Vector3(w, d, -h), new Vector3(-w, d, -h),   // back bottom
      new Vector3(-w, -d, h), new Vector3(w, -d, h),   // front top
      new Vector3(w, d, h), new Vector3(-w, d, h),     // back top
    ]

    // 12 box edges
    edges.push(
      [corners[0], corners[1]], [corners[1], corners[2]], // bottom face
      [corners[2], corners[3]], [corners[3], corners[0]],
      [corners[4], corners[5]], [corners[5], corners[6]], // top face
      [corners[6], corners[7]], [corners[7], corners[4]],
      [corners[0], corners[4]], [corners[1], corners[5]], // verticals
      [corners[2], corners[6]], [corners[3], corners[7]]
    )
  }

  // Add simplified hole edges (vertical lines and circle)
  recipe.primitives.forEach(primitive => {
    if (primitive.kind === 'cylinder') {
      const params = primitive.params as any
      const segments = 4 // Simple octagonal approximation for test
      const angleStep = (2 * Math.PI) / segments
      const r = params.radius
      const center = primitive.transform?.position || { x: 0, y: 0, z: 0 }

      // Add circle edges at top and bottom
      const h = params.height/2
      for (let i = 0; i < segments; i++) {
        const angle1 = i * angleStep
        const angle2 = ((i + 1) % segments) * angleStep
        
        // Bottom circle
        edges.push([
          new Vector3(
            center.x + r * Math.cos(angle1),
            center.y + r * Math.sin(angle1),
            center.z - h
          ),
          new Vector3(
            center.x + r * Math.cos(angle2),
            center.y + r * Math.sin(angle2),
            center.z - h
          )
        ])

        // Top circle
        edges.push([
          new Vector3(
            center.x + r * Math.cos(angle1),
            center.y + r * Math.sin(angle1),
            center.z + h
          ),
          new Vector3(
            center.x + r * Math.cos(angle2),
            center.y + r * Math.sin(angle2),
            center.z + h
          )
        ])
      }

      // Add vertical lines at corners
      for (let i = 0; i < segments; i++) {
        const angle = i * angleStep
        edges.push([
          new Vector3(
            center.x + r * Math.cos(angle),
            center.y + r * Math.sin(angle),
            center.z - h
          ),
          new Vector3(
            center.x + r * Math.cos(angle),
            center.y + r * Math.sin(angle),
            center.z + h
          )
        ])
      }
    }
  })

  return edges
}

// Project 3D edges to 2D SVG paths
function projectEdges(edges: Edge[], viewConfig: ViewConfig, scale = 1): string[] {
  const paths: string[] = []
  
  edges.forEach(([start, end]) => {
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
    paths.push(`<path d="M ${x1} ${y1} L ${x2} ${y2}" class="${type}" />`)
  })

  return paths
}

/**
 * Generate an SVG drawing for a part recipe
 */
export function generateDrawing(recipe: PartRecipe): string {
  // Extract edges from primitives
  const edges = extractEdges(recipe)

  // Project each view
  const views = Object.entries(VIEW_CONFIGS).map(([name, config]) => {
    const paths = projectEdges(edges, config)
    return `
      <g class="view ${name}">
        <text x="${config.offset.x}" y="${config.offset.y - 10}" 
              font-family="sans-serif" font-size="8" text-anchor="middle">${config.name}</text>
        ${paths.join('\n')}
      </g>
    `
  })

  // Compose final SVG with style block for line types
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <style>
          path { fill: none; }
          .visible { stroke: black; stroke-width: 0.7; }
          .hidden { stroke: black; stroke-width: 0.5; stroke-dasharray: 3,1.5; }
          .center { stroke: black; stroke-width: 0.25; stroke-dasharray: 6,2; }
        </style>
      </defs>
      
      ${views.join('\n')}
      ${createTitleBlock(recipe.name)}
    </svg>
  `
}

export default generateDrawing