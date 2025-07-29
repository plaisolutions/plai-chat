"use client"

import { useTranslation } from "@/components/chat/translations/useTranslation"

interface GreetingProps {
  userName: string
  greetingMessage: string
}

export default function Greeting({ userName, greetingMessage }: GreetingProps) {
  const { t } = useTranslation()
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
