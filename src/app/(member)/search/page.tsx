'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, ExternalLink, Loader2 } from 'lucide-react'
import type { PaperlessSearchResult } from '@/types'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || searchParams.get('brand') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<PaperlessSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const performSearch = async (searchQuery: string, pageNum = 1) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results)
        setTotalCount(data.count)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Search Manuals
        </h1>
        <p className="text-slate-600 mt-1">
          Search equipment manuals, specs, and documentation
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for brand, model, or keywords..."
                className="pl-12"
              />
            </div>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-slate-500">Popular:</span>
            {['Carrier', 'Trane', 'Lennox', 'installation manual', 'service manual'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term)
                  performSearch(term)
                }}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-slate-600">Searching...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && (
        <>
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              {totalCount === 0
                ? 'No results found'
                : `Found ${totalCount} result${totalCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {result.title}
                      </h3>

                      {/* Highlights */}
                      {result.__search_hit__?.highlights && (
                        <p
                          className="text-sm text-slate-600 mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: result.__search_hit__.highlights,
                          }}
                        />
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Added: {new Date(result.added).toLocaleDateString()}</span>
                        {result.page_count && <span>{result.page_count} pages</span>}
                        {result.__search_hit__?.score && (
                          <span>Relevance: {Math.round(result.__search_hit__.score * 10)}%</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/documents/${result.id}/preview`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalCount > 10 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => performSearch(query, page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                Page {page} of {Math.ceil(totalCount / 10)}
              </span>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(totalCount / 10)}
                onClick={() => performSearch(query, page + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No documents found
                </h3>
                <p className="text-slate-600 mb-4">
                  Try a different search term or browse by brand
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/brands'}>
                  Browse Brands
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Initial State */}
      {!hasSearched && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Search Equipment Documentation
            </h3>
            <p className="text-slate-600">
              Enter a brand, model, or keyword to find manuals, specs, and guides
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
