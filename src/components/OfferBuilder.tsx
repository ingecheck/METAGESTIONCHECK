import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Edit,
  Building,
  Coins,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCheck,
  PackageCheck,
  Layers,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  Eye,
  Info,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Paperclip,
  Scissors,
  FileDown,
  RefreshCw,
  Stamp,
  ExternalLink,
  Maximize2,
  Minimize2,
  X,
  FileSearch,
} from "lucide-react";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
  ClippedPdfSnippet,
} from "../types/osce";
import {
  generateAnexo1Docx,
  generateAnexo2Docx,
  generateAnexo3Docx,
  generateAnexo4Docx,
  generateAnexo5PromesaConsorcioDocx,
  generateAnexo6EconomicoDocx,
  generateAnexo8ExperienciaDocx,
  generatePersonalYEquipamientoDocx,
  generateDeclaracionJuradaEquipamientoDocx,
  generateContratoConsorcioDocx,
  generateCaratulasSeparadorasDocx,
  downloadDocxBlob,
  formatPEN,
} from "../services/docxGenerator";
import { PROCUREMENT_GUIDELINES, ProcurementGuideline } from "../data/procurementGuidelines";
import { buildGuidelineDocItems, DynamicOfferDocItem } from "../services/guidelineAnnexService";
import { AnnexEditorModal } from "./AnnexEditorModal";
import { extractTextFromPdfFile } from "../services/pdfExtractor";
import { generateMasterUnifiedPdf } from "../services/pdfMasterService";
import { PdfCutterModal } from "./PdfCutterModal";
import saveAs from "file-saver";

interface OfferBuilderProps {
  tender: TenderInfo;
  company: CompanyProfile;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  observations: ObservationItem[];
  montoOfertado: number;
  setMontoOfertado: (val: number) => void;
  incluyeIGV: boolean;
  setIncluyeIGV: (val: boolean) => void;
  onNavigateToTab: (tab: string) => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
}

const STORAGE_KEY = "osce_interactive_dossier_docs";
const SNIPPETS_STORAGE_KEY = "osce_clipped_pdf_snippets";

export const OfferBuilder: React.FC<OfferBuilderProps> = ({
  tender,
  company,
  personal,
  equipment,
  experience,
  observations,
  montoOfertado,
  setMontoOfertado,
  incluyeIGV,
  setIncluyeIGV,
  onNavigateToTab,
  onDownloadAllZip,
  isDownloadingZip,
}) => {
  const [selectedAnnex, setSelectedAnnex] = useState<{ id: string; title: string } | null>(null);
  const [customContents, setCustomContents] = useState<Record<string, string>>({});
  const [isGeneratingUnifiedPdf, setIsGeneratingUnifiedPdf] = useState(false);
  const [showPdfCutterModal, setShowPdfCutterModal] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Active view mode: builder (default dossier view), preview (integrated PDF viewer), or order_manager
  const [activeViewTab, setActiveViewTab] = useState<"builder" | "preview" | "order_manager">("builder");
  const [unifiedPdfBlobUrl, setUnifiedPdfBlobUrl] = useState<string | null>(null);
  const [unifiedPdfTotalPages, setUnifiedPdfTotalPages] = useState<number>(0);
  const [isPdfViewerFullscreen, setIsPdfViewerFullscreen] = useState(false);

  // Modal for adding a custom document
  const [showAddCustomDocModal, setShowAddCustomDocModal] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState("");
  const [customDocSubtitle, setCustomDocSubtitle] = useState("");
  const [customDocFolder, setCustomDocFolder] = useState<DynamicOfferDocItem["folderKey"]>("folder1");
  const [customDocPages, setCustomDocPages] = useState(1);
  const [customDocMandatory, setCustomDocMandatory] = useState(false);

  // Selected guideline local override
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>(
    tender.guidelineId || PROCUREMENT_GUIDELINES[0].id
  );

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    folder1: true,
    folder2: true,
    folder3: true,
    folder4: true,
  });

  // State for user-cut PDF snippets
  const [clippedSnippets, setClippedSnippets] = useState<ClippedPdfSnippet[]>(() => {
    const saved = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: "snip-default-1",
        title: "Contrato N° 018-2023-MDSJ/GM y Acta de Recepción (Págs 1 a 3)",
        category: "experiencia",
        sourceFileName: "Contrato_San_Jeronimo_Completo.pdf",
        selectedPages: "Págs 1-3 (3 pág.)",
        pageCount: 3,
        pdfBase64: "",
        createdAt: Date.now() - 100000,
        isIncluded: true,
        notes: "Acredita S/ 285,000.00 en obras viales similares.",
      },
      {
        id: "snip-default-2",
        title: "Título Profesional y Certificado de Habilitación CIP - Residente",
        category: "personal",
        sourceFileName: "Expediente_CV_Ing_Mendoza.pdf",
        selectedPages: "Págs 1-2 (2 pág.)",
        pageCount: 2,
        pdfBase64: "",
        createdAt: Date.now() - 50000,
        isIncluded: true,
        notes: "Ingeniero Civil Colegiado y Habilitado.",
      },
    ];
  });

  // Save snippets to localStorage
  useEffect(() => {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(clippedSnippets));
  }, [clippedSnippets]);

  // Active guideline resolution
  const activeGuideline: ProcurementGuideline =
    PROCUREMENT_GUIDELINES.find((g) => g.id === selectedGuidelineId) ||
    PROCUREMENT_GUIDELINES.find((g) => g.id === tender.guidelineId) ||
    PROCUREMENT_GUIDELINES[0];

  // State for user-managed interactive document checklist
  const [docItems, setDocItems] = useState<DynamicOfferDocItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${activeGuideline.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return buildGuidelineDocItems(
      activeGuideline,
      tender,
      company,
      personal,
      equipment,
      experience,
      montoOfertado,
      incluyeIGV
    );
  });

  // Re-generate doc items whenever the selected procurement guideline changes
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${activeGuideline.id}`);
    if (saved) {
      try {
        setDocItems(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setDocItems(
      buildGuidelineDocItems(
        activeGuideline,
        tender,
        company,
        personal,
        equipment,
        experience,
        montoOfertado,
        incluyeIGV
      )
    );
  }, [activeGuideline.id, company.esConsorcio, company.razonSocial, company.ruc]);

  // Save doc items per guideline
  useEffect(() => {
    if (docItems.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${activeGuideline.id}`, JSON.stringify(docItems));
    }
  }, [docItems, activeGuideline.id]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (unifiedPdfBlobUrl) {
        URL.revokeObjectURL(unifiedPdfBlobUrl);
      }
    };
  }, [unifiedPdfBlobUrl]);

  // Reset checklist to guideline defaults
  const handleResetChecklistToGuideline = () => {
    const fresh = buildGuidelineDocItems(
      activeGuideline,
      tender,
      company,
      personal,
      equipment,
      experience,
      montoOfertado,
      incluyeIGV
    );
    setDocItems(fresh);
    localStorage.setItem(`${STORAGE_KEY}_${activeGuideline.id}`, JSON.stringify(fresh));
    setStatusNotification(`Checklist restablecido con éxito al formato oficial de ${activeGuideline.nombre}.`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Upload custom PDF ref
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const [targetFolderForUpload, setTargetFolderForUpload] = useState<DynamicOfferDocItem["folderKey"]>("folder1");

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleInclude = (id: string) => {
    setDocItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isIncluded: !item.isIncluded } : item))
    );
  };

  const handleToggleSnippetInclude = (id: string) => {
    setClippedSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isIncluded: s.isIncluded === false ? true : false } : s))
    );
  };

  const handleDeleteSnippet = (id: string) => {
    setClippedSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSnippetCreated = (newSnippet: ClippedPdfSnippet) => {
    setClippedSnippets((prev) => [...prev, newSnippet]);
    setStatusNotification(`Recorte "${newSnippet.title}" añadido con éxito.`);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleSelectAll = (included: boolean) => {
    setDocItems((prev) => prev.map((item) => ({ ...item, isIncluded: included })));
    setClippedSnippets((prev) => prev.map((s) => ({ ...s, isIncluded: included })));
  };

  const handleSelectOnlyMandatory = () => {
    setDocItems((prev) =>
      prev.map((item) => ({ ...item, isIncluded: item.isMandatory }))
    );
  };

  const handleDeleteDocItem = (id: string) => {
    setDocItems((prev) => prev.filter((item) => item.id !== id));
    setStatusNotification("Documento retirado del expediente.");
    setTimeout(() => setStatusNotification(null), 2500);
  };

  // Document reordering handlers
  const handleMoveDocUp = (index: number) => {
    if (index <= 0) return;
    setDocItems((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDocDown = (index: number) => {
    if (index >= docItems.length - 1) return;
    setDocItems((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleTriggerUpload = (folderKey: DynamicOfferDocItem["folderKey"]) => {
    setTargetFolderForUpload(folderKey);
    fileUploadInputRef.current?.click();
  };

  const handleCustomPdfUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const extracted = await extractTextFromPdfFile(file);
      const newDoc: DynamicOfferDocItem = {
        id: "custom-pdf-" + Date.now(),
        folderKey: targetFolderForUpload,
        title: file.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
        subtitle: `Documento PDF adjunto (${extracted.pageCount} páginas).`,
        type: "uploaded_pdf",
        isIncluded: true,
        isMandatory: false,
        estimatedPages: extracted.pageCount || 1,
        fileName: file.name,
      };

      setDocItems((prev) => [...prev, newDoc]);
      setStatusNotification(`Documento "${file.name}" incorporado.`);
      setTimeout(() => setStatusNotification(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocTitle.trim()) return;

    const newDoc: DynamicOfferDocItem = {
      id: "user-custom-doc-" + Date.now(),
      folderKey: customDocFolder,
      title: customDocTitle.trim(),
      subtitle: customDocSubtitle.trim() || "Documento adicional personalizado incorporado a la propuesta.",
      type: "generated",
      isIncluded: true,
      isMandatory: customDocMandatory,
      estimatedPages: customDocPages || 1,
    };

    setDocItems((prev) => [...prev, newDoc]);
    setShowAddCustomDocModal(false);
    setCustomDocTitle("");
    setCustomDocSubtitle("");
    setCustomDocPages(1);
    setStatusNotification(`Documento "${newDoc.title}" agregado con éxito.`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleSaveCustomContent = (annexId: string, content: string) => {
    setCustomContents((prev) => ({ ...prev, [annexId]: content }));
  };

  // Master Generator: Produces ONE Unified Merged Foliated PDF and generates a Blob URL for live preview
  const handleGenerateUnifiedMasterPdf = async (autoOpenPreview = false) => {
    setIsGeneratingUnifiedPdf(true);
    setStatusNotification("Ensamblando carátula, índice, anexos de lineamiento, recortes PDF y foliación...");

    try {
      const result = await generateMasterUnifiedPdf({
        tender,
        company,
        montoOfertado,
        incluyeIGV,
        personal,
        equipment,
        experience,
        clippedSnippets,
        docItems,
      });

      // Revoke old blob url
      if (unifiedPdfBlobUrl) {
        URL.revokeObjectURL(unifiedPdfBlobUrl);
      }

      const newUrl = URL.createObjectURL(result.blob);
      setUnifiedPdfBlobUrl(newUrl);
      setUnifiedPdfTotalPages(result.totalPages);

      if (autoOpenPreview) {
        setActiveViewTab("preview");
      }

      setStatusNotification(`¡Éxito! Se consolidó el PDF Integral con ${result.totalPages} folios foliados.`);
      setTimeout(() => setStatusNotification(null), 5000);

      return result;
    } catch (err: any) {
      console.error("Error generating master PDF:", err);
      alert("Error al generar el PDF único: " + (err.message || String(err)));
      return null;
    } finally {
      setIsGeneratingUnifiedPdf(false);
    }
  };

  const handleDownloadUnifiedPdfDirect = async () => {
    const result = await handleGenerateUnifiedMasterPdf(false);
    if (result) {
      const safeNomenclatura = (tender.nomenclatura || "Oferta_SEACE").replace(/[\/\\:]/g, "_");
      const filename = `Expediente_Integral_Oferta_${safeNomenclatura}.pdf`;
      saveAs(result.blob, filename);
    }
  };

  // Direct fast download helper for individual Word annexes
  const handleQuickDownload = async (annexId: string) => {
    let blob: Blob;
    let filename = "";

    switch (annexId) {
      case "anexo1":
        blob = await generateAnexo1Docx(tender, company);
        filename = `01_Anexo_1_Datos_del_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo2":
        blob = await generateAnexo2Docx(tender, company, customContents["anexo2"]);
        filename = `02_Anexo_2_Cumplimiento_TDR_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo3":
        blob = await generateAnexo3Docx(tender, company);
        filename = `03_Anexo_3_Plazo_Entrega_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo4":
        blob = await generateAnexo4Docx(tender, company);
        filename = `04_Anexo_4_Declaracion_Art52_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo5":
        blob = await generateAnexo5PromesaConsorcioDocx(tender, company);
        filename = `05_Anexo_5_Promesa_Consorcio_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo6":
        blob = await generateAnexo6EconomicoDocx(tender, company, montoOfertado, incluyeIGV);
        filename = `06_Anexo_6_Oferta_Economica_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "anexo8":
      case "anexo11_experiencia":
        blob = await generateAnexo8ExperienciaDocx(tender, company, experience);
        filename = `07_Anexo_8_Experiencia_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "personal":
      case "anexo19_personal":
        blob = await generatePersonalYEquipamientoDocx(tender, company, personal, equipment);
        filename = `08_Personal_y_Equipamiento_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "djEquipos":
        blob = await generateDeclaracionJuradaEquipamientoDocx(tender, company, equipment);
        filename = `08B_Declaracion_Jurada_Equipamiento_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "contratoConsorcio":
        blob = await generateContratoConsorcioDocx(tender, company);
        filename = `Contrato_Privado_de_Consorcio_${(company.nombreConsorcio || "Consorcio").replace(/[\s\/\\:]/g, "_")}.docx`;
        break;
      case "caratulas":
        blob = await generateCaratulasSeparadorasDocx(tender, company, { personal, experience, equipment });
        filename = `Caratulas_y_Separadores_Oficiales_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      default:
        blob = await generateAnexo1Docx(tender, company);
        filename = `Documento_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
    }

    downloadDocxBlob(blob, filename);
  };

  // Metrics
  const includedDocs = docItems.filter((d) => d.isIncluded);
  const activeSnippets = clippedSnippets.filter((s) => s.isIncluded !== false);
  const snippetPagesCount = activeSnippets.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);
  const totalEstimatedPages =
    includedDocs.reduce((acc, curr) => acc + curr.estimatedPages, 0) + snippetPagesCount + 2; // +2 for Cover & Index

  const foldersDef = [
    {
      key: "folder1" as const,
      number: "01",
      title: "Sobre Técnico: Requisitos de Admisión Obligatorios",
      badge: "Anexos 1, 2, 3, 4 y 5",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Declaraciones juradas de datos, cumplimiento de TDR/EETT, plazo contractual y promesa de consorcio.",
    },
    {
      key: "folder2" as const,
      number: "02",
      title: "Sobre Técnico: Habilitación Legal y Representación Jurídica",
      badge: "RNP, RUC, Poderes SUNARP",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      description: "Documentos legales de vigencia de poder, constancia RNP activa y condición tributaria habida.",
    },
    {
      key: "folder3" as const,
      number: "03",
      title: "Sobre Técnico: Capacidad Técnica y Requisitos de Calificación",
      badge: "Anexo 8 + CVs + Maquinaria",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Acreditación de experiencia en la especialidad, personal clave titulado/colegiado y equipamiento.",
    },
    {
      key: "folder4" as const,
      number: "04",
      title: "Sobre Económico: Propuesta Económica y Desglose",
      badge: "Anexo 6 Oficial",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Monto total ofertado con o sin IGV y estructura de costos o análisis de precios unitarios.",
    },
  ];

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-x-hidden">
      {/* Hidden file input for uploading custom PDF to any folder */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleCustomPdfUploaded}
        className="hidden"
      />

      {/* 1. Header with Balanced Title & Actions */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4 shrink-0" />
              <span>Paso 6 de 6 • Consolidación y Armado del Expediente</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Mesa de Trabajo Digital: Armador y Ensamblador de Oferta
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Corta páginas de PDFs, gestiona documentos interactivos (agregar, reordenar, eliminar) y visualiza o descarga el **PDF INTEGRADO FOLIADO** con carátula e índice oficial del SEACE.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Integrated PDF Button */}
            <button
              onClick={() => handleGenerateUnifiedMasterPdf(true)}
              disabled={isGeneratingUnifiedPdf}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Genera y visualiza directamente el PDF unificado con carátula e índice en pantalla"
            >
              {isGeneratingUnifiedPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>Visualizar PDF Integrado</span>
                </>
              )}
            </button>

            {/* Direct Download Master PDF Button */}
            <button
              onClick={handleDownloadUnifiedPdfDirect}
              disabled={isGeneratingUnifiedPdf}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Descarga directa del PDF único foliado"
            >
              <Stamp className="w-4 h-4 shrink-0" />
              <span>Descargar PDF Único</span>
            </button>

            {/* ZIP Package Button */}
            <button
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Descargar todos los archivos editables en Word y anexos en un ZIP"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isDownloadingZip ? "Empaquetando..." : "Descargar ZIP"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* 2. Well-Fitted & Balanced Active Guideline & Control Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-center">
          {/* Card: Lineamiento Activo (Fixed Width & Clean Layout) */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Lineamiento Activo
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded">
                Bases Oficiales
              </span>
            </div>

            {/* Guideline Selector Dropdown */}
            <select
              value={activeGuideline.id}
              onChange={(e) => {
                setSelectedGuidelineId(e.target.value);
                const g = PROCUREMENT_GUIDELINES.find((item) => item.id === e.target.value);
                if (g) {
                  const fresh = buildGuidelineDocItems(
                    g,
                    tender,
                    company,
                    personal,
                    equipment,
                    experience,
                    montoOfertado,
                    incluyeIGV
                  );
                  setDocItems(fresh);
                }
              }}
              className="w-full bg-slate-900 text-white text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              {PROCUREMENT_GUIDELINES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} ({g.tipo})
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-400 truncate">
              Rol: <strong className="text-slate-200">{activeGuideline.rolPostor}</strong>
            </div>
          </div>

          {/* Metric 1: Documents & Annexes Included */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Documentos & Anexos Activos
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {includedDocs.length + activeSnippets.length} de {docItems.length + clippedSnippets.length}
            </div>
            <span className="text-[11px] text-slate-400">Listos para el PDF integrado</span>
          </div>

          {/* Metric 2: Estimated Folios */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Foliación Oficial Estimada
            </span>
            <div className="text-lg font-bold text-blue-300 mt-1">
              ~{totalEstimatedPages} Folios
            </div>
            <span className="text-[11px] text-slate-400">Incluye carátula, índice y sellos</span>
          </div>

          {/* Metric 3: Economic Offer Summary */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Propuesta Económica (Anexo 6)
            </span>
            <div className="text-lg font-bold text-amber-300 mt-1 font-mono">
              {formatPEN(montoOfertado)}
            </div>
            <span className="text-[11px] text-slate-400">
              {incluyeIGV ? "Incluye IGV (18%)" : "Sin IGV"}
            </span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Main Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveViewTab("builder")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeViewTab === "builder"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mesa de Sobres (1 al 4)</span>
            </button>

            <button
              onClick={() => setActiveViewTab("order_manager")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeViewTab === "order_manager"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Gestor & Orden del PDF ({docItems.length})</span>
            </button>

            <button
              onClick={() => {
                if (!unifiedPdfBlobUrl) {
                  handleGenerateUnifiedMasterPdf(true);
                } else {
                  setActiveViewTab("preview");
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                activeViewTab === "preview"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visualizador PDF {unifiedPdfTotalPages > 0 && `(${unifiedPdfTotalPages} pág.)`}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddCustomDocModal(true)}
              className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Documento</span>
            </button>

            <button
              onClick={() => setShowPdfCutterModal(true)}
              className="flex items-center space-x-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition cursor-pointer font-bold shadow-xs"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cortar Páginas PDF</span>
            </button>

            <button
              onClick={handleResetChecklistToGuideline}
              className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/40 transition cursor-pointer font-semibold"
              title="Recarga los anexos y requisitos exactos del lineamiento seleccionado"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Anexos de Bases</span>
            </button>

            <button
              onClick={() => handleSelectAll(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer font-medium"
            >
              Incluir Todos
            </button>

            <button
              onClick={handleSelectOnlyMandatory}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer font-medium"
            >
              Solo Obligatorios
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW TAB 1: INTEGRATED PDF LIVE VIEWER & INSPECTOR                        */}
      {/* ========================================================================= */}
      {activeViewTab === "preview" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <FileSearch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Visualizador del PDF Integrado y Foliado Oficial ({tender.nomenclatura})
                </h3>
                <p className="text-xs text-slate-400">
                  {unifiedPdfTotalPages > 0
                    ? `Expediente generado con ${unifiedPdfTotalPages} folios numerados consecutivamente.`
                    : "Genere el documento para visualizar todas las páginas foliadas."}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleGenerateUnifiedMasterPdf(true)}
                disabled={isGeneratingUnifiedPdf}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingUnifiedPdf ? "animate-spin" : ""}`} />
                <span>Regenerar Vista</span>
              </button>

              <button
                onClick={handleDownloadUnifiedPdfDirect}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>

              <button
                onClick={() => setIsPdfViewerFullscreen(!isPdfViewerFullscreen)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                title={isPdfViewerFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isPdfViewerFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setActiveViewTab("builder")}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                title="Cerrar visor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`p-4 bg-slate-100 ${isPdfViewerFullscreen ? "fixed inset-0 z-50 p-6 flex flex-col bg-slate-900" : ""}`}>
            {isPdfViewerFullscreen && (
              <div className="flex items-center justify-between pb-4 text-white">
                <span className="font-bold text-sm">Vista Previa a Pantalla Completa: {tender.nomenclatura}</span>
                <button
                  onClick={() => setIsPdfViewerFullscreen(false)}
                  className="bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold"
                >
                  Cerrar Pantalla Completa
                </button>
              </div>
            )}

            {isGeneratingUnifiedPdf ? (
              <div className="h-[600px] flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-300">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="font-bold text-slate-800 text-sm">Ensamblando y Foliando Documentos...</p>
                <p className="text-xs text-slate-500">Uniendo carátula, índice, anexos de bases y recortes PDF.</p>
              </div>
            ) : unifiedPdfBlobUrl ? (
              <iframe
                src={unifiedPdfBlobUrl}
                title="Visualizador de PDF Integrado"
                className="w-full h-[720px] rounded-xl border border-slate-300 shadow-inner bg-white"
              />
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-300 text-center p-6">
                <Stamp className="w-12 h-12 text-slate-300" />
                <h4 className="font-bold text-slate-800 text-sm">Aún no se ha generado la vista previa del PDF</h4>
                <p className="text-xs text-slate-500 max-w-md">
                  Haga clic en el botón a continuación para ensamblar todos los documentos, aplicar la foliación automática y visualizar el resultado.
                </p>
                <button
                  onClick={() => handleGenerateUnifiedMasterPdf(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Generar y Visualizar PDF Integrado</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TAB 2: ORDER MANAGER & REORDERING (GESTIONAR EL INTEGRADO EN PDF)    */}
      {/* ========================================================================= */}
      {activeViewTab === "order_manager" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Gestor de Composición y Secuencia de Foliación del PDF Integrado</span>
              </h3>
              <p className="text-xs text-slate-500">
                Cambie el orden con las flechas (▲/▼), active/desactive o elimine documentos para personalizar el armado del expediente.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddCustomDocModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Documento</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {docItems.map((doc, idx) => (
              <div
                key={doc.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  doc.isIncluded
                    ? "bg-white border-slate-200 hover:border-blue-300 shadow-xs"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                {/* Left: Move buttons & Status */}
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col space-y-0.5">
                    <button
                      onClick={() => handleMoveDocUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20 cursor-pointer"
                      title="Subir posición en el expediente"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDocDown(idx)}
                      disabled={idx === docItems.length - 1}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20 cursor-pointer"
                      title="Bajar posición en el expediente"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>

                  <button
                    onClick={() => handleToggleInclude(doc.id)}
                    className={`p-1.5 rounded-md transition cursor-pointer ${
                      doc.isIncluded ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                    }`}
                    title={doc.isIncluded ? "Excluir del PDF" : "Incluir en el PDF"}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Center: Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {doc.title}
                    </span>
                    {doc.isMandatory && (
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200">
                        Obligatorio
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {doc.folderKey.replace("folder", "Sobre ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.subtitle}</p>
                </div>

                {/* Right: Pages & Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">
                    ~{doc.estimatedPages} {doc.estimatedPages === 1 ? "pág." : "págs."}
                  </span>

                  {doc.annexKey && (
                    <button
                      onClick={() => setSelectedAnnex({ id: doc.annexKey!, title: doc.title })}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-semibold transition cursor-pointer"
                      title="Editar contenido"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteDocItem(doc.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition cursor-pointer"
                    title="Eliminar del armado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TAB 3: MESA DE SOBRES Y RECORTE DE PDFS (DEFAULT BUILDER VIEW)        */}
      {/* ========================================================================= */}
      {activeViewTab === "builder" && (
        <>
          {/* 3. Slices Manager: Recortes y Páginas PDF Extraídas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50/70 px-5 sm:px-6 py-4 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Mesa de Recortes PDF: Documentos Específicos Cortados ({clippedSnippets.length})
                  </h3>
                  <p className="text-xs text-slate-600">
                    Páginas extraídas de contratos, CVs, títulos o fichas de maquinaria listas para ensamblar en el PDF único final.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPdfCutterModal(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cortar y Añadir Otro PDF</span>
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {clippedSnippets.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <p>Aún no has recortado documentos PDF específicos.</p>
                  <button
                    onClick={() => setShowPdfCutterModal(true)}
                    className="mt-2 text-indigo-600 font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Abrir Cortador de PDF para extraer páginas clave</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clippedSnippets.map((snippet) => {
                    const isIncluded = snippet.isIncluded !== false;
                    return (
                      <div
                        key={snippet.id}
                        className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                          isIncluded ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50 border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleSnippetInclude(snippet.id)}
                            className={`mt-0.5 p-1 rounded-md transition cursor-pointer shrink-0 ${
                              isIncluded ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                            }`}
                            title={isIncluded ? "Desactivar / Sacar del PDF" : "Activar / Incluir en el PDF"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs truncate block">
                                {snippet.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-indigo-700">{snippet.selectedPages}</span>
                              {" • "}
                              <span>Origen: {snippet.sourceFileName}</span>
                            </div>
                            {snippet.notes && (
                              <div className="text-[10.5px] text-slate-600 italic mt-1 bg-slate-50 px-2 py-0.5 rounded">
                                {snippet.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition cursor-pointer"
                            title="Eliminar recorte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Economic Offer Quick Configuration Widget */}
          <div className="bg-gradient-to-r from-blue-50 via-white to-amber-50/40 p-5 rounded-xl border border-blue-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-800 text-xs font-bold uppercase">
                <Coins className="w-4 h-4 shrink-0" />
                <span>Configuración de Oferta Económica (Anexo N° 6)</span>
              </div>
              <p className="text-xs text-slate-600">
                Valor Referencial de Bases: <strong className="text-slate-800">{formatPEN(tender.valorNumerico || 514737.28)}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Monto Ofertado (Soles):</label>
                <input
                  type="number"
                  value={montoOfertado}
                  onChange={(e) => setMontoOfertado(parseFloat(e.target.value) || 0)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <input
                  type="checkbox"
                  id="igvCheck"
                  checked={incluyeIGV}
                  onChange={(e) => setIncluyeIGV(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="igvCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Incluye IGV (18%)
                </label>
              </div>
            </div>
          </div>

          {/* 5. Interactive Folders (Mesa de Trabajo Digital de Anexos y Expediente) */}
          <div className="space-y-4">
            {foldersDef.map((folder) => {
              const isExpanded = expandedFolders[folder.key];
              const itemsInFolder = docItems.filter((item) => item.folderKey === folder.key);
              const includedCount = itemsInFolder.filter((i) => i.isIncluded).length;

              return (
                <div
                  key={folder.key}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Folder Header */}
                  <div
                    onClick={() => toggleFolder(folder.key)}
                    className="px-5 sm:px-6 py-4 bg-slate-50/80 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-between border-b border-slate-200 select-none"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                        {folder.number}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{folder.title}</h3>
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${folder.badgeColor}`}>
                            {folder.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{folder.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                        {includedCount} de {itemsInFolder.length} incluidos
                      </span>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Folder Content */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="divide-y divide-slate-100">
                        {itemsInFolder.map((item) => (
                          <div
                            key={item.id}
                            className={`py-3.5 px-3 rounded-lg transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              item.isIncluded ? "hover:bg-slate-50" : "bg-slate-50/50 opacity-60"
                            }`}
                          >
                            {/* Left Side: Checkbox & Info */}
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <button
                                onClick={() => handleToggleInclude(item.id)}
                                className={`mt-0.5 p-1 rounded-md transition cursor-pointer shrink-0 ${
                                  item.isIncluded ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                                }`}
                                title={item.isIncluded ? "Excluir del expediente" : "Incluir en el expediente"}
                              >
                                <Check className="w-4 h-4" />
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {item.title}
                                  </span>
                                  {item.isMandatory ? (
                                    <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 shrink-0">
                                      Obligatorio
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded shrink-0">
                                      Opcional
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                              </div>
                            </div>

                            {/* Right Side: Actions (Edit, Download, Foliation estimate) */}
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              <span className="text-[11px] text-slate-400 font-mono mr-2">
                                ~{item.estimatedPages} {item.estimatedPages === 1 ? "folio" : "folios"}
                              </span>

                              {item.annexKey && (
                                <>
                                  <button
                                    onClick={() => setSelectedAnnex({ id: item.annexKey!, title: item.title })}
                                    className="flex items-center space-x-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded font-semibold transition cursor-pointer border border-slate-200"
                                    title="Editar contenido o texto del anexo"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    onClick={() => handleQuickDownload(item.annexKey!)}
                                    className="flex items-center space-x-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded font-semibold transition cursor-pointer border border-blue-200"
                                    title="Descargar anexo individual en formato Word (.docx)"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Word</span>
                                  </button>
                                </>
                              )}

                              {item.type === "uploaded_pdf" && (
                                <button
                                  onClick={() => handleDeleteDocItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition cursor-pointer"
                                  title="Eliminar documento adjunto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Custom PDF Button inside Folder */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleTriggerUpload(folder.key)}
                          className="flex-1 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-lg p-2.5 text-xs text-slate-600 hover:text-blue-700 font-semibold transition cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>Adjuntar Documento PDF adicional a este sobre</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5.5. Centro de Carátulas y Descargas Directas de Documentos Word (.docx) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Generador de Carátulas, Separadores y Descargas Individuales en Word (.docx)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Obtenga las carátulas oficiales reglamentarias para foliación y los documentos específicos listos para firma notarial.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {/* Card Carátulas */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                      Oficial SEACE
                    </span>
                    <span className="text-xs font-mono text-slate-400">~6 páginas</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Carátulas y Separadores Oficiales
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Portadas para Sobre 1 (Admisión), Sobre 2 (Habilitación), Sobre 3 (Técnica) y Sobre 4 (Económica).
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDownload("caratulas")}
                  className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Carátulas (.docx)</span>
                </button>
              </div>

              {/* Card Contrato Consorcio (if consortium) */}
              {company.esConsorcio && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                        Notarial
                      </span>
                      <span className="text-xs font-mono text-slate-400">~3 páginas</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Contrato Privado de Consorcio
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Con 11 facultades expresas, Cláusulas 1 a 10, representación común y designación de operador tributario.
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickDownload("contratoConsorcio")}
                    className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Contrato Consorcio (.docx)</span>
                  </button>
                </div>
              )}

              {/* Card Anexo 5 Promesa Formal Consorcio */}
              {company.esConsorcio && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                        Anexo N° 5
                      </span>
                      <span className="text-xs font-mono text-slate-400">~1 página</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Promesa Formal de Consorcio
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Directiva N° 005-2019-OSCE con cuadro de porcentaje de participación de ambas empresas consorciadas.
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickDownload("anexo5")}
                    className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Anexo 5 (.docx)</span>
                  </button>
                </div>
              )}

              {/* Card Anexo 8 Experiencia */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase bg-slate-200 px-2 py-0.5 rounded">
                      Anexo N° 8
                    </span>
                    <span className="text-xs font-mono text-slate-400">~1 página</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Declaración de Experiencia del Postor
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Tabla consolidada de facturación y contratos similares en la especialidad.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDownload("anexo8")}
                  className="w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Anexo 8 (.docx)</span>
                </button>
              </div>

              {/* Card Personal y Equipamiento */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase bg-slate-200 px-2 py-0.5 rounded">
                      Técnica
                    </span>
                    <span className="text-xs font-mono text-slate-400">~1 página</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Personal Clave y Equipamiento
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Acreditación formal del plantel profesional y maquinaria ofertada.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDownload("personal")}
                  className="w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Personal/Equipos (.docx)</span>
                </button>
              </div>

              {/* Card DJ Equipamiento */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                      DJ Oficial
                    </span>
                    <span className="text-xs font-mono text-slate-400">~1 página</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    DJ Disponibilidad en Obra
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Declaración jurada notarial de compromiso de puesta en obra de maquinaria.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDownload("djEquipos")}
                  className="w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar DJ Equipos (.docx)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 6. Master Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col lg:flex-row items-center justify-between gap-6 border border-blue-900/40 shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Expediente Completo y Foliado • Listo para Presentación</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Generación Integral: Portada, Índice de Folios y Anexos en UN SOLO PDF
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Visualice el documento en pantalla, descargue el PDF foliado listo para SEACE o baje el ZIP con los archivos editables en Word.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => handleGenerateUnifiedMasterPdf(true)}
            disabled={isGeneratingUnifiedPdf}
            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition shadow-md cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar PDF Integrado</span>
          </button>

          <button
            onClick={handleDownloadUnifiedPdfDirect}
            disabled={isGeneratingUnifiedPdf}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition shadow-md cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            {isGeneratingUnifiedPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando PDF Único...</span>
              </>
            ) : (
              <>
                <Stamp className="w-4 h-4" />
                <span>Descargar UN SOLO PDF Integrado</span>
              </>
            )}
          </button>

          <button
            onClick={onDownloadAllZip}
            disabled={isDownloadingZip}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-5 py-3.5 rounded-xl transition shadow cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar ZIP (.zip)</span>
          </button>
        </div>
      </div>

      {/* Annex Editor Modal */}
      {selectedAnnex && (
        <AnnexEditorModal
          isOpen={!!selectedAnnex}
          onClose={() => setSelectedAnnex(null)}
          annexId={selectedAnnex.id}
          annexTitle={selectedAnnex.title}
          tender={tender}
          company={company}
          personal={personal}
          equipment={equipment}
          experience={experience}
          montoOfertado={montoOfertado}
          incluyeIGV={incluyeIGV}
          onSaveCustomContent={handleSaveCustomContent}
          initialContent={customContents[selectedAnnex.id]}
        />
      )}

      {/* PDF Cutter Modal */}
      {showPdfCutterModal && (
        <PdfCutterModal
          isOpen={showPdfCutterModal}
          onClose={() => setShowPdfCutterModal(false)}
          onSnippetCreated={handleSnippetCreated}
          defaultCategory="experiencia"
        />
      )}

      {/* Add Custom Document Modal */}
      {showAddCustomDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Agregar Nuevo Documento a la Oferta</span>
              </h3>
              <button
                onClick={() => setShowAddCustomDocModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomDocSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Documento o Anexo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anexo N° 12 - Declaración de Fideicomiso"
                  value={customDocTitle}
                  onChange={(e) => setCustomDocTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Subtítulo:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Solicitud formal de constitución de fideicomiso para adelantos"
                  value={customDocSubtitle}
                  onChange={(e) => setCustomDocSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sobre Destino:
                  </label>
                  <select
                    value={customDocFolder}
                    onChange={(e) => setCustomDocFolder(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="folder1">Sobre 1: Admisión</option>
                    <option value="folder2">Sobre 2: Habilitación</option>
                    <option value="folder3">Sobre 3: Técnica</option>
                    <option value="folder4">Sobre 4: Económica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Páginas Estimadas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customDocPages}
                    onChange={(e) => setCustomDocPages(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="mandatoryCheck"
                  checked={customDocMandatory}
                  onChange={(e) => setCustomDocMandatory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="mandatoryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Marcar como documento obligatorio en el checklist
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomDocModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-xs"
                >
                  Guardar e Incorporar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
