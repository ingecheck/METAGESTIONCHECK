import React, { useState } from "react";
import {
  X,
  Calculator,
  FileText,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ProyectoCartera,
  ValorizacionObra,
  PartidaValorizacion,
  ExpedienteAdicional,
  AmpliacionPlazo,
  HitoNormativo,
} from "../../types/seguimientoCartera";
import { formatPEN } from "../../services/docxGenerator";

interface WorksValorizacionesIntegratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProyectoCartera;
  onSaveProject: (updatedProject: ProyectoCartera) => void;
  initialTab?: "valorizacion" | "expediente" | "ampliacion";
}

export const WorksValorizacionesIntegratedModal: React.FC<WorksValorizacionesIntegratedModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveProject,
  initialTab = "valorizacion",
}) => {
  const [activeTab, setActiveTab] = useState<"valorizacion" | "expediente" | "ampliacion">(initialTab);

  // Form state: Valorización
  const nextValoNum = (project.valorizaciones?.length || 0) + 1;
  const [valNumero, setValNumero] = useState<number>(nextValoNum);
  const [valPeriodo, setValPeriodo] = useState<string>(() => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    const now = new Date();
    return `${meses[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [valFechaEmision, setValFechaEmision] = useState<string>(
    new Date().toLocaleDateString("es-PE")
  );
  const [valEstado, setValEstado] = useState<"APROBADA" | "EN_TRAMITE" | "OBSERVADA">("APROBADA");
  const [valObservaciones, setValObservaciones] = useState<string>(
    "Aprobada por la Supervisión conforme al Art. 194 del RLCE dentro del plazo legal."
  );

  // Default sample partidas based on contractual amount
  const initialPartidas: PartidaValorizacion[] = (() => {
    const lastValo = project.valorizaciones && project.valorizaciones.length > 0
      ? project.valorizaciones[project.valorizaciones.length - 1]
      : null;

    if (lastValo?.partidas && lastValo.partidas.length > 0) {
      return lastValo.partidas.map((p) => ({
        ...p,
        id: `part-${Date.now()}-${p.item}`,
        metradoAnterior: p.metradoAcumulado,
        metradoActual: 0,
        montoParcial: 0,
        metradoAcumulado: p.metradoAcumulado,
        montoAcumulado: p.montoAcumulado,
      }));
    }

    const m = project.contratoEjecucionMonto || 500000;
    return [
      {
        id: "p1",
        item: "01.01",
        descripcion: "CARTEL DE IDENTIFICACIÓN DE LA OBRA Y TRABAJOS PRELIMINARES",
        unidad: "GLB",
        metradoContratado: 1,
        precioUnitario: Math.round(m * 0.02 * 100) / 100,
        metradoAnterior: 0,
        metradoActual: 1,
        montoParcial: Math.round(m * 0.02 * 100) / 100,
        metradoAcumulado: 1,
        montoAcumulado: Math.round(m * 0.02 * 100) / 100,
        porcentajeAvance: 100,
      },
      {
        id: "p2",
        item: "02.01",
        descripcion: "MOVIMIENTO DE TIERRAS, TRAZO Y REPLANTEO INICIAL",
        unidad: "M3",
        metradoContratado: 850,
        precioUnitario: Math.round((m * 0.18 / 850) * 100) / 100,
        metradoAnterior: 0,
        metradoActual: 340,
        montoParcial: Math.round((340 * (m * 0.18 / 850)) * 100) / 100,
        metradoAcumulado: 340,
        montoAcumulado: Math.round((340 * (m * 0.18 / 850)) * 100) / 100,
        porcentajeAvance: 40,
      },
      {
        id: "p3",
        item: "03.01",
        descripcion: "ESTRUCTURAS DE CONCRETO Y ACERO DE REFUERZO",
        unidad: "M3",
        metradoContratado: 320,
        precioUnitario: Math.round((m * 0.55 / 320) * 100) / 100,
        metradoAnterior: 0,
        metradoActual: 64,
        montoParcial: Math.round((64 * (m * 0.55 / 320)) * 100) / 100,
        metradoAcumulado: 64,
        montoAcumulado: Math.round((64 * (m * 0.55 / 320)) * 100) / 100,
        porcentajeAvance: 20,
      },
      {
        id: "p4",
        item: "04.01",
        descripcion: "INSTALACIONES, ACABADOS Y CARPINTERÍA METÁLICA",
        unidad: "M2",
        metradoContratado: 600,
        precioUnitario: Math.round((m * 0.25 / 600) * 100) / 100,
        metradoAnterior: 0,
        metradoActual: 30,
        montoParcial: Math.round((30 * (m * 0.25 / 600)) * 100) / 100,
        metradoAcumulado: 30,
        montoAcumulado: Math.round((30 * (m * 0.25 / 600)) * 100) / 100,
        porcentajeAvance: 5,
      },
    ];
  })();

  const [partidas, setPartidas] = useState<PartidaValorizacion[]>(initialPartidas);

  // Form state: Expediente Adicional
  const nextExpNum = (project.expedientes?.length || 0) + 1;
  const [expNumero, setExpNumero] = useState<number>(nextExpNum);
  const [expTipo, setExpTipo] = useState<"ADICIONAL" | "DEDUCTIVO" | "MAYOR_METRADO">("ADICIONAL");
  const [expDescripcion, setExpDescripcion] = useState<string>(
    "Expediente Técnico para mayores prestaciones por condiciones imprevistas de suelo y drenaje"
  );
  const [expMonto, setExpMonto] = useState<number>(
    Math.round((project.contratoEjecucionMonto || 400000) * 0.085 * 100) / 100
  );
  const [expResolucion, setExpResolucion] = useState<string>(
    `Resolución de Gerencia Municipal N° 0${nextExpNum}4-2026-MPR`
  );
  const [expFechaEmision, setExpFechaEmision] = useState<string>(
    new Date().toLocaleDateString("es-PE")
  );
  const [expPlazoDias, setExpPlazoDias] = useState<number>(15);

  // Form state: Ampliación de Plazo
  const nextAmpNum = (project.ampliacionesPlazo?.length || 0) + 1;
  const [ampNumero, setAmpNumero] = useState<number>(nextAmpNum);
  const [ampDias, setAmpDias] = useState<number>(20);
  const [ampResolucion, setAmpResolucion] = useState<string>(
    `Resolución de Aprobación de Ampliación de Plazo N° 0${nextAmpNum}2-2026-MPR`
  );
  const [ampFechaEmision, setAmpFechaEmision] = useState<string>(
    new Date().toLocaleDateString("es-PE")
  );
  const [ampMotivo, setAmpMotivo] = useState<string>(
    "Precipitaciones pluviales extraordinarias debidamente acreditadas con reporte SENAMHI (Art. 197.1 RLCE)."
  );

  if (!isOpen) return null;

  // Recalculate totals for valorizacion
  const totalMontoParcialMes = partidas.reduce((sum, p) => sum + (p.montoParcial || 0), 0);
  const totalMontoAcumulado = partidas.reduce((sum, p) => sum + (p.montoAcumulado || 0), 0);
  const contractual = project.contratoEjecucionMonto || 1;
  const porcentajeAvanceAcumulado = Math.min(
    100,
    Math.round((totalMontoAcumulado / contractual) * 10000) / 100
  );
  const saldoPorValorizar = Math.max(0, contractual - totalMontoAcumulado);

  // Partida handlers
  const handleUpdatePartidaMetradoActual = (id: string, nuevoActual: number) => {
    setPartidas((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const actual = Math.max(0, nuevoActual);
        const acumulado = (p.metradoAnterior || 0) + actual;
        const parcial = Math.round(actual * p.precioUnitario * 100) / 100;
        const totalAcum = Math.round(acumulado * p.precioUnitario * 100) / 100;
        const pct =
          p.metradoContratado > 0
            ? Math.round((acumulado / p.metradoContratado) * 10000) / 100
            : 0;
        return {
          ...p,
          metradoActual: actual,
          montoParcial: parcial,
          metradoAcumulado: acumulado,
          montoAcumulado: totalAcum,
          porcentajeAvance: pct,
        };
      })
    );
  };

  const handleAddCustomPartida = () => {
    const newItemNum = `0${partidas.length + 1}.01`;
    const newPart: PartidaValorizacion = {
      id: `custom-part-${Date.now()}`,
      item: newItemNum,
      descripcion: "NUEVA PARTIDA REGISTRADA SEGÚN EXPEDIENTE TÉCNICO",
      unidad: "M2",
      metradoContratado: 100,
      precioUnitario: 50.0,
      metradoAnterior: 0,
      metradoActual: 20,
      montoParcial: 1000.0,
      metradoAcumulado: 20,
      montoAcumulado: 1000.0,
      porcentajeAvance: 20,
    };
    setPartidas([...partidas, newPart]);
  };

  const handleDeletePartida = (id: string) => {
    setPartidas(partidas.filter((p) => p.id !== id));
  };

  // ==========================================
  // SAVE HANDLERS WITH AUTOMATED CHECKLIST
  // ==========================================

  const handleSaveValorizacion = () => {
    const newValo: ValorizacionObra = {
      id: `valo-${project.id}-${valNumero}-${Date.now()}`,
      numero: valNumero,
      periodo: valPeriodo,
      fechaValorizacion: valFechaEmision,
      fechaAprobacionSupervisor: valFechaEmision,
      montoProgramadoMes: totalMontoParcialMes,
      montoEjecutadoMes: totalMontoParcialMes,
      porcentajeProgramadoMes: Math.round((totalMontoParcialMes / contractual) * 10000) / 100,
      porcentajeEjecutadoMes: Math.round((totalMontoParcialMes / contractual) * 10000) / 100,
      montoProgramadoAcumulado: totalMontoAcumulado,
      montoEjecutadoAcumulado: totalMontoAcumulado,
      porcentajeProgramadoAcumulado: porcentajeAvanceAcumulado,
      porcentajeEjecutadoAcumulado: porcentajeAvanceAcumulado,
      estado: valEstado,
      observacionesSupervisor: valObservaciones,
      partidas: partidas,
    };

    // Replace or append in project's valorizaciones
    const existingValos = project.valorizaciones || [];
    const filteredValos = existingValos.filter((v) => v.numero !== valNumero);
    const updatedValos = [...filteredValos, newValo].sort((a, b) => a.numero - b.numero);

    // AUTOMATIC INTEGRATION: Update or create checklist item
    const valoHitoId = `hito-valo-${String(valNumero).padStart(2, "0")}`;
    const valoCode = `VALO-${String(valNumero).padStart(2, "0")}`;
    const valoName = `Valorización N° ${String(valNumero).padStart(2, "0")} (${valPeriodo}) - ${formatPEN(totalMontoParcialMes)}`;

    let hitosUpdated = [...project.hitos];
    const existingHitoIdx = hitosUpdated.findIndex(
      (h) => h.id === valoHitoId || h.id === `hito-valo-0${valNumero}` || h.codigo === valoCode
    );

    const valoHito: HitoNormativo = {
      id: valoHitoId,
      fase: "EJECUCION",
      codigo: valoCode,
      nombre: valoName,
      baseLegal: "Art. 194 RLCE - Valorizaciones y Metrados de Obra",
      cumplido: valEstado === "APROBADA",
      fecha: valFechaEmision,
      tipo: "valorizacion",
      monto: totalMontoParcialMes,
      numeroRelacionado: valNumero,
      documentoSustento: `Aprobada por el Supervisor con fecha ${valFechaEmision}`,
    };

    if (existingHitoIdx >= 0) {
      hitosUpdated[existingHitoIdx] = {
        ...hitosUpdated[existingHitoIdx],
        ...valoHito,
      };
    } else {
      // Insert in phase EJECUCION
      const insertIdx = hitosUpdated.findIndex((h) => h.id === "hito-recepcion");
      if (insertIdx >= 0) {
        hitosUpdated.splice(insertIdx, 0, valoHito);
      } else {
        hitosUpdated.push(valoHito);
      }
    }

    // Update state to EN_EJECUCION if was preparatory
    let updatedEstado = project.estado;
    if (project.estado === "ACTOS_PREPARATORIOS" || project.estado === "PENDIENTE_INICIO_CONDICIONES") {
      updatedEstado = "EN_EJECUCION";
    }

    onSaveProject({
      ...project,
      estado: updatedEstado,
      valorizaciones: updatedValos,
      hitos: hitosUpdated,
    });
    onClose();
  };

  const handleSaveExpediente = () => {
    const newExp: ExpedienteAdicional = {
      id: `exp-${project.id}-${expNumero}-${Date.now()}`,
      numero: expNumero,
      tipo: expTipo,
      descripcion: expDescripcion,
      monto: expMonto,
      resolucionAprobacion: expResolucion,
      fechaEmision: expFechaEmision,
      estado: "APROBADO",
      plazoAdicionalDias: expPlazoDias > 0 ? expPlazoDias : undefined,
    };

    const existingExps = project.expedientes || [];
    const updatedExps = [...existingExps.filter((e) => e.numero !== expNumero), newExp].sort(
      (a, b) => a.numero - b.numero
    );

    // AUTOMATIC INTEGRATION: Create new checklist item for this expediente
    const expHitoId = `hito-exp-${expNumero}-${Date.now()}`;
    const expCode = `EXP-${expTipo === "ADICIONAL" ? "ADIC" : "DED"}-${String(expNumero).padStart(2, "0")}`;
    const expHito: HitoNormativo = {
      id: expHitoId,
      fase: "EJECUCION",
      codigo: expCode,
      nombre: `Expediente Técnico ${expTipo === "ADICIONAL" ? "Adicional" : expTipo} N° ${String(expNumero).padStart(2, "0")} (${formatPEN(expMonto)})`,
      baseLegal: "Art. 205 / 206 RLCE - Prestaciones Adicionales y Reducciones de Obra",
      cumplido: true,
      fecha: expFechaEmision,
      tipo: "expediente",
      monto: expMonto,
      numeroRelacionado: expNumero,
      documentoSustento: expResolucion,
    };

    const hitosUpdated = [...project.hitos];
    const insertIdx = hitosUpdated.findIndex((h) => h.id === "hito-recepcion");
    if (insertIdx >= 0) {
      hitosUpdated.splice(insertIdx, 0, expHito);
    } else {
      hitosUpdated.push(expHito);
    }

    onSaveProject({
      ...project,
      expedientes: updatedExps,
      hitos: hitosUpdated,
      plazoDias: expPlazoDias > 0 ? (project.plazoDias || 0) + expPlazoDias : project.plazoDias,
    });
    onClose();
  };

  const handleSaveAmpliacion = () => {
    const newAmp: AmpliacionPlazo = {
      id: `amp-${project.id}-${ampNumero}-${Date.now()}`,
      numero: ampNumero,
      dias: ampDias,
      resolucion: ampResolucion,
      fechaEmision: ampFechaEmision,
      motivo: ampMotivo,
      estado: "APROBADA",
    };

    const existingAmps = project.ampliacionesPlazo || [];
    const updatedAmps = [...existingAmps.filter((a) => a.numero !== ampNumero), newAmp].sort(
      (a, b) => a.numero - b.numero
    );

    // AUTOMATIC INTEGRATION: Create new checklist item for this ampliacion de plazo
    const ampHitoId = `hito-amp-${ampNumero}-${Date.now()}`;
    const ampCode = `AMP-PLAZO-${String(ampNumero).padStart(2, "0")}`;
    const ampHito: HitoNormativo = {
      id: ampHitoId,
      fase: "EJECUCION",
      codigo: ampCode,
      nombre: `Ampliación de Plazo N° ${String(ampNumero).padStart(2, "0")} (+${ampDias} días cal.) - ${ampResolucion}`,
      baseLegal: "Art. 197 / 198 RLCE - Modificación del Contrato por Plazo",
      cumplido: true,
      fecha: ampFechaEmision,
      tipo: "ampliacion_plazo",
      diasAmpliacion: ampDias,
      numeroRelacionado: ampNumero,
      documentoSustento: ampResolucion,
      observacion: ampMotivo,
    };

    const hitosUpdated = [...project.hitos];
    const insertIdx = hitosUpdated.findIndex((h) => h.id === "hito-recepcion");
    if (insertIdx >= 0) {
      hitosUpdated.splice(insertIdx, 0, ampHito);
    } else {
      hitosUpdated.push(ampHito);
    }

    const updatedPlazoDias = (project.plazoDias || 0) + ampDias;

    onSaveProject({
      ...project,
      ampliacionesPlazo: updatedAmps,
      hitos: hitosUpdated,
      plazoDias: updatedPlazoDias,
      observaciones: `${project.observaciones ? `${project.observaciones} • ` : ""}Ampliación N° ${ampNumero} (+${ampDias} días) aprobada con ${ampResolucion}.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header - Dark Slate with Corporate Gold */}
        <div className="bg-slate-950 border-b border-slate-800 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                ID #{project.id} • CUI {project.cui}
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[11px] font-bold">
                Monto Contractual: {formatPEN(project.contratoEjecucionMonto)}
              </span>
              <span className="bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                Encargado: {project.encargado}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
              {project.proyecto}
            </h2>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Contrato: {project.contratoEjecucionNumero || "Pendiente"} • Contratista: {project.contratoEjecucionEmpresa || "-"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation with Classification Badges */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("valorizacion")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "valorizacion"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calculator className={`w-3.5 h-3.5 ${activeTab === "valorizacion" ? "text-slate-950" : "text-amber-600"}`} />
              <span>[Valorización] Mensual & Metrados</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "valorizacion" ? "bg-slate-950 text-amber-400 font-bold" : "bg-slate-200 text-slate-700"}`}>
                {project.valorizaciones?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("expediente")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "expediente"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === "expediente" ? "text-slate-950" : "text-amber-600"}`} />
              <span>[Expediente] Adicionales & Deductivos</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "expediente" ? "bg-slate-950 text-amber-400 font-bold" : "bg-slate-200 text-slate-700"}`}>
                {project.expedientes?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ampliacion")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "ampliacion"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === "ampliacion" ? "text-slate-950" : "text-amber-600"}`} />
              <span>[Ampliación] Plazos de Obra</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "ampliacion" ? "bg-slate-950 text-amber-400 font-bold" : "bg-slate-200 text-slate-700"}`}>
                {project.ampliacionesPlazo?.length || 0}
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Genera automáticamente el espacio en el checklist</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* ======================================================== */}
          {/* TAB 1: VALORIZACIÓN MENSUAL & PARTIDAS                   */}
          {/* ======================================================== */}
          {activeTab === "valorizacion" && (
            <div className="space-y-4">
              {/* Header KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Monto Contractual</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-slate-900">
                    {formatPEN(contractual)}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Valorizado del Mes</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-700">
                    {formatPEN(totalMontoParcialMes)}
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Avance Acumulado</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-blue-700">
                    {porcentajeAvanceAcumulado}% ({formatPEN(totalMontoAcumulado)})
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Saldo por Valorizar</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-amber-700">
                    {formatPEN(saldoPorValorizar)}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    N° de Valorización:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={valNumero}
                    onChange={(e) => setValNumero(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Periodo / Mes:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Octubre 2026"
                    value={valPeriodo}
                    onChange={(e) => setValPeriodo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha Emisión / Aprobación:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={valFechaEmision}
                      onChange={(e) => setValFechaEmision(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setValFechaEmision(new Date().toLocaleDateString("es-PE"))}
                      className="px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Hoy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Estado de Valorización:
                  </label>
                  <select
                    value={valEstado}
                    onChange={(e) => setValEstado(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="APROBADA">✅ Aprobada por Supervisión</option>
                    <option value="EN_TRAMITE">⏳ En Trámite / Revisión</option>
                    <option value="OBSERVADA">⚠️ Observada (Con Subsanación)</option>
                  </select>
                </div>
              </div>

              {/* Partidas Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Planilla de Metrados y Partidas de la Valorización</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddCustomPartida}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Agregar Partida</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200 w-16">Ítem</th>
                        <th className="p-2 border-r border-slate-200 min-w-[200px]">Descripción de la Partida</th>
                        <th className="p-2 border-r border-slate-200 w-14 text-center">Und</th>
                        <th className="p-2 border-r border-slate-200 w-20 text-right">Met. Cont.</th>
                        <th className="p-2 border-r border-slate-200 w-20 text-right">P.U. (S/)</th>
                        <th className="p-2 border-r border-slate-200 w-20 text-right bg-blue-50/50">Met. Ant.</th>
                        <th className="p-2 border-r border-slate-200 w-24 text-center bg-emerald-50 text-emerald-950 font-black">
                          Met. Actual
                        </th>
                        <th className="p-2 border-r border-slate-200 w-24 text-right bg-emerald-50 font-bold text-emerald-900">
                          Monto Mes (S/)
                        </th>
                        <th className="p-2 border-r border-slate-200 w-20 text-right font-bold text-slate-800">
                          Met. Acum.
                        </th>
                        <th className="p-2 border-r border-slate-200 w-16 text-center font-bold text-blue-700">
                          % Avance
                        </th>
                        <th className="p-2 w-10 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {partidas.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold border-r border-slate-200 text-slate-700">
                            {p.item}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                            {p.descripcion}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-600 uppercase">
                            {p.unidad}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                            {p.metradoContratado.toLocaleString("es-PE")}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-700">
                            {p.precioUnitario.toFixed(2)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-500 bg-blue-50/20">
                            {p.metradoAnterior.toLocaleString("es-PE")}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-center bg-emerald-50/50">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={p.metradoActual}
                              onChange={(e) =>
                                handleUpdatePartidaMetradoActual(
                                  p.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 bg-white border border-emerald-300 rounded px-1.5 py-1 text-right font-mono font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                            {formatPEN(p.montoParcial)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                            {p.metradoAcumulado.toLocaleString("es-PE")}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono font-black text-blue-700">
                            {p.porcentajeAvance}%
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePartida(p.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                              title="Eliminar partida"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={7} className="p-2.5 text-right uppercase tracking-wider text-[10px]">
                          Totales de la Valorización N° {valNumero}:
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-800 text-xs border-r border-slate-300">
                          {formatPEN(totalMontoParcialMes)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-800">
                          {formatPEN(totalMontoAcumulado)}
                        </td>
                        <td className="p-2.5 text-center font-mono text-blue-800">
                          {porcentajeAvanceAcumulado}%
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Observaciones del Supervisor */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Observaciones / Sustento Técnico de la Supervisión:
                </label>
                <textarea
                  rows={2}
                  value={valObservaciones}
                  onChange={(e) => setValObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Detalles sobre avance, controles de calidad de concreto, ensayos de laboratorio..."
                />
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveValorizacion}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Guardar Valorización & Actualizar Checklist</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: EXPEDIENTES TÉCNICOS & ADICIONALES                */}
          {/* ======================================================== */}
          {activeTab === "expediente" && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl space-y-1">
                <div className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Registro de Expediente Técnico Adicional / Deductivo (Art. 205 RLCE)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Al registrar este expediente, el sistema creará automáticamente un nuevo hito normativo dentro del checklist de la obra clasificado como <strong>[EXPEDIENTE]</strong>, con su fecha de resolución asignada para su seguimiento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tipo de Modificación Presupuestal:
                  </label>
                  <select
                    value={expTipo}
                    onChange={(e) => setExpTipo(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ADICIONAL">➕ Adicional de Obra (Mayores Metrados / Obras Nuevas)</option>
                    <option value="DEDUCTIVO">➖ Deductivo Vinculado de Obra</option>
                    <option value="MAYOR_METRADO">📈 Mayor Metrado (Precios Unitarios)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    N° de Expediente:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expNumero}
                    onChange={(e) => setExpNumero(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Denominación / Descripción del Expediente Técnico:
                  </label>
                  <input
                    type="text"
                    value={expDescripcion}
                    onChange={(e) => setExpDescripcion(e.target.value)}
                    placeholder="ej. Adicional N° 01 por reubicación de postes y mayores excavaciones..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Monto del Adicional / Expediente (S/):</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={expMonto}
                    onChange={(e) => setExpMonto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Incidencia: {((expMonto / (project.contratoEjecucionMonto || 1)) * 100).toFixed(2)}% del contrato original
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Plazo Adicional Otorgado (Días):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={expPlazoDias}
                    onChange={(e) => setExpPlazoDias(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Resolución de Aprobación de la Entidad:
                  </label>
                  <input
                    type="text"
                    value={expResolucion}
                    onChange={(e) => setExpResolucion(e.target.value)}
                    placeholder="ej. Resolución de Gerencia Municipal N° 084-2026-MPR"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha Emisión de Resolución:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={expFechaEmision}
                      onChange={(e) => setExpFechaEmision(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setExpFechaEmision(new Date().toLocaleDateString("es-PE"))}
                      className="px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpediente}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Aprobar Expediente & Generar Hito en Checklist</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: AMPLIACIONES DE PLAZO                             */}
          {/* ======================================================== */}
          {activeTab === "ampliacion" && (
            <div className="space-y-4">
              <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl space-y-1">
                <div className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span>Registro de Ampliación de Plazo de Ejecución (Art. 197 / 198 RLCE)</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Al registrar la ampliación, el sistema añadirá automáticamente un nuevo ítem en el checklist clasificado como <strong>[AMPLIACIÓN]</strong>, sumará los días al plazo total de la obra y recalculará la fecha de término vigente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    N° de Ampliación de Plazo:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ampNumero}
                    onChange={(e) => setAmpNumero(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Días Calendario Otorgados:</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ampDias}
                    onChange={(e) => setAmpDias(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-purple-900 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Plazo actual: {project.plazoDias || 0} d ➔ Nuevo plazo: {(project.plazoDias || 0) + ampDias} días
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Resolución de Aprobación:
                  </label>
                  <input
                    type="text"
                    value={ampResolucion}
                    onChange={(e) => setAmpResolucion(e.target.value)}
                    placeholder="ej. Resolución de Gerencia Municipal N° 092-2026-MPR"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha Emisión de Resolución:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={ampFechaEmision}
                      onChange={(e) => setAmpFechaEmision(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setAmpFechaEmision(new Date().toLocaleDateString("es-PE"))}
                      className="px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Hoy
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Causal / Motivo de la Ampliación (Art. 197 RLCE):
                  </label>
                  <textarea
                    rows={2}
                    value={ampMotivo}
                    onChange={(e) => setAmpMotivo(e.target.value)}
                    placeholder="Lluvias torrenciales, paralización no imputable al contratista, demora en absolución de consultas por el proyectista..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAmpliacion}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Aprobar Ampliación & Añadir al Checklist</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
