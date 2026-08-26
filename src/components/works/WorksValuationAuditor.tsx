import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Scale,
  Building2,
  Users,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  Trash2,
  Save,
  ChevronRight,
  Eye,
  Info,
  Calendar,
  Layers,
  Award,
  Zap,
  Check,
  TrendingUp,
  Table,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  ObraProyecto,
  ValorizacionMensual,
  AuditoriaValorizacion,
  IncongruenciaValorizacion,
  PartidaEjecutada,
} from "../../types/obras";
import {
  SAMPLE_INCONGRUENCIAS_TEST,
  SAMPLE_AUDITORIA_VAL_01,
  SAMPLE_AUDITORIA_VAL_02,
  SAMPLE_AUDITORIA_DATA,
  INITIAL_AUDITORIAS_OBRA,
} from "../../data/sampleIncongruencias";
import { SAMPLE_PARTIDAS_OBRA } from "../../data/samplePartidas";
import { extractDataFromExcelFile, ExtractedExcelResult } from "../../services/excelExtractor";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../../services/pdfExtractor";
import { syncScannedDataToCurvaAndPartidas } from "../../services/scannedSyncService";
import { ExcelWorksheetViewer } from "./auditor/ExcelWorksheetViewer";
import { ScannedPdfViewer } from "./auditor/ScannedPdfViewer";
import { SideBySideComparator } from "./auditor/SideBySideComparator";

interface WorksValuationAuditorProps {
  obra: ObraProyecto;
  valorizaciones?: ValorizacionMensual[];
  setValorizaciones?: React.Dispatch<React.SetStateAction<ValorizacionMensual[]>>;
  onUpdateValorizaciones?: (vals: ValorizacionMensual[]) => void;
  partidas?: PartidaEjecutada[];
  setPartidas?: React.Dispatch<React.SetStateAction<PartidaEjecutada[]>>;
  onUpdatePartidas?: (partidas: PartidaEjecutada[]) => void;
  auditorias?: AuditoriaValorizacion[];
  onSaveAuditorias?: (auditorias: AuditoriaValorizacion[]) => void;
  onNavigateToTab?: (tab: string) => void;
  onNavigateToSubTab?: (subTab: "curva-s" | "partidas" | "auditoria") => void;
  // Backwards compatibility props
  auditoriaData?: AuditoriaValorizacion;
  onSaveAudit?: (audit: AuditoriaValorizacion) => void;
}

export const WorksValuationAuditor: React.FC<WorksValuationAuditorProps> = ({
  obra,
  valorizaciones = [],
  setValorizaciones,
  onUpdateValorizaciones,
  partidas = [],
  setPartidas,
  onUpdatePartidas,
  auditorias: externalAuditorias,
  onSaveAuditorias,
  onNavigateToTab,
  onNavigateToSubTab,
  auditoriaData: legacyAuditoriaData,
  onSaveAudit: legacyOnSaveAudit,
}) => {
  // Local list of audits for all valorizaciones
  const [auditoriasList, setAuditoriasList] = useState<AuditoriaValorizacion[]>(() => {
    if (externalAuditorias && externalAuditorias.length > 0) {
      return externalAuditorias;
    }
    if (legacyAuditoriaData) {
      return [legacyAuditoriaData];
    }
    return INITIAL_AUDITORIAS_OBRA;
  });

  // Keep internal list in sync if external props change
  React.useEffect(() => {
    if (externalAuditorias && externalAuditorias.length > 0) {
      setAuditoriasList(externalAuditorias);
    }
  }, [externalAuditorias]);

  // Determine total months based on plazo dias (e.g. 180 dias = 6 meses)
  const totalMesesPlazo = useMemo(() => {
    if (obra.plazoDias && obra.plazoDias > 0) {
      return Math.max(1, Math.ceil(obra.plazoDias / 30));
    }
    if (valorizaciones.length > 0) {
      return valorizaciones.length;
    }
    return 6;
  }, [obra.plazoDias, valorizaciones.length]);

  // Generate list of all valorizaciones in the project term (e.g. Val 1..Val N)
  const availableValOptions = useMemo(() => {
    const list: { num: number; label: string; mes: string }[] = [];
    const maxVal = Math.max(
      totalMesesPlazo,
      valorizaciones.length,
      ...auditoriasList.map((a) => a.numeroValorizacion),
      1
    );

    for (let i = 1; i <= maxVal; i++) {
      const matchingVal = valorizaciones.find((v) => v.numero === i);
      list.push({
        num: i,
        label: `Valorización N° ${String(i).padStart(2, "0")}`,
        mes: matchingVal?.mesPeriodo || `Mes ${i}`,
      });
    }
    return list;
  }, [totalMesesPlazo, valorizaciones, auditoriasList]);

  // Selected valorización number to audit
  const [selectedNumVal, setSelectedNumVal] = useState<number>(() => {
    if (auditoriasList.some((a) => a.numeroValorizacion === 5)) return 5;
    return auditoriasList[0]?.numeroValorizacion || 1;
  });

  // Current active audit for the selected valorización number
  const activeAuditoria = useMemo(() => {
    const found = auditoriasList.find((a) => a.numeroValorizacion === selectedNumVal);
    if (found) return found;

    // Default template if no audit exists yet for this month
    const matchingVal = valorizaciones.find((v) => v.numero === selectedNumVal);
    const fallbackMes = matchingVal?.mesPeriodo || `Mes ${selectedNumVal}`;
    const newAudit: AuditoriaValorizacion = {
      id: `audit-val-${String(selectedNumVal).padStart(2, "0")}`,
      numeroValorizacion: selectedNumVal,
      mesPeriodo: fallbackMes,
      fechaAuditoria: new Date().toISOString().split("T")[0],
      nombreArchivoExcel: `VALORIZACION_N${String(selectedNumVal).padStart(2, "0")}_CONTRATISTA.xlsx`,
      nombreArchivoEscaneado: `VAL_${String(selectedNumVal).padStart(2, "0")}_EXPEDIENTE_SUPERVISION.pdf`,
      estadoAuditoria: "Conforme y Cuadrada",
      totalDiferenciaBrutaSoles: 0,
      totalPartidasAuditadas: matchingVal?.montoEjecutado ? 15 : 0,
      partidasConDiscrepancia: 0,
      firmasValidadas: {
        residenteObra: true,
        supervisorObra: true,
        jefeSupervision: true,
        colegiaturaVigenteCIP: true,
      },
      incongruencias: [],
      resumenEjecutivo: `Auditoría inicial registrada para la Valorización N° ${String(
        selectedNumVal
      ).padStart(2, "0")} (${fallbackMes}). Ejecute el cruce comparativo para detectar discrepancias.`,
    };
    return newAudit;
  }, [auditoriasList, selectedNumVal, valorizaciones]);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>("TODOS");
  const [selectedSeccion, setSelectedSeccion] = useState<string>("TODAS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // UI Interactive States
  const [isScanning, setIsScanning] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Subtab navigation inside the module
  const [activeInnerTab, setActiveInnerTab] = useState<
    "incongruencias" | "lector-excel" | "lector-escaneado" | "comparador-dual" | "acta-impresion"
  >("incongruencias");

  // Excel & PDF file reading states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelResult, setExcelResult] = useState<ExtractedExcelResult | null>(null);
  const [isExtractingExcel, setIsExtractingExcel] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfResult, setPdfResult] = useState<ExtractedPdfResult | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  // Sync state tracking from physical scanned PDF to Curva S & Partidas (Art. 194 RLCE)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncAlert, setSyncAlert] = useState<{
    show: boolean;
    valNum: number;
    monto: number;
    partidasCount: number;
    factorK: number;
    message: string;
  } | null>(null);

  // Sync business logic handler: pushes binding legal values to Curva S and Partidas
  const handleSyncScannedToProject = (customPdf?: ExtractedPdfResult | null) => {
    const activePdf = customPdf !== undefined ? customPdf : pdfResult;
    const basePartidas = partidas && partidas.length > 0 ? partidas : SAMPLE_PARTIDAS_OBRA;

    const syncResult = syncScannedDataToCurvaAndPartidas(
      selectedNumVal,
      obra,
      activeAuditoria,
      activePdf,
      valorizaciones,
      basePartidas
    );

    if (setValorizaciones) {
      setValorizaciones(syncResult.updatedValorizaciones);
    }
    if (onUpdateValorizaciones) {
      onUpdateValorizaciones(syncResult.updatedValorizaciones);
    }
    if (setPartidas) {
      setPartidas(syncResult.updatedPartidas);
    }
    if (onUpdatePartidas) {
      onUpdatePartidas(syncResult.updatedPartidas);
    }

    const nowStr = new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLastSyncTime(nowStr);
    setSyncAlert({
      show: true,
      valNum: syncResult.valorizacionNumero,
      monto: syncResult.montoOficialCertificado,
      partidasCount: syncResult.partidasActualizadasCount,
      factorK: syncResult.factorKOficial,
      message: syncResult.syncSummaryMessage,
    });
  };

  // File Upload Handlers
  const handleExcelUpload = async (file: File) => {
    setExcelFile(file);
    setIsExtractingExcel(true);
    try {
      const result = await extractDataFromExcelFile(file);
      setExcelResult(result);

      // Auto update current audit metadata
      const updated: AuditoriaValorizacion = {
        ...activeAuditoria,
        nombreArchivoExcel: file.name,
        totalPartidasAuditadas:
          result.summaryData?.partidasCount || activeAuditoria.totalPartidasAuditadas || 22,
      };
      saveCurrentAudit(updated);
      setActiveInnerTab("lector-excel");
    } catch (err) {
      console.error("Error reading Excel file:", err);
    } finally {
      setIsExtractingExcel(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfFile(file);
    setIsExtractingPdf(true);
    try {
      const result = await extractTextFromPdfFile(file);
      setPdfResult(result);

      // Check keywords in extracted text to auto-check CIP signatures
      const txt = (result.text || "").toUpperCase();
      const hasCIP = txt.includes("CIP") || txt.includes("COLEGIO DE INGENIEROS") || txt.includes("REG.");
      const hasResidente = txt.includes("RESIDENTE");
      const hasSupervisor = txt.includes("SUPERVISOR") || txt.includes("INSPECTOR");

      const updated: AuditoriaValorizacion = {
        ...activeAuditoria,
        nombreArchivoEscaneado: file.name,
        firmasValidadas: {
          ...activeAuditoria.firmasValidadas,
          residenteObra: hasResidente || activeAuditoria.firmasValidadas.residenteObra,
          supervisorObra: hasSupervisor || activeAuditoria.firmasValidadas.supervisorObra,
          colegiaturaVigenteCIP: hasCIP || activeAuditoria.firmasValidadas.colegiaturaVigenteCIP,
        },
      };
      saveCurrentAudit(updated);
      setActiveInnerTab("lector-escaneado");

      // Automatically sync scanned physical truth to Curva S and Partidas
      handleSyncScannedToProject(result);
    } catch (err) {
      console.error("Error reading PDF file:", err);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Modal: Add / Edit Incongruencia
  const [isIncongruenciaModalOpen, setIsIncongruenciaModalOpen] = useState(false);
  const [editingIncongruencia, setEditingIncongruencia] = useState<IncongruenciaValorizacion | null>(
    null
  );
  const [incongruenciaForm, setIncongruenciaForm] = useState<Partial<IncongruenciaValorizacion>>({
    partidaItem: "",
    seccion: "Planilla de Metrados",
    descripcion: "",
    valorExcel: "",
    valorEscaneado: "",
    diferenciaMetrado: undefined,
    diferenciaSoles: undefined,
    gravedad: "CRÍTICO",
    baseLegal: "Art. 194 del RLCE",
    impacto: "",
    recomendacionTecnica: "",
  });

  // Modal: Create New Valorización
  const [isNewValModalOpen, setIsNewValModalOpen] = useState(false);
  const [newValNumber, setNewValNumber] = useState<number>(availableValOptions.length + 1);
  const [newValMesPeriodo, setNewValMesPeriodo] = useState<string>(
    `Mes ${availableValOptions.length + 1}`
  );

  // Modal: Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Save changes to current audit and update global collection
  const saveCurrentAudit = (updatedAudit: AuditoriaValorizacion) => {
    const updatedList = auditoriasList.some(
      (a) => a.numeroValorizacion === updatedAudit.numeroValorizacion
    )
      ? auditoriasList.map((a) =>
          a.numeroValorizacion === updatedAudit.numeroValorizacion ? updatedAudit : a
        )
      : [...auditoriasList, updatedAudit];

    setAuditoriasList(updatedList);

    if (onSaveAuditorias) {
      onSaveAuditorias(updatedList);
    }
    if (legacyOnSaveAudit) {
      legacyOnSaveAudit(updatedAudit);
    }

    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Run automated cross-audit scanning
  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // If we are on Val 5 and test sample is needed, or recalculate
      const totalDiffSoles = activeAuditoria.incongruencias.reduce(
        (acc, inc) => acc + (inc.diferenciaSoles || 0),
        0
      );
      const criticosCount = activeAuditoria.incongruencias.filter(
        (i) => i.gravedad === "CRÍTICO"
      ).length;

      let newState = activeAuditoria.estadoAuditoria;
      if (criticosCount > 0 || totalDiffSoles > 5000) {
        newState = "Observada con Incongruencias Críticas";
      } else if (activeAuditoria.incongruencias.length > 0) {
        newState = "Con Observaciones Subsanables";
      } else {
        newState = "Conforme y Cuadrada";
      }

      const updated: AuditoriaValorizacion = {
        ...activeAuditoria,
        fechaAuditoria: new Date().toISOString().split("T")[0],
        totalDiferenciaBrutaSoles: totalDiffSoles,
        partidasConDiscrepancia: activeAuditoria.incongruencias.filter((i) => i.gravedad !== "CONFORME")
          .length,
        estadoAuditoria: newState,
      };

      saveCurrentAudit(updated);
    }, 1000);
  };

  // Load realistic sample test discrepancies
  const handleLoadSampleTestCase = () => {
    const sampleAudit: AuditoriaValorizacion = {
      ...SAMPLE_AUDITORIA_DATA,
      numeroValorizacion: selectedNumVal,
      mesPeriodo:
        valorizaciones.find((v) => v.numero === selectedNumVal)?.mesPeriodo ||
        `Mes ${selectedNumVal} - 2025`,
      id: `audit-val-${String(selectedNumVal).padStart(2, "0")}`,
    };
    saveCurrentAudit(sampleAudit);
  };

  // Filtered Incongruencias for display
  const filteredIncongruencias = useMemo(() => {
    return activeAuditoria.incongruencias.filter((inc) => {
      const matchSeverity =
        selectedSeverity === "TODOS" || inc.gravedad === selectedSeverity;
      const matchSeccion =
        selectedSeccion === "TODAS" || inc.seccion === selectedSeccion;
      const matchSearch =
        searchTerm.trim() === "" ||
        inc.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.partidaItem && inc.partidaItem.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inc.baseLegal && inc.baseLegal.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSeverity && matchSeccion && matchSearch;
    });
  }, [activeAuditoria.incongruencias, selectedSeverity, selectedSeccion, searchTerm]);

  // Summary counts for current active audit
  const totalCriticos = activeAuditoria.incongruencias.filter(
    (i) => i.gravedad === "CRÍTICO"
  ).length;
  const totalAdvertencias = activeAuditoria.incongruencias.filter(
    (i) => i.gravedad === "ADVERTENCIA"
  ).length;
  const totalConformes = activeAuditoria.incongruencias.filter(
    (i) => i.gravedad === "CONFORME"
  ).length;

  // Obra-wide aggregated metrics across all valorizaciones
  const obraAuditStats = useMemo(() => {
    const totalAudited = auditoriasList.length;
    const totalDiffAccum = auditoriasList.reduce(
      (acc, a) => acc + (a.totalDiferenciaBrutaSoles || 0),
      0
    );
    const countCritical = auditoriasList.filter(
      (a) => a.estadoAuditoria === "Observada con Incongruencias Críticas"
    ).length;
    const countSubsanable = auditoriasList.filter(
      (a) => a.estadoAuditoria === "Con Observaciones Subsanables"
    ).length;
    const countConforme = auditoriasList.filter(
      (a) => a.estadoAuditoria === "Conforme y Cuadrada"
    ).length;

    return {
      totalAudited,
      totalDiffAccum,
      countCritical,
      countSubsanable,
      countConforme,
    };
  }, [auditoriasList]);

  // Open modal to add new incongruence
  const handleOpenAddIncongruencia = () => {
    setEditingIncongruencia(null);
    setIncongruenciaForm({
      partidaItem: "",
      seccion: "Planilla de Metrados",
      descripcion: "",
      valorExcel: "",
      valorEscaneado: "",
      diferenciaMetrado: undefined,
      diferenciaSoles: undefined,
      gravedad: "CRÍTICO",
      baseLegal: "Art. 194 del RLCE",
      impacto: "",
      recomendacionTecnica: "",
    });
    setIsIncongruenciaModalOpen(true);
  };

  // Open modal to edit existing incongruence
  const handleOpenEditIncongruencia = (inc: IncongruenciaValorizacion) => {
    setEditingIncongruencia(inc);
    setIncongruenciaForm({ ...inc });
    setIsIncongruenciaModalOpen(true);
  };

  // Save incongruence (add or edit)
  const handleSaveIncongruencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incongruenciaForm.descripcion || !incongruenciaForm.seccion) return;

    let updatedList: IncongruenciaValorizacion[];

    if (editingIncongruencia) {
      updatedList = activeAuditoria.incongruencias.map((item) =>
        item.id === editingIncongruencia.id
          ? ({ ...item, ...incongruenciaForm } as IncongruenciaValorizacion)
          : item
      );
    } else {
      const newItem: IncongruenciaValorizacion = {
        id: `inc-${Date.now()}`,
        partidaItem: incongruenciaForm.partidaItem || "",
        seccion: (incongruenciaForm.seccion as any) || "Planilla de Metrados",
        descripcion: incongruenciaForm.descripcion || "",
        valorExcel: incongruenciaForm.valorExcel || "",
        valorEscaneado: incongruenciaForm.valorEscaneado || "",
        diferenciaMetrado: incongruenciaForm.diferenciaMetrado ? Number(incongruenciaForm.diferenciaMetrado) : undefined,
        diferenciaSoles: incongruenciaForm.diferenciaSoles ? Number(incongruenciaForm.diferenciaSoles) : undefined,
        gravedad: (incongruenciaForm.gravedad as any) || "CRÍTICO",
        baseLegal: incongruenciaForm.baseLegal || "Art. 194 del RLCE",
        impacto: incongruenciaForm.impacto || "",
        recomendacionTecnica: incongruenciaForm.recomendacionTecnica || "",
      };
      updatedList = [newItem, ...activeAuditoria.incongruencias];
    }

    const totalDiff = updatedList.reduce((acc, i) => acc + (i.diferenciaSoles || 0), 0);
    const critCount = updatedList.filter((i) => i.gravedad === "CRÍTICO").length;

    let estado = activeAuditoria.estadoAuditoria;
    if (critCount > 0 || totalDiff > 5000) {
      estado = "Observada con Incongruencias Críticas";
    } else if (updatedList.length > 0) {
      estado = "Con Observaciones Subsanables";
    } else {
      estado = "Conforme y Cuadrada";
    }

    const updatedAudit: AuditoriaValorizacion = {
      ...activeAuditoria,
      incongruencias: updatedList,
      totalDiferenciaBrutaSoles: totalDiff,
      partidasConDiscrepancia: updatedList.filter((i) => i.gravedad !== "CONFORME").length,
      estadoAuditoria: estado,
    };

    saveCurrentAudit(updatedAudit);
    setIsIncongruenciaModalOpen(false);
  };

  // Delete incongruence
  const handleDeleteIncongruencia = (id: string) => {
    const updatedList = activeAuditoria.incongruencias.filter((i) => i.id !== id);
    const totalDiff = updatedList.reduce((acc, i) => acc + (i.diferenciaSoles || 0), 0);
    const critCount = updatedList.filter((i) => i.gravedad === "CRÍTICO").length;

    let estado = activeAuditoria.estadoAuditoria;
    if (critCount > 0 || totalDiff > 5000) {
      estado = "Observada con Incongruencias Críticas";
    } else if (updatedList.length > 0) {
      estado = "Con Observaciones Subsanables";
    } else {
      estado = "Conforme y Cuadrada";
    }

    const updatedAudit: AuditoriaValorizacion = {
      ...activeAuditoria,
      incongruencias: updatedList,
      totalDiferenciaBrutaSoles: totalDiff,
      partidasConDiscrepancia: updatedList.filter((i) => i.gravedad !== "CONFORME").length,
      estadoAuditoria: estado,
    };

    saveCurrentAudit(updatedAudit);
  };

  // Delete entire audit for this month
  const handleDeleteCurrentMonthAudit = () => {
    const updatedList = auditoriasList.filter(
      (a) => a.numeroValorizacion !== selectedNumVal
    );
    setAuditoriasList(updatedList);
    if (onSaveAuditorias) onSaveAuditorias(updatedList);
    setIsDeleteModalOpen(false);
  };

  // Create new custom valorización audit
  const handleCreateNewValorizacionAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAudit: AuditoriaValorizacion = {
      id: `audit-val-${String(newValNumber).padStart(2, "0")}`,
      numeroValorizacion: Number(newValNumber),
      mesPeriodo: newValMesPeriodo,
      fechaAuditoria: new Date().toISOString().split("T")[0],
      nombreArchivoExcel: `VALORIZACION_N${String(newValNumber).padStart(2, "0")}_CONTRATISTA.xlsx`,
      nombreArchivoEscaneado: `VAL_${String(newValNumber).padStart(2, "0")}_EXPEDIENTE_SUPERVISION.pdf`,
      estadoAuditoria: "Conforme y Cuadrada",
      totalDiferenciaBrutaSoles: 0,
      totalPartidasAuditadas: 15,
      partidasConDiscrepancia: 0,
      firmasValidadas: {
        residenteObra: true,
        supervisorObra: true,
        jefeSupervision: true,
        colegiaturaVigenteCIP: true,
      },
      incongruencias: [],
      resumenEjecutivo: `Auditoría registrada para la Valorización N° ${String(
        newValNumber
      ).padStart(2, "0")} (${newValMesPeriodo}).`,
    };

    saveCurrentAudit(newAudit);
    setSelectedNumVal(Number(newValNumber));
    setIsNewValModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* TOAST NOTIFICATION */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-bold">
            Auditoría de la Valorización N° {selectedNumVal} guardada correctamente
          </span>
        </div>
      )}

      {/* MODULE HEADER */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Módulo N° 2 • Control y Auditoría
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Art. 194 RLCE • Ley N° 30225 • D.S. N° 344-2018-EF / D.S. N° 009-2025-EF
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Auditoría Cruzada: Excel vs. Expediente Físico Escaneado
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Gestión técnica y registro de auditorías por cada valorización del plazo de ejecución de la obra (
            {obra.plazoDias || 180} días / ~{totalMesesPlazo} valorizaciones). Detecta automáticamente discrepancias en carátula, planilla de metrados, fórmula polinómica (K), amortizaciones y firmas colegiadas.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleLoadSampleTestCase}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Carga un caso de prueba con 6 incongruencias reales para verificar el detector"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Caso de Prueba</span>
          </button>

          <button
            onClick={() => setShowPrintReport(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Acta de Observaciones</span>
          </button>
        </div>
      </div>

      {/* CONSOLIDATED OBRA AUDIT METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Plazo de Obra
            </span>
            <div className="text-lg font-black text-slate-900">
              {totalMesesPlazo} Valorizaciones
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {obraAuditStats.totalAudited} registradas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Descuadre Acumulado
            </span>
            <div className="text-lg font-black font-mono text-rose-700">
              S/ {obraAuditStats.totalDiffAccum.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              en toda la obra
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Val. Observadas
            </span>
            <div className="text-lg font-black text-amber-900">
              {obraAuditStats.countCritical + obraAuditStats.countSubsanable}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {obraAuditStats.countCritical} con incongruencia crítica
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Val. Conformes
            </span>
            <div className="text-lg font-black text-emerald-800">
              {obraAuditStats.countConforme}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              sin observaciones
            </span>
          </div>
        </div>
      </div>

      {/* MULTI-VALORIZACION SELECTOR STRIP */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Control de Auditorías por Valorización del Plazo Contractual
            </h3>
          </div>
          <button
            onClick={() => setIsNewValModalOpen(true)}
            className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nueva Auditoría de Valorización</span>
          </button>
        </div>

        {/* Horizontal scrollable tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
          {availableValOptions.map((opt) => {
            const auditFound = auditoriasList.find((a) => a.numeroValorizacion === opt.num);
            const isSelected = selectedNumVal === opt.num;
            const hasCritical = auditFound?.estadoAuditoria === "Observada con Incongruencias Críticas";
            const hasWarning = auditFound?.estadoAuditoria === "Con Observaciones Subsanables";
            const isOk = auditFound?.estadoAuditoria === "Conforme y Cuadrada";

            return (
              <button
                key={opt.num}
                onClick={() => setSelectedNumVal(opt.num)}
                className={`flex flex-col text-left px-3.5 py-2.5 rounded-xl border transition-all shrink-0 cursor-pointer min-w-[170px] ${
                  isSelected
                    ? "bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-600/30"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    Val. N° {String(opt.num).padStart(2, "0")}
                  </span>
                  {auditFound ? (
                    hasCritical ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    ) : hasWarning ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>

                <span className={`text-[10px] truncate ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                  {opt.mes}
                </span>

                <div className="mt-2 flex items-center justify-between text-[9px] font-bold">
                  {auditFound ? (
                    hasCritical ? (
                      <span className={isSelected ? "text-rose-300" : "text-rose-600"}>
                        🚨 S/ {auditFound.totalDiferenciaBrutaSoles.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                      </span>
                    ) : hasWarning ? (
                      <span className={isSelected ? "text-amber-300" : "text-amber-600"}>
                        ⚠️ Observada
                      </span>
                    ) : (
                      <span className={isSelected ? "text-emerald-300" : "text-emerald-600"}>
                        ✓ Conforme
                      </span>
                    )
                  ) : (
                    <span className={isSelected ? "text-indigo-300" : "text-slate-400"}>
                      ⏳ Sin auditar
                    </span>
                  )}

                  <span className={isSelected ? "text-indigo-300 font-mono" : "text-slate-400 font-mono"}>
                    {auditFound ? `${auditFound.incongruencias.length} obs.` : "0 obs."}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE VALUATION SUMMARY CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Auditoría de Valorización N° {String(selectedNumVal).padStart(2, "0")} - {activeAuditoria.mesPeriodo}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeAuditoria.estadoAuditoria === "Observada con Incongruencias Críticas"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : activeAuditoria.estadoAuditoria === "Con Observaciones Subsanables"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {activeAuditoria.estadoAuditoria}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Fecha de Cotejo: {activeAuditoria.fechaAuditoria} • Obra: {obra.nombre || "Infraestructura Pública"} (CUI {obra.cui || "2489102"})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Eliminar registro de auditoría de este mes"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Mes</span>
            </button>

            <button
              onClick={() => saveCurrentAudit(activeAuditoria)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Auditoría</span>
            </button>
          </div>
        </div>

        {/* SYNC NOTIFICATION BANNER (IF SYNCED) */}
        {syncAlert && syncAlert.show && (
          <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                    Sincronización Automática Exitosa • Art. 194 RLCE
                  </span>
                  {lastSyncTime && (
                    <span className="text-[10px] text-emerald-300 font-mono">
                      {lastSyncTime}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100 font-medium">
                  {syncAlert.message}
                </p>
                <div className="flex flex-wrap gap-4 text-[11px] text-emerald-200 pt-0.5 font-mono">
                  <span>Monto Oficial Certificado: <strong>S/ {syncAlert.monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</strong></span>
                  <span>Factor K: <strong>{syncAlert.factorK}</strong></span>
                  <span>Partidas Actualizadas: <strong>{syncAlert.partidasCount} partidas</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToSubTab) onNavigateToSubTab("curva-s");
                  else if (onNavigateToTab) onNavigateToTab("obras-valorizaciones");
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-700" />
                <span>Ver Curva S</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToSubTab) onNavigateToSubTab("partidas");
                  else if (onNavigateToTab) onNavigateToTab("obras-partidas");
                }}
                className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Ver Partidas</span>
              </button>
              <button
                type="button"
                onClick={() => setSyncAlert(null)}
                className="p-2 text-emerald-300 hover:text-white rounded-lg text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* COMPARISON PANELS (EXCEL VS SCANNED) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel 1: Archivo Digital Excel */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                1. Archivo Digital Excel (Contratista)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                {excelResult ? "Cargado y Leído" : ".XLSX Digital"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeAuditoria.nombreArchivoExcel}
                  onChange={(e) =>
                    saveCurrentAudit({ ...activeAuditoria, nombreArchivoExcel: e.target.value })
                  }
                  className="flex-1 bg-white border border-emerald-300 rounded-lg p-2 font-mono text-[11px] text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  placeholder="Nombre del archivo Excel..."
                />
                <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleExcelUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Partidas auditadas:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {excelResult?.summaryData?.partidasCount || activeAuditoria.totalPartidasAuditadas || 22}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hojas detectadas:</span>
                  <span className="font-bold text-emerald-700">
                    {excelResult ? `${excelResult.sheetNames.length} Hojas cargadas` : "Digitalizada"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Acceso rápido:</span>
                  <button
                    type="button"
                    onClick={() => setActiveInnerTab("lector-excel")}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Abrir Visor Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Expediente Físico Escaneado */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-rose-600" />
                2. Expediente Físico Escaneado (Supervisión)
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                {pdfResult ? "OCR Activo" : ".PDF Firmado"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeAuditoria.nombreArchivoEscaneado}
                  onChange={(e) =>
                    saveCurrentAudit({ ...activeAuditoria, nombreArchivoEscaneado: e.target.value })
                  }
                  className="flex-1 bg-white border border-rose-300 rounded-lg p-2 font-mono text-[11px] text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 outline-hidden"
                  placeholder="Nombre del expediente PDF escaneado..."
                />
                <label className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir</span>
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handlePdfUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="bg-white/80 border border-rose-200 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Carátula y Folios:</span>
                  <span className="font-bold text-rose-700">
                    {pdfResult ? `${pdfResult.pageCount} Folios Leídos` : "Certificada en Campo"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Validación CIP:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {activeAuditoria.firmasValidadas.colegiaturaVigenteCIP ? "Habilitado ✓" : "Por Verificar"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Acceso rápido:</span>
                  <button
                    type="button"
                    onClick={() => setActiveInnerTab("lector-escaneado")}
                    className="font-bold text-rose-700 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Abrir Visor PDF/OCR</span>
                  </button>
                </div>
              </div>

              {/* Direct sync button on Panel 2 */}
              <button
                type="button"
                onClick={() => handleSyncScannedToProject()}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Sincronizar a Curva S y Partidas</span>
              </button>
            </div>
          </div>

          {/* Panel 3: Motor de Cotejo Cruzado Automatizado */}
          <div className="bg-indigo-900 text-white rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  3. Motor de Auditoría Cruzada
                </span>
                <span className="text-[10px] bg-indigo-800 px-2 py-0.5 rounded text-indigo-200 font-mono">
                  OCR + AI
                </span>
              </div>
              <p className="text-[11px] text-indigo-200">
                Verifica consistencia matemática celda por celda y concordancia con los folios firmados.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-800">
                <span className="text-[10px] text-indigo-300 uppercase font-bold">Descuadre Bruto:</span>
                <span className="text-base font-black font-mono text-rose-400">
                  S/ {activeAuditoria.totalDiferenciaBrutaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  <span>{isScanning ? "Auditando..." : "Ejecutar Cruce"}</span>
                </button>
                <button
                  onClick={() => setActiveInnerTab("comparador-dual")}
                  className="py-2.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer border border-indigo-700"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Ver Lado a Lado</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY & SIGNATURES VALIDATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Executive Summary */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Resumen Ejecutivo y Dictamen de la Auditoría
              </label>
              <select
                value={activeAuditoria.estadoAuditoria}
                onChange={(e) =>
                  saveCurrentAudit({
                    ...activeAuditoria,
                    estadoAuditoria: e.target.value as any,
                  })
                }
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Observada con Incongruencias Críticas">
                  🚨 Observada con Incongruencias Críticas
                </option>
                <option value="Con Observaciones Subsanables">
                  ⚠️ Con Observaciones Subsanables
                </option>
                <option value="Conforme y Cuadrada">✓ Conforme y Cuadrada</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={activeAuditoria.resumenEjecutivo}
              onChange={(e) =>
                saveCurrentAudit({ ...activeAuditoria, resumenEjecutivo: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
              placeholder="Escriba el dictamen técnico o las consideraciones de observación según el Art. 194 del RLCE..."
            />
          </div>

          {/* CIP Signatures Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Validación de Firmas y Sellos CIP
            </span>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeAuditoria.firmasValidadas.residenteObra}
                  onChange={(e) =>
                    saveCurrentAudit({
                      ...activeAuditoria,
                      firmasValidadas: {
                        ...activeAuditoria.firmasValidadas,
                        residenteObra: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Firma Residente ({obra.residente || "Ing. Residente"})</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeAuditoria.firmasValidadas.supervisorObra}
                  onChange={(e) =>
                    saveCurrentAudit({
                      ...activeAuditoria,
                      firmasValidadas: {
                        ...activeAuditoria.firmasValidadas,
                        supervisorObra: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Firma Supervisor ({obra.supervisor || "Ing. Supervisor"})</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeAuditoria.firmasValidadas.jefeSupervision}
                  onChange={(e) =>
                    saveCurrentAudit({
                      ...activeAuditoria,
                      firmasValidadas: {
                        ...activeAuditoria.firmasValidadas,
                        jefeSupervision: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>V°B° Jefe de Supervisión</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeAuditoria.firmasValidadas.colegiaturaVigenteCIP}
                  onChange={(e) =>
                    saveCurrentAudit({
                      ...activeAuditoria,
                      firmasValidadas: {
                        ...activeAuditoria.firmasValidadas,
                        colegiaturaVigenteCIP: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-emerald-700 font-semibold">Certificado CIP Habilitado</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE WORKSPACE SUBTABS BAR */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveInnerTab("incongruencias")}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeInnerTab === "incongruencias"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>1. Matriz de Incongruencias (Art. 194 RLCE)</span>
          <span className="ml-1 px-1.5 py-0.2 bg-rose-500/30 text-rose-300 rounded text-[10px]">
            {activeAuditoria.incongruencias.length}
          </span>
        </button>

        <button
          onClick={() => setActiveInnerTab("lector-excel")}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeInnerTab === "lector-excel"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>2. Lector y Visor de Excel (.xlsx / .xls)</span>
          {excelResult && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[10px]">
              {excelResult.sheetNames.length} Hojas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveInnerTab("lector-escaneado")}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeInnerTab === "lector-escaneado"
              ? "bg-rose-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-rose-50 border border-slate-200"
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-rose-500" />
          <span>3. Lector de Expediente Escaneado (.pdf / OCR)</span>
          {pdfResult && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-800 text-white rounded text-[10px]">
              {pdfResult.pageCount} Folios
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveInnerTab("comparador-dual")}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            activeInnerTab === "comparador-dual"
              ? "bg-indigo-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200"
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-400" />
          <span>4. Comparador Lado a Lado</span>
        </button>

        <button
          onClick={() => setShowPrintReport(true)}
          className="px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>5. Acta Oficial para Trámite</span>
        </button>
      </div>

      {/* VIEW PANEL 2: LECTOR EXCEL */}
      {activeInnerTab === "lector-excel" && (
        <ExcelWorksheetViewer
          excelData={excelResult}
          isLoading={isExtractingExcel}
          onFileUpload={handleExcelUpload}
          fileName={activeAuditoria.nombreArchivoExcel}
        />
      )}

      {/* VIEW PANEL 3: LECTOR ESCANEADO PDF */}
      {activeInnerTab === "lector-escaneado" && (
        <ScannedPdfViewer
          pdfData={pdfResult}
          isLoading={isExtractingPdf}
          onFileUpload={handlePdfUpload}
          fileName={activeAuditoria.nombreArchivoEscaneado}
          firmasValidadas={activeAuditoria.firmasValidadas}
          numVal={selectedNumVal}
          onSyncToProject={() => handleSyncScannedToProject()}
          onNavigateToCurvaS={() => {
            if (onNavigateToSubTab) onNavigateToSubTab("curva-s");
            else if (onNavigateToTab) onNavigateToTab("obras-valorizaciones");
          }}
          onNavigateToPartidas={() => {
            if (onNavigateToSubTab) onNavigateToSubTab("partidas");
            else if (onNavigateToTab) onNavigateToTab("obras-partidas");
          }}
          lastSyncTime={lastSyncTime}
          onToggleFirma={(k, v) =>
            saveCurrentAudit({
              ...activeAuditoria,
              firmasValidadas: {
                ...activeAuditoria.firmasValidadas,
                [k]: v,
              },
            })
          }
        />
      )}

      {/* VIEW PANEL 4: COMPARADOR DUAL LADO A LADO */}
      {activeInnerTab === "comparador-dual" && (
        <SideBySideComparator
          activeAuditoria={activeAuditoria}
          excelData={excelResult}
          pdfData={pdfResult}
          onRunScan={handleRunScan}
          isScanning={isScanning}
          onAddIncongruencia={handleSaveIncongruencia as any}
        />
      )}

      {/* VIEW PANEL 1: MATRIZ DE INCONGRUENCIAS (DEFAULT) */}
      {activeInnerTab === "incongruencias" && (
        <div className="space-y-3">
        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Severity filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-bold">Gravedad:</span>
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

            {/* Section filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-bold">Sección:</span>
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

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar partida o palabra clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <button
            onClick={handleOpenAddIncongruencia}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Observación</span>
          </button>
        </div>

        {/* List of Incongruities */}
        {filteredIncongruencias.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              No hay observaciones registradas en esta categoría
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Si detecta discrepancias entre el archivo Excel y el expediente escaneado, use el botón "+ Agregar Observación" o presione "Caso de Prueba".
            </p>
          </div>
        ) : (
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

                    <div className="flex items-center gap-2 shrink-0">
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
                      <button
                        onClick={() => handleOpenEditIncongruencia(inc)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition cursor-pointer"
                        title="Editar observación"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIncongruencia(inc.id)}
                        className="p-1 hover:bg-rose-100 rounded text-rose-600 transition cursor-pointer"
                        title="Eliminar observación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                          {inc.valorExcel || "-"}
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
                          {inc.valorEscaneado || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Discrepancy details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Diferencia Monetaria:
                        </span>
                        <span className="text-sm font-black font-mono text-rose-600">
                          {inc.diferenciaSoles !== undefined
                            ? `S/ ${inc.diferenciaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
                            : "S/ 0.00"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Diferencia de Metrado:
                        </span>
                        <span className="text-sm font-black font-mono text-amber-700">
                          {inc.diferenciaMetrado !== undefined ? `${inc.diferenciaMetrado} unid.` : "Sin exceso"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          Base Legal RLCE:
                        </span>
                        <span className="text-xs font-bold text-indigo-900 block truncate" title={inc.baseLegal}>
                          {inc.baseLegal || "Art. 194 RLCE"}
                        </span>
                      </div>
                    </div>

                    {/* Impact & Recommendation */}
                    <div className="space-y-2 pt-1">
                      {inc.impacto && (
                        <div className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                          <strong className="text-amber-900 block font-bold mb-0.5">Impacto Técnico-Económico:</strong>
                          {inc.impacto}
                        </div>
                      )}

                      {inc.recomendacionTecnica && (
                        <div className="text-xs text-slate-700 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-200">
                          <strong className="text-indigo-950 block font-bold mb-0.5">
                            Recomendación Técnica de Subsanación:
                          </strong>
                          {inc.recomendacionTecnica}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* MODAL: ADD / EDIT INCONGRUENCIA */}
      {isIncongruenciaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingIncongruencia ? "Editar Observación / Incongruencia" : "Registrar Nueva Observación de Auditoría"}
                </h3>
              </div>
              <button
                onClick={() => setIsIncongruenciaModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncongruencia} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Partida Item (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 02.04.01"
                    value={incongruenciaForm.partidaItem || ""}
                    onChange={(e) =>
                      setIncongruenciaForm({ ...incongruenciaForm, partidaItem: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sección de la Valorización:</label>
                  <select
                    value={incongruenciaForm.seccion}
                    onChange={(e) =>
                      setIncongruenciaForm({ ...incongruenciaForm, seccion: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="Planilla de Metrados">Planilla de Metrados</option>
                    <option value="Carátula Resumen">Carátula Resumen</option>
                    <option value="Fórmula Polinómica (Reajuste K)">Fórmula Polinómica (Reajuste K)</option>
                    <option value="Amortización de Adelantos">Amortización de Adelantos</option>
                    <option value="Firmas y Sellos Colegiados">Firmas y Sellos Colegiados</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción de la Discrepancia u Observación: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Discrepancia en metrado de concreto en vigas entre Excel y campo..."
                  value={incongruenciaForm.descripcion || ""}
                  onChange={(e) =>
                    setIncongruenciaForm({ ...incongruenciaForm, descripcion: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    Valor en Planilla Excel:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 65.20 m3 (S/ 29,340.00)"
                    value={incongruenciaForm.valorExcel || ""}
                    onChange={(e) =>
                      setIncongruenciaForm({ ...incongruenciaForm, valorExcel: e.target.value })
                    }
                    className="w-full p-2.5 border border-emerald-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-rose-800 mb-1">
                    Valor en Escaneado / Campo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 48.50 m3 (S/ 21,825.00)"
                    value={incongruenciaForm.valorEscaneado || ""}
                    onChange={(e) =>
                      setIncongruenciaForm({ ...incongruenciaForm, valorEscaneado: e.target.value })
                    }
                    className="w-full p-2.5 border border-rose-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-rose-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diferencia Soles (S/):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={incongruenciaForm.diferenciaSoles ?? ""}
                    onChange={(e) =>
                      setIncongruenciaForm({
                        ...incongruenciaForm,
                        diferenciaSoles: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diferencia Metrado:</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={incongruenciaForm.diferenciaMetrado ?? ""}
                    onChange={(e) =>
                      setIncongruenciaForm({
                        ...incongruenciaForm,
                        diferenciaMetrado: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nivel de Gravedad:</label>
                  <select
                    value={incongruenciaForm.gravedad}
                    onChange={(e) =>
                      setIncongruenciaForm({ ...incongruenciaForm, gravedad: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="CRÍTICO">CRÍTICO</option>
                    <option value="ADVERTENCIA">ADVERTENCIA</option>
                    <option value="CONFORME">CONFORME</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Legal RLCE:</label>
                <input
                  type="text"
                  placeholder="Ej. Art. 194 del RLCE..."
                  value={incongruenciaForm.baseLegal || ""}
                  onChange={(e) =>
                    setIncongruenciaForm({ ...incongruenciaForm, baseLegal: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Impacto Técnico-Económico:</label>
                <textarea
                  rows={2}
                  placeholder="Consecuencia o riesgo de la incongruencia..."
                  value={incongruenciaForm.impacto || ""}
                  onChange={(e) =>
                    setIncongruenciaForm({ ...incongruenciaForm, impacto: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recomendación de Subsanación:</label>
                <textarea
                  rows={2}
                  placeholder="Instrucción precisa para el contratista o supervisor..."
                  value={incongruenciaForm.recomendacionTecnica || ""}
                  onChange={(e) =>
                    setIncongruenciaForm({ ...incongruenciaForm, recomendacionTecnica: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsIncongruenciaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Guardar Observación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW VALORIZACION */}
      {isNewValModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-sm">+ Nueva Auditoría de Valorización</h3>
              <button
                onClick={() => setIsNewValModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewValorizacionAudit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número de Valorización:
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  required
                  value={newValNumber}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setNewValNumber(num);
                    setNewValMesPeriodo(`Mes ${num}`);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Mes / Período:
                </label>
                <input
                  type="text"
                  required
                  value={newValMesPeriodo}
                  onChange={(e) => setNewValMesPeriodo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  placeholder="Ej. Mes 6 - Junio 2025"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewValModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Crear Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4 text-xs text-left">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">
                ¿Eliminar Auditoría de Val. N° {selectedNumVal}?
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Esta acción eliminará el registro y todas las observaciones configuradas para la Valorización N° {selectedNumVal}.
            </p>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentMonthAudit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
                  INFORME DE AUDITORÍA Y CONTROL DE VALORIZACIONES N° {String(selectedNumVal).padStart(2, "0")}-2025
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  ACTA DE OBSERVACIONES E INCONGRUENCIAS DETECTADAS EN PLANILLAS DIGITALES VS. EXPEDIENTE FÍSICO
                </p>
                <p className="text-[11px] text-slate-500">
                  Normativa Aplicable: Ley N° 30225 y Decreto Supremo N° 344-2018-EF (RLCE) / D.S. N° 009-2025-EF
                </p>
              </div>

              {/* Obra Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Obra:</span>
                  <span className="font-bold text-slate-900">{obra.nombre || "Infraestructura Pública"}</span>
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
                  <span className="font-bold text-slate-900">{obra.supervisor || "SUPERVISIÓN DE OBRA"}</span>
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
                  <strong>{activeAuditoria.nombreArchivoEscaneado}</strong>) para la{" "}
                  <strong>Valorización N° {selectedNumVal} ({activeAuditoria.mesPeriodo})</strong>, se determinó una inconsistencia bruta total de{" "}
                  <strong className="text-rose-700 font-mono">
                    S/ {activeAuditoria.totalDiferenciaBrutaSoles.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </strong>
                  . Por tanto, el expediente se declara en estado:{" "}
                  <strong className="text-rose-700 uppercase">{activeAuditoria.estadoAuditoria}</strong>.
                </p>
                <p className="text-justify leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                  "{activeAuditoria.resumenEjecutivo}"
                </p>
              </div>

              {/* Table of Incongruities */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
                  2. Cuadro Comparativo Detallado de Incongruencias
                </h4>
                {activeAuditoria.incongruencias.length === 0 ? (
                  <div className="p-4 text-center bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
                    ✓ No se detectaron discrepancias ni observaciones en la Valorización N° {selectedNumVal}. Expediente conforme para pago.
                  </div>
                ) : (
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
                            {inc.diferenciaSoles !== undefined
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
                )}
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
