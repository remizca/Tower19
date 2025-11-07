/**
 * Test fixture: L-Bracket shape
 * Used for testing 2D drawing engine with union operations
 */
import { generateBeginnerPartRecipe } from '../../src/generators/beginner'
import type { PartRecipe } from '../../src/types/part'

// Seed known to generate an L-bracket
export const L_BRACKET_SEED = 22222

export function createLBracketFixture(): PartRecipe {
  return generateBeginnerPartRecipe(L_BRACKET_SEED)
}

// Expected verification counts for L-bracket
export const EXPECTED_COUNTS = {
  visibleEdges: {
    front: 10, // L-shape outline + holes
    top: 8,    // Top view of L
    right: 10  // Side profile
  },
  hiddenEdges: {
    front: 2,  // Back edges of holes
    top: 0,    // No hidden in top
    right: 2   // Back edges
  }
}

export default createLBracketFixture
