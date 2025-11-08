/**
 * ISO 128-24 compliant line types and weights for engineering drawings.
 * 
 * Line weights:
 * - Thick lines (0.7mm): Outlines, visible edges, cutting plane lines
 * - Thin lines (0.35mm): Dimension lines, extension lines, hatching, center lines
 * 
 * Line patterns:
 * - Continuous (solid): Visible edges, outlines, dimension lines
 * - Dashed: Hidden edges (dash length proportional to line weight)
 * - Chain (center): Axes, center lines, pitch circles
 * - Chain (phantom): Adjacent part outlines, alternate positions
 */

/**
 * Line type enumeration per ISO 128-24.
 * Maps line purpose to its classification.
 */
export enum LineType {
  // Thick continuous lines (0.7mm)
  VISIBLE_EDGE = 'visible-edge',           // Visible outline edges
  CUTTING_PLANE = 'cutting-plane',         // Section plane indication
  
  // Thin continuous lines (0.35mm)
  DIMENSION = 'dimension',                 // Dimension lines
  EXTENSION = 'extension',                 // Extension lines
  LEADER = 'leader',                       // Leader lines for notes/callouts
  HATCHING = 'hatching',                   // Section hatching pattern
  
  // Thin dashed lines (0.35mm, short dashes)
  HIDDEN_EDGE = 'hidden-edge',             // Hidden edges
  
  // Thin chain lines (0.35mm, long-short-long pattern)
  CENTER_LINE = 'center-line',             // Center lines (axes)
  PITCH_CIRCLE = 'pitch-circle',           // Pitch circles for gears/holes
  
  // Thin chain with doubled short dashes (phantom)
  PHANTOM = 'phantom',                     // Adjacent parts, alternate positions
}

/**
 * SVG rendering properties for each line type.
 * All dimensions in mm (will be scaled for SVG rendering).
 */
export interface LineStyle {
  strokeWidth: number      // Line width in mm
  stroke: string          // Color (typically black '#000')
  strokeDasharray: string // SVG dasharray pattern (space-separated values in mm)
  strokeLinecap: 'butt' | 'round' | 'square'
  opacity?: number        // Optional opacity for construction lines
}

/**
 * Standard line styles per ISO 128-24.
 * All measurements in mm (scale as needed for SVG viewBox).
 */
export const LINE_STYLES: Record<LineType, LineStyle> = {
  // === THICK CONTINUOUS LINES (0.7mm) ===
  [LineType.VISIBLE_EDGE]: {
    strokeWidth: 0.7,
    stroke: '#000',
    strokeDasharray: 'none',
    strokeLinecap: 'round'
  },
  
  [LineType.CUTTING_PLANE]: {
    strokeWidth: 0.7,
    stroke: '#000',
    strokeDasharray: 'none', // Will be customized with arrows
    strokeLinecap: 'butt'
  },
  
  // === THIN CONTINUOUS LINES (0.35mm) ===
  [LineType.DIMENSION]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: 'none',
    strokeLinecap: 'butt'
  },
  
  [LineType.EXTENSION]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: 'none',
    strokeLinecap: 'butt'
  },
  
  [LineType.LEADER]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: 'none',
    strokeLinecap: 'butt'
  },
  
  [LineType.HATCHING]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: 'none',
    strokeLinecap: 'butt'
  },
  
  // === THIN DASHED LINES (0.35mm) ===
  // Dash pattern: 3mm dash, 1.5mm space (per ISO 128-24)
  [LineType.HIDDEN_EDGE]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: '3 1.5',
    strokeLinecap: 'butt'
  },
  
  // === THIN CHAIN LINES (0.35mm) ===
  // Pattern: long (8mm) - short (2mm) - long - short
  // Spaces: 2mm between segments
  [LineType.CENTER_LINE]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: '8 2 2 2',
    strokeLinecap: 'butt'
  },
  
  [LineType.PITCH_CIRCLE]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: '8 2 2 2',
    strokeLinecap: 'butt'
  },
  
  // === THIN PHANTOM LINES (0.35mm) ===
  // Pattern: long - short - short - long
  [LineType.PHANTOM]: {
    strokeWidth: 0.35,
    stroke: '#000',
    strokeDasharray: '8 2 2 2 2 2',
    strokeLinecap: 'butt',
    opacity: 0.5
  },
}

/**
 * Convert LineStyle to SVG path attributes string.
 * Scale controls the conversion from mm to SVG units.
 * 
 * @param lineType - Type of line to render
 * @param scale - Scale factor (default 2.0 means 2 SVG units = 1mm)
 * @returns Object with SVG path attributes
 */
export function getLineStyleAttributes(lineType: LineType, scale = 2.0): Record<string, string | number> {
  const style = LINE_STYLES[lineType]
  
  const attrs: Record<string, string | number> = {
    stroke: style.stroke,
    'stroke-width': style.strokeWidth * scale,
    'stroke-linecap': style.strokeLinecap,
    fill: 'none'
  }
  
  // Add dasharray if not continuous line
  if (style.strokeDasharray !== 'none') {
    // Scale dasharray values (space-separated numbers)
    const scaledDashes = style.strokeDasharray
      .split(' ')
      .map(v => parseFloat(v) * scale)
      .join(',')
    attrs['stroke-dasharray'] = scaledDashes
  }
  
  // Add opacity if specified
  if (style.opacity !== undefined) {
    attrs.opacity = style.opacity
  }
  
  return attrs
}

/**
 * Generate CSS class definition for a line type.
 * Used in SVG <style> block.
 * 
 * @param lineType - Type of line
 * @param scale - Scale factor for dimensions
 * @returns CSS rule string
 */
export function generateLineStyleCSS(lineType: LineType, scale = 2.0): string {
  const style = LINE_STYLES[lineType]
  const className = lineType // Use enum value as class name
  
  let css = `  .${className} {\n`
  css += `    fill: none;\n`
  css += `    stroke: ${style.stroke};\n`
  css += `    stroke-width: ${style.strokeWidth * scale};\n`
  css += `    stroke-linecap: ${style.strokeLinecap};\n`
  
  if (style.strokeDasharray !== 'none') {
    const scaledDashes = style.strokeDasharray
      .split(' ')
      .map(v => parseFloat(v) * scale)
      .join(',')
    css += `    stroke-dasharray: ${scaledDashes};\n`
  }
  
  if (style.opacity !== undefined) {
    css += `    opacity: ${style.opacity};\n`
  }
  
  css += `  }\n`
  return css
}

/**
 * Generate CSS for all line types.
 * Use in SVG <defs><style> block.
 */
export function generateAllLineStylesCSS(scale = 2.0): string {
  const allTypes = Object.values(LineType) as LineType[]
  return allTypes.map(type => generateLineStyleCSS(type, scale)).join('\n')
}

/**
 * Helper to determine appropriate line type for an edge based on visibility.
 */
export function getEdgeLineType(isVisible: boolean): LineType {
  return isVisible ? LineType.VISIBLE_EDGE : LineType.HIDDEN_EDGE
}
