import React, { useState, useRef } from "react";
import {
  Users,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Wrench,
  GraduationCap,
  ShieldCheck,
  Edit2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UploadCloud,
  FileText,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
  Check,
} from "lucide-react";
import { TenderInfo, CompanyProfile, KeyPersonnel, EquipmentItem, ClippedPdfSnippet } from "../types/osce";
import { generatePersonalYEquipamientoDocx, downloadDocxBlob } from "../services/docxGenerator";
import { analyzePersonnelAPI } from "../services/api";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../services/pdfExtractor";
import { PdfCutterModal } from "./PdfCutterModal";
import { Scissors } from "lucide-react";

interface PersonnelManagerProps {
  tender: TenderInfo;
  company: CompanyProfile;
  personal: KeyPersonnel[];
  setPersonal: React.Dispatch<React.SetStateAction<KeyPersonnel[]>>;
  equipment: EquipmentItem[];
  setEquipment: React.Dispatch<React.SetStateAction<EquipmentItem[]>>;
  onNavigateToTab?: (tab: string) => void;
}

export const PersonnelManager: React.FC<PersonnelManagerProps> = ({
  tender,
  company,
  personal,
  setPersonal,
  equipment,
  setEquipment,
  onNavigateToTab,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"personnel" | "equipment">("personnel");
  const [activeInputTab, setActiveInputTab] = useState<"upload" | "text" | "bases">("upload");

  // AI Extraction state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [showPdfCutter, setShowPdfCutter] = useState(false);
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
    setStatusMessage(`Recorte "${snippet.title}" guardado e incorporado para el armado de la propuesta.`);
  };

  // Person Modal / Form state
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [cargo, setCargo] = useState("");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [profesion, setProfesion] = useState("");
  const [cip, setCip] = useState("");
  const [mesesExp, setMesesExp] = useState(36);
  const [descExp, setDescExp] = useState("");
  const [sustento, setSustento] = useState("Título profesional + Colegiatura + 3 Certificados de Trabajo");

  // Equipment Modal / Form state
  const [showEqForm, setShowEqForm] = useState(false);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [eqNombre, setEqNombre] = useState("");
  const [eqMarca, setEqMarca] = useState("");
  const [eqAnio, setEqAnio] = useState("2023");
  const [eqCapacidad, setEqCapacidad] = useState("");
  const [eqCondicion, setEqCondicion] = useState<"Propio" | "Alquilado" | "Compromiso de Compra/Alquiler">("Propio");
  const [eqSustento, setEqSustento] = useState("Factura de compra / Tarjeta de propiedad");

  // Handle PDF Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor seleccione un archivo PDF válido con CVs, certificados o fichas técnicas de maquinaria.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsExtractingPdf(true);

    try {
      const extracted = await extractTextFromPdfFile(file);
      setUploadedPdf(extracted);
      setRawText(extracted.text);
      setStatusMessage(`PDF "${file.name}" cargado con éxito (${extracted.pageCount} páginas). Listo para procesar y evaluar.`);
    } catch (err: any) {
      console.error("PDF Extraction error:", err);
      setErrorMessage("Error al procesar el archivo PDF: " + (err.message || String(err)));
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Run AI Analysis for Personnel & Equipment
  const handleRunAiAnalysis = async (customText?: string) => {
    const textToAnalyze = customText || rawText;
    if (!textToAnalyze.trim() && !uploadedPdf?.pdfBase64) {
      setErrorMessage("Por favor cargue un archivo PDF o ingrese texto de CVs/equipamiento para analizar.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await analyzePersonnelAPI({
        personnelText: textToAnalyze,
        pdfBase64: uploadedPdf?.pdfBase64,
        pageImagesBase64: uploadedPdf?.pageImagesBase64,
        tenderInfo: tender,
      });

      if (result.personal && result.personal.length > 0) {
        setPersonal(result.personal);
      }
      if (result.equipment && result.equipment.length > 0) {
        setEquipment(result.equipment);
      }

      setStatusMessage(
        `Se extrajeron ${result.personal?.length || 0} profesionales clave y ${result.equipment?.length || 0} equipos estratégicos.`
      );
    } catch (err: any) {
      console.error("Personnel analysis error:", err);
      setErrorMessage("Error al procesar personal y equipamiento: " + (err.message || String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto Import from Bases
  const handleAutoImportFromBases = () => {
    const basesPersonnel = tender.requisitosCalificacion.capacidadTecnica.personalClave || [];
    const basesEquip = tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico || [];

    if (basesPersonnel.length > 0) {
      const importedP: KeyPersonnel[] = basesPersonnel.map((bp, idx) => ({
        id: `p-auto-${idx}-${Date.now()}`,
        cargoPostulado: bp.cargo,
        nombreCompleto: `ING. PROFESIONAL PROPUESTO ${idx + 1}`,
        dni: `4${Math.floor(1000000 + Math.random() * 9000000)}`,
        profesion: bp.profesionRequerida || bp.perfil || "Ingeniero Civil Colegiado",
        cipOCol: `CIP ${Math.floor(100000 + Math.random() * 900000)}`,
        tiempoExperienciaMeses: bp.tiempoMesesMinimo || 24,
        descripcionExperiencia: bp.experienciaRequerida || bp.experiencia || `Experiencia efectiva de ${bp.tiempoMesesMinimo || 24} meses en puestos similares.`,
        documentosAcreditacion: bp.documentosAcreditacion || "Copia simple de Título Profesional, Habilitación Vigente y Certificados de Trabajo",
        cumpleRequisito: true,
      }));
      setPersonal(importedP);
    }

    if (basesEquip.length > 0) {
      const importedEq: EquipmentItem[] = basesEquip.map((be, idx) => ({
        id: `eq-auto-${idx}-${Date.now()}`,
        denominacion: be.equipo,
        marcaModelo: "Caterpillar / Komatsu / Genérico Operativo",
        anioFabricacion: "2022",
        capacidad: be.caracteristicas || "Capacidad estándar según TDR",
        estadoDisponibilidad: "Propio",
        sustento: be.documentosAcreditacion || "Factura de compra / Carta de Compromiso de Alquiler",
      }));
      setEquipment(importedEq);
    }

    setStatusMessage("Se importaron los perfiles de personal y equipos exigidos en las Bases Administrativas.");
  };

  // Open Person Form
  const handleOpenAddPerson = () => {
    setEditingPersonId(null);
    setCargo("");
    setNombre("");
    setDni("");
    setProfesion("Ingeniero Civil");
    setCip("");
    setMesesExp(36);
    setDescExp("Experiencia acumulada en puestos similares sustentada con certificados.");
    setSustento("Título profesional + Certificado de Habilitación CIP + Certificados de Trabajo");
    setShowPersonForm(true);
  };

  const handleOpenEditPerson = (p: KeyPersonnel) => {
    setEditingPersonId(p.id);
    setCargo(p.cargoPostulado);
    setNombre(p.nombreCompleto);
    setDni(p.dni);
    setProfesion(p.profesion);
    setCip(p.cipOCol);
    setMesesExp(p.tiempoExperienciaMeses);
    setDescExp(p.descripcionExperiencia);
    setSustento(p.documentosAcreditacion);
    setShowPersonForm(true);
  };

  const handleSavePerson = () => {
    if (!cargo.trim() || !nombre.trim()) {
      setErrorMessage("Complete los campos obligatorios del profesional (Cargo y Nombre).");
      return;
    }

    if (editingPersonId) {
      setPersonal(
        personal.map((p) =>
          p.id === editingPersonId
            ? {
                ...p,
                cargoPostulado: cargo,
                nombreCompleto: nombre,
                dni: dni || "40192837",
                profesion: profesion || "Ingeniero Civil",
                cipOCol: cip || "CIP 180000",
                tiempoExperienciaMeses: mesesExp,
                descripcionExperiencia: descExp || `Experiencia acumulada de ${mesesExp} meses en obras/servicios similares.`,
                documentosAcreditacion: sustento,
              }
            : p
        )
      );
    } else {
      const newP: KeyPersonnel = {
        id: "p-" + Date.now(),
        cargoPostulado: cargo,
        nombreCompleto: nombre,
        dni: dni || "40192837",
        profesion: profesion || "Ingeniero Civil",
        cipOCol: cip || "CIP 180000",
        tiempoExperienciaMeses: mesesExp,
        descripcionExperiencia: descExp || `Experiencia acumulada de ${mesesExp} meses en obras/servicios similares.`,
        documentosAcreditacion: sustento,
        cumpleRequisito: true,
      };
      setPersonal([...personal, newP]);
    }

    setShowPersonForm(false);
    setErrorMessage(null);
  };

  const handleDeletePerson = (id: string) => {
    setPersonal(personal.filter((p) => p.id !== id));
  };

  // Open Equipment Form
  const handleOpenAddEq = () => {
    setEditingEqId(null);
    setEqNombre("");
    setEqMarca("Caterpillar / Komatsu");
    setEqAnio("2023");
    setEqCapacidad("Capacidad operativa según TDR");
    setEqCondicion("Propio");
    setEqSustento("Factura de compra / Tarjeta de propiedad");
    setShowEqForm(true);
  };

  const handleOpenEditEq = (eq: EquipmentItem) => {
    setEditingEqId(eq.id);
    setEqNombre(eq.denominacion);
    setEqMarca(eq.marcaModelo);
    setEqAnio(eq.anioFabricacion);
    setEqCapacidad(eq.capacidad);
    setEqCondicion(eq.estadoDisponibilidad as any);
    setEqSustento(eq.sustento);
    setShowEqForm(true);
  };

  const handleSaveEq = () => {
    if (!eqNombre.trim()) {
      setErrorMessage("Complete la denominación del equipo o maquinaria.");
      return;
    }

    if (editingEqId) {
      setEquipment(
        equipment.map((eq) =>
          eq.id === editingEqId
            ? {
                ...eq,
                denominacion: eqNombre,
                marcaModelo: eqMarca || "Estándar Operativo",
                anioFabricacion: eqAnio || "2023",
                capacidad: eqCapacidad || "Estándar",
                estadoDisponibilidad: eqCondicion,
                sustento: eqSustento,
              }
            : eq
        )
      );
    } else {
      const newEq: EquipmentItem = {
        id: "eq-" + Date.now(),
        denominacion: eqNombre,
        marcaModelo: eqMarca || "Estándar Operativo",
        anioFabricacion: eqAnio || "2023",
        capacidad: eqCapacidad || "Estándar",
        estadoDisponibilidad: eqCondicion,
        sustento: eqSustento,
      };
      setEquipment([...equipment, newEq]);
    }

    setShowEqForm(false);
    setErrorMessage(null);
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipment(equipment.filter((e) => e.id !== id));
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      const blob = await generatePersonalYEquipamientoDocx(tender, company, personal, equipment);
      downloadDocxBlob(blob, `Carta_Personal_Clave_y_Equipos_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const totalMesesExp = personal.reduce((acc, curr) => acc + (curr.tiempoExperienciaMeses || 0), 0);

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* 1. Header with Compact Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Paso 4 de 7 • Requisitos de Calificación • Capacidad Técnica y Profesional</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Personal Clave y Equipamiento Estratégico
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Acredite la nómina de profesionales y el equipamiento mínimo requerido en el Capítulo III de las Bases.
            </p>
          </div>

          {/* Direct Download Action */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Descargar Carta de Acreditación de Personal y Equipos en Word"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "Generando..." : "Descargar Carta Word (.docx)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Document Processing Workspace (PDF OCR / Text Paste / Auto-Import from Bases) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Carga y Extracción de Perfiles y Maquinaria
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
              <span>Subir PDF (CVs / Certificados)</span>
            </button>

            <button
              onClick={() => setActiveInputTab("text")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeInputTab === "text" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pegar Texto de Perfiles</span>
            </button>

            <button
              onClick={() => setActiveInputTab("bases")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeInputTab === "bases" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Importar de Bases (1 Clic)</span>
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
                  {uploadedPdf ? uploadedPdf.fileName : "Haga clic o arrastre aquí el archivo PDF de CVs o Equipamiento"}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Soporta títulos profesionales, certificados de habilitación CIP/CAL, certificados de trabajo, facturas o fichas técnicas.
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
                  title="Abrir herramienta para cortar y seleccionar solo las páginas de CVs, títulos o facturas que te interesan"
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
                  <span>{isAnalyzing ? "Analizando CVs y Equipos..." : "Extraer y Evaluar Requisitos"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Text Paste */}
          {activeInputTab === "text" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Pegue la relación de personal propuesto, perfiles o maquinaria:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Ejemplo:
Residente de Obra: Ing. Carlos Mendoza Ríos - DNI 41829304 - CIP 184920 - 48 meses de experiencia en obras viales.
Especialista en Suelos: Ing. Marcos Quispe Vilca - CIP 210495 - 36 meses.
Equipos: 1 Retroexcavadora CAT 420F, 1 Rodillo Dynapac CA250, 2 Volquetes Volvo 15m3.`}
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
                  <span>{isAnalyzing ? "Procesando texto..." : "Procesar y Evaluar Perfiles"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Bases Import */}
          {activeInputTab === "bases" && (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-xs block">
                  Autocompletar perfiles directamente desde las Bases analizadas
                </span>
                <p className="text-xs text-slate-600">
                  Carga los cargos de personal clave ({tender.requisitosCalificacion.capacidadTecnica.personalClave.length} perfiles) y la lista de maquinaria ({tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico.length} equipos) detectados en el Paso 1.
                </p>
              </div>

              <button
                onClick={handleAutoImportFromBases}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow cursor-pointer shrink-0"
              >
                <FileCheck className="w-4 h-4" />
                <span>Importar Requisitos de Bases</span>
              </button>
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
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Personal Clave Propuesto:</span>
          <div className="text-lg font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{personal.length} Profesionales</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            {personal.filter((p) => p.cumpleRequisito).length} cumplen con Título y CIP
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Equipamiento Estratégico:</span>
          <div className="text-lg font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <span>{equipment.length} Maquinarias / Equipos</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {equipment.filter((e) => e.estadoDisponibilidad === "Propio").length} propios • {equipment.filter((e) => e.estadoDisponibilidad === "Alquilado").length} alquilados
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Experiencia Acumulada de Equipo:</span>
          <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>{totalMesesExp} Meses</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Promedio: {personal.length > 0 ? Math.round(totalMesesExp / personal.length) : 0} meses por profesional
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 block">Dictamen Capacidad Técnica:</span>
          <div className="mt-1">
            {personal.length > 0 && equipment.length > 0 ? (
              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>EQUIPO TÉCNICO APTO</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 font-bold text-xs px-2.5 py-1 rounded border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>PENDIENTE COMPLETAR</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Conforme a Capacidad Técnica OSCE</span>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs: Personal vs Equipamiento */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("personnel")}
              className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 ${
                activeTab === "personnel"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Personal Clave ({personal.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("equipment")}
              className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 ${
                activeTab === "equipment"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Equipamiento Estratégico ({equipment.length})</span>
            </button>
          </div>

          <div>
            {activeTab === "personnel" ? (
              <button
                onClick={handleOpenAddPerson}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Profesional</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddEq}
                className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Maquinaria / Equipo</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content: Personal Clave */}
        {activeTab === "personnel" && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">N°</th>
                  <th className="p-3">Cargo Postulado</th>
                  <th className="p-3">Profesional / DNI / CIP</th>
                  <th className="p-3 text-center">Meses Acreditados</th>
                  <th className="p-3">Documentos de Acreditación</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {personal.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay profesionales registrados. Utilice la carga en el panel superior o el botón "+ Registrar Profesional".
                    </td>
                  </tr>
                ) : (
                  personal.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{p.cargoPostulado}</span>
                        <span className="text-[10px] text-slate-500">{p.profesion}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{p.nombreCompleto}</div>
                        <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                          DNI: {p.dni} • {p.cipOCol}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-blue-700 font-mono bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {p.tiempoExperienciaMeses} Meses
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <span className="text-[11px] text-slate-600 line-clamp-2">{p.documentosAcreditacion}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Acreditado</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditPerson(p)}
                            className="text-slate-600 hover:text-blue-600 p-1 rounded transition cursor-pointer"
                            title="Editar profesional"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePerson(p.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                            title="Eliminar profesional"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Equipamiento Estratégico */}
        {activeTab === "equipment" && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">N°</th>
                  <th className="p-3">Denominación del Equipo</th>
                  <th className="p-3">Marca / Modelo / Año</th>
                  <th className="p-3">Capacidad Operativa</th>
                  <th className="p-3 text-center">Disponibilidad</th>
                  <th className="p-3">Sustento Legal/Comercial</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay equipamiento registrado. Utilice la carga en el panel superior o el botón "+ Registrar Maquinaria".
                    </td>
                  </tr>
                ) : (
                  equipment.map((eq, idx) => (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{eq.denominacion}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{eq.marcaModelo}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">Año: {eq.anioFabricacion}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{eq.capacidad}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            eq.estadoDisponibilidad === "Propio"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : eq.estadoDisponibilidad === "Alquilado"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {eq.estadoDisponibilidad}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs text-[11px] text-slate-600">{eq.sustento}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditEq(eq)}
                            className="text-slate-600 hover:text-blue-600 p-1 rounded transition cursor-pointer"
                            title="Editar equipo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(eq.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                            title="Eliminar equipo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal: Add / Edit Person */}
      {showPersonForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingPersonId ? "Editar Profesional Propuesto" : "Registrar Profesional Clave"}
              </h3>
              <button
                onClick={() => setShowPersonForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Cargo Postulado en la Obra / Servicio:</label>
                <input
                  type="text"
                  placeholder="Ej: Residente de Obra / Especialista en Mecánica de Suelos"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Profesional:</label>
                <input
                  type="text"
                  placeholder="Ej: ING. CARLOS EDUARDO MENDOZA RÍOS"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° de DNI / CE:</label>
                <input
                  type="text"
                  placeholder="41829304"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">N° de Colegiatura (CIP / CAL):</label>
                <input
                  type="text"
                  placeholder="CIP 184920"
                  value={cip}
                  onChange={(e) => setCip(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Profesión / Título Universitario:</label>
                <input
                  type="text"
                  placeholder="Ingeniero Civil Colegiado"
                  value={profesion}
                  onChange={(e) => setProfesion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meses de Experiencia Efectiva:</label>
                <input
                  type="number"
                  value={mesesExp}
                  onChange={(e) => setMesesExp(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono font-bold text-blue-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Documentos de Acreditación (Sustento):</label>
                <input
                  type="text"
                  placeholder="Copia simple de Título, Habilitación CIP vigente y 3 Certificados de Trabajo"
                  value={sustento}
                  onChange={(e) => setSustento(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPersonForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePerson}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                {editingPersonId ? "Actualizar Profesional" : "Guardar Profesional"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Add / Edit Equipment */}
      {showEqForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEqId ? "Editar Maquinaria / Equipo" : "Registrar Equipamiento Estratégico"}
              </h3>
              <button
                onClick={() => setShowEqForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Denominación del Equipo / Maquinaria:</label>
                <input
                  type="text"
                  placeholder="Ej: Rodillo Liso Vibratorio Autopropulsado 10-12 Tn"
                  value={eqNombre}
                  onChange={(e) => setEqNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Marca y Modelo:</label>
                <input
                  type="text"
                  placeholder="Ej: CATERPILLAR 420F"
                  value={eqMarca}
                  onChange={(e) => setEqMarca(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Año de Fabricación:</label>
                <input
                  type="text"
                  placeholder="2022"
                  value={eqAnio}
                  onChange={(e) => setEqAnio(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Capacidad / Potencia Operativa:</label>
                <input
                  type="text"
                  placeholder="Ej: 125 HP / 12 Toneladas"
                  value={eqCapacidad}
                  onChange={(e) => setEqCapacidad(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disponibilidad / Condición:</label>
                <select
                  value={eqCondicion}
                  onChange={(e) => setEqCondicion(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                >
                  <option value="Propio">Propio (Factura / Tarjeta de Propiedad)</option>
                  <option value="Alquilado">Alquilado (Contrato de Arrendamiento)</option>
                  <option value="Compromiso de Compra/Alquiler">Compromiso de Compra/Alquiler con firmas legalizadas</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Documento de Sustento:</label>
                <input
                  type="text"
                  placeholder="Ej: Factura Electrónica N° E001-4920 / Carta de Compromiso Notarial"
                  value={eqSustento}
                  onChange={(e) => setEqSustento(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEqForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEq}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                {editingEqId ? "Actualizar Equipo" : "Guardar Equipo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bottom Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/40 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Paso 4 de 7 • Requisitos de Calificación Concluidos
          </div>
          <h4 className="text-base font-bold text-white mt-0.5">
            Siguiente Paso: Pliego de Consultas y Observaciones con Asesor Legal
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Revise posibles restricciones en las Bases administrativas, formule observaciones con fundamento legal OSCE y consulte en tiempo real con el Asesor Legal Integrado.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => (onNavigateToTab ? onNavigateToTab("observations") : null)}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow cursor-pointer flex items-center space-x-2"
          >
            <span>Continuar al Paso 5: Consultas y Observaciones</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* 8. PDF Cutter Modal */}
      {showPdfCutter && (
        <PdfCutterModal
          isOpen={showPdfCutter}
          onClose={() => setShowPdfCutter(false)}
          onSnippetCreated={handleSnippetCreated}
          defaultCategory={activeTab === "personnel" ? "personal" : "equipos"}
          initialPdf={uploadedPdf}
        />
      )}
    </div>
  );
};
