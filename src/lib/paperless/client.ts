import { PaperlessSearchResponse, PaperlessDocument } from '@/types'

const PAPERLESS_BASE_URL = process.env.PAPERLESS_BASE_URL || 'http://localhost:8000'
const PAPERLESS_API_TOKEN = process.env.PAPERLESS_API_TOKEN || ''

interface PaperlessRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function paperlessRequest<T>(
  endpoint: string,
  options: PaperlessRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const url = `${PAPERLESS_BASE_URL}/api${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Token ${PAPERLESS_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Paperless API error: ${response.status} ${error}`)
  }

  return response.json()
}

/**
 * Search documents in Paperless with full-text search
 */
export async function searchDocuments(
  query: string,
  options: {
    page?: number
    pageSize?: number
    tags?: number[]
    documentType?: number
  } = {}
): Promise<PaperlessSearchResponse> {
  const params = new URLSearchParams()
  params.set('query', query)

  if (options.page) params.set('page', options.page.toString())
  if (options.pageSize) params.set('page_size', options.pageSize.toString())
  if (options.tags?.length) {
    options.tags.forEach((tag) => params.append('tags__id__in', tag.toString()))
  }
  if (options.documentType) {
    params.set('document_type__id', options.documentType.toString())
  }

  return paperlessRequest<PaperlessSearchResponse>(`/documents/?${params.toString()}`)
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: number): Promise<PaperlessDocument> {
  return paperlessRequest<PaperlessDocument>(`/documents/${id}/`)
}

/**
 * Get document content/text
 */
export async function getDocumentContent(id: number): Promise<string> {
  const doc = await getDocument(id)
  return doc.content
}

/**
 * Upload a document to Paperless
 */
export async function uploadDocument(
  file: File,
  metadata?: {
    title?: string
    correspondent?: number
    documentType?: number
    tags?: number[]
  }
): Promise<string> {
  const formData = new FormData()
  formData.append('document', file)

  if (metadata?.title) formData.append('title', metadata.title)
  if (metadata?.correspondent) {
    formData.append('correspondent', metadata.correspondent.toString())
  }
  if (metadata?.documentType) {
    formData.append('document_type', metadata.documentType.toString())
  }
  if (metadata?.tags?.length) {
    formData.append('tags', JSON.stringify(metadata.tags))
  }

  const response = await fetch(`${PAPERLESS_BASE_URL}/api/documents/post_document/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${PAPERLESS_API_TOKEN}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload failed: ${response.status} ${error}`)
  }

  // Returns task ID
  return response.text()
}

/**
 * Check task status
 */
export async function getTaskStatus(taskId: string): Promise<{
  id: string
  task_id: string
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE'
  result?: unknown
}> {
  const response = await paperlessRequest<{
    results: Array<{
      id: string
      task_id: string
      status: string
      result?: unknown
    }>
  }>(`/tasks/?task_id=${taskId}`)

  if (response.results.length === 0) {
    return { id: '', task_id: taskId, status: 'PENDING' }
  }

  return response.results[0] as {
    id: string
    task_id: string
    status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE'
    result?: unknown
  }
}

/**
 * Get all tags
 */
export async function getTags(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const response = await paperlessRequest<{
    results: Array<{ id: number; name: string; slug: string }>
  }>('/tags/')
  return response.results
}

/**
 * Get all document types
 */
export async function getDocumentTypes(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const response = await paperlessRequest<{
    results: Array<{ id: number; name: string; slug: string }>
  }>('/document_types/')
  return response.results
}

/**
 * Get document download URL
 */
export function getDocumentDownloadUrl(id: number): string {
  return `${PAPERLESS_BASE_URL}/api/documents/${id}/download/`
}

/**
 * Get document preview URL
 */
export function getDocumentPreviewUrl(id: number): string {
  return `${PAPERLESS_BASE_URL}/api/documents/${id}/preview/`
}
