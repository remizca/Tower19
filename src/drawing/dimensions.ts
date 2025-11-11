/**
 * Dimensioning system for ISO-compliant engineering drawings
 * 
 * Implements ISO 129-1:2018 dimensioning standards:
 * - Linear dimensions (horizontal, vertical, aligned)
 * - Radial dimensions (radius R, diameter Ø)
 * - Angular dimensions
 * - Automatic placement with collision detection
 * 
 * @see docs/specs/iso-drawing-standards.md
 */

import type { PartRecipe } from '../types/part'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 2D point for dimension placement
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Arrowhead at end of dimension line
 * ISO standard: 3mm long, 1mm wide (3:1 ratio)
 */
export interface Arrowhead {
  position: Point2D
  angle: number  // radians, direction the arrow points
  length: number // mm, typically 3
  width: number  // mm, typically 1
}

/**
 * Extension line from feature to dimension line
 * ISO: thin continuous line, 1-2mm gap from feature, 2-3mm overhang
 */
export interface ExtensionLine {
  start: Point2D      // On or near feature
  end: Point2D        // Beyond dimension line
  gap: number         // mm, space from feature (1-2mm)
  overhang: number    // mm, extension beyond dimension line (2-3mm)
}

/**
 * Base dimension interface
 */
export interface Dimension {
  id: string
  type: 'linear' | 'radial' | 'angular'
  value: number           // The measured value
  text: string           // Formatted dimension text (e.g., "50", "Ø20", "R10")
  position: Point2D      // Text position
  view: 'front' | 'top' | 'right'  // Which view this dimension appears in
  priority: number       // For collision resolution (higher = more important)
}

/**
 * Linear dimension (horizontal, vertical, or aligned)
 * ISO 129-1: Dimension line with arrowheads and extension lines
 */
export interface LinearDimension extends Dimension {
  type: 'linear'
  orientation: 'horizontal' | 'vertical' | 'aligned'
  start: Point2D         // First measurement point
  end: Point2D          // Second measurement point
  dimensionLine: {
    start: Point2D
    end: Point2D
    offset: number      // Distance from measured feature (8mm minimum)
  }
  extensionLines: [ExtensionLine, ExtensionLine]
  arrowheads: [Arrowhead, Arrowhead]
}

/**
 * Radial dimension (radius or diameter)
 * ISO 129-1: Leader line from feature to dimension text
 */
export interface RadialDimension extends Dimension {
  type: 'radial'
  subtype: 'radius' | 'diameter'
  center: Point2D        // Center of circular feature
  radius: number         // Radius value
  leaderLine: {
    start: Point2D       // On the circle/arc
    end: Point2D         // At dimension text
  }
  showCenter: boolean    // Whether to show center mark (cross)
}

/**
 * Angular dimension
 * ISO 6410-1: Arc between two lines with arrowheads
 */
export interface AngularDimension extends Dimension {
  type: 'angular'
  vertex: Point2D        // Where the two lines meet
  startAngle: number     // radians
  endAngle: number       // radians
  radius: number         // Radius of dimension arc
  arc: {
    center: Point2D
    radius: number
    startAngle: number
    endAngle: number
  }
  arrowheads: [Arrowhead, Arrowhead]
}

/**
 * Bounding box for collision detection
 */
export interface BoundingBox2D {
  x: number      // Left
  y: number      // Top
  width: number
  height: number
}

/**
 * Configuration for dimension generation
 */
export interface DimensionConfig {
  // Spacing standards (ISO 129-1)
  minOffsetFromOutline: number    // mm, typically 8
  minSpacingBetween: number       // mm, typically 6
  
  // Line weights (ISO 128-24)
  thinLineWidth: number           // mm, typically 0.35
  
  // Arrowhead size (ISO 129-1)
  arrowheadLength: number         // mm, typically 3
  arrowheadWidth: number          // mm, typically 1
  
  // Extension line offsets
  extensionLineGap: number        // mm, typically 2
  extensionLineOverhang: number   // mm, typically 3
  
  // Text formatting
  textHeight: number              // mm, typically 3.5
  decimalPlaces: number           // 0 for integers, 1-2 for decimals
  
  // Feature detection thresholds
  minDimensionValue: number       // mm, don't dimension features < this
  
  // View preferences
  preferredView: 'front' | 'top' | 'right'
}

/**
 * Default ISO-compliant dimension configuration
 */
export const DEFAULT_DIMENSION_CONFIG: DimensionConfig = {
  minOffsetFromOutline: 8,
  minSpacingBetween: 6,
  thinLineWidth: 0.35,
  arrowheadLength: 3,
  arrowheadWidth: 1,
  extensionLineGap: 2,
  extensionLineOverhang: 3,
  textHeight: 3.5,
  decimalPlaces: 1,
  minDimensionValue: 1,
  preferredView: 'front'
}

// ============================================================================
// Dimension Generation
// ============================================================================

/**
 * Generate all dimensions for a part recipe
 * 
 * Strategy:
 * 1. Overall dimensions (bounding box)
 * 2. Feature dimensions (holes, pockets)
 * 3. Spacing dimensions (hole patterns)
 * 4. Optimize placement and resolve collisions
 */
export function generateDimensions(
  recipe: PartRecipe,
  config: DimensionConfig = DEFAULT_DIMENSION_CONFIG
): Dimension[] {
  const dimensions: Dimension[] = []
  
  // 1. Overall bounding box dimensions (highest priority)
  dimensions.push(...generateBoundingBoxDimensions(recipe, config))
  
  // 2. Feature dimensions (holes, bosses)
  dimensions.push(...generateFeatureDimensions(recipe, config))
  
  // 3. Resolve collisions between dimensions (Phase 3.4 - 2D-23)
  const resolved = resolveCollisions(dimensions, config)
  
  return resolved
}

/**
 * Generate dimensions for overall part bounding box
 * Creates horizontal, vertical, and depth dimensions
 */
function generateBoundingBoxDimensions(
  recipe: PartRecipe,
  config: DimensionConfig
): LinearDimension[] {
  const { x: width, y: depth, z: height } = recipe.bounding_mm
  const dimensions: LinearDimension[] = []
  
  // Front view: width (horizontal) and height (vertical)
  // Place horizontal dimension first with standard offset
  dimensions.push(
    createLinearDimension({
      id: 'bbox-width-front',
      view: 'front',
      orientation: 'horizontal',
      value: width,
      start: { x: -width / 2, y: -height / 2 },
      end: { x: width / 2, y: -height / 2 },
      offset: config.minOffsetFromOutline,
      priority: 100,
      config
    })
  )
  
  // Place vertical dimension with larger offset to avoid corner collision
  dimensions.push(
    createLinearDimension({
      id: 'bbox-height-front',
      view: 'front',
      orientation: 'vertical',
      value: height,
      start: { x: width / 2, y: -height / 2 },
      end: { x: width / 2, y: height / 2 },
      offset: config.minOffsetFromOutline + config.minSpacingBetween + 4, // Extra spacing to clear text
      priority: 100,
      config
    })
  )
  
  // Top view: width (horizontal) and depth (vertical)
  dimensions.push(
    createLinearDimension({
      id: 'bbox-width-top',
      view: 'top',
      orientation: 'horizontal',
      value: width,
      start: { x: -width / 2, y: -depth / 2 },
      end: { x: width / 2, y: -depth / 2 },
      offset: config.minOffsetFromOutline,
      priority: 100,
      config
    })
  )
  
  dimensions.push(
    createLinearDimension({
      id: 'bbox-depth-top',
      view: 'top',
      orientation: 'vertical',
      value: depth,
      start: { x: width / 2, y: -depth / 2 },
      end: { x: width / 2, y: depth / 2 },
      offset: config.minOffsetFromOutline + config.minSpacingBetween + 4, // Extra spacing to clear text
      priority: 100,
      config
    })
  )
  
  // Right view: depth (horizontal) and height (vertical)
  dimensions.push(
    createLinearDimension({
      id: 'bbox-depth-right',
      view: 'right',
      orientation: 'horizontal',
      value: depth,
      start: { x: -depth / 2, y: -height / 2 },
      end: { x: depth / 2, y: -height / 2 },
      offset: config.minOffsetFromOutline,
      priority: 100,
      config
    })
  )
  
  dimensions.push(
    createLinearDimension({
      id: 'bbox-height-right',
      view: 'right',
      orientation: 'vertical',
      value: height,
      start: { x: depth / 2, y: -height / 2 },
      end: { x: depth / 2, y: height / 2 },
      offset: config.minOffsetFromOutline + config.minSpacingBetween + 4, // Extra spacing to clear text
      priority: 100,
      config
    })
  )
  
  return dimensions
}

/**
 * Generate dimensions for features (holes, pockets, bosses)
 */
function generateFeatureDimensions(
  recipe: PartRecipe,
  config: DimensionConfig
): Dimension[] {
  const dimensions: Dimension[] = []
  
  // Find cylindrical features (holes, bosses)
  for (const primitive of recipe.primitives) {
    if (primitive.kind === 'cylinder') {
      // Type-safe access to cylinder params
      if (!('radius' in primitive.params)) continue
      
      const radius = primitive.params.radius as number
      const position = primitive.transform?.position || { x: 0, y: 0, z: 0 }
      
      // Skip if too small
      if (radius * 2 < config.minDimensionValue) continue
      
      // Determine which view shows the cylinder as a circle
      const axis = ('axis' in primitive.params ? primitive.params.axis as string : null) || 'y'
      
      // Create diameter dimension
      if (axis === 'z') {
        // Cylinder along Z axis - shows as circle in top view
        dimensions.push(
          createRadialDimension({
            id: `cylinder-${primitive.id}`,
            view: 'top',
            subtype: 'diameter',
            center: { x: position.x, y: position.y },
            radius: radius,
            priority: 80,
            config
          })
        )
      } else if (axis === 'y') {
        // Cylinder along Y axis - shows as circle in front view
        dimensions.push(
          createRadialDimension({
            id: `cylinder-${primitive.id}`,
            view: 'front',
            subtype: 'diameter',
            center: { x: position.x, y: position.z },
            radius: radius,
            priority: 80,
            config
          })
        )
      } else if (axis === 'x') {
        // Cylinder along X axis - shows as circle in right view
        dimensions.push(
          createRadialDimension({
            id: `cylinder-${primitive.id}`,
            view: 'right',
            subtype: 'diameter',
            center: { x: position.y, y: position.z },
            radius: radius,
            priority: 80,
            config
          })
        )
      }
    }
  }
  
  return dimensions
}

// ============================================================================
// Dimension Creation Helpers
// ============================================================================

interface LinearDimensionParams {
  id: string
  view: 'front' | 'top' | 'right'
  orientation: 'horizontal' | 'vertical' | 'aligned'
  value: number
  start: Point2D
  end: Point2D
  offset: number
  priority: number
  config: DimensionConfig
}

/**
 * Create a linear dimension with all required components
 */
function createLinearDimension(params: LinearDimensionParams): LinearDimension {
  const { id, view, orientation, value, start, end, offset, priority, config } = params
  
  // Calculate dimension line position (offset from feature)
  let dimensionLineStart: Point2D
  let dimensionLineEnd: Point2D
  
  if (orientation === 'horizontal') {
    dimensionLineStart = { x: start.x, y: start.y - offset }
    dimensionLineEnd = { x: end.x, y: end.y - offset }
  } else if (orientation === 'vertical') {
    dimensionLineStart = { x: start.x + offset, y: start.y }
    dimensionLineEnd = { x: end.x + offset, y: end.y }
  } else {
    // Aligned dimension - parallel to measured feature
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length  // Normal vector
    const ny = dx / length
    
    dimensionLineStart = {
      x: start.x + nx * offset,
      y: start.y + ny * offset
    }
    dimensionLineEnd = {
      x: end.x + nx * offset,
      y: end.y + ny * offset
    }
  }
  
  // Create extension lines
  const extensionLine1: ExtensionLine = {
    start: {
      x: start.x,
      y: start.y
    },
    end: {
      x: dimensionLineStart.x + (orientation === 'horizontal' ? 0 : (dimensionLineStart.x > start.x ? config.extensionLineOverhang : -config.extensionLineOverhang)),
      y: dimensionLineStart.y + (orientation === 'vertical' ? 0 : (dimensionLineStart.y < start.y ? -config.extensionLineOverhang : config.extensionLineOverhang))
    },
    gap: config.extensionLineGap,
    overhang: config.extensionLineOverhang
  }
  
  const extensionLine2: ExtensionLine = {
    start: {
      x: end.x,
      y: end.y
    },
    end: {
      x: dimensionLineEnd.x + (orientation === 'horizontal' ? 0 : (dimensionLineEnd.x > end.x ? config.extensionLineOverhang : -config.extensionLineOverhang)),
      y: dimensionLineEnd.y + (orientation === 'vertical' ? 0 : (dimensionLineEnd.y < end.y ? -config.extensionLineOverhang : config.extensionLineOverhang))
    },
    gap: config.extensionLineGap,
    overhang: config.extensionLineOverhang
  }
  
  // Create arrowheads
  const angle = Math.atan2(
    dimensionLineEnd.y - dimensionLineStart.y,
    dimensionLineEnd.x - dimensionLineStart.x
  )
  
  const arrowhead1: Arrowhead = {
    position: dimensionLineStart,
    angle: angle,
    length: config.arrowheadLength,
    width: config.arrowheadWidth
  }
  
  const arrowhead2: Arrowhead = {
    position: dimensionLineEnd,
    angle: angle + Math.PI,  // Point opposite direction
    length: config.arrowheadLength,
    width: config.arrowheadWidth
  }
  
  // Calculate text position (center of dimension line)
  const textPosition: Point2D = {
    x: (dimensionLineStart.x + dimensionLineEnd.x) / 2,
    y: (dimensionLineStart.y + dimensionLineEnd.y) / 2
  }
  
  // Format dimension text
  const text = formatDimensionValue(value, config.decimalPlaces)
  
  return {
    id,
    type: 'linear',
    orientation,
    value,
    text,
    position: textPosition,
    view,
    priority,
    start,
    end,
    dimensionLine: {
      start: dimensionLineStart,
      end: dimensionLineEnd,
      offset
    },
    extensionLines: [extensionLine1, extensionLine2],
    arrowheads: [arrowhead1, arrowhead2]
  }
}

interface RadialDimensionParams {
  id: string
  view: 'front' | 'top' | 'right'
  subtype: 'radius' | 'diameter'
  center: Point2D
  radius: number
  priority: number
  config: DimensionConfig
}

/**
 * Create a radial dimension (radius or diameter)
 */
function createRadialDimension(params: RadialDimensionParams): RadialDimension {
  const { id, view, subtype, center, radius, priority, config } = params
  
  // Leader line starts on the circle, extends outward at 45°
  const angle = Math.PI / 4  // 45 degrees
  const leaderStart: Point2D = {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle)
  }
  
  // Leader line ends outside the circle
  const leaderLength = radius + config.minOffsetFromOutline
  const leaderEnd: Point2D = {
    x: center.x + leaderLength * Math.cos(angle),
    y: center.y + leaderLength * Math.sin(angle)
  }
  
  // Format dimension text with symbol
  const value = subtype === 'diameter' ? radius * 2 : radius
  const symbol = subtype === 'diameter' ? 'Ø' : 'R'
  const text = symbol + formatDimensionValue(value, config.decimalPlaces)
  
  return {
    id,
    type: 'radial',
    subtype,
    value,
    text,
    position: leaderEnd,
    view,
    priority,
    center,
    radius,
    leaderLine: {
      start: leaderStart,
      end: leaderEnd
    },
    showCenter: true
  }
}

/**
 * Format dimension value with appropriate precision
 * ISO standard: no trailing zeros, minimal decimals
 */
function formatDimensionValue(value: number, maxDecimals: number): string {
  // Round to specified decimals
  const rounded = Number(value.toFixed(maxDecimals))
  
  // For values >= 10mm, use fewer decimals
  if (rounded >= 10) {
    return rounded.toFixed(0)
  }
  
  // For smaller values, use one decimal if non-zero
  const withOneDecimal = rounded.toFixed(1)
  if (withOneDecimal.endsWith('.0')) {
    return rounded.toFixed(0)
  }
  
  return withOneDecimal
}

// ============================================================================
// Collision Detection (Phase 3.4 - 2D-23)
// ============================================================================

/**
 * Calculate bounding box for a dimension (for collision detection)
 * Includes dimension text, extension lines, and dimension lines
 */
export function getDimensionBounds(dimension: Dimension, config: DimensionConfig = DEFAULT_DIMENSION_CONFIG): BoundingBox2D {
  switch (dimension.type) {
    case 'linear':
      return getLinearDimensionBounds(dimension as LinearDimension, config)
    case 'radial':
      return getRadialDimensionBounds(dimension as RadialDimension, config)
    case 'angular':
      return getAngularDimensionBounds(dimension as AngularDimension, config)
    default:
      // Fallback: text-only bounds
      return getTextBounds(dimension.position, dimension.text, config)
  }
}

/**
 * Get bounding box for linear dimension (includes text, extension lines, dimension line)
 */
function getLinearDimensionBounds(dimension: LinearDimension, config: DimensionConfig): BoundingBox2D {
  const points: Point2D[] = [
    dimension.dimensionLine.start,
    dimension.dimensionLine.end
    // Note: Extension lines are intentionally excluded as they're thin and allowed to cross
  ]
  
  // Add text bounds
  const textBounds = getTextBounds(dimension.position, dimension.text, config)
  points.push(
    { x: textBounds.x, y: textBounds.y },
    { x: textBounds.x + textBounds.width, y: textBounds.y + textBounds.height }
  )
  
  return getBoundsFromPoints(points)
}

/**
 * Get bounding box for radial dimension (includes text and leader line)
 */
function getRadialDimensionBounds(dimension: RadialDimension, config: DimensionConfig): BoundingBox2D {
  const points: Point2D[] = [
    dimension.leaderLine.start,
    dimension.leaderLine.end,
    dimension.position
  ]
  
  // Add text bounds
  const textBounds = getTextBounds(dimension.position, dimension.text, config)
  points.push(
    { x: textBounds.x, y: textBounds.y },
    { x: textBounds.x + textBounds.width, y: textBounds.y + textBounds.height }
  )
  
  return getBoundsFromPoints(points)
}

/**
 * Get bounding box for angular dimension (includes arc and text)
 */
function getAngularDimensionBounds(dimension: AngularDimension, config: DimensionConfig): BoundingBox2D {
  const arc = dimension.arc
  const points: Point2D[] = []
  
  // Sample points along the arc
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const angle = arc.startAngle + (arc.endAngle - arc.startAngle) * (i / steps)
    points.push({
      x: arc.center.x + arc.radius * Math.cos(angle),
      y: arc.center.y + arc.radius * Math.sin(angle)
    })
  }
  
  // Add text bounds
  const textBounds = getTextBounds(dimension.position, dimension.text, config)
  points.push(
    { x: textBounds.x, y: textBounds.y },
    { x: textBounds.x + textBounds.width, y: textBounds.y + textBounds.height }
  )
  
  return getBoundsFromPoints(points)
}

/**
 * Get bounding box for dimension text
 * Approximates text width based on character count and font metrics
 */
function getTextBounds(position: Point2D, text: string, config: DimensionConfig): BoundingBox2D {
  // Approximate character width: 60% of height for Arial
  const charWidth = config.textHeight * 0.6
  const textWidth = text.length * charWidth
  const textHeight = config.textHeight
  
  return {
    x: position.x - textWidth / 2,
    y: position.y - textHeight / 2,
    width: textWidth,
    height: textHeight
  }
}

/**
 * Compute axis-aligned bounding box from a set of points
 */
function getBoundsFromPoints(points: Point2D[]): BoundingBox2D {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Check if two bounding boxes overlap
 * Includes a small margin to avoid dimensions that are too close
 */
export function boundsOverlap(a: BoundingBox2D, b: BoundingBox2D, margin: number = 1): boolean {
  return !(
    a.x + a.width + margin < b.x ||
    b.x + b.width + margin < a.x ||
    a.y + a.height + margin < b.y ||
    b.y + b.height + margin < a.y
  )
}

/**
 * Resolve collisions between dimensions
 * Strategy: Move lower priority dimensions away from higher priority ones
 * 
 * Algorithm:
 * 1. Group dimensions by view (only check collisions within same view)
 * 2. Sort each view's dimensions by priority (descending)
 * 3. For each dimension, check collisions with higher-priority dimensions in same view
 * 4. If collision detected, try relocating by incrementing offset
 * 5. Limit relocation attempts to prevent runaway loops
 */
export function resolveCollisions(
  dimensions: Dimension[],
  config: DimensionConfig = DEFAULT_DIMENSION_CONFIG
): Dimension[] {
  // Group dimensions by view
  const byView: Record<string, Dimension[]> = {}
  for (const dim of dimensions) {
    if (!byView[dim.view]) {
      byView[dim.view] = []
    }
    byView[dim.view].push(dim)
  }
  
  const allResolved: Dimension[] = []
  
  // Resolve collisions within each view independently
  for (const view in byView) {
    const viewDims = byView[view]
    
    // Sort by priority descending (highest first)
    const sorted = [...viewDims].sort((a, b) => b.priority - a.priority)
    const resolved: Dimension[] = []
    
    for (let i = 0; i < sorted.length; i++) {
      let current = sorted[i]
      let attempts = 0
      const maxAttempts = 10
      
      // Check for collisions with already-resolved (higher priority) dimensions in same view
      while (attempts < maxAttempts) {
        const currentBounds = getDimensionBounds(current, config)
        let hasCollision = false
        
        for (const other of resolved) {
          const otherBounds = getDimensionBounds(other, config)
          if (boundsOverlap(currentBounds, otherBounds, 1)) {
            hasCollision = true
            break
          }
        }
        
        if (!hasCollision) {
          // No collision, keep this dimension
          break
        }
        
        // Collision detected; try to relocate
        current = relocateDimension(current, config)
        attempts++
      }
      
      resolved.push(current)
    }
    
    allResolved.push(...resolved)
  }
  
  return allResolved
}

/**
 * Relocate a dimension by increasing its offset from the feature
 * Different strategies for linear vs radial vs angular
 */
function relocateDimension(dimension: Dimension, config: DimensionConfig): Dimension {
  switch (dimension.type) {
    case 'linear':
      return relocateLinearDimension(dimension as LinearDimension, config)
    case 'radial':
      return relocateRadialDimension(dimension as RadialDimension, config)
    case 'angular':
      return relocateAngularDimension(dimension as AngularDimension, config)
    default:
      return dimension
  }
}

/**
 * Relocate linear dimension by increasing offset from outline
 */
function relocateLinearDimension(dimension: LinearDimension, config: DimensionConfig): LinearDimension {
  const newOffset = dimension.dimensionLine.offset + config.minSpacingBetween
  
  // Recalculate dimension line and extension line endpoints
  const dx = dimension.end.x - dimension.start.x
  const dy = dimension.end.y - dimension.start.y
  
  let offsetX = 0
  let offsetY = 0
  
  if (dimension.orientation === 'horizontal') {
    offsetY = -newOffset
  } else if (dimension.orientation === 'vertical') {
    offsetX = newOffset
  } else {
    // aligned: perpendicular to measured segment
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length
    const ny = dx / length
    offsetX = nx * newOffset
    offsetY = ny * newOffset
  }
  
  const newDimLineStart = { x: dimension.start.x + offsetX, y: dimension.start.y + offsetY }
  const newDimLineEnd = { x: dimension.end.x + offsetX, y: dimension.end.y + offsetY }
  const newTextPos = {
    x: (newDimLineStart.x + newDimLineEnd.x) / 2,
    y: (newDimLineStart.y + newDimLineEnd.y) / 2
  }
  
  // Update extension lines to reach new dimension line
  const newExtLines: [ExtensionLine, ExtensionLine] = [
    {
      ...dimension.extensionLines[0],
      end: newDimLineStart
    },
    {
      ...dimension.extensionLines[1],
      end: newDimLineEnd
    }
  ]
  
  return {
    ...dimension,
    position: newTextPos,
    dimensionLine: {
      start: newDimLineStart,
      end: newDimLineEnd,
      offset: newOffset
    },
    extensionLines: newExtLines
  }
}

/**
 * Relocate radial dimension by extending leader line
 */
function relocateRadialDimension(dimension: RadialDimension, config: DimensionConfig): RadialDimension {
  const dx = dimension.leaderLine.end.x - dimension.leaderLine.start.x
  const dy = dimension.leaderLine.end.y - dimension.leaderLine.start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const nx = dx / length
  const ny = dy / length
  
  // Extend leader line by one spacing increment
  const extension = config.minSpacingBetween
  const newEnd = {
    x: dimension.leaderLine.end.x + nx * extension,
    y: dimension.leaderLine.end.y + ny * extension
  }
  
  return {
    ...dimension,
    position: newEnd,
    leaderLine: {
      ...dimension.leaderLine,
      end: newEnd
    }
  }
}

/**
 * Relocate angular dimension by increasing arc radius
 */
function relocateAngularDimension(dimension: AngularDimension, config: DimensionConfig): AngularDimension {
  const newRadius = dimension.arc.radius + config.minSpacingBetween
  
  // Recalculate text position at midpoint of new arc
  const midAngle = (dimension.arc.startAngle + dimension.arc.endAngle) / 2
  const newTextPos = {
    x: dimension.arc.center.x + newRadius * Math.cos(midAngle),
    y: dimension.arc.center.y + newRadius * Math.sin(midAngle)
  }
  
  return {
    ...dimension,
    position: newTextPos,
    radius: newRadius,
    arc: {
      ...dimension.arc,
      radius: newRadius
    }
  }
}
