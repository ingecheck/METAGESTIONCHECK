import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Shield,
  FileCheck2,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  RefreshCw,
  Eye,
  Edit3,
  X,
  ArrowRight,
  Info,
  Clock,
  Layers,
  FileSearch,
} from "lucide-react";
import { ProyectoCartera } from "../../types/seguimientoCartera";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../../services/pdfExtractor";
import { analyzeContractDocumentAPI } from "../../services/api";

interface ContractScannerCarteraModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: ProyectoCartera[];
  preselectedObra?: ProyectoCartera | null;
  onSaveObraFromScan: (
    obraData: Partial<ProyectoCartera>,
    isNew: boolean,
    targetObraId?: number
  ) => void;
  entityDisplayName: string;
}

export const ContractScannerCarteraModal: React.FC<ContractScannerCarteraModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  preselectedObra,
  onSaveObraFromScan,
  entityDisplayName,
}) => {
  // Document Type Tab
  const [activeTab, setActiveTab] = useState<"contratista" | "supervisor">("contratista");

  // Destination mode: 'new' or 'update'
  const [destinationMode, setDestinationMode] = useState<"new" | "update">(
    preselectedObra ? "update" : "new"
  );
  const [selectedExistingId, setSelectedExistingId] = useState<number>(
    preselectedObra?.id || (proyectos.length > 0 ? proyectos[0].id : 1)
  );

  // Contratista file & extraction state
  const [contratistaFile, setContratistaFile] = useState<File | null>(null);
  const [isExtractingContratista, setIsExtractingContratista] = useState(false);
  const [contratistaExtracted, setContratistaExtracted] = useState<any | null>(null);
  const [contratistaError, setContratistaError] = useState<string | null>(null);

  // Supervisión file & extraction state
  const [supervisorFile, setSupervisorFile] = useState<File | null>(null);
  const [isExtractingSupervisor, setIsExtractingSupervisor] = useState(false);
  const [supervisorExtracted, setSupervisorExtracted] = useState<any | null>(null);
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  // Form fields for live editing/confirmation
  const [formValues, setFormValues] = useState<{
    cui: string;
    proyecto: string;
    encargado: string;
    contratoEjecucionNumero: string;
    contratoEjecucionFechaFirma: string;
    contratoEjecucionMonto: number;
    contratoEjecucionEmpresa: string;
    residenteNombre: string;
    residenteCip: string;
    plazoDias: number;
    contratoSupervisionNumero: string;
    contratoSupervisionFechaFirma: string;
    contratoSupervisionMonto: number;
    contratoSupervisionEmpresa: string;
    supervisorNombre: string;
    supervisorCip: string;
    sistemaContratacion: string;
    adelantoDirectoPactado: number;
    adelantoMaterialesPactado: number;
    observaciones: string;
  }>({
    cui: "",
    proyecto: "",
    encargado: "-",
    contratoEjecucionNumero: "",
    contratoEjecucionFechaFirma: "",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "",
    residenteNombre: "",
    residenteCip: "",
    plazoDias: 0,
    contratoSupervisionNumero: "",
    contratoSupervisionFechaFirma: "",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "",
    supervisorNombre: "",
    supervisorCip: "",
    sistemaContratacion: "A Precios Unitarios",
    adelantoDirectoPactado: 0,
    adelantoMaterialesPactado: 0,
    observaciones: "",
  });

  const fileInputContratistaRef = useRef<HTMLInputElement>(null);
  const fileInputSupervisorRef = useRef<HTMLInputElement>(null);

  // Sync if preselectedObra changes
  useEffect(() => {
    if (preselectedObra) {
      setDestinationMode("update");
      setSelectedExistingId(preselectedObra.id);
      setFormValues((prev) => ({
        ...prev,
        cui: preselectedObra.cui || "",
        proyecto: preselectedObra.proyecto || "",
        encargado: preselectedObra.encargado || "-",
        contratoEjecucionNumero: preselectedObra.contratoEjecucionNumero || "",
        contratoEjecucionFechaFirma: preselectedObra.contratoEjecucionFechaFirma || "",
        contratoEjecucionMonto: preselectedObra.contratoEjecucionMonto || 0,
        contratoEjecucionEmpresa: preselectedObra.contratoEjecucionEmpresa || "",
        residenteNombre: preselectedObra.residenteNombre || "",
        residenteCip: preselectedObra.residenteCip || "",
        plazoDias: preselectedObra.plazoDias || 0,
        contratoSupervisionNumero: preselectedObra.contratoSupervisionNumero || "",
        contratoSupervisionFechaFirma: preselectedObra.contratoSupervisionFechaFirma || "",
        contratoSupervisionMonto: preselectedObra.contratoSupervisionMonto || 0,
        contratoSupervisionEmpresa: preselectedObra.contratoSupervisionEmpresa || "",
        supervisorNombre: preselectedObra.supervisorNombre || "",
        supervisorCip: preselectedObra.supervisorCip || "",
        observaciones: preselectedObra.observaciones || "",
      }));
    }
  }, [preselectedObra]);

  if (!isOpen) return null;

  // Process Contrato de Obra
  const handleProcessContratistaPdf = async (file: File) => {
    setContratistaFile(file);
    setIsExtractingContratista(true);
    setContratistaError(null);

    try {
      // 1. Client-side extraction
      const pdfRes: ExtractedPdfResult = await extractTextFromPdfFile(file);

      // 2. Comprehensive analysis
      const result = await analyzeContractDocumentAPI({
        documentType: "contratista",
        contractText: pdfRes.text,
        pdfBase64: pdfRes.pdfBase64,
        pageImagesBase64: pdfRes.pageImagesBase64,
        isScanned: pdfRes.isScannedImage,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      setContratistaExtracted(result);

      // Populate form values with extracted data
      setFormValues((prev) => {
        const nextCui = result.cui ? String(result.cui).trim() : prev.cui;
        const nextTitle = result.nombreObra ? String(result.nombreObra).toUpperCase().trim() : prev.proyecto;

        // Auto-detect if an existing obra matches this CUI
        if (nextCui && nextCui.length >= 6) {
          const match = proyectos.find((p) => (p.cui || "").replace(/\D/g, "") === nextCui.replace(/\D/g, ""));
          if (match) {
            setDestinationMode("update");
            setSelectedExistingId(match.id);
          }
        }

        const residenteStr =
          typeof result.residente === "object" && result.residente?.nombre
            ? result.residente.nombre
            : typeof result.residente === "string"
            ? result.residente
            : prev.residenteNombre;

        const residenteCipStr =
          typeof result.residente === "object" && result.residente?.cip
            ? result.residente.cip
            : prev.residenteCip;

        return {
          ...prev,
          cui: nextCui || prev.cui,
          proyecto: nextTitle || prev.proyecto,
          contratoEjecucionNumero: result.numeroDocumento || prev.contratoEjecucionNumero,
          contratoEjecucionFechaFirma: result.fechaSuscripcion || prev.contratoEjecucionFechaFirma,
          contratoEjecucionMonto: result.monto || prev.contratoEjecucionMonto,
          contratoEjecucionEmpresa: result.razonSocial || prev.contratoEjecucionEmpresa,
          residenteNombre: residenteStr,
          residenteCip: residenteCipStr,
          plazoDias: result.plazoDias || prev.plazoDias,
          sistemaContratacion: result.sistemaContratacion || prev.sistemaContratacion,
          adelantoDirectoPactado: result.adelantoDirectoPactado ?? prev.adelantoDirectoPactado,
          adelantoMaterialesPactado: result.adelantoMaterialesPactado ?? prev.adelantoMaterialesPactado,
          observaciones:
            prev.observaciones ||
            result.resumenEjecutivo ||
            `Contrato de Obra analizado: ${result.numeroDocumento || "Suscrito"}.`,
        };
      });
    } catch (err: any) {
      console.error("Error al procesar contrato de obra:", err);
      setContratistaError(err.message || "Error al procesar el archivo PDF del contrato.");
    } finally {
      setIsExtractingContratista(false);
    }
  };

  // Process Contrato de Supervisión / O.S.
  const handleProcessSupervisorPdf = async (file: File) => {
    setSupervisorFile(file);
    setIsExtractingSupervisor(true);
    setSupervisorError(null);

    try {
      const pdfRes: ExtractedPdfResult = await extractTextFromPdfFile(file);

      const result = await analyzeContractDocumentAPI({
        documentType: "supervisor",
        contractText: pdfRes.text,
        pdfBase64: pdfRes.pdfBase64,
        pageImagesBase64: pdfRes.pageImagesBase64,
        isScanned: pdfRes.isScannedImage,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      setSupervisorExtracted(result);

      setFormValues((prev) => {
        const nextCui = result.cui ? String(result.cui).trim() : prev.cui;
        if (!prev.cui && nextCui) {
          const match = proyectos.find((p) => (p.cui || "").replace(/\D/g, "") === nextCui.replace(/\D/g, ""));
          if (match) {
            setDestinationMode("update");
            setSelectedExistingId(match.id);
          }
        }

        const supervisorStr =
          typeof result.supervisor === "object" && result.supervisor?.nombre
            ? result.supervisor.nombre
            : typeof result.supervisor === "string"
            ? result.supervisor
            : prev.supervisorNombre;

        const supervisorCipStr =
          typeof result.supervisor === "object" && result.supervisor?.cip
            ? result.supervisor.cip
            : prev.supervisorCip;

        return {
          ...prev,
          cui: prev.cui || nextCui,
          proyecto: prev.proyecto || (result.nombreObra ? String(result.nombreObra).toUpperCase().trim() : ""),
          contratoSupervisionNumero: result.numeroDocumento || prev.contratoSupervisionNumero,
          contratoSupervisionFechaFirma: result.fechaSuscripcion || prev.contratoSupervisionFechaFirma,
          contratoSupervisionMonto: result.monto || prev.contratoSupervisionMonto,
          contratoSupervisionEmpresa: result.razonSocial || prev.contratoSupervisionEmpresa,
          supervisorNombre: supervisorStr,
          supervisorCip: supervisorCipStr,
        };
      });
    } catch (err: any) {
      console.error("Error al procesar contrato de supervisión:", err);
      setSupervisorError(err.message || "Error al procesar el archivo PDF de supervisión.");
    } finally {
      setIsExtractingSupervisor(false);
    }
  };

  const handleSaveToSeguimiento = () => {
    if (!formValues.proyecto.trim() && !formValues.contratoEjecucionNumero.trim()) {
      alert("Por favor ingrese o escanee al menos el nombre del proyecto o el número de contrato.");
      return;
    }

    const payload: Partial<ProyectoCartera> = {
      proyecto: formValues.proyecto.toUpperCase().trim(),
      cui: formValues.cui.trim(),
      encargado: formValues.encargado,
      contratoEjecucionNumero: formValues.contratoEjecucionNumero.trim(),
      contratoEjecucionFechaFirma: formValues.contratoEjecucionFechaFirma.trim() || undefined,
      contratoEjecucionMonto: formValues.contratoEjecucionMonto || 0,
      contratoEjecucionEmpresa: formValues.contratoEjecucionEmpresa.trim(),
      residenteNombre: formValues.residenteNombre.trim() || undefined,
      residenteCip: formValues.residenteCip.trim() || undefined,
      plazoDias: formValues.plazoDias || undefined,
      contratoSupervisionNumero: formValues.contratoSupervisionNumero.trim(),
      contratoSupervisionFechaFirma: formValues.contratoSupervisionFechaFirma.trim() || undefined,
      contratoSupervisionMonto: formValues.contratoSupervisionMonto || 0,
      contratoSupervisionEmpresa: formValues.contratoSupervisionEmpresa.trim(),
      supervisorNombre: formValues.supervisorNombre.trim() || undefined,
      supervisorCip: formValues.supervisorCip.trim() || undefined,
      observaciones: formValues.observaciones.trim(),
      estado: formValues.contratoEjecucionNumero ? "PENDIENTE_INICIO_CONDICIONES" : "ACTOS_PREPARATORIOS",
    };

    onSaveObraFromScan(
      payload,
      destinationMode === "new",
      destinationMode === "update" ? selectedExistingId : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white tracking-wide">
                  Análisis & Escaneo de Contratos de Obra (PDF)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                  Seguimiento de Obras
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Punto de partida de la entidad: extrae CUI, N° de Contrato, Montos, Plazos, Residente y Supervisión directamente al Seguimiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Document Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("contratista")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === "contratista"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <HardHat className="w-4 h-4 text-amber-500" />
              <span>1. Contrato de Ejecución de Obra</span>
              {contratistaExtracted && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("supervisor")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === "supervisor"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="w-4 h-4 text-blue-500" />
              <span>2. Contrato de Supervisión / O.S.</span>
              {supervisorExtracted && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Scanner Upload Box for Active Tab */}
          {activeTab === "contratista" ? (
            <div className="border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-5 text-center relative transition hover:border-amber-400">
              <input
                ref={fileInputContratistaRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessContratistaPdf(file);
                }}
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Subir PDF del Contrato de Ejecución de Obra
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Arrastre el documento o haga clic para escanear y extraer CUI, Denominación, Monto, Contratista, Residente y Plazo
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isExtractingContratista}
                    onClick={() => fileInputContratistaRef.current?.click()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExtractingContratista ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Escaneando documento...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{contratistaFile ? "Cambiar Archivo PDF" : "Seleccionar Contrato (PDF)"}</span>
                      </>
                    )}
                  </button>
                </div>

                {contratistaFile && (
                  <div className="text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1.5 pt-1">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-mono">{contratistaFile.name}</span>
                    <span className="text-slate-400">({(contratistaFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}

                {contratistaError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{contratistaError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-5 text-center relative transition hover:border-blue-400">
              <input
                ref={fileInputSupervisorRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessSupervisorPdf(file);
                }}
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Subir PDF de Contrato de Supervisión u Orden de Servicio
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Extrae N° de Contrato de Supervisión, Empresa Supervisora, Monto, Supervisor de Obra y CIP
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isExtractingSupervisor}
                    onClick={() => fileInputSupervisorRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExtractingSupervisor ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Escaneando supervisión...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{supervisorFile ? "Cambiar Archivo PDF" : "Seleccionar Supervisión (PDF)"}</span>
                      </>
                    )}
                  </button>
                </div>

                {supervisorFile && (
                  <div className="text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1.5 pt-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-mono">{supervisorFile.name}</span>
                    <span className="text-slate-400">({(supervisorFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}

                {supervisorError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{supervisorError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Destination Selector: New Obra vs Update Existing Obra */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-slate-800 text-xs">
                Destino en Seguimiento de Obras:
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="destinationMode"
                    value="new"
                    checked={destinationMode === "new"}
                    onChange={() => setDestinationMode("new")}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="font-bold text-slate-700">Crear Nueva Obra</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="destinationMode"
                    value="update"
                    checked={destinationMode === "update"}
                    onChange={() => setDestinationMode("update")}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="font-bold text-slate-700">Actualizar Obra Existente</span>
                </label>
              </div>
            </div>

            {destinationMode === "update" && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Seleccionar obra a actualizar con los datos escaneados:
                </label>
                <select
                  value={selectedExistingId}
                  onChange={(e) => setSelectedExistingId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - CUI: {p.cui || "S/C"} | {p.proyecto.substring(0, 75)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Editable Extracted Fields Preview Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Datos Extraídos del Contrato (Listos para la Cartera)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                Verifique o ajuste cualquier campo antes de guardar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* CUI */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Código Único de Inversiones (CUI):
                </label>
                <input
                  type="text"
                  value={formValues.cui}
                  onChange={(e) => setFormValues({ ...formValues, cui: e.target.value })}
                  placeholder="Ej. 2619826"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Encargado */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ingeniero Encargado en la Entidad:
                </label>
                <input
                  type="text"
                  value={formValues.encargado}
                  onChange={(e) => setFormValues({ ...formValues, encargado: e.target.value.toUpperCase() })}
                  placeholder="Ej. JHON, JENNIFER, LUIS..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Denominación del Proyecto */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre Oficial del Proyecto / Obra:
                </label>
                <textarea
                  rows={2}
                  value={formValues.proyecto}
                  onChange={(e) => setFormValues({ ...formValues, proyecto: e.target.value })}
                  placeholder="MEJORAMIENTO DEL SERVICIO DE..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Sección Contrato de Obra */}
              <div className="md:col-span-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                <div className="font-extrabold text-[11px] text-amber-900 flex items-center gap-1.5 uppercase">
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Contrato de Ejecución de Obra (Contratista)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">N° Contrato Obra:</label>
                    <input
                      type="text"
                      value={formValues.contratoEjecucionNumero}
                      onChange={(e) => setFormValues({ ...formValues, contratoEjecucionNumero: e.target.value })}
                      placeholder="CONTRATO N° 023-2025-GAF/MPR"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Monto de Obra (S/.):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.contratoEjecucionMonto || ""}
                      onChange={(e) => setFormValues({ ...formValues, contratoEjecucionMonto: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fecha Suscripción:</label>
                    <input
                      type="text"
                      value={formValues.contratoEjecucionFechaFirma}
                      onChange={(e) => setFormValues({ ...formValues, contratoEjecucionFechaFirma: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Empresa / Consorcio Ejecutor:</label>
                    <input
                      type="text"
                      value={formValues.contratoEjecucionEmpresa}
                      onChange={(e) => setFormValues({ ...formValues, contratoEjecucionEmpresa: e.target.value })}
                      placeholder="CONSORCIO BASCA..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Plazo (Días):</label>
                    <input
                      type="number"
                      value={formValues.plazoDias || ""}
                      onChange={(e) => setFormValues({ ...formValues, plazoDias: parseInt(e.target.value, 10) || 0 })}
                      placeholder="180"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ing. Residente de Obra:</label>
                    <input
                      type="text"
                      value={formValues.residenteNombre}
                      onChange={(e) => setFormValues({ ...formValues, residenteNombre: e.target.value })}
                      placeholder="Ing. Rene Sánchez..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">N° CIP del Residente:</label>
                    <input
                      type="text"
                      value={formValues.residenteCip}
                      onChange={(e) => setFormValues({ ...formValues, residenteCip: e.target.value })}
                      placeholder="CIP 160246"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Contrato de Supervisión */}
              <div className="md:col-span-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-3">
                <div className="font-extrabold text-[11px] text-blue-900 flex items-center gap-1.5 uppercase">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Contrato de Supervisión de Obra / Orden de Servicio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">N° Contrato Supervisión / O.S.:</label>
                    <input
                      type="text"
                      value={formValues.contratoSupervisionNumero}
                      onChange={(e) => setFormValues({ ...formValues, contratoSupervisionNumero: e.target.value })}
                      placeholder="CONTRATO N° 045-2026-GAF/MPR"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Monto Supervisión (S/.):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formValues.contratoSupervisionMonto || ""}
                      onChange={(e) => setFormValues({ ...formValues, contratoSupervisionMonto: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fecha Suscripción Supervisión:</label>
                    <input
                      type="text"
                      value={formValues.contratoSupervisionFechaFirma}
                      onChange={(e) => setFormValues({ ...formValues, contratoSupervisionFechaFirma: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Empresa Supervisora / Consultor:</label>
                    <input
                      type="text"
                      value={formValues.contratoSupervisionEmpresa}
                      onChange={(e) => setFormValues({ ...formValues, contratoSupervisionEmpresa: e.target.value })}
                      placeholder="CONSORCIO SUPERVISOR..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ing. Supervisor / Inspector:</label>
                    <input
                      type="text"
                      value={formValues.supervisorNombre}
                      onChange={(e) => setFormValues({ ...formValues, supervisorNombre: e.target.value })}
                      placeholder="Ing. Roy Alegría..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">N° CIP del Supervisor:</label>
                    <input
                      type="text"
                      value={formValues.supervisorCip}
                      onChange={(e) => setFormValues({ ...formValues, supervisorCip: e.target.value })}
                      placeholder="CIP 277575"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Entidad activa: <strong className="text-slate-800">{entityDisplayName}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveToSeguimiento}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Aplicar y Guardar en Seguimiento de Obras</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
