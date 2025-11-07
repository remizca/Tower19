/**
 * Test fixture: Cylinder with cutouts
 * Used for testing 2D drawing engine with cylindrical primitives
 */
import { generateBeginnerPartRecipe } from '../../src/generators/beginner'
import type { PartRecipe } from '../../src/types/part'

// Seed known to generate a cylinder with cutouts
export const CYLINDER_CUTOUT_SEED = 67890

export function createCylinderCutoutFixture(): PartRecipe {
  return generateBeginnerPartRecipe(CYLINDER_CUTOUT_SEED)
}

// Expected verification counts for cylinder with cutouts
export const EXPECTED_COUNTS = {
  visibleEdges: {
    front: 12, // Cylinder outline + cutouts + inner hole
    top: 16,   // Circular views from top
    right: 12  // Side profile with cutouts
  },
  hiddenEdges: {
    front: 8,  // Back edges of cutouts and inner cylinder
    top: 0,    // No hidden in top view
    right: 8   // Back edges
  }
}

export default createCylinderCutoutFixture
