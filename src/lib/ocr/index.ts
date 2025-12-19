import { OCRResult } from '@/types'

/**
 * OCR Provider interface
 */
export interface OCRProvider {
  extractText(imageData: string): Promise<OCRResult>
}

/**
 * Extract likely serial number from OCR text
 */
export function extractSerialFromText(text: string): string | null {
  // Common serial number patterns
  const patterns = [
    // Labeled: "Serial: ABC123" or "S/N: ABC123"
    /(?:serial\s*(?:number|no|#)?|s\/?n)\s*[:.]?\s*([A-Z0-9]{6,15})/i,
    // Labeled: "Serial Number ABC123"
    /serial\s+number\s+([A-Z0-9]{6,15})/i,
    // Standalone serial-like pattern (6-15 alphanumeric chars)
    /\b([A-Z]\d{2,3}[A-Z0-9]{4,11})\b/,
    /\b(\d{2}[A-Z]\d{5,10})\b/,
    /\b([A-Z0-9]{10,14})\b/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      // Validate it looks like a serial (not a word)
      const candidate = match[1].toUpperCase()
      if (candidate.length >= 6 && /\d/.test(candidate)) {
        return candidate
      }
    }
  }

  return null
}

/**
 * Extract likely model number from OCR text
 */
export function extractModelFromText(text: string): string | null {
  const patterns = [
    // Labeled: "Model: ABC123" or "M/N: ABC123"
    /(?:model\s*(?:number|no|#)?|m\/?n)\s*[:.]?\s*([A-Z0-9-]{6,20})/i,
    // Labeled: "Model Number ABC123"
    /model\s+number\s+([A-Z0-9-]{6,20})/i,
    // Product code patterns (e.g., "24ACC636A003")
    /\b(\d{2}[A-Z]{2,4}\d{3,6}[A-Z]?\d{3})\b/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].toUpperCase()
    }
  }

  return null
}

/**
 * Tesseract.js based OCR provider
 * Works in browser and Node.js
 */
export class TesseractProvider implements OCRProvider {
  async extractText(imageData: string): Promise<OCRResult> {
    // Dynamic import to avoid SSR issues
    const Tesseract = await import('tesseract.js')

    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    const text = result.data.text
    const confidence = result.data.confidence / 100

    const extractedSerial = extractSerialFromText(text)
    const extractedModel = extractModelFromText(text)

    // Extract bounding boxes for key terms
    const boundingBoxes = result.data.words
      .filter((word: { text: string }) => {
        const w = word.text.toUpperCase()
        return (
          w === extractedSerial ||
          w === extractedModel ||
          /SERIAL|MODEL|S\/N|M\/N/i.test(w)
        )
      })
      .map((word: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }) => ({
        text: word.text,
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
        confidence: word.confidence / 100,
      }))

    return {
      extractedText: text,
      extractedSerial,
      extractedModel,
      confidence,
      boundingBoxes,
    }
  }
}

/**
 * Create an OCR provider based on configuration
 */
export function createOCRProvider(): OCRProvider {
  const provider = process.env.OCR_PROVIDER || 'tesseract'

  switch (provider) {
    case 'tesseract':
    default:
      return new TesseractProvider()
  }
}

// Singleton instance
export const ocrProvider = createOCRProvider()

/**
 * Convenience function to perform OCR
 */
export async function performOCR(imageData: string): Promise<OCRResult> {
  return ocrProvider.extractText(imageData)
}
