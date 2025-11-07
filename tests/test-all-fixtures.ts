/**
 * Comprehensive edge extraction tests for all fixtures
 * Tests edge extraction with block-hole, L-bracket, T-bracket, and cylinder-cutout
 */

import { extractRecipeEdges } from '../src/drawing/edges'
import { createBlockHoleFixture } from './fixtures/block-hole'
import { createLBracketFixture } from './fixtures/l-bracket'
import { createTBracketFixture } from './fixtures/t-bracket'
import { createCylinderCutoutFixture } from './fixtures/cylinder-cutout'
import type { PartRecipe } from '../src/types/part'

interface TestResult {
  name: string
  primitiveCount: number
  operationCount: number
  edgeCount: number
  primitiveTypes: string[]
  passed: boolean
  notes: string
}

function testFixture(name: string, recipe: PartRecipe, expectedMinEdges: number, expectedMaxEdges: number): TestResult {
  console.log(`\n=== Testing ${name} ===`)
  
  try {
    // Extract edges
    const edges = extractRecipeEdges(recipe)
    
    // Gather stats
    const primitiveCount = recipe.primitives.length
    const operationCount = recipe.operations.length
    const edgeCount = edges.length
    const primitiveTypes = [...new Set(recipe.primitives.map(p => p.kind))]
    
    // Validate edge structure
    const allValid = edges.every(edge => 
      edge.start && edge.end && 
      typeof edge.start.x === 'number' &&
      typeof edge.end.x === 'number'
    )
    
    const inRange = edgeCount >= expectedMinEdges && edgeCount <= expectedMaxEdges
    const passed = allValid && inRange
    
    console.log(`- Primitives: ${primitiveCount} (${primitiveTypes.join(', ')})`)
    console.log(`- Operations: ${operationCount}`)
    console.log(`- Edges extracted: ${edgeCount}`)
    console.log(`- Expected range: ${expectedMinEdges}-${expectedMaxEdges}`)
    console.log(`- Edge structure valid: ${allValid ? '✅' : '❌'}`)
    console.log(`- Edge count in range: ${inRange ? '✅' : '❌'}`)
    console.log(`- Status: ${passed ? '✅ PASS' : '❌ FAIL'}`)
    
    const notes = passed ? 'All checks passed' : 
                  !allValid ? 'Invalid edge structure' :
                  `Edge count ${edgeCount} outside expected range ${expectedMinEdges}-${expectedMaxEdges}`
    
    return {
      name,
      primitiveCount,
      operationCount,
      edgeCount,
      primitiveTypes,
      passed,
      notes
    }
  } catch (error) {
    console.error(`❌ ERROR: ${error}`)
    return {
      name,
      primitiveCount: recipe.primitives.length,
      operationCount: recipe.operations.length,
      edgeCount: 0,
      primitiveTypes: [],
      passed: false,
      notes: `Exception: ${error}`
    }
  }
}

// Run tests
console.log('=== Edge Extraction Fixture Tests ===\n')

const results: TestResult[] = []

// Test 1: Block with hole (simple case)
// 1 box (24 edges) + 1 cylinder (32 segments × 6 edges per segment ≈ 192) = ~216 edges
results.push(testFixture(
  'Block-Hole',
  createBlockHoleFixture(),
  200,  // min edges
  250   // max edges
))

// Test 2: L-bracket (two boxes with union + mounting holes)
// Multiple boxes + cylinders = ~400-500 edges
results.push(testFixture(
  'L-Bracket',
  createLBracketFixture(),
  400,  // min edges
  500   // max edges
))

// Test 3: T-bracket (three boxes with union + mounting holes)
// More boxes + cylinders = ~600-700 edges
results.push(testFixture(
  'T-Bracket',
  createTBracketFixture(),
  600,  // min edges
  700   // max edges
))

// Test 4: Cylinder with cutouts (box with torus cutout)
// Box (24) + Torus (24×48 segments = 1152 segments × 2 edges ≈ 2304 edges) = ~1200-1300
results.push(testFixture(
  'Cylinder-Cutout',
  createCylinderCutoutFixture(),
  1200, // min edges
  1300  // max edges
))

// Summary
console.log('\n=== Test Summary ===')
console.log(`Total fixtures tested: ${results.length}`)
console.log(`Passed: ${results.filter(r => r.passed).length}`)
console.log(`Failed: ${results.filter(r => !r.passed).length}`)

results.forEach(result => {
  const status = result.passed ? '✅' : '❌'
  console.log(`${status} ${result.name}: ${result.edgeCount} edges (${result.primitiveTypes.join(', ')})`)
})

if (results.every(r => r.passed)) {
  console.log('\n🎉 All fixture tests passed!')
} else {
  console.log('\n⚠️  Some tests failed')
  results.filter(r => !r.passed).forEach(result => {
    console.log(`  - ${result.name}: ${result.notes}`)
  })
}

// Edge count validation summary
console.log('\n=== Edge Count Details ===')
results.forEach(result => {
  console.log(`${result.name}:`)
  console.log(`  - ${result.primitiveCount} primitives (${result.primitiveTypes.join(', ')})`)
  console.log(`  - ${result.operationCount} operations`)
  console.log(`  - ${result.edgeCount} edges extracted`)
})
