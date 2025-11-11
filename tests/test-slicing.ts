/**
 * Test CSG geometry slicing algorithm
 * 
 * Validates:
 * - Plane-triangle intersection
 * - Segment extraction from BufferGeometry
 * - Loop stitching
 * - Contour classification
 */

import { BoxGeometry, CylinderGeometry } from 'three'
import { sliceGeometryCSG, DEFAULT_SLICING_OPTIONS } from '../src/drawing/slicing'
import type { CuttingPlane } from '../src/drawing/sections'

console.log('Testing CSG geometry slicing...\n')

// Test 1: Simple box sliced through center
console.log('Test 1: Box (100×50×25mm) sliced at X=0')
console.log('='  .repeat(50))

const boxGeometry = new BoxGeometry(100, 50, 25)
const boxPlane: CuttingPlane = {
  id: 'A',
  type: 'full',
  position: { x: 0, y: 0, z: 0 },
  normal: { x: 1, y: 0, z: 0 }, // YZ plane
  viewDirection: { x: 1, y: 0, z: 0 },
  label: 'SECTION A-A',
  parentView: 'top'
}

const boxContours = sliceGeometryCSG(
  boxGeometry,
  boxPlane,
  { ...DEFAULT_SLICING_OPTIONS, debug: true }
)

console.log(`\nResult: ${boxContours.length} contour(s)`)
for (let i = 0; i < boxContours.length; i++) {
  const contour = boxContours[i]
  console.log(`  Contour ${i + 1}: ${contour.isOuter ? 'outer' : 'inner'}, ` +
    `${contour.points.length} vertices, winding: ${contour.winding}`)
  
  if (contour.points.length <= 6) {
    console.log('    Points:', contour.points.map(p => 
      `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`
    ).join(', '))
  }
}

console.log('\n' + '='.repeat(50))

// Test 2: Cylinder (vertical) sliced horizontally
console.log('\nTest 2: Cylinder (Ø40×60mm, vertical) sliced at Z=0')
console.log('='  .repeat(50))

const cylinderGeometry = new CylinderGeometry(20, 20, 60, 32)
const cylinderPlane: CuttingPlane = {
  id: 'B',
  type: 'full',
  position: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 1, z: 0 }, // XZ plane (cylinder Y-axis is vertical in Three.js)
  viewDirection: { x: 0, y: 1, z: 0 },
  label: 'SECTION B-B',
  parentView: 'front'
}

const cylinderContours = sliceGeometryCSG(
  cylinderGeometry,
  cylinderPlane,
  { ...DEFAULT_SLICING_OPTIONS, debug: true }
)

console.log(`\nResult: ${cylinderContours.length} contour(s)`)
for (let i = 0; i < cylinderContours.length; i++) {
  const contour = cylinderContours[i]
  console.log(`  Contour ${i + 1}: ${contour.isOuter ? 'outer' : 'inner'}, ` +
    `${contour.points.length} vertices, winding: ${contour.winding}`)
  
  // For cylinder, expect ~32 vertices forming circle
  if (contour.points.length > 0) {
    // Compute bounding box
    const xs = contour.points.map(p => p.x)
    const ys = contour.points.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    console.log(`    Bounds: X[${minX.toFixed(1)}, ${maxX.toFixed(1)}], ` +
      `Y[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`)
    
    // Check if circular (should be ~40mm diameter)
    const width = maxX - minX
    const height = maxY - minY
    console.log(`    Size: ${width.toFixed(1)}×${height.toFixed(1)}mm ` +
      `(expect ~40×40mm circle)`)
  }
}

console.log('\n' + '='.repeat(50))

// Test 3: Box with hole (simulated via CSG - we'll create geometry manually)
console.log('\nTest 3: Validation summary')
console.log('='  .repeat(50))

let passedTests = 0
let totalTests = 0

// Validate Test 1: Box should produce 1 rectangular outer contour
totalTests++
// Note: Triangulated box geometry may have 8 vertices (2 triangles per face)
// instead of ideal 4 corners - this is expected
if (boxContours.length === 1 && boxContours[0].isOuter && 
    boxContours[0].points.length >= 4 && boxContours[0].points.length <= 8) {
  console.log('✓ Test 1 passed: Box produces 1 rectangular contour (4-8 vertices from triangulation)')
  passedTests++
} else {
  console.log(`✗ Test 1 failed: Expected 1 outer contour with 4-8 vertices, ` +
    `got ${boxContours.length} contours with ${boxContours[0]?.points.length || 0} vertices, ` +
    `isOuter=${boxContours[0]?.isOuter}`)
}

// Validate Test 2: Cylinder should produce 1 circular contour (~32-64 vertices)
// Note: Triangulated geometry may have 2× vertices (one per triangle edge)
totalTests++
if (cylinderContours.length === 1 && cylinderContours[0].isOuter && 
    cylinderContours[0].points.length >= 30 && cylinderContours[0].points.length <= 70) {
  console.log('✓ Test 2 passed: Cylinder produces 1 circular contour (30-70 vertices from triangulation)')
  passedTests++
} else {
  console.log(`✗ Test 2 failed: Expected 1 outer contour with 30-70 vertices, ` +
    `got ${cylinderContours.length} contours with ${cylinderContours[0]?.points.length || 0} vertices`)
}

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Test summary: ${passedTests}/${totalTests} passed`)

if (passedTests === totalTests) {
  console.log('\n✓ All CSG slicing tests passed!')
  process.exit(0)
} else {
  console.log('\n✗ Some tests failed')
  process.exit(1)
}
