/**
 * Backend Factory - Creates and manages geometry backend instances
 * 
 * Provides centralized backend selection with feature flags and fallback logic
 */

import type { GeometryBackend } from './backend';
import { MeshCSGBackend } from './meshBackend';
import { OpenCascadeBackend } from './opencascadeBackend';

/**
 * Backend type selection
 */
export type BackendType = 'mesh' | 'opencascade';

/**
 * Configuration for backend creation
 */
export interface BackendConfig {
  /** Primary backend to use */
  type: BackendType;
  
  /** Enable fallback to mesh backend on errors */
  enableFallback?: boolean;
  
  /** Timeout for backend initialization (ms) */
  initTimeout?: number;
}

/**
 * Backend factory class
 */
export class BackendFactory {
  private static meshBackend: MeshCSGBackend | null = null;
  private static opencascadeBackend: OpenCascadeBackend | null = null;
  private static isInitializing = false;
  
  /**
   * Create a backend instance based on configuration
   */
  static async createBackend(config: BackendConfig): Promise<GeometryBackend> {
    const { type, enableFallback = true, initTimeout = 10000 } = config;
    
    try {
      if (type === 'opencascade') {
        return await this.getOrCreateOpenCascadeBackend(initTimeout);
      } else {
        return this.getOrCreateMeshBackend();
      }
    } catch (error) {
      console.error(`[BackendFactory] Failed to create ${type} backend:`, error);
      
      if (enableFallback && type !== 'mesh') {
        console.warn('[BackendFactory] Falling back to mesh backend');
        return this.getOrCreateMeshBackend();
      }
      
      throw error;
    }
  }
  
  /**
   * Get or create mesh backend (singleton)
   */
  private static getOrCreateMeshBackend(): MeshCSGBackend {
    if (!this.meshBackend) {
      this.meshBackend = new MeshCSGBackend();
    }
    return this.meshBackend;
  }
  
  /**
   * Get or create OpenCascade backend (singleton)
   */
  private static async getOrCreateOpenCascadeBackend(timeout: number): Promise<OpenCascadeBackend> {
    if (this.opencascadeBackend) {
      return this.opencascadeBackend;
    }
    
    if (this.isInitializing) {
      // Wait for existing initialization
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.opencascadeBackend) {
            clearInterval(checkInterval);
            resolve(this.opencascadeBackend);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Backend initialization timeout'));
        }, timeout);
      });
    }
    
    this.isInitializing = true;
    
    try {
      const backend = new OpenCascadeBackend();
      
      // Initialize with timeout
      await Promise.race([
        backend.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenCascade initialization timeout')), timeout)
        )
      ]);
      
      this.opencascadeBackend = backend;
      this.isInitializing = false;
      
      return backend;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }
  
  /**
   * Check if a backend type is available
   */
  static async isAvailable(type: BackendType): Promise<boolean> {
    try {
      if (type === 'mesh') {
        return true; // Always available
      }
      
      if (type === 'opencascade') {
        // Check if worker can be created
        // This is a lightweight check without full initialization
        return typeof Worker !== 'undefined';
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Get the recommended backend type for the current environment
   */
  static getRecommendedBackend(): BackendType {
    // Check for feature flag in environment or localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('geometry-backend');
      if (stored === 'opencascade' || stored === 'mesh') {
        return stored as BackendType;
      }
    }
    
    // Check environment variable (with type safety)
    try {
      const envBackend = (import.meta as any).env?.VITE_GEOMETRY_BACKEND;
      if (envBackend === 'opencascade' || envBackend === 'mesh') {
        return envBackend as BackendType;
      }
    } catch {
      // Ignore if import.meta.env is not available
    }
    
    // Default: use mesh for now (safe, tested)
    // Can switch to 'opencascade' when ready for production
    return 'mesh';
  }
  
  /**
   * Dispose of all cached backends
   */
  static dispose(): void {
    this.meshBackend = null;
    this.opencascadeBackend = null;
    this.isInitializing = false;
  }
}
