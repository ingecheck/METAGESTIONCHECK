import {
  ObraProyecto,
  ValorizacionMensual,
  AsientoCuadernoObra,
  ModificacionObra,
  LiquidacionResumen,
  UserObraPackage,
} from "../types/obras";

export const EMPTY_OBRA: ObraProyecto = {
  id: "obra-new",
  cui: "",
  nombre: "",
  entidad: "",
  contratista: "",
  rucContratista: "",
  supervisor: "",
  rucSupervisor: "",
  residente: "",
  dniResidente: "",
  cipResidente: "",
  montoContractual: 0,
  plazoDias: 0,
  fechaInicio: "",
  fechaFinProgramada: "",
  fechaFinReprogramada: "",
  adelantoDirectoOtorgado: 0,
  adelantoMaterialesOtorgado: 0,
  sistemaContratacion: "A Precios Unitarios",
  estado: "En Ejecución",
  ubicacion: "",
  tipologia: "Edificaciones / Escuelas / Hospitales",
};

export const SAMPLE_OBRA: ObraProyecto = EMPTY_OBRA;

export const SAMPLE_VALORIZACIONES: ValorizacionMensual[] = [];
export const SAMPLE_ASIENTOS: AsientoCuadernoObra[] = [];
export const SAMPLE_MODIFICACIONES: ModificacionObra[] = [];

export const EMPTY_LIQUIDACION: LiquidacionResumen = {
  montoContratoOriginal: 0,
  montoAdicionalesAprobados: 0,
  montoDeductivosAprobados: 0,
  montoTotalContratoFinal: 0,
  reajustesTotalesK: 0,
  mayoresGastosGenerales: 0,
  interesesLegales: 0,
  adelantoDirectoTotalOtorgado: 0,
  adelantoDirectoTotalAmortizado: 0,
  adelantoMaterialesTotalOtorgado: 0,
  adelantoMaterialesTotalAmortizado: 0,
  penalidadesPorMoraAplicadas: 0,
  otrasPenalidades: 0,
  totalPagadoACuenta: 0,
  saldoFinalAFavorContratista: 0,
  estadoLiquidacion: "Borrador de Liquidación",
};

export const SAMPLE_LIQUIDACION: LiquidacionResumen = EMPTY_LIQUIDACION;

// Lista inicial vacía para que el usuario registre sus propios proyectos de obra reales
export const INITIAL_OBRAS_LIST: UserObraPackage[] = [];
