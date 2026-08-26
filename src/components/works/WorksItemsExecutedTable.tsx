import React, { useState } from "react";
import {
  Table,
  Filter,
  Search,
  Plus,
  Download,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Edit2,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Building,
  Check,
  X,
} from "lucide-react";
import { ObraProyecto, PartidaEjecutada } from "../../types/obras";
import { SAMPLE_PARTIDAS_OBRA } from "../../data/samplePartidas";

interface WorksItemsExecutedTableProps {
  obra: ObraProyecto;
  partidas: PartidaEjecutada[];
  setPartidas: React.Dispatch<React.SetStateAction<PartidaEjecutada[]>>;
  mesSeleccionado?: string;
}

export const WorksItemsExecutedTable: React.FC<WorksItemsExecutedTableProps> = ({
  obra,
  partidas,
  setPartidas,
  mesSeleccionado = "Mes 5 - Mayo 2025",
}) => {
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("TODAS");
  const [selectedEstado, setSelectedEstado] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);
  const [editMetradoActual, setEditMetradoActual] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Partida form state
  const [newPartida, setNewPartida] = useState<Partial<PartidaEjecutada>>({
    item: "",
    descripcion: "",
    especialidad: "Estructuras",
    unidad: "m3",
    precioUnitario: 0,
    metradoContractual: 0,
    metradoAnterior: 0,
    metradoActual: 0,
  });

  // Load sample template if list is empty
  const handleLoadSampleTemplate = () => {
    setPartidas(SAMPLE_PARTIDAS_OBRA);
  };

  const handleClearPartidas = () => {
    setPartidas([]);
  };

  // Filtered partidas
  const filteredPartidas = partidas.filter((p) => {
    const matchesEsp =
      selectedEspecialidad === "TODAS" || p.especialidad === selectedEspecialidad;
    const matchesEstado =
      selectedEstado === "TODOS" ||
      (selectedEstado === "SOBRE_EJECUTADA" && p.porcentajeAcumulado > 100) ||
      (selectedEstado === "COMPLETADA" && p.porcentajeAcumulado >= 100 && p.porcentajeAcumulado <= 100) ||
      (selectedEstado === "EN_EJECUCION" && p.porcentajeAcumulado > 0 && p.porcentajeAcumulado < 100) ||
      (selectedEstado === "NO_INICIADA" && p.porcentajeAcumulado === 0);
    const matchesSearch =
      p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEsp && matchesEstado && matchesSearch;
  });

  // Calculate totals
  const totalContractual = partidas.reduce((acc, p) => acc + p.montoContractual, 0);
  const totalAnterior = partidas.reduce((acc, p) => acc + p.montoAnterior, 0);
  const totalActual = partidas.reduce((acc, p) => acc + p.montoActual, 0);
  const totalAcumulado = partidas.reduce((acc, p) => acc + p.montoAcumulado, 0);
  const totalSaldo = partidas.reduce((acc, p) => acc + p.montoSaldo, 0);

  const pctAnteriorTotal =
    totalContractual > 0 ? ((totalAnterior / totalContractual) * 100).toFixed(2) : "0.00";
  const pctActualTotal =
    totalContractual > 0 ? ((totalActual / totalContractual) * 100).toFixed(2) : "0.00";
  const pctAcumuladoTotal =
    totalContractual > 0 ? ((totalAcumulado / totalContractual) * 100).toFixed(2) : "0.00";
  const pctSaldoTotal =
    totalContractual > 0 ? ((totalSaldo / totalContractual) * 100).toFixed(2) : "0.00";

  const totalSobreEjecutadas = partidas.filter((p) => p.porcentajeAcumulado > 100).length;

  // Save quick-edit of actual month metrado
  const handleSaveQuickEdit = (partidaId: string) => {
    setPartidas((prev) =>
      prev.map((p) => {
        if (p.id !== partidaId) return p;
        const newActual = Number(editMetradoActual) || 0;
        const montoActual = Number((newActual * p.precioUnitario).toFixed(2));
        const metradoAcumulado = Number((p.metradoAnterior + newActual).toFixed(2));
        const montoAcumulado = Number((metradoAcumulado * p.precioUnitario).toFixed(2));
        const porcentajeAcumulado =
          p.metradoContractual > 0
            ? Number(((metradoAcumulado / p.metradoContractual) * 100).toFixed(2))
            : 0;
        const porcentajeActual =
          p.metradoContractual > 0
            ? Number(((newActual / p.metradoContractual) * 100).toFixed(2))
            : 0;
        const metradoSaldo = Number(Math.max(0, p.metradoContractual - metradoAcumulado).toFixed(2));
        const montoSaldo = Number((metradoSaldo * p.precioUnitario).toFixed(2));
        const porcentajeSaldo =
          p.metradoContractual > 0
            ? Number(((metradoSaldo / p.metradoContractual) * 100).toFixed(2))
            : 0;

        let estado: PartidaEjecutada["estado"] = "En Ejecución";
        if (porcentajeAcumulado === 0) estado = "No Iniciada";
        else if (porcentajeAcumulado > 100)
          estado = "Sobre-ejecutada (Alerta Adicional/Mayor Metrado)";
        else if (porcentajeAcumulado === 100) estado = "Completada";

        return {
          ...p,
          metradoActual: newActual,
          montoActual,
          porcentajeActual,
          metradoAcumulado,
          montoAcumulado,
          porcentajeAcumulado,
          metradoSaldo,
          montoSaldo,
          porcentajeSaldo,
          estado,
        };
      })
    );
    setEditingPartidaId(null);
  };

  // Add new Partida
  const handleCreatePartida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartida.item || !newPartida.descripcion || !newPartida.precioUnitario || !newPartida.metradoContractual) {
      alert("Por favor complete los campos obligatorios (Item, Descripción, P.U. y Metrado Contractual).");
      return;
    }

    const pu = Number(newPartida.precioUnitario) || 0;
    const metCont = Number(newPartida.metradoContractual) || 0;
    const metAnt = Number(newPartida.metradoAnterior) || 0;
    const metAct = Number(newPartida.metradoActual) || 0;

    const montoCont = Number((metCont * pu).toFixed(2));
    const montoAnt = Number((metAnt * pu).toFixed(2));
    const montoAct = Number((metAct * pu).toFixed(2));
    const metAcum = Number((metAnt + metAct).toFixed(2));
    const montoAcum = Number((metAcum * pu).toFixed(2));

    const pctAnt = metCont > 0 ? Number(((metAnt / metCont) * 100).toFixed(2)) : 0;
    const pctAct = metCont > 0 ? Number(((metAct / metCont) * 100).toFixed(2)) : 0;
    const pctAcum = metCont > 0 ? Number(((metAcum / metCont) * 100).toFixed(2)) : 0;

    const metSaldo = Number(Math.max(0, metCont - metAcum).toFixed(2));
    const montoSaldo = Number((metSaldo * pu).toFixed(2));
    const pctSaldo = metCont > 0 ? Number(((metSaldo / metCont) * 100).toFixed(2)) : 0;

    let estado: PartidaEjecutada["estado"] = "En Ejecución";
    if (pctAcum === 0) estado = "No Iniciada";
    else if (pctAcum > 100) estado = "Sobre-ejecutada (Alerta Adicional/Mayor Metrado)";
    else if (pctAcum === 100) estado = "Completada";

    const created: PartidaEjecutada = {
      id: `part-${Date.now()}`,
      item: newPartida.item || "00.00.00",
      descripcion: newPartida.descripcion || "",
      especialidad: newPartida.especialidad || "Estructuras",
      unidad: newPartida.unidad || "und",
      precioUnitario: pu,
      metradoContractual: metCont,
      montoContractual: montoCont,
      metradoAnterior: metAnt,
      montoAnterior: montoAnt,
      porcentajeAnterior: pctAnt,
      metradoActual: metAct,
      montoActual: montoAct,
      porcentajeActual: pctAct,
      metradoAcumulado: metAcum,
      montoAcumulado: montoAcum,
      porcentajeAcumulado: pctAcum,
      metradoSaldo: metSaldo,
      montoSaldo: montoSaldo,
      porcentajeSaldo: pctSaldo,
      estado,
    };

    setPartidas((prev) => [...prev, created]);
    setShowAddModal(false);
    setNewPartida({
      item: "",
      descripcion: "",
      especialidad: "Estructuras",
      unidad: "m3",
      precioUnitario: 0,
      metradoContractual: 0,
      metradoAnterior: 0,
      metradoActual: 0,
    });
  };

  const handleDeletePartida = (id: string) => {
    setPartidas((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExportCSV = () => {
    if (partidas.length === 0) {
      alert("No hay partidas registradas para exportar.");
      return;
    }

    const headers = [
      "Item",
      "Descripcion",
      "Especialidad",
      "Unidad",
      "Precio Unitario",
      "Metrado Contractual",
      "Monto Contractual",
      "Metrado Anterior",
      "Monto Anterior",
      "% Anterior",
      "Metrado Actual",
      "Monto Actual",
      "% Actual",
      "Metrado Acumulado",
      "Monto Acumulado",
      "% Acumulado",
      "Metrado Saldo",
      "Monto Saldo",
      "% Saldo",
      "Estado",
    ];

    const rows = partidas.map((p) => [
      `"${p.item}"`,
      `"${p.descripcion.replace(/"/g, '""')}"`,
      `"${p.especialidad}"`,
      `"${p.unidad}"`,
      p.precioUnitario,
      p.metradoContractual,
      p.montoContractual,
      p.metradoAnterior,
      p.montoAnterior,
      `${p.porcentajeAnterior}%`,
      p.metradoActual,
      p.montoActual,
      `${p.porcentajeActual}%`,
      p.metradoAcumulado,
      p.montoAcumulado,
      `${p.porcentajeAcumulado}%`,
      p.metradoSaldo,
      p.montoSaldo,
      `${p.porcentajeSaldo}%`,
      `"${p.estado}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PLANILLA_METRADOS_VALORIZACION_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Table className="w-4 h-4" />
            <span>Planilla Oficial de Metrados y Valorización de Partidas</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Cuadro de Partidas Ejecutadas ({mesSeleccionado})
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Desglose detallado por partida: metrado contractual, acumulado de meses anteriores, valorización del mes actual, acumulado total y saldo pendiente por ejecutar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {partidas.length === 0 ? (
            <button
              onClick={handleLoadSampleTemplate}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cargar Plantilla Tipo de Partidas</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Partida</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Exportar a Excel / CSV"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Imprimir Planilla Oficial"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">1. Presupuesto Contractual</span>
          <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
            S/ {totalContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">{partidas.length} partidas registradas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-900 block">2. Acumulado Anterior</span>
          <span className="text-base font-black text-blue-950 font-mono mt-0.5 block">
            S/ {totalAnterior.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-blue-700 font-semibold">{pctAnteriorTotal}% ejecutado anterior</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-900 block">3. Mes Actual ({mesSeleccionado.split("-")[0].trim()})</span>
          <span className="text-base font-black text-amber-950 font-mono mt-0.5 block">
            S/ {totalActual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-amber-800 font-semibold">{pctActualTotal}% avance del mes</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-900 block">4. Acumulado Actual</span>
          <span className="text-base font-black text-emerald-950 font-mono mt-0.5 block">
            S/ {totalAcumulado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-800 font-bold">{pctAcumuladoTotal}% avance total a la fecha</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-600 block">5. Saldo por Ejecutar</span>
          <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">
            S/ {totalSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{pctSaldoTotal}% restante de obra</span>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs ${
          totalSobreEjecutadas > 0 ? "bg-rose-50 border-rose-300" : "bg-emerald-50/50 border-emerald-200"
        }`}>
          <span className="text-[11px] font-bold text-rose-900 block">Alertas Sobre-metrado</span>
          <span className={`text-base font-black font-mono mt-0.5 block ${
            totalSobreEjecutadas > 0 ? "text-rose-700" : "text-emerald-700"
          }`}>
            {totalSobreEjecutadas} Partidas
          </span>
          <span className="text-[10px] text-rose-800">
            {totalSobreEjecutadas > 0 ? "Requiere resolución adicional" : "Metrados bajo control (<=100%)"}
          </span>
        </div>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Especialidad Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Especialidad:</span>
            <select
              value={selectedEspecialidad}
              onChange={(e) => setSelectedEspecialidad(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="TODAS">Todas las Especialidades</option>
              <option value="Obras Provisionales">Obras Provisionales</option>
              <option value="Estructuras">Estructuras</option>
              <option value="Arquitectura">Arquitectura</option>
              <option value="Instalaciones Sanitarias">Instalaciones Sanitarias</option>
              <option value="Instalaciones Eléctricas">Instalaciones Eléctricas</option>
              <option value="Equipamiento">Equipamiento</option>
              <option value="Mitigación Ambiental">Mitigación Ambiental</option>
            </select>
          </div>

          {/* Estado Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="EN_EJECUCION">En Ejecución (1% - 99%)</option>
              <option value="COMPLETADA">Completadas (100%)</option>
              <option value="SOBRE_EJECUTADA">Sobre-ejecutadas (&gt;100%)</option>
              <option value="NO_INICIADA">No Iniciadas (0%)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código o partida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {/* MASTER PARTIDAS TABLE */}
      {partidas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Planilla de Metrados y Partidas Vacía</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aún no se han registrado partidas para este proyecto de obra. Puede cargar una plantilla estándar con las partidas de obra pública oficial o crear sus propias partidas.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleLoadSampleTemplate}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cargar Plantilla Tipo de Partidas</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar Partida Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                {/* Upper Level Header Groupings */}
                <tr className="bg-slate-900 text-white text-[11px] font-bold border-b border-slate-800">
                  <th colSpan={5} className="py-2.5 px-3 border-r border-slate-800 text-left">
                    DESCRIPCIÓN CONTRACTUAL DE LA PARTIDA
                  </th>
                  <th colSpan={2} className="py-2.5 px-3 border-r border-slate-800 text-center bg-slate-800/90">
                    PRESUPUESTO CONTRACTUAL
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-blue-900/60 text-blue-200">
                    ACUMULADO ANTERIOR
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-amber-900/60 text-amber-200">
                    MES ACTUAL (VALORIZACIÓN)
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-emerald-900/70 text-emerald-200">
                    ACUMULADO ACTUAL
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-center bg-slate-800/90 text-slate-300">
                    SALDO POR EJECUTAR
                  </th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>

                {/* Sub-Header Columns */}
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-2 px-2.5">Item</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-2 text-center">Esp.</th>
                  <th className="py-2 px-2 text-center">Und</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200">P.U. (S/)</th>

                  {/* Contractual */}
                  <th className="py-2 px-2.5 text-right bg-slate-50">Metrado</th>
                  <th className="py-2 px-2.5 text-right bg-slate-50 border-r border-slate-200">Monto (S/)</th>

                  {/* Anterior */}
                  <th className="py-2 px-2.5 text-right bg-blue-50/40 text-blue-900">Metrado</th>
                  <th className="py-2 px-2.5 text-right bg-blue-50/40 text-blue-900">Monto (S/)</th>
                  <th className="py-2 px-2 text-center bg-blue-50/40 text-blue-900 border-r border-slate-200">%</th>

                  {/* Actual */}
                  <th className="py-2 px-2.5 text-right bg-amber-50/50 text-amber-950">Metrado</th>
                  <th className="py-2 px-2.5 text-right bg-amber-50/50 text-amber-950">Monto (S/)</th>
                  <th className="py-2 px-2 text-center bg-amber-50/50 text-amber-950 border-r border-slate-200">%</th>

                  {/* Acumulado */}
                  <th className="py-2 px-2.5 text-right bg-emerald-50/50 text-emerald-950">Metrado</th>
                  <th className="py-2 px-2.5 text-right bg-emerald-50/50 text-emerald-950">Monto (S/)</th>
                  <th className="py-2 px-2 text-center bg-emerald-50/50 text-emerald-950 border-r border-slate-200">%</th>

                  {/* Saldo */}
                  <th className="py-2 px-2.5 text-right bg-slate-50">Metrado</th>
                  <th className="py-2 px-2.5 text-right bg-slate-50">Monto (S/)</th>
                  <th className="py-2 px-2 text-center bg-slate-50 border-r border-slate-200">%</th>

                  {/* Acciones */}
                  <th className="py-2 px-2 text-center">Editar</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredPartidas.map((p) => {
                  const isEditing = editingPartidaId === p.id;
                  const isSobreEjecutada = p.porcentajeAcumulado > 100;
                  const isCompletada = p.porcentajeAcumulado === 100;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSobreEjecutada
                          ? "bg-rose-50/40"
                          : isCompletada
                          ? "bg-emerald-50/20"
                          : ""
                      }`}
                    >
                      {/* Item */}
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {p.item}
                      </td>

                      {/* Descripcion */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 max-w-xs sm:max-w-sm truncate" title={p.descripcion}>
                          {p.descripcion}
                        </div>
                        {p.observacion && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-xs">{p.observacion}</div>
                        )}
                      </td>

                      {/* Especialidad */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {p.especialidad.substring(0, 5)}
                        </span>
                      </td>

                      {/* Unidad */}
                      <td className="py-2 px-2 text-center font-mono text-slate-600 font-medium">{p.unidad}</td>

                      {/* PU */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                        {p.precioUnitario.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Contractual */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700 bg-slate-50/50">
                        {p.metradoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800 bg-slate-50/50 border-r border-slate-200 font-semibold">
                        {p.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Anterior */}
                      <td className="py-2 px-2.5 text-right font-mono text-blue-900 bg-blue-50/30">
                        {p.metradoAnterior > 0 ? p.metradoAnterior.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-blue-950 bg-blue-50/30">
                        {p.montoAnterior > 0 ? p.montoAnterior.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[10px] text-blue-800 bg-blue-50/30 border-r border-slate-200">
                        {p.porcentajeAnterior > 0 ? `${p.porcentajeAnterior}%` : "-"}
                      </td>

                      {/* Actual */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editMetradoActual}
                              onChange={(e) => setEditMetradoActual(Number(e.target.value))}
                              className="w-20 bg-white border border-amber-400 rounded px-1.5 py-0.5 text-right text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500 outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveQuickEdit(p.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white p-1 rounded cursor-pointer"
                              title="Guardar"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingPartidaId(null)}
                              className="bg-slate-300 hover:bg-slate-400 text-slate-700 p-1 rounded cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingPartidaId(p.id);
                              setEditMetradoActual(p.metradoActual);
                            }}
                            className="cursor-pointer hover:bg-amber-100/80 px-1.5 py-0.5 rounded transition"
                            title="Click para editar metrado del mes"
                          >
                            {p.metradoActual > 0 ? p.metradoActual.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "0.00"}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                        {p.montoActual > 0 ? p.montoActual.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "0.00"}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[10px] font-bold text-amber-900 bg-amber-50/40 border-r border-slate-200">
                        {p.porcentajeActual > 0 ? `${p.porcentajeActual}%` : "0.0%"}
                      </td>

                      {/* Acumulado */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-950 bg-emerald-50/40">
                        {p.metradoAcumulado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-950 bg-emerald-50/40">
                        {p.montoAcumulado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[10px] font-bold bg-emerald-50/40 border-r border-slate-200">
                        <span
                          className={`px-1.5 py-0.5 rounded font-black ${
                            isSobreEjecutada
                              ? "bg-rose-600 text-white"
                              : isCompletada
                              ? "bg-emerald-600 text-white"
                              : "text-emerald-800"
                          }`}
                        >
                          {p.porcentajeAcumulado}%
                        </span>
                      </td>

                      {/* Saldo */}
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700 bg-slate-50/50">
                        {p.metradoSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700 bg-slate-50/50">
                        {p.montoSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600 bg-slate-50/50 border-r border-slate-200">
                        {p.porcentajeSaldo}%
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingPartidaId(p.id);
                              setEditMetradoActual(p.metradoActual);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="Editar Metrado del Mes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePartida(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar Partida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Master Totals Row */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-[11px] border-t-2 border-slate-800">
                  <td colSpan={5} className="py-3 px-3 border-r border-slate-800 text-right uppercase">
                    TOTALES PLANILLA DE METRADOS (S/)
                  </td>
                  {/* Contractual */}
                  <td className="py-3 px-2.5 text-right font-mono">-</td>
                  <td className="py-3 px-2.5 text-right font-mono border-r border-slate-800">
                    S/ {totalContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Anterior */}
                  <td className="py-3 px-2.5 text-right font-mono">-</td>
                  <td className="py-3 px-2.5 text-right font-mono text-blue-300">
                    S/ {totalAnterior.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-blue-300 border-r border-slate-800">
                    {pctAnteriorTotal}%
                  </td>

                  {/* Actual */}
                  <td className="py-3 px-2.5 text-right font-mono">-</td>
                  <td className="py-3 px-2.5 text-right font-mono text-amber-300">
                    S/ {totalActual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-amber-300 border-r border-slate-800">
                    {pctActualTotal}%
                  </td>

                  {/* Acumulado */}
                  <td className="py-3 px-2.5 text-right font-mono">-</td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-400 font-black">
                    S/ {totalAcumulado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-emerald-400 border-r border-slate-800 font-black">
                    {pctAcumuladoTotal}%
                  </td>

                  {/* Saldo */}
                  <td className="py-3 px-2.5 text-right font-mono">-</td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300">
                    S/ {totalSaldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-300 border-r border-slate-800">
                    {pctSaldoTotal}%
                  </td>

                  {/* Action space */}
                  <td className="py-3 px-2 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR NUEVA PARTIDA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Registrar Nueva Partida de Obra</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartida} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Código de Item * (Ej: 02.03.01)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="02.03.01"
                    value={newPartida.item}
                    onChange={(e) => setNewPartida({ ...newPartida, item: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especialidad *</label>
                  <select
                    value={newPartida.especialidad}
                    onChange={(e) =>
                      setNewPartida({
                        ...newPartida,
                        especialidad: e.target.value as PartidaEjecutada["especialidad"],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="Obras Provisionales">Obras Provisionales</option>
                    <option value="Estructuras">Estructuras</option>
                    <option value="Arquitectura">Arquitectura</option>
                    <option value="Instalaciones Sanitarias">Instalaciones Sanitarias</option>
                    <option value="Instalaciones Eléctricas">Instalaciones Eléctricas</option>
                    <option value="Equipamiento">Equipamiento</option>
                    <option value="Mitigación Ambiental">Mitigación Ambiental</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Descripción Detallada de la Partida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Concreto f'c=210 kg/cm2 en Columnas y Placas Estructurales"
                  value={newPartida.descripcion}
                  onChange={(e) => setNewPartida({ ...newPartida, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unidad de Medida *</label>
                  <input
                    type="text"
                    required
                    placeholder="m3, m2, kg, und, glb..."
                    value={newPartida.unidad}
                    onChange={(e) => setNewPartida({ ...newPartida, unidad: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Precio Unitario Contractual (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newPartida.precioUnitario || ""}
                    onChange={(e) =>
                      setNewPartida({ ...newPartida, precioUnitario: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metrado Contractual *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newPartida.metradoContractual || ""}
                    onChange={(e) =>
                      setNewPartida({ ...newPartida, metradoContractual: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-blue-900 block mb-1">Metrado Anterior</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPartida.metradoAnterior || ""}
                    onChange={(e) =>
                      setNewPartida({ ...newPartida, metradoAnterior: Number(e.target.value) })
                    }
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-blue-950 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-1">Metrado Mes Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPartida.metradoActual || ""}
                    onChange={(e) =>
                      setNewPartida({ ...newPartida, metradoActual: Number(e.target.value) })
                    }
                    className="w-full bg-amber-50/50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-950 focus:ring-1 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Guardar Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
