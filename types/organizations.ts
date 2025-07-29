import { z } from "zod"

import type { User } from "@/types/users"
import type { Project } from "@/types/projects"

export type Organization = {
  id: string
  name: string
  address_line_1: string
  address_line_2?: string
  zipcode?: string
  state?: string
  country?: string
  created_at: string
  updated_at: string
}

enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export const organizationCreateSchema = z.object({
  name: z.string(),
  address_line_1: z.string().min(1, "Address Line 1 is required"),
  address_line_2: z.string().optional(),
  zipcode: z.string().min(1, "Zipcode is required"),
  state: z.string().min(1, "State is required"),
  country: z.enum(["US", "ES", "FR", "IT", "DE"]),
})

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>

export interface OrganizationMembership {
  id: string
  user_id: string
  user?: User
  organization_id: string
  role: Role
  created_at: string
  updated_at: string
}

export const editMembershipRoleSchema = z.object({
  id: z.string(),
  role: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER"]),
  organization_id: z.string(),
  project_id: z.string(),
})

export type EditMembershipRole = z.infer<typeof editMembershipRoleSchema>

export interface OrganizationWithMembership extends Organization {
  membership: OrganizationMembership
}

export interface OrganizationMember {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
  membership: OrganizationMembership
}

export type Invitation = {
  id: string
  email: string
  organization_id: string
  organization_role: Role
  project_id: string | null
  project: Project | null
  project_role: Role
  created_at: string
  updated_at: string
}

export type invitationWithOrganization = Invitation & {
  organization: Organization
}

export const invitationCreateSchema = z.object({
  email: z.string().email(),
  organization_id: z.string(),
  organization_role: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER"]),
  project_id: z.string().optional(),
  project_role: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER"]),
})

export type InvitationCreate = z.infer<typeof invitationCreateSchema>

export const invitationDeleteSchema = z.object({
  organization_id: z.string(),
  invitation_id: z.string(),
})
