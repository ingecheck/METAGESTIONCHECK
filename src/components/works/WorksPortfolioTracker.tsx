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
} from "../../types/seguimientoCartera";
import { ObraProyecto } from "../../types/obras";
import { LicenseSession } from "../../types/auth";
import { formatPEN } from "../../services/docxGenerator";
import { WorksValorizacionesIntegratedModal } from "./WorksValorizacionesIntegratedModal";
import { WorksValorizacionesView } from "./WorksValorizacionesView";
import { NewCarteraObraModal } from "./NewCarteraObraModal";
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
}

const LOCAL_STORAGE_KEY_BASE = "mgc_cartera_rioja_proyectos_v4";

export const WorksPortfolioTracker: React.FC<WorksPortfolioTrackerProps> = ({
  onSelectObra,
  onNavigateToTab,
  currentUser,
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
    ["JOSUE", "LUIS", "PICO", "PILCO", "JHON", "CARLOS", "WILSON", "VANESSA"].some((n) =>
      (currentUser?.userName || "").toUpperCase().includes(n)
    );

  // Selected entity key (Master Admin can switch between entities; municipality users are locked to their own)
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(() => {
    if (userIsRioja) return "RIOJA";
    return currentUser?.licenseKey || "CUSTOM_ENTITY";
  });

  const activeStorageKey =
    selectedEntityKey === "RIOJA"
      ? "mgc_cartera_rioja_proyectos_v4"
      : `mgc_cartera_${selectedEntityKey}_proyectos_v1`;

  const entityDisplayName = useMemo(() => {
    if (selectedEntityKey === "RIOJA") return "Municipalidad Provincial de Rioja (OEI)";
    if (currentUser?.companyName) return currentUser.companyName;
    return `Entidad ${selectedEntityKey}`;
  }, [selectedEntityKey, currentUser]);

  // Active member / user details for multi-user audit and attribution
  const activeMember =
    currentUser?.activeMemberId && currentUser?.teamMembers
      ? currentUser.teamMembers.find((m) => m.id === currentUser.activeMemberId)
      : null;
  const currentMemberName = activeMember?.name || currentUser?.userName || "Usuario Municipal";
  const currentMemberEmail = activeMember?.email || currentUser?.userEmail || "";

  const [lastSyncInfo, setLastSyncInfo] = useState<{
    lastUpdated: string;
    updatedBy: string;
    source?: string;
  } | null>(null);

  // Excel input ref & feedback notice
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load projects from localStorage or seed
  const [proyectos, setProyectos] = useState<ProyectoCartera[]>(() => {
    try {
      const saved =
        localStorage.getItem(activeStorageKey) ||
        (selectedEntityKey === "RIOJA" ? localStorage.getItem("mgc_cartera_rioja_proyectos_v3") : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading cartera from localStorage:", e);
    }
    return selectedEntityKey === "RIOJA" ? PROYECTOS_RIOJA_SEED : [];
  });

  // Real-time Firestore Multi-tenant Synchronization
  // Ensures that when Pilco, Luis, Jhon, Carlos, etc. upload an Excel, all members receive it live
  useEffect(() => {
    let isCancelled = false;

    // Initial check from Cloud Firestore
    loadCarteraFromFirestore(selectedEntityKey).then((cloudData) => {
      if (!isCancelled && cloudData && Array.isArray(cloudData.proyectos) && cloudData.proyectos.length > 0) {
        setProyectos(cloudData.proyectos);
        setLastSyncInfo({
          lastUpdated: cloudData.lastUpdated,
          updatedBy: cloudData.updatedBy,
          source: cloudData.source,
        });
      }
    });

    // Real-time subscription: when ANY member of this municipality updates or uploads an Excel,
    // all other members of this municipality receive the update instantly.
    // Other municipalities have their own isolated entityId and never see this data.
    const unsubscribe = subscribeToCartera(
      selectedEntityKey,
      (remotePayload) => {
        if (isCancelled) return;
        if (remotePayload && Array.isArray(remotePayload.proyectos)) {
          setProyectos(remotePayload.proyectos);
          setLastSyncInfo({
            lastUpdated: remotePayload.lastUpdated,
            updatedBy: remotePayload.updatedBy,
            source: remotePayload.source,
          });

          // If the update was made by another colleague in this municipality, notify on screen
          if (remotePayload.updatedBy && remotePayload.updatedBy !== currentMemberName) {
            setImportNotice({
              message: `🔄 Sincronización en Tiempo Real: ${remotePayload.updatedBy} acaba de actualizar la cartera de obras (${new Date(remotePayload.lastUpdated).toLocaleTimeString("es-PE")}).`,
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
  }, [selectedEntityKey, entityDisplayName, currentMemberName]);

  // Reload projects when switching entities (multi-tenant isolation)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(activeStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProyectos(parsed);
          return;
        }
      }
      setProyectos(selectedEntityKey === "RIOJA" ? PROYECTOS_RIOJA_SEED : []);
    } catch (e) {
      setProyectos(selectedEntityKey === "RIOJA" ? PROYECTOS_RIOJA_SEED : []);
    }
  }, [selectedEntityKey, activeStorageKey]);

  // Save to active storage key on change (local caching)
  useEffect(() => {
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(proyectos));
    } catch (e) {
      console.error("Error saving cartera:", e);
    }
  }, [proyectos, activeStorageKey]);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEncargado, setFilterEncargado] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterSoloAlertas, setFilterSoloAlertas] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"matriz" | "pipeline" | "cuadro_avance" | "valorizaciones">("matriz");

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
  const [editingCarteraObra, setEditingCarteraObra] = useState<ProyectoCartera | null>(null);

  // Dynamic Encargado editing state
  const [editingEncargadoId, setEditingEncargadoId] = useState<number | null>(null);
  const [customEncargadoText, setCustomEncargadoText] = useState<string>("");

  // List of all known encargados across projects + common defaults
  const allKnownEncargados = useMemo(() => {
    const defaultSet = new Set(["JHON", "JHENIFER", "JEZER", "JOSUE", "LUIS", "PICO", "CARLOS", "MARIELA", "EDSON"]);
    proyectos.forEach((p) => {
      if (p.encargado && p.encargado.trim() && p.encargado !== "-") {
        defaultSet.add(p.encargado.trim().toUpperCase());
      }
    });
    return Array.from(defaultSet);
  }, [proyectos]);

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

  // Download official Excel template
  const handleDownloadTemplateXLSX = () => {
    const templateRows = [
      {
        ID: 1,
        ENCARGADO: "JHON",
        PROYECTO: "MEJORAMIENTO Y AMPLIACIÓN DE SERVICIOS VIALES URBANOS",
        CUI: "2650123",
        "CONTRATO EJECUCION": "CONTRATO N° 045-2026-GAF/MPR",
        "MONTO EJECUCION": 2450000.50,
        CONTRATISTA: "CONSORCIO VIAL NORTE",
        RESIDENTE: "Ing. Juan Pérez Flores (CIP 182934)",
        "CONTRATO SUPERVISION": "ORDEN DE SERVICIO N° 089-2026",
        "MONTO SUPERVISION": 125000.00,
        SUPERVISOR: "Ing. Carlos Mendoza (CIP 178290)",
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

          // Match with existing to retain hitos, valorizaciones, expedientes and ampliaciones
          const existingProj = proyectos.find((p) => p.id === projId || p.cui === cuiCode);

          let estado: EstadoCartera = existingProj?.estado || "ACTOS_PREPARATORIOS";
          if (observaciones.toUpperCase().includes("FINALIZ") || observaciones.toUpperCase().includes("RECEPCION")) {
            estado = "FINALIZADA_LIQUIDADA";
          } else if (inicioObra && inicioObra !== "-") {
            estado = "EN_EJECUCION";
          } else if (rawContratoObra && rawContratoObra !== "-") {
            estado = "PENDIENTE_INICIO_CONDICIONES";
          }

          importedList.push({
            id: projId,
            encargado: encargado || existingProj?.encargado || "-",
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
            hitos: existingProj?.hitos || PROYECTOS_RIOJA_SEED[0]?.hitos || [],
            valorizaciones: existingProj?.valorizaciones || [],
            expedientes: existingProj?.expedientes || [],
            ampliacionesPlazo: existingProj?.ampliacionesPlazo || [],
          });
        });

        if (importedList.length > 0) {
          setProyectos(importedList);
          // Save to Firestore in real time: triggers onSnapshot for ALL team members of this municipality
          saveCarteraToFirestore(
            selectedEntityKey,
            importedList,
            currentMemberName,
            currentMemberEmail,
            "excel_upload"
          );
          setLastSyncInfo({
            lastUpdated: new Date().toISOString(),
            updatedBy: currentMemberName,
            source: "excel_upload",
          });
          setImportNotice({
            message: `¡Éxito! Se han importado ${importedList.length} obras y se han sincronizado en tiempo real para todos los integrantes de ${entityDisplayName}.`,
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

  // Statistics & KPIs
  const stats = useMemo(() => {
    const total = proyectos.length;
    const montoTotal = proyectos.reduce((sum, p) => sum + (p.contratoEjecucionMonto || 0), 0);
    const montoSupervision = proyectos.reduce((sum, p) => sum + (p.contratoSupervisionMonto || 0), 0);
    const totalEjecutadoFisico = proyectos.reduce((sum, p) => sum + getAvanceFisicoObra(p).montoEjecutadoTotal, 0);
    const avanceFisicoPromedio = montoTotal > 0 ? Math.round((totalEjecutadoFisico / montoTotal) * 10000) / 100 : 0;
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
      totalEjecutadoFisico,
      avanceFisicoPromedio,
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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-amber-400" />
                <span>Seguimiento de Obras & Control Normativo</span>
              </h1>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                {stats.total} Obras
              </span>
            </div>

            {/* Multi-tenant Isolation Badge */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {selectedEntityKey === "RIOJA"
                    ? "Espacio Privado: Municipalidad Provincial de Rioja (Acceso Exclusivo OEI • Pilco, Luis, Jhon)"
                    : `Espacio Privado: ${entityDisplayName} (Aislamiento de Datos Activo)`}
                </span>
              </span>
            </div>

            {/* Entity Switcher for Master Admin only */}
            {isMasterAdmin && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Cambiar Entidad:
                </span>
                <select
                  value={selectedEntityKey}
                  onChange={(e) => setSelectedEntityKey(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:border-amber-400 focus:outline-none"
                >
                  <option value="RIOJA">🏛️ Municipalidad Provincial de Rioja</option>
                  <option value="LIC-MUNI-CHICLAYO-2026">🏛️ Municipalidad Provincial de Chiclayo</option>
                  {currentUser?.licenseKey && currentUser.licenseKey !== "ADMIN-OSCE-MASTER-2026" && (
                    <option value={currentUser.licenseKey}>
                      🏢 {currentUser.companyName || currentUser.licenseKey}
                    </option>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            {/* New Obra Button - Corporate Amber Accent */}
            <button
              onClick={() => setIsNewCarteraModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              title="Registrar una nueva obra en la matriz de seguimiento municipal"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Nueva Obra</span>
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

            {/* Template Download Button */}
            <button
              onClick={handleDownloadTemplateXLSX}
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar plantilla Excel modelo pre-formateada"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Plantilla Excel</span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={handleExportXLSX}
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar matriz completa en formato Excel nativo (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleResetSeed}
              className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Restaurar lista oficial predeterminada de la entidad"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurar</span>
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

        {/* KPI Counter Cards - Compact & Snappy */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Cartera Total</div>
            <div className="text-base font-black text-white mt-0.5">{stats.total} Proyectos</div>
            <div className="text-[10px] text-blue-300 font-mono mt-0.5">{formatPEN(stats.montoTotal)}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-amber-300 uppercase">Actos Preparatorios</div>
            <div className="text-base font-black text-amber-400 mt-0.5">{stats.actosPrep}</div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">TDR / Bases / SEACE</div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-rose-300 uppercase">Pendiente Inicio</div>
            <div className="text-base font-black text-rose-400 mt-0.5">{stats.pendienteInicio}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Art. 176 RLCE</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-blue-300 uppercase">En Ejecución</div>
            <div className="text-base font-black text-blue-400 mt-0.5">{stats.enEjecucion}</div>
            <div className="text-[10px] text-blue-200/80 mt-0.5">Obras en Campo</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
            <div className="text-[10px] font-semibold text-emerald-300 uppercase">Finalizadas / Recep.</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">{stats.finalizadas}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">Acta / Liquidación</div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 p-2.5 rounded-xl">
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
              onClick={() => setActiveView("cuadro_avance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === "cuadro_avance"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeView === "cuadro_avance" ? "text-slate-950" : "text-amber-600"}`} />
              Cuadro Situacional
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
            {["TODOS", "JOSUE", "LUIS", "PICO", "JHON", "JHENIFER", "JEZER", "SIN_ASIGNAR"].map((enc) => (
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewCarteraModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Registrar una nueva obra en la matriz de seguimiento"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>+ Agregar Obra a Matriz</span>
              </button>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                💡 Haz clic en cualquier casilla o fila para abrir y actualizar datos al instante.
              </div>
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
                  <th className="p-2.5 border-r border-slate-800 text-center w-14">ID / EDIT</th>
                  <th className="p-2.5 border-r border-slate-800 w-32">ENCARGADO (OEI)</th>
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
                  <th className="p-2.5 text-center min-w-[320px]">
                    AVANCE FÍSICO REAL (OBRA) vs FICHA NORMATIVA (ADMINISTRATIVO)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredProjects.map((p) => {
                  const estadoInfo = getEstadoLabel(p.estado);
                  const alertas = getAlertasNormativas(p);
                  const pct = getProgresoPorcentaje(p.hitos);
                  const avanceFisico = getAvanceFisicoObra(p);

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
                      {/* ID y Botón Editar Obra */}
                      <td
                        className="p-2 font-bold text-center font-mono text-slate-700 bg-slate-50 group-hover:bg-blue-100/50 border-r border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs">{p.id}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCarteraObra(p);
                              setIsNewCarteraModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer shadow-2xs flex items-center gap-0.5"
                            title="Modificar todos los datos de esta obra (contratos, montos, plazos, personal)"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Editar</span>
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
                                  : p.encargado === "PICO"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
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

                      {/* PROYECTO & CUI & ESTADO (Editable directamente) */}
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {p.proyecto}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            CUI: {p.cui}
                          </span>
                          <select
                            value={p.estado}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateEstado(p.id, e.target.value as EstadoCartera)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none ${estadoInfo.bg} ${estadoInfo.color} ${estadoInfo.border}`}
                            title="Cambiar estado situacional de la obra"
                          >
                            <option value="ACTOS_PREPARATORIOS">Actos Preparatorios</option>
                            <option value="EN_SELECCION_SEACE">En Selección (SEACE)</option>
                            <option value="PENDIENTE_INICIO_CONDICIONES">Pendiente Inicio (Art. 176)</option>
                            <option value="EN_EJECUCION">En Ejecución de Obra</option>
                            <option value="RECEPCIONADA">Recepcionada</option>
                            <option value="FINALIZADA_LIQUIDADA">Liquidada / Finalizada</option>
                          </select>
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
                        className="p-2.5 bg-slate-50/80 group-hover:bg-blue-50/40 transition"
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

                          {/* 2. SECCIÓN B: Ficha Normativa (Cumplimiento de Hitos Administrativos) */}
                          <div className="bg-purple-50/60 p-2 rounded-xl border border-purple-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-extrabold text-purple-950 flex items-center gap-1">
                                <span>📋 Ficha Normativa:</span>
                                <span className="font-normal text-[8px] text-purple-700">
                                  ({p.hitos.filter((h) => h.cumplido).length}/{p.hitos.length} hitos)
                                </span>
                              </span>
                              <span className="font-mono font-black text-purple-800">{pct}%</span>
                            </div>

                            {/* Progress Bar for Normative Checklist */}
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-purple-200">
                              <div
                                className="h-full bg-purple-600 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Checklist Items with Visibly Formatted Document & Emission Dates */}
                            <div className="grid grid-cols-2 gap-1 pt-0.5">
                              {/* 1. Notif Supervisor */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenValoModal(p, "valorizacion");
                                }}
                                className={`p-1.5 rounded text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoNotifSup?.cumplido
                                    ? "bg-white text-slate-900 border-amber-300/90 hover:bg-amber-50"
                                    : "bg-white/60 text-slate-500 border-slate-200 hover:border-amber-400"
                                }`}
                                title={`Notificación al Supervisor (Art. 176.1.a) • Doc: ${hitoNotifSup?.documentoSustento || "No especificado"} • Fecha: ${hitoNotifSup?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate text-amber-900 font-extrabold">1. Notif. Sup</span>
                                  <span className="font-mono text-[8px] text-slate-500">
                                    {hitoNotifSup?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoNotifSup?.documentoSustento ? (
                                  <span className="font-mono text-[7px] text-slate-600 truncate bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                    📄 {hitoNotifSup.documentoSustento}
                                  </span>
                                ) : (
                                  <span className="text-[7px] text-slate-400 font-normal">
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
                                className={`p-1.5 rounded text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoTerreno?.cumplido
                                    ? "bg-white text-slate-900 border-amber-300/90 hover:bg-amber-50"
                                    : "bg-white/60 text-slate-500 border-slate-200 hover:border-amber-400"
                                }`}
                                title={`Entrega de Terreno (Art. 176.1.b) • Doc: ${hitoTerreno?.documentoSustento || "No especificado"} • Fecha: ${hitoTerreno?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate text-amber-900 font-extrabold">2. Terreno</span>
                                  <span className="font-mono text-[8px] text-slate-500">
                                    {hitoTerreno?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoTerreno?.documentoSustento ? (
                                  <span className="font-mono text-[7px] text-slate-600 truncate bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                    📄 {hitoTerreno.documentoSustento}
                                  </span>
                                ) : (
                                  <span className="text-[7px] text-slate-400 font-normal">
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
                                className={`p-1.5 rounded text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoExpediente?.cumplido
                                    ? "bg-white text-slate-900 border-amber-300/90 hover:bg-amber-50"
                                    : "bg-white/60 text-slate-500 border-slate-200 hover:border-amber-400"
                                }`}
                                title={`Entrega Expediente Técnico (Art. 176.1.c) • Doc: ${hitoExpediente?.documentoSustento || "No especificado"} • Fecha: ${hitoExpediente?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate text-amber-900 font-extrabold">3. Expediente</span>
                                  <span className="font-mono text-[8px] text-slate-500">
                                    {hitoExpediente?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoExpediente?.documentoSustento ? (
                                  <span className="font-mono text-[7px] text-slate-600 truncate bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                    📄 {hitoExpediente.documentoSustento}
                                  </span>
                                ) : (
                                  <span className="text-[7px] text-slate-400 font-normal">
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
                                className={`p-1.5 rounded text-[9px] font-bold border flex flex-col gap-0.5 cursor-pointer transition ${
                                  hitoCod?.cumplido
                                    ? "bg-white text-slate-900 border-amber-300/90 hover:bg-amber-50"
                                    : "bg-white/60 text-slate-500 border-slate-200 hover:border-amber-400"
                                }`}
                                title={`Cuaderno de Obra Digital (Art. 176.1.d) • Doc: ${hitoCod?.documentoSustento || "No especificado"} • Fecha: ${hitoCod?.fecha || "Sin fecha"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate text-amber-900 font-extrabold">4. C.O.D.</span>
                                  <span className="font-mono text-[8px] text-slate-500">
                                    {hitoCod?.fecha || "-"}
                                  </span>
                                </div>
                                {hitoCod?.documentoSustento ? (
                                  <span className="font-mono text-[7px] text-slate-600 truncate bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                    📄 {hitoCod.documentoSustento}
                                  </span>
                                ) : (
                                  <span className="text-[7px] text-slate-400 font-normal">
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
                                  className="px-2 py-1 rounded-lg bg-amber-50 text-slate-900 border border-amber-300/80 text-[9px] font-bold flex items-center justify-between gap-1 cursor-pointer hover:bg-amber-100 transition shadow-2xs"
                                  title={`Valorización N° ${val.numero} • Fecha de Emisión: ${val.fechaValorizacion || "-"}`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded text-[7px] uppercase font-black tracking-wider">
                                      Valorización
                                    </span>
                                    <span className="truncate font-extrabold">Val N° 0{val.numero}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[8px]">
                                    <span className="text-slate-600 font-semibold">{val.fechaValorizacion ? `Emisión: ${val.fechaValorizacion}` : "-"}</span>
                                    <span className="text-amber-900 font-black">{formatPEN(val.montoEjecutadoMes || 0)}</span>
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
                                      ? "bg-amber-50 text-slate-900 border-amber-300"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-amber-400"
                                  }`}
                                  title="Valorización N° 01 • Clic para registrar cálculo de avance y partidas"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded text-[7px] uppercase font-black">
                                      Valorización
                                    </span>
                                    <span className="truncate">Val N° 01 (Art. 194)</span>
                                  </div>
                                  <span className="font-mono text-[8px] text-amber-900 font-bold shrink-0">
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
                              ? isValo
                                ? "bg-amber-50 text-slate-900 border-amber-300 font-semibold"
                                : isExp
                                ? "bg-slate-900 text-amber-300 border-slate-700 font-semibold"
                                : isAmp
                                ? "bg-orange-50 text-orange-950 border-orange-300 font-semibold"
                                : "bg-amber-50/60 border-amber-200 text-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50/50 hover:border-amber-300"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {["JOSUE", "LUIS", "PICO", "JHON", "JHENIFER", "JEZER"].map((enc) => {
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
      {/* VISTA 4: AVANCE & VALORIZACIONES                         */}
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
                  <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    ID #{selectedProject.id} • CUI {selectedProject.cui}
                  </span>
                  
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Checklist Normativo & Valorizaciones Integradas
                    </h4>
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

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedProject.hitos.map((hito) => {
                    const isValo = hito.tipo === "valorizacion" || hito.codigo.startsWith("VALO-");
                    const isExp = hito.tipo === "expediente" || hito.codigo.startsWith("EXP-");
                    const isAmp = hito.tipo === "ampliacion_plazo" || hito.codigo.startsWith("AMP-");

                    return (
                      <div
                        key={hito.id}
                        className={`p-2.5 rounded-lg border transition ${
                          hito.cumplido
                            ? isValo
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                              : isExp
                              ? "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold"
                              : isAmp
                              ? "bg-purple-50/80 border-purple-300 text-purple-950 font-semibold"
                              : "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                            : "bg-white border-slate-200 text-slate-700"
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

            {/* Modal Actions - Con Botón Principal 'Guardar datos actualizados' */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
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
    </div>
  );
};
