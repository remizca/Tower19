/**
 * Parity Test Suite - OpenCascade vs MeshCSG Backend
 * 
 * Validates that OpenCascadeBackend produces geometrically equivalent
 * results to the mesh-based CSG backend for all primitive types and operations.
 */

import { OpenCascadeBackend } from '../src/geometry/opencascadeBackend';
import { MeshCSGBackend } from '../src/geometry/meshBackend';
import { buildRecipeGeometry } from '../src/geometry/recipeBuilder';
import { generateBeginnerPartRecipe } from '../src/generators/beginner';
import { Vector3, Box3 } from 'three';

interface TestResult {
  testName: string;
  passed: boolean;
  ocVertices: number;
  placeholderVertices: number;
  ocTriangles: number;
  placeholderTriangles: number;
  volumeDiff?: number;
  boundingBoxDiff?: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Compare two geometries for parity
 */
function compareGeometries(ocGeo: any, phGeo: any): { volumeDiff: number; boundingBoxDiff: number } {
  // Get bounding boxes
  const ocBox = new Box3().setFromBufferAttribute(ocGeo.mesh.attributes.position);
  const phBox = new Box3().setFromBufferAttribute(phGeo.mesh.attributes.position);
  
  // Compare bounding box sizes
  const ocSize = new Vector3();
  const phSize = new Vector3();
  ocBox.getSize(ocSize);
  phBox.getSize(phSize);
  
  const boundingBoxDiff = ocSize.distanceTo(phSize);
  
  // Rough volume estimate (bounding box volume)
  const ocVolume = ocSize.x * ocSize.y * ocSize.z;
  const phVolume = phSize.x * phSize.y * phSize.z;
  const volumeDiff = Math.abs(ocVolume - phVolume) / Math.max(ocVolume, phVolume);
  
  return { volumeDiff, boundingBoxDiff };
}

/**
 * Run a single test case
 */
async function runTest(
  testName: string,
  seed: number,
  ocBackend: OpenCascadeBackend,
  phBackend: MeshCSGBackend
): Promise<TestResult> {
  try {
    console.log(`\n[Test] ${testName}...`);
    
    // Generate same recipe for both backends
    const recipe = generateBeginnerPartRecipe(seed);
    
    // Build with OpenCascade
    const ocStart = performance.now();
    const ocGeometry = await buildRecipeGeometry(recipe, ocBackend);
    const ocTime = performance.now() - ocStart;
    
    // Build with Placeholder
    const phStart = performance.now();
    const phGeometry = await buildRecipeGeometry(recipe, phBackend);
    const phTime = performance.now() - phStart;
    
    // Get metrics
    const ocVertices = ocGeometry.mesh.attributes.position.count;
    const ocTriangles = ocGeometry.mesh.index ? ocGeometry.mesh.index.count / 3 : 0;
    const placeholderVertices = phGeometry.mesh.attributes.position.count;
    const placeholderTriangles = phGeometry.mesh.index ? phGeometry.mesh.index.count / 3 : 0;
    
    console.log(`  OpenCascade: ${ocVertices} vertices, ${ocTriangles} triangles (${ocTime.toFixed(0)}ms)`);
    console.log(`  MeshCSG:     ${placeholderVertices} vertices, ${placeholderTriangles} triangles (${phTime.toFixed(0)}ms)`);
    
    // Compare geometries
    const { volumeDiff, boundingBoxDiff } = compareGeometries(ocGeometry, phGeometry);
    
    console.log(`  Volume diff: ${(volumeDiff * 100).toFixed(2)}%`);
    console.log(`  BBox diff: ${boundingBoxDiff.toFixed(2)}mm`);
    
    // Pass if volume difference is reasonable (< 5%) and we have geometry
    const passed = volumeDiff < 0.05 && ocVertices > 0 && placeholderVertices > 0;
    
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      testName,
      passed,
      ocVertices,
      placeholderVertices,
      ocTriangles,
      placeholderTriangles,
      volumeDiff,
      boundingBoxDiff
    };
  } catch (error: any) {
    console.log(`  Result: ❌ FAIL - ${error.message}`);
    return {
      testName,
      passed: false,
      ocVertices: 0,
      placeholderVertices: 0,
      ocTriangles: 0,
      placeholderTriangles: 0,
      error: error.message
    };
  }
}

/**
 * Main test suite
 */
async function runParityTests() {
  console.log('=== OpenCascade vs MeshCSG Parity Tests ===\n');
  
  // Initialize backends
  console.log('[Setup] Initializing backends...');
  const ocBackend = new OpenCascadeBackend();
  const phBackend = new MeshCSGBackend();
  
  await ocBackend.initialize();
  await phBackend.initialize();
  console.log('[Setup] Backends ready\n');
  
  // Test cases with fixed seeds for reproducibility
  const testCases = [
    { name: 'Simple block with holes', seed: 12345 },
    { name: 'L-bracket', seed: 23456 },
    { name: 'T-bracket', seed: 34567 },
    { name: 'Cylinder with cutouts', seed: 45678 },
    { name: 'Stacked blocks', seed: 56789 },
    { name: 'Corner bracket', seed: 67890 },
    { name: 'Block with spherical pockets', seed: 78901 },
    { name: 'Block with countersinks', seed: 89012 },
    { name: 'Block with torus cutout', seed: 90123 },
    { name: 'Block with angled holes', seed: 11111 },
  ];
  
  // Run all tests
  for (const testCase of testCases) {
    const result = await runTest(testCase.name, testCase.seed, ocBackend, phBackend);
    results.push(result);
  }
  
  // Cleanup
  ocBackend.dispose();
  phBackend.dispose();
  
  // Print summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  
  const passRate = (results.filter(r => r.passed).length / results.length) * 100;
  console.log(`Pass rate: ${passRate.toFixed(1)}%`);
  
  if (passRate === 100) {
    console.log('\n✅ All parity tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.testName}: ${r.error || 'geometry mismatch'}`);
    });
  }
  
  return passRate === 100 ? 0 : 1;
}

// Run tests
runParityTests()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
  });
