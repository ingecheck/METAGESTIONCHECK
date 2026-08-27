import React, { useState, useRef } from "react";
import {
  FileSearch,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Coins,
  Scale,
  Building,
  UserCheck,
  Wrench,
  Award,
  RefreshCw,
  Copy,
  Check,
  Layers,
  UploadCloud,
  FileText,
  Eye,
  FileCheck,
  Plus,
  Trash2,
  Briefcase,
  ShieldCheck,
  Compass,
  FileCheck2,
} from "lucide-react";
import {
  TenderInfo,
  TenderPersonalClaveRequirement,
  TenderEquipamientoRequirement,
} from "../types/osce";
import { analyzeBasesAPI } from "../services/api";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../services/pdfExtractor";
import { ArrowRight } from "lucide-react";

interface TenderAnalyzerProps {
  tender: TenderInfo;
  onUpdateTender?: (updated: TenderInfo) => void;
  setTender?: React.Dispatch<React.SetStateAction<TenderInfo>> | ((updated: TenderInfo) => void);
  onNext?: () => void;
  onNavigateToBuilder?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const TenderAnalyzer: React.FC<TenderAnalyzerProps> = ({
  tender,
  onUpdateTender,
  setTender,
  onNext,
  onNavigateToBuilder,
  onNavigateToTab,
}) => {
  const updateTenderHandler = (updated: TenderInfo) => {
    if (typeof onUpdateTender === "function") {
      onUpdateTender(updated);
    } else if (typeof setTender === "function") {
      setTender(updated);
    }
  };
  const [inputMode, setInputMode] = useState<"pdf" | "text">("pdf");
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNomenclatura, setEditNomenclatura] = useState(tender.nomenclatura);
  const [editEntidad, setEditEntidad] = useState(tender.entidadConvocante);
  const [editNombreProyectoInversion, setEditNombreProyectoInversion] = useState(
    tender.nombreProyectoInversion || "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN LAS VÍAS LOCALES DEL DISTRITO DE SAN JERÓNIMO - PROVINCIA DE CUSCO - DEPARTAMENTO DE CUSCO"
  );
  const [editCodigoInversionCUI, setEditCodigoInversionCUI] = useState(tender.codigoInversionCUI || "");
  const [editObjeto, setEditObjeto] = useState(tender.objetoContratacion);
  const [editSistema, setEditSistema] = useState(tender.sistemaContratacion);
  const [editEspecialidad, setEditEspecialidad] = useState(tender.especialidad || "Obras Viales y Pavimentación Urbana");
  const [editSubEspecialidad, setEditSubEspecialidad] = useState(tender.subEspecialidad || "Construcción o rehabilitación de pistas y veredas");
  const [editMonto, setEditMonto] = useState(tender.valorEstimadoReferencial || "S/ 514,737.28");
  const [editPlazo, setEditPlazo] = useState(tender.plazoEjecucion || "90 días calendario");
  const [editLugar, setEditLugar] = useState(tender.lugarEjecucion || "PERÚ");
  const [editDepartamento, setEditDepartamento] = useState(tender.departamentoEjecucion || "");
  const [editProvincia, setEditProvincia] = useState(tender.provinciaEjecucion || "");
  const [editDistrito, setEditDistrito] = useState(tender.distritoEjecucion || "");
  const [editDireccionLocalidad, setEditDireccionLocalidad] = useState(tender.direccionLocalidadEjecucion || "");
  const [editDefinicionSimilares, setEditDefinicionSimilares] = useState(
    tender.requisitosCalificacion?.experienciaPostor?.definicionObrasSimilares ||
    tender.requisitosCalificacion?.experienciaPostor?.descripcionSimilaridad ||
    ""
  );
  const [editPersonalList, setEditPersonalList] = useState<TenderPersonalClaveRequirement[]>(
    tender.requisitosCalificacion?.capacidadTecnica?.personalClave || []
  );
  const [editEquipList, setEditEquipList] = useState<TenderEquipamientoRequirement[]>(
    tender.requisitosCalificacion?.capacidadTecnica?.equipamientoEstrategico || []
  );

  // PDF Uploaded Metadata
  const [uploadedPdf, setUploadedPdf] = useState<ExtractedPdfResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditModal = () => {
    setEditNomenclatura(tender.nomenclatura);
    setEditEntidad(tender.entidadConvocante);
    setEditNombreProyectoInversion(
      tender.nombreProyectoInversion || "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN LAS VÍAS LOCALES DEL DISTRITO DE SAN JERÓNIMO - PROVINCIA DE CUSCO - DEPARTAMENTO DE CUSCO"
    );
    setEditCodigoInversionCUI(tender.codigoInversionCUI || "");
    setEditObjeto(tender.objetoContratacion);
    setEditSistema(tender.sistemaContratacion);
    setEditEspecialidad(tender.especialidad || "Obras Viales y Pavimentación Urbana");
    setEditSubEspecialidad(tender.subEspecialidad || "Construcción o rehabilitación de pistas y veredas");
    setEditMonto(tender.valorEstimadoReferencial || "S/ 514,737.28");
    setEditPlazo(tender.plazoEjecucion || "90 días calendario");
    setEditLugar(tender.lugarEjecucion || "Distrito de San Jerónimo, Provincia de Cusco, Departamento de Cusco");
    setEditDepartamento(tender.departamentoEjecucion || "Cusco");
    setEditProvincia(tender.provinciaEjecucion || "Cusco");
    setEditDistrito(tender.distritoEjecucion || "San Jerónimo");
    setEditDireccionLocalidad(tender.direccionLocalidadEjecucion || "Sector Urbano Central");
    setEditDefinicionSimilares(
      tender.requisitosCalificacion?.experienciaPostor?.definicionObrasSimilares ||
      tender.requisitosCalificacion?.experienciaPostor?.descripcionSimilaridad ||
      ""
    );
    setEditPersonalList([...(tender.requisitosCalificacion?.capacidadTecnica?.personalClave || [])]);
    setEditEquipList([...(tender.requisitosCalificacion?.capacidadTecnica?.equipamientoEstrategico || [])]);
    setIsEditModalOpen(true);
  };

  const handleAddPersonalItem = () => {
    setEditPersonalList([
      ...editPersonalList,
      {
        cargo: "Especialista en Obra",
        profesionRequerida: "Ingeniero Civil titulado y colegiado",
        perfil: "Experiencia en dirección o supervisión técnica",
        experienciaRequerida: "Mínimo 12 meses de experiencia en la especialidad",
        tiempoMesesMinimo: 12,
        documentosAcreditacion: "Copia de Título, Habilitación y Certificados de Trabajo",
      },
    ]);
  };

  const handleRemovePersonalItem = (index: number) => {
    setEditPersonalList(editPersonalList.filter((_, i) => i !== index));
  };

  const handleAddEquipItem = () => {
    setEditEquipList([
      ...editEquipList,
      {
        equipo: "Equipo / Maquinaria",
        cantidad: "01 unidad",
        caracteristicas: "Operativo y en óptimas condiciones",
        antiguedadMaxima: "No mayor a 10 años",
        documentosAcreditacion: "Factura o Carta de Compromiso de Alquiler",
      },
    ]);
  };

  const handleRemoveEquipItem = (index: number) => {
    setEditEquipList(editEquipList.filter((_, i) => i !== index));
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseFloat(editMonto.replace(/[^0-9.]/g, "")) || 514737.28;
    
    // Construct composite location if specific fields are filled
    const compositeLugar = [
      editDireccionLocalidad,
      editDistrito ? `Distrito de ${editDistrito}` : "",
      editProvincia ? `Provincia de ${editProvincia}` : "",
      editDepartamento ? `Departamento de ${editDepartamento}` : ""
    ].filter(Boolean).join(", ") || editLugar || "PERÚ";

    updateTenderHandler({
      ...tender,
      nomenclatura: editNomenclatura,
      entidadConvocante: editEntidad,
      nombreProyectoInversion: editNombreProyectoInversion,
      codigoInversionCUI: editCodigoInversionCUI,
      objetoContratacion: editObjeto as any,
      sistemaContratacion: editSistema as any,
      especialidad: editEspecialidad,
      subEspecialidad: editSubEspecialidad,
      valorEstimadoReferencial: editMonto.startsWith("S/") ? editMonto : `S/ ${editMonto}`,
      valorReferencial: editMonto.replace(/[^0-9.,]/g, ""),
      valorNumerico: cleanNum,
      plazoEjecucion: editPlazo,
      lugarEjecucion: compositeLugar,
      departamentoEjecucion: editDepartamento,
      provinciaEjecucion: editProvincia,
      distritoEjecucion: editDistrito,
      direccionLocalidadEjecucion: editDireccionLocalidad,
      requisitosCalificacion: {
        ...tender.requisitosCalificacion,
        capacidadTecnica: {
          personalClave: editPersonalList,
          equipamientoEstrategico: editEquipList,
        },
        experienciaPostor: {
          ...tender.requisitosCalificacion.experienciaPostor,
          montoMinimoAcumulado: editMonto.startsWith("S/") ? editMonto : `S/ ${editMonto}`,
          especialidadRequerida: editEspecialidad,
          subEspecialidadRequerida: editSubEspecialidad,
          definicionObrasSimilares: editDefinicionSimilares,
          descripcionSimilaridad: editDefinicionSimilares,
        },
      },
    });
    setIsEditModalOpen(false);
    setSuccessMessage("¡Datos del proyecto de inversión, entidad, ubicación y calificación actualizados con éxito!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // PDF File Upload and Parsing Handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Por favor seleccione un archivo en formato PDF (.pdf).");
      return;
    }

    setIsExtractingPdf(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const extracted = await extractTextFromPdfFile(file);
      setUploadedPdf(extracted);
      setRawText(extracted.text);
      setSuccessMessage(`PDF "${file.name}" cargado (${extracted.pageCount} páginas). Haga clic en "Analizar y Estructurar Oferta" para procesar el documento.`);
    } catch (err: any) {
      console.error("Error extracting PDF text:", err);
      setErrorMessage("No se pudo leer el archivo PDF directamente en el navegador. Intente con otro PDF o pegue el texto en la pestaña 'Pegar Texto'.");
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    const contentToAnalyze = rawText.trim();
    if (!contentToAnalyze) {
      setErrorMessage("Por favor suba un archivo PDF de Bases o pegue el texto de las Bases / TDR.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const extracted = await analyzeBasesAPI({
        basesText: contentToAnalyze,
        tenderType: tender.tipoProcedimiento,
        objectType: tender.objetoContratacion,
        isScanned: uploadedPdf?.isScannedImage,
        pageImagesBase64: uploadedPdf?.pageImagesBase64,
        pdfBase64: uploadedPdf?.pdfBase64,
      });

      const cleanMontoStr = extracted.valorEstimadoReferencial || tender.valorEstimadoReferencial || "0";
      const numericVal = parseFloat(cleanMontoStr.replace(/[^0-9.]/g, "")) || tender.valorNumerico || 0;

      const updatedTender: TenderInfo = {
        ...tender,
        nomenclatura: extracted.nomenclatura || tender.nomenclatura,
        entidadConvocante: extracted.entidadConvocante || tender.entidadConvocante,
        nombreProyectoInversion: extracted.nombreProyectoInversion || tender.nombreProyectoInversion,
        codigoInversionCUI: extracted.codigoInversionCUI || tender.codigoInversionCUI,
        objetoContratacion: (extracted.objetoContratacion as any) || tender.objetoContratacion,
        tipoProcedimiento: (extracted.tipoProcedimiento as any) || tender.tipoProcedimiento,
        sistemaContratacion: (extracted.sistemaContratacion as any) || tender.sistemaContratacion,
        especialidad: extracted.especialidad || tender.especialidad,
        subEspecialidad: extracted.subEspecialidad || tender.subEspecialidad,
        valorEstimadoReferencial: extracted.valorEstimadoReferencial || tender.valorEstimadoReferencial,
        valorReferencial: extracted.valorEstimadoReferencial ? extracted.valorEstimadoReferencial.replace(/[^0-9.,]/g, "") : tender.valorReferencial,
        valorNumerico: numericVal > 0 ? numericVal : tender.valorNumerico,
        plazoEjecucion: extracted.plazoEjecucion || tender.plazoEjecucion,
        lugarEjecucion: extracted.lugarEjecucion || tender.lugarEjecucion,
        departamentoEjecucion: extracted.departamentoEjecucion || tender.departamentoEjecucion,
        provinciaEjecucion: extracted.provinciaEjecucion || tender.provinciaEjecucion,
        distritoEjecucion: extracted.distritoEjecucion || tender.distritoEjecucion,
        direccionLocalidadEjecucion: extracted.direccionLocalidadEjecucion || tender.direccionLocalidadEjecucion,
        resumenAlcance: extracted.resumenAlcance || tender.resumenAlcance,
        requisitosHabilitacion: extracted.requisitosHabilitacion || tender.requisitosHabilitacion,
        requisitosCalificacion: {
          capacidadLegal: extracted.requisitosCalificacion?.capacidadLegal || tender.requisitosCalificacion.capacidadLegal,
          capacidadTecnica: {
            personalClave: extracted.requisitosCalificacion?.capacidadTecnica?.personalClave || tender.requisitosCalificacion.capacidadTecnica.personalClave,
            equipamientoEstrategico: extracted.requisitosCalificacion?.capacidadTecnica?.equipamientoEstrategico || tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico,
          },
          experienciaPostor: {
            montoMinimoAcumulado: extracted.requisitosCalificacion?.experienciaPostor?.montoMinimoAcumulado || tender.requisitosCalificacion.experienciaPostor.montoMinimoAcumulado,
            descripcionSimilaridad: extracted.requisitosCalificacion?.experienciaPostor?.descripcionSimilaridad || tender.requisitosCalificacion.experienciaPostor.descripcionSimilaridad,
            definicionObrasSimilares: extracted.requisitosCalificacion?.experienciaPostor?.definicionObrasSimilares || tender.requisitosCalificacion.experienciaPostor.definicionObrasSimilares,
            especialidadRequerida: extracted.requisitosCalificacion?.experienciaPostor?.especialidadRequerida || tender.requisitosCalificacion.experienciaPostor.especialidadRequerida,
            subEspecialidadRequerida: extracted.requisitosCalificacion?.experienciaPostor?.subEspecialidadRequerida || tender.requisitosCalificacion.experienciaPostor.subEspecialidadRequerida,
            numeroMaximoContrataciones: extracted.requisitosCalificacion?.experienciaPostor?.numeroMaximoContrataciones || tender.requisitosCalificacion.experienciaPostor.numeroMaximoContrataciones || 20,
            periodoAntiguedadAnios: extracted.requisitosCalificacion?.experienciaPostor?.periodoAntiguedadAnios || tender.requisitosCalificacion.experienciaPostor.periodoAntiguedadAnios || 10,
            documentosSustento: extracted.requisitosCalificacion?.experienciaPostor?.documentosSustento || tender.requisitosCalificacion.experienciaPostor.documentosSustento,
          },
        },
        factoresEvaluacion: extracted.factoresEvaluacion || tender.factoresEvaluacion,
        observacionesRiesgos: extracted.observacionesRiesgos || tender.observacionesRiesgos,
        sugerenciasConsultas: extracted.sugerenciasConsultas || tender.sugerenciasConsultas,
      };

      updateTenderHandler(updatedTender);
      setSuccessMessage("¡Bases analizadas con éxito! Se extrajo el Proyecto de Inversión, CUI, Entidad, Ubicación, Especialidad y Requisitos.");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al analizar las bases.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Top Banner - Compact & Focused on Contractors & Business Owners */}
      <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Paso 1 de 6 • Convocatoria & Requisitos del Concurso Público</span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>Analizador de Bases & Convocatorias para Empresarios y Postores</span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-normal px-2 py-0.5 rounded-full border border-blue-500/30">
                Para ganar Licitaciones del Estado
              </span>
            </h1>
            <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
              Cargue el PDF de Bases, Términos de Referencia (TDR) o Expediente Técnico para extraer de inmediato los requisitos de calificación, experiencia requerida en obras/servicios similares, personal clave y equipamiento estratégico.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab ? onNavigateToTab("company") : onNavigateToBuilder && onNavigateToBuilder()}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Ir a Perfil Postor / Consorcio (Paso 2)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2 rounded-lg text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold ml-2">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-lg text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Dual Input Area: PDF Upload or Text Paste - Compact */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Tab selector for Input Mode */}
        <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setInputMode("pdf")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                inputMode === "pdf"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Subir Bases o TDR del Concurso (PDF)</span>
            </button>

            <button
              onClick={() => setInputMode("text")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                inputMode === "text"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pegar Texto de Convocatoria</span>
            </button>
          </div>

          <span className="text-[10.5px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            Inteligencia para Empresarios y Postores
          </span>
        </div>

        <div className="p-3.5">
          {inputMode === "pdf" ? (
            /* PDF Upload Box - Compact & proportional */
            <div className="space-y-2.5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  uploadedPdf
                    ? "border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/70"
                    : "border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />

                {isExtractingPdf ? (
                  <div className="flex flex-col items-center space-y-1">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="text-xs font-bold text-slate-800">
                      Extrayendo páginas y tablas del PDF...
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Procesando capas de texto
                    </div>
                  </div>
                ) : uploadedPdf ? (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {uploadedPdf.fileName}
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      {uploadedPdf.pageCount} páginas • {(uploadedPdf.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {uploadedPdf.isScannedImage ? (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px] border border-amber-300">
                        <span>🔍 Documento Escaneado: OCR activado</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        ✓ Contenido listo para análisis.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Haga clic o arrastre el archivo PDF de las Bases o TDR del Concurso Público
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      Bases Administrativas, Términos de Referencia (TDR), Especificaciones Técnicas o Expediente Técnico
                    </div>
                  </div>
                )}
              </div>

              {uploadedPdf && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 text-[10.5px]">Vista previa del texto extraído:</span>
                    <span className="text-slate-400 text-[9.5px]">
                      {rawText.length.toLocaleString()} caracteres
                    </span>
                  </div>
                  <div className="max-h-20 overflow-y-auto font-mono text-[9.5px] text-slate-600 bg-white p-2 rounded border border-slate-200 whitespace-pre-wrap">
                    {rawText.substring(0, 800)}...
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Text Paste Mode */
            <div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                placeholder="Pegue aquí el texto copiado de las bases del concurso público (Capítulo III Requerimiento, TDR, Requisitos de Calificación, etc.). El sistema extraerá y estructurará automáticamente el alcance, plazos, valor referencial, especialidad, obras o servicios similares, personal clave y equipamiento para armar la oferta..."
                className="w-full text-xs font-mono text-slate-800 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50/50"
              />
            </div>
          )}

          {/* Action Trigger */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="text-[10.5px] text-slate-500">
              {rawText ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Convocatoria lista para estructurar propuesta
                </span>
              ) : (
                <span>Cargue el archivo o pegue el texto para iniciar.</span>
              )}
            </div>

            <button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || !rawText.trim()}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Estructurando Oferta Ganadora...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Analizar Concurso y Estructurar Oferta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Section 1: Ficha Oficial del Procedimiento, Proyecto PIP/IOARR y Ubicación */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Ficha Oficial del Procedimiento y Proyecto de Inversión (METAGESTIÓN)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenEditModal}
              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer transition border border-blue-200"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ajustar / Editar Ficha y Calificación</span>
            </button>
            <button
              onClick={() => handleCopy(tender.nomenclatura, "nomenclatura")}
              className="text-xs text-slate-600 hover:text-blue-600 flex items-center space-x-1 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              {copiedField === "nomenclatura" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar N° SEACE</span>
            </button>
          </div>
        </div>

        {/* Highlight Banner: Proyecto de Inversión Pública (PIP / IOARR) y CUI */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">
                Proyecto de Inversión Pública (PIP / IOARR)
              </span>
              {tender.codigoInversionCUI && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold">
                  CUI: {tender.codigoInversionCUI}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {tender.codigoInversionCUI && (
                <button
                  onClick={() => handleCopy(tender.codigoInversionCUI || "", "cui")}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition flex items-center space-x-1 border border-slate-700 cursor-pointer"
                >
                  {copiedField === "cui" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar CUI</span>
                </button>
              )}
              <button
                onClick={() => handleCopy(tender.nombreProyectoInversion || tender.nomenclatura, "proyecto")}
                className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md transition flex items-center space-x-1 font-semibold cursor-pointer shadow-2xs"
              >
                {copiedField === "proyecto" ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Nombre Completo del Proyecto</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Nombre Oficial de la Inversión / Obra:</div>
            <div className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words whitespace-normal selection:bg-blue-600 selection:text-white">
              {tender.nombreProyectoInversion || "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN LAS VÍAS LOCALES DEL DISTRITO DE SAN JERÓNIMO - PROVINCIA DE CUSCO - DEPARTAMENTO DE CUSCO"}
            </div>
          </div>
        </div>

        {/* Entidad Convocante y Ubicación Geográfica Oficial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Entidad Convocante / Contratante:
              </span>
              <button
                onClick={() => handleCopy(tender.entidadConvocante, "entidad")}
                className="text-[10px] text-slate-500 hover:text-blue-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
              >
                {copiedField === "entidad" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words whitespace-normal">
              {tender.entidadConvocante}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" /> Lugar de Ejecución de la Prestación:
              </span>
              <button
                onClick={() => handleCopy(tender.lugarEjecucion, "lugar")}
                className="text-[10px] text-slate-500 hover:text-blue-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
              >
                {copiedField === "lugar" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug break-words whitespace-normal">
              {tender.lugarEjecucion}
            </div>
            {(tender.distritoEjecucion || tender.provinciaEjecucion || tender.departamentoEjecucion) && (
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {tender.distritoEjecucion && (
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    Distrito: <strong className="text-slate-900">{tender.distritoEjecucion}</strong>
                  </span>
                )}
                {tender.provinciaEjecucion && (
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    Provincia: <strong className="text-slate-900">{tender.provinciaEjecucion}</strong>
                  </span>
                )}
                {tender.departamentoEjecucion && (
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    Dep: <strong className="text-slate-900">{tender.departamentoEjecucion}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Highlight Specialty and Subspecialty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Especialidad de la Obra / Servicio:</span>
              </div>
              <button
                onClick={() => handleCopy(tender.especialidad || "", "esp")}
                className="text-[10px] text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
              >
                {copiedField === "esp" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words whitespace-normal">
              {tender.especialidad || "Obras Viales y Pavimentación Urbana"}
            </div>
            <p className="text-[11px] text-slate-600">
              Campo de experiencia técnica según RNP y bases estándar del OSCE.
            </p>
          </div>

          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-xs">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Sub-Especialidad / Alcance Específico:</span>
              </div>
              <button
                onClick={() => handleCopy(tender.subEspecialidad || "", "subesp")}
                className="text-[10px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer"
              >
                {copiedField === "subesp" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug break-words whitespace-normal">
              {tender.subEspecialidad || "Construcción o rehabilitación de pistas, veredas y pavimentos"}
            </div>
            <p className="text-[11px] text-slate-600">
              Criterio de similaridad para calificación de contratos en el Anexo N° 8.
            </p>
          </div>
        </div>

        {/* 6-Grid Key Metrics and Procedure Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nomenclatura SEACE:</span>
              <button
                onClick={() => handleCopy(tender.nomenclatura, "nom_card")}
                className="text-[10px] text-slate-500 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === "nom_card" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm break-words whitespace-normal">{tender.nomenclatura}</div>
          </div>

          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-900 font-semibold">Valor Referencial / Presupuesto:</span>
              <button
                onClick={() => handleCopy(tender.valorEstimadoReferencial || `S/ ${tender.valorReferencial}`, "monto_card")}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === "monto_card" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="font-extrabold text-emerald-800 text-sm sm:text-base">
              {tender.valorEstimadoReferencial || `S/ ${tender.valorReferencial}`}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-500 font-medium">Sistema de Contratación:</span>
            <div className="font-semibold text-slate-900">{tender.sistemaContratacion}</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-500 font-medium">Objeto de Contratación:</span>
            <div className="font-semibold text-blue-700">{tender.objetoContratacion}</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-slate-500 font-medium">Tipo de Procedimiento:</span>
            <div className="font-semibold text-slate-900">{tender.tipoProcedimiento}</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Plazo de Ejecución:</span>
              <button
                onClick={() => handleCopy(tender.plazoEjecucion || `${tender.plazoDias} días`, "plazo_card")}
                className="text-[10px] text-slate-500 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === "plazo_card" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="font-semibold text-slate-900">{tender.plazoEjecucion || `${tender.plazoDias} días calendario`}</div>
          </div>
        </div>
      </div>

      {/* Main Section 2: Capítulo III - Requisitos de Calificación Detallados */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 pt-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Capítulo III de las Bases: Requisitos de Calificación y Acreditación
          </h2>
        </div>

        {/* MÓDULO 1: Experiencia del Postor en la Especialidad */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Experiencia del Postor en la Especialidad (Anexo N° 8)
              </h3>
            </div>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
              Requisito de Calificación Obligatorio
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium">Monto Mínimo Acumulado Exigido:</span>
              <div className="text-base font-extrabold text-emerald-700">
                {tender.requisitosCalificacion.experienciaPostor.montoMinimoAcumulado || tender.valorEstimadoReferencial}
              </div>
              <p className="text-[11px] text-slate-500">
                Monto facturado acumulado en obras/servicios similares.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium">Periodo de Antigüedad Válido:</span>
              <div className="text-sm font-bold text-slate-900">
                Últimos {tender.requisitosCalificacion.experienciaPostor.periodoAntiguedadAnios || 10} años
              </div>
              <p className="text-[11px] text-slate-500">
                Computados hasta la fecha de presentación de ofertas en el SEACE.
              </p>
            </div>
          </div>

          {/* Verificación de Especialidad y Sub-Especialidad vinculadas a Obras Similares */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Especialidad y Sub-Especialidad Exigidas para la Calificación:</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                Criterio de Validación RNP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-500 font-semibold block text-[10px]">Especialidad Requerida:</span>
                <strong className="text-blue-900 font-bold text-xs">{tender.especialidad || "Obras Viales y Pavimentación Urbana"}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-500 font-semibold block text-[10px]">Sub-Especialidad / Alcance:</span>
                <strong className="text-indigo-900 font-bold text-xs">{tender.subEspecialidad || "Pistas, veredas y pavimentos rígidos/flexibles"}</strong>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-2 text-xs">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-amber-700" />
              <span>Definición Oficial de Obras / Servicios Similares según las Bases:</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-white p-3 rounded-lg border border-amber-200">
              {tender.requisitosCalificacion.experienciaPostor.definicionObrasSimilares ||
                tender.requisitosCalificacion.experienciaPostor.descripcionSimilaridad ||
                "Se considera similar a obras de edificación, pavimentación, pistas, veredas, saneamiento u obras viales urbanas ejecutadas y liquidadas satisfactoriamente."}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              Documentos de Sustento Exigidos para Acreditación (Completos):
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
              {tender.requisitosCalificacion.experienciaPostor.documentosSustento ||
                "Copia simple de contratos u órdenes de servicio con sus respectivas actas de recepción y conformidad, resoluciones de liquidación de obra con constancia de pago final o comprobantes de pago cancelados de forma fehaciente (voucher de depósito bancario, estado de cuenta o sello de cancelado)."}
            </div>
          </div>
        </div>

        {/* MÓDULO 2: Personal Clave Requerido */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Personal Clave Requerido y Perfiles Profesionales
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
              {tender.requisitosCalificacion.capacidadTecnica.personalClave.length} profesionales requeridos
            </span>
          </div>

          {tender.requisitosCalificacion.capacidadTecnica.personalClave.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No se ha registrado personal clave. Use el botón "Ajustar / Editar Ficha" para agregar los cargos requeridos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Cargo / Rol</th>
                    <th className="py-2.5 px-3 font-bold">Profesión / Habilitación</th>
                    <th className="py-2.5 px-3 font-bold">Experiencia Mínima</th>
                    <th className="py-2.5 px-3 font-bold">Acreditación Exigida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tender.requisitosCalificacion.capacidadTecnica.personalClave.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{p.cargo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {p.profesionRequerida || p.perfil || "Profesional titulado, colegiado y habilitado"}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <span className="font-semibold text-blue-700">
                          {p.experienciaRequerida || p.experiencia || `${p.tiempoMesesMinimo || 24} meses en la especialidad`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {p.documentosAcreditacion || "Copia simple de Título, Habilidad Vigente y Certificados de Trabajo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MÓDULO 3: Equipamiento Estratégico Mínimo */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Equipamiento Estratégico Mínimo Exigido
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
              {tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico.length} equipos requeridos
            </span>
          </div>

          {tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No se ha registrado equipamiento estratégico. Use el botón "Ajustar / Editar Ficha" para agregar los equipos mínimos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Maquinaria / Equipo</th>
                    <th className="py-2.5 px-3 font-bold">Cantidad Mínima</th>
                    <th className="py-2.5 px-3 font-bold">Características Técnicas</th>
                    <th className="py-2.5 px-3 font-bold">Antigüedad / Acreditación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tender.requisitosCalificacion.capacidadTecnica.equipamientoEstrategico.map((eq, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{eq.equipo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-700 whitespace-nowrap">
                        {eq.cantidad || "01 unidad"}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {eq.caracteristicas || "Operatividad garantizada"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        <div>{eq.antiguedadMaxima ? `Máx: ${eq.antiguedadMaxima}` : "No mayor a 10 años"}</div>
                        <div className="text-[10px] text-slate-400">{eq.documentosAcreditacion || "Factura o Carta de Compromiso de Alquiler"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Edit Procedure Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Ajustar Ficha Oficial, Especialidad y Requisitos de Calificación
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualEdit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Bloque 1: Datos Generales, Proyecto de Inversión y Especialidad */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 text-blue-600 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> 1. Datos Generales, Inversión Pública (PIP / IOARR) y Especialidad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nombre Oficial del Proyecto de Inversión Pública (PIP / IOARR) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={editNombreProyectoInversion}
                      onChange={(e) => setEditNombreProyectoInversion(e.target.value)}
                      placeholder="Ej: MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE..."
                      className="w-full px-3 py-2 bg-blue-50/40 border border-blue-200 rounded-xl font-semibold text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Código Único de Inversiones (CUI) / SNIP
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 2489012"
                      value={editCodigoInversionCUI}
                      onChange={(e) => setEditCodigoInversionCUI(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomenclatura SEACE *
                    </label>
                    <input
                      type="text"
                      required
                      value={editNomenclatura}
                      onChange={(e) => setEditNomenclatura(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Entidad Convocante / Contratante *
                    </label>
                    <input
                      type="text"
                      required
                      value={editEntidad}
                      onChange={(e) => setEditEntidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  {/* Detalle Geográfico */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cusco, Lima, Piura..."
                      value={editDepartamento}
                      onChange={(e) => setEditDepartamento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cusco, Maynas, Trujillo..."
                      value={editProvincia}
                      onChange={(e) => setEditProvincia(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Distrito
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: San Jerónimo, Miraflores..."
                      value={editDistrito}
                      onChange={(e) => setEditDistrito(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Localidad / Sector / Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Sector Urbano Central, Av. Principal..."
                      value={editDireccionLocalidad}
                      onChange={(e) => setEditDireccionLocalidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Especialidad de la Obra / Servicio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Obras Viales y Pavimentación Urbana"
                      value={editEspecialidad}
                      onChange={(e) => setEditEspecialidad(e.target.value)}
                      className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl font-semibold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Sub-Especialidad / Alcance Específico *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pistas, veredas y pavimentos rígidos o flexibles"
                      value={editSubEspecialidad}
                      onChange={(e) => setEditSubEspecialidad(e.target.value)}
                      className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-300 rounded-xl font-semibold text-indigo-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Valor Referencial / Presupuesto Total *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: S/ 514,737.28"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Plazo de Ejecución *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPlazo}
                      onChange={(e) => setEditPlazo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Objeto de Contratación *
                    </label>
                    <select
                      value={editObjeto}
                      onChange={(e) => setEditObjeto(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Ejecución de Obras">Ejecución de Obras</option>
                      <option value="Bienes">Bienes</option>
                      <option value="Servicios en General">Servicios en General</option>
                      <option value="Consultoría en General">Consultoría en General</option>
                      <option value="Consultoría de Obra">Consultoría de Obra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Sistema de Contratación
                    </label>
                    <select
                      value={editSistema}
                      onChange={(e) => setEditSistema(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="Suma Alzada">Suma Alzada</option>
                      <option value="Precios Unitarios">Precios Unitarios</option>
                      <option value="Esquema Mixto">Esquema Mixto</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Definición Oficial de Obras / Servicios Similares (Capítulo III) *
                    </label>
                    <textarea
                      rows={3}
                      value={editDefinicionSimilares}
                      onChange={(e) => setEditDefinicionSimilares(e.target.value)}
                      placeholder="Indique las obras que las bases consideran similares para el cómputo de la experiencia..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Personal Clave */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> 2. Personal Clave Requerido ({editPersonalList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPersonalItem}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Cargo
                  </button>
                </div>

                <div className="space-y-3">
                  {editPersonalList.map((p, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 text-[11px]">Cargo:</label>
                        <input
                          type="text"
                          value={p.cargo}
                          onChange={(e) => {
                            const updated = [...editPersonalList];
                            updated[idx].cargo = e.target.value;
                            setEditPersonalList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 text-[11px]">Profesión Requerida:</label>
                        <input
                          type="text"
                          value={p.profesionRequerida || p.perfil || ""}
                          onChange={(e) => {
                            const updated = [...editPersonalList];
                            updated[idx].profesionRequerida = e.target.value;
                            setEditPersonalList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block font-semibold text-slate-600 text-[11px]">Experiencia Requerida:</label>
                          <input
                            type="text"
                            value={p.experienciaRequerida || p.experiencia || ""}
                            onChange={(e) => {
                              const updated = [...editPersonalList];
                              updated[idx].experienciaRequerida = e.target.value;
                              setEditPersonalList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePersonalItem(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 3: Equipamiento Estratégico */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" /> 3. Equipamiento Estratégico Exigido ({editEquipList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddEquipItem}
                    className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Equipo
                  </button>
                </div>

                <div className="space-y-3">
                  {editEquipList.map((eq, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 text-[11px]">Denominación:</label>
                        <input
                          type="text"
                          value={eq.equipo}
                          onChange={(e) => {
                            const updated = [...editEquipList];
                            updated[idx].equipo = e.target.value;
                            setEditEquipList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 text-[11px]">Cantidad:</label>
                        <input
                          type="text"
                          value={eq.cantidad || "01 unidad"}
                          onChange={(e) => {
                            const updated = [...editEquipList];
                            updated[idx].cantidad = e.target.value;
                            setEditEquipList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block font-semibold text-slate-600 text-[11px]">Características / Capacidad:</label>
                          <input
                            type="text"
                            value={eq.caracteristicas || ""}
                            onChange={(e) => {
                              const updated = [...editEquipList];
                              updated[idx].caracteristicas = e.target.value;
                              setEditEquipList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipItem(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Todos los Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
