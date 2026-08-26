import React, { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Table as TableIcon,
  Download,
  Info,
  RefreshCw,
} from "lucide-react";
import { ExtractedExcelResult, ParsedExcelSheet } from "../../../services/excelExtractor";

interface ExcelWorksheetViewerProps {
  excelData: ExtractedExcelResult | null;
  isLoading: boolean;
  onFileUpload: (file: File) => void;
  fileName?: string;
}

export const ExcelWorksheetViewer: React.FC<ExcelWorksheetViewerProps> = ({
  excelData,
  isLoading,
  onFileUpload,
  fileName,
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const activeSheet: ParsedExcelSheet | undefined = excelData?.sheets[activeSheetIndex];

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
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        onFileUpload(file);
      }
    }
  };

  // Filter rows based on search
  const filteredRows = activeSheet
    ? activeSheet.rows.filter((row) => {
        if (!searchFilter.trim()) return true;
        const rowStr = row.map((c) => String(c || "")).join(" ").toLowerCase();
        return rowStr.includes(searchFilter.toLowerCase());
      })
    : [];

  return (
    <div className="space-y-4">
      {/* Upload Zone & Status */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-100"
            : "border-slate-300 hover:border-emerald-400 bg-emerald-50/20"
        }`}
      >
        <input
          type="file"
          id="excel-file-upload-input"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {excelData
                ? `Archivo Excel Cargado: ${excelData.fileName}`
                : "Cargar Archivo Excel (.xlsx / .xls) de la Valorización"}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Arrastre y suelte la planilla de metrados digital o haga clic para examinar. El sistema
              extraerá automáticamente hojas, partidas, coeficientes K y fórmulas.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label
              htmlFor="excel-file-upload-input"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{excelData ? "Cambiar Archivo Excel" : "Seleccionar Archivo Excel"}</span>
            </label>

            {isLoading && (
              <span className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Leyendo hojas y fórmulas...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Chips if Excel parsed */}
      {excelData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Hojas
            </span>
            <span className="text-base font-black text-slate-800">
              {excelData.sheetNames.length} Hojas
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Partidas Detectadas
            </span>
            <span className="text-base font-black text-emerald-700">
              {excelData.summaryData?.partidasCount || 0} Partidas
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Monto Bruto Estimado
            </span>
            <span className="text-base font-black font-mono text-indigo-900">
              {excelData.summaryData?.montoBruto
                ? `S/ ${excelData.summaryData.montoBruto.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}`
                : "Calculado en Hoja"}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Tamaño de Archivo
            </span>
            <span className="text-base font-black font-mono text-slate-700">
              {(excelData.fileSizeBytes / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      )}

      {/* Interactive Sheet Viewer */}
      {excelData && activeSheet && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Bar with Sheet Tabs & Search */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Hojas:
              </span>
              {excelData.sheetNames.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                    activeSheetIndex === idx
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar celda o partida..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center font-mono text-[10px] text-slate-400 border-r border-slate-200 w-12 bg-slate-100">
                    #
                  </th>
                  {activeSheet.headers.map((h, i) => (
                    <th
                      key={i}
                      className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-r border-slate-200 whitespace-nowrap min-w-[120px]"
                    >
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRows.length > 0 ? (
                  filteredRows.slice(0, 100).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-emerald-50/30 transition font-mono text-[11px]"
                    >
                      <td className="p-2 text-center text-slate-400 bg-slate-50/50 border-r border-slate-200">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          className="p-2 text-slate-800 border-r border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]"
                          title={String(cell ?? "")}
                        >
                          {String(cell ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeSheet.headers.length + 1}
                      className="p-8 text-center text-slate-400"
                    >
                      No se encontraron filas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Mostrando {Math.min(filteredRows.length, 100)} de {activeSheet.rowCount} filas en la hoja "
              {activeSheet.sheetName}".
            </span>
            <span className="font-mono text-emerald-700 font-bold">
              ✓ Lectura digital de celdas y fórmulas activa
            </span>
          </div>
        </div>
      )}

      {/* Fallback if no file uploaded yet */}
      {!excelData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Sin Archivo Excel Abierto</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cargue la planilla Excel de la valorización para visualizar las hojas de cálculo, verificar
            fórmulas matemáticas y contrastar los metrados ejecutados con el expediente escaneado.
          </p>
        </div>
      )}
    </div>
  );
};
