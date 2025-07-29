"use client"

import React from "react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { MemoizedReactMarkdown } from "@/components/markdown"
import { CodeBlock } from "@/components/codeblock"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RxCheck, RxCopy } from "react-icons/rx"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"
import { DocumentCitation } from "@/components/chat/document-citation"

function MarkdownTableWithCopy({ children, ...props }: any) {
  const tableRef = React.useRef<HTMLTableElement>(null)
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const handleCopy = () => {
    if (tableRef.current) {
      copyToClipboard(tableRef.current, { html: true, clean: true })
    }
  }

  return (
    <div className="group relative mb-4 overflow-auto rounded-md border">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 text-xs hover:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0"
        onClick={handleCopy}
      >
        {isCopied ? <RxCheck size="18px" /> : <RxCopy size="18px" />}
        <span className="sr-only">Copy code</span>
      </Button>
      <Table ref={tableRef} {...props}>
        {children}
      </Table>
    </div>
  )
}

interface CustomMarkdownProps {
  messageBody: string
  processCitations?: boolean
  className?: string
}

export const CustomMarkdown = ({
  messageBody,
  processCitations = true,
  className,
}: CustomMarkdownProps) => {
  // Process document citations first
  const { processedBody, documentCitations } =
    processDocumentCitations(messageBody)

  // Procesar las fuentes si está habilitado
  const finalBody = processCitations
    ? processCitationsInMarkdown(processedBody)
    : processedBody

  return (
    <div className="mb-2">
      <MemoizedReactMarkdown
        className={cn(
          "prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 mt-2 inline break-words text-sm",
          className,
        )}
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          table: MarkdownTableWithCopy,
          thead({ children, ...props }) {
            return <TableHeader {...props}>{children}</TableHeader>
          },
          tbody({ children, ...props }) {
            return <TableBody {...props}>{children}</TableBody>
          },
          tr({ children, ...props }) {
            return <TableRow {...props}>{children}</TableRow>
          },
          th({ children, ...props }) {
            return (
              <TableHead className="py-2" {...props}>
                {children}
              </TableHead>
            )
          },
          td({ children, ...props }) {
            return (
              <TableCell className="py-2" {...props}>
                {children}
              </TableCell>
            )
          },
          p({ children, ...props }) {
            return (
              <p className="mb-2" {...props}>
                {children}
              </p>
            )
          },
          h1({ children, ...props }) {
            return (
              <h1 className="mb-4 mt-6 pb-2 text-3xl font-bold" {...props}>
                {children}
              </h1>
            )
          },
          h2({ children, ...props }) {
            return (
              <h2 className="mb-3 mt-5 pb-1 text-2xl font-semibold" {...props}>
                {children}
              </h2>
            )
          },
          h3({ children, ...props }) {
            return (
              <h3 className="mb-2 mt-4 text-xl font-semibold" {...props}>
                {children}
              </h3>
            )
          },
          h4({ children, ...props }) {
            return (
              <h4 className="mb-2 mt-4 text-lg font-medium" {...props}>
                {children}
              </h4>
            )
          },
          h5({ children, ...props }) {
            return (
              <h5 className="mb-2 mt-4 text-base font-medium" {...props}>
                {children}
              </h5>
            )
          },
          h6({ children, ...props }) {
            return (
              <h6
                className="mb-2 mt-4 text-sm font-medium text-gray-600"
                {...props}
              >
                {children}
              </h6>
            )
          },
          hr({ children, ...props }) {
            return null
          },
          img({ children, ...props }) {
            return null
          },
          video({ children, ...props }) {
            return null
          },
          embed({ children, ...props }) {
            return null
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-primary underline"
                rel="noreferrer"
                target="_blank"
              >
                {children}
              </a>
            )
          },
          ol({ children, ...props }) {
            // Asegurar que el atributo ordered sea true si es booleano
            const sanitizedProps = { ...props }
            if (typeof sanitizedProps.ordered === "boolean") {
              sanitizedProps.ordered = "true" as any // Usar type assertion para evitar el error de TypeScript
            }

            return (
              <ol className="mb-5 list-decimal pl-[30px]" {...sanitizedProps}>
                {children}
              </ol>
            )
          },
          ul({ children }) {
            return <ul className="mb-5 list-disc pl-[30px]">{children}</ul>
          },
          li({ children }) {
            return <li className="pb-1">{children}</li>
          },
          code({ node, inline, className, children, ...props }) {
            if (children.length) {
              if (children[0] == "▍") {
                return (
                  <span className="mt-1 animate-pulse cursor-default">▍</span>
                )
              }

              children[0] = (children[0] as string).replace("`▍`", "▍")
            }

            const match = /language-(\w+)/.exec(className || "")

            if (inline) {
              return (
                <code
                  className="light:bg-slate-200 px-1 text-sm dark:bg-slate-800"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                key={Math.random()}
                language={(match && match[1]) || ""}
                value={String(children).replace(/\n$/, "")}
                {...props}
              />
            )
          },
        }}
      >
        {finalBody}
      </MemoizedReactMarkdown>

      {/* Render document citations inline */}
      {documentCitations.map((citation: { ids: string[] }, index: number) => (
        <DocumentCitation key={index} ids={citation.ids} />
      ))}
    </div>
  )
}

// Función para procesar las fuentes en el texto markdown
function processCitationsInMarkdown(text: string): string {
  // Si no hay texto o no contiene el patrón de fuentes, devolver el texto original
  if (!text || !text.includes("\n\nSources:")) {
    return text
  }

  // Dividir el texto en dos partes: el contenido principal y la sección de fuentes
  const parts = text.split("\n\nSources:")
  if (parts.length !== 2) {
    return text
  }

  let [mainContent, sourcesSection] = parts

  // Extraer las fuentes usando una expresión regular
  const sourceRegex = /\n\((\d+)\) (https?:\/\/[^\s]+)/g
  const sources: { num: string; url: string }[] = []
  let match

  while ((match = sourceRegex.exec(sourcesSection)) !== null) {
    sources.push({
      num: match[1],
      url: match[2],
    })
  }

  // Si no se encontraron fuentes, devolver el texto original
  if (sources.length === 0) {
    return text
  }

  // Reemplazar las referencias [n] en el contenido principal con enlaces
  // Primero, ordenamos las fuentes por número en orden descendente para evitar problemas con reemplazos parciales
  const sortedSources = [...sources].sort(
    (a, b) => parseInt(b.num) - parseInt(a.num),
  )
  const allRefsRegex = /\[(\d+)\]/g

  // Reemplazamos todas las referencias de una vez
  mainContent = mainContent.replace(allRefsRegex, (match, num) => {
    // Buscamos la fuente correspondiente al número
    const source = sources.find((s) => s.num === num)
    if (source) {
      // Mantenemos los corchetes en el texto del enlace
      return ` [[${num}]](${source.url})`
    }
    // Si no encontramos la fuente, dejamos la referencia sin cambios
    return match
  })

  // Formatear la sección de fuentes como una lista markdown
  const formattedSources =
    "\n\n### Sources:\n" +
    sources
      .map((source) => `${source.num}. [${source.url}](${source.url})`)
      .join("\n")

  // Devolver el contenido principal con las referencias vinculadas y la sección de fuentes formateada
  return mainContent + formattedSources
}

// Function to process document citations in the message body
function processDocumentCitations(text: string): {
  processedBody: string
  documentCitations: Array<{ ids: string[] }>
} {
  const documentCitations: Array<{ ids: string[] }> = []

  // First, process the streaming format: <document-citation ids="..." />
  let processedBody = text.replace(
    /<document-citation\s+ids="([^"]+)"\s*\/>/g,
    (match: string, idsString: string) => {
      const ids = idsString
        .split(",")
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0)
      documentCitations.push({ ids })
      return "" // Remove the tag from the processed body
    },
  )

  // Then, process the raw format from refetched messages: <documents ids="..." />
  processedBody = processedBody.replace(
    /<documents\s+ids="([^"]+)"\s*\/>/g,
    (match: string, idsString: string) => {
      const ids = idsString
        .split(",")
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0)
      documentCitations.push({ ids })
      return "" // Remove the tag from the processed body
    },
  )

  return { processedBody, documentCitations }
}
