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
  'block-with-angled-holes'
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
