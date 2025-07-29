import { z } from "zod"

export interface Agent {
  id: string
  name: string
  avatar: string
  initial_message: string
  description: string
  is_active: boolean
  llm_model: string
  llm_provider: string
  temperature: number
  max_tokens: number
  max_steps: number
  vector_topk: number
  rerank_enabled: boolean
  rerank_topk: number
  prompt: string
  enable_streaming: boolean
  enable_citations: boolean
  enable_tools: boolean
  created_at: string
  updated_at: string
  project_id: string
}

export const createAgentSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enable_streaming: z.boolean(),
  is_active: z.boolean(),
  llm_model: z.string(),
  llm_provider: z.string(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
})

export type AgentCreate = z.infer<typeof createAgentSchema>

export const deleteAgentSchema = z.object({
  agent_id: z.string(),
  organization_id: z.string(),
  project_id: z.string(),
})

export type AnswerFilter = {
  id: string
  agent_id: string
  trigger_threshold: number
  queries: string[]
  bad_responses: string[]
  good_responses: string[]
  created_at: string
  updated_at: string
}

export const answerFilterCreateSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  agent_id: z.string(),
  trigger_threshold: z.number().default(0.5),
  queries: z.array(z.string()),
  good_responses: z.array(z.string()),
  bad_responses: z.array(z.string()),
})

export type AnswerFilterCreate = z.infer<typeof answerFilterCreateSchema>

export interface AnswerFilterListResponse {
  data: AnswerFilter[]
  has_more: boolean
  next: string
  previous: string
}

export const answerFilterUpdateSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  project_id: z.string(),
  agent_id: z.string(),
  trigger_threshold: z.number().default(0.5),
  queries: z.array(z.string()),
  good_responses: z.array(z.string()),
  bad_responses: z.array(z.string()),
})

export type AnswerFilterUpdate = z.infer<typeof answerFilterUpdateSchema>

export const answerFilterDeleteSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  project_id: z.string(),
  agent_id: z.string(),
})

export type AnswerFilterDelete = z.infer<typeof answerFilterDeleteSchema>

export interface Guardrail {
  id: string
  title: string
  description: string
  type: string
  version_id: string
  organization_id: string | null
  created_at: string
  updated_at: string
}

export interface GuardrailListResponse {
  success: boolean
  data: Guardrail[]
}

export interface AgentGuardrail {
  id: string
  agent_id: string
  guardrail_id: string
  priority: number
  created_at: string
  updated_at: string
  guardrail?: Guardrail
}

export interface AgentGuardrailListResponse {
  success: boolean
  data: AgentGuardrail[]
}

export const agentGuardrailCreateSchema = z.object({
  agent_id: z.string(),
  guardrail_id: z.string(),
  priority: z.number().min(0).max(10),
  organization_id: z.string(),
  project_id: z.string(),
})

export type AgentGuardrailCreate = z.infer<typeof agentGuardrailCreateSchema>

export const agentGuardrailDeleteSchema = z.object({
  agent_id: z.string(),
  guardrail_id: z.string(),
  organization_id: z.string(),
  project_id: z.string(),
})

export type AgentGuardrailDelete = z.infer<typeof agentGuardrailDeleteSchema>
