/**
 * Edge extraction and visibility detection for 2D drawing generation
 * 
 * This module provides robust edge extraction from CSG meshes and
 * ray-casting based visibility detection for ISO-compliant technical drawings.
 */

import { Vector3, BufferGeometry, Matrix4, Raycaster, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, Euler } from 'three'
import type { PartRecipe, Primitive } from '../types/part'

export interface Edge {
  start: Vector3
  end: Vector3
}

export interface ClassifiedEdge extends Edge {
  visible: boolean
  type: 'sharp' | 'smooth' | 'silhouette'
}

/**
 * Edge angle threshold in radians
 * Edges between faces with angle > threshold are considered sharp edges
 */
const EDGE_ANGLE_THRESHOLD = Math.PI / 6 // 30 degrees

/**
 * Create a BufferGeometry for a primitive
 */
function createPrimitiveGeometry(primitive: Primitive): BufferGeometry {
  switch (primitive.kind) {
    case 'box': {
      const p = primitive.params as any
      const width = p.width || 100
      const depth = p.depth || 50
      const height = p.height || 25
      return new BoxGeometry(width, depth, height)
    }
    
    case 'cylinder': {
      const p = primitive.params as any
      const radius = p.radius || 20
      const height = p.height || 50
      // Use 32 segments for smooth cylinders
      return new CylinderGeometry(radius, radius, height, 32)
    }
    
    case 'sphere': {
      const p = primitive.params as any
      const radius = p.radius || 20
      return new SphereGeometry(radius, 32, 16)
    }
    
    case 'cone': {
      const p = primitive.params as any
      const radiusTop = p.radiusTop || 0
      const radiusBottom = p.radiusBottom || 20
      const height = p.height || 50
      return new CylinderGeometry(radiusTop, radiusBottom, height, 32)
    }
    
    case 'torus': {
      const p = primitive.params as any
      const majorRadius = p.majorRadius || 40
      const tubeRadius = p.tubeRadius || 8
      return new TorusGeometry(majorRadius, tubeRadius, 24, 48)
    }
    
    default:
      throw new Error(`Unsupported primitive kind: ${(primitive as any).kind}`)
  }
}

/**
 * Apply transform to geometry
 */
function applyPrimitiveTransform(
  geometry: BufferGeometry,
  primitive: Primitive
): BufferGeometry {
  const transform = primitive.transform
  if (!transform) return geometry
  
  const matrix = new Matrix4()
  
  // Apply translation
  if (transform.position) {
    matrix.makeTranslation(
      transform.position.x,
      transform.position.y,
      transform.position.z
    )
  }
  
  // Apply rotation (degrees to radians)
  if (transform.rotation) {
    const rotMatrix = new Matrix4()
    rotMatrix.makeRotationFromEuler(
      new Euler(
        transform.rotation.x * Math.PI / 180,
        transform.rotation.y * Math.PI / 180,
        transform.rotation.z * Math.PI / 180,
        'XYZ'
      )
    )
    matrix.multiply(rotMatrix)
  }
  
  // Apply scale
  if (transform.scale) {
    const scaleMatrix = new Matrix4()
    scaleMatrix.makeScale(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    )
    matrix.multiply(scaleMatrix)
  }
  
  // Handle legacy axis parameter for cylinders
  const axis = (primitive.params as any)?.axis
  if (axis && axis !== 'z' && !transform.rotation) {
    const axisMatrix = new Matrix4()
    if (axis === 'x') {
      axisMatrix.makeRotationZ(Math.PI / 2)
    } else if (axis === 'y') {
      axisMatrix.makeRotationX(Math.PI / 2)
    }
    matrix.multiply(axisMatrix)
  }
  
  geometry.applyMatrix4(matrix)
  return geometry
}

/**
 * Extract sharp edges from a mesh by analyzing face angles
 * 
 * @param geometry - The mesh geometry to extract edges from
 * @returns Array of edges representing sharp features
 */
export function extractSharpEdges(geometry: BufferGeometry): Edge[] {
  const edges: Edge[] = []
  
  // Ensure we have position and normal attributes
  const positions = geometry.attributes.position
  const normals = geometry.attributes.normal
  
  if (!positions || !normals) {
    console.warn('Geometry missing position or normal attributes')
    return edges
  }
  
  // Build edge-to-face mapping
  const edgeMap = new Map<string, { faces: Vector3[], vertices: [Vector3, Vector3] }>()
  
  const getEdgeKey = (i1: number, i2: number): string => {
    // Sort indices to make edge key order-independent
    return i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`
  }
  
  // Process faces (triangles)
  const faceCount = positions.count / 3
  for (let faceIdx = 0; faceIdx < faceCount; faceIdx++) {
    const i0 = faceIdx * 3
    const i1 = faceIdx * 3 + 1
    const i2 = faceIdx * 3 + 2
    
    // Get face vertices
    const v0 = new Vector3(
      positions.getX(i0),
      positions.getY(i0),
      positions.getZ(i0)
    )
    const v1 = new Vector3(
      positions.getX(i1),
      positions.getY(i1),
      positions.getZ(i1)
    )
    const v2 = new Vector3(
      positions.getX(i2),
      positions.getY(i2),
      positions.getZ(i2)
    )
    
    // Get face normal (use first vertex normal as representative)
    const faceNormal = new Vector3(
      normals.getX(i0),
      normals.getY(i0),
      normals.getZ(i0)
    ).normalize()
    
    // Process three edges of the triangle
    const edges: [number, number, Vector3, Vector3][] = [
      [i0, i1, v0, v1],
      [i1, i2, v1, v2],
      [i2, i0, v2, v0]
    ]
    
    edges.forEach(([idx1, idx2, vert1, vert2]) => {
      const key = getEdgeKey(idx1, idx2)
      
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          faces: [faceNormal],
          vertices: [vert1, vert2]
        })
      } else {
        edgeMap.get(key)!.faces.push(faceNormal)
      }
    })
  }
  
  // Extract sharp edges based on face angle
  edgeMap.forEach((value) => {
    const { faces, vertices } = value
    
    // Boundary edges (only one face) are always sharp
    if (faces.length === 1) {
      edges.push({
        start: vertices[0].clone(),
        end: vertices[1].clone()
      })
      return
    }
    
    // Interior edges: check angle between faces
    if (faces.length === 2) {
      const angle = Math.acos(Math.max(-1, Math.min(1, faces[0].dot(faces[1]))))
      
      // If angle exceeds threshold, it's a sharp edge
      if (angle > EDGE_ANGLE_THRESHOLD) {
        edges.push({
          start: vertices[0].clone(),
          end: vertices[1].clone()
        })
      }
    }
  })
  
  return edges
}

/**
 * Extract silhouette edges - edges where one adjacent face is front-facing
 * and the other is back-facing relative to the view direction
 * 
 * @param geometry - The mesh geometry
 * @param viewDirection - Normalized view direction vector
 * @returns Array of silhouette edges
 */
export function extractSilhouetteEdges(
  geometry: BufferGeometry,
  viewDirection: Vector3
): Edge[] {
  const edges: Edge[] = []
  
  const positions = geometry.attributes.position
  const normals = geometry.attributes.normal
  
  if (!positions || !normals) return edges
  
  // Build edge-to-face mapping (similar to sharp edge extraction)
  const edgeMap = new Map<string, { 
    normals: Vector3[], 
    vertices: [Vector3, Vector3] 
  }>()
  
  const getEdgeKey = (i1: number, i2: number): string => {
    return i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`
  }
  
  const faceCount = positions.count / 3
  for (let faceIdx = 0; faceIdx < faceCount; faceIdx++) {
    const i0 = faceIdx * 3
    const i1 = faceIdx * 3 + 1
    const i2 = faceIdx * 3 + 2
    
    const v0 = new Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0))
    const v1 = new Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1))
    const v2 = new Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2))
    
    const faceNormal = new Vector3(
      normals.getX(i0),
      normals.getY(i0),
      normals.getZ(i0)
    ).normalize()
    
    const edgeData: [number, number, Vector3, Vector3][] = [
      [i0, i1, v0, v1],
      [i1, i2, v1, v2],
      [i2, i0, v2, v0]
    ]
    
    edgeData.forEach(([idx1, idx2, vert1, vert2]) => {
      const key = getEdgeKey(idx1, idx2)
      
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          normals: [faceNormal],
          vertices: [vert1, vert2]
        })
      } else {
        edgeMap.get(key)!.normals.push(faceNormal)
      }
    })
  }
  
  // Find silhouette edges
  edgeMap.forEach((value) => {
    const { normals: faceNormals, vertices } = value
    
    // Only interior edges can be silhouettes
    if (faceNormals.length !== 2) return
    
    // Check if one face is front-facing and one is back-facing
    const dot1 = faceNormals[0].dot(viewDirection)
    const dot2 = faceNormals[1].dot(viewDirection)
    
    // Silhouette: signs differ (one positive, one negative)
    if ((dot1 > 0 && dot2 < 0) || (dot1 < 0 && dot2 > 0)) {
      edges.push({
        start: vertices[0].clone(),
        end: vertices[1].clone()
      })
    }
  })
  
  return edges
}

/**
 * Classify edge visibility using ray-casting
 * 
 * @param edges - Edges to classify
 * @param mesh - The complete CSG mesh to test against
 * @param viewOrigin - Camera/view origin position
 * @param epsilon - Small offset to avoid self-intersection
 * @returns Classified edges with visibility information
 */
export function classifyEdgeVisibility(
  edges: Edge[],
  mesh: Mesh,
  viewOrigin: Vector3,
  epsilon = 0.01
): ClassifiedEdge[] {
  const raycaster = new Raycaster()
  const classifiedEdges: ClassifiedEdge[] = []
  
  edges.forEach(edge => {
    // Test visibility at multiple points along the edge
    const testPoints = [
      edge.start,
      edge.end,
      edge.start.clone().lerp(edge.end, 0.5) // midpoint
    ]
    
    let visiblePoints = 0
    
    testPoints.forEach(point => {
      // Cast ray from view origin to point
      const direction = point.clone().sub(viewOrigin).normalize()
      const distance = point.distanceTo(viewOrigin)
      
      raycaster.set(viewOrigin, direction)
      raycaster.near = epsilon
      raycaster.far = distance - epsilon
      
      const intersects = raycaster.intersectObject(mesh, true)
      
      // Point is visible if no intersections or only intersects beyond the point
      if (intersects.length === 0 || intersects[0].distance > distance - epsilon) {
        visiblePoints++
      }
    })
    
    // Edge is visible if at least 2 out of 3 test points are visible
    const visible = visiblePoints >= 2
    
    classifiedEdges.push({
      start: edge.start,
      end: edge.end,
      visible,
      type: 'sharp' // Can be enhanced to distinguish sharp/silhouette
    })
  })
  
  return classifiedEdges
}

/**
 * Extract all edges from a PartRecipe (without CSG resolution)
 * This is a simplified version for parts without complex CSG operations
 * 
 * @param recipe - The part recipe
 * @returns Array of edges
 */
export function extractRecipeEdges(recipe: PartRecipe): Edge[] {
  const allEdges: Edge[] = []
  
  // Extract edges from each primitive individually
  recipe.primitives.forEach(primitive => {
    const geometry = createPrimitiveGeometry(primitive)
    applyPrimitiveTransform(geometry, primitive)
    
    // Compute normals if not present
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals()
    }
    
    const edges = extractSharpEdges(geometry)
    allEdges.push(...edges)
  })
  
  return allEdges
}

/**
 * Extract edges from a CSG BufferGeometry (the final boolean result)
 * This provides accurate edges after all boolean operations are applied
 * 
 * @param geometry - The CSG result geometry
 * @returns Array of edges
 */
export function extractGeometryEdges(geometry: BufferGeometry): Edge[] {
  // Compute normals if not present
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals()
  }
  
  return extractSharpEdges(geometry)
}
