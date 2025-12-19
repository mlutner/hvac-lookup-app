import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getBrandBySlug, brands } from '@/lib/brands'
import { Search, ChevronLeft, FileText, AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return brands.map((brand) => ({
    slug: brand.slug,
  }))
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = getBrandBySlug(slug)

  if (!brand) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/brands"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            All Brands
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              {brand.name}
            </h1>
            {brand.parentCompany && (
              <p className="text-lg text-slate-500 mt-1">
                Part of {brand.parentCompany}
              </p>
            )}
            {brand.aliases.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {brand.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Decode CTA */}
          <Card className="mb-8 bg-primary-50 border-primary-200">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Have a {brand.name} serial number?
                  </h2>
                  <p className="text-slate-600">
                    Decode it instantly to find the manufacture date
                  </p>
                </div>
                <Link href={`/decode?brand=${brand.name}`}>
                  <Button size="lg">
                    <Search className="w-5 h-5 mr-2" />
                    Decode Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About {brand.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">{brand.description}</p>
            </CardContent>
          </Card>

          {/* Serial Formats */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Serial Number Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brand.serialFormats.map((format, i) => (
                  <div key={i} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded">
                        {format.era}
                      </span>
                      <code className="font-mono text-lg text-slate-900">
                        {format.pattern}
                      </code>
                    </div>
                    <p className="text-slate-600">{format.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Serial</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Manufacture Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brand.examples.map((example, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-4 font-mono text-slate-900">
                          {example.serial}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {example.manufactureDate}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {example.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Related Resources */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Related Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href={`/search?brand=${brand.name}`}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FileText className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-slate-900">Manuals & Specs</p>
                    <p className="text-sm text-slate-500">Search documentation</p>
                  </div>
                </Link>
                <Link
                  href={`/chat?brand=${brand.name}`}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <AlertCircle className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-slate-900">Ask a Question</p>
                    <p className="text-sm text-slate-500">Get help from AI</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Submit Correction */}
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              Found an error or have additional information?
            </p>
            <Link href={`/submit?brand=${brand.name}`}>
              <Button variant="outline">
                Submit Correction
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
