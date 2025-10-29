export type BeginnerRecipe = {
  id: string
  seed: number
  difficulty: 'Beginner'
  name: string
  bounding_mm: { x: number; y: number; z: number }
  holes: Array<{ x: number; y: number; z: number; r: number; axis: 'x' | 'y' | 'z' }>
  createdAt: string
}

function rand(seed: number) {
  // simple LCG
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateBeginner(seed = Date.now()): BeginnerRecipe {
  const r = rand(seed)
  const x = Math.round(50 + r() * 150) // mm
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

// New: produce the canonical PartRecipe shape (primitives + operations)
import type { PartRecipe } from '../types/part'
import { migrateLegacyBeginnerToPartRecipe } from '../storage/migrate'

export function generateBeginnerPartRecipe(seed = Date.now()): PartRecipe {
  // reuse existing generator to create legacy shape, then migrate
  const legacy = generateBeginner(seed)
  return migrateLegacyBeginnerToPartRecipe(legacy)
}
