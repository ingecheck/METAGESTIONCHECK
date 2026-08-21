import React, { useState, useRef, useEffect } from "react";
import {
  Scissors,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  Zap,
  BookOpen,
} from "lucide-react";
import { ClippedPdfSnippet, DetectedDocumentItem } from "../types/osce";
import { slicePdfFile, parsePageRanges } from "../services/pdfMasterService";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../services/pdfExtractor";

interface PdfCutterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnippetCreated: (snippet: ClippedPdfSnippet) => void;
  defaultCategory?: ClippedPdfSnippet["category"];
  initialPdf?: ExtractedPdfResult | null;
  initialTitle?: string;
  initialPageRange?: string;
  initialNotes?: string;
  detectedSuggestions?: DetectedDocumentItem[];
}

export const PdfCutterModal: React.FC<PdfCutterModalProps> = ({
  isOpen,
  onClose,
  onSnippetCreated,
  defaultCategory = "experiencia",
  initialPdf = null,
  initialTitle = "",
  initialPageRange = "",
  initialNotes = "",
  detectedSuggestions = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfResult, setPdfResult] = useState<ExtractedPdfResult | null>(initialPdf);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<ClippedPdfSnippet["category"]>(defaultCategory);
  const [pageRange, setPageRange] = useState(initialPageRange || "1-3");
  const [notes, setNotes] = useState(initialNotes);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPdf) {
      setPdfResult(initialPdf);
    }
  }, [initialPdf]);

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialPageRange) setPageRange(initialPageRange);
    if (initialNotes) setNotes(initialNotes);
  }, [initialTitle, initialPageRange, initialNotes]);

  if (!isOpen) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFile = files[0];

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Seleccione un archivo PDF válido.");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const extracted = await extractTextFromPdfFile(selectedFile);
      setPdfResult(extracted);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.pdf$/i, "").replace(/_/g, " "));
      }
      if (!pageRange || pageRange === "1-3") {
        setPageRange(`1-${Math.min(3, extracted.pageCount)}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al procesar el PDF: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplySuggestion = (sug: DetectedDocumentItem) => {
    setTitle(`${sug.nroDocumento} - ${sug.tipoDocumento} (${sug.cliente})`);
    setPageRange(sug.rangoPaginas || sug.rangoCorteSugerido || "1-3");
    setNotes(sug.justificacionSimilaridad || sug.instruccionCorte || "");
    setCategory(sug.destinatarioSobre || "experiencia");
    setSuccessMessage(`Corte pre-cargado: Páginas ${sug.rangoPaginas} para ${sug.nroDocumento}`);
  };

  const handleApplyPreset = (preset: "all" | "first1" | "first2" | "first3" | "last") => {
    if (!pdfResult) return;
    const total = pdfResult.pageCount;
    if (preset === "all") setPageRange(`1-${total}`);
    if (preset === "first1") setPageRange("1");
    if (preset === "first2") setPageRange(`1-${Math.min(2, total)}`);
    if (preset === "first3") setPageRange(`1-${Math.min(3, total)}`);
    if (preset === "last") setPageRange(`${total}`);
  };

  const handleCutAndSave = async () => {
    if (!pdfResult || !pdfResult.pdfBase64) {
      setErrorMessage("Por favor cargue un archivo PDF primero.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Por favor asigne un nombre identificador al recorte.");
      return;
    }

    const pagesToCut = parsePageRanges(pageRange, pdfResult.pageCount);
    if (pagesToCut.length === 0) {
      setErrorMessage(`Rango de páginas no válido. El documento tiene ${pdfResult.pageCount} páginas.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const sliced = await slicePdfFile(pdfResult.pdfBase64, pagesToCut);

      const snippet: ClippedPdfSnippet = {
        id: "snip-" + Date.now(),
        title: title.trim(),
        category,
        sourceFileName: pdfResult.fileName,
        selectedPages: `Páginas ${pageRange} (${sliced.pageCount} pág.)`,
        pageCount: sliced.pageCount,
        pdfBase64: sliced.base64,
        createdAt: Date.now(),
        notes: notes.trim() || undefined,
        isIncluded: true,
      };

      onSnippetCreated(snippet);
      setSuccessMessage(`¡Recorte creado con éxito! Se extrajeron ${sliced.pageCount} páginas listas para incorporar.`);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al recortar el PDF: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Cortador y Segmentador Inteligente de Páginas PDF
              </h3>
              <p className="text-[11px] text-slate-500">
                Segmenta y recorta exactamente las páginas que acreditan la especialidad requerida por las Bases.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. PDF Upload / Info Area */}
        {!pdfResult ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelected}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              Haga clic aquí para seleccionar el PDF completo (Contratos / CVs / Equipos)
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Sube el archivo completo y seleccionaremos únicamente las páginas relevantes que sustentan tu propuesta.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                PDF
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 text-xs truncate block">
                  {pdfResult.fileName}
                </span>
                <span className="text-[11px] text-slate-500">
                  Total de Páginas en el documento: <strong className="text-emerald-700">{pdfResult.pageCount} páginas</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPdfResult(null);
                setFile(null);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2.5 py-1 rounded hover:bg-slate-200 transition cursor-pointer shrink-0"
            >
              Cambiar Archivo
            </button>
          </div>
        )}

        {/* AI Suggestions Bar if available */}
        {detectedSuggestions && detectedSuggestions.length > 0 && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Contratos y Documentos Detectados en este PDF por IA:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {detectedSuggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleApplySuggestion(sug)}
                  className="text-left p-2.5 bg-white hover:bg-blue-100/60 border border-blue-100 hover:border-blue-300 rounded-lg transition text-xs space-y-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate group-hover:text-blue-700">
                      {sug.nroDocumento}
                    </span>
                    <span className="bg-blue-100 text-blue-800 font-mono text-[10.5px] px-1.5 py-0.5 rounded font-semibold shrink-0">
                      Págs. {sug.rangoPaginas}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {sug.tipoDocumento} - {sug.cliente}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="text-emerald-700 font-medium">{sug.especialidad}</span>
                    <span className="font-semibold text-blue-600 group-hover:underline">Aplicar corte →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Configuration Form */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre / Título Descriptivo del Recorte:
            </label>
            <input
              type="text"
              placeholder="Ej: Contrato N° 045-2023 Provías (Págs 1-3) y Acta Recepción"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Sobre / Carpeta donde se Incorporará:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="experiencia">Experiencia del Postor (Sobre 3)</option>
                <option value="personal">Personal Clave - CVs y Títulos (Sobre 3)</option>
                <option value="equipos">Equipamiento Estratégico (Sobre 3)</option>
                <option value="habilitacion">Habilitación Legal RNP / RUC / Poderes (Sobre 2)</option>
                <option value="economica">Propuesta Económica / Costos (Sobre 4)</option>
                <option value="otros">Otros Documentos de Admisión (Sobre 1)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Páginas a Extraer / Cortar:
              </label>
              <input
                type="text"
                placeholder="Ej: 1-3, 5, 8"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono font-bold text-blue-700"
              />
            </div>
          </div>

          {/* Quick Page Presets */}
          {pdfResult && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Atajos Rápidos:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("all")}
                className="text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
              >
                Todas ({pdfResult.pageCount} págs)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("first1")}
                className="text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
              >
                Solo Pág. 1
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("first2")}
                className="text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
              >
                Págs 1 a 2
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("first3")}
                className="text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
              >
                Págs 1 a 3
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("last")}
                className="text-[10.5px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition font-medium"
              >
                Última Pág. ({pdfResult.pageCount})
              </button>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notas o Justificación de Cumplimiento (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ej: Acredita el contrato de obra similar y su respectiva acta de recepción sin observaciones."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleCutAndSave}
            disabled={isProcessing || !pdfResult}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cortando PDF...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Cortar e Incorporar Recorte</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
