import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useEffect, useRef, useState } from 'react'
import { generateBeginnerPartRecipe } from './generators/beginner'
import type PartRecipe from './types/part'
import { validatePartRecipe } from './schema/validate'
import migrateLegacyBeginnerToPartRecipe from './storage/migrate'
import { Geometry, Base, Subtraction } from '@react-three/csg'

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

function ModelRenderer({ recipe }: { recipe: PartRecipe | null }) {
  if (!recipe) return null

  // Find a base primitive (box) or fallback to the first primitive
  const base = recipe.primitives.find((p) => p.kind === 'box') || recipe.primitives[0]
  if (!base) return null

  // Compute base box dims
  const boxParams: any = base.params
  const width = (boxParams.width || 100) / 10
  const depth = (boxParams.depth || 50) / 10
  const height = (boxParams.height || 25) / 10

  // For each subtract operation, find its tool primitive
  const subtractOps = recipe.operations.filter((op) => op.op === 'subtract')

  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <Geometry>
          <Base>
            <boxGeometry args={[width, depth, height]} />
            <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
          </Base>

          {subtractOps.map((op) => {
            const tool = recipe.primitives.find((p) => p.id === op.toolId)
            if (!tool) return null

            if (tool.kind === 'cylinder') {
              const params: any = tool.params
              const axis = params.axis || 'z'
              const r = (params.radius || 5) / 10
              const h = (params.height || Math.max(recipe.bounding_mm.x, recipe.bounding_mm.y, recipe.bounding_mm.z) * 2) / 10
              const pos = tool.transform?.position ? [tool.transform.position.x / 10, tool.transform.position.y / 10, tool.transform.position.z / 10] : [0, 0, 0]
              const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
              return (
                <Subtraction key={op.id} position={pos as any} rotation={rot as any}>
                  <cylinderGeometry args={[r, r, h, 32]} />
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
  const [recipe, setRecipe] = useState<PartRecipe | null>(() => generateBeginnerPartRecipe(Date.now()))
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

  const generate = () => setRecipe(generateBeginnerPartRecipe(Date.now()))

  const saveBookmark = () => {
    if (!recipe) return
    const next = [recipe, ...bookmarks].slice(0, 50)
    setBookmarks(next)
    localStorage.setItem('tower19:bookmarks', JSON.stringify(next))
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', zIndex: 10, left: 12, top: 12, display: 'flex', gap: 8 }}>
        <button onClick={generate}>Generate</button>
        <select defaultValue="Beginner" style={{ padding: '4px 8px' }} disabled>
          <option>Beginner</option>
        </select>
        <button onClick={saveBookmark}>Save / Bookmark</button>
      </div>
      <Canvas>
        <ambientLight intensity={0.6} />
        <pointLight position={[100, 100, 100]} />
        <ModelRenderer recipe={recipe} />
        <Controls />
      </Canvas>

      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10, background: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 6, color: '#fff' }}>
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