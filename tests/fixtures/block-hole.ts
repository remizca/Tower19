/**
 * Test fixture defining a simple block with a centered hole
 * Used for verifying 2D drawing engine output
 */
import { generateBeginnerPartRecipe } from '../../src/generators/beginner'
import type { PartRecipe } from '../../src/types/part'

// Use a fixed seed for deterministic test geometry
export const TEST_SEED = 12345

// Block dimensions: 100x50x25mm with centered 10mm radius hole
export function createBlockHoleFixture(): PartRecipe {
  const recipe = generateBeginnerPartRecipe(TEST_SEED)
  
  // Override with exact test dimensions
  recipe.bounding_mm = { x: 100, y: 50, z: 25 }
  recipe.primitives = [
    {
      id: 'p0',
      kind: 'box',
      params: {
        width: 100,
        depth: 50,
        height: 25,
      },
      transform: { 
        position: { x: 0, y: 0, z: 0 } 
      }
    },
    {
      id: 'p1',
      kind: 'cylinder',
      params: {
        radius: 10,
        height: 200, // Ensure through-hole by using 2x max dimension
        axis: 'z',
      },
      transform: {
        position: { x: 0, y: 0, z: 0 }
      }
    }
  ]

  recipe.operations = [
    {
      id: 'op1',
      op: 'subtract',
      targetId: 'p0',
      toolId: 'p1',
    }
  ]

  return recipe
}

// Expected verification counts for testing
export const EXPECTED_COUNTS = {
  visibleEdges: {
    front: 6, // 4 block edges + 2 hole edges (half square)
    top: 8,   // 4 block edges + 4 hole edges (square)
    right: 6  // 4 block edges + 2 hole edges (half square)
  },
  hiddenEdges: {
    front: 2, // Back half of hole
    top: 0,   // No hidden edges in top view
    right: 2  // Back half of hole 
  }
}

export default createBlockHoleFixture