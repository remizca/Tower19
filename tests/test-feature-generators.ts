import { generateBeginnerPartRecipe } from '../src/generators/beginner'

// Simple smoke test ensuring new feature strategies (chamfers & fillets) appear across seeds
const seeds = Array.from({ length: 80 }, () => Math.floor(Math.random() * 1_000_000))

const seen = new Set<string>()
for (const seed of seeds) {
  const recipe = generateBeginnerPartRecipe(seed)
  seen.add(recipe.name)
}

const required = ['Block with Chamfered Edges', 'Block with Edge Fillets']
let missing: string[] = []
for (const name of required) {
  if (!seen.has(name)) missing.push(name)
}

if (missing.length) {
  console.error('Missing expected feature strategies after sampling:', missing)
  console.error('Seen strategies:', Array.from(seen).sort())
  process.exit(1)
} else {
  console.log('Feature generator test passed. Strategies observed:', required)
}
