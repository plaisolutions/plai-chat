"use client"

import { useState, useEffect, useRef, ChangeEvent } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import {
  createSignedUrl,
  setFileMetadata,
} from "@/app/dashboard/[organizationId]/projects/[projectId]/datasources/actions"

interface FileUploadProps {
  bucketName: string
  isUploading: boolean
  setIsUploading: (value: boolean) => void
  setResourceUrl: (value: string) => void
  datasourceType: "UNSTRUCTURED" | "STRUCTURED"
}

const extensionToMimeType: Record<string, string> = {
  ".md": "text/markdown",
  ".mdx": "text/markdown",
  ".markdown": "text/plain",
  ".pdf": "application/pdf",
  ".html": "text/html",
}

export function FileUpload({
  bucketName,
  isUploading,
  setIsUploading,
  setResourceUrl,
  datasourceType,
}: FileUploadProps) {
  const [signedUrl, setSignedUrl] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !files[0]) return

    const allowedTypes =
      datasourceType === "UNSTRUCTURED"
        ? [
            "application/pdf",
            "text/html",
            "text/plain",
            "text/markdown",
            "text/x-markdown",
            "text/xml",
            "text/csv",
          ]
        : [
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ]

    const file = files[0]
    let fileType = file.type

    // Extraer la extensión del archivo
    const fileExtension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase()

    // Asignar el tipo MIME basado en la extensión, si está en el mapa
    if (extensionToMimeType[fileExtension]) {
      fileType = extensionToMimeType[fileExtension]
    }

    if (!allowedTypes.includes(fileType)) {
      if (!fileExtension || fileType === "") {
        setErrorMessage("File type is not allowed. Please upload a valid file.")
      } else {
        setErrorMessage(
          `File type "${fileType}" is not allowed. Please upload a valid file.`,
        )
      }
      if (inputRef.current) {
        inputRef.current.value = ""
      }

      return
    }

    setErrorMessage(null) // Limpiar mensaje de error si el archivo es válido
    setFile(files[0])
  }

  useEffect(() => {
    if (!file) return

    async function getSignedUrl(fileName: string, mimeType: string) {
      const { error, signedUrl } = await createSignedUrl(fileName, mimeType)
      if (error) {
        console.error(error)
        return
      }
      setSignedUrl(signedUrl)
    }

    getSignedUrl(file.name, file.type)
  }, [file, signedUrl])

  useEffect(() => {
    if (!signedUrl || !file) return

    const uploadFile = async () => {
      setIsUploading(true)

      try {
        const response = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!response.ok) {
          console.error("Upload failed")
          throw new Error("Failed to upload file")
        }

        if (file.name.endsWith(".xml")) {
          await setFileMetadata(file.name, "text/plain")
        }

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`
        setResourceUrl(publicUrl)
      } catch (error) {
        console.error(error)
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    }

    uploadFile()
  }, [signedUrl, file, setIsUploading, setResourceUrl, bucketName])

  return (
    <div className="grid w-full items-center gap-1.5">
      {!file && (
        <UploadInput
          inputRef={inputRef}
          file={file}
          handleFileChange={handleFileChange}
          datasourceType={datasourceType}
        />
      )}
      {file && (
        <FilePreview
          file={file}
          setFile={(value) => {
            setFile(value)
            if (!value) {
              setResourceUrl("")
            }
          }}
        />
      )}
      {errorMessage && (
        <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
      )}
      <input type="hidden" name="mime_type" value={file?.type} />
    </div>
  )
}

interface UploadInputProps {
  inputRef: React.RefObject<HTMLInputElement>
  file: File | null
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  datasourceType: "UNSTRUCTURED" | "STRUCTURED"
}

function UploadInput({
  inputRef,
  file,
  handleFileChange,
  datasourceType,
}: UploadInputProps) {
  const allowedTypes =
    datasourceType === "UNSTRUCTURED" ? "PDF, TXT, MD, HTML, Sitemap XML" : "CSV, XSLX"
  return (
    <>
      <Label htmlFor="file">File upload (Allowed types: {allowedTypes})</Label>
      <Input
        id="file"
        type="file"
        name="file"
        ref={inputRef}
        onChange={handleFileChange}
      />
    </>
  )
}

function FilePreview({
  file,
  setFile,
}: {
  file: File
  setFile: (value: File | null) => void
}) {
  const fileName = file.name.slice(0, file.name.lastIndexOf(".")) || file.name
  const fileExtension = file.name.slice(file.name.lastIndexOf(".")) || ""

  return (
    <div className="flex flex-col items-start justify-center rounded border-dashed border-indigo-300 bg-muted-foreground/10 p-2">
      <div className="flex gap-0 text-sm">
        <p className="max-w-[280px] truncate text-gray-500 dark:text-accent">
          {fileName}
        </p>
        <span className="text-gray-500 dark:text-accent">{fileExtension}</span>
      </div>
      <Button
        variant="link"
        className="mb-2 mt-4 h-6 bg-gray-500/70 p-2 text-muted40 hover:bg-gray-500 hover:no-underline dark:bg-accent/70 dark:hover:bg-accent"
        onClick={() => {
          setFile(null)
        }}
      >
        Remove
      </Button>
    </div>
  )
}
