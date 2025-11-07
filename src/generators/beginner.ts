/**
 * Beginner-level procedural generator
 * Creates simple parts with 2-4 primitives using basic boolean operations
 * Target: Easy CAD practice with recognizable features
 */

import type { PartRecipe, Primitive, Operation } from '../types/part'

// Simple LCG random number generator
function rand(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Helper to pick from array
function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)]
}

// Part generation strategies for variety
type PartStrategy = 
  | 'block-with-holes'
  | 'l-bracket'
  | 't-bracket'
  | 'cylinder-with-cutouts'
  | 'stacked-blocks'
  | 'corner-bracket'
  | 'block-with-spherical-pockets'
  | 'block-with-countersinks'
  | 'block-with-torus-cutout'
  | 'block-with-angled-holes'
  | 'block-with-linear-hole-pattern'
  | 'cylinder-with-circular-hole-pattern'
  | 'block-with-chamfered-edges'
  | 'block-with-edge-fillets'
  | 'block-with-support-ribs'
  | 'bracket-with-web-reinforcement'

const STRATEGIES: PartStrategy[] = [
  'block-with-holes',
  'l-bracket',
  't-bracket',
  'cylinder-with-cutouts',
  'stacked-blocks',
  'corner-bracket',
  'block-with-spherical-pockets',
  'block-with-countersinks',
  'block-with-torus-cutout',
  'block-with-angled-holes',
  'block-with-linear-hole-pattern',
  'cylinder-with-circular-hole-pattern',
  'block-with-chamfered-edges',
  'block-with-edge-fillets',
  'block-with-support-ribs',
  'bracket-with-web-reinforcement'
]

/**
 * Generate a beginner-level part recipe
 */
export function generateBeginnerPartRecipe(seed = Date.now()): PartRecipe {
  const r = rand(seed)
  const strategy = pick(STRATEGIES, r)
  
  let recipe: PartRecipe
  
  switch (strategy) {
    case 'block-with-holes':
      recipe = generateBlockWithHoles(seed, r)
      break
    case 'l-bracket':
      recipe = generateLBracket(seed, r)
      break
    case 't-bracket':
      recipe = generateTBracket(seed, r)
      break
    case 'cylinder-with-cutouts':
      recipe = generateCylinderWithCutouts(seed, r)
      break
    case 'stacked-blocks':
      recipe = generateStackedBlocks(seed, r)
      break
    case 'corner-bracket':
      recipe = generateCornerBracket(seed, r)
      break
    case 'block-with-spherical-pockets':
      recipe = generateBlockWithSphericalPockets(seed, r)
      break
    case 'block-with-countersinks':
      recipe = generateBlockWithCountersinks(seed, r)
      break
    case 'block-with-torus-cutout':
      recipe = generateBlockWithTorusCutout(seed, r)
      break
    case 'block-with-angled-holes':
      recipe = generateBlockWithAngledHoles(seed, r)
      break
    case 'block-with-linear-hole-pattern':
      recipe = generateBlockWithLinearHolePattern(seed, r)
      break
    case 'cylinder-with-circular-hole-pattern':
      recipe = generateCylinderWithCircularHolePattern(seed, r)
      break
    case 'block-with-chamfered-edges':
      recipe = generateBlockWithChamferedEdges(seed, r)
      break
    case 'block-with-edge-fillets':
      recipe = generateBlockWithEdgeFillets(seed, r)
      break
    case 'block-with-support-ribs':
      recipe = generateBlockWithSupportRibs(seed, r)
      break
    case 'bracket-with-web-reinforcement':
      recipe = generateBracketWithWebReinforcement(seed, r)
      break
    default:
      recipe = generateBlockWithHoles(seed, r)
  }
  
  return recipe
}
/**
 * Strategy 1: Block with cylindrical holes (original)
 */
function generateBlockWithHoles(seed: number, r: () => number): PartRecipe {
  const width = Math.round(50 + r() * 100)
  const depth = Math.round(40 + r() * 80)
  const height = Math.round(20 + r() * 60)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  const holeCount = 1 + Math.floor(r() * 3) // 1-3 holes
  
  for (let i = 0; i < holeCount; i++) {
    const radius = Math.round(5 + r() * Math.min(width, depth) * 0.15)
    const axis = pick(['x', 'y', 'z'] as const, r)
    const holeLength = axis === 'x' ? width : axis === 'y' ? depth : height
    
    primitives.push({
      id: `p${i + 1}`,
      kind: 'cylinder',
      params: { radius, height: holeLength * 2.5, axis },
      transform: {
        position: {
          x: Math.round((r() - 0.5) * width * 0.6),
          y: Math.round((r() - 0.5) * depth * 0.6),
          z: Math.round((r() - 0.5) * height * 0.6)
        }
      }
    })
    
    operations.push({
      id: `op${i + 1}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 1}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Block with Holes',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 2: L-shaped bracket
 */
function generateLBracket(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(60 + r() * 80)
  const baseDepth = Math.round(40 + r() * 60)
  const baseHeight = Math.round(15 + r() * 25)
  
  const vertWidth = baseWidth
  const vertDepth = baseHeight
  const vertHeight = Math.round(50 + r() * 80)
  
  const primitives: Primitive[] = [
    {
      id: 'p0',
      kind: 'box',
      params: { width: baseWidth, depth: baseDepth, height: baseHeight },
      transform: { position: { x: 0, y: baseDepth / 2, z: 0 } }
    },
    {
      id: 'p1',
      kind: 'box',
      params: { width: vertWidth, depth: vertDepth, height: vertHeight },
      transform: { position: { x: 0, y: 0, z: vertHeight / 2 + baseHeight / 2 } }
    }
  ]
  
  const operations: Operation[] = [{
    id: 'op1',
    op: 'union',
    targetId: 'p0',
    toolId: 'p1'
  }]
  
  // Add a hole or two
  const holeCount = 1 + Math.floor(r() * 2)
  for (let i = 0; i < holeCount; i++) {
    const radius = Math.round(4 + r() * 8)
    primitives.push({
      id: `p${i + 2}`,
      kind: 'cylinder',
      params: { radius, height: baseDepth * 3, axis: 'y' },
      transform: {
        position: {
          x: Math.round((r() - 0.5) * baseWidth * 0.5),
          y: 0,
          z: i === 0 ? baseHeight / 2 : vertHeight / 2 + baseHeight
        }
      }
    })
    
    operations.push({
      id: `op${i + 2}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 2}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'L-Bracket',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: vertHeight + baseHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 3: T-shaped bracket
 */
function generateTBracket(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(80 + r() * 100)
  const baseDepth = Math.round(30 + r() * 40)
  const baseHeight = Math.round(15 + r() * 25)
  
  const vertWidth = Math.round(30 + r() * 40)
  const vertDepth = baseDepth
  const vertHeight = Math.round(50 + r() * 80)
  
  const primitives: Primitive[] = [
    {
      id: 'p0',
      kind: 'box',
      params: { width: baseWidth, depth: baseDepth, height: baseHeight },
      transform: { position: { x: 0, y: 0, z: 0 } }
    },
    {
      id: 'p1',
      kind: 'box',
      params: { width: vertWidth, depth: vertDepth, height: vertHeight },
      transform: { position: { x: 0, y: 0, z: vertHeight / 2 + baseHeight / 2 } }
    }
  ]
  
  const operations: Operation[] = [{
    id: 'op1',
    op: 'union',
    targetId: 'p0',
    toolId: 'p1'
  }]
  
  // Add mounting holes
  const holeRadius = Math.round(4 + r() * 6)
  const holeSpacing = baseWidth * 0.35
  
  for (let i = 0; i < 2; i++) {
    primitives.push({
      id: `p${i + 2}`,
      kind: 'cylinder',
      params: { radius: holeRadius, height: baseHeight * 3, axis: 'z' },
      transform: {
        position: {
          x: (i === 0 ? -1 : 1) * holeSpacing,
          y: 0,
          z: 0
        }
      }
    })
    
    operations.push({
      id: `op${i + 2}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 2}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'T-Bracket',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: vertHeight + baseHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 4: Cylinder with cutouts
 */
function generateCylinderWithCutouts(seed: number, r: () => number): PartRecipe {
  const radius = Math.round(30 + r() * 40)
  const height = Math.round(40 + r() * 80)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'cylinder',
    params: { radius, height, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  
  // Add a through-hole
  const innerRadius = Math.round(radius * (0.3 + r() * 0.3))
  primitives.push({
    id: 'p1',
    kind: 'cylinder',
    params: { radius: innerRadius, height: height * 2.5, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  })
  
  operations.push({
    id: 'op1',
    op: 'subtract',
    targetId: 'p0',
    toolId: 'p1'
  })
  
  // Add box cutouts
  const cutoutCount = 1 + Math.floor(r() * 2)
  for (let i = 0; i < cutoutCount; i++) {
    const cutWidth = Math.round(radius * 0.4)
    const cutDepth = Math.round(radius * 2.5)
    const cutHeight = Math.round(height * 0.4)
    
    primitives.push({
      id: `p${i + 2}`,
      kind: 'box',
      params: { width: cutWidth, depth: cutDepth, height: cutHeight },
      transform: {
        position: {
          x: 0,
          y: 0,
          z: Math.round((r() - 0.5) * height * 0.4)
        }
      }
    })
    
    operations.push({
      id: `op${i + 2}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 2}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Cylinder with Cutouts',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: radius * 2, y: radius * 2, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 5: Stacked blocks (union)
 */
function generateStackedBlocks(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(60 + r() * 80)
  const baseDepth = Math.round(50 + r() * 70)
  const baseHeight = Math.round(20 + r() * 40)
  
  const topWidth = Math.round(baseWidth * (0.5 + r() * 0.4))
  const topDepth = Math.round(baseDepth * (0.5 + r() * 0.4))
  const topHeight = Math.round(20 + r() * 40)
  
  const primitives: Primitive[] = [
    {
      id: 'p0',
      kind: 'box',
      params: { width: baseWidth, depth: baseDepth, height: baseHeight },
      transform: { position: { x: 0, y: 0, z: 0 } }
    },
    {
      id: 'p1',
      kind: 'box',
      params: { width: topWidth, depth: topDepth, height: topHeight },
      transform: {
        position: {
          x: Math.round((r() - 0.5) * (baseWidth - topWidth) * 0.5),
          y: Math.round((r() - 0.5) * (baseDepth - topDepth) * 0.5),
          z: (baseHeight + topHeight) / 2
        }
      }
    }
  ]
  
  const operations: Operation[] = [{
    id: 'op1',
    op: 'union',
    targetId: 'p0',
    toolId: 'p1'
  }]
  
  // Add a hole through both
  const holeRadius = Math.round(5 + r() * 10)
  primitives.push({
    id: 'p2',
    kind: 'cylinder',
    params: { radius: holeRadius, height: (baseHeight + topHeight) * 2, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  })
  
  operations.push({
    id: 'op2',
    op: 'subtract',
    targetId: 'p0',
    toolId: 'p2'
  })
  
  return {
    id: String(seed),
    seed,
    name: 'Stacked Blocks',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: baseHeight + topHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 6: Corner bracket (3D L-shape)
 */
function generateCornerBracket(seed: number, r: () => number): PartRecipe {
  const size = Math.round(50 + r() * 60)
  const thickness = Math.round(15 + r() * 20)
  
  const primitives: Primitive[] = [
    // Base leg
    {
      id: 'p0',
      kind: 'box',
      params: { width: size, depth: thickness, height: thickness },
      transform: { position: { x: size / 2, y: 0, z: 0 } }
    },
    // Vertical leg
    {
      id: 'p1',
      kind: 'box',
      params: { width: thickness, depth: thickness, height: size },
      transform: { position: { x: 0, y: 0, z: size / 2 } }
    },
    // Side leg
    {
      id: 'p2',
      kind: 'box',
      params: { width: thickness, depth: size, height: thickness },
      transform: { position: { x: 0, y: size / 2, z: 0 } }
    }
  ]
  
  const operations: Operation[] = [
    { id: 'op1', op: 'union', targetId: 'p0', toolId: 'p1' },
    { id: 'op2', op: 'union', targetId: 'p0', toolId: 'p2' }
  ]
  
  // Add mounting holes
  const holeRadius = Math.round(3 + r() * 5)
  const holeOffset = size * 0.7
  
  for (let i = 0; i < 3; i++) {
    const axis = pick(['x', 'y', 'z'] as const, r)
    primitives.push({
      id: `p${i + 3}`,
      kind: 'cylinder',
      params: { radius: holeRadius, height: size * 2, axis },
      transform: {
        position: {
          x: i === 0 ? holeOffset : 0,
          y: i === 1 ? holeOffset : 0,
          z: i === 2 ? holeOffset : 0
        }
      }
    })
    
    operations.push({
      id: `op${i + 3}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 3}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Corner Bracket',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: size, y: size, z: size },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 7: Block with spherical pockets (sphere subtraction)
 */
function generateBlockWithSphericalPockets(seed: number, r: () => number): PartRecipe {
  const width = Math.round(60 + r() * 100)
  const depth = Math.round(40 + r() * 80)
  const height = Math.round(25 + r() * 40)

  const primitives: Primitive[] = [
    {
      id: 'p0',
      kind: 'box',
      params: { width, depth, height },
      transform: { position: { x: 0, y: 0, z: 0 } }
    }
  ]

  const operations: Operation[] = []
  const pocketCount = 1 + Math.floor(r() * 3)
  for (let i = 0; i < pocketCount; i++) {
    const radius = Math.round(6 + r() * Math.min(width, depth) * 0.15)
    const px = Math.round((r() - 0.5) * width * 0.6)
    const py = Math.round((r() - 0.5) * depth * 0.6)
    // Place sphere so that only the top half cuts into the block
    const pz = Math.round(height * 0.25 + r() * height * 0.2)
    const pid = `p${i + 1}`
    primitives.push({
      id: pid,
      kind: 'sphere',
      params: { radius },
      transform: { position: { x: px, y: py, z: pz } }
    })
    operations.push({ id: `op${i + 1}`, op: 'subtract', targetId: 'p0', toolId: pid })
  }

  return {
    id: String(seed),
    seed,
    name: 'Block with Spherical Pockets',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 8: Block with countersinks (cylinder + cone/frustum subtraction)
 */
function generateBlockWithCountersinks(seed: number, r: () => number): PartRecipe {
  const width = Math.round(70 + r() * 100)
  const depth = Math.round(40 + r() * 60)
  const height = Math.round(20 + r() * 35)

  const primitives: Primitive[] = [
    { id: 'p0', kind: 'box', params: { width, depth, height }, transform: { position: { x: 0, y: 0, z: 0 } } }
  ]
  const operations: Operation[] = []

  const holePairs = 2 + Math.floor(r() * 2) // 2-3 countersunk holes
  for (let i = 0; i < holePairs; i++) {
    const baseR = Math.round(3 + r() * 5)
    const csR = Math.round(baseR * (1.8 + r() * 1.2))
    const csDepth = Math.round(4 + r() * 6)
    const x = Math.round((i - (holePairs - 1) / 2) * (width * 0.3))
    const y = Math.round((r() - 0.5) * depth * 0.5)

    // Through hole (cylinder)
    primitives.push({
      id: `p${primitives.length}`,
      kind: 'cylinder',
      params: { radius: baseR, height: height * 3, axis: 'z' },
      transform: { position: { x, y, z: 0 } }
    })
    operations.push({ id: `op${operations.length}`, op: 'subtract', targetId: 'p0', toolId: `p${primitives.length - 1}` })

    // Countersink (cone/frustum), placed at top surface
    primitives.push({
      id: `p${primitives.length}`,
      kind: 'cone',
      params: { radiusTop: baseR, radiusBottom: csR, height: csDepth, axis: 'z' },
      transform: { position: { x, y, z: height / 2 - csDepth / 2 } }
    })
    operations.push({ id: `op${operations.length}`, op: 'subtract', targetId: 'p0', toolId: `p${primitives.length - 1}` })
  }

  return {
    id: String(seed),
    seed,
    name: 'Block with Countersinks',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 9: Block with torus cutout (donut groove)
 */
function generateBlockWithTorusCutout(seed: number, r: () => number): PartRecipe {
  const width = Math.round(80 + r() * 120)
  const depth = Math.round(50 + r() * 90)
  const height = Math.round(25 + r() * 45)

  const primitives: Primitive[] = [
    { id: 'p0', kind: 'box', params: { width, depth, height }, transform: { position: { x: 0, y: 0, z: 0 } } }
  ]
  const operations: Operation[] = []

  const majorRadius = Math.round(Math.min(width, depth) * (0.25 + r() * 0.15))
  const tubeRadius = Math.round(4 + r() * Math.min(width, depth) * 0.07)

  primitives.push({
    id: 'p1',
    kind: 'torus',
    params: { majorRadius, tubeRadius, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  })
  operations.push({ id: 'op1', op: 'subtract', targetId: 'p0', toolId: 'p1' })

  return {
    id: String(seed),
    seed,
    name: 'Block with Torus Cutout',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 10: Block with angled holes (demonstrates rotation transforms)
 */
function generateBlockWithAngledHoles(seed: number, r: () => number): PartRecipe {
  const width = Math.round(60 + r() * 80)
  const depth = Math.round(50 + r() * 70)
  const height = Math.round(30 + r() * 50)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  const holeCount = 2 + Math.floor(r() * 2) // 2-3 angled holes
  
  for (let i = 0; i < holeCount; i++) {
    const radius = Math.round(4 + r() * 8)
    const holeLength = Math.max(width, depth, height) * 2
    
    // Create holes at various angles (15-45 degrees)
    const angleX = (15 + r() * 30) * (r() > 0.5 ? 1 : -1)
    const angleY = (15 + r() * 30) * (r() > 0.5 ? 1 : -1)
    
    primitives.push({
      id: `p${i + 1}`,
      kind: 'cylinder',
      params: { radius, height: holeLength, axis: 'z' },
      transform: {
        position: {
          x: Math.round((r() - 0.5) * width * 0.5),
          y: Math.round((r() - 0.5) * depth * 0.5),
          z: 0
        },
        rotation: {
          x: angleX,
          y: angleY,
          z: 0
        }
      }
    })
    
    operations.push({
      id: `op${i + 1}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 1}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Block with Angled Holes',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 11: Block with linear hole pattern (demonstrates position transforms)
 */
function generateBlockWithLinearHolePattern(seed: number, r: () => number): PartRecipe {
  const width = Math.round(80 + r() * 100)
  const depth = Math.round(40 + r() * 60)
  const height = Math.round(20 + r() * 40)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  
  // Linear pattern: 3-5 holes along X axis
  const holeCount = 3 + Math.floor(r() * 3)
  const radius = Math.round(4 + r() * 6)
  const spacing = width / (holeCount + 1)
  
  for (let i = 0; i < holeCount; i++) {
    const xPos = -width / 2 + spacing * (i + 1)
    const yOffset = Math.round((r() - 0.5) * depth * 0.3) // slight Y variation
    
    primitives.push({
      id: `p${i + 1}`,
      kind: 'cylinder',
      params: { radius, height: height * 3, axis: 'z' },
      transform: {
        position: {
          x: xPos,
          y: yOffset,
          z: 0
        }
      }
    })
    
    operations.push({
      id: `op${i + 1}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 1}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Block with Linear Hole Pattern',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 12: Cylinder with circular hole pattern
 */
function generateCylinderWithCircularHolePattern(seed: number, r: () => number): PartRecipe {
  const radius = Math.round(30 + r() * 30)
  const height = Math.round(30 + r() * 50)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'cylinder',
    params: { radius, height, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  
  // Circular pattern: 4-8 holes around the cylinder
  const holeCount = 4 + Math.floor(r() * 5)
  const holeRadius = Math.round(3 + r() * 5)
  const patternRadius = radius * 0.65 // holes positioned at 65% of cylinder radius
  const angleStep = 360 / holeCount
  
  for (let i = 0; i < holeCount; i++) {
    const angle = angleStep * i
    const angleRad = (angle * Math.PI) / 180
    
    // Calculate position on circle
    const xPos = patternRadius * Math.cos(angleRad)
    const yPos = patternRadius * Math.sin(angleRad)
    
    primitives.push({
      id: `p${i + 1}`,
      kind: 'cylinder',
      params: { radius: holeRadius, height: height * 2, axis: 'z' },
      transform: {
        position: {
          x: Math.round(xPos),
          y: Math.round(yPos),
          z: 0
        }
      }
    })
    
    operations.push({
      id: `op${i + 1}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${i + 1}`
    })
  }
  
  return {
    id: String(seed),
    seed,
    name: 'Cylinder with Circular Hole Pattern',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: radius * 2, y: radius * 2, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 13: Block with chamfered edges (approximated by subtracting rotated boxes)
 * We emulate chamfers on selected top vertical edges by subtracting small boxes rotated 45°.
 */
function generateBlockWithChamferedEdges(seed: number, r: () => number): PartRecipe {
  const width = Math.round(60 + r() * 90)
  const depth = Math.round(50 + r() * 80)
  const height = Math.round(25 + r() * 50)

  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]

  const operations: Operation[] = []
  let primId = 1
  let opId = 1

  // Decide how many edges to chamfer (2-4 among the four top vertical edges)
  const edges = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 }
  ]
  const chamferCount = 2 + Math.floor(r() * 3) // 2-4
  const selected = [...edges].sort(() => r() - 0.5).slice(0, chamferCount)
  const chamferSize = Math.round(Math.min(width, depth, height) * 0.18)

  for (const edge of selected) {
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: { width: chamferSize, depth: chamferSize, height: height * 0.6 },
      transform: {
        position: {
          x: edge.x * (width / 2 - chamferSize / 2),
          y: edge.y * (depth / 2 - chamferSize / 2),
          z: height / 2 - chamferSize / 4
        },
        rotation: { x: 0, y: 0, z: 45 }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${primId}`
    })
    primId++
    opId++
  }

  return {
    id: String(seed),
    seed,
    name: 'Block with Chamfered Edges',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 14: Block with edge fillets (approximated by subtracting cylinders)
 * We approximate external vertical edge fillets by subtracting quarter-cylinder like cuts
 * using cylinders rotated to bite into the edges.
 */
function generateBlockWithEdgeFillets(seed: number, r: () => number): PartRecipe {
  const width = Math.round(70 + r() * 100)
  const depth = Math.round(55 + r() * 90)
  const height = Math.round(25 + r() * 55)

  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]

  const operations: Operation[] = []
  let primId = 1
  let opId = 1

  // Choose 2-4 edges to fillet
  const edges = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 }
  ]
  const filletCount = 2 + Math.floor(r() * 3)
  const selected = [...edges].sort(() => r() - 0.5).slice(0, filletCount)
  const filletRadius = Math.round(Math.min(width, depth) * 0.12)

  for (const edge of selected) {
    // Cylinder oriented along Z, positioned so only a quarter removes material
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: filletRadius, height: height * 1.4, axis: 'z' },
      transform: {
        position: {
          x: edge.x * (width / 2 - filletRadius),
          y: edge.y * (depth / 2 - filletRadius),
          z: 0
        }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${primId}`
    })
    primId++
    opId++
  }

  return {
    id: String(seed),
    seed,
    name: 'Block with Edge Fillets',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 15: Block with support ribs (demonstrates rib reinforcement)
 * Creates a flat base with parallel ribs for structural support
 */
function generateBlockWithSupportRibs(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(80 + r() * 100)
  const baseDepth = Math.round(60 + r() * 80)
  const baseHeight = Math.round(12 + r() * 18)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width: baseWidth, depth: baseDepth, height: baseHeight },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  let primId = 1
  let opId = 1
  
  // Add parallel ribs (2-4 ribs)
  const ribCount = 2 + Math.floor(r() * 3)
  const ribThickness = Math.round(baseHeight * 0.4)
  const ribHeight = Math.round(baseHeight * (1.2 + r() * 0.8))
  const ribLength = baseDepth * 0.8
  const spacing = baseWidth / (ribCount + 1)
  const orientation = r() > 0.5 ? 'y' : 'x'
  
  for (let i = 0; i < ribCount; i++) {
    const offset = -baseWidth / 2 + spacing * (i + 1)
    
    let position: { x: number; y: number; z: number }
    let params: { width: number; depth: number; height: number }
    
    if (orientation === 'x') {
      position = {
        x: 0,
        y: offset,
        z: baseHeight / 2 + ribHeight / 2
      }
      params = {
        width: ribLength,
        depth: ribThickness,
        height: ribHeight
      }
    } else {
      position = {
        x: offset,
        y: 0,
        z: baseHeight / 2 + ribHeight / 2
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
      targetId: 'p0',
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  // Add mounting holes in base
  const holeCount = 2 + Math.floor(r() * 2)
  const holeRadius = Math.round(4 + r() * 5)
  
  for (let i = 0; i < holeCount; i++) {
    const xPos = Math.round((r() - 0.5) * baseWidth * 0.7)
    const yPos = Math.round((r() - 0.5) * baseDepth * 0.7)
    
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: holeRadius, height: baseHeight * 3, axis: 'z' },
      transform: {
        position: { x: xPos, y: yPos, z: 0 }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'subtract',
      targetId: 'p0',
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  const maxZ = baseHeight / 2 + ribHeight
  
  return {
    id: String(seed),
    seed,
    name: 'Block with Support Ribs',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: maxZ * 2 },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 16: Bracket with web reinforcement (demonstrates diagonal web supports)
 * Creates an L-bracket with diagonal web connecting the two legs
 */
function generateBracketWithWebReinforcement(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(60 + r() * 80)
  const baseDepth = Math.round(50 + r() * 70)
  const baseHeight = Math.round(15 + r() * 20)
  
  const vertWidth = baseWidth
  const vertDepth = baseHeight
  const vertHeight = Math.round(50 + r() * 70)
  
  const primitives: Primitive[] = [
    {
      id: 'p0',
      kind: 'box',
      params: { width: baseWidth, depth: baseDepth, height: baseHeight },
      transform: { position: { x: 0, y: baseDepth / 2, z: 0 } }
    },
    {
      id: 'p1',
      kind: 'box',
      params: { width: vertWidth, depth: vertDepth, height: vertHeight },
      transform: { position: { x: 0, y: 0, z: vertHeight / 2 + baseHeight / 2 } }
    }
  ]
  
  const operations: Operation[] = [{
    id: 'op1',
    op: 'union',
    targetId: 'p0',
    toolId: 'p1'
  }]
  
  let primId = 2
  let opId = 2
  
  // Add diagonal web(s) connecting base and vertical
  const webCount = 1 + Math.floor(r() * 2) // 1-2 webs
  const webThickness = Math.round(baseHeight * 0.6)
  const webWidth = Math.round(Math.min(baseWidth, vertHeight) * 0.4)
  
  // Calculate web dimensions and angle
  const webHeight = Math.sqrt(baseDepth * baseDepth + vertHeight * vertHeight) * 0.6
  const webAngle = Math.atan2(vertHeight, baseDepth) * (180 / Math.PI)
  
  for (let i = 0; i < webCount; i++) {
    const xOffset = (i - (webCount - 1) / 2) * (baseWidth * 0.4)
    
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: {
        width: webWidth,
        depth: webThickness,
        height: webHeight
      },
      transform: {
        position: {
          x: xOffset,
          y: baseDepth / 4,
          z: vertHeight / 3
        },
        rotation: { x: webAngle, y: 0, z: 0 }
      }
    })
    operations.push({
      id: `op${opId}`,
      op: 'union',
      targetId: 'p0',
      toolId: `p${primId}`
    })
    primId++
    opId++
  }
  
  // Add mounting holes
  const holeRadius = Math.round(4 + r() * 6)
  
  // Hole in base
  primitives.push({
    id: `p${primId}`,
    kind: 'cylinder',
    params: { radius: holeRadius, height: baseHeight * 3, axis: 'z' },
    transform: {
      position: {
        x: Math.round((r() - 0.5) * baseWidth * 0.5),
        y: baseDepth * 0.65,
        z: 0
      }
    }
  })
  operations.push({
    id: `op${opId}`,
    op: 'subtract',
    targetId: 'p0',
    toolId: `p${primId}`
  })
  primId++
  opId++
  
  // Hole in vertical
  primitives.push({
    id: `p${primId}`,
    kind: 'cylinder',
    params: { radius: holeRadius, height: vertDepth * 3, axis: 'y' },
    transform: {
      position: {
        x: Math.round((r() - 0.5) * vertWidth * 0.5),
        y: 0,
        z: vertHeight * 0.7 + baseHeight / 2
      }
    }
  })
  operations.push({
    id: `op${opId}`,
    op: 'subtract',
    targetId: 'p0',
    toolId: `p${primId}`
  })
  
  return {
    id: String(seed),
    seed,
    name: 'Bracket with Web Reinforcement',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: vertHeight + baseHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

// Legacy export for backward compatibility
export type BeginnerRecipe = {
  id: string
  seed: number
  difficulty: 'Beginner'
  name: string
  bounding_mm: { x: number; y: number; z: number }
  holes: Array<{ x: number; y: number; z: number; r: number; axis: 'x' | 'y' | 'z' }>
  createdAt: string
}

export function generateBeginner(seed = Date.now()): BeginnerRecipe {
  // For backward compatibility, generate a simple block with holes
  const r = rand(seed)
  const x = Math.round(50 + r() * 150)
  const y = Math.round(20 + r() * 120)
  const z = Math.round(10 + r() * 140)
  const holeCount = 1 + Math.floor(r() * 3)
  const holes = []
  
  for (let i = 0; i < holeCount; i++) {
    const hx = Math.round((r() - 0.5) * (x - 10))
    const hy = Math.round((r() - 0.5) * (y - 10))
    const hz = Math.round((r() - 0.5) * (z - 10))
    const rr = Math.round(3 + r() * Math.min(x, y) * 0.15)
    const axis = ['x', 'y', 'z'][Math.floor(r() * 3)] as 'x' | 'y' | 'z'
    holes.push({ x: hx, y: hy, z: hz, r: rr, axis })
  }

  return {
    id: `${seed}`,
    seed,
    difficulty: 'Beginner',
    name: 'Block - Basic',
    bounding_mm: { x, y, z },
    holes,
    createdAt: new Date().toISOString(),
  }
}
