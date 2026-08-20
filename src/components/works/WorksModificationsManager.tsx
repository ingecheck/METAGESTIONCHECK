import React, { useState } from "react";
import {
  Scale,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Building,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { ModificacionObra, ObraProyecto } from "../../types/obras";

interface WorksModificationsManagerProps {
  obra: ObraProyecto;
  modificaciones: ModificacionObra[];
  setModificaciones: React.Dispatch<React.SetStateAction<ModificacionObra[]>>;
}

export const WorksModificationsManager: React.FC<WorksModificationsManagerProps> = ({
  obra,
  modificaciones,
  setModificaciones,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Modificacion Form
  const [newCodigo, setNewCodigo] = useState("");
  const [newTipo, setNewTipo] = useState<ModificacionObra["tipo"]>("Prestación Adicional");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newCausal, setNewCausal] = useState("Art. 205 del RLCE - Deficiencias del Expediente Técnico");
  const [newMontoAdicional, setNewMontoAdicional] = useState<number>(0);
  const [newMontoDeductivo, setNewMontoDeductivo] = useState<number>(0);
  const [newDiasAmpliacion, setNewDiasAmpliacion] = useState<number>(0);
  const [newSustento, setNewSustento] = useState("");

  // Cumulative math
  const adicionalesAprobados = modificaciones
    .filter((m) => m.tipo === "Prestación Adicional" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.montoAdicional, 0);

  const deductivosAprobados = modificaciones
    .filter((m) => m.tipo === "Deductivo Vinculado" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.montoDeductivo, 0);

  const diasAmpliacionTotal = modificaciones
    .filter((m) => m.tipo === "Ampliación de Plazo" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.diasAmpliacion, 0);

  const incidenciaNeta = ((adicionalesAprobados - deductivosAprobados) / obra.montoContractual) * 100;
  const incidenciaBruta = (adicionalesAprobados / obra.montoContractual) * 100;

  const handleCreateModificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo.trim() || !newDescripcion.trim()) return;

    const incidencia =
      newTipo === "Prestación Adicional"
        ? (newMontoAdicional / obra.montoContractual) * 100
        : newTipo === "Deductivo Vinculado"
        ? -(newMontoDeductivo / obra.montoContractual) * 100
        : 0;

    const newMod: ModificacionObra = {
      id: `mod-${Date.now()}`,
      codigo: newCodigo.toUpperCase(),
      tipo: newTipo,
      descripcion: newDescripcion,
      causalLegal: newCausal,
      montoAdicional: newMontoAdicional,
      montoDeductivo: newMontoDeductivo,
      diasAmpliacion: newDiasAmpliacion,
      porcentajeIncidencia: parseFloat(incidencia.toFixed(2)),
      fechaSolicitud: new Date().toISOString().split("T")[0],
      estado: "En Elaboración por Residente",
      sustentoRutaCritica: newSustento || "Afecta la ruta crítica del cronograma vigente.",
    };

    setModificaciones([newMod, ...modificaciones]);
    setNewCodigo("");
    setNewDescripcion("");
    setNewMontoAdicional(0);
    setNewMontoDeductivo(0);
    setNewDiasAmpliacion(0);
    setNewSustento("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Módulo 2 • Control de Obras • Modificaciones Contractuales (Art. 197 - 205 RLCE)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gestión de Adicionales, Deductivos y Ampliaciones de Plazo
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Control del porcentaje de incidencia acumulada sobre el contrato original (límite del 15% para aprobación por la Entidad vs. autorización previa de Contraloría General de la República CGR) y reprogramación del cronograma acelerado.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Modificación</span>
          </button>
        </div>
      </div>

      {/* SEMÁFORO DE INCIDENCIA PRESUPUESTAL (ART. 205 Y 206 RLCE) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
          <div className="space-y-1">
            <div className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
              Semáforo Legal de Incidencia Acumulada
            </div>
            <h2 className="text-lg font-bold text-white">
              Cálculo de Incidencia Presupuestal sobre Contrato Original
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Incidencia Neta Acumulada</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              +{incidenciaNeta.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Progress Bar < 15% vs > 15% */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 0% a 15% (Aprobación del Titular de la Entidad)
            </span>
            <span className="text-amber-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> &gt;15% a 50% (Autorización Previa Contraloría - CGR)
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700 flex">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((incidenciaNeta / 15) * 100, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Contrato Base: S/ {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
            <span>Tope Máximo 15%: S/ {(obra.montoContractual * 0.15).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Breakdown of approved modifications */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Adicionales Aprobados:</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              + S/ {adicionalesAprobados.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">+{incidenciaBruta.toFixed(2)}% bruto</span>
          </div>

          <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Deductivos Vinculados:</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              - S/ {deductivosAprobados.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-rose-300 block mt-0.5">-{( (deductivosAprobados/obra.montoContractual)*100 ).toFixed(2)}% deducido</span>
          </div>

          <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Ampliación de Plazo Acumulada:</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              +{diasAmpliacionTotal} Días Calendario
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              Fin Reprogramado: {obra.fechaFinReprogramada}
            </span>
          </div>
        </div>
      </div>

      {/* MODIFICATIONS LIST */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Expedientes de Modificación Contractual Registrados</span>
        </h3>

        {modificaciones.map((mod) => {
          const isAdicional = mod.tipo === "Prestación Adicional";
          const isDeductivo = mod.tipo.includes("Deductivo");
          const isAmpliacion = mod.tipo === "Ampliación de Plazo";

          return (
            <div
              key={mod.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
                      isAdicional
                        ? "bg-purple-100 text-purple-900 border border-purple-300"
                        : isDeductivo
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {mod.codigo}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{mod.descripcion}</h4>
                    <div className="text-[10px] text-slate-500 font-mono">Causal: {mod.causalLegal}</div>
                  </div>
                </div>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {mod.estado}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {isAdicional && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-semibold block text-[10px]">Monto del Adicional:</span>
                    <span className="text-base font-black text-purple-950 font-mono">
                      S/ {mod.montoAdicional.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-purple-700 block mt-0.5">Incidencia: +{mod.porcentajeIncidencia}%</span>
                  </div>
                )}

                {isDeductivo && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-semibold block text-[10px]">Monto Deductivo:</span>
                    <span className="text-base font-black text-rose-950 font-mono">
                      - S/ {mod.montoDeductivo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-rose-700 block mt-0.5">Incidencia: {mod.porcentajeIncidencia}%</span>
                  </div>
                )}

                {isAmpliacion && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-semibold block text-[10px]">Plazo Solicitado / Aprobado:</span>
                    <span className="text-base font-black text-amber-950 font-mono">
                      +{mod.diasAmpliacion} Días Calendario
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Ruta Crítica Afectada</span>
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-1 sm:col-span-2">
                  <span className="text-slate-500 font-semibold block text-[10px]">Resolución y Aprobación:</span>
                  <span className="font-bold text-slate-800 text-[11px] block">{mod.numeroResolucion || "En trámite de firma de resolución"}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Sustento: {mod.sustentoRutaCritica}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Register New Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Registrar Nueva Modificación Contractual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModificacion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código / Nomenclatura:</label>
                  <input
                    type="text"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ej: ADICIONAL N° 02"
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Modificación:</label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  >
                    <option value="Prestación Adicional">Prestación Adicional (Art. 205)</option>
                    <option value="Deductivo Vinculado">Deductivo Vinculado (Art. 205.8)</option>
                    <option value="Ampliación de Plazo">Ampliación de Plazo (Art. 197)</option>
                    <option value="Mayor Metrado">Mayor Metrado (Precios Unitarios)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Expediente:</label>
                <textarea
                  rows={3}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder="Detalle el objeto técnico del adicional, deductivo o ampliación..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Adicional (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMontoAdicional}
                    onChange={(e) => setNewMontoAdicional(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Deductivo (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMontoDeductivo}
                    onChange={(e) => setNewMontoDeductivo(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Días Ampliación:</label>
                  <input
                    type="number"
                    value={newDiasAmpliacion}
                    onChange={(e) => setNewDiasAmpliacion(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sustento de Impacto en Ruta Crítica (CPM):</label>
                <input
                  type="text"
                  value={newSustento}
                  onChange={(e) => setNewSustento(e.target.value)}
                  placeholder="Ej: Afecta la partida de vaciado de techos por 15 días calendario."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Guardar Modificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
