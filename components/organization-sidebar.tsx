"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navItems = [
  { title: "Users", slug: "users" },
  { title: "Invitations", slug: "invitations" },
  { title: "Impersonate", slug: "impersonate" },
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const { organizationId } = useParams<{ organizationId: string }>()

  return (
    <nav className="mb-4 flex flex-col space-x-2 pr-0 lg:space-x-0 lg:space-y-1 lg:pr-4">
      {navItems.map((item) => (
        <Link
          key={item.slug}
          href={`/dashboard/${organizationId}/settings/${item.slug}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            pathname &&
              pathname.includes(item.slug) &&
              "bg-muted hover:bg-muted",
            "justify-start",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
