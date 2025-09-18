"use client"

import { getCookie } from "@/components/chat/context-utils"
import { useTranslation } from "@/components/chat/translations/useTranslation"

export default function Greeting() {
  const { t } = useTranslation()

  const userName = getCookie("chat_session_user_name")
  const greetingMessage = getCookie("chat_session_greeting_message")

  if (!userName || !greetingMessage) {
    return null
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <h2 className="mt-8 text-4xl font-bold text-black dark:text-white">
        {t("hello")} <span className="text-primary">{userName}</span>,
      </h2>
      <p className="mt-4 text-muted-foreground">{greetingMessage}</p>
      <div className="mt-4"></div>
    </div>
  )
}
