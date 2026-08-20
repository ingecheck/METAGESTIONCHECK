import React, { useState } from "react";
import { X, Plus, Building2, FileText, CheckCircle2 } from "lucide-react";
import { TenderInfo, ObjectType, TenderType, ContractingSystem, UserOfferPackage } from "../types/osce";
import { EMPTY_TENDER } from "../data/sampleTenders";

interface NewOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOffer: (newOffer: UserOfferPackage) => void;
  editingOffer?: UserOfferPackage | null;
}

export const NewOfferModal: React.FC<NewOfferModalProps> = ({
  isOpen,
  onClose,
  onSaveOffer,
  editingOffer,
}) => {
  const [nomenclatura, setNomenclatura] = useState(
    editingOffer ? editingOffer.nomenclatura : "AS-SM-2026-OBRA-0" + Math.floor(Math.random() * 90 + 10)
  );
  const [nombreProyecto, setNombreProyecto] = useState(
    editingOffer ? editingOffer.nombreProyecto : ""
  );
  const [cui, setCui] = useState(editingOffer ? editingOffer.cui || "" : "");
  const [entidad, setEntidad] = useState(
    editingOffer ? editingOffer.entidad : "MUNICIPALIDAD DISTRITAL DE "
  );
  const [objetoContratacion, setObjetoContratacion] = useState<ObjectType>(
    editingOffer ? editingOffer.objetoContratacion : "Ejecución de Obras"
  );
  const [tipoProcedimiento, setTipoProcedimiento] = useState<TenderType>(
    editingOffer ? editingOffer.tender.tipoProcedimiento : "Adjudicación Simplificada"
  );
  const [sistemaContratacion, setSistemaContratacion] = useState<ContractingSystem>(
    editingOffer ? editingOffer.tender.sistemaContratacion : "Suma Alzada"
  );
  const [valorNumerico, setValorNumerico] = useState<number>(
    editingOffer ? editingOffer.valorNumerico : 500000
  );
  const [plazoDias, setPlazoDias] = useState<number>(
    editingOffer ? editingOffer.tender.plazoDias || 90 : 90
  );
  const [lugarEjecucion, setLugarEjecucion] = useState(
    editingOffer ? editingOffer.tender.lugarEjecucion || "" : "Cusco, Cusco, San Jerónimo"
  );
  const [especialidad, setEspecialidad] = useState(
    editingOffer ? editingOffer.tender.especialidad || "" : "Obras Viales y Pavimentación Urbana"
  );
  const [estadoOferta, setEstadoOferta] = useState<UserOfferPackage["estadoOferta"]>(
    editingOffer ? editingOffer.estadoOferta : "En Formulación"
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomenclatura.trim()) return;

    const valorFormat = `S/ ${valorNumerico.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
    const plazoFormat = `${plazoDias} días calendario`;

    const updatedTenderInfo: TenderInfo = editingOffer
      ? {
          ...editingOffer.tender,
          nomenclatura,
          nombreProyectoInversion: nombreProyecto,
          codigoInversionCUI: cui,
          entidadConvocante: entidad,
          objetoContratacion,
          tipoProcedimiento,
          sistemaContratacion,
          valorEstimadoReferencial: valorFormat,
          valorReferencial: valorNumerico.toString(),
          valorNumerico,
          plazoEjecucion: plazoFormat,
          plazoDias,
          lugarEjecucion,
          especialidad,
        }
      : {
          ...EMPTY_TENDER,
          id: `tender-${Date.now()}`,
          nomenclatura,
          nombreProyectoInversion: nombreProyecto,
          codigoInversionCUI: cui,
          entidadConvocante: entidad,
          objetoContratacion,
          tipoProcedimiento,
          sistemaContratacion,
          valorEstimadoReferencial: valorFormat,
          valorReferencial: valorNumerico.toString(),
          valorNumerico,
          plazoEjecucion: plazoFormat,
          plazoDias,
          lugarEjecucion,
          especialidad,
          resumenAlcance: nombreProyecto || `PROCESO DE CONTRATACIÓN DE ${objetoContratacion.toUpperCase()}`,
        };

    const offerPackage: UserOfferPackage = {
      id: editingOffer ? editingOffer.id : `oferta-${Date.now()}`,
      nomenclatura,
      nombreProyecto: nombreProyecto || nomenclatura,
      entidad,
      cui: cui || undefined,
      objetoContratacion,
      valorEstimadoReferencial: valorFormat,
      valorNumerico,
      plazoEjecucion: plazoFormat,
      estadoOferta,
      createdAt: editingOffer ? editingOffer.createdAt : new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      tender: updatedTenderInfo,
      personal: editingOffer ? editingOffer.personal : [],
      equipment: editingOffer ? editingOffer.equipment : [],
      experience: editingOffer ? editingOffer.experience : [],
      observations: editingOffer ? editingOffer.observations : [],
      montoOfertado: editingOffer ? editingOffer.montoOfertado : valorNumerico,
      incluyeIGV: editingOffer ? editingOffer.incluyeIGV : true,
    };

    onSaveOffer(offerPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingOffer ? "Editar Convocatoria / Oferta" : "Registrar Nueva Oferta / Convocatoria SEACE"}
              </h3>
              <p className="text-xs text-blue-100">
                Se creará un expediente independiente con sus propios anexos, experiencia y personal
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
            {/* Nomenclatura */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomenclatura del Proceso *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: AS-SM-04-2026-MTC/10"
                value={nomenclatura}
                onChange={(e) => setNomenclatura(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* CUI */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Código CUI / SNIP (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 2548912"
                value={cui}
                onChange={(e) => setCui(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* Nombre Proyecto */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Proyecto de Inversión / Objeto *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ej: MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE MOVILIDAD URBANA EN..."
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Entidad Convocante */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Entidad Convocante *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: MUNICIPALIDAD PROVINCIAL DE..."
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Objeto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Objeto de Contratación
              </label>
              <select
                value={objetoContratacion}
                onChange={(e) => setObjetoContratacion(e.target.value as ObjectType)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="Ejecución de Obras">Ejecución de Obras</option>
                <option value="Consultoría de Obra">Consultoría de Obra</option>
                <option value="Consultoría en General">Consultoría en General</option>
                <option value="Servicios en General">Servicios en General</option>
                <option value="Bienes">Bienes</option>
              </select>
            </div>

            {/* Tipo Procedimiento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Procedimiento
              </label>
              <select
                value={tipoProcedimiento}
                onChange={(e) => setTipoProcedimiento(e.target.value as TenderType)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="Adjudicación Simplificada">Adjudicación Simplificada</option>
                <option value="Licitación Pública">Licitación Pública</option>
                <option value="Concurso Público">Concurso Público</option>
                <option value="Subasta Inversa Electrónica">Subasta Inversa Electrónica</option>
                <option value="Contratación Directa">Contratación Directa</option>
              </select>
            </div>

            {/* Sistema */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sistema de Contratación
              </label>
              <select
                value={sistemaContratacion}
                onChange={(e) => setSistemaContratacion(e.target.value as ContractingSystem)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="Suma Alzada">Suma Alzada</option>
                <option value="Precios Unitarios">Precios Unitarios</option>
                <option value="Esquema Mixto">Esquema Mixto</option>
                <option value="Tarifas">Tarifas</option>
              </select>
            </div>

            {/* Valor Referencial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valor Referencial (S/.) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={valorNumerico}
                onChange={(e) => setValorNumerico(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-bold text-emerald-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* Plazo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Plazo de Ejecución (Días)
              </label>
              <input
                type="number"
                min="1"
                required
                value={plazoDias}
                onChange={(e) => setPlazoDias(parseInt(e.target.value) || 1)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado de la Oferta
              </label>
              <select
                value={estadoOferta}
                onChange={(e) => setEstadoOferta(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="En Formulación">En Formulación</option>
                <option value="Lista para Presentar">Lista para Presentar</option>
                <option value="Observada / En Subsanación">Observada / En Subsanación</option>
                <option value="Adjudicada">Adjudicada ✓</option>
                <option value="No Presentada">No Presentada</option>
              </select>
            </div>

            {/* Especialidad */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Especialidad Requerida
              </label>
              <input
                type="text"
                placeholder="Ej: Obras Viales y Pavimentación Urbana"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Lugar */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lugar de Ejecución
              </label>
              <input
                type="text"
                placeholder="Ej: Cusco, Cusco, San Jerónimo"
                value={lugarEjecucion}
                onChange={(e) => setLugarEjecucion(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:border-blue-500 focus:outline-none"
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
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {editingOffer ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingOffer ? "Guardar Cambios" : "Crear Expediente de Oferta"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
