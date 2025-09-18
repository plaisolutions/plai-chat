"use client"

import { useState, useEffect } from "react"
import { getDomainFromUrl, fetchPageTitle } from "@/lib/utils"

// Caché global para almacenar los títulos ya obtenidos
// Esto persiste entre renderizaciones y componentes
const titleCache: Record<string, string> = {}

/**
 * Hook personalizado para obtener títulos de páginas web de manera eficiente
 * @param urls Array de URLs para las que obtener títulos
 * @param skipFetch Si es true, solo devuelve los títulos del caché sin hacer nuevas solicitudes
 * @returns Objeto con los títulos de las páginas y un indicador de carga
 */
export function usePageTitles(urls: string[], skipFetch: boolean = false) {
  // Estado para almacenar los títulos y el estado de carga
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Efecto para cargar los títulos
  useEffect(() => {
    // Si no hay URLs o se debe omitir la obtención, no hacer nada
    if (!urls.length || skipFetch) return

    // Inicializar con los títulos que ya están en caché
    const initialTitles: Record<string, string> = {}
    const urlsToFetch: string[] = []

    // Primero, verificar cuáles ya están en caché
    urls.forEach((url) => {
      if (titleCache[url]) {
        // Si ya está en caché, usar ese valor
        initialTitles[url] = titleCache[url]
      } else {
        // Si no está en caché, usar el dominio temporalmente y añadir a la lista para obtener
        initialTitles[url] = getDomainFromUrl(url)
        urlsToFetch.push(url)
      }
    })

    // Actualizar el estado con los valores iniciales (caché + dominios)
    setTitles(initialTitles)

    // Si no hay URLs para obtener, terminar aquí
    if (!urlsToFetch.length) return

    // Función para cargar los títulos pendientes
    const loadTitles = async () => {
      setIsLoading(true)

      try {
        // Obtener todos los títulos en paralelo
        const promises = urlsToFetch.map(async (url) => {
          try {
            const title = await fetchPageTitle(url)
            // Actualizar el caché global
            titleCache[url] = title
            return { url, title }
          } catch (error) {
            console.error(`Error fetching title for ${url}:`, error)
            // En caso de error, usar el dominio
            const fallbackTitle = getDomainFromUrl(url)
            titleCache[url] = fallbackTitle
            return { url, title: fallbackTitle }
          }
        })

        // Esperar a que todas las promesas se resuelvan
        const results = await Promise.all(promises)

        // Actualizar el estado con los nuevos títulos
        setTitles((prev) => {
          const newTitles = { ...prev }
          results.forEach(({ url, title }) => {
            newTitles[url] = title
          })
          return newTitles
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Iniciar la carga de títulos
    loadTitles()
  }, [urls, skipFetch]) // Solo se ejecuta cuando cambian las URLs o skipFetch

  return { titles, isLoading }
}
