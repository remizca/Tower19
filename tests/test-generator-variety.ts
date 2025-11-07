/**
 * Test that the beginner generator produces varied shapes
 */
import { generateBeginnerPartRecipe } from '../src/generators/beginner'

function testGeneratorVariety() {
  console.log('Testing Generator Variety\n' + '='.repeat(50))
  
  const seeds = [12345, 67890, 11111, 22222, 33333, 44444, 55555, 66666]
  const recipes = seeds.map(seed => generateBeginnerPartRecipe(seed))
  
  // Count how many different names we get (should have variety)
  const nameSet = new Set(recipes.map(r => r.name))
  
  console.log(`\nGenerated ${recipes.length} parts`)
  console.log(`Unique part types: ${nameSet.size}`)
  console.log(`Part types seen: ${Array.from(nameSet).join(', ')}`)
  
  // Show details for each
  recipes.forEach((recipe, i) => {
    console.log(`\n${i + 1}. ${recipe.name} (seed: ${seeds[i]})`)
    console.log(`   Primitives: ${recipe.primitives.length}`)
    console.log(`   Operations: ${recipe.operations.length}`)
    console.log(`   Bounding: ${recipe.bounding_mm.x}x${recipe.bounding_mm.y}x${recipe.bounding_mm.z}mm`)
    console.log(`   Types: ${recipe.primitives.map(p => p.kind).join(', ')}`)
  })
  
  // Verify variety
  if (nameSet.size < 3) {
    throw new Error(`Not enough variety! Only ${nameSet.size} unique part types`)
  }
  
  console.log('\n✅ Generator variety test passed!')
}

try {
  testGeneratorVariety()
} catch (e) {
  console.error(e)
  process.exit(1)
}
