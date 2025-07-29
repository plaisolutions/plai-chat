import { cookies } from "next/headers"

import { MobileMenu } from "@/components/mobile-menu"
import { UserMenu } from "@/components/user-menu"
import { HeaderBreadcrumb } from "@/components/header-breadcrumb"
import { OrganizationSelect } from "@/components/organization-select"

import type { OrganizationWithMembership } from "@/types/organizations"

export function Header({
  organizations,
}: {
  organizations: OrganizationWithMembership[]
}) {
  const cookieStore = cookies()
  const userJtw = cookieStore.get("user_jwt")?.value
  if (!userJtw) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <MobileMenu />
      <HeaderBreadcrumb token={userJtw} />
      <div className="relative ml-auto flex-1 md:grow-0">
        <OrganizationSelect organizations={organizations} />
      </div>
      <UserMenu image={null} />
    </header>
  )
}
