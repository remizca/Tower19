/**
 * Geometry Backend Interface
 * 
 * Abstraction layer for geometry kernel operations enabling migration
 * from mesh-based CSG to analytic CAD kernels (OpenCascade, etc.).
 */

import type { BufferGeometry, Vector3 } from 'three';
import type { 
  Primitive, 
  Transform 
} from '../types/part';

/**
 * Analytic edge representation (line, arc, circle, spline)
 * for accurate 2D drawing export (DXF arcs vs polylines)
 */
export interface AnalyticEdge {
  type: 'line' | 'arc' | 'circle' | 'spline';
  start: Vector3;
  end: Vector3;
  // Arc/circle specific
  center?: Vector3;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  // Spline specific
  controlPoints?: Vector3[];
  visible: boolean;
}

/**
 * Feature metadata for parametric operations
 */
export interface Feature {
  id: string;
  type: 'hole' | 'pocket' | 'fillet' | 'chamfer' | 'rib' | 'web' | 'pattern';
  params: Record<string, number | string>;
  dependencies: string[]; // IDs of primitives/features this depends on
}

/**
 * Geometry backend result containing mesh + optional analytic data
 */
export interface GeometryResult {
  mesh: BufferGeometry;
  analyticEdges?: AnalyticEdge[];
  features?: Feature[];
  topology?: unknown; // Backend-specific topology data (OCCT TopoDS_Shape, etc.)
}

/**
 * Abstract geometry backend interface
 */
export interface GeometryBackend {
  /**
   * Backend identifier
   */
  readonly name: string;

  /**
   * Backend capabilities
   */
  readonly capabilities: {
    analyticEdges: boolean;
    fillets: boolean;
    chamfers: boolean;
    parametric: boolean;
    topology: boolean;
  };

  /**
   * Initialize backend (load WASM, etc.)
   * @returns Promise resolving when ready
   */
  initialize(): Promise<void>;

  /**
   * Create primitive geometry
   */
  createPrimitive(primitive: Primitive): Promise<GeometryResult>;

  /**
   * Perform boolean operation
   */
  booleanOperation(
    operands: GeometryResult[],
    operation: 'union' | 'subtract' | 'intersect'
  ): Promise<GeometryResult>;

  /**
   * Apply fillet to edges
   * @param geometry Input geometry
   * @param edges Edge indices or selection criteria
   * @param radius Fillet radius
   */
  filletEdges(
    geometry: GeometryResult,
    edges: number[] | 'all',
    radius: number
  ): Promise<GeometryResult>;

  /**
   * Apply chamfer to edges
   * @param geometry Input geometry
   * @param edges Edge indices or selection criteria
   * @param distance Chamfer distance
   */
  chamferEdges(
    geometry: GeometryResult,
    edges: number[] | 'all',
    distance: number
  ): Promise<GeometryResult>;

  /**
   * Extract analytic edges for 2D drawing
   * @param geometry Input geometry
   * @param viewDirection View direction for visibility classification
   */
  extractAnalyticEdges(
    geometry: GeometryResult,
    viewDirection: Vector3
  ): Promise<AnalyticEdge[]>;

  /**
   * Transform geometry
   */
  applyTransform(
    geometry: GeometryResult,
    transform: Transform
  ): Promise<GeometryResult>;

  /**
   * Dispose resources
   */
  dispose(): void;
}

/**
 * Backend registry for runtime selection
 */
export class BackendRegistry {
  private static backends = new Map<string, GeometryBackend>();
  private static activeBackend: GeometryBackend | null = null;

  static register(backend: GeometryBackend): void {
    this.backends.set(backend.name, backend);
  }

  static async activate(name: string): Promise<void> {
    const backend = this.backends.get(name);
    if (!backend) {
      throw new Error(`Backend '${name}' not found`);
    }
    
    await backend.initialize();
    this.activeBackend = backend;
  }

  static getActive(): GeometryBackend {
    if (!this.activeBackend) {
      throw new Error('No active backend. Call BackendRegistry.activate() first.');
    }
    return this.activeBackend;
  }

  static getAvailable(): string[] {
    return Array.from(this.backends.keys());
  }
}
