import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extraer el título de la página
    let title = $("title").text().trim()

    // Si no hay título, intentar con metadatos
    if (!title || title.length < 3) {
      title =
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("h1").first().text().trim()
    }

    // Limpiar y limitar la longitud del título
    title = title.replace(/\s+/g, " ").trim()

    return NextResponse.json({ title: title || null })
  } catch (error) {
    console.error("Error fetching title:", error)
    return NextResponse.json(
      { error: "Failed to fetch title" },
      { status: 500 },
    )
  }
}
