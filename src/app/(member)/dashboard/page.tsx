'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Search, MessageCircle, FileText, HelpCircle, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()

  const isMember = session?.user?.role === 'MEMBER' || session?.user?.role === 'ADMIN'

  const primaryActions = [
    {
      icon: Search,
      title: 'Decode Serial',
      description: 'Look up manufacture date by serial number',
      href: '/decode',
      color: 'bg-blue-500',
      requiresMember: false,
    },
    {
      icon: Camera,
      title: 'Scan Data Plate',
      description: 'Take a photo to extract serial and model',
      href: '/scan',
      color: 'bg-green-500',
      requiresMember: true,
    },
    {
      icon: FileText,
      title: 'Search Manuals',
      description: 'Find equipment specifications and docs',
      href: '/search',
      color: 'bg-purple-500',
      requiresMember: true,
    },
    {
      icon: MessageCircle,
      title: 'Ask Assistant',
      description: 'Get answers about HVAC equipment',
      href: '/chat',
      color: 'bg-orange-500',
      requiresMember: true,
    },
    {
      icon: HelpCircle,
      title: 'Request Assistance',
      description: 'Get help from our experts',
      href: '/assistance',
      color: 'bg-red-500',
      requiresMember: true,
    },
    {
      icon: Plus,
      title: 'Submit Info',
      description: 'Contribute new brand/serial data',
      href: '/submit',
      color: 'bg-teal-500',
      requiresMember: true,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-600 mt-1">
          {isMember
            ? 'What would you like to do today?'
            : 'Upgrade to access all features'
          }
        </p>
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isMember && (
        <Card className="mb-8 bg-gradient-to-r from-primary-500 to-primary-700 text-white border-0">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Unlock All Features</h2>
                <p className="text-primary-100">
                  Get OCR scanning, AI assistant, and unlimited lookups
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {primaryActions.map((action) => {
          const isLocked = action.requiresMember && !isMember
          const Icon = action.icon

          const cardElement = (
            <Card
              className={`h-full transition-all ${
                isLocked
                  ? 'opacity-60'
                  : 'hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {action.title}
                      </h3>
                      {isLocked && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )

          if (isLocked) {
            return (
              <div key={action.title} className="cursor-not-allowed">
                {cardElement}
              </div>
            )
          }

          return (
            <Link key={action.title} href={action.href} className="block">
              {cardElement}
            </Link>
          )
        })}
      </div>

      {/* Quick Stats (for members) */}
      {isMember && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">12</div>
              <div className="text-sm text-slate-600">Lookups Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">3</div>
              <div className="text-sm text-slate-600">Scans Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">5</div>
              <div className="text-sm text-slate-600">Saved Lookups</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity (placeholder) */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Lookups</h2>
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            <p>No recent lookups yet.</p>
            <p className="text-sm mt-1">
              Start by decoding a serial number or scanning a data plate.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
