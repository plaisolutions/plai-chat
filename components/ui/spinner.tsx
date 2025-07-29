import { Loader2 } from "lucide-react"

export const Icons = {
  spinner: Loader2,
}

export function Spinner() {
  return <Icons.spinner className="size-4 animate-spin" />
}
