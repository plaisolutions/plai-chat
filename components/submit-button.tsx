"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { ButtonProps } from "@/components/ui/button"

interface SubmitButtonProps {
  variant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
  children: React.ReactNode
  disabled?: boolean
}

export default function SubmitButton({
  variant = "default",
  size = "default",
  children,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button variant={variant} size={size} type="submit" disabled={pending || disabled}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  )
}

