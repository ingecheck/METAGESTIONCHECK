import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  HardHat,
  ShieldCheck,
  MapPin,
  FileCheck2,
  FileDown,
  Printer,
  Copy,
  ChevronRight,
  Info,
  DollarSign,
  AlertCircle,
  FolderLock,
  Layers,
  ArrowRight,
  Sparkles,
  Save,
  Check,
  FileSpreadsheet,
  Ban,
  RotateCcw,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import { ObraProyecto, ProcedimientoInicioObra, CondicionInicioItem } from "../../types/obras";

interface WorksCommencementProcedureProps {
  obra: ObraProyecto;
  onUpdateObra: (updated: ObraProyecto) => void;
  onNavigateSubtab?: (tabId: string) => void;
}

// Initial conditions matrix based on Art. 176 D.S. 344-2018-EF & D.S. 009-2025-EF
// Por defecto se inicializan en estado PENDIENTE para que el usuario/auditor las evalúe y marque.
const generateDefaultConditions = (obra: ObraProyecto): CondicionInicioItem[] => {
  const fechaFirma = obra.fechaSuscripcionContratista || obra.fechaInicio || new Date().toISOString().split("T")[0];

  // Plazo legal 15 días calendario de suscrito el contrato
  const d15 = new Date(fechaFirma);
  d15.setDate(d15.getDate() + 15);
  const fechaLimite15 = d15.toISOString().split("T")[0];

  // Plazo legal 8 días hábiles para adelanto directo (~11 días calendario aprox)
  const d8h = new Date(fechaFirma);
  d8h.setDate(d8h.getDate() + 11);
  const fechaLimite8h = d8h.toISOString().split("T")[0];

  return [
    {
      id: "cond-1",
      codigo: "ART-176.1.a",
      nombre: "Notificación y Designación del Inspector o Supervisor de Obra",
      articuloLegal: "Art. 176.1 literal a) RLCE (D.S. N° 344-2018-EF / D.S. N° 009-2025-EF)",
      obligatorio: true,
      responsable: "Entidad Contratante",
      cumplido: false,
      noCorresponde: false,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite15,
      documentoSustento: obra.numeroDocumentoSupervisor || "Contrato de Supervisión / Resolución de Designación",
      observaciones: obra.supervisor
        ? `Supervisión registrada: ${obra.supervisor}. Pendiente verificar notificación formal y entrega de credenciales.`
        : "Pendiente que la Entidad notifique formalmente al supervisor o designe inspector colegiado.",
      estadoAlerta: "PENDIENTE_CRITICO",
    },
    {
      id: "cond-2",
      codigo: "ART-176.1.b",
      nombre: "Entrega Total o Parcial del Terreno o Lugar de Ejecución",
      articuloLegal: "Art. 176.1 literal b) RLCE",
      obligatorio: true,
      responsable: "Entidad Contratante",
      cumplido: false,
      noCorresponde: false,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite15,
      documentoSustento: `Acta de Entrega de Terreno N° 001-${obra.cui || "2025"}`,
      observaciones: `Ubicación: ${obra.ubicacion || "Área del proyecto"}. Pendiente verificar disponibilidad física libre de interferencias y suscripción de acta in situ.`,
      estadoAlerta: "PENDIENTE_CRITICO",
    },
    {
      id: "cond-3",
      codigo: "ART-176.1.c",
      nombre: "Entrega del Expediente Técnico de Obra Completo",
      articuloLegal: "Art. 176.1 literal c) RLCE",
      obligatorio: true,
      responsable: "Entidad Contratante",
      cumplido: false,
      noCorresponde: false,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite15,
      documentoSustento: "Resolución de Aprobación de Expediente Técnico / Cargo de Recepción",
      observaciones: "Pendiente constatar entrega física y digital completa de planos, especificaciones, presupuesto y absolución de consultas integradas.",
      estadoAlerta: "PENDIENTE_CRITICO",
    },
    {
      id: "cond-4",
      codigo: "ART-176.1.d",
      nombre: "Acreditación Presupuestal y Entrega del Adelanto Directo (Hasta 10%)",
      articuloLegal: "Art. 176.1 literal d) y Art. 180 RLCE",
      obligatorio: false,
      responsable: "Conjunto",
      cumplido: false,
      noCorresponde: (obra.adelantoDirectoOtorgado || 0) === 0,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite8h,
      documentoSustento: obra.adelantoDirectoOtorgado > 0 ? `Carta Fianza / Comprobante de Pago S/ ${obra.adelantoDirectoOtorgado.toLocaleString("es-PE")}` : "Bases de Contratación",
      observaciones: obra.adelantoDirectoOtorgado > 0
        ? `Adelanto pactado por S/ ${obra.adelantoDirectoOtorgado.toLocaleString("es-PE")}. Pendiente verificar desembolso efectivo dentro del plazo.`
        : "Si las bases no contemplan adelanto directo o el contratista no lo solicitó, marcar como 'No Corresponde'.",
      estadoAlerta: (obra.adelantoDirectoOtorgado || 0) === 0 ? "NO_CORRESPONDE" : "PENDIENTE_CRITICO",
    },
    {
      id: "cond-5",
      codigo: "ART-176.1.e",
      nombre: "Designación del Residente y Habilitación del Cuaderno de Obra Digital (COD)",
      articuloLegal: "Art. 176.1 literal e) y Directiva N° 009-2020-OSCE/CD",
      obligatorio: true,
      responsable: "Contratista Ejecutor",
      cumplido: false,
      noCorresponde: false,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite15,
      documentoSustento: `Carta de Acreditación de Residente (${obra.residente || "Ing. Residente"} - ${obra.cipResidente || "CIP"})`,
      observaciones: obra.residente
        ? `Residente registrado: ${obra.residente} (${obra.cipResidente || "CIP"}). Pendiente verificar alta de usuarios y Asiento N° 01 en COD de OSCE.`
        : "Pendiente acreditar formalmente al residente colegiado y habilitar plataforma COD.",
      estadoAlerta: "PENDIENTE_CRITICO",
    },
    {
      id: "cond-6",
      codigo: "ART-175.CPM",
      nombre: "Presentación de Calendarios Concordados (CVAO, CAM, Equipos) y Plan SST",
      articuloLegal: "Art. 175 RLCE (Plazo de 15 días de suscrito el contrato)",
      obligatorio: true,
      responsable: "Contratista Ejecutor",
      cumplido: false,
      noCorresponde: false,
      fechaCumplimiento: undefined,
      fechaLimiteLegal: fechaLimite15,
      documentoSustento: "CVAO valorizado, CAM, Cronograma de Equipos concordados CPM y Plan SST",
      observaciones: "Pendiente entrega formal dentro de los 15 días calendario de suscrito el contrato para aprobación de la Supervisión.",
      estadoAlerta: "PENDIENTE_CRITICO",
    },
  ];
};

export const WorksCommencementProcedure: React.FC<WorksCommencementProcedureProps> = ({
  obra,
  onUpdateObra,
  onNavigateSubtab,
}) => {
  // Local state for ProcedimientoInicio
  const initialProc = useMemo<ProcedimientoInicioObra>(() => {
    if (obra.procedimientoInicio) {
      return obra.procedimientoInicio;
    }
    const fechaFirma = obra.fechaSuscripcionContratista || obra.fechaInicio || new Date().toISOString().split("T")[0];
    const conditions = generateDefaultConditions(obra);
    const applicableConditions = conditions.filter((c) => !c.noCorresponde);
    const allPassed = applicableConditions.length > 0 && applicableConditions.every((c) => c.cumplido);

    return {
      id: "proc-" + obra.id,
      fechaFirmaContrato: fechaFirma,
      fechaEntregaTerrenoProgramada: obra.fechaInicio || fechaFirma,
      fechaEntregaTerrenoReal: obra.fechaInicio || fechaFirma,
      tipoEntregaTerreno: "Total",
      actaEntregaTerrenoNumero: `ACTA N° 001-${obra.cui || "2025"}-ET`,
      supervisorDesignado: false,
      documentoDesignacionSupervisor: obra.numeroDocumentoSupervisor || "",
      fechaNotificacionSupervisor: obra.fechaSuscripcionSupervisor || fechaFirma,
      expedienteEntregadoCompleto: false,
      fechaEntregaExpediente: fechaFirma,
      incluyeAbsolucionConsultas: true,
      solicitoAdelantoDirecto: (obra.adelantoDirectoOtorgado || 0) > 0,
      montoAdelantoDirectoSolicitado: obra.adelantoDirectoOtorgado || 0,
      porcentajeAdelantoDirectoSolicitado: obra.montoContractual > 0 ? ((obra.adelantoDirectoOtorgado || 0) / obra.montoContractual) * 100 : 0,
      entidadEntregoAdelantoDirecto: false,
      fechaSolicitudAdelantoDirecto: fechaFirma,
      fechaPagoAdelantoDirecto: fechaFirma,
      residenteAcreditado: false,
      fechaAcreditacionResidente: fechaFirma,
      cuadernoObraDigitalHabilitado: false,
      codigoCOD: `COD-${obra.cui || "2025"}`,
      calendarioCVAOPresentado: false,
      calendarioCAMPresentado: false,
      calendarioEquiposPresentado: false,
      planSSTPresentado: false,
      condicionesCompletas: allPassed,
      fechaInicioComputada: obra.fechaInicio || fechaFirma,
      fechaFinProgramadaComputada: obra.fechaFinProgramada || "",
      estadoInicio: allPassed ? "Inicio de Plazo Vigente" : "En Proceso de Cumplimiento de Condiciones",
      condicionesDetalladas: conditions,
    };
  }, [obra]);

  const [procState, setProcState] = useState<ProcedimientoInicioObra>(initialProc);
  const [activeTab, setActiveTab] = useState<"matriz" | "calculo" | "actas" | "normativa">("matriz");
  const [selectedActa, setSelectedActa] = useState<"entrega-terreno" | "inicio-obra" | "carta-residente" | "solicitud-adelanto" | "acta-suspension">("entrega-terreno");
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Set condition state: "CUMPLIDO" | "PENDIENTE" | "NO_CORRESPONDE"
  const handleSetConditionState = (condId: string, newState: "CUMPLIDO" | "PENDIENTE" | "NO_CORRESPONDE") => {
    const today = new Date().toISOString().split("T")[0];
    const updatedConditions = procState.condicionesDetalladas.map((c) => {
      if (c.id === condId) {
        if (newState === "CUMPLIDO") {
          return {
            ...c,
            cumplido: true,
            noCorresponde: false,
            estadoAlerta: "CONFORME" as const,
            fechaCumplimiento: c.fechaCumplimiento || today,
          };
        } else if (newState === "NO_CORRESPONDE") {
          return {
            ...c,
            cumplido: false,
            noCorresponde: true,
            estadoAlerta: "NO_CORRESPONDE" as const,
            fechaCumplimiento: undefined,
          };
        } else {
          // PENDIENTE
          return {
            ...c,
            cumplido: false,
            noCorresponde: false,
            estadoAlerta: "PENDIENTE_CRITICO" as const,
            fechaCumplimiento: undefined,
          };
        }
      }
      return c;
    });

    const applicable = updatedConditions.filter((c) => !c.noCorresponde);
    const allPassed = applicable.length > 0 && applicable.every((c) => c.cumplido);

    const nextState: ProcedimientoInicioObra = {
      ...procState,
      condicionesDetalladas: updatedConditions,
      condicionesCompletas: allPassed,
      estadoInicio: allPassed ? "Inicio de Plazo Vigente" : "En Proceso de Cumplimiento de Condiciones",
    };
    setProcState(nextState);
  };

  // Update Observation or Document text
  const handleUpdateConditionText = (condId: string, field: "observaciones" | "documentoSustento" | "fechaCumplimiento", value: string) => {
    const updatedConditions = procState.condicionesDetalladas.map((c) => {
      if (c.id === condId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setProcState({ ...procState, condicionesDetalladas: updatedConditions });
  };

  // Bulk Actions
  const handleMarkAllConforme = () => {
    const today = new Date().toISOString().split("T")[0];
    const updated = procState.condicionesDetalladas.map((c) => {
      if (c.noCorresponde) return c;
      return {
        ...c,
        cumplido: true,
        noCorresponde: false,
        estadoAlerta: "CONFORME" as const,
        fechaCumplimiento: c.fechaCumplimiento || today,
      };
    });
    setProcState({
      ...procState,
      condicionesDetalladas: updated,
      condicionesCompletas: true,
      estadoInicio: "Inicio de Plazo Vigente",
    });
  };

  const handleResetAllToPending = () => {
    const updated = procState.condicionesDetalladas.map((c) => ({
      ...c,
      cumplido: false,
      noCorresponde: false,
      estadoAlerta: "PENDIENTE_CRITICO" as const,
      fechaCumplimiento: undefined,
    }));
    setProcState({
      ...procState,
      condicionesDetalladas: updated,
      condicionesCompletas: false,
      estadoInicio: "En Proceso de Cumplimiento de Condiciones",
    });
  };

  // Recompute dates
  const handleDateChange = (field: "fechaFirmaContrato" | "fechaEntregaTerrenoReal" | "fechaPagoAdelantoDirecto", val: string) => {
    const nextProc = { ...procState, [field]: val };
    
    // Compute last fulfilled date
    const dates = [
      nextProc.fechaFirmaContrato,
      nextProc.fechaEntregaTerrenoReal,
      nextProc.fechaPagoAdelantoDirecto,
    ].filter(Boolean) as string[];

    if (dates.length > 0) {
      // Find latest date among essential conditions
      const maxDate = dates.reduce((latest, current) => (current > latest ? current : latest), dates[0]);
      
      // Plazo starts NEXT DAY of last fulfilled condition (Art. 176.1 RLCE)
      const startDateObj = new Date(maxDate);
      startDateObj.setDate(startDateObj.getDate() + 1);
      const computedStart = startDateObj.toISOString().split("T")[0];

      // End date = computedStart + plazoDias
      const endDateObj = new Date(computedStart);
      endDateObj.setDate(endDateObj.getDate() + (obra.plazoDias || 180));
      const computedEnd = endDateObj.toISOString().split("T")[0];

      nextProc.fechaInicioComputada = computedStart;
      nextProc.fechaFinProgramadaComputada = computedEnd;
    }

    setProcState(nextProc);
  };

  // Save changes to current Obra
  const handleSaveToObra = () => {
    const updatedObra: ObraProyecto = {
      ...obra,
      fechaInicio: procState.fechaInicioComputada || obra.fechaInicio,
      fechaFinProgramada: procState.fechaFinProgramadaComputada || obra.fechaFinProgramada,
      procedimientoInicio: procState,
    };
    onUpdateObra(updatedObra);
    setSavedNotification("¡Procedimiento de Inicio guardado y sincronizado con el proyecto!");
    setTimeout(() => setSavedNotification(null), 3000);
  };

  // Summary counts
  const totalCondiciones = procState.condicionesDetalladas.length;
  const noCorrespondeCount = procState.condicionesDetalladas.filter((c) => c.noCorresponde).length;
  const requeridas = totalCondiciones - noCorrespondeCount;
  const cumplidas = procState.condicionesDetalladas.filter((c) => c.cumplido && !c.noCorresponde).length;
  const pendientesCriticas = procState.condicionesDetalladas.filter((c) => !c.cumplido && !c.noCorresponde).length;
  const porcentajeAvance = requeridas > 0 ? Math.round((cumplidas / requeridas) * 100) : 100;

  // Generate Official Acta Content
  const generateActaText = () => {
    const cui = obra.cui || "2548912";
    const nombreObra = obra.nombre || "PROYECTO DE OBRA PÚBLICA";
    const entidad = obra.entidad || "MUNICIPALIDAD CONTRATANTE";
    const contratista = obra.contratista || "CONSORCIO CONTRATISTA";
    const rucContratista = obra.rucContratista || "20600000001";
    const residente = obra.residente || "Ing. Residente Colegiado";
    const dniResidente = obra.dniResidente || "40000001";
    const cipResidente = obra.cipResidente || "CIP 100001";
    const supervisor = obra.supervisor || "CONSORCIO SUPERVISOR";
    const jefeSupervision = obra.jefeSupervision || "Ing. Jefe de Supervisión";
    const cipJefe = obra.cipJefeSupervision || "CIP 100002";
    const monto = Number(obra.montoContractual || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 });
    const plazo = obra.plazoDias || 180;
    const fechaFirma = procState.fechaFirmaContrato || obra.fechaSuscripcionContratista || "01/01/2025";
    const fechaInicio = procState.fechaInicioComputada || obra.fechaInicio || "02/01/2025";
    const fechaFin = procState.fechaFinProgramadaComputada || obra.fechaFinProgramada || "02/07/2025";
    const ubicacion = obra.ubicacion || "Distrito, Provincia y Departamento";
    const numContrato = obra.numeroDocumentoContratista || "CONTRATO N° 001-2025";

    if (selectedActa === "entrega-terreno") {
      return `ACTA DE ENTREGA TOTAL DE TERRENO Y VERIFICACIÓN DE CONDICIONES PREVIAS
OBRA: "${nombreObra}"
CÓDIGO ÚNICO DE INVERSIONES (CUI): ${cui}
CONTRATO N°: ${numContrato}
ENTIDAD CONTRATANTE: ${entidad}
CONTRATISTA EJECUTOR: ${contratista} (RUC: ${rucContratista})
SUPERVISIÓN / INSPECTORÍA: ${supervisor}

En el lugar de emplazamiento de la obra, ubicado en ${ubicacion}, siendo las 10:00 horas del día ${procState.fechaEntregaTerrenoReal || fechaInicio}, se reunieron los suscritos:
1. Por la Entidad: Representante Legal / Gerente de Desarrollo Urbano y Obras.
2. Por la Supervisión: ${jefeSupervision}, con ${cipJefe}.
3. Por el Contratista: ${residente}, con ${cipResidente} y DNI N° ${dniResidente}.

FINALIDAD:
Efectuar la entrega física del terreno para la ejecución de la obra conforme al Artículo 176 del Reglamento de la Ley de Contrataciones del Estado (D.S. N° 344-2018-EF / Ley N° 32069 / D.S. N° 009-2025-EF).

CONSTANCIA DE VERIFICACIÓN:
1. Se constató que el área destinada a la obra se encuentra disponible, libre de interferencias físicas, servidumbres no resueltas y reclamos de terceros.
2. Se hace entrega de los hitos y puntos de control topográfico (BMs) establecidos en el Expediente Técnico.
3. Las partes declaran su total conformidad con la delimitación del terreno.

En señal de conformidad y aceptación, se suscribe la presente Acta en tres (03) ejemplares del mismo tenor y efecto legal.

_______________________________          _______________________________          _______________________________
         POR LA ENTIDAD                             SUPERVISIÓN DE OBRA                      RESIDENTE DE OBRA
   Gerencia de Obras / Titular               ${jefeSupervision} - ${cipJefe}          ${residente} - ${cipResidente}`;
    }

    if (selectedActa === "inicio-obra") {
      const getCondStatus = (codigo: string) => {
        const item = procState.condicionesDetalladas.find((c) => c.codigo.includes(codigo));
        if (!item) return "[CONFORME]";
        if (item.noCorresponde) return "[NO CORRESPONDE]";
        return item.cumplido ? "[CONFORME]" : "[PENDIENTE DE SUBSANACIÓN]";
      };

      return `ACTA DE INICIO DEL PLAZO DE EJECUCIÓN CONTRACTUAL
BASE LEGAL: ARTÍCULO 176 DEL REGLAMENTO DE LA LEY DE CONTRATACIONES DEL ESTADO

OBRA: "${nombreObra}"
CUI: ${cui} | CONTRATO: ${numContrato}
MONTO CONTRACTUAL: S/ ${monto} | PLAZO DE EJECUCIÓN: ${plazo} DÍAS CALENDARIO
FECHA DE SUSCRIPCIÓN DE CONTRATO: ${fechaFirma}

En las instalaciones del proyecto, con fecha ${fechaInicio}, los representantes de la Entidad, el Contratista y la Supervisión dejan constancia de lo siguiente:

I. CUMPLIMIENTO INDISPENSABLE DE CONDICIONES PREVIAS (ART. 176.1 RLCE):
a) Notificación y designación formal de la Supervisión de Obra: ${getCondStatus("ART-176.1.a")}
b) Entrega física total del terreno libre de interferencias: ${getCondStatus("ART-176.1.b")}
c) Entrega del Expediente Técnico completo y compatibilizado: ${getCondStatus("ART-176.1.c")}
d) Acreditación presupuestal y entrega de adelanto directo pactado: ${getCondStatus("ART-176.1.d")}
e) Acreditación del Ingeniero Residente y apertura del Cuaderno de Obra Digital: ${getCondStatus("ART-176.1.e")}

II. CÓMPUTO DE PLAZO CONTRACTUAL:
Habiéndose cumplido las condiciones legales indispensables con fecha ${procState.fechaEntregaTerrenoReal || fechaFirma}, el plazo de ejecución contractual de ${plazo} días calendario RIGE OFICIALMENTE a partir del día siguiente:
- FECHA DE INICIO DE PLAZO: ${fechaInicio}
- FECHA DE CULMINACIÓN PROGRAMADA: ${fechaFin}

Ambas partes se comprometen al estricto cumplimiento del Cronograma de Avance de Obra Valorizado (CVAO) y las Especificaciones Técnicas.

_______________________________          _______________________________          _______________________________
         POR LA ENTIDAD                             SUPERVISOR DE OBRA                       RESIDENTE DE OBRA
   Entidad Contratante: ${entidad}          ${jefeSupervision} (${cipJefe})          ${residente} (${cipResidente})`;
    }

    if (selectedActa === "carta-residente") {
      return `CARTA N° 001-${new Date().getFullYear()}-${contratista.substring(0, 15).replace(/\s+/g, "")}/GG
LIMA / REGIÓN, ${fechaFirma}

SEÑORES:
${entidad}
ATENCIÓN: Gerencia de Infraestructura y Obras Públicas
REFERENCIA: Contrato de Obra N° ${numContrato} - Obra CUI ${cui}

ASUNTO: Acreditación de Ingeniero Residente de Obra y Solicitud de Habilitación en el Cuaderno de Obra Digital (COD - OSCE).

De nuestra mayor consideración:
Por medio de la presente, en cumplimiento del Artículo 176 y 179 del Reglamento de la Ley de Contrataciones del Estado y de la Directiva N° 009-2020-OSCE/CD sobre el uso obligatorio del Cuaderno de Obra Digital, nos dirigimos a ustedes para acreditar formalmente a nuestro profesional:

- NOMBRE: ${residente}
- DNI N°: ${dniResidente}
- N° DE COLEGIATURA: ${cipResidente}
- ESPECIALIDAD: Ingeniero Civil / Colegiado y Habilitado
- CORREO ELECTRÓNICO OFICIAL PARA COD: residente.${cui}@gmail.com
- TELÉFONO DE CONTACTO: 998-765-432

Adjuntamos:
1. Copia del Certificado de Habilidad Profesional Vigente emitido por el Colegio de Ingenieros del Perú.
2. Declaración Jurada de Permanencia y Dedicación Exclusiva en la Obra.
3. Copia de DNI y Curriculum Vitae documentado.

Solicitamos se sirva disponer a quien corresponda la asignación del rol de Residente de Obra en la plataforma del Cuaderno de Obra Digital del OSCE.

Sin otro particular, quedamos de ustedes.

Atentamente,

___________________________________________________
${contratista}
RUC N°: ${rucContratista}
Representante Legal / Gerente General`;
    }

    if (selectedActa === "solicitud-adelanto") {
      const montoAdelanto = (obra.adelantoDirectoOtorgado || obra.montoContractual * 0.1).toLocaleString("es-PE", { minimumFractionDigits: 2 });
      return `CARTA DE SOLICITUD DE ADELANTO DIRECTO (HASTA 10% DEL MONTO CONTRACTUAL)
CARTA N° 002-${new Date().getFullYear()}-${contratista.substring(0, 15).replace(/\s+/g, "")}/GG

FECHA: ${fechaFirma}
SEÑORES: ${entidad}
REFERENCIA: Contrato de Obra N° ${numContrato} - CUI: ${cui}
ASUNTO: Solicitud formal de entrega de Adelanto Directo conforme al Artículo 180 del RLCE.

De nuestra mayor consideración:
En virtud de lo dispuesto en el Artículo 180 del Reglamento de la Ley de Contrataciones del Estado (D.S. N° 344-2018-EF) y encontrándonos dentro del plazo legal de ocho (08) días hábiles siguientes a la suscripción del contrato, solicitamos a su despacho disponer el trámite y pago del ADELANTO DIRECTO correspondiente al 10% del contrato:

1. MONTO DEL CONTRATO ORIGINAL: S/ ${monto}
2. PORCENTAJE SOLICITADO: 10.00%
3. MONTO TOTAL DEL ADELANTO DIRECTO: S/ ${montoAdelanto} (Incluido I.G.V.)

GARANTÍA ADJUNTA:
Para garantizar el 100% del adelanto solicitado, adjuntamos la CARTA FIANZA N° 08849-2025-BBVA, emitida por entidad bancaria supervisada por la SBS, con carácter de solidaria, incondicional, irrevocable y de realización automática.

Asimismo, adjuntamos el Comprobante de Pago (Factura Electrónica) correspondiente.

Recordamos que conforme al Art. 180.2 del RLCE, la Entidad cuenta con un plazo máximo de siete (07) días calendario para hacer efectivo el desembolso correspondiente.

Atentamente,

___________________________________________________
${contratista}
RUC N°: ${rucContratista}`;
    }

    // Default: Acta de suspensión
    return `ACTA DE SUSPENSIÓN DEL INICIO DEL PLAZO DE EJECUCIÓN DE OBRA
BASE LEGAL: ARTÍCULO 176.7 Y 176.8 DEL REGLAMENTO DE LA LEY DE CONTRATACIONES DEL ESTADO

OBRA: "${nombreObra}" (CUI: ${cui})
CONTRATISTA: ${contratista} | ENTIDAD: ${entidad}
CONTRATO N°: ${numContrato}

Con fecha ${new Date().toISOString().split("T")[0]}, reunidas las partes intervinientes, se deja constancia expresa de lo siguiente:

I. ANTECEDENTES Y CAUSAL DE SUSPENSIÓN:
Habiendo transcurrido el plazo máximo legal de quince (15) días calendario desde la suscripción del contrato sin que la Entidad haya cumplido con la totalidad de las condiciones indispensables previstas en el Artículo 176.1 del RLCE (Específicamente: Entrega Total de Terreno / Designación de Supervisión / Pago de Adelanto Directo solicitado), las partes acuerdan formalizar la SUSPENSIÓN DEL INICIO DEL PLAZO DE EJECUCIÓN.

II. EFECTOS LEGALES:
1. No se computará el plazo de ejecución de obra hasta la subsanación total de la causal.
2. Se salvaguarda el derecho del contratista a reclamar el resarcimiento de daños y perjuicios debidamente acreditados conforme al Art. 176.8 del RLCE.
3. Se fija como plazo límite para el levantamiento de observaciones el plazo de diez (10) días hábiles.

En señal de conformidad, suscriben:

_______________________________          _______________________________
         POR LA ENTIDAD                             POR EL CONTRATISTA`;
  };

  const handleCopyActa = () => {
    navigator.clipboard.writeText(generateActaText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrintActa = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impresión de Acta - ${obra.cui}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 40px; font-size: 12px; line-height: 1.6; }
              pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
            </style>
          </head>
          <body>
            <pre>${generateActaText()}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL: PUNTO 1. PROCEDIMIENTO PARA INICIO DE OBRA            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-600/90 text-indigo-100 text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                Punto 1 • Control de Obras
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Base Legal: Art. 176 RLCE (D.S. N° 344-2018-EF / D.S. N° 009-2025-EF)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              1. Procedimiento para Inicio de Obra y Condiciones Previas
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Verifique y marque cada una de las condiciones indispensables para dar inicio oficial al plazo contractual.
              Utilice los botones para marcar como <strong className="text-emerald-300">Cumplido</strong>, <strong className="text-amber-300">Pendiente</strong> o <strong className="text-slate-300">No Corresponde</strong>.
            </p>

            {/* Obra Identifiers */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>CUI: <strong className="text-white font-mono">{obra.cui || "2548912"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span className="truncate max-w-[200px]" title={obra.contratista}>Contratista: <strong className="text-white">{obra.contratista || "En Registro"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="truncate max-w-[200px]" title={obra.supervisor}>Supervisión: <strong className="text-white">{obra.supervisor || "En Registro"}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Button & Status Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
            <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${
              procState.condicionesCompletas
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}>
              {procState.condicionesCompletas ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Condiciones 100% Cumplidas • Inicio Vigente</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{pendientesCriticas} Requisito(s) Pendiente(s) de Inicio</span>
                </>
              )}
            </div>

            <button
              onClick={handleSaveToObra}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar y Sincronizar Fechas</span>
            </button>
          </div>
        </div>

        {savedNotification && (
          <div className="mt-4 p-3 bg-emerald-900/90 border border-emerald-500 text-emerald-100 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{savedNotification}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4 CARDS DE ESTADO Y RESUMEN LEGAL                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Porcentaje de Requisitos Cumplidos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Requisitos Cumplidos</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{porcentajeAvance}%</span>
            <span className="text-xs text-slate-500">({cumplidas} de {requeridas})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                porcentajeAvance === 100 ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${porcentajeAvance}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
            <span>{pendientesCriticas} pendientes</span>
            {noCorrespondeCount > 0 && (
              <span className="text-slate-400">({noCorrespondeCount} no aplican)</span>
            )}
          </div>
        </div>

        {/* Card 2: Fecha de Inicio Computada */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Inicio de Plazo de Ejecución</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-800 font-mono">
            {procState.fechaInicioComputada || obra.fechaInicio || "Por Definir"}
          </div>
          <div className="text-[11px] text-slate-600">
            Rige al día siguiente de la última condición cumplida (Art. 176.1)
          </div>
          <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block">
            Plazo: {obra.plazoDias || 180} días calendario
          </div>
        </div>

        {/* Card 3: Culminación Programada */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Fecha Fin Programada</span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-900 font-mono">
            {procState.fechaFinProgramadaComputada || obra.fechaFinProgramada || "Por Definir"}
          </div>
          <div className="text-[11px] text-slate-600">
            Calculada sumando {obra.plazoDias || 180} días al inicio de plazo
          </div>
          <div className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded inline-block">
            Estado: {obra.estado || "En Ejecución"}
          </div>
        </div>

        {/* Card 4: Adelanto Directo */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Adelanto Directo (10%)</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            S/ {Number(obra.adelantoDirectoOtorgado || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-600">
            {obra.adelantoDirectoOtorgado > 0 ? "Otorgado con garantía de Carta Fianza" : "No pactado o no solicitado (8 días hábiles)"}
          </div>
          <div className="text-[10px] text-slate-500">
            Límite Entidad: 7 días calendario para pago
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVEGACIÓN INTERNA: MATRIZ DE REQUISITOS, CÓMPUTO, ACTAS, NORMATIVA      */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("matriz")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "matriz"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Matriz de Requisitos Indispensables (Art. 176)</span>
        </button>

        <button
          onClick={() => setActiveTab("calculo")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "calculo"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Cómputo de Plazos y Cronograma de Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab("actas")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "actas"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Generador de Actas Oficiales y Documentos</span>
        </button>

        <button
          onClick={() => setActiveTab("normativa")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "normativa"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Guía Legal & Procedimiento OSCE</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: MATRIZ DE REQUISITOS INDISPENSABLES (CHECKLIST INTERACTIVO)    */}
      {/* ========================================================================= */}
      {activeTab === "matriz" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Header & Bulk Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evaluación de Condiciones Previas para Inicio de Obra (Art. 176.1 RLCE)
                </h3>
                <p className="text-xs text-slate-500">
                  Marque cada condición según su estado real: <strong className="text-emerald-700">Cumplido</strong>, <strong className="text-amber-700">Pendiente</strong> o <strong className="text-slate-700">No Corresponde</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleMarkAllConforme}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Marcar todas las condiciones requeridas como cumplidas"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Marcar Todo Cumplido</span>
                </button>

                <button
                  onClick={handleResetAllToPending}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Restablecer todas las condiciones a estado pendiente"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer a Pendientes</span>
                </button>
              </div>
            </div>

            {/* List of Conditions */}
            <div className="space-y-4">
              {procState.condicionesDetalladas.map((cond, idx) => {
                const isCumplido = cond.cumplido && !cond.noCorresponde;
                const isNoCorresponde = Boolean(cond.noCorresponde);
                const isPendiente = !cond.cumplido && !cond.noCorresponde;

                return (
                  <div
                    key={cond.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isCumplido
                        ? "bg-emerald-50/40 border-emerald-200"
                        : isNoCorresponde
                        ? "bg-slate-50/70 border-slate-200 opacity-80"
                        : "bg-amber-50/30 border-amber-200"
                    }`}
                  >
                    {/* Top line: Code, Name, Badges & Action Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-white px-2 py-0.5 rounded">
                            {cond.codigo}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {idx + 1}. {cond.nombre}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isCumplido
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : isNoCorresponde
                                ? "bg-slate-200 text-slate-700 border border-slate-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                            }`}
                          >
                            {isCumplido && <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cumplido / Conforme</>}
                            {isNoCorresponde && <><Ban className="w-3 h-3 text-slate-500" /> No Corresponde</>}
                            {isPendiente && <><Clock className="w-3 h-3 text-amber-600" /> ⏳ Pendiente de Verificación</>}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          <strong className="text-slate-700">Base Legal:</strong> {cond.articuloLegal} • Responsable: <strong className="text-slate-800">{cond.responsable}</strong>
                        </div>
                      </div>

                      {/* 3 STATE ACTION BUTTONS */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        {/* Botón 1: CUMPLIDO */}
                        <button
                          type="button"
                          onClick={() => handleSetConditionState(cond.id, "CUMPLIDO")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isCumplido
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Cumplido</span>
                        </button>

                        {/* Botón 2: PENDIENTE */}
                        <button
                          type="button"
                          onClick={() => handleSetConditionState(cond.id, "PENDIENTE")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isPendiente
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-transparent text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendiente</span>
                        </button>

                        {/* Botón 3: NO CORRESPONDE */}
                        <button
                          type="button"
                          onClick={() => handleSetConditionState(cond.id, "NO_CORRESPONDE")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isNoCorresponde
                              ? "bg-slate-700 text-white shadow-xs"
                              : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>No Corresponde</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Details: Observations and Sustento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200/60">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                          Observaciones / Estado Actual de la Condición:
                        </label>
                        <input
                          type="text"
                          value={cond.observaciones || ""}
                          onChange={(e) => handleUpdateConditionText(cond.id, "observaciones", e.target.value)}
                          placeholder="Ingrese detalle u observaciones de la verificación..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                            Documento de Sustento:
                          </label>
                          <input
                            type="text"
                            value={cond.documentoSustento || ""}
                            onChange={(e) => handleUpdateConditionText(cond.id, "documentoSustento", e.target.value)}
                            placeholder="N° de Acta, Carta, Resolución..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                            Fecha de Cumplimiento:
                          </label>
                          <input
                            type="date"
                            value={cond.fechaCumplimiento || ""}
                            onChange={(e) => handleUpdateConditionText(cond.id, "fechaCumplimiento", e.target.value)}
                            disabled={isNoCorresponde}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary and sync */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {procState.condicionesCompletas ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Todas las condiciones indispensables se encuentran cumplidas. Plazo oficial habilitado.
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Aún existen {pendientesCriticas} condiciones pendientes para iniciar formalmente la obra.
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveToObra}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Estado de Condiciones</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: CÓMPUTO DE PLAZOS Y CRONOGRAMA DE INICIO                       */}
      {/* ========================================================================= */}
      {activeTab === "calculo" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls column */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Parámetros de Fechas de Inicio</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Fecha de Suscripción del Contrato:
                </label>
                <input
                  type="date"
                  value={procState.fechaFirmaContrato}
                  onChange={(e) => handleDateChange("fechaFirmaContrato", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Punto de partida legal para el cómputo de plazos.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Fecha Real de Entrega de Terreno:
                </label>
                <input
                  type="date"
                  value={procState.fechaEntregaTerrenoReal || ""}
                  onChange={(e) => handleDateChange("fechaEntregaTerrenoReal", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Plazo máx. legal: 15 días calendario de firmado el contrato.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Fecha de Pago del Adelanto Directo (Si aplica):
                </label>
                <input
                  type="date"
                  value={procState.fechaPagoAdelantoDirecto || ""}
                  onChange={(e) => handleDateChange("fechaPagoAdelantoDirecto", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Entidad debe pagar dentro de 7 días calendario de solicitado.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveToObra}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Aplicar Fechas a la Obra</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline and Rule Display */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Línea de Tiempo Legal del Inicio de Obra (Art. 176)
              </h3>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Firma */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Suscripción del Contrato</span>
                      <span className="font-mono text-xs text-indigo-700 font-bold">{procState.fechaFirmaContrato}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Firma de contrato de obra N° {obra.numeroDocumentoContratista || "001-2025"}. Inicia el cómputo de los 15 días para entrega de terreno y 8 días hábiles para solicitar adelanto directo.
                    </p>
                  </div>
                </div>

                {/* Step 2: Cumplimiento de Condiciones */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Cumplimiento de Condiciones Previas</span>
                      <span className="font-mono text-xs text-indigo-700 font-bold">{procState.fechaEntregaTerrenoReal || procState.fechaFirmaContrato}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Suscripción del Acta de Entrega de Terreno, entrega del Expediente Técnico y designación formal de Supervisión y Residente.
                    </p>
                  </div>
                </div>

                {/* Step 3: Inicio Oficial */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ★
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-950 uppercase tracking-wide">
                        3. INICIO OFICIAL DEL PLAZO DE EJECUCIÓN (DÍA SIGUIENTE)
                      </span>
                      <span className="font-mono text-sm text-emerald-800 font-black">
                        {procState.fechaInicioComputada}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                      Conforme al Art. 176.1 del RLCE, el plazo contractual de <strong>{obra.plazoDias || 180} días calendario</strong> comienza a regir a partir de esta fecha.
                    </p>
                  </div>
                </div>

                {/* Step 4: Culminación */}
                <div className="relative">
                  <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    4
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-950">Fecha de Culminación Contractual Programada</span>
                      <span className="font-mono text-xs text-purple-900 font-bold">{procState.fechaFinProgramadaComputada}</span>
                    </div>
                    <p className="text-[11px] text-purple-900">
                      Fecha límite para la culminación física total de la obra antes de la solicitud de recepción (Art. 208 RLCE).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning regarding Art. 176.7 suspension */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Alerta Legal: Causal de Suspensión por Incumplimiento de la Entidad (Art. 176.7)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Si la Entidad no cumple con la entrega de terreno o adelanto directo dentro de los 15 días posteriores a la firma del contrato, el contratista puede emplazarla por un plazo de 5 a 15 días. De no subsanarse, el contratista puede solicitar resarcimiento de daños y perjuicios (hasta 5/10000 por día con tope de 75/10000) o solicitar la <strong>resolución del contrato de obra</strong> (Art. 176.8).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: GENERADOR DE ACTAS OFICIALES Y DOCUMENTOS                      */}
      {/* ========================================================================= */}
      {activeTab === "actas" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document selection sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Documentos Disponibles para Emisión:
            </h4>

            {[
              {
                id: "entrega-terreno",
                label: "Acta de Entrega de Terreno",
                desc: "Art. 176.1 literal b) - Suscrita por Entidad, Contratista y Supervisión.",
              },
              {
                id: "inicio-obra",
                label: "Acta de Inicio de Plazo Contractual",
                desc: "Determinación oficial del día de inicio y fecha fin programada.",
              },
              {
                id: "carta-residente",
                label: "Carta de Acreditación de Residente & COD",
                desc: "Acreditación con colegiatura CIP y habilitación en Cuaderno Digital.",
              },
              {
                id: "solicitud-adelanto",
                label: "Solicitud de Adelanto Directo (10%)",
                desc: "Presentación de garantía (Carta Fianza) dentro de los 8 días hábiles.",
              },
              {
                id: "acta-suspension",
                label: "Acta de Suspensión de Inicio de Plazo",
                desc: "Art. 176.7 RLCE - Por falta de disponibilidad de terreno o supervisor.",
              },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedActa(doc.id as any)}
                className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                  selectedActa === doc.id
                    ? "bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs">{doc.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{doc.desc}</div>
              </button>
            ))}
          </div>

          {/* Document Previewer */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Vista Previa del Documento Oficial
                </h3>
                <span className="text-[11px] text-slate-500">
                  Formato legal estructurado con los datos reales del proyecto
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyActa}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? "¡Copiado!" : "Copiar Texto"}</span>
                </button>

                <button
                  onClick={handlePrintActa}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto select-all">
              {generateActaText()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: GUÍA LEGAL & PROCEDIMIENTO OSCE (D.S. N° 344-2018-EF)          */}
      {/* ========================================================================= */}
      {activeTab === "normativa" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs text-slate-700">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Marco Legal y Directivas para el Inicio de Obra Pública en el Perú
            </h3>
            <p className="text-slate-500 text-xs">
              Ley N° 30225, Ley N° 32069, D.S. N° 344-2018-EF, D.S. N° 009-2025-EF y Directivas del OSCE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Artículo 176.1 • Requisitos Indispensables para el Inicio</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                El plazo de ejecución de obra rige al día siguiente de cumplirse las condiciones:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Notificación formal al Inspector o Supervisor designado.</li>
                <li>Entrega total o parcial del terreno (libre de interferencias).</li>
                <li>Entrega física y digital del Expediente Técnico completo.</li>
                <li>Acreditación de partida presupuestal y entrega del Adelanto Directo pactado.</li>
                <li>Designación y acreditación del Residente y apertura del Cuaderno de Obra Digital.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Artículo 176.7 y 176.8 • Causal de Suspensión y Resolución</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Si las condiciones no se cumplen en los 15 días posteriores a la firma del contrato:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>El contratista emplaza a la Entidad por un plazo de 5 a 15 días hábiles.</li>
                <li>Se suspende el plazo de inicio de obra mediante acta formal.</li>
                <li>El contratista tiene derecho a resarcimiento de daños (hasta 5/10000 por día hasta 75/10000).</li>
                <li>Vencido el plazo sin subsanación, el contratista puede <strong>resolver el contrato</strong>.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Artículo 180 • Adelanto Directo (Hasta 10%)</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                El contratista cuenta con <strong>8 días hábiles</strong> siguientes a la suscripción del contrato para solicitar formalmente el adelanto directo adjuntando la Carta Fianza / Póliza de Caución correspondiente. La Entidad debe realizar el desembolso dentro de los <strong>7 días calendario</strong> siguientes a la solicitud.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Directiva OSCE • Cuaderno de Obra Digital (COD)</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Es de uso obligatorio para todas las obras públicas convocadas. En el <strong>Asiento N° 01</strong> se registra obligatoriamente el Acta de Entrega de Terreno y la constancia de inicio del plazo de ejecución contractual suscrita por el Residente y el Inspector/Supervisor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
