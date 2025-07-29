import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  itemsInPage: number
  hasNext: boolean
  hasPrevious: boolean
}

export function Pagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  itemsInPage,
  hasNext,
  hasPrevious,
}: PaginationProps) {
  return (
    <PaginationComponent>
      <PaginationContent>
        <PaginationItem>
          <Button variant="ghost" className="pl-0" disabled={!hasPrevious}>
            <Link href="#" className="flex items-center gap-1">
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Link>
          </Button>
        </PaginationItem>
        <PaginationItem className="text-sm">
          Showing {itemsInPage} of {totalItems}
        </PaginationItem>
        <PaginationItem>
          <Button variant="ghost" className="pr-0" disabled={!hasNext}>
            <Link href="#" className="flex items-center gap-1">
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationComponent>
  )
}
