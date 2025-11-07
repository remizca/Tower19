/**
 * Test fixture: T-Bracket shape
 * Used for testing 2D drawing engine with T-shaped union operations
 */
import { generateBeginnerPartRecipe } from '../../src/generators/beginner'
import type { PartRecipe } from '../../src/types/part'

// Seed known to generate a T-bracket
export const T_BRACKET_SEED = 44444

export function createTBracketFixture(): PartRecipe {
  return generateBeginnerPartRecipe(T_BRACKET_SEED)
}

// Expected verification counts for T-bracket
export const EXPECTED_COUNTS = {
  visibleEdges: {
    front: 12, // T-shape outline + mounting holes
    top: 10,   // Top view of T
    right: 8   // Side profile
  },
  hiddenEdges: {
    front: 2,  // Back edges of holes
    top: 0,    // No hidden in top
    right: 0   // No hidden in right
  }
}

export default createTBracketFixture
