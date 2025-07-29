"use client"

import * as React from "react"

export interface useCopyToClipboardProps {
  timeout?: number
}

export function useCopyToClipboard({
  timeout = 2000,
}: useCopyToClipboardProps) {
  const [isCopied, setIsCopied] = React.useState<boolean>(false);

  /**
   * Copies content to clipboard.
   * @param value - The string or HTMLElement to copy.
   * @param options - { html: boolean, clean: boolean } - if html is true and clean is true, removes <button> elements before copying as HTML.
   */
  const copyToClipboard = async (
    value: string | HTMLElement,
    options: { html?: boolean, clean?: boolean } = {}
  ) => {
    if (typeof window === "undefined") return;

    const { html = false } = options;

    let textToCopy = "";
    let htmlToCopy = "";

    if (typeof value === "string") {
      textToCopy = value;
      htmlToCopy = value;
    } else if (value instanceof HTMLElement) {
      let node = value;
      if (options.html && options.clean) {
        // Clone the node to avoid mutating the DOM
        const clone = value.cloneNode(true) as HTMLElement;
        // Remove all <button> elements
        clone.querySelectorAll('button').forEach(btn => btn.remove());
        node = clone;
      }
      textToCopy = node.innerText;
      htmlToCopy = node.outerHTML;
    } else {
      return;
    }

    try {
      if (
        html &&
        navigator.clipboard &&
        (window.ClipboardItem || (window as any).ClipboardItem)
      ) {
        const type = "text/html";
        const blob = new Blob([htmlToCopy], { type });
        const data = [new window.ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = html ? htmlToCopy : textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), timeout);
    } catch (e) {
      setIsCopied(false);
    }
  };

  return { isCopied, copyToClipboard };
}
