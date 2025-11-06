/**
 * Test the SVG drawing engine with the Block+Hole fixture
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBlockHoleFixture, EXPECTED_COUNTS } from './fixtures/block-hole'
import { generateDrawing } from '../src/drawing/svg'

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runTest() {
  // Create the test fixture
  const recipe = createBlockHoleFixture()

  // Generate SVG drawing
  const svg = generateDrawing(recipe)

  // Write SVG to file for inspection
  const outDir = join(__dirname, 'output')
  try {
    await writeFile(join(outDir, 'block-hole.svg'), svg)
  } catch (e) {
    console.error('Failed to write SVG output:', e)
    process.exit(1)
  }

// Basic verification - check each view individually
const viewRegex = (name: string) => new RegExp(`class="view ${name}"[^>]*>([\\s\\S]*?)</g>`)

for (const view of ['front', 'top', 'right'] as const) {
  const match = svg.match(viewRegex(view))?.[1]
  const visibleCount = (match?.match(/class="visible"/g) || []).length

  // Get expected counts for this view
  const expected = EXPECTED_COUNTS.visibleEdges[view]

  if (visibleCount !== expected) {
    throw new Error(`Edge count mismatch for ${view} view. Expected ${expected} visible edges, got ${visibleCount}`)
  }
}  console.log('SVG generation test passed! Output written to tests/output/block-hole.svg')
}

runTest().catch(e => {
  console.error(e)
  process.exit(1)
})