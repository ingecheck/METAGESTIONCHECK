import * as pdfjsLib from "pdfjs-dist";

// Safe setup for PDF worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("Could not set external workerSrc", e);
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
 * Converts an ArrayBuffer to a base64 string safely without callstack limit issues
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Fast and optimized extraction of textual content from an uploaded PDF File.
 * Extracts digital text layer instantly. If the document is scanned, renders only key sample pages.
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  let fullText = "";
  let numPages = 1;
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

  try {
    // Pass a cloned buffer slice to prevent detaching the original buffer
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useSystemFonts: true,
      disableFontFace: false,
    });

    pdfDoc = await loadingTask.promise;
    numPages = pdfDoc.numPages;

    // Process up to 30 pages max to ensure fast speed on large files
    const pagesToRead = Math.min(numPages, 30);

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
    console.warn("Could not parse text layer with PDF.js:", loadErr);
  }

  const cleanText = fullText.trim();
  const isScanned = cleanText.length < 150;

  let pageImagesBase64: string[] = [];
  let pdfBase64: string | undefined = undefined;

  // Always attach raw PDF base64 if under 12MB for native Gemini Multimodal PDF understanding
  if (file.size < 12 * 1024 * 1024) {
    try {
      pdfBase64 = arrayBufferToBase64(arrayBuffer.slice(0));
    } catch (b64Err) {
      console.warn("Could not convert buffer to base64:", b64Err);
    }
  }

  // Generate sample page images for visual layout / OCR fallback
  if (pdfDoc && typeof document !== "undefined") {
    try {
      const pagesToSample = [1, 2, 3, 4, 5].filter((p) => p <= numPages);

      for (const p of pagesToSample) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await (page.render({ canvasContext: ctx, viewport: viewport } as any).promise);
          const base64Data = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
          if (base64Data) {
            pageImagesBase64.push(base64Data);
          }
        }
      }
    } catch (renderErr) {
      console.warn("Could not render sample pages to canvas:", renderErr);
    }
  }

  return {
    text: cleanText || `[Documento PDF: "${file.name}" (${numPages} páginas). Digitalización y extracción de metadatos de obra, montos, plazos y cláusulas contractuales].`,
    pageCount: numPages,
    fileName: file.name,
    fileSizeBytes: file.size,
    isScannedImage: isScanned,
    pdfBase64: pdfBase64,
    pageImagesBase64: pageImagesBase64.length > 0 ? pageImagesBase64 : undefined,
  };
}
