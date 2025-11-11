/**
 * SVG rendering for section views (ISO 128-50)
 * 
 * Generates SVG elements for:
 * - Section contours (thick outline)
 * - Hatch patterns (thin lines at 45°)
 * - Section labels (SECTION A-A)
 * - Cutting plane indicators (chain thick line with arrows)
 */

import type { SectionView, SectionContour, HatchLine, CuttingPlane, Point2D } from './sections'
import { LineType, LINE_STYLES } from './lineTypes'

/**
 * Render a complete section view to SVG
 * 
 * @param sectionView - Section view to render
 * @returns SVG group element containing section view
 */
export function renderSectionView(sectionView: SectionView): string {
  const { contours, hatchPattern, position, scale, plane } = sectionView
  
  const elements: string[] = []
  
  // Group for entire section view
  elements.push(`<g class="section-view" data-id="${plane.id}" transform="translate(${position.x}, ${position.y})">`)
  
  // Render each contour
  for (const contour of contours) {
    elements.push(renderSectionContour(contour, hatchPattern, scale))
  }
  
  // Add section label
  elements.push(renderSectionLabel(plane.label, scale))
  
  elements.push('</g>')
  
  return elements.join('\n')
}

/**
 * Render a single section contour with hatch pattern
 * 
 * @param contour - Section contour to render
 * @param hatchPattern - Hatch pattern configuration
 * @param scale - Drawing scale
 * @returns SVG group with contour outline and hatch
 */
export function renderSectionContour(
  contour: SectionContour,
  hatchPattern: any,
  scale: number
): string {
  const elements: string[] = []
  
  // Generate path data for contour
  const pathData = contourToPathData(contour.points, scale)
  
  // Use appropriate line type based on contour type
  const lineType = contour.isOuter ? LineType.VISIBLE_EDGE : LineType.VISIBLE_EDGE
  const style = LINE_STYLES[lineType]
  
  elements.push(`<g class="section-contour">`)
  
  // Draw contour outline (thick line per ISO)
  elements.push(
    `<path d="${pathData}" ` +
    `fill="none" ` +
    `stroke="${style.color}" ` +
    `stroke-width="${style.width}" ` +
    `stroke-linecap="round" ` +
    `stroke-linejoin="round" />`
  )
  
  // TODO: Add hatch pattern rendering here
  // Will be implemented in next step
  
  elements.push(`</g>`)
  
  return elements.join('\n')
}

/**
 * Convert contour points to SVG path data
 * 
 * @param points - Array of 2D points
 * @param scale - Drawing scale
 * @returns SVG path data string
 */
export function contourToPathData(points: Point2D[], scale: number): string {
  if (points.length === 0) return ''
  
  const scaledPoints = points.map(p => ({
    x: p.x * scale,
    y: p.y * scale
  }))
  
  // Start with M (move to first point)
  let pathData = `M ${scaledPoints[0].x.toFixed(2)} ${scaledPoints[0].y.toFixed(2)}`
  
  // Add L (line to) for remaining points
  for (let i = 1; i < scaledPoints.length; i++) {
    pathData += ` L ${scaledPoints[i].x.toFixed(2)} ${scaledPoints[i].y.toFixed(2)}`
  }
  
  // Close path (Z)
  pathData += ' Z'
  
  return pathData
}

/**
 * Render hatch lines for a contour
 * 
 * @param hatchLines - Array of hatch line segments
 * @param scale - Drawing scale
 * @returns SVG group with hatch lines
 */
export function renderHatchLines(hatchLines: HatchLine[], scale: number): string {
  const elements: string[] = []
  
  // Use thin line for hatching per ISO 128-50
  const style = LINE_STYLES[LineType.DIMENSION]
  
  elements.push(`<g class="hatch-pattern">`)
  
  for (const line of hatchLines) {
    const x1 = (line.start.x * scale).toFixed(2)
    const y1 = (line.start.y * scale).toFixed(2)
    const x2 = (line.end.x * scale).toFixed(2)
    const y2 = (line.end.y * scale).toFixed(2)
    
    elements.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
      `stroke="${style.color}" ` +
      `stroke-width="${style.width}" ` +
      `stroke-linecap="butt" />`
    )
  }
  
  elements.push(`</g>`)
  
  return elements.join('\n')
}

/**
 * Render section label (e.g., "SECTION A-A")
 * 
 * @param label - Label text
 * @param scale - Drawing scale
 * @returns SVG text element
 */
export function renderSectionLabel(label: string, scale: number): string {
  // Position label above section view
  const fontSize = 5 * scale  // 5mm text height
  const y = -10 * scale  // 10mm above section
  
  return (
    `<text x="0" y="${y}" ` +
    `font-family="Arial, sans-serif" ` +
    `font-size="${fontSize}" ` +
    `font-weight="bold" ` +
    `text-anchor="middle" ` +
    `fill="black">${label}</text>`
  )
}

/**
 * Render cutting plane indicator in parent view
 * Shows where the section was taken from
 * 
 * @param plane - Cutting plane
 * @param viewBounds - Bounds of parent view
 * @param scale - Drawing scale
 * @returns SVG group with cutting plane line and arrows
 */
export function renderCuttingPlaneIndicator(
  plane: CuttingPlane,
  viewBounds: { minX: number; maxX: number; minY: number; maxY: number },
  scale: number
): string {
  const elements: string[] = []
  
  // Use chain thick line for cutting plane per ISO 128-50
  const style = LINE_STYLES[LineType.CENTER_LINE]
  
  elements.push(`<g class="cutting-plane" data-id="${plane.id}">`)
  
  // Determine cutting plane position in parent view
  // For midplane section at origin, draw line through center of view
  const centerX = (viewBounds.minX + viewBounds.maxX) / 2
  const centerY = (viewBounds.minY + viewBounds.maxY) / 2
  
  // Draw horizontal or vertical line based on plane normal
  let x1, y1, x2, y2
  
  if (Math.abs(plane.normal.x) > 0.5) {
    // Vertical line (X-axis normal)
    x1 = x2 = centerX * scale
    y1 = viewBounds.minY * scale
    y2 = viewBounds.maxY * scale
  } else if (Math.abs(plane.normal.y) > 0.5) {
    // Horizontal line (Y-axis normal)
    y1 = y2 = centerY * scale
    x1 = viewBounds.minX * scale
    x2 = viewBounds.maxX * scale
  } else {
    // Z-axis normal - horizontal line
    y1 = y2 = centerY * scale
    x1 = viewBounds.minX * scale
    x2 = viewBounds.maxX * scale
  }
  
  // Draw cutting plane line (thicker chain line)
  elements.push(
    `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" ` +
    `x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ` +
    `stroke="${style.color}" ` +
    `stroke-width="${style.width * 2}" ` +  // Thick chain line
    `stroke-dasharray="${style.dasharray}" ` +
    `stroke-linecap="butt" />`
  )
  
  // Add arrowheads at ends pointing in viewing direction
  const arrowSize = 4 * scale
  elements.push(renderCuttingPlaneArrow(x1, y1, plane, arrowSize, 'start'))
  elements.push(renderCuttingPlaneArrow(x2, y2, plane, arrowSize, 'end'))
  
  // Add labels at arrow ends
  elements.push(renderCuttingPlaneLabel(x1, y1, plane.id, scale, 'start'))
  elements.push(renderCuttingPlaneLabel(x2, y2, plane.id, scale, 'end'))
  
  elements.push(`</g>`)
  
  return elements.join('\n')
}

/**
 * Render arrow for cutting plane indicator
 * 
 * @param x - Arrow position X
 * @param y - Arrow position Y
 * @param plane - Cutting plane
 * @param size - Arrow size
 * @param position - 'start' or 'end' of line
 * @returns SVG polygon for arrow
 */
function renderCuttingPlaneArrow(
  x: number,
  y: number,
  plane: CuttingPlane,
  size: number,
  position: 'start' | 'end'
): string {
  // Arrow points perpendicular to cutting plane line
  // Direction depends on view direction
  
  // Simplified: arrow points up or right depending on plane orientation
  let points: string
  
  if (Math.abs(plane.normal.x) > 0.5) {
    // Vertical line, arrow points right or left
    const dir = position === 'start' ? -1 : 1
    points = `${x},${y} ${x + dir * size},${y - size / 2} ${x + dir * size},${y + size / 2}`
  } else {
    // Horizontal line, arrow points up or down
    const dir = position === 'start' ? -1 : 1
    points = `${x},${y} ${x - size / 2},${y + dir * size} ${x + size / 2},${y + dir * size}`
  }
  
  return `<polygon points="${points}" fill="black" />`
}

/**
 * Render label for cutting plane (letter A, B, C, etc.)
 * 
 * @param x - Label position X
 * @param y - Label position Y
 * @param label - Label character
 * @param scale - Drawing scale
 * @param position - 'start' or 'end' of line
 * @returns SVG text element
 */
function renderCuttingPlaneLabel(
  x: number,
  y: number,
  label: string,
  scale: number,
  position: 'start' | 'end'
): string {
  const fontSize = 5 * scale
  const offset = 6 * scale
  
  // Offset label from arrow
  const labelX = position === 'start' ? x - offset : x + offset
  const labelY = y
  
  return (
    `<text x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" ` +
    `font-family="Arial, sans-serif" ` +
    `font-size="${fontSize}" ` +
    `font-weight="bold" ` +
    `text-anchor="middle" ` +
    `dominant-baseline="middle" ` +
    `fill="black">${label}</text>`
  )
}
