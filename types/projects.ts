import { z } from "zod"

export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  organization_id: string
  allowed_domains: string[]
  membership: ProjectMembership
}

export const projectCreateSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  organization_id: z.string(),
  allowed_domains: z.array(z.string()),
})

export type ProjectCreate = z.infer<typeof projectCreateSchema>

export const projectEditSchema = z.object({
  project_id: z.string(),
  name: z.string().min(3),
  description: z.string(),
  organization_id: z.string(),
  allowed_domains: z.array(z.string()),
})

export interface ProjectMembership {
  id: string
  user_id: string
  project_id: string
  organization_id: string
  role: "VIEWER" | "MEMBER" | "ADMIN" | "OWNER"
  token: string
  created_at: string
  updated_at: string
}

export interface ProjectStats {
  agents: number
  datasources: number
  resources: number
  tools: number
  requests: number
}

export type Member = {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
  membership: ProjectMembership
}

export const membershipUpdateSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  membership_id: z.string(),
  role: z.enum(["VIEWER", "MEMBER", "ADMIN"]),
})

export type MembershipUpdate = z.infer<typeof membershipUpdateSchema>

export const membershipDeleteSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  membership_id: z.string(),
})

export type MembershipDelete = z.infer<typeof membershipDeleteSchema>
