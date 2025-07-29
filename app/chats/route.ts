import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const schema = z.object({
    access: z.string(),
    refresh: z.string(),
    threadId: z.string(),
    userName: z.string().optional(),
    greetingMessage: z.string().optional(),
  })

  const validated = schema.safeParse({
    access: searchParams.get("access"),
    refresh: searchParams.get("refresh"),
    threadId: searchParams.get("threadId"),
    userName: searchParams.get("userName") ?? undefined,
    greetingMessage: searchParams.get("greetingMessage") ?? undefined,
  })

  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: validated.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { access, refresh, threadId, userName, greetingMessage } =
    validated.data
  const decoded = jwtDecode(access) as { id: string }

  const cookieStore = cookies()
  const cookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      | "none"
      | "lax",
  }

  cookieStore.set("chat_session_token", access, cookieOptions)
  cookieStore.set("chat_session_refresh_token", refresh, cookieOptions)
  cookieStore.set("chat_session_id", decoded.id, cookieOptions)

  if (!cookieStore.has("active_thread_id")) {
    cookieStore.set("active_thread_id", threadId, cookieOptions)
  }

  if (userName) {
    cookieStore.set("chat_session_user_name", userName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
  }

  if (greetingMessage) {
    cookieStore.set("chat_session_greeting_message", greetingMessage, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_PLAI_UI_URL

  return NextResponse.redirect(`${baseUrl}/chats/${decoded.id}`)
}
