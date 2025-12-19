import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try the basics with limited lookups',
      features: [
        '5 serial lookups per month',
        'Basic brand coverage',
        'Community support',
      ],
      limitations: [
        'No OCR scanning',
        'No AI assistant',
        'No priority support',
      ],
      cta: 'Start Free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Gold',
      price: '$19',
      period: '/month',
      description: 'For individual inspectors and techs',
      features: [
        'Unlimited serial lookups',
        '200+ brand coverage',
        'OCR data plate scanning',
        'AI manual search assistant',
        'Email support',
        'Mobile-optimized interface',
      ],
      limitations: [],
      cta: 'Start 7-Day Trial',
      href: '/signup?plan=gold',
      highlighted: true,
    },
    {
      name: 'Platinum',
      price: '$39',
      period: '/month',
      description: 'For power users who need it all',
      features: [
        'Everything in Gold',
        'Priority AI responses',
        'Submit new brand info',
        'Request assistance',
        'Phone support',
        'Early access to features',
      ],
      limitations: [],
      cta: 'Start 7-Day Trial',
      href: '/signup?plan=platinum',
      highlighted: false,
    },
    {
      name: 'Team',
      price: '$99',
      period: '/month',
      description: 'For inspection companies and teams',
      features: [
        'Everything in Platinum',
        'Up to 5 team members',
        'Shared lookup history',
        'Team admin dashboard',
        'Bulk lookup tools',
        'Dedicated support',
      ],
      limitations: [],
      cta: 'Contact Sales',
      href: '/contact?plan=team',
      highlighted: false,
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All paid plans include a 7-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? 'border-2 border-primary-500 relative' : ''}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-2 opacity-50">
                        <span className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm text-slate-400 line-through">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={plan.href} className="w-full">
                    <Button
                      variant={plan.highlighted ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-slate-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  What brands are covered?
                </h3>
                <p className="text-slate-600">
                  We cover 200+ HVAC brands including Carrier, Trane, Lennox, Rheem, Goodman, and many more. Check our brand index for the full list.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  How accurate are the decode results?
                </h3>
                <p className="text-slate-600">
                  Our decode rules are sourced from manufacturer documentation and verified by industry professionals. Every result includes citations so you can verify the source.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
