import { generateIntermediatePartRecipe } from '../src/generators/intermediate'

// Test that intermediate generator produces variety across strategies
const seeds = Array.from({ length: 60 }, () => Math.floor(Math.random() * 1_000_000))

const seen = new Set<string>()
for (const seed of seeds) {
  const recipe = generateIntermediatePartRecipe(seed)
  seen.add(recipe.name)
}

const expectedStrategies = [
  'Multi-Feature Block',
  'Patterned Bracket',
  'Complex Cylinder Assembly',
  'Symmetric Mounting Plate'
]

let missing: string[] = []
for (const name of expectedStrategies) {
  if (!seen.has(name)) missing.push(name)
}

if (missing.length) {
  console.error('Missing expected intermediate strategies after sampling:', missing)
  console.error('Seen strategies:', Array.from(seen).sort())
  process.exit(1)
} else {
  console.log('Intermediate variety test passed. All 4 strategies observed:', expectedStrategies)
  console.log('Total unique:', seen.size)
}
