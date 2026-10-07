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
  encargado: string; // "JHON" | "JHENIFER" | "JEZER" | "-"
  proyecto: string; // Nombre del proyecto o vía
  cui: string; // Código Único de Inversiones
  
  // Contrato de Ejecución
  contratoEjecucionNumero: string;
  contratoEjecucionFechaFirma?: string;
  contratoEjecucionMonto: number;
  contratoEjecucionEmpresa: string;
  residenteNombre?: string;
  residenteCip?: string;

  // Contrato / Orden de Supervisión
  contratoSupervisionNumero: string; // Contrato N° o OS N°
  contratoSupervisionFechaFirma?: string;
  contratoSupervisionMonto: number;
  contratoSupervisionEmpresa: string;
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

// Initial 23 projects database according to the official Municipalidad Provincial de Rioja matrix
export const PROYECTOS_RIOJA_SEED: ProyectoCartera[] = [
  {
    id: 1,
    encargado: "JHON",
    proyecto: "PISTAS JR.ARICA",
    cui: "2619826",
    contratoEjecucionNumero: "CONTRATO 023-2025",
    contratoEjecucionFechaFirma: "16/12/2025",
    contratoEjecucionMonto: 8060000.01,
    contratoEjecucionEmpresa: "CONSORCIO BASCA",
    residenteNombre: "Ing. Residente Consorcio Basca",
    contratoSupervisionNumero: "CONTRATO N°045-2026",
    contratoSupervisionFechaFirma: "05/05/2026",
    contratoSupervisionMonto: 311450.79,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR ARICA",
    supervisorNombre: "Ing. Jefe de Supervisión",
    entregaTerrenoFecha: "07/05/2026",
    inicioObraFecha: "13/05/2026",
    plazoDias: 210,
    fechaTerminoActualizado: "08/12/2026",
    observaciones: "En ejecución física normal dentro del cronograma",
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
    encargado: "JHENIFER",
    proyecto: "MATADERO",
    cui: "2235100",
    contratoEjecucionNumero: "CONTRATO N°049-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "16/06/2026",
    contratoEjecucionMonto: 1483475.40,
    contratoEjecucionEmpresa: "CONSORCIO MATADERO RIOJA",
    contratoSupervisionNumero: "CONTRATO N°050-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "14/07/2026",
    contratoSupervisionMonto: 108018.63,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR",
    entregaTerrenoFecha: "15/07/2026",
    inicioObraFecha: "16/07/2026",
    plazoDias: 90,
    fechaTerminoActualizado: "13/10/2026",
    observaciones: "En ejecución física normal con supervisión activa",
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
    encargado: "JHON",
    proyecto: "PISTAS JERUSALEN",
    cui: "2707147",
    contratoEjecucionNumero: "CONTRATO N°051-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "15/07/2026",
    contratoEjecucionMonto: 1238716.73,
    contratoEjecucionEmpresa: "CONSORCIO JERUSALEN",
    contratoSupervisionNumero: "CONTRATO N°054-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "05/08/2026",
    contratoSupervisionMonto: 91950.00,
    contratoSupervisionEmpresa: "DIAZ HUAMAN JULIO",
    supervisorNombre: "Ing. Julio Díaz Huamán",
    entregaTerrenoFecha: "10/08/2026",
    inicioObraFecha: "13/08/2026",
    plazoDias: 75,
    fechaTerminoActualizado: "27/10/2026",
    observaciones: "En ejecución de obras de pavimentación y veredas",
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
        id: "val-pj-01",
        numero: 1,
        periodo: "Mes 1 - Agosto 2026",
        fechaValorizacion: "31/08/2026",
        fechaAprobacionSupervisor: "05/09/2026",
        montoProgramadoMes: 450000.0,
        montoEjecutadoMes: 462150.0,
        porcentajeProgramadoMes: 36.33,
        porcentajeEjecutadoMes: 37.31,
        montoProgramadoAcumulado: 450000.0,
        montoEjecutadoAcumulado: 462150.0,
        porcentajeProgramadoAcumulado: 36.33,
        porcentajeEjecutadoAcumulado: 37.31,
        estado: "APROBADA",
        esAtrasada: false,
        observacionesSupervisor:
          "Avance físico conforme según cronograma. Se verificaron metrados de corte y subrasante.",
        partidas: [
          {
            id: "p-01",
            item: "01.01",
            descripcion: "Cartel de identificación de la obra de 3.60 x 2.40 m",
            unidad: "und",
            metradoContratado: 2,
            precioUnitario: 1200.0,
            metradoAnterior: 0,
            metradoActual: 2,
            montoParcial: 2400.0,
            metradoAcumulado: 2,
            montoAcumulado: 2400.0,
            porcentajeAvance: 100,
          },
          {
            id: "p-02",
            item: "02.01",
            descripcion: "Corte masivo de terreno con maquinaria pesada a nivel de subrasante",
            unidad: "m3",
            metradoContratado: 4500,
            precioUnitario: 35.5,
            metradoAnterior: 0,
            metradoActual: 3800,
            montoParcial: 134900.0,
            metradoAcumulado: 3800,
            montoAcumulado: 134900.0,
            porcentajeAvance: 84.44,
          },
          {
            id: "p-03",
            item: "02.02",
            descripcion: "Perfilado y compactación de subrasante en zonas de corte",
            unidad: "m2",
            metradoContratado: 8200,
            precioUnitario: 18.2,
            metradoAnterior: 0,
            metradoActual: 6500,
            montoParcial: 118300.0,
            metradoAcumulado: 6500,
            montoAcumulado: 118300.0,
            porcentajeAvance: 79.27,
          },
          {
            id: "p-04",
            item: "03.01",
            descripcion: "Base granular e = 0.20 m para pavimento rígido",
            unidad: "m2",
            metradoContratado: 7800,
            precioUnitario: 26.5,
            metradoAnterior: 0,
            metradoActual: 5100,
            montoParcial: 135150.0,
            metradoAcumulado: 5100,
            montoAcumulado: 135150.0,
            porcentajeAvance: 65.38,
          },
          {
            id: "p-05",
            item: "04.01",
            descripcion: "Concreto f'c=210 kg/cm2 para pavimento rígido e=0.20 m",
            unidad: "m3",
            metradoContratado: 1200,
            precioUnitario: 420.0,
            metradoAnterior: 0,
            metradoActual: 170,
            montoParcial: 71400.0,
            metradoAcumulado: 170,
            montoAcumulado: 71400.0,
            porcentajeAvance: 14.17,
          },
        ],
      },
      {
        id: "val-pj-02",
        numero: 2,
        periodo: "Mes 2 - Setiembre 2026",
        fechaValorizacion: "30/09/2026",
        fechaAprobacionSupervisor: "04/10/2026",
        montoProgramadoMes: 520000.0,
        montoEjecutadoMes: 548200.0,
        porcentajeProgramadoMes: 41.98,
        porcentajeEjecutadoMes: 44.26,
        montoProgramadoAcumulado: 970000.0,
        montoEjecutadoAcumulado: 1010350.0,
        porcentajeProgramadoAcumulado: 78.31,
        porcentajeEjecutadoAcumulado: 81.57,
        estado: "APROBADA",
        esAtrasada: false,
        observacionesSupervisor:
          "Vaciado continuo de losas de concreto rígido y veredas peatonales. Avance favorable por encima del programado.",
        partidas: [
          {
            id: "p-05",
            item: "04.01",
            descripcion: "Concreto f'c=210 kg/cm2 para pavimento rígido e=0.20 m",
            unidad: "m3",
            metradoContratado: 1200,
            precioUnitario: 420.0,
            metradoAnterior: 170,
            metradoActual: 850,
            montoParcial: 357000.0,
            metradoAcumulado: 1020,
            montoAcumulado: 428400.0,
            porcentajeAvance: 85.0,
          },
          {
            id: "p-06",
            item: "05.01",
            descripcion:
              "Veredas de concreto f'c=175 kg/cm2 e=0.10 m con acabado frotachado y bruñado",
            unidad: "m2",
            metradoContratado: 3200,
            precioUnitario: 59.75,
            metradoAnterior: 0,
            metradoActual: 3200,
            montoParcial: 191200.0,
            metradoAcumulado: 3200,
            montoAcumulado: 191200.0,
            porcentajeAvance: 100,
          },
        ],
      },
    ],
  },
  {
    id: 6,
    encargado: "JHON",
    proyecto: "PISTAS TEOBALDO",
    cui: "2507075",
    contratoEjecucionNumero: "CONTRATO N°052-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "16/07/2026",
    contratoEjecucionMonto: 7416900.00,
    contratoEjecucionEmpresa: "CONSORCIO ALTO MAYO",
    contratoSupervisionNumero: "CONTRATO N°055-2026-GAF/MPR",
    contratoSupervisionFechaFirma: "07/08/2026",
    contratoSupervisionMonto: 393485.69,
    contratoSupervisionEmpresa: "CONSORCIO SUPERVISOR TEOBALDO",
    entregaTerrenoFecha: "12/08/2026",
    inicioObraFecha: "18/08/2026",
    plazoDias: 240,
    fechaTerminoActualizado: "15/04/2027",
    observaciones: "Proyecto integral de transitabilidad en ejecución física",
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
    id: 7,
    encargado: "JEZER",
    proyecto: "PUESTO DE AUXILIO SAN FRANCISCO",
    cui: "2655193",
    contratoEjecucionNumero: "CONTRATO N°053-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "03/08/2026",
    contratoEjecucionMonto: 474254.25,
    contratoEjecucionEmpresa: "CONSORCIO RAYMONDI",
    residenteNombre: "Ing. Pablo Henry Mayaute Huamani, CIP°52916",
    residenteCip: "CIP 52916",
    contratoSupervisionNumero: "OS N°0001324",
    contratoSupervisionFechaFirma: "12/08/2026",
    contratoSupervisionMonto: 35500.00,
    contratoSupervisionEmpresa: "Z & Z CENTER FISH S.A.C.",
    supervisorNombre: "Ing. Segundo German Rios Vasquez - CIP N° 74049",
    supervisorCip: "CIP 74049",
    entregaTerrenoFecha: "-",
    inicioObraFecha: "-",
    plazoDias: undefined,
    fechaTerminoActualizado: "-",
    observaciones: "- FALTA PASAR SU AMPLIACION DE PLAZO",
    estado: "EN_EJECUCION",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "15/06/2026" },
      "hito-bases": { cumplido: true, fecha: "10/07/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "03/08/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "12/08/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "14/08/2026" },
      "hito-expediente": { cumplido: true, fecha: "14/08/2026" },
      "hito-terreno": { cumplido: false },
      "hito-cod": { cumplido: false },
      "hito-acta-inicio": { cumplido: false },
      "hito-informe-compatibilidad": { cumplido: false },
      "hito-valo-01": { cumplido: false },
    }),
  },
  {
    id: 8,
    encargado: "JEZER",
    proyecto: "COBERTURA SAGRADO CORAZON DE JESUS",
    cui: "2684433",
    contratoEjecucionNumero: "CONTRATO N°057-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "25/08/2026",
    contratoEjecucionMonto: 379176.27,
    contratoEjecucionEmpresa: "CONSORCIO EJECUTOR RIOJA",
    contratoSupervisionNumero: "OS N°0001401",
    contratoSupervisionFechaFirma: "18/08/2026",
    contratoSupervisionMonto: 28800.00,
    contratoSupervisionEmpresa: "GENESIS CAMILA CONTRATISTA GENERALES S.A.C.",
    supervisorNombre: "Ing. Rodin Heriberto Mas Camus - CIP Nº 72597",
    supervisorCip: "CIP 72597",
    entregaTerrenoFecha: "-",
    inicioObraFecha: "-",
    plazoDias: undefined,
    fechaTerminoActualizado: "-",
    observaciones: "- PARA ACTA DE ENTREGA DE TERRENO Y ACTA DE INICIO DE OBRA",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "20/06/2026" },
      "hito-bases": { cumplido: true, fecha: "15/07/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "18/08/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "25/08/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "26/08/2026" },
      "hito-expediente": { cumplido: true, fecha: "27/08/2026" },
      "hito-terreno": { cumplido: false },
      "hito-cod": { cumplido: false },
      "hito-acta-inicio": { cumplido: false },
    }),
  },
  {
    id: 10,
    encargado: "JOSUE",
    proyecto: "COBERTURA-SAN AGUSTIN",
    cui: "2722218",
    contratoEjecucionNumero: "CONTRATO N° 065-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "18/09/2026",
    contratoEjecucionMonto: 439921.73,
    contratoEjecucionEmpresa: "ROIS OBRAS CIVILES S.A.C.",
    contratoSupervisionNumero: "04/09/2026",
    contratoSupervisionFechaFirma: "04/09/2026",
    contratoSupervisionMonto: 35500.00,
    contratoSupervisionEmpresa: "ERFRA INGENIERIA S.A.C. (Gerente: Castillo Olivera Gianfranco Lorenzo - Jr. Angaiza 425 Rioja - Erfraingenieriasac@gmail.com)",
    supervisorNombre: "Ing. Pedro Bobadilla Guadalupe - CIP Nº 217784",
    supervisorCip: "CIP 217784",
    entregaTerrenoFecha: "-",
    inicioObraFecha: "-",
    plazoDias: undefined,
    fechaTerminoActualizado: "-",
    observaciones: "- SE SOLICITO APERTURA DE OBRA - SE COMUNICO LOS USUARIOS DEL CUADERNO DE INCIDENDICAS. - SE COMUNICO LA SUPERVION DE OBRA - SE ENTREGO EL EXPEDIENTE TECNICO. - ESPERANDO CONFIRMACION DE ADELANTO DIRECTO",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "15/08/2026" },
      "hito-bases": { cumplido: true, fecha: "20/08/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "04/09/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "18/09/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "19/09/2026" },
      "hito-expediente": { cumplido: true, fecha: "20/09/2026" },
      "hito-cod": { cumplido: true, fecha: "22/09/2026" },
      "hito-terreno": { cumplido: false },
      "hito-acta-inicio": { cumplido: false },
    }),
  },
  {
    id: 11,
    encargado: "JOSUE",
    proyecto: "COBERTURA-MANUEL GONZALES PRADA",
    cui: "2724099",
    contratoEjecucionNumero: "PUBLICADO 31/07",
    contratoEjecucionFechaFirma: "18/09/2026",
    contratoEjecucionMonto: 451021.43,
    contratoEjecucionEmpresa: "CONSORCIO NARANJOS MGP",
    contratoSupervisionNumero: "21/09/2026",
    contratoSupervisionFechaFirma: "21/09/2026",
    contratoSupervisionMonto: 29971.56,
    contratoSupervisionEmpresa: "CONSULTORA Y CONSTRUCTORA DELTA EIRL (Gerente: Vásquez Ríos Marx Lenin - Jr. Patrón Santiago S/N Moyobamba - leninvasquez1170@gmail.com)",
    supervisorNombre: "Ing. Elvis German Toro - CIP Nº 215636",
    supervisorCip: "CIP 215636",
    entregaTerrenoFecha: "-",
    inicioObraFecha: "-",
    plazoDias: undefined,
    fechaTerminoActualizado: "-",
    observaciones: "- SE SOLICITO POR CORREO SU PRONUNCIAMIENTO CON RESPECTO AL PERSONAL CLAVE DE LA OBRA",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "15/07/2026" },
      "hito-bases": { cumplido: true, fecha: "31/07/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "18/09/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "21/09/2026" },
      "hito-notif-sup": { cumplido: false },
      "hito-expediente": { cumplido: false },
      "hito-terreno": { cumplido: false },
      "hito-cod": { cumplido: false },
      "hito-acta-inicio": { cumplido: false },
    }),
  },
  {
    id: 12,
    encargado: "LUIS",
    proyecto: "COBERTURA-BARRIOS ALTOS",
    cui: "2723034",
    contratoEjecucionNumero: "CONTRATO N° 064-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "17/09/2026",
    contratoEjecucionMonto: 442926.92,
    contratoEjecucionEmpresa: "CONSORCIO BARRIOS ALTOS",
    residenteNombre: "Ing. Wilde Javier Lavado Enríquez - CIP Nº 100625",
    residenteCip: "CIP 100625",
    contratoSupervisionNumero: "07/09/2026",
    contratoSupervisionFechaFirma: "07/09/2026",
    contratoSupervisionMonto: 30052.59,
    contratoSupervisionEmpresa: "CONSTRUCTURA Y CONSULTORA DIAZ PEREZ S.A.C. (Gerente: Díaz Pérez Betty - Av. Cajamarca Norte 200 Rioja)",
    supervisorNombre: "Ing. Julio Cesar Gamarena Guio - CIP Nº 98758",
    supervisorCip: "CIP 98758",
    entregaTerrenoFecha: "-",
    inicioObraFecha: "-",
    plazoDias: undefined,
    fechaTerminoActualizado: "-",
    observaciones: "- SE SOLICITO APERTURA DE OBRA",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "10/08/2026" },
      "hito-bases": { cumplido: true, fecha: "25/08/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "07/09/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "17/09/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "18/09/2026" },
      "hito-expediente": { cumplido: false },
      "hito-terreno": { cumplido: false },
      "hito-cod": { cumplido: false },
      "hito-acta-inicio": { cumplido: false },
    }),
  },
  {
    id: 13,
    encargado: "LUIS",
    proyecto: "FONDES-IE DEL",
    cui: "2689751",
    contratoEjecucionNumero: "SE ELABORARON LAS BASES",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Pendiente Convocatoria",
    contratoSupervisionNumero: "SE REALIZÓ EL TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Convocatoria",
    observaciones: "Bases y TDR listos para aprobación de expediente de contratación",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
    }),
  },
  {
    id: 14,
    encargado: "PICO",
    proyecto: "FONDES-IE JUAN",
    cui: "2689748",
    contratoEjecucionNumero: "SE ELABORARON LAS BASES",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Pendiente Convocatoria",
    contratoSupervisionNumero: "SE REALIZÓ EL TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Convocatoria",
    observaciones: "Bases y TDR elaborados",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
    }),
  },
  {
    id: 15,
    encargado: "PICO",
    proyecto: "FONDES-IE",
    cui: "2689756",
    contratoEjecucionNumero: "SE ELABORARON LAS BASES",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Pendiente Convocatoria",
    contratoSupervisionNumero: "SE REALIZÓ EL TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Convocatoria",
    observaciones: "Bases y TDR elaborados",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
    }),
  },
  {
    id: 16,
    encargado: "JOSUE",
    proyecto: "FONDES-IE SANTA",
    cui: "2689539",
    contratoEjecucionNumero: "SE ELABORARON LAS BASES",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Pendiente Convocatoria",
    contratoSupervisionNumero: "SE REALIZÓ EL TDR, FALTA",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Se elaboraron bases de obra; falta culminar TDR de supervisión",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-bases": true,
      "hito-tdr": false,
    }),
  },
  {
    id: 17,
    encargado: "LUIS",
    proyecto: "PUENTE-PABLO MORI",
    cui: "2677501",
    contratoEjecucionNumero: "PUBLICADO 17/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Obra publicada el 17/07; falta elaboración de bases para supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 18,
    encargado: "PICO",
    proyecto: "PUENTE-2677502",
    cui: "2677502",
    contratoEjecucionNumero: "BASES INTEGRADAS 24/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Bases integradas 24/07; pendiente contratación de supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 19,
    encargado: "LUIS",
    proyecto: "PUENTE-EL",
    cui: "2677531",
    contratoEjecucionNumero: "PUBLICADO 17/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Publicado 17/07; falta bases para supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 20,
    encargado: "JOSUE",
    proyecto: "PUENTE-2677528",
    cui: "2677528",
    contratoEjecucionNumero: "PUBLICADO 17/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Publicado 17/07; falta bases para supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 21,
    encargado: "PICO",
    proyecto: "PUENTE-TUMBARO",
    cui: "2677530",
    contratoEjecucionNumero: "PUBLICADO 17/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Publicado 17/07; falta bases para supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 9,
    encargado: "LUIS",
    proyecto: "PISTAS PACHACUTEC",
    cui: "2521144",
    contratoEjecucionNumero: "INTEGRADO BASES 08/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Proceso en SEACE",
    contratoSupervisionNumero: "FALTA ELABORACION BASES",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente",
    observaciones: "Integrado de bases 08/07; falta elaboración de bases para supervisión",
    estado: "EN_SELECCION_SEACE",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": false,
    }),
  },
  {
    id: 3,
    encargado: "JHENIFER",
    proyecto: "PUESTO TUMBARO",
    cui: "2705819",
    contratoEjecucionNumero: "CONTRATO N°046-2026",
    contratoEjecucionFechaFirma: "08/05/2026",
    contratoEjecucionMonto: 473563.25,
    contratoEjecucionEmpresa: "CONSORCIO ALTO",
    contratoSupervisionNumero: "OS N°0000899",
    contratoSupervisionFechaFirma: "21/05/2026",
    contratoSupervisionMonto: 38170.00,
    contratoSupervisionEmpresa: "GRUPO LISAP E.I.R.L",
    entregaTerrenoFecha: "04/06/2026",
    inicioObraFecha: "05/06/2026",
    plazoDias: 75,
    fechaTerminoActualizado: "18/08/2026",
    observaciones: "En proceso de ejecución con plazo vigente",
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
    id: 2,
    encargado: "JEZER",
    proyecto: "MERCADO ZONAL",
    cui: "2709063",
    contratoEjecucionNumero: "CONTRATO N°041-2026",
    contratoEjecucionFechaFirma: "16/04/2026",
    contratoEjecucionMonto: 1509891.10,
    contratoEjecucionEmpresa: "CONSORCIO RIOJA",
    residenteNombre: "Ing. Lelis Santa Cruz Burga",
    residenteCip: "CIP 170983",
    contratoSupervisionNumero: "CONTRATO N°044-2026",
    contratoSupervisionFechaFirma: "27/04/2026",
    contratoSupervisionMonto: 63000.00,
    contratoSupervisionEmpresa: "U&S CONSULTORES Y CONTRATISTAS GENERALES SAC",
    supervisorNombre: "Ing. Marino Cieza Vargas",
    supervisorCip: "CIP 153618",
    entregaTerrenoFecha: "07/05/2026",
    inicioObraFecha: "08/05/2026",
    plazoDias: 120,
    fechaTerminoActualizado: "04/09/2026",
    observaciones: "ACTA DE RECEPCIÓN 01/10/2026",
    estado: "RECEPCIONADA",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "15/02/2026" },
      "hito-bases": { cumplido: true, fecha: "10/03/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "16/04/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "27/04/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "28/04/2026" },
      "hito-expediente": { cumplido: true, fecha: "29/04/2026" },
      "hito-terreno": { cumplido: true, fecha: "07/05/2026" },
      "hito-cod": { cumplido: true, fecha: "07/05/2026" },
      "hito-acta-inicio": { cumplido: true, fecha: "08/05/2026" },
      "hito-informe-compatibilidad": { cumplido: true, fecha: "20/05/2026" },
      "hito-valo-01": { cumplido: true, fecha: "10/06/2026" },
      "hito-recepcion": { cumplido: true, fecha: "01/10/2026" }, // Acta de Recepción 01/10/2026
      "hito-liquidacion": false,
    }),
  },
  {
    id: 22,
    encargado: "JEZER",
    proyecto: "COBERTURA SAN JUAN",
    cui: "2688943",
    contratoEjecucionNumero: "CONTRATO N° 047-2026",
    contratoEjecucionFechaFirma: "27/05/2026",
    contratoEjecucionMonto: 367786.71,
    contratoEjecucionEmpresa: "SANCHEZ",
    contratoSupervisionNumero: "OS N°0000939",
    contratoSupervisionFechaFirma: "10/06/2026",
    contratoSupervisionMonto: 19800.00,
    contratoSupervisionEmpresa: "CESPEDES MEDINA",
    entregaTerrenoFecha: "22/06/2026",
    inicioObraFecha: "23/06/2026",
    plazoDias: 60,
    fechaTerminoActualizado: "21/08/2026",
    observaciones: "FINALIZÓ",
    estado: "RECEPCIONADA",
    hitos: createDefaultHitos({
      "hito-tdr": { cumplido: true, fecha: "01/04/2026" },
      "hito-bases": { cumplido: true, fecha: "20/04/2026" },
      "hito-contrato-obra": { cumplido: true, fecha: "27/05/2026" },
      "hito-contrato-sup": { cumplido: true, fecha: "10/06/2026" },
      "hito-notif-sup": { cumplido: true, fecha: "15/06/2026" },
      "hito-expediente": { cumplido: true, fecha: "18/06/2026" },
      "hito-terreno": { cumplido: true, fecha: "22/06/2026" },
      "hito-cod": { cumplido: true, fecha: "22/06/2026" },
      "hito-acta-inicio": { cumplido: true, fecha: "23/06/2026" },
      "hito-informe-compatibilidad": { cumplido: true, fecha: "05/07/2026" },
      "hito-valo-01": { cumplido: true, fecha: "15/07/2026" },
      "hito-recepcion": { cumplido: true, fecha: "21/08/2026" },
      "hito-liquidacion": false, // Falta liquidación
    }),
  },
  {
    id: 23,
    encargado: "JHENIFER",
    proyecto: "CERCO VISTA ALEGRE",
    cui: "2695908",
    contratoEjecucionNumero: "CONTRATO N°048-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "10/06/2026",
    contratoEjecucionMonto: 208232.57,
    contratoEjecucionEmpresa: "U & S CONSULTORES Y CONTRATISTAS GENERALES S.A.C.",
    contratoSupervisionNumero: "OS N°0000985",
    contratoSupervisionFechaFirma: "18/06/2026",
    contratoSupervisionMonto: 18000.00,
    contratoSupervisionEmpresa: "JR.INMOBILIARIA INGENIERIA Y CONSTRUCCIONES SAC",
    entregaTerrenoFecha: "18/06/2026",
    inicioObraFecha: "19/06/2026",
    plazoDias: 45,
    fechaTerminoActualizado: "02/08/2026",
    observaciones: "FINALIZÓ",
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
      return {
        label: "Actos Preparatorios",
        color: "text-amber-800",
        bg: "bg-amber-100",
        border: "border-amber-300",
      };
    case "EN_SELECCION_SEACE":
      return {
        label: "En Selección (SEACE)",
        color: "text-blue-800",
        bg: "bg-blue-100",
        border: "border-blue-300",
      };
    case "PENDIENTE_INICIO_CONDICIONES":
      return {
        label: "Pendiente Inicio (Art. 176)",
        color: "text-rose-800",
        bg: "bg-rose-100",
        border: "border-rose-300",
      };
    case "EN_EJECUCION":
      return {
        label: "En Ejecución de Obra",
        color: "text-emerald-800",
        bg: "bg-emerald-100",
        border: "border-emerald-300",
      };
    case "RECEPCIONADA":
      return {
        label: "Recepcionada",
        color: "text-teal-800",
        bg: "bg-teal-100",
        border: "border-teal-300",
      };
    case "FINALIZADA_LIQUIDADA":
      return {
        label: "Liquidada / Finalizada",
        color: "text-purple-800",
        bg: "bg-purple-100",
        border: "border-purple-300",
      };
  }
}

export function getAlertasNormativas(p: ProyectoCartera): string[] {
  const alertas: string[] = [];

  // 1. Actos Preparatorios
  const hitoTdr = p.hitos.find((h) => h.id === "hito-tdr");
  if (hitoTdr && !hitoTdr.cumplido && (p.contratoSupervisionNumero.includes("FALTA") || p.estado === "ACTOS_PREPARATORIOS")) {
    alertas.push("Falta TDR de Supervisión");
  }
  const hitoBases = p.hitos.find((h) => h.id === "hito-bases");
  if (hitoBases && !hitoBases.cumplido) {
    alertas.push("Falta Elaborar Bases");
  }

  // 2. Art. 176
  const hitoNotifSup = p.hitos.find((h) => h.id === "hito-notif-sup");
  if (hitoNotifSup && !hitoNotifSup.cumplido && p.contratoEjecucionNumero.startsWith("CONTRATO")) {
    alertas.push("Falta Notificar Supervisor (Art. 176.1.a)");
  }
  const hitoExp = p.hitos.find((h) => h.id === "hito-expediente");
  if (hitoExp && !hitoExp.cumplido && p.contratoEjecucionNumero.startsWith("CONTRATO")) {
    alertas.push("Falta Entrega de Expediente Técnico (Art. 176.1.c)");
  }
  const hitoTerreno = p.hitos.find((h) => h.id === "hito-terreno");
  if (hitoTerreno && !hitoTerreno.cumplido && p.contratoEjecucionNumero.startsWith("CONTRATO")) {
    alertas.push("Falta Acta de Terreno (Art. 176.1.b)");
  }
  const hitoInicio = p.hitos.find((h) => h.id === "hito-acta-inicio");
  if (hitoInicio && !hitoInicio.cumplido && p.contratoEjecucionNumero.startsWith("CONTRATO")) {
    alertas.push("Falta Acta de Inicio de Obra");
  }

  // 3. Ejecución
  const hitoValo1 = p.hitos.find((h) => h.id === "hito-valo-01");
  if (hitoValo1 && !hitoValo1.cumplido && p.estado === "EN_EJECUCION") {
    alertas.push("Falta pasar Valo 01 de Supervisión");
  }

  // 4. Recepción & Liquidación
  if (p.estado === "RECEPCIONADA") {
    const hitoLiq = p.hitos.find((h) => h.id === "hito-liquidacion");
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
  const isLiquidacion =
    p.estado === "FINALIZADA_LIQUIDADA" ||
    (p.estado as string).toLowerCase().includes("liquid") ||
    !!p.hitos?.find((h) => h.id === "hito-liquidacion")?.cumplido;

  const isCulminada =
    !isLiquidacion &&
    (p.estado === "RECEPCIONADA" ||
      (p.estado as string).toLowerCase().includes("recep") ||
      (p.estado as string).toLowerCase().includes("culmin") ||
      !!p.hitos?.find((h) => h.id === "hito-recepcion")?.cumplido);

  const isEjecucion =
    !isCulminada &&
    !isLiquidacion &&
    (p.estado === "EN_EJECUCION" || !!p.inicioObraFecha);

  if (isCulminada) {
    return {
      statusKey: "culminada" as const,
      container: "bg-rose-50/90 border-rose-300 text-rose-950",
      title: "text-rose-950",
      count: "text-rose-700",
      pct: "text-rose-800",
      barTrack: "border-rose-200 bg-rose-100/70",
      barFill: "bg-rose-500",
      badge: "bg-rose-100 text-rose-800 border-rose-300",
      label: "Culminó la Obra (Rojo Bajo)",
      shortLabel: "Culminada",
      tagColor: "bg-rose-100 text-rose-800 border-rose-200",
      icon: "🏁",
      borderAccent: "border-l-4 border-l-rose-400",
    };
  }
  if (isLiquidacion) {
    return {
      statusKey: "liquidacion" as const,
      container: "bg-amber-50/90 border-amber-300 text-amber-950",
      title: "text-amber-950",
      count: "text-amber-700",
      pct: "text-amber-800",
      barTrack: "border-amber-200 bg-amber-100/70",
      barFill: "bg-amber-500",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      label: "En Liquidación (Amarillo Bajo)",
      shortLabel: "En Liquidación",
      tagColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "⚖️",
      borderAccent: "border-l-4 border-l-amber-400",
    };
  }
  if (isEjecucion) {
    return {
      statusKey: "ejecucion" as const,
      container: "bg-emerald-50/90 border-emerald-300 text-emerald-950",
      title: "text-emerald-950",
      count: "text-emerald-700",
      pct: "text-emerald-800",
      barTrack: "border-emerald-200 bg-emerald-100/70",
      barFill: "bg-emerald-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      label: "En Ejecución (Verde)",
      shortLabel: "En Ejecución",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "🚧",
      borderAccent: "border-l-4 border-l-emerald-500",
    };
  }
  return {
    statusKey: "inicio" as const,
    container: "bg-sky-50/90 border-sky-300 text-sky-950",
    title: "text-sky-950",
    count: "text-sky-700",
    pct: "text-sky-800",
    barTrack: "border-sky-200 bg-sky-100/70",
    barFill: "bg-sky-500",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    label: "Pendiente Inicio",
    shortLabel: "Pendiente",
    tagColor: "bg-sky-100 text-sky-800 border-sky-200",
    icon: "⏳",
    borderAccent: "border-l-4 border-l-sky-400",
  };
}
