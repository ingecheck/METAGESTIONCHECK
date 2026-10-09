export type EstadoCartera =
  | "ACTOS_PREPARATORIOS"
  | "EN_SELECCION_SEACE"
  | "PENDIENTE_INICIO_CONDICIONES"
  | "EN_EJECUCION"
  | "RECEPCIONADA"
  | "FINALIZADA_LIQUIDADA";

export interface HitoNormativo {
  id: string;
  fase: "ACTOS_PREPARATORIOS" | "CONDICIONES_INICIO" | "EJECUCION" | "RECEPCION_LIQUIDACION";
  codigo: string;
  nombre: string;
  baseLegal: string;
  cumplido: boolean;
  fecha?: string; // Fecha de emisión / asignada del documento
  documentoSustento?: string;
  observacion?: string;
  // Campos dinámicos integrados
  tipo?: "normativo" | "valorizacion" | "expediente" | "ampliacion_plazo";
  monto?: number;
  diasAmpliacion?: number;
  numeroRelacionado?: number;
  // Soporte de documento adjunto probatorio
  adjuntoNombre?: string;
  adjuntoUrl?: string;
  adjuntoTipo?: string;
  adjuntoTamano?: string;
}

export interface ExpedienteAdicional {
  id: string;
  numero: number;
  tipo: "ADICIONAL" | "DEDUCTIVO" | "MAYOR_METRADO";
  descripcion: string;
  monto: number;
  resolucionAprobacion: string;
  fechaEmision: string;
  estado: "APROBADO" | "EN_TRAMITE" | "OBSERVADO";
  plazoAdicionalDias?: number;
}

export interface AmpliacionPlazo {
  id: string;
  numero: number;
  dias: number;
  resolucion: string;
  fechaEmision: string;
  motivo: string;
  estado: "APROBADA" | "EN_TRAMITE" | "DENEGADA";
}

export interface ProyectoCartera {
  id: number;
  encargado: string; // "ING. RESIDENTE" | "SUPERVISOR" | "OEI" | "-"
  proyecto: string; // Nombre del proyecto o vía
  cui: string; // Código Único de Inversiones
  
  // Contrato de Ejecución (opcional para obras en fase previa o selección)
  contratoEjecucionNumero?: string;
  contratoEjecucionFechaFirma?: string;
  contratoEjecucionMonto?: number;
  contratoEjecucionEmpresa?: string;
  residenteNombre?: string;
  residenteCip?: string;

  // Contrato / Orden de Supervisión
  contratoSupervisionNumero?: string; // Contrato N° o OS N°
  contratoSupervisionFechaFirma?: string;
  contratoSupervisionMonto?: number;
  contratoSupervisionEmpresa?: string;
  supervisorNombre?: string;
  supervisorCip?: string;

  // Hitos de Plazo y Terreno
  entregaTerrenoFecha?: string;
  inicioObraFecha?: string;
  suspensionFecha?: string;
  reinicioFecha?: string;
  plazoDias?: number;
  fechaTerminoActualizado?: string;
  adjuntosEventos?: Record<
    string,
    {
      nombre: string;
      fecha?: string;
      tipoDocumento?: string; // "Acta", "Resolución", "Informe", "Carta"
      tamano?: string;
      base64?: string;
    }
  >;
  
  // Observaciones y Estado
  observaciones: string;
  estado: EstadoCartera;

  // Checklist de Hitos Normativos Interactivos (1-click)
  hitos: HitoNormativo[];

  // Valorizaciones y Control de Avance de Obra Físico/Financiero
  valorizaciones?: ValorizacionObra[];

  // Expedientes y Ampliaciones de Plazo integrados
  expedientes?: ExpedienteAdicional[];
  ampliacionesPlazo?: AmpliacionPlazo[];
}

export interface PartidaValorizacion {
  id: string;
  item: string; // ej. "01.01"
  descripcion: string;
  unidad: string; // "m2", "m3", "glb", "und", "kg"
  metradoContratado: number;
  precioUnitario: number;
  metradoAnterior: number;
  metradoActual: number;
  montoParcial: number; // metradoActual * precioUnitario
  metradoAcumulado: number; // metradoAnterior + metradoActual
  montoAcumulado: number; // metradoAcumulado * precioUnitario
  porcentajeAvance: number; // (metradoAcumulado / metradoContratado) * 100
  saldoMetrado?: number; // Metrado restante por ejecutar
  saldoMonto?: number; // Monto restante por ejecutar
  alertaExceso?: boolean; // Alerta si supera el saldo contratado
}

export interface ValorizacionObra {
  id: string;
  numero: number; // 1, 2, 3...
  periodo: string; // ej. "Setiembre 2026"
  fechaValorizacion: string; // "30/09/2026"
  fechaAprobacionSupervisor?: string;
  montoProgramadoMes: number;
  montoEjecutadoMes: number;
  porcentajeProgramadoMes: number;
  porcentajeEjecutadoMes: number;
  montoProgramadoAcumulado: number;
  montoEjecutadoAcumulado: number;
  porcentajeProgramadoAcumulado: number;
  porcentajeEjecutadoAcumulado: number;
  estado: "APROBADA" | "EN_TRAMITE" | "OBSERVADA";
  documentoAprobacion?: string; // Documento de la entidad / supervisión con que se aprobó
  esAtrasada?: boolean; // Alerta Art. 198 RLCE (< 80% de lo programado)
  observacionesSupervisor?: string;
  partidas?: PartidaValorizacion[];
}

export const HITOS_NORMATIVOS_BASE: Omit<HitoNormativo, "cumplido">[] = [
  // FASE 1: ACTOS PREPARATORIOS & SELECCIÓN
  {
    id: "hito-tdr",
    fase: "ACTOS_PREPARATORIOS",
    codigo: "ACT-01",
    nombre: "TDR y Especificaciones Técnicas Aprobadas",
    baseLegal: "Art. 29 Ley N° 30225 / Art. 16 RLCE",
  },
  {
    id: "hito-bases",
    fase: "ACTOS_PREPARATORIOS",
    codigo: "ACT-02",
    nombre: "Elaboración e Integración de Bases SEACE",
    baseLegal: "Art. 47 RLCE",
  },
  {
    id: "hito-contrato-obra",
    fase: "ACTOS_PREPARATORIOS",
    codigo: "ACT-03",
    nombre: "Perfeccionamiento de Contrato de Ejecución",
    baseLegal: "Art. 136 y 141 RLCE",
  },
  {
    id: "hito-contrato-sup",
    fase: "ACTOS_PREPARATORIOS",
    codigo: "ACT-04",
    nombre: "Perfeccionamiento de Contrato / O.S. de Supervisión",
    baseLegal: "Art. 186 RLCE",
  },

  // FASE 2: CONDICIONES PREVIAS PARA INICIO DE OBRA (Art. 176 RLCE - Orden Normativo Requerido)
  {
    id: "hito-notif-sup",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.a",
    nombre: "Comunicación al Residente de Designación de Supervisor",
    baseLegal: "Art. 176.1.a RLCE (Obligatoria previa a la apertura de obra)",
  },
  {
    id: "hito-cod",
    fase: "CONDICIONES_INICIO",
    codigo: "DIR-OSCE-COD",
    nombre: "Apertura de Cuaderno de Obra / Apertura de Obra",
    baseLegal: "Directiva N° 009-2020-OSCE/CD / Art. 191 RLCE",
  },
  {
    id: "hito-terreno",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.b",
    nombre: "Entrega Total de Terreno (o entrega parcial con cronograma)",
    baseLegal: "Art. 176.1.b RLCE (Posterior a la apertura de obra)",
  },
  {
    id: "hito-acta-inicio",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1-2",
    nombre: "Suscripción de Acta de Inicio de Obra y Cómputo de Plazo",
    baseLegal: "Art. 176.1 y 176.2 RLCE (Día siguiente de cumplidas condiciones)",
  },
  {
    id: "hito-expediente",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.c",
    nombre: "Entrega del Expediente Técnico Completo",
    baseLegal: "Art. 176.1.c RLCE",
  },

  // FASE 3: EJECUCIÓN & VALORIZACIONES
  {
    id: "hito-informe-compatibilidad",
    fase: "EJECUCION",
    codigo: "ART-177",
    nombre: "Informe de Compatibilidad y Revisión E.T. (15/30 días)",
    baseLegal: "Art. 177 RLCE",
  },
  {
    id: "hito-valo-01",
    fase: "EJECUCION",
    codigo: "VALO-01",
    nombre: "Aprobación y Trámite de Valorización N° 01",
    baseLegal: "Art. 194 RLCE",
  },

  // FASE 4: RECEPCIÓN Y LIQUIDACIÓN
  {
    id: "hito-recepcion",
    fase: "RECEPCION_LIQUIDACION",
    codigo: "ART-208",
    nombre: "Acta de Recepción de Obra Sin Observaciones",
    baseLegal: "Art. 208 RLCE",
  },
  {
    id: "hito-liquidacion",
    fase: "RECEPCION_LIQUIDACION",
    codigo: "ART-209",
    nombre: "Liquidación Técnica - Financiera Consentida",
    baseLegal: "Art. 209 RLCE",
  },
];

// Helper to create hitos with default values and optional completion dates
export function createDefaultHitos(
  overrides: Partial<Record<string, boolean | { cumplido: boolean; fecha?: string }>> = {}
): HitoNormativo[] {
  return HITOS_NORMATIVOS_BASE.map((h) => {
    const val = overrides[h.id];
    let cumplido = false;
    let fecha: string | undefined = undefined;
    if (typeof val === "boolean") {
      cumplido = val;
    } else if (val && typeof val === "object") {
      cumplido = val.cumplido;
      fecha = val.fecha;
    }
    return {
      ...h,
      cumplido,
      fecha,
    };
  });
}

// Official Projects Database according to the Municipalidad Provincial de Rioja matrix
export const PROYECTOS_RIOJA_SEED: ProyectoCartera[] = [
  {
    id: 1,
    encargado: "JHON",
    proyecto: "MEJORAMIENTO DEL SERVICIO DE MOVILIDAD URBANA EN VIAS LOCALES DEL JR. ARICA CUADRAS 05 AL 11, JR. LUIS LINARES, JR. DOS DE MAYO Y PASAJES - RIOJA",
    cui: "2619826",
    contratoEjecucionNumero: "CONTRATO N°023-2025-GAF/MPR",
    contratoEjecucionFechaFirma: "16/12/2025",
    contratoEjecucionMonto: 208232.57,
    contratoEjecucionEmpresa: "CONSORCIO BASCA",
    residenteNombre: "Ing. Rene Sánchez Yajahuanca (CIP 160246)",
    residenteCip: "CIP 160246",
    contratoSupervisionNumero: "CONTRATO N°045-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "05/05/2026",
    contratoSupervisionMonto: 18000.00,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR RIOJA",
    supervisorNombre: "Ing. Roy Alegría Inga (CIP 277575)",
    supervisorCip: "CIP 277575",
    entregaTerrenoFecha: "19/06/2026",
    inicioObraFecha: "19/06/2026",
    plazoDias: 45,
    fechaTerminoActualizado: "02/08/2026",
    observaciones: "Obra concluida al 100% con recepción y liquidación técnica en proceso.",
    estado: "FINALIZADA_LIQUIDADA",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
      "hito-recepcion": true,
      "hito-liquidacion": true,
    }),
    valorizaciones: [
      {
        id: "val-arica-01",
        numero: 1,
        periodo: "Valorización Única / Final",
        fechaValorizacion: "02/08/2026",
        fechaAprobacionSupervisor: "10/08/2026",
        montoProgramadoMes: 208232.57,
        montoEjecutadoMes: 208232.57,
        porcentajeProgramadoMes: 100,
        porcentajeEjecutadoMes: 100,
        montoProgramadoAcumulado: 208232.57,
        montoEjecutadoAcumulado: 208232.57,
        porcentajeProgramadoAcumulado: 100,
        porcentajeEjecutadoAcumulado: 100,
        estado: "APROBADA",
        esAtrasada: false,
        observacionesSupervisor: "Obra culminada al 100% conforme a especificaciones técnicas.",
      },
    ],
  },
  {
    id: 2,
    encargado: "JENNIFER",
    proyecto: "INSTALACIÓN DEL SERVICIO DE MATADERO MUNICIPAL EN LA CIUDAD DE RIOJA, PROVINCIA DE RIOJA - SAN MARTIN - I ETAPA",
    cui: "2235100",
    contratoEjecucionNumero: "CONTRATO N°049-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "16/06/2026",
    contratoEjecucionMonto: 1483475.40,
    contratoEjecucionEmpresa: "CONSORCIO MATADERO",
    residenteNombre: "Ing. Miguel Eusebio Ramos Martínez (CIP 19363)",
    residenteCip: "CIP 19363",
    contratoSupervisionNumero: "CONTRATO N° 050-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "14/07/2026",
    contratoSupervisionMonto: 108018.63,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR MAHUYACU",
    supervisorNombre: "Ing. Antony Paul Castillo Nuñera (CIP 245892)",
    supervisorCip: "CIP 245892",
    entregaTerrenoFecha: "15/07/2026",
    inicioObraFecha: "16/07/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "17/10/2026",
    observaciones: "Retraso por precipitaciones pluviales. Ampliación de plazo N° 01 de 4 días acumulada (Total 94 días).",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
    }),
    valorizaciones: [
      {
        id: "val-mat-01",
        numero: 1,
        periodo: "Valorización Acumulada",
        fechaValorizacion: "30/09/2026",
        fechaAprobacionSupervisor: "05/10/2026",
        montoProgramadoMes: 655000.0,
        montoEjecutadoMes: 609917.54,
        porcentajeProgramadoMes: 44.2,
        porcentajeEjecutadoMes: 41.1,
        montoProgramadoAcumulado: 655000.0,
        montoEjecutadoAcumulado: 609917.54,
        porcentajeProgramadoAcumulado: 44.2,
        porcentajeEjecutadoAcumulado: 41.1,
        estado: "APROBADA",
        esAtrasada: false,
        observacionesSupervisor: "Avance financiero pagado: S/. 609,917.54 con amortizaciones de adelanto directo y materiales.",
      },
    ],
  },
  {
    id: 3,
    encargado: "JHON",
    proyecto: "MEJORAMIENTO Y PAVIMENTACIÓN DE PISTAS Y VEREDAS EN EL JR. JERUSALÉN",
    cui: "2707147",
    contratoEjecucionNumero: "CONTRATO N°051-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "15/07/2026",
    contratoEjecucionMonto: 1238716.73,
    contratoEjecucionEmpresa: "CONSORCIO JERUSALEN",
    residenteNombre: "Ing. Raúl Cabrera Neyra (CIP 137001)",
    residenteCip: "CIP 137001",
    contratoSupervisionNumero: "CONTRATO N°054-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "05/08/2026",
    contratoSupervisionMonto: 91950.00,
    contratoSupervisionEmpresa: "DIAZ HUAMAN JULIO",
    supervisorNombre: "Ing. Mónica Arévalo Díaz (CIP 142998)",
    supervisorCip: "CIP 142998",
    entregaTerrenoFecha: "10/08/2026",
    inicioObraFecha: "13/08/2026",
    plazoDias: 75,
    fechaTerminoActualizado: "27/10/2026",
    observaciones: "En ejecución física normal de pavimentación y veredas peatonales.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
    }),
  },
  {
    id: 4,
    encargado: "JENNIFER",
    proyecto: "MEJORAMIENTO VIAL URBANO DEL JR. TEOBALDO LÓPEZ CDRA 09 AL 12, JR. BOLOGNESI, JR. ATAHUALPA, JR. COLÓN, JR. GRAU Y PASAJE TÚPAC AMARU - RIOJA",
    cui: "2507075",
    contratoEjecucionNumero: "CONTRATO N°052-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "16/07/2026",
    contratoEjecucionMonto: 7416900.00,
    contratoEjecucionEmpresa: "CONSORCIO ALTO MAYO",
    residenteNombre: "Ing. Carlos Andrés Beteta Bartra (CIP 121913) / Ing. Anselmo Rojas Cieza (CIP 147722)",
    residenteCip: "CIP 147722",
    contratoSupervisionNumero: "CONTRATO N°055-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "07/08/2026",
    contratoSupervisionMonto: 393485.69,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR RIOJA",
    supervisorNombre: "Ing. Marco Antonio Burgos Quiñones (CIP 41645) / Arq. Karla Mejía Arana (CAP 18452)",
    supervisorCip: "CIP 41645",
    entregaTerrenoFecha: "12/08/2026",
    inicioObraFecha: "19/08/2026",
    plazoDias: 240,
    fechaTerminoActualizado: "15/04/2027",
    observaciones: "Proyecto integral de transitabilidad en ejecución normal (Programado: 1.06%, Ejecutado: 1.02%).",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
    }),
  },
  {
    id: 5,
    encargado: "JENNIFER",
    proyecto: "IOARR: REPARACIÓN DE AULA DE EDUCACIÓN INICIAL Y AULA DE PSICOMOTRICIDAD EN LA I.E. 205 ROSARIO DEL ÁGUILA DE ROJAS - RIOJA",
    cui: "2689751",
    contratoEjecucionNumero: "CONTRATO N°062-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "10/08/2026",
    contratoEjecucionMonto: 651324.96,
    contratoEjecucionEmpresa: "CONSORCIO EDUCATIVO MAVIC",
    contratoSupervisionNumero: "O.S N°0001341",
    contratoSupervisionFechaFirma: "12/08/2026",
    contratoSupervisionMonto: 43800.00,
    contratoSupervisionEmpresa: "W & E CONSULTORES Y EJECUTORES S.A.C.",
    entregaTerrenoFecha: "17/08/2026",
    inicioObraFecha: "18/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "15/11/2026",
    observaciones: "Sin observaciones. Avance adelantado según cronograma (Ejecutado: 23.3% vs Programado: 10.4%).",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
    }),
  },
  {
    id: 6,
    encargado: "JENNIFER",
    proyecto: "IOARR: REPARACIÓN DE AULA DE EDUCACIÓN PRIMARIA EN LA I.E. 00813 JUAN GRIMALDO CAHUAZA MALAPI - RIOJA",
    cui: "2689748",
    contratoEjecucionNumero: "CONTRATO N°063-2026-GAF/MPR",
    contratoEjecucionMonto: 485000.00,
    contratoEjecucionEmpresa: "CONSORCIO EDUCATIVO SAN MARTÍN",
    contratoSupervisionNumero: "O.S N°0001342",
    contratoSupervisionMonto: 38500.00,
    contratoSupervisionEmpresa: "W & E CONSULTORES Y EJECUTORES S.A.C.",
    inicioObraFecha: "18/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "15/11/2026",
    observaciones: "Pendiente aprobación de adicional de equipamiento.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
    }),
  },
  {
    id: 7,
    encargado: "JENNIFER",
    proyecto: "IOARR: REPARACIÓN DE SERVICIOS HIGIÉNICOS Y AMBIENTES EN LA I.E. 00813 JUAN GRIMALDO CAHUAZA MALAPI - RIOJA",
    cui: "2689749",
    inicioObraFecha: "18/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "15/11/2026",
    observaciones: "Recepción de obra realizada; liquidación en proceso.",
    estado: "RECEPCIONADA",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-recepcion": true,
    }),
  },
  {
    id: 8,
    encargado: "JENNIFER",
    proyecto: "IOARR: REPARACIÓN Y REFACCIÓN DE INFRAESTRUCTURA EDUCATIVA Y COMUNITARIA EN EL DISTRITO DE RIOJA",
    cui: "2689750",
    inicioObraFecha: "18/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "15/11/2026",
    observaciones: "Plazo vencido; contratista presentó cronograma de recuperación.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
    }),
  },
  {
    id: 9,
    encargado: "JEZER",
    proyecto: "RENOVACIÓN DE PUENTE Y PUENTE EN EL CAMINO VECINAL R2208133: EMP. SM-609 - PTA. CARRETERA (PUENTE BAJO AEROPUERTO Y PUENTE BOMBONAJE) - RIOJA",
    cui: "2677502",
    contratoEjecucionNumero: "CONTRATO N°056-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "15/08/2026",
    contratoEjecucionMonto: 3007567.79,
    contratoEjecucionEmpresa: "CONSORCIO V & F",
    contratoSupervisionNumero: "CONTRATO N°058-2026-GAF/MPR",
    contratoSupervisionMonto: 145000.00,
    contratoSupervisionEmpresa: "SUPERVISIÓN VIAL NORORIENTE",
    entregaTerrenoFecha: "19/08/2026",
    inicioObraFecha: "20/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "17/11/2026",
    observaciones: "En ejecución de obras de arte, concreto armado y estribos de apoyo.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
    }),
  },
  {
    id: 10,
    encargado: "JEZER",
    proyecto: "RENOVACIÓN DE PUENTE EN EL CAMINO VECINAL SM-611: EMP. SM-609 (RIOJA) - EL TRIUNFO - LA PERLA DE CASCAYUNGA - RIOJA",
    cui: "2677531",
    contratoEjecucionNumero: "CONTRATO N°059-2026-GAF/MPR",
    contratoEjecucionMonto: 1850000.00,
    contratoEjecucionEmpresa: "CONSORCIO PUENTES DEL NORTE",
    inicioObraFecha: "20/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "17/11/2026",
    observaciones: "En proceso de renovación de infraestructura vial.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-notif-sup": true,
      "hito-terreno": true,
      "hito-acta-inicio": true,
    }),
  },
  {
    id: 11,
    encargado: "JEZER",
    proyecto: "RENOVACIÓN DE PUENTE EN EL CAMINO VECINAL R2208139: EMP. SM-612 (MASHUYACU) - PARAÍSO DE LAS MINAS - RIOJA",
    cui: "2677528",
    contratoEjecucionNumero: "CONTRATO N°060-2026-GAF/MPR",
    contratoEjecucionMonto: 1920000.00,
    contratoEjecucionEmpresa: "CONSORCIO VIAL MASHUYACU",
    inicioObraFecha: "20/08/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "17/11/2026",
    observaciones: "En proceso de renovación y colocación de estribos.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-notif-sup": true,
      "hito-terreno": true,
      "hito-acta-inicio": true,
    }),
  },
  {
    id: 12,
    encargado: "JEZER",
    proyecto: "CONSTRUCCIÓN DE PUESTO DE AUXILIO RÁPIDO / SALUD SAN FRANCISCO",
    cui: "2655193",
    contratoEjecucionNumero: "CONTRATO N°053-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "03/08/2026",
    contratoEjecucionMonto: 474254.25,
    contratoEjecucionEmpresa: "CONSORCIO RAYMONDI",
    residenteNombre: "Ing. Pablo Henry Mayaute Huamani (CIP 52916)",
    residenteCip: "CIP 52916",
    contratoSupervisionNumero: "OS N°0001324",
    contratoSupervisionFechaFirma: "12/08/2026",
    contratoSupervisionMonto: 35500.00,
    contratoSupervisionEmpresa: "Z & Z CENTER FISH S.A.C.",
    supervisorNombre: "Ing. Segundo German Rios Vasquez (CIP 74049)",
    supervisorCip: "CIP 74049",
    observaciones: "Falta pasar su ampliación de plazo. Expediente técnico compatibilizado.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
    }),
  },
  {
    id: 13,
    encargado: "JEZER",
    proyecto: "COBERTURA SAGRADO CORAZÓN DE JESÚS - RIOJA",
    cui: "2684433",
    contratoEjecucionNumero: "CONTRATO N°057-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "25/08/2026",
    contratoEjecucionMonto: 379176.27,
    contratoEjecucionEmpresa: "CONSORCIO EJECUTOR RIOJA",
    contratoSupervisionNumero: "OS N°0001401",
    contratoSupervisionFechaFirma: "18/08/2026",
    contratoSupervisionMonto: 28800.00,
    contratoSupervisionEmpresa: "GENESIS CAMILA CONTRATISTA GENERALES S.A.C.",
    supervisorNombre: "Ing. Rodin Heriberto Mas Camus (CIP 72597)",
    supervisorCip: "CIP 72597",
    observaciones: "Para acta de entrega de terreno y acta de inicio de obra.",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-sup": true,
      "hito-contrato-obra": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
    }),
  },
  {
    id: 14,
    encargado: "JENNIFER",
    proyecto: "IOARR: CONSTRUCCIÓN DE CERCO PERIMÉTRICO EN LA I.E. 450 LOCALIDAD DE VISTA ALEGRE, DISTRITO DE NUEVA CAJAMARCA - RIOJA",
    cui: "2695908",
    contratoEjecucionNumero: "CONTRATO N°048-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "10/06/2026",
    contratoEjecucionMonto: 208232.57,
    contratoEjecucionEmpresa: "U & S CONSULTORES Y CONTRATISTAS GENERALES S.A.C. (RUC 20600194861)",
    residenteNombre: "Ing. Liz Arleth Angulo Gatica (CIP 76900)",
    residenteCip: "CIP 76900",
    contratoSupervisionNumero: "O.S. N° 0000985",
    contratoSupervisionFechaFirma: "18/06/2026",
    contratoSupervisionMonto: 18000.00,
    contratoSupervisionEmpresa: "JR. INMOBILIARIA INGENIERIA & CONSTRUCCIONES S.A.C.",
    supervisorNombre: "Ing. Nilton Cesar Mayta Vargas (CIP 75929)",
    supervisorCip: "CIP 75929",
    entregaTerrenoFecha: "18/06/2026",
    inicioObraFecha: "19/06/2026",
    plazoDias: 45,
    fechaTerminoActualizado: "02/08/2026",
    observaciones: "Obra culminada al 100%. Pagado S/. 208,232.57. Personal cesado por culminación satisfactoria.",
    estado: "FINALIZADA_LIQUIDADA",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
      "hito-recepcion": true,
      "hito-liquidacion": true,
    }),
  },
  {
    id: 15,
    encargado: "-",
    proyecto: "MEJORAMIENTO Y AMPLIACIÓN DE SERVICIOS DE AGUA POTABLE Y SANEAMIENTO EN SECTORES RURALES DE RIOJA",
    cui: "2643890",
    contratoEjecucionMonto: 2340000.00,
    contratoSupervisionMonto: 98000.00,
    inicioObraFecha: "02/11/2026",
    plazoDias: 180,
    fechaTerminoActualizado: "30/04/2027",
    observaciones: "Entrega de terreno programada para el 02/11/2026. Por iniciar.",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
    }),
  },
  {
    id: 16,
    encargado: "-",
    proyecto: "MEJORAMIENTO INTEGRAL DEL TRÁNSITO VEHICULAR Y PEATONAL DEL SECTOR ORIENTE DE LA CIUDAD DE RIOJA",
    cui: "2611450",
    contratoEjecucionMonto: 8760400.00,
    contratoSupervisionMonto: 389000.00,
    inicioObraFecha: "06/07/2026",
    plazoDias: 200,
    fechaTerminoActualizado: "21/01/2027",
    observaciones: "En ejecución física normal (Avance: 35.0% vs Programado: 38.0%). Valorizado acumulado: S/. 2,890,000.00.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-terreno": true,
      "hito-acta-inicio": true,
      "hito-valo-01": true,
    }),
  },
  {
    id: 17,
    encargado: "JHON",
    proyecto: "COBERTURA-SAN AGUSTIN",
    cui: "2722218",
    contratoEjecucionNumero: "CONTRATO N° 065-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "18/09/2026",
    contratoEjecucionMonto: 439921.73,
    contratoEjecucionEmpresa: "ROIS OBRAS CIVILES S.A.C.",
    contratoSupervisionNumero: "04/09/2026",
    contratoSupervisionFechaFirma: "04/09/2026",
    contratoSupervisionMonto: 35500.00,
    contratoSupervisionEmpresa: "ERFRA INGENIERIA S.A.C.",
    supervisorNombre: "Ing. Pedro Bobadilla Guadalupe (CIP 217784)",
    supervisorCip: "CIP 217784",
    observaciones: "Se solicitó apertura de obra. Cuaderno digital comunicado.",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-sup": true,
      "hito-contrato-obra": true,
      "hito-notif-sup": true,
      "hito-cod": true,
    }),
  },
  {
    id: 18,
    encargado: "JHON",
    proyecto: "COBERTURA-MANUEL GONZALES PRADA",
    cui: "2724099",
    contratoEjecucionNumero: "PUBLICADO 31/07",
    contratoEjecucionFechaFirma: "18/09/2026",
    contratoEjecucionMonto: 451021.43,
    contratoEjecucionEmpresa: "CONSORCIO NARANJOS MGP",
    contratoSupervisionNumero: "21/09/2026",
    contratoSupervisionFechaFirma: "21/09/2026",
    contratoSupervisionMonto: 29971.56,
    contratoSupervisionEmpresa: "CONSULTORA Y CONSTRUCTORA DELTA EIRL",
    supervisorNombre: "Ing. Elvis German Toro (CIP 215636)",
    supervisorCip: "CIP 215636",
    observaciones: "Se solicitó por correo pronunciamiento sobre personal clave de obra.",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
    }),
  },
  {
    id: 19,
    encargado: "JHON",
    proyecto: "COBERTURA-BARRIOS ALTOS",
    cui: "2723034",
    contratoEjecucionNumero: "CONTRATO N° 064-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "17/09/2026",
    contratoEjecucionMonto: 442926.92,
    contratoEjecucionEmpresa: "CONSORCIO BARRIOS ALTOS",
    residenteNombre: "Ing. Wilde Javier Lavado Enríquez (CIP 100625)",
    residenteCip: "CIP 100625",
    contratoSupervisionNumero: "07/09/2026",
    contratoSupervisionFechaFirma: "07/09/2026",
    contratoSupervisionMonto: 30052.59,
    contratoSupervisionEmpresa: "CONSTRUCTURA Y CONSULTORA DIAZ PEREZ S.A.C.",
    supervisorNombre: "Ing. Julio Cesar Gamarena Guio (CIP 98758)",
    supervisorCip: "CIP 98758",
    observaciones: "Se solicitó apertura de obra.",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-sup": true,
      "hito-contrato-obra": true,
      "hito-notif-sup": true,
    }),
  },
  {
    id: 20,
    encargado: "-",
    proyecto: "MERCADO ZONAL DE RIOJA",
    cui: "2709063",
    contratoEjecucionNumero: "CONTRATO N°041-2026",
    contratoEjecucionFechaFirma: "16/04/2026",
    contratoEjecucionMonto: 1509891.10,
    contratoEjecucionEmpresa: "CONSORCIO RIOJA",
    residenteNombre: "Ing. Lelis Santa Cruz Burga (CIP 170983)",
    residenteCip: "CIP 170983",
    contratoSupervisionNumero: "CONTRATO N°044-2026",
    contratoSupervisionFechaFirma: "27/04/2026",
    contratoSupervisionMonto: 63000.00,
    contratoSupervisionEmpresa: "U&S CONSULTORES Y CONTRATISTAS GENERALES SAC",
    supervisorNombre: "Ing. Marino Cieza Vargas (CIP 153618)",
    supervisorCip: "CIP 153618",
    entregaTerrenoFecha: "07/05/2026",
    inicioObraFecha: "08/05/2026",
    plazoDias: 120,
    fechaTerminoActualizado: "04/09/2026",
    observaciones: "Acta de Recepción 01/10/2026. Recepcionada conforme.",
    estado: "RECEPCIONADA",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": true,
      "hito-cod": true,
      "hito-acta-inicio": true,
      "hito-informe-compatibilidad": true,
      "hito-valo-01": true,
      "hito-recepcion": true,
    }),
  },
  {
    id: 21,
    encargado: "-",
    proyecto: "COBERTURA SAN JUAN",
    cui: "2688943",
    contratoEjecucionNumero: "CONTRATO N° 047-2026",
    contratoEjecucionFechaFirma: "27/05/2026",
    contratoEjecucionMonto: 367786.71,
    contratoEjecucionEmpresa: "SANCHEZ",
    contratoSupervisionNumero: "OS N°0000939",
    contratoSupervisionMonto: 19800.00,
    inicioObraFecha: "23/06/2026",
    plazoDias: 60,
    fechaTerminoActualizado: "21/08/2026",
    observaciones: "Finalizó. Recepcionada conforme.",
    estado: "RECEPCIONADA",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-terreno": true,
      "hito-acta-inicio": true,
      "hito-valo-01": true,
      "hito-recepcion": true,
    }),
  },
  {
    id: 22,
    encargado: "-",
    proyecto: "PUESTO TUMBARO",
    cui: "2705819",
    contratoEjecucionNumero: "CONTRATO N°046-2026",
    contratoEjecucionMonto: 473563.25,
    contratoEjecucionEmpresa: "CONSORCIO ALTO",
    contratoSupervisionMonto: 38170.00,
    inicioObraFecha: "05/06/2026",
    plazoDias: 75,
    fechaTerminoActualizado: "18/08/2026",
    observaciones: "En proceso de ejecución con plazo vigente.",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-terreno": true,
      "hito-acta-inicio": true,
      "hito-valo-01": true,
    }),
  },
  {
    id: 23,
    encargado: "-",
    proyecto: "PISTAS PACHACÚTEC",
    cui: "2521144",
    observaciones: "Integrado de bases 08/07; en proceso de selección SEACE.",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
];

// Helper calculations
export function getProgresoPorcentaje(hitos: HitoNormativo[]): number {
  if (!hitos || hitos.length === 0) return 0;
  const completed = hitos.filter((h) => h.cumplido).length;
  return Math.round((completed / hitos.length) * 100);
}

// Helper calculation for Real Physical Progress of Work (Avance Físico de Obra vs Checklist Normativo)
export function getAvanceFisicoObra(p: ProyectoCartera): {
  porcentajeFisico: number;
  montoEjecutadoTotal: number;
  porcentajeProgramado?: number;
  ultimaValorizacion?: ValorizacionObra;
  estadoFisico: "SIN_VALORIZACIONES" | "NORMAL" | "ATRASADA" | "CULMINADA";
  etiqueta: string;
} {
  if (p.estado === "FINALIZADA_LIQUIDADA" || p.estado === "RECEPCIONADA") {
    return {
      porcentajeFisico: 100,
      montoEjecutadoTotal: p.contratoEjecucionMonto,
      porcentajeProgramado: 100,
      estadoFisico: "CULMINADA",
      etiqueta: "100% Culminada",
    };
  }

  if (p.valorizaciones && p.valorizaciones.length > 0) {
    const sorted = [...p.valorizaciones].sort((a, b) => a.numero - b.numero);
    const latest = sorted[sorted.length - 1];
    const pct =
      latest.porcentajeEjecutadoAcumulado ||
      (p.contratoEjecucionMonto > 0
        ? Math.min(100, Math.round((latest.montoEjecutadoAcumulado / p.contratoEjecucionMonto) * 10000) / 100)
        : 0);
    const isAtrasada =
      latest.esAtrasada ||
      (latest.porcentajeProgramadoAcumulado > 0 && pct < latest.porcentajeProgramadoAcumulado * 0.8);

    return {
      porcentajeFisico: pct,
      montoEjecutadoTotal: latest.montoEjecutadoAcumulado || 0,
      porcentajeProgramado: latest.porcentajeProgramadoAcumulado,
      ultimaValorizacion: latest,
      estadoFisico: pct >= 100 ? "CULMINADA" : isAtrasada ? "ATRASADA" : "NORMAL",
      etiqueta: isAtrasada ? "Atrasada (Art. 198 RLCE)" : pct >= 100 ? "100% Ejecutada" : "Avance Normal",
    };
  }

  // Check if there are any valo hitos with amount
  const valoHitos = p.hitos.filter((h) => h.tipo === "valorizacion" || h.codigo.startsWith("VALO-"));
  if (valoHitos.length > 0) {
    const totalMonto = valoHitos.reduce((acc, h) => acc + (h.monto || 0), 0);
    const pct =
      p.contratoEjecucionMonto > 0
        ? Math.min(100, Math.round((totalMonto / p.contratoEjecucionMonto) * 10000) / 100)
        : 0;
    return {
      porcentajeFisico: pct,
      montoEjecutadoTotal: totalMonto,
      estadoFisico: pct >= 100 ? "CULMINADA" : pct > 0 ? "NORMAL" : "SIN_VALORIZACIONES",
      etiqueta: pct > 0 ? "En Avance Físico" : "Sin Val. Aprobadas",
    };
  }

  return {
    porcentajeFisico: 0,
    montoEjecutadoTotal: 0,
    estadoFisico: "SIN_VALORIZACIONES",
    etiqueta: "Sin Val. Aprobadas",
  };
}

export function getEstadoLabel(estado: EstadoCartera): { label: string; color: string; bg: string; border: string } {
  switch (estado) {
    case "ACTOS_PREPARATORIOS":
    case "EN_SELECCION_SEACE":
      return {
        label: "En Selección SEACE",
        color: "text-blue-900 font-extrabold",
        bg: "bg-blue-100",
        border: "border-blue-400",
      };
    case "PENDIENTE_INICIO_CONDICIONES":
      return {
        label: "Pendiente Inicio",
        color: "text-sky-900 font-extrabold",
        bg: "bg-sky-100",
        border: "border-sky-400",
      };
    case "EN_EJECUCION":
      return {
        label: "En Ejecución",
        color: "text-emerald-900 font-extrabold",
        bg: "bg-emerald-100",
        border: "border-emerald-400",
      };
    case "RECEPCIONADA":
      return {
        label: "Culminó la Obra",
        color: "text-rose-900 font-extrabold",
        bg: "bg-rose-100",
        border: "border-rose-400",
      };
    case "FINALIZADA_LIQUIDADA":
      return {
        label: "En Liquidación",
        color: "text-amber-900 font-extrabold",
        bg: "bg-amber-100",
        border: "border-amber-400",
      };
  }
}

export function getAlertasNormativas(p: ProyectoCartera): string[] {
  const alertas: string[] = [];

  // 1. Actos Preparatorios
  const hitoTdr = p.hitos?.find((h) => h.id === "hito-tdr");
  if (hitoTdr && !hitoTdr.cumplido && (p.contratoSupervisionNumero?.includes("FALTA") || p.estado === "ACTOS_PREPARATORIOS")) {
    alertas.push("Falta TDR de Supervisión");
  }
  const hitoBases = p.hitos?.find((h) => h.id === "hito-bases");
  if (hitoBases && !hitoBases.cumplido) {
    alertas.push("Falta Elaborar Bases");
  }

  // 2. Art. 176
  const hitoNotifSup = p.hitos?.find((h) => h.id === "hito-notif-sup");
  if (hitoNotifSup && !hitoNotifSup.cumplido && p.contratoEjecucionNumero?.startsWith("CONTRATO")) {
    alertas.push("Falta Notificar Supervisor (Art. 176.1.a)");
  }
  const hitoExp = p.hitos?.find((h) => h.id === "hito-expediente");
  if (hitoExp && !hitoExp.cumplido && p.contratoEjecucionNumero?.startsWith("CONTRATO")) {
    alertas.push("Falta Entrega de Expediente Técnico (Art. 176.1.c)");
  }
  const hitoTerreno = p.hitos?.find((h) => h.id === "hito-terreno");
  if (hitoTerreno && !hitoTerreno.cumplido && p.contratoEjecucionNumero?.startsWith("CONTRATO")) {
    alertas.push("Falta Acta de Terreno (Art. 176.1.b)");
  }
  const hitoInicio = p.hitos?.find((h) => h.id === "hito-acta-inicio");
  if (hitoInicio && !hitoInicio.cumplido && p.contratoEjecucionNumero?.startsWith("CONTRATO")) {
    alertas.push("Falta Acta de Inicio de Obra");
  }

  // 3. Ejecución
  const hitoValo1 = p.hitos?.find((h) => h.id === "hito-valo-01");
  if (hitoValo1 && !hitoValo1.cumplido && p.estado === "EN_EJECUCION") {
    alertas.push("Falta pasar Valo 01 de Supervisión");
  }

  // 4. Recepción & Liquidación
  if (p.estado === "RECEPCIONADA") {
    const hitoLiq = p.hitos?.find((h) => h.id === "hito-liquidacion");
    if (hitoLiq && !hitoLiq.cumplido) {
      alertas.push("Falta Liquidación Técnica-Financiera");
    }
  }

  return alertas;
}

export interface ProjectCategoryInfo {
  key: "pistas" | "coberturas" | "fondes" | "puentes" | "saneamiento" | "otros";
  label: string;
  shortLabel: string;
  icon: string;
  order: number;
}

export function detectProjectCategory(proyectoName: string): ProjectCategoryInfo {
  const u = (proyectoName || "").toUpperCase();

  if (
    u.includes("PISTA") ||
    u.includes("VEREDA") ||
    u.includes("PAVIMENT") ||
    u.includes("TRANSITABILIDAD") ||
    u.includes("VIAL") ||
    u.includes("CALLE") ||
    u.includes("JIRÓN") ||
    u.includes("JIRON") ||
    u.includes("AVENIDA") ||
    u.includes("PASAJE")
  ) {
    return {
      key: "pistas",
      label: "Pistas y Veredas",
      shortLabel: "Pistas",
      icon: "🛣️",
      order: 1,
    };
  }

  if (
    u.includes("COBERTURA") ||
    u.includes("TECHADO") ||
    u.includes("TECHO") ||
    u.includes("TINGLADO") ||
    u.includes("ESTRUCTURA METÁLICA") ||
    u.includes("ESTRUCTURA METALICA") ||
    u.includes("POLIDEPORTIVO") ||
    u.includes("LOSA") ||
    u.includes("CANCHA")
  ) {
    return {
      key: "coberturas",
      label: "Coberturas y Espacios Deportivos",
      shortLabel: "Coberturas",
      icon: "🏟️",
      order: 2,
    };
  }

  if (
    u.includes("FONDES") ||
    u.includes("DEFENSA") ||
    u.includes("QUEBRADA") ||
    u.includes("RÍO") ||
    u.includes("RIO") ||
    u.includes("MURO") ||
    u.includes("PROTECCIÓN") ||
    u.includes("PROTECCION") ||
    u.includes("DESCOLMATACI") ||
    u.includes("ENROCADO")
  ) {
    return {
      key: "fondes",
      label: "FONDES y Defensas Ribereñas",
      shortLabel: "FONDES",
      icon: "🌊",
      order: 3,
    };
  }

  if (
    u.includes("PUENTE") ||
    u.includes("PONTON") ||
    u.includes("PONTÓN") ||
    u.includes("PASARELA")
  ) {
    return {
      key: "puentes",
      label: "Puentes y Pontones",
      shortLabel: "Puentes",
      icon: "🌉",
      order: 4,
    };
  }

  if (
    u.includes("AGUA") ||
    u.includes("SANEAMIENTO") ||
    u.includes("ALCANTARILLADO") ||
    u.includes("DESAGÜE") ||
    u.includes("DESAGUE") ||
    u.includes("RESERVORIO")
  ) {
    return {
      key: "saneamiento",
      label: "Agua y Saneamiento",
      shortLabel: "Saneamiento",
      icon: "💧",
      order: 5,
    };
  }

  return {
    key: "otros",
    label: "Otros Proyectos de Infraestructura (Edificaciones, Mercados, etc.)",
    shortLabel: "Otros",
    icon: "📁",
    order: 6,
  };
}

export function getChecklistColorTheme(p: ProyectoCartera) {
  const isSeleccionSeace =
    p.estado === "EN_SELECCION_SEACE" ||
    p.estado === "ACTOS_PREPARATORIOS" ||
    (p.estado as string).toLowerCase().includes("selecc") ||
    (p.estado as string).toLowerCase().includes("seace") ||
    (p.estado as string).toLowerCase().includes("convocator") ||
    (p.estado as string).toLowerCase().includes("preparator");

  const isLiquidacion =
    !isSeleccionSeace &&
    (p.estado === "FINALIZADA_LIQUIDADA" ||
      (p.estado as string).toLowerCase().includes("liquid") ||
      !!p.hitos?.find((h) => h.id === "hito-liquidacion")?.cumplido);

  const isCulminada =
    !isSeleccionSeace &&
    !isLiquidacion &&
    (p.estado === "RECEPCIONADA" ||
      (p.estado as string).toLowerCase().includes("recep") ||
      (p.estado as string).toLowerCase().includes("culmin") ||
      !!p.hitos?.find((h) => h.id === "hito-recepcion")?.cumplido);

  const isEjecucion =
    !isSeleccionSeace &&
    !isCulminada &&
    !isLiquidacion &&
    (p.estado === "EN_EJECUCION" || !!p.inicioObraFecha);

  // 1. En Selección SEACE / Actos Preparatorios -> AZUL
  if (isSeleccionSeace) {
    return {
      statusKey: "seleccion_seace" as const,
      container: "bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 shadow-xs",
      title: "text-blue-950",
      count: "text-blue-700",
      pct: "text-blue-800",
      barTrack: "border-blue-300 bg-blue-100/80",
      barFill: "bg-blue-600",
      badge: "bg-blue-100 text-blue-900 border-blue-300 font-extrabold",
      label: "En Selección SEACE (Azul)",
      shortLabel: "En Selección SEACE",
      tagColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "🔵",
      borderAccent: "border-l-4 border-l-blue-600",
      outerGlow: "ring-2 ring-blue-400/25",
      cardBorder: "border-blue-400/50 hover:border-blue-500",
      cardBgFulfilled: "bg-blue-500/15 text-blue-950 border-blue-400/60 shadow-2xs",
      cardBgPending: "bg-blue-500/5 text-blue-900 border-blue-300/40 hover:bg-blue-500/15",
      tarjetaFulfilled: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-950 border-blue-400/60 shadow-2xs",
      tarjetaPending: "bg-blue-500/5 hover:bg-blue-500/15 text-blue-900 border-blue-300/40",
      tarjetaTitle: "text-blue-950 font-extrabold",
      tarjetaDoc: "bg-blue-500/10 text-blue-900 border-blue-300/40",
      tarjetaDate: "text-blue-700/80 font-mono",
      cardTag: "bg-blue-500/15 text-blue-900 border-blue-300/50",
      dot: "bg-blue-600",
    };
  }

  // 2. Culminó la Obra / Recepcionada -> ROJO BAJO
  if (isCulminada) {
    return {
      statusKey: "culminada" as const,
      container: "bg-rose-50/70 border-rose-400 ring-2 ring-rose-500/20 text-rose-950 shadow-xs",
      title: "text-rose-950",
      count: "text-rose-700",
      pct: "text-rose-800",
      barTrack: "border-rose-300 bg-rose-100/80",
      barFill: "bg-rose-500",
      badge: "bg-rose-100 text-rose-900 border-rose-300 font-extrabold",
      label: "Culminó la Obra (Rojo Bajo)",
      shortLabel: "Culminada",
      tagColor: "bg-rose-100 text-rose-800 border-rose-200",
      icon: "🔴",
      borderAccent: "border-l-4 border-l-rose-500",
      outerGlow: "ring-2 ring-rose-400/25",
      cardBorder: "border-rose-400/50 hover:border-rose-500",
      cardBgFulfilled: "bg-rose-500/15 text-rose-950 border-rose-400/60 shadow-2xs",
      cardBgPending: "bg-rose-500/5 text-rose-900 border-rose-300/40 hover:bg-rose-500/15",
      tarjetaFulfilled: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-950 border-rose-400/60 shadow-2xs",
      tarjetaPending: "bg-rose-500/5 hover:bg-rose-500/15 text-rose-900 border-rose-300/40",
      tarjetaTitle: "text-rose-950 font-extrabold",
      tarjetaDoc: "bg-rose-500/10 text-rose-900 border-rose-300/40",
      tarjetaDate: "text-rose-700/80 font-mono",
      cardTag: "bg-rose-500/15 text-rose-900 border-rose-300/50",
      dot: "bg-rose-500",
    };
  }

  // 3. En Liquidación -> AMARILLO BAJO
  if (isLiquidacion) {
    return {
      statusKey: "liquidacion" as const,
      container: "bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 text-amber-950 shadow-xs",
      title: "text-amber-950",
      count: "text-amber-700",
      pct: "text-amber-800",
      barTrack: "border-amber-300 bg-amber-100/80",
      barFill: "bg-amber-500",
      badge: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold",
      label: "En Liquidación (Amarillo Bajo)",
      shortLabel: "En Liquidación",
      tagColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "🟡",
      borderAccent: "border-l-4 border-l-amber-500",
      outerGlow: "ring-2 ring-amber-400/25",
      cardBorder: "border-amber-400/50 hover:border-amber-500",
      cardBgFulfilled: "bg-amber-500/15 text-amber-950 border-amber-400/60 shadow-2xs",
      cardBgPending: "bg-amber-500/5 text-amber-900 border-amber-300/40 hover:bg-amber-500/15",
      tarjetaFulfilled: "bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border-amber-400/60 shadow-2xs",
      tarjetaPending: "bg-amber-500/5 hover:bg-amber-500/15 text-amber-900 border-amber-300/40",
      tarjetaTitle: "text-amber-950 font-extrabold",
      tarjetaDoc: "bg-amber-500/10 text-amber-900 border-amber-300/40",
      tarjetaDate: "text-amber-700/80 font-mono",
      cardTag: "bg-amber-500/15 text-amber-900 border-amber-300/50",
      dot: "bg-amber-500",
    };
  }

  // 4. En Ejecución -> VERDE
  if (isEjecucion) {
    return {
      statusKey: "ejecucion" as const,
      container: "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs",
      title: "text-emerald-950",
      count: "text-emerald-700",
      pct: "text-emerald-800",
      barTrack: "border-emerald-300 bg-emerald-100/80",
      barFill: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold",
      label: "En Ejecución (Verde)",
      shortLabel: "En Ejecución",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "🟢",
      borderAccent: "border-l-4 border-l-emerald-600",
      outerGlow: "ring-2 ring-emerald-400/25",
      cardBorder: "border-emerald-400/50 hover:border-emerald-500",
      cardBgFulfilled: "bg-emerald-500/15 text-emerald-950 border-emerald-400/60 shadow-2xs",
      cardBgPending: "bg-emerald-500/5 text-emerald-900 border-emerald-300/40 hover:bg-emerald-500/15",
      tarjetaFulfilled: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 border-emerald-400/60 shadow-2xs",
      tarjetaPending: "bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-900 border-emerald-300/40",
      tarjetaTitle: "text-emerald-950 font-extrabold",
      tarjetaDoc: "bg-emerald-500/10 text-emerald-900 border-emerald-300/40",
      tarjetaDate: "text-emerald-700/80 font-mono",
      cardTag: "bg-emerald-500/15 text-emerald-900 border-emerald-300/50",
      dot: "bg-emerald-600",
    };
  }

  // 5. Pendiente Inicio
  return {
    statusKey: "inicio" as const,
    container: "bg-sky-50/70 border-sky-400 ring-2 ring-sky-500/20 text-sky-950 shadow-xs",
    title: "text-sky-950",
    count: "text-sky-700",
    pct: "text-sky-800",
    barTrack: "border-sky-300 bg-sky-100/80",
    barFill: "bg-sky-500",
    badge: "bg-sky-100 text-sky-900 border-sky-300 font-extrabold",
    label: "Pendiente Inicio",
    shortLabel: "Pendiente",
    tagColor: "bg-sky-100 text-sky-800 border-sky-200",
    icon: "⏳",
    borderAccent: "border-l-4 border-l-sky-500",
    outerGlow: "ring-2 ring-sky-400/25",
    cardBorder: "border-sky-400/50 hover:border-sky-500",
    cardBgFulfilled: "bg-sky-500/15 text-sky-950 border-sky-400/60 shadow-2xs",
    cardBgPending: "bg-sky-500/5 text-sky-900 border-sky-300/40 hover:bg-sky-500/15",
    tarjetaFulfilled: "bg-sky-500/15 hover:bg-sky-500/25 text-sky-950 border-sky-400/60 shadow-2xs",
    tarjetaPending: "bg-sky-500/5 hover:bg-sky-500/15 text-sky-900 border-sky-300/40",
    tarjetaTitle: "text-sky-950 font-extrabold",
    tarjetaDoc: "bg-sky-500/10 text-sky-900 border-sky-300/40",
    tarjetaDate: "text-sky-700/80 font-mono",
    cardTag: "bg-sky-500/15 text-sky-900 border-sky-300/50",
    dot: "bg-sky-500",
  };
}
