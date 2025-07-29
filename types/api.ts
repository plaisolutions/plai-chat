export interface RequestsByDay {
  date: string
  count: number
}

export interface ThreadsByDay {
  date: string
  count: number
}

export interface LLMUsage {
  date?: string
  llm_model: string
  type: string
  sum: {
    prompt_tokens: number
    completion_tokens: number
  }
  tokens?: number
  cost?: number
}

export interface RerankUsage {
  date: string
  provider: string
  model: string
  search_units: number
  requests?: number
  cost?: number
}

export interface WebsearchUsage {
  model: string
  provider: string
  prompt_tokens: number
  completion_tokens: number
  num_search_queries: number
}

export interface EmbeddingsUsage {
  date?: string
  llm_model: string
  type: string
  prompt_tokens: number
  tokens?: number
  cost?: number
}

export interface ScrapingUsage {
  date?: string
  provider: string
  type: string
  credits: number
  requests?: number
  cost?: number
}

export interface TranscriptionUsage {
  date?: string
  llm_model: string
  llm_provider: string
  bytes: number
  seconds?: number
  cost?: number
  minutes?: number
}

export interface PaginatedData<T> {
  data: T[]
  pagination: {
    page: number
    page_size: number
    total_pages: number
    total_items: number
    has_next: boolean
    has_previous: boolean
  }
}

export interface BigQueryCredentials {
  [key: string]: any
}

export interface BigQueryDatasetsResponse {
  datasets: Array<{
    id: string
    name: string
    projectId: string
  }>
}

export interface BigQueryTablesResponse {
  tables: Array<{
    id: string
    name: string
    type: string
  }>
}
