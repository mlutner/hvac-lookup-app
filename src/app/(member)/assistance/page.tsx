'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, HelpCircle } from 'lucide-react'

export default function AssistancePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form fields
  const [brand, setBrand] = useState('')
  const [serial, setSerial] = useState('')
  const [model, setModel] = useState('')
  const [question, setQuestion] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ASSISTANCE_REQUEST',
          payload: {
            brand,
            serial,
            model,
            question,
            contactEmail: email,
            contactPhone: phone,
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
              Request Submitted
            </h2>
            <p className="text-slate-600 mb-6">
              Our team will review your request and get back to you within 24-48 hours.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
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
          Request Assistance
        </h1>
        <p className="text-slate-600 mt-1">
          Need help identifying equipment or decoding a serial number? Our experts can help.
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How it works</p>
              <p className="text-sm text-blue-700">
                Submit your request and our team will research the equipment.
                Members get unlimited free assistance requests. We typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assistance Request</CardTitle>
          <CardDescription>
            Provide as much information as you have about the equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Brand (if known)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Carrier, Trane, or Unknown"
            />

            <Input
              label="Serial Number"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="Enter the serial number from the data plate"
              className="font-mono"
              required
            />

            <Input
              label="Model Number (if available)"
              value={model}
              onChange={(e) => setModel(e.target.value.toUpperCase())}
              placeholder="Enter the model number if visible"
              className="font-mono"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you need help with? E.g., 'I can't decode this serial number' or 'What year was this unit made?'"
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-4">
                Contact Information (so we can respond)
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />

                <Input
                  type="tel"
                  label="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Submit Request
            </Button>

            <p className="text-xs text-slate-500 text-center">
              By submitting, you agree to receive email responses about your request.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
