import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Search, MessageCircle, Zap, Shield, Clock } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Camera,
      title: 'Scan Data Plates',
      description: 'Take a photo of any equipment data plate and instantly extract serial numbers and model info.',
    },
    {
      icon: Search,
      title: 'Serial Decode',
      description: 'Look up manufacture dates for 200+ HVAC brands with our comprehensive rule engine.',
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Ask questions about equipment specs and get answers with citations from actual manuals.',
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: 'Save Time',
      description: 'Get equipment ages in seconds, not minutes of searching manufacturer websites.',
    },
    {
      icon: Shield,
      title: 'Trusted Data',
      description: 'Every decode is backed by cited sources from manufacturer documentation.',
    },
    {
      icon: Clock,
      title: 'Mobile-First',
      description: 'Designed for field use with big buttons and outdoor-readable interface.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                HVAC Equipment Age Lookup
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                The fastest way to decode serial numbers and find manufacture dates.
                Built for home inspectors, HVAC techs, and property managers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="xl" className="w-full sm:w-auto">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/brands">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Browse Brands
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                No credit card required. 7-day free trial.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Everything You Need in the Field
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Three powerful tools designed for speed and accuracy when you're on-site.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-slate-50 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Why Professionals Choose Us
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ready to Speed Up Your Inspections?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Join thousands of home inspectors and HVAC professionals who save hours every week.
            </p>
            <Link href="/signup">
              <Button size="xl">
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
