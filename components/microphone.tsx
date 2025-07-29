"use client"

import { Button } from "./ui/button"
import { Mic } from "lucide-react"

import { useRecordVoice } from "@/lib/hooks/use-record-voice"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

export function Microphone({
  setInputText,
}: {
  setInputText: (text: string) => void
}) {
  const { toggleRecording, isRecording, error } = useRecordVoice(setInputText)
  const { toast } = useToast()
  const bgColor = isRecording ? "red" : "currentColor"

  useEffect(() => {
    if (error) {
      toast({
        title: "Error processing audio",
        description: "Please try again",
      })
    }
  }, [error, toast])

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="size-8 rounded-md p-0"
      onClick={toggleRecording}
    >
      <Mic height={18} color={bgColor} />
    </Button>
  )
}
