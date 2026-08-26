import React, { useState } from "react";
import {
  FileSpreadsheet,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Scale,
  DollarSign,
  Plus,
} from "lucide-react";
import { AuditoriaValorizacion, IncongruenciaValorizacion } from "../../../types/obras";
import { ExtractedExcelResult } from "../../../services/excelExtractor";
import { ExtractedPdfResult } from "../../../services/pdfExtractor";

interface SideBySideComparatorProps {
  activeAuditoria: AuditoriaValorizacion;
  excelData: ExtractedExcelResult | null;
  pdfData: ExtractedPdfResult | null;
  onRunScan: () => void;
  isScanning: boolean;
  onAddIncongruencia: (incongruencia: Partial<IncongruenciaValorizacion>) => void;
}

export const SideBySideComparator: React.FC<SideBySideComparatorProps> = ({
  activeAuditoria,
  excelData,
  pdfData,
  onRunScan,
  isScanning,
  onAddIncongruencia,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner Action */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-wide">
              Cotejo Pericial Lado a Lado: Archivo Excel Digital vs. Expediente Escaneado
            </h3>
          </div>
          <p className="text-xs text-indigo-200">
            Contraste celda a celda los metrados y montos presentados por el contratista en formato
            editable con las firmas y folios certificados en el expediente físico.
          </p>
        </div>

        <button
          onClick={onRunScan}
          disabled={isScanning}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Contrastando Celdas..." : "Ejecutar Cruce Automatizado"}</span>
        </button>
      </div>

      {/* Side-by-Side Dual Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Digital Excel */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              1. Archivo Digital Excel (.xlsx / Contratista)
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              {excelData ? excelData.fileName : activeAuditoria.nombreArchivoExcel}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Key figures cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Planilla de Metrados</span>
                <span className="font-bold text-slate-900">
                  {excelData?.summaryData?.partidasCount || 22} Partidas Registradas
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Fórmula Polinómica K</span>
                <span className="font-bold font-mono text-emerald-800">K = 1.038 (Hoja Excel)</span>
              </div>
            </div>

            {/* Comparison Items extracted */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Muestras y Celdas Evaluadas en Excel
              </span>

              {activeAuditoria.incongruencias.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 text-xs space-y-1 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-slate-800">
                      {item.partidaItem ? `Item ${item.partidaItem}` : item.seccion}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      Excel: {item.valorExcel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">{item.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Physical Scanned PDF */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-rose-600" />
              2. Expediente Físico Escaneado (.pdf / Supervisión)
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              {pdfData ? pdfData.fileName : activeAuditoria.nombreArchivoEscaneado}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Key figures cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-rose-50/40 rounded-xl border border-rose-100">
                <span className="text-[10px] text-slate-500 block">Folios y Sellos Físicos</span>
                <span className="font-bold text-slate-900">
                  {pdfData ? `${pdfData.pageCount} Folios Leídos` : "Carátula Certificada"}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50/40 rounded-xl border border-rose-100">
                <span className="text-[10px] text-slate-500 block">K Oficial INEI (El Peruano)</span>
                <span className="font-bold font-mono text-rose-800">K = 1.025 (Físico)</span>
              </div>
            </div>

            {/* Comparison Items in Physical File */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Muestras Contrastadas en el Escaneado
              </span>

              {activeAuditoria.incongruencias.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50 hover:bg-rose-50/50 rounded-xl border border-slate-200 text-xs space-y-1 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-slate-800">
                      {item.partidaItem ? `Item ${item.partidaItem}` : item.seccion}
                    </span>
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-bold">
                      Escaneado: {item.valorEscaneado}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-black ${
                        item.gravedad === "CRÍTICO" ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      Diferencia:{" "}
                      {item.diferenciaSoles
                        ? `S/ ${item.diferenciaSoles.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}`
                        : item.diferenciaMetrado
                        ? `${item.diferenciaMetrado} unidades`
                        : "Discrepancia en sellos/firmas"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                      {item.gravedad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
