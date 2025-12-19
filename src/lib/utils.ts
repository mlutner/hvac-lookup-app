import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatManufactureDate(date: string | null): string {
  if (!date) return 'Unknown'

  // Handle formats like "2015-Q1", "2015-W23", "2015-06", "2015"
  if (date.includes('-Q')) {
    const [year, quarter] = date.split('-Q')
    return `Q${quarter} ${year}`
  }
  if (date.includes('-W')) {
    const [year, week] = date.split('-W')
    return `Week ${week}, ${year}`
  }
  if (date.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = date.split('-')
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long' })
    return `${monthName} ${year}`
  }
  return date
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length - 3) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
