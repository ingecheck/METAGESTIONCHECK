import React, { useState, useRef } from "react";
import {
  Award,
  Plus,
  Trash2,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UploadCloud,
  FileText,
  Filter,
  Check,
  Building2,
  Tag,
  Edit2,
  RefreshCw,
  Info,
  ChevronRight,
  Layers,
  FileBadge,
  Zap,
  Scissors,
  CheckCheck,
} from "lucide-react";
import { TenderInfo, CompanyProfile, ExperienceRecord, DetectedDocumentItem, ClippedPdfSnippet } from "../types/osce";
import {
  generateAnexo8ExperienciaDocx,
  downloadDocxBlob,
  formatPEN,
} from "../services/docxGenerator";
import { analyzeExperienceAPI } from "../services/api";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../services/pdfExtractor";
import { slicePdfFile, parsePageRanges } from "../services/pdfMasterService";
import { PdfCutterModal } from "./PdfCutterModal";

interface ExperienceCalculatorProps {
  tender: TenderInfo;
  company: CompanyProfile;
  experience: ExperienceRecord[];
  setExperience: React.Dispatch<React.SetStateAction<ExperienceRecord[]>>;
  onNavigateToTab?: (tab: string) => void;
}

// Preset samples pre-evaluated according to official procurement rules
const PRESET_EXPERIENCE_SAMPLES = [
  {
    title: "Obras Similares (Viales / Pistas y Veredas)",
    sampleRecords: [
      {
        id: "exp-vial-1",
        cliente: "MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO",
        tipoCliente: "Público" as const,
        objetoContrato: "CREACIÓN Y MEJORAMIENTO DEL SERVICIO DE TRANSITABILIDAD VEHICULAR Y PEATONAL EN EL SECTOR URBANO - PISTAS Y VEREDAS",
        nroDocumento: "CONTRATO N° 018-2023-MDSJ/GM",
        fechaEmision: "2023-04-12",
        fechaConformidad: "2023-11-20",
        moneda: "PEN" as const,
        montoOriginal: 285000.0,
        montoEnSoles: 285000.0,
        tipoComprobante: "Contrato + Conformidad" as const,
        validoOSCE: true,
        especialidad: "Viales, Puertos y Afines",
        subEspecialidad: "Vías urbanas",
        tipologia: "Pistas, veredas, ciclovías, pasajes peatonales y vías urbanas",
        esSimilar: true,
        porcentajeSimilaridad: 100,
        justificacionSimilaridad: "Ejecución de pistas de concreto, veredas y señalización vial idéntica al objeto de convocatoria.",
      },
      {
        id: "exp-vial-2",
        cliente: "GOBIERNO REGIONAL DE CUSCO - SEDE CENTRAL",
        tipoCliente: "Público" as const,
        objetoContrato: "MEJORAMIENTO Y REHABILITACIÓN DE LA INFRAESTRUCTURA VIAL Y OBRAS DE ARTE EN LA RED DEPARTAMENTAL",
        nroDocumento: "CONTRATO N° 102-2022-GRC/GGR",
        fechaEmision: "2022-06-15",
        fechaConformidad: "2023-02-28",
        moneda: "PEN" as const,
        montoOriginal: 195000.0,
        montoEnSoles: 195000.0,
        tipoComprobante: "Contrato + Conformidad" as const,
        validoOSCE: true,
        especialidad: "Viales, Puertos y Afines",
        subEspecialidad: "Vías interurbanas o carreteras",
        tipologia: "Carreteras no pavimentadas, afirmados y obras de arte viales",
        esSimilar: true,
        porcentajeSimilaridad: 95,
        justificacionSimilaridad: "Ejecución de trabajos de movimiento de tierras, afirmado, pavimento y drenaje conforme a las Bases.",
      },
      {
        id: "exp-vial-3",
        cliente: "MINISTERIO DE TRANSPORTES Y COMUNICACIONES - PROVÍAS NACIONAL",
        tipoCliente: "Público" as const,
        objetoContrato: "SERVICIO DE MANTENIMIENTO RUTINARIO Y CONSERVACIÓN VIAL EN TRAMO DE LA RED VIAL NACIONAL",
        nroDocumento: "ORDEN DE SERVICIO N° 0845-2024-MTC/20",
        fechaEmision: "2024-02-10",
        fechaConformidad: "2024-08-30",
        moneda: "PEN" as const,
        montoOriginal: 98500.0,
        montoEnSoles: 98500.0,
        tipoComprobante: "Orden de Servicio/Compra + Conformidad" as const,
        validoOSCE: true,
        especialidad: "Viales, Puertos y Afines",
        subEspecialidad: "Vías urbanas",
        tipologia: "Mantenimiento periódico, bacheo y señalización vial",
        esSimilar: true,
        porcentajeSimilaridad: 85,
        justificacionSimilaridad: "Acredita partidas de bacheo, reposición de carpeta y señalización vial.",
      },
    ],
  },
  {
    title: "Obras Civiles y Edificaciones",
    sampleRecords: [
      {
        id: "exp-edif-1",
        cliente: "PRONIED - MINISTERIO DE EDUCACIÓN",
        tipoCliente: "Público" as const,
        objetoContrato: "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO EDUCATIVO EN LA I.E. SECUNDARIA EMBLEMÁTICA",
        nroDocumento: "CONTRATO N° 045-2023-MINEDU/VMGI-PRONIED",
        fechaEmision: "2023-01-15",
        fechaConformidad: "2023-10-30",
        moneda: "PEN" as const,
        montoOriginal: 380000.0,
        montoEnSoles: 380000.0,
        tipoComprobante: "Contrato + Conformidad" as const,
        validoOSCE: true,
        especialidad: "Edificaciones y Afines",
        subEspecialidad: "Edificación educativa",
        tipologia: "Edificación para educación básica y módulos pedagógicos",
        esSimilar: true,
        porcentajeSimilaridad: 100,
        justificacionSimilaridad: "Construcción integral de infraestructura educativa con estructuras de concreto armado.",
      },
      {
        id: "exp-edif-2",
        cliente: "MUNICIPALIDAD PROVINCIAL DE HUAMANGA",
        tipoCliente: "Público" as const,
        objetoContrato: "CONSTRUCCIÓN DE CENTRO DE SALUD COMUNAL Y AMBIENTES ADMINISTRATIVOS",
        nroDocumento: "CONTRATO N° 088-2022-MPH",
        fechaEmision: "2022-05-10",
        fechaConformidad: "2022-12-15",
        moneda: "PEN" as const,
        montoOriginal: 220000.0,
        montoEnSoles: 220000.0,
        tipoComprobante: "Contrato + Conformidad" as const,
        validoOSCE: true,
        especialidad: "Edificaciones y Afines",
        subEspecialidad: "Establecimientos de salud",
        tipologia: "Establecimiento de salud del primer nivel de atención",
        esSimilar: true,
        porcentajeSimilaridad: 90,
        justificacionSimilaridad: "Obra de edificación con acabados e instalaciones electromecánicas y sanitarias.",
      },
    ],
  },
];

export const ExperienceCalculator: React.FC<ExperienceCalculatorProps> = ({
  tender,
  company,
  experience,
  setExperience,
  onNavigateToTab,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeInputTab, setActiveInputTab] = useState<"upload" | "text" | "presets">("upload");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("TODOS");

  // AI Extraction & Smart PDF Cutter state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [showPdfCutter, setShowPdfCutter] = useState(false);
  const [detectedDocs, setDetectedDocs] = useState<DetectedDocumentItem[]>([]);
  const [isBatchCutting, setIsBatchCutting] = useState(false);
  const [cutSuccessDocs, setCutSuccessDocs] = useState<Record<string, boolean>>({});
  const [cutterConfig, setCutterConfig] = useState<{
    isOpen: boolean;
    initialTitle?: string;
    initialPageRange?: string;
    initialNotes?: string;
    initialCategory?: ClippedPdfSnippet["category"];
  }>({ isOpen: false });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [uploadedPdf, setUploadedPdf] = useState<ExtractedPdfResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSnippetCreated = (snippet: ClippedPdfSnippet) => {
    const existingStr = localStorage.getItem("osce_clipped_pdf_snippets");
    let existing: ClippedPdfSnippet[] = [];
    if (existingStr) {
      try {
        existing = JSON.parse(existingStr);
      } catch (e) {}
    }
    existing.push(snippet);
    localStorage.setItem("osce_clipped_pdf_snippets", JSON.stringify(existing));
    setStatusMessage(`Recorte "${snippet.title}" guardado e incorporado para el armado final.`);
  };

  // Direct 1-Click Cut & Save for a Detected Document
  const handleQuickCutDocument = async (doc: DetectedDocumentItem) => {
    if (!uploadedPdf?.pdfBase64) {
      setErrorMessage("No hay un archivo PDF base cargado para recortar.");
      return;
    }

    const rangeToUse = doc.rangoPaginas || doc.rangoCorteSugerido || "1";
    const pagesToCut = parsePageRanges(rangeToUse, uploadedPdf.pageCount);
    if (pagesToCut.length === 0) {
      setErrorMessage(`El rango de páginas "${rangeToUse}" no es válido.`);
      return;
    }

    try {
      setStatusMessage(`Recortando páginas ${rangeToUse} de "${doc.nroDocumento}"...`);
      const sliced = await slicePdfFile(uploadedPdf.pdfBase64, pagesToCut);

      const snippet: ClippedPdfSnippet = {
        id: "snip-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        title: `${doc.nroDocumento} - ${doc.tipoDocumento} (${doc.cliente})`,
        category: doc.destinatarioSobre || "experiencia",
        sourceFileName: uploadedPdf.fileName,
        selectedPages: `Páginas ${rangeToUse} (${sliced.pageCount} pág.)`,
        pageCount: sliced.pageCount,
        pdfBase64: sliced.base64,
        createdAt: Date.now(),
        notes: doc.justificacionSimilaridad || doc.instruccionCorte,
        isIncluded: true,
      };

      handleSnippetCreated(snippet);
      setCutSuccessDocs((prev) => ({ ...prev, [doc.id]: true }));
      setStatusMessage(`¡Recorte listo! Se extrajeron las Páginas ${rangeToUse} (${sliced.pageCount} pág.) e incorporaron al Sobre de Experiencia.`);
    } catch (err: any) {
      console.error("Error al cortar PDF:", err);
      setErrorMessage("Error al recortar PDF: " + (err.message || String(err)));
    }
  };

  // Batch Cut All Valid Detected Documents in 1 Click
  const handleBatchCutAllValidDocs = async () => {
    if (!uploadedPdf?.pdfBase64 || detectedDocs.length === 0) return;
    setIsBatchCutting(true);
    let count = 0;
    try {
      for (const doc of detectedDocs) {
        const rangeToUse = doc.rangoPaginas || doc.rangoCorteSugerido || "1";
        const pagesToCut = parsePageRanges(rangeToUse, uploadedPdf.pageCount);
        if (pagesToCut.length > 0) {
          const sliced = await slicePdfFile(uploadedPdf.pdfBase64, pagesToCut);
          const snippet: ClippedPdfSnippet = {
            id: "snip-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            title: `${doc.nroDocumento} - ${doc.tipoDocumento} (${doc.cliente})`,
            category: doc.destinatarioSobre || "experiencia",
            sourceFileName: uploadedPdf.fileName,
            selectedPages: `Páginas ${rangeToUse} (${sliced.pageCount} pág.)`,
            pageCount: sliced.pageCount,
            pdfBase64: sliced.base64,
            createdAt: Date.now(),
            notes: doc.justificacionSimilaridad || doc.instruccionCorte,
            isIncluded: true,
          };
          handleSnippetCreated(snippet);
          setCutSuccessDocs((prev) => ({ ...prev, [doc.id]: true }));
          count++;
        }
      }
      setStatusMessage(`¡Corte por lote completado! Se generaron y guardaron ${count} recortes PDF individuales listos para la propuesta.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error durante el corte por lotes: " + (err.message || String(err)));
    } finally {
      setIsBatchCutting(false);
    }
  };

  // Open interactive cutter prefilled with specific document
  const handleOpenCutterForDoc = (doc: DetectedDocumentItem) => {
    setCutterConfig({
      isOpen: true,
      initialTitle: `${doc.nroDocumento} - ${doc.tipoDocumento} (${doc.cliente})`,
      initialPageRange: doc.rangoPaginas || doc.rangoCorteSugerido || "1-3",
      initialNotes: doc.justificacionSimilaridad || doc.instruccionCorte,
      initialCategory: doc.destinatarioSobre || "experiencia",
    });
  };

  // Modal / Form state for Add/Edit Record
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [cliente, setCliente] = useState("");
  const [tipoCliente, setTipoCliente] = useState<"Público" | "Privado">("Público");
  const [objeto, setObjeto] = useState("");
  const [nroDoc, setNroDoc] = useState("");
  const [fechaConformidad, setFechaConformidad] = useState("2024-05-18");
  const [moneda, setMoneda] = useState<"PEN" | "USD">("PEN");
  const [monto, setMonto] = useState(120000);
  const [tipoCambio, setTipoCambio] = useState(3.75);
  const [tipoComprobante, setTipoComprobante] = useState<
    "Contrato + Conformidad" | "Orden de Servicio/Compra + Conformidad" | "Comprobante de Pago Cancelado"
  >("Contrato + Conformidad");
  const [esSimilar, setEsSimilar] = useState(true);
  const [porcentajeSimilaridad, setPorcentajeSimilaridad] = useState(100);
  const [justificacionSimilaridad, setJustificacionSimilaridad] = useState(
    "Acreditado con contrato y acta de recepción conforme a la definición de obras similares de las Bases."
  );

  // Financial calculations
  const totalSoles = experience.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0);
  const totalSimilarSoles = experience
    .filter((e) => e.esSimilar !== false)
    .reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0);

  const requiredAmountNum = tender.valorNumerico || 514737.28;
  const progressPercent = Math.min(Math.round((totalSimilarSoles / (requiredAmountNum || 1)) * 100), 100);
  const isFullyCovered = totalSimilarSoles >= requiredAmountNum;

  // Filtered experience records
  const filteredExperience = experience.filter((rec) => {
    if (filterSpecialty === "SIMILARES") return rec.esSimilar !== false;
    return true;
  });

  // Handle PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor seleccione un archivo PDF válido con contratos, actas de recepción o facturas.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsExtractingPdf(true);

    try {
      const extracted = await extractTextFromPdfFile(file);
      setUploadedPdf(extracted);
      setRawText(extracted.text);
      setStatusMessage(`PDF "${file.name}" cargado (${extracted.pageCount} pág.). Listo para procesar y evaluar.`);
    } catch (err: any) {
      console.error("PDF Extraction error:", err);
      setErrorMessage("Error al procesar el archivo PDF: " + (err.message || String(err)));
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Run AI Extraction on Document or Text
  const handleRunAiAnalysis = async (customText?: string) => {
    const textToAnalyze = customText || rawText;
    if (!textToAnalyze.trim() && !uploadedPdf?.pdfBase64) {
      setErrorMessage("Por favor cargue un archivo PDF o ingrese texto de contratos para analizar.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await analyzeExperienceAPI({
        experienceText: textToAnalyze,
        pdfBase64: uploadedPdf?.pdfBase64,
        pageImagesBase64: uploadedPdf?.pageImagesBase64,
        tenderInfo: tender,
        targetSpecialty: tender.especialidad || "Viales, Puertos y Afines",
        targetSubSpecialty: tender.subEspecialidad || "Vías urbanas",
      });

      if (result.records && result.records.length > 0) {
        setExperience(result.records);
        if (result.detectedDocuments && result.detectedDocuments.length > 0) {
          setDetectedDocs(result.detectedDocuments);
        }
        setStatusMessage(
          `¡Análisis completo! Se detectaron y evaluaron ${result.records.length} contrataciones con mapeo de páginas para corte según Bases.`
        );
      } else {
        setErrorMessage("No se pudieron detectar contratos en el texto. Puede ingresarlos manualmente.");
      }
    } catch (err: any) {
      console.error("Experience analysis error:", err);
      setErrorMessage("Error al evaluar experiencia: " + (err.message || String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load Preset
  const handleLoadPreset = (preset: (typeof PRESET_EXPERIENCE_SAMPLES)[0]) => {
    setExperience(preset.sampleRecords);
    setStatusMessage(`Se cargaron los contratos de "${preset.title}".`);
  };

  // Open Form for Add
  const handleOpenAddForm = () => {
    setEditingRecordId(null);
    setCliente("");
    setTipoCliente("Público");
    setObjeto("");
    setNroDoc("");
    setFechaConformidad("2024-05-18");
    setMoneda("PEN");
    setMonto(120000);
    setTipoCambio(3.75);
    setTipoComprobante("Contrato + Conformidad");
    setEsSimilar(true);
    setPorcentajeSimilaridad(100);
    setJustificacionSimilaridad("Acreditado con contrato y acta de conformidad de recepción conforme a las Bases.");
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditForm = (rec: ExperienceRecord) => {
    setEditingRecordId(rec.id);
    setCliente(rec.cliente);
    setTipoCliente(rec.tipoCliente);
    setObjeto(rec.objetoContrato);
    setNroDoc(rec.nroDocumento);
    setFechaConformidad(rec.fechaConformidad);
    setMoneda(rec.moneda);
    setMonto(rec.montoOriginal);
    setTipoCambio(rec.tipoCambioSBS || 3.75);
    setTipoComprobante(rec.tipoComprobante);
    setEsSimilar(rec.esSimilar !== false);
    setPorcentajeSimilaridad(rec.porcentajeSimilaridad || 100);
    setJustificacionSimilaridad(rec.justificacionSimilaridad || "");
    setIsFormOpen(true);
  };

  // Save Add/Edit Record
  const handleSaveRecord = () => {
    if (!cliente.trim() || !objeto.trim() || !nroDoc.trim()) {
      setErrorMessage("Por favor complete los campos obligatorios (Cliente, Objeto y N° Documento).");
      return;
    }

    const montoEnSoles = moneda === "USD" ? monto * tipoCambio : monto;
    const confYear = new Date(fechaConformidad).getFullYear();
    const currentYear = 2026;
    const isObra = tender.objetoContratacion === "Ejecución de Obras";
    const maxYears = isObra ? 10 : 8;
    const isValidOSCE = currentYear - confYear <= maxYears;

    if (editingRecordId) {
      // Edit existing
      setExperience(
        experience.map((e) =>
          e.id === editingRecordId
            ? {
                ...e,
                cliente,
                tipoCliente,
                objetoContrato: objeto,
                nroDocumento: nroDoc,
                fechaConformidad,
                moneda,
                montoOriginal: monto,
                tipoCambioSBS: moneda === "USD" ? tipoCambio : undefined,
                montoEnSoles,
                tipoComprobante,
                validoOSCE: isValidOSCE,
                esSimilar,
                porcentajeSimilaridad,
                justificacionSimilaridad,
              }
            : e
        )
      );
    } else {
      // Add new
      const newRec: ExperienceRecord = {
        id: "exp-" + Date.now(),
        cliente,
        tipoCliente,
        objetoContrato: objeto,
        nroDocumento: nroDoc,
        fechaEmision: "2024-01-10",
        fechaConformidad,
        moneda,
        montoOriginal: monto,
        tipoCambioSBS: moneda === "USD" ? tipoCambio : undefined,
        montoEnSoles,
        tipoComprobante,
        validoOSCE: isValidOSCE,
        especialidad: tender.especialidad || "Obras Viales",
        subEspecialidad: tender.subEspecialidad || "Vías urbanas",
        esSimilar,
        porcentajeSimilaridad,
        justificacionSimilaridad,
      };
      setExperience([...experience, newRec]);
    }

    setIsFormOpen(false);
    setErrorMessage(null);
  };

  const handleDeleteRecord = (id: string) => {
    setExperience(experience.filter((e) => e.id !== id));
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateAnexo8ExperienciaDocx(tender, company, experience);
      downloadDocxBlob(blob, `Anexo_08_Experiencia_del_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* 1. Header with Compact Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Paso 3 de 6 • Requisitos de Calificación • Anexo N° 8 OSCE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Experiencia del Postor en la Especialidad
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Acredite contratos, órdenes de servicio o comprobantes para sustentar la experiencia mínima requerida según las Bases.
            </p>
          </div>

          {/* Direct Download Action */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Descargar Anexo N° 8 de Experiencia en Word"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "Generando..." : "Descargar Anexo 8 (.docx)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Document Processing Workspace */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Carga y Extracción de Contratos
            </span>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveInputTab("upload")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeInputTab === "upload" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Subir PDF / Escaneado</span>
            </button>

            <button
              onClick={() => setActiveInputTab("text")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeInputTab === "text" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pegar Texto / Contratos</span>
            </button>

            <button
              onClick={() => setActiveInputTab("presets")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeInputTab === "presets" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Plantillas Rápidas</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Tab 1: PDF Upload */}
          {activeInputTab === "upload" && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                  {uploadedPdf ? uploadedPdf.fileName : "Haga clic o arrastre aquí el archivo PDF de Contratos o Facturas"}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Soporta Contratos, Actas de Recepción, Liquidaciones de Obra, Órdenes de Compra/Servicio y Facturas.
                </p>
                {uploadedPdf && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    PDF cargado: {uploadedPdf.pageCount} páginas • Listo para procesar
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPdfCutter(true)}
                  className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Abrir herramienta para cortar y seleccionar solo las páginas de contratos que te interesan"
                >
                  <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cortar y Seleccionar Páginas (PDF Cutter)</span>
                </button>

                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={isAnalyzing || isExtractingPdf || (!uploadedPdf && !rawText)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? "Procesando y Evaluando..." : "Extraer y Evaluar Contratos"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Text / Contract list */}
          {activeInputTab === "text" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Pegue la relación de contratos, comprobantes o texto de experiencia:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Ejemplo:
CONTRATO N° 018-2023-MDSJ/GM - Municipalidad Distrital de San Jerónimo - Creación de pistas y veredas - Monto: S/ 285,000.00 - Fecha de conformidad: 20/11/2023.
CONTRATO N° 102-2022-GRC/GGR - Gobierno Regional de Cusco - Mantenimiento vial y obras de arte - Monto: S/ 195,000.00 - Fecha: 28/02/2023.`}
                rows={4}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={isAnalyzing || !rawText.trim()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? "Procesando texto..." : "Procesar y Evaluar Contratos"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Presets */}
          {activeInputTab === "presets" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 font-medium">
                Seleccione un paquete de experiencia preconfigurado para probar de inmediato:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_EXPERIENCE_SAMPLES.map((preset) => {
                  const presetTotal = preset.sampleRecords.reduce((acc, curr) => acc + curr.montoEnSoles, 0);
                  return (
                    <div
                      key={preset.title}
                      onClick={() => handleLoadPreset(preset)}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-left cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs">{preset.title}</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {formatPEN(presetTotal)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{preset.sampleRecords.length} Contratos Acreditados</p>
                      <div className="mt-2 text-[10px] text-blue-700 font-semibold flex items-center space-x-1">
                        <span>Cargar este paquete</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Financial & Qualification Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Monto Mínimo Exigido en Bases:</span>
          <div className="text-lg font-bold text-slate-900 mt-1">{formatPEN(requiredAmountNum)}</div>
          <span className="text-[10px] text-slate-400">1x Valor Referencial de Convocatoria</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Acumulado en Obras Similares:</span>
          <div className="text-lg font-bold text-emerald-600 mt-1">{formatPEN(totalSimilarSoles)}</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${isFullyCovered ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">{progressPercent}% del requisito exigido</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Total Facturado Acreditado:</span>
          <div className="text-lg font-bold text-blue-600 mt-1">{formatPEN(totalSoles)}</div>
          <span className="text-[10px] text-slate-500">{experience.length} contratos registrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 block">Dictamen de Calificación:</span>
          <div className="mt-1">
            {isFullyCovered ? (
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CUMPLE REQUISITO (APTO)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 font-bold text-xs px-2.5 py-1 rounded border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>FALTAN {formatPEN(requiredAmountNum - totalSimilarSoles)}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Conforme a Requisitos de Calificación</span>
        </div>
      </div>

      {/* 4. Intelligent PDF Segmenter & Detector Section (Only when detected documents exist) */}
      {detectedDocs.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Detector de Experiencia & Segmentador de Páginas PDF por Especialidad
                  </h3>
                  <span className="bg-blue-600 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                    {detectedDocs.length} detectados
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600">
                  El lector inteligente identificó los conjuntos de contratos en el PDF y calculó qué páginas exactas cortar según la especialidad de las Bases (<strong>{tender.especialidad || "Viales"} &gt; {tender.subEspecialidad || "Vías urbanas"}</strong>).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBatchCutAllValidDocs}
                disabled={isBatchCutting || !uploadedPdf}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                title="Corta automáticamente todos los contratos detectados en archivos PDF individuales para el expediente"
              >
                {isBatchCutting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cortando Lote...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Cortar Todos en Lote (1 Clic)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPdfCutter(true)}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-blue-600" />
                <span>Cortador Manual</span>
              </button>
            </div>
          </div>

          {/* Grid of Detected Documents with Cutting Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {detectedDocs.map((doc, idx) => {
              const isCut = cutSuccessDocs[doc.id];
              return (
                <div
                  key={doc.id || idx}
                  className="bg-white rounded-xl border border-blue-100 hover:border-blue-300 p-4 shadow-xs space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block leading-tight">
                            {doc.nroDocumento}
                          </span>
                          <span className="text-[10.5px] text-slate-500 block truncate max-w-[240px]">
                            {doc.cliente}
                          </span>
                        </div>
                      </div>

                      {/* Page Range Badge */}
                      <span className="bg-amber-100 text-amber-900 font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg border border-amber-300 shrink-0 flex items-center space-x-1">
                        <Scissors className="w-3 h-3 text-amber-700" />
                        <span>Págs. {doc.rangoPaginas || doc.rangoCorteSugerido || "1"}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {doc.objetoContrato}
                    </p>

                    {/* Specialty & Similarity Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="bg-blue-50 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200">
                        {doc.tipoDocumento}
                      </span>
                      <span className="bg-purple-50 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-200">
                        {doc.subEspecialidad || doc.especialidad || "Obras Viales"}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {doc.porcentajeSimilaridad || 100}% Similar
                      </span>
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-auto">
                        {formatPEN(doc.montoEnSoles || 0)}
                      </span>
                    </div>

                    {/* Cutting Instruction Note */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {doc.instruccionCorte || `Extraer páginas ${doc.rangoPaginas} que contienen el contrato y su acta de recepción.`}
                      </span>
                    </div>
                  </div>

                  {/* Actions per document */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    {isCut ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recorte Guardado ✓</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickCutDocument(doc)}
                        className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        title="Extrae solo estas páginas del PDF y las guarda en el expediente"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Cortar Págs. {doc.rangoPaginas} (1 Clic)</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCutterForDoc(doc)}
                        className="text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Abrir en el modal con vista previa"
                      >
                        Ajustar Rango
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Experience Records Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Relación de Contratos y Comprobantes para el Anexo N° 8 ({experience.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Chips */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setFilterSpecialty("TODOS")}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  filterSpecialty === "TODOS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos ({experience.length})
              </button>
              <button
                onClick={() => setFilterSpecialty("SIMILARES")}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  filterSpecialty === "SIMILARES" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Solo Similares ({experience.filter((e) => e.esSimilar !== false).length})
              </button>
            </div>

            <button
              onClick={handleOpenAddForm}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Contrato / Factura</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="p-3 text-center">N°</th>
                <th className="p-3">Cliente / Entidad</th>
                <th className="p-3">Objeto de Contratación & N° Documento</th>
                <th className="p-3 text-center">Páginas PDF / Corte</th>
                <th className="p-3 text-center">Similitud Acreditada</th>
                <th className="p-3 text-center">Fecha Conformidad</th>
                <th className="p-3 text-right">Importe Soles (S/)</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExperience.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No se encontraron registros de experiencia. Puede cargarlos en el panel superior o agregarlos manualmente con el botón azul.
                  </td>
                </tr>
              ) : (
                filteredExperience.map((rec, idx) => {
                  const pagesRef = rec.sourcePdfPages || rec.rangoCorteSugerido || (rec.pagInicio ? `${rec.pagInicio}-${rec.pagFin}` : null);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{rec.cliente}</div>
                        <span className="text-[10px] text-slate-500 uppercase">{rec.tipoCliente}</span>
                      </td>
                      <td className="p-3 max-w-md">
                        <div className="text-slate-800 font-medium text-xs line-clamp-2">{rec.objetoContrato}</div>
                        <div className="font-mono text-slate-500 text-[10.5px] mt-0.5">{rec.nroDocumento}</div>
                      </td>
                      <td className="p-3 text-center">
                        {pagesRef ? (
                          <span className="bg-blue-50 text-blue-700 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded border border-blue-200 inline-flex items-center space-x-1" title={rec.instruccionCorte || "Páginas acreditadas en el PDF"}>
                            <Scissors className="w-3 h-3 text-blue-600" />
                            <span>Págs. {pagesRef}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10.5px] italic">Completo</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rec.esSimilar !== false ? (
                          <div>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center space-x-1" title={rec.justificacionSimilaridad || "Obra similar"}>
                              <span>✓ {rec.porcentajeSimilaridad || 100}% Similar</span>
                            </span>
                            {rec.justificacionSimilaridad && (
                              <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-xs mx-auto">
                                {rec.justificacionSimilaridad}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                            Exp. General
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-mono text-slate-700">{rec.fechaConformidad}</div>
                        <span className="text-[9.5px] text-emerald-600 font-semibold block">Válido OSCE</span>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono text-xs">
                        {formatPEN(rec.montoEnSoles)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditForm(rec)}
                            className="text-slate-600 hover:text-blue-600 p-1 rounded transition cursor-pointer"
                            title="Editar contrato"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                            title="Eliminar contrato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={6} className="p-3 text-right text-slate-800">
                  TOTAL ACUMULADO EN SOLES:
                </td>
                <td className="p-3 text-right text-emerald-800 text-sm font-mono">
                  {formatPEN(totalSoles)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Modal / Form for Adding or Editing Experience Record */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingRecordId ? "Editar Registro de Contrato / Comprobante" : "Registrar Nueva Contratación de Experiencia"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Cliente / Entidad Contratante:</label>
                <input
                  type="text"
                  placeholder="Ej: Municipalidad Distrital de San Jerónimo / Empresa Privada"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sector del Cliente:</label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="Público">Sector Público (Entidad del Estado)</option>
                  <option value="Privado">Sector Privado (Empresa)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° de Contrato / O.S. / Factura:</label>
                <input
                  type="text"
                  placeholder="Ej: CONTRATO N° 018-2023-MDSJ/GM"
                  value={nroDoc}
                  onChange={(e) => setNroDoc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Objeto del Contrato (Descripción de la obra o servicio similar):</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Creación del servicio de transitabilidad vehicular y peatonal con pavimento asfáltico y veredas..."
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Conformidad / Liquidación:</label>
                <input
                  type="date"
                  value={fechaConformidad}
                  onChange={(e) => setFechaConformidad(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Comprobante / Sustento:</label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => setTipoComprobante(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="Contrato + Conformidad">Contrato + Acta de Conformidad/Recepción</option>
                  <option value="Orden de Servicio/Compra + Conformidad">Orden de Servicio/Compra + Conformidad</option>
                  <option value="Comprobante de Pago Cancelado">Comprobante de Pago Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Moneda del Contrato:</label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dólares Americanos (USD)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {moneda === "USD" ? "Importe Original (USD):" : "Importe Facturado (Soles):"}
                </label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-bold text-emerald-700 font-mono text-sm"
                />
              </div>

              {moneda === "USD" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Cambio SBS (Venta):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tipoCambio}
                    onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 3.75)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Monto calculado: {formatPEN(monto * tipoCambio)}</span>
                </div>
              )}

              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="esSimilarCheck"
                    checked={esSimilar}
                    onChange={(e) => setEsSimilar(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="esSimilarCheck" className="font-bold text-slate-800 cursor-pointer">
                    Califica como Obra / Servicio Similar para Requisitos de Calificación
                  </label>
                </div>
                {esSimilar && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Sustento técnico de similitud:</label>
                    <input
                      type="text"
                      value={justificacionSimilaridad}
                      onChange={(e) => setJustificacionSimilaridad(e.target.value)}
                      placeholder="Coincide con las partidas de pavimentación y transitabilidad vial de las Bases."
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRecord}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                {editingRecordId ? "Actualizar Contrato" : "Guardar Contrato"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bottom Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/40 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Paso 3 de 6 • Requisitos de Calificación Acreditados
          </div>
          <h4 className="text-base font-bold text-white mt-0.5">
            Siguiente Paso: Configurar Personal Clave y Equipamiento Estratégico
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Importe los cargos y perfiles exigidos directamente de las Bases analizadas y acredite a su equipo técnico para la obra o servicio.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => (onNavigateToTab ? onNavigateToTab("personnel") : null)}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow cursor-pointer flex items-center space-x-2"
          >
            <span>Continuar al Paso 4: Personal y Equipos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* 7. PDF Cutter Modal */}
      {(showPdfCutter || cutterConfig.isOpen) && (
        <PdfCutterModal
          isOpen={showPdfCutter || cutterConfig.isOpen}
          onClose={() => {
            setShowPdfCutter(false);
            setCutterConfig({ isOpen: false });
          }}
          onSnippetCreated={handleSnippetCreated}
          defaultCategory={cutterConfig.initialCategory || "experiencia"}
          initialPdf={uploadedPdf}
          detectedSuggestions={detectedDocs}
          initialTitle={cutterConfig.initialTitle}
          initialPageRange={cutterConfig.initialPageRange}
          initialNotes={cutterConfig.initialNotes}
        />
      )}
    </div>
  );
};
