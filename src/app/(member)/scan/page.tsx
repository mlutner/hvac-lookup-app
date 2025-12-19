'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Upload, Loader2, Check, X, RotateCcw } from 'lucide-react'
import type { OCRResult } from '@/types'

type ScanStep = 'capture' | 'processing' | 'confirm' | 'decoding'

export default function ScanPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [step, setStep] = useState<ScanStep>('capture')
  const [imageData, setImageData] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [isUsingCamera, setIsUsingCamera] = useState(false)
  const [error, setError] = useState('')

  // Editable fields after OCR
  const [brand, setBrand] = useState('')
  const [serial, setSerial] = useState('')
  const [model, setModel] = useState('')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsUsingCamera(true)
      }
    } catch (err) {
      setError('Could not access camera. Please use file upload instead.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsUsingCamera(false)
  }

  const captureFromCamera = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

    stopCamera()
    setImageData(dataUrl)
    processImage(dataUrl)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setImageData(dataUrl)
      processImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async (dataUrl: string) => {
    setStep('processing')
    setError('')

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: dataUrl }),
      })

      if (!res.ok) {
        throw new Error('OCR processing failed')
      }

      const result: OCRResult = await res.json()
      setOcrResult(result)

      // Pre-fill fields
      setSerial(result.extractedSerial || '')
      setModel(result.extractedModel || '')

      setStep('confirm')
    } catch (err) {
      setError('Failed to process image. Please try again.')
      setStep('capture')
    }
  }

  const handleDecode = async () => {
    if (!serial) {
      setError('Serial number is required')
      return
    }
    if (!brand) {
      setError('Brand is required')
      return
    }

    setStep('decoding')

    // Navigate to decode page with pre-filled values
    router.push(`/decode?brand=${encodeURIComponent(brand)}&serial=${encodeURIComponent(serial)}${model ? `&model=${encodeURIComponent(model)}` : ''}`)
  }

  const reset = useCallback(() => {
    setStep('capture')
    setImageData(null)
    setOcrResult(null)
    setBrand('')
    setSerial('')
    setModel('')
    setError('')
    stopCamera()
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Scan Data Plate
        </h1>
        <p className="text-slate-600 mt-1">
          Take a photo of the equipment data plate to extract serial number
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step: Capture */}
      {step === 'capture' && (
        <Card>
          <CardContent className="pt-6">
            {isUsingCamera ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Alignment guide */}
                  <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-lg pointer-events-none" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                    Align data plate within frame
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={stopCamera} className="flex-1">
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={captureFromCamera} className="flex-1">
                    <Camera className="w-5 h-5 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={startCamera}
                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-primary-400 transition-colors"
                  >
                    <Camera className="w-12 h-12 text-slate-400" />
                    <span className="font-medium text-slate-700">Use Camera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-slate-100 hover:border-primary-400 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-slate-400" />
                    <span className="font-medium text-slate-700">Upload Photo</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-sm text-slate-500 text-center">
                  Tip: Get a clear, straight-on photo of the data plate for best results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              Processing Image...
            </h2>
            <p className="text-slate-600">
              Extracting text from the data plate
            </p>

            {imageData && (
              <div className="mt-6 max-w-xs mx-auto">
                <img
                  src={imageData}
                  alt="Captured"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          {/* Preview */}
          {imageData && (
            <Card>
              <CardContent className="pt-6">
                <img
                  src={imageData}
                  alt="Captured"
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* OCR Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Extracted Information</span>
                {ocrResult && (
                  <span className="text-sm font-normal text-slate-500">
                    Confidence: {Math.round((ocrResult.confidence || 0) * 100)}%
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Carrier, Trane, Lennox"
                required
              />

              <Input
                label="Serial Number"
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                placeholder="Enter or verify serial number"
                className="font-mono"
                required
              />

              <Input
                label="Model Number (optional)"
                value={model}
                onChange={(e) => setModel(e.target.value.toUpperCase())}
                placeholder="Enter or verify model number"
                className="font-mono"
              />

              {/* Raw OCR text preview */}
              {ocrResult?.extractedText && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                    View raw OCR text
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {ocrResult.extractedText}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={reset} className="flex-1">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake
                </Button>
                <Button onClick={handleDecode} className="flex-1">
                  <Check className="w-5 h-5 mr-2" />
                  Decode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Decoding */}
      {step === 'decoding' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-slate-900 mb-2">
              Decoding Serial Number...
            </h2>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
