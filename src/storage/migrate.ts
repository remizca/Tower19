import { PartRecipe } from '../types/part'

// Convert the legacy BeginnerRecipe shape into the PartRecipe shape.
// Legacy shape example: { id, seed, difficulty: 'Beginner', name, bounding_mm, holes: [{x,y,z,r,axis}], createdAt }
export function migrateLegacyBeginnerToPartRecipe(old: any): PartRecipe {
  const seed = typeof old.seed === 'number' ? old.seed : Date.now()
  const baseId = 'p0'
  const primitives: PartRecipe['primitives'] = []

  // Base box primitive
  primitives.push({
    id: baseId,
    kind: 'box',
    params: {
      width: old.bounding_mm.x,
      depth: old.bounding_mm.y,
      height: old.bounding_mm.z,
    },
    transform: { position: { x: 0, y: 0, z: 0 } },
  })

  const operations: PartRecipe['operations'] = []

  // Convert holes to cutter primitives + subtract ops
  if (Array.isArray(old.holes)) {
    old.holes.forEach((h: any, i: number) => {
      const pid = `p${i + 1}`
      primitives.push({
        id: pid,
        kind: 'cylinder',
        params: { radius: h.r, height: Math.max(old.bounding_mm.x, old.bounding_mm.y, old.bounding_mm.z) * 2, axis: h.axis },
        transform: { position: { x: h.x, y: h.y, z: h.z } },
      })

      operations.push({
        id: `op${i + 1}`,
        op: 'subtract',
        targetId: baseId,
        toolId: pid,
        transform: undefined,
      })
    })
  }

  const recipe: PartRecipe = {
    id: String(seed),
    seed,
    name: old.name || 'Block - Basic',
    difficulty: 'Beginner',
    units: 'mm',
    bounding_mm: old.bounding_mm || { x: 100, y: 50, z: 25 },
    primitives,
    operations,
    createdAt: old.createdAt || new Date().toISOString(),
    metadata: { migratedFromLegacy: true },
  }

  return recipe
}

export default migrateLegacyBeginnerToPartRecipe
