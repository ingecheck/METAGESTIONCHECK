import React, { useState } from "react";
import { X, Plus, HardHat, CheckCircle2 } from "lucide-react";
import { ObraProyecto, UserObraPackage } from "../../types/obras";
import { SAMPLE_VALORIZACIONES, SAMPLE_ASIENTOS, SAMPLE_MODIFICACIONES, SAMPLE_LIQUIDACION } from "../../data/sampleObras";

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
  const [cui, setCui] = useState(editingObra ? editingObra.cui : "2" + Math.floor(Math.random() * 900000 + 100000));
  const [nombre, setNombre] = useState(
    editingObra ? editingObra.nombre : ""
  );
  const [entidad, setEntidad] = useState(
    editingObra ? editingObra.entidad : "MUNICIPALIDAD DISTRITAL DE "
  );
  const [contratista, setContratista] = useState(
    editingObra ? editingObra.contratista : "CONSORCIO "
  );
  const [rucContratista, setRucContratista] = useState(
    editingObra ? editingObra.obra.rucContratista : "20" + Math.floor(Math.random() * 900000000 + 100000000)
  );
  const [supervisor, setSupervisor] = useState(
    editingObra ? editingObra.obra.supervisor : "SUPERVISIÓN "
  );
  const [rucSupervisor, setRucSupervisor] = useState(
    editingObra ? editingObra.obra.rucSupervisor : "20" + Math.floor(Math.random() * 900000000 + 100000000)
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
  const [fechaInicio, setFechaInicio] = useState(
    editingObra ? editingObra.obra.fechaInicio : new Date().toISOString().split("T")[0]
  );
  const [fechaFinProgramada, setFechaFinProgramada] = useState(() => {
    if (editingObra) return editingObra.obra.fechaFinProgramada;
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d.toISOString().split("T")[0];
  });
  const [adelantoDirectoOtorgado, setAdelantoDirectoOtorgado] = useState<number>(
    editingObra ? editingObra.obra.adelantoDirectoOtorgado : 250000
  );
  const [adelantoMaterialesOtorgado, setAdelantoMaterialesOtorgado] = useState<number>(
    editingObra ? editingObra.obra.adelantoMaterialesOtorgado : 500000
  );
  const [sistemaContratacion, setSistemaContratacion] = useState<ObraProyecto["sistemaContratacion"]>(
    editingObra ? editingObra.obra.sistemaContratacion : "A Precios Unitarios"
  );
  const [estado, setEstado] = useState<ObraProyecto["estado"]>(
    editingObra ? editingObra.estado : "En Ejecución"
  );
  const [ubicacion, setUbicacion] = useState(
    editingObra ? editingObra.obra.ubicacion : "Distrito, Provincia, Departamento"
  );
  const [tipologia, setTipologia] = useState<ObraProyecto["tipologia"]>(
    editingObra ? editingObra.obra.tipologia : "Edificaciones / Escuelas / Hospitales"
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cui.trim()) return;

    const obraObj: ObraProyecto = {
      id: editingObra ? editingObra.obra.id : `obra-${Date.now()}`,
      cui,
      nombre,
      entidad,
      contratista,
      rucContratista,
      supervisor,
      rucSupervisor,
      residente,
      dniResidente,
      cipResidente,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <HardHat className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingObra ? "Editar Proyecto de Obra" : "Registrar Nuevo Proyecto de Obra Pública"}
              </h3>
              <p className="text-xs text-indigo-200">
                Se creará un panel independiente de Curva S, valorizaciones mensuales, cuaderno digital y liquidación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CUI */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

            {/* Tipologia */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

            {/* Nombre de la Obra */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre Oficial de la Obra (PIP / IOARR) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ej: MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO EDUCATIVO DEL COLEGIO..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Entidad Convocante */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Entidad Contratante / Convocante *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: GOBIERNO REGIONAL DE SAN MARTÍN"
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Contratista */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contratista Ejecutor *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: CONSORCIO VIAL & EDIFICACIONES"
                value={contratista}
                onChange={(e) => setContratista(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* RUC Contratista */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                RUC Contratista
              </label>
              <input
                type="text"
                placeholder="Ej: 20542350033"
                value={rucContratista}
                onChange={(e) => setRucContratista(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Supervisor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supervisión de Obra
              </label>
              <input
                type="text"
                placeholder="Ej: CONSORCIO SUPERVISOR DEL ORIENTE"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* RUC Supervisor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                RUC Supervisión
              </label>
              <input
                type="text"
                placeholder="Ej: 20601280834"
                value={rucSupervisor}
                onChange={(e) => setRucSupervisor(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Residente */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Residente de Obra
              </label>
              <input
                type="text"
                placeholder="Ej: Ing. Marco Aurelio Vargas Delgado"
                value={residente}
                onChange={(e) => setResidente(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* CIP Residente */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CIP Residente
              </label>
              <input
                type="text"
                placeholder="Ej: CIP N° 108420"
                value={cipResidente}
                onChange={(e) => setCipResidente(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Monto Contractual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Monto Contractual Original (S/.) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={montoContractual}
                onChange={(e) => setMontoContractual(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-bold text-emerald-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Plazo Días */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Plazo Contractual (Días Calendario) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={plazoDias}
                onChange={(e) => setPlazoDias(parseInt(e.target.value) || 1)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha de Inicio de Plazo
              </label>
              <input
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Fecha Fin Programada */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Fin Programada
              </label>
              <input
                type="date"
                required
                value={fechaFinProgramada}
                onChange={(e) => setFechaFinProgramada(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Sistema de Contratacion */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sistema de Contratación
              </label>
              <select
                value={sistemaContratacion}
                onChange={(e) => setSistemaContratacion(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-medium"
              >
                <option value="A Precios Unitarios">A Precios Unitarios</option>
                <option value="A Suma Alzada">A Suma Alzada</option>
                <option value="Esquema Mixto">Esquema Mixto</option>
              </select>
            </div>

            {/* Estado Obra */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado de la Obra
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none font-medium"
              >
                <option value="En Ejecución">En Ejecución</option>
                <option value="Atrasada (>20%)">Atrasada (&gt;20%)</option>
                <option value="Adelantada">Adelantada</option>
                <option value="Paralizada">Paralizada</option>
                <option value="En Recepción">En Recepción</option>
                <option value="Liquidada">Liquidada</option>
              </select>
            </div>

            {/* Ubicación */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ubicación Geográfica
              </label>
              <input
                type="text"
                placeholder="Ej: Distrito de Rioja, Provincia de Rioja, Departamento de San Martín"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
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
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {editingObra ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingObra ? "Guardar Cambios del Proyecto" : "Registrar Proyecto de Obra"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
