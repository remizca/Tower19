/**
 * Core data model for generated parts (TypeScript types)
 *
 * Contract (short):
 * - Parts are deterministic recipes identified by `id` and `seed`.
 * - Units are millimetres ("mm").
 * - The model contains primitives (boxes, cylinders, etc.) and
 *   operations (union/subtract/intersect) that reference primitives
 *   by id to form the final shape.
 * - Timestamps and metadata are included for provenance.
 */

export type Units = 'mm'

export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert'

export type Vec3 = { x: number; y: number; z: number }

// Transforms applied to primitives/operations (all units in mm)
export type Transform = {
  position?: Vec3
  rotation?: Vec3 // Euler angles in degrees
  scale?: Vec3
}

// Primitive parameter unions
export type BoxParams = { width: number; depth: number; height: number }
export type CylinderParams = { radius: number; height: number; axis?: 'x' | 'y' | 'z' }
export type SphereParams = { radius: number }
export type PrimitiveParams = BoxParams | CylinderParams | SphereParams | Record<string, unknown>

export type PrimitiveKind = 'box' | 'cylinder' | 'sphere' | 'custom'

export type Primitive = {
  id: string
  kind: PrimitiveKind
  params: PrimitiveParams
  transform?: Transform
  metadata?: Record<string, unknown>
}

// Boolean operation between two objects
export type BooleanOp = 'union' | 'subtract' | 'intersect'

export type Operation = {
  id: string
  op: BooleanOp
  // target is the id of the object being modified (primitive or op)
  targetId: string
  // tool is the id of the object used as the cutter/joiner (primitive or op)
  toolId: string
  transform?: Transform
  metadata?: Record<string, unknown>
}

export type PartRecipe = {
  id: string
  seed: number
  name: string
  difficulty: Difficulty
  units: Units
  // A nominal bounding box in mm for quick previews and layout
  bounding_mm: Vec3
  // primitives used to construct the part
  primitives: Primitive[]
  // operations (ordered) applied to primitives or previous operations
  operations: Operation[]
  createdAt: string // ISO timestamp
  updatedAt?: string // ISO timestamp
  metadata?: Record<string, unknown>
}

// A simple helper (runtime) sanity-check function. Lightweight - does not
// replace a full JSON Schema validator but helps catch obvious issues.
export function isMinimalPartRecipe(obj: any): obj is PartRecipe {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.id !== 'string') return false
  if (typeof obj.seed !== 'number') return false
  if (typeof obj.name !== 'string') return false
  if (!obj.bounding_mm || typeof obj.bounding_mm.x !== 'number') return false
  if (!Array.isArray(obj.primitives)) return false
  if (!Array.isArray(obj.operations)) return false
  if (typeof obj.createdAt !== 'string') return false
  return true
}

export default PartRecipe
