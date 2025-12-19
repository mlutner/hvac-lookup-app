'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Mail, Phone, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In production, this would submit to an API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitted(true)
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'support@hvaclookup.com',
      detail: 'We respond within 24 hours',
    },
    {
      icon: Phone,
      title: 'Phone',
      description: '1-800-HVAC-AGE',
      detail: 'Mon-Fri, 9am-5pm EST',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Available for members',
      detail: 'Real-time support in the app',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Have a question or need help? We're here for you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Methods */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Contact Methods
              </h2>
              <div className="space-y-6">
                {contactMethods.map((method) => (
                  <div key={method.title} className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <method.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{method.title}</h3>
                      <p className="text-primary-600">{method.description}</p>
                      <p className="text-sm text-slate-500">{method.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Helpful Resources
                </h2>
                <ul className="space-y-2 text-slate-600">
                  <li>
                    <a href="/help" className="hover:text-primary-600">Help Center →</a>
                  </li>
                  <li>
                    <a href="/brands" className="hover:text-primary-600">Brand Index →</a>
                  </li>
                  <li>
                    <a href="/pricing" className="hover:text-primary-600">Pricing & Plans →</a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-slate-600">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />

                    <Input
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />

                    <Input
                      label="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us more..."
                        rows={5}
                        className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      isLoading={isSubmitting}
                    >
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
