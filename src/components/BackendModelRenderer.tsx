/**
 * BackendModelRenderer - Renders 3D models using geometry backend
 * 
 * This component replaces the CSG-based rendering with backend-generated geometry
 */

import { useEffect, useState, useRef } from 'react';
import type { BufferGeometry } from 'three';
import type { PartRecipe } from '../types/part';
import type { GeometryBackend } from '../geometry/backend';
import { buildRecipeGeometry } from '../geometry/recipeBuilder';

interface BackendModelRendererProps {
  recipe: PartRecipe | null;
  backend: GeometryBackend;
  onGeometryReady?: (geometry: BufferGeometry) => void;
}

/**
 * Renders a 3D model using a geometry backend
 */
export function BackendModelRenderer({ recipe, backend, onGeometryReady }: BackendModelRendererProps) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function buildGeometry() {
      if (!recipe || !backend) return;

      setIsBuilding(true);
      setError(null);

      try {
        const result = await buildRecipeGeometry(recipe, backend);
        
        if (cancelled || !mountedRef.current) return;

        setGeometry(result.mesh);
        setIsBuilding(false);

        if (onGeometryReady) {
          onGeometryReady(result.mesh);
        }
      } catch (err) {
        if (cancelled || !mountedRef.current) return;

        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[BackendModelRenderer] Failed to build geometry:', err);
        setError(message);
        setIsBuilding(false);
      }
    }

    buildGeometry();

    return () => {
      cancelled = true;
    };
  }, [recipe, backend, onGeometryReady]);

  if (!recipe) {
    return null;
  }

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" opacity={0.5} transparent />
      </mesh>
    );
  }

  if (isBuilding || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#888" opacity={0.3} transparent wireframe />
      </mesh>
    );
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}
