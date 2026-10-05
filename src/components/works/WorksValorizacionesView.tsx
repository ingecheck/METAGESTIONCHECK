import React, { useState } from "react";
import {
  Calculator,
  FileText,
  Clock,
  Layers,
  Search,
  Filter,
  Download,
  Plus,
  Printer,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Tag,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ProyectoCartera,
  ValorizacionObra,
  PartidaValorizacion,
  getAvanceFisicoObra,
  getProgresoPorcentaje,
} from "../../types/seguimientoCartera";
import { formatPEN } from "../../services/docxGenerator";

interface WorksValorizacionesViewProps {
  proyectos: ProyectoCartera[];
  onOpenValorizacionModal: (
    project: ProyectoCartera,
    initialTab?: "valorizacion" | "expediente" | "ampliacion"
  ) => void;
  entityName: string;
}

export const WorksValorizacionesView: React.FC<WorksValorizacionesViewProps> = ({
  proyectos,
  onOpenValorizacionModal,
  entityName,
}) => {
  const [filterType, setFilterType] = useState<
    "ALL" | "VALORIZACION" | "EXPEDIENTE" | "AMPLIACION" | "PARTIDAS"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number>(
    proyectos[0]?.id || 1
  );

  // Global metrics across all projects
  const totalMontoContractual = proyectos.reduce(
    (sum, p) => sum + (p.contratoEjecucionMonto || 0),
    0
  );

  const totalMontoValorizado = proyectos.reduce((sum, p) => {
    const valos = p.valorizaciones || [];
    const maxValo = valos.length > 0 ? valos[valos.length - 1] : null;
    return sum + (maxValo?.montoEjecutadoAcumulado || 0);
  }, 0);

  const globalPorcentajeAvance =
    totalMontoContractual > 0
      ? Math.round((totalMontoValorizado / totalMontoContractual) * 10000) / 100
      : 0;

  const totalSaldoPorValorizar = Math.max(0, totalMontoContractual - totalMontoValorizado);

  const totalMontoExpedientesAdicionales = proyectos.reduce((sum, p) => {
    return sum + (p.expedientes?.reduce((esum, e) => esum + (e.monto || 0), 0) || 0);
  }, 0);

  const totalDiasAmpliaciones = proyectos.reduce((sum, p) => {
    return sum + (p.ampliacionesPlazo?.reduce((asum, a) => asum + (a.dias || 0), 0) || 0);
  }, 0);

  // Selected project for deep inspection
  const selectedProj =
    proyectos.find((p) => p.id === selectedProjectId) || proyectos[0] || null;

  // Filtered list of projects
  const filteredProjects = proyectos.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.proyecto.toLowerCase().includes(q) ||
      p.cui.includes(q) ||
      p.encargado.toLowerCase().includes(q) ||
      p.contratoEjecucionNumero.toLowerCase().includes(q) ||
      (p.contratoEjecucionEmpresa || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Upper Executive KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            Cartera Contractual
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-slate-900 mt-0.5 block">
            {formatPEN(totalMontoContractual)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {proyectos.length} proyectos registrados
          </span>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
            Total Valorizado Acum.
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-0.5 block">
            {formatPEN(totalMontoValorizado)}
          </span>
          <span className="text-[10px] text-emerald-800/80 mt-1 block font-medium">
            Monto ejecutado certificado
          </span>
        </div>

        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase block tracking-wider">
            Avance Global OEI
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-blue-700 mt-0.5 block">
            {globalPorcentajeAvance}%
          </span>
          <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, globalPorcentajeAvance)}%` }}
            />
          </div>
        </div>

        <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
            Saldo por Valorizar
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-amber-700 mt-0.5 block">
            {formatPEN(totalSaldoPorValorizar)}
          </span>
          <span className="text-[10px] text-amber-800/80 mt-1 block font-medium">
            Porcentaje pendiente: {(100 - globalPorcentajeAvance).toFixed(1)}%
          </span>
        </div>

        <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase block tracking-wider">
            Expedientes Adicionales
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-indigo-700 mt-0.5 block">
            {formatPEN(totalMontoExpedientesAdicionales)}
          </span>
          <span className="text-[10px] text-indigo-800/80 mt-1 block font-medium">
            Presupuesto adicional aprobado
          </span>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase block tracking-wider">
            Ampliaciones de Plazo
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-purple-700 mt-0.5 block">
            +{totalDiasAmpliaciones} días
          </span>
          <span className="text-[10px] text-purple-800/80 mt-1 block font-medium">
            Prórroga contractual oficial
          </span>
        </div>
      </div>

      {/* Control Toolbar: Classification Filter Pills & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Classification Tags */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos los Registros
            </button>
            <button
              onClick={() => setFilterType("VALORIZACION")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterType === "VALORIZACION"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>🏷️ Valorizaciones</span>
            </button>
            <button
              onClick={() => setFilterType("EXPEDIENTE")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterType === "EXPEDIENTE"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📑 Expedientes Técnicos</span>
            </button>
            <button
              onClick={() => setFilterType("AMPLIACION")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterType === "AMPLIACION"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-purple-800 hover:bg-purple-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ Ampliaciones de Plazo</span>
            </button>
            <button
              onClick={() => setFilterType("PARTIDAS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                filterType === "PARTIDAS"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-indigo-800 hover:bg-indigo-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📋 Planilla de Partidas</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar obra, CUI, contratista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Project Selector for Detailed Inspection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Seleccionar Obra para Detalle & Partidas:</span>
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md truncate"
            >
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  ID #{p.id} • CUI {p.cui} - {p.proyecto} ({p.encargado})
                </option>
              ))}
            </select>
          </div>

          {selectedProj && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenValorizacionModal(selectedProj, "valorizacion")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Valorización</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenValorizacionModal(selectedProj, "expediente")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Expediente Adicional</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenValorizacionModal(selectedProj, "ampliacion")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ampliación de Plazo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedProj && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Header for Selected Project */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  ID #{selectedProj.id} • CUI {selectedProj.cui}
                </span>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  Encargado: {selectedProj.encargado}
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Contratista: {selectedProj.contratoEjecucionEmpresa || "-"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">{selectedProj.proyecto}</h2>
              <div className="text-xs text-slate-300 mt-0.5">
                Contrato: {selectedProj.contratoEjecucionNumero} • Monto: {formatPEN(selectedProj.contratoEjecucionMonto)} • Plazo: {selectedProj.plazoDias || 0} días
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Reporte</span>
              </button>
            </div>
          </div>

          {/* PANEL COMPARATIVO DE AVANCE (DISTINCIÓN FÍSICO VS FICHA) */}
          {(() => {
            const avanceFis = getAvanceFisicoObra(selectedProj);
            const pctNormativo = getProgresoPorcentaje(selectedProj.hitos);
            const hitosCumplidosCount = selectedProj.hitos.filter((h) => h.cumplido).length;
            const hitosTotalCount = selectedProj.hitos.length;

            return (
              <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Panel Oficial de Avances de la Inversión</span>
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                      Art. 194 / Art. 198 RLCE
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                    💡 Criterio Técnico: El % de Avance de Obra (terreno) es independiente del % de la Ficha (hitos administrativos)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* CARD 1: Avance Físico Real de Obra */}
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        🏗️ Avance Físico Real (Campo)
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          avanceFis.estadoFisico === "ATRASADA"
                            ? "bg-rose-500/30 text-rose-300 border border-rose-400/50"
                            : avanceFis.estadoFisico === "CULMINADA"
                            ? "bg-teal-500/30 text-teal-300 border border-teal-400/50"
                            : "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                        }`}
                      >
                        {avanceFis.etiqueta}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-emerald-300">
                        {avanceFis.porcentajeFisico.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-emerald-200/70">ejecutado real</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-emerald-900 mt-1">
                      <div
                        className={`h-full transition-all ${
                          avanceFis.estadoFisico === "ATRASADA" ? "bg-rose-500" : "bg-emerald-400"
                        }`}
                        style={{ width: `${Math.min(100, avanceFis.porcentajeFisico)}%` }}
                      />
                    </div>

                    <div className="text-[10px] font-mono text-emerald-200/80 flex justify-between pt-1">
                      <span>Certif: {formatPEN(avanceFis.montoEjecutadoTotal)}</span>
                      <span>Saldo: {formatPEN(Math.max(0, selectedProj.contratoEjecucionMonto - avanceFis.montoEjecutadoTotal))}</span>
                    </div>
                  </div>

                  {/* CARD 2: Avance Programado */}
                  <div className="bg-blue-950/60 border border-blue-500/40 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                        📅 Avance Programado
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded">
                        Cronograma Vigente
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-blue-300">
                        {(avanceFis.porcentajeProgramado || 0).toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-blue-200/70">programado</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-blue-900 mt-1">
                      <div
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${Math.min(100, avanceFis.porcentajeProgramado || 0)}%` }}
                      />
                    </div>

                    <div className="text-[10px] font-medium text-slate-300 pt-1">
                      {avanceFis.porcentajeProgramado && avanceFis.porcentajeProgramado > 0 ? (
                        avanceFis.porcentajeFisico < avanceFis.porcentajeProgramado * 0.8 ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Alerta Art. 198: Atrasada (&lt; 80% prog.)</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Ejecución normal en plazo</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">Sin desfase crítico reportado</span>
                      )}
                    </div>
                  </div>

                  {/* CARD 3: Ficha Normativa */}
                  <div className="bg-purple-950/60 border border-purple-500/40 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                        📋 Ficha Normativa
                      </span>
                      <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-900/60 px-1.5 py-0.2 rounded border border-purple-700/50">
                        {hitosCumplidosCount} / {hitosTotalCount} Hitos
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black font-mono text-purple-300">
                        {pctNormativo}%
                      </span>
                      <span className="text-[10px] text-purple-200/70">hitos de gestión</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-purple-900 mt-1">
                      <div
                        className="h-full bg-purple-400 transition-all"
                        style={{ width: `${pctNormativo}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-300 pt-1">
                      Cumplimiento de trámites y sustentos oficiales
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section: Valorizaciones List */}
          {(filterType === "ALL" || filterType === "VALORIZACION") && (
            <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Valorizaciones de Obra Mensuales Aprobadas (Art. 194 RLCE)</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {selectedProj.valorizaciones?.length || 0} valorizaciones registradas
                </span>
              </div>

              {(!selectedProj.valorizaciones || selectedProj.valorizaciones.length === 0) ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs space-y-2">
                  <Calculator className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>No hay valorizaciones registradas para esta obra.</div>
                  <button
                    type="button"
                    onClick={() => onOpenValorizacionModal(selectedProj, "valorizacion")}
                    className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    + Registrar Primera Valorización
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 border-r border-slate-200 w-16 text-center">N° Valo</th>
                        <th className="p-2.5 border-r border-slate-200">Periodo / Mes</th>
                        <th className="p-2.5 border-r border-slate-200">Fecha Aprobación</th>
                        <th className="p-2.5 border-r border-slate-200 min-w-[140px]">Doc. Aprobación Entidad</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Monto Mes (S/)</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Monto Acum. (S/)</th>
                        <th className="p-2.5 border-r border-slate-200 text-center">% Avance Mes</th>
                        <th className="p-2.5 border-r border-slate-200 text-center font-bold text-blue-700">% Avance Acum.</th>
                        <th className="p-2.5 border-r border-slate-200 text-center">Estado</th>
                        <th className="p-2.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedProj.valorizaciones.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-mono font-black text-slate-900 border-r border-slate-200">
                            VALO N° {v.numero}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">
                            {v.periodo}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200">
                            {v.fechaValorizacion || v.fechaAprobacionSupervisor || "-"}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] border-r border-slate-200">
                            {v.documentoAprobacion ? (
                              <span className="font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded block truncate max-w-[170px]" title={v.documentoAprobacion}>
                                📄 {v.documentoAprobacion}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Sin doc registrado</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700 border-r border-slate-200 bg-emerald-50/20">
                            {formatPEN(v.montoEjecutadoMes)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {formatPEN(v.montoEjecutadoAcumulado)}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {v.porcentajeEjecutadoMes}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-blue-700 border-r border-slate-200 bg-blue-50/20">
                            {v.porcentajeEjecutadoAcumulado}%
                          </td>
                          <td className="p-2.5 text-center border-r border-slate-200">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.estado === "APROBADA"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : v.estado === "OBSERVADA"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {v.estado}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenValorizacionModal(selectedProj, "valorizacion")}
                              className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline cursor-pointer"
                            >
                              Ver Partidas
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section: Expedientes Adicionales & Deductivos */}
          {(filterType === "ALL" || filterType === "EXPEDIENTE") && (
            <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Expedientes Técnicos Adicionales y Reducciones (Art. 205 RLCE)</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {selectedProj.expedientes?.length || 0} expedientes aprobados
                </span>
              </div>

              {(!selectedProj.expedientes || selectedProj.expedientes.length === 0) ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  No se registran adicionales presupuestales ni deductivos para esta obra.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProj.expedientes.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-amber-50/40 border border-amber-200 p-3.5 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                          {exp.tipo} N° {exp.numero}
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-800">
                          {formatPEN(exp.monto)}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{exp.descripcion}</div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-amber-200/60">
                        <div>Resolución: <strong className="text-slate-800">{exp.resolucionAprobacion}</strong></div>
                        <div>Fecha: <strong className="text-slate-800 font-mono">{exp.fechaEmision}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Ampliaciones de Plazo */}
          {(filterType === "ALL" || filterType === "AMPLIACION") && (
            <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Ampliaciones de Plazo de Ejecución (Art. 197 / 198 RLCE)</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {selectedProj.ampliacionesPlazo?.length || 0} ampliaciones aprobadas
                </span>
              </div>

              {(!selectedProj.ampliacionesPlazo || selectedProj.ampliacionesPlazo.length === 0) ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  No se registran prórrogas de plazo para esta obra.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProj.ampliacionesPlazo.map((amp) => (
                    <div
                      key={amp.id}
                      className="bg-purple-50/40 border border-purple-200 p-3.5 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-200 text-purple-900 uppercase">
                          Ampliación N° {amp.numero}
                        </span>
                        <span className="font-mono font-black text-sm text-purple-800">
                          +{amp.dias} días calendario
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-medium">{amp.motivo}</div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-purple-200/60">
                        <div>Resolución: <strong className="text-slate-800">{amp.resolucion}</strong></div>
                        <div>Fecha: <strong className="text-slate-800 font-mono">{amp.fechaEmision}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Planilla de Partidas y Metrados */}
          {(filterType === "ALL" || filterType === "PARTIDAS") && (
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Desglose de Partidas Principales del Presupuesto de Obra</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onOpenValorizacionModal(selectedProj, "valorizacion")}
                  className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Modificar Metrados & Precios
                </button>
              </div>

              {(() => {
                const lastValo =
                  selectedProj.valorizaciones && selectedProj.valorizaciones.length > 0
                    ? selectedProj.valorizaciones[selectedProj.valorizaciones.length - 1]
                    : null;
                const partidasToShow = lastValo?.partidas || [];

                if (partidasToShow.length === 0) {
                  return (
                    <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      No se han cargado partidas detalladas aún. Haga clic en <strong>+ Nueva Valorización</strong> para generar o editar la planilla de metrados.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 border-r border-slate-200 w-16">Ítem</th>
                          <th className="p-2 border-r border-slate-200">Descripción de la Partida</th>
                          <th className="p-2 border-r border-slate-200 w-14 text-center">Und</th>
                          <th className="p-2 border-r border-slate-200 w-24 text-right">Metrado Contratado</th>
                          <th className="p-2 border-r border-slate-200 w-24 text-right">P.U. (S/)</th>
                          <th className="p-2 border-r border-slate-200 w-24 text-right bg-emerald-50 text-emerald-950 font-bold">
                            Metrado Acumulado
                          </th>
                          <th className="p-2 border-r border-slate-200 w-28 text-right bg-emerald-50 font-black text-emerald-800">
                            Monto Acumulado (S/)
                          </th>
                          <th className="p-2 w-20 text-center font-bold text-blue-700">% Avance Partida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {partidasToShow.map((part) => (
                          <tr key={part.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-200">
                              {part.item}
                            </td>
                            <td className="p-2 font-medium text-slate-900 border-r border-slate-200">
                              {part.descripcion}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-600 border-r border-slate-200 uppercase">
                              {part.unidad}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700 border-r border-slate-200">
                              {part.metradoContratado.toLocaleString("es-PE")}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700 border-r border-slate-200">
                              {part.precioUnitario.toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-900 border-r border-slate-200 bg-emerald-50/20">
                              {part.metradoAcumulado.toLocaleString("es-PE")}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-800 border-r border-slate-200 bg-emerald-50/30">
                              {formatPEN(part.montoAcumulado)}
                            </td>
                            <td className="p-2 text-center font-mono font-black text-blue-700">
                              {part.porcentajeAvance}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
