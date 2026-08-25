import React, { useState } from "react";
import { X, Plus, HardHat, CheckCircle2, FileText, Shield, User, DollarSign, Calendar, Building, Landmark } from "lucide-react";
import { ObraProyecto, UserObraPackage } from "../../types/obras";

interface NewObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveObra: (newObra: UserObraPackage) => void;
  editingObra?: UserObraPackage | null;
}

export const NewObraModal: React.FC<NewObraModalProps> = ({
  isOpen,
  onClose,
  onSaveObra,
  editingObra,
}) => {
  // 1. Datos Generales de la Inversión
  const [cui, setCui] = useState(editingObra ? editingObra.cui : "2" + Math.floor(Math.random() * 900000 + 100000));
  const [nombre, setNombre] = useState(
    editingObra ? editingObra.nombre : ""
  );
  const [entidad, setEntidad] = useState(
    editingObra ? editingObra.entidad : "MUNICIPALIDAD DISTRITAL DE "
  );
  const [ubicacion, setUbicacion] = useState(
    editingObra ? editingObra.obra.ubicacion : "Distrito, Provincia, Departamento"
  );
  const [tipologia, setTipologia] = useState<ObraProyecto["tipologia"]>(
    editingObra ? editingObra.obra.tipologia : "Edificaciones / Escuelas / Hospitales"
  );
  const [estado, setEstado] = useState<ObraProyecto["estado"]>(
    editingObra ? editingObra.estado : "En Ejecución"
  );

  // 2. Primer Documento Técnico: Contrato / Orden de Servicio del Contratista Ejecutor (< 8 UIT o Licitación/Adjudicación)
  const [tipoDocumentoContratista, setTipoDocumentoContratista] = useState<
    "Contrato de Obra" | "Orden de Servicio (< 8 UIT)" | "Contratación Directa"
  >(editingObra?.obra.tipoDocumentoContratista || "Contrato de Obra");
  const [numeroDocumentoContratista, setNumeroDocumentoContratista] = useState(
    editingObra?.obra.numeroDocumentoContratista || "CONTRATO DE OBRA N° 045-2025-MDR/GAF"
  );
  const [fechaSuscripcionContratista, setFechaSuscripcionContratista] = useState(
    editingObra?.obra.fechaSuscripcionContratista || new Date().toISOString().split("T")[0]
  );
  const [contratista, setContratista] = useState(
    editingObra ? editingObra.contratista : "CONSORCIO EJECUTOR VIAL"
  );
  const [rucContratista, setRucContratista] = useState(
    editingObra ? editingObra.obra.rucContratista : "20" + Math.floor(Math.random() * 900000000 + 100000000)
  );
  const [residente, setResidente] = useState(
    editingObra ? editingObra.obra.residente : "Ing. "
  );
  const [dniResidente, setDniResidente] = useState(
    editingObra ? editingObra.obra.dniResidente : "4" + Math.floor(Math.random() * 9000000 + 1000000)
  );
  const [cipResidente, setCipResidente] = useState(
    editingObra ? editingObra.obra.cipResidente : "CIP N° " + Math.floor(Math.random() * 90000 + 100000)
  );
  const [montoContractual, setMontoContractual] = useState<number>(
    editingObra ? editingObra.montoContractual : 2500000
  );
  const [plazoDias, setPlazoDias] = useState<number>(
    editingObra ? editingObra.obra.plazoDias : 180
  );
  const [sistemaContratacion, setSistemaContratacion] = useState<ObraProyecto["sistemaContratacion"]>(
    editingObra ? editingObra.obra.sistemaContratacion : "A Precios Unitarios"
  );
  const [adelantoDirectoOtorgado, setAdelantoDirectoOtorgado] = useState<number>(
    editingObra ? editingObra.obra.adelantoDirectoOtorgado : 250000
  );
  const [adelantoMaterialesOtorgado, setAdelantoMaterialesOtorgado] = useState<number>(
    editingObra ? editingObra.obra.adelantoMaterialesOtorgado : 500000
  );

  // 3. Documento Técnico de Supervisión / Inspectoría (< 8 UIT O.S. o Contrato de Consultoría)
  const [tipoDocumentoSupervisor, setTipoDocumentoSupervisor] = useState<
    "Contrato de Supervisión" | "Orden de Servicio (< 8 UIT)" | "Resolución de Designación de Inspector"
  >(editingObra?.obra.tipoDocumentoSupervisor || "Contrato de Supervisión");
  const [numeroDocumentoSupervisor, setNumeroDocumentoSupervisor] = useState(
    editingObra?.obra.numeroDocumentoSupervisor || "CONTRATO DE CONSULTORÍA N° 012-2025-CS"
  );
  const [fechaSuscripcionSupervisor, setFechaSuscripcionSupervisor] = useState(
    editingObra?.obra.fechaSuscripcionSupervisor || new Date().toISOString().split("T")[0]
  );
  const [montoSupervision, setMontoSupervision] = useState<number>(
    editingObra?.obra.montoSupervision || 125000
  );
  const [supervisor, setSupervisor] = useState(
    editingObra ? editingObra.obra.supervisor : "CONSORCIO SUPERVISOR DEL NORTE"
  );
  const [rucSupervisor, setRucSupervisor] = useState(
    editingObra ? editingObra.obra.rucSupervisor : "20" + Math.floor(Math.random() * 900000000 + 100000000)
  );
  const [jefeSupervision, setJefeSupervision] = useState(
    editingObra?.obra.jefeSupervision || "Ing. Jefe de Supervisión"
  );
  const [cipJefeSupervision, setCipJefeSupervision] = useState(
    editingObra?.obra.cipJefeSupervision || "CIP N° " + Math.floor(Math.random() * 90000 + 100000)
  );

  // 4. Plazos y Fechas de Inicio
  const [fechaInicio, setFechaInicio] = useState(
    editingObra ? editingObra.obra.fechaInicio : new Date().toISOString().split("T")[0]
  );
  const [fechaFinProgramada, setFechaFinProgramada] = useState(() => {
    if (editingObra) return editingObra.obra.fechaFinProgramada;
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d.toISOString().split("T")[0];
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cui.trim()) return;

    const obraObj: ObraProyecto = {
      id: editingObra ? editingObra.obra.id : `obra-${Date.now()}`,
      cui,
      nombre,
      entidad,
      tipoDocumentoContratista,
      numeroDocumentoContratista,
      fechaSuscripcionContratista,
      contratista,
      rucContratista,
      residente,
      dniResidente,
      cipResidente,
      tipoDocumentoSupervisor,
      numeroDocumentoSupervisor,
      fechaSuscripcionSupervisor,
      montoSupervision,
      supervisor,
      rucSupervisor,
      jefeSupervision,
      cipJefeSupervision,
      montoContractual,
      plazoDias,
      fechaInicio,
      fechaFinProgramada,
      adelantoDirectoOtorgado,
      adelantoMaterialesOtorgado,
      sistemaContratacion,
      estado,
      ubicacion,
      tipologia,
    };

    const obraPackage: UserObraPackage = {
      id: editingObra ? editingObra.id : `obra-${Date.now()}`,
      cui,
      nombre,
      entidad,
      contratista,
      montoContractual,
      estado,
      createdAt: editingObra ? editingObra.createdAt : new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      obra: obraObj,
      valorizaciones: editingObra ? editingObra.valorizaciones : [],
      asientos: editingObra ? editingObra.asientos : [],
      modificaciones: editingObra ? editingObra.modificaciones : [],
      liquidacion: editingObra
        ? editingObra.liquidacion
        : {
            montoContratoOriginal: montoContractual,
            montoAdicionalesAprobados: 0,
            montoDeductivosAprobados: 0,
            montoTotalContratoFinal: montoContractual,
            reajustesTotalesK: 0,
            mayoresGastosGenerales: 0,
            interesesLegales: 0,
            adelantoDirectoTotalOtorgado: adelantoDirectoOtorgado,
            adelantoDirectoTotalAmortizado: 0,
            adelantoMaterialesTotalOtorgado: adelantoMaterialesOtorgado,
            adelantoMaterialesTotalAmortizado: 0,
            penalidadesPorMoraAplicadas: 0,
            otrasPenalidades: 0,
            totalPagadoACuenta: 0,
            saldoFinalAFavorContratista: 0,
            estadoLiquidacion: "Borrador de Liquidación",
          },
    };

    onSaveObra(obraPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <HardHat className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {editingObra ? "Editar Proyecto y Documentos Contractuales" : "Registro de Obra: Contratos / Órdenes de Servicio (<8 UIT)"}
              </h3>
              <p className="text-xs text-indigo-200/90">
                Los datos preliminares de control se extraen del Contrato/O.S. del Contratista y de la Supervisión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          
          {/* ========================================================================= */}
          {/* SECCIÓN 1: DATOS PRELIMINARES DEL PROYECTO (INVERSIÓN)                   */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Datos Generales de la Inversión Pública (invierte.pe)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código CUI / SNIP *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 2489102"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipología de Obra
                </label>
                <select
                  value={tipologia}
                  onChange={(e) => setTipologia(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-medium"
                >
                  <option value="Edificaciones / Escuelas / Hospitales">Edificaciones / Escuelas / Hospitales</option>
                  <option value="Carreteras y Vías">Carreteras y Vías</option>
                  <option value="Saneamiento y Agua Potable">Saneamiento y Agua Potable</option>
                  <option value="Defensa Ribereña / Puentes">Defensa Ribereña / Puentes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estado Operativo
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-semibold text-indigo-700"
                >
                  <option value="En Ejecución">En Ejecución</option>
                  <option value="Atrasada (>20%)">Atrasada (&gt;20%)</option>
                  <option value="Adelantada">Adelantada</option>
                  <option value="Paralizada">Paralizada</option>
                  <option value="En Recepción">En Recepción</option>
                  <option value="Liquidada">Liquidada</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Oficial de la Obra (PIP / IOARR) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej: MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO EDUCATIVO DEL COLEGIO SECUNDARIO..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Entidad Contratante / Convocante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: GOBIERNO REGIONAL DE SAN MARTÍN"
                  value={entidad}
                  onChange={(e) => setEntidad(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-semibold"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ubicación Geográfica
                </label>
                <input
                  type="text"
                  placeholder="Distrito, Provincia, Dpto."
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: DOCUMENTO TÉCNICO N° 1 - CONTRATISTA EJECUTOR                 */}
          {/* (Contrato de Obra u Orden de Servicio cuando es menor a 8 UIT)           */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  2. Primer Documento Técnico: Contrato / Orden de Servicio del Contratista
                </h4>
              </div>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 self-start sm:self-auto">
                Fuente de montos, plazos y residente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Tipo de Instrumento */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Instrumento
                </label>
                <select
                  value={tipoDocumentoContratista}
                  onChange={(e) => setTipoDocumentoContratista(e.target.value as any)}
                  className="w-full text-xs bg-blue-50/50 border border-blue-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-bold text-blue-900"
                >
                  <option value="Contrato de Obra">Contrato de Obra (LP/AS/CP)</option>
                  <option value="Orden de Servicio (< 8 UIT)">Orden de Servicio (&lt; 8 UIT / Menores)</option>
                  <option value="Contratación Directa">Contratación Directa / Emergencia</option>
                </select>
              </div>

              {/* N° de Contrato / OS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Documento (Contrato u O.S.) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Contrato N° 042-2025-MDR / O.S. N° 00124"
                  value={numeroDocumentoContratista}
                  onChange={(e) => setNumeroDocumentoContratista(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Fecha de Firma / Notificación */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha Firma / Notificación O.S.
                </label>
                <input
                  type="date"
                  value={fechaSuscripcionContratista}
                  onChange={(e) => setFechaSuscripcionContratista(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Contratista Ejecutor */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Razón Social Contratista / Consorcio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CONSORCIO VIAL & EDIFICACIONES"
                  value={contratista}
                  onChange={(e) => setContratista(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* RUC Contratista */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  RUC Contratista
                </label>
                <input
                  type="text"
                  placeholder="Ej: 20542350033"
                  value={rucContratista}
                  onChange={(e) => setRucContratista(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Residente de Obra */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residente de Obra Designado
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Marco Aurelio Vargas"
                  value={residente}
                  onChange={(e) => setResidente(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* DNI Residente */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  DNI Residente
                </label>
                <input
                  type="text"
                  placeholder="Ej: 45678912"
                  value={dniResidente}
                  onChange={(e) => setDniResidente(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* CIP Residente */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registro CIP Residente
                </label>
                <input
                  type="text"
                  placeholder="Ej: CIP N° 108420"
                  value={cipResidente}
                  onChange={(e) => setCipResidente(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Monto Contractual */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Monto Contractual / O.S. (S/.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={montoContractual}
                  onChange={(e) => setMontoContractual(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold text-emerald-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              {/* Plazo Días */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plazo Contractual (Días Cal.) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={plazoDias}
                  onChange={(e) => setPlazoDias(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Sistema Contratación */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sistema de Contratación
                </label>
                <select
                  value={sistemaContratacion}
                  onChange={(e) => setSistemaContratacion(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="A Precios Unitarios">A Precios Unitarios</option>
                  <option value="A Suma Alzada">A Suma Alzada</option>
                  <option value="Esquema Mixto">Esquema Mixto</option>
                </select>
              </div>

              {/* Adelanto Directo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adelanto Directo Pactado (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adelantoDirectoOtorgado}
                  onChange={(e) => setAdelantoDirectoOtorgado(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                  placeholder="Hasta 10% del contrato"
                />
              </div>

              {/* Adelanto Materiales */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adelanto para Materiales Pactado (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adelantoMaterialesOtorgado}
                  onChange={(e) => setAdelantoMaterialesOtorgado(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
                  placeholder="Hasta 20% del contrato"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: DOCUMENTO TÉCNICO N° 2 - SUPERVISIÓN / INSPECTORÍA           */}
          {/* (Contrato de Consultoría, O.S. < 8 UIT o Resolución de Inspector)         */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                  3. Documento Técnico de Supervisión / Inspectoría de Obra
                </h4>
              </div>
              <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 self-start sm:self-auto">
                Contrato de Supervisión u O.S. &lt; 8 UIT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Tipo Instrumento Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Instrumento
                </label>
                <select
                  value={tipoDocumentoSupervisor}
                  onChange={(e) => setTipoDocumentoSupervisor(e.target.value as any)}
                  className="w-full text-xs bg-purple-50/50 border border-purple-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none font-bold text-purple-900"
                >
                  <option value="Contrato de Supervisión">Contrato de Supervisión (Consultoría)</option>
                  <option value="Orden de Servicio (< 8 UIT)">Orden de Servicio (&lt; 8 UIT / Menores)</option>
                  <option value="Resolución de Designación de Inspector">Resolución Designación Inspector</option>
                </select>
              </div>

              {/* N° Documento Supervisión */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Contrato / O.S. / Resolución
                </label>
                <input
                  type="text"
                  placeholder="Ej: Contrato N° 012-2025-CS / O.S. N° 00084"
                  value={numeroDocumentoSupervisor}
                  onChange={(e) => setNumeroDocumentoSupervisor(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Fecha Suscripción Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha Firma / Notificación
                </label>
                <input
                  type="date"
                  value={fechaSuscripcionSupervisor}
                  onChange={(e) => setFechaSuscripcionSupervisor(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Razón Social Supervisión */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supervisión de Obra (Empresa / Consultor / Inspector)
                </label>
                <input
                  type="text"
                  placeholder="Ej: CONSORCIO SUPERVISOR DEL ORIENTE"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none font-semibold"
                />
              </div>

              {/* RUC Supervisión */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  RUC / DNI Supervisión
                </label>
                <input
                  type="text"
                  placeholder="Ej: 20601280834"
                  value={rucSupervisor}
                  onChange={(e) => setRucSupervisor(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Jefe de Supervisión */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jefe de Supervisión / Inspector
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Jorge Alberto Mendoza"
                  value={jefeSupervision}
                  onChange={(e) => setJefeSupervision(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* CIP Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registro CIP Supervisor
                </label>
                <input
                  type="text"
                  placeholder="Ej: CIP N° 94320"
                  value={cipJefeSupervision}
                  onChange={(e) => setCipJefeSupervision(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Monto de Supervisión */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Monto de Supervisión (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoSupervision}
                  onChange={(e) => setMontoSupervision(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold text-purple-900 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 4: PLAZO DE EJECUCIÓN Y VIGENCIA                                */}
          {/* ========================================================================= */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Control Temporal del Plazo de Ejecución
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Inicio de Plazo Contractual
                </label>
                <input
                  type="date"
                  required
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Conforme a cumplimiento de condiciones (Entrega de terreno, entrega de expediente, supervisor y adelanto).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha Fin Programada Original
                </label>
                <input
                  type="date"
                  required
                  value={fechaFinProgramada}
                  onChange={(e) => setFechaFinProgramada(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculado con {plazoDias} días calendario a partir del inicio.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {editingObra ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingObra ? "Guardar Cambios de Obra y Contratos" : "Registrar Obra y Datos Preliminares"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
