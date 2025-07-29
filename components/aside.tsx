"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { siteConfig } from "@/config/site"

import Logo from "./logo"
import { Home, Settings } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

export function Aside() {
  const params = useParams<{ organizationId: string; projectId: string }>()
  let homeUrl = "/dashboard"

  if (params.organizationId) {
    homeUrl = `/dashboard/${params.organizationId}/projects`

    if (params.projectId) {
      homeUrl = `/dashboard/${params.organizationId}/projects/${params.projectId}`
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <div className="mb-2">
          <Logo />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={homeUrl}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:size-8"
              >
                <Home className="size-5" />
                <span className="sr-only">Dashboard</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {params.projectId &&
          siteConfig.mainNav.map((navItem) => (
            <TooltipProvider key={navItem.slug}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/dashboard/${params.organizationId}/projects/${params.projectId}/${navItem.slug}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:size-8"
                  >
                    <navItem.icon size={20} />
                    <span className="sr-only">{navItem.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{navItem.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
      </nav>
      {params.organizationId && (
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/dashboard/${params.organizationId}/settings/users`}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:size-8"
                >
                  <Settings className="size-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      )}
    </aside>
  )
}
