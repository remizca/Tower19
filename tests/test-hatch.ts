/**
 * Test hatch pattern generation
 */
import { generateHatchLines, DEFAULT_HATCH_PATTERN } from '../src/drawing/sections'
import type { SectionContour } from '../src/drawing/sections'

// Simple rectangular contour for testing
const rectangularContour: SectionContour = {
  points: [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 30 },
    { x: 0, y: 30 }
  ],
  isOuter: true,
  winding: 'ccw'
}

// Test hatch generation
console.log('Testing hatch pattern generation...\n')

const hatchLines = generateHatchLines(rectangularContour, DEFAULT_HATCH_PATTERN)

console.log(`Generated ${hatchLines.length} hatch lines`)
console.log(`Pattern: ${DEFAULT_HATCH_PATTERN.angle}° angle, ${DEFAULT_HATCH_PATTERN.spacing}mm spacing\n`)

if (hatchLines.length > 0) {
  console.log('Sample hatch lines:')
  for (let i = 0; i < Math.min(5, hatchLines.length); i++) {
    const line = hatchLines[i]
    console.log(`  Line ${i + 1}: (${line.start.x.toFixed(2)}, ${line.start.y.toFixed(2)}) → (${line.end.x.toFixed(2)}, ${line.end.y.toFixed(2)})`)
  }
  
  if (hatchLines.length > 5) {
    console.log(`  ... and ${hatchLines.length - 5} more`)
  }
  
  console.log('\n✓ Hatch pattern generation test passed!')
} else {
  console.error('\n✗ No hatch lines generated!')
  process.exit(1)
}
