/**
 * OpenCascade Backend Implementation
 * 
 * Wraps oc-worker-client to provide GeometryBackend interface
 * for analytic CAD operations via Web Worker.
 */

import { BufferGeometry, BufferAttribute, Vector3 } from 'three';
import type { 
  GeometryBackend, 
  GeometryResult, 
  AnalyticEdge 
} from './backend';
import type { Primitive, Transform } from '../types/part';
import { getWorkerClient } from '../../spike/oc-worker-client';

/**
 * Internal shape reference for OCCT topology
 */
interface ShapeReference {
  id: string;
  type: 'primitive' | 'boolean' | 'fillet' | 'chamfer';
  // In future: could store serialized shape data for worker transfer
}

/**
 * OpenCascade-based geometry backend using Web Worker
 */
export class OpenCascadeBackend implements GeometryBackend {
  readonly name = 'opencascade';
  
  readonly capabilities = {
    analyticEdges: true,
    fillets: true,
    chamfers: true,
    parametric: true,
    topology: true
  };

  private client = getWorkerClient();
  private initialized = false;
  private shapes = new Map<string, ShapeReference>();

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[OpenCascadeBackend] Initializing worker...');
    const initMs = await this.client.init();
    console.log(`[OpenCascadeBackend] Initialized in ${initMs.toFixed(0)}ms`);
    this.initialized = true;
  }

  async createPrimitive(primitive: Primitive): Promise<GeometryResult> {
    this.ensureInitialized();
    
    let shapeId: string;
    
    switch (primitive.kind) {
      case 'box': {
        const params = primitive.params as { width: number; height: number; depth: number };
        shapeId = await this.client.makeBox(params.width, params.height, params.depth);
        break;
      }

      case 'cylinder': {
        const params = primitive.params as { radius: number; height: number };
        shapeId = await this.client.makeCylinder(params.radius, params.height);
        break;
      }

      case 'sphere': {
        const params = primitive.params as { radius: number };
        shapeId = await this.client.makeSphere(params.radius);
        break;
      }

      case 'cone': {
        const params = primitive.params as { radius1: number; radius2: number; height: number };
        shapeId = await this.client.makeCone(params.radius1, params.radius2, params.height);
        break;
      }

      case 'torus': {
        const params = primitive.params as { majorRadius: number; minorRadius: number };
        shapeId = await this.client.makeTorus(params.majorRadius, params.minorRadius);
        break;
      }

      case 'custom':
        throw new Error('Custom primitives not supported by OpenCascade backend');

      default:
        throw new Error(`Unknown primitive type: ${(primitive as any).type}`);
    }
    
    // Store shape reference
    this.shapes.set(shapeId, {
      id: shapeId,
      type: 'primitive'
    });
    
    // Get triangulated mesh from worker
    const { vertices, indices, normals } = await this.client.triangulate(shapeId);
    
    // Create Three.js BufferGeometry
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));
    geometry.setIndex(new BufferAttribute(indices, 1));
    
    return {
      mesh: geometry,
      topology: { shapeId }
    };
  }

  async booleanOperation(
    operands: GeometryResult[],
    operation: 'union' | 'subtract' | 'intersect'
  ): Promise<GeometryResult> {
    this.ensureInitialized();

    if (operands.length < 2) {
      throw new Error('Boolean operation requires at least 2 operands');
    }
    
    // Extract shape IDs from operands
    const shapeIds = operands.map(op => {
      const topology = op.topology as { shapeId?: string } | undefined;
      const shapeId = topology?.shapeId;
      if (!shapeId) {
        throw new Error('Operand missing shape topology information');
      }
      return shapeId;
    });
    
    let resultShapeId: string;
    
    switch (operation) {
      case 'union': {
        resultShapeId = await this.client.booleanFuse(shapeIds);
        break;
      }
      
      case 'subtract': {
        if (operands.length !== 2) {
          throw new Error('Subtract operation requires exactly 2 operands');
        }
        resultShapeId = await this.client.booleanCut(shapeIds[0], shapeIds[1]);
        break;
      }
      
      case 'intersect': {
        // TODO: Implement intersect in worker
        throw new Error('Intersect operation not yet implemented');
      }
      
      default:
        throw new Error(`Unknown boolean operation: ${operation}`);
    }
    
    // Store result shape reference
    this.shapes.set(resultShapeId, {
      id: resultShapeId,
      type: 'boolean'
    });
    
    // Get triangulated mesh from worker
    const { vertices, indices, normals } = await this.client.triangulate(resultShapeId);
    
    // Create Three.js BufferGeometry
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));
    geometry.setIndex(new BufferAttribute(indices, 1));
    
    return {
      mesh: geometry,
      topology: { shapeId: resultShapeId }
    };
  }

  async filletEdges(
    geometry: GeometryResult,
    _edges: number[] | 'all',
    radius: number
  ): Promise<GeometryResult> {
    this.ensureInitialized();

    const topology = geometry.topology as { shapeId?: string } | undefined;
    const shapeId = topology?.shapeId;
    if (!shapeId) {
      throw new Error('Geometry missing shape topology information');
    }
    
    // Call worker fillet (modifies shape in place)
    const { edgeCount } = await this.client.fillet(shapeId, radius);
    console.log(`[OpenCascadeBackend] Filleted ${edgeCount} edges with radius ${radius}`);
    
    // Get updated triangulated mesh from worker
    const { vertices, indices, normals } = await this.client.triangulate(shapeId);
    
    // Create Three.js BufferGeometry
    const newGeometry = new BufferGeometry();
    newGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
    newGeometry.setAttribute('normal', new BufferAttribute(normals, 3));
    newGeometry.setIndex(new BufferAttribute(indices, 1));

    return {
      mesh: newGeometry,
      topology: { shapeId }
    };
  }

  async chamferEdges(
    _geometry: GeometryResult,
    _edges: number[] | 'all',
    _distance: number
  ): Promise<GeometryResult> {
    this.ensureInitialized();
    
    // TODO: Implement chamfer in worker
    throw new Error('Chamfer not yet implemented');
  }

  async extractAnalyticEdges(
    geometry: GeometryResult,
    viewDirection: Vector3
  ): Promise<AnalyticEdge[]> {
    this.ensureInitialized();
    
    const topology = geometry.topology as { shapeId?: string } | undefined;
    const shapeId = topology?.shapeId;
    if (!shapeId) {
      throw new Error('Geometry missing shape topology information');
    }
    
    // Extract edges from worker
    const edges = await this.client.extractEdges(shapeId, {
      x: viewDirection.x,
      y: viewDirection.y,
      z: viewDirection.z
    });
    
    return edges;
  }

  async applyTransform(
    geometry: GeometryResult,
    transform: Transform
  ): Promise<GeometryResult> {
    this.ensureInitialized();
    
    // TODO: Implement OCCT transformation
    // For now, apply to mesh directly
    const mesh = geometry.mesh.clone();
    
    if (transform.position) {
      const pos = transform.position;
      mesh.translate(pos.x, pos.y, pos.z);
    }
    
    if (transform.rotation) {
      const rot = transform.rotation;
      mesh.rotateX(rot.x);
      mesh.rotateY(rot.y);
      mesh.rotateZ(rot.z);
    }
    
    if (transform.scale) {
      const scale = transform.scale;
      mesh.scale(scale.x, scale.y, scale.z);
    }

    return {
      ...geometry,
      mesh
    };
  }

  dispose(): void {
    this.client.terminate();
    this.shapes.clear();
    this.initialized = false;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('OpenCascadeBackend not initialized. Call initialize() first.');
    }
  }

}

