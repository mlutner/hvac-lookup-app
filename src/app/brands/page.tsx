import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getBrandsAlphabetical, brands } from '@/lib/brands'
import { Search, ChevronRight } from 'lucide-react'

export default function BrandsPage() {
  const groupedBrands = getBrandsAlphabetical()
  const letters = Array.from(groupedBrands.keys())

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              HVAC Brand Index
            </h1>
            <p className="text-lg text-slate-600 mt-2">
              Browse {brands.length}+ HVAC brands to find serial number decode formats
            </p>
          </div>

          {/* Search */}
          <div className="mb-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search brands..."
                className="pl-12"
              />
            </div>
          </div>

          {/* Alphabet Quick Links */}
          <div className="mb-8 flex flex-wrap gap-2">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#${letter}`}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg font-medium transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>

          {/* Brand List */}
          <div className="space-y-8">
            {letters.map((letter) => (
              <section key={letter} id={letter}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 sticky top-16 bg-white py-2 border-b border-slate-200">
                  {letter}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBrands.get(letter)!.map((brand) => (
                    <Link key={brand.id} href={`/brands/${brand.slug}`}>
                      <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {brand.name}
                              </h3>
                              {brand.aliases.length > 0 && (
                                <p className="text-sm text-slate-500 mt-0.5">
                                  Also: {brand.aliases.slice(0, 3).join(', ')}
                                  {brand.aliases.length > 3 && '...'}
                                </p>
                              )}
                              {brand.parentCompany && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {brand.parentCompany}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Submit New Brand */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              Don't see your brand listed?
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Submit a New Brand
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
