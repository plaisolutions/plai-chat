"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModelsApiResponse } from "@/types/llms"

interface ModelSelectorProps {
  llms: ModelsApiResponse
  model: string
  setModel: (value: string) => void
}

export function ModelSelector({ llms, model, setModel }: ModelSelectorProps) {
  const models = []

  for (const [key, llm] of Object.entries(llms)) {
    models.push({ model: key, displayName: llm.display_name })
  }

  return (
    <Select
      name="llmModel"
      defaultValue={model}
      onValueChange={(value) => setModel(value)}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Any model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Any model</SelectItem>
        {models.map(({ model, displayName }) => (
          <SelectItem key={model} value={model}>
            {displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
