"use client"

import { useEffect } from "react"
import { useFormState } from "react-dom"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useToast } from "@/hooks/use-toast"

import { impersonateUser } from "@/app/dashboard/[organizationId]/settings/impersonate/actions"
import SubmitButton from "./submit-button"

const initialState = {
  errors: {},
  message: "",
}

export function ImpersonateForm({ users }: { users: any }) {
  const [state, formAction] = useFormState(impersonateUser, initialState)
  const { toast } = useToast()

  useEffect(() => {
    if (state.message && state.errors) {
      toast({
        title: "Success",
        description: state.message,
      })
    }
  }, [state, toast])

  return (
    <div>
      <form
        action={formAction}
        className="flex w-full max-w-sm justify-between space-x-2"
      >
        <Select name="userId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SubmitButton variant="secondary">Impersonate</SubmitButton>
      </form>
      {state.errors?.general && (
        <p className="mt-2 text-sm text-red-500">{state.errors.general}</p>
      )}
      <p aria-live="polite" className="sr-only">
        {state.message}
      </p>
    </div>
  )
}
