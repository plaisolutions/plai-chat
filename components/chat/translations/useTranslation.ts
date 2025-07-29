"use client"

import { useState, useEffect } from "react"
import { getCookie } from "@/components/chat/utils"

// Definir los idiomas soportados
type SupportedLanguage = "en" | "es"

// Función para detectar el idioma del navegador
function getUserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "en" // Valor por defecto para SSR
  }

  const userLang = getCookie("user_lang")
  if (userLang) {
    return userLang as SupportedLanguage
  }

  // Obtener el idioma del navegador
  const browserLanguage = navigator.language || (navigator as any).userLanguage

  // Extraer el código de idioma principal (por ejemplo, 'es-ES' -> 'es')
  const languageCode = browserLanguage.split("-")[0]

  // Comprobar si el idioma está soportado
  if (languageCode === "es") {
    return "es"
  }

  // Si no está soportado, devolver inglés como idioma por defecto
  return "en"
}

export function useTranslation() {
  const [language, setLanguage] = useState<SupportedLanguage>("en")
  const [translations, setTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    // Detectar el idioma del navegador cuando el componente se monta
    const detectedLanguage = getUserLanguage()
    setLanguage(detectedLanguage)

    // Cargar el archivo JSON correspondiente al idioma detectado
    import(`./${detectedLanguage}.json`)
      .then((module) => {
        setTranslations(module.default)
      })
      .catch((error) => {
        console.error(
          `Error loading translations for ${detectedLanguage}:`,
          error,
        )
        // Si hay un error, intentar cargar las traducciones en inglés como fallback
        if (detectedLanguage !== "en") {
          import("./en.json")
            .then((module) => {
              setTranslations(module.default)
            })
            .catch((error) => {
              console.error("Error loading fallback translations:", error)
            })
        }
      })
  }, [])

  // Función para traducir una clave
  const t = (key: string): string => {
    if (key in translations) {
      return translations[key]
    }

    // Si no se encuentra la traducción, devolver la clave original
    return key
  }

  return {
    language,
    t,
  }
}
