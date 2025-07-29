"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import type { OrganizationWithMembership } from "@/types/organizations"

export default function OrganizationAvatar({
  organization,
}: {
  organization: OrganizationWithMembership
}) {
  return (
    <Avatar className="hidden border border-muted-foreground">
      <AvatarImage src="" />
      <AvatarFallback>
        {organization.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
