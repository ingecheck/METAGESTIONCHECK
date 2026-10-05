import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  FolderKanban,
  Building2,
  HardHat,
  Calendar,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { EstadoCartera, ProyectoCartera } from "../../types/seguimientoCartera";

interface NewCarteraObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveObra: (form: {
    proyecto: string;
    cui: string;
    encargado: string;
    estado: EstadoCartera;
    contratoEjecucionNumero: string;
    contratoEjecucionMonto: number;
    contratoEjecucionEmpresa: string;
    residenteNombre: string;
    contratoSupervisionNumero: string;
    contratoSupervisionMonto: number;
    contratoSupervisionEmpresa: string;
    supervisorNombre: string;
    entregaTerrenoFecha: string;
    docEntregaTerreno: string;
    inicioObraFecha: string;
    docInicioObra: string;
    plazoDias: number;
    fechaTerminoActualizado: string;
    observaciones: string;
  }) => void;
  entityDisplayName: string;
  initialObra?: ProyectoCartera | null;
}

export const NewCarteraObraModal: React.FC<NewCarteraObraModalProps> = ({
  isOpen,
  onClose,
  onSaveObra,
  entityDisplayName,
  initialObra,
}) => {
  const [proyecto, setProyecto] = useState("");
  const [cui, setCui] = useState("");
  const [encargado, setEncargado] = useState("JHON");
  const [estado, setEstado] = useState<EstadoCartera>("PENDIENTE_INICIO_CONDICIONES");

  // Contrato Ejecución
  const [contratoEjecucionNumero, setContratoEjecucionNumero] = useState("");
  const [contratoEjecucionMonto, setContratoEjecucionMonto] = useState<number>(0);
  const [contratoEjecucionEmpresa, setContratoEjecucionEmpresa] = useState("");
  const [residenteNombre, setResidenteNombre] = useState("");

  // Contrato Supervisión
  const [contratoSupervisionNumero, setContratoSupervisionNumero] = useState("");
  const [contratoSupervisionMonto, setContratoSupervisionMonto] = useState<number>(0);
  const [contratoSupervisionEmpresa, setContratoSupervisionEmpresa] = useState("");
  const [supervisorNombre, setSupervisorNombre] = useState("");

  // Fechas y Documentos de Aprobación
  const [entregaTerrenoFecha, setEntregaTerrenoFecha] = useState("");
  const [docEntregaTerreno, setDocEntregaTerreno] = useState("");
  const [inicioObraFecha, setInicioObraFecha] = useState("");
  const [docInicioObra, setDocInicioObra] = useState("");
  const [plazoDias, setPlazoDias] = useState<number>(120);
  const [fechaTerminoActualizado, setFechaTerminoActualizado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialObra) {
      setProyecto(initialObra.proyecto || "");
      setCui(initialObra.cui || "");
      setEncargado(initialObra.encargado || "JHON");
      setEstado(initialObra.estado || "PENDIENTE_INICIO_CONDICIONES");
      setContratoEjecucionNumero(initialObra.contratoEjecucionNumero || "");
      setContratoEjecucionMonto(initialObra.contratoEjecucionMonto || 0);
      setContratoEjecucionEmpresa(initialObra.contratoEjecucionEmpresa || "");
      setResidenteNombre(initialObra.residenteNombre || "");
      setContratoSupervisionNumero(initialObra.contratoSupervisionNumero || "");
      setContratoSupervisionMonto(initialObra.contratoSupervisionMonto || 0);
      setContratoSupervisionEmpresa(initialObra.contratoSupervisionEmpresa || "");
      setSupervisorNombre(initialObra.supervisorNombre || "");
      setEntregaTerrenoFecha(initialObra.entregaTerrenoFecha || "");
      setDocEntregaTerreno(
        initialObra.hitos?.find((h) => h.id === "hito-terreno")?.documentoSustento || ""
      );
      setInicioObraFecha(initialObra.inicioObraFecha || "");
      setDocInicioObra(
        initialObra.hitos?.find((h) => h.id === "hito-acta-inicio")?.documentoSustento || ""
      );
      setPlazoDias(initialObra.plazoDias || 120);
      setFechaTerminoActualizado(initialObra.fechaTerminoActualizado || "");
      setObservaciones(initialObra.observaciones || "");
    } else {
      setProyecto("");
      setCui("");
      setEncargado("JHON");
      setEstado("PENDIENTE_INICIO_CONDICIONES");
      setContratoEjecucionNumero("");
      setContratoEjecucionMonto(0);
      setContratoEjecucionEmpresa("");
      setResidenteNombre("");
      setContratoSupervisionNumero("");
      setContratoSupervisionMonto(0);
      setContratoSupervisionEmpresa("");
      setSupervisorNombre("");
      setEntregaTerrenoFecha("");
      setDocEntregaTerreno("");
      setInicioObraFecha("");
      setDocInicioObra("");
      setPlazoDias(120);
      setFechaTerminoActualizado("");
      setObservaciones("");
    }
  }, [initialObra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto.trim()) {
      setErrorMsg("Debe ingresar el nombre o denominación del proyecto de obra.");
      return;
    }

    onSaveObra({
      proyecto: proyecto.trim(),
      cui: cui.trim() || `2${Math.floor(Math.random() * 900000 + 100000)}`,
      encargado,
      estado,
      contratoEjecucionNumero: contratoEjecucionNumero.trim(),
      contratoEjecucionMonto,
      contratoEjecucionEmpresa: contratoEjecucionEmpresa.trim(),
      residenteNombre: residenteNombre.trim(),
      contratoSupervisionNumero: contratoSupervisionNumero.trim(),
      contratoSupervisionMonto,
      contratoSupervisionEmpresa: contratoSupervisionEmpresa.trim(),
      supervisorNombre: supervisorNombre.trim(),
      entregaTerrenoFecha,
      docEntregaTerreno,
      inicioObraFecha,
      docInicioObra,
      plazoDias,
      fechaTerminoActualizado,
      observaciones: observaciones.trim() || "Obra registrada recientemente en la matriz de seguimiento.",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              {initialObra ? <Edit2 className="w-5 h-5 text-slate-950" /> : <Plus className="w-5 h-5 text-slate-950" />}
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>{initialObra ? "Editar Datos de la Obra en la Matriz" : "Registrar Nueva Obra en la Matriz"}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-mono font-bold">
                  {entityDisplayName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {initialObra
                  ? `Modificando registro: ${initialObra.proyecto} (CUI: ${initialObra.cui})`
                  : "Se inicializará automáticamente el checklist normativo y la suite de control"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold">
              {errorMsg}
            </div>
          )}

          {/* 1. Datos Principales */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Identificación del Proyecto</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre del Proyecto / Vía / Obra: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. CREACIÓN DEL PUENTE VEHICULAR SOBRE EL RÍO RIOJA..."
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código Único (CUI):
                </label>
                <input
                  type="text"
                  placeholder="ej. 2650123"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ingeniero Encargado (OEI):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="encargados-datalist"
                    placeholder="ej. JHON, CARLOS, MARIELA..."
                    value={encargado}
                    onChange={(e) => setEncargado(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                  <datalist id="encargados-datalist">
                    <option value="JHON" />
                    <option value="JHENIFER" />
                    <option value="JEZER" />
                    <option value="JOSUE" />
                    <option value="LUIS" />
                    <option value="PICO" />
                    <option value="CARLOS" />
                    <option value="MARIELA" />
                    <option value="EDSON" />
                    <option value="SIN ASIGNAR" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Estado Inicial:
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoCartera)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="PENDIENTE_INICIO_CONDICIONES">⏳ Pendiente Inicio (Condiciones Previas)</option>
                  <option value="EN_EJECUCION">🚧 En Ejecución Física</option>
                  <option value="ACTOS_PREPARATORIOS">📋 Actos Preparatorios / Selección</option>
                  <option value="RECEPCIONADA">🏁 Recepcionada</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Plazo Contractual (Días):
                </label>
                <input
                  type="number"
                  min={1}
                  value={plazoDias}
                  onChange={(e) => setPlazoDias(parseInt(e.target.value, 10) || 120)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Contrato de Ejecución */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Contrato de Ejecución de Obra (Contratista)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  N° de Contrato:
                </label>
                <input
                  type="text"
                  placeholder="ej. CONTRATO N° 045-2026-MPR"
                  value={contratoEjecucionNumero}
                  onChange={(e) => setContratoEjecucionNumero(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Monto Contractual (S/):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="ej. 2450000.00"
                  value={contratoEjecucionMonto || ""}
                  onChange={(e) => setContratoEjecucionMonto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Empresa Contratista:
                </label>
                <input
                  type="text"
                  placeholder="ej. CONSORCIO EJECUTOR RIOJA"
                  value={contratoEjecucionEmpresa}
                  onChange={(e) => setContratoEjecucionEmpresa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Residente de Obra:
                </label>
                <input
                  type="text"
                  placeholder="ej. Ing. Juan Pérez (CIP 189230)"
                  value={residenteNombre}
                  onChange={(e) => setResidenteNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Contrato de Supervisión */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Contrato u Orden de Supervisión / Inspectoría</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contrato / O.S. N°:
                </label>
                <input
                  type="text"
                  placeholder="ej. CONTRATO N° 012-2026-CS o O.S. 452"
                  value={contratoSupervisionNumero}
                  onChange={(e) => setContratoSupervisionNumero(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Monto Supervisión (S/):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="ej. 125000.00"
                  value={contratoSupervisionMonto || ""}
                  onChange={(e) => setContratoSupervisionMonto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-blue-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Empresa / Consultor Supervisor:
                </label>
                <input
                  type="text"
                  placeholder="ej. SUPERVISIÓN Y CONTROL SAC"
                  value={contratoSupervisionEmpresa}
                  onChange={(e) => setContratoSupervisionEmpresa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Jefe de Supervisión:
                </label>
                <input
                  type="text"
                  placeholder="ej. Ing. Carlos Mendoza (CIP 178234)"
                  value={supervisorNombre}
                  onChange={(e) => setSupervisorNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Fechas Clave y Documentos de Aprobación */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Fechas Clave y Documentos de Aprobación de la Entidad</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Entrega de Terreno:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Fecha:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={entregaTerrenoFecha}
                      onChange={(e) => setEntregaTerrenoFecha(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono font-bold text-slate-900 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Doc. Aprobación:</label>
                    <input
                      type="text"
                      placeholder="ej. Acta in situ"
                      value={docEntregaTerreno}
                      onChange={(e) => setDocEntregaTerreno(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-semibold text-slate-900 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Inicio de Obra:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Fecha:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={inicioObraFecha}
                      onChange={(e) => setInicioObraFecha(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono font-bold text-emerald-800 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Doc. Aprobación:</label>
                    <input
                      type="text"
                      placeholder="ej. Acta de Inicio"
                      value={docInicioObra}
                      onChange={(e) => setDocInicioObra(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-semibold text-slate-900 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fecha de Término Vigente:
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={fechaTerminoActualizado}
                  onChange={(e) => setFechaTerminoActualizado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Observaciones Iniciales:
                </label>
                <input
                  type="text"
                  placeholder="Anotaciones de seguimiento..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              {initialObra ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Guardar Modificaciones de la Obra</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Guardar Nueva Obra</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
