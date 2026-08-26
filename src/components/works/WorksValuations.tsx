import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calculator,
  Download,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  Table,
  ShieldAlert,
  ListTree,
} from "lucide-react";
import {
  ObraProyecto,
  ValorizacionMensual,
  PartidaEjecutada,
  AuditoriaValorizacion,
} from "../../types/obras";
import { WorksItemsExecutedTable } from "./WorksItemsExecutedTable";
import { WorksValuationAuditor } from "./WorksValuationAuditor";
import { SAMPLE_PARTIDAS_OBRA } from "../../data/samplePartidas";
import { SAMPLE_AUDITORIA_DATA } from "../../data/sampleIncongruencias";

interface WorksValuationsProps {
  obra: ObraProyecto;
  valorizaciones: ValorizacionMensual[];
  setValorizaciones: React.Dispatch<React.SetStateAction<ValorizacionMensual[]>>;
  partidas?: PartidaEjecutada[];
  setPartidas?: React.Dispatch<React.SetStateAction<PartidaEjecutada[]>>;
  auditorias?: AuditoriaValorizacion[];
  setAuditorias?: React.Dispatch<React.SetStateAction<AuditoriaValorizacion[]>>;
  auditoria?: AuditoriaValorizacion;
  setAuditoria?: React.Dispatch<React.SetStateAction<AuditoriaValorizacion | undefined>>;
  initialSubTab?: "curva-s" | "partidas" | "auditoria";
}

export const WorksValuations: React.FC<WorksValuationsProps> = ({
  obra,
  valorizaciones,
  setValorizaciones,
  partidas: externalPartidas,
  setPartidas: externalSetPartidas,
  auditorias: externalAuditorias,
  setAuditorias: externalSetAuditorias,
  auditoria: externalAuditoria,
  setAuditoria: externalSetAuditoria,
  initialSubTab = "curva-s",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"curva-s" | "partidas" | "auditoria">(
    initialSubTab
  );

  // Local fallback states if not provided externally
  const [localPartidas, setLocalPartidas] = useState<PartidaEjecutada[]>(SAMPLE_PARTIDAS_OBRA);
  const [localAuditorias, setLocalAuditorias] = useState<AuditoriaValorizacion[]>([
    SAMPLE_AUDITORIA_DATA,
  ]);

  const currentPartidas = externalPartidas ?? localPartidas;
  const currentSetPartidas = externalSetPartidas ?? setLocalPartidas;
  const currentAuditorias = externalAuditorias ?? localAuditorias;
  const currentSetAuditorias = externalSetAuditorias ?? setLocalAuditorias;

  const [selectedValId, setSelectedValId] = useState<string>(
    valorizaciones[4]?.id || valorizaciones[0]?.id || ""
  );

  const selectedVal = valorizaciones.find((v) => v.id === selectedValId) || valorizaciones[0];

  // Totals calculations
  const totalMontoProgramado = valorizaciones.reduce((acc, v) => acc + v.montoProgramado, 0);
  const totalMontoEjecutado = valorizaciones.reduce((acc, v) => acc + (v.montoEjecutado || 0), 0);
  const totalReajustes = valorizaciones.reduce((acc, v) => acc + (v.montoReajusteK || 0), 0);
  const totalAmortAdelantoDirecto = valorizaciones.reduce(
    (acc, v) => acc + (v.amortizacionAdelantoDirecto || 0),
    0
  );
  const totalAmortMateriales = valorizaciones.reduce(
    (acc, v) => acc + (v.amortizacionMateriales || 0),
    0
  );
  const totalNetoPagado = valorizaciones.reduce((acc, v) => acc + (v.montoNetoAPagar || 0), 0);

  // SVG dimensions for Curva S
  const svgWidth = 700;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Generate points for SVG Curva S safely
  const numPoints = valorizaciones.length;
  const getX = (index: number) => {
    if (numPoints <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (numPoints - 1)) * chartWidth;
  };
  const getY = (percent: number) =>
    paddingY + chartHeight - (Math.min(100, Math.max(0, percent)) / 100) * chartHeight;

  // Programmed line
  const progPoints =
    valorizaciones.length > 0
      ? valorizaciones
          .map((v, i) => `${getX(i)},${getY(v.porcentajeProgramadoAcumulado)}`)
          .join(" ")
      : "";

  // Executed line (only for processed ones)
  const executedValList = valorizaciones.filter((v) => v.porcentajeEjecutadoAcumulado > 0);
  const execPoints =
    executedValList.length > 0
      ? executedValList
          .map((v, i) => `${getX(i)},${getY(v.porcentajeEjecutadoAcumulado)}`)
          .join(" ")
      : "";

  const totalPorcentajeEjecutado =
    totalMontoProgramado > 0
      ? Number(((totalMontoEjecutado / totalMontoProgramado) * 100).toFixed(2))
      : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Module Sub-Navigation Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("curva-s")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "curva-s"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Curva "S" y Resumen de Valorizaciones</span>
          </button>

          <button
            onClick={() => setActiveSubTab("partidas")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "partidas"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ListTree className="w-4 h-4" />
            <span>2. Cuadro Partidas Ejecutadas (Mes Actual y Anteriores)</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeSubTab === "partidas"
                  ? "bg-indigo-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {currentPartidas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("auditoria")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === "auditoria"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 hover:bg-rose-50 hover:text-rose-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>3. Detector Incongruencias (Excel vs Escaneado)</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                activeSubTab === "auditoria"
                  ? "bg-rose-700 text-white"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              Alerta
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CURVA S & VALORIZACIONES MENSUALES */}
      {activeSubTab === "curva-s" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Control de Obras • Curva "S" y Resumen Financiero</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Curva S Oficial y Planilla Mensual de Valorizaciones
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
                Monitoreo del avance programado vs. ejecutado físico (Art. 194 y 203 RLCE), control del umbral del 80%, reajustes por coeficiente K de fórmula polinómica y amortizaciones de adelantos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  alert("Reporte mensual de valorización exportado exitosamente en formato oficial.")
                }
                className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Exportar Planilla</span>
              </button>
            </div>
          </div>

          {/* CURVA S INTERACTIVE GRAPH CARD */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Curva S Oficial de Avance Físico (% Acumulado Programado vs. Real Ejecutado)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Línea Azul: Cronograma Vigente (Programado) | Línea Verde: Avance Físico Real en Campo (Ejecutado)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5 text-blue-700">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                  <span>Programado Acumulado</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span>Ejecutado Real</span>
                </div>
              </div>
            </div>

            {/* SVG Curve Container */}
            <div className="w-full overflow-x-auto bg-slate-900/95 rounded-xl p-4 text-slate-100 shadow-inner">
              <div className="min-w-[650px] flex justify-center">
                <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
                  {/* Grid Lines Y (0%, 25%, 50%, 75%, 100%) */}
                  {[0, 25, 50, 75, 100].map((pct) => {
                    const y = getY(pct);
                    return (
                      <g key={pct}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={svgWidth - paddingX}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 4}
                          fill="#94a3b8"
                          fontSize="10"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {pct}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Grid Lines X for each month */}
                  {valorizaciones.map((v, i) => {
                    const x = getX(i);
                    return (
                      <g key={v.id}>
                        <line
                          x1={x}
                          y1={paddingY}
                          x2={x}
                          y2={svgHeight - paddingY}
                          stroke="#334155"
                          strokeWidth="0.75"
                        />
                        <text
                          x={x}
                          y={svgHeight - paddingY + 16}
                          fill="#cbd5e1"
                          fontSize="10"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          M{v.numero}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area under executed curve */}
                  {executedValList.length > 1 && (
                    <polygon
                      points={`${getX(0)},${getY(0)} ${execPoints} ${getX(
                        executedValList.length - 1
                      )},${getY(0)}`}
                      fill="rgba(16, 185, 129, 0.15)"
                    />
                  )}

                  {/* Programmed Polyline (Blue) */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    points={progPoints}
                  />

                  {/* Executed Polyline (Green) */}
                  <polyline fill="none" stroke="#10b981" strokeWidth="3.5" points={execPoints} />

                  {/* Dots and Labels for Programmed */}
                  {valorizaciones.map((v, i) => {
                    const x = getX(i);
                    const y = getY(v.porcentajeProgramadoAcumulado);
                    return (
                      <g key={`prog-${v.id}`}>
                        <circle cx={x} cy={y} r="4" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={x}
                          y={y - 8}
                          fill="#93c5fd"
                          fontSize="9"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {v.porcentajeProgramadoAcumulado}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Dots and Labels for Executed */}
                  {executedValList.map((v, i) => {
                    const x = getX(i);
                    const y = getY(v.porcentajeEjecutadoAcumulado);
                    return (
                      <g key={`exec-${v.id}`}>
                        <circle cx={x} cy={y} r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x={x}
                          y={y + 16}
                          fill="#6ee7b7"
                          fontSize="10"
                          textAnchor="middle"
                          fontWeight="black"
                        >
                          {v.porcentajeEjecutadoAcumulado}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Legend Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 block">Avance Programado:</span>
                <span className="text-base font-black text-blue-950 font-mono">86.00%</span>
                <span className="text-[10px] text-blue-700 block mt-0.5">S/ 3,311,000.00 acumulado</span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block">Avance Físico Ejecutado:</span>
                <span className="text-base font-black text-emerald-950 font-mono">85.06%</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">S/ 3,275,000.00 acumulado</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Estado Respecto al 80% (Art. 203 RLCE):
                </span>
                <span className="text-base font-black text-amber-950">Normal (&gt;80% del prog.)</span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  Avance = 98.9% del programado (No requiere calendario acelerado)
                </span>
              </div>
            </div>
          </div>

          {/* MASTER VALUATIONS TABLE */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-xs">
            <div className="bg-slate-900 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">
                  Planilla Mensual de Valorizaciones, Reajustes y Amortizaciones
                </span>
              </div>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-mono">
                Monto Contrato: S/{" "}
                {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                    <th className="py-2.5 px-3">Mes / Periodo</th>
                    <th className="py-2.5 px-3 text-right">Prog. Mes (S/)</th>
                    <th className="py-2.5 px-3 text-right">Ejec. Mes (S/)</th>
                    <th className="py-2.5 px-3 text-center">% Prog.</th>
                    <th className="py-2.5 px-3 text-center">% Real</th>
                    <th className="py-2.5 px-3 text-center">Coef. K</th>
                    <th className="py-2.5 px-3 text-right">Reajuste K (S/)</th>
                    <th className="py-2.5 px-3 text-right">Amort. Dir (S/)</th>
                    <th className="py-2.5 px-3 text-right">Amort. Mat (S/)</th>
                    <th className="py-2.5 px-3 text-right">Neto a Pagar (S/)</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {valorizaciones.map((val) => {
                    const isCurrent = val.id === selectedValId;
                    return (
                      <tr
                        key={val.id}
                        onClick={() => setSelectedValId(val.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition ${
                          isCurrent ? "bg-indigo-50/60 font-semibold" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{val.mesPeriodo}</div>
                          <div className="text-[10px] text-slate-400">Pres: {val.fechaPresentacion}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          S/ {val.montoProgramado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {val.montoEjecutado > 0
                            ? `S/ ${val.montoEjecutado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-700">
                          {val.porcentajeProgramadoMes}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {val.porcentajeEjecutadoMes > 0 ? `${val.porcentajeEjecutadoMes}%` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-purple-700">
                          {val.factorKReajuste.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-purple-800">
                          {val.montoReajusteK > 0
                            ? `S/ ${val.montoReajusteK.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {val.amortizacionAdelantoDirecto > 0
                            ? `-S/ ${val.amortizacionAdelantoDirecto.toLocaleString("es-PE", {
                                minimumFractionDigits: 2,
                              })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {val.amortizacionMateriales > 0
                            ? `-S/ ${val.amortizacionMateriales.toLocaleString("es-PE", {
                                minimumFractionDigits: 2,
                              })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                          {val.montoNetoAPagar > 0
                            ? `S/ ${val.montoNetoAPagar.toLocaleString("es-PE", {
                                minimumFractionDigits: 2,
                              })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              val.estadoPago === "Aprobada y Pagada"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : val.estadoPago === "En Revisión por Supervisión"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {val.estadoPago}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <td className="py-3 px-3">TOTALES ACUMULADOS</td>
                    <td className="py-3 px-3 text-right font-mono">
                      S/ {totalMontoProgramado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      S/ {totalMontoEjecutado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {totalMontoProgramado > 0 ? "100.0%" : "0.0%"}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-400">
                      {totalPorcentajeEjecutado}%
                    </td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-3 text-right font-mono text-purple-300">
                      S/ {totalReajustes.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-300">
                      -S/{" "}
                      {totalAmortAdelantoDirecto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-300">
                      -S/ {totalAmortMateriales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300 font-black">
                      S/ {totalNetoPagado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center text-[10px] text-slate-400">
                      {totalPorcentajeEjecutado}% Total
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SELECTED VALUATION DETAIL CARD */}
          {selectedVal && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {selectedVal.numero}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    Desglose Liquidatario de la {selectedVal.mesPeriodo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded text-xs font-semibold border border-indigo-200">
                    Fórmula Polinómica K = {selectedVal.factorKReajuste.toFixed(3)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">1. Valorización Bruta del Mes:</span>
                  <div className="text-base font-black text-slate-900 font-mono">
                    S/ {selectedVal.montoEjecutado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Avance del mes: {selectedVal.porcentajeEjecutadoMes}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                  <span className="text-purple-800 font-semibold block">2. Reajuste por Coeficiente K:</span>
                  <div className="text-base font-black text-purple-950 font-mono">
                    + S/{" "}
                    {selectedVal.montoReajusteK.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-purple-700">Índices Unificados INEI (K-1) * V</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
                  <span className="text-rose-800 font-semibold block">3. Amortizaciones Deducidas:</span>
                  <div className="text-base font-black text-rose-950 font-mono">
                    - S/{" "}
                    {(
                      selectedVal.amortizacionAdelantoDirecto + selectedVal.amortizacionMateriales
                    ).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-rose-700">
                    Directo: S/ {selectedVal.amortizacionAdelantoDirecto.toLocaleString("es-PE")} | Mat:
                    S/ {selectedVal.amortizacionMateriales.toLocaleString("es-PE")}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-1">
                  <span className="text-emerald-800 font-semibold block">4. Monto Neto Autorizado:</span>
                  <div className="text-base font-black text-emerald-950 font-mono">
                    S/ {selectedVal.montoNetoAPagar.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Estado: {selectedVal.estadoPago}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PARTIDAS EJECUTADAS TABLE */}
      {activeSubTab === "partidas" && (
        <WorksItemsExecutedTable
          obra={obra}
          partidas={currentPartidas}
          setPartidas={currentSetPartidas}
          mesSeleccionado={selectedVal?.mesPeriodo || "Mes 5 - Mayo 2025"}
        />
      )}

      {/* VIEW 3: VALUATION AUDITOR (EXCEL VS SCANNED) */}
      {activeSubTab === "auditoria" && (
        <WorksValuationAuditor
          obra={obra}
          valorizaciones={valorizaciones}
          setValorizaciones={setValorizaciones}
          partidas={currentPartidas}
          setPartidas={currentSetPartidas}
          auditorias={currentAuditorias}
          onSaveAuditorias={(newAudits) => {
            currentSetAuditorias(newAudits);
          }}
          onNavigateToSubTab={(sub) => setActiveSubTab(sub)}
        />
      )}
    </div>
  );
};
