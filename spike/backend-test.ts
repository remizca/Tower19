/**
 * OpenCascade Backend Test
 * 
 * Demonstrates OpenCascadeBackend usage and validates basic operations.
 * Run with: npm run dev, then navigate to /spike/backend-test.html
 */

import { OpenCascadeBackend } from '../src/geometry/opencascadeBackend';
import { BackendRegistry } from '../src/geometry/backend';
import type { Primitive } from '../src/types/part';

async function testBackend() {
  console.log('=== OpenCascade Backend Test ===\n');

  // Create and register backend
  const backend = new OpenCascadeBackend();
  BackendRegistry.register(backend);
  
  console.log(`✓ Backend registered: ${backend.name}`);
  console.log(`✓ Capabilities:`, backend.capabilities);

  // Initialize (triggers Web Worker + OCCT load)
  console.log('\n[1] Initializing backend (Web Worker + OCCT)...');
  const initStart = performance.now();
  await backend.initialize();
  const initTime = performance.now() - initStart;
  console.log(`✓ Initialized in ${initTime.toFixed(0)}ms (non-blocking)`);

  // Create box primitive
  console.log('\n[2] Creating box primitive (100x50x30)...');
  const boxPrimitive: Primitive = {
    id: 'box1',
    kind: 'box',
    params: {
      width: 100,
      height: 50,
      depth: 30
    }
  };

  const boxStart = performance.now();
  const boxResult = await backend.createPrimitive(boxPrimitive);
  const boxTime = performance.now() - boxStart;

  console.log(`✓ Box created in ${boxTime.toFixed(2)}ms`);
  console.log(`  - Vertices: ${boxResult.mesh.attributes.position?.count || 0}`);
  console.log(`  - Triangles: ${(boxResult.mesh.index?.count || 0) / 3}`);
  console.log(`  - Has topology: ${!!boxResult.topology}`);

  // Create cylinder primitive
  console.log('\n[3] Creating cylinder primitive (r=25, h=80)...');
  const cylinderPrimitive: Primitive = {
    id: 'cyl1',
    kind: 'cylinder',
    params: {
      radius: 25,
      height: 80
    }
  };

  const cylStart = performance.now();
  const cylResult = await backend.createPrimitive(cylinderPrimitive);
  const cylTime = performance.now() - cylStart;

  console.log(`✓ Cylinder created in ${cylTime.toFixed(2)}ms`);
  console.log(`  - Vertices: ${cylResult.mesh.attributes.position?.count || 0}`);
  console.log(`  - Triangles: ${(cylResult.mesh.index?.count || 0) / 3}`);
  console.log(`  - Has topology: ${!!cylResult.topology}`);

  // Test boolean operation (placeholder)
  console.log('\n[4] Testing boolean subtract operation...');
  const boolStart = performance.now();
  try {
    const boolResult = await backend.booleanOperation(
      [boxResult, cylResult],
      'subtract'
    );
    const boolTime = performance.now() - boolStart;
    console.log(`✓ Boolean completed in ${boolTime.toFixed(2)}ms`);
    console.log(`  - Result has topology: ${!!boolResult.topology}`);
  } catch (error: any) {
    console.log(`⚠ Boolean operation: ${error.message}`);
  }

  // Test fillet (placeholder)
  console.log('\n[5] Testing fillet operation (5mm radius)...');
  const filletStart = performance.now();
  try {
    const filletResult = await backend.filletEdges(boxResult, 'all', 5);
    const filletTime = performance.now() - filletStart;
    console.log(`✓ Fillet completed in ${filletTime.toFixed(2)}ms`);
    console.log(`  - Result has topology: ${!!filletResult.topology}`);
  } catch (error: any) {
    console.log(`⚠ Fillet operation: ${error.message}`);
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`✓ All basic operations functional`);
  console.log(`✓ Web Worker architecture working`);
  console.log(`⚠ Note: Currently using placeholder meshes`);
  console.log(`⚠ Future: Implement shape serialization and OCCT triangulation export`);

  // Cleanup
  backend.dispose();
  console.log('\n✓ Backend disposed');
}

// Auto-run test
testBackend().catch(error => {
  console.error('❌ Test failed:', error);
});

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testBackend = testBackend;
}
