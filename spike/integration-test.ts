/**
 * Integration test for OpenCascadeBackend with part generators
 * 
 * Run this in spike environment to validate the complete pipeline:
 * PartRecipe → Backend → Triangulated Mesh
 */

import { generateBeginnerPartRecipe } from '../src/generators/beginner';
import { OpenCascadeBackend } from '../src/geometry/opencascadeBackend';
import { buildRecipeGeometry } from '../src/geometry/recipeBuilder';
import { Vector3 } from 'three';

async function testIntegration() {
  console.log('=== OpenCascade Integration Test ===\n');
  
  // Create backend
  const backend = new OpenCascadeBackend();
  console.log('[Test] Created OpenCascadeBackend');
  
  // Initialize
  console.log('[Test] Initializing backend...');
  await backend.initialize();
  console.log('[Test] Backend initialized\n');
  
  // Generate a simple part recipe
  console.log('[Test] Generating test recipe...');
  const seed = 12345; // Fixed seed for reproducibility
  const recipe = generateBeginnerPartRecipe(seed);
  console.log(`[Test] Generated: ${recipe.name}`);
  console.log(`[Test] Primitives: ${recipe.primitives.length}`);
  console.log(`[Test] Operations: ${recipe.operations.length}\n`);
  
  // Build geometry
  console.log('[Test] Building geometry from recipe...');
  const startTime = performance.now();
  const geometry = await buildRecipeGeometry(recipe, backend);
  const buildTime = performance.now() - startTime;
  
  console.log(`[Test] Geometry built in ${buildTime.toFixed(0)}ms`);
  console.log(`[Test] Vertices: ${geometry.mesh.attributes.position.count}`);
  console.log(`[Test] Triangles: ${geometry.mesh.index ? geometry.mesh.index.count / 3 : 0}`);
  
  if (geometry.topology) {
    console.log(`[Test] Has topology data: ${JSON.stringify(geometry.topology)}`);
  }
  
  // Test edge extraction
  if (backend.capabilities.analyticEdges) {
    console.log('\n[Test] Testing analytic edge extraction...');
    const viewDir = new Vector3(0, 0, 1);
    const edges = await backend.extractAnalyticEdges(geometry, viewDir);
    console.log(`[Test] Extracted ${edges.length} edges`);
    
    // Sample first few edges
    const sampleSize = Math.min(5, edges.length);
    for (let i = 0; i < sampleSize; i++) {
      const edge = edges[i];
      console.log(`  Edge ${i}: type=${edge.type}, visible=${edge.visible}`);
    }
  }
  
  // Cleanup
  backend.dispose();
  console.log('\n[Test] ✅ Integration test passed!');
}

// Run test
testIntegration().catch((error) => {
  console.error('\n[Test] ❌ Integration test failed:', error);
  process.exit(1);
});
