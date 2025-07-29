"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { DateRangePicker } from "./date-range"

export function RequestsFiltersForm() {
  const { replace } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialDateFrom = searchParams.get("date_from")
  const initialDateTo = searchParams.get("date_to")

  const [date, setDate] = useState<DateRange>({
    from: initialDateFrom ? new Date(initialDateFrom) : subDays(new Date(), 7), // last 7 days
    to: initialDateTo ? new Date(initialDateTo) : new Date(),
  })

  const handleFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date_from", date.from ? format(date.from, "yyyy-MM-dd") : "")
    params.set("date_to", date.to ? format(date.to, "yyyy-MM-dd") : "")
    replace(`${pathname}?${params.toString()}`)
  }, [date, searchParams, pathname, replace])

  useEffect(() => {
    if (!initialDateFrom && !initialDateTo) {
      handleFilter();
    }
  }, [initialDateFrom, initialDateTo, handleFilter]);

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("date_from")
    params.delete("date_to")
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <DateRangePicker date={date} setDate={setDate} />
      <Button type="button" onClick={handleFilter}>
        Filter
      </Button>
      <Button variant="secondary" onClick={clearFilters}>
        Clear
      </Button>
    </div>
  )
}
