export interface ObraProyecto {
  id: string;
  cui: string; // Código Único de Inversiones (SNIP / invierte.pe)
  nombre: string;
  entidad: string;
  
  // Documentos Técnicos Preliminares de Origen
  // 1. Instrumento Contractual del Contratista Ejecutor
  tipoDocumentoContratista?: "Contrato de Obra" | "Orden de Servicio (< 8 UIT)" | "Contratación Directa";
  numeroDocumentoContratista?: string; // e.g. "Contrato N° 045-2025-MDR/GAF" o "O.S. N° 00124-2025"
  fechaSuscripcionContratista?: string; // Fecha de firma de contrato o notificación de O.S.
  
  contratista: string;
  rucContratista: string;
  residente: string;
  dniResidente: string;
  cipResidente: string;

  // 2. Instrumento Contractual de la Supervisión / Inspectoría
  tipoDocumentoSupervisor?: "Contrato de Supervisión" | "Orden de Servicio (< 8 UIT)" | "Resolución de Designación de Inspector";
  numeroDocumentoSupervisor?: string; // e.g. "Contrato N° 012-2025-CS" o "O.S. N° 00088-2025" o "R.A. N° 045-2025"
  fechaSuscripcionSupervisor?: string;
  montoSupervision?: number;

  supervisor: string;
  rucSupervisor: string;
  jefeSupervision?: string;
  cipJefeSupervision?: string;

  montoContractual: number;
  plazoDias: number;
  fechaInicio: string;
  fechaFinProgramada: string;
  fechaFinReprogramada?: string;
  adelantoDirectoOtorgado: number; // hasta 10%
  adelantoMaterialesOtorgado: number; // hasta 20%
  sistemaContratacion: "A Suma Alzada" | "A Precios Unitarios" | "Esquema Mixto";
  estado: "En Ejecución" | "Atrasada (>20%)" | "Adelantada" | "Paralizada" | "En Recepción" | "Liquidada";
  ubicacion: string;
  tipologia: "Carreteras y Vías" | "Edificaciones / Escuelas / Hospitales" | "Saneamiento y Agua Potable" | "Defensa Ribereña / Puentes";
  procedimientoInicio?: ProcedimientoInicioObra;
}

export interface CondicionInicioItem {
  id: string;
  codigo: string;
  nombre: string;
  articuloLegal: string; // e.g. "Art. 176.1 literal a) RLCE D.S. 344-2018-EF"
  obligatorio: boolean;
  responsable: "Entidad Contratante" | "Contratista Ejecutor" | "Supervisión / Inspectoría" | "Conjunto";
  cumplido: boolean;
  noCorresponde?: boolean;
  fechaCumplimiento?: string;
  fechaLimiteLegal?: string;
  documentoSustento?: string;
  observaciones?: string;
  estadoAlerta: "CONFORME" | "EN_TRAMITE" | "PENDIENTE_CRITICO" | "VENCIDO" | "NO_APLICA" | "NO_CORRESPONDE";
}

export interface ProcedimientoInicioObra {
  id: string;
  fechaFirmaContrato: string;
  fechaEntregaTerrenoProgramada: string;
  fechaEntregaTerrenoReal?: string;
  tipoEntregaTerreno: "Total" | "Parcial con Cronograma de Disponibilidad";
  actaEntregaTerrenoNumero?: string;
  
  // Designación Supervisor
  supervisorDesignado: boolean;
  documentoDesignacionSupervisor?: string;
  fechaNotificacionSupervisor?: string;
  
  // Expediente Técnico
  expedienteEntregadoCompleto: boolean;
  fechaEntregaExpediente?: string;
  incluyeAbsolucionConsultas: boolean;
  
  // Adelanto Directo
  solicitoAdelantoDirecto: boolean;
  montoAdelantoDirectoSolicitado: number;
  porcentajeAdelantoDirectoSolicitado: number; // hasta 10%
  fechaSolicitudAdelantoDirecto?: string;
  fechaLimiteSolicitudAdelanto?: string; // 8 días hábiles
  fechaPagoAdelantoDirecto?: string;
  fechaLimitePagoEntidad?: string; // 7 días calendario
  entidadEntregoAdelantoDirecto: boolean;
  bancoGarantia?: string;
  numeroCartaFianza?: string;
  
  // Residente & COD
  residenteAcreditado: boolean;
  fechaAcreditacionResidente?: string;
  cuadernoObraDigitalHabilitado: boolean;
  fechaAperturaCOD?: string;
  codigoCOD?: string;
  
  // Calendarios y Planes
  calendarioCVAOPresentado: boolean;
  calendarioCAMPresentado: boolean;
  calendarioEquiposPresentado: boolean;
  planSSTPresentado: boolean;
  fechaAprobacionCalendarios?: string;
  
  // Cómputo Final
  condicionesCompletas: boolean;
  fechaInicioComputada: string;
  fechaFinProgramadaComputada: string;
  estadoInicio: "Inicio de Plazo Vigente" | "En Proceso de Cumplimiento de Condiciones" | "Inicio Suspendido (Art. 176.7)" | "Riesgo de Resolución (Art. 176.8)";
  observacionSuspension?: string;
  
  condicionesDetalladas: CondicionInicioItem[];
}

export interface ValorizacionMensual {
  id: string;
  numero: number;
  mesPeriodo: string; // e.g. "Mes 1 - Enero 2025"
  montoProgramado: number;
  montoEjecutado: number;
  porcentajeProgramadoMes: number;
  porcentajeEjecutadoMes: number;
  porcentajeProgramadoAcumulado: number;
  porcentajeEjecutadoAcumulado: number;
  montoAcumuladoProgramado: number;
  montoAcumuladoEjecutado: number;
  factorKReajuste: number; // Coeficiente K de reajuste fórmula polinómica
  montoReajusteK: number;
  amortizacionAdelantoDirecto: number;
  amortizacionMateriales: number;
  retencionFondoGarantia: number;
  montoNetoAPagar: number;
  estadoPago: "Aprobada y Pagada" | "En Revisión por Supervisión" | "Observada" | "Pendiente Trámite";
  fechaPresentacion: string;
  fechaAprobacionSupervisor?: string;
}

export interface AsientoCuadernoObra {
  id: string;
  numeroAsiento: number;
  fecha: string;
  hora: string;
  autor: "Residente de Obra" | "Supervisor de Obra" | "Inspector de Obra";
  nombreAutor: string;
  cargoAutor: string;
  tipoAsiento:
    | "Diario de Operaciones"
    | "Consulta de Obra"
    | "Respuesta a Consulta"
    | "Causal de Ampliación de Plazo"
    | "Anotación de Adicional de Obra"
    | "Clima y Fenómenos Naturales"
    | "Seguridad y Salud en el Trabajo"
    | "Apertura de Cuaderno"
    | "Término de Obra / Solicitud Recepción";
  titulo: string;
  descripcion: string;
  partidasEjecutadas?: string;
  personalEnCampo?: number;
  maquinariaActiva?: string;
  clima?: "Soleado" | "Lluvias Intensas (Paralización)" | "Nublado / Viento";
  estadoRespuesta?: "Requiere Pronunciamiento" | "Respondido por Supervisión" | "Informativo / Registrado";
  asientoReferencia?: number; // si responde al asiento N° X
}

export interface ModificacionObra {
  id: string;
  codigo: string;
  tipo: "Prestación Adicional" | "Deductivo Vinculado" | "Deductivo Autónomo" | "Ampliación de Plazo" | "Mayor Metrado";
  descripcion: string;
  causalLegal: string; // Art. 197 / 205 RLCE
  montoAdicional: number;
  montoDeductivo: number;
  diasAmpliacion: number;
  porcentajeIncidencia: number; // Incidencia acumulada %
  fechaSolicitud: string;
  fechaAprobacionResolucion?: string;
  numeroResolucion?: string;
  estado: "En Elaboración por Residente" | "Evaluado por Supervisor (Favorable)" | "Aprobado por Entidad (Resolución)" | "En Trámite CGR (>15%)" | "Desestimado";
  sustentoRutaCritica: string;
}

export interface PenalidadMoraCalculo {
  diasAtraso: number;
  montoContratoVigente: number;
  plazoContratoDias: number;
  factorF: number; // 0.15 para plazos > 60 días, 0.40 para <= 60 días
  penalidadDiariaCalculada: number;
  penalidadTotalCalculada: number;
  montoMaximoPenalidad10Pct: number;
  aplicaResolucionContrato: boolean;
}

export interface LiquidacionResumen {
  montoContratoOriginal: number;
  montoAdicionalesAprobados: number;
  montoDeductivosAprobados: number;
  montoTotalContratoFinal: number;
  reajustesTotalesK: number;
  mayoresGastosGenerales: number;
  interesesLegales: number;
  adelantoDirectoTotalOtorgado: number;
  adelantoDirectoTotalAmortizado: number;
  adelantoMaterialesTotalOtorgado: number;
  adelantoMaterialesTotalAmortizado: number;
  penalidadesPorMoraAplicadas: number;
  otrasPenalidades: number;
  totalPagadoACuenta: number;
  saldoFinalAFavorContratista: number;
  estadoLiquidacion: "Borrador de Liquidación" | "Presentada a Supervisión" | "Aprobada con Resolución" | "En Controversia Arbitral";
}

export interface PartidaEjecutada {
  id: string;
  item: string; // e.g. "01.01.01"
  descripcion: string;
  especialidad: "Obras Provisionales" | "Estructuras" | "Arquitectura" | "Instalaciones Sanitarias" | "Instalaciones Eléctricas" | "Equipamiento" | "Mitigación Ambiental";
  unidad: string; // m, m2, m3, kg, und, glb, est
  precioUnitario: number;
  metradoContractual: number;
  montoContractual: number;
  
  // Acumulado Anterior (Meses Anteriores)
  metradoAnterior: number;
  montoAnterior: number;
  porcentajeAnterior: number;

  // Mes Actual
  metradoActual: number;
  montoActual: number;
  porcentajeActual: number;

  // Acumulado Actual (Total a la Fecha)
  metradoAcumulado: number;
  montoAcumulado: number;
  porcentajeAcumulado: number;

  // Saldo por Ejecutar
  metradoSaldo: number;
  montoSaldo: number;
  porcentajeSaldo: number;

  // Alertas / Estado
  estado: "En Ejecución" | "Completada" | "Sobre-ejecutada (Alerta Adicional/Mayor Metrado)" | "No Iniciada";
  observacion?: string;
}

export interface IncongruenciaValorizacion {
  id: string;
  partidaItem?: string;
  seccion: "Planilla de Metrados" | "Carátula Resumen" | "Fórmula Polinómica (Reajuste K)" | "Amortización de Adelantos" | "Firmas y Sellos Colegiados" | "Retenciones y Penalidades";
  descripcion: string;
  valorExcel: string | number;
  valorEscaneado: string | number;
  diferenciaSoles?: number;
  diferenciaMetrado?: number;
  gravedad: "CRÍTICO" | "ADVERTENCIA" | "CONFORME";
  baseLegal: string; // e.g. Art. 194 RLCE
  impacto: string;
  recomendacionTecnica: string;
}

export interface AuditoriaValorizacion {
  id: string;
  numeroValorizacion: number;
  mesPeriodo: string;
  fechaAuditoria: string;
  nombreArchivoExcel: string;
  nombreArchivoEscaneado: string;
  estadoAuditoria: "Observada con Incongruencias Críticas" | "Con Observaciones Subsanables" | "Conforme y Cuadrada";
  totalDiferenciaBrutaSoles: number;
  totalPartidasAuditadas: number;
  partidasConDiscrepancia: number;
  firmasValidadas: {
    residenteObra: boolean;
    supervisorObra: boolean;
    jefeSupervision: boolean;
    colegiaturaVigenteCIP: boolean;
  };
  incongruencias: IncongruenciaValorizacion[];
  resumenEjecutivo: string;
}

export interface UserObraPackage {
  id: string;
  cui: string;
  nombre: string;
  entidad: string;
  contratista: string;
  montoContractual: number;
  estado: ObraProyecto["estado"];
  createdAt: string;
  updatedAt: string;
  obra: ObraProyecto;
  valorizaciones: ValorizacionMensual[];
  asientos: AsientoCuadernoObra[];
  modificaciones: ModificacionObra[];
  liquidacion: LiquidacionResumen;
  partidas?: PartidaEjecutada[];
  auditorias?: AuditoriaValorizacion[];
}

export interface ContractAnalysisResult {
  documentType: "contratista" | "supervisor";
  tipoDocumento: "Contrato de Obra" | "Orden de Servicio (< 8 UIT)" | "Contratación Directa" | "Contrato de Supervisión" | "Resolución de Designación de Inspector";
  esMenor8Uit: boolean;
  confidence: number;
  fileName?: string;
  fileSizeBytes?: number;
  
  // General Inversión
  cui?: string;
  nombreObra?: string;
  entidad?: string;
  ubicacion?: string;
  tipologia?: ObraProyecto["tipologia"];
  sistemaContratacion?: ObraProyecto["sistemaContratacion"];
  
  // Document Contractual Data
  numeroDocumento: string;
  fechaSuscripcion: string;
  monto: number;
  plazoDias: number;
  razonSocial: string;
  ruc: string;
  representanteLegal?: string;
  
  // Key Personnel
  residente?: {
    nombre: string;
    dni: string;
    cip: string;
  };
  supervisor?: {
    nombre: string;
    cip: string;
  };
  
  // Advances
  adelantoDirectoPactado?: number;
  adelantoMaterialesPactado?: number;
  
  // Legal & Clauses
  clausulasClave: {
    penalidadesMora?: string;
    garantiaFielCumplimiento?: string;
    solucionControversias?: string;
    plazoRevisionValorizaciones?: string;
    plazoInformesAdicionales?: string;
    obligacionesPrincipales?: string[];
    normativaCitada?: string;
  };
  
  resumenEjecutivo: string;
  advertencias: string[];
}


