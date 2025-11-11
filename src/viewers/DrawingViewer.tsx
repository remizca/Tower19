import { useState, useEffect, useRef } from 'react'
import type PartRecipe from '../types/part'
import { generateDrawing } from '../drawing/svg'
import type { BufferGeometry } from 'three'

interface DrawingViewerProps {
  recipe: PartRecipe
  geometry?: BufferGeometry
  onTimerUpdate?: (seconds: number) => void
}

/**
 * Interactive 2D technical drawing viewer with pan/zoom controls.
 * Displays generated SVG drawings from PartRecipe with optional CSG geometry for accurate section views.
 */
export function DrawingViewer({ recipe, geometry, onTimerUpdate }: DrawingViewerProps) {
  const [svgContent, setSvgContent] = useState<string>('')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Generate SVG drawing
  useEffect(() => {
    try {
      const svg = generateDrawing(recipe, geometry)
      setSvgContent(svg)
    } catch (err) {
      console.error('[DrawingViewer] Failed to generate SVG:', err)
      setSvgContent('')
    }
  }, [recipe, geometry])

  // Timer: start when component mounts, stop on unmount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        onTimerUpdate?.(next)
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [onTimerUpdate])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.1, Math.min(5, prev * delta)))
  }

  // Pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  // Pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  // Pan end
  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Reset view
  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  // Download SVG
  const handleDownload = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipe.name.replace(/\s+/g, '-')}-drawing.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!svgContent) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div>Generating drawing...</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#1a1a1a',
        position: 'relative',
        cursor: isPanning ? 'grabbing' : 'grab'
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 8,
        borderRadius: 6,
        color: '#fff'
      }}>
        <button onClick={handleReset} style={{ padding: '4px 8px' }}>Reset View</button>
        <button onClick={handleDownload} style={{ padding: '4px 8px' }}>Download SVG</button>
        <span style={{ alignSelf: 'center', opacity: 0.8 }}>
          Zoom: {(scale * 100).toFixed(0)}%
        </span>
      </div>

      {/* Timer */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '8px 16px',
        borderRadius: 6,
        color: '#fff',
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: 'monospace'
      }}>
        ⏱️ {formatTime(elapsedSeconds)}
      </div>

      {/* Part info */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: 8,
        borderRadius: 6,
        color: '#fff',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 600 }}>{recipe.name}</div>
        <div style={{ opacity: 0.8 }}>
          {recipe.bounding_mm.x} × {recipe.bounding_mm.y} × {recipe.bounding_mm.z} mm
        </div>
        <div style={{ opacity: 0.6, fontSize: '12px' }}>
          {recipe.primitives.length} primitives, {recipe.operations.length} operations
        </div>
      </div>

      {/* SVG Content */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  )
}
