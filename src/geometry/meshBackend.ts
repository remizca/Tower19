/**
 * Mesh-based CSG Backend (Baseline)
 * 
 * Wraps current @react-three/csg system as a GeometryBackend implementation.
 * Provides baseline for feature parity testing during migration.
 */

import { BufferGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry, Vector3, Euler, Matrix4 } from 'three';
import type { GeometryBackend, GeometryResult, AnalyticEdge } from './backend';
import type { Primitive, Transform } from '../types/part';

export class MeshCSGBackend implements GeometryBackend {
  readonly name = 'mesh-csg';
  readonly capabilities = {
    analyticEdges: false,
    fillets: false,
    chamfers: false,
    parametric: false,
    topology: false,
  };

  async initialize(): Promise<void> {
    // No initialization needed for mesh backend
  }

  async createPrimitive(primitive: Primitive): Promise<GeometryResult> {
    let geometry: BufferGeometry;

    switch (primitive.kind) {
      case 'box': {
        const params = primitive.params as { width: number; height: number; depth: number };
        geometry = new BoxGeometry(params.width, params.height, params.depth);
        break;
      }

      case 'cylinder': {
        const params = primitive.params as { radius: number; height: number };
        geometry = new CylinderGeometry(params.radius, params.radius, params.height, 32);
        break;
      }

      case 'sphere': {
        const params = primitive.params as { radius: number };
        geometry = new SphereGeometry(params.radius, 32, 32);
        break;
      }

      case 'cone': {
        const params = primitive.params as { radiusBottom: number; radiusTop?: number; height: number };
        if (params.radiusTop !== undefined && params.radiusTop > 0) {
          // Frustum
          geometry = new CylinderGeometry(params.radiusTop, params.radiusBottom, params.height, 32);
        } else {
          // Pure cone
          geometry = new ConeGeometry(params.radiusBottom, params.height, 32);
        }
        break;
      }

      case 'torus': {
        const params = primitive.params as { radius: number; tubeRadius: number };
        geometry = new TorusGeometry(params.radius, params.tubeRadius, 16, 32);
        break;
      }

      default:
        throw new Error(`Unsupported primitive kind: ${primitive.kind}`);
    }

    // Apply transform if present
    if (primitive.transform) {
      geometry = await this.applyTransformInternal(geometry, primitive.transform);
    }

    return { mesh: geometry };
  }

  async booleanOperation(
    operands: GeometryResult[],
    _operation: 'union' | 'subtract' | 'intersect'
  ): Promise<GeometryResult> {
    if (operands.length < 2) {
      throw new Error('Boolean operation requires at least 2 operands');
    }

    // TODO: Implement boolean operations using CSG or alternative library
    // Current @react-three/csg uses JSX-based API, not programmatic
    // For now, return first operand as placeholder
    console.warn('MeshCSGBackend: boolean operations not yet implemented in adapter');
    return operands[0];
  }

  async filletEdges(
    geometry: GeometryResult,
    _edges: number[] | 'all',
    _radius: number
  ): Promise<GeometryResult> {
    // Mesh backend does not support fillets
    console.warn('MeshCSGBackend: fillets not supported, returning original geometry');
    return geometry;
  }

  async chamferEdges(
    geometry: GeometryResult,
    _edges: number[] | 'all',
    _distance: number
  ): Promise<GeometryResult> {
    // Mesh backend does not support chamfers
    console.warn('MeshCSGBackend: chamfers not supported, returning original geometry');
    return geometry;
  }

  async extractAnalyticEdges(
    _geometry: GeometryResult,
    _viewDirection: Vector3
  ): Promise<AnalyticEdge[]> {
    // Mesh backend does not produce analytic edges
    return [];
  }

  async applyTransform(
    geometry: GeometryResult,
    transform: Transform
  ): Promise<GeometryResult> {
    const transformed = await this.applyTransformInternal(geometry.mesh, transform);
    return { mesh: transformed };
  }

  private async applyTransformInternal(
    geometry: BufferGeometry,
    transform: Transform
  ): Promise<BufferGeometry> {
    const cloned = geometry.clone();

    // Apply position
    if (transform.position) {
      const matrix = new Matrix4().makeTranslation(
        transform.position.x,
        transform.position.y,
        transform.position.z
      );
      cloned.applyMatrix4(matrix);
    }

    // Apply rotation (degrees to radians)
    if (transform.rotation) {
      const euler = new Euler(
        (transform.rotation.x * Math.PI) / 180,
        (transform.rotation.y * Math.PI) / 180,
        (transform.rotation.z * Math.PI) / 180,
        'XYZ'
      );
      const matrix = new Matrix4().makeRotationFromEuler(euler);
      cloned.applyMatrix4(matrix);
    }

    // Apply scale
    if (transform.scale) {
      const matrix = new Matrix4().makeScale(
        transform.scale.x,
        transform.scale.y,
        transform.scale.z
      );
      cloned.applyMatrix4(matrix);
    }

    return cloned;
  }

  dispose(): void {
    // No resources to dispose
  }
}
