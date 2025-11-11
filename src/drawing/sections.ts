/**
 * Section view generation for 2D drawings (ISO 128-50)
 * 
 * This module handles:
 * - Section plane selection and definition
 * - Geometry slicing and contour extraction
 * - Hatch pattern generation
 * - Section view rendering
 * 
 * ISO Standards:
 * - ISO 128-50: Sectioning conventions (hatch patterns, line types, labels)
 * - ISO 128-24: Line types for section planes (chain thick)
 */

import type { PartRecipe } from '../types'
import type { Vector3 } from 'three'

/**
 * Section plane definition
 * Represents a cutting plane through 3D geometry
 */
export interface CuttingPlane {
  /** Unique identifier for the section (A, B, C, etc.) */
  id: string
  
  /** Type of section view */
  type: 'full' | 'half' | 'offset' | 'broken'
  
  /** Point on the plane (position) */
  position: Vector3
  
  /** Plane normal vector (direction of cutting) */
  normal: Vector3
  
  /** Viewing direction (where to look from after cutting) */
  viewDirection: Vector3
  
  /** Label for the section view (e.g., "SECTION A-A") */
  label: string
  
  /** Which orthographic view to show the cutting plane line in */
  parentView: 'front' | 'top' | 'right'
}

/**
 * 2D point for contour representation
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Closed contour extracted from section cut
 * Represents the outline of material at the cutting plane
 */
export interface SectionContour {
  /** Array of points forming closed loop (last connects to first) */
  points: Point2D[]
  
  /** Whether this is an outer boundary (true) or inner hole (false) */
  isOuter: boolean
  
  /** Winding order: 'cw' for clockwise, 'ccw' for counter-clockwise */
  winding: 'cw' | 'ccw'
}

/**
 * Hatch pattern configuration per ISO 128-50
 */
export interface HatchPattern {
  /** Hatch line angle in degrees (typically 45°) */
  angle: number
  
  /** Spacing between hatch lines in mm (typically 2-3mm) */
  spacing: number
  
  /** Line width in mm (typically 0.35mm - thin line) */
  lineWidth: number
  
  /** Material type (affects pattern style) */
  material?: 'steel' | 'aluminum' | 'plastic' | 'general'
}

/**
 * Default hatch pattern per ISO 128-50
 */
export const DEFAULT_HATCH_PATTERN: HatchPattern = {
  angle: 45,
  spacing: 3,
  lineWidth: 0.35,
  material: 'general'
}

/**
 * Complete section view representation
 */
export interface SectionView {
  /** The cutting plane that generated this section */
  plane: CuttingPlane
  
  /** Contours extracted from the cut (outer and inner boundaries) */
  contours: SectionContour[]
  
  /** Hatch pattern to use for filled regions */
  hatchPattern: HatchPattern
  
  /** Position of section view on drawing sheet */
  position: { x: number; y: number }
  
  /** Scale factor for the section view */
  scale: number
}

/**
 * Hatch line segment (2D line in section view)
 */
export interface HatchLine {
  start: Point2D
  end: Point2D
}

/**
 * Select optimal cutting plane for a part
 * 
 * Strategy:
 * 1. Start with midplane sections (X=0, Y=0, Z=0)
 * 2. Choose plane that reveals most internal features
 * 3. Prefer planes aligned with major axes
 * 
 * @param recipe - Part recipe with geometry
 * @returns Suggested cutting plane
 */
export function selectCuttingPlane(recipe: PartRecipe): CuttingPlane {
  const { bounding_mm } = recipe
  const { x: width, y: depth, z: height } = bounding_mm
  
  // For now, use simple heuristic: section through largest dimension
  // This is most likely to reveal internal features
  
  // Find largest dimension
  const maxDim = Math.max(width, depth, height)
  
  let plane: CuttingPlane
  
  if (maxDim === width) {
    // Section perpendicular to X axis (shows front view internals)
    plane = {
      id: 'A',
      type: 'full',
      position: { x: 0, y: 0, z: 0 },
      normal: { x: 1, y: 0, z: 0 },
      viewDirection: { x: 1, y: 0, z: 0 },
      label: 'SECTION A-A',
      parentView: 'top'
    }
  } else if (maxDim === depth) {
    // Section perpendicular to Y axis (shows top view internals)
    plane = {
      id: 'A',
      type: 'full',
      position: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      viewDirection: { x: 0, y: 1, z: 0 },
      label: 'SECTION A-A',
      parentView: 'front'
    }
  } else {
    // Section perpendicular to Z axis (shows side view internals)
    plane = {
      id: 'A',
      type: 'full',
      position: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      viewDirection: { x: 0, y: 0, z: 1 },
      label: 'SECTION A-A',
      parentView: 'front'
    }
  }
  
  return plane
}

/**
 * Slice geometry with cutting plane to extract contours
 * 
 * This is a placeholder for the full implementation which will:
 * 1. Intersect plane with BufferGeometry
 * 2. Extract edge loops from intersection
 * 3. Classify outer vs inner contours
 * 4. Order points to form closed polygons
 * 
 * @param recipe - Part recipe
 * @param plane - Cutting plane
 * @returns Array of contours (outer and holes)
 */
export function sliceGeometry(
  recipe: PartRecipe,
  plane: CuttingPlane
): SectionContour[] {
  // TODO: Implement geometry slicing
  // For now, return empty array
  // Full implementation will:
  // 1. Get CSG mesh from recipe
  // 2. Intersect with plane
  // 3. Extract contour edges
  // 4. Project to 2D
  
  console.warn('sliceGeometry not yet implemented')
  return []
}

/**
 * Generate hatch lines for a contour
 * 
 * Algorithm:
 * 1. Calculate bounding box of contour
 * 2. Generate parallel lines at specified angle and spacing
 * 3. Clip lines to contour boundary using polygon clipping
 * 4. Return line segments
 * 
 * @param contour - Section contour to hatch
 * @param pattern - Hatch pattern configuration
 * @returns Array of hatch line segments
 */
export function generateHatchLines(
  contour: SectionContour,
  pattern: HatchPattern
): HatchLine[] {
  // TODO: Implement hatch line generation
  // For now, return empty array
  // Full implementation will:
  // 1. Compute bounding box
  // 2. Generate parallel lines at angle
  // 3. Clip to contour using point-in-polygon test
  // 4. Handle inner holes (subtract)
  
  console.warn('generateHatchLines not yet implemented')
  return []
}

/**
 * Create a complete section view for a part
 * 
 * @param recipe - Part recipe
 * @param plane - Optional cutting plane (auto-selected if not provided)
 * @param position - Position on drawing sheet
 * @param scale - Drawing scale
 * @returns Complete section view
 */
export function createSectionView(
  recipe: PartRecipe,
  plane?: CuttingPlane,
  position: { x: number; y: number } = { x: 0, y: 0 },
  scale: number = 1
): SectionView {
  // Use provided plane or auto-select
  const cuttingPlane = plane ?? selectCuttingPlane(recipe)
  
  // Slice geometry to get contours
  const contours = sliceGeometry(recipe, cuttingPlane)
  
  return {
    plane: cuttingPlane,
    contours,
    hatchPattern: DEFAULT_HATCH_PATTERN,
    position,
    scale
  }
}

/**
 * Check if a point is inside a polygon (contour)
 * Uses ray casting algorithm
 * 
 * @param point - Point to test
 * @param polygon - Polygon points
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false
  const n = polygon.length
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Calculate bounding box for a contour
 * 
 * @param contour - Section contour
 * @returns Bounding box {minX, minY, maxX, maxY}
 */
export function getContourBounds(contour: SectionContour): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  if (contour.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  for (const point of contour.points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }
  
  return { minX, minY, maxX, maxY }
}
