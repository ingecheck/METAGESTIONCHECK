export interface ObraProyecto {
  id: string;
  cui: string; // Código Único de Inversiones (SNIP / invierte.pe)
  nombre: string;
  entidad: string;
  contratista: string;
  rucContratista: string;
  supervisor: string;
  rucSupervisor: string;
  residente: string;
  dniResidente: string;
  cipResidente: string;
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


