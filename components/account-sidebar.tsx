"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navItems = [
  { title: "Profile", slug: "profile" },
  { title: "Invitations", slug: "invitations" },
  { title: "Appearance", slug: "appearance" },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="mb-4 flex flex-col space-x-2 pr-0 lg:space-x-0 lg:space-y-1 lg:pr-4">
      {navItems.map((item) => (
        <Link
          key={item.slug}
          href={`/dashboard/account/${item.slug}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            pathname.includes(item.slug) && "bg-muted hover:bg-muted",
            "justify-start",
          )}
        >
          {item.title}
        </Link>
      ))}
      <a
        href="/auth/logout"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "justify-start",
        )}
      >
        Logout
      </a>
    </nav>
  )
}
