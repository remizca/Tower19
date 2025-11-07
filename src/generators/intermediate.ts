/**
 * Intermediate-level procedural generator
 * Creates moderately complex parts with 5-8 primitives using multiple patterns and features
 * Target: Intermediate CAD practice with combined features and symmetry
 */

import type { PartRecipe, Primitive, Operation } from '../types/part'

// Simple LCG random number generator (shared with beginner)
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

// Part generation strategies for intermediate difficulty
type IntermediateStrategy = 
  | 'multi-feature-block'
  | 'patterned-bracket'
  | 'complex-cylinder-assembly'
  | 'symmetric-mounting-plate'

const STRATEGIES: IntermediateStrategy[] = [
  'multi-feature-block',
  'patterned-bracket',
  'complex-cylinder-assembly',
  'symmetric-mounting-plate'
]

/**
 * Generate an intermediate-level part recipe
 */
export function generateIntermediatePartRecipe(seed = Date.now()): PartRecipe {
  const r = rand(seed)
  const strategy = pick(STRATEGIES, r)
  
  let recipe: PartRecipe
  
  switch (strategy) {
    case 'multi-feature-block':
      recipe = generateMultiFeatureBlock(seed, r)
      break
    case 'patterned-bracket':
      recipe = generatePatternedBracket(seed, r)
      break
    case 'complex-cylinder-assembly':
      recipe = generateComplexCylinderAssembly(seed, r)
      break
    case 'symmetric-mounting-plate':
      recipe = generateSymmetricMountingPlate(seed, r)
      break
    default:
      recipe = generateMultiFeatureBlock(seed, r)
  }
  
  return recipe
}

/**
 * Strategy 1: Multi-feature block with combined patterns
 * Combines linear and circular patterns with pockets
 */
function generateMultiFeatureBlock(seed: number, r: () => number): PartRecipe {
  const width = Math.round(100 + r() * 120)
  const depth = Math.round(80 + r() * 100)
  const height = Math.round(40 + r() * 60)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  let primId = 1
  let opId = 1
  
  // Feature 1: Linear pattern of mounting holes along one edge
  const mountHoleCount = 3 + Math.floor(r() * 2) // 3-4 holes
  const mountRadius = Math.round(5 + r() * 4)
  const mountSpacing = width / (mountHoleCount + 1)
  
  for (let i = 0; i < mountHoleCount; i++) {
    const xPos = -width / 2 + mountSpacing * (i + 1)
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: mountRadius, height: height * 2, axis: 'z' },
      transform: {
        position: { x: xPos, y: -depth / 3, z: 0 }
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
  
  // Feature 2: Central pocket (sphere or cylinder)
  const pocketType = r() > 0.5 ? 'sphere' : 'cylinder'
  if (pocketType === 'sphere') {
    const pocketRadius = Math.round(width * 0.2)
    primitives.push({
      id: `p${primId}`,
      kind: 'sphere',
      params: { radius: pocketRadius },
      transform: {
        position: { x: 0, y: depth / 4, z: height / 4 }
      }
    })
  } else {
    const pocketRadius = Math.round(width * 0.15)
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: pocketRadius, height: height * 1.5, axis: 'z' },
      transform: {
        position: { x: 0, y: depth / 4, z: 0 }
      }
    })
  }
  operations.push({
    id: `op${opId}`,
    op: 'subtract',
    targetId: 'p0',
    toolId: `p${primId}`
  })
  primId++
  opId++
  
  // Feature 3: Corner chamfers (small box subtractions at 45°)
  const chamferSize = Math.round(height * 0.3)
  for (let corner = 0; corner < 2; corner++) {
    const xSign = corner === 0 ? -1 : 1
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: { width: chamferSize, depth: chamferSize, height: chamferSize },
      transform: {
        position: {
          x: xSign * (width / 2 - chamferSize / 2),
          y: depth / 2 - chamferSize / 2,
          z: height / 2 - chamferSize / 2
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
    name: 'Multi-Feature Block',
    difficulty: 'Intermediate',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 2: Patterned bracket with complex geometry
 */
function generatePatternedBracket(seed: number, r: () => number): PartRecipe {
  const baseWidth = Math.round(80 + r() * 100)
  const baseDepth = Math.round(60 + r() * 80)
  const baseHeight = Math.round(15 + r() * 25)
  
  const vertWidth = baseWidth
  const vertDepth = baseHeight
  const vertHeight = Math.round(60 + r() * 90)
  
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
  
  // Circular pattern of holes in vertical face
  const holeCount = 4 + Math.floor(r() * 3) // 4-6 holes
  const holeRadius = Math.round(4 + r() * 5)
  const patternRadius = vertWidth * 0.3
  const angleStep = 360 / holeCount
  
  for (let i = 0; i < holeCount; i++) {
    const angle = angleStep * i
    const angleRad = (angle * Math.PI) / 180
    const xPos = patternRadius * Math.cos(angleRad)
    const zPos = patternRadius * Math.sin(angleRad) + vertHeight / 2 + baseHeight / 2
    
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: holeRadius, height: vertDepth * 3, axis: 'y' },
      transform: {
        position: { x: Math.round(xPos), y: 0, z: Math.round(zPos) }
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
  
  // Linear pattern in base
  const baseMountCount = 2 + Math.floor(r() * 2)
  const baseMountRadius = Math.round(5 + r() * 4)
  const baseMountSpacing = baseWidth / (baseMountCount + 1)
  
  for (let i = 0; i < baseMountCount; i++) {
    const xPos = -baseWidth / 2 + baseMountSpacing * (i + 1)
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: baseMountRadius, height: baseHeight * 3, axis: 'z' },
      transform: {
        position: { x: xPos, y: baseDepth / 2, z: 0 }
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
    name: 'Patterned Bracket',
    difficulty: 'Intermediate',
    units: 'mm',
    bounding_mm: { x: baseWidth, y: baseDepth, z: vertHeight + baseHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 3: Complex cylinder assembly
 */
function generateComplexCylinderAssembly(seed: number, r: () => number): PartRecipe {
  const mainRadius = Math.round(40 + r() * 40)
  const mainHeight = Math.round(60 + r() * 80)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'cylinder',
    params: { radius: mainRadius, height: mainHeight, axis: 'z' },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  let primId = 1
  let opId = 1
  
  // Feature 1: Flanges (thin cylinders unioned at top and bottom)
  const flangeRadius = mainRadius * 1.4
  const flangeHeight = Math.round(mainHeight * 0.12)
  
  for (let pos = 0; pos < 2; pos++) {
    const zPos = pos === 0 ? -mainHeight / 2 : mainHeight / 2
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: flangeRadius, height: flangeHeight, axis: 'z' },
      transform: {
        position: { x: 0, y: 0, z: zPos }
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
  
  // Feature 2: Circular pattern of bolt holes in flanges
  const boltCount = 6 + Math.floor(r() * 3) // 6-8 bolts
  const boltRadius = Math.round(4 + r() * 4)
  const boltPatternRadius = (mainRadius + flangeRadius) / 2
  const angleStep = 360 / boltCount
  
  for (let i = 0; i < boltCount; i++) {
    const angle = angleStep * i
    const angleRad = (angle * Math.PI) / 180
    const xPos = boltPatternRadius * Math.cos(angleRad)
    const yPos = boltPatternRadius * Math.sin(angleRad)
    
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: boltRadius, height: mainHeight * 1.5, axis: 'z' },
      transform: {
        position: { x: Math.round(xPos), y: Math.round(yPos), z: 0 }
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
  
  // Feature 3: Central bore
  const boreRadius = mainRadius * 0.5
  primitives.push({
    id: `p${primId}`,
    kind: 'cylinder',
    params: { radius: boreRadius, height: mainHeight * 1.2, axis: 'z' },
    transform: {
      position: { x: 0, y: 0, z: 0 }
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
    name: 'Complex Cylinder Assembly',
    difficulty: 'Intermediate',
    units: 'mm',
    bounding_mm: { x: flangeRadius * 2, y: flangeRadius * 2, z: mainHeight },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}

/**
 * Strategy 4: Symmetric mounting plate with multiple feature types
 */
function generateSymmetricMountingPlate(seed: number, r: () => number): PartRecipe {
  const width = Math.round(120 + r() * 100)
  const depth = Math.round(100 + r() * 80)
  const height = Math.round(20 + r() * 30)
  
  const primitives: Primitive[] = [{
    id: 'p0',
    kind: 'box',
    params: { width, depth, height },
    transform: { position: { x: 0, y: 0, z: 0 } }
  }]
  
  const operations: Operation[] = []
  let primId = 1
  let opId = 1
  
  // Feature 1: Four corner mounting holes (symmetric)
  const cornerRadius = Math.round(5 + r() * 4)
  const cornerInset = Math.round(Math.min(width, depth) * 0.12)
  
  for (let xSign of [-1, 1]) {
    for (let ySign of [-1, 1]) {
      primitives.push({
        id: `p${primId}`,
        kind: 'cylinder',
        params: { radius: cornerRadius, height: height * 2.5, axis: 'z' },
        transform: {
          position: {
            x: xSign * (width / 2 - cornerInset),
            y: ySign * (depth / 2 - cornerInset),
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
  }
  
  // Feature 2: Central circular pattern
  const centerHoleCount = 6
  const centerHoleRadius = Math.round(3 + r() * 3)
  const centerPatternRadius = Math.min(width, depth) * 0.25
  const angleStep = 360 / centerHoleCount
  
  for (let i = 0; i < centerHoleCount; i++) {
    const angle = angleStep * i
    const angleRad = (angle * Math.PI) / 180
    const xPos = centerPatternRadius * Math.cos(angleRad)
    const yPos = centerPatternRadius * Math.sin(angleRad)
    
    primitives.push({
      id: `p${primId}`,
      kind: 'cylinder',
      params: { radius: centerHoleRadius, height: height * 2.5, axis: 'z' },
      transform: {
        position: { x: Math.round(xPos), y: Math.round(yPos), z: 0 }
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
  
  // Feature 3: Slot features on sides (symmetric)
  const slotWidth = Math.round(width * 0.08)
  const slotLength = Math.round(depth * 0.3)
  const slotDepth = height * 0.6
  
  for (let xSign of [-1, 1]) {
    primitives.push({
      id: `p${primId}`,
      kind: 'box',
      params: { width: slotWidth, depth: slotLength, height: slotDepth },
      transform: {
        position: {
          x: xSign * (width / 2 - slotWidth),
          y: 0,
          z: height / 4
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
    name: 'Symmetric Mounting Plate',
    difficulty: 'Intermediate',
    units: 'mm',
    bounding_mm: { x: width, y: depth, z: height },
    primitives,
    operations,
    createdAt: new Date().toISOString()
  }
}
