/**
 * Advanced geometry slicing for section views
 * 
 * Implements cutting plane intersection with CSG BufferGeometry:
 * 1. Intersect plane with mesh triangles to get edge segments
 * 2. Stitch segments into closed contour loops
 * 3. Classify loops as outer boundaries vs inner holes
 * 4. Handle degenerate cases and fallback to simplified slicing
 * 
 * Algorithm based on:
 * - Plane-triangle intersection (geometric)
 * - Edge graph traversal for loop assembly
 * - Winding order classification (ccw = outer, cw = inner)
 */

import type { BufferGeometry, Vector3 } from 'three'
import type { CuttingPlane, SectionContour, Point2D } from './sections'
import { Vector3 as ThreeVector3, Plane as ThreePlane } from 'three'

/**
 * 3D line segment from plane-triangle intersection
 */
interface IntersectionSegment {
  start: Vector3
  end: Vector3
}

/**
 * 2D line segment after projection to cutting plane
 */
interface Segment2D {
  start: Point2D
  end: Point2D
}

/**
 * Options for CSG slicing
 */
export interface SlicingOptions {
  /** Tolerance for vertex/edge matching (mm) */
  tolerance: number
  
  /** Minimum loop area to consider valid (mm²) */
  minLoopArea: number
  
  /** Enable debug logging */
  debug: boolean
}

export const DEFAULT_SLICING_OPTIONS: SlicingOptions = {
  tolerance: 0.001, // 1 micron
  minLoopArea: 0.1, // 0.1 mm²
  debug: false
}

/**
 * Slice BufferGeometry with cutting plane to extract contours
 * 
 * This is the main entry point for CSG-based slicing.
 * Falls back to empty array on failure (caller should use simplified slicing).
 * 
 * @param geometry - Three.js BufferGeometry to slice
 * @param plane - Cutting plane definition
 * @param options - Slicing configuration
 * @returns Array of section contours (empty on failure)
 */
export function sliceGeometryCSG(
  geometry: BufferGeometry,
  plane: CuttingPlane,
  options: SlicingOptions = DEFAULT_SLICING_OPTIONS
): SectionContour[] {
  try {
    // Convert CuttingPlane to Three.js Plane
    const threePlane = new ThreePlane(
      new ThreeVector3(plane.normal.x, plane.normal.y, plane.normal.z),
      0 // Distance from origin (midplane at 0)
    )
    
    // Step 1: Extract intersection segments from mesh triangles
    const segments3D = extractIntersectionSegments(geometry, threePlane, options)
    
    if (segments3D.length === 0) {
      if (options.debug) console.log('No intersection segments found')
      return []
    }
    
    if (options.debug) console.log(`Extracted ${segments3D.length} intersection segments`)
    
    // Step 2: Project segments to 2D (cutting plane local coordinates)
    const segments2D = projectSegmentsTo2D(segments3D, plane)
    
    // Step 3: Stitch segments into closed loops
    const loops = stitchSegmentsIntoLoops(segments2D, options)
    
    if (loops.length === 0) {
      if (options.debug) console.log('Failed to stitch segments into loops')
      return []
    }
    
    if (options.debug) console.log(`Stitched ${loops.length} contour loops`)
    
    // Step 4: Classify loops and convert to SectionContours
    const contours = classifyLoops(loops, options)
    
    return contours
    
  } catch (error) {
    if (options.debug) console.error('CSG slicing failed:', error)
    return []
  }
}

/**
 * Extract intersection segments from BufferGeometry triangles
 * 
 * For each triangle, compute intersection with plane:
 * - 0 intersections: triangle doesn't cross plane
 * - 2 intersections: triangle crosses plane (add segment)
 * 
 * @param geometry - Mesh geometry
 * @param plane - Cutting plane
 * @param options - Slicing options
 * @returns Array of 3D line segments
 */
function extractIntersectionSegments(
  geometry: BufferGeometry,
  plane: ThreePlane,
  options: SlicingOptions
): IntersectionSegment[] {
  const segments: IntersectionSegment[] = []
  
  const positions = geometry.attributes.position
  if (!positions) return segments
  
  const index = geometry.index
  const triangleCount = index ? index.count / 3 : positions.count / 3
  
  // Vertex pool for triangle processing
  const v0 = new ThreeVector3()
  const v1 = new ThreeVector3()
  const v2 = new ThreeVector3()
  
  // Process each triangle
  for (let i = 0; i < triangleCount; i++) {
    // Get triangle vertices
    if (index) {
      const i0 = index.getX(i * 3)
      const i1 = index.getX(i * 3 + 1)
      const i2 = index.getX(i * 3 + 2)
      
      v0.fromBufferAttribute(positions, i0)
      v1.fromBufferAttribute(positions, i1)
      v2.fromBufferAttribute(positions, i2)
    } else {
      v0.fromBufferAttribute(positions, i * 3)
      v1.fromBufferAttribute(positions, i * 3 + 1)
      v2.fromBufferAttribute(positions, i * 3 + 2)
    }
    
    // Compute plane-triangle intersection
    const segment = intersectTriangleWithPlane(v0, v1, v2, plane, options.tolerance)
    if (segment) {
      segments.push(segment)
    }
  }
  
  return segments
}

/**
 * Compute intersection of triangle with plane
 * 
 * Algorithm:
 * 1. Compute signed distances of vertices to plane
 * 2. Classify vertices as above (+), on (0), or below (-) plane
 * 3. If all same sign, no intersection
 * 4. Otherwise, find two edge-plane intersection points
 * 
 * @param v0 - Triangle vertex 0
 * @param v1 - Triangle vertex 1
 * @param v2 - Triangle vertex 2
 * @param plane - Cutting plane
 * @param tolerance - Distance tolerance
 * @returns Line segment or null if no intersection
 */
function intersectTriangleWithPlane(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  plane: ThreePlane,
  tolerance: number
): IntersectionSegment | null {
  // Compute signed distances to plane
  const d0 = plane.distanceToPoint(v0)
  const d1 = plane.distanceToPoint(v1)
  const d2 = plane.distanceToPoint(v2)
  
  // Classify vertices (with tolerance)
  const s0 = Math.abs(d0) < tolerance ? 0 : Math.sign(d0)
  const s1 = Math.abs(d1) < tolerance ? 0 : Math.sign(d1)
  const s2 = Math.abs(d2) < tolerance ? 0 : Math.sign(d2)
  
  // Check if all vertices on same side (no intersection)
  if (s0 === s1 && s1 === s2 && s0 !== 0) return null
  
  // Collect intersection points
  const intersectionPoints: Vector3[] = []
  
  // Check edge v0-v1
  if (s0 !== s1) {
    const t = d0 / (d0 - d1)
    if (t >= 0 && t <= 1) {
      intersectionPoints.push(
        new ThreeVector3().lerpVectors(v0, v1, t)
      )
    }
  } else if (s0 === 0) {
    intersectionPoints.push(v0.clone())
  }
  
  // Check edge v1-v2
  if (s1 !== s2) {
    const t = d1 / (d1 - d2)
    if (t >= 0 && t <= 1) {
      intersectionPoints.push(
        new ThreeVector3().lerpVectors(v1, v2, t)
      )
    }
  } else if (s1 === 0 && intersectionPoints.length === 0) {
    intersectionPoints.push(v1.clone())
  }
  
  // Check edge v2-v0
  if (s2 !== s0) {
    const t = d2 / (d2 - d0)
    if (t >= 0 && t <= 1) {
      intersectionPoints.push(
        new ThreeVector3().lerpVectors(v2, v0, t)
      )
    }
  } else if (s2 === 0 && intersectionPoints.length === 0) {
    intersectionPoints.push(v2.clone())
  }
  
  // Need exactly 2 intersection points
  if (intersectionPoints.length !== 2) return null
  
  // Return segment (skip degenerate zero-length segments)
  const segmentLength = intersectionPoints[0].distanceTo(intersectionPoints[1])
  if (segmentLength < tolerance) return null
  
  return {
    start: intersectionPoints[0],
    end: intersectionPoints[1]
  }
}

/**
 * Project 3D segments to 2D cutting plane coordinates
 * 
 * Establishes a 2D coordinate system on the cutting plane:
 * - Origin: plane.position
 * - X-axis: perpendicular to plane normal (chosen for right-handed system)
 * - Y-axis: cross product to complete right-handed system
 * 
 * The coordinate system is chosen to preserve CCW winding for outer contours
 * when viewed from the positive normal direction.
 * 
 * @param segments3D - Array of 3D segments
 * @param plane - Cutting plane (defines 2D coordinate system)
 * @returns Array of 2D segments
 */
function projectSegmentsTo2D(
  segments3D: IntersectionSegment[],
  plane: CuttingPlane
): Segment2D[] {
  // Define 2D coordinate system on cutting plane
  const normal = new ThreeVector3(plane.normal.x, plane.normal.y, plane.normal.z)
  
  // Choose X-axis perpendicular to normal
  // Use world axes to ensure consistent orientation
  let xAxis: ThreeVector3
  let yAxis: ThreeVector3
  
  if (Math.abs(normal.x) > 0.9) {
    // Normal ~parallel to X-axis → use Y and Z for plane
    yAxis = new ThreeVector3(0, 1, 0)
    xAxis = new ThreeVector3().crossVectors(yAxis, normal).normalize()
  } else if (Math.abs(normal.y) > 0.9) {
    // Normal ~parallel to Y-axis → use X and Z for plane
    xAxis = new ThreeVector3(1, 0, 0)
    yAxis = new ThreeVector3().crossVectors(normal, xAxis).normalize()
  } else {
    // Normal ~parallel to Z-axis → use X and Y for plane
    xAxis = new ThreeVector3(1, 0, 0)
    yAxis = new ThreeVector3().crossVectors(normal, xAxis).normalize()
  }
  
  const origin = new ThreeVector3(plane.position.x, plane.position.y, plane.position.z)
  
  // Project each segment
  const segments2D: Segment2D[] = []
  
  for (const seg of segments3D) {
    // Convert to plane-local coordinates
    const startLocal = new ThreeVector3().subVectors(seg.start as ThreeVector3, origin)
    const endLocal = new ThreeVector3().subVectors(seg.end as ThreeVector3, origin)
    
    segments2D.push({
      start: {
        x: startLocal.dot(xAxis),
        y: startLocal.dot(yAxis)
      },
      end: {
        x: endLocal.dot(xAxis),
        y: endLocal.dot(yAxis)
      }
    })
  }
  
  return segments2D
}

/**
 * Stitch 2D segments into closed loops
 * 
 * Algorithm:
 * 1. Build adjacency graph (vertex -> segments)
 * 2. For each unvisited segment, traverse to build loop
 * 3. Match endpoints within tolerance
 * 4. Validate loop closure
 * 
 * @param segments - Array of 2D segments
 * @param options - Slicing options
 * @returns Array of closed loops (point arrays)
 */
function stitchSegmentsIntoLoops(
  segments: Segment2D[],
  options: SlicingOptions
): Point2D[][] {
  if (segments.length === 0) return []
  
  const loops: Point2D[][] = []
  const visited = new Set<number>()
  
  // Try to build a loop starting from each unvisited segment
  for (let i = 0; i < segments.length; i++) {
    if (visited.has(i)) continue
    
    const loop = buildLoop(segments, i, visited, options.tolerance)
    if (loop && loop.length >= 3) {
      loops.push(loop)
    }
  }
  
  return loops
}

/**
 * Build a single closed loop starting from a seed segment
 * 
 * @param segments - All segments
 * @param seedIndex - Index of starting segment
 * @param visited - Set of already-used segment indices
 * @param tolerance - Vertex matching tolerance
 * @returns Closed loop of points, or null on failure
 */
function buildLoop(
  segments: Segment2D[],
  seedIndex: number,
  visited: Set<number>,
  tolerance: number
): Point2D[] | null {
  const loop: Point2D[] = []
  let currentPoint = segments[seedIndex].start
  
  loop.push(currentPoint)
  visited.add(seedIndex)
  currentPoint = segments[seedIndex].end
  loop.push(currentPoint)
  
  const maxIterations = segments.length * 2 // Prevent infinite loops
  let iterations = 0
  
  // Keep adding segments until loop closes or we run out
  while (iterations++ < maxIterations) {
    // Find next segment that connects to currentPoint
    let nextIndex = -1
    let flipNext = false
    
    for (let i = 0; i < segments.length; i++) {
      if (visited.has(i)) continue
      
      const seg = segments[i]
      
      if (pointsEqual(currentPoint, seg.start, tolerance)) {
        nextIndex = i
        flipNext = false
        break
      } else if (pointsEqual(currentPoint, seg.end, tolerance)) {
        nextIndex = i
        flipNext = true
        break
      }
    }
    
    // No connecting segment found
    if (nextIndex === -1) {
      // Check if loop is closed (currentPoint near start)
      if (pointsEqual(currentPoint, loop[0], tolerance)) {
        return loop
      }
      // Open contour - invalid for section view
      return null
    }
    
    // Add next segment
    visited.add(nextIndex)
    const nextSeg = segments[nextIndex]
    currentPoint = flipNext ? nextSeg.start : nextSeg.end
    
    // Check for closure before adding point
    if (pointsEqual(currentPoint, loop[0], tolerance)) {
      return loop
    }
    
    loop.push(currentPoint)
  }
  
  // Failed to close loop
  return null
}

/**
 * Check if two points are equal within tolerance
 */
function pointsEqual(p1: Point2D, p2: Point2D, tolerance: number): boolean {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy) < tolerance
}

/**
 * Classify loops as outer boundaries or inner holes
 * 
 * Algorithm:
 * 1. Compute signed area (ccw = positive, cw = negative)
 * 2. Largest positive area → outer boundary
 * 3. Negative area → inner hole
 * 4. Filter out tiny loops (noise)
 * 
 * Note: In some coordinate systems, the winding may be inverted.
 * We use absolute area to find the largest loop (assumed outer)
 * and classify others relative to it.
 * 
 * @param loops - Array of point loops
 * @param options - Slicing options
 * @returns Array of classified contours
 */
function classifyLoops(
  loops: Point2D[][],
  options: SlicingOptions
): SectionContour[] {
  if (loops.length === 0) return []
  
  const contours: SectionContour[] = []
  
  // Compute areas and filter tiny loops
  const loopsWithArea = loops
    .map(loop => ({
      loop,
      area: computeSignedArea(loop)
    }))
    .filter(({ area }) => Math.abs(area) >= options.minLoopArea)
  
  if (loopsWithArea.length === 0) return []
  
  // Find largest loop by absolute area - this is the outer boundary
  loopsWithArea.sort((a, b) => Math.abs(b.area) - Math.abs(a.area))
  const largestArea = loopsWithArea[0].area
  
  // Classify based on area sign relative to largest
  // If largest is positive, positive = outer (ccw), negative = inner (cw)
  // If largest is negative, negative = outer (cw), positive = inner (ccw)
  const outerSign = Math.sign(largestArea)
  
  for (const { loop, area } of loopsWithArea) {
    const isOuter = Math.sign(area) === outerSign
    
    contours.push({
      points: loop,
      isOuter,
      winding: area > 0 ? 'ccw' : 'cw'
    })
  }
  
  return contours
}

/**
 * Compute signed area of polygon using shoelace formula
 * 
 * @param points - Polygon vertices
 * @returns Signed area (positive = ccw, negative = cw)
 */
function computeSignedArea(points: Point2D[]): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  
  return area / 2
}
