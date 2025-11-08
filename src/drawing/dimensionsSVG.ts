/**
 * SVG rendering for ISO-compliant dimensions
 * 
 * Renders dimension components according to ISO 128-24 and ISO 129-1:
 * - Dimension lines (thin continuous)
 * - Extension lines (thin continuous with gaps)
 * - Arrowheads (closed, filled)
 * - Dimension text (3.5mm height, proper formatting)
 * - Leader lines for radial dimensions
 * - Center marks for circular features
 * 
 * @see docs/specs/iso-drawing-standards.md
 */

import type {
  Dimension,
  LinearDimension,
  RadialDimension,
  AngularDimension,
  Arrowhead,
  ExtensionLine,
  Point2D
} from './dimensions'

// ============================================================================
// SVG Generation
// ============================================================================

/**
 * Generate SVG group element containing all dimensions for a view
 */
export function renderDimensions(
  dimensions: Dimension[],
  view: 'front' | 'top' | 'right',
  scale: number = 1
): string {
  const viewDimensions = dimensions.filter(d => d.view === view)
  
  if (viewDimensions.length === 0) {
    return ''
  }
  
  const svgElements: string[] = []
  
  for (const dimension of viewDimensions) {
    switch (dimension.type) {
      case 'linear':
        svgElements.push(renderLinearDimension(dimension as LinearDimension, scale))
        break
      case 'radial':
        svgElements.push(renderRadialDimension(dimension as RadialDimension, scale))
        break
      case 'angular':
        svgElements.push(renderAngularDimension(dimension as AngularDimension, scale))
        break
    }
  }
  
  return `<g class="dimensions" data-view="${view}">\n${svgElements.join('\n')}\n</g>`
}

/**
 * Render a linear dimension with extension lines, dimension line, and arrowheads
 */
function renderLinearDimension(dimension: LinearDimension, scale: number): string {
  const parts: string[] = []
  
  // Extension lines (thin continuous, with gaps)
  for (const extLine of dimension.extensionLines) {
    parts.push(renderExtensionLine(extLine, scale))
  }
  
  // Dimension line (thin continuous)
  parts.push(
    `<line x1="${dimension.dimensionLine.start.x * scale}" ` +
    `y1="${dimension.dimensionLine.start.y * scale}" ` +
    `x2="${dimension.dimensionLine.end.x * scale}" ` +
    `y2="${dimension.dimensionLine.end.y * scale}" ` +
    `class="dimension-line" stroke="black" stroke-width="0.35" />`
  )
  
  // Arrowheads (closed, filled)
  for (const arrow of dimension.arrowheads) {
    parts.push(renderArrowhead(arrow, scale))
  }
  
  // Dimension text
  parts.push(renderDimensionText(dimension.position, dimension.text, dimension.orientation, scale))
  
  return `<g class="linear-dimension" data-id="${dimension.id}">\n${parts.join('\n')}\n</g>`
}

/**
 * Render a radial dimension with leader line and optional center mark
 */
function renderRadialDimension(dimension: RadialDimension, scale: number): string {
  const parts: string[] = []
  
  // Leader line (thin continuous)
  parts.push(
    `<line x1="${dimension.leaderLine.start.x * scale}" ` +
    `y1="${dimension.leaderLine.start.y * scale}" ` +
    `x2="${dimension.leaderLine.end.x * scale}" ` +
    `y2="${dimension.leaderLine.end.y * scale}" ` +
    `class="leader-line" stroke="black" stroke-width="0.35" />`
  )
  
  // Center mark (cross) if requested
  if (dimension.showCenter) {
    parts.push(renderCenterMark(dimension.center, dimension.radius, scale))
  }
  
  // Dimension text (at end of leader line)
  parts.push(renderDimensionText(dimension.position, dimension.text, 'horizontal', scale))
  
  return `<g class="radial-dimension" data-id="${dimension.id}" data-subtype="${dimension.subtype}">\n${parts.join('\n')}\n</g>`
}

/**
 * Render an angular dimension (arc with arrowheads)
 */
function renderAngularDimension(dimension: AngularDimension, scale: number): string {
  const parts: string[] = []
  
  // Dimension arc (thin continuous)
  const arc = dimension.arc
  const startX = arc.center.x + arc.radius * Math.cos(arc.startAngle)
  const startY = arc.center.y + arc.radius * Math.sin(arc.startAngle)
  const endX = arc.center.x + arc.radius * Math.cos(arc.endAngle)
  const endY = arc.center.y + arc.radius * Math.sin(arc.endAngle)
  
  const largeArc = Math.abs(arc.endAngle - arc.startAngle) > Math.PI ? 1 : 0
  
  parts.push(
    `<path d="M ${startX * scale} ${startY * scale} ` +
    `A ${arc.radius * scale} ${arc.radius * scale} 0 ${largeArc} 1 ${endX * scale} ${endY * scale}" ` +
    `class="dimension-arc" stroke="black" stroke-width="0.35" fill="none" />`
  )
  
  // Arrowheads at both ends
  for (const arrow of dimension.arrowheads) {
    parts.push(renderArrowhead(arrow, scale))
  }
  
  // Dimension text
  parts.push(renderDimensionText(dimension.position, dimension.text, 'horizontal', scale))
  
  return `<g class="angular-dimension" data-id="${dimension.id}">\n${parts.join('\n')}\n</g>`
}

// ============================================================================
// Component Rendering
// ============================================================================

/**
 * Render an extension line with proper gap from feature
 */
function renderExtensionLine(extLine: ExtensionLine, scale: number): string {
  // Calculate direction vector
  const dx = extLine.end.x - extLine.start.x
  const dy = extLine.end.y - extLine.start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / length
  const ny = dy / length
  
  // Start point with gap
  const startX = (extLine.start.x + nx * extLine.gap) * scale
  const startY = (extLine.start.y + ny * extLine.gap) * scale
  
  return (
    `<line x1="${startX}" y1="${startY}" ` +
    `x2="${extLine.end.x * scale}" y2="${extLine.end.y * scale}" ` +
    `class="extension-line" stroke="black" stroke-width="0.35" />`
  )
}

/**
 * Render a closed, filled arrowhead
 * ISO standard: 3mm long, 1mm wide (3:1 ratio)
 */
function renderArrowhead(arrow: Arrowhead, scale: number): string {
  // Calculate three points of the arrowhead triangle
  const tipX = arrow.position.x
  const tipY = arrow.position.y
  
  // Back point (at base of arrow)
  const backX = tipX - arrow.length * Math.cos(arrow.angle)
  const backY = tipY - arrow.length * Math.sin(arrow.angle)
  
  // Side points (perpendicular to arrow direction)
  const perpAngle = arrow.angle + Math.PI / 2
  const halfWidth = arrow.width / 2
  
  const side1X = backX + halfWidth * Math.cos(perpAngle)
  const side1Y = backY + halfWidth * Math.sin(perpAngle)
  const side2X = backX - halfWidth * Math.cos(perpAngle)
  const side2Y = backY - halfWidth * Math.sin(perpAngle)
  
  // Create filled polygon
  return (
    `<polygon points="${tipX * scale},${tipY * scale} ` +
    `${side1X * scale},${side1Y * scale} ` +
    `${side2X * scale},${side2Y * scale}" ` +
    `class="arrowhead" fill="black" />`
  )
}

/**
 * Render dimension text with proper formatting
 * ISO 3098-2: Sans-serif font, 3.5mm height
 */
function renderDimensionText(
  position: Point2D,
  text: string,
  orientation: string,
  scale: number
): string {
  // Text positioning
  const x = position.x * scale
  const y = position.y * scale
  
  // Text styling (ISO 3098-2)
  const fontSize = 3.5 * scale  // 3.5mm at 1:1 scale
  
  // Rotation for vertical dimensions (optional)
  let transform = ''
  if (orientation === 'vertical') {
    transform = ` transform="rotate(-90 ${x} ${y})"`
  }
  
  return (
    `<text x="${x}" y="${y}" ` +
    `class="dimension-text" ` +
    `font-family="Arial, sans-serif" ` +
    `font-size="${fontSize}" ` +
    `text-anchor="middle" ` +
    `dominant-baseline="middle" ` +
    `fill="black"${transform}>${text}</text>`
  )
}

/**
 * Render center mark for circular features
 * ISO standard: thin crossed lines extending slightly beyond circle
 */
function renderCenterMark(center: Point2D, radius: number, scale: number): string {
  const markLength = Math.min(radius * 0.3, 3)  // 30% of radius or 3mm max
  const cx = center.x * scale
  const cy = center.y * scale
  const len = markLength * scale
  
  return (
    `<g class="center-mark">` +
    `<line x1="${cx - len}" y1="${cy}" x2="${cx + len}" y2="${cy}" ` +
    `stroke="black" stroke-width="0.35" stroke-dasharray="8,2,2,2" />` +
    `<line x1="${cx}" y1="${cy - len}" x2="${cx}" y2="${cy + len}" ` +
    `stroke="black" stroke-width="0.35" stroke-dasharray="8,2,2,2" />` +
    `</g>`
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert dimension to SVG string (main export function)
 */
export function dimensionToSVG(dimension: Dimension, scale: number = 1): string {
  switch (dimension.type) {
    case 'linear':
      return renderLinearDimension(dimension as LinearDimension, scale)
    case 'radial':
      return renderRadialDimension(dimension as RadialDimension, scale)
    case 'angular':
      return renderAngularDimension(dimension as AngularDimension, scale)
    default:
      return ''
  }
}

/**
 * Calculate total bounds of all dimensions (for layout purposes)
 */
export function getDimensionsBounds(dimensions: Dimension[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (dimensions.length === 0) return null
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  for (const dim of dimensions) {
    // Update bounds based on dimension position
    // TODO: Include extension lines, dimension lines, etc. for accurate bounds
    minX = Math.min(minX, dim.position.x - 20)
    minY = Math.min(minY, dim.position.y - 5)
    maxX = Math.max(maxX, dim.position.x + 20)
    maxY = Math.max(maxY, dim.position.y + 5)
  }
  
  return { minX, minY, maxX, maxY }
}
