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
  FileText,
  Shield,
  Briefcase,
  BadgeCheck,
  Box,
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
  const [obraToDelete, setObraToDelete] = useState<UserObraPackage | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filtered obras list
  const filteredObras = obrasList.filter((ob) => {
    const matchesSearch =
      ob.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ob.cui.includes(searchTerm) ||
      ob.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ob.contratista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ob.obra.numeroDocumentoContratista && ob.obra.numeroDocumentoContratista.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ob.obra.numeroDocumentoSupervisor && ob.obra.numeroDocumentoSupervisor.toLowerCase().includes(searchTerm.toLowerCase()));

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
      {/* SECCIÓN 1: BANDEJA EXCLUSIVA DE PROYECTOS DE OBRA (CARTERA)               */}
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
                Gestión técnica fundamentada en los Contratos / Órdenes de Servicio (&lt; 8 UIT) del Contratista y de la Supervisión
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onNavigateSubtab ? (
              <button
                onClick={() => onNavigateSubtab("obras-lector")}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                title="Subir y analizar PDFs de Contratos u Órdenes de Servicio (< 8 UIT) para generar la obra automáticamente"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Proyecto desde Contratos / O.S.</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingObra(null);
                  setIsNewObraModalOpen(true);
                }}
                className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Proyecto</span>
              </button>
            )}
          </div>
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
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por CUI, Contrato, O.S., Obra o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Obras Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredObras.length === 0 ? (
            <div className="col-span-full py-10 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  No hay proyectos registrados con los filtros seleccionados
                </h4>
                <p className="text-xs text-slate-500">
                  Suba los documentos de Contrato u Órdenes de Servicio (&lt; 8 UIT) para extraer CUI, montos, plazos y generar automáticamente el proyecto.
                </p>
              </div>
              {onNavigateSubtab && (
                <button
                  onClick={() => onNavigateSubtab("obras-lector")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Subir Contratos y Generar Proyecto</span>
                </button>
              )}
            </div>
          ) : (
            filteredObras.map((ob) => {
              const isActive = ob.id === activeObraId || ob.obra.id === obra.id;
              const isMenor8UitContratista = ob.obra.tipoDocumentoContratista?.includes("< 8 UIT");
              const isMenor8UitSupervisor = ob.obra.tipoDocumentoSupervisor?.includes("< 8 UIT");

              return (
                <div
                  key={ob.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between relative text-left ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
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

                    {/* Technical Document Badges (Contrato / Orden de Servicio < 8 UIT) */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[10px]">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block truncate">
                          Contratista:
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] truncate ${
                            isMenor8UitContratista ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {isMenor8UitContratista ? "O.S. < 8 UIT" : "Contrato Obra"}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-700 font-medium truncate mt-0.5" title={ob.obra.numeroDocumentoContratista}>
                          {ob.obra.numeroDocumentoContratista || "Doc. s/n"}
                        </div>
                      </div>

                      <div className="min-w-0 border-l border-slate-200 pl-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase block truncate">
                          Supervisión:
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] truncate ${
                            isMenor8UitSupervisor ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {isMenor8UitSupervisor ? "O.S. < 8 UIT" : "Contrato Sup."}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-700 font-medium truncate mt-0.5" title={ob.obra.numeroDocumentoSupervisor}>
                          {ob.obra.numeroDocumentoSupervisor || "Doc. s/n"}
                        </div>
                      </div>
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
                        title="Editar datos preliminares y contratos del proyecto"
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
                      <button
                        onClick={() => {
                          setObraToDelete(ob);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Eliminar este proyecto"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
            <div className="flex flex-wrap items-center gap-2">
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

          <div className="text-right shrink-0 flex flex-col sm:items-end justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Monto Contractual Vigente</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                S/ {(obra.montoContractual + adicionalesAprobados - deductivosAprobados).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400">
                Contrato Base: S/ {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                onClick={() => onNavigateSubtab("obras-bim")}
                className="text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ring-1 ring-white/20"
              >
                <Box className="w-4 h-4 text-cyan-300" />
                <span>Experiencia BIM 3D / 4D</span>
              </button>
              <button
                onClick={() => {
                  const currentPkg = obrasList.find((o) => o.id === activeObraId || o.obra.id === obra.id);
                  setEditingObra(currentPkg || null);
                  setIsNewObraModalOpen(true);
                }}
                className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Contratos y Datos</span>
              </button>
              <button
                onClick={() => {
                  const currentPkg = obrasList.find((o) => o.id === activeObraId || o.obra.id === obra.id);
                  if (currentPkg) {
                    setObraToDelete(currentPkg);
                    setIsDeleteModalOpen(true);
                  }
                }}
                title="Eliminar este proyecto activo"
                className="text-xs text-red-300 hover:text-white flex items-center gap-1 bg-red-500/20 hover:bg-red-600/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
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
            <span className="text-[10px] text-indigo-300 font-medium block truncate mt-0.5">
              Jefe Sup.: {obra.jefeSupervision || "Supervisor Colegiado"} ({obra.cipJefeSupervision || "CIP"})
            </span>
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

      {/* ========================================================================= */}
      {/* SECCIÓN 3: DOCUMENTOS TÉCNICOS CONTRACTUALES DE ORIGEN (DATOS PRELIMINARES) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Documentos Técnicos y Contractuales de Origen (Datos Preliminares de Obra)
              </h3>
              <p className="text-xs text-slate-500">
                Los datos iniciales de control de obra se sustentan en el Contrato u Orden de Servicio (&lt; 8 UIT) del Contratista y de la Supervisión
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const currentPkg = obrasList.find((o) => o.id === activeObraId || o.obra.id === obra.id);
              setEditingObra(currentPkg || null);
              setIsNewObraModalOpen(true);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Datos de Contratos / O.S.</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tarjeta 1: Documento Técnico del Contratista Ejecutor */}
          <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-200 rounded-xl p-4.5 space-y-3 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                    1° Documento: Contratista Ejecutor
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700">
                    {obra.tipoDocumentoContratista || "Contrato de Obra"}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                obra.tipoDocumentoContratista?.includes("< 8 UIT")
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-blue-100 text-blue-800 border-blue-300"
              }`}>
                {obra.tipoDocumentoContratista?.includes("< 8 UIT") ? "Orden de Servicio (< 8 UIT)" : "Contrato Principal"}
              </span>
            </div>

            {/* Document Details Grid */}
            <div className="space-y-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">N° de Documento / Notificación:</div>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  {obra.numeroDocumentoContratista || "CONTRATO DE OBRA N° 045-2025-MDR/GAF"}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Fecha Suscripción/Notificación:</span>
                  <strong className="text-slate-800 font-mono">{obra.fechaSuscripcionContratista || obra.fechaInicio}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Monto Contratado:</span>
                  <span className="font-bold text-emerald-800 font-mono text-xs">
                    S/ {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Plazo y Sistema:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {obra.plazoDias} Días • {obra.sistemaContratacion === "A Precios Unitarios" ? "Precios Unit." : obra.sistemaContratacion}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Contratista:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]" title={obra.contratista}>{obra.contratista}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">RUC Contratista:</span>
                  <span className="font-mono font-semibold text-slate-800">{obra.rucContratista}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Residente Designado:</span>
                  <span className="font-bold text-indigo-700 truncate max-w-[180px]">
                    {obra.residente} ({obra.cipResidente})
                  </span>
                </div>
              </div>

              {/* Adelantos otorgados en contrato */}
              <div className="bg-blue-100/60 p-2 rounded-lg border border-blue-200 flex items-center justify-between text-[11px]">
                <span className="text-blue-900 font-medium">Adelantos Pactados:</span>
                <div className="text-right font-mono text-[10px] text-blue-950 font-bold">
                  Directo: S/ {(obra.adelantoDirectoOtorgado || 0).toLocaleString("es-PE")} | Mat: S/ {(obra.adelantoMaterialesOtorgado || 0).toLocaleString("es-PE")}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Documento Técnico de la Supervisión / Inspectoría */}
          <div className="bg-gradient-to-br from-purple-50/70 to-slate-50 border border-purple-200 rounded-xl p-4.5 space-y-3 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    2° Documento: Supervisión / Inspectoría
                  </h4>
                  <span className="text-[11px] font-semibold text-purple-700">
                    {obra.tipoDocumentoSupervisor || "Contrato de Supervisión"}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                obra.tipoDocumentoSupervisor?.includes("< 8 UIT")
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-purple-100 text-purple-800 border-purple-300"
              }`}>
                {obra.tipoDocumentoSupervisor?.includes("< 8 UIT") ? "Orden de Servicio (< 8 UIT)" : "Consultoría / Inspector"}
              </span>
            </div>

            {/* Document Details Grid */}
            <div className="space-y-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">N° de Documento / Notificación:</div>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  {obra.numeroDocumentoSupervisor || "CONTRATO DE CONSULTORÍA N° 012-2025-CS"}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Fecha Suscripción/Notificación:</span>
                  <strong className="text-slate-800 font-mono">{obra.fechaSuscripcionSupervisor || obra.fechaInicio}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Monto Supervisión:</span>
                  <span className="font-bold text-purple-900 font-mono text-xs">
                    S/ {(obra.montoSupervision || 125000).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Condición Técnica:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    Supervisión Externa
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Empresa / Inspector:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]" title={obra.supervisor}>{obra.supervisor}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">RUC / DNI Supervisión:</span>
                  <span className="font-mono font-semibold text-slate-800">{obra.rucSupervisor}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Jefe de Supervisión:</span>
                  <span className="font-bold text-purple-700 truncate max-w-[180px]">
                    {obra.jefeSupervision || "Ing. Supervisor"} ({obra.cipJefeSupervision || "CIP"})
                  </span>
                </div>
              </div>

              {/* Responsabilidad Técnica */}
              <div className="bg-purple-100/60 p-2 rounded-lg border border-purple-200 text-[10px] text-purple-950">
                <strong>Responsabilidad en Obra:</strong> Control permanente de calidad, revisión y aprobación de valorizaciones mensuales y emisión de pronunciamientos técnicos ante la Entidad.
              </div>
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
            onClick={() => onNavigateSubtab("obras-valorizaciones")}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver Curva S y Desglose</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Incidencia de Modificaciones */}
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
            onClick={() => onNavigateSubtab("obras-adicionales")}
            className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver Adicionales y Plazos</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Plazo Contractual y Reprogramado */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plazo de Ejecución</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-900">
              {obra.plazoDias + diasAmpliacionTotal} Días
            </span>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
              {obra.estado}
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            Término: {obra.fechaFinReprogramada || obra.fechaFinProgramada}
          </div>
          <button
            onClick={() => onNavigateSubtab("obras-adicionales")}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver Ampliaciones</span> <ArrowRight className="w-3 h-3" />
          </button>
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

      {/* Delete Obra Confirmation Modal (Eliminación Segura sin window.confirm) */}
      {isDeleteModalOpen && obraToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-amber-50 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar Proyecto de Obra?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-800 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    CUI {obraToDelete.cui}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {obraToDelete.estado}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
                  {obraToDelete.nombre}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contratista:</span>
                    <span className="font-medium text-slate-800 truncate block">{obraToDelete.contratista || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monto Contractual:</span>
                    <span className="font-bold text-slate-900 font-mono">S/ {obraToDelete.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Se eliminarán permanentemente todos los datos asociados: valorizaciones mensuales, planilla de partidas, asientos del Cuaderno de Obra Digital y adicionales de este proyecto.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setObraToDelete(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (obraToDelete) {
                    onDeleteObra(obraToDelete.id);
                    setIsDeleteModalOpen(false);
                    setObraToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Proyecto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
