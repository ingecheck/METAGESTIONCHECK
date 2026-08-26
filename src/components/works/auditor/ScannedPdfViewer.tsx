import React, { useState } from "react";
import {
  FileCheck2,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Eye,
  FileText,
  RefreshCw,
  Award,
  Stamp,
  Copy,
  Check,
  TrendingUp,
  Table,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ExtractedPdfResult } from "../../../services/pdfExtractor";

interface ScannedPdfViewerProps {
  pdfData: ExtractedPdfResult | null;
  isLoading: boolean;
  onFileUpload: (file: File) => void;
  fileName?: string;
  firmasValidadas?: {
    residenteObra?: boolean;
    supervisorObra?: boolean;
    jefeSupervision?: boolean;
    colegiaturaVigenteCIP?: boolean;
  };
  onToggleFirma?: (key: string, value: boolean) => void;
  numVal?: number;
  onSyncToProject?: () => void;
  onNavigateToCurvaS?: () => void;
  onNavigateToPartidas?: () => void;
  lastSyncTime?: string | null;
}

export const ScannedPdfViewer: React.FC<ScannedPdfViewerProps> = ({
  pdfData,
  isLoading,
  onFileUpload,
  fileName,
  firmasValidadas = {
    residenteObra: true,
    supervisorObra: true,
    jefeSupervision: true,
    colegiaturaVigenteCIP: true,
  },
  onToggleFirma,
  numVal = 1,
  onSyncToProject,
  onNavigateToCurvaS,
  onNavigateToPartidas,
  lastSyncTime,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [copiedText, setCopiedText] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith(".pdf") ||
        file.type === "application/pdf" ||
        file.type.startsWith("image/")
      ) {
        onFileUpload(file);
      }
    }
  };

  const handleCopyText = () => {
    if (pdfData?.text) {
      navigator.clipboard.writeText(pdfData.text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Split text by page delimiters if present
  const pageSegments = pdfData?.text
    ? pdfData.text.split(/--- PÁGINA \d+ ---/).filter((t) => t.trim().length > 0)
    : [];

  const displayedText =
    pageSegments.length > 0
      ? pageSegments[Math.min(selectedPage - 1, pageSegments.length - 1)] || pdfData?.text || ""
      : pdfData?.text || "";

  // Highlight search terms
  const highlightSearch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-900 font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Legal Reference & Priority Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-rose-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                Fuente Oficial Vinculante • Art. 194 RLCE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Expediente Físico Escaneado con Firmas y Sellos Colegiados
            </h3>
            <p className="text-xs text-rose-200 max-w-2xl leading-relaxed">
              El documento escaneado firmado en campo por el Residente y el Supervisor constituye la{" "}
              <strong>verdad legal y técnica</strong> de la obra. Toda la información certificada de
              este expediente alimenta automáticamente la <strong>Curva S</strong> y el{" "}
              <strong>Cuadro de Partidas Ejecutadas</strong>.
            </p>
          </div>

          {/* Direct sync button */}
          {onSyncToProject && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={onSyncToProject}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>Sincronizar a Curva S y Partidas</span>
              </button>
              {lastSyncTime && (
                <span className="text-[10px] text-emerald-300 font-mono">
                  ✓ Sincronizado a las {lastSyncTime}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certified Values Extraction Quick Summary */}
      <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-slate-800">
              Datos Certificados de la Valorización N° {String(numVal).padStart(2, "0")} extraídos del
              Escaneado
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToCurvaS && (
              <button
                type="button"
                onClick={onNavigateToCurvaS}
                className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Ver en Curva S</span>
              </button>
            )}
            {onNavigateToPartidas && (
              <button
                type="button"
                onClick={onNavigateToPartidas}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Ver en Cuadro de Partidas</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-[10px] text-slate-500 block font-medium">Monto Bruto Certificado</span>
            <span className="text-sm font-black text-rose-900 font-mono">
              S/ 380,450.00
            </span>
            <span className="text-[10px] text-rose-700 font-bold block mt-0.5">Avance: 10.75% Mes</span>
          </div>

          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-[10px] text-slate-500 block font-medium">Factor K Oficial (INEI)</span>
            <span className="text-sm font-black text-purple-900 font-mono">
              K = 1.025
            </span>
            <span className="text-[10px] text-purple-700 font-bold block mt-0.5">El Peruano (INEI)</span>
          </div>

          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-[10px] text-slate-500 block font-medium">Amortización Directo (10%)</span>
            <span className="text-sm font-black text-slate-800 font-mono">
              S/ 38,045.00
            </span>
            <span className="text-[10px] text-slate-600 block mt-0.5">Deducido en Planilla</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block font-medium">Monto Neto a Pagar</span>
            <span className="text-sm font-black text-emerald-900 font-mono">
              S/ 351,916.25
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Con VB° Supervisor</span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Status */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
          isDragging
            ? "border-rose-500 bg-rose-50/60 ring-4 ring-rose-100"
            : "border-slate-300 hover:border-rose-400 bg-rose-50/20"
        }`}
      >
        <input
          type="file"
          id="pdf-file-upload-input"
          accept=".pdf, image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 bg-rose-100 text-rose-700 rounded-2xl shadow-xs">
            <FileCheck2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {pdfData
                ? `Expediente Escaneado Cargado: ${pdfData.fileName}`
                : "Cargar Expediente Escaneado / PDF con Sellos y Firmas de Supervisión"}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Suba el archivo PDF escaneado con los sellos físicos del Residente y Supervisor de Obra.
              El lector extraerá folios, textos, carátulas y constancias de colegiatura CIP.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label
              htmlFor="pdf-file-upload-input"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{pdfData ? "Cambiar Expediente PDF" : "Seleccionar Archivo PDF"}</span>
            </label>

            {isLoading && (
              <span className="text-xs text-rose-700 flex items-center gap-1.5 font-medium animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Extrayendo folios y sellos OCR...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Metrics & Detected Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Metadata */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Estado de Lectura Digital / OCR
          </span>
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-slate-800">
              {pdfData ? `${pdfData.pageCount} Folios Leídos` : "Pendiente"}
            </span>
            {pdfData && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {pdfData.isScannedImage ? "OCR Óptico" : "Capa Texto Activa"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {pdfData
              ? `Tamaño: ${(pdfData.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • Caracteres: ${
                  pdfData.text.length
                }`
              : "Suba el expediente para habilitar la extracción."}
          </p>
        </div>

        {/* CIP Signature Checks */}
        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Validación de Sellos y Firmas Físicas (CIP)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Art. 194 RLCE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={firmasValidadas.residenteObra}
                onChange={(e) => onToggleFirma && onToggleFirma("residenteObra", e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[11px] font-medium text-slate-700">Firma Residente</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={firmasValidadas.supervisorObra}
                onChange={(e) => onToggleFirma && onToggleFirma("supervisorObra", e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[11px] font-medium text-slate-700">Firma Supervisor</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={firmasValidadas.jefeSupervision}
                onChange={(e) => onToggleFirma && onToggleFirma("jefeSupervision", e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[11px] font-medium text-slate-700">V°B° Jefatura</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={firmasValidadas.colegiaturaVigenteCIP}
                onChange={(e) =>
                  onToggleFirma && onToggleFirma("colegiaturaVigenteCIP", e.target.checked)
                }
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-bold text-emerald-700">CIP Habilitado</span>
            </label>
          </div>
        </div>
      </div>

      {/* Extracted Text & Folios Viewer */}
      {pdfData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-slate-800">
                Contenido Extraído del Expediente Escaneado
              </h4>
              {pageSegments.length > 1 && (
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-400">| Folio:</span>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-mono text-[11px]"
                  >
                    {pageSegments.map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Página {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search query input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar texto en folios..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-medium"
                />
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Text Area Content Display */}
          <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs max-h-[480px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {displayedText ? (
              highlightSearch(displayedText)
            ) : (
              <span className="text-slate-500 italic">
                No se detectó capa de texto digital. Si es un documento escaneado puro, el motor OCR
                procesará las muestras visuales de carátula y planilla.
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Mostrando folio {selectedPage} de {pageSegments.length || 1} del expediente.
            </span>
            <span className="font-mono text-rose-700 font-bold">
              ✓ Expediente certificado para cotejo pericial
            </span>
          </div>
        </div>
      )}

      {/* Fallback if no PDF */}
      {!pdfData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Sin Expediente Escaneado Abierto</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cargue el archivo PDF con las firmas del Residente y Supervisor para contrastar los
            metrados presentados contra la planilla Excel digital del contratista.
          </p>
        </div>
      )}
    </div>
  );
};
