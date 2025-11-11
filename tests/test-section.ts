/**
 * Test section view generation with block-hole fixture
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBlockHoleFixture } from './fixtures/block-hole'
import { createSectionView, selectCuttingPlane } from '../src/drawing/sections'
import { renderSectionView } from '../src/drawing/sectionsSVG'

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function run() {
  console.log('Testing section view generation...\n')
  
  // Create test fixture
  const recipe = createBlockHoleFixture()
  console.log(`Using block-hole fixture: ${recipe.bounding_mm.x}×${recipe.bounding_mm.y}×${recipe.bounding_mm.z}mm`)
  
  // Select cutting plane
  const plane = selectCuttingPlane(recipe)
  console.log(`\nSelected cutting plane:`)
  console.log(`  Type: ${plane.type}`)
  console.log(`  ID: ${plane.id}`)
  console.log(`  Normal: (${plane.normal.x}, ${plane.normal.y}, ${plane.normal.z})`)
  console.log(`  Parent view: ${plane.parentView}`)
  
  // Create section view
  const sectionView = createSectionView(recipe, plane, { x: 150, y: 150 }, 1.0)
  console.log(`\nGenerated section view:`)
  console.log(`  Contours: ${sectionView.contours.length}`)
  
  for (let i = 0; i < sectionView.contours.length; i++) {
    const contour = sectionView.contours[i]
    console.log(`    Contour ${i + 1}: ${contour.isOuter ? 'outer' : 'inner'}, ${contour.points.length} points`)
  }
  
  // Render to SVG
  const sectionSVG = renderSectionView(sectionView)
  
  // Create complete SVG document
  const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <title>Section View Test</title>
  <desc>Test of section view generation with hatch patterns</desc>
  
  <!-- Background -->
  <rect width="400" height="400" fill="white"/>
  
  <!-- Grid for reference -->
  <defs>
    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#eee" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="400" height="400" fill="url(#grid)"/>
  
  <!-- Section view -->
${sectionSVG}
  
  <!-- Reference axes at origin -->
  <line x1="140" y1="150" x2="160" y2="150" stroke="red" stroke-width="0.5"/>
  <line x1="150" y1="140" x2="150" y2="160" stroke="green" stroke-width="0.5"/>
</svg>`
  
  // Write SVG file
  const outputDir = join(__dirname, 'output')
  await mkdir(outputDir, { recursive: true })
  
  const outputPath = join(outputDir, 'section-test.svg')
  await writeFile(outputPath, svgDoc)
  
  console.log(`\n✓ Section view test passed!`)
  console.log(`✓ SVG output written to: ${outputPath}`)
  console.log(`\nYou can open the SVG file to visually inspect:`)
  console.log(`  - Section contours (thick outline)`)
  console.log(`  - Hatch pattern (45° lines at 3mm spacing)`)
  console.log(`  - Section label`)
}

run().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
