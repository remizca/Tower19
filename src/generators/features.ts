/**
 * Reusable feature generation helpers
 * Provides common CAD features (chamfers, fillets, ribs, webs, patterns) for use across all difficulty levels
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

/**
 * Generate rib features (thin vertical walls for structural reinforcement)
 * Ribs are typically perpendicular to a base surface, connecting two parallel surfaces
 * @param ribCount - Number of ribs to generate
 * @param ribThickness - Thickness of each rib in mm
 * @param ribHeight - Height of ribs in mm
 * @param ribLength - Length of ribs in mm
 * @param spacing - Distance between ribs in mm
 * @param orientation - 'x' (ribs along X axis) or 'y' (ribs along Y axis)
 * @param basePosition - Position of base plane { x, y, z } in mm
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to union with
 * @returns Object containing primitives and operations to add
 */
export function generateRibFeatures(
  ribCount: number,
  ribThickness: number,
  ribHeight: number,
  ribLength: number,
  spacing: number,
  orientation: 'x' | 'y',
  basePosition: { x: number; y: number; z: number },
  startPrimId: number,
  startOpId: number,
  targetId: string
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  
  for (let i = 0; i < ribCount; i++) {
    const offset = -(ribCount - 1) * spacing / 2 + i * spacing
    
    let position: { x: number; y: number; z: number }
    let params: { width: number; depth: number; height: number }
    
    if (orientation === 'x') {
      // Ribs perpendicular to X axis (thin in Y direction)
      position = {
        x: basePosition.x,
        y: basePosition.y + offset,
        z: basePosition.z + ribHeight / 2
      }
      params = {
        width: ribLength,
        depth: ribThickness,
        height: ribHeight
      }
    } else {
      // Ribs perpendicular to Y axis (thin in X direction)
      position = {
        x: basePosition.x + offset,
        y: basePosition.y,
        z: basePosition.z + ribHeight / 2
      }
      params = {
        width: ribThickness,
        depth: ribLength,
        height: ribHeight
      }
    }
    
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params,
      transform: { position }
    })
    operations.push({
      id: `op${opId}`,
      op: 'union',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Generate web features (thin plates connecting structural elements)
 * Webs are typically diagonal or vertical supports connecting two non-parallel surfaces
 * @param webCount - Number of webs to generate
 * @param webThickness - Thickness of each web in mm
 * @param webWidth - Width of web in mm
 * @param webHeight - Height of web in mm
 * @param positions - Array of web center positions { x, y, z } in mm
 * @param rotation - Rotation angles for webs (degrees)
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to union with
 * @returns Object containing primitives and operations to add
 */
export function generateWebFeatures(
  webCount: number,
  webThickness: number,
  webWidth: number,
  webHeight: number,
  positions: Array<{ x: number; y: number; z: number }>,
  rotation: { x: number; y: number; z: number },
  startPrimId: number,
  startOpId: number,
  targetId: string
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  
  for (let i = 0; i < Math.min(webCount, positions.length); i++) {
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: {
        width: webWidth,
        depth: webThickness,
        height: webHeight
      },
      transform: {
        position: positions[i],
        rotation
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'union',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}

/**
 * Generate radial rib features (ribs radiating from a center point)
 * Useful for circular bases, flanges, or cylindrical structures
 * @param ribCount - Number of radial ribs
 * @param ribThickness - Thickness of each rib in mm
 * @param ribHeight - Height of ribs in mm
 * @param ribLength - Radial length of ribs in mm
 * @param centerPosition - Center position { x, y, z } in mm
 * @param startPrimId - Starting primitive ID counter
 * @param startOpId - Starting operation ID counter
 * @param targetId - ID of the primitive to union with
 * @returns Object containing primitives and operations to add
 */
export function generateRadialRibFeatures(
  ribCount: number,
  ribThickness: number,
  ribHeight: number,
  ribLength: number,
  centerPosition: { x: number; y: number; z: number },
  startPrimId: number,
  startOpId: number,
  targetId: string
): { primitives: Primitive[]; operations: Operation[] } {
  const primitives: Primitive[] = []
  const operations: Operation[] = []
  
  let primId = startPrimId
  let opId = startOpId
  const angleStep = 360 / ribCount
  
  for (let i = 0; i < ribCount; i++) {
    const angle = angleStep * i
    const angleRad = (angle * Math.PI) / 180
    
    // Position rib at half its length from center
    const xOffset = Math.round((ribLength / 2) * Math.cos(angleRad))
    const yOffset = Math.round((ribLength / 2) * Math.sin(angleRad))
    
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: {
        width: ribLength,
        depth: ribThickness,
        height: ribHeight
      },
      transform: {
        position: {
          x: centerPosition.x + xOffset,
          y: centerPosition.y + yOffset,
          z: centerPosition.z + ribHeight / 2
        },
        rotation: { x: 0, y: 0, z: angle }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'union',
      targetId,
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  return { primitives, operations }
}
