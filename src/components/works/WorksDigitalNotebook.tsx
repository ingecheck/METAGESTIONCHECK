import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  HardHat,
  MessageSquare,
  FileCheck2,
  Calendar,
  CloudSun,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { AsientoCuadernoObra, ObraProyecto } from "../../types/obras";

interface WorksDigitalNotebookProps {
  obra: ObraProyecto;
  asientos: AsientoCuadernoObra[];
  setAsientos: React.Dispatch<React.SetStateAction<AsientoCuadernoObra[]>>;
}

export const WorksDigitalNotebook: React.FC<WorksDigitalNotebookProps> = ({
  obra,
  asientos,
  setAsientos,
}) => {
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Asiento Form State
  const [newAutor, setNewAutor] = useState<"Residente de Obra" | "Supervisor de Obra">("Residente de Obra");
  const [newTipo, setNewTipo] = useState<AsientoCuadernoObra["tipoAsiento"]>("Diario de Operaciones");
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newPartidas, setNewPartidas] = useState("");
  const [newPersonal, setNewPersonal] = useState<number>(20);
  const [newMaquinaria, setNewMaquinaria] = useState("");
  const [newClima, setNewClima] = useState<"Soleado" | "Lluvias Intensas (Paralización)" | "Nublado / Viento">("Soleado");

  const filteredAsientos = asientos.filter((a) => {
    const matchesRole =
      filterRole === "all" ||
      (filterRole === "residente" && a.autor === "Residente de Obra") ||
      (filterRole === "supervisor" && a.autor.includes("Supervisor"));

    const matchesType = filterType === "all" || a.tipoAsiento === filterType;

    const matchesSearch =
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numeroAsiento.toString().includes(searchTerm);

    return matchesRole && matchesType && matchesSearch;
  });

  const handleCreateAsiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitulo.trim() || !newDescripcion.trim()) return;

    const nextNumber = Math.max(...asientos.map((a) => a.numeroAsiento), 0) + 1;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} hrs`;

    const newAsientoItem: AsientoCuadernoObra = {
      id: `asiento-${Date.now()}`,
      numeroAsiento: nextNumber,
      fecha: dateStr,
      hora: timeStr,
      autor: newAutor,
      nombreAutor: newAutor === "Residente de Obra" ? obra.residente : obra.supervisor,
      cargoAutor: newAutor === "Residente de Obra" ? "Ingeniero Residente" : "Jefe de Supervisión",
      tipoAsiento: newTipo,
      titulo: newTitulo.toUpperCase(),
      descripcion: newDescripcion,
      partidasEjecutadas: newPartidas || undefined,
      personalEnCampo: newPersonal || undefined,
      maquinariaActiva: newMaquinaria || undefined,
      clima: newClima,
      estadoRespuesta: newTipo.includes("Consulta") ? "Requiere Pronunciamiento" : "Informativo / Registrado",
    };

    setAsientos([newAsientoItem, ...asientos]);
    setNewTitulo("");
    setNewDescripcion("");
    setNewPartidas("");
    setNewMaquinaria("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Módulo 2 • Control de Obras • Cuaderno de Obra Digital (Directiva N° 009-2020-OSCE/CD)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Cuaderno de Obra Digital (C.O.D.)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Registro oficial cronológico e inalterable de ocurrencias, anotaciones diarias de avance, consultas técnicas al proyectista y apertura formal de causales de ampliación de plazo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Asentar Nuevo Asiento</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° de Asiento, palabras clave, título o descripción técnica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none"
            >
              <option value="all">Todos los Autores</option>
              <option value="residente">Solo Residencia (Contratista)</option>
              <option value="supervisor">Solo Supervisión</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none"
            >
              <option value="all">Todos los Tipos</option>
              <option value="Diario de Operaciones">Diario de Operaciones</option>
              <option value="Consulta de Obra">Consulta de Obra</option>
              <option value="Respuesta a Consulta">Respuesta a Consulta</option>
              <option value="Causal de Ampliación de Plazo">Causal Ampliación Plazo</option>
              <option value="Anotación de Adicional de Obra">Adicional de Obra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asientos Chronological Feed */}
      <div className="space-y-4">
        {filteredAsientos.map((asiento) => {
          const isSupervisor = asiento.autor.includes("Supervisor");
          const isAmpliacion = asiento.tipoAsiento.includes("Ampliación");
          const isConsulta = asiento.tipoAsiento.includes("Consulta");

          return (
            <div
              key={asiento.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition ${
                isAmpliacion
                  ? "border-amber-300 bg-amber-50/10"
                  : isSupervisor
                  ? "border-indigo-200"
                  : "border-slate-200"
              }`}
            >
              {/* Asiento Top Header Bar */}
              <div
                className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${
                  isSupervisor
                    ? "bg-slate-900 text-white"
                    : "bg-slate-800 text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-black text-xs shadow-xs">
                    N° {asiento.numeroAsiento}
                  </span>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>{asiento.autor}</span>
                      <span className="text-[10px] font-normal opacity-80 font-mono">
                        ({asiento.nombreAutor})
                      </span>
                    </div>
                    <div className="text-[10px] opacity-75 font-mono">
                      {asiento.fecha} • {asiento.hora}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isAmpliacion
                        ? "bg-amber-500 text-slate-950 font-black"
                        : isConsulta
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {asiento.tipoAsiento}
                  </span>
                </div>
              </div>

              {/* Asiento Content */}
              <div className="p-5 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {asiento.titulo}
                </h3>

                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {asiento.descripcion}
                </p>

                {/* Additional Technical Metadata */}
                {(asiento.partidasEjecutadas || asiento.personalEnCampo || asiento.maquinariaActiva || asiento.clima) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-[11px]">
                    {asiento.partidasEjecutadas && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[10px]">Partidas Ejecutadas:</span>
                        <span className="font-medium text-slate-800">{asiento.partidasEjecutadas}</span>
                      </div>
                    )}

                    {asiento.personalEnCampo && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[10px]">Personal en Campo:</span>
                        <span className="font-bold text-indigo-900">{asiento.personalEnCampo} operarios y oficiales</span>
                      </div>
                    )}

                    {asiento.maquinariaActiva && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[10px]">Maquinaria Activa:</span>
                        <span className="font-medium text-slate-800">{asiento.maquinariaActiva}</span>
                      </div>
                    )}

                    {asiento.clima && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-semibold block text-[10px]">Condición Climática:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                          {asiento.clima}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footing info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
                  <span>Firma Digital Registrada en Servidores OSCE / SEACE</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Asiento Inalterable y Certificado
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Register New Asiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Asentar Nuevo Asiento en Cuaderno de Obra Digital
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsiento} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Autor del Asiento:</label>
                  <select
                    value={newAutor}
                    onChange={(e) => setNewAutor(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  >
                    <option value="Residente de Obra">Residente de Obra ({obra.residente})</option>
                    <option value="Supervisor de Obra">Supervisor de Obra ({obra.supervisor})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Asiento:</label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                  >
                    <option value="Diario de Operaciones">Diario de Operaciones</option>
                    <option value="Consulta de Obra">Consulta de Obra (Art. 193 RLCE)</option>
                    <option value="Respuesta a Consulta">Respuesta a Consulta</option>
                    <option value="Causal de Ampliación de Plazo">Causal de Ampliación de Plazo (Art. 197 RLCE)</option>
                    <option value="Anotación de Adicional de Obra">Anotación de Adicional de Obra (Art. 205 RLCE)</option>
                    <option value="Clima y Fenómenos Naturales">Clima y Fenómenos Naturales</option>
                    <option value="Seguridad y Salud en el Trabajo">Seguridad y Salud en el Trabajo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Asiento:</label>
                <input
                  type="text"
                  value={newTitulo}
                  onChange={(e) => setNewTitulo(e.target.value)}
                  placeholder="Ej: VACIADO DE CONCRETO EN ZAPATAS Y TRAZO DE MUROS"
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Técnica Detallada:</label>
                <textarea
                  rows={4}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder="Detalle los trabajos efectuados, progresivas, incidencias, consultas o sustentación legal..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Partidas Ejecutadas:</label>
                  <input
                    type="text"
                    value={newPartidas}
                    onChange={(e) => setNewPartidas(e.target.value)}
                    placeholder="02.01, 02.03..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Personal en Campo:</label>
                  <input
                    type="number"
                    value={newPersonal}
                    onChange={(e) => setNewPersonal(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condición Climática:</label>
                  <select
                    value={newClima}
                    onChange={(e) => setNewClima(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Soleado">Soleado</option>
                    <option value="Lluvias Intensas (Paralización)">Lluvias Intensas (Paralización)</option>
                    <option value="Nublado / Viento">Nublado / Viento</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Firmar y Asentar Asiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
