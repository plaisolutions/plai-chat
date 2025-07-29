"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Project } from "@/types/projects"

export function HeaderBreadcrumb({ token }: { token: string }) {
  const params = useParams<{ organizationId: string; projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    async function getProject() {
      const requestUrl = new URL(
        process.env.NEXT_PUBLIC_PLAI_API_URL +
          `/organizations/${params.organizationId}/projects/${params.projectId}`,
      )
      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setProject(data)
    }

    if (params.organizationId && params.projectId) {
      getProject()
    } else {
      setProject(null)
    }
  }, [params.organizationId, params.projectId, token])

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {params.organizationId && (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`/dashboard/${params.organizationId}/projects`}
                onClick={() => {
                  setProject(null)
                }}
              >
                Projects
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        {params.organizationId && project && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/dashboard/${params.organizationId}/projects/${params.projectId}`}
                >
                  {project.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
