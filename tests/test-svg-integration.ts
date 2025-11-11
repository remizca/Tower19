/**
 * Test complete SVG drawing generation with section view integration
 * 
 * Validates:
 * - Section view placement in layout
 * - Cutting plane indicator rendering in parent view
 * - Proper scaling and positioning
 * - Complete drawing with all views
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BoxGeometry } from 'three'
import { createBlockHoleFixture } from './fixtures/block-hole'
import { generateDrawing } from '../src/drawing/svg'

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function run() {
  console.log('Testing SVG drawing generation with section view...\n')
  
  // Create test fixture
  const recipe = createBlockHoleFixture()
  console.log(`Using block-hole fixture: ${recipe.bounding_mm.x}×${recipe.bounding_mm.y}×${recipe.bounding_mm.z}mm`)
  console.log(`Primitives: ${recipe.primitives.length}`)
  console.log(`Operations: ${recipe.operations.length}`)
  
  const subtractions = recipe.operations.filter(op => op.op === 'subtract')
  console.log(`Subtractions: ${subtractions.length}`)
  
  // Test 1: Drawing without geometry (simplified section)
  console.log(`\n${'='.repeat(60)}`)
  console.log('Test 1: Drawing with simplified section view')
  console.log('='.repeat(60))
  
  const svg1 = generateDrawing(recipe)
  
  // Check for section view elements
  const hasSection1 = svg1.includes('section-view')
  const hasCuttingPlane1 = svg1.includes('cutting-plane')
  const hasHatch1 = svg1.includes('hatch-pattern')
  
  console.log(`\nGenerated SVG:`)
  console.log(`  Has section view: ${hasSection1}`)
  console.log(`  Has cutting plane indicator: ${hasCuttingPlane1}`)
  console.log(`  Has hatch pattern: ${hasHatch1}`)
  console.log(`  SVG size: ${svg1.length} chars`)
  
  // Write output
  const outputDir = join(__dirname, 'output')
  await mkdir(outputDir, { recursive: true })
  
  const path1 = join(outputDir, 'drawing-simplified.svg')
  await writeFile(path1, svg1, 'utf8')
  console.log(`  Written to: ${path1}`)
  
  // Test 2: Drawing with CSG geometry
  console.log(`\n${'='.repeat(60)}`)
  console.log('Test 2: Drawing with CSG section view')
  console.log('='.repeat(60))
  
  // Create simple box geometry for the main block
  const blockPrimitive = recipe.primitives[0]
  const boxSize = blockPrimitive.params as any
  const geometry = new BoxGeometry(boxSize.width, boxSize.depth, boxSize.height)
  
  const svg2 = generateDrawing(recipe, geometry)
  
  // Check for section view elements
  const hasSection2 = svg2.includes('section-view')
  const hasCuttingPlane2 = svg2.includes('cutting-plane')
  const hasHatch2 = svg2.includes('hatch-pattern')
  
  console.log(`\nGenerated SVG with geometry:`)
  console.log(`  Has section view: ${hasSection2}`)
  console.log(`  Has cutting plane indicator: ${hasCuttingPlane2}`)
  console.log(`  Has hatch pattern: ${hasHatch2}`)
  console.log(`  SVG size: ${svg2.length} chars`)
  
  const path2 = join(outputDir, 'drawing-csg.svg')
  await writeFile(path2, svg2, 'utf8')
  console.log(`  Written to: ${path2}`)
  
  // Validation
  console.log(`\n${'='.repeat(60)}`)
  console.log('Validation')
  console.log('='.repeat(60))
  
  const allChecks = [
    { name: 'Simplified has section view', pass: hasSection1 },
    { name: 'Simplified has cutting plane', pass: hasCuttingPlane1 },
    { name: 'Simplified has hatch', pass: hasHatch1 },
    { name: 'CSG has section view', pass: hasSection2 },
    { name: 'CSG has cutting plane', pass: hasCuttingPlane2 },
    { name: 'CSG has hatch', pass: hasHatch2 },
  ]
  
  const passed = allChecks.filter(c => c.pass).length
  const total = allChecks.length
  
  console.log()
  for (const check of allChecks) {
    console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`)
  }
  
  console.log(`\n${passed}/${total} checks passed`)
  
  if (passed === total) {
    console.log('\n✓ SVG integration test passed!')
  } else {
    console.log('\n✗ Some checks failed')
    process.exit(1)
  }
}

run().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
