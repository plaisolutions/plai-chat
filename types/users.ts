import { z } from "zod"

export type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export const userCreateSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
})

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userCreateSchema>
