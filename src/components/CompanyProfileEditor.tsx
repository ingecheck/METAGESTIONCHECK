import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Building2,
  Save,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  Mail,
  MapPin,
  FileBadge,
  ArrowRight,
  ArrowLeft,
  Scale,
  AlertTriangle,
  Layers,
  Sparkles,
  FileText,
  Stamp,
  BookOpen,
  Briefcase,
  FileCheck2,
  Percent,
  Eye,
  Copy,
  Check,
  ScrollText,
  Download,
} from "lucide-react";
import { CompanyProfile, ConsorcioMember, TenderInfo } from "../types/osce";
import { WordDocumentEditor } from "./WordDocumentEditor";
import {
  getContratoConsorcioHtml,
  getAnexo5PromesaConsorcioHtml,
} from "../services/annexHtmlTemplates";
import {
  generateContratoConsorcioDocx,
  generateAnexo5PromesaConsorcioDocx,
  downloadDocxBlob,
} from "../services/docxGenerator";

interface CompanyProfileEditorProps {
  company: CompanyProfile;
  setCompany: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  tender?: TenderInfo;
  onNavigateToTab?: (tab: string) => void;
}

export const CompanyProfileEditor: React.FC<CompanyProfileEditorProps> = ({
  company,
  setCompany,
  tender,
  onNavigateToTab,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeConsortiumTab, setActiveConsortiumTab] = useState<"general" | "integrantes" | "notarial" | "visualizador">("integrantes");
  const [previewDocType, setPreviewDocType] = useState<"contrato" | "anexo5">("contrato");
  const [contratoHtml, setContratoHtml] = useState<string>("");
  const [anexo5Html, setAnexo5Html] = useState<string>("");
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  // Fallback tender info if not provided
  const currentTender: TenderInfo = useMemo(() => {
    return tender || {
      nomenclatura: "AS-SM-12-2024-GRSM/CS-1",
      entidadConvocante: "GOBIERNO REGIONAL DE SAN MARTÍN",
      objetoContratacion: "Servicio de Mantenimiento Periódico de Vías Departamentales",
      descripcionObjeto: "SERVICIO DE MANTENIMIENTO PERIODICO DEL CAMINO VECINAL TRAMO: EMP. SM-113 - YURACYACU - SAN FERNANDO",
      valorReferencial: "S/ 1,450,000.00",
      valorNumerico: 1450000,
      sistemaContratacion: "A Suma Alzada",
      plazoEjecucion: "90 días calendario",
      modalidad: "Servicio en General",
      tipologiaProyecto: "Mantenimiento Periódico Vial",
    };
  }, [tender]);

  const isInitializedDocsRef = useRef(false);

  // Initialize once on mount or when company/tender is first loaded, NOT on every keystroke
  useEffect(() => {
    if (!isInitializedDocsRef.current) {
      isInitializedDocsRef.current = true;
      setContratoHtml(getContratoConsorcioHtml(currentTender, company));
      setAnexo5Html(getAnexo5PromesaConsorcioHtml(currentTender, company));
    }
  }, []);

  const handleDownloadContratoWord = async () => {
    setIsDownloadingDocx(true);
    try {
      const blob = await generateContratoConsorcioDocx(currentTender, company);
      downloadDocxBlob(blob, `Contrato_Privado_Consorcio_${currentTender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`);
    } catch (err) {
      console.error("Error generating contrato word:", err);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadAnexo5Word = async () => {
    setIsDownloadingDocx(true);
    try {
      const blob = await generateAnexo5PromesaConsorcioDocx(currentTender, company);
      downloadDocxBlob(blob, `Anexo_05_Promesa_Formal_Consorcio_${currentTender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`);
    } catch (err) {
      console.error("Error generating anexo 5 word:", err);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleResetContrato = () => {
    setContratoHtml(getContratoConsorcioHtml(currentTender, company));
  };

  const handleResetAnexo5 = () => {
    setAnexo5Html(getAnexo5PromesaConsorcioHtml(currentTender, company));
  };

  // Strictly 2 consortium members
  const member1: ConsorcioMember = company.integrantesConsorcio?.[0] || {
    id: "member-1",
    razonSocial: company.razonSocial || "CONSTRUCTORA & CONSULTORA MARUFO S.A.C.",
    ruc: company.ruc || "20542350033",
    porcentajeParticipacion: 95,
    obligaciones: "Ejecución integral de las partidas operativas, aporte de experiencia técnica en la especialidad, dirección técnica y administración financiera.",
    representante: company.representanteLegal || "Henry Omar Marrufo Delgado",
    dni: company.dniRepresentante || "43900892",
    cargoRepresentante: "Gerente General",
    domicilioFiscal: company.domicilioFiscal || "Jr. Colón N° 958, Rioja, San Martín",
    distrito: "Rioja",
    provincia: "Rioja",
    departamento: "San Martín",
    telefono: company.telefono || "942654321",
    email: company.email || "gerencia.empresa1@gmail.com",
    registroRNP: company.registroRNP || "Ejecutor de Obras",
    partidaRegistralSunarp: company.partidaRegistralSunarp || "11052546",
    asientoRegistral: company.asientoRegistral || "C00003",
    sedeRegistral: company.sedeRegistral || "Oficina Registral de Moyobamba - Zona Registral III",
    esMype: true,
  };

  const member2: ConsorcioMember = company.integrantesConsorcio?.[1] || {
    id: "member-2",
    razonSocial: "INGENIERÍA & CONSTRUCCIÓN REATEGUI E.I.R.L.",
    ruc: "20601280834",
    porcentajeParticipacion: 5,
    obligaciones: "Elaboración y formulación de la oferta técnica y económica, recopilación y presentación del plantel profesional clave y equipamiento estratégico.",
    representante: "Jhonny Reategui Alegría",
    dni: "43500740",
    cargoRepresentante: "Gerente General",
    domicilioFiscal: "Julio C. Arana N° 312, Rioja, San Martín",
    distrito: "Rioja",
    provincia: "Rioja",
    departamento: "San Martín",
    telefono: "956123456",
    email: "administracion.empresa2@gmail.com",
    registroRNP: "Ejecutor de Obras",
    partidaRegistralSunarp: "11084474",
    asientoRegistral: "C00002",
    sedeRegistral: "Oficina Registral de Tarapoto - Zona Registral III",
    esMype: true,
  };

  const members: ConsorcioMember[] = [member1, member2];

  const totalPercentage = (Number(member1.porcentajeParticipacion) || 0) + (Number(member2.porcentajeParticipacion) || 0);

  const handleToggleConsorcio = (isConsorcio: boolean) => {
    if (isConsorcio) {
      setCompany({
        ...company,
        esConsorcio: true,
        nombreConsorcio: company.nombreConsorcio || "CONSORCIO VIAL NORTE",
        representanteComunConsorcio: company.representanteComunConsorcio || member1.representante,
        dniRepresentanteComun: company.dniRepresentanteComun || member1.dni,
        representanteAlternoConsorcio: company.representanteAlternoConsorcio || member2.representante,
        dniRepresentanteAlterno: company.dniRepresentanteAlterno || member2.dni,
        domicilioComunConsorcio: company.domicilioComunConsorcio || member1.domicilioFiscal,
        emailComunConsorcio: company.emailComunConsorcio || "consorciovialnorte.seace@gmail.com",
        operadorTributario: company.operadorTributario || member1.razonSocial,
        ciudadFirmaContrato: company.ciudadFirmaContrato || "Rioja",
        fechaFirmaContrato: company.fechaFirmaContrato || new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }),
        centroArbitraje: company.centroArbitraje || "Centro de Arbitraje de la Pontificia Universidad Católica del Perú (PUCP) / OSCE",
        integrantesConsorcio: [member1, member2],
      });
    } else {
      setCompany({
        ...company,
        esConsorcio: false,
      });
    }
  };

  const handleLoadSampleConsortium = () => {
    const sampleM1: ConsorcioMember = {
      id: "member-1",
      razonSocial: "CONSTRUCTORA & CONSULTORA MARUFO S.A.C.",
      ruc: "20542350033",
      porcentajeParticipacion: 95,
      obligaciones: "Ejecución integral de partidas operativas, aporte de experiencia técnica en la especialidad, dirección técnica y administración financiera de obra.",
      representante: "Henry Omar Marrufo Delgado",
      dni: "43900892",
      cargoRepresentante: "Gerente General",
      domicilioFiscal: "Jr. Colón N° 958, Rioja, San Martín",
      distrito: "Rioja",
      provincia: "Rioja",
      departamento: "San Martín",
      telefono: "942654321",
      email: "consorcio.marufo@gmail.com",
      registroRNP: "Ejecutor de Obras",
      partidaRegistralSunarp: "11052546",
      asientoRegistral: "C00003",
      sedeRegistral: "Oficina Registral de Moyobamba - Zona Registral III",
      esMype: true,
    };

    const sampleM2: ConsorcioMember = {
      id: "member-2",
      razonSocial: "INGENIERÍA & CONSTRUCCIÓN REATEGUI E.I.R.L.",
      ruc: "20601280834",
      porcentajeParticipacion: 5,
      obligaciones: "Elaboración y formulación de la oferta técnica y económica, recopilación y presentación del plantel profesional clave y equipamiento estratégico.",
      representante: "Jhonny Reategui Alegría",
      dni: "43500740",
      cargoRepresentante: "Gerente General",
      domicilioFiscal: "Julio C. Arana N° 312, Rioja, San Martín",
      distrito: "Rioja",
      provincia: "Rioja",
      departamento: "San Martín",
      telefono: "956123456",
      email: "administracion.reategui@gmail.com",
      registroRNP: "Ejecutor de Obras",
      partidaRegistralSunarp: "11084474",
      asientoRegistral: "C00002",
      sedeRegistral: "Oficina Registral de Tarapoto - Zona Registral III",
      esMype: true,
    };

    setCompany({
      ...company,
      esConsorcio: true,
      nombreConsorcio: "CONSORCIO VIAL NORTE",
      representanteComunConsorcio: "Henry Omar Marrufo Delgado",
      dniRepresentanteComun: "43900892",
      representanteAlternoConsorcio: "Jhonny Reategui Alegría",
      dniRepresentanteAlterno: "43500740",
      domicilioComunConsorcio: "Jr. Colón N° 958, Rioja, San Martín",
      emailComunConsorcio: "consorciovialnorte.seace@gmail.com",
      operadorTributario: "CONSTRUCTORA & CONSULTORA MARUFO S.A.C.",
      ciudadFirmaContrato: "Rioja",
      fechaFirmaContrato: new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }),
      centroArbitraje: "Centro de Arbitraje de la Pontificia Universidad Católica del Perú (PUCP) / OSCE",
      integrantesConsorcio: [sampleM1, sampleM2],
    });

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3500);
  };

  const handleUpdateMember = (index: 0 | 1, field: keyof ConsorcioMember, value: any) => {
    const currentM1 = { ...member1 };
    const currentM2 = { ...member2 };

    if (index === 0) {
      (currentM1 as any)[field] = value;
    } else {
      (currentM2 as any)[field] = value;
    }

    setCompany({
      ...company,
      integrantesConsorcio: [currentM1, currentM2],
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleSaveAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    if (onNavigateToTab) {
      setTimeout(() => {
        onNavigateToTab("experience");
      }, 400);
    }
  };

  // Generate plain text version for visualizer copy
  const getFullContractText = () => {
    return `CONTRATO PRIVADO DE CONSORCIO CON FIRMAS LEGALIZADAS NOTARIALMENTE

Conste por el presente documento privado de CONTRATO DE CONSORCIO, que celebran de conformidad con lo establecido en el Artículo 13 de la Ley de Contrataciones del Estado (Ley N° 30225 / Ley N° 32069), su Reglamento, y supletoriamente por los Artículos 445° al 448° de la Ley General de Sociedades (Ley N° 26887):

DE UNA PARTE:
1. ${member1.razonSocial}, con RUC N° ${member1.ruc}, inscrita en la Partida Electrónica N° ${member1.partidaRegistralSunarp || "11052546"}, Asiento ${member1.asientoRegistral || "C00003"} del Registro de Personas Jurídicas de ${member1.sedeRegistral || "SUNARP"}, con domicilio legal en ${member1.domicilioFiscal}, debidamente representada por su ${member1.cargoRepresentante || "Gerente General"}, don(ña) ${member1.representante}, identificado con DNI N° ${member1.dni}.

Y DE LA OTRA PARTE:
2. ${member2.razonSocial}, con RUC N° ${member2.ruc}, inscrita en la Partida Electrónica N° ${member2.partidaRegistralSunarp || "11084474"}, Asiento ${member2.asientoRegistral || "C00002"} del Registro de Personas Jurídicas de ${member2.sedeRegistral || "SUNARP"}, con domicilio legal en ${member2.domicilioFiscal}, debidamente representada por su ${member2.cargoRepresentante || "Gerente General"}, don(ña) ${member2.representante}, identificado con DNI N° ${member2.dni}.

CLÁUSULA PRIMERA: DE LAS PARTES Y MARCO LEGAL
Las partes declaran ser personas jurídicas formalmente constituidas e inscritas en el Registro Nacional de Proveedores (RNP) del OSCE como ${member1.registroRNP || "Ejecutores de Obras"}.

CLÁUSULA SEGUNDA: DEL OBJETO DEL CONSORCIO
El presente Consorcio tiene por objeto exclusivo la participación conjunta en el procedimiento de selección ${currentTender.nomenclatura}, convocado por ${currentTender.entidadConvocante}, para la ejecución de: "${currentTender.descripcionObjeto || currentTender.objetoContratacion}".

CLÁUSULA TERCERA: DENOMINACIÓN Y DOMICILIO COMÚN
El Consorcio actuará bajo la denominación oficial de "${company.nombreConsorcio || "CONSORCIO VIAL NORTE"}", fijando su domicilio común en ${company.domicilioComunConsorcio || member1.domicilioFiscal} y correo electrónico oficial ${company.emailComunConsorcio || "consorcio@gmail.com"}.

CLÁUSULA CUARTA: DURACIÓN DEL CONSORCIO
El plazo de vigencia del Consorcio se inicia con la suscripción del presente documento y regirá hasta la total culminación, liquidación y pago final del contrato de obra.

CLÁUSULA QUINTA: PORCENTAJE DE PARTICIPACIÓN Y OBLIGACIONES ASUMIDAS
- ${member1.razonSocial}: ${member1.porcentajeParticipacion}% de participación. Obligaciones: ${member1.obligaciones}
- ${member2.razonSocial}: ${member2.porcentajeParticipacion}% de participación. Obligaciones: ${member2.obligaciones}

CLÁUSULA SEXTA: DESIGNACIÓN DEL OPERADOR TRIBUTARIO
Las partes acuerdan designar a ${company.operadorTributario || member1.razonSocial} como OPERADOR TRIBUTARIO del Consorcio, facultado para la emisión y centralización de comprobantes de pago y cuentas bancarias.

CLÁUSULA SÉPTIMA: RESPONSABILIDAD SOLIDARIA E INDIVISIBLE
Los integrantes del Consorcio responden solidaria e indivisiblemente ante ${currentTender.entidadConvocante} por todas las consecuencias derivadas de la oferta y ejecución contractual.

CLÁUSULA OCTAVA: DESIGNACIÓN DEL REPRESENTANTE LEGAL COMÚN Y FACULTADES NOTARIALES
Se designa como Representante Legal Común a don(ña) ${company.representanteComunConsorcio || member1.representante}, identificado con DNI N° ${company.dniRepresentanteComun || member1.dni}, y como Representante Alterno a don(ña) ${company.representanteAlternoConsorcio || member2.representante}, con DNI N° ${company.dniRepresentanteAlterno || member2.dni}, confiriéndoles las 11 facultades notariales plenas para representación, suscripción contractual, adicionales, trámites bancarios, SUNAT, SUNAFIL y liquidación.

CLÁUSULA NOVENA: SOLUCIÓN DE CONTROVERSIAS Y ARBITRAJE
Toda controversia será sometida a arbitraje institucional administrado por: ${company.centroArbitraje || "Centro de Arbitraje de la PUCP / OSCE"}.

En señal de conformidad, las partes suscriben el presente contrato en la ciudad de ${company.ciudadFirmaContrato || "Rioja"}, el ${company.fechaFirmaContrato || "fecha actual"}, procediendo a la certificación notarial de firmas.`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getFullContractText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Paso 2 de 6 • Identificación del Postor • Empresa Individual o Consorcio (2 Empresas)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Identificación del Postor y Consorcio Postor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Configure los datos de su empresa individual o del <strong>Consorcio Postor (2 empresas integrantes)</strong> con sus porcentajes de participación, obligaciones técnicas, poderes notariales y visualice en tiempo real el borrador del <strong>Contrato de Consorcio</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSampleConsortium}
            className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            title="Cargar ejemplo real de licitación en consorcio (95% - 5% con Notaría)"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Cargar Ejemplo Licitación</span>
          </button>

          {savedMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-in fade-in shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Guardado!</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Selector: Empresa Individual vs Consorcio */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Modalidad de Presentación de Oferta (SEACE):
            </span>
            <span className="text-sm font-semibold text-slate-800">
              ¿Se presenta como postor individual o en Consorcio?
            </span>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleConsorcio(false)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                !company.esConsorcio
                  ? "bg-white text-blue-900 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Empresa Individual (1 RUC)</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleConsorcio(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                company.esConsorcio
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Consorcio Postor (2 Empresas)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONSORCIO VIEW */}
      {company.esConsorcio ? (
        <div className="space-y-6">
          {/* Sub Navigation Tabs for Consorcio View */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveConsortiumTab("integrantes")}
              className={`pb-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeConsortiumTab === "integrantes"
                  ? "border-blue-600 text-blue-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>1. Las 2 Empresas Consorciadas (% y Obligaciones)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConsortiumTab("general")}
              className={`pb-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeConsortiumTab === "general"
                  ? "border-blue-600 text-blue-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Datos del Consorcio & Representante Común</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConsortiumTab("notarial")}
              className={`pb-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeConsortiumTab === "notarial"
                  ? "border-blue-600 text-blue-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Stamp className="w-4 h-4" />
              <span>3. Cláusulas Notariales & Operador Tributario</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConsortiumTab("visualizador")}
              className={`pb-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeConsortiumTab === "visualizador"
                  ? "border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>4. Editor Word Interactivo (Contrato y Anexo 5)</span>
            </button>
          </div>

          {/* TAB 1: LAS 2 EMPRESAS INTEGRANTES */}
          {activeConsortiumTab === "integrantes" && (
            <div className="space-y-5">
              {/* Validation Status */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                  totalPercentage === 100
                    ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                    : "bg-amber-50/90 border-amber-300 text-amber-900"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {totalPercentage === 100 ? (
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-600 text-white rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {totalPercentage === 100
                        ? "Participación Consolidada: 100.00% (Válido para OSCE)"
                        : `Participación Actual: ${totalPercentage.toFixed(1)}% (Empresa 1 + Empresa 2 deben sumar exactamente 100.00%)`}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Empresa 1: <strong>{member1.porcentajeParticipacion}%</strong> | Empresa 2: <strong>{member2.porcentajeParticipacion}%</strong>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  {totalPercentage === 100 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Listo para generar Anexos y Contrato
                    </span>
                  ) : (
                    <span className="text-amber-800 font-bold">Ajuste los % en cada empresa para sumar 100%</span>
                  )}
                </div>
              </div>

              {/* EMPRESA 1 (LÍDER) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                      1
                    </span>
                    <span className="font-bold text-sm">Empresa 1 (Consorciado Líder / Principal)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                      {member1.porcentajeParticipacion}% Participación
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Razón Social de la Empresa 1:
                      </label>
                      <input
                        type="text"
                        value={member1.razonSocial}
                        onChange={(e) => handleUpdateMember(0, "razonSocial", e.target.value)}
                        placeholder="Ej: CONSTRUCTORA & CONSULTORA MARUFO S.A.C."
                        className="w-full font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RUC:</label>
                      <input
                        type="text"
                        value={member1.ruc}
                        onChange={(e) => handleUpdateMember(0, "ruc", e.target.value)}
                        placeholder="20542350033"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        % de Participación:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={member1.porcentajeParticipacion}
                        onChange={(e) => handleUpdateMember(0, "porcentajeParticipacion", parseFloat(e.target.value) || 0)}
                        className="w-full font-bold text-blue-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Representante Legal:
                      </label>
                      <input
                        type="text"
                        value={member1.representante}
                        onChange={(e) => handleUpdateMember(0, "representante", e.target.value)}
                        placeholder="Henry Omar Marrufo Delgado"
                        className="w-full font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        DNI del Representante:
                      </label>
                      <input
                        type="text"
                        value={member1.dni}
                        onChange={(e) => handleUpdateMember(0, "dni", e.target.value)}
                        placeholder="43900892"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Cargo:
                      </label>
                      <input
                        type="text"
                        value={member1.cargoRepresentante || "Gerente General"}
                        onChange={(e) => handleUpdateMember(0, "cargoRepresentante", e.target.value)}
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Registro RNP:
                      </label>
                      <input
                        type="text"
                        value={member1.registroRNP || "Ejecutor de Obras"}
                        onChange={(e) => handleUpdateMember(0, "registroRNP", e.target.value)}
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* SUNARP Data */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Partida SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member1.partidaRegistralSunarp || ""}
                        onChange={(e) => handleUpdateMember(0, "partidaRegistralSunarp", e.target.value)}
                        placeholder="11052546"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Asiento SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member1.asientoRegistral || "C00003"}
                        onChange={(e) => handleUpdateMember(0, "asientoRegistral", e.target.value)}
                        placeholder="C00003"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sede Registral SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member1.sedeRegistral || ""}
                        onChange={(e) => handleUpdateMember(0, "sedeRegistral", e.target.value)}
                        placeholder="Oficina Registral de Moyobamba - Zona Registral III"
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Domicilio Legal:
                      </label>
                      <input
                        type="text"
                        value={member1.domicilioFiscal || ""}
                        onChange={(e) => handleUpdateMember(0, "domicilioFiscal", e.target.value)}
                        placeholder="Jr. Colón N° 958, Rioja, San Martín"
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member1.esMype || false}
                          onChange={(e) => handleUpdateMember(0, "esMype", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold text-slate-700">MYPE (REMYPE)</span>
                      </label>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Obligaciones Específicas Asumidas (Cláusula 5 del Contrato y Anexo 5):
                      </label>
                      <textarea
                        rows={2}
                        value={member1.obligaciones}
                        onChange={(e) => handleUpdateMember(0, "obligaciones", e.target.value)}
                        placeholder="Detalle de partidas operativas, aporte de experiencia técnica en la especialidad, dirección técnica..."
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* EMPRESA 2 (INTEGRANTE) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-800 px-5 py-3 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                      2
                    </span>
                    <span className="font-bold text-sm">Empresa 2 (Consorciado Integrante)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                      {member2.porcentajeParticipacion}% Participación
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Razón Social de la Empresa 2:
                      </label>
                      <input
                        type="text"
                        value={member2.razonSocial}
                        onChange={(e) => handleUpdateMember(1, "razonSocial", e.target.value)}
                        placeholder="Ej: INGENIERÍA & CONSTRUCCIÓN REATEGUI E.I.R.L."
                        className="w-full font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RUC:</label>
                      <input
                        type="text"
                        value={member2.ruc}
                        onChange={(e) => handleUpdateMember(1, "ruc", e.target.value)}
                        placeholder="20601280834"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        % de Participación:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={member2.porcentajeParticipacion}
                        onChange={(e) => handleUpdateMember(1, "porcentajeParticipacion", parseFloat(e.target.value) || 0)}
                        className="w-full font-bold text-blue-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Representante Legal:
                      </label>
                      <input
                        type="text"
                        value={member2.representante}
                        onChange={(e) => handleUpdateMember(1, "representante", e.target.value)}
                        placeholder="Jhonny Reategui Alegría"
                        className="w-full font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        DNI del Representante:
                      </label>
                      <input
                        type="text"
                        value={member2.dni}
                        onChange={(e) => handleUpdateMember(1, "dni", e.target.value)}
                        placeholder="43500740"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Cargo:
                      </label>
                      <input
                        type="text"
                        value={member2.cargoRepresentante || "Gerente General"}
                        onChange={(e) => handleUpdateMember(1, "cargoRepresentante", e.target.value)}
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Registro RNP:
                      </label>
                      <input
                        type="text"
                        value={member2.registroRNP || "Ejecutor de Obras"}
                        onChange={(e) => handleUpdateMember(1, "registroRNP", e.target.value)}
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* SUNARP Data */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Partida SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member2.partidaRegistralSunarp || ""}
                        onChange={(e) => handleUpdateMember(1, "partidaRegistralSunarp", e.target.value)}
                        placeholder="11084474"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Asiento SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member2.asientoRegistral || "C00002"}
                        onChange={(e) => handleUpdateMember(1, "asientoRegistral", e.target.value)}
                        placeholder="C00002"
                        className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sede Registral SUNARP:
                      </label>
                      <input
                        type="text"
                        value={member2.sedeRegistral || ""}
                        onChange={(e) => handleUpdateMember(1, "sedeRegistral", e.target.value)}
                        placeholder="Oficina Registral de Tarapoto - Zona Registral III"
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Domicilio Legal:
                      </label>
                      <input
                        type="text"
                        value={member2.domicilioFiscal || ""}
                        onChange={(e) => handleUpdateMember(1, "domicilioFiscal", e.target.value)}
                        placeholder="Julio C. Arana N° 312, Rioja, San Martín"
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member2.esMype || false}
                          onChange={(e) => handleUpdateMember(1, "esMype", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold text-slate-700">MYPE (REMYPE)</span>
                      </label>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Obligaciones Específicas Asumidas (Cláusula 5 del Contrato y Anexo 5):
                      </label>
                      <textarea
                        rows={2}
                        value={member2.obligaciones}
                        onChange={(e) => handleUpdateMember(1, "obligaciones", e.target.value)}
                        placeholder="Elaboración y formulación de oferta técnica/económica, plantel profesional clave y equipamiento..."
                        className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATOS DEL CONSORCIO & REPRESENTACIÓN COMÚN */}
          {activeConsortiumTab === "general" && (
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-blue-950 font-bold text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Identificación Principal del Consorcio Postor</span>
                </div>
                <span className="bg-blue-50 text-blue-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                  Directiva N° 005-2019-OSCE/CD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Denominación Oficial del Consorcio:
                  </label>
                  <input
                    type="text"
                    value={company.nombreConsorcio || ""}
                    onChange={(e) => setCompany({ ...company, nombreConsorcio: e.target.value, razonSocial: e.target.value })}
                    placeholder="Ej: CONSORCIO VIAL NORTE"
                    className="w-full font-bold text-blue-950 border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/20"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Nombre oficial para todos los Anexos 1 al 8, Oferta Económica y Contrato de Consorcio.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Domicilio Común del Consorcio:
                  </label>
                  <input
                    type="text"
                    value={company.domicilioComunConsorcio || ""}
                    onChange={(e) => setCompany({ ...company, domicilioComunConsorcio: e.target.value, domicilioFiscal: e.target.value })}
                    placeholder="Ej: Jr. Colón N° 958, Rioja, San Martín"
                    className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Representante Legal Común:
                  </label>
                  <input
                    type="text"
                    value={company.representanteComunConsorcio || ""}
                    onChange={(e) => setCompany({ ...company, representanteComunConsorcio: e.target.value, representanteLegal: e.target.value })}
                    placeholder="Ej: Henry Omar Marrufo Delgado"
                    className="w-full font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    DNI del Representante Común:
                  </label>
                  <input
                    type="text"
                    value={company.dniRepresentanteComun || ""}
                    onChange={(e) => setCompany({ ...company, dniRepresentanteComun: e.target.value, dniRepresentante: e.target.value })}
                    placeholder="Ej: 43900892"
                    className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Representante Legal Alterno:
                  </label>
                  <input
                    type="text"
                    value={company.representanteAlternoConsorcio || ""}
                    onChange={(e) => setCompany({ ...company, representanteAlternoConsorcio: e.target.value })}
                    placeholder="Ej: Jhonny Reategui Alegría"
                    className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    DNI del Representante Alterno:
                  </label>
                  <input
                    type="text"
                    value={company.dniRepresentanteAlterno || ""}
                    onChange={(e) => setCompany({ ...company, dniRepresentanteAlterno: e.target.value })}
                    placeholder="Ej: 43500740"
                    className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico Común (Notificaciones Electrónicas SEACE):
                  </label>
                  <input
                    type="email"
                    value={company.emailComunConsorcio || ""}
                    onChange={(e) => setCompany({ ...company, emailComunConsorcio: e.target.value, email: e.target.value })}
                    placeholder="Ej: consorciovialnorte.seace@gmail.com"
                    className="w-full text-blue-900 font-semibold border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLÁUSULAS NOTARIALES & OPERADOR TRIBUTARIO */}
          {activeConsortiumTab === "notarial" && (
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-blue-950 font-bold text-sm">
                  <Stamp className="w-4 h-4 text-blue-600" />
                  <span>Cláusulas Notariales, Operador Tributario y Centro de Arbitraje</span>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                  D. Leg. N° 1049 del Notariado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designación de Empresa Operador Tributario (Cláusula Sexta):
                  </label>
                  <select
                    value={company.operadorTributario || member1.razonSocial}
                    onChange={(e) => setCompany({ ...company, operadorTributario: e.target.value })}
                    className="w-full font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  >
                    <option value={member1.razonSocial}>
                      1. {member1.razonSocial} (RUC: {member1.ruc}) - {member1.porcentajeParticipacion}%
                    </option>
                    <option value={member2.razonSocial}>
                      2. {member2.razonSocial} (RUC: {member2.ruc}) - {member2.porcentajeParticipacion}%
                    </option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Empresa autorizada para centralizar la facturación y contabilidad del Consorcio.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ciudad de Firma Notarial:
                  </label>
                  <input
                    type="text"
                    value={company.ciudadFirmaContrato || "Rioja"}
                    onChange={(e) => setCompany({ ...company, ciudadFirmaContrato: e.target.value })}
                    placeholder="Ej: Rioja / Moyobamba / Lima"
                    className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Centro de Arbitraje y Conciliación (Cláusula Novena de Controversias):
                  </label>
                  <input
                    type="text"
                    value={company.centroArbitraje || "Centro de Arbitraje de la Pontificia Universidad Católica del Perú (PUCP) / OSCE"}
                    onChange={(e) => setCompany({ ...company, centroArbitraje: e.target.value })}
                    placeholder="Ej: Centro de Arbitraje de la PUCP / OSCE / Cámara de Comercio"
                    className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha de Formalización:
                  </label>
                  <input
                    type="text"
                    value={company.fechaFirmaContrato || new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                    onChange={(e) => setCompany({ ...company, fechaFirmaContrato: e.target.value })}
                    className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Informative summary of 11 Notary Powers */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Facultades Notariales Incorporadas al Representante Legal (Cláusula 8):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>✓ 1. Representación integral ante la Entidad Convocante.</div>
                  <div>✓ 2. Suscripción de contrato, adendas, adicionales y liquidación.</div>
                  <div>✓ 3. Trámite de cartas fianzas y pólizas de caución a sola firma.</div>
                  <div>✓ 4. Representación judicial procesal (Arts. 74, 75 y 77 CPC).</div>
                  <div>✓ 5. Representación en arbitrajes y conciliaciones con la Entidad.</div>
                  <div>✓ 6. Contratación, amonestación y resolución de personal.</div>
                  <div>✓ 7. Celebración de contratos laborales y de locación de servicios.</div>
                  <div>✓ 8. Negociación colectiva y trámites ante SUNAFIL / MTPE.</div>
                  <div>✓ 9. Representación ante EsSalud, AFP y ONP.</div>
                  <div>✓ 10. Otorgamiento de cartas poder por escritura pública.</div>
                  <div className="sm:col-span-2">✓ 11. Representación ante autoridades tributarias (SUNAT), supervisoras (OSCE, Contraloría).</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EDITOR WORD INTERACTIVO DEL CONTRATO / ANEXO 5 */}
          {activeConsortiumTab === "visualizador" && (
            <div className="space-y-4">
              {/* Document Selector Ribbon */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Editor Documentario Tipo Word (Consorcio y Anexo 5)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Edita directamente en la hoja cualquier cláusula, porcentaje o representante como en Microsoft Word.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewDocType("contrato")}
                      className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                        previewDocType === "contrato"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Stamp className="w-3.5 h-3.5" />
                      <span>Contrato Notarial de Consorcio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDocType("anexo5")}
                      className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                        previewDocType === "anexo5"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Anexo 5: Promesa Formal OSCE</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Word Document Editor Container */}
              {previewDocType === "contrato" ? (
                <WordDocumentEditor
                  initialHtml={contratoHtml}
                  documentTitle="Contrato Privado de Consorcio con Firmas Legalizadas Notarialmente"
                  documentSubtitle={`${company.nombreConsorcio || "CONSORCIO VIAL NORTE"} • 11 Facultades Notariales Plenas`}
                  nomenclatura={currentTender.nomenclatura}
                  onContentChange={(html) => {
                    setContratoHtml(html);
                  }}
                  onDownloadDocx={handleDownloadContratoWord}
                  onResetToDefault={handleResetContrato}
                  isDownloadingDocx={isDownloadingDocx}
                />
              ) : (
                <WordDocumentEditor
                  initialHtml={anexo5Html}
                  documentTitle="Anexo N° 5: Promesa Formal de Consorcio"
                  documentSubtitle="Directiva N° 005-2019-OSCE/CD • Ley N° 32069 • OSCE / SEACE"
                  nomenclatura={currentTender.nomenclatura}
                  onContentChange={(html) => {
                    setAnexo5Html(html);
                  }}
                  onDownloadDocx={handleDownloadAnexo5Word}
                  onResetToDefault={handleResetAnexo5}
                  isDownloadingDocx={isDownloadingDocx}
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <button
              type="button"
              onClick={() => onNavigateToTab ? onNavigateToTab("analyzer") : null}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Paso 1: Análisis de Bases SEACE</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="submit"
                onClick={handleSave}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Perfil Consorcio</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                <span>Guardar y Continuar al Paso 3: Experiencia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* INDIVIDUAL COMPANY VIEW */
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 text-xs">
          {/* Section 1: Identificación Tributaria y Legal */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-900 font-bold text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Identificación de la Empresa Postora Individual</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Razón Social Completa:</label>
                <input
                  type="text"
                  value={company.razonSocial}
                  onChange={(e) => setCompany({ ...company, razonSocial: e.target.value })}
                  placeholder="Ej: CONSTRUCTORA E INGENIERÍA S.A.C."
                  className="w-full font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Número de RUC:</label>
                <input
                  type="text"
                  value={company.ruc}
                  onChange={(e) => setCompany({ ...company, ruc: e.target.value })}
                  placeholder="20123456789"
                  className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Registro Nacional de Proveedores (RNP):</label>
                <input
                  type="text"
                  value={company.registroRNP}
                  onChange={(e) => setCompany({ ...company, registroRNP: e.target.value })}
                  className="w-full font-semibold text-blue-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Estado de Vigencia RNP:</label>
                <select
                  value={company.rnpVigente ? "true" : "false"}
                  onChange={(e) => setCompany({ ...company, rnpVigente: e.target.value === "true" })}
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                >
                  <option value="true">Vigente (Habilitado para contratar con el Estado)</option>
                  <option value="false">No Vigente / En Trámite</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Partida Electrónica SUNARP:</label>
                <input
                  type="text"
                  value={company.partidaRegistralSunarp || ""}
                  onChange={(e) => setCompany({ ...company, partidaRegistralSunarp: e.target.value })}
                  placeholder="11029384 (Zona Registral IX Lima)"
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Representación Legal */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-900 font-bold text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>2. Representante Legal Apoderado</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Nombres y Apellidos del Representante:</label>
                <input
                  type="text"
                  value={company.representanteLegal}
                  onChange={(e) => setCompany({ ...company, representanteLegal: e.target.value })}
                  placeholder="Ej: Ing. Jorge Luis Ramírez Castillo"
                  className="w-full font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">DNI / CE del Representante:</label>
                <input
                  type="text"
                  value={company.dniRepresentante}
                  onChange={(e) => setCompany({ ...company, dniRepresentante: e.target.value })}
                  placeholder="40123456"
                  className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Domicilio y Contacto Oficial */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-slate-900 font-bold text-sm">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>3. Domicilio Fiscal y Correo de Notificaciones Electrónicas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Dirección / Domicilio Fiscal:</label>
                <input
                  type="text"
                  value={company.domicilioFiscal}
                  onChange={(e) => setCompany({ ...company, domicilioFiscal: e.target.value })}
                  placeholder="Av. Faustino Sánchez Carrión 615, Jesús María"
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Distrito:</label>
                <input
                  type="text"
                  value={company.distrito}
                  onChange={(e) => setCompany({ ...company, distrito: e.target.value })}
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Provincia / Departamento:</label>
                <input
                  type="text"
                  value={company.provincia}
                  onChange={(e) => setCompany({ ...company, provincia: e.target.value })}
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Correo Electrónico (Notificación SEACE):</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full text-blue-900 font-medium border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Teléfono / Celular:</label>
                <input
                  type="text"
                  value={company.telefono}
                  onChange={(e) => setCompany({ ...company, telefono: e.target.value })}
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Entidad Bancaria:</label>
                <input
                  type="text"
                  value={company.banco}
                  onChange={(e) => setCompany({ ...company, banco: e.target.value })}
                  className="w-full text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Cuenta Corriente Interbancaria (CCI):</label>
                <input
                  type="text"
                  value={company.cuentaCCI}
                  onChange={(e) => setCompany({ ...company, cuentaCCI: e.target.value })}
                  className="w-full font-mono text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateToTab ? onNavigateToTab("analyzer") : null}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Paso 1: Análisis de Bases SEACE</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="submit"
                onClick={handleSave}
                className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Perfil</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                <span>Guardar y Continuar al Paso 3: Experiencia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
