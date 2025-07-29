"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/chat/translations/useTranslation"

interface ThreadSearchProps {
  threads: any[]
  onFilteredThreadsChange: (filteredThreads: any[]) => void
}

export default function ThreadSearch({
  threads,
  onFilteredThreadsChange,
}: ThreadSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    const filtered = threads.filter((thread) => {
      const title = thread.title || `Chat ${thread.id.slice(0, 8)}...`
      return title.toLowerCase().includes(searchTerm.toLowerCase())
    })
    onFilteredThreadsChange(filtered)
  }, [searchTerm, threads, onFilteredThreadsChange])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t("search_conversations")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
