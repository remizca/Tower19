// OpenCascade Worker Client - manages worker communication with Promise-based API
export class OpenCascadeWorkerClient {
  private worker: Worker | null = null;
  private initPromise: Promise<number> | null = null;
  private requestId = 0;
  private shapeIdCounter = 0;
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  
  constructor() {}
  
  /**
   * Initialize the worker and load OpenCascade in background
   * Returns promise that resolves with init time in ms
   */
  async init(): Promise<number> {
    if (this.initPromise) return this.initPromise;
    
    console.log('[Client] Starting worker initialization...');
    this.initPromise = new Promise((resolve, reject) => {
      try {
        // Create worker from separate TS file (Vite will handle bundling)
        console.log('[Client] Creating worker...');
        this.worker = new Worker(new URL('./oc-worker.ts', import.meta.url), {
          type: 'module'
        });
        
        // Handle worker messages
        this.worker.onmessage = (e) => {
          const msg = e.data;
          console.log('[Client] Received message from worker:', msg);
          
          // Handle ready signal
          if (msg.type === 'ready') {
            console.log('[Client] Worker ready, starting OCCT init...');
            // Send init request
            const initId = this.generateId();
            this.pendingRequests.set(initId, { 
              resolve: (result) => resolve(result.initMs),
              reject 
            });
            this.worker!.postMessage({ id: initId, type: 'init' });
            return;
          }
          
          // Handle init response
          if (msg.type === 'init') {
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
              this.pendingRequests.delete(msg.id);
              if (msg.success) {
                pending.resolve({ initMs: msg.initMs });
              } else {
                pending.reject(new Error(msg.error));
              }
            }
            return;
          }
          
          // Handle regular responses
          if (msg.id) {
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
              this.pendingRequests.delete(msg.id);
              if (msg.success) {
                // For most operations, resolve with the response itself
                pending.resolve(msg);
              } else {
                pending.reject(new Error(msg.error));
              }
            }
          }
        };
        
        this.worker.onerror = (error) => {
          console.error('[Client] Worker error:', error);
          reject(new Error(`Worker error: ${error.message}`));
        };
        
      } catch (error) {
        reject(error);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Execute an operation in the worker
   */
  private async executeOperation<T>(type: string, params?: any): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker not initialized. Call init() first.');
    }
    
    const id = this.generateId();
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({ id, type, params });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Operation ${type} timed out after 30s`));
        }
      }, 30000);
    });
  }
  
  /**
   * Create a box primitive
   */
  async makeBox(w: number, h: number, d: number): Promise<string> {
    const shapeId = this.generateShapeId();
    await this.executeOperation('makeBox', { shapeId, w, h, d });
    return shapeId;
  }
  
  /**
   * Create a cylinder primitive
   */
  async makeCylinder(r: number, h: number): Promise<string> {
    const shapeId = this.generateShapeId();
    await this.executeOperation('makeCylinder', { shapeId, r, h });
    return shapeId;
  }
  
  /**
   * Create a sphere primitive
   */
  async makeSphere(radius: number): Promise<string> {
    const shapeId = this.generateShapeId();
    await this.executeOperation('makeSphere', { shapeId, radius });
    return shapeId;
  }
  
  /**
   * Create a cone primitive
   */
  async makeCone(radius1: number, radius2: number, height: number): Promise<string> {
    const shapeId = this.generateShapeId();
    await this.executeOperation('makeCone', { shapeId, radius1, radius2, height });
    return shapeId;
  }
  
  /**
   * Create a torus primitive
   */
  async makeTorus(majorRadius: number, minorRadius: number): Promise<string> {
    const shapeId = this.generateShapeId();
    await this.executeOperation('makeTorus', { shapeId, majorRadius, minorRadius });
    return shapeId;
  }
  
  /**
   * Perform boolean cut operation
   */
  async booleanCut(baseShapeId: string, toolShapeId: string): Promise<string> {
    const resultId = this.generateShapeId();
    await this.executeOperation('booleanCut', { resultId, baseId: baseShapeId, toolId: toolShapeId });
    return resultId;
  }
  
  /**
   * Perform boolean fuse (union) operation
   */
  async booleanFuse(shapeIds: string[]): Promise<string> {
    const resultId = this.generateShapeId();
    await this.executeOperation('booleanFuse', { resultId, shapes: shapeIds });
    return resultId;
  }
  
  /**
   * Apply fillet to shape (modifies shape in place)
   */
  async fillet(shapeId: string, radius: number): Promise<{ shapeId: string; edgeCount: number }> {
    const response: any = await this.executeOperation('fillet', { baseId: shapeId, radius });
    return { shapeId: response.shapeId, edgeCount: response.edgeCount };
  }
  
  /**
   * Triangulate shape and get mesh data
   */
  async triangulate(shapeId: string, deflection: number = 0.1): Promise<{ 
    vertices: Float32Array; 
    indices: Uint32Array; 
    normals: Float32Array 
  }> {
    const response: any = await this.executeOperation('triangulate', { shapeId, deflection });
    return response.result;
  }
  
  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
      this.pendingRequests.clear();
    }
  }
  
  private generateId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }
  
  private generateShapeId(): string {
    return `shape_${++this.shapeIdCounter}_${Date.now()}`;
  }
}

// Singleton instance
let clientInstance: OpenCascadeWorkerClient | null = null;

/**
 * Get or create the worker client instance
 */
export function getWorkerClient(): OpenCascadeWorkerClient {
  if (!clientInstance) {
    clientInstance = new OpenCascadeWorkerClient();
  }
  return clientInstance;
}

/**
 * Initialize OpenCascade in a web worker (non-blocking)
 * Returns promise with init time in ms
 */
export async function initOpenCascadeWorker(): Promise<{ initMs: number }> {
  const client = getWorkerClient();
  const initMs = await client.init();
  return { initMs };
}
