/**
 * PDF export functionality for technical drawings
 * 
 * Converts SVG drawings to PDF format using jsPDF with proper:
 * - ISO A4 page size (210mm × 297mm)
 * - Correct scaling preservation
 * - Metadata (title, author, subject)
 * - High quality rendering
 */

import { jsPDF } from 'jspdf'
import type { PartRecipe } from '../types/part'

export interface PDFExportOptions {
  /** Part recipe for metadata */
  recipe: PartRecipe
  /** SVG content as string */
  svgContent: string
  /** Optional filename (defaults to part name) */
  filename?: string
  /** Page orientation */
  orientation?: 'portrait' | 'landscape'
  /** Include timestamp in metadata */
  includeTimestamp?: boolean
}

/**
 * Export SVG drawing to PDF
 * 
 * @param options - Export configuration
 * @returns Promise that resolves when download is complete
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const {
    recipe,
    svgContent,
    filename,
    orientation = 'landscape',
    includeTimestamp = true
  } = options

  try {
    // Create PDF document (A4 size)
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    })

    // Set metadata
    const title = `${recipe.name} - Technical Drawing`
    pdf.setProperties({
      title,
      subject: 'ISO-compliant orthographic projection',
      author: 'Tower19',
      keywords: `part,drawing,${recipe.difficulty}`,
      creator: 'Tower19 Technical Drawing Generator'
    })

    // Parse SVG to get dimensions
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = svgDoc.documentElement as unknown as SVGSVGElement

    const viewBox = svgElement.getAttribute('viewBox')
    const [, , svgWidth, svgHeight] = viewBox 
      ? viewBox.split(' ').map(Number) 
      : [0, 0, 800, 600]

    // Get PDF page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Calculate scale to fit drawing on page with margins
    const margin = 10 // mm
    const availableWidth = pageWidth - 2 * margin
    const availableHeight = pageHeight - 2 * margin
    
    const scaleX = availableWidth / svgWidth
    const scaleY = availableHeight / svgHeight
    const scale = Math.min(scaleX, scaleY)

    // Calculate centered position
    const scaledWidth = svgWidth * scale
    const scaledHeight = svgHeight * scale
    const x = (pageWidth - scaledWidth) / 2
    const y = (pageHeight - scaledHeight) / 2

    // Convert SVG to data URL
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Load SVG as image
    const img = new Image()
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Add image to PDF
          pdf.addImage(img, 'PNG', x, y, scaledWidth, scaledHeight)
          
          // Add footer with metadata
          if (includeTimestamp) {
            pdf.setFontSize(8)
            pdf.setTextColor(128)
            const date = new Date().toLocaleString()
            pdf.text(`Generated: ${date} | Seed: ${recipe.id}`, margin, pageHeight - 5)
          }
          
          URL.revokeObjectURL(svgUrl)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('Failed to load SVG as image'))
      }
      
      img.src = svgUrl
    })

    // Download PDF
    const pdfFilename = filename || `${recipe.name.replace(/\s+/g, '-')}-drawing.pdf`
    pdf.save(pdfFilename)

    console.log('[PDF Export] Successfully exported:', pdfFilename)
  } catch (error) {
    console.error('[PDF Export] Failed:', error)
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if PDF export is supported in current browser
 */
export function isPDFExportSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 
           typeof Blob !== 'undefined' &&
           typeof URL !== 'undefined'
  } catch {
    return false
  }
}
