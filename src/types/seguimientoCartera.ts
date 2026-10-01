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
  fecha?: string;
  documentoSustento?: string;
  observacion?: string;
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
  plazoDias?: number;
  fechaTerminoActualizado?: string;
  
  // Observaciones y Estado
  observaciones: string;
  estado: EstadoCartera;

  // Checklist de Hitos Normativos Interactivos (1-click)
  hitos: HitoNormativo[];
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

  // FASE 2: CONDICIONES PREVIAS PARA INICIO DE OBRA (Art. 176 RLCE)
  {
    id: "hito-notif-sup",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.a",
    nombre: "Notificación y Designación de Inspector / Supervisor",
    baseLegal: "Art. 176.1.a RLCE (D.S. 344-2018-EF / D.S. 009-2025-EF)",
  },
  {
    id: "hito-expediente",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.c",
    nombre: "Entrega del Expediente Técnico Completo",
    baseLegal: "Art. 176.1.c RLCE",
  },
  {
    id: "hito-terreno",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.1.b",
    nombre: "Entrega Total o Parcial de Terreno (Acta in situ)",
    baseLegal: "Art. 176.1.b RLCE",
  },
  {
    id: "hito-cod",
    fase: "CONDICIONES_INICIO",
    codigo: "DIR-OSCE-COD",
    nombre: "Apertura y Asignación de Cuaderno de Obra Digital",
    baseLegal: "Directiva N° 009-2020-OSCE/CD",
  },
  {
    id: "hito-acta-inicio",
    fase: "CONDICIONES_INICIO",
    codigo: "ART-176.2",
    nombre: "Suscripción de Acta de Inicio de Obra",
    baseLegal: "Art. 176.2 RLCE",
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

// Helper to create hitos with default values
export function createDefaultHitos(overrides: Partial<Record<string, boolean>> = {}): HitoNormativo[] {
  return HITOS_NORMATIVOS_BASE.map((h) => ({
    ...h,
    cumplido: overrides[h.id] ?? false,
  }));
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
    residenteNombre: "Ing. Pablo Henry Mayaute Huamani",
    residenteCip: "CIP 52916",
    contratoSupervisionNumero: "OS N°0001324",
    contratoSupervisionFechaFirma: "12/08/2026",
    contratoSupervisionMonto: 35500.00,
    contratoSupervisionEmpresa: "Z & Z CENTER FISH S.A.C.",
    supervisorNombre: "Ing. Segundo German Rios Vasquez",
    supervisorCip: "CIP 74049",
    entregaTerrenoFecha: "14/08/2026",
    inicioObraFecha: "16/08/2026",
    plazoDias: 60,
    fechaTerminoActualizado: "15/10/2026",
    observaciones: "- FALTA PASAR LA VALO 01 DE LA SUPERVISION",
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
      "hito-valo-01": false, // Alerta normativa: Falta pasar Valo 01
    }),
  },
  {
    id: 8,
    encargado: "JEZER",
    proyecto: "COBERTURA SAGRADO CORAZON DE JESUS",
    cui: "2684433",
    contratoEjecucionNumero: "CONTRATO N°057-2026-GAF/MPR",
    contratoEjecucionFechaFirma: "25/08/2026",
    contratoEjecucionMonto: 379576.27,
    contratoEjecucionEmpresa: "CONSORCIO EJECUTOR RIOJA",
    contratoSupervisionNumero: "OS N°0001401",
    contratoSupervisionFechaFirma: "18/08/2026",
    contratoSupervisionMonto: 28800.00,
    contratoSupervisionEmpresa: "GENESIS CAMILA CONTRATISTA GENERALES S.A.C.",
    observaciones: "- PARA ACTA DE ENTREGA DE TERRENO Y ACTA DE INICIO DE OBRA",
    estado: "PENDIENTE_INICIO_CONDICIONES",
    hitos: createDefaultHitos({
      "hito-tdr": true,
      "hito-bases": true,
      "hito-contrato-obra": true,
      "hito-contrato-sup": true,
      "hito-notif-sup": true,
      "hito-expediente": true,
      "hito-terreno": false, // Alerta: Falta entrega de terreno
      "hito-cod": false,
      "hito-acta-inicio": false, // Alerta: Falta acta de inicio
    }),
  },
  {
    id: 10,
    encargado: "-",
    proyecto: "COBERTURA-SAN AGUSTIN",
    cui: "2722218",
    contratoEjecucionNumero: "PUBLICADO 31/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Por Adjudicar en SEACE",
    contratoSupervisionNumero: "FALTA TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Acto Preparatorio",
    observaciones: "Publicado en SEACE el 31/07. Falta elaborar TDR para supervisión",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": false,
      "hito-bases": true,
    }),
  },
  {
    id: 11,
    encargado: "-",
    proyecto: "COBERTURA-2724099",
    cui: "2724099",
    contratoEjecucionNumero: "PUBLICADO 31/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Por Adjudicar en SEACE",
    contratoSupervisionNumero: "FALTA TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Acto Preparatorio",
    observaciones: "Publicado 31/07. Falta TDR para supervisión",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": false,
      "hito-bases": true,
    }),
  },
  {
    id: 12,
    encargado: "-",
    proyecto: "COBERTURA-BARRIOS ALTOS",
    cui: "2723034",
    contratoEjecucionNumero: "PUBLICADO 31/07",
    contratoEjecucionMonto: 0,
    contratoEjecucionEmpresa: "Por Adjudicar en SEACE",
    contratoSupervisionNumero: "FALTA TDR",
    contratoSupervisionMonto: 0,
    contratoSupervisionEmpresa: "Pendiente Acto Preparatorio",
    observaciones: "Publicado 31/07. Falta TDR para supervisión",
    estado: "ACTOS_PREPARATORIOS",
    hitos: createDefaultHitos({
      "hito-tdr": false,
      "hito-bases": true,
    }),
  },
  {
    id: 13,
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    encargado: "-",
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
    observaciones: "ACTA DE RECEPCIÓN 25/09/2026",
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
      "hito-recepcion": true, // Cumplido el 25/09/2026
      "hito-liquidacion": false,
    }),
  },
  {
    id: 22,
    encargado: "JEZER",
    proyecto: "COBERTURA SAN",
    cui: "2688943",
    contratoEjecucionNumero: "CONTRATO N° 047-2026",
    contratoEjecucionFechaFirma: "27/05/2026",
    contratoEjecucionMonto: 367786.71,
    contratoEjecucionEmpresa: "SANCHEZ",
    contratoSupervisionNumero: "OS N°0000939",
    contratoSupervisionFechaFirma: "10/06/2026",
    contratoSupervisionMonto: 19800.00,
    contratoSupervisionEmpresa: "CESPEDES MEDINA JR INMOBILIARIA",
    entregaTerrenoFecha: "22/06/2026",
    inicioObraFecha: "23/06/2026",
    plazoDias: 60,
    fechaTerminoActualizado: "21/08/2026",
    observaciones: "- FINALIZO - FALTA VALO DE LIQUIDACIÓN",
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
