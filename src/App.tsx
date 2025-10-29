import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useEffect, useRef, useState } from 'react'
import { generateBeginner, type BeginnerRecipe } from './generators/beginner'

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

function ModelRenderer({ recipe }: { recipe: BeginnerRecipe | null }) {
  if (!recipe) return null
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <boxGeometry args={[recipe.bounding_mm.x / 10, recipe.bounding_mm.y / 10, recipe.bounding_mm.z / 10]} />
        <meshStandardMaterial color="#8888cc" metalness={0.2} roughness={0.6} />
      </mesh>
      {recipe.holes.map((h, idx) => (
        <mesh key={idx} position={[h.x / 10, h.y / 10, h.z / 10]} rotation={h.axis === 'x' ? [0, 0, Math.PI / 2] : h.axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          <cylinderGeometry args={[h.r / 10, h.r / 10, Math.max(recipe.bounding_mm.x, recipe.bounding_mm.y, recipe.bounding_mm.z) / 5, 32]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      ))}
    </group>
  )
}

function App() {
  const [recipe, setRecipe] = useState<BeginnerRecipe | null>(() => generateBeginner(Date.now()))
  const [bookmarks, setBookmarks] = useState<BeginnerRecipe[]>(() => {
    try {
      const raw = localStorage.getItem('tower19:bookmarks')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  const generate = () => setRecipe(generateBeginner(Date.now()))

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