/**
 * Center line generation for cylindrical and conical features per ISO 128-24.
 * Center lines use chain line pattern (long-short-long) and extend beyond feature boundaries.
 */
import type { PartRecipe, Primitive, CylinderParams, ConeParams } from '../types/part'
import { LineType } from './lineTypes'

export interface CenterLine {
  type: 'axis' | 'cross'
  lineType: LineType
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Configuration for center line generation
 */
export interface CenterLineConfig {
  /** Extension beyond feature boundary in mm */
  extension: number
  /** Minimum feature diameter to show center lines (mm) */
  minDiameter: number
  /** Cross line length for circular features (mm) */
  crossLength: number
}

export const DEFAULT_CENTER_LINE_CONFIG: CenterLineConfig = {
  extension: 5, // Extend 5mm beyond feature
  minDiameter: 10, // Only show center lines for features ≥10mm diameter
  crossLength: 20, // Cross lines extend 20mm in each direction
}

/**
 * Extract center lines from a recipe for a specific 2D projection view
 * @param recipe - The part recipe to analyze
 * @param view - The projection view ('front', 'top', 'right')
 * @param config - Center line generation configuration
 * @returns Array of center lines to render
 */
export function extractCenterLines(
  recipe: PartRecipe,
  view: 'front' | 'top' | 'right',
  config: CenterLineConfig = DEFAULT_CENTER_LINE_CONFIG
): CenterLine[] {
  const centerLines: CenterLine[] = []

  // Find all cylindrical and conical primitives
  for (const primitive of recipe.primitives) {
    if (primitive.kind === 'cylinder') {
      const lines = extractCylinderCenterLines(primitive, view, config)
      centerLines.push(...lines)
    } else if (primitive.kind === 'cone') {
      const lines = extractConeCenterLines(primitive, view, config)
      centerLines.push(...lines)
    }
  }

  return centerLines
}

/**
 * Extract center lines for a cylinder primitive
 */
function extractCylinderCenterLines(
  primitive: Primitive,
  view: 'front' | 'top' | 'right',
  config: CenterLineConfig
): CenterLine[] {
  const params = primitive.params as CylinderParams
  const axis = params.axis || 'z'
  const radius = params.radius
  const height = params.height
  const pos = primitive.transform?.position || { x: 0, y: 0, z: 0 }

  // Skip small features
  if (radius * 2 < config.minDiameter) {
    return []
  }

  const lines: CenterLine[] = []

  // Determine which axes are visible in this view
  // Front view: X-Y plane (looking along -Z)
  // Top view: X-Z plane (looking along +Y, rotated to -Z)
  // Right view: Y-Z plane (looking along -X, rotated to -Z)

  switch (view) {
    case 'front':
      if (axis === 'z') {
        // Cylinder axis perpendicular to view - shows as circle
        // Add crossed center lines
        lines.push(
          // Horizontal center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x - config.crossLength / 2,
            y1: pos.y,
            x2: pos.x + config.crossLength / 2,
            y2: pos.y,
          },
          // Vertical center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x,
            y1: pos.y - config.crossLength / 2,
            x2: pos.x,
            y2: pos.y + config.crossLength / 2,
          }
        )
      } else if (axis === 'x') {
        // Cylinder axis horizontal - shows as rectangle
        // Add horizontal axis line extending beyond edges
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x - height / 2 - config.extension,
          y1: pos.y,
          x2: pos.x + height / 2 + config.extension,
          y2: pos.y,
        })
      } else if (axis === 'y') {
        // Cylinder axis vertical - shows as rectangle
        // Add vertical axis line extending beyond edges
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x,
          y1: pos.y - height / 2 - config.extension,
          x2: pos.x,
          y2: pos.y + height / 2 + config.extension,
        })
      }
      break

    case 'top':
      // Top view: looking along +Y (down), X-Z plane
      if (axis === 'y') {
        // Cylinder axis perpendicular to view - shows as circle
        lines.push(
          // Horizontal (X) center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x - config.crossLength / 2,
            y1: pos.z,
            x2: pos.x + config.crossLength / 2,
            y2: pos.z,
          },
          // Vertical (Z) center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x,
            y1: pos.z - config.crossLength / 2,
            x2: pos.x,
            y2: pos.z + config.crossLength / 2,
          }
        )
      } else if (axis === 'x') {
        // Cylinder axis horizontal - shows as rectangle
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x - height / 2 - config.extension,
          y1: pos.z,
          x2: pos.x + height / 2 + config.extension,
          y2: pos.z,
        })
      } else if (axis === 'z') {
        // Cylinder axis vertical in top view - shows as rectangle
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x,
          y1: pos.z - height / 2 - config.extension,
          x2: pos.x,
          y2: pos.z + height / 2 + config.extension,
        })
      }
      break

    case 'right':
      // Right view: looking along -X (from right), Y-Z plane
      if (axis === 'x') {
        // Cylinder axis perpendicular to view - shows as circle
        lines.push(
          // Horizontal (Y) center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.y - config.crossLength / 2,
            y1: pos.z,
            x2: pos.y + config.crossLength / 2,
            y2: pos.z,
          },
          // Vertical (Z) center line
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.y,
            y1: pos.z - config.crossLength / 2,
            x2: pos.y,
            y2: pos.z + config.crossLength / 2,
          }
        )
      } else if (axis === 'y') {
        // Cylinder axis horizontal - shows as rectangle
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.y - height / 2 - config.extension,
          y1: pos.z,
          x2: pos.y + height / 2 + config.extension,
          y2: pos.z,
        })
      } else if (axis === 'z') {
        // Cylinder axis vertical - shows as rectangle
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.y,
          y1: pos.z - height / 2 - config.extension,
          x2: pos.y,
          y2: pos.z + height / 2 + config.extension,
        })
      }
      break
  }

  return lines
}

/**
 * Extract center lines for a cone/frustum primitive
 */
function extractConeCenterLines(
  primitive: Primitive,
  view: 'front' | 'top' | 'right',
  config: CenterLineConfig
): CenterLine[] {
  const params = primitive.params as ConeParams
  const axis = params.axis || 'z'
  const maxRadius = Math.max(params.radiusTop, params.radiusBottom)
  const height = params.height
  const pos = primitive.transform?.position || { x: 0, y: 0, z: 0 }

  // Skip small features
  if (maxRadius * 2 < config.minDiameter) {
    return []
  }

  const lines: CenterLine[] = []

  // Cone center lines follow same logic as cylinders
  switch (view) {
    case 'front':
      if (axis === 'z') {
        // Cone axis perpendicular - shows as circle (or tapered if visible)
        lines.push(
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x - config.crossLength / 2,
            y1: pos.y,
            x2: pos.x + config.crossLength / 2,
            y2: pos.y,
          },
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x,
            y1: pos.y - config.crossLength / 2,
            x2: pos.x,
            y2: pos.y + config.crossLength / 2,
          }
        )
      } else if (axis === 'x') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x - height / 2 - config.extension,
          y1: pos.y,
          x2: pos.x + height / 2 + config.extension,
          y2: pos.y,
        })
      } else if (axis === 'y') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x,
          y1: pos.y - height / 2 - config.extension,
          x2: pos.x,
          y2: pos.y + height / 2 + config.extension,
        })
      }
      break

    case 'top':
      if (axis === 'y') {
        lines.push(
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x - config.crossLength / 2,
            y1: pos.z,
            x2: pos.x + config.crossLength / 2,
            y2: pos.z,
          },
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.x,
            y1: pos.z - config.crossLength / 2,
            x2: pos.x,
            y2: pos.z + config.crossLength / 2,
          }
        )
      } else if (axis === 'x') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x - height / 2 - config.extension,
          y1: pos.z,
          x2: pos.x + height / 2 + config.extension,
          y2: pos.z,
        })
      } else if (axis === 'z') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.x,
          y1: pos.z - height / 2 - config.extension,
          x2: pos.x,
          y2: pos.z + height / 2 + config.extension,
        })
      }
      break

    case 'right':
      if (axis === 'x') {
        lines.push(
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.y - config.crossLength / 2,
            y1: pos.z,
            x2: pos.y + config.crossLength / 2,
            y2: pos.z,
          },
          {
            type: 'cross',
            lineType: LineType.CENTER_LINE,
            x1: pos.y,
            y1: pos.z - config.crossLength / 2,
            x2: pos.y,
            y2: pos.z + config.crossLength / 2,
          }
        )
      } else if (axis === 'y') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.y - height / 2 - config.extension,
          y1: pos.z,
          x2: pos.y + height / 2 + config.extension,
          y2: pos.z,
        })
      } else if (axis === 'z') {
        lines.push({
          type: 'axis',
          lineType: LineType.CENTER_LINE,
          x1: pos.y,
          y1: pos.z - height / 2 - config.extension,
          x2: pos.y,
          y2: pos.z + height / 2 + config.extension,
        })
      }
      break
  }

  return lines
}

/**
 * Render center lines to SVG path elements
 * @param centerLines - Array of center lines to render
 * @param scale - Scale factor (SVG units per mm)
 * @returns SVG path elements as string
 */
export function renderCenterLines(centerLines: CenterLine[], scale: number): string {
  if (centerLines.length === 0) return ''

  const paths: string[] = []

  for (const line of centerLines) {
    const x1 = line.x1 * scale
    const y1 = -line.y1 * scale // Flip Y for SVG coordinates
    const x2 = line.x2 * scale
    const y2 = -line.y2 * scale

    paths.push(
      `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}" class="${line.lineType}" />`
    )
  }

  return paths.join('\n    ')
}
