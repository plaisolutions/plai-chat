export type Request = {
  id: string
  agent_id: string
  llm_model: string
  llm_provider: string
  thread_id: string
  input_tokens: number
  output_tokens: number
  created_at: string
  updated_at: string
}
