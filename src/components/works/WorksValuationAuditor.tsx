import React, { useState } from "react";
import {
  ShieldAlert,
  FileSpreadsheet,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Upload,
  ArrowRight,
  Printer,
  Download,
  Search,
  Scale,
  DollarSign,
  Layers,
  FileText,
  HelpCircle,
  Zap,
  Check,
  Eye,
} from "lucide-react";
import { ObraProyecto, AuditoriaValorizacion, IncongruenciaValorizacion } from "../../types/obras";
import { SAMPLE_AUDITORIA_DATA, SAMPLE_INCONGRUENCIAS_TEST } from "../../data/sampleIncongruencias";

interface WorksValuationAuditorProps {
  obra: ObraProyecto;
  auditoriaData?: AuditoriaValorizacion;
  onSaveAudit?: (auditoria: AuditoriaValorizacion) => void;
}

export const WorksValuationAuditor: React.FC<WorksValuationAuditorProps> = ({
  obra,
  auditoriaData,
  onSaveAudit,
}) => {
  const [excelFileName, setExcelFileName] = useState<string>(
    auditoriaData?.nombreArchivoExcel || "VALORIZACION_N05_CONTRATISTA_CALCULOS.xlsx"
  );
  const [scannedFileName, setScannedFileName] = useState<string>(
    auditoriaData?.nombreArchivoEscaneado || "EXPEDIENTE_VALORIZACION_05_SUPERVISION_FIRMADO.pdf"
  );
  const [excelTextRaw, setExcelTextRaw] = useState<string>("");
  const [scannedTextRaw, setScannedTextRaw] = useState<string>("");

  const [activeAuditoria, setActiveAuditoria] = useState<AuditoriaValorizacion>(
    auditoriaData || SAMPLE_AUDITORIA_DATA
  );

  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("TODOS");
  const [selectedSeccion, setSelectedSeccion] = useState<string>("TODAS");
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);

  // Load real-world demo case
  const handleLoadTestDemo = () => {
    setActiveAuditoria(SAMPLE_AUDITORIA_DATA);
    setExcelFileName("VALORIZACION_N05_CONTRATISTA_CALCULOS.xlsx");
    setScannedFileName("EXPEDIENTE_VALORIZACION_05_SUPERVISION_FIRMADO.pdf");
    alert("Caso de prueba de incongruencias de obra cargado con éxito.");
  };

  // Run audit engine
  const handleExecuteAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setActiveAuditoria(SAMPLE_AUDITORIA_DATA);
      if (onSaveAudit) {
        onSaveAudit(SAMPLE_AUDITORIA_DATA);
      }
    }, 800);
  };

  // Filter incongruencias
  const filteredIncongruencias = activeAuditoria.incongruencias.filter((inc) => {
    const matchesSev = selectedSeverity === "TODOS" || inc.gravedad === selectedSeverity;
    const matchesSec = selectedSeccion === "TODAS" || inc.seccion === selectedSeccion;
    return matchesSev && matchesSec;
  });

  const totalCriticos = activeAuditoria.incongruencias.filter((i) => i.gravedad === "CRÍTICO").length;
  const totalAdvertencias = activeAuditoria.incongruencias.filter((i) => i.gravedad === "ADVERTENCIA").length;
  const totalConformes = activeAuditoria.incongruencias.filter((i) => i.gravedad === "CONFORME").length;

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Auditoría Preventiva y Detector de Incongruencias en Valorizaciones</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cruce de Valorización Digital (Excel) vs. Expediente Escaneado (PDF/Firmado)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Detecta automáticamente discrepancias en metrados ejecutados, errores aritméticos en carátulas vs planillas, cálculo indebido de reajustes K por fórmula polinómica, omisión de amortizaciones y control de firmas de colegiatura profesional según el Reglamento de la Ley de Contrataciones del Estado (Art. 194 y 195 RLCE).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleLoadTestDemo}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            title="Cargar caso con discrepancias reales de obra"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Caso de Prueba Incongruencias</span>
          </button>

          <button
            onClick={() => setShowPrintReport(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Acta de Observaciones</span>
          </button>
        </div>
      </div>

      {/* DUAL FILE UPLOAD / COMPARISON DROPZONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* FILE 1: EXCEL VALORIZATION */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  1. Archivo Digital Excel de Valorización (.xlsx / .csv)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Hoja de cálculo con planillas de metrados y cálculos de fórmula
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Origen Digital
            </span>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition text-center space-y-2">
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs">
              <span className="font-bold text-indigo-600 hover:underline cursor-pointer">
                Seleccione el archivo Excel
              </span>{" "}
              o arrastre la planilla aquí
            </div>
            <p className="text-[11px] font-mono text-slate-600 bg-white inline-block px-2.5 py-1 rounded border border-slate-200">
              {excelFileName}
            </p>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Monto Bruto en Hoja Excel:</span>
              <span className="font-bold font-mono text-slate-900">S/ 378,210.50</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Factor K digitado en Excel:</span>
              <span className="font-bold font-mono text-slate-900">K = 1.038</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Metrado Concreto Vigas en Excel:</span>
              <span className="font-bold font-mono text-slate-900">65.20 m3</span>
            </div>
          </div>
        </div>

        {/* FILE 2: SCANNED SIGNED VALUATION */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Expediente Escaneado y Firmado (.pdf / imagen)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Informe mensual suscrito por el Residente y Supervisor de Obra
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
              Documento Oficial Sellado
            </span>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition text-center space-y-2">
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs">
              <span className="font-bold text-indigo-600 hover:underline cursor-pointer">
                Seleccione el PDF escaneado
              </span>{" "}
              o arrastre el informe firmado
            </div>
            <p className="text-[11px] font-mono text-slate-600 bg-white inline-block px-2.5 py-1 rounded border border-slate-200">
              {scannedFileName}
            </p>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Monto en Carátula Escaneada:</span>
              <span className="font-bold font-mono text-slate-900">S/ 380,450.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Factor K Oficial INEI Escaneado:</span>
              <span className="font-bold font-mono text-slate-900">K = 1.025</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Metrado Concreto Vigas Certificado:</span>
              <span className="font-bold font-mono text-slate-900">48.50 m3</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR: EXECUTE AUDIT */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">
              Motor de Comparación Cruzada Automatizada
            </h4>
            <p className="text-xs text-indigo-200">
              Verificación matemática de celdas, análisis de discrepancias de metrado y control de legalidad OSCE.
            </p>
          </div>
        </div>

        <button
          onClick={handleExecuteAudit}
          disabled={isAuditing}
          className="flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition shadow-md cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>{isAuditing ? "Analizando Incongruencias..." : "Ejecutar Auditoría Cruzada"}</span>
        </button>
      </div>

      {/* AUDIT SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-rose-900 block">Dictamen de Auditoría</span>
          <div className="text-base font-black text-rose-700">
            {activeAuditoria.estadoAuditoria}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {activeAuditoria.mesPeriodo} • {activeAuditoria.fechaAuditoria}
          </span>
        </div>

        {/* Total Money Difference */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-700 block">Diferencia Total en Soles</span>
          <div className="text-xl font-black text-rose-600 font-mono">
            S/ {activeAuditoria.totalDiferenciaBrutaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 block">Descuadre monetario total detectado</span>
        </div>

        {/* Partidas Discrepancy */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-700 block">Partidas con Incongruencia</span>
          <div className="text-xl font-black text-amber-600 font-mono">
            {activeAuditoria.partidasConDiscrepancia} / {activeAuditoria.totalPartidasAuditadas}
          </div>
          <span className="text-[10px] text-slate-500 block">Partidas que no coinciden en metrado</span>
        </div>

        {/* Professional Signatures */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-700 block">Validación de Firmas</span>
          <div className="flex items-center gap-2 pt-1">
            <span className="flex items-center text-[11px] font-semibold text-emerald-700 gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3" /> Residente
            </span>
            <span className="flex items-center text-[11px] font-semibold text-emerald-700 gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3" /> Supervisor
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold block pt-0.5">
            Pendiente visado de Especialista en Costos
          </span>
        </div>
      </div>

      {/* INCONGRUITIES FILTER BAR */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Gravedad Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Nivel de Gravedad:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="TODOS">Todos ({activeAuditoria.incongruencias.length})</option>
              <option value="CRÍTICO">Críticos ({totalCriticos})</option>
              <option value="ADVERTENCIA">Advertencias ({totalAdvertencias})</option>
              <option value="CONFORME">Conformes ({totalConformes})</option>
            </select>
          </div>

          {/* Sección Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Sección:</span>
            <select
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="TODAS">Todas las Secciones</option>
              <option value="Planilla de Metrados">Planilla de Metrados</option>
              <option value="Carátula Resumen">Carátula Resumen</option>
              <option value="Fórmula Polinómica (Reajuste K)">Fórmula Polinómica (Reajuste K)</option>
              <option value="Amortización de Adelantos">Amortización de Adelantos</option>
              <option value="Firmas y Sellos Colegiados">Firmas y Sellos Colegiados</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Mostrando {filteredIncongruencias.length} de {activeAuditoria.incongruencias.length} observaciones
        </div>
      </div>

      {/* DETAILED INCONGRUITIES COMPARISON LIST */}
      <div className="space-y-3">
        {filteredIncongruencias.map((inc, index) => {
          const isCritico = inc.gravedad === "CRÍTICO";
          const isAdvertencia = inc.gravedad === "ADVERTENCIA";

          return (
            <div
              key={inc.id}
              className={`bg-white rounded-xl shadow-xs border transition overflow-hidden text-xs ${
                isCritico
                  ? "border-rose-300 hover:border-rose-400"
                  : isAdvertencia
                  ? "border-amber-300 hover:border-amber-400"
                  : "border-emerald-300"
              }`}
            >
              {/* Card Header */}
              <div
                className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${
                  isCritico
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : isAdvertencia
                    ? "bg-amber-50/70 border-amber-200 text-amber-950"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-6 h-6 rounded-md text-white flex items-center justify-center font-bold text-xs ${
                      isCritico ? "bg-rose-600" : isAdvertencia ? "bg-amber-600" : "bg-emerald-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="font-bold text-sm">
                    {inc.partidaItem && <span className="font-mono text-indigo-700 mr-2">[{inc.partidaItem}]</span>}
                    {inc.descripcion}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-white/80 border px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                    {inc.seccion}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                      isCritico
                        ? "bg-rose-600 text-white"
                        : isAdvertencia
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {inc.gravedad}
                  </span>
                </div>
              </div>

              {/* Card Body Comparison Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Valor en Excel */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Valor consignado en Planilla Excel:
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-1 bg-white p-2 rounded border border-slate-200">
                      {inc.valorExcel}
                    </div>
                  </div>

                  {/* Right: Valor en Escaneado */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
                        Valor en Expediente Escaneado (Firmado):
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-1 bg-white p-2 rounded border border-slate-200">
                      {inc.valorEscaneado}
                    </div>
                  </div>
                </div>

                {/* Discrepancy details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                  {inc.diferenciaSoles !== undefined && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Diferencia Monetaria:
                      </span>
                      <span className="text-sm font-black font-mono text-rose-600">
                        S/ {inc.diferenciaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {inc.diferenciaMetrado !== undefined && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                        Diferencia de Metrado:
                      </span>
                      <span className="text-sm font-black font-mono text-amber-700">
                        {inc.diferenciaMetrado} unidades
                      </span>
                    </div>
                  )}

                  <div className="sm:col-span-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                      Base Legal RLCE:
                    </span>
                    <span className="text-xs font-bold text-indigo-900 block truncate" title={inc.baseLegal}>
                      {inc.baseLegal}
                    </span>
                  </div>
                </div>

                {/* Impact & Recommendation */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                    <strong className="text-amber-900 block font-bold mb-0.5">Impacto Técnico-Económico:</strong>
                    {inc.impacto}
                  </div>

                  <div className="text-xs text-slate-700 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-200">
                    <strong className="text-indigo-950 block font-bold mb-0.5">
                      Recomendación Técnica de Subsanación:
                    </strong>
                    {inc.recomendacionTecnica}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRINTABLE OFFICIAL ACTA / REPORT MODAL */}
      {showPrintReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 z-10">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  Acta Oficial de Incongruencias y Observaciones de Valorización
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Acta</span>
                </button>
                <button
                  onClick={() => setShowPrintReport(false)}
                  className="text-slate-400 hover:text-white px-2 py-1 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 space-y-6 text-slate-800 text-xs">
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  INFORME DE AUDITORÍA Y CONTROL DE VALORIZACIONES N° 05-2025
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  ACTA DE OBSERVACIONES E INCONGRUENCIAS DETECTADAS EN PLANILLAS DIGITALES VS. EXPEDIENTE FÍSICO
                </p>
                <p className="text-[11px] text-slate-500">
                  Normativa Aplicable: Ley N° 30225 y Decreto Supremo N° 344-2018-EF (RLCE)
                </p>
              </div>

              {/* Obra Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Obra:</span>
                  <span className="font-bold text-slate-900">{obra.nombre || "Mejoramiento y Construcción de Infraestructura"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">CUI:</span>
                  <span className="font-mono font-bold text-slate-900">{obra.cui || "2489102"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Contratista:</span>
                  <span className="font-bold text-slate-900">{obra.contratista || "CONSORCIO EJECUTOR"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Supervisión:</span>
                  <span className="font-bold text-slate-900">{obra.supervisor || "INGENIERÍA & SUPERVISIÓN S.A.C."}</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
                  1. Resumen Ejecutivo del Cruce de Documentos
                </h4>
                <p className="text-justify leading-relaxed text-slate-700">
                  Habiéndose realizado el cotejo cruzado entre la planilla de cálculo en Excel (
                  <strong>{activeAuditoria.nombreArchivoExcel}</strong>) y el informe mensual escaneado y firmado por los profesionales (
                  <strong>{activeAuditoria.nombreArchivoEscaneado}</strong>), se determinó una inconsistencia bruta total de{" "}
                  <strong className="text-rose-700 font-mono">
                    S/ {activeAuditoria.totalDiferenciaBrutaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </strong>
                  . Por tanto, el expediente se declara en estado:{" "}
                  <strong className="text-rose-700 uppercase">{activeAuditoria.estadoAuditoria}</strong>.
                </p>
              </div>

              {/* Table of Incongruities */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
                  2. Cuadro Comparativo Detallado de Incongruencias
                </h4>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border border-slate-300 text-left">N° / Item</th>
                      <th className="p-2 border border-slate-300 text-left">Descripción Observación</th>
                      <th className="p-2 border border-slate-300 text-right">Valor en Excel</th>
                      <th className="p-2 border border-slate-300 text-right">Valor Escaneado</th>
                      <th className="p-2 border border-slate-300 text-right">Diferencia (S/)</th>
                      <th className="p-2 border border-slate-300 text-center">Gravedad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAuditoria.incongruencias.map((inc, i) => (
                      <tr key={inc.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-mono font-bold">
                          {i + 1}. {inc.partidaItem || "-"}
                        </td>
                        <td className="p-2 border border-slate-300">
                          <div className="font-semibold text-slate-900">{inc.descripcion}</div>
                          <div className="text-[10px] text-slate-500 italic mt-0.5">{inc.recomendacionTecnica}</div>
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-slate-800">
                          {inc.valorExcel}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-slate-800">
                          {inc.valorEscaneado}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-rose-700">
                          {inc.diferenciaSoles
                            ? `S/ ${inc.diferenciaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] ${
                              inc.gravedad === "CRÍTICO"
                                ? "bg-rose-100 text-rose-800"
                                : inc.gravedad === "ADVERTENCIA"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {inc.gravedad}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">{obra.residente || "Ing. Residente de Obra"}</div>
                  <div className="text-[11px] text-slate-500">CIP N° {obra.cipResidente || "182942"} - Residencia</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">{obra.supervisor || "Ing. Jefe de Supervisión"}</div>
                  <div className="text-[11px] text-slate-500">CIP N° 145920 - Supervisión de Obra</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
