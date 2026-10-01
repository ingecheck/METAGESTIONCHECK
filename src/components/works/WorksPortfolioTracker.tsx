import React, { useState, useEffect, useMemo } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Printer,
  Sparkles,
  Layers,
  Building2,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  UserCheck,
  HardHat,
  X,
  FileText,
  Save,
  Check,
} from "lucide-react";
import {
  ProyectoCartera,
  PROYECTOS_RIOJA_SEED,
  getProgresoPorcentaje,
  getEstadoLabel,
  getAlertasNormativas,
  EstadoCartera,
  HitoNormativo,
} from "../../types/seguimientoCartera";
import { ObraProyecto } from "../../types/obras";
import { formatPEN } from "../../services/docxGenerator";

interface WorksPortfolioTrackerProps {
  onSelectObra?: (obra: Partial<ObraProyecto>) => void;
  onNavigateToTab?: (tab: string) => void;
}

const LOCAL_STORAGE_KEY = "mgc_cartera_rioja_proyectos_v1";

export const WorksPortfolioTracker: React.FC<WorksPortfolioTrackerProps> = ({
  onSelectObra,
  onNavigateToTab,
}) => {
  // Load projects from localStorage or seed
  const [proyectos, setProyectos] = useState<ProyectoCartera[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading cartera from localStorage:", e);
    }
    return PROYECTOS_RIOJA_SEED;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(proyectos));
    } catch (e) {
      console.error("Error saving cartera:", e);
    }
  }, [proyectos]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEncargado, setFilterEncargado] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterSoloAlertas, setFilterSoloAlertas] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"matriz" | "pipeline" | "cuadro_avance">("matriz");

  // Selected project for quick modal or checklist
  const [selectedProject, setSelectedProject] = useState<ProyectoCartera | null>(null);
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<ProyectoCartera>>({});

  // 1-Click Toggle for any milestone in any project
  const handleToggleHito = (proyectoId: number, hitoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setProyectos((prev) =>
      prev.map((proj) => {
        if (proj.id !== proyectoId) return proj;

        const updatedHitos = proj.hitos.map((h) => {
          if (h.id === hitoId) {
            return {
              ...h,
              cumplido: !h.cumplido,
              fecha: !h.cumplido ? new Date().toLocaleDateString("es-PE") : undefined,
            };
          }
          return h;
        });

        // Recalculate automatic status if critical milestones are checked
        let updatedEstado = proj.estado;
        const hitoTerreno = updatedHitos.find((h) => h.id === "hito-terreno")?.cumplido;
        const hitoInicio = updatedHitos.find((h) => h.id === "hito-acta-inicio")?.cumplido;
        const hitoRecepcion = updatedHitos.find((h) => h.id === "hito-recepcion")?.cumplido;
        const hitoLiq = updatedHitos.find((h) => h.id === "hito-liquidacion")?.cumplido;
        const hitoContratoObra = updatedHitos.find((h) => h.id === "hito-contrato-obra")?.cumplido;

        if (hitoLiq) {
          updatedEstado = "FINALIZADA_LIQUIDADA";
        } else if (hitoRecepcion) {
          updatedEstado = "RECEPCIONADA";
        } else if (hitoTerreno && hitoInicio) {
          updatedEstado = "EN_EJECUCION";
        } else if (hitoContratoObra && (!hitoTerreno || !hitoInicio)) {
          updatedEstado = "PENDIENTE_INICIO_CONDICIONES";
        }

        const updatedProj = {
          ...proj,
          estado: updatedEstado,
          hitos: updatedHitos,
        };

        if (selectedProject && selectedProject.id === proyectoId) {
          setSelectedProject(updatedProj);
        }

        return updatedProj;
      })
    );
  };

  // Quick 1-click reset to seed data
  const handleResetSeed = () => {
    if (
      window.confirm(
        "¿Deseas restaurar la lista oficial inicial de 23 proyectos de la Municipalidad Provincial de Rioja?"
      )
    ) {
      setProyectos(PROYECTOS_RIOJA_SEED);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(PROYECTOS_RIOJA_SEED));
      setSelectedProject(null);
    }
  };

  // Filtered list
  const filteredProjects = useMemo(() => {
    return proyectos.filter((p) => {
      // Search
      const text = `${p.id} ${p.proyecto} ${p.cui} ${p.encargado} ${p.contratoEjecucionNumero} ${p.contratoEjecucionEmpresa} ${p.contratoSupervisionNumero} ${p.contratoSupervisionEmpresa} ${p.observaciones}`.toLowerCase();
      if (searchQuery && !text.includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Encargado
      if (filterEncargado !== "TODOS") {
        if (filterEncargado === "SIN_ASIGNAR" && p.encargado !== "-") return false;
        if (filterEncargado !== "SIN_ASIGNAR" && p.encargado !== filterEncargado) return false;
      }
      // Estado
      if (filterEstado !== "TODOS" && p.estado !== filterEstado) {
        return false;
      }
      // Solo alertas
      if (filterSoloAlertas) {
        const alertas = getAlertasNormativas(p);
        if (alertas.length === 0) return false;
      }
      return true;
    });
  }, [proyectos, searchQuery, filterEncargado, filterEstado, filterSoloAlertas]);

  // Statistics & KPIs
  const stats = useMemo(() => {
    const total = proyectos.length;
    const montoTotal = proyectos.reduce((sum, p) => sum + (p.contratoEjecucionMonto || 0), 0);
    const montoSupervision = proyectos.reduce((sum, p) => sum + (p.contratoSupervisionMonto || 0), 0);
    const actosPrep = proyectos.filter(
      (p) => p.estado === "ACTOS_PREPARATORIOS" || p.estado === "EN_SELECCION_SEACE"
    ).length;
    const pendienteInicio = proyectos.filter((p) => p.estado === "PENDIENTE_INICIO_CONDICIONES").length;
    const enEjecucion = proyectos.filter((p) => p.estado === "EN_EJECUCION").length;
    const finalizadas = proyectos.filter(
      (p) => p.estado === "RECEPCIONADA" || p.estado === "FINALIZADA_LIQUIDADA"
    ).length;
    const conAlertas = proyectos.filter((p) => getAlertasNormativas(p).length > 0).length;

    return {
      total,
      montoTotal,
      montoSupervision,
      actosPrep,
      pendienteInicio,
      enEjecucion,
      finalizadas,
      conAlertas,
    };
  }, [proyectos]);

  // Load project into Obra Suite
  const handleOpenInObraSuite = (p: ProyectoCartera) => {
    if (onSelectObra) {
      onSelectObra({
        id: `obra-${p.cui || p.id}`,
        cui: p.cui,
        nombre: p.proyecto,
        entidad: "MUNICIPALIDAD PROVINCIAL DE RIOJA",
        numeroDocumentoContratista: p.contratoEjecucionNumero,
        contratista: p.contratoEjecucionEmpresa,
        montoContractual: p.contratoEjecucionMonto || 1000000,
        residente: p.residenteNombre || "Ing. Residente de Obra",
        cipResidente: p.residenteCip || "CIP",
        numeroDocumentoSupervisor: p.contratoSupervisionNumero,
        supervisor: p.contratoSupervisionEmpresa,
        jefeSupervision: p.supervisorNombre || "Ing. Supervisor de Obra",
        cipJefeSupervision: p.supervisorCip || "CIP",
        montoSupervision: p.contratoSupervisionMonto,
        fechaInicio: p.inicioObraFecha || "2026-05-13",
        fechaFinProgramada: p.fechaTerminoActualizado || "2026-12-08",
        plazoDias: p.plazoDias || 180,
      });
    }
    if (onNavigateToTab) {
      onNavigateToTab("obras-inicio");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "ENCARGADO",
      "PROYECTO",
      "CUI",
      "CONTRATO_EJECUCION_NRO",
      "FIRMA_CONTRATO_OBRA",
      "MONTO_OBRA",
      "EMPRESA_EJECUTORA",
      "CONTRATO_SUPERVISION_NRO",
      "FIRMA_SUPERVISION",
      "MONTO_SUPERVISION",
      "EMPRESA_SUPERVISORA",
      "ENTREGA_TERRENO",
      "INICIO_OBRA",
      "PLAZO_DIAS",
      "FECHA_TERMINO",
      "ESTADO_NORMATIVO",
      "AVANCE_NORMATIVO_PCT",
      "OBSERVACIONES",
    ];

    const rows = proyectos.map((p) => [
      p.id,
      p.encargado,
      `"${p.proyecto.replace(/"/g, '""')}"`,
      p.cui,
      `"${p.contratoEjecucionNumero}"`,
      p.contratoEjecucionFechaFirma || "",
      p.contratoEjecucionMonto || 0,
      `"${(p.contratoEjecucionEmpresa || "").replace(/"/g, '""')}"`,
      `"${p.contratoSupervisionNumero}"`,
      p.contratoSupervisionFechaFirma || "",
      p.contratoSupervisionMonto || 0,
      `"${(p.contratoSupervisionEmpresa || "").replace(/"/g, '""')}"`,
      p.entregaTerrenoFecha || "",
      p.inicioObraFecha || "",
      p.plazoDias || "",
      p.fechaTerminoActualizado || "",
      `"${p.estado}"`,
      `${getProgresoPorcentaje(p.hitos)}%`,
      `"${(p.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cartera_Proyectos_OEI_Rioja_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save edit form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setProyectos((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          ...editFormData,
        } as ProyectoCartera;
      })
    );

    setSelectedProject((prev) => (prev ? ({ ...prev, ...editFormData } as ProyectoCartera) : null));
    setIsEditingProject(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5" />
                Apartado 4 • Seguimiento de Cartera OEI
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Municipalidad Provincial de Rioja
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Control Normativo 1-Click
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Matriz de Seguimiento de Inversiones & Actos Preparatorios</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Monitoreo integral de la cartera de proyectos municipales con actualización rápida en <strong>1 solo clic</strong>: supervisa actos preparatorios, bases, notificación al supervisor, actas de entrega de terreno, inicio de obra y valorizaciones mensuales conforme a la Ley de Contrataciones del Estado (Art. 176 RLCE).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleExportCSV}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar matriz en Excel (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Exportar Excel
            </button>
            <button
              onClick={handleResetSeed}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Restaurar los 23 proyectos iniciales oficiales de Rioja"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              Restaurar Lista
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Cartera Total</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.total} Proyectos</div>
            <div className="text-[10px] text-blue-300 font-mono mt-0.5">{formatPEN(stats.montoTotal)}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-amber-300 uppercase">Actos Preparatorios</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{stats.actosPrep}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">TDR / Bases / SEACE</div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-rose-300 uppercase">Pendiente Inicio</div>
            <div className="text-lg font-black text-rose-400 mt-0.5">{stats.pendienteInicio}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Art. 176 RLCE</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-blue-300 uppercase">En Ejecución</div>
            <div className="text-lg font-black text-blue-400 mt-0.5">{stats.enEjecucion}</div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">Obras en Campo</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase">Finalizadas / Recep.</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{stats.finalizadas}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">Acta / Liquidación</div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-orange-300 uppercase">Alertas Normativas</div>
            <div className="text-lg font-black text-orange-400 mt-0.5">{stats.conAlertas}</div>
            <div className="text-[10px] text-orange-200/80 mt-0.5">Requieren Acción</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Modes */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveView("matriz")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === "matriz"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Matriz Oficial (Excel)
            </button>
            <button
              onClick={() => setActiveView("pipeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === "pipeline"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Checklist 1-Click Pipeline
            </button>
            <button
              onClick={() => setActiveView("cuadro_avance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === "cuadro_avance"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Cuadro de Avance Situacional
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por proyecto, CUI, encargado, contratista, supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-bold flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3" />
              Encargado:
            </span>
            {["TODOS", "JHON", "JHENIFER", "JEZER", "SIN_ASIGNAR"].map((enc) => (
              <button
                key={enc}
                onClick={() => setFilterEncargado(enc)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition ${
                  filterEncargado === enc
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {enc === "SIN_ASIGNAR" ? "Sin Asignar (-)" : enc}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-bold text-[11px]">Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTOS_PREPARATORIOS">Actos Preparatorios</option>
              <option value="EN_SELECCION_SEACE">En Selección (SEACE)</option>
              <option value="PENDIENTE_INICIO_CONDICIONES">Pendiente Inicio (Art. 176)</option>
              <option value="EN_EJECUCION">En Ejecución</option>
              <option value="RECEPCIONADA">Recepcionada</option>
              <option value="FINALIZADA_LIQUIDADA">Finalizada / Liquidada</option>
            </select>

            <button
              onClick={() => setFilterSoloAlertas(!filterSoloAlertas)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer ${
                filterSoloAlertas
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Solo con Alertas Normativas
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: MATRIZ DE CARTERA OFICIAL (EXCEL SPREADSHEET)   */}
      {/* ======================================================== */}
      {activeView === "matriz" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Matriz Oficial de Obras e Inversiones ({filteredProjects.length} Registros)</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              💡 Haz clic en cualquier casilla de verificación para marcar hitos normativos al instante.
            </div>
          </div>

          <div className="overflow-x-auto max-h-[750px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-20 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 border-r border-slate-800 text-center w-12">ID</th>
                  <th className="p-2.5 border-r border-slate-800 w-24">ENCARGADO</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[200px]">PROYECTO & CUI</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[220px]">
                    CONTRATO EJECUCIÓN (OBRA)
                  </th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[220px]">
                    CONTRATO SUPERVISIÓN
                  </th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-24">
                    ENTREGA TERRENO
                  </th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-24">
                    INICIO OBRA
                  </th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-16">PLAZO</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-24">
                    TÉRMINO VIGENTE
                  </th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[180px]">
                    OBSERVACIONES & ALERTAS
                  </th>
                  <th className="p-2.5 text-center min-w-[170px]">
                    HITOS NORMATIVOS (1-CLICK)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredProjects.map((p) => {
                  const estadoInfo = getEstadoLabel(p.estado);
                  const alertas = getAlertasNormativas(p);
                  const pct = getProgresoPorcentaje(p.hitos);

                  // Hitos clave para 1-click rápido
                  const hitoNotifSup = p.hitos.find((h) => h.id === "hito-notif-sup");
                  const hitoTerreno = p.hitos.find((h) => h.id === "hito-terreno");
                  const hitoExpediente = p.hitos.find((h) => h.id === "hito-expediente");
                  const hitoCod = p.hitos.find((h) => h.id === "hito-cod");
                  const hitoValo1 = p.hitos.find((h) => h.id === "hito-valo-01");
                  const hitoRecepcion = p.hitos.find((h) => h.id === "hito-recepcion");

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="hover:bg-blue-50/60 transition cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="p-2.5 font-bold text-center font-mono text-slate-700 bg-slate-50 group-hover:bg-blue-100/50 border-r border-slate-200">
                        {p.id}
                      </td>

                      {/* ENCARGADO */}
                      <td className="p-2.5 border-r border-slate-200">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10px] tracking-wide inline-block ${
                            p.encargado === "JHON"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : p.encargado === "JHENIFER"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : p.encargado === "JEZER"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.encargado}
                        </span>
                      </td>

                      {/* PROYECTO & CUI */}
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {p.proyecto}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            CUI: {p.cui}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${estadoInfo.bg} ${estadoInfo.color} ${estadoInfo.border}`}
                          >
                            {estadoInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* CONTRATO EJECUCION */}
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-bold text-slate-800 text-[11px]">
                          {p.contratoEjecucionNumero}
                        </div>
                        {p.contratoEjecucionMonto > 0 && (
                          <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                            {formatPEN(p.contratoEjecucionMonto)}
                          </div>
                        )}
                        {p.contratoEjecucionEmpresa && (
                          <div className="text-[10px] text-slate-600 truncate max-w-[200px] mt-0.5">
                            {p.contratoEjecucionEmpresa}
                          </div>
                        )}
                        {p.residenteNombre && (
                          <div className="text-[9px] text-indigo-700 truncate max-w-[200px]">
                            Res: {p.residenteNombre}
                          </div>
                        )}
                        {p.contratoEjecucionFechaFirma && (
                          <div className="text-[9px] text-slate-400">
                            Firma: {p.contratoEjecucionFechaFirma}
                          </div>
                        )}
                      </td>

                      {/* CONTRATO SUPERVISION */}
                      <td className="p-2.5 border-r border-slate-200">
                        <div
                          className={`font-bold text-[11px] ${
                            p.contratoSupervisionNumero.includes("FALTA")
                              ? "text-rose-600 font-black"
                              : "text-slate-800"
                          }`}
                        >
                          {p.contratoSupervisionNumero}
                        </div>
                        {p.contratoSupervisionMonto > 0 && (
                          <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
                            {formatPEN(p.contratoSupervisionMonto)}
                          </div>
                        )}
                        {p.contratoSupervisionEmpresa && (
                          <div className="text-[10px] text-slate-600 truncate max-w-[200px] mt-0.5">
                            {p.contratoSupervisionEmpresa}
                          </div>
                        )}
                        {p.supervisorNombre && (
                          <div className="text-[9px] text-blue-800 truncate max-w-[200px]">
                            Sup: {p.supervisorNombre}
                          </div>
                        )}
                        {p.contratoSupervisionFechaFirma && (
                          <div className="text-[9px] text-slate-400">
                            Firma: {p.contratoSupervisionFechaFirma}
                          </div>
                        )}
                      </td>

                      {/* ENTREGA TERRENO */}
                      <td className="p-2.5 text-center font-mono text-[11px] border-r border-slate-200">
                        {p.entregaTerrenoFecha || <span className="text-slate-300">-</span>}
                      </td>

                      {/* INICIO OBRA */}
                      <td className="p-2.5 text-center font-mono text-[11px] border-r border-slate-200">
                        {p.inicioObraFecha ? (
                          <span className="font-bold text-emerald-800">{p.inicioObraFecha}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* PLAZO */}
                      <td className="p-2.5 text-center font-mono border-r border-slate-200">
                        {p.plazoDias ? (
                          <span className="font-bold text-slate-800">{p.plazoDias} d</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* FECHA TERMINO */}
                      <td className="p-2.5 text-center font-mono text-[11px] border-r border-slate-200">
                        {p.fechaTerminoActualizado ? (
                          <span className="font-semibold text-slate-800">
                            {p.fechaTerminoActualizado}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* OBSERVACIONES & ALERTAS */}
                      <td className="p-2.5 border-r border-slate-200">
                        {alertas.length > 0 && (
                          <div className="space-y-1 mb-1.5">
                            {alertas.map((al, idx) => (
                              <div
                                key={idx}
                                className="bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 leading-tight"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                <span>{al}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {p.observaciones ? (
                          <div className="text-[10px] text-slate-600 italic leading-snug">
                            {p.observaciones}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* HITOS NORMATIVOS 1-CLICK CHECKBOXES */}
                      <td className="p-2.5 bg-slate-50/80 group-hover:bg-white transition" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-600">Avance Normativo:</span>
                            <span className="font-mono font-extrabold text-blue-700">{pct}%</span>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct === 100
                                  ? "bg-emerald-500"
                                  : pct > 60
                                  ? "bg-blue-600"
                                  : pct > 30
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* 1-Click Fast Buttons Row */}
                          <div className="grid grid-cols-3 gap-1 pt-1">
                            {/* 1. Notif Supervisor */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-notif-sup", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoNotifSup?.cumplido
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Notificación al Supervisor (Art. 176.1.a)"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoNotifSup?.cumplido ? "text-emerald-700" : "text-slate-300"}`} />
                              <span>Notif Sup</span>
                            </button>

                            {/* 2. Entrega Terreno */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-terreno", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoTerreno?.cumplido
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Entrega de Terreno (Art. 176.1.b)"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoTerreno?.cumplido ? "text-emerald-700" : "text-slate-300"}`} />
                              <span>Terreno</span>
                            </button>

                            {/* 3. Entrega Expediente */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-expediente", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoExpediente?.cumplido
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Entrega del Expediente Técnico Completo (Art. 176.1.c)"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoExpediente?.cumplido ? "text-emerald-700" : "text-slate-300"}`} />
                              <span>Exp E.T.</span>
                            </button>

                            {/* 4. COD */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-cod", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoCod?.cumplido
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Cuaderno de Obra Digital"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoCod?.cumplido ? "text-emerald-700" : "text-slate-300"}`} />
                              <span>COD</span>
                            </button>

                            {/* 5. Valo 01 */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-valo-01", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoValo1?.cumplido
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Valorización N° 01 Aprobada"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoValo1?.cumplido ? "text-emerald-700" : "text-slate-300"}`} />
                              <span>Val 01</span>
                            </button>

                            {/* 6. Recepción */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleHito(p.id, "hito-recepcion", e)}
                              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition flex items-center justify-center gap-0.5 cursor-pointer ${
                                hitoRecepcion?.cumplido
                                  ? "bg-teal-100 text-teal-800 border-teal-300"
                                  : "bg-white text-slate-500 border-slate-300 hover:border-blue-400"
                              }`}
                              title="Acta de Recepción de Obra"
                            >
                              <Check className={`w-2.5 h-2.5 ${hitoRecepcion?.cumplido ? "text-teal-700" : "text-slate-300"}`} />
                              <span>Recep.</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: CHECKLIST 1-CLICK PIPELINE                      */}
      {/* ======================================================== */}
      {activeView === "pipeline" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const estadoInfo = getEstadoLabel(p.estado);
            const alertas = getAlertasNormativas(p);
            const pct = getProgresoPorcentaje(p.hitos);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      ID #{p.id} • CUI {p.cui}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${estadoInfo.bg} ${estadoInfo.color} ${estadoInfo.border}`}
                    >
                      {estadoInfo.label}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2 mb-1">
                    {p.proyecto}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
                    <span className="font-semibold text-slate-700">Encargado:</span>
                    <span className="font-bold text-blue-700">{p.encargado}</span>
                    {p.contratoEjecucionMonto > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatPEN(p.contratoEjecucionMonto)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600">Cumplimiento Normativo:</span>
                      <span className="text-blue-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pct === 100
                            ? "bg-emerald-500"
                            : pct > 60
                            ? "bg-blue-600"
                            : pct > 30
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Alertas */}
                  {alertas.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-3 space-y-1">
                      <div className="text-[10px] font-black text-rose-800 uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Acciones Normativas Pendientes:
                      </div>
                      {alertas.map((al, idx) => (
                        <div key={idx} className="text-[11px] font-semibold text-rose-700 pl-4 list-item">
                          {al}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Checklist 1-Click Toggle Table */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Checklist Normativo (Haz clic para marcar):
                    </div>
                    {p.hitos.map((hito) => (
                      <div
                        key={hito.id}
                        onClick={() => handleToggleHito(p.id, hito.id)}
                        className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                          hito.cumplido
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50/50 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              hito.cumplido
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-400 bg-white"
                            }`}
                          >
                            {hito.cumplido && <Check className="w-3 h-3" />}
                          </div>
                          <span className={`text-[11px] truncate ${hito.cumplido ? "font-semibold" : "font-normal"}`}>
                            {hito.nombre}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                          {hito.codigo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedProject(p)}
                    className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Ver Ficha
                  </button>
                  <button
                    onClick={() => handleOpenInObraSuite(p)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <span>Abrir en Suite</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: CUADRO DE AVANCE SITUACIONAL                    */}
      {/* ======================================================== */}
      {activeView === "cuadro_avance" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Cuadro de Avance y Estado Situacional de Inversiones (OEI)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe consolidado para Despacho de Gerencia de Desarrollo Urbano e Infraestructura
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Imprimir Cuadro
              </button>
            </div>

            {/* Distribution by Encargado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["JHON", "JHENIFER", "JEZER"].map((enc) => {
                const encProjs = proyectos.filter((p) => p.encargado === enc);
                const encMonto = encProjs.reduce((sum, p) => sum + (p.contratoEjecucionMonto || 0), 0);
                const encAvg =
                  encProjs.length > 0
                    ? Math.round(
                        encProjs.reduce((sum, p) => sum + getProgresoPorcentaje(p.hitos), 0) /
                          encProjs.length
                      )
                    : 0;

                return (
                  <div key={enc} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">Ing. {enc}</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {encProjs.length} Proyectos
                      </span>
                    </div>
                    <div className="text-sm font-mono font-black text-slate-800">
                      {formatPEN(encMonto)}
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Avance Promedio:</span>
                        <span className="font-bold text-blue-700">{encAvg}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${encAvg}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Critical Bottlenecks */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <h3 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Resumen de Cuellos de Botella y Actos Pendientes según Normativa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-900">
                    1. Falta de TDR / Elaboración de Bases (Supervisión):
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    Existen 10 proyectos con bases publicadas o por convocar a los que les falta la culminación del TDR de supervisión (e.g. Coberturas San Agustín, Barrios Altos, Puentes Pablo Mori, El, Tumbaro, Pachacutec).
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-900">
                    2. Pendientes de Entrega de Terreno & Acta de Inicio (Art. 176):
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    Cobertura Sagrado Corazón de Jesús (CUI 2684433) cuenta con contrato suscrito el 25/08/2026 y supervisión contratada el 18/08/2026; pendiente programar entrega de terreno e inicio in situ.
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-900">
                    3. Trámite de Valorización N° 01 de Supervisión:
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    Puesto de Auxilio San Francisco (CUI 2655193): Obra en ejecución con supervisión activa (Z & Z Center Fish); pendiente dar trámite a la Valorización N° 01 de supervisión.
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-900">
                    4. Obras Finalizadas pendientes de Liquidación:
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    Mercado Zonal (Acta de Recepción 25/09/2026) y Cobertura San (Finalizó): Corresponde elaborar y aprobar las liquidaciones técnicas y financieras dentro del plazo legal (Art. 209 RLCE).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE / EDICIÓN DEL PROYECTO SELECCIONADO        */}
      {/* ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    ID #{selectedProject.id} • CUI {selectedProject.cui}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                    Encargado: {selectedProject.encargado}
                  </span>
                </div>
                <h3 className="font-black text-base text-white">{selectedProject.proyecto}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Quick Checklist Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Checklist Normativo (Marca o desmarca con 1 clic)
                  </h4>
                  <span className="font-mono font-black text-blue-700 text-xs">
                    {getProgresoPorcentaje(selectedProject.hitos)}% Cumplido
                  </span>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedProject.hitos.map((hito) => (
                    <div
                      key={hito.id}
                      onClick={() => handleToggleHito(selectedProject.id, hito.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition select-none ${
                        hito.cumplido
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            hito.cumplido
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-400 bg-white"
                          }`}
                        >
                          {hito.cumplido && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs leading-tight">{hito.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{hito.baseLegal}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0">
                        {hito.codigo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contrato de Ejecución Details */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
                  1. Contrato de Ejecución de Obra
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Contrato N°:</span>
                    <span className="font-bold text-slate-800">{selectedProject.contratoEjecucionNumero}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Monto Contractual:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatPEN(selectedProject.contratoEjecucionMonto)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Empresa Contratista:</span>
                    <span className="font-semibold text-slate-800">{selectedProject.contratoEjecucionEmpresa || "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Residente de Obra:</span>
                    <span className="font-semibold text-slate-800">{selectedProject.residenteNombre || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Contrato de Supervisión Details */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
                  2. Contrato / Orden de Supervisión
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Contrato / O.S. N°:</span>
                    <span className="font-bold text-slate-800">{selectedProject.contratoSupervisionNumero}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Monto Supervisión:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatPEN(selectedProject.contratoSupervisionMonto)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Empresa / Consultor:</span>
                    <span className="font-semibold text-slate-800">{selectedProject.contratoSupervisionEmpresa || "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Jefe de Supervisión:</span>
                    <span className="font-semibold text-slate-800">{selectedProject.supervisorNombre || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Fechas & Plazos */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
                  3. Fechas Clave y Plazo de Ejecución
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Entrega Terreno</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProject.entregaTerrenoFecha || "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Inicio Obra</span>
                    <span className="font-mono font-bold text-emerald-700">{selectedProject.inicioObraFecha || "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Plazo (Días)</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProject.plazoDias ? `${selectedProject.plazoDias} d` : "-"}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Término Vigente</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProject.fechaTerminoActualizado || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Observaciones Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Observaciones & Anotaciones de Seguimiento:
                </label>
                <textarea
                  rows={2}
                  value={selectedProject.observaciones}
                  onChange={(e) => {
                    const newObs = e.target.value;
                    setSelectedProject({ ...selectedProject, observaciones: newObs });
                    setProyectos((prev) =>
                      prev.map((p) => (p.id === selectedProject.id ? { ...p, observaciones: newObs } : p))
                    );
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenInObraSuite(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  Abrir en Control de Obras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
