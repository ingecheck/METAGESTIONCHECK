import React, { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  RotateCcw,
  RotateCw,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  RefreshCw,
  FileText,
  Highlighter,
  HelpCircle,
  Undo2,
  Redo2,
  Table,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface WordDocumentEditorProps {
  initialHtml: string;
  documentTitle: string;
  documentSubtitle?: string;
  nomenclatura?: string;
  onContentChange?: (html: string, plainText: string) => void;
  onDownloadDocx?: () => void;
  onResetToDefault?: () => void;
  isDownloadingDocx?: boolean;
  extraActions?: React.ReactNode;
}

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  initialHtml,
  documentTitle,
  documentSubtitle,
  nomenclatura,
  onContentChange,
  onDownloadDocx,
  onResetToDefault,
  isDownloadingDocx = false,
  extraActions,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedHtmlRef = useRef<string>(initialHtml);
  const [copied, setCopied] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Guardado");
  const [wordCount, setWordCount] = useState<number>(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: true,
  });

  // Initialize or update editor content ONLY if it changed externally (e.g. reset, doc switch),
  // NEVER when the user is typing/deleting inside the editor
  useEffect(() => {
    if (editorRef.current && initialHtml !== lastEmittedHtmlRef.current) {
      editorRef.current.innerHTML = initialHtml;
      lastEmittedHtmlRef.current = initialHtml;
      updateCounts();
    }
  }, [initialHtml]);

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || "";
    lastEmittedHtmlRef.current = html;
    updateCounts();
    setLastSavedTime(
      new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    if (onContentChange) {
      onContentChange(html, text);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
    checkActiveFormats();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      executeCommand("bold");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      executeCommand("italic");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      executeCommand("underline");
    } else if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
      handleInput();
    }
  };

  const checkActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
      });
    } catch (e) {
      // ignore
    }
  };

  const handleCopyFormatted = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!editorRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle} - ${nomenclatura || "OSCE"}</title>
          <style>
            @page { size: A4; margin: 25mm 20mm 25mm 20mm; }
            body {
              font-family: "Calibri", "Segoe UI", Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #1e293b;
              margin: 0;
              padding: 20px;
            }
            h1, h2, h3, h4 { color: #0f172a; text-align: center; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            p { text-align: justify; margin: 8px 0; }
            .header-doc { text-align: right; font-size: 8pt; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="header-doc">${nomenclatura || "DOCUMENTO OFICIAL OSCE - LEY N° 32069"}</div>
          ${editorRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="bg-slate-200/80 rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col">
      {/* Top Word Ribbon / Toolbar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-white uppercase tracking-wide">
                {documentTitle}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Editor Word Interactivo
              </span>
            </div>
            {documentSubtitle && (
              <p className="text-[11px] text-slate-400">{documentSubtitle}</p>
            )}
          </div>
        </div>

        {/* Right Header Status & Actions */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-guardado ({lastSavedTime})</span>
          </span>

          <button
            type="button"
            onClick={handleCopyFormatted}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer border border-slate-700"
            title="Copiar texto completo al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer border border-slate-700"
            title="Imprimir o Exportar a PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          {onDownloadDocx && (
            <button
              type="button"
              onClick={onDownloadDocx}
              disabled={isDownloadingDocx}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Descargar en formato editable Microsoft Word (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingDocx ? "Generando..." : "Descargar Word (.docx)"}</span>
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Formatting Tools Ribbon */}
      <div className="bg-white px-4 py-2 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
        {/* Left Toolbar Groups */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* History */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("undo")}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded text-slate-700 transition cursor-pointer"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("redo")}
              className="p-1.5 hover:bg-white hover:text-blue-600 rounded text-slate-700 transition cursor-pointer"
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Text Style: Bold, Italic, Underline, Strikethrough */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("bold")}
              className={`p-1.5 rounded transition cursor-pointer font-bold text-xs ${
                activeFormats.bold
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Negrita (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("italic")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.italic
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("underline")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.underline
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Subrayado (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-blue-600 rounded transition cursor-pointer"
              title="Tachado"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("hiliteColor", "#fef08a")}
              className="p-1.5 hover:bg-yellow-100 text-yellow-800 rounded transition cursor-pointer"
              title="Resaltar texto en amarillo"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Heading / Style dropdown */}
          <div className="flex items-center space-x-1">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  executeCommand("formatBlock", e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="bg-slate-100 hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
              title="Estilo de párrafo o encabezado"
            >
              <option value="" disabled>
                Estilo...
              </option>
              <option value="<p>">Párrafo Normal</option>
              <option value="<h2>">Título Principal (H2)</option>
              <option value="<h3>">Subtítulo / Cláusula (H3)</option>
              <option value="<h4>">Sección / Artículo (H4)</option>
            </select>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Alignments */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyLeft")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.justifyLeft
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Alinear a la izquierda"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyCenter")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.justifyCenter
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Centrar"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyRight")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.justifyRight
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Alinear a la derecha"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyFull")}
              className={`p-1.5 rounded transition cursor-pointer ${
                activeFormats.justifyFull
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "hover:bg-white text-slate-700 hover:text-blue-600"
              }`}
              title="Justificar texto (Recomendado para contratos)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          {/* Lists */}
          <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("insertUnorderedList")}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-blue-600 rounded transition cursor-pointer"
              title="Lista con viñetas"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("insertOrderedList")}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-blue-600 rounded transition cursor-pointer"
              title="Lista numerada"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center space-x-2">
          {onResetToDefault && (
            <button
              type="button"
              onClick={onResetToDefault}
              className="flex items-center space-x-1 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Restablecer documento a los datos originales de la empresa y bases"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer Original</span>
            </button>
          )}

          <div className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
            {wordCount} palabras
          </div>
        </div>
      </div>

      {/* Interactive Document Workspace / Sheet Canvas */}
      <div
        onClick={() => {
          if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.focus();
          }
        }}
        className="p-4 sm:p-8 overflow-y-auto max-h-[680px] bg-slate-200/90 flex justify-center cursor-text"
      >
        <div className="w-full max-w-3xl bg-white shadow-xl border border-slate-300 rounded-sm p-8 sm:p-14 text-slate-900 font-serif leading-relaxed relative min-h-[840px] focus-within:ring-2 focus-within:ring-blue-500/40">
          {/* Header Watermark / Reference */}
          <div className="text-right text-[10px] text-slate-400 font-sans border-b border-slate-200 pb-2 mb-6 flex justify-between items-center select-none">
            <span className="font-semibold text-blue-900 uppercase">
              {nomenclatura || "SISTEMA SEACE OSCE • LEY N° 32069"}
            </span>
            <span>Documento Editable en Tiempo Real</span>
          </div>

          {/* Content Editable Area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={checkActiveFormats}
            onMouseUp={checkActiveFormats}
            className="outline-none min-h-[600px] text-xs sm:text-sm text-slate-800 space-y-3 selection:bg-blue-100 selection:text-blue-950 focus:outline-none cursor-text"
            style={{
              fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
              lineHeight: 1.5,
              caretColor: "#2563eb",
            }}
          />

          {/* Footer Page Number / Stamp Indicator */}
          <div className="pt-8 mt-12 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans flex justify-between items-center select-none">
            <span>Directiva N° 005-2019-OSCE/CD • TUO Ley de Contrataciones</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </div>

      {/* Bottom Information Banner */}
      <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">
            <strong>Modo Word Activado:</strong> Haz clic en cualquier párrafo, nombre, porcentaje o cláusula para modificarla libremente.
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Las modificaciones se reflejan de inmediato al exportar a Word (.docx) o imprimir.
        </span>
      </div>
    </div>
  );
};
