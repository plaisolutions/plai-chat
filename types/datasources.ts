import { z } from "zod"

export interface Datasource {
  id: string
  name: string
  type: "STRUCTURED" | "UNSTRUCTURED"
  description?: string
  summary?: string
  metadata_schema?: Record<string, any>
  project_id: string
  vector_db_id?: string
  created_at: string
  updated_at: string
}

export const datasourceCreateSchema = z.object({
  name: z
    .string()
    .min(10, "Name must be at least 10 characters")
    .max(64, "Name cannot exceed 64 characters"),
  type: z.enum(["STRUCTURED", "UNSTRUCTURED"], {
    errorMap: () => ({
      message: "Type must be either STRUCTURED or UNSTRUCTURED",
    }),
  }),
  description: z.string().optional(),
  summary: z.string(),
  metadata_schema: z
    .object({
      entries: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          optional: z.boolean(),
        }),
      ),
    })
    .optional(),
  project_id: z.string(),
  organization_id: z.string(),
  vector_db_id: z.string().default(""),
})

export type DatasourceCreate = z.infer<typeof datasourceCreateSchema>

export const datasourceUpdateSchema = z.object({
  datasource_id: z.string(),
  name: z
    .string()
    .min(10, "Name must be at least 10 characters")
    .max(64, "Name cannot exceed 64 characters"),
  summary: z.string(),
  type: z.enum(["STRUCTURED", "UNSTRUCTURED"], {
    errorMap: () => ({
      message: "Type must be either STRUCTURED or UNSTRUCTURED",
    }),
  }),
  description: z.string().optional(),
  metadata_schema: z
    .object({
      entries: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          optional: z.boolean(),
        }),
      ),
    })
    .optional(),
  project_id: z.string(),
  organization_id: z.string(),
  vector_db_id: z.string().default(""),
})

export type DatasourceUpdate = z.infer<typeof datasourceUpdateSchema>

export const datasourceDeleteSchema = z.object({
  project_id: z.string(),
  datasource_id: z.string(),
  organization_id: z.string(),
})

export type Resource = {
  id: string
  name: string
  summary: string
  url: string | null
  type: string
  datasource_id: string
  vectors?: number
  size?: number
  metadata?: Record<string, any>
  extra_info?: Record<string, any>
  external_url?: string
  external_resource_id?: string
  store?: boolean
  callback_url?: string
  status:
    | "IN_PROGRESS"
    | "VECTORIZING"
    | "SUMMARIZING"
    | "SCRAPING"
    | "DONE"
    | "FAILED"
  folder_id: string | null
  created_at: string
  updated_at: string
}

const mimeTypeEnum = z.enum([
  "text/plain",
  "application/pdf",
  "text/markdown",
  "text/x-markdown",
  "text/html",
  "text/csv",
])

export type MimeTypes = z.infer<typeof mimeTypeEnum>

/**
 * Mapeo de mimetypes de origen a mimetypes de destino.
 * Utilizado para normalizar los mimetypes antes de enviarlos a la API.
 */
export const mimeTypeMapping: Record<string, string> = {
  "text/x-markdown": "text/markdown",
}

/**
 * Obtiene el mimetype mapeado si existe, o el mimetype original si no hay un mapeo definido.
 * @param mimeType El mimetype original
 * @returns El mimetype mapeado o el original
 */
export function getMappedMimeType(mimeType: string): string {
  return mimeTypeMapping[mimeType] || mimeType
}

const valueSchema = z.union([z.string(), z.number(), z.boolean()])
const resourceMetadataSchema = z.record(z.string(), valueSchema)

export const resourceCreateSchema = z
  .object({
    organization_id: z.string(),
    project_id: z.string(),
    datasource_id: z.string(),
    name: z
      .string()
      .min(10, "The name must be at least 10 characters")
      .max(64, "The name cannot exceed 64 characters"),
    url: z.string().optional(),
    render: z
      .string()
      .transform((val) => val === "on")
      .default("off"),
    upload_type: z.enum(["WEBPAGE", "FILE", "CONTENT"]),
    content: z.string().optional(),
    mime_type: mimeTypeEnum.optional(),
    metadata: resourceMetadataSchema.optional(),
    extra_info: z.record(z.any()),
    external_url: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().url("Must be a valid URL").optional().nullable(),
    ),
    external_resource_id: z.string().optional(),
    callback_url: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().url("Must be a valid URL").optional().nullable(),
    ),
    store: z
      .preprocess(
        (val) => (val == null || val === "" || val === "off" ? false : val),
        z
          .union([z.boolean(), z.string()])
          .transform((val) => val === "on" || val === true),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.upload_type === "CONTENT") {
      console.log(data.content)
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Content is required for CONTENT type.",
        })
      }
    } else {
      if (!data.url || data.url.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: "Local File or Webpage URL is required",
        })
      }
    }
  })

type ResourceCreateBase = z.infer<typeof resourceCreateSchema>

export type ResourceCreate = ResourceCreateBase & {
  type: string
  config: Record<string, any> | null
}

export const resourceUpdateSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  current_datasource_id: z.string(),
  datasource_id: z.string(),
  resource_id: z.string(),
  name: z
    .string()
    .min(10, "The name must be at least 10 characters")
    .max(64, "The name cannot exceed 64 characters"),
  summary: z.string(),
  metadata: resourceMetadataSchema.optional(),
  external_url: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url("Must be a valid URL").optional().nullable(),
  ),
  external_resource_id: z.string().optional(),
  callback_url: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url("Must be a valid URL").optional().nullable(),
  ),
  store: z
    .preprocess(
      (val) => (val == null || val === "" || val === "off" ? false : val),
      z
        .union([z.boolean(), z.string()])
        .transform((val) => val === "on" || val === true),
    )
    .optional(),
})

export type ResourceUpdate = z.infer<typeof resourceUpdateSchema>

export interface ResourceListResponse {
  count: number
  page: number
  next: string | null
  previous: string | null
  results: Resource[]
}

export const resourceDeleteSchema = z.object({
  organization_id: z.string(),
  project_id: z.string(),
  datasource_id: z.string(),
  resource_id: z.string(),
})
