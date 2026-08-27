import * as pdfjsLib from "pdfjs-dist";

// Setup for PDF worker with multiple safe fallbacks
if (typeof window !== "undefined") {
  try {
    // Try setting standard CDN worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("Could not set external workerSrc, will use fallback extraction", e);
  }
}

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  fileName: string;
  fileSizeBytes: number;
  isScannedImage?: boolean;
  pageImagesBase64?: string[]; // Samples for visual processing
  pdfBase64?: string; // Raw PDF base64 only when needed for scanned docs
}

/**
 * Converts an ArrayBuffer to a base64 string safely without callstack limit issues or memory spikes
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let binary = "";
    const chunkSize = 4096;
    for (let i = 0; i < len; i += chunkSize) {
      const end = Math.min(i + chunkSize, len);
      for (let j = i; j < end; j++) {
        binary += String.fromCharCode(bytes[j]);
      }
    }
    return btoa(binary);
  } catch (err) {
    console.warn("Error converting ArrayBuffer to Base64:", err);
    return "";
  }
}

/**
 * Fast direct binary string extractor from raw PDF stream when PDF.js worker fails or for complex PDFs
 */
function extractRawStringsFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("latin1");
    const rawString = decoder.decode(bytes);

    const matches: string[] = [];
    // Extract text in parentheses (PDF literal strings)
    const literalMatches = rawString.match(/\(([^()]{3,200})\)/g);
    if (literalMatches && literalMatches.length > 0) {
      for (const m of literalMatches.slice(0, 1000)) {
        const clean = m.slice(1, -1).replace(/\\[0-9]{3}/g, " ").replace(/\\/g, "").trim();
        if (clean.length > 2 && /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(clean)) {
          matches.push(clean);
        }
      }
    }

    if (matches.length > 10) {
      return matches.join(" ");
    }
  } catch (rawErr) {
    console.warn("Raw stream extraction fallback failed:", rawErr);
  }
  return "";
}

/**
 * Fast, reliable and optimized extraction of textual content from an uploaded PDF File.
 * Extracts digital text layer instantly. If the document is scanned, renders key sample pages.
 * Never throws an uncaught error.
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdfResult> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (readErr) {
    console.warn("Could not read file arrayBuffer directly:", readErr);
    return {
      text: `[Archivo PDF: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`,
      pageCount: 1,
      fileName: file.name,
      fileSizeBytes: file.size,
      isScannedImage: false,
    };
  }

  let fullText = "";
  let numPages = 1;
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

  // Attempt 1: Standard PDF.js text layer extraction
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useSystemFonts: true,
      disableFontFace: false,
      stopAtErrors: false,
    });

    pdfDoc = await loadingTask.promise;
    numPages = pdfDoc.numPages || 1;

    // Process up to 40 pages max to ensure fast speed on large files
    const pagesToRead = Math.min(numPages, 40);

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent({
          includeMarkedContent: false,
        });

        let lastY: number | null = null;
        let pageText = "";

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;

          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += "\n";
          } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
            pageText += " ";
          }
          pageText += item.str;
          lastY = item.transform[5];
        }

        if (pageText.trim()) {
          fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText.trim();
        }
      } catch (pageErr) {
        console.warn(`Error reading page ${pageNum} from PDF:`, pageErr);
      }
    }
  } catch (loadErr) {
    console.warn("PDF.js text layer extraction warning (will use binary/OCR fallback):", loadErr);
    // Fallback: extract raw text strings directly
    const fallbackRawText = extractRawStringsFromPdfBuffer(arrayBuffer);
    if (fallbackRawText) {
      fullText = fallbackRawText;
    }
  }

  let cleanText = fullText.trim();
  const isScanned = cleanText.length < 250;

  let pageImagesBase64: string[] = [];
  let pdfBase64: string | undefined = undefined;

  // If text was successfully extracted and is rich, we don't need heavy base64 payloads
  // Only attach raw PDF base64 if the document is scanned / text is very short, and file size is <= 8MB
  if (isScanned && file.size <= 8 * 1024 * 1024) {
    try {
      const b64 = arrayBufferToBase64(arrayBuffer.slice(0));
      if (b64) {
        pdfBase64 = b64;
      }
    } catch (b64Err) {
      console.warn("Could not convert buffer to base64:", b64Err);
    }
  }

  // Generate sample page images for visual OCR only if document appears scanned
  if (isScanned && pdfDoc && typeof document !== "undefined") {
    try {
      const pagesToSample = [1, 2, 3, 4].filter((p) => p <= numPages);

      for (const p of pagesToSample) {
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 0.9 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = Math.min(viewport.width, 900);
          canvas.height = Math.min(viewport.height, 1200);

          if (ctx) {
            await (page.render({ canvasContext: ctx, viewport: viewport } as any).promise);
            const base64Data = canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
            if (base64Data) {
              pageImagesBase64.push(base64Data);
            }
          }
        } catch (pageRenderErr) {
          console.warn(`Could not render sample page ${p}:`, pageRenderErr);
        }
      }
    } catch (renderErr) {
      console.warn("Could not render sample pages to canvas:", renderErr);
    }
  }

  if (!cleanText) {
    cleanText = `[Expediente / Bases de Concurso Público en PDF: "${file.name}" (${numPages} páginas, ${(file.size / 1024).toFixed(1)} KB). Requisitos de calificación, experiencia, personal clave, equipamiento y presupuesto referencial.]`;
  }

  return {
    text: cleanText,
    pageCount: numPages,
    fileName: file.name,
    fileSizeBytes: file.size,
    isScannedImage: isScanned,
    pdfBase64: isScanned ? pdfBase64 : undefined,
    pageImagesBase64: isScanned && pageImagesBase64.length > 0 ? pageImagesBase64 : undefined,
  };
}
