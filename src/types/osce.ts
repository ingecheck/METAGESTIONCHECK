export type TenderType =
  | "Licitación Pública"
  | "Concurso Público"
  | "Adjudicación Simplificada"
  | "Subasta Inversa Electrónica"
  | "Selección de Consultores Individuales"
  | "Comparación de Precios"
  | "Contratación Directa"
  | "Contratación Menor a 9 UIT";

export type ObjectType =
  | "Bienes"
  | "Servicios en General"
  | "Consultoría en General"
  | "Consultoría de Obra"
  | "Ejecución de Obras";

export type ContractingSystem =
  | "Suma Alzada"
  | "Precios Unitarios"
  | "Esquema Mixto"
  | "Tarifas"
  | "Porcentaje";

export interface TenderPersonalClaveRequirement {
  cargo: string;
  profesionRequerida?: string;
  perfil?: string;
  experienciaRequerida?: string;
  experiencia?: string;
  tiempoMesesMinimo?: number;
  documentosAcreditacion?: string;
}

export interface TenderEquipamientoRequirement {
  equipo: string;
  cantidad?: number | string;
  caracteristicas?: string;
  antiguedadMaxima?: string;
  documentosAcreditacion?: string;
}

export interface TenderExperienciaPostorRequirement {
  montoMinimoAcumulado: string;
  descripcionSimilaridad: string;
  definicionObrasSimilares?: string;
  especialidadRequerida?: string;
  subEspecialidadRequerida?: string;
  tipologiaRequerida?: string; // Clasificación según RD N° 0016-2025-EF/54.01
  normativaAplicable?: string; // Ej: Ley N° 32069 / D.S. N° 009-2025-EF / RD N° 0016-2025-EF
  numeroMaximoContrataciones?: number | string; // Máx 20 según directiva OSCE
  periodoAntiguedadAnios?: number | string; // 8 o 10 años
  documentosSustento: string;
}

export interface TenderInfo {
  id: string;
  nomenclatura: string; // Ej: AS-SM-04-2026-MTC/10
  entidadConvocante: string; // Ej: Municipalidad Distrital de San Jerónimo / Gobierno Regional / Ministerio
  nombreProyectoInversion?: string; // Nombre oficial completo del Proyecto de Inversión Pública (PIP) o IOARR
  codigoInversionCUI?: string; // Código Único de Inversiones (CUI) o Código SNIP (ej: 2548912)
  objetoContratacion: ObjectType;
  tipoProcedimiento: TenderType;
  sistemaContratacion: ContractingSystem;
  especialidad?: string; // Ej: "Viales, Puertos y Afines", "Edificaciones y Afines" (RD N° 0016-2025-EF/54.01)
  subEspecialidad?: string; // Ej: "Vías urbanas", "Obras viales", "Edificación educativa"
  tipologia?: string; // Ej: "Pistas, veredas, ciclovías, puentes peatonales...", "Carreteras nacionales..."
  marcoNormativo?: string; // "Ley N° 32069 y D.S. N° 009-2025-EF / RD N° 0016-2025-EF/54.01"
  valorEstimadoReferencial: string; // Ej: S/ 514,737.28
  valorReferencial?: string;
  valorNumerico: number;
  moneda: "PEN" | "USD";
  plazoEjecucion: string; // Ej: 90 días calendario
  plazoDias: number;
  lugarEjecucion: string; // Ubicación geográfica completa (Departamento, Provincia, Distrito, Localidad)
  departamentoEjecucion?: string;
  provinciaEjecucion?: string;
  distritoEjecucion?: string;
  direccionLocalidadEjecucion?: string;
  resumenAlcance: string;
  descripcionObjeto?: string;
  fechaPresentacionOfertas?: string;
  requisitosHabilitacion: string[];
  requisitosCalificacion: {
    capacidadLegal: string;
    capacidadTecnica: {
      personalClave: TenderPersonalClaveRequirement[];
      equipamientoEstrategico: TenderEquipamientoRequirement[];
    };
    experienciaPostor: TenderExperienciaPostorRequirement;
  };
  factoresEvaluacion: Array<{
    factor: string;
    puntajeMax: number;
    criterio: string;
  }>;
  observacionesRiesgos: string[];
  sugerenciasConsultas: string[];
}

export interface ConsorcioMember {
  id: string;
  razonSocial: string;
  ruc: string;
  porcentajeParticipacion: number; // Ej: 95 o 99 (%)
  obligaciones: string; // Obligaciones específicas asumidas
  representante: string; // Representante Legal de la empresa integrante
  dni: string; // DNI del representante legal
  cargoRepresentante?: string; // Ej: "Gerente General"
  domicilioFiscal?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  telefono?: string;
  email?: string;
  registroRNP?: string;
  partidaRegistralSunarp?: string;
  asientoRegistral?: string;
  sedeRegistral?: string; // Ej: "Oficina Registral de Moyobamba"
  esMype?: boolean;
  registroRemype?: string; // Ej: "0001258193-2013"
  esOperadorTributario?: boolean;
  cuentaCCI?: string;
}

export interface CompanyProfile {
  esConsorcio: boolean;
  nombreConsorcio?: string; // Ej: "CONSORCIO CARHUAZ"
  razonSocial: string; // Nombre de la empresa o denominación del Consorcio
  ruc: string; // RUC de la empresa o RUC principal/líder
  rnpVigente: boolean;
  registroRNP: string;
  representanteLegal: string; // Representante legal o común
  dniRepresentante: string;
  domicilioFiscal: string; // Domicilio fiscal o común
  departamento: string;
  provincia: string;
  distrito: string;
  telefono: string;
  email: string;
  banco: string;
  numeroCuenta?: string;
  cuentaCorriente?: string;
  cuentaCCI: string;
  partidaRegistralSunarp: string;
  asientoRegistral?: string;
  sedeRegistral?: string;
  // Consortium specific fields
  integrantesConsorcio?: ConsorcioMember[];
  representanteComunConsorcio?: string; // Nombre del Representante Común
  dniRepresentanteComun?: string; // DNI del Representante Común
  representanteAlternoConsorcio?: string; // Nombre del Representante Legal Alterno
  dniRepresentanteAlterno?: string; // DNI del Representante Legal Alterno
  domicilioComunConsorcio?: string; // Domicilio Común del Consorcio
  emailComunConsorcio?: string; // Correo Común del Consorcio
  operadorTributario?: string; // Empresa designada como operador tributario
  cuentaBancariaConsorcio?: string;
  ciudadFirmaContrato?: string; // Ej: "Rioja" / "Huaraz" / "Lima"
  fechaFirmaContrato?: string; // Ej: "24 de julio del 2026"
  centroArbitraje?: string; // Ej: "Centro de Arbitraje de la Pontificia Universidad Católica del Perú"
}

export interface KeyPersonnel {
  id: string;
  nombreCompleto: string;
  dni: string;
  profesion: string;
  cipOCol: string; // N° de Colegiatura
  cargoPostulado: string;
  tiempoExperienciaMeses: number;
  descripcionExperiencia: string;
  documentosAcreditacion: string; // Título, Constancias, Contratos
  cumpleRequisito: boolean;
}

export interface EquipmentItem {
  id: string;
  denominacion: string;
  marcaModelo: string;
  anioFabricacion: string;
  capacidad: string;
  estadoDisponibilidad: "Propio" | "Alquilado" | "Compromiso de Compra/Alquiler";
  sustento: string; // Factura, Tarjeta de Propiedad, Carta de Compromiso
}

export interface ExperienceRecord {
  id: string;
  cliente: string; // Nombre de Entidad pública o empresa privada
  tipoCliente: "Público" | "Privado";
  objetoContrato: string;
  nroDocumento: string; // N° Contrato / Orden de Servicio / Factura
  fechaEmision: string;
  fechaConformidad: string;
  moneda: "PEN" | "USD";
  montoOriginal: number;
  tipoCambioSBS?: number;
  montoEnSoles: number;
  tipoComprobante: "Contrato + Conformidad" | "Orden de Servicio/Compra + Conformidad" | "Comprobante de Pago Cancelado";
  validoOSCE: boolean; // Antigüedad <= 8 años para servicios o 10 años para obras
  especialidad?: string; // Ej: "Viales, Puertos y Afines", "Edificaciones y Afines" (RD N° 0016-2025-EF/54.01)
  subEspecialidad?: string; // Ej: "Vías urbanas", "Obras viales"
  tipologia?: string; // Ej: "Pistas, veredas, ciclovías..."
  esSimilar?: boolean; // Cumple con los criterios de Obra/Servicio Similar de las Bases
  porcentajeSimilaridad?: number; // Grado de coincidencia técnica (0 a 100%)
  justificacionSimilaridad?: string; // Sustento técnico de por qué califica como similar
}

export interface AnnexDocument {
  id: string;
  numero: string; // "Anexo N° 1", "Anexo N° 2", etc.
  titulo: string;
  categoria: "SOBRE TÉCNICO - ADMISIÓN" | "SOBRE TÉCNICO - HABILITACIÓN" | "SOBRE TÉCNICO - CALIFICACIÓN" | "SOBRE TÉCNICO - EVALUACIÓN" | "SOBRE ECONÓMICO" | "CONSULTAS Y OBSERVACIONES";
  obligatorio: boolean;
  completado: boolean;
  descripcion: string;
  contenidoPersonalizado?: string;
}

export interface ObservationItem {
  id: string;
  numero?: number;
  numeralBases?: string;
  seccionBases?: string;
  tipo: "Observación" | "Consulta" | "OBSERVACIÓN" | "CONSULTA";
  consultaObservacion?: string;
  fundamento?: string;
  sustentoLegalTecnico?: string;
  vulneracionNormativa?: string;
  propuestaSolucion?: string;
  peticionConcreta?: string;
}

export interface ClippedPdfSnippet {
  id: string;
  title: string;
  category: "experiencia" | "personal" | "equipos" | "habilitacion" | "economica" | "otros";
  sourceFileName: string;
  selectedPages: string; // Ej: "1-3, 5"
  pageCount: number;
  pdfBase64: string; // Base64 of the standalone sliced PDF
  createdAt: number;
  notes?: string;
  isIncluded?: boolean;
}

export interface AuditReport {
  estadoGeneral: "APTO" | "RIESGO_MEDIO" | "NO_ADMISIBLE";
  puntajeEstimado: number;
  hallazgosCriticos: string[];
  advertenciasSubsanables: string[];
  recomendacionesFinales: string[];
  estadoAdmisibilidad?: "ADMISIBLE" | "CON_OBSERVACIONES_SUBSANABLES" | "NO_ADMISIBLE";
  puntajeTecnicoEstimado?: number;
  cumpleRequisitosAdmision?: boolean;
  cumpleRequisitosHabilitacion?: boolean;
  cumpleRequisitosCalificacion?: boolean;
  inconsistenciasDetectadas?: string[];
  alertasSubsanables?: string[];
  recomendacionesPreviasPresentacion?: string[];
  resumenEjecutivo?: string;
}

export interface UserOfferPackage {
  id: string;
  nomenclatura: string;
  nombreProyecto: string;
  entidad: string;
  cui?: string;
  objetoContratacion: ObjectType;
  valorEstimadoReferencial: string;
  valorNumerico: number;
  plazoEjecucion: string;
  estadoOferta: "En Formulación" | "Lista para Presentar" | "Observada / En Subsanación" | "Adjudicada" | "No Presentada";
  createdAt: string;
  updatedAt: string;
  tender: TenderInfo;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  observations: ObservationItem[];
  montoOfertado: number;
  incluyeIGV: boolean;
}

