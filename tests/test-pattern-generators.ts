import { generateBeginnerPartRecipe } from '../src/generators/beginner'

console.log('Testing Pattern Generators\n' + '='.repeat(50))

// Generate 20 parts to see variety including pattern strategies
const parts = []
for (let i = 0; i < 20; i++) {
  const seed = 100000 + i * 1000
  const recipe = generateBeginnerPartRecipe(seed)
  parts.push({ seed, recipe })
  console.log(`${i + 1}. ${recipe.name} (seed: ${seed})`)
  console.log(`   Primitives: ${recipe.primitives.length}, Operations: ${recipe.operations.length}`)
}

// Count unique types
const nameSet = new Set(parts.map(p => p.recipe.name))
console.log(`\nUnique part types: ${nameSet.size}`)
console.log(`Part types: ${Array.from(nameSet).join(', ')}`)

// Check for pattern strategies
const hasLinear = parts.some(p => p.recipe.name.includes('Linear'))
const hasCircular = parts.some(p => p.recipe.name.includes('Circular'))
console.log(`\n✓ Linear pattern strategy seen: ${hasLinear}`)
console.log(`✓ Circular pattern strategy seen: ${hasCircular}`)
