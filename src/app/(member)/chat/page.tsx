'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import type { ChatMessage, Citation } from '@/types'

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        citations: data.citations,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const quickPrompts = [
    'How old is my Carrier AC?',
    'Decode Trane serial 915C12345',
    'What refrigerant does a 2015 Lennox use?',
    'Goodman warranty information',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          AI Assistant
        </h1>
        <p className="text-slate-600 mt-1">
          Ask questions about HVAC equipment. All answers include source citations.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {messages.length === 0 && (
          <Card className="bg-slate-50">
            <CardContent className="py-8 text-center">
              <Bot className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-slate-900 mb-2">
                How can I help you?
              </h2>
              <p className="text-slate-600 mb-6">
                Ask me about serial numbers, equipment specs, or troubleshooting.
                I only answer from verified documentation.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm hover:bg-slate-50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
            )}

            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'bg-white border border-slate-200 rounded-2xl rounded-bl-md'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="p-4">
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        Sources
                      </p>
                      <div className="space-y-2">
                        {message.citations.map((citation, j) => (
                          <CitationCard key={j} citation={citation} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No citations warning */}
                  {message.citations?.length === 0 && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        No source documents found. This response may be incomplete.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <span>{message.content}</span>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching documentation...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about equipment, decode serials, or search manuals..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="lg">
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          All answers are based on indexed documentation. Results may not cover all brands.
        </p>
      </div>
    </div>
  )
}

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="p-2 bg-slate-50 rounded-lg text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-slate-700">
          Doc #{citation.paperlessDocId}
        </span>
        <span className="text-slate-500">
          pp. {citation.pageStart}–{citation.pageEnd}
        </span>
      </div>
      <p className="text-slate-600 italic truncate">
        "{citation.excerpt}"
      </p>
      <button
        onClick={() => window.open(`/search?doc=${citation.paperlessDocId}`, '_blank')}
        className="mt-1 text-primary-600 hover:underline flex items-center gap-1"
      >
        View source <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  )
}
