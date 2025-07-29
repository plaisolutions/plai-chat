//callback - where we want to get result
const blobToBase64 = (
  blob: Blob,
  callback: (base64data: string) => Promise<void>,
) => {
  const reader = new FileReader()
  reader.onload = function () {
    const result = reader?.result

    if (!result) {
      return
    }

    // Make sure it's a string and not an ArrayBuffer
    if (typeof result === "string") {
      const base64data = result.split(",")[1]
      callback(base64data)
    }
  }

  reader.readAsDataURL(blob)
}

export { blobToBase64 }
