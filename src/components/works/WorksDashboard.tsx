import React, { useState } from "react";
import {
  Building2,
  HardHat,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileCheck2,
  BookOpen,
  Scale,
  Award,
  Layers,
  Sparkles,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Check,
} from "lucide-react";
import {
  ObraProyecto,
  ValorizacionMensual,
  AsientoCuadernoObra,
  ModificacionObra,
  UserObraPackage,
} from "../../types/obras";
import { NewObraModal } from "./NewObraModal";

interface WorksDashboardProps {
  obra: ObraProyecto;
  setObra: React.Dispatch<React.SetStateAction<ObraProyecto>>;
  valorizaciones: ValorizacionMensual[];
  asientos: AsientoCuadernoObra[];
  modificaciones: ModificacionObra[];
  onNavigateSubtab: (subtab: string) => void;
  // Multi-obra management props
  obrasList: UserObraPackage[];
  activeObraId: string;
  onSelectObra: (obraId: string) => void;
  onSaveObra: (obra: UserObraPackage) => void;
  onDeleteObra: (obraId: string) => void;
  onDuplicateObra: (obraId: string) => void;
}

export const WorksDashboard: React.FC<WorksDashboardProps> = ({
  obra,
  setObra,
  valorizaciones,
  asientos,
  modificaciones,
  onNavigateSubtab,
  obrasList,
  activeObraId,
  onSelectObra,
  onSaveObra,
  onDeleteObra,
  onDuplicateObra,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewObraModalOpen, setIsNewObraModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<UserObraPackage | null>(null);

  // Filtered obras list
  const filteredObras = obrasList.filter((ob) => {
    const matchesSearch =
      ob.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ob.cui.includes(searchTerm) ||
      ob.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ob.contratista.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      ob.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Compute key stats for currently active obra
  const latestVal = valorizaciones.length > 0 ? (valorizaciones.filter((v) => v.montoEjecutado > 0).slice(-1)[0] || valorizaciones[0]) : null;
  const totalEjecutado = valorizaciones.reduce((acc, v) => acc + (v.montoEjecutado || 0), 0);
  const avanceFisicoAcumulado = latestVal ? latestVal.porcentajeEjecutadoAcumulado : 0;
  const avanceProgramadoAcumulado = latestVal ? latestVal.porcentajeProgramadoAcumulado : 0;
  const diferenciaAvance = avanceFisicoAcumulado - avanceProgramadoAcumulado;

  const adicionalesAprobados = modificaciones
    .filter((m) => m.tipo === "Prestación Adicional" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.montoAdicional, 0);

  const deductivosAprobados = modificaciones
    .filter((m) => m.tipo === "Deductivo Vinculado" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.montoDeductivo, 0);

  const diasAmpliacionTotal = modificaciones
    .filter((m) => m.tipo === "Ampliación de Plazo" && m.estado.includes("Aprobado"))
    .reduce((acc, m) => acc + m.diasAmpliacion, 0);

  const incidenciaTotalNeto = obra.montoContractual > 0
    ? ((adicionalesAprobados - deductivosAprobados) / obra.montoContractual) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SECCIÓN 1: BANDEJA EXCLUSIVA DE PROYECTOS DE OBRA (APARTADO 2)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Cartera de Proyectos de Obra Pública en Ejecución
              </h2>
              <p className="text-xs text-slate-500">
                Seleccione el proyecto de obra para gestionar sus valorizaciones, cuaderno digital, adicionales y liquidación
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingObra(null);
              setIsNewObraModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Nuevo Proyecto de Obra</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas ({obrasList.length})
            </button>
            <button
              onClick={() => setStatusFilter("En Ejecución")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "En Ejecución"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              En Ejecución
            </button>
            <button
              onClick={() => setStatusFilter("Atrasada (>20%)")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "Atrasada (>20%)"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Atrasadas
            </button>
            <button
              onClick={() => setStatusFilter("Liquidada")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "Liquidada"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Liquidadas
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por CUI, Obra o Entidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Obras Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredObras.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No se encontraron obras con los filtros seleccionados. Haga clic en "+ Registrar Nuevo Proyecto de Obra" para dar de alta uno.
            </div>
          ) : (
            filteredObras.map((ob) => {
              const isActive = ob.id === activeObraId || ob.obra.id === obra.id;
              return (
                <div
                  key={ob.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between relative text-left ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-indigo-900 text-indigo-100 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                            CUI {ob.cui}
                          </span>
                          {isActive && (
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                              <Check className="w-3 h-3" /> Obra Activa
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {ob.obra.tipologia} • {ob.obra.sistemaContratacion}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          ob.estado === "Liquidada"
                            ? "bg-purple-100 text-purple-800"
                            : ob.estado.includes("Atrasada")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {ob.estado}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="text-xs text-slate-800 font-semibold line-clamp-2 leading-snug">
                      {ob.nombre}
                    </div>

                    {/* Entity & Contractor */}
                    <div className="space-y-0.5 text-[11px] text-slate-500">
                      <div className="truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{ob.entidad}</span>
                      </div>
                      <div className="truncate flex items-center gap-1">
                        <HardHat className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{ob.contratista}</span>
                      </div>
                    </div>

                    {/* Amount & Time */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 text-[11px]">Monto Contractual:</span>
                      <span className="font-bold text-slate-900">
                        S/ {ob.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Actions bottom */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingObra(ob);
                          setIsNewObraModalOpen(true);
                        }}
                        title="Editar datos del proyecto"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateObra(ob.id)}
                        title="Duplicar proyecto de obra"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {obrasList.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar el proyecto "${ob.nombre}"?`)) {
                              onDeleteObra(ob.id);
                            }
                          }}
                          title="Eliminar proyecto"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectObra(ob.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      <span>{isActive ? "Administrando Aquí" : "Administrar este Proyecto"}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: DETALLE DEL PROYECTO ACTIVO EN EJECUCIÓN                       */}
      {/* ========================================================================= */}
      {/* Primary Project Identity Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/30 text-indigo-200 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border border-indigo-400/30">
                CUI N° {obra.cui}
              </span>
              <span className="bg-slate-700/60 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded">
                {obra.sistemaContratacion}
              </span>
              <span className="bg-blue-500/20 text-blue-300 text-[11px] font-medium px-2 py-0.5 rounded">
                {obra.tipologia}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-tight">
              {obra.nombre}
            </h2>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Monto Contractual Vigente</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              S/ {(obra.montoContractual + adicionalesAprobados - deductivosAprobados).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">
              Contrato Base: S/ {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Stakeholders and Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Entidad Convocante:</span>
            <div className="font-bold text-slate-200 truncate mt-0.5" title={obra.entidad}>{obra.entidad}</div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-indigo-400" /> {obra.ubicacion}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contratista Ejecutor:</span>
            <div className="font-bold text-slate-200 truncate mt-0.5">{obra.contratista}</div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">RUC: {obra.rucContratista}</span>
            <span className="text-[10px] text-indigo-300 font-medium block truncate mt-0.5">Residente: {obra.residente} ({obra.cipResidente})</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Supervisión de Obra:</span>
            <div className="font-bold text-slate-200 truncate mt-0.5">{obra.supervisor}</div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">RUC: {obra.rucSupervisor}</span>
            <span className="text-[10px] text-indigo-300 font-medium block truncate mt-0.5">Supervisión Certificada</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Plazos y Vigencia:</span>
            <div className="font-bold text-slate-200 mt-0.5">
              {obra.plazoDias + diasAmpliacionTotal} días calendario
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Inicio: <strong className="text-slate-200">{obra.fechaInicio}</strong>
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold">
              Término Reprog.: {obra.fechaFinReprogramada || obra.fechaFinProgramada}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Avance Físico */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avance Físico Acumulado</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{avanceFisicoAcumulado.toFixed(2)}%</span>
            <span className="text-xs text-slate-500">Prog: {avanceProgramadoAcumulado.toFixed(2)}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                diferenciaAvance >= 0 ? "bg-emerald-500" : diferenciaAvance > -5 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(avanceFisicoAcumulado, 100)}%` }}
            />
          </div>
          <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-1">
            <span>Variación:</span>
            <span className={diferenciaAvance >= -1 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
              {diferenciaAvance >= 0 ? `+${diferenciaAvance.toFixed(2)}% (Adelantada)` : `${diferenciaAvance.toFixed(2)}% (En Ritmo)`}
            </span>
          </div>
        </div>

        {/* Card 2: Valorizaciones Pagadas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valorizado a la Fecha</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-800">
              S/ {(totalEjecutado / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-slate-500">de S/ {(obra.montoContractual / 1000000).toFixed(2)}M</span>
          </div>
          <div className="text-[11px] text-slate-600">
            {valorizaciones.length} Valorizaciones mensuales registradas
          </div>
          <button
            onClick={() => onNavigateSubtab("valorizaciones")}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver Curva S y Desglose</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Cuaderno de Obra Digital */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuaderno de Obra</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-900">{asientos.length} Asientos</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Al Día</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Registros oficiales Residente y Supervisor
          </div>
          <button
            onClick={() => onNavigateSubtab("cuaderno")}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Abrir Cuaderno Digital</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Incidencia de Modificaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Incidencia Adicionales</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-purple-900">+{incidenciaTotalNeto.toFixed(2)}%</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Límite &lt; 15% (Entidad)
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Adicionales Netos: S/ {(adicionalesAprobados - deductivosAprobados).toLocaleString("es-PE")}
          </div>
          <button
            onClick={() => onNavigateSubtab("modificaciones")}
            className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver Adicionales y Plazos</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Modules Quick Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Módulos de Ejecución y Supervisión Técnica
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateSubtab("valorizaciones")}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-0.5 transition">
                Entrar &rarr;
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Valorizaciones y Curva S</h4>
            <p className="text-xs text-slate-500 mt-1">
              Cálculo de Fórmula Polinómica (K), amortizaciones de adelantos y retenciones.
            </p>
          </div>

          <div
            onClick={() => onNavigateSubtab("cuaderno")}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-0.5 transition">
                Entrar &rarr;
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Cuaderno de Obra Digital</h4>
            <p className="text-xs text-slate-500 mt-1">
              Asientos del Residente y Supervisor, causales de ampliación y control de lluvias.
            </p>
          </div>

          <div
            onClick={() => onNavigateSubtab("modificaciones")}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-0.5 transition">
                Entrar &rarr;
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Adicionales y Ampliaciones</h4>
            <p className="text-xs text-slate-500 mt-1">
              Cálculo de Incidencia &le; 15% (Art. 205 RLCE) y sustento de ruta crítica.
            </p>
          </div>

          <div
            onClick={() => onNavigateSubtab("liquidacion")}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-0.5 transition">
                Entrar &rarr;
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Liquidación Final y Cierre</h4>
            <p className="text-xs text-slate-500 mt-1">
              Balance económico final, saldo a favor y acta de recepción de obra.
            </p>
          </div>
        </div>
      </div>

      {/* New / Edit Obra Modal */}
      <NewObraModal
        isOpen={isNewObraModalOpen}
        onClose={() => {
          setIsNewObraModalOpen(false);
          setEditingObra(null);
        }}
        onSaveObra={onSaveObra}
        editingObra={editingObra}
      />
    </div>
  );
};
