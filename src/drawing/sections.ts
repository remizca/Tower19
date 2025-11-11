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
    // Simplified implementation: Generate section contour from bounding box
    // Full CSG mesh slicing would require Three.js BufferGeometry intersection
    // For now, create rectangular section based on part dimensions
  
    const { bounding_mm } = recipe
    const { x: width, y: depth, z: height } = bounding_mm
  
    const contours: SectionContour[] = []
  
    // Determine which plane we're cutting through
    if (Math.abs(plane.normal.x) > 0.5) {
      // X-axis normal (YZ plane section)
      // Shows depth (Y) and height (Z)
      contours.push({
        points: [
          { x: -depth / 2, y: -height / 2 },
          { x: depth / 2, y: -height / 2 },
          { x: depth / 2, y: height / 2 },
          { x: -depth / 2, y: height / 2 }
        ],
        isOuter: true,
        winding: 'ccw'
      })
    
      // Add hole contours for subtraction primitives
      for (const op of recipe.operations) {
        if (op.type === 'subtraction') {
          const primitive = recipe.primitives.find(p => p.id === op.tool)
          if (primitive && primitive.type === 'cylinder') {
            // Check if cylinder intersects the cutting plane
            const pos = primitive.position
            const axis = primitive.axis || 'z'
          
            // Only show hole if cylinder axis is perpendicular to cut plane
            if (axis === 'z' || axis === 'y') {
              const holeRadius = primitive.parameters.radius
              const holeY = axis === 'z' ? pos.y : pos.x
              const holeZ = pos.z
            
              // Create circular hole (approximated as octagon)
              const sides = 8
              const holePoints: Array<{ x: number; y: number }> = []
              for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI) / sides
                holePoints.push({
                  x: holeY + holeRadius * Math.cos(angle),
                  y: holeZ + holeRadius * Math.sin(angle)
                })
              }
            
              contours.push({
                points: holePoints,
                isOuter: false,
                winding: 'cw'
              })
            }
          }
        }
      }
    } else if (Math.abs(plane.normal.y) > 0.5) {
      // Y-axis normal (XZ plane section)
      // Shows width (X) and height (Z)
      contours.push({
        points: [
          { x: -width / 2, y: -height / 2 },
          { x: width / 2, y: -height / 2 },
          { x: width / 2, y: height / 2 },
          { x: -width / 2, y: height / 2 }
        ],
        isOuter: true,
        winding: 'ccw'
      })
    
      // Add holes from subtractions
      for (const op of recipe.operations) {
        if (op.type === 'subtraction') {
          const primitive = recipe.primitives.find(p => p.id === op.tool)
          if (primitive && primitive.type === 'cylinder') {
            const pos = primitive.position
            const axis = primitive.axis || 'z'
          
            if (axis === 'z' || axis === 'x') {
              const holeRadius = primitive.parameters.radius
              const holeX = axis === 'z' ? pos.x : pos.y
              const holeZ = pos.z
            
              const sides = 8
              const holePoints: Array<{ x: number; y: number }> = []
              for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI) / sides
                holePoints.push({
                  x: holeX + holeRadius * Math.cos(angle),
                  y: holeZ + holeRadius * Math.sin(angle)
                })
              }
            
              contours.push({
                points: holePoints,
                isOuter: false,
                winding: 'cw'
              })
            }
          }
        }
      }
    } else {
      // Z-axis normal (XY plane section)
      // Shows width (X) and depth (Y)
      contours.push({
        points: [
          { x: -width / 2, y: -depth / 2 },
          { x: width / 2, y: -depth / 2 },
          { x: width / 2, y: depth / 2 },
          { x: -width / 2, y: depth / 2 }
        ],
        isOuter: true,
        winding: 'ccw'
      })
    }
  
    return contours
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
    const hatchLines: HatchLine[] = []
  
    // Get bounding box of contour
    const bounds = getContourBounds(contour)
  
    // Convert angle to radians
    const angleRad = (pattern.angle * Math.PI) / 180
  
    // Calculate direction vector for hatch lines
    const dx = Math.cos(angleRad)
    const dy = Math.sin(angleRad)
  
    // Perpendicular vector (for spacing)
    const perpX = -dy
    const perpY = dx
  
    // Expand bounds slightly to ensure coverage
    const margin = pattern.spacing * 2
    const expandedMinX = bounds.minX - margin
    const expandedMinY = bounds.minY - margin
    const expandedMaxX = bounds.maxX + margin
    const expandedMaxY = bounds.maxY + margin
  
    // Calculate bounding box diagonal for line length
    const diagonal = Math.sqrt(
      (expandedMaxX - expandedMinX) ** 2 + 
      (expandedMaxY - expandedMinY) ** 2
    )
  
    // Determine number of lines needed
    // Project bounding box onto perpendicular axis
    const corners = [
      { x: expandedMinX, y: expandedMinY },
      { x: expandedMaxX, y: expandedMinY },
      { x: expandedMaxX, y: expandedMaxY },
      { x: expandedMinX, y: expandedMaxY }
    ]
  
    let minProj = Infinity
    let maxProj = -Infinity
  
    for (const corner of corners) {
      const proj = corner.x * perpX + corner.y * perpY
      minProj = Math.min(minProj, proj)
      maxProj = Math.max(maxProj, proj)
    }
  
    const numLines = Math.ceil((maxProj - minProj) / pattern.spacing) + 1
  
    // Generate parallel lines
    for (let i = 0; i < numLines; i++) {
      const offset = minProj + i * pattern.spacing
    
      // Start and end points of line (before clipping)
      const centerX = offset * perpX
      const centerY = offset * perpY
    
      const start: Point2D = {
        x: centerX - dx * diagonal / 2,
        y: centerY - dy * diagonal / 2
      }
    
      const end: Point2D = {
        x: centerX + dx * diagonal / 2,
        y: centerY + dy * diagonal / 2
      }
    
      // Clip line to contour
      const clippedSegments = clipLineToPolygon(start, end, contour.points)
    
      // Add clipped segments
      hatchLines.push(...clippedSegments)
    }
  
    return hatchLines
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

  /**
   * Clip a line segment to a polygon boundary
   * Returns array of line segments that lie inside the polygon
   * 
   * Algorithm: Sutherland-Hodgman polygon clipping adapted for lines
   * 
   * @param start - Line start point
   * @param end - Line end point
   * @param polygon - Polygon points (closed contour)
   * @returns Array of clipped line segments
   */
  export function clipLineToPolygon(
    start: Point2D,
    end: Point2D,
    polygon: Point2D[]
  ): HatchLine[] {
    // Find all intersection points with polygon edges
    const intersections: Array<{ point: Point2D; t: number }> = []
  
    const n = polygon.length
  
    for (let i = 0; i < n; i++) {
      const p1 = polygon[i]
      const p2 = polygon[(i + 1) % n]
    
      const intersection = lineSegmentIntersection(start, end, p1, p2)
    
      if (intersection) {
        intersections.push(intersection)
      }
    }
  
    // Sort intersections by parameter t (position along line)
    intersections.sort((a, b) => a.t - b.t)
  
    // Build segments from intersections
    const segments: HatchLine[] = []
  
    // Check if start point is inside
    const startInside = isPointInPolygon(start, polygon)
  
    if (intersections.length === 0) {
      // No intersections - line is either completely inside or outside
      if (startInside) {
        segments.push({ start, end })
      }
      return segments
    }
  
    // Build segments between intersection points
    let currentPoint = start
    let isInside = startInside
  
    for (const intersection of intersections) {
      if (isInside) {
        // Add segment from current point to intersection
        segments.push({
          start: currentPoint,
          end: intersection.point
        })
      }
    
      currentPoint = intersection.point
      isInside = !isInside
    }
  
    // Handle final segment to end point
    if (isInside) {
      segments.push({
        start: currentPoint,
        end
      })
    }
  
    return segments
  }

  /**
   * Find intersection between two line segments
   * 
   * @param a1 - First line start
   * @param a2 - First line end
   * @param b1 - Second line start
   * @param b2 - Second line end
   * @returns Intersection point and parameter t, or null if no intersection
   */
  function lineSegmentIntersection(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): { point: Point2D; t: number } | null {
    const dx1 = a2.x - a1.x
    const dy1 = a2.y - a1.y
    const dx2 = b2.x - b1.x
    const dy2 = b2.y - b1.y
  
    const denom = dx1 * dy2 - dy1 * dx2
  
    // Parallel lines
    if (Math.abs(denom) < 1e-10) {
      return null
    }
  
    const dx3 = b1.x - a1.x
    const dy3 = b1.y - a1.y
  
    const t = (dx3 * dy2 - dy3 * dx2) / denom
    const u = (dx3 * dy1 - dy3 * dx1) / denom
  
    // Check if intersection is within both line segments
    const epsilon = 1e-10
    if (t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon) {
      return {
        point: {
          x: a1.x + t * dx1,
          y: a1.y + t * dy1
        },
        t: t
      }
    }
  
    return null
  }
