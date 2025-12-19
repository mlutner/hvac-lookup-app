'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Upload } from 'lucide-react'

type SubmissionType = 'new_brand' | 'serial_format' | 'correction'

export default function SubmitPage() {
  const searchParams = useSearchParams()
  const initialBrand = searchParams.get('brand') || ''

  const [type, setType] = useState<SubmissionType>('serial_format')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form fields
  const [brand, setBrand] = useState(initialBrand)
  const [serial, setSerial] = useState('')
  const [model, setModel] = useState('')
  const [manufactureDate, setManufactureDate] = useState('')
  const [unitType, setUnitType] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [notes, setNotes] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_INFO',
          payload: {
            submissionType: type,
            brand,
            serial,
            model,
            manufactureDate,
            unitType,
            fuelType,
            notes,
            sourceUrl,
          },
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Thank You!
            </h2>
            <p className="text-slate-600 mb-6">
              Your submission has been received. Our team will review it and update the database.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Submit Information
        </h1>
        <p className="text-slate-600 mt-1">
          Help improve our database by submitting new brands, serial formats, or corrections
        </p>
      </div>

      {/* Submission Type Selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { id: 'serial_format', label: 'Serial Format' },
          { id: 'new_brand', label: 'New Brand' },
          { id: 'correction', label: 'Correction' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setType(option.id as SubmissionType)}
            className={`p-4 rounded-lg border-2 text-center transition-colors ${
              type === option.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {type === 'new_brand' && 'Submit New Brand'}
            {type === 'serial_format' && 'Submit Serial Format'}
            {type === 'correction' && 'Submit Correction'}
          </CardTitle>
          <CardDescription>
            {type === 'new_brand' && 'Add a new HVAC brand to our database'}
            {type === 'serial_format' && 'Provide serial number format information'}
            {type === 'correction' && 'Report an error in our existing data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Brand Name"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Carrier, Trane"
              required
            />

            {(type === 'serial_format' || type === 'correction') && (
              <>
                <Input
                  label="Example Serial Number"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  placeholder="e.g., 1234567890"
                  className="font-mono"
                  required
                />

                <Input
                  label="Model Number (if applicable)"
                  value={model}
                  onChange={(e) => setModel(e.target.value.toUpperCase())}
                  placeholder="e.g., 24ACC636A003"
                  className="font-mono"
                />

                <Input
                  label="Known Manufacture Date"
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                  placeholder="e.g., March 2021 or 2021-03"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Unit Type
                    </label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select type...</option>
                      <option value="ac">Air Conditioner</option>
                      <option value="heat_pump">Heat Pump</option>
                      <option value="furnace">Furnace</option>
                      <option value="air_handler">Air Handler</option>
                      <option value="package_unit">Package Unit</option>
                      <option value="mini_split">Mini Split</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select fuel...</option>
                      <option value="electric">Electric</option>
                      <option value="gas">Natural Gas</option>
                      <option value="propane">Propane</option>
                      <option value="oil">Oil</option>
                      <option value="na">N/A</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === 'correction' ? 'What needs to be corrected?' : 'Additional Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  type === 'correction'
                    ? 'Describe the error and the correct information...'
                    : 'Any additional information that might be helpful...'
                }
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <Input
              label="Source URL (optional)"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              hint="Link to manufacturer documentation or other source"
            />

            {/* Photo upload placeholder */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Photos (optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Photo upload coming soon
                </p>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Submit Information
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
