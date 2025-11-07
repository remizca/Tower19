/**
 * Reusable feature generation helpers
 * Provides common CAD features (chamfers, fillets) for use across all difficulty levels
 */

import type { Primitive, Operation } from '../types/part'

/**
 * Generate chamfered edge features (approximated by rotated box subtraction)
 * @param edges - Array of edge positions (normalized -1/1 coordinates)
 * @param chamferSize - Size of chamfer cut in mm
 * @param blockDims - Block dimensions {width, depth, height} in mm
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to subtract from
 * @returns Object containing primitives and operations to add
 */
export function generateChamferFeatures(
  edges: Array<{ x: number; y: number }>,
  chamferSize: number,
  blockDims: { width: number; depth: number; height: number },
  startPrimId: number,
  startOpId: number,
  targetId: string
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  
  for (const edge of edges) {
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: { width: chamferSize, depth: chamferSize, height: blockDims.height * 0.6 },
      transform: {
        position: {
          x: edge.x * (blockDims.width / 2 - chamferSize / 2),
          y: edge.y * (blockDims.depth / 2 - chamferSize / 2),
          z: blockDims.height / 2 - chamferSize / 4
        },
        rotation: { x: 0, y: 0, z: 45 }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Generate filleted edge features (approximated by cylinder subtraction)
 * @param edges - Array of edge positions (normalized -1/1 coordinates)
 * @param filletRadius - Radius of fillet in mm
 * @param blockDims - Block dimensions {width, depth, height} in mm
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to subtract from
 * @returns Object containing primitives and operations to add
 */
export function generateFilletFeatures(
  edges: Array<{ x: number; y: number }>,
  filletRadius: number,
  blockDims: { width: number; depth: number; height: number },
  startPrimId: number,
  startOpId: number,
  targetId: string
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  
  for (const edge of edges) {
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: filletRadius, height: blockDims.height * 1.4, axis: 'z' },
      transform: {
        position: {
          x: edge.x * (blockDims.width / 2 - filletRadius),
          y: edge.y * (blockDims.depth / 2 - filletRadius),
          z: 0
        }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Generate a linear pattern of features along an axis
 * @param featureKind - Type of primitive to pattern
 * @param featureParams - Parameters for the primitive
 * @param count - Number of features in pattern
 * @param axis - Axis along which to pattern ('x' | 'y' | 'z')
 * @param spacing - Distance between features in mm
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to subtract from
 * @param variation - Optional perpendicular variation as fraction of spacing
 * @returns Object containing primitives and operations to add
 */
export function generateLinearPattern(
  featureKind: 'cylinder' | 'box' | 'sphere',
  featureParams: any,
  count: number,
  axis: 'x' | 'y' | 'z',
  spacing: number,
  startPrimId: number,
  startOpId: number,
  targetId: string,
  variation?: number
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  const v = variation || 0
  
  for (let i = 0; i < count; i++) {
    const offset = -(count - 1) * spacing / 2 + i * spacing
    const perpVar = v * spacing * (Math.random() - 0.5)
    
    let position: { x: number; y: number; z: number }
    if (axis === 'x') {
      position = { x: offset, y: perpVar, z: 0 }
    } else if (axis === 'y') {
      position = { x: perpVar, y: offset, z: 0 }
    } else {
      position = { x: perpVar, y: 0, z: offset }
    }
    
    primitives.push({
      id: `p${primId}`,
      kind: featureKind,
      params: featureParams,
      transform: { position }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Generate a circular pattern of features around an axis
 * @param featureKind - Type of primitive to pattern
 * @param featureParams - Parameters for the primitive
 * @param count - Number of features in pattern
 * @param radius - Radius of circular pattern in mm
 * @param axis - Axis around which to pattern ('x' | 'y' | 'z')
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to subtract from
 * @param angleOffset - Optional starting angle offset in degrees
 * @returns Object containing primitives and operations to add
 */
export function generateCircularPattern(
  featureKind: 'cylinder' | 'box' | 'sphere',
  featureParams: any,
  count: number,
  radius: number,
  axis: 'x' | 'y' | 'z',
  startPrimId: number,
  startOpId: number,
  targetId: string,
  angleOffset?: number
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  const angleStep = 360 / count
  const startAngle = angleOffset || 0
  
  for (let i = 0; i < count; i++) {
    const angle = startAngle + angleStep * i
    const angleRad = (angle * Math.PI) / 180
    
    let position: { x: number; y: number; z: number }
    if (axis === 'z') {
      position = {
        x: Math.round(radius * Math.cos(angleRad)),
        y: Math.round(radius * Math.sin(angleRad)),
        z: 0
      }
    } else if (axis === 'y') {
      position = {
        x: Math.round(radius * Math.cos(angleRad)),
        y: 0,
        z: Math.round(radius * Math.sin(angleRad))
      }
    } else {
      position = {
        x: 0,
        y: Math.round(radius * Math.cos(angleRad)),
        z: Math.round(radius * Math.sin(angleRad))
      }
    }
    
    primitives.push({
      id: `p${primId}`,
      kind: featureKind,
      params: featureParams,
      transform: { position }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Standard edge configurations for chamfers and fillets
 */
export const EDGE_CONFIGS = {
  ALL_CORNERS: [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 }
  ],
  FRONT_CORNERS: [
    { x: -1, y: -1 },
    { x: 1, y: -1 }
  ],
  BACK_CORNERS: [
    { x: -1, y: 1 },
    { x: 1, y: 1 }
  ],
  LEFT_CORNERS: [
    { x: -1, y: -1 },
    { x: -1, y: 1 }
  ],
  RIGHT_CORNERS: [
    { x: 1, y: -1 },
    { x: 1, y: 1 }
  ]
}
