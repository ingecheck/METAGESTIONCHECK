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
  pageImagesBase64?: string[]; // Samples for Gemini Vision OCR
  pdfBase64?: string; // Full raw PDF base64 for direct Gemini Multimodal document OCR
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
 * Extracts textual content from an uploaded PDF File object in the browser.
 * If the PDF is a scanned document (contains no selectable digital text layer),
 * it captures the raw PDF base64 and renders pages so Gemini Multimodal Vision OCR can process it directly.
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfBase64 = arrayBufferToBase64(arrayBuffer);
  
  let fullText = "";
  let numPages = 1;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: false,
    });

    const pdf = await loadingTask.promise;
    numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          includeMarkedContent: false,
        });

        let lastY: number | null = null;
        let pageText = "";

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          
          // Add newlines between vertical blocks for better structured reading
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
  // If extracted text is less than 150 characters for the entire document, it is a scanned image
  const isScanned = cleanText.length < 150;

  let pageImagesBase64: string[] = [];

  // If it's a scanned PDF, render key pages (cover + TDR/spec pages) to canvas for image fallback
  if (isScanned && typeof document !== "undefined") {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      
      // Render sample pages (first pages and middle section where TDR/Budgets are)
      const pagesToSample = [1, 2, 3, Math.min(10, numPages), Math.min(15, numPages)].filter(
        (p, idx, self) => p <= numPages && self.indexOf(p) === idx
      );

      for (const p of pagesToSample) {
        const page = await pdf.getPage(p);
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
      console.warn("Could not render scanned pages to canvas:", renderErr);
    }
  }

  return {
    text: cleanText || `[Documento PDF Escaneado: "${file.name}" (${numPages} páginas). Se aplicará OCR Multimodal con Visión Inteligente para digitalizar tablas, montos de obra, personal y requisitos].`,
    pageCount: numPages,
    fileName: file.name,
    fileSizeBytes: file.size,
    isScannedImage: isScanned,
    pdfBase64: pdfBase64,
    pageImagesBase64: pageImagesBase64.length > 0 ? pageImagesBase64 : undefined,
  };
}
