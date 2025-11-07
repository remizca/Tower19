import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useEffect, useRef, useState } from 'react'
import { generateBeginnerPartRecipe } from './generators/beginner'
import type PartRecipe from './types/part'
import { validatePartRecipe } from './schema/validate'
import migrateLegacyBeginnerToPartRecipe from './storage/migrate'
import { Geometry, Base, Subtraction, Addition } from '@react-three/csg'

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

function axisRotation(axis: 'x' | 'y' | 'z' | undefined): [number, number, number] {
  if (axis === 'x') return [0, 0, Math.PI / 2]
  if (axis === 'y') return [Math.PI / 2, 0, 0]
  return [0, 0, 0]
}

function toVec3mm(vec?: { x: number; y: number; z: number }): [number, number, number] {
  if (!vec) return [0, 0, 0]
  return [vec.x / 10, vec.y / 10, vec.z / 10]
}

function ModelRenderer({ recipe }: { recipe: PartRecipe | null }) {
  if (!recipe) return null

  // Find a base primitive (prefer a box, otherwise first primitive)
  const base = recipe.primitives.find((p) => p.kind === 'box') || recipe.primitives[0]
  if (!base) return null

  // For operations
  const subtractOps = recipe.operations.filter((op) => op.op === 'subtract')
  const unionOps = recipe.operations.filter((op) => op.op === 'union')

  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <Geometry>
          <Base>
            {base.kind === 'box' && (
              <>
                {(() => {
                  const p: any = base.params
                  const width = (p.width || 100) / 10
                  const depth = (p.depth || 50) / 10
                  const height = (p.height || 25) / 10
                  const pos = toVec3mm(base.transform?.position)
                  return (
                    <group position={pos}>
                      <boxGeometry args={[width, depth, height]} />
                      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                    </group>
                  )
                })()}
              </>
            )}
            {base.kind === 'cylinder' && (
              <>
                {(() => {
                  const p: any = base.params
                  const r = (p.radius || 20) / 10
                  const h = (p.height || 50) / 10
                  const rot = axisRotation(p.axis)
                  const pos = toVec3mm(base.transform?.position)
                  return (
                    <group position={pos} rotation={rot as any}>
                      <cylinderGeometry args={[r, r, h, 32]} />
                      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                    </group>
                  )
                })()}
              </>
            )}
            {base.kind === 'sphere' && (
              <>
                {(() => {
                  const p: any = base.params
                  const r = (p.radius || 20) / 10
                  const pos = toVec3mm(base.transform?.position)
                  return (
                    <group position={pos}>
                      <sphereGeometry args={[r, 32, 16]} />
                      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                    </group>
                  )
                })()}
              </>
            )}
            {base.kind === 'cone' && (
              <>
                {(() => {
                  const p: any = base.params
                  const rt = (p.radiusTop || 0) / 10
                  const rb = (p.radiusBottom || 20) / 10
                  const h = (p.height || 50) / 10
                  const rot = axisRotation(p.axis)
                  const pos = toVec3mm(base.transform?.position)
                  return (
                    <group position={pos} rotation={rot as any}>
                      <cylinderGeometry args={[rt, rb, h, 32]} />
                      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                    </group>
                  )
                })()}
              </>
            )}
            {base.kind === 'torus' && (
              <>
                {(() => {
                  const p: any = base.params
                  const R = (p.majorRadius || 40) / 10
                  const r = (p.tubeRadius || 8) / 10
                  const rot = axisRotation(p.axis)
                  const pos = toVec3mm(base.transform?.position)
                  return (
                    <group position={pos} rotation={rot as any}>
                      <torusGeometry args={[R, r, 24, 48]} />
                      <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
                    </group>
                  )
                })()}
              </>
            )}
          </Base>

          {unionOps.map((op) => {
            const tool = recipe.primitives.find((p) => p.id === op.toolId)
            if (!tool) return null
            const pos = toVec3mm(tool.transform?.position)
            if (tool.kind === 'box') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={pos as any}>
                  <boxGeometry args={[(p.width || 20) / 10, (p.depth || 20) / 10, (p.height || 20) / 10]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'cylinder') {
              const p: any = tool.params
              const rot = axisRotation(p.axis)
              return (
                <Addition key={op.id} position={pos as any} rotation={rot as any}>
                  <cylinderGeometry args={[(p.radius || 10) / 10, (p.radius || 10) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'sphere') {
              const p: any = tool.params
              return (
                <Addition key={op.id} position={pos as any}>
                  <sphereGeometry args={[(p.radius || 10) / 10, 32, 16]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'cone') {
              const p: any = tool.params
              const rot = axisRotation(p.axis)
              return (
                <Addition key={op.id} position={pos as any} rotation={rot as any}>
                  <cylinderGeometry args={[(p.radiusTop || 0) / 10, (p.radiusBottom || 10) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#8888cc" />
                </Addition>
              )
            }
            if (tool.kind === 'torus') {
              const p: any = tool.params
              const rot = axisRotation(p.axis)
              return (
                <Addition key={op.id} position={pos as any} rotation={rot as any}>
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

            const pos = toVec3mm(tool.transform?.position)
            if (tool.kind === 'cylinder') {
              const p: any = tool.params
              const r = (p.radius || 5) / 10
              const h = (p.height || Math.max(recipe.bounding_mm.x, recipe.bounding_mm.y, recipe.bounding_mm.z) * 2) / 10
              const rot = axisRotation(p.axis)
              return (
                <Subtraction key={op.id} position={pos as any} rotation={rot as any}>
                  <cylinderGeometry args={[r, r, h, 32]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'sphere') {
              const p: any = tool.params
              return (
                <Subtraction key={op.id} position={pos as any}>
                  <sphereGeometry args={[(p.radius || 5) / 10, 32, 16]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'cone') {
              const p: any = tool.params
              const rot = axisRotation(p.axis)
              return (
                <Subtraction key={op.id} position={pos as any} rotation={rot as any}>
                  <cylinderGeometry args={[(p.radiusTop || 0) / 10, (p.radiusBottom || 8) / 10, (p.height || 20) / 10, 32]} />
                  <meshStandardMaterial color="#333" />
                </Subtraction>
              )
            }
            if (tool.kind === 'torus') {
              const p: any = tool.params
              const rot = axisRotation(p.axis)
              return (
                <Subtraction key={op.id} position={pos as any} rotation={rot as any}>
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
  const [seed, setSeed] = useState<number>(() => Date.now())
  const [recipe, setRecipe] = useState<PartRecipe | null>(() => generateBeginnerPartRecipe(seed))
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
      const next = generateBeginnerPartRecipe(nextSeed)
      setSeed(nextSeed)
      setRecipe(next)
      // Debug marker for deployed builds
      console.log('[generate] seed', nextSeed, 'name', next.name)
    } catch (err) {
      console.error('[generate] failed', err)
    }
  }

  const saveBookmark = () => {
    if (!recipe) return
    const next = [recipe, ...bookmarks].slice(0, 50)
    setBookmarks(next)
    localStorage.setItem('tower19:bookmarks', JSON.stringify(next))
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', zIndex: 10, left: 12, top: 12, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <button onClick={generate}>Generate</button>
        <select defaultValue="Beginner" style={{ padding: '4px 8px' }} disabled>
          <option>Beginner</option>
        </select>
        <button onClick={saveBookmark}>Save / Bookmark</button>
        <span style={{ alignSelf: 'center', opacity: 0.7 }}>seed: {seed}</span>
      </div>
      <Canvas>
        <ambientLight intensity={0.6} />
        <pointLight position={[100, 100, 100]} />
        <ModelRenderer recipe={recipe} />
        <Controls />
      </Canvas>

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