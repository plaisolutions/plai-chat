enum Provider {
  OPENAI = "OPENAI",
  ANYSCALE = "ANYSCALE",
  TOGETHERAI = "TOGETHERAI",
}

export interface LLM {
  display_name: string
  providers: string[]
  allows_tools: boolean
  allows_streaming: boolean
  allows_temperature?: boolean
}

export interface ModelsApiResponse {
  [modelKey: string]: LLM
}
