import { z } from "zod"

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  datasource_id: z.string(),
  parent_id: z.string().nullable(),
  extra_info: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Folder = z.infer<typeof folderSchema>

export type FolderWithChildren = Folder & {
  children: Folder[]
}

export const folderCreateSchema = z.object({
  name: z.string(),
  datasource_id: z.string(),
  parent_id: z.string().nullable(),
  extra_info: z.record(z.any()),
  project_id: z.string(),
  organization_id: z.string(),
})

export type FolderCreate = z.infer<typeof folderCreateSchema>

export const folderUpdateSchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_id: z.string().nullable(),
  extra_info: z.record(z.any()),
  datasource_id: z.string(),
  project_id: z.string(),
  organization_id: z.string(),
})

export type FolderUpdate = z.infer<typeof folderUpdateSchema>
