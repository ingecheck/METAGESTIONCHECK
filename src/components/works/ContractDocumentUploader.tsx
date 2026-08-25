import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Shield,
  FileCheck,
  Calendar,
  DollarSign,
  UserCheck,
  Building,
  Scale,
  RefreshCw,
  Eye,
  Edit3,
  Check,
  Layers,
  ArrowRight,
  Info,
  ChevronRight,
  PlusCircle,
  FileUp,
  RotateCcw,
} from "lucide-react";
import { ObraProyecto, UserObraPackage, ContractAnalysisResult } from "../../types/obras";
import { extractTextFromPdfFile, ExtractedPdfResult } from "../../services/pdfExtractor";
import { analyzeContractDocumentAPI } from "../../services/api";

interface ContractDocumentUploaderProps {
  currentObra?: ObraProyecto;
  obrasList?: UserObraPackage[];
  activeObraId?: string;
  onSelectObra?: (obraId: string) => void;
  onApplyToActiveObra?: (updatedData: Partial<ObraProyecto>, targetObraId?: string) => void;
  onCreateNewObra?: (newPackage: UserObraPackage) => void;
  onSaveProject?: (updatedData: Partial<ObraProyecto>, newPackage?: UserObraPackage, targetObraId?: string) => void;
  onNavigateToDashboard?: () => void;
}

export const ContractDocumentUploader: React.FC<ContractDocumentUploaderProps> = ({
  currentObra,
  obrasList = [],
  activeObraId,
  onSelectObra,
  onApplyToActiveObra,
  onCreateNewObra,
  onSaveProject,
  onNavigateToDashboard,
}) => {
  // Target Obra Selection State (defaults to activeObraId or currentObra?.id or existing project)
  const [selectedTargetObraId, setSelectedTargetObraId] = useState<string>(
    activeObraId || currentObra?.id || (obrasList.length > 0 ? obrasList[0].id : "new")
  );

  // Contratista State
  const [contratistaFile, setContratistaFile] = useState<File | null>(null);
  const [contratistaPdfInfo, setContratistaPdfInfo] = useState<ExtractedPdfResult | null>(null);
  const [isExtractingContratista, setIsExtractingContratista] = useState(false);
  const [contratistaResult, setContratistaResult] = useState<ContractAnalysisResult | null>(null);
  const [contratistaError, setContratistaError] = useState<string | null>(null);
  const [isEditingContratista, setIsEditingContratista] = useState(false);

  // Supervisión State
  const [supervisorFile, setSupervisorFile] = useState<File | null>(null);
  const [supervisorPdfInfo, setSupervisorPdfInfo] = useState<ExtractedPdfResult | null>(null);
  const [isExtractingSupervisor, setIsExtractingSupervisor] = useState(false);
  const [supervisorResult, setSupervisorResult] = useState<ContractAnalysisResult | null>(null);
  const [supervisorError, setSupervisorError] = useState<string | null>(null);
  const [isEditingSupervisor, setIsEditingSupervisor] = useState(false);

  // Success notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);
  
  // Raw OCR Inspector Modal
  const [ocrModalContent, setOcrModalContent] = useState<{ title: string; text: string; json?: any } | null>(null);

  const fileInputContratistaRef = useRef<HTMLInputElement>(null);
  const fileInputSupervisorRef = useRef<HTMLInputElement>(null);

  // Active target project from list or currentObra
  const targetProjectPkg = obrasList.find((o) => o.id === selectedTargetObraId);
  const targetObraData: ObraProyecto = targetProjectPkg?.obra || currentObra || {
    id: "obra-nueva",
    cui: "2548912",
    nombre: "PROYECTO DE OBRA PÚBLICA EN EJECUCIÓN",
    entidad: "MUNICIPALIDAD CONTRATANTE",
    tipoDocumentoContratista: "Contrato de Obra",
    numeroDocumentoContratista: "",
    fechaSuscripcionContratista: "",
    contratista: "",
    rucContratista: "",
    montoContractual: 0,
    plazoDias: 180,
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFinProgramada: "",
    estado: "En Ejecución",
  };

  const handleTargetObraChange = (newId: string) => {
    setSelectedTargetObraId(newId);
    if (newId !== "new" && onSelectObra) {
      onSelectObra(newId);
    }
  };

  const showNotification = (msg: string, type: "success" | "info" = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // -------------------------------------------------------------
  // Process Contratista Document
  // -------------------------------------------------------------
  const handleProcessContratista = async (file: File) => {
    setContratistaFile(file);
    setIsExtractingContratista(true);
    setContratistaError(null);

    try {
      // 1. Client-side PDF extraction with PDF.js
      const pdfRes = await extractTextFromPdfFile(file);
      setContratistaPdfInfo(pdfRes);

      // 2. Call backend endpoint
      const result = await analyzeContractDocumentAPI({
        documentType: "contratista",
        contractText: pdfRes.text,
        pdfBase64: pdfRes.pdfBase64,
        pageImagesBase64: pdfRes.pageImagesBase64,
        isScanned: pdfRes.isScannedImage,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      setContratistaResult(result);

      // Auto-sync into target obra
      const autoSync: Partial<ObraProyecto> = {};
      if (result.cui) autoSync.cui = result.cui;
      if (result.nombreObra) autoSync.nombre = result.nombreObra;
      if (result.entidad) autoSync.entidad = result.entidad;
      if (result.ubicacion) autoSync.ubicacion = result.ubicacion;
      if (result.tipologia) autoSync.tipologia = result.tipologia;
      if (result.sistemaContratacion) autoSync.sistemaContratacion = result.sistemaContratacion;
      autoSync.tipoDocumentoContratista = result.tipoDocumento as any;
      autoSync.numeroDocumentoContratista = result.numeroDocumento;
      autoSync.fechaSuscripcionContratista = result.fechaSuscripcion;
      autoSync.contratista = result.razonSocial;
      autoSync.rucContratista = result.ruc;
      autoSync.montoContractual = result.monto;
      autoSync.plazoDias = result.plazoDias;
      if (result.residente) {
        autoSync.residente = result.residente.nombre;
        autoSync.dniResidente = result.residente.dni;
        autoSync.cipResidente = result.residente.cip;
      }
      if (result.adelantoDirectoPactado !== undefined) {
        autoSync.adelantoDirectoOtorgado = result.adelantoDirectoPactado;
      }
      if (result.adelantoMaterialesPactado !== undefined) {
        autoSync.adelantoMaterialesOtorgado = result.adelantoMaterialesPactado;
      }
      if (onApplyToActiveObra) {
        onApplyToActiveObra(autoSync, selectedTargetObraId === "new" ? undefined : selectedTargetObraId);
      }

      showNotification(`Documento del Contratista procesado y asignado al proyecto (${result.tipoDocumento || 'Contrato'})`);
    } catch (err: any) {
      console.error("Error al procesar documento del contratista:", err);
      setContratistaError(err.message || "Error al procesar el archivo PDF del contratista.");
    } finally {
      setIsExtractingContratista(false);
    }
  };

  // -------------------------------------------------------------
  // Process Supervisión Document
  // -------------------------------------------------------------
  const handleProcessSupervisor = async (file: File) => {
    setSupervisorFile(file);
    setIsExtractingSupervisor(true);
    setSupervisorError(null);

    try {
      // 1. Client-side PDF extraction with PDF.js
      const pdfRes = await extractTextFromPdfFile(file);
      setSupervisorPdfInfo(pdfRes);

      // 2. Call backend AI/Gemini endpoint
      const result = await analyzeContractDocumentAPI({
        documentType: "supervisor",
        contractText: pdfRes.text,
        pdfBase64: pdfRes.pdfBase64,
        pageImagesBase64: pdfRes.pageImagesBase64,
        isScanned: pdfRes.isScannedImage,
        fileName: file.name,
        fileSizeBytes: file.size,
      });

      setSupervisorResult(result);

      // Auto-sync into target obra without overwriting contratista
      const autoSync: Partial<ObraProyecto> = {};
      autoSync.tipoDocumentoSupervisor = result.tipoDocumento as any;
      autoSync.numeroDocumentoSupervisor = result.numeroDocumento;
      autoSync.fechaSuscripcionSupervisor = result.fechaSuscripcion;
      autoSync.montoSupervision = result.monto;
      autoSync.supervisor = result.razonSocial;
      autoSync.rucSupervisor = result.ruc;
      if (result.supervisor) {
        autoSync.jefeSupervision = result.supervisor.nombre;
        autoSync.cipJefeSupervision = result.supervisor.cip;
      }
      // If target project doesn't have cui/nombre yet, fill from supervisor
      if (!targetObraData.cui && result.cui) autoSync.cui = result.cui;
      if (!targetObraData.nombre && result.nombreObra) autoSync.nombre = result.nombreObra;
      if (!targetObraData.entidad && result.entidad) autoSync.entidad = result.entidad;

      if (onApplyToActiveObra) {
        onApplyToActiveObra(autoSync, selectedTargetObraId === "new" ? undefined : selectedTargetObraId);
      }

      showNotification(`Documento de Supervisión procesado e integrado al proyecto exitosamente.`);
    } catch (err: any) {
      console.error("Error al procesar documento de supervisión:", err);
      setSupervisorError(err.message || "Error al procesar el archivo PDF de supervisión.");
    } finally {
      setIsExtractingSupervisor(false);
    }
  };

  // -------------------------------------------------------------
  // Mock / Sample Loaders
  // -------------------------------------------------------------
  const handleLoadSampleContratista = (isOS: boolean = false) => {
    const sample: ContractAnalysisResult = {
      documentType: "contratista",
      tipoDocumento: isOS ? "Orden de Servicio (< 8 UIT)" : "Contrato de Obra",
      esMenor8Uit: isOS,
      confidence: 97,
      fileName: isOS ? "ORDEN_SERVICIO_00124_2025_EJECUCION.pdf" : "CONTRATO_OBRA_045_2025_MDR_GAF.pdf",
      cui: "2548912",
      nombreObra: "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN LAS VÍAS LOCALES DEL DISTRITO DE SAN JERÓNIMO - PROVINCIA DE CUSCO - DEPARTAMENTO DE CUSCO",
      entidad: "MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO",
      ubicacion: "San Jerónimo - Cusco - Cusco",
      tipologia: "Carreteras y Vías",
      sistemaContratacion: "A Precios Unitarios",
      numeroDocumento: isOS ? "ORDEN DE SERVICIO N° 00124-2025" : "CONTRATO DE OBRA N° 045-2025-MDR/GAF",
      fechaSuscripcion: new Date().toISOString().split("T")[0],
      monto: isOS ? 39800 : 2845720.50,
      plazoDias: isOS ? 45 : 180,
      razonSocial: "CONSORCIO VIAL DEL SUR",
      ruc: "20608945123",
      representanteLegal: "Ing. Juan Carlos Paredes Silva",
      residente: {
        nombre: "ING. MARCO ANTONIO QUISPE FLORES",
        dni: "42891054",
        cip: "CIP 142890",
      },
      adelantoDirectoPactado: isOS ? 0 : 284572.05,
      adelantoMaterialesPactado: isOS ? 0 : 569144.10,
      clausulasClave: {
        penalidadesMora: "Art. 162 del Reglamento de la Ley de Contrataciones (Penalidad diaria = 0.10 x Monto / (F x Plazo en días), hasta máx 10%).",
        garantiaFielCumplimiento: isOS ? "Exonerado por tratarse de contratación menor a 8 UIT" : "Carta Fianza por el 10% del monto contractual vigente hasta la liquidación final.",
        solucionControversias: "Conciliación previa obligatoria y Arbitraje institucional de derecho conforme a la Ley N° 30225.",
        obligacionesPrincipales: [
          "Apertura y registro diario obligatorio en el Cuaderno de Obra Digital / Físico.",
          "Permanencia obligatoria del Residente al 100% durante toda la jornada laboral.",
          "Presentación de valorizaciones mensuales dentro de los últimos días del mes.",
          "Presentación de pruebas de control de calidad (roturas de probetas de concreto, densidad de campo)."
        ],
        normativaCitada: isOS ? "Ley N° 30225 (Art. 5.a supuestos excluidos < 8 UIT) y Directiva Interna de Contrataciones Menores" : "TUO de la Ley N° 30225, D.S. N° 344-2018-EF y Ley N° 32069",
      },
      resumenEjecutivo: `Documento procesado: ${isOS ? "Orden de Servicio (< 8 UIT)" : "Contrato de Obra"} para la ejecución de la obra con CUI 2548912 por un monto de S/ ${isOS ? "39,800.00" : "2,845,720.50"} y un plazo de ${isOS ? 45 : 180} días calendario a favor del contratista CONSORCIO VIAL DEL SUR.`,
      advertencias: isOS
        ? ["Contratación Menor a 8 UIT: No requiere Carta Fianza de Fiel Cumplimiento de ley."]
        : ["Contrato de Obra Estándar: Verificar la vigencia de la Carta Fianza de Fiel Cumplimiento y entrega de terreno."]
    };

    setContratistaResult(sample);
    showNotification(`Se cargó el ejemplo del Contratista (${sample.tipoDocumento})`);
  };

  const handleLoadSampleSupervisor = (isOS: boolean = false) => {
    const sample: ContractAnalysisResult = {
      documentType: "supervisor",
      tipoDocumento: isOS ? "Orden de Servicio (< 8 UIT)" : "Contrato de Supervisión",
      esMenor8Uit: isOS,
      confidence: 96,
      fileName: isOS ? "ORDEN_SERVICIO_00088_2025_SUPERVISION.pdf" : "CONTRATO_CONSULTORIA_012_2025_CS.pdf",
      cui: "2548912",
      nombreObra: "MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN LAS VÍAS LOCALES DEL DISTRITO DE SAN JERÓNIMO - PROVINCIA DE CUSCO - DEPARTAMENTO DE CUSCO",
      entidad: "MUNICIPALIDAD DISTRITAL DE SAN JERÓNIMO",
      ubicacion: "San Jerónimo - Cusco - Cusco",
      tipologia: "Carreteras y Vías",
      sistemaContratacion: "A Precios Unitarios",
      numeroDocumento: isOS ? "ORDEN DE SERVICIO N° 00088-2025" : "CONTRATO DE CONSULTORÍA N° 012-2025-CS",
      fechaSuscripcion: new Date().toISOString().split("T")[0],
      monto: isOS ? 32000 : 142500,
      plazoDias: isOS ? 45 : 180,
      razonSocial: "CONSORCIO SUPERVISOR LOS ANDES",
      ruc: "20549812401",
      supervisor: {
        nombre: "ING. CARLOS EDUARDO MENDOZA RÍOS",
        cip: "CIP 184920",
      },
      clausulasClave: {
        plazoRevisionValorizaciones: "El supervisor dispone de un plazo improrrogable de 5 días hábiles siguientes al cierre mensual para revisar y elevar la valorización.",
        plazoInformesAdicionales: "10 días calendario para emitir informe técnico vinculante sobre solicitudes de ampliación o adicional.",
        obligacionesPrincipales: [
          "Revisión y anotación continua en el Cuaderno de Obra de las consultas técnicas del Residente.",
          "Verificación rigurosa de las planillas de metrados y sustentos topográficos en cada valorización.",
          "Control de cumplimiento del cronograma acelerado si el atraso supera el 20%.",
          "Emisión del informe mensual de supervisión y control de ensayos de calidad."
        ],
        normativaCitada: "TUO de la Ley N° 30225, Reglamento D.S. N° 344-2018-EF (Art. 186 a 194) y Ley N° 32069",
      },
      resumenEjecutivo: `Documento procesado: ${isOS ? "Orden de Servicio (< 8 UIT)" : "Contrato de Consultoría"} para la Supervisión Técnica de la obra por un importe de S/ ${isOS ? "32,000.00" : "142,500.00"} a cargo de CONSORCIO SUPERVISOR LOS ANDES con el Ing. Carlos Eduardo Mendoza Ríos como Jefe de Supervisión.`,
      advertencias: [
        "Supervisión Externa: Debe mantener presencia efectiva al 100% de la jornada de trabajo del contratista."
      ]
    };

    setSupervisorResult(sample);
    showNotification(`Se cargó el ejemplo de la Supervisión (${sample.tipoDocumento})`);
  };

  // -------------------------------------------------------------
  // Reset / Clear Analysis
  // -------------------------------------------------------------
  const handleResetAnalysis = () => {
    setContratistaFile(null);
    setContratistaResult(null);
    setContratistaPdfInfo(null);
    setContratistaError(null);
    setSupervisorFile(null);
    setSupervisorResult(null);
    setSupervisorPdfInfo(null);
    setSupervisorError(null);
    showNotification("Área de análisis reiniciada. Puede cargar nuevos documentos.");
  };

  // -------------------------------------------------------------
  // Save / Register Project to Cartera de Proyectos
  // -------------------------------------------------------------
  const handleSaveProject = () => {
    if (!contratistaResult && !supervisorResult) {
      alert("Por favor suba y analice al menos un documento (Contratista o Supervisión) antes de guardar el proyecto.");
      return;
    }

    const isCreatingNew = selectedTargetObraId === "new" || (!currentObra?.id && obrasList.length === 0);
    const existingPkg = obrasList.find((o) => o.id === selectedTargetObraId);
    const baseObra = existingPkg?.obra || currentObra;

    const cui = contratistaResult?.cui || supervisorResult?.cui || baseObra?.cui || "";
    const nombre = contratistaResult?.nombreObra || supervisorResult?.nombreObra || baseObra?.nombre || "OBRA REGISTRADA DESDE DOCUMENTOS";
    const entidad = contratistaResult?.entidad || supervisorResult?.entidad || baseObra?.entidad || "";
    const contratista = contratistaResult?.razonSocial || baseObra?.contratista || "";
    const montoContractual = contratistaResult?.monto !== undefined && contratistaResult?.monto > 0 ? contratistaResult.monto : (baseObra?.montoContractual || 0);
    const plazoDias = contratistaResult?.plazoDias !== undefined && contratistaResult?.plazoDias > 0 ? contratistaResult.plazoDias : (baseObra?.plazoDias || 0);
    const fechaInicio = contratistaResult?.fechaSuscripcion || baseObra?.fechaInicio || new Date().toISOString().split("T")[0];

    // Compute end date
    let fechaFinProgramada = "";
    if (plazoDias > 0 && fechaInicio) {
      const d = new Date(fechaInicio);
      d.setDate(d.getDate() + plazoDias);
      fechaFinProgramada = d.toISOString().split("T")[0];
    } else {
      fechaFinProgramada = baseObra?.fechaFinProgramada || "";
    }

    const updatedObraData: ObraProyecto = {
      ...baseObra,
      id: isCreatingNew ? "obra-" + Date.now() : selectedTargetObraId,
      cui,
      nombre,
      entidad,
      tipoDocumentoContratista: (contratistaResult?.tipoDocumento as any) || baseObra?.tipoDocumentoContratista || "Contrato de Obra",
      numeroDocumentoContratista: contratistaResult?.numeroDocumento || baseObra?.numeroDocumentoContratista || "",
      fechaSuscripcionContratista: contratistaResult?.fechaSuscripcion || baseObra?.fechaSuscripcionContratista || fechaInicio,
      contratista,
      rucContratista: contratistaResult?.ruc || baseObra?.rucContratista || "",
      residente: contratistaResult?.residente?.nombre || baseObra?.residente || "",
      dniResidente: contratistaResult?.residente?.dni || baseObra?.dniResidente || "",
      cipResidente: contratistaResult?.residente?.cip || baseObra?.cipResidente || "",
      tipoDocumentoSupervisor: (supervisorResult?.tipoDocumento as any) || baseObra?.tipoDocumentoSupervisor || "Contrato de Supervisión",
      numeroDocumentoSupervisor: supervisorResult?.numeroDocumento || baseObra?.numeroDocumentoSupervisor || "",
      fechaSuscripcionSupervisor: supervisorResult?.fechaSuscripcion || baseObra?.fechaSuscripcionSupervisor || fechaInicio,
      montoSupervision: supervisorResult?.monto !== undefined && supervisorResult?.monto > 0 ? supervisorResult.monto : (baseObra?.montoSupervision || 0),
      supervisor: supervisorResult?.razonSocial || baseObra?.supervisor || "",
      rucSupervisor: supervisorResult?.ruc || baseObra?.rucSupervisor || "",
      jefeSupervision: supervisorResult?.supervisor?.nombre || baseObra?.jefeSupervision || "",
      cipJefeSupervision: supervisorResult?.supervisor?.cip || baseObra?.cipJefeSupervision || "",
      montoContractual,
      plazoDias,
      fechaInicio,
      fechaFinProgramada,
      adelantoDirectoOtorgado: contratistaResult?.adelantoDirectoPactado !== undefined ? contratistaResult.adelantoDirectoPactado : (baseObra?.adelantoDirectoOtorgado || 0),
      adelantoMaterialesOtorgado: contratistaResult?.adelantoMaterialesPactado !== undefined ? contratistaResult.adelantoMaterialesPactado : (baseObra?.adelantoMaterialesOtorgado || 0),
      sistemaContratacion: contratistaResult?.sistemaContratacion || baseObra?.sistemaContratacion || "A Precios Unitarios",
      estado: "En Ejecución",
      ubicacion: contratistaResult?.ubicacion || supervisorResult?.ubicacion || baseObra?.ubicacion || "",
      tipologia: contratistaResult?.tipologia || supervisorResult?.tipologia || baseObra?.tipologia || "Edificaciones / Escuelas / Hospitales",
    };

    if (isCreatingNew) {
      const newPackage: UserObraPackage = {
        id: updatedObraData.id,
        cui,
        nombre,
        entidad,
        contratista,
        montoContractual,
        estado: "En Ejecución",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        obra: updatedObraData,
        valorizaciones: [],
        asientos: [],
        modificaciones: [],
        liquidacion: {
          montoContratoOriginal: montoContractual,
          montoAdicionalesAprobados: 0,
          montoDeductivosAprobados: 0,
          montoTotalContratoFinal: montoContractual,
          reajustesTotalesK: 0,
          mayoresGastosGenerales: 0,
          interesesLegales: 0,
          adelantoDirectoTotalOtorgado: updatedObraData.adelantoDirectoOtorgado || 0,
          adelantoDirectoTotalAmortizado: 0,
          adelantoMaterialesTotalOtorgado: updatedObraData.adelantoMaterialesOtorgado || 0,
          adelantoMaterialesTotalAmortizado: 0,
          penalidadesPorMoraAplicadas: 0,
          otrasPenalidades: 0,
          totalPagadoACuenta: 0,
          saldoFinalAFavorContratista: 0,
          estadoLiquidacion: "Borrador de Liquidación",
        },
      };

      if (onSaveProject) {
        onSaveProject(updatedObraData, newPackage);
      } else if (onCreateNewObra) {
        onCreateNewObra(newPackage);
      }
      showNotification("¡Nuevo proyecto registrado exitosamente en la Cartera!");
    } else {
      if (onSaveProject) {
        onSaveProject(updatedObraData, undefined, selectedTargetObraId);
      } else if (onApplyToActiveObra) {
        onApplyToActiveObra(updatedObraData, selectedTargetObraId);
      }
      showNotification(`¡Datos actualizados exitosamente en la obra: ${updatedObraData.nombre.substring(0, 35)}...!`);
    }

    if (onNavigateToDashboard) {
      setTimeout(onNavigateToDashboard, 900);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Hero Header - Compact & Sleek */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Análisis de Contratos y Órdenes de Servicio (&lt; 8 UIT)
              </h1>
              <span className="hidden sm:inline-block bg-slate-800 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-700">
                Ley N° 30225 / 32069
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Suba los PDF del <strong className="text-white">Contratista</strong> y <strong className="text-white">Supervisión</strong> para extraer CUI, montos, plazos y penalidades automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
            {(contratistaResult || supervisorResult || contratistaFile || supervisorFile) && (
              <button
                onClick={handleResetAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                title="Reiniciar y limpiar campos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}

            <button
              onClick={handleSaveProject}
              disabled={!contratistaResult && !supervisorResult}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer ${
                contratistaResult || supervisorResult
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800"
              }`}
              title="Guardar y registrar los datos extraídos en la Cartera de Proyectos"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Proyecto</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE SELECCIÓN DE OBRA DESTINO (VINCULACIÓN INTELIGENTE)             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Proyecto / Obra de Destino:
            </label>
            <select
              value={selectedTargetObraId}
              onChange={(e) => handleTargetObraChange(e.target.value)}
              className="w-full md:w-80 lg:w-96 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {obrasList.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.cui ? `[CUI: ${pkg.cui}] ` : ""}{pkg.nombre} ({pkg.contratista || "En Registro"})
                </option>
              ))}
              <option value="new">+ Registrar como Nuevo Proyecto Independiente</option>
            </select>
          </div>
        </div>

        {/* Estado actual de la obra seleccionada */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end text-xs">
          {selectedTargetObraId !== "new" ? (
            <>
              {/* Badge Contratista */}
              <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium border ${
                contratistaResult
                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                  : targetObraData?.contratista
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}>
                <HardHat className="w-3.5 h-3.5" />
                <span>
                  {contratistaResult
                    ? "Contratista: Listo para guardar"
                    : targetObraData?.contratista
                    ? `Contratista: ${targetObraData.contratista.substring(0, 18)}...`
                    : "Contratista: Pendiente"}
                </span>
              </div>

              {/* Badge Supervisión */}
              <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium border ${
                supervisorResult
                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                  : targetObraData?.supervisor
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200 font-semibold"
              }`}>
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {supervisorResult
                    ? "Supervisión: Lista para integrar"
                    : targetObraData?.supervisor
                    ? `Supervisión: ${targetObraData.supervisor.substring(0, 18)}...`
                    : "Supervisión: Pendiente de subir PDF"}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg font-semibold">
              Nuevo Proyecto: Se creará una nueva ficha en Cartera
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN PRINCIPAL: 2 ESTACIONES DE CARGA (CONTRATISTA VS SUPERVISIÓN)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ------------------------------------------------------------- */}
        {/* PANEL A: CONTRATISTA EJECUTOR                                 */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    1. Documento del Contratista Ejecutor
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contrato de Obra Principal u Orden de Servicio (&lt; 8 UIT)
                  </p>
                </div>
              </div>

              {contratistaResult && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {contratistaResult.confidence}% Conformidad
                </span>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="p-5 space-y-4">
            {/* Status note for Contratista */}
            {selectedTargetObraId !== "new" && !contratistaResult && (
              targetObraData?.contratista ? (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">Datos del Contratista registrados en este proyecto:</span>
                    <span className="text-slate-600 text-[11px]">
                      {targetObraData.contratista} {targetObraData.rucContratista ? `• RUC: ${targetObraData.rucContratista}` : ""} • S/ {Number(targetObraData.montoContractual || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 font-semibold shrink-0">
                    Registrado
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Suba el PDF del Contratista para registrar el CUI, presupuesto base y contratista.</span>
                </div>
              )
            )}

            <input
              type="file"
              ref={fileInputContratistaRef}
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessContratista(file);
              }}
            />

            <div
              onClick={() => fileInputContratistaRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type === "application/pdf") {
                  handleProcessContratista(file);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                isExtractingContratista
                  ? "border-indigo-400 bg-indigo-50/50"
                  : contratistaResult
                  ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60"
                  : "border-slate-300 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-400"
              }`}
            >
              {isExtractingContratista ? (
                <div className="py-3 flex flex-col items-center space-y-2 text-indigo-700">
                  <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
                  <div className="text-xs font-bold">Procesando Documento PDF...</div>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Identificando CUI, montos, plazos, residente y cláusulas de penalidad...
                  </p>
                </div>
              ) : contratistaResult ? (
                <div className="flex flex-col items-center space-y-1 text-emerald-800">
                  <FileCheck className="w-7 h-7 text-emerald-600" />
                  <div className="text-xs font-bold truncate max-w-sm">
                    {contratistaFile?.name || contratistaResult.fileName || "Contrato_Contratista.pdf"}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Haga clic o arrastre otro PDF para re-analizar
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-white rounded-full shadow-xs text-indigo-600 border border-slate-200">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Arrastre el PDF del Contrato / O.S. del Contratista
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admite PDFs nativos digitales o escaneados
                  </p>
                </>
              )}
            </div>

            {/* Quick Demo Sample Buttons */}
            {!contratistaResult && !isExtractingContratista && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">O probar con ejemplos:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSampleContratista(false)}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                >
                  📄 Ejemplo Contrato de Obra
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleContratista(true)}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                >
                  📄 Ejemplo O.S. &lt; 8 UIT
                </button>
              </div>
            )}

            {contratistaError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{contratistaError}</span>
              </div>
            )}

            {/* Extracted Data Card for Contratista */}
            {contratistaResult && (
              <div className="space-y-4 pt-2">
                {/* Badges bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        contratistaResult.esMenor8Uit
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      }`}
                    >
                      {contratistaResult.tipoDocumento}
                    </span>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      CUI: {contratistaResult.cui || "No especificado"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setOcrModalContent({
                          title: "Texto Extraído - Documento del Contratista",
                          text: contratistaPdfInfo?.text || "No hay texto crudo disponible",
                          json: contratistaResult,
                        })
                      }
                      className="text-[10px] text-slate-600 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 transition cursor-pointer font-medium"
                    >
                      <Eye className="w-3 h-3" /> Ver Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingContratista(!isEditingContratista)}
                      className="text-[10px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded border border-indigo-200 transition cursor-pointer font-medium"
                    >
                      <Edit3 className="w-3 h-3" /> {isEditingContratista ? "Bloquear" : "Editar"}
                    </button>
                  </div>
                </div>

                {/* Form fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Nombre Oficial de la Obra / Inversión
                    </label>
                    <textarea
                      disabled={!isEditingContratista}
                      value={contratistaResult.nombreObra || ""}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, nombreObra: e.target.value })
                      }
                      rows={2}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 disabled:text-slate-700 font-medium text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      N° Documento (Contrato u O.S.)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingContratista}
                      value={contratistaResult.numeroDocumento || ""}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, numeroDocumento: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Fecha de Suscripción / Notificación
                    </label>
                    <input
                      type="date"
                      disabled={!isEditingContratista}
                      value={contratistaResult.fechaSuscripcion || ""}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, fechaSuscripcion: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Contratista Ejecutor / Consorcio
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingContratista}
                      value={contratistaResult.razonSocial || ""}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, razonSocial: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      RUC del Contratista
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingContratista}
                      value={contratistaResult.ruc || ""}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, ruc: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Monto Contractual / O.S. (S/.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditingContratista}
                      value={contratistaResult.monto || 0}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, monto: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-emerald-900 font-bold disabled:bg-emerald-50/30 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Plazo de Ejecución (Días Calendario)
                    </label>
                    <input
                      type="number"
                      disabled={!isEditingContratista}
                      value={contratistaResult.plazoDias || 0}
                      onChange={(e) =>
                        setContratistaResult({ ...contratistaResult, plazoDias: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Ingeniero Residente de Obra
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingContratista}
                      value={contratistaResult.residente?.nombre || ""}
                      onChange={(e) =>
                        setContratistaResult({
                          ...contratistaResult,
                          residente: {
                            nombre: e.target.value,
                            dni: contratistaResult.residente?.dni || "",
                            cip: contratistaResult.residente?.cip || "",
                          },
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Colegiatura CIP del Residente
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingContratista}
                      value={contratistaResult.residente?.cip || ""}
                      onChange={(e) =>
                        setContratistaResult({
                          ...contratistaResult,
                          residente: {
                            nombre: contratistaResult.residente?.nombre || "",
                            dni: contratistaResult.residente?.dni || "",
                            cip: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Detected Legal Clauses */}
                {contratistaResult.clausulasClave && (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1.5 text-xs text-indigo-950">
                    <div className="font-bold flex items-center gap-1 text-[11px] text-indigo-800">
                      <Scale className="w-3.5 h-3.5" /> Cláusulas Contractuales Relevantes
                    </div>
                    {contratistaResult.clausulasClave.penalidadesMora && (
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-slate-900">Penalidad por Mora:</strong>{" "}
                        {contratistaResult.clausulasClave.penalidadesMora}
                      </p>
                    )}
                    {contratistaResult.clausulasClave.garantiaFielCumplimiento && (
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-slate-900">Garantía Fiel Cumplimiento:</strong>{" "}
                        {contratistaResult.clausulasClave.garantiaFielCumplimiento}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PANEL B: SUPERVISIÓN / INSPECTORÍA                             */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-b from-emerald-50/70 to-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    2. Documento de Supervisión / Inspectoría
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contrato de Consultoría, Orden de Servicio (&lt; 8 UIT) o Resolución
                  </p>
                </div>
              </div>

              {supervisorResult && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {supervisorResult.confidence}% Conformidad
                </span>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="p-5 space-y-4">
            {/* Status note for Supervisión */}
            {selectedTargetObraId !== "new" && !supervisorResult && (
              targetObraData?.supervisor ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">Datos de Supervisión registrados en este proyecto:</span>
                    <span className="text-slate-600 text-[11px]">
                      {targetObraData.supervisor} {targetObraData.rucSupervisor ? `• RUC: ${targetObraData.rucSupervisor}` : ""} • S/ {Number(targetObraData.montoSupervision || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200 font-semibold shrink-0">
                    Registrado
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Pendiente:</strong> Suba aquí el Contrato u Orden de Servicio de la Supervisión. Al procesarlo, se integrará directamente a este mismo proyecto sin crear duplicados.
                  </div>
                </div>
              )
            )}

            <input
              type="file"
              ref={fileInputSupervisorRef}
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessSupervisor(file);
              }}
            />

            <div
              onClick={() => fileInputSupervisorRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type === "application/pdf") {
                  handleProcessSupervisor(file);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                isExtractingSupervisor
                  ? "border-emerald-400 bg-emerald-50/50"
                  : supervisorResult
                  ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60"
                  : "border-slate-300 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-400"
              }`}
            >
              {isExtractingSupervisor ? (
                <div className="py-3 flex flex-col items-center space-y-2 text-emerald-700">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
                  <div className="text-xs font-bold">Procesando Documento de Supervisión...</div>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Identificando consultoría, RUC, Jefe de Supervisión, CIP y plazos de revisión de valorizaciones...
                  </p>
                </div>
              ) : supervisorResult ? (
                <div className="flex flex-col items-center space-y-1 text-emerald-800">
                  <FileCheck className="w-7 h-7 text-emerald-600" />
                  <div className="text-xs font-bold truncate max-w-sm">
                    {supervisorFile?.name || supervisorResult.fileName || "Contrato_Supervision.pdf"}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Haga clic o arrastre otro PDF para re-analizar
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-white rounded-full shadow-xs text-emerald-600 border border-slate-200">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Arrastre el PDF de Supervisión / O.S. / Resolución
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admite contratos de consultoría, órdenes &lt; 8 UIT o designaciones de Inspector
                  </p>
                </>
              )}
            </div>

            {/* Quick Demo Sample Buttons */}
            {!supervisorResult && !isExtractingSupervisor && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">O probar con ejemplos:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSupervisor(false)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                >
                  📄 Ejemplo Contrato de Supervisión
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSupervisor(true)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                >
                  📄 Ejemplo O.S. de Supervisión (&lt; 8 UIT)
                </button>
              </div>
            )}

            {supervisorError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{supervisorError}</span>
              </div>
            )}

            {/* Extracted Data Card for Supervisión */}
            {supervisorResult && (
              <div className="space-y-4 pt-2">
                {/* Badges bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        supervisorResult.esMenor8Uit
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {supervisorResult.tipoDocumento}
                    </span>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      CUI: {supervisorResult.cui || "No especificado"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setOcrModalContent({
                          title: "Texto Reconocido - Documento de Supervisión",
                          text: supervisorPdfInfo?.text || "No hay texto crudo disponible",
                          json: supervisorResult,
                        })
                      }
                      className="text-[10px] text-slate-600 hover:text-emerald-600 flex items-center gap-1 px-2 py-1 bg-white rounded border border-slate-200 transition cursor-pointer font-medium"
                    >
                      <Eye className="w-3 h-3" /> Ver Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingSupervisor(!isEditingSupervisor)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded border border-emerald-200 transition cursor-pointer font-medium"
                    >
                      <Edit3 className="w-3 h-3" /> {isEditingSupervisor ? "Bloquear" : "Editar"}
                    </button>
                  </div>
                </div>

                {/* Form fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      N° Documento (Contrato / O.S. / Res.)
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.numeroDocumento || ""}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, numeroDocumento: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Fecha de Suscripción / Notificación
                    </label>
                    <input
                      type="date"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.fechaSuscripcion || ""}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, fechaSuscripcion: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Empresa Consultora / Inspector Designado
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.razonSocial || ""}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, razonSocial: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      RUC del Supervisor
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.ruc || ""}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, ruc: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Monto de la Supervisión (S/.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.monto || 0}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, monto: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-emerald-900 font-bold disabled:bg-emerald-50/30 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Plazo de la Supervisión (Días)
                    </label>
                    <input
                      type="number"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.plazoDias || 0}
                      onChange={(e) =>
                        setSupervisorResult({ ...supervisorResult, plazoDias: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Jefe de Supervisión / Inspector
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.supervisor?.nombre || ""}
                      onChange={(e) =>
                        setSupervisorResult({
                          ...supervisorResult,
                          supervisor: {
                            nombre: e.target.value,
                            cip: supervisorResult.supervisor?.cip || "",
                          },
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Colegiatura CIP del Supervisor
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingSupervisor}
                      value={supervisorResult.supervisor?.cip || ""}
                      onChange={(e) =>
                        setSupervisorResult({
                          ...supervisorResult,
                          supervisor: {
                            nombre: supervisorResult.supervisor?.nombre || "",
                            cip: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Detected Supervision Obligations */}
                {supervisorResult.clausulasClave && (
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1.5 text-xs text-emerald-950">
                    <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                      <Scale className="w-3.5 h-3.5" /> Cláusulas Clave de Control y Supervisión
                    </div>
                    {supervisorResult.clausulasClave.plazoRevisionValorizaciones && (
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-slate-900">Revisión de Valorizaciones:</strong>{" "}
                        {supervisorResult.clausulasClave.plazoRevisionValorizaciones}
                      </p>
                    )}
                    {supervisorResult.clausulasClave.plazoInformesAdicionales && (
                      <p className="text-[11px] text-slate-700">
                        <strong className="text-slate-900">Pronunciamiento de Adicionales:</strong>{" "}
                        {supervisorResult.clausulasClave.plazoInformesAdicionales}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SÍNTESIS Y ACCIONES FINALES                                               */}
      {/* ========================================================================= */}
      {(contratistaResult || supervisorResult) && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Documentos Preliminares Listos para Vincular
            </h3>
            <p className="text-xs text-slate-400">
              {contratistaResult && supervisorResult
                ? "Ambos instrumentos (Contratista y Supervisión) están leídos y sincronizados."
                : contratistaResult
                ? "Documento del Contratista leído. Puede vincularlo a la ficha de obra o completar la Supervisión."
                : "Documento de Supervisión leído. Puede vincularlo a la ficha de obra o completar el Contratista."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Ver Panel General de Obra</span>
              </button>
            )}

            <button
              onClick={handleSaveProject}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/30"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Proyecto en Cartera</span>
            </button>
          </div>
        </div>
      )}

      {/* Document Text Inspector Modal */}
      {ocrModalContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-scale-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">{ocrModalContent.title}</h3>
              </div>
              <button
                onClick={() => setOcrModalContent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Texto Reconocido del Documento
                </label>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                  {ocrModalContent.text || "Sin texto extraído"}
                </div>
              </div>

              {ocrModalContent.json && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Estructura Técnica del Documento
                  </label>
                  <pre className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 max-h-52 overflow-y-auto">
                    {JSON.stringify(ocrModalContent.json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setOcrModalContent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
