import { z } from "zod"

export type Tool = {
  id: string
  name: string
  description: string
  type: "BROWSER" | "CODE_EXECUTOR" | "HTTP" | "PERPLEXITY" | "EXTERNAL_DATASOURCE"
  return_direct: boolean
  config: Record<string, any>
  project_id: string
  created_at: string
  updated_at: string
}

export const toolTypeEnum = z.enum(["BROWSER", "CODE_EXECUTOR", "HTTP", "PERPLEXITY", "EXTERNAL_DATASOURCE"])

export const toolCreateSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: toolTypeEnum,
  config: z.any().optional(),
})

export type ToolCreate = z.infer<typeof toolCreateSchema> & {
  project_id?: string
}

export const toolUpdateSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  tool_id: z.string(),
  name: z.string().min(5, "Name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: toolTypeEnum,
  config: z.any().optional(),
})

export type ToolUpdate = z.infer<typeof toolUpdateSchema>

export const toolDeleteSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  tool_id: z.string(),
})
