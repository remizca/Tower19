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
  private shapeCounter = 0;
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

    const shapeId = this.generateShapeId();
    
    switch (primitive.kind) {
      case 'box': {
        const params = primitive.params as { width: number; height: number; depth: number };
        await this.client.makeBox(params.width, params.height, params.depth);
        
        this.shapes.set(shapeId, {
          id: shapeId,
          type: 'primitive'
        });

        // TODO: Get actual triangulated mesh from worker
        // For now, create placeholder mesh
        return this.createPlaceholderBox(params.width, params.height, params.depth, shapeId);
      }

      case 'cylinder': {
        const params = primitive.params as { radius: number; height: number };
        await this.client.makeCylinder(params.radius, params.height);
        
        this.shapes.set(shapeId, {
          id: shapeId,
          type: 'primitive'
        });

        // TODO: Get actual triangulated mesh from worker
        return this.createPlaceholderCylinder(params.radius, params.height, shapeId);
      }

      case 'sphere': {
        // TODO: Implement sphere in worker
        throw new Error('Sphere primitive not yet implemented in worker');
      }

      case 'cone': {
        // TODO: Implement cone in worker
        throw new Error('Cone primitive not yet implemented in worker');
      }

      case 'torus': {
        // TODO: Implement torus in worker
        throw new Error('Torus primitive not yet implemented in worker');
      }

      case 'custom':
        throw new Error('Custom primitives not supported by OpenCascade backend');

      default:
        throw new Error(`Unknown primitive type: ${(primitive as any).type}`);
    }
  }

  async booleanOperation(
    operands: GeometryResult[],
    operation: 'union' | 'subtract' | 'intersect'
  ): Promise<GeometryResult> {
    this.ensureInitialized();

    if (operands.length < 2) {
      throw new Error('Boolean operation requires at least 2 operands');
    }

    // TODO: Implement shape serialization/transfer
    // For now, only support subtract operation with placeholder
    if (operation === 'subtract') {
      const shapeId = this.generateShapeId();
      
      // Call worker boolean cut
      // Note: Currently worker expects shapes to be created in worker context
      // Need to implement shape management strategy
      await this.client.booleanCut(null, null);
      
      this.shapes.set(shapeId, {
        id: shapeId,
        type: 'boolean'
      });

      // TODO: Get actual result mesh from worker
      // For now, return first operand (placeholder)
      return {
        ...operands[0],
        topology: { shapeId }
      };
    }

    throw new Error(`Boolean operation '${operation}' not yet implemented`);
  }

  async filletEdges(
    geometry: GeometryResult,
    _edges: number[] | 'all',
    radius: number
  ): Promise<GeometryResult> {
    this.ensureInitialized();

    const shapeId = this.generateShapeId();
    
    // Call worker fillet
    // Note: Currently assumes shape is in worker context
    await this.client.fillet(null, radius);
    
    this.shapes.set(shapeId, {
      id: shapeId,
      type: 'fillet'
    });

    // TODO: Get actual filleted mesh from worker
    return {
      ...geometry,
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
    _geometry: GeometryResult,
    _viewDirection: Vector3
  ): Promise<AnalyticEdge[]> {
    this.ensureInitialized();
    
    // TODO: Implement analytic edge extraction from OCCT topology
    // Would need to export edges from worker with curve information
    throw new Error('Analytic edge extraction not yet implemented');
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

  private generateShapeId(): string {
    return `shape_${++this.shapeCounter}`;
  }

  /**
   * Create placeholder box mesh (temporary until worker returns triangulation)
   */
  private createPlaceholderBox(
    width: number, 
    height: number, 
    depth: number,
    shapeId: string
  ): GeometryResult {
    const geometry = new BufferGeometry();
    
    // Simple box vertices (8 corners)
    const w = width / 2, h = height / 2, d = depth / 2;
    const vertices = new Float32Array([
      // Front face
      -w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,
      // Back face
      -w, -h, -d,  -w,  h, -d,   w,  h, -d,   w, -h, -d,
      // Top face
      -w,  h, -d,  -w,  h,  d,   w,  h,  d,   w,  h, -d,
      // Bottom face
      -w, -h, -d,   w, -h, -d,   w, -h,  d,  -w, -h,  d,
      // Right face
       w, -h, -d,   w,  h, -d,   w,  h,  d,   w, -h,  d,
      // Left face
      -w, -h, -d,  -w, -h,  d,  -w,  h,  d,  -w,  h, -d
    ]);

    const indices = new Uint16Array([
      0,  1,  2,   0,  2,  3,   // Front
      4,  5,  6,   4,  6,  7,   // Back
      8,  9, 10,   8, 10, 11,   // Top
      12, 13, 14,  12, 14, 15,  // Bottom
      16, 17, 18,  16, 18, 19,  // Right
      20, 21, 22,  20, 22, 23   // Left
    ]);

    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return {
      mesh: geometry,
      topology: { shapeId }
    };
  }

  /**
   * Create placeholder cylinder mesh (temporary)
   */
  private createPlaceholderCylinder(
    radius: number,
    height: number,
    shapeId: string
  ): GeometryResult {
    const geometry = new BufferGeometry();
    
    // Simple cylinder with 16 segments
    const segments = 16;
    const vertices: number[] = [];
    const indices: number[] = [];

    const h = height / 2;

    // Generate vertices
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Bottom
      vertices.push(x, -h, z);
      // Top
      vertices.push(x, h, z);
    }

    // Generate indices for side faces
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));
    geometry.computeVertexNormals();

    return {
      mesh: geometry,
      topology: { shapeId }
    };
  }
}
