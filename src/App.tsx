import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useEffect, useRef, useState } from 'react'
import { generateBeginnerPartRecipe } from './generators/beginner'
import { generateIntermediatePartRecipe } from './generators/intermediate'
import type PartRecipe from './types/part'
import type { Transform, Difficulty } from './types/part'
import { validatePartRecipe } from './schema/validate'
import migrateLegacyBeginnerToPartRecipe from './storage/migrate'
import { Geometry, Base, Subtraction, Addition } from '@react-three/csg'
import { DrawingViewer } from './viewers/DrawingViewer'
import type { BufferGeometry } from 'three'

// Helper to compute position, rotation, and scale from transform + axis fallback
function computeTransform(
  transform: Transform | undefined,
  axisParam: 'x' | 'y' | 'z' | undefined
): {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
} {
  const pos = transform?.position
    ? [transform.position.x / 10, transform.position.y / 10, transform.position.z / 10] as [number, number, number]
    : undefined

  let rot: [number, number, number] | undefined

  // Priority: explicit rotation in transform takes precedence over axis fallback
  if (transform?.rotation) {
    // Convert degrees to radians
    const degToRad = Math.PI / 180
    rot = [
      transform.rotation.x * degToRad,
      transform.rotation.y * degToRad,
      transform.rotation.z * degToRad
    ]
  } else if (axisParam && axisParam !== 'z') {
    // Fallback: axis-based rotation for backward compatibility
    rot = axisParam === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]
  }

  const scale = transform?.scale
    ? [transform.scale.x, transform.scale.y, transform.scale.z] as [number, number, number]
    : undefined

  return { position: pos, rotation: rot, scale }
}

function Controls() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement)
    controls.enableDamping = true
    controlsRef.current = controls
    return () => controls.dispose()
  }, [camera, gl])

  useFrame(() => controlsRef.current && controlsRef.current.update())
  return null
}

function ModelRenderer({ recipe, onGeometryReady }: { recipe: PartRecipe | null; onGeometryReady?: (geometry: BufferGeometry | null) => void }) {
  const geometryRef = useRef<BufferGeometry | null>(null)

  if (!recipe) {
    console.log('[ModelRenderer] no recipe')
    return null
  }

  console.log('[ModelRenderer] recipe:', recipe.name, 'primitives:', recipe.primitives.length, 'ops:', recipe.operations.length)

  // Find a base primitive (prefer a box, otherwise first primitive)
  const base = recipe.primitives.find((p) => p.kind === 'box') || recipe.primitives[0]
  if (!base) {
    console.log('[ModelRenderer] no base primitive')
    return null
  }

  console.log('[ModelRenderer] base:', base.kind, base.id)

  // For operations
  const subtractOps = recipe.operations.filter((op) => op.op === 'subtract')
  const unionOps = recipe.operations.filter((op) => op.op === 'union')

  console.log('[ModelRenderer] unions:', unionOps.length, 'subtractions:', subtractOps.length)

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={(mesh) => {
        if (mesh && mesh.geometry) {
          const geom = mesh.geometry as BufferGeometry
          if (geometryRef.current !== geom) {
            geometryRef.current = geom
            onGeometryReady?.(geom)
          }
        }
      }}>
        <Geometry>
          <Base>
            {base.kind === 'box' && (() => {
              const p: any = base.params
              const width = (p.width || 100) / 10
              const depth = (p.depth || 50) / 10
              const height = (p.height || 25) / 10
              return (
                <>
                  <boxGeometry args={[width, depth, height]} />
                  <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                </>
              )
            })()}
            {base.kind === 'cylinder' && (() => {
              const p: any = base.params
              const r = (p.radius || 20) / 10
              const h = (p.height || 50) / 10
              return (
                <>
                  <cylinderGeometry args={[r, r, h, 32]} />
                  <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                </>
              )
            })()}
            {base.kind === 'sphere' && (() => {
              const p: any = base.params
              const r = (p.radius || 20) / 10
              return (
                <>
                  <sphereGeometry args={[r, 32, 16]} />
                  <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                </>
              )
            })()}
            {base.kind === 'cone' && (() => {
              const p: any = base.params
              const rt = (p.radiusTop || 0) / 10
              const rb = (p.radiusBottom || 20) / 10
              const h = (p.height || 50) / 10
              return (
                <>
                  <cylinderGeometry args={[rt, rb, h, 32]} />
                  <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                </>
              )
            })()}
            {base.kind === 'torus' && (() => {
              const p: any = base.params
              const R = (p.majorRadius || 40) / 10
              const r = (p.tubeRadius || 8) / 10
              return (
                <>
                  <torusGeometry args={[R, r, 24, 48]} />
                  <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                </>
              )
            })()}
          </Base>

          {unionOps.map((op) => {
            const tool = recipe.primitives.find((p) => p.id === op.toolId)
            if (!tool) return null
            const axis = (tool as any).params?.axis
            const { position, rotation, scale } = computeTransform(tool.transform, axis)

            if (tool.kind === 'box') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <boxGeometry args={[(p.width || 20) / 10, (p.depth || 20) / 10, (p.height || 20) / 10]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'cylinder') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <cylinderGeometry args={[(p.radius || 10) / 10, (p.radius || 10) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'sphere') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <sphereGeometry args={[(p.radius || 10) / 10, 32, 16]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'cone') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <cylinderGeometry args={[(p.radiusTop || 0) / 10, (p.radiusBottom || 10) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'torus') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <torusGeometry args={[(p.majorRadius || 20) / 10, (p.tubeRadius || 5) / 10, 24, 48]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            return null
          })}

          {subtractOps.map((op) => {
            const tool = recipe.primitives.find((p) => p.id === op.toolId)
            if (!tool) return null

            const axis = (tool as any).params?.axis
            const { position, rotation, scale } = computeTransform(tool.transform, axis)

            if (tool.kind === 'cylinder') {
              const p: any = tool.params
              const r = (p.radius || 5) / 10
              const h = (p.height || Math.max(recipe.bounding_mm.x, recipe.bounding_mm.y, recipe.bounding_mm.z) * 2) / 10
              return (
                <Subtraction key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <cylinderGeometry args={[r, r, h, 32]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'sphere') {
              const p: any = tool.params
              return (
                <Subtraction key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <sphereGeometry args={[(p.radius || 5) / 10, 32, 16]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'cone') {
              const p: any = tool.params
              return (
                <Subtraction key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <cylinderGeometry args={[(p.radiusTop || 0) / 10, (p.radiusBottom || 8) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'torus') {
              const p: any = tool.params
              return (
                <Subtraction key={op.id} position={position as any} rotation={rotation as any} scale={scale as any}>
                  <torusGeometry args={[(p.majorRadius || 20) / 10, (p.tubeRadius || 5) / 10, 24, 48]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }

            // For unknown tool kinds, skip rendering the subtraction
            return null
          })}
        </Geometry>
      </mesh>
    </group>
  )
}

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner')
  const [seed, setSeed] = useState<number>(() => Date.now())
  const [recipe, setRecipe] = useState<PartRecipe | null>(() => generateBeginnerPartRecipe(seed))
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D')
  const [csgGeometry, setCsgGeometry] = useState<BufferGeometry | null>(null)
  const [bookmarks, setBookmarks] = useState<PartRecipe[]>(() => {
    try {
      const raw = localStorage.getItem('tower19:bookmarks')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      // Validate / migrate each entry
      const candidates = parsed.map((p: any) => {
        const { valid } = validatePartRecipe(p)
        if (valid) return p as PartRecipe
        if (p && Array.isArray(p.holes)) {
          // legacy shape - migrate
          return migrateLegacyBeginnerToPartRecipe(p)
        }
        // otherwise skip
        return null
      })

      const normalized = candidates.filter((x): x is PartRecipe => x !== null)
      return normalized
    } catch (e) {
      return []
    }
  })

  const generate = () => {
    const nextSeed = Date.now()
    try {
      let next: PartRecipe
      if (difficulty === 'Intermediate') {
        next = generateIntermediatePartRecipe(nextSeed)
      } else {
        next = generateBeginnerPartRecipe(nextSeed)
      }
      setSeed(nextSeed)
      setRecipe(next)
      // Debug marker for deployed builds
      console.log('[generate] seed', nextSeed, 'difficulty', difficulty, 'name', next.name)
    } catch (err) {
      console.error('[generate] failed', err)
    }
  }

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = e.target.value as Difficulty
    setDifficulty(newDifficulty)
    // Regenerate with current seed using new difficulty
    try {
      let next: PartRecipe
      if (newDifficulty === 'Intermediate') {
        next = generateIntermediatePartRecipe(seed)
      } else {
        next = generateBeginnerPartRecipe(seed)
      }
      setRecipe(next)
      console.log('[difficulty change]', newDifficulty, 'seed', seed, 'name', next.name)
    } catch (err) {
      console.error('[difficulty change] failed', err)
    }
  }

  const saveBookmark = () => {
    if (!recipe) return
    const next = [recipe, ...bookmarks].slice(0, 50)
    setBookmarks(next)
    localStorage.setItem('tower19:bookmarks', JSON.stringify(next))
  }

  const handleGeometryReady = (geometry: BufferGeometry | null) => {
    setCsgGeometry(geometry)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Top controls */}
      <div style={{ position: 'absolute', zIndex: 10, left: 12, top: 12, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <button onClick={generate}>Generate</button>
        <select value={difficulty} onChange={handleDifficultyChange} style={{ padding: '4px 8px' }}>
          <option>Beginner</option>
          <option>Intermediate</option>
        </select>
        <button onClick={saveBookmark}>Save / Bookmark</button>
        <span style={{ alignSelf: 'center', opacity: 0.7 }}>seed: {seed}</span>
      </div>

      {/* View mode tabs */}
      <div style={{
        position: 'absolute',
        zIndex: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        top: 12,
        display: 'flex',
        gap: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 4,
        borderRadius: 6,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => setViewMode('3D')}
          style={{
            padding: '8px 16px',
            background: viewMode === '3D' ? 'rgba(136, 136, 204, 0.8)' : 'transparent',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: viewMode === '3D' ? 600 : 400
          }}
        >
          3D Model
        </button>
        <button
          onClick={() => setViewMode('2D')}
          style={{
            padding: '8px 16px',
            background: viewMode === '2D' ? 'rgba(136, 136, 204, 0.8)' : 'transparent',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: viewMode === '2D' ? 600 : 400
          }}
        >
          2D Drawing
        </button>
      </div>

      {/* 3D Viewer */}
      {viewMode === '3D' && (
        <Canvas>
          <ambientLight intensity={0.6} />
          <pointLight position={[100, 100, 100]} />
          <ModelRenderer recipe={recipe} onGeometryReady={handleGeometryReady} />
          <Controls />
        </Canvas>
      )}

      {/* 2D Viewer */}
      {viewMode === '2D' && recipe && (
        <DrawingViewer
          recipe={recipe}
          geometry={csgGeometry ?? undefined}
        />
      )}

      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10, background: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 6, color: '#fff', pointerEvents: 'auto' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Bookmarks</div>
        {bookmarks.length === 0 && <div style={{ opacity: 0.7 }}>No bookmarks yet</div>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 300, overflow: 'auto' }}>
          {bookmarks.map((b) => (
            <li key={b.id} style={{ marginBottom: 6 }}>
              <button onClick={() => setRecipe(b)} style={{ display: 'block', width: '100%', textAlign: 'left' }}>
                {b.name} ({b.bounding_mm.x}×{b.bounding_mm.y}×{b.bounding_mm.z} mm)
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App