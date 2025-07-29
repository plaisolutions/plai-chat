"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import jwt from "jsonwebtoken"

import { blobToBase64 } from "@/lib/blob-to-base64"
import { createMediaStream } from "@/lib/create-media-stream"
import { decodeFromIdentifier } from "@/lib/utils"
import type { Params } from "next/dist/shared/lib/router/utils/route-matcher"

function getProjectIdFrom(params: Params): string {
  if (params.shareId) {
    const token = decodeFromIdentifier(params.shareId)
    const payload = jwt.decode(token)
    if (typeof payload !== "string" && payload && "project_id" in payload) {
      return payload.project_id
    }
  }

  return params.projectId
}

export const useRecordVoice = (setInputText: (text: string) => void) => {
  const [error, setError] = useState("")
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const chunks = useRef<Blob[]>([])
  const params = useParams()
  const projectId = getProjectIdFrom(params)

  const startRecording = () => {
    if (mediaRecorder) {
      setInputText("Recording...")
      mediaRecorder.start()
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const getTransription = async (base64data: string) => {
    setInputText("Processing audio...")

    const response = await fetch("/api/transcriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio: base64data,
        projectId: projectId,
      }),
    })

    if (!response.ok) {
      console.error("Error processing audio: ", response)
      setError("Error processing audio")
      return
    }

    const body = await response.json()
    setInputText(body.data)
  }

  const initialMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.onstart = () => {
      createMediaStream(stream, isRecording)
      chunks.current = []
    }

    mediaRecorder.ondataavailable = (ev) => {
      chunks.current.push(ev.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks.current, { type: "audio/wav" })
      blobToBase64(audioBlob, getTransription)
    }

    setMediaRecorder(mediaRecorder)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(initialMediaRecorder)
    }
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    error,
  }
}
