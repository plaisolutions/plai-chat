import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeToIdentifier(str: string): string {
  const buffer = Buffer.from(str)
  return buffer.toString("base64")
}

export function decodeFromIdentifier(identifier: string): string {
  const buffer = Buffer.from(identifier, "base64")
  const text = buffer.toString("utf8")
  return text
}

export function mapMimeTypeToFileType(mimeType: string): string {
  const typeMapping: { [key: string]: string } = {
    "text/plain": "TXT",
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "text/markdown": "MARKDOWN",
    "text/x-markdown": "MARKDOWN",
    "text/csv": "CSV",
  }

  return typeMapping[mimeType] || "UNKNOWN"
}

export function formatDate(dateString: string): string | null | JSX.Element {
  // Validate input: return null if dateString is null, undefined, or empty.
  if (!dateString || dateString.trim() === "") {
    return null
  }

  const date = new Date(dateString)
  // Return null if the date is invalid
  if (isNaN(date.getTime())) {
    return null
  }

  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  const pad = (num: number) => num.toString().padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Extracts the domain name from a URL
 * @param url URL from which to extract the domain
 * @returns Domain name without 'www.'
 */
export function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    // Eliminar 'www.' si existe
    return hostname.replace(/^www\./, "")
  } catch (error) {
    console.error("Error parsing URL:", error)
    return url
  }
}

/**
 * Gets the title of a web page through the API
 * @param url URL of the web page
 * @returns Page title or domain if it cannot be obtained
 */
export async function fetchPageTitle(url: string): Promise<string> {
  try {
    // Llamar a nuestra API route
    const response = await fetch(
      `/api/fetch-title?url=${encodeURIComponent(url)}`,
    )

    if (!response.ok) {
      throw new Error(`Error fetching title: ${response.status}`)
    }

    const data = await response.json()
    return data.title || getDomainFromUrl(url)
  } catch (error) {
    console.error("Error fetching page title:", error)
    return getDomainFromUrl(url)
  }
}
