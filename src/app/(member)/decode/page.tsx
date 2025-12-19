'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Search, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react'
import type { DecodeResult } from '@/types'

export default function DecodePage() {
  const [brand, setBrand] = useState('')
  const [serial, setSerial] = useState('')
  const [model, setModel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, serial, model }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Decode failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const popularBrands = [
    'Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman',
    'Bryant', 'American Standard', 'Ruud', 'Amana', 'York',
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Decode Serial Number
        </h1>
        <p className="text-slate-600 mt-1">
          Enter a brand and serial number to find the manufacture date
        </p>
      </div>

      {/* Decode Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Brand Input */}
            <div>
              <Input
                label="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Carrier, Trane, Lennox"
                required
                autoComplete="off"
                list="brand-suggestions"
              />
              <datalist id="brand-suggestions">
                {popularBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2 mt-2">
                {popularBrands.slice(0, 5).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Serial Input */}
            <Input
              label="Serial Number"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="e.g., 1234567890"
              required
              autoComplete="off"
              className="font-mono"
            />

            {/* Model Input (optional) */}
            <Input
              label="Model Number (optional)"
              value={model}
              onChange={(e) => setModel(e.target.value.toUpperCase())}
              placeholder="e.g., 24ACC636A003"
              autoComplete="off"
              className="font-mono"
              hint="Helps narrow down the decode if serial format varies by model"
            />

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              <Search className="w-5 h-5 mr-2" />
              Decode Serial
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className={result.manufactureDate ? 'border-green-200' : 'border-amber-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.manufactureDate ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-800">Decode Successful</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <span className="text-amber-800">Could Not Decode</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Result */}
            {result.manufactureDate && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Manufacture Date</p>
                <p className="text-2xl font-bold text-green-900">{result.explanation}</p>
                <p className="text-sm text-green-600 mt-1">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">Notes</p>
                <ul className="space-y-1">
                  {result.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations */}
            {result.citations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Sources</p>
                <div className="space-y-2">
                  {result.citations.map((citation, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Document: {citation.paperlessDocId}
                          </p>
                          <p className="text-xs text-slate-500">
                            Pages {citation.pageStart}–{citation.pageEnd}
                          </p>
                        </div>
                        <Link
                          href={`/search?doc=${citation.paperlessDocId}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                      <blockquote className="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                        "{citation.excerpt}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No result actions */}
            {!result.manufactureDate && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/submit" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Submit This Serial
                  </Button>
                </Link>
                <Link href="/assistance" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Request Help
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>
          Can't find your brand?{' '}
          <Link href="/brands" className="text-primary-600 hover:underline">
            Browse all brands
          </Link>
          {' '}or{' '}
          <Link href="/submit" className="text-primary-600 hover:underline">
            submit new info
          </Link>
        </p>
      </div>
    </div>
  )
}
