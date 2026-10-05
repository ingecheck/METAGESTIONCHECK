import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Building2,
  HardHat,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import { ObraProyecto, UserObraPackage } from "../../types/obras";

interface NewObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveObra: (obra: UserObraPackage) => void;
  editingObra?: UserObraPackage | null;
}

export const NewObraModal: React.FC<NewObraModalProps> = ({
  isOpen,
  onClose,
  onSaveObra,
  editingObra,
}) => {
  const [nombre, setNombre] = useState("");
  const [cui, setCui] = useState("");
  const [entidad, setEntidad] = useState("MUNICIPALIDAD PROVINCIAL DE RIOJA");
  const [contratista, setContratista] = useState("");
  const [rucContratista, setRucContratista] = useState("");
  const [residente, setResidente] = useState("");
  const [cipResidente, setCipResidente] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [jefeSupervision, setJefeSupervision] = useState("");
  const [cipJefeSupervision, setCipJefeSupervision] = useState("");
  const [montoContractual, setMontoContractual] = useState<number>(0);
  const [plazoDias, setPlazoDias] = useState<number>(180);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinProgramada, setFechaFinProgramada] = useState("");
  const [sistemaContratacion, setSistemaContratacion] = useState<"A Suma Alzada" | "A Precios Unitarios" | "Esquema Mixto">("A Precios Unitarios");
  const [tipologia, setTipologia] = useState<"Carreteras y Vías" | "Edificaciones / Escuelas / Hospitales" | "Saneamiento y Agua Potable" | "Defensa Ribereña / Puentes">("Carreteras y Vías");
  const [ubicacion, setUbicacion] = useState("Rioja, San Martín");
  const [numeroDocumentoContratista, setNumeroDocumentoContratista] = useState("");
  const [numeroDocumentoSupervisor, setNumeroDocumentoSupervisor] = useState("");
  const [estado, setEstado] = useState<ObraProyecto["estado"]>("En Ejecución");

  useEffect(() => {
    if (editingObra) {
      setNombre(editingObra.nombre);
      setCui(editingObra.cui);
      setEntidad(editingObra.entidad);
      setContratista(editingObra.contratista);
      setRucContratista(editingObra.obra.rucContratista || "");
      setResidente(editingObra.obra.residente || "");
      setCipResidente(editingObra.obra.cipResidente || "");
      setSupervisor(editingObra.obra.supervisor || "");
      setJefeSupervision(editingObra.obra.jefeSupervision || "");
      setCipJefeSupervision(editingObra.obra.cipJefeSupervision || "");
      setMontoContractual(editingObra.montoContractual || 0);
      setPlazoDias(editingObra.obra.plazoDias || 180);
      setFechaInicio(editingObra.obra.fechaInicio || "");
      setFechaFinProgramada(editingObra.obra.fechaFinProgramada || "");
      setSistemaContratacion(editingObra.obra.sistemaContratacion || "A Precios Unitarios");
      setTipologia(editingObra.obra.tipologia || "Carreteras y Vías");
      setUbicacion(editingObra.obra.ubicacion || "Rioja, San Martín");
      setNumeroDocumentoContratista(editingObra.obra.numeroDocumentoContratista || "");
      setNumeroDocumentoSupervisor(editingObra.obra.numeroDocumentoSupervisor || "");
      setEstado(editingObra.estado || "En Ejecución");
    } else {
      setNombre("");
      setCui("");
      setEntidad("MUNICIPALIDAD PROVINCIAL DE RIOJA");
      setContratista("");
      setRucContratista("");
      setResidente("");
      setCipResidente("");
      setSupervisor("");
      setJefeSupervision("");
      setCipJefeSupervision("");
      setMontoContractual(0);
      setPlazoDias(180);
      setFechaInicio("");
      setFechaFinProgramada("");
      setSistemaContratacion("A Precios Unitarios");
      setTipologia("Carreteras y Vías");
      setUbicacion("Rioja, San Martín");
      setNumeroDocumentoContratista("");
      setNumeroDocumentoSupervisor("");
      setEstado("En Ejecución");
    }
  }, [editingObra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const obraId = editingObra?.id || `obra-${Date.now()}`;
    const cleanCui = cui.trim() || `2${Math.floor(Math.random() * 900000 + 100000)}`;

    const obraData: ObraProyecto = {
      ...(editingObra?.obra || {}),
      id: obraId,
      nombre: nombre.trim(),
      cui: cleanCui,
      entidad: entidad.trim(),
      contratista: contratista.trim() || "CONSORCIO EJECUTOR",
      rucContratista: rucContratista.trim(),
      residente: residente.trim(),
      dniResidente: editingObra?.obra?.dniResidente || "",
      cipResidente: cipResidente.trim(),
      supervisor: supervisor.trim() || "SUPERVISIÓN EXTERNA",
      rucSupervisor: editingObra?.obra?.rucSupervisor || "",
      jefeSupervision: jefeSupervision.trim(),
      cipJefeSupervision: cipJefeSupervision.trim(),
      montoContractual: Number(montoContractual) || 0,
      plazoDias: Number(plazoDias) || 180,
      fechaInicio: fechaInicio.trim(),
      fechaFinProgramada: fechaFinProgramada.trim(),
      adelantoDirectoOtorgado: editingObra?.obra?.adelantoDirectoOtorgado || 0,
      adelantoMaterialesOtorgado: editingObra?.obra?.adelantoMaterialesOtorgado || 0,
      sistemaContratacion,
      estado,
      ubicacion: ubicacion.trim(),
      tipologia,
      numeroDocumentoContratista: numeroDocumentoContratista.trim(),
      numeroDocumentoSupervisor: numeroDocumentoSupervisor.trim(),
    };

    const packageData: UserObraPackage = {
      id: obraId,
      cui: cleanCui,
      nombre: nombre.trim(),
      entidad: entidad.trim(),
      contratista: contratista.trim() || "CONSORCIO EJECUTOR",
      montoContractual: Number(montoContractual) || 0,
      estado,
      createdAt: editingObra?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      obra: obraData,
      valorizaciones: editingObra?.valorizaciones || [],
      asientos: editingObra?.asientos || [],
      modificaciones: editingObra?.modificaciones || [],
      liquidacion: editingObra?.liquidacion || {
        montoFinalLiquidado: Number(montoContractual) || 0,
        saldoAFavorContratista: 0,
        penalidadesAplicadas: 0,
        estadoLiquidacion: "Pendiente",
        observaciones: "",
      },
      partidas: editingObra?.partidas || [],
      auditorias: editingObra?.auditorias || [],
      bimModel: editingObra?.bimModel,
    };

    onSaveObra(packageData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                {editingObra ? "Editar Proyecto de Obra" : "Registrar Nuevo Proyecto de Obra"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa los datos generales para el expediente y panel de control
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>1. Identificación de la Obra</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre Completo del Proyecto / Obra *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. MEJORAMIENTO DEL SERVICIO EDUCATIVO EN LA I.E. 001..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Código CUI (invierte.pe):
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 2548912"
                    value={cui}
                    onChange={(e) => setCui(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tipología:
                  </label>
                  <select
                    value={tipologia}
                    onChange={(e) => setTipologia(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Carreteras y Vías">Carreteras y Vías</option>
                    <option value="Edificaciones / Escuelas / Hospitales">Edificaciones / Escuelas</option>
                    <option value="Saneamiento y Agua Potable">Saneamiento y Agua Potable</option>
                    <option value="Defensa Ribereña / Puentes">Defensa Ribereña / Puentes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Estado Actual:
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="En Ejecución">En Ejecución</option>
                    <option value="Adelantada">Adelantada</option>
                    <option value="Atrasada (>20%)">Atrasada (&gt;20%)</option>
                    <option value="Paralizada">Paralizada</option>
                    <option value="En Recepción">En Recepción</option>
                    <option value="Liquidada">Liquidada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Contratos y Montos */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Contratación, Ejecución y Supervisión</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Monto Contractual (S/.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoContractual}
                  onChange={(e) => setMontoContractual(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Plazo Contractual (Días):
                </label>
                <input
                  type="number"
                  value={plazoDias}
                  onChange={(e) => setPlazoDias(parseInt(e.target.value, 10) || 180)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sistema de Contratación:
                </label>
                <select
                  value={sistemaContratacion}
                  onChange={(e) => setSistemaContratacion(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="A Precios Unitarios">A Precios Unitarios</option>
                  <option value="A Suma Alzada">A Suma Alzada</option>
                  <option value="Esquema Mixto">Esquema Mixto</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contratista Ejecutor:
                </label>
                <input
                  type="text"
                  placeholder="ej. CONSORCIO INGENIERÍA"
                  value={contratista}
                  onChange={(e) => setContratista(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  N° Contrato Ejecutor:
                </label>
                <input
                  type="text"
                  placeholder="ej. Contrato N° 012-2026"
                  value={numeroDocumentoContratista}
                  onChange={(e) => setNumeroDocumentoContratista(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ingeniero Residente:
                </label>
                <input
                  type="text"
                  placeholder="ej. ING. JUAN PÉREZ"
                  value={residente}
                  onChange={(e) => setResidente(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Supervisión / Inspector:
                </label>
                <input
                  type="text"
                  placeholder="ej. CONSORCIO SUPERVISOR"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  N° Contrato Supervisión:
                </label>
                <input
                  type="text"
                  placeholder="ej. OS N° 450-2026"
                  value={numeroDocumentoSupervisor}
                  onChange={(e) => setNumeroDocumentoSupervisor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Jefe de Supervisión:
                </label>
                <input
                  type="text"
                  placeholder="ej. ING. MARCO ANTONIO"
                  value={jefeSupervision}
                  onChange={(e) => setJefeSupervision(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingObra ? "Guardar Cambios" : "Crear y Abrir Obra"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
