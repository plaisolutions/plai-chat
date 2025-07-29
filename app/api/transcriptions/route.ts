import fs from "fs"
import path from "path"

import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI()

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_PLAI_API_URL)
    throw new Error("Missing NEXT_PUBLIC_PLAI_API_URL")

  const body = await req.json()
  const project_id = body.projectId
  const base64Audio = body.audio
  const audioBuffer = Buffer.from(base64Audio, "base64")
  const audioArray = new Uint8Array(audioBuffer)
  const tempFilePath = path.join("/tmp", `audio-${Date.now()}.mp3`)
  fs.writeFileSync(tempFilePath, audioArray)

  // Get file size asynchronously
  fs.stat(tempFilePath, async (err, stats) => {
    if (err) {
      console.error("Failed to get file size", err)
      return NextResponse.json({ data: "Failed to process audio" })
    }

    registerWhisperRequest({
      project_id: project_id,
      llm_model: "OPENAI_WHISPER",
      llm_provider: "OPENAI",
      bytes: stats.size,
    })
  })

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: "whisper-1",
  })

  return NextResponse.json({ data: transcription.text })
}

async function registerWhisperRequest(payload: {
  project_id: string
  llm_model: string
  llm_provider: string
  bytes: number
}) {
  const token = process.env.USERS_MANAGEMENT_KEY

  if (!token) {
    throw new Error("Missing USERS_MANAGEMENT_KEY environment variable")
  }

  const url = new URL("/usage/whisper", process.env.NEXT_PUBLIC_PLAI_API_URL!)
  const request = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Users-Management-Key": token,
    },
    body: JSON.stringify(payload),
  })

  if (!request.ok) {
    throw new Error(`Failed to register whisper request: ${request.statusText}`)
  }

  const parsed = await request.json()
  console.info("Whisper request registered", parsed)
  return parsed
}
