import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
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
  ArrowLeftRight,
  BarChart3,
  Calculator,
  AlertOctagon,
  Activity,
  Tag,
  SlidersHorizontal,
  Paperclip,
  UploadCloud,
  RotateCcw,
  FileUp,
  FileCheck,
  User,
  FileSearch,
} from "lucide-react";
import {
  ProyectoCartera,
  PROYECTOS_RIOJA_SEED,
  getProgresoPorcentaje,
  getAvanceFisicoObra,
  getEstadoLabel,
  getAlertasNormativas,
  EstadoCartera,
  HitoNormativo,
  PartidaValorizacion,
  ValorizacionObra,
  ExpedienteAdicional,
  AmpliacionPlazo,
  createDefaultHitos,
  detectProjectCategory,
  getChecklistColorTheme,
} from "../../types/seguimientoCartera";
import { ObraProyecto, UserObraPackage } from "../../types/obras";
import { LicenseSession } from "../../types/auth";
import { formatPEN } from "../../services/docxGenerator";
import { WorksValorizacionesIntegratedModal } from "./WorksValorizacionesIntegratedModal";
import { WorksValorizacionesView } from "./WorksValorizacionesView";
import { NewCarteraObraModal } from "./NewCarteraObraModal";
import { QuickContratosObraModal } from "./QuickContratosObraModal";
import { ContractScannerCarteraModal } from "./ContractScannerCarteraModal";
import {
  saveCarteraToFirestore,
  subscribeToCartera,
  loadCarteraFromFirestore,
  CarteraSyncPayload,
} from "../../services/carteraFirestoreSync";

interface WorksPortfolioTrackerProps {
  onSelectObra?: (obra: Partial<ObraProyecto>) => void;
  onNavigateToTab?: (tab: string) => void;
  currentUser?: LicenseSession | null;
  obrasList?: UserObraPackage[];
}

const LOCAL_STORAGE_KEY_BASE = "mgc_cartera_rioja_proyectos_v4";

// Sanitize obsolete or dummy mock encargados and deduplicate so projects don't accumulate duplicates
const sanitizeProyectosEncargados = (list: ProyectoCartera[]): ProyectoCartera[] => {
  if (!list || !Array.isArray(list)) return [];
  const cleaned = list.map((p) => {
    if (
      p.encargado &&
      ["PICO", "CARLOS", "MARIELA", "EDSON"].includes(p.encargado.trim().toUpperCase())
    ) {
      return { ...p, encargado: "-" };
    }
    return p;
  });

  // Deduplicate by CUI and normalized project title so duplicates never accumulate
  const seenCuis = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueList: ProyectoCartera[] = [];

  for (const proj of cleaned) {
    const cleanCui = (proj.cui || "").replace(/\D/g, "");
    const cleanName = (proj.proyecto || "").trim().toUpperCase();

    if (cleanCui.length >= 6) {
      if (seenCuis.has(cleanCui)) continue;
      seenCuis.add(cleanCui);
    } else if (cleanName.length > 8) {
      if (seenNames.has(cleanName)) continue;
      seenNames.add(cleanName);
    }
    uniqueList.push(proj);
  }

  return uniqueList.map((p, idx) => ({ ...p, id: idx + 1 }));
};

// Theme helper to give table rows and status badges vibrant official colors (Verde, Azul, Rojo bajo, Amarillo bajo)
const getRowStatusTheme = (estado: EstadoCartera) => {
  switch (estado) {
    case "EN_EJECUCION":
      return {
        rowBg: "bg-emerald-50/75 hover:bg-emerald-100/90 border-b border-emerald-200",
        borderAccent: "border-l-4 border-l-emerald-600",
        badgeBg: "bg-emerald-600 text-white border-emerald-700 shadow-xs font-black",
        label: "🟢 En Ejecución",
        dotColor: "bg-emerald-500",
      };
    case "EN_SELECCION_SEACE":
      return {
        rowBg: "bg-blue-50/75 hover:bg-blue-100/90 border-b border-blue-200",
        borderAccent: "border-l-4 border-l-blue-600",
        badgeBg: "bg-blue-600 text-white border-blue-700 shadow-xs font-black",
        label: "🔵 En Selección SEACE",
        dotColor: "bg-blue-500",
      };
    case "ACTOS_PREPARATORIOS":
      return {
        rowBg: "bg-indigo-50/75 hover:bg-indigo-100/90 border-b border-indigo-200",
        borderAccent: "border-l-4 border-l-indigo-600",
        badgeBg: "bg-indigo-600 text-white border-indigo-700 shadow-xs font-black",
        label: "📋 Actos Preparatorios",
        dotColor: "bg-indigo-500",
      };
    case "RECEPCIONADA":
      return {
        rowBg: "bg-rose-50/75 hover:bg-rose-100/90 border-b border-rose-200",
        borderAccent: "border-l-4 border-l-rose-600",
        badgeBg: "bg-rose-600 text-white border-rose-700 shadow-xs font-black",
        label: "🔴 Culminó la Obra",
        dotColor: "bg-rose-500",
      };
    case "FINALIZADA_LIQUIDADA":
      return {
        rowBg: "bg-amber-50/75 hover:bg-amber-100/90 border-b border-amber-200",
        borderAccent: "border-l-4 border-l-amber-600",
        badgeBg: "bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black",
        label: "🟡 En Liquidación",
        dotColor: "bg-amber-500",
      };
    case "PENDIENTE_INICIO_CONDICIONES":
    default:
      return {
        rowBg: "bg-sky-50/75 hover:bg-sky-100/90 border-b border-sky-200",
        borderAccent: "border-l-4 border-l-sky-600",
        badgeBg: "bg-sky-600 text-white border-sky-700 shadow-xs font-black",
        label: "⏳ Pendiente Inicio",
        dotColor: "bg-sky-500",
      };
  }
};

export const WorksPortfolioTracker: React.FC<WorksPortfolioTrackerProps> = ({
  onSelectObra,
  onNavigateToTab,
  currentUser,
  obrasList = [],
}) => {
  // Synchronized horizontal scroll refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Multi-Tenancy & Entity scoping (Privacidad absoluta para Rioja y espacios aislados para otras municipalidades)
  const isMasterAdmin = currentUser?.role === "admin";
  const userIsRioja =
    isMasterAdmin ||
    currentUser?.licenseKey?.toUpperCase().includes("RIOJA") ||
    currentUser?.companyName?.toUpperCase().includes("RIOJA") ||
    ["JOSUE", "PILCO", "JHON", "WILSON", "VANESSA"].some((n) =>
      (currentUser?.userName || "").toUpperCase().includes(n)
    );

  // Selected entity is Municipalidad Provincial de Rioja exclusively (única entidad real y activa)
  const selectedEntityKey = "RIOJA";
  const activeStorageKey = "mgc_cartera_rioja_proyectos_v4";
  const entityDisplayName = "Municipalidad Provincial de Rioja (OEI)";

  // Active member / user details for multi-user audit and attribution
  const activeMember =
    currentUser?.activeMemberId && currentUser?.teamMembers
      ? currentUser.teamMembers.find((m) => m.id === currentUser.activeMemberId)
      : null;
  const currentMemberName = activeMember?.name || currentUser?.userName || "Colaborador Municipal (Rioja)";
  const currentMemberEmail = activeMember?.email || currentUser?.userEmail || "";

  const [lastSyncInfo, setLastSyncInfo] = useState<{
    lastUpdated: string;
    updatedBy: string;
    source?: string;
  } | null>(null);

  // Excel input ref & feedback notice
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load projects from localStorage or official seed for Municipalidad Provincial de Rioja
  const [proyectos, setProyectos] = useState<ProyectoCartera[]>(() => {
    try {
      const saved =
        localStorage.getItem("mgc_cartera_rioja_proyectos_v4") ||
        localStorage.getItem("mgc_cartera_rioja_proyectos_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeProyectosEncargados(parsed);
        }
      }
    } catch (e) {
      console.error("Error loading cartera from localStorage:", e);
    }
    return PROYECTOS_RIOJA_SEED;
  });

  // Real-time Firestore Multi-tenant Synchronization
  useEffect(() => {
    let isCancelled = false;

    // Carga inicial desde Cloud Firestore para la Municipalidad Provincial de Rioja
    loadCarteraFromFirestore("RIOJA").then((cloudData) => {
      if (!isCancelled && cloudData && Array.isArray(cloudData.proyectos) && cloudData.proyectos.length > 0) {
        const sanitized = sanitizeProyectosEncargados(cloudData.proyectos);
        setProyectos(sanitized);
        setLastSyncInfo({
          lastUpdated: cloudData.lastUpdated,
          updatedBy: cloudData.updatedBy,
          source: cloudData.source,
        });
        localStorage.setItem("mgc_cartera_rioja_proyectos_v4", JSON.stringify(sanitized));
      }
    });

    // Suscripción en tiempo real: cuando Pilco, Luis, Jhon o cualquier colaborador actualice en Rioja,
    // todos los demás miembros de la municipalidad reciben el cambio al instante.
    const unsubscribe = subscribeToCartera(
      "RIOJA",
      (remotePayload) => {
        if (isCancelled) return;
        if (remotePayload && Array.isArray(remotePayload.proyectos) && remotePayload.proyectos.length > 0) {
          const sanitized = sanitizeProyectosEncargados(remotePayload.proyectos);
          setProyectos(sanitized);
          setLastSyncInfo({
            lastUpdated: remotePayload.lastUpdated,
            updatedBy: remotePayload.updatedBy,
            source: remotePayload.source,
          });
          localStorage.setItem("mgc_cartera_rioja_proyectos_v4", JSON.stringify(sanitized));

          // Notificación visual de sincronización en tiempo real
          if (remotePayload.updatedBy && remotePayload.updatedBy !== currentMemberName) {
            setImportNotice({
              message: `🔄 Sincronización en Tiempo Real: ${remotePayload.updatedBy} actualizó la matriz de obras (${new Date(remotePayload.lastUpdated).toLocaleTimeString("es-PE")}).`,
              type: "success",
            });
            setTimeout(() => setImportNotice(null), 8000);
          }
        }
      },
      (err) => {
        console.warn("Firestore subscription note:", err);
      }
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [currentMemberName]);

  // Guardado permanente en localStorage para que nunca se pierda ni se restablezca
  useEffect(() => {
    if (proyectos && proyectos.length > 0) {
      try {
        localStorage.setItem("mgc_cartera_rioja_proyectos_v4", JSON.stringify(proyectos));
      } catch (e) {
        console.error("Error saving cartera:", e);
      }
    }
  }, [proyectos]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEncargado, setFilterEncargado] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterSoloAlertas, setFilterSoloAlertas] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"matriz" | "pipeline" | "valorizaciones">("matriz");

  // Selected project for quick modal or checklist
  const [selectedProject, setSelectedProject] = useState<ProyectoCartera | null>(null);
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<ProyectoCartera>>({});

  // Valorizaciones & Expedientes Modal State
  const [valModalProject, setValModalProject] = useState<ProyectoCartera | null>(null);
  const [valModalTab, setValModalTab] = useState<"valorizacion" | "expediente" | "ampliacion">("valorizacion");

  // Excel Upload Drag & Drop Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // New Obra Modal State
  const [isNewCarteraModalOpen, setIsNewCarteraModalOpen] = useState(false);
  const [isQuickContratosModalOpen, setIsQuickContratosModalOpen] = useState(false);
  const [editingCarteraObra, setEditingCarteraObra] = useState<ProyectoCartera | null>(null);

  // Contract PDF Scanner Modal State (Extracción de Contrato de Obra y Supervisión)
  const [isContractScannerModalOpen, setIsContractScannerModalOpen] = useState(false);
  const [contractScannerPreselectedObra, setContractScannerPreselectedObra] = useState<ProyectoCartera | null>(null);

  // Delete Obra Confirmation State
  const [obraToDelete, setObraToDelete] = useState<ProyectoCartera | null>(null);
  const [isDeletingObra, setIsDeletingObra] = useState<boolean>(false);

  // Dynamic Encargado editing state
  const [editingEncargadoId, setEditingEncargadoId] = useState<number | null>(null);
  const [customEncargadoText, setCustomEncargadoText] = useState<string>("");

  // List of all known encargados across projects (derived strictly from active team members & assigned projects, no dummy names)
  const allKnownEncargados = useMemo(() => {
    const listSet = new Set<string>();

    // 1. Add real active team members if configured
    if (currentUser?.teamMembers && currentUser.teamMembers.length > 0) {
      currentUser.teamMembers
        .filter((m) => m.status === "active")
        .forEach((m) => {
          const clean = m.name
            .replace(/^(ING\.?|LIC\.?|ARQ\.?|CPC\.?|BACH\.?)\s+/i, "")
            .trim();
          const firstWord = clean.split(" ")[0]?.toUpperCase();
          if (
            firstWord &&
            firstWord.length > 1 &&
            !["PICO", "CARLOS", "MARIELA", "EDSON"].includes(firstWord)
          ) {
            listSet.add(firstWord);
          }
        });
    }

    // 2. Add legitimate encargados assigned across the current projects
    proyectos.forEach((p) => {
      if (p.encargado && p.encargado.trim() && p.encargado !== "-") {
        const encUpper = p.encargado.trim().toUpperCase();
        if (!["PICO", "CARLOS", "MARIELA", "EDSON"].includes(encUpper)) {
          listSet.add(encUpper);
        }
      }
    });

    return Array.from(listSet).sort();
  }, [proyectos, currentUser]);

  // Quick change of encargado directly from the table matrix
  const handleUpdateEncargado = (proyectoId: number, newEncargado: string) => {
    const formatted = newEncargado.trim().toUpperCase() || "-";
    let nextListToSync: ProyectoCartera[] = [];
    setProyectos((prev) => {
      const nextList = prev.map((p) => {
        if (p.id !== proyectoId) return p;
        const updated = { ...p, encargado: formatted };
        if (selectedProject && selectedProject.id === proyectoId) {
          setSelectedProject(updated);
        }
        return updated;
      });
      nextListToSync = nextList;
      return nextList;
    });

    if (nextListToSync.length > 0) {
      saveCarteraToFirestore(
        selectedEntityKey,
        nextListToSync,
        currentMemberName,
        currentMemberEmail,
        "encargado_change"
      );
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextListToSync));
      } catch (e) {}
    }
  };

  // Quick change of estado situacional directly from the table matrix
  const handleUpdateEstado = (proyectoId: number, newEstado: EstadoCartera) => {
    let nextListToSync: ProyectoCartera[] = [];
    setProyectos((prev) => {
      const nextList = prev.map((p) => {
        if (p.id !== proyectoId) return p;
        const updated = { ...p, estado: newEstado };
        if (selectedProject && selectedProject.id === proyectoId) {
          setSelectedProject(updated);
        }
        return updated;
      });
      nextListToSync = nextList;
      return nextList;
    });

    if (nextListToSync.length > 0) {
      saveCarteraToFirestore(
        selectedEntityKey,
        nextListToSync,
        currentMemberName,
        currentMemberEmail,
        "estado_change"
      );
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextListToSync));
      } catch (e) {}
    }
  };

  // Open Integrated Valorizaciones Tool
  const handleOpenValoModal = (
    project: ProyectoCartera,
    tab: "valorizacion" | "expediente" | "ampliacion" = "valorizacion"
  ) => {
    setValModalProject(project);
    setValModalTab(tab);
  };

  // Handler to register or modify an Obra in the Cartera Matriz
  const handleCreateNewObra = (form: {
    proyecto: string;
    cui: string;
    encargado: string;
    estado: EstadoCartera;
    contratoEjecucionNumero: string;
    contratoEjecucionMonto: number;
    contratoEjecucionEmpresa: string;
    residenteNombre: string;
    contratoSupervisionNumero: string;
    contratoSupervisionMonto: number;
    contratoSupervisionEmpresa: string;
    supervisorNombre: string;
    entregaTerrenoFecha: string;
    docEntregaTerreno: string;
    inicioObraFecha: string;
    docInicioObra: string;
    plazoDias: number;
    fechaTerminoActualizado: string;
    observaciones: string;
  }) => {
    if (!form.proyecto.trim()) return;

    // Check if modifying an existing obra
    if (editingCarteraObra) {
      let updatedHitos = [...editingCarteraObra.hitos];
      if (form.docEntregaTerreno || form.entregaTerrenoFecha) {
        updatedHitos = updatedHitos.map((h) => {
          if (h.id === "hito-terreno") {
            return {
              ...h,
              cumplido: form.docEntregaTerreno || form.entregaTerrenoFecha ? true : h.cumplido,
              documentoSustento: form.docEntregaTerreno || h.documentoSustento,
              fecha: form.entregaTerrenoFecha || h.fecha,
            };
          }
          return h;
        });
      }
      if (form.docInicioObra || form.inicioObraFecha) {
        updatedHitos = updatedHitos.map((h) => {
          if (h.id === "hito-acta-inicio") {
            return {
              ...h,
              cumplido: form.docInicioObra || form.inicioObraFecha ? true : h.cumplido,
              documentoSustento: form.docInicioObra || h.documentoSustento,
              fecha: form.inicioObraFecha || h.fecha,
            };
          }
          return h;
        });
      }

      const updatedProj: ProyectoCartera = {
        ...editingCarteraObra,
        proyecto: form.proyecto.toUpperCase().trim(),
        cui: form.cui.trim(),
        encargado: form.encargado,
        estado: form.estado,
        contratoEjecucionNumero: form.contratoEjecucionNumero.trim(),
        contratoEjecucionMonto: form.contratoEjecucionMonto || 0,
        contratoEjecucionEmpresa: form.contratoEjecucionEmpresa.trim(),
        residenteNombre: form.residenteNombre.trim(),
        contratoSupervisionNumero: form.contratoSupervisionNumero.trim(),
        contratoSupervisionMonto: form.contratoSupervisionMonto || 0,
        contratoSupervisionEmpresa: form.contratoSupervisionEmpresa.trim(),
        supervisorNombre: form.supervisorNombre.trim(),
        entregaTerrenoFecha: form.entregaTerrenoFecha.trim() || undefined,
        inicioObraFecha: form.inicioObraFecha.trim() || undefined,
        plazoDias: form.plazoDias || undefined,
        fechaTerminoActualizado: form.fechaTerminoActualizado.trim() || undefined,
        observaciones: form.observaciones.trim() || editingCarteraObra.observaciones,
        hitos: updatedHitos,
      };

      const nextList = proyectos.map((p) => (p.id === updatedProj.id ? updatedProj : p));
      setProyectos(nextList);
      if (selectedProject && selectedProject.id === updatedProj.id) {
        setSelectedProject(updatedProj);
      }

      saveCarteraToFirestore(
        selectedEntityKey,
        nextList,
        currentMemberName,
        currentMemberEmail,
        "manual_edit"
      );

      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
      } catch (e) {
        console.warn("Storage warning:", e);
      }

      setIsNewCarteraModalOpen(false);
      setEditingCarteraObra(null);
      setImportNotice({
        message: `¡Éxito! Los datos de la obra "${updatedProj.proyecto}" (CUI: ${updatedProj.cui}) han sido modificados y sincronizados.`,
        type: "success",
      });
      setTimeout(() => setImportNotice(null), 6000);
      return;
    }

    // Comprobar si ya existe una obra con el mismo CUI o denominación para evitar que se acumulen duplicados
    const cleanFormCui = form.cui.trim().replace(/\D/g, "");
    const cleanFormTitle = form.proyecto.trim().toUpperCase();
    const existingIndex = proyectos.findIndex((p) => {
      const pCui = (p.cui || "").replace(/\D/g, "");
      if (cleanFormCui.length >= 6 && pCui.length >= 6 && cleanFormCui === pCui) return true;
      if (cleanFormTitle.length > 10 && p.proyecto && p.proyecto.trim().toUpperCase() === cleanFormTitle) return true;
      return false;
    });

    if (existingIndex >= 0) {
      const existingObra = proyectos[existingIndex];
      const updatedExisting: ProyectoCartera = {
        ...existingObra,
        proyecto: form.proyecto.toUpperCase().trim(),
        cui: form.cui.trim() || existingObra.cui,
        encargado: form.encargado || existingObra.encargado,
        estado: form.estado,
        contratoEjecucionNumero: form.contratoEjecucionNumero.trim() || existingObra.contratoEjecucionNumero,
        contratoEjecucionMonto: form.contratoEjecucionMonto || existingObra.contratoEjecucionMonto,
        contratoEjecucionEmpresa: form.contratoEjecucionEmpresa.trim() || existingObra.contratoEjecucionEmpresa,
        residenteNombre: form.residenteNombre.trim() || existingObra.residenteNombre,
        contratoSupervisionNumero: form.contratoSupervisionNumero.trim() || existingObra.contratoSupervisionNumero,
        contratoSupervisionMonto: form.contratoSupervisionMonto || existingObra.contratoSupervisionMonto,
        contratoSupervisionEmpresa: form.contratoSupervisionEmpresa.trim() || existingObra.contratoSupervisionEmpresa,
        supervisorNombre: form.supervisorNombre.trim() || existingObra.supervisorNombre,
        entregaTerrenoFecha: form.entregaTerrenoFecha.trim() || existingObra.entregaTerrenoFecha,
        inicioObraFecha: form.inicioObraFecha.trim() || existingObra.inicioObraFecha,
        plazoDias: form.plazoDias || existingObra.plazoDias,
        fechaTerminoActualizado: form.fechaTerminoActualizado.trim() || existingObra.fechaTerminoActualizado,
        observaciones: form.observaciones.trim() || existingObra.observaciones,
      };

      const nextList = proyectos.map((p, idx) => (idx === existingIndex ? updatedExisting : p));
      setProyectos(nextList);
      if (selectedProject && selectedProject.id === existingObra.id) {
        setSelectedProject(updatedExisting);
      }
      saveCarteraToFirestore(selectedEntityKey, nextList, currentMemberName, currentMemberEmail, "manual_edit");
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
      } catch (e) {}

      setIsNewCarteraModalOpen(false);
      setImportNotice({
        message: `¡Actualizado! La obra (CUI: ${updatedExisting.cui}) ya existía y sus datos se actualizaron sin duplicar registros en la matriz.`,
        type: "success",
      });
      setTimeout(() => setImportNotice(null), 6000);
      return;
    }

    const nextId = proyectos.length > 0 ? Math.max(...proyectos.map((p) => p.id)) + 1 : 1;
    const newCui = form.cui.trim() || `2${Math.floor(Math.random() * 900000 + 100000)}`;

    // Generate initial hitos with configured sequence
    const defaultHitos = createDefaultHitos({
      "hito-notif-sup": form.docEntregaTerreno ? { cumplido: true, fecha: form.entregaTerrenoFecha } : false,
      "hito-terreno": form.entregaTerrenoFecha ? { cumplido: true, fecha: form.entregaTerrenoFecha } : false,
      "hito-acta-inicio": form.inicioObraFecha ? { cumplido: true, fecha: form.inicioObraFecha } : false,
    });

    const updatedHitos = defaultHitos.map((h) => {
      if (h.id === "hito-terreno" && form.docEntregaTerreno) {
        return { ...h, documentoSustento: form.docEntregaTerreno };
      }
      if (h.id === "hito-acta-inicio" && form.docInicioObra) {
        return { ...h, documentoSustento: form.docInicioObra };
      }
      return h;
    });

    const newProject: ProyectoCartera = {
      id: nextId,
      encargado: form.encargado,
      proyecto: form.proyecto.toUpperCase().trim(),
      cui: newCui,
      contratoEjecucionNumero: form.contratoEjecucionNumero.trim(),
      contratoEjecucionMonto: form.contratoEjecucionMonto || 0,
      contratoEjecucionEmpresa: form.contratoEjecucionEmpresa.trim(),
      residenteNombre: form.residenteNombre.trim(),
      contratoSupervisionNumero: form.contratoSupervisionNumero.trim(),
      contratoSupervisionMonto: form.contratoSupervisionMonto || 0,
      contratoSupervisionEmpresa: form.contratoSupervisionEmpresa.trim(),
      supervisorNombre: form.supervisorNombre.trim(),
      entregaTerrenoFecha: form.entregaTerrenoFecha.trim() || undefined,
      inicioObraFecha: form.inicioObraFecha.trim() || undefined,
      plazoDias: form.plazoDias || undefined,
      fechaTerminoActualizado: form.fechaTerminoActualizado.trim() || undefined,
      observaciones: form.observaciones.trim() || "Obra nueva registrada en la cartera municipal.",
      estado: form.estado,
      hitos: updatedHitos,
      valorizaciones: [],
      expedientes: [],
      ampliacionesPlazo: [],
    };

    const updatedList = [newProject, ...proyectos];
    setProyectos(updatedList);

    // Save to Firestore in real time for all municipal team members
    saveCarteraToFirestore(
      selectedEntityKey,
      updatedList,
      currentMemberName,
      currentMemberEmail,
      "manual_edit"
    );

    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Storage warning:", e);
    }

    setIsNewCarteraModalOpen(false);
    setImportNotice({
      message: `¡Éxito! La obra "${newProject.proyecto}" (CUI: ${newProject.cui}) ha sido registrada y sincronizada en tiempo real.`,
      type: "success",
    });
    setTimeout(() => setImportNotice(null), 6000);
  };

  // Callback to register or update obra directly from scanned contract PDF
  const handleSaveObraFromContractScan = (
    obraData: Partial<ProyectoCartera>,
    isNew: boolean,
    targetObraId?: number
  ) => {
    if (isNew) {
      // Check if CUI or exact title already exists to prevent duplicate accumulation
      const cleanCui = (obraData.cui || "").replace(/\D/g, "");
      const cleanTitle = (obraData.proyecto || "").trim().toUpperCase();
      const existingIdx = proyectos.findIndex((p) => {
        const pCui = (p.cui || "").replace(/\D/g, "");
        if (cleanCui.length >= 6 && pCui.length >= 6 && cleanCui === pCui) return true;
        if (cleanTitle.length > 10 && p.proyecto && p.proyecto.trim().toUpperCase() === cleanTitle) return true;
        return false;
      });

      if (existingIdx >= 0) {
        const existing = proyectos[existingIdx];
        const updated: ProyectoCartera = {
          ...existing,
          ...obraData,
          id: existing.id,
          hitos: existing.hitos.map((h) => {
            if (h.id === "hito-contrato-obra" && obraData.contratoEjecucionNumero) {
              return {
                ...h,
                cumplido: true,
                fecha: obraData.contratoEjecucionFechaFirma || h.fecha,
                documentoSustento: obraData.contratoEjecucionNumero,
              };
            }
            if (h.id === "hito-contrato-sup" && obraData.contratoSupervisionNumero) {
              return {
                ...h,
                cumplido: true,
                fecha: obraData.contratoSupervisionFechaFirma || h.fecha,
                documentoSustento: obraData.contratoSupervisionNumero,
              };
            }
            return h;
          }),
        };
        const nextList = proyectos.map((p, idx) => (idx === existingIdx ? updated : p));
        setProyectos(nextList);
        saveCarteraToFirestore(selectedEntityKey, nextList, currentMemberName, currentMemberEmail, "manual_edit");
        try {
          localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
        } catch (e) {}
        setImportNotice({
          message: `¡Contrato escaneado! La obra (CUI: ${updated.cui}) fue actualizada con los datos contractuales sin duplicar registros.`,
          type: "success",
        });
        setTimeout(() => setImportNotice(null), 7000);
        return;
      }

      const nextId = proyectos.length > 0 ? Math.max(...proyectos.map((p) => p.id)) + 1 : 1;
      const defaultHitos = createDefaultHitos({
        "hito-contrato-obra": obraData.contratoEjecucionNumero
          ? { cumplido: true, fecha: obraData.contratoEjecucionFechaFirma }
          : false,
        "hito-contrato-sup": obraData.contratoSupervisionNumero
          ? { cumplido: true, fecha: obraData.contratoSupervisionFechaFirma }
          : false,
        "hito-notif-sup": obraData.contratoSupervisionNumero
          ? { cumplido: true, fecha: obraData.contratoSupervisionFechaFirma }
          : false,
      });

      const newObra: ProyectoCartera = {
        id: nextId,
        encargado: obraData.encargado || "-",
        proyecto: obraData.proyecto || `OBRA SEGÚN CONTRATO #${nextId}`,
        cui: obraData.cui || `2${Math.floor(Math.random() * 900000 + 100000)}`,
        contratoEjecucionNumero: obraData.contratoEjecucionNumero || "",
        contratoEjecucionFechaFirma: obraData.contratoEjecucionFechaFirma,
        contratoEjecucionMonto: obraData.contratoEjecucionMonto || 0,
        contratoEjecucionEmpresa: obraData.contratoEjecucionEmpresa || "",
        residenteNombre: obraData.residenteNombre,
        residenteCip: obraData.residenteCip,
        contratoSupervisionNumero: obraData.contratoSupervisionNumero || "",
        contratoSupervisionFechaFirma: obraData.contratoSupervisionFechaFirma,
        contratoSupervisionMonto: obraData.contratoSupervisionMonto || 0,
        contratoSupervisionEmpresa: obraData.contratoSupervisionEmpresa || "",
        supervisorNombre: obraData.supervisorNombre,
        supervisorCip: obraData.supervisorCip,
        plazoDias: obraData.plazoDias,
        observaciones: obraData.observaciones || "Obra registrada mediante escaneo de contrato PDF.",
        estado: obraData.contratoEjecucionNumero ? "PENDIENTE_INICIO_CONDICIONES" : "ACTOS_PREPARATORIOS",
        hitos: defaultHitos,
        valorizaciones: [],
        expedientes: [],
        ampliacionesPlazo: [],
      };

      const nextList = [newObra, ...proyectos];
      setProyectos(nextList);
      saveCarteraToFirestore(selectedEntityKey, nextList, currentMemberName, currentMemberEmail, "manual_edit");
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
      } catch (e) {}
      setImportNotice({
        message: `¡Éxito! Nueva obra registrada en la matriz desde el escaneo del contrato (CUI: ${newObra.cui}).`,
        type: "success",
      });
      setTimeout(() => setImportNotice(null), 7000);
    } else if (targetObraId) {
      const existing = proyectos.find((p) => p.id === targetObraId);
      if (!existing) return;
      const updated: ProyectoCartera = {
        ...existing,
        ...obraData,
        proyecto: obraData.proyecto || existing.proyecto,
        cui: obraData.cui || existing.cui,
        contratoEjecucionNumero: obraData.contratoEjecucionNumero || existing.contratoEjecucionNumero,
        contratoEjecucionFechaFirma: obraData.contratoEjecucionFechaFirma || existing.contratoEjecucionFechaFirma,
        contratoEjecucionMonto: obraData.contratoEjecucionMonto ?? existing.contratoEjecucionMonto,
        contratoEjecucionEmpresa: obraData.contratoEjecucionEmpresa || existing.contratoEjecucionEmpresa,
        residenteNombre: obraData.residenteNombre || existing.residenteNombre,
        residenteCip: obraData.residenteCip || existing.residenteCip,
        contratoSupervisionNumero: obraData.contratoSupervisionNumero || existing.contratoSupervisionNumero,
        contratoSupervisionFechaFirma: obraData.contratoSupervisionFechaFirma || existing.contratoSupervisionFechaFirma,
        contratoSupervisionMonto: obraData.contratoSupervisionMonto ?? existing.contratoSupervisionMonto,
        contratoSupervisionEmpresa: obraData.contratoSupervisionEmpresa || existing.contratoSupervisionEmpresa,
        supervisorNombre: obraData.supervisorNombre || existing.supervisorNombre,
        supervisorCip: obraData.supervisorCip || existing.supervisorCip,
        plazoDias: obraData.plazoDias || existing.plazoDias,
        observaciones: obraData.observaciones || existing.observaciones,
        hitos: existing.hitos.map((h) => {
          if (h.id === "hito-contrato-obra" && obraData.contratoEjecucionNumero) {
            return {
              ...h,
              cumplido: true,
              fecha: obraData.contratoEjecucionFechaFirma || h.fecha,
              documentoSustento: obraData.contratoEjecucionNumero,
            };
          }
          if (h.id === "hito-contrato-sup" && obraData.contratoSupervisionNumero) {
            return {
              ...h,
              cumplido: true,
              fecha: obraData.contratoSupervisionFechaFirma || h.fecha,
              documentoSustento: obraData.contratoSupervisionNumero,
            };
          }
          return h;
        }),
      };
      const nextList = proyectos.map((p) => (p.id === targetObraId ? updated : p));
      setProyectos(nextList);
      if (selectedProject?.id === targetObraId) {
        setSelectedProject(updated);
      }
      saveCarteraToFirestore(selectedEntityKey, nextList, currentMemberName, currentMemberEmail, "manual_edit");
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
      } catch (e) {}
      setImportNotice({
        message: `¡Éxito! Datos contractuales asignados a la obra "${updated.proyecto.substring(0, 45)}...".`,
        type: "success",
      });
      setTimeout(() => setImportNotice(null), 7000);
    }
  };

  // Callback to update project from valorizaciones modal
  const handleSaveUpdatedProject = (updated: ProyectoCartera) => {
    const nextList = proyectos.map((p) => (p.id === updated.id ? updated : p));
    setProyectos(nextList);
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
    // Sync live to Firestore so all team members in this municipality see the change
    saveCarteraToFirestore(
      selectedEntityKey,
      nextList,
      currentMemberName,
      currentMemberEmail,
      "checklist_sync"
    );
  };

  // Eliminar obra definitivamente de la cartera tras confirmación del usuario
  const handleConfirmDeleteObra = async () => {
    if (!obraToDelete) return;
    setIsDeletingObra(true);
    try {
      const targetId = obraToDelete.id;
      const targetNombre = obraToDelete.proyecto;
      const targetCui = obraToDelete.cui;

      const nextList = proyectos.filter((p) => p.id !== targetId);
      setProyectos(nextList);
      if (selectedProject?.id === targetId) {
        setSelectedProject(null);
      }

      // Sincronización inmediata con Firestore para todo el equipo municipal
      await saveCarteraToFirestore(
        selectedEntityKey,
        nextList,
        currentMemberName,
        currentMemberEmail,
        "delete_obra"
      );

      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(nextList));
      } catch (e) {
        console.warn("Storage warning:", e);
      }

      setImportNotice({
        message: `La obra "${targetNombre}" (CUI: ${targetCui}) ha sido eliminada de la matriz correctamente.`,
        type: "info",
      });
      setTimeout(() => setImportNotice(null), 5000);
      setObraToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar obra:", err);
    } finally {
      setIsDeletingObra(false);
    }
  };

  // Download official Excel template
  const handleDownloadTemplateXLSX = () => {
    const templateRows = [
      {
        ID: 1,
        ENCARGADO: "-",
        PROYECTO: "MEJORAMIENTO Y AMPLIACIÓN DE SERVICIOS VIALES URBANOS",
        CUI: "2650123",
        "CONTRATO EJECUCION": "CONTRATO N° 045-2026-GAF/MPR",
        "MONTO EJECUCION": 2450000.50,
        CONTRATISTA: "CONSORCIO VIAL NORTE",
        RESIDENTE: "Ing. Residente de Obra (CIP)",
        "CONTRATO SUPERVISION": "ORDEN DE SERVICIO N° 089-2026",
        "MONTO SUPERVISION": 125000.00,
        SUPERVISOR: "Ing. Supervisor de Obra (CIP)",
        "ENTREGA TERRENO": "15/09/2026",
        "INICIO OBRA": "25/09/2026",
        "PLAZO DIAS": 120,
        "FECHA TERMINO": "23/01/2027",
        "ESTADO ACTUAL / OBSERVACIONES": "Obra en ejecución normal con valorización N° 01 aprobada.",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PLANTILLA_OBRAS");
    XLSX.writeFile(wb, `PLANTILLA_SEGUIMIENTO_OBRAS_${selectedEntityKey}.xlsx`);
  };

  // 1-Click Toggle for any milestone in any project
  const handleToggleHito = (proyectoId: number, hitoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let nextListToSync: ProyectoCartera[] = [];
    setProyectos((prev) => {
      const nextList = prev.map((proj) => {
        if (proj.id !== proyectoId) return proj;

        const updatedHitos = proj.hitos.map((h) => {
          if (h.id === hitoId) {
            const nextCumplido = !h.cumplido;
            return {
              ...h,
              cumplido: nextCumplido,
              fecha: nextCumplido
                ? h.fecha || new Date().toLocaleDateString("es-PE")
                : undefined,
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
      });
      nextListToSync = nextList;
      return nextList;
    });

    if (nextListToSync.length > 0) {
      saveCarteraToFirestore(
        selectedEntityKey,
        nextListToSync,
        currentMemberName,
        currentMemberEmail,
        "manual_edit"
      );
    }
  };

  // Update date for a specific milestone
  const handleUpdateHitoFecha = (proyectoId: number, hitoId: string, newFecha: string) => {
    let nextListToSync: ProyectoCartera[] = [];
    setProyectos((prev) => {
      const nextList = prev.map((proj) => {
        if (proj.id !== proyectoId) return proj;

        const updatedHitos = proj.hitos.map((h) => {
          if (h.id === hitoId) {
            return {
              ...h,
              fecha: newFecha,
              cumplido: newFecha.trim() !== "" ? true : h.cumplido,
            };
          }
          return h;
        });

        const updatedProj = {
          ...proj,
          hitos: updatedHitos,
        };

        if (selectedProject && selectedProject.id === proyectoId) {
          setSelectedProject(updatedProj);
        }

        return updatedProj;
      });
      nextListToSync = nextList;
      return nextList;
    });

    if (nextListToSync.length > 0) {
      saveCarteraToFirestore(
        selectedEntityKey,
        nextListToSync,
        currentMemberName,
        currentMemberEmail,
        "manual_edit"
      );
    }
  };

  // Update approving document (documento de la entidad que aprobó el hito)
  const handleUpdateHitoDoc = (proyectoId: number, hitoId: string, newDoc: string) => {
    let nextListToSync: ProyectoCartera[] = [];
    setProyectos((prev) => {
      const nextList = prev.map((proj) => {
        if (proj.id !== proyectoId) return proj;

        const updatedHitos = proj.hitos.map((h) => {
          if (h.id === hitoId) {
            const hasContent = newDoc.trim() !== "";
            return {
              ...h,
              documentoSustento: newDoc,
              cumplido: hasContent ? true : h.cumplido,
            };
          }
          return h;
        });

        const updatedProj = {
          ...proj,
          hitos: updatedHitos,
        };

        if (selectedProject && selectedProject.id === proyectoId) {
          setSelectedProject(updatedProj);
        }

        return updatedProj;
      });
      nextListToSync = nextList;
      return nextList;
    });

    if (nextListToSync.length > 0) {
      saveCarteraToFirestore(
        selectedEntityKey,
        nextListToSync,
        currentMemberName,
        currentMemberEmail,
        "manual_edit"
      );
    }
  };

  // Async saving state for Ficha
  const [isSavingFichaAsync, setIsSavingFichaAsync] = useState(false);
  const [fichaSaveNotice, setFichaSaveNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Guardar datos actualizados de la Ficha (Asíncrono con Firestore y LocalStorage)
  const handleSaveFichaDatesAsync = async () => {
    if (!selectedProject) return;
    setIsSavingFichaAsync(true);
    setFichaSaveNotice(null);

    try {
      const updatedList = proyectos.map((p) => (p.id === selectedProject.id ? selectedProject : p));
      setProyectos(updatedList);

      // Asynchronous save to Firestore so all municipal members see the updated dates in real time
      await saveCarteraToFirestore(
        selectedEntityKey,
        updatedList,
        currentMemberName,
        currentMemberEmail,
        "checklist_sync"
      );

      // Local storage fallback
      try {
        localStorage.setItem(activeStorageKey, JSON.stringify(updatedList));
      } catch (e) {
        console.warn("Storage write warning:", e);
      }

      setFichaSaveNotice({
        message: "¡Datos, fechas y documentos probatorios guardados exitosamente y sincronizados en tiempo real!",
        type: "success",
      });
      setTimeout(() => setFichaSaveNotice(null), 5000);
    } catch (err: any) {
      console.error("Error guardando datos de la ficha:", err);
      setFichaSaveNotice({
        message: `Error al guardar datos actualizados: ${err?.message || "Error desconocido"}`,
        type: "error",
      });
    } finally {
      setIsSavingFichaAsync(false);
    }
  };

  // Upload and attach official event document
  const handleAttachEventFile = (
    eventKey: "notifSup" | "cod" | "entregaTerreno" | "inicioObra" | "suspension" | "reinicio" | "termino",
    file: File,
    customDate?: string
  ) => {
    if (!selectedProject) return;

    const fileName = file.name;
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`;
    const dateVal = customDate || new Date().toLocaleDateString("es-PE");

    const updatedAdjuntos = {
      ...(selectedProject.adjuntosEventos || {}),
      [eventKey]: {
        nombre: fileName,
        fecha: dateVal,
        tipoDocumento: fileName.toLowerCase().endsWith(".pdf") ? "PDF" : "Documento Oficial",
        tamano: fileSize,
      },
    };

    // Sincronización automática con Checklist Normativo
    let targetHitoId = "";
    if (eventKey === "notifSup") targetHitoId = "hito-notif-sup";
    else if (eventKey === "cod") targetHitoId = "hito-cod";
    else if (eventKey === "entregaTerreno") targetHitoId = "hito-terreno";
    else if (eventKey === "inicioObra") targetHitoId = "hito-acta-inicio";

    const updatedHitos = selectedProject.hitos.map((h) => {
      if (h.id === targetHitoId || (eventKey === "inicioObra" && (h.id === "hito-acta-inicio" || h.id === "hito-inicio-obra"))) {
        return {
          ...h,
          cumplido: true,
          fecha: dateVal,
          documentoSustento: fileName,
          adjuntoNombre: fileName,
          adjuntoTamano: fileSize,
        };
      }
      return h;
    });

    const updatedProj: ProyectoCartera = {
      ...selectedProject,
      adjuntosEventos: updatedAdjuntos,
      hitos: updatedHitos,
      ...(eventKey === "entregaTerreno" ? { entregaTerrenoFecha: dateVal } : {}),
      ...(eventKey === "inicioObra" ? { inicioObraFecha: dateVal } : {}),
      ...(eventKey === "suspension" ? { suspensionFecha: dateVal } : {}),
      ...(eventKey === "reinicio" ? { reinicioFecha: dateVal } : {}),
    };

    setSelectedProject(updatedProj);
    setProyectos((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
  };

  // Upload and attach document directly to a milestone
  const handleAttachHitoFile = (hitoId: string, file: File) => {
    if (!selectedProject) return;

    const fileName = file.name;
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`;
    const today = new Date().toLocaleDateString("es-PE");

    const updatedHitos = selectedProject.hitos.map((h) => {
      if (h.id === hitoId) {
        return {
          ...h,
          cumplido: true,
          fecha: h.fecha || today,
          documentoSustento: fileName,
          adjuntoNombre: fileName,
          adjuntoTamano: fileSize,
        };
      }
      return h;
    });

    const updatedProj: ProyectoCartera = {
      ...selectedProject,
      hitos: updatedHitos,
    };

    setSelectedProject(updatedProj);
    setProyectos((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
  };

  // Update date field and sync with checklist
  const handleUpdateProjectDateField = (field: keyof ProyectoCartera, value: string) => {
    if (!selectedProject) return;

    let targetHitoId = "";
    if (field === "entregaTerrenoFecha") targetHitoId = "hito-terreno";
    else if (field === "inicioObraFecha") targetHitoId = "hito-acta-inicio";

    const updatedHitos = targetHitoId
      ? selectedProject.hitos.map((h) => {
          if (h.id === targetHitoId) {
            return {
              ...h,
              fecha: value,
              cumplido: value.trim() !== "" ? true : h.cumplido,
            };
          }
          return h;
        })
      : selectedProject.hitos;

    const updatedProj: ProyectoCartera = {
      ...selectedProject,
      [field]: value,
      hitos: updatedHitos,
    };

    setSelectedProject(updatedProj);
    setProyectos((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
  };

  // Excel File Importer (.xlsx, .xls, .csv)
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!data || data.length === 0) {
          setImportNotice({ message: "El archivo Excel está vacío.", type: "error" });
          return;
        }

        // Find header row (row containing cui, proyecto, obra, etc.)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, data.length); i++) {
          const rowText = (data[i] || []).join(" ").toUpperCase();
          if (
            rowText.includes("CUI") ||
            rowText.includes("PROYECTO") ||
            rowText.includes("OBRA") ||
            rowText.includes("CONTRATO") ||
            rowText.includes("ENCARGADO")
          ) {
            headerRowIndex = i;
            break;
          }
        }

        const headers: string[] = (data[headerRowIndex] || []).map((h: any) =>
          String(h || "").trim().toUpperCase()
        );

        const getColIdx = (keywords: string[]) =>
          headers.findIndex((h) => keywords.some((k) => h.includes(k)));

        const idIdx = getColIdx(["ID", "ITEM", "N°", "NUMERO"]);
        const encIdx = getColIdx(["ENCARGADO", "RESPONSABLE", "GESTOR", "INGENIERO"]);
        const proyIdx = getColIdx(["PROYECTO", "OBRA", "DESCRIPCION", "DENOMINACION"]);
        const cuiIdx = getColIdx(["CUI", "SNIP", "CODIGO"]);
        const contObraIdx = getColIdx(["CONTRATO EJECUCION", "CONTRATO OBRA", "EJECUCION"]);
        const contSupIdx = getColIdx(["CONTRATO SUPERVISION", "SUPERVISION"]);
        const terrIdx = getColIdx(["ENTREGA TERRENO", "TERRENO"]);
        const inicioIdx = getColIdx(["INICIO OBRA", "FECHA INICIO", "ACTA DE INICIO"]);
        const plazoIdx = getColIdx(["PLAZO", "DIAS"]);
        const termIdx = getColIdx(["TERMINO", "FECHA TERMINO", "VIGENTE", "CULMINACION"]);
        const obsIdx = getColIdx(["OBSERVACIONES", "OBSERVACION", "ESTADO ACTUAL", "ALERTAS"]);
        const montoEjecIdx = getColIdx(["MONTO EJECUCION", "MONTO OBRA", "MONTO CONTRATO", "COSTO OBRA"]);
        const empresaEjecIdx = getColIdx(["EMPRESA CONTRATISTA", "CONTRATISTA", "EMPRESA"]);
        const resIdx = getColIdx(["RESIDENTE", "ING. RESIDENTE"]);
        const montoSupIdx = getColIdx(["MONTO SUPERVISION", "COSTO SUPERVISION"]);
        const empresaSupIdx = getColIdx(["EMPRESA SUPERVISION", "CONSULTOR SUPERVISION"]);
        const supIdx = getColIdx(["SUPERVISOR", "JEFE SUPERVISION", "INSPECTOR"]);

        const rows = data.slice(headerRowIndex + 1);
        const importedList: ProyectoCartera[] = [];

        const formatExcelDate = (val: any) => {
          if (!val) return undefined;
          if (typeof val === "number") {
            const d = XLSX.SSF.parse_date_code(val);
            return `${String(d.d).padStart(2, "0")}/${String(d.m).padStart(2, "0")}/${d.y}`;
          }
          return String(val).trim();
        };

        const parseAmount = (val: any) => {
          if (typeof val === "number") return val;
          if (!val) return undefined;
          const cleaned = String(val).replace(/[^0-9\.]/g, "");
          const num = parseFloat(cleaned);
          return isNaN(num) ? undefined : num;
        };

        const matchedExistingIds = new Set<number>();

        rows.forEach((row: any[], index: number) => {
          if (!row || row.length === 0 || row.every((c) => !c)) return;

          const rawId = idIdx >= 0 ? parseInt(String(row[idIdx] || "").replace(/\D/g, ""), 10) : index + 1;
          const projId = isNaN(rawId) || rawId <= 0 ? index + 1 : rawId;
          const proyName = proyIdx >= 0 && row[proyIdx] ? String(row[proyIdx]).trim() : `PROYECTO #${projId}`;
          const cuiCode = cuiIdx >= 0 && row[cuiIdx] ? String(row[cuiIdx]).trim() : `2${100000 + projId}`;
          const encargado = encIdx >= 0 && row[encIdx] ? String(row[encIdx]).trim() : "-";

          const rawContratoObra = contObraIdx >= 0 && row[contObraIdx] ? String(row[contObraIdx]) : "";
          const rawContratoSup = contSupIdx >= 0 && row[contSupIdx] ? String(row[contSupIdx]) : "";

          const entregaTerr = terrIdx >= 0 ? formatExcelDate(row[terrIdx]) : undefined;
          const inicioObra = inicioIdx >= 0 ? formatExcelDate(row[inicioIdx]) : undefined;
          const plazoDias = plazoIdx >= 0 ? parseInt(String(row[plazoIdx] || "").replace(/\D/g, ""), 10) || undefined : undefined;
          const fechaTerm = termIdx >= 0 ? formatExcelDate(row[termIdx]) : undefined;
          const observaciones = obsIdx >= 0 && row[obsIdx] ? String(row[obsIdx]).trim() : "";

          const parsedMontoEjec = montoEjecIdx >= 0 ? parseAmount(row[montoEjecIdx]) : undefined;
          const parsedEmpresaEjec = empresaEjecIdx >= 0 && row[empresaEjecIdx] ? String(row[empresaEjecIdx]).trim() : undefined;
          const parsedRes = resIdx >= 0 && row[resIdx] ? String(row[resIdx]).trim() : undefined;
          const parsedMontoSup = montoSupIdx >= 0 ? parseAmount(row[montoSupIdx]) : undefined;
          const parsedEmpresaSup = empresaSupIdx >= 0 && row[empresaSupIdx] ? String(row[empresaSupIdx]).trim() : undefined;
          const parsedSup = supIdx >= 0 && row[supIdx] ? String(row[supIdx]).trim() : undefined;

          // Coincidencia precisa con obras existentes (por CUI numérico o nombre exacto)
          const cleanRowCui = cuiCode.replace(/\D/g, "");
          const cleanRowTitle = proyName.toUpperCase().trim();
          const existingProj = proyectos.find((p) => {
            const pCui = (p.cui || "").replace(/\D/g, "");
            if (cleanRowCui.length >= 6 && pCui.length >= 6 && cleanRowCui === pCui) return true;
            if (cleanRowTitle.length > 10 && p.proyecto && p.proyecto.toUpperCase().trim() === cleanRowTitle) return true;
            return false;
          });

          if (existingProj) {
            matchedExistingIds.add(existingProj.id);
          }

          let estado: EstadoCartera = existingProj?.estado || "ACTOS_PREPARATORIOS";
          if (observaciones.toUpperCase().includes("FINALIZ") || observaciones.toUpperCase().includes("RECEPCION")) {
            estado = "FINALIZADA_LIQUIDADA";
          } else if (inicioObra && inicioObra !== "-") {
            estado = "EN_EJECUCION";
          } else if (rawContratoObra && rawContratoObra !== "-") {
            estado = "PENDIENTE_INICIO_CONDICIONES";
          }

          importedList.push({
            id: existingProj ? existingProj.id : projId,
            encargado: (encargado && encargado !== "-") ? encargado : (existingProj?.encargado || "-"),
            proyecto: proyName,
            cui: cuiCode,
            contratoEjecucionNumero: rawContratoObra || existingProj?.contratoEjecucionNumero || "",
            contratoEjecucionMonto: parsedMontoEjec ?? existingProj?.contratoEjecucionMonto ?? 0,
            contratoEjecucionEmpresa: parsedEmpresaEjec ?? existingProj?.contratoEjecucionEmpresa ?? "",
            contratoEjecucionFechaFirma: existingProj?.contratoEjecucionFechaFirma,
            residenteNombre: parsedRes ?? existingProj?.residenteNombre,
            residenteCip: existingProj?.residenteCip,
            contratoSupervisionNumero: rawContratoSup || existingProj?.contratoSupervisionNumero || "",
            contratoSupervisionMonto: parsedMontoSup ?? existingProj?.contratoSupervisionMonto ?? 0,
            contratoSupervisionEmpresa: parsedEmpresaSup ?? existingProj?.contratoSupervisionEmpresa ?? "",
            contratoSupervisionFechaFirma: existingProj?.contratoSupervisionFechaFirma,
            supervisorNombre: parsedSup ?? existingProj?.supervisorNombre,
            supervisorCip: existingProj?.supervisorCip,
            entregaTerrenoFecha: entregaTerr ?? existingProj?.entregaTerrenoFecha,
            inicioObraFecha: inicioObra ?? existingProj?.inicioObraFecha,
            plazoDias: plazoDias ?? existingProj?.plazoDias,
            fechaTerminoActualizado: fechaTerm ?? existingProj?.fechaTerminoActualizado,
            observaciones: observaciones || existingProj?.observaciones || "",
            estado: estado,
            // Rescatar hitos, valorizaciones, expedientes y ampliaciones que pudieron añadir los usuarios
            hitos: existingProj?.hitos || PROYECTOS_RIOJA_SEED[0]?.hitos || [],
            valorizaciones: existingProj?.valorizaciones || [],
            expedientes: existingProj?.expedientes || [],
            ampliacionesPlazo: existingProj?.ampliacionesPlazo || [],
          });
        });

        // 1. Rescatar proyectos que los usuarios añadieron en el sistema y no estaban en este archivo Excel
        const rescuedExistingProjects = proyectos.filter((p) => !matchedExistingIds.has(p.id));

        // 2. Combinar los actualizados del Excel con los rescatados del sistema
        const combinedList = [...importedList, ...rescuedExistingProjects];

        // 3. Deduplicar estrictamente para evitar que se acumulen proyectos repetidos en la matriz
        const seenCuis = new Set<string>();
        const seenNames = new Set<string>();
        const deduplicatedList: ProyectoCartera[] = [];

        for (const proj of combinedList) {
          const cleanCui = (proj.cui || "").replace(/\D/g, "");
          const cleanName = (proj.proyecto || "").trim().toUpperCase();

          if (cleanCui.length >= 6) {
            if (seenCuis.has(cleanCui)) continue; // evitar acumulación duplicada
            seenCuis.add(cleanCui);
          } else if (cleanName.length > 10) {
            if (seenNames.has(cleanName)) continue; // evitar acumulación duplicada
            seenNames.add(cleanName);
          }
          deduplicatedList.push(proj);
        }

        // 4. Reasignar numeración ID secuencial ordenada
        const finalList = deduplicatedList.map((p, idx) => ({
          ...p,
          id: idx + 1,
        }));

        if (finalList.length > 0) {
          setProyectos(finalList);
          // Save to Firestore in real time: triggers onSnapshot for ALL team members of this municipality
          saveCarteraToFirestore(
            selectedEntityKey,
            finalList,
            currentMemberName,
            currentMemberEmail,
            "excel_upload"
          );
          setLastSyncInfo({
            lastUpdated: new Date().toISOString(),
            updatedBy: currentMemberName,
            source: "excel_upload",
          });
          const rescuedCount = rescuedExistingProjects.length;
          setImportNotice({
            message: `¡Éxito! Se actualizaron ${importedList.length} obras desde el archivo${rescuedCount > 0 ? ` y se rescataron ${rescuedCount} obras añadidas en el sistema` : ""}. No hay obras acumuladas duplicadas.`,
            type: "success",
          });
          setTimeout(() => setImportNotice(null), 8000);
        } else {
          setImportNotice({ message: "No se encontraron filas con datos de obras en el archivo.", type: "error" });
        }
      } catch (err: any) {
        console.error("Error importando Excel:", err);
        setImportNotice({ message: `Error al procesar el archivo Excel: ${err.message || "Formato no válido"}`, type: "error" });
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Export to native Excel (.xlsx)
  const handleExportXLSX = () => {
    try {
      const exportData = proyectos.map((p) => {
        const hitosCumplidos = p.hitos
          .filter((h) => h.cumplido)
          .map((h) => `${h.codigo} (${h.fecha || "OK"})`)
          .join(", ");
        return {
          ID: p.id,
          ENCARGADO: p.encargado,
          PROYECTO: p.proyecto,
          CUI: p.cui,
          "CONTRATO EJECUCION": p.contratoEjecucionNumero || "-",
          "MONTO EJECUCION (S/)": p.contratoEjecucionMonto || 0,
          "EMPRESA CONTRATISTA": p.contratoEjecucionEmpresa || "-",
          RESIDENTE: p.residenteNombre || "-",
          "CONTRATO SUPERVISION": p.contratoSupervisionNumero || "-",
          "MONTO SUPERVISION (S/)": p.contratoSupervisionMonto || 0,
          "EMPRESA SUPERVISORA": p.contratoSupervisionEmpresa || "-",
          SUPERVISOR: p.supervisorNombre || "-",
          "ENTREGA TERRENO": p.entregaTerrenoFecha || "-",
          "INICIO OBRA": p.inicioObraFecha || "-",
          "PLAZO (DIAS)": p.plazoDias || "-",
          "TERMINO VIGENTE": p.fechaTerminoActualizado || "-",
          ESTADO: getEstadoLabel(p.estado),
          OBSERVACIONES: p.observaciones || "-",
          "HITOS CUMPLIDOS": hitosCumplidos,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cartera Obras");
      XLSX.writeFile(
        wb,
        `Cartera_Obras_${selectedEntityKey}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (err) {
      console.error("Error exporting to excel:", err);
    }
  };

  // Quick 1-click reset to seed data
  const handleResetSeed = () => {
    if (
      window.confirm(
        `¿Deseas restaurar la lista oficial de ${selectedEntityKey === "RIOJA" ? "23 proyectos de Rioja" : "proyectos de la entidad"}?`
      )
    ) {
      const resetList = selectedEntityKey === "RIOJA" ? PROYECTOS_RIOJA_SEED : [];
      setProyectos(resetList);
      localStorage.setItem(activeStorageKey, JSON.stringify(resetList));
      setSelectedProject(null);
    }
  };

  // Valorizaciones handlers
  const handleUpdatePartidaMetrado = (
    obraId: number,
    valoId: string,
    partidaId: string,
    newMetradoActual: number
  ) => {
    setProyectos((prev) =>
      prev.map((proj) => {
        if (proj.id !== obraId) return proj;
        const currentValos = proj.valorizaciones || [];
        const updatedValos = currentValos.map((val) => {
          if (val.id !== valoId) return val;
          const currentPartidas = val.partidas || [];
          const updatedPartidas = currentPartidas.map((part) => {
            if (part.id !== partidaId) return part;
            const metradoAct = Math.max(0, newMetradoActual);
            const metradoAcum = part.metradoAnterior + metradoAct;
            const montoParcial = metradoAct * part.precioUnitario;
            const montoAcum = metradoAcum * part.precioUnitario;
            const pctAvance =
              part.metradoContratado > 0 ? (metradoAcum / part.metradoContratado) * 100 : 0;
            return {
              ...part,
              metradoActual: metradoAct,
              metradoAcumulado: metradoAcum,
              montoParcial: montoParcial,
              montoAcumulado: montoAcum,
              porcentajeAvance: Number(pctAvance.toFixed(2)),
            };
          });

          // Recalculate totals
          const totalEjecutadoMes = updatedPartidas.reduce(
            (sum, p) => sum + (p.montoParcial || 0),
            0
          );
          const totalEjecutadoAcum = updatedPartidas.reduce(
            (sum, p) => sum + (p.montoAcumulado || 0),
            0
          );
          const contratoMonto = proj.contratoEjecucionMonto || 1;
          const pctEjecMes = (totalEjecutadoMes / contratoMonto) * 100;
          const pctEjecAcum = (totalEjecutadoAcum / contratoMonto) * 100;
          const esAtrasada =
            val.montoProgramadoAcumulado > 0 &&
            totalEjecutadoAcum < 0.8 * val.montoProgramadoAcumulado;

          return {
            ...val,
            montoEjecutadoMes: totalEjecutadoMes,
            porcentajeEjecutadoMes: Number(pctEjecMes.toFixed(2)),
            montoEjecutadoAcumulado: totalEjecutadoAcum,
            porcentajeEjecutadoAcumulado: Number(pctEjecAcum.toFixed(2)),
            esAtrasada: esAtrasada,
            partidas: updatedPartidas,
          };
        });

        return {
          ...proj,
          valorizaciones: updatedValos,
        };
      })
    );
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

  // Filtro por Tipología / Categoría de Proyectos (Pistas, Coberturas, FONDES, Puentes, Otros)
  const [filterCategoria, setFilterCategoria] = useState<string>("TODAS");

  // Proyectos ordenados y agrupados por tipología en la matriz
  const sortedAndGroupedProjects = useMemo(() => {
    let list = [...filteredProjects];
    if (filterCategoria !== "TODAS") {
      list = list.filter((p) => detectProjectCategory(p.proyecto).key === filterCategoria);
    }
    // Agrupar juntos: Pistas -> Coberturas -> FONDES -> Puentes -> Saneamiento -> Otros
    return list.sort((a, b) => {
      const catA = detectProjectCategory(a.proyecto);
      const catB = detectProjectCategory(b.proyecto);
      if (catA.order !== catB.order) {
        return catA.order - catB.order;
      }
      return a.proyecto.localeCompare(b.proyecto);
    });
  }, [filteredProjects, filterCategoria]);

  // Conteo por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODAS: proyectos.length,
      pistas: 0,
      coberturas: 0,
      fondes: 0,
      puentes: 0,
      saneamiento: 0,
      otros: 0,
    };
    proyectos.forEach((p) => {
      const cat = detectProjectCategory(p.proyecto).key;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [proyectos]);

  // Statistics & KPIs
  const stats = useMemo(() => {
    const total = proyectos.length;
    const montoTotal = proyectos.reduce((sum, p) => sum + (p.contratoEjecucionMonto || 0), 0);
    const montoSupervision = proyectos.reduce((sum, p) => sum + (p.contratoSupervisionMonto || 0), 0);
    const totalEjecutadoFisico = proyectos.reduce((sum, p) => sum + getAvanceFisicoObra(p).montoEjecutadoTotal, 0);
    const avanceFisicoPromedio = montoTotal > 0 ? Math.round((totalEjecutadoFisico / montoTotal) * 10000) / 100 : 0;
    
    // Conteo por estados normativos según paleta oficial
    const seleccionSeace = proyectos.filter(
      (p) =>
        p.estado === "ACTOS_PREPARATORIOS" ||
        p.estado === "EN_SELECCION_SEACE" ||
        (p.estado as string).toLowerCase().includes("selecc") ||
        (p.estado as string).toLowerCase().includes("seace") ||
        (p.estado as string).toLowerCase().includes("convocator") ||
        (p.estado as string).toLowerCase().includes("preparator")
    ).length;

    const enLiquidacion = proyectos.filter(
      (p) =>
        p.estado === "FINALIZADA_LIQUIDADA" ||
        (p.estado as string).toLowerCase().includes("liquid") ||
        !!p.hitos?.find((h) => h.id === "hito-liquidacion")?.cumplido
    ).length;

    const culminadas = proyectos.filter(
      (p) =>
        p.estado === "RECEPCIONADA" ||
        (p.estado as string).toLowerCase().includes("recep") ||
        (p.estado as string).toLowerCase().includes("culmin") ||
        !!p.hitos?.find((h) => h.id === "hito-recepcion")?.cumplido
    ).length;

    const enEjecucion = proyectos.filter(
      (p) => p.estado === "EN_EJECUCION" || !!p.inicioObraFecha
    ).length;

    const pendienteInicio = proyectos.filter((p) => p.estado === "PENDIENTE_INICIO_CONDICIONES").length;
    const conAlertas = proyectos.filter((p) => getAlertasNormativas(p).length > 0).length;

    return {
      total,
      montoTotal,
      montoSupervision,
      totalEjecutadoFisico,
      avanceFisicoPromedio,
      seleccionSeace,
      enEjecucion,
      culminadas,
      enLiquidacion,
      pendienteInicio,
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
      {/* Hidden Excel File Input */}
      <input
        type="file"
        ref={excelInputRef}
        onChange={handleExcelFileUpload}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Top Header Toolbar - Minimal & Ultra-rápido */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Seguimiento de Obras & Control Normativo</span>
            </h1>

            {/* Active Municipality Badge & Obras Counter */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  🏛️ Municipalidad Provincial de Rioja (OEI) • Matriz Activa Sincronizada
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{stats.total} Obras Registradas</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            {/* New Obra Button - Corporate Amber Accent */}
            <button
              onClick={() => {
                setEditingCarteraObra(null);
                setIsNewCarteraModalOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              title="Registrar una nueva obra en la matriz de seguimiento"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Nueva Obra</span>
            </button>

            {/* Intelligent Contract PDF Scanner Button */}
            <button
              onClick={() => {
                setContractScannerPreselectedObra(null);
                setIsContractScannerModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              title="Escanear y extraer datos de Contratos de Obra o Supervisión (PDF) directamente al Seguimiento de Obras"
            >
              <FileSearch className="w-4 h-4 text-white" />
              <span>Escanear Contrato (PDF)</span>
            </button>

            {/* Direct Contract Registration Button */}
            <button
              onClick={() => setIsQuickContratosModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              title="Agregar obra directamente con información de Contrato de Ejecución y Contrato de Supervisión"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Agregar con Contratos (Obra & Supervisión)</span>
            </button>

            {/* Excel Upload Button */}
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Cargar archivo Excel (.xlsx/.csv) para actualizar la matriz de obras automáticamente"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Subir Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Real-Time Cloud Synchronization & Isolation Status Bar */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sincronización en Tiempo Real Activa</span>
            </div>
            <span className="text-slate-300 text-[11px]">
              {lastSyncInfo ? (
                <span>
                  Última actualización: <strong className="text-white">{lastSyncInfo.updatedBy}</strong> ({new Date(lastSyncInfo.lastUpdated).toLocaleTimeString("es-PE")})
                </span>
              ) : (
                <span>Base de datos en la nube conectada</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mesa de Trabajo Privada: {entityDisplayName}</span>
          </div>
        </div>

        {/* KPI Counter Cards - Compact & Snappy con Colores Oficiales */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Cartera Total</div>
            <div className="text-base font-black text-white mt-0.5">{stats.total} Proyectos</div>
            <div className="text-[10px] text-blue-300 font-mono mt-0.5">{formatPEN(stats.montoTotal)}</div>
          </div>

          <div className="bg-blue-500/15 border border-blue-500/40 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1">
              <span>🔵 En Selección SEACE</span>
            </div>
            <div className="text-base font-black text-blue-300 mt-0.5">{stats.seleccionSeace}</div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">Azul • TDR / SEACE</div>
          </div>

          <div className="bg-emerald-500/15 border border-emerald-500/40 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1">
              <span>🟢 En Ejecución</span>
            </div>
            <div className="text-base font-black text-emerald-300 mt-0.5">{stats.enEjecucion}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">Verde • Obras en Campo</div>
          </div>

          <div className="bg-rose-500/15 border border-rose-500/40 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
              <span>🔴 Culminó la Obra</span>
            </div>
            <div className="text-base font-black text-rose-300 mt-0.5">{stats.culminadas}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Rojo Bajo • Recepcionada</div>
          </div>

          <div className="bg-amber-500/15 border border-amber-500/40 p-2.5 rounded-xl">
            <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <span>🟡 En Liquidación</span>
            </div>
            <div className="text-base font-black text-amber-300 mt-0.5">{stats.enLiquidacion}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">Amarillo Bajo • Cierre</div>
          </div>

          <div className="bg-orange-500/15 border border-orange-500/40 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-orange-300 uppercase">Alertas Normativas</div>
            <div className="text-base font-black text-orange-400 mt-0.5">{stats.conAlertas}</div>
            <div className="text-[10px] text-orange-200/80 mt-0.5">Requieren Acción</div>
          </div>
        </div>
      </div>

      {/* Notice Banner from Excel Import */}
      {importNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            importNotice.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {importNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{importNotice.message}</span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Modes */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveView("matriz")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === "matriz"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeView === "matriz" ? "text-slate-950" : "text-amber-600"}`} />
              Matriz Oficial
            </button>
            <button
              onClick={() => setActiveView("pipeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === "pipeline"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${activeView === "pipeline" ? "text-slate-950" : "text-amber-600"}`} />
              Checklist Normativo
            </button>
            <button
              onClick={() => setActiveView("valorizaciones")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === "valorizaciones"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calculator className={`w-3.5 h-3.5 ${activeView === "valorizaciones" ? "text-slate-950" : "text-amber-600"}`} />
              Avance & Valorizaciones
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
            {["TODOS", ...allKnownEncargados, "SIN_ASIGNAR"].map((enc) => (
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
              <option value="EN_SELECCION_SEACE">🔵 En Selección SEACE (Azul)</option>
              <option value="EN_EJECUCION">🟢 En Ejecución (Verde)</option>
              <option value="RECEPCIONADA">🔴 Culminó la Obra (Rojo Bajo)</option>
              <option value="FINALIZADA_LIQUIDADA">🟡 En Liquidación (Amarillo Bajo)</option>
              <option value="ACTOS_PREPARATORIOS">📋 Actos Preparatorios / SEACE</option>
              <option value="PENDIENTE_INICIO_CONDICIONES">⏳ Pendiente Inicio (Art. 176)</option>
            </select>
          </div>

          {/* Barra de Tipologías de Proyectos (Pistas, Coberturas, FONDES, Puentes, Otros) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
            <span className="text-slate-500 font-bold text-[11px] mr-1 uppercase tracking-wider">
              Tipología:
            </span>
            <button
              onClick={() => setFilterCategoria("TODAS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "TODAS"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Todos Agrupados</span>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
                {categoryCounts.TODAS}
              </span>
            </button>
            <button
              onClick={() => setFilterCategoria("pistas")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "pistas"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🛣️ Pistas ({categoryCounts.pistas})</span>
            </button>
            <button
              onClick={() => setFilterCategoria("coberturas")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "coberturas"
                  ? "bg-indigo-600 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🏟️ Coberturas ({categoryCounts.coberturas})</span>
            </button>
            <button
              onClick={() => setFilterCategoria("fondes")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "fondes"
                  ? "bg-teal-600 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🌊 FONDES ({categoryCounts.fondes})</span>
            </button>
            <button
              onClick={() => setFilterCategoria("puentes")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "puentes"
                  ? "bg-blue-600 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🌉 Puentes ({categoryCounts.puentes})</span>
            </button>
            <button
              onClick={() => setFilterCategoria("otros")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                filterCategoria === "otros"
                  ? "bg-slate-700 text-white font-black shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>📁 Otros ({categoryCounts.otros})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: MATRIZ DE CARTERA OFICIAL (EXCEL SPREADSHEET)   */}
      {/* ======================================================== */}
      {activeView === "matriz" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Matriz Oficial de Obras e Inversiones ({sortedAndGroupedProjects.length} Registros Agrupados por Tipología)</span>
            </div>
          </div>

          {/* Leyenda Visual de Colores del Checklist Normativo */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 py-2 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Colores en Checklist Normativo:</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Azul: En Selección SEACE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Verde: En Ejecución</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Rojo Bajo: Culminó la Obra</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Amarillo Bajo: En Liquidación</span>
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
              <span>Orden de Matriz:</span>
              <span className="font-bold text-slate-800">🛣️ Pistas • 🏟️ Coberturas • 🌊 FONDES • 🌉 Puentes • 💧 Saneamiento • 📁 Otros</span>
            </div>
          </div>

          {/* Barra de desplazamiento horizontal sincronizada (Superior) */}
          <div className="bg-slate-100/90 px-3 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] shrink-0">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Barra de Desplazamiento Horizontal (Mueve la matriz a izquierda / derecha):</span>
            </div>
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              className="overflow-x-auto overflow-y-hidden flex-1 h-5 cursor-ew-resize bg-slate-200 rounded-md border border-slate-300"
              title="Desplaza horizontalmente la matriz sin tener que bajar al fondo"
            >
              <div style={{ width: 1780 }} className="h-5" />
            </div>
          </div>

          {/* Contenedor principal de la tabla (sin cuadro vertical encerrado: baja con la barra del navegador) */}
          <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto w-full">
            <table className="min-w-[1780px] w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-20 font-bold text-[11px]">
                <tr>
                  <th className="p-2 border-r border-slate-800 text-center w-20">ACCIONES</th>
                  <th className="p-2.5 border-r border-slate-800 w-32">ENCARGADO (OEI)</th>
                  <th className="p-2.5 border-r border-slate-800 min-w-[220px]">PROYECTO & CUI</th>
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
                  <th className="p-2.5 text-center min-w-[320px]">
                    AVANCE FÍSICO REAL (OBRA) vs CHECKLIST NORMATIVO
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {sortedAndGroupedProjects.map((p, pIdx) => {
                  const estadoInfo = getEstadoLabel(p.estado);
                  const statusTheme = getRowStatusTheme(p.estado);
                  const alertas = getAlertasNormativas(p);
                  const pct = getProgresoPorcentaje(p.hitos);
                  const avanceFisico = getAvanceFisicoObra(p);
                  const checklistTheme = getChecklistColorTheme(p);
                  const currentCat = detectProjectCategory(p.proyecto);
                  const prevCat = pIdx > 0 ? detectProjectCategory(sortedAndGroupedProjects[pIdx - 1].proyecto) : null;
                  const isFirstInCategory = !prevCat || prevCat.key !== currentCat.key;

                  // Métricas del grupo actual
                  const groupItems = sortedAndGroupedProjects.filter(
                    (item) => detectProjectCategory(item.proyecto).key === currentCat.key
                  );
                  const groupTotalMonto = groupItems.reduce(
                    (acc, curr) => acc + (curr.contratoEjecucionMonto || 0),
                    0
                  );
                  const groupTotalSupervision = groupItems.reduce(
                    (acc, curr) => acc + (curr.contratoSupervisionMonto || 0),
                    0
                  );

                  // Hitos clave para 1-click rápido
                  const hitoNotifSup = p.hitos.find((h) => h.id === "hito-notif-sup");
                  const hitoTerreno = p.hitos.find((h) => h.id === "hito-terreno");
                  const hitoExpediente = p.hitos.find((h) => h.id === "hito-expediente");
                  const hitoCod = p.hitos.find((h) => h.id === "hito-cod");
                  const hitoValo1 = p.hitos.find((h) => h.id === "hito-valo-01");
                  const hitoRecepcion = p.hitos.find((h) => h.id === "hito-recepcion");

                  return (
                    <React.Fragment key={p.id}>
                      {/* Fila Divisora de Categoría / Tipología (Agrupados juntos: Pistas, Coberturas, FONDES, Puentes, Otros) */}
                      {isFirstInCategory && (
                        <tr className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white select-none border-t-2 border-b-2 border-amber-500/80">
                          <td colSpan={11} className="py-2.5 px-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{currentCat.icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                                      GRUPO: {currentCat.label}
                                    </span>
                                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full font-black">
                                      {groupItems.length} {groupItems.length === 1 ? "Obra" : "Obras"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    Proyectos ordenados y agrupados según tipología en la matriz oficial
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                                <span>
                                  Inversión Obras: <strong className="text-emerald-400 font-black">{formatPEN(groupTotalMonto)}</strong>
                                </span>
                                {groupTotalSupervision > 0 && (
                                  <span>
                                    Supervisión: <strong className="text-blue-300 font-black">{formatPEN(groupTotalSupervision)}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      <tr
                        onClick={() => setSelectedProject(p)}
                        className={`transition cursor-pointer group ${statusTheme.rowBg} ${statusTheme.borderAccent}`}
                      >
                        {/* Botones Acciones: Editar (arriba) y Eliminar (abajo) - Compacto y ultra-eficiente */}
                        <td
                          className="p-1.5 font-bold text-center text-slate-700 bg-white/40 group-hover:bg-white/70 border-r border-slate-200 w-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col items-stretch gap-1 w-full max-w-[66px] mx-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCarteraObra(p);
                                setIsNewCarteraModalOpen(true);
                              }}
                              className="w-full px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                              title="Modificar todos los datos de esta obra (contratos, montos, plazos, personal)"
                            >
                              <Edit2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setObraToDelete(p)}
                              className="w-full px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-700 bg-rose-50/90 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                              title="Eliminar esta obra de la cartera de inversiones"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>

                      {/* ENCARGADO - Editable directamente en la matriz (Selección o Escritura Libre) */}
                      <td className="p-2 border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
                        {editingEncargadoId === p.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={customEncargadoText}
                              onChange={(e) => setCustomEncargadoText(e.target.value.toUpperCase())}
                              placeholder="Nombre..."
                              className="font-black text-[10px] bg-white border border-amber-400 rounded px-1.5 py-1 w-full focus:outline-none shadow-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (customEncargadoText.trim()) {
                                    handleUpdateEncargado(p.id, customEncargadoText);
                                  }
                                  setEditingEncargadoId(null);
                                } else if (e.key === "Escape") {
                                  setEditingEncargadoId(null);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customEncargadoText.trim()) {
                                  handleUpdateEncargado(p.id, customEncargadoText);
                                }
                                setEditingEncargadoId(null);
                              }}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer shrink-0"
                              title="Guardar nuevo encargado"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEncargadoId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer shrink-0"
                              title="Cancelar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={p.encargado}
                              onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                  setEditingEncargadoId(p.id);
                                  setCustomEncargadoText(p.encargado === "-" ? "" : p.encargado);
                                } else {
                                  handleUpdateEncargado(p.id, e.target.value);
                                }
                              }}
                              className={`font-black text-[10px] tracking-wide rounded px-1.5 py-1 border cursor-pointer focus:outline-none transition w-full ${
                                p.encargado === "JOSUE"
                                  ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                                  : p.encargado === "LUIS"
                                  ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                  : p.encargado === "JHON"
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : p.encargado === "JHENIFER"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : p.encargado === "JEZER"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                              title="Cambiar encargado directamente en la tabla (sincroniza en tiempo real)"
                            >
                              {allKnownEncargados.map((enc) => (
                                <option key={enc} value={enc}>
                                  {enc}
                                </option>
                              ))}
                              <option value="-">SIN ASIGNAR (-)</option>
                              <option value="__NEW__">✏️ + Escribir otro...</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEncargadoId(p.id);
                                setCustomEncargadoText(p.encargado === "-" ? "" : p.encargado);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded cursor-pointer transition shrink-0"
                              title="Escribir nombre de nuevo encargado"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500 hover:text-amber-700" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* PROYECTO & CUI & ESTADO (Editable directamente con colores oficiales de estado) */}
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {p.proyecto}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-white/90 text-slate-700 px-1.5 py-0.2 rounded border border-slate-300">
                            CUI: {p.cui || "S/C"}
                          </span>
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1 shadow-2xs">
                            <span>{currentCat.icon}</span>
                            <span>{currentCat.shortLabel}</span>
                          </span>
                          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={p.estado}
                              onChange={(e) => handleUpdateEstado(p.id, e.target.value as EstadoCartera)}
                              className={`text-[9.5px] font-black px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none transition appearance-none pr-5.5 shadow-2xs ${statusTheme.badgeBg}`}
                              title="Cambiar estado situacional de la obra (cambia automáticamente el color de toda la fila)"
                            >
                              <option value="EN_EJECUCION" className="bg-white text-slate-900 font-bold">🟢 En Ejecución de Obra</option>
                              <option value="EN_SELECCION_SEACE" className="bg-white text-slate-900 font-bold">🔵 En Selección (SEACE)</option>
                              <option value="RECEPCIONADA" className="bg-white text-slate-900 font-bold">🔴 Culminó la Obra (Recepcionada)</option>
                              <option value="FINALIZADA_LIQUIDADA" className="bg-white text-slate-900 font-bold">🟡 En Liquidación / Finalizada</option>
                              <option value="ACTOS_PREPARATORIOS" className="bg-white text-slate-900 font-bold">📋 Actos Preparatorios</option>
                              <option value="PENDIENTE_INICIO_CONDICIONES" className="bg-white text-slate-900 font-bold">⏳ Pendiente Inicio (Art. 176)</option>
                            </select>
                            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] opacity-90 font-bold">▼</span>
                          </div>
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

                      {/* CHECKLIST, VALORIZACIONES & EXPEDIENTES INTEGRADO */}
                      <td
                        className="p-2.5 bg-white/40 group-hover:bg-white/60 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenValoModal(p, "valorizacion");
                        }}
                        title="Haz clic para abrir la herramienta de valorizaciones, partidas y avance"
                      >
                        <div className="space-y-2 min-w-[285px]">
                          {/* 1. SECCIÓN A: Avance Físico Real de Ejecución de Obra (Campo - Art. 194) */}
                          <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-300 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-emerald-950 text-[10px] flex items-center gap-1">
                                <span>🏗️ Avance Físico (Obra):</span>
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                                    avanceFisico.estadoFisico === "ATRASADA"
                                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                                      : avanceFisico.estadoFisico === "CULMINADA"
                                      ? "bg-teal-100 text-teal-800 border border-teal-300"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  }`}
                                >
                                  {avanceFisico.etiqueta}
                                </span>
                              </span>
                              <span className="font-mono font-black text-emerald-800 text-sm">
                                {avanceFisico.porcentajeFisico.toFixed(2)}%
                              </span>
                            </div>

                            {/* Dual Progress Bars: Real vs Programado */}
                            <div className="space-y-0.5">
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                                <div
                                  className={`h-full transition-all ${
                                    avanceFisico.porcentajeFisico >= 100
                                      ? "bg-teal-500"
                                      : avanceFisico.estadoFisico === "ATRASADA"
                                      ? "bg-rose-500"
                                      : "bg-emerald-600"
                                  }`}
                                  style={{ width: `${Math.min(100, avanceFisico.porcentajeFisico)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[8px] font-mono">
                                <span className="text-slate-600 font-bold">
                                  Certif: {formatPEN(avanceFisico.montoEjecutadoTotal)}
                                </span>
                                <span className="text-blue-700 font-bold">
                                  Prog: {(avanceFisico.porcentajeProgramado || 0).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200/60">
                              <span className="text-[8px] font-mono text-slate-500">
                                Saldo: {formatPEN(Math.max(0, p.contratoEjecucionMonto - avanceFisico.montoEjecutadoTotal))}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className="py-0.5 px-2 rounded text-[9px] font-black text-emerald-900 bg-emerald-200 hover:bg-emerald-300 border border-emerald-400 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Ingresar o actualizar cálculo de valorizaciones y partidas"
                              >
                                <Calculator className="w-2.5 h-2.5 text-emerald-800" />
                                <span>+ Valorización</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. SECCIÓN B: Checklist Normativo (Cumplimiento de Hitos según Estado Situacional) */}
                          <div
                            className={`p-2 rounded-xl border shadow-xs space-y-1 transition ${checklistTheme.container} ${checklistTheme.borderAccent} ${checklistTheme.outerGlow}`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-extrabold flex items-center gap-1 ${checklistTheme.title}`}>
                                  <span>{checklistTheme.icon} Checklist Normativo:</span>
                                </span>
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${checklistTheme.badge}`}
                                  title={`Estado en checklist: ${checklistTheme.label}`}
                                >
                                  {checklistTheme.label}
                                </span>
                                <span className={`font-normal text-[8px] ${checklistTheme.count}`}>
                                  ({p.hitos.filter((h) => h.cumplido).length}/{p.hitos.length} hitos)
                                </span>
                              </div>
                              <span className={`font-mono font-black ${checklistTheme.pct}`}>{pct}%</span>
                            </div>

                            {/* Progress Bar for Normative Checklist con colores específicos */}
                            <div className={`w-full rounded-full h-1.5 overflow-hidden border ${checklistTheme.barTrack}`}>
                              <div
                                className={`h-full rounded-full transition-all ${checklistTheme.barFill}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Checklist Items: Tarjetitas con color translúcido según estado */}
                            <div className="grid grid-cols-2 gap-1 pt-0.5">
                              {/* 1. Notif Supervisor */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className={`p-1.5 rounded-lg text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoNotifSup?.cumplido
                                    ? checklistTheme.tarjetaFulfilled
                                    : checklistTheme.tarjetaPending
                                }`}
                                title={`Notificación al Supervisor (Art. 176.1.a) • Doc: ${hitoNotifSup?.documentoSustento || "No especificado"} • Fecha: ${hitoNotifSup?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`truncate font-extrabold ${checklistTheme.tarjetaTitle}`}>1. Notif. Sup</span>
                                  <span className={`font-mono text-[8px] ${checklistTheme.tarjetaDate}`}>
                                    {hitoNotifSup?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoNotifSup?.documentoSustento ? (
                                  <span className={`font-mono text-[7px] truncate px-1 py-0.2 rounded border ${checklistTheme.tarjetaDoc}`}>
                                    📄 {hitoNotifSup.documentoSustento}
                                  </span>
                                ) : (
                                  <span className={`text-[7px] font-normal ${checklistTheme.count}`}>
                                    {hitoNotifSup?.cumplido ? "Aprobado" : "Pendiente"}
                                  </span>
                                )}
                              </div>

                              {/* 2. Entrega Terreno */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className={`p-1.5 rounded-lg text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoTerreno?.cumplido
                                    ? checklistTheme.tarjetaFulfilled
                                    : checklistTheme.tarjetaPending
                                }`}
                                title={`Entrega de Terreno (Art. 176.1.b) • Doc: ${hitoTerreno?.documentoSustento || "No especificado"} • Fecha: ${hitoTerreno?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`truncate font-extrabold ${checklistTheme.tarjetaTitle}`}>2. Terreno</span>
                                  <span className={`font-mono text-[8px] ${checklistTheme.tarjetaDate}`}>
                                    {hitoTerreno?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoTerreno?.documentoSustento ? (
                                  <span className={`font-mono text-[7px] truncate px-1 py-0.2 rounded border ${checklistTheme.tarjetaDoc}`}>
                                    📄 {hitoTerreno.documentoSustento}
                                  </span>
                                ) : (
                                  <span className={`text-[7px] font-normal ${checklistTheme.count}`}>
                                    {hitoTerreno?.cumplido ? "Aprobado" : "Pendiente"}
                                  </span>
                                )}
                              </div>

                              {/* 3. Entrega Expediente */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className={`p-1.5 rounded-lg text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoExpediente?.cumplido
                                    ? checklistTheme.tarjetaFulfilled
                                    : checklistTheme.tarjetaPending
                                }`}
                                title={`Entrega Expediente Técnico (Art. 176.1.c) • Doc: ${hitoExpediente?.documentoSustento || "No especificado"} • Fecha: ${hitoExpediente?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`truncate font-extrabold ${checklistTheme.tarjetaTitle}`}>3. Expediente</span>
                                  <span className={`font-mono text-[8px] ${checklistTheme.tarjetaDate}`}>
                                    {hitoExpediente?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoExpediente?.documentoSustento ? (
                                  <span className={`font-mono text-[7px] truncate px-1 py-0.2 rounded border ${checklistTheme.tarjetaDoc}`}>
                                    📄 {hitoExpediente.documentoSustento}
                                  </span>
                                ) : (
                                  <span className={`text-[7px] font-normal ${checklistTheme.count}`}>
                                    {hitoExpediente?.cumplido ? "Aprobado" : "Pendiente"}
                                  </span>
                                )}
                              </div>

                              {/* 4. COD */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className={`p-1.5 rounded-lg text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoCod?.cumplido
                                    ? checklistTheme.tarjetaFulfilled
                                    : checklistTheme.tarjetaPending
                                }`}
                                title={`Cuaderno de Obra Digital (Art. 176.1.d) • Doc: ${hitoCod?.documentoSustento || "No especificado"} • Fecha: ${hitoCod?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`truncate font-extrabold ${checklistTheme.tarjetaTitle}`}>4. C.O.D.</span>
                                  <span className={`font-mono text-[8px] ${checklistTheme.tarjetaDate}`}>
                                    {hitoCod?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoCod?.documentoSustento ? (
                                  <span className={`font-mono text-[7px] truncate px-1 py-0.2 rounded border ${checklistTheme.tarjetaDoc}`}>
                                    📄 {hitoCod.documentoSustento}
                                  </span>
                                ) : (
                                  <span className={`text-[7px] font-normal ${checklistTheme.count}`}>
                                    {hitoCod?.cumplido ? "Aprobado" : "Pendiente"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Extra Items: Valorizaciones, Expedientes Adicionales y Ampliaciones de Plazo */}
                          <div className="space-y-1 pt-1">
                            {/* Valorizaciones Registradas */}
                            {p.valorizaciones && p.valorizaciones.length > 0 ? (
                              p.valorizaciones.map((val) => (
                                <div
                                  key={val.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenValoModal(p, "valorizacion");
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center justify-between gap-1 cursor-pointer transition shadow-2xs ${checklistTheme.tarjetaFulfilled}`}
                                  title={`Valorización N° ${val.numero} • Fecha de Emisión: ${val.fechaValorizacion || "-"}`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`px-1.5 py-0.2 rounded text-[7px] uppercase font-black tracking-wider ${checklistTheme.badge}`}>
                                      Valorización
                                    </span>
                                    <span className={`truncate font-extrabold ${checklistTheme.tarjetaTitle}`}>Val N° 0{val.numero}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[8px]">
                                    <span className={`font-semibold ${checklistTheme.tarjetaDate}`}>{val.fechaValorizacion ? `Emisión: ${val.fechaValorizacion}` : "-"}</span>
                                    <span className={`font-black ${checklistTheme.pct}`}>{formatPEN(val.montoEjecutadoMes || 0)}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              hitoValo1 && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenValoModal(p, "valorizacion");
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center justify-between gap-1 cursor-pointer transition ${
                                    hitoValo1.cumplido
                                      ? checklistTheme.tarjetaFulfilled
                                      : checklistTheme.tarjetaPending
                                  }`}
                                  title="Valorización N° 01 • Clic para registrar cálculo de avance y partidas"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`px-1.5 py-0.2 rounded text-[7px] uppercase font-black ${checklistTheme.badge}`}>
                                      Valorización
                                    </span>
                                    <span className="truncate">Val N° 01 (Art. 194)</span>
                                  </div>
                                  <span className={`font-mono text-[8px] font-bold shrink-0 ${checklistTheme.pct}`}>
                                    {hitoValo1.fecha ? `Emisión: ${hitoValo1.fecha}` : "Registrar"}
                                  </span>
                                </div>
                              )
                            )}

                            {/* Expedientes Adicionales Registrados */}
                            {p.expedientes && p.expedientes.map((exp) => (
                              <div
                                key={exp.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "expediente");
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 text-[9px] font-bold flex items-center justify-between gap-1 cursor-pointer hover:bg-slate-800 transition shadow-2xs"
                                title={`Expediente Técnico Adicional N° ${exp.numero} • Fecha de Emisión: ${exp.fechaEmision || "-"}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="bg-slate-800 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded text-[7px] uppercase font-black">
                                    Expediente
                                  </span>
                                  <span className="truncate text-white font-extrabold">Exp Adic N° 0{exp.numero}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[8px]">
                                  <span className="text-slate-400">{exp.fechaEmision ? `Emisión: ${exp.fechaEmision}` : "-"}</span>
                                  <span className="text-amber-400 font-black">{formatPEN(exp.monto || 0)}</span>
                                </div>
                              </div>
                            ))}

                            {/* Ampliaciones de Plazo Registradas */}
                            {p.ampliacionesPlazo && p.ampliacionesPlazo.map((amp) => (
                              <div
                                key={amp.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "ampliacion");
                                }}
                                className="px-2 py-1 rounded-lg bg-orange-50 text-orange-950 border border-orange-300 text-[9px] font-bold flex items-center justify-between gap-1 cursor-pointer hover:bg-orange-100 transition shadow-2xs"
                                title={`Ampliación de Plazo N° ${amp.numero} • Fecha de Emisión: ${amp.fechaEmision || "-"}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded text-[7px] uppercase font-black">
                                    Ampliación
                                  </span>
                                  <span className="truncate font-extrabold">Amp Plazo N° 0{amp.numero}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[8px]">
                                  <span className="text-slate-600 font-semibold">{amp.fechaEmision ? `Emisión: ${amp.fechaEmision}` : "-"}</span>
                                  <span className="text-orange-800 font-black">+{amp.dias} días</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Actions Row */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenValoModal(p, "valorizacion");
                              }}
                              className="flex-1 py-1 px-1.5 rounded-lg text-[9px] font-black text-slate-950 bg-amber-500 hover:bg-amber-400 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                              title="Registrar valorización mensual, partidas y cálculo automático de avance"
                            >
                              <Calculator className="w-2.5 h-2.5 text-slate-950" />
                              <span>+ Valorización</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenValoModal(p, "expediente");
                              }}
                              className="py-1 px-2 rounded-lg text-[9px] font-bold text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-0.5 cursor-pointer transition shadow-2xs"
                              title="Registrar nuevo Expediente Técnico Adicional"
                            >
                              <Plus className="w-2.5 h-2.5 text-amber-400" />
                              <span>Expediente</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenValoModal(p, "ampliacion");
                              }}
                              className="py-1 px-2 rounded-lg text-[9px] font-bold text-white bg-orange-600 hover:bg-orange-500 flex items-center justify-center gap-0.5 cursor-pointer transition shadow-2xs"
                              title="Registrar Ampliación de Plazo"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Ampliación</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
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
          {sortedAndGroupedProjects.map((p) => {
            const estadoInfo = getEstadoLabel(p.estado);
            const alertas = getAlertasNormativas(p);
            const pct = getProgresoPorcentaje(p.hitos);
            const checklistTheme = getChecklistColorTheme(p);
            const currentCat = detectProjectCategory(p.proyecto);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between ${checklistTheme.borderAccent} ${checklistTheme.outerGlow}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        CUI: {p.cui || "S/C"}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <span>{currentCat.icon}</span>
                        <span>{currentCat.shortLabel}</span>
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${checklistTheme.badge}`}
                    >
                      {checklistTheme.label}
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
                      <span className="text-slate-600">Cumplimiento Checklist Normativo:</span>
                      <span className={`font-mono ${checklistTheme.pct}`}>{pct}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden border ${checklistTheme.barTrack}`}>
                      <div
                        className={`h-full transition-all duration-300 ${checklistTheme.barFill}`}
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

                  {/* Checklist 1-Click Toggle Table with Dates & Direct Valorizaciones Access */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span>Checklist Normativo (Clic para abrir o marcar):</span>
                      <button
                        type="button"
                        onClick={() => handleOpenValoModal(p, "valorizacion")}
                        className="text-amber-600 hover:text-amber-700 font-black flex items-center gap-0.5 cursor-pointer lowercase"
                      >
                        <Calculator className="w-2.5 h-2.5" />
                        <span>+ valorización</span>
                      </button>
                    </div>

                    {p.hitos.map((hito) => {
                      const isValo = hito.tipo === "valorizacion" || hito.codigo.startsWith("VALO-");
                      const isExp = hito.tipo === "expediente" || hito.codigo.startsWith("EXP-");
                      const isAmp = hito.tipo === "ampliacion_plazo" || hito.codigo.startsWith("AMP-");

                      return (
                        <div
                          key={hito.id}
                          onClick={() => {
                            if (isValo) {
                              handleOpenValoModal(p, "valorizacion");
                            } else if (isExp) {
                              handleOpenValoModal(p, "expediente");
                            } else if (isAmp) {
                              handleOpenValoModal(p, "ampliacion");
                            } else {
                              handleOpenValoModal(p, "valorizacion");
                            }
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                            hito.cumplido
                              ? checklistTheme.tarjetaFulfilled
                              : checklistTheme.tarjetaPending
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHito(p.id, hito.id);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border cursor-pointer ${
                                hito.cumplido
                                  ? isValo
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : isExp
                                    ? "bg-amber-600 border-amber-600 text-white"
                                    : isAmp
                                    ? "bg-purple-600 border-purple-600 text-white"
                                    : "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-400 bg-white"
                              }`}
                              title="Marcar o desmarcar cumplimiento"
                            >
                              {hito.cumplido && <Check className="w-3 h-3" />}
                            </div>
                            <span className={`text-[11px] truncate ${hito.cumplido ? "font-semibold" : "font-normal"}`}>
                              {hito.nombre}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                            {hito.fecha && (
                              <span className="text-slate-500 bg-white px-1 rounded border border-slate-200">
                                {hito.fecha}
                              </span>
                            )}
                            <span className="font-bold text-slate-400">
                              {hito.codigo}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      Ver Ficha
                    </button>
                    <button
                      onClick={() => handleOpenValoModal(p, "valorizacion")}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      <Calculator className="w-3 h-3" />
                      + Valorización
                    </button>
                  </div>
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
      {/* VISTA: AVANCE & VALORIZACIONES                           */}
      {/* ======================================================== */}
      {activeView === "valorizaciones" && (
        <WorksValorizacionesView
          proyectos={proyectos}
          onOpenValorizacionModal={handleOpenValoModal}
          entityName={entityDisplayName}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE / EDICIÓN DEL PROYECTO SELECCIONADO        */}
      {/* ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      CUI: {selectedProject.cui || "S/C"}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <span>{detectProjectCategory(selectedProject.proyecto).icon}</span>
                      <span>{detectProjectCategory(selectedProject.proyecto).label}</span>
                    </span>
                  </div>
                  
                  {/* Encargado Selector Rápido */}
                  <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                    <User className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] text-slate-300 font-bold">Encargado:</span>
                    <select
                      value={selectedProject.encargado}
                      onChange={(e) => handleUpdateEncargado(selectedProject.id, e.target.value)}
                      className="bg-slate-900 text-amber-300 font-black text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                      title="Cambiar ingeniero encargado de esta obra (sincroniza en tiempo real)"
                    >
                      {allKnownEncargados.map((enc) => (
                        <option key={enc} value={enc}>
                          {enc}
                        </option>
                      ))}
                      <option value="-">SIN ASIGNAR (-)</option>
                    </select>
                  </div>

                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                    {selectedProject.estado.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="font-black text-base text-white">{selectedProject.proyecto}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* PANEL COMPARATIVO CLAVE DE AVANCES (DISTINCIÓN TÉCNICA OEI) */}
              {(() => {
                const avanceFis = getAvanceFisicoObra(selectedProject);
                const pctNormativo = getProgresoPorcentaje(selectedProject.hitos);
                const hitosCumplidosCount = selectedProject.hitos.filter((h) => h.cumplido).length;
                const hitosTotalCount = selectedProject.hitos.length;

                return (
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl text-white shadow-md border border-slate-700/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                          <span>Control Integral de Avance del Proyecto</span>
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded-full border border-slate-600 font-mono">
                          RLCE Art. 194 / Art. 198
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                        💡 % de Ficha (Hitos) ≠ % Avance Real de Obra en Terreno
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* CARD 1: Avance Físico Real de Obra */}
                      <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <span>🏗️ Avance Físico (Obra)</span>
                            </span>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
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
                            <span className="text-[10px] text-emerald-200/70 font-semibold">ejecutado real</span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-emerald-900 mt-1">
                            <div
                              className={`h-full transition-all ${
                                avanceFis.estadoFisico === "ATRASADA" ? "bg-rose-500" : "bg-emerald-400"
                              }`}
                              style={{ width: `${Math.min(100, avanceFis.porcentajeFisico)}%` }}
                            />
                          </div>

                          <div className="text-[9px] font-mono text-emerald-200/80 flex justify-between pt-1">
                            <span>Certif: {formatPEN(avanceFis.montoEjecutadoTotal)}</span>
                            <span>Monto: {formatPEN(selectedProject.contratoEjecucionMonto)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenValoModal(selectedProject, "valorizacion")}
                          className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Abrir Módulo de Valorizaciones</span>
                        </button>
                      </div>

                      {/* CARD 2: Avance Programado */}
                      <div className="bg-blue-950/60 border border-blue-500/40 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                              <span>📅 Avance Programado</span>
                            </span>
                            <span className="text-[8px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded">
                              Cronograma
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black font-mono text-blue-300">
                              {(avanceFis.porcentajeProgramado || 0).toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-blue-200/70 font-semibold">programado</span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-blue-900 mt-1">
                            <div
                              className="h-full bg-blue-400 transition-all"
                              style={{ width: `${Math.min(100, avanceFis.porcentajeProgramado || 0)}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[10px] font-medium text-slate-300 pt-1 border-t border-slate-700/50">
                          {avanceFis.porcentajeProgramado && avanceFis.porcentajeProgramado > 0 ? (
                            avanceFis.porcentajeFisico < avanceFis.porcentajeProgramado * 0.8 ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Alerta Art. 198: &lt; 80% programado</span>
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Ritmo de ejecución en plazo</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">Cronograma contractual vigente</span>
                          )}
                        </div>
                      </div>

                      {/* CARD 3: Ficha Normativa (Hitos de Gestión) */}
                      <div className="bg-purple-950/60 border border-purple-500/40 rounded-xl p-3 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                              <span>📋 Ficha Normativa</span>
                            </span>
                            <span className="text-[8px] font-mono font-bold text-purple-300 bg-purple-900/60 px-1.5 py-0.2 rounded border border-purple-700/50">
                              {hitosCumplidosCount} / {hitosTotalCount} Hitos
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black font-mono text-purple-300">
                              {pctNormativo}%
                            </span>
                            <span className="text-[10px] text-purple-200/70 font-semibold">trámites aprobados</span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-purple-900 mt-1">
                            <div
                              className="h-full bg-purple-400 transition-all"
                              style={{ width: `${pctNormativo}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-300 pt-1 border-t border-slate-700/50">
                          Hitos documentales y sustentos oficiales
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Checklist Section with Integrated Valorizaciones & Expedientes Toolbar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Checklist Normativo & Valorizaciones Integradas
                    </h4>
                    {(() => {
                      const theme = getChecklistColorTheme(selectedProject);
                      return (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${theme.badge}`}>
                          {theme.label}
                        </span>
                      );
                    })()}
                    <span className="font-mono font-black text-blue-700 text-xs">
                      {getProgresoPorcentaje(selectedProject.hitos)}% Cumplido
                    </span>
                  </div>

                  {/* Direct Action Buttons to Add Valorizaciones / Expedientes */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenValoModal(selectedProject, "valorizacion")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Agregar o tramitar valorización mensual con partidas"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Valorización</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenValoModal(selectedProject, "expediente")}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Registrar expediente técnico adicional o deductivo"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Expediente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenValoModal(selectedProject, "ampliacion")}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      title="Registrar ampliación de plazo aprobada"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Ampliación</span>
                    </button>
                  </div>
                </div>

                {(() => {
                  const drawerTheme = getChecklistColorTheme(selectedProject);
                  return (
                    <div className={`space-y-2 p-3 rounded-xl border transition ${drawerTheme.container} ${drawerTheme.outerGlow}`}>
                      {selectedProject.hitos.map((hito) => {
                        const isValo = hito.tipo === "valorizacion" || hito.codigo.startsWith("VALO-");
                        const isExp = hito.tipo === "expediente" || hito.codigo.startsWith("EXP-");
                        const isAmp = hito.tipo === "ampliacion_plazo" || hito.codigo.startsWith("AMP-");

                        return (
                          <div
                            key={hito.id}
                            className={`p-2.5 rounded-lg border transition ${
                              hito.cumplido
                                ? drawerTheme.tarjetaFulfilled
                                : drawerTheme.tarjetaPending
                            }`}
                          >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div
                            onClick={() => handleToggleHito(selectedProject.id, hito.id)}
                            className="flex items-start gap-2.5 cursor-pointer flex-1 select-none"
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 transition ${
                                hito.cumplido
                                  ? isValo
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                    : isExp
                                    ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                                    : isAmp
                                    ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                                    : "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : "border-slate-400 bg-white hover:border-blue-500"
                              }`}
                            >
                              {hito.cumplido && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="text-xs leading-tight font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{hito.nombre}</span>

                                {/* Classification Badges */}
                                {isValo ? (
                                  <span className="font-mono text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                                    VALORIZACIÓN
                                  </span>
                                ) : isExp ? (
                                  <span className="font-mono text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                    EXPEDIENTE
                                  </span>
                                ) : isAmp ? (
                                  <span className="font-mono text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-300">
                                    AMPLIACIÓN PLAZO
                                  </span>
                                ) : (
                                  <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {hito.codigo}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                {hito.baseLegal}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0" onClick={(e) => e.stopPropagation()}>
                            {/* Direct button to open valorizacion editor if it's a valo or exp */}
                            {isValo && (
                              <button
                                type="button"
                                onClick={() => handleOpenValoModal(selectedProject, "valorizacion")}
                                className="px-1.5 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 flex items-center gap-1 cursor-pointer"
                                title="Abrir planilla de partidas y cálculo de valorización"
                              >
                                <Calculator className="w-3 h-3 text-emerald-700" />
                                <span>Partidas</span>
                              </button>
                            )}

                            {isExp && (
                              <button
                                type="button"
                                onClick={() => handleOpenValoModal(selectedProject, "expediente")}
                                className="px-1.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 flex items-center gap-1 cursor-pointer"
                                title="Ver o editar datos del expediente técnico adicional"
                              >
                                <FileText className="w-3 h-3 text-amber-700" />
                                <span>Expediente</span>
                              </button>
                            )}

                            {/* Document attachment & Date row */}
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {/* Attached file badge if exists */}
                              {hito.adjuntoNombre && (
                                <span
                                  className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1"
                                  title={`Documento adjunto: ${hito.adjuntoNombre} (${hito.adjuntoTamano || "Adjuntado"})`}
                                >
                                  <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[85px]">{hito.adjuntoNombre}</span>
                                </span>
                              )}

                              {/* Upload attachment clip for this milestone */}
                              <label
                                className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                                title="Subir documento oficial probatorio (Resolución, Informe, Acta)"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAttachHitoFile(hito.id, file);
                                    if (e.target) e.target.value = "";
                                  }}
                                />
                              </label>

                              {/* Fecha asignada / emisión del documento */}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 shrink-0">Fecha:</span>
                                <input
                                  type="text"
                                  placeholder="DD/MM/AAAA"
                                  value={hito.fecha || ""}
                                  onChange={(e) =>
                                    handleUpdateHitoFecha(selectedProject.id, hito.id, e.target.value)
                                  }
                                  className="w-24 px-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none text-slate-800"
                                />
                                {!hito.fecha && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date().toLocaleDateString("es-PE");
                                      handleUpdateHitoFecha(selectedProject.id, hito.id, today);
                                    }}
                                    className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold px-1.5 py-1 rounded border border-amber-300 cursor-pointer"
                                    title="Asignar fecha de hoy"
                                  >
                                    Hoy
                                  </button>
                                )}
                              </div>

                              {/* Documento de la Entidad que Aprobó el Hito */}
                              <div className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="text-[10px] font-bold text-slate-600 shrink-0">Doc. Aprobación:</span>
                                <input
                                  type="text"
                                  placeholder="Ej: Res. N° 045 / Carta N° 12..."
                                  value={hito.documentoSustento || ""}
                                  onChange={(e) =>
                                    handleUpdateHitoDoc(selectedProject.id, hito.id, e.target.value)
                                  }
                                  className="w-36 sm:w-52 px-2 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none text-slate-900 placeholder-slate-400"
                                  title="Escribir con qué documento de la entidad se aprobó este hito"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

              {/* Fechas Clave con Adjuntos Probatorios y Sincronización Automática con el Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Fechas Clave y Documentos Probatorios por Evento</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Vinculación y sincronización automática al Checklist
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Evento 1: Notificación Supervisor (Previa a apertura) */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Notif. Supervisor (Previa)
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Carta / Oficio de Designación"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("notifSup", f);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedProject.hitos.find((h) => h.id === "hito-notif-sup")?.fecha || ""}
                      onChange={(e) => handleUpdateHitoFecha(selectedProject.id, "hito-notif-sup", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Carta / Oficio..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-notif-sup")?.documentoSustento || selectedProject.adjuntosEventos?.notifSup?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-notif-sup", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir con qué documento de la entidad se aprobó / comunicó"
                    />

                    {selectedProject.adjuntosEventos?.notifSup?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.notifSup.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Evento 2: Apertura de Obra / COD */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Apertura Obra / C.O.D.
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Acta de Apertura COD / Asiento 01"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("cod", f);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedProject.hitos.find((h) => h.id === "hito-cod")?.fecha || ""}
                      onChange={(e) => handleUpdateHitoFecha(selectedProject.id, "hito-cod", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Acta Apertura / COD..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-cod")?.documentoSustento || selectedProject.adjuntosEventos?.cod?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-cod", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir documento de apertura de obra"
                    />

                    {selectedProject.adjuntosEventos?.cod?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.cod.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Evento 3: Entrega Total de Terreno (Posterior a apertura) */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Entrega Total Terreno
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Acta de Entrega de Terreno"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("entregaTerreno", f, selectedProject.entregaTerrenoFecha);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedProject.entregaTerrenoFecha || ""}
                      onChange={(e) => handleUpdateProjectDateField("entregaTerrenoFecha", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Acta Entrega Terreno..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-terreno")?.documentoSustento || selectedProject.adjuntosEventos?.entregaTerreno?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-terreno", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir acta o resolución de entrega de terreno"
                    />

                    {selectedProject.adjuntosEventos?.entregaTerreno?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.entregaTerreno.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Evento 4: Inicio de Obra & Acta de Inicio */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Acta de Inicio de Obra
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Acta Oficial de Inicio de Obra"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("inicioObra", f, selectedProject.inicioObraFecha);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedProject.inicioObraFecha || ""}
                      onChange={(e) => handleUpdateProjectDateField("inicioObraFecha", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-800 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Acta Oficial de Inicio..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-acta-inicio")?.documentoSustento || selectedProject.adjuntosEventos?.inicioObra?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-acta-inicio", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir con qué documento / acta se inició la obra"
                    />

                    {selectedProject.adjuntosEventos?.inicioObra?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.inicioObra.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Plazo Contractual */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] text-slate-700 font-black block leading-tight">
                      Plazo Ejecución (Días)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={selectedProject.plazoDias || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || undefined;
                        const updated = { ...selectedProject, plazoDias: val };
                        setSelectedProject(updated);
                        setProyectos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Término Vigente */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] text-slate-700 font-black block leading-tight">
                      Fecha Término Vigente
                    </span>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={selectedProject.fechaTerminoActualizado || ""}
                      onChange={(e) => handleUpdateProjectDateField("fechaTerminoActualizado", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Suspensión de Plazo (Eventual) */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Suspensión de Plazo
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Acta de Suspensión de Plazo"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("suspension", f, selectedProject.suspensionFecha);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA (Opcional)"
                      value={selectedProject.suspensionFecha || ""}
                      onChange={(e) => handleUpdateProjectDateField("suspensionFecha", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Acta / Res. Suspensión..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-suspension")?.documentoSustento || selectedProject.adjuntosEventos?.suspension?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-suspension", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir con qué documento o resolución se aprobó la suspensión"
                    />

                    {selectedProject.adjuntosEventos?.suspension?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.suspension.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Reinicio de Obra */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-700 font-black block leading-tight">
                        Reinicio de Obra
                      </span>
                      <label
                        className="cursor-pointer text-slate-500 hover:text-amber-600 p-1 rounded hover:bg-slate-200 transition"
                        title="Subir Acta de Reinicio de Obra"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachEventFile("reinicio", f, selectedProject.reinicioFecha);
                            if (e.target) e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="DD/MM/AAAA (Opcional)"
                      value={selectedProject.reinicioFecha || ""}
                      onChange={(e) => handleUpdateProjectDateField("reinicioFecha", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Doc: Acta / Res. Reinicio..."
                      value={selectedProject.hitos.find((h) => h.id === "hito-reinicio")?.documentoSustento || selectedProject.adjuntosEventos?.reinicio?.nombre || ""}
                      onChange={(e) => handleUpdateHitoDoc(selectedProject.id, "hito-reinicio", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                      title="Escribir con qué documento o acta se reinició la obra"
                    />

                    {selectedProject.adjuntosEventos?.reinicio?.nombre && (
                      <div className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedProject.adjuntosEventos.reinicio.nombre}</span>
                      </div>
                    )}
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

              {/* Notice Feedback Banner */}
              {fichaSaveNotice && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    fichaSaveNotice.type === "success"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                      : "bg-rose-50 border-rose-300 text-rose-950 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {fichaSaveNotice.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{fichaSaveNotice.message}</span>
                  </div>
                  <button onClick={() => setFichaSaveNotice(null)} className="p-0.5 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions - Con Botón Principal 'Guardar datos actualizados' y 'Eliminar Obra' */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toDel = selectedProject;
                    setSelectedProject(null);
                    setObraToDelete(toDel);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Eliminar esta obra de la cartera"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Eliminar Obra</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContractScannerPreselectedObra(selectedProject);
                    setIsContractScannerModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Escanear contrato de obra o supervisión en PDF para actualizar esta obra"
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>Escanear Contrato PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenInObraSuite(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Abrir en Control de Obras</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingFichaAsync}
                  onClick={handleSaveFichaDatesAsync}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingFichaAsync ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-slate-950" />
                  )}
                  <span>{isSavingFichaAsync ? "Guardando en Base Municipal..." : "Guardar datos actualizados"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Integrado de Valorizaciones, Partidas & Expedientes */}
      {valModalProject && (
        <WorksValorizacionesIntegratedModal
          isOpen={true}
          onClose={() => setValModalProject(null)}
          project={valModalProject}
          onSaveProject={handleSaveUpdatedProject}
          initialTab={valModalTab}
        />
      )}

      {/* Modal Informativo & Drag-and-Drop de Carga Excel */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-950 text-white p-5 flex items-start justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <FileSpreadsheet className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Actualizar Base de Obras vía Excel</h3>
                  <p className="text-xs text-amber-400 font-medium">Carga masiva para {entityDisplayName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-slate-200">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Privacidad & Aislamiento Multi-Tenant:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  La base de datos de <strong>{entityDisplayName}</strong> se encuentra aislada de forma privada. Ninguna otra municipalidad o entidad externa tiene acceso ni visibilidad de sus registros.
                </p>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => {
                  excelInputRef.current?.click();
                  setIsExcelModalOpen(false);
                }}
                className="border-2 border-dashed border-amber-400 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70 rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto group-hover:scale-105 transition shadow-2xs">
                  <Upload className="w-6 h-6 text-amber-800" />
                </div>
                <div className="font-extrabold text-slate-900 text-sm">
                  Haz clic para seleccionar el archivo Excel (.xlsx / .xls / .csv)
                </div>
                <div className="text-[11px] text-slate-500">
                  El sistema actualizará automáticamente montos de ejecución, supervisión, contratistas, residentes y fechas clave.
                </div>
              </div>

              {/* Template Download Option */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">¿No tienes el formato oficial?</div>
                  <div className="text-[10px] text-slate-500">Descarga la plantilla con las columnas recomendadas.</div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplateXLSX}
                  className="bg-white border border-amber-400/60 hover:bg-amber-50 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Registrar o Modificar Obra en la Matriz */}
      <NewCarteraObraModal
        isOpen={isNewCarteraModalOpen}
        onClose={() => {
          setIsNewCarteraModalOpen(false);
          setEditingCarteraObra(null);
        }}
        onSaveObra={handleCreateNewObra}
        entityDisplayName={entityDisplayName}
        initialObra={editingCarteraObra}
      />

      {/* Modal Directo con Contratos (Contratista & Supervisión) */}
      <QuickContratosObraModal
        isOpen={isQuickContratosModalOpen}
        onClose={() => setIsQuickContratosModalOpen(false)}
        onSaveObra={handleCreateNewObra}
        entityDisplayName={entityDisplayName}
        availableObras={obrasList.map((o) => o.obra).filter(Boolean)}
      />

      {/* Modal Inteligente de Escaneo de Contratos de Obra & Supervisión (PDF) */}
      <ContractScannerCarteraModal
        isOpen={isContractScannerModalOpen}
        onClose={() => {
          setIsContractScannerModalOpen(false);
          setContractScannerPreselectedObra(null);
        }}
        proyectos={proyectos}
        preselectedObra={contractScannerPreselectedObra}
        onSaveObraFromScan={handleSaveObraFromContractScan}
        entityDisplayName={entityDisplayName}
      />

      {/* Modal de Confirmación para Eliminar Obra de la Matriz */}
      {obraToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900 text-base">¿Eliminar esta obra?</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Esta acción retirará la obra de la matriz municipal.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proyecto</div>
                  <div className="font-black text-slate-900 text-xs mt-0.5 leading-snug">
                    {obraToDelete.proyecto}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-medium">CUI: </span>
                    <strong className="font-mono text-slate-800">{obraToDelete.cui || "S/C"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Encargado: </span>
                    <strong className="text-slate-800">{obraToDelete.encargado || "-"}</strong>
                  </div>
                </div>
                {obraToDelete.contratoEjecucionNumero && (
                  <div className="text-[11px] pt-1">
                    <span className="text-slate-500 font-medium">Contrato Obra: </span>
                    <strong className="text-slate-800">{obraToDelete.contratoEjecucionNumero}</strong>
                  </div>
                )}
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                ¿Está seguro de que desea eliminar permanentemente esta obra de la cartera? La eliminación se actualizará en tiempo real para todos los usuarios.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingObra}
                onClick={() => setObraToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                No, cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingObra}
                onClick={handleConfirmDeleteObra}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingObra ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar obra</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
