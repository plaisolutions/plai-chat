"use client"

import { useRouter, useParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { OrganizationWithMembership } from "@/types/organizations"

interface OrganizationSelectProps {
  organizations: OrganizationWithMembership[]
}

export function OrganizationSelect({ organizations }: OrganizationSelectProps) {
  const router = useRouter()
  const { organizationId, projectId } = useParams<{
    organizationId: string
    projectId: string
  }>()

  function handleSelect(organizationId: string) {
    if (!organizationId) return
    router.push(`/dashboard/${organizationId}/projects`)
  }

  return (
    <Select
      value = {organizationId || ""}
      onValueChange={(value) => handleSelect(value)}
    >
      <SelectTrigger className="min-w-[200px]">
        <SelectValue/>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Select an organization</SelectItem>
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
