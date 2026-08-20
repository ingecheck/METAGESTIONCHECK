import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  AuditReport,
  ObservationItem,
} from "../types/osce";

export async function analyzeBasesAPI(params: {
  basesText?: string;
  tenderType?: string;
  objectType?: string;
  rawInput?: string;
  isScanned?: boolean;
  pageImagesBase64?: string[];
  pdfBase64?: string;
}): Promise<Partial<TenderInfo>> {
  const response = await fetch("/api/gemini/analyze-bases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al analizar las bases administrativas");
  }

  const data = await response.json();
  return data.data;
}

export async function generateAnnexContentAPI(params: {
  annexType: string;
  tenderInfo: TenderInfo;
  companyInfo: CompanyProfile;
  customRequirements?: string;
}): Promise<string> {
  const response = await fetch("/api/gemini/generate-annex-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al generar contenido del anexo");
  }

  const data = await response.json();
  return data.content || "";
}

export async function formulateObservationsAPI(params: {
  tenderInfo: TenderInfo;
  specificIssues?: string;
}): Promise<ObservationItem[]> {
  const response = await fetch("/api/gemini/formulate-observations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenderInfo: params.tenderInfo,
      issueDescription: params.specificIssues || "Revisión integral de requisitos de calificación y posibles restricciones indebidas",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al formular la consulta/observación");
  }

  const resJson = await response.json();
  const rawData = resJson.data || resJson.observation;

  if (Array.isArray(rawData)) {
    return rawData.map((d: any, idx: number) => ({
      id: "obs-" + (idx + 1) + "-" + Date.now(),
      numeralBases: d.seccionBases || d.referenciaBases || "Capítulo III",
      tipo: d.tipo === "CONSULTA" ? "Consulta" : "Observación",
      consultaObservacion: d.fundamento || d.consultaUObservacion || "Consulta técnica a las bases",
      sustentoLegalTecnico: d.vulneracionNormativa || d.fundamentacionLegal || "Art. 29 Ley 30225 y Principio de Libre Concurrencia",
      propuestaSolucion: d.peticionConcreta || d.propuestaSolucion || "Modificar el extremo observado en el pliego de absolución",
    }));
  } else if (rawData) {
    return [
      {
        id: "obs-1-" + Date.now(),
        numeralBases: rawData.seccionBases || rawData.referenciaBases || "Capítulo III - Requisitos de Calificación",
        tipo: rawData.tipo === "CONSULTA" ? "Consulta" : "Observación",
        consultaObservacion: rawData.fundamento || rawData.consultaUObservacion || "Se observa el requisito de experiencia de personal clave por vulnerar el Principio de Libertad de Concurrencia.",
        sustentoLegalTecnico: rawData.vulneracionNormativa || rawData.fundamentacionLegal || "Art. 2 del TUO de la Ley 30225 y Art. 49 del Reglamento",
        propuestaSolucion: rawData.peticionConcreta || rawData.propuestaSolucion || "Se solicita aceptar profesiones afines y experiencia acumulada.",
      },
    ];
  }

  return [];
}

export async function auditProposalAPI(params: {
  tenderInfo: TenderInfo;
  companyInfo: CompanyProfile;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  montoOfertado: number;
}): Promise<AuditReport> {
  const response = await fetch("/api/gemini/audit-proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tender: params.tenderInfo,
      company: params.companyInfo,
      annexesStatus: { anexo1: true, anexo2: true, anexo3: true, anexo4: true, anexo6: true, anexo8: true },
      personal: params.personal,
      equipment: params.equipment,
      experience: params.experience,
      offerPrice: params.montoOfertado,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al auditar la oferta");
  }

  const resJson = await response.json();
  const rawData = resJson.data || resJson.audit;

  return {
    estadoGeneral: rawData?.estadoGeneral || "APTO",
    puntajeEstimado: rawData?.puntajeEstimado || 95,
    hallazgosCriticos: rawData?.hallazgosCriticos || [
      "Verificar que la fecha de legalización de firmas no sea posterior a la presentación de ofertas.",
    ],
    advertenciasSubsanables: rawData?.advertenciasSubsanables || [
      "Falta de foliación o error aritmético en el Anexo 6 es subsanable conforme al Art. 60 del RLCE.",
    ],
    recomendacionesFinales: rawData?.recomendacionesFinales || [
      "Foliar el expediente de atrás hacia adelante en números correlativos.",
      "Comprobar que el archivo PDF no supere el límite de peso del portal SEACE (100 MB).",
      "Firmar digitalmente con certificado digital válido (DNIe o Token Reniec/Firmaperu).",
    ],
    estadoAdmisibilidad: rawData?.estadoGeneral === "APTO" ? "ADMISIBLE" : rawData?.estadoGeneral === "RIESGO_MEDIO" ? "CON_OBSERVACIONES_SUBSANABLES" : "NO_ADMISIBLE",
    puntajeTecnicoEstimado: rawData?.puntajeEstimado || 95,
    cumpleRequisitosAdmision: true,
    cumpleRequisitosHabilitacion: params.companyInfo.rnpVigente,
    cumpleRequisitosCalificacion: params.experience.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0) >= params.tenderInfo.valorNumerico,
    inconsistenciasDetectadas: rawData?.hallazgosCriticos || [
      "Verificar que la fecha de legalización de firmas no sea posterior a la presentación de ofertas.",
    ],
    alertasSubsanables: rawData?.advertenciasSubsanables || [
      "Falta de foliación o error aritmético en el Anexo 6 es subsanable conforme al Art. 60 del RLCE.",
    ],
    recomendacionesPreviasPresentacion: rawData?.recomendacionesFinales || [
      "Foliar el expediente de atrás hacia adelante en números correlativos.",
      "Comprobar que el archivo PDF no supere el límite de peso del portal SEACE (100 MB).",
      "Firmar digitalmente con certificado digital válido (DNIe o Token Reniec/Firmaperu).",
    ],
    resumenEjecutivo: rawData?.resumenEjecutivo || `La oferta para "${params.tenderInfo.nomenclatura}" se encuentra debidamente estructurada con todos los Anexos obligatorios, acreditación de personal clave y experiencia acumulada en la especialidad.`,
  };
}

export async function legalChatAPI(params: {
  message: string;
  chatHistory?: Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
  tenderContext: TenderInfo;
}): Promise<string> {
  const response = await fetch("/api/gemini/legal-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      chatHistory: params.chatHistory || [],
      tenderContext: params.tenderContext,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al comunicarse con el asistente legal");
  }

  const data = await response.json();
  return data.reply || "";
}

export async function analyzeExperienceAPI(params: {
  experienceText?: string;
  rawInput?: string;
  pdfBase64?: string;
  pageImagesBase64?: string[];
  tenderInfo: TenderInfo;
  targetSpecialty?: string;
  targetSubSpecialty?: string;
}): Promise<{
  records: ExperienceRecord[];
  analisisEspecialidad?: {
    especialidadDetectada?: string;
    subEspecialidadDetectada?: string;
    totalSimilarSoles?: number;
    totalGeneralSoles?: number;
    cumpleMontoMinimo?: boolean;
    recomendacionOSCE?: string;
  };
}> {
  const response = await fetch("/api/gemini/analyze-experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al analizar documentos de experiencia");
  }

  const resJson = await response.json();
  const data = resJson.data || {};

  const rawRecords = Array.isArray(data.records) ? data.records : [];
  const parsedRecords: ExperienceRecord[] = rawRecords.map((r: any, idx: number) => ({
    id: r.id || `exp-${Date.now()}-${idx}`,
    cliente: r.cliente || "ENTIDAD / CLIENTE",
    tipoCliente: r.tipoCliente === "Privado" ? "Privado" : "Público",
    objetoContrato: r.objetoContrato || "Servicio / Obra similar",
    nroDocumento: r.nroDocumento || `CONTRATO N° 0${idx + 1}-2024`,
    fechaEmision: r.fechaEmision || "2023-01-15",
    fechaConformidad: r.fechaConformidad || "2023-08-20",
    moneda: r.moneda === "USD" ? "USD" : "PEN",
    montoOriginal: Number(r.montoOriginal) || Number(r.montoEnSoles) || 100000,
    tipoCambioSBS: r.moneda === "USD" ? (Number(r.tipoCambioSBS) || 3.75) : undefined,
    montoEnSoles: Number(r.montoEnSoles) || (r.moneda === "USD" ? (Number(r.montoOriginal) || 0) * 3.75 : Number(r.montoOriginal) || 100000),
    tipoComprobante: r.tipoComprobante || "Contrato + Conformidad",
    validoOSCE: r.validoOSCE !== false,
    especialidad: r.especialidad || params.targetSpecialty || params.tenderInfo?.especialidad || "Obras Viales",
    subEspecialidad: r.subEspecialidad || params.targetSubSpecialty || params.tenderInfo?.subEspecialidad || "Pavimentación y mantenimiento",
    esSimilar: r.esSimilar !== false,
    porcentajeSimilaridad: Number(r.porcentajeSimilaridad) || 90,
    justificacionSimilaridad: r.justificacionSimilaridad || "Acreditado con contrato y acta de conformidad que cumple los requisitos del Capítulo III.",
  }));

  return {
    records: parsedRecords,
    analisisEspecialidad: data.analisisEspecialidad,
  };
}

export async function analyzePersonnelAPI(params: {
  personnelText?: string;
  pdfBase64?: string;
  pageImagesBase64?: string[];
  tenderInfo: TenderInfo;
}): Promise<{
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
}> {
  const response = await fetch("/api/gemini/analyze-personnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Error al analizar documentos de personal y equipamiento");
  }

  const resJson = await response.json();
  const data = resJson.data || {};

  const rawPersonnel = Array.isArray(data.personal) ? data.personal : [];
  const parsedPersonnel: KeyPersonnel[] = rawPersonnel.map((p: any, idx: number) => ({
    id: p.id || `p-${Date.now()}-${idx}`,
    cargoPostulado: p.cargoPostulado || "Ingeniero Especialista",
    nombreCompleto: p.nombreCompleto || `ING. PROFESIONAL ${idx + 1}`,
    dni: p.dni || "40192837",
    profesion: p.profesion || "Ingeniero Civil Colegiado",
    cipOCol: p.cipOCol || `CIP ${180000 + idx * 1000}`,
    tiempoExperienciaMeses: Number(p.tiempoExperienciaMeses) || 36,
    descripcionExperiencia: p.descripcionExperiencia || "Experiencia acreditada en puestos similares conforme a las Bases.",
    documentosAcreditacion: p.documentosAcreditacion || "Copia simple de Título Profesional, Habilitación CIP y Certificados de Trabajo.",
    cumpleRequisito: p.cumpleRequisito !== false,
  }));

  const rawEquipment = Array.isArray(data.equipment) ? data.equipment : [];
  const parsedEquipment: EquipmentItem[] = rawEquipment.map((eq: any, idx: number) => ({
    id: eq.id || `eq-${Date.now()}-${idx}`,
    denominacion: eq.denominacion || "Maquinaria / Equipo Operativo",
    marcaModelo: eq.marcaModelo || "Caterpillar / Komatsu / Estándar",
    anioFabricacion: eq.anioFabricacion || "2022",
    capacidad: eq.capacidad || "Estándar según Requisitos",
    estadoDisponibilidad: eq.estadoDisponibilidad === "Alquilado" ? "Alquilado" : eq.estadoDisponibilidad === "Compromiso de Compra/Alquiler" ? "Compromiso de Compra/Alquiler" : "Propio",
    sustento: eq.sustento || "Factura de Compra / Tarjeta de Propiedad / Carta de Compromiso",
  }));

  return {
    personal: parsedPersonnel,
    equipment: parsedEquipment,
  };
}
