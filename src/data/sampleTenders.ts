import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
  UserOfferPackage,
} from "../types/osce";

export const EMPTY_TENDER: TenderInfo = {
  id: "tender-new",
  nomenclatura: "",
  entidadConvocante: "",
  nombreProyectoInversion: "",
  codigoInversionCUI: "",
  objetoContratacion: "Ejecución de Obras",
  tipoProcedimiento: "Adjudicación Simplificada",
  sistemaContratacion: "Suma Alzada",
  especialidad: "",
  subEspecialidad: "",
  valorEstimadoReferencial: "S/ 0.00",
  valorReferencial: "0.00",
  valorNumerico: 0,
  moneda: "PEN",
  plazoEjecucion: "0 días calendario",
  plazoDias: 0,
  lugarEjecucion: "",
  departamentoEjecucion: "",
  provinciaEjecucion: "",
  distritoEjecucion: "",
  direccionLocalidadEjecucion: "",
  resumenAlcance: "",
  requisitosHabilitacion: [
    "Inscripción vigente en el RNP en el Registro de Ejecutores de Obras",
    "Capacidad máxima de contratación suficiente ante el RNP",
    "No estar inhabilitado ni suspendido para contratar con el Estado (Art. 11 Ley N° 30225)",
    "Declaración jurada de cumplimiento de Términos de Referencia / Especificaciones Técnicas (Anexo N° 2)",
  ],
  requisitosCalificacion: {
    capacidadLegal: "Representación legal y facultades de inscripción vigentes en Registros Públicos (SUNARP).",
    capacidadTecnica: {
      personalClave: [],
      equipamientoEstrategico: [],
    },
    experienciaPostor: {
      montoMinimoAcumulado: "S/ 0.00",
      descripcionSimilaridad: "",
      definicionObrasSimilares: "",
      especialidadRequerida: "",
      subEspecialidadRequerida: "",
      numeroMaximoContrataciones: 20,
      periodoAntiguedadAnios: 10,
      documentosSustento: "Contratos y sus respectivas actas de recepción de obra, resoluciones de liquidación de obra o comprobantes de pago cancelados.",
    },
  },
  factoresEvaluacion: [
    { factor: "Precio Ofertado", puntajeMax: 100, criterio: "Evaluación Económica según Bases Estándar OSCE (Anexo 6)" }
  ],
  observacionesRiesgos: [],
  sugerenciasConsultas: [],
};

export const EMPTY_COMPANY: CompanyProfile = {
  razonSocial: "",
  ruc: "",
  registroRNP: "Ejecutor de Obras",
  rnpVigente: true,
  domicilioFiscal: "",
  distrito: "",
  provincia: "",
  departamento: "",
  email: "",
  telefono: "",
  representanteLegal: "",
  dniRepresentante: "",
  partidaRegistralSunarp: "",
  banco: "Banco de Crédito del Perú (BCP)",
  cuentaCorriente: "",
  cuentaCCI: "",
  esConsorcio: false,
  nombreConsorcio: "",
  representanteComunConsorcio: "",
  dniRepresentanteComun: "",
  domicilioComunConsorcio: "",
  emailComunConsorcio: "",
  integrantesConsorcio: [
    {
      id: "member-1",
      razonSocial: "",
      ruc: "",
      porcentajeParticipacion: 60,
      obligaciones: "Ejecución de partidas principales y dirección técnica",
      representante: "",
      dni: "",
      domicilioFiscal: "",
      registroRNP: "Ejecutor de Obras",
      partidaRegistralSunarp: "",
    },
    {
      id: "member-2",
      razonSocial: "",
      ruc: "",
      porcentajeParticipacion: 40,
      obligaciones: "Aporte de equipamiento y control de calidad",
      representante: "",
      dni: "",
      domicilioFiscal: "",
      registroRNP: "Ejecutor de Obras",
      partidaRegistralSunarp: "",
    },
  ],
};

export const DEFAULT_COMPANY: CompanyProfile = EMPTY_COMPANY;
export const SAMPLE_PERSONNEL: KeyPersonnel[] = [];
export const SAMPLE_EQUIPMENT: EquipmentItem[] = [];
export const SAMPLE_EXPERIENCE: ExperienceRecord[] = [];
export const SAMPLE_OBSERVATIONS: ObservationItem[] = [];
export const SAMPLE_TENDERS: TenderInfo[] = [];

// Lista inicial vacía para que el usuario registre sus propias ofertas reales
export const INITIAL_OFFERS_LIST: UserOfferPackage[] = [];
