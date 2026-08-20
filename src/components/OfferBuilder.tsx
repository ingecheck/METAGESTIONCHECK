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
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Paperclip,
  Scissors,
  FileDown,
  RefreshCw,
  Stamp,
  ExternalLink,
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
  generateContratoConsorcioDocx,
  generateCaratulasSeparadorasDocx,
  downloadDocxBlob,
  formatPEN,
} from "../services/docxGenerator";
import { AnnexEditorModal } from "./AnnexEditorModal";
import { extractTextFromPdfFile } from "../services/pdfExtractor";
import { generateMasterUnifiedPdf } from "../services/pdfMasterService";
import { PdfCutterModal } from "./PdfCutterModal";
import saveAs from "file-saver";

interface OfferDocItem {
  id: string;
  folderKey: "folder1" | "folder2" | "folder3" | "folder4";
  title: string;
  subtitle: string;
  type: "generated" | "uploaded_pdf" | "legal_cert";
  isIncluded: boolean;
  isMandatory: boolean;
  estimatedPages: number;
  fileName?: string;
  annexKey?: string;
  notes?: string;
}

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
    // Default initial sample snippets
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

  // State for user-managed interactive document checklist
  const [docItems, setDocItems] = useState<OfferDocItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    // Default checklist
    return [
      // Sobre 1: Admisión
      {
        id: "doc-anexo1",
        folderKey: "folder1",
        title: "Anexo N° 1: Declaración Jurada de Datos del Postor",
        subtitle: `Identificación de ${company.esConsorcio ? "Consorcio" : company.razonSocial}, RUC, representante legal y domicilio.`,
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo1",
      },
      {
        id: "doc-anexo2",
        folderKey: "folder1",
        title: "Anexo N° 2: Declaración Jurada de Cumplimiento de TDR / EETT",
        subtitle: "Aceptación expresa de especificaciones técnicas y condiciones del procedimiento.",
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo2",
      },
      {
        id: "doc-anexo3",
        folderKey: "folder1",
        title: "Anexo N° 3: Declaración Jurada de Plazo de Entrega / Ejecución",
        subtitle: `Compromiso formal de ejecución en ${tender.plazoEjecucion || "el plazo de Bases"}.`,
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo3",
      },
      {
        id: "doc-anexo4",
        folderKey: "folder1",
        title: "Anexo N° 4: Declaración Jurada (Art. 52 del Reglamento)",
        subtitle: "No tener impedimentos para contratar con el Estado (Art. 11 de la Ley N° 30225 / 32069).",
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo4",
      },
      {
        id: "doc-anexo5",
        folderKey: "folder1",
        title: "Anexo N° 5: Promesa Formal de Consorcio con Firmas Legalizadas",
        subtitle: `Obligaciones y porcentaje de participación de los ${company.integrantesConsorcio?.length || 2} consorciados.`,
        type: "generated",
        isIncluded: company.esConsorcio,
        isMandatory: company.esConsorcio,
        estimatedPages: 1,
        annexKey: "anexo5",
      },
      {
        id: "doc-contrato-consorcio",
        folderKey: "folder1",
        title: "Contrato Privado de Consorcio con Firmas Legalizadas Notarialmente",
        subtitle: `Contrato notarial con 11 facultades expresas, designación de operador tributario y cláusulas de arbitraje.`,
        type: "generated",
        isIncluded: company.esConsorcio,
        isMandatory: company.esConsorcio,
        estimatedPages: 3,
        annexKey: "contratoConsorcio",
      },
      {
        id: "doc-caratulas",
        folderKey: "folder1",
        title: "Carátulas y Separadores Oficiales del Expediente (Sobres 1 al 4)",
        subtitle: "Portadas divisorias oficiales con foliación, datos de la Entidad y postor para cada sección.",
        type: "generated",
        isIncluded: true,
        isMandatory: false,
        estimatedPages: 6,
        annexKey: "caratulas",
      },

      // Sobre 2: Habilitación
      {
        id: "doc-rnp",
        folderKey: "folder2",
        title: "Constancia de Inscripción Vigente en el RNP (OSCE)",
        subtitle: `Registro Nacional de Proveedores habilitado como Ejecutor/Proveedor de ${tender.objetoContratacion}.`,
        type: "legal_cert",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        fileName: "Constancia_RNP_Vigente.pdf",
      },
      {
        id: "doc-ruc",
        folderKey: "folder2",
        title: "Ficha RUC SUNAT (Estado ACTIVO y Condición HABIDO)",
        subtitle: `RUC: ${company.ruc} con actividad económica principal vinculada al objeto de contratación.`,
        type: "legal_cert",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 2,
        fileName: "Ficha_RUC_SUNAT.pdf",
      },
      {
        id: "doc-poder",
        folderKey: "folder2",
        title: "Certificado de Vigencia de Poder SUNARP",
        subtitle: "Facultades expresas del Representante Legal para presentar propuestas y suscribir contratos.",
        type: "legal_cert",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 2,
        fileName: "Vigencia_Poder_SUNARP.pdf",
      },
      {
        id: "doc-dni",
        folderKey: "folder2",
        title: "Copia Simple de DNI del Representante Legal / Apoderado",
        subtitle: `DNI vigente de ${company.representanteLegal || "Representante Legal"}.`,
        type: "legal_cert",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        fileName: "DNI_Representante_Legal.pdf",
      },

      // Sobre 3: Calificación
      {
        id: "doc-anexo8",
        folderKey: "folder3",
        title: "Anexo N° 8: Declaración Jurada de Experiencia del Postor",
        subtitle: `Relación detallada de contrataciones de obras/servicios similares en la especialidad.`,
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo8",
      },
      {
        id: "doc-personal",
        folderKey: "folder3",
        title: "Carta de Acreditación de Personal Clave y Equipamiento",
        subtitle: `${personal.length} profesionales colegiados y ${equipment.length} maquinarias/equipos declarados.`,
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "personal",
      },

      // Sobre 4: Propuesta Económica
      {
        id: "doc-anexo6",
        folderKey: "folder4",
        title: "Anexo N° 6: Oferta Económica Formal",
        subtitle: `Propuesta de ${formatPEN(montoOfertado)} (${incluyeIGV ? "Incluye IGV" : "Sin IGV"}).`,
        type: "generated",
        isIncluded: true,
        isMandatory: true,
        estimatedPages: 1,
        annexKey: "anexo6",
      },
    ];
  });

  // Save doc items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docItems));
  }, [docItems]);

  // Upload custom PDF ref
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const [targetFolderForUpload, setTargetFolderForUpload] = useState<OfferDocItem["folderKey"]>("folder1");

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

  const handleDeleteCustomDoc = (id: string) => {
    setDocItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTriggerUpload = (folderKey: OfferDocItem["folderKey"]) => {
    setTargetFolderForUpload(folderKey);
    fileUploadInputRef.current?.click();
  };

  const handleCustomPdfUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const extracted = await extractTextFromPdfFile(file);
      const newDoc: OfferDocItem = {
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

  const handleSaveCustomContent = (annexId: string, content: string) => {
    setCustomContents((prev) => ({ ...prev, [annexId]: content }));
  };

  // Master Generator: Produces ONE Unified Merged Foliated PDF
  const handleGenerateUnifiedMasterPdf = async () => {
    setIsGeneratingUnifiedPdf(true);
    setStatusNotification("Ensamblando carátula, anexos, recortes PDF y foliación...");

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
      });

      const safeNomenclatura = (tender.nomenclatura || "Oferta_SEACE").replace(/[\/\\:]/g, "_");
      const filename = `Expediente_Integral_Oferta_${safeNomenclatura}.pdf`;

      saveAs(result.blob, filename);
      setStatusNotification(`¡Éxito! Se generó el PDF consolidado con ${result.totalPages} folios.`);
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err: any) {
      console.error("Error generating master PDF:", err);
      alert("Error al generar el PDF único: " + (err.message || String(err)));
    } finally {
      setIsGeneratingUnifiedPdf(false);
    }
  };

  // Direct fast download helper
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
        blob = await generateAnexo8ExperienciaDocx(tender, company, experience);
        filename = `07_Anexo_8_Experiencia_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
        break;
      case "personal":
        blob = await generatePersonalYEquipamientoDocx(tender, company, personal, equipment);
        filename = `08_Personal_y_Equipamiento_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
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
  const totalEstimatedPages = includedDocs.reduce((acc, curr) => acc + curr.estimatedPages, 0) + snippetPagesCount + 2; // +2 for Cover & Index

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
    <div className="space-y-6 pb-12 w-full">
      {/* Hidden file input for uploading custom PDF to any folder */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleCustomPdfUploaded}
        className="hidden"
      />

      {/* 1. Header with Fully Unconstrained Title & Master Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Paso 7 de 7 (Consolidación Final) • Expediente Integral de Contratación Pública</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Mesa de Trabajo Digital: Armador y Ensamblador de Oferta
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Corta páginas de PDFs grandes, incorpora o saca documentos interactivamente y genera **UN SOLO PDF INTEGRADO** foliado con carátula e índice oficial del SEACE.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 xl:pt-0 shrink-0">
            {/* Master Single PDF Button */}
            <button
              onClick={handleGenerateUnifiedMasterPdf}
              disabled={isGeneratingUnifiedPdf}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
              title="Genera un único archivo PDF con carátula, índice, foliación oficial (FOLIO N° 0001...) y todos los anexos y recortes unidos en orden"
            >
              {isGeneratingUnifiedPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando PDF Único...</span>
                </>
              ) : (
                <>
                  <Stamp className="w-4 h-4" />
                  <span>Descargar UN SOLO PDF Integrado (Foliado)</span>
                </>
              )}
            </button>

            {/* ZIP Package Button */}
            <button
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingZip ? "Empaquetando..." : "Descargar ZIP (.zip)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* 2. Interactive Dossier Control Bar (Sacar / Poner, Folios, Estados) */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Documentos & Anexos:</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {includedDocs.length + activeSnippets.length} de {docItems.length + clippedSnippets.length} Activos
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

          <div>
            <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Estimación de Foliación Total:</span>
            <div className="text-lg font-bold text-blue-300 mt-0.5">
              ~{totalEstimatedPages} Folios / Páginas
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

          <div>
            <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Postor Acreditado:</span>
            <div className="text-sm font-semibold text-slate-200 truncate max-w-xs mt-0.5">
              {company.esConsorcio ? company.nombreConsorcio || "Consorcio Postor" : company.razonSocial}
            </div>
          </div>
        </div>

        {/* Fast Action Buttons for Inclusion */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPdfCutterModal(true)}
            className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition cursor-pointer font-bold shadow-xs"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Cortar Nuevo PDF</span>
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

      {/* 3. Slices Manager: Recortes y Páginas PDF Extraídas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-50/70 px-6 py-4 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
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
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cortar y Añadir Otro PDF</span>
          </button>
        </div>

        <div className="p-6">
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
      <div className="bg-gradient-to-r from-blue-50 via-white to-amber-50/40 p-5 rounded-xl border border-blue-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-800 text-xs font-bold uppercase">
            <Coins className="w-4 h-4" />
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
                className="px-6 py-4 bg-slate-50/80 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-between border-b border-slate-200 select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {folder.number}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-bold text-slate-900 text-sm">{folder.title}</h3>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${folder.badgeColor}`}>
                        {folder.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{folder.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
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
                <div className="p-6 space-y-3">
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
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {item.title}
                              </span>
                              {item.isMandatory ? (
                                <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 shrink-0">
                                  Obligatorio
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded shrink-0">
                                  Opcional / Complementario
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
                              onClick={() => handleDeleteCustomDoc(item.id)}
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
                  <div className="pt-2">
                    <button
                      onClick={() => handleTriggerUpload(folder.key)}
                      className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-lg p-2.5 text-xs text-slate-600 hover:text-blue-700 font-semibold transition cursor-pointer flex items-center justify-center space-x-2"
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

          {/* Card Contrato Consorcio (if consortium) or Anexo 5 */}
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

          {/* Card Anexo 6 Oferta Económica */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  Anexo N° 6
                </span>
                <span className="text-xs font-mono text-slate-400">~1 página</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">
                Propuesta Económica Formal
              </h4>
              <p className="text-[11px] text-slate-600">
                Monto formal en Soles con expresión literal y desglose de IGV.
              </p>
            </div>
            <button
              onClick={() => handleQuickDownload("anexo6")}
              className="w-full flex items-center justify-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Anexo 6 (.docx)</span>
            </button>
          </div>
        </div>
      </div>

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
            Descargue el documento final consolidado con el orden reglamentario del SEACE o descargue el archivo comprimido ZIP con todos los documentos editables en Word.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleGenerateUnifiedMasterPdf}
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
          onSave={handleSaveCustomContent}
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
    </div>
  );
};
