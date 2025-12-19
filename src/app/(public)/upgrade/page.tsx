import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, Camera, Search, MessageCircle, Star } from 'lucide-react'

export default function UpgradePage() {
  const memberFeatures = [
    {
      icon: Camera,
      title: 'OCR Scanning',
      description: 'Snap a photo of any data plate and extract serial numbers instantly.',
    },
    {
      icon: Search,
      title: 'Unlimited Lookups',
      description: 'Decode as many serial numbers as you need with no monthly limits.',
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Ask questions about equipment and get answers with source citations.',
    },
    {
      icon: Star,
      title: 'Priority Support',
      description: 'Get help from real humans when you need it most.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Upgrade to Access This Feature
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            This feature is available to Gold, Platinum, and Team members.
            Upgrade now to unlock the full power of HVAC Lookup.
          </p>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
            {memberFeatures.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="flex gap-4 items-start pt-6">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link href="/pricing">
              <Button size="xl" className="w-full sm:w-auto px-12">
                View Plans & Pricing
              </Button>
            </Link>
            <p className="text-sm text-slate-500">
              7-day free trial included. Cancel anytime.
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link href="/dashboard" className="text-primary-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
