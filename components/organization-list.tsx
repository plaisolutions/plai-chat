import Link from "next/link"

import type { OrganizationWithMembership } from "@/types/organizations"
import { ChevronRightIcon } from "lucide-react"
import OrganizationAvatar from "@/components/organization-avatar"

import { formatDate } from "@/lib/utils"

export function OrganizationList({
  organizations,
}: {
  organizations: OrganizationWithMembership[]
}) {
  return (
    <ul
      role="list"
      className="my-4 grid grid-cols-1 gap-4 md:grid-cols-3 2xl:grid-cols-4"
    >
      {organizations.map((organization) => (
        <li
          key={organization.id}
          className="relative rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="p-6">
            <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
              <div className="flex flex-col gap-1.5">
                <OrganizationAvatar organization={organization} />
                <div className="min-w-0 flex-auto">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {organization.name}
                  </h3>
                  <p className="pt-2 text-sm text-muted-foreground">
                    <span className="rounded-2xl bg-black px-2 py-1 text-xs leading-none text-white">
                      {organization.membership.role}
                    </span>
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/dashboard/${organization.id}/projects`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-input px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    View Projects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
