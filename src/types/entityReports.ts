export type CategoriaDocumentoOEI =
  | "LOCADORES"
  | "JEFE_OEI"
  | "GERENTE_INVERSIONES"
  | "NOTAS_MEMORANDUMS"
  | "VALORIZACIONES";

export type TipoDocumentoOEI =
  // Locadores de Servicios & Órdenes de Servicio
  | "CARTA_INFORME_LOCADOR"
  | "INFORME_CONFORMIDAD_LOCADOR"
  | "MEMO_TRAMITE_PAGO_LOCADOR"
  // Jefe de Oficina de Ejecución de Inversiones (OEI)
  | "INFORME_ESTADO_SITUACIONAL_OEI"
  | "INFORME_APROBACION_ADICIONAL_OEI"
  | "INFORME_AMPLIACION_PLAZO_OEI"
  | "INFORME_INSPECCION_TECNICA_OEI"
  | "INFORME_PENALIDADES_NOTIFICACION_OEI"
  // Gerente de Inversiones / Infraestructura (GDI / GDUI / GI)
  | "INFORME_GERENCIAL_ELEVACION"
  | "INFORME_RENDICION_CARTERA_PMI"
  | "INFORME_LIQUIDACION_CIERRE_INVIERTE"
  // Notas Informativas & Memorándums Internos
  | "NOTA_INFORMATIVA_INTERNA"
  | "MEMORANDUM_REQUERIMIENTO_PRESUPUESTAL"
  | "MEMORANDUM_COORDINACION_LEGAL"
  // Valorizaciones de Obra (Rioja / OSCE)
  | "INFORME_TECNICO_CONFORMIDAD"
  | "INFORME_SUPERVISION"
  | "MEMORANDO_PAGO_TESORERIA";

export type TipoInformeEntidad = TipoDocumentoOEI;

export interface EntityValuationReportConfig {
  id: string;
  categoriaDocumento?: CategoriaDocumentoOEI;
  tipoInforme: TipoDocumentoOEI;
  numeroDocumento: string; // e.g. "INFORME TÉCNICO N° 024-2026-MPR/GDUI/SGOPC"
  fechaDocumento: string; // e.g. "28 de Mayo de 2025" o fecha actual
  lugarFecha: string; // e.g. "Rioja, 28 de Mayo de 2025"
  
  // Entidad
  entidadNombre: string; // "MUNICIPALIDAD PROVINCIAL DE RIOJA"
  entidadRuc: string; // "20148174415"
  entidadGerencia: string; // "GERENCIA DE DESARROLLO URBANO E INFRAESTRUCTURA"
  entidadSubgerencia: string; // "OFICINA DE EJECUCIÓN DE INVERSIONES (OEI)"
  
  // Autoridades / Destinatario & Remitente
  destinatarioNombre: string; // "Ing. Carlos Mendoza Pinedo"
  destinatarioCargo: string; // "Gerente de Desarrollo Urbano e Infraestructura"
  destinatarioEntidad: string; // "Municipalidad Provincial de Rioja"
  
  remitenteNombre: string; // "Ing. Wilson Tafur Vargas"
  remitenteCargo: string; // "Jefe de la Oficina de Ejecución de Inversiones"
  remitenteCip: string; // "CIP 198421"
  remitenteDni?: string; // "46890112"

  // Datos específicos de Locadores de Servicios (O.S. / Consultores / Terceros OEI)
  locadorNombre?: string;
  locadorDni?: string;
  locadorRuc?: string;
  locadorProfesion?: string;
  locadorCip?: string;
  ordenServicioNumero?: string;
  ordenServicioFecha?: string;
  metaPresupuestal?: string;
  fuenteFinanciamiento?: string;
  montoHonorarioMensual?: number;
  montoHonorarioTotal?: number;
  numeroEntregable?: number | string;
  reciboHonorariosNumero?: string;
  periodoServicio?: string;
  actividadesRealizadas?: string[];
  entregablesPresentados?: string[];
  penalidadServicioMonto?: number;
  conformidadOtorgada?: boolean;

  // Datos específicos de Jefatura OEI y Gerencia de Inversiones
  jefeOeiNombre?: string;
  jefeOeiCargo?: string;
  jefeOeiCip?: string;
  gerenteInversionesNombre?: string;
  gerenteInversionesCargo?: string;
  gerenteInversionesCip?: string;
  gerenteMunicipalNombre?: string;
  gerenteMunicipalCargo?: string;

  // Textos y Análisis Técnico Documental
  antecedentesTexto?: string;
  analisisTecnicoTexto?: string;
  baseLegalList?: string[];
  novedadesRiesgos?: string[];
  accionesRequeridas?: string[];
  causalInvocada?: string;
  diasAmpliacionSolicitados?: number;
  diasAmpliacionProcedentes?: number;
  montoAdicionalSolicitado?: number;
  incidenciaPorcentualAdicional?: number;
  proyectoResolucionNumero?: string;

  // Supervisor de Obra (para obras/valorizaciones)
  supervisorNombre?: string; // "Ing. Wilson Tafur Vargas"
  supervisorCip?: string; // "CIP 218904"
  supervisorEmpresa?: string; // "Consorcio Supervisor Alto Mayo" o "Supervisor Principal de Obra"
  supervisorCartaNumero?: string; // "CARTA N° 038-2025-CSAM/SO"
  supervisorCartaFecha?: string; // "04 de Junio de 2025"

  // Contratista & Residente (para obras/valorizaciones)
  contratistaRazonSocial?: string; // "CONSORCIO VIAL RIOJA"
  contratistaRuc?: string; // "20608912341"
  residenteNombre?: string; // "Ing. Jhon Franklin Rojas Silva"
  residenteCip?: string; // "CIP 184512"
  residenteCartaNumero?: string; // "CARTA N° 022-2025-CVR/RO"
  residenteCartaFecha?: string; // "31 de Mayo de 2025"

  // Datos Contractuales de la Obra
  cui: string; // "2489102"
  nombreObra: string; // "MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS DE TRANSITABILIDAD URBANA EN EL JR. COLÓN, JR. SAN MARTÍN Y PRINCIPALES VÍAS DEL DISTRITO DE RIOJA - PROVINCIA DE RIOJA - DEPARTAMENTO DE SAN MARTÍN"
  contratoNumero: string; // "CONTRATO DE EJECUCIÓN DE OBRA N° 018-2025-MPR/GM"
  fechaFirmaContrato: string; // "08/01/2025"
  procesoSeleccion: string; // "LICITACIÓN PÚBLICA N° 002-2025-MPR/CS - PRIMERA CONVOCATORIA"
  sistemaContratacion: "A Precios Unitarios" | "A Suma Alzada" | "Esquema Mixto";
  plazoContractualDias: number; // 180
  fechaEntregaTerreno: string; // "15/01/2025"
  fechaInicioPlazo: string; // "16/01/2025"
  fechaFinContractual: string; // "14/07/2025"
  fechaFinReprogramada: string; // "14/07/2025"
  montoContratoOriginal: number; // S/ 4,580,250.00
  montoAdicionalesAprobados: number; // 0
  montoDeductivosAprobados: number; // 0
  montoContratoVigente: number; // S/ 4,580,250.00

  // Datos Específicos de la Valorización Mensual
  numeroValorizacion: number; // 4
  mesPeriodo: string; // "Mes 4 - Mayo 2025"
  periodoInicio: string; // "01/05/2025"
  periodoFin: string; // "31/05/2025"
  
  // Avance Físico
  montoProgramadoMes: number; // 916,050.00
  porcentajeProgramadoMes: number; // 20.00%
  montoEjecutadoMes: number; // 961,852.50
  porcentajeEjecutadoMes: number; // 21.00%
  
  montoProgramadoAcumulado: number; // 3,206,175.00
  porcentajeProgramadoAcumulado: number; // 70.00%
  montoEjecutadoAcumulado: number; // 3,343,582.50
  porcentajeEjecutadoAcumulado: number; // 73.00%
  
  // Liquidación Financiera Mensual
  valorizacionBruta: number; // = montoEjecutadoMes (961,852.50)
  factorKReajuste: number; // 1.024
  reajusteMontoK: number; // 23,084.46
  deduccionReajusteNoCorresponde: number; // 2,308.45
  reajusteNeto: number; // 20,776.01
  
  // Adelantos y Amortizaciones
  adelantoDirectoOtorgado: number; // 458,025.00
  amortizacionAdelantoDirectoMes: number; // 96,185.25
  amortizacionAdelantoDirectoAcumulada: number; // 334,358.25
  saldoAdelantoDirecto: number; // 123,666.75
  
  adelantoMaterialesOtorgado: number; // 916,050.00
  amortizacionMaterialesMes: number; // 96,185.25
  amortizacionMaterialesAcumulada: number; // 288,555.75
  saldoAdelantoMateriales: number; // 627,494.25
  
  // Retenciones y Penalidades
  retencionFondoGarantiaMes: number; // 0
  penalidadesMora: number; // 0
  otrasPenalidades: number; // 0
  
  // Totales
  montoNetoAPagar: number; // 789,482.01
  igv18Pct: number; // 142,106.76
  totalFacturarCancelar: number; // 931,588.77
  montoTotalLetras: string; // "NOVECIENTOS TREINTA Y UN MIL QUINIENTOS OCHENTA Y OCHO Y 77/100 SOLES"

  // Controles de Obra y Cumplimiento
  controlCalidadDetalle: string;
  controlSSTDetalle: string;
  controlCuadernoObraDetalle: string;
  controlPersonalClaveDetalle: string;

  // Asuntos Conclusiones & Recomendaciones
  asuntoTexto: string;
  referenciaTexto: string;
  conclusiones: string[];
  recomendaciones: string[];
}

export const SAMPLE_RIOJA_ENTITY_REPORT: EntityValuationReportConfig = {
  id: "report-rioja-val-04",
  tipoInforme: "INFORME_TECNICO_CONFORMIDAD",
  numeroDocumento: "INFORME TÉCNICO N° 024-2025-MPR/GDUI/SGOPC",
  fechaDocumento: "28 de Mayo de 2025",
  lugarFecha: "Rioja, 28 de Mayo de 2025",
  
  entidadNombre: "MUNICIPALIDAD PROVINCIAL DE RIOJA",
  entidadRuc: "20148174415",
  entidadGerencia: "GERENCIA DE DESARROLLO URBANO E INFRAESTRUCTURA",
  entidadSubgerencia: "SUBGERENCIA DE OBRAS PÚBLICAS Y CATASTRO",
  
  destinatarioNombre: "Ing. Carlos Mendoza Pinedo",
  destinatarioCargo: "Gerente de Desarrollo Urbano e Infraestructura",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",
  
  remitenteNombre: "Ing. Vanessa Dávila Ruiz",
  remitenteCargo: "Especialista en Valorizaciones y Liquidaciones de Obra",
  remitenteCip: "CIP 198421",
  remitenteDni: "46890112",

  supervisorNombre: "Ing. Wilson Tafur Vargas",
  supervisorCip: "CIP 218904",
  supervisorEmpresa: "Consorcio Supervisor Alto Mayo",
  supervisorCartaNumero: "CARTA N° 038-2025-CSAM/SO",
  supervisorCartaFecha: "04 de Junio de 2025",

  contratistaRazonSocial: "CONSORCIO VIAL RIOJA",
  contratistaRuc: "20608912341",
  residenteNombre: "Ing. Jhon Franklin Rojas Silva",
  residenteCip: "CIP 184512",
  residenteCartaNumero: "CARTA N° 022-2025-CVR/RO",
  residenteCartaFecha: "31 de Mayo de 2025",

  cui: "2489102",
  nombreObra: "MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS DE TRANSITABILIDAD URBANA EN EL JR. COLÓN, JR. SAN MARTÍN Y PRINCIPALES VÍAS DEL DISTRITO DE RIOJA - PROVINCIA DE RIOJA - DEPARTAMENTO DE SAN MARTÍN",
  contratoNumero: "CONTRATO DE EJECUCIÓN DE OBRA N° 018-2025-MPR/GM",
  fechaFirmaContrato: "08/01/2025",
  procesoSeleccion: "LICITACIÓN PÚBLICA N° 002-2025-MPR/CS - PRIMERA CONVOCATORIA",
  sistemaContratacion: "A Precios Unitarios",
  plazoContractualDias: 180,
  fechaEntregaTerreno: "15/01/2025",
  fechaInicioPlazo: "16/01/2025",
  fechaFinContractual: "14/07/2025",
  fechaFinReprogramada: "14/07/2025",
  montoContratoOriginal: 4580250.00,
  montoAdicionalesAprobados: 0,
  montoDeductivosAprobados: 0,
  montoContratoVigente: 4580250.00,

  numeroValorizacion: 4,
  mesPeriodo: "Mes 4 - Mayo 2025",
  periodoInicio: "01/05/2025",
  periodoFin: "31/05/2025",
  
  montoProgramadoMes: 916050.00,
  porcentajeProgramadoMes: 20.00,
  montoEjecutadoMes: 961852.50,
  porcentajeEjecutadoMes: 21.00,
  
  montoProgramadoAcumulado: 3206175.00,
  porcentajeProgramadoAcumulado: 70.00,
  montoEjecutadoAcumulado: 3343582.50,
  porcentajeEjecutadoAcumulado: 73.00,
  
  valorizacionBruta: 961852.50,
  factorKReajuste: 1.024,
  reajusteMontoK: 23084.46,
  deduccionReajusteNoCorresponde: 2308.45,
  reajusteNeto: 20776.01,
  
  adelantoDirectoOtorgado: 458025.00,
  amortizacionAdelantoDirectoMes: 96185.25,
  amortizacionAdelantoDirectoAcumulada: 334358.25,
  saldoAdelantoDirecto: 123666.75,
  
  adelantoMaterialesOtorgado: 916050.00,
  amortizacionMaterialesMes: 96185.25,
  amortizacionMaterialesAcumulada: 288555.75,
  saldoAdelantoMateriales: 627494.25,
  
  retencionFondoGarantiaMes: 0,
  penalidadesMora: 0,
  otrasPenalidades: 0,
  
  montoNetoAPagar: 789482.01,
  igv18Pct: 142106.76,
  totalFacturarCancelar: 931588.77,
  montoTotalLetras: "NOVECIENTOS TREINTA Y UN MIL QUINIENTOS OCHENTA Y OCHO Y 77/100 SOLES",

  controlCalidadDetalle: "Conforme. Se adjuntan 12 certificados de rotura de probetas de concreto f'c=210 kg/cm2 con resistencias promedio del 104% a los 28 días, ensayos de proctor modificado y densidades de campo al 98% de la MDS debidamente validados por el Laboratorio de Suelos y Materiales.",
  controlSSTDetalle: "Conforme. No se reportaron incidentes ni accidentes de trabajo en el periodo. Se verifica dotación completa de EPP reglamentario y ejecución de charlas de seguridad de 5 minutos y señalización de desvíos viales.",
  controlCuadernoObraDetalle: "Conforme. Registro de 28 asientos digitales en la plataforma del Cuaderno de Obra Digital (COD) de la Municipalidad Provincial de Rioja (Asientos del N° 78 al N° 105), con absolución técnica oportuna por parte del Supervisor.",
  controlPersonalClaveDetalle: "Conforme. Se constató la permanencia al 100% en obra del Residente de Obra, Especialista en Calidad y Especialista en Seguridad y Salud Ocupacional, sin infracción al Art. 190 del RLCE.",

  asuntoTexto: "APROBACIÓN, CONFORMIDAD TÉCNICA Y TRÁMITE DE PAGO DE LA VALORIZACIÓN N° 04 (CORRESPONDIENTE AL MES DE MAYO 2025) DEL CONTRATO DE EJECUCIÓN DE OBRA N° 018-2025-MPR/GM - CUI N° 2489102",
  referenciaTexto: "a) Contrato de Ejecución de Obra N° 018-2025-MPR/GM\nb) Carta N° 038-2025-CSAM/SO (Informe Mensual de Supervisión N° 04)\nc) Carta N° 022-2025-CVR/RO (Presentación de Valorización N° 04 del Contratista)\nd) Artículos 194, 195 y 198 del D.S. N° 344-2018-EF (Reglamento de la Ley de Contrataciones del Estado)",
  conclusiones: [
    "Se otorga la CONFORMIDAD TÉCNICA Y FINANCIERA a la Valorización N° 04 del mes de Mayo 2025, presentada por el CONSORCIO VIAL RIOJA y revisada minuciosamente por la Supervisión CONSORCIO SUPERVISOR ALTO MAYO.",
    "El avance físico ejecutado acumulado al mes de Mayo 2025 es de 73.00% (S/ 3,343,582.50), superando el avance programado acumulado de 70.00% (S/ 3,206,175.00), situándose la obra en estado ADELANTADA respecto al cronograma vigente.",
    "Los metrados valorizados han sido verificados in situ en los jirones Colón y San Martín de Rioja, constatando su correspondencia exacta con las partidas efectivamente ejecutadas y cumpliendo con las especificaciones técnicas.",
    "El monto neto a favor del contratista asciende a S/ 789,482.01, más el Impuesto General a las Ventas (18%) de S/ 142,106.76, totalizando la suma de S/ 931,588.77 (NOVECIENTOS TREINTA Y UN MIL QUINIENTOS OCHENTA Y OCHO Y 77/100 SOLES)."
  ],
  recomendaciones: [
    "APROBAR mediante acto resolutivo o proveído técnico de la Gerencia de Desarrollo Urbano e Infraestructura la Valorización N° 04 por el monto total de S/ 931,588.77 (con IGV incluido).",
    "DERIVAR con celeridad el presente informe y el expediente original a la Gerencia de Administración y Finanzas, Subgerencia de Contabilidad y Tesorería para la fase de Devengado y Giro respectivo dentro del plazo legal estipulado en el Art. 194.5 del RLCE.",
    "NOTIFICAR formalmente copia del proveído de conformidad al Contratista Ejecutor CONSORCIO VIAL RIOJA y a la Supervisión de Obra para los fines de control interno municipal."
  ]
};

// ========================================================
// PLANTILLA 1: INFORME DE CONFORMIDAD DE LOCADOR DE SERVICIOS (OEI)
// ========================================================
export const SAMPLE_RIOJA_LOCADOR_CONFORMIDAD: EntityValuationReportConfig = {
  id: "doc-locador-conf-01",
  categoriaDocumento: "LOCADORES",
  tipoInforme: "INFORME_CONFORMIDAD_LOCADOR",
  numeroDocumento: "INFORME DE CONFORMIDAD N° 042-2025-MPR/GDUI/OEI",
  fechaDocumento: "02 de Junio de 2025",
  lugarFecha: "Rioja, 02 de Junio de 2025",

  entidadNombre: "MUNICIPALIDAD PROVINCIAL DE RIOJA",
  entidadRuc: "20148174415",
  entidadGerencia: "GERENCIA DE DESARROLLO URBANO E INFRAESTRUCTURA",
  entidadSubgerencia: "OFICINA DE EJECUCIÓN DE INVERSIONES (OEI)",

  destinatarioNombre: "Lic. Maritza Huamán Delgado",
  destinatarioCargo: "Subgerente de Logística y Control Patrimonial",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",

  remitenteNombre: "Ing. Wilson Tafur Vargas",
  remitenteCargo: "Jefe de la Oficina de Ejecución de Inversiones",
  remitenteCip: "CIP 218904",
  remitenteDni: "42109845",

  locadorNombre: "Ing. Kevin Alexander Paredes Flores",
  locadorDni: "72910485",
  locadorRuc: "10729104851",
  locadorProfesion: "Ingeniero Civil - Especialista en Control de Obras y Seguimiento Técnico",
  locadorCip: "CIP 289410",
  ordenServicioNumero: "ORDEN DE SERVICIO N° 0000452-2025",
  ordenServicioFecha: "15/01/2025",
  metaPresupuestal: "0048 - MEJORAMIENTO DE LA INFRAESTRUCTURA VIAL Y TRANSITABILIDAD",
  fuenteFinanciamiento: "Recursos Determinados - Canon, Sobrecanon y Regalías",
  montoHonorarioMensual: 4500.00,
  montoHonorarioTotal: 27000.00,
  numeroEntregable: "Entregable N° 04 (Cuarto Pago)",
  reciboHonorariosNumero: "E001-48",
  periodoServicio: "Del 01 de Mayo al 31 de Mayo de 2025",
  penalidadServicioMonto: 0,
  conformidadOtorgada: true,

  cui: "2489102",
  nombreObra: "MEJORAMIENTO Y AMPLIACIÓN DE LOS SERVICIOS DE TRANSITABILIDAD URBANA EN EL JR. COLÓN, JR. SAN MARTÍN Y PRINCIPALES VÍAS DEL DISTRITO DE RIOJA - PROVINCIA DE RIOJA - SAN MARTÍN",
  contratoNumero: "ORDEN DE SERVICIO N° 0000452-2025",
  fechaFirmaContrato: "15/01/2025",
  procesoSeleccion: "CONTRATACIÓN DIRECTA MENOR A 8 UIT - LEY 30225",
  sistemaContratacion: "A Suma Alzada",
  plazoContractualDias: 180,
  fechaEntregaTerreno: "16/01/2025",
  fechaInicioPlazo: "16/01/2025",
  fechaFinContractual: "14/07/2025",
  fechaFinReprogramada: "14/07/2025",
  montoContratoOriginal: 27000.00,
  montoAdicionalesAprobados: 0,
  montoDeductivosAprobados: 0,
  montoContratoVigente: 27000.00,

  numeroValorizacion: 4,
  mesPeriodo: "Mayo 2025",
  periodoInicio: "01/05/2025",
  periodoFin: "31/05/2025",
  montoProgramadoMes: 4500,
  porcentajeProgramadoMes: 16.67,
  montoEjecutadoMes: 4500,
  porcentajeEjecutadoMes: 16.67,
  montoProgramadoAcumulado: 18000,
  porcentajeProgramadoAcumulado: 66.67,
  montoEjecutadoAcumulado: 18000,
  porcentajeEjecutadoAcumulado: 66.67,

  valorizacionBruta: 4500,
  factorKReajuste: 1.0,
  reajusteMontoK: 0,
  deduccionReajusteNoCorresponde: 0,
  reajusteNeto: 0,
  adelantoDirectoOtorgado: 0,
  amortizacionAdelantoDirectoMes: 0,
  amortizacionAdelantoDirectoAcumulada: 0,
  saldoAdelantoDirecto: 0,
  adelantoMaterialesOtorgado: 0,
  amortizacionMaterialesMes: 0,
  amortizacionMaterialesAcumulada: 0,
  saldoAdelantoMateriales: 0,
  retencionFondoGarantiaMes: 0,
  penalidadesMora: 0,
  otrasPenalidades: 0,
  montoNetoAPagar: 4500.00,
  igv18Pct: 0,
  totalFacturarCancelar: 4500.00,
  montoTotalLetras: "CUATRO MIL QUINIENTOS Y 00/100 SOLES",

  controlCalidadDetalle: "El locador ha presentado oportunamente el informe de revisión de ensayos de calidad y densidades de campo remitidos por la supervisión.",
  controlSSTDetalle: "El locador ha participado activamente en la verificación de implementación de medidas de seguridad en zanjas y desvíos vehiculares.",
  controlCuadernoObraDetalle: "Se verificó el seguimiento continuo a las anotaciones del Cuaderno de Obra Digital de los proyectos asignados.",
  controlPersonalClaveDetalle: "Conformidad total de asistencia y prestación efectiva en las instalaciones de la OEI y visitas de campo.",

  asuntoTexto: "CONFORMIDAD DE PRESTACIÓN DEL SERVICIO Y AUTORIZACIÓN DE PAGO - CUARTO ENTREGABLE (MAYO 2025) - ORDEN DE SERVICIO N° 0000452-2025 - LOCADOR: ING. KEVIN ALEXANDER PAREDES FLORES",
  referenciaTexto: "a) Orden de Servicio N° 0000452-2025\nb) Carta N° 005-2025-KAPF (Presentación de Informe Mensual de Actividades N° 04 del Locador)\nc) Recibo por Honorarios Electrónico N° E001-48\nd) Términos de Referencia del Servicio de Asistencia Técnica",
  
  antecedentesTexto: "Mediante Orden de Servicio N° 0000452-2025, la Municipalidad Provincial de Rioja contrató los servicios del Ing. Kevin Alexander Paredes Flores para desempeñar la función de Asistencia Técnica en Control de Obras y Seguimiento de Valorizaciones para la Oficina de Ejecución de Inversiones, por un plazo de 180 días calendario y un honorario mensual de S/ 4,500.00 soles.",
  
  analisisTecnicoTexto: "La Jefatura de la Oficina de Ejecución de Inversiones (OEI), en su condición de área usuaria e inspectora del servicio, ha procedido a revisar el Cuarto Entregable mensual, constatando que el contratado ha cumplido satisfactoriamente con la totalidad de metas, actividades programadas y entrega de reportes técnicos exigidos en los Términos de Referencia.",

  actividadesRealizadas: [
    "Monitoreo diario in situ del avance físico de la obra de transitabilidad en Jr. Colón y Jr. San Martín (CUI 2489102), verificando vaciado de pavimentos y veredas.",
    "Revisión técnica de la Valorización Mensual N° 04 presentada por el Consorcio Vial Rioja y contrastación con el informe de la supervisión.",
    "Inspección de las partidas de movimiento de tierras, subrasante y ensayos de densidad de campo Proctort Modificado.",
    "Actualización del estado físico-financiero de las inversiones prioritarias de la Gerencia de Desarrollo Urbano en el Sistema de Seguimiento de Inversiones (SSI - Invierte.pe).",
    "Elaboración de informes de compatibilidad técnica y apoyo en la absolución de consultas sobre interferencias de redes de agua potable."
  ],

  entregablesPresentados: [
    "Informe Técnico Mensual de Actividades N° 04 debidamente suscrito y foliado.",
    "Panel fotográfico a color con georreferenciación de los trabajos verificados en campo.",
    "Reporte de seguimiento de valorizaciones y curva S de obras viales urbanas.",
    "Recibo por Honorarios Electrónico N° E001-48 por la suma de S/ 4,500.00 soles.",
    "Constancia de RNP vigente (Registro Nacional de Proveedores) y Ficha RUC Activo y Habido."
  ],

  baseLegalList: [
    "Texto Único Ordenado de la Ley N° 30225, Ley de Contrataciones del Estado (aprobado por D.S. N° 082-2019-EF).",
    "Decreto Supremo N° 344-2018-EF y modificatorias (Reglamento de la Ley de Contrataciones del Estado).",
    "Decreto Legislativo N° 1252 que crea el Sistema Nacional de Programación Multianual y Gestión de Inversiones (Invierte.pe).",
    "Directiva Interna sobre Procedimiento de Trámite de Pago a Locadores de Servicios de la Municipalidad Provincial de Rioja."
  ],

  conclusiones: [
    "El locador de servicios ING. KEVIN ALEXANDER PAREDES FLORES ha cumplido al 100% y a entera satisfacción con las actividades correspondientes al Cuarto Entregable del mes de Mayo 2025.",
    "El servicio se prestó con estricto apego a los Términos de Referencia y dentro del plazo pactado, por lo que NO PROCEDE la aplicación de penalidades por mora.",
    "Corresponde otorgar la CONFORMIDAD DE PRESTACIÓN DE SERVICIOS por el monto de S/ 4,500.00 (CUATRO MIL QUINIENTOS Y 00/100 SOLES)."
  ],

  recomendaciones: [
    "Otorgar la CONFORMIDAD TÉCNICA del área usuaria a la prestación de servicios del locador ING. KEVIN ALEXANDER PAREDES FLORES.",
    "Remitir el expediente completo a la Subgerencia de Logística y Control Patrimonial, con copia a la Subgerencia de Contabilidad y Tesorería, para el respectivo Devengado y Giro con cargo a la Meta 0048."
  ]
};

// ========================================================
// PLANTILLA 2: CARTA DEL LOCADOR DE SERVICIOS A LA OEI
// ========================================================
export const SAMPLE_RIOJA_CARTA_LOCADOR: EntityValuationReportConfig = {
  ...SAMPLE_RIOJA_LOCADOR_CONFORMIDAD,
  id: "doc-carta-locador-01",
  tipoInforme: "CARTA_INFORME_LOCADOR",
  numeroDocumento: "CARTA N° 005-2025-KAPF/AT-OEI",
  fechaDocumento: "31 de Mayo de 2025",
  lugarFecha: "Rioja, 31 de Mayo de 2025",

  destinatarioNombre: "Ing. Wilson Tafur Vargas",
  destinatarioCargo: "Jefe de la Oficina de Ejecución de Inversiones",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",

  remitenteNombre: "Ing. Kevin Alexander Paredes Flores",
  remitenteCargo: "Locador de Servicios - Asistente Técnico en Control de Obras",
  remitenteCip: "CIP 289410",
  remitenteDni: "72910485",

  asuntoTexto: "PRESENTA INFORME MENSUAL DE ACTIVIDADES N° 04 (MAYO 2025) Y SOLICITA CONFORMIDAD DE SERVICIO PARA TRÁMITE DE PAGO - ORDEN DE SERVICIO N° 0000452-2025",
  referenciaTexto: "a) Orden de Servicio N° 0000452-2025 (Asistencia Técnica en Control de Obras OEI)\nb) Términos de Referencia del Contrato de Locación de Servicios",

  conclusiones: [
    "He cumplido de manera cabal con la totalidad de los compromisos técnicos y actividades descritas en los TDR durante el periodo del 01 al 31 de Mayo de 2025.",
    "Adjunto el Recibo por Honorarios Electrónico N° E001-48 por la suma pactada de S/ 4,500.00 soles para los trámites respectivos."
  ],
  recomendaciones: [
    "Tener por presentado el Informe Mensual N° 04 y emitir la Conformidad de Servicio para su derivación a Logística y Tesorería."
  ]
};

// ========================================================
// PLANTILLA 3: INFORME SITUACIONAL DEL JEFE DE OEI AL GERENTE
// ========================================================
export const SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL: EntityValuationReportConfig = {
  ...SAMPLE_RIOJA_LOCADOR_CONFORMIDAD,
  id: "doc-jefe-oei-sit-01",
  categoriaDocumento: "JEFE_OEI",
  tipoInforme: "INFORME_ESTADO_SITUACIONAL_OEI",
  numeroDocumento: "INFORME TÉCNICO N° 058-2025-MPR/GDUI/OEI",
  fechaDocumento: "05 de Junio de 2025",
  lugarFecha: "Rioja, 05 de Junio de 2025",

  destinatarioNombre: "Ing. Carlos Mendoza Pinedo",
  destinatarioCargo: "Gerente de Desarrollo Urbano e Infraestructura",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",

  remitenteNombre: "Ing. Wilson Tafur Vargas",
  remitenteCargo: "Jefe de la Oficina de Ejecución de Inversiones",
  remitenteCip: "CIP 218904",
  remitenteDni: "42109845",

  asuntoTexto: "INFORME SITUACIONAL TÉCNICO, FÍSICO Y FINANCIERO AL CIERRE DE MAYO 2025 Y EVALUACIÓN DE PRESTACIÓN ADICIONAL DE OBRA N° 01 - CUI N° 2489102 (JR. COLÓN Y JR. SAN MARTÍN)",
  referenciaTexto: "a) Contrato de Ejecución de Obra N° 018-2025-MPR/GM\nb) Carta N° 038-2025-CSAM/SO (Informe Mensual N° 04 de Supervisión)\nc) Anotaciones N° 85 y N° 92 del Cuaderno de Obra Digital",

  antecedentesTexto: "La obra 'Mejoramiento y Ampliación de los Servicios de Transitabilidad Urbana en el Jr. Colón, Jr. San Martín y principales vías del distrito de Rioja' inició su plazo de ejecución el 16 de enero de 2025. Al 31 de mayo de 2025 se ha cumplido el cuarto mes de ejecución física bajo administración indirecta por contrata.",

  analisisTecnicoTexto: "1. ESTADO FÍSICO: La obra presenta un avance físico acumulado ejecutado de 73.00% versus un programado de 70.00%, encontrándose la obra con un estado ADELANTADA (+3.00%).\n2. ESTADO FINANCIERO: Se han devengado y pagado las valorizaciones 01, 02 y 03, encontrándose en trámite la valorización N° 04 por S/ 931,588.77. El gasto financiero devengado acumulado asciende al 72.8% del monto contractual.\n3. PRESTACIÓN ADICIONAL N° 01: En el tramo Jr. Colón Cdra. 04 y 05 se detectó un estrato de suelo limo-arcilloso con napa freática alta no contemplado en el estudio de suelos original, requiriéndose mejoramiento con pedraplén y geotextil no tejido por un monto estimado de S/ 185,420.00 (incidencia de 4.05% del monto original).",

  novedadesRiesgos: [
    "Interferencia no prevista con tubería de agua potable de AC de 4'' en la intersección Jr. Colón con Jr. Pardo (resuelto mediante coordinación con EMAPA Rioja).",
    "Necesidad de aprobar el Adicional N° 01 antes del 20 de junio para no afectar la ruta crítica de colocación de la carpeta asfáltica en caliente.",
    "El contratista y supervisor mantienen su personal clave al 100% de permanencia en obra."
  ],

  accionesRequeridas: [
    "Notificar al proyectista del expediente técnico para pronunciamiento sobre las fallas geotécnicas encontradas.",
    "Aprobar el Expediente Técnico de Prestación Adicional de Obra N° 01 y Deductivo Vinculante N° 01 mediante Resolución de Gerencia Municipal.",
    "Solicitar a la Gerencia de Planificación y Presupuesto la certificación de crédito presupuestario complementaria."
  ],

  conclusiones: [
    "La obra se encuentra con ritmo de avance favorable y adelantada respecto a su cronograma contractual vigente.",
    "La necesidad del Adicional de Obra N° 01 está técnicamente demostrada para garantizar la estabilidad estructural del pavimento y evitar asentamientos futuros.",
    "El monto del adicional (S/ 185,420.00) representa una incidencia del 4.05%, manteniéndose dentro de la potestad aprobatoria de la Entidad sin requerir autorización previa de la Contraloría General."
  ],

  recomendaciones: [
    "Elevar el presente informe con proveído favorable a la Gerencia Municipal para la emisión del acto resolutivo de aprobación del Adicional N° 01.",
    "Disponer que la Oficina de Logística verifique la ampliación de la garantía de fiel cumplimiento por parte del contratista."
  ]
};

// ========================================================
// PLANTILLA 4: INFORME GERENCIAL DE ELEVACIÓN (GERENTE INVERSIONES A GM)
// ========================================================
export const SAMPLE_RIOJA_GERENTE_ELEVACION: EntityValuationReportConfig = {
  ...SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL,
  id: "doc-gerente-elev-01",
  categoriaDocumento: "GERENTE_INVERSIONES",
  tipoInforme: "INFORME_GERENCIAL_ELEVACION",
  numeroDocumento: "INFORME GERENCIAL N° 088-2025-MPR/GDUI",
  fechaDocumento: "08 de Junio de 2025",
  lugarFecha: "Rioja, 08 de Junio de 2025",

  destinatarioNombre: "Abg. Miguel Ángel Díaz Torres",
  destinatarioCargo: "Gerente Municipal",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",

  remitenteNombre: "Ing. Carlos Mendoza Pinedo",
  remitenteCargo: "Gerente de Desarrollo Urbano e Infraestructura",
  remitenteCip: "CIP 154210",
  remitenteDni: "09451230",

  asuntoTexto: "ELEVACIÓN DE EXPEDIENTE TÉCNICO CON V°B° Y PROYECTO DE RESOLUCIÓN PARA APROBACIÓN DE LA PRESTACIÓN ADICIONAL DE OBRA N° 01 Y DEDUCTIVO VINCULANTE N° 01 - CUI N° 2489102",
  referenciaTexto: "a) Informe Técnico N° 058-2025-MPR/GDUI/OEI (Jefe de Oficina de Ejecución de Inversiones)\nb) Informe Técnico de Supervisión N° 014-2025-CSAM/SO\nc) Artículos 34 y 205 del Reglamento de la Ley de Contrataciones del Estado (D.S. N° 344-2018-EF)",

  conclusiones: [
    "Esta Gerencia de Desarrollo Urbano e Infraestructura hace suyos en todos sus extremos las conclusiones técnicas y fundamentos vertidos en el Informe Técnico N° 058-2025-MPR/GDUI/OEI emitido por el Jefe de la Oficina de Ejecución de Inversiones.",
    "El expediente técnico de la Prestación Adicional de Obra N° 01 cuenta con disponibilidad presupuestaria emitida por la Gerencia de Planificación y Presupuesto por el importe de S/ 185,420.00.",
    "Se cuenta con informe favorable de la Supervisión de Obra y no se altera el objeto de contratación."
  ],

  recomendaciones: [
    "APROBAR mediante RESOLUCIÓN DE GERENCIA MUNICIPAL la Prestación Adicional de Obra N° 01 por el monto de S/ 185,420.00 (con IGV incluido) y el Deductivo Vinculante N° 01 por S/ 21,300.00.",
    "NOTIFICAR la respectiva Resolución al Contratista Consorcio Vial Rioja, al Consorcio Supervisor Alto Mayo y al Órgano de Control Institucional (OCI) conforme a ley."
  ]
};

// ========================================================
// PLANTILLA 5: NOTA INFORMATIVA INTERNA (OEI / GERENCIA)
// ========================================================
export const SAMPLE_RIOJA_NOTA_INFORMATIVA: EntityValuationReportConfig = {
  ...SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL,
  id: "doc-nota-info-01",
  categoriaDocumento: "NOTAS_MEMORANDUMS",
  tipoInforme: "NOTA_INFORMATIVA_INTERNA",
  numeroDocumento: "NOTA INFORMATIVA N° 034-2025-MPR/GDUI/OEI",
  fechaDocumento: "10 de Junio de 2025",
  lugarFecha: "Rioja, 10 de Junio de 2025",

  destinatarioNombre: "Lic. Maritza Huamán Delgado",
  destinatarioCargo: "Subgerente de Logística y Control Patrimonial",
  destinatarioEntidad: "Municipalidad Provincial de Rioja",

  remitenteNombre: "Ing. Wilson Tafur Vargas",
  remitenteCargo: "Jefe de la Oficina de Ejecución de Inversiones",
  remitenteCip: "CIP 218904",
  remitenteDni: "42109845",

  asuntoTexto: "SOLICITA CELERIDAD EN ADQUISICIÓN DE PRUEBAS DE LABORATORIO Y MATERIALES PARA CONTROL DE CALIDAD DE OBRAS VIALES EN EJECUCIÓN",
  referenciaTexto: "Requerimiento N° 128-2025-MPR/GDUI/OEI (Meta 0048 - Canon)",

  conclusiones: [
    "Es imperativo contar con los testigos de concreto y densímetro nuclear antes del inicio de la colocación de carpeta asfáltica programada para el 15 de junio de 2025.",
    "La demora en la adquisición pondría en riesgo la fiscalización del aseguramiento de la calidad conforme a la norma CE.010 de Pavimentos Urbanos."
  ],

  recomendaciones: [
    "Priorizar la emisión de la orden de compra respectiva a fin de no generar paralizaciones o contingencias con los contratistas ejecutores."
  ]
};

// Map of all available official presets
export const PRESETS_DOCUMENTOS_OEI: Record<string, { label: string; desc: string; config: EntityValuationReportConfig }> = {
  "locador-conformidad": {
    label: "1. Informe de Conformidad de Locador (O.S. / OEI)",
    desc: "Emisión de conformidad del Jefe de OEI para pago de Recibo por Honorarios y entregable mensual",
    config: SAMPLE_RIOJA_LOCADOR_CONFORMIDAD,
  },
  "carta-locador": {
    label: "2. Carta del Locador Presentando Informe",
    desc: "Carta del tercero/locador presentando su informe mensual y entregables a la OEI",
    config: SAMPLE_RIOJA_CARTA_LOCADOR,
  },
  "jefe-oei-situacional": {
    label: "3. Informe Técnico Situacional (Jefe de OEI)",
    desc: "Informe situacional físico, financiero y legal de obra dirigido al Gerente de Inversiones",
    config: SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL,
  },
  "gerente-elevacion": {
    label: "4. Informe Gerencial de Elevación a Gerencia Municipal",
    desc: "Informe del Gerente de Inversiones con visto bueno y proyecto de resolución (adicional / ampliación)",
    config: SAMPLE_RIOJA_GERENTE_ELEVACION,
  },
  "nota-informativa": {
    label: "5. Nota Informativa / Memorándum Interno",
    desc: "Comunicación interdepartamental rápida entre OEI, Logística, Contabilidad y Asesoría Legal",
    config: SAMPLE_RIOJA_NOTA_INFORMATIVA,
  },
  "valorizacion-rioja": {
    label: "6. Informe Técnico de Valorización Mensual (Rioja)",
    desc: "Informe oficial de conformidad de valorización, planilla de liquidación, amortizaciones y retenciones",
    config: SAMPLE_RIOJA_ENTITY_REPORT,
  },
};

