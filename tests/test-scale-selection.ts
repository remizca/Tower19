/**
 * Tests for the automatic scale selection algorithm (Phase 3.3)
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBlockHoleFixture } from './fixtures/block-hole'
import { generateDrawing } from '../src/drawing/svg'

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Create a Block+Hole-like recipe with custom bounding box dimensions (mm)
 * Ensures the primitives match the requested bounding extents so the
 * scale selection logic sees the intended sizes.
 */
function createSizedBlockHole(x: number, y: number, z: number) {
  const recipe = cloneDeep(createBlockHoleFixture())

  // Update bounding box
  recipe.bounding_mm = { x, y, z }

  // Update base box primitive to match the new bounding
  const box = recipe.primitives.find(p => p.kind === 'box')
  if (box) {
    // width=x, depth=y, height=z
    // @ts-expect-error dynamic fixture editing
    box.params.width = x
    // @ts-expect-error dynamic fixture editing
    box.params.depth = y
    // @ts-expect-error dynamic fixture editing
    box.params.height = z
  }

  // Ensure cylinder remains a through-hole relative to new size
  const cyl = recipe.primitives.find(p => p.kind === 'cylinder')
  if (cyl) {
    const maxDim = Math.max(x, y, z)
    // @ts-expect-error dynamic fixture editing
    cyl.params.height = Math.max(2 * maxDim, 100)
  }

  return recipe
}

function extractScaleLabel(svg: string): string | null {
  const m = svg.match(/Scale:\s*([0-9]+:[0-9]+)/)
  return m ? m[1] : null
}

async function run() {
  // Case 1: Default block-hole fixture should fit at 1:1
  {
    const recipe = createBlockHoleFixture()
    const svg = generateDrawing(recipe)
    const scale = extractScaleLabel(svg)
    if (scale !== '1:1') {
      throw new Error(`Expected scale 1:1 for default fixture, got ${scale}`)
    }
    await writeFile(join(__dirname, 'output', 'scale-default.svg'), svg)
    console.log('✓ Default size → Scale 1:1')
  }

  // Case 2: Large part should downscale (expect 1:2)
  {
    const recipe = createSizedBlockHole(250, 200, 150)
    const svg = generateDrawing(recipe)
    const scale = extractScaleLabel(svg)
    if (scale !== '1:2') {
      throw new Error(`Expected scale 1:2 for large part, got ${scale}`)
    }
    await writeFile(join(__dirname, 'output', 'scale-large.svg'), svg)
    console.log('✓ Large part → Scale 1:2')
  }

  // Case 3: Tiny part should upscale (expect 5:1)
  {
    const recipe = createSizedBlockHole(20, 10, 10)
    const svg = generateDrawing(recipe)
    const scale = extractScaleLabel(svg)
    if (scale !== '5:1') {
      throw new Error(`Expected scale 5:1 for tiny part, got ${scale}`)
    }
    await writeFile(join(__dirname, 'output', 'scale-tiny.svg'), svg)
    console.log('✓ Tiny part → Scale 5:1')
  }

  console.log('Scale selection tests passed. SVGs written to tests/output/*.svg')
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
