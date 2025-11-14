/**
 * Recipe Builder - Convert PartRecipe to GeometryResult using a backend
 * 
 * This module provides the bridge between the part generator system
 * (which produces PartRecipe objects) and the geometry backends
 * (OpenCascade, placeholder, etc.)
 */

import type { PartRecipe, Operation } from '../types/part';
import type { GeometryBackend, GeometryResult } from './backend';

/**
 * Build geometry from a part recipe using the provided backend
 * 
 * @param recipe - Part recipe with primitives and operations
 * @param backend - Geometry backend to use for construction
 * @returns Promise resolving to final geometry result
 */
export async function buildRecipeGeometry(
  recipe: PartRecipe,
  backend: GeometryBackend
): Promise<GeometryResult> {
  // Map to track geometry results by primitive/operation ID
  const geometryMap = new Map<string, GeometryResult>();
  
  // Step 1: Create all primitives
  for (const primitive of recipe.primitives) {
    const geometry = await backend.createPrimitive(primitive);
    geometryMap.set(primitive.id, geometry);
  }
  
  // Step 2: Apply operations in order
  for (const operation of recipe.operations) {
    const result = await applyOperation(operation, geometryMap, backend);
    geometryMap.set(operation.id, result);
    
    // Update target with result
    geometryMap.set(operation.targetId, result);
  }
  
  // Step 3: Return the final geometry
  // The final result is the last modified target
  const lastOp = recipe.operations[recipe.operations.length - 1];
  if (lastOp) {
    const finalGeometry = geometryMap.get(lastOp.targetId);
    if (!finalGeometry) {
      throw new Error(`Final geometry not found for target: ${lastOp.targetId}`);
    }
    return finalGeometry;
  }
  
  // No operations - return first primitive
  const firstPrimitive = recipe.primitives[0];
  if (!firstPrimitive) {
    throw new Error('Recipe has no primitives');
  }
  
  const finalGeometry = geometryMap.get(firstPrimitive.id);
  if (!finalGeometry) {
    throw new Error(`Geometry not found for primitive: ${firstPrimitive.id}`);
  }
  
  return finalGeometry;
}

/**
 * Apply a single boolean operation
 */
async function applyOperation(
  operation: Operation,
  geometryMap: Map<string, GeometryResult>,
  backend: GeometryBackend
): Promise<GeometryResult> {
  const target = geometryMap.get(operation.targetId);
  const tool = geometryMap.get(operation.toolId);
  
  if (!target) {
    throw new Error(`Target geometry not found: ${operation.targetId}`);
  }
  if (!tool) {
    throw new Error(`Tool geometry not found: ${operation.toolId}`);
  }
  
  // Apply boolean operation
  const result = await backend.booleanOperation(
    [target, tool],
    operation.op
  );
  
  return result;
}
