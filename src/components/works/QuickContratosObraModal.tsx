import React, { useState } from "react";
import {
  X,
  FileText,
  Building2,
  HardHat,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  FolderKanban,
  RotateCcw,
  Upload,
  FileUp,
  Loader2,
} from "lucide-react";
import { EstadoCartera, ProyectoCartera } from "../../types/seguimientoCartera";
import { ObraProyecto } from "../../types/obras";
import { parseContractPdfFile } from "../../services/contractPdfParser";

interface QuickContratosObraModalProps {
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
  availableObras?: ObraProyecto[];
}

export const QuickContratosObraModal: React.FC<QuickContratosObraModalProps> = ({
  isOpen,
  onClose,
  onSaveObra,
  entityDisplayName,
  availableObras = [],
}) => {
  // Identificación
  const [proyecto, setProyecto] = useState("");
  const [cui, setCui] = useState("");
  const [encargado, setEncargado] = useState("JHON");
  const [estado, setEstado] = useState<EstadoCartera>("EN_EJECUCION");
  const [plazoDias, setPlazoDias] = useState<number>(180);

  // Contrato de Ejecución (Contratista)
  const [contratoEjecucionNumero, setContratoEjecucionNumero] = useState("");
  const [contratoEjecucionMonto, setContratoEjecucionMonto] = useState<number>(0);
  const [contratoEjecucionEmpresa, setContratoEjecucionEmpresa] = useState("");
  const [residenteNombre, setResidenteNombre] = useState("");

  // Contrato de Supervisión
  const [contratoSupervisionNumero, setContratoSupervisionNumero] = useState("");
  const [contratoSupervisionMonto, setContratoSupervisionMonto] = useState<number>(0);
  const [contratoSupervisionEmpresa, setContratoSupervisionEmpresa] = useState("");
  const [supervisorNombre, setSupervisorNombre] = useState("");

  // Fechas Clave
  const [entregaTerrenoFecha, setEntregaTerrenoFecha] = useState("");
  const [docEntregaTerreno, setDocEntregaTerreno] = useState("");
  const [inicioObraFecha, setInicioObraFecha] = useState("");
  const [docInicioObra, setDocInicioObra] = useState("");
  const [fechaTerminoActualizado, setFechaTerminoActualizado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Estado de escaneo de PDF
  const [isScanningPdf, setIsScanningPdf] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Manejo de carga y escaneo de PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, forceType?: "ejecucion" | "supervision") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setScanNotice({
        message: "Por favor seleccione un archivo en formato PDF (.pdf).",
        type: "error",
      });
      return;
    }

    setIsScanningPdf(true);
    setScanNotice(null);
    setErrorMsg(null);

    try {
      const { data, fileName } = await parseContractPdfFile(file);

      // Determinar si aplica a ejecución o supervisión
      const isSupervision = forceType === "supervision" || data.tipoDetectado === "supervision";

      // Poblar campos comunes
      if (data.proyecto && (!proyecto || proyecto.length < data.proyecto.length)) {
        setProyecto(data.proyecto);
      }
      if (data.cui && !cui) {
        setCui(data.cui);
      }
      if (data.plazoDias && data.plazoDias > 0) {
        setPlazoDias(data.plazoDias);
      }
      if (data.fechaEntregaTerreno && !entregaTerrenoFecha) {
        setEntregaTerrenoFecha(data.fechaEntregaTerreno);
      }
      if (data.fechaInicio && !inicioObraFecha) {
        setInicioObraFecha(data.fechaInicio);
      }

      const detectedFields: string[] = [];

      if (isSupervision) {
        if (data.contratoSupervisionNumero) {
          setContratoSupervisionNumero(data.contratoSupervisionNumero);
          detectedFields.push(`Contrato Sup: ${data.contratoSupervisionNumero}`);
        } else if (data.contratoEjecucionNumero) {
          setContratoSupervisionNumero(data.contratoEjecucionNumero);
          detectedFields.push(`Contrato Sup: ${data.contratoEjecucionNumero}`);
        }

        if (data.contratoSupervisionMonto && data.contratoSupervisionMonto > 0) {
          setContratoSupervisionMonto(data.contratoSupervisionMonto);
          detectedFields.push(`Monto: S/ ${data.contratoSupervisionMonto.toLocaleString("es-PE")}`);
        } else if (data.contratoEjecucionMonto && data.contratoEjecucionMonto > 0) {
          setContratoSupervisionMonto(data.contratoEjecucionMonto);
          detectedFields.push(`Monto: S/ ${data.contratoEjecucionMonto.toLocaleString("es-PE")}`);
        }

        if (data.contratoSupervisionEmpresa) {
          setContratoSupervisionEmpresa(data.contratoSupervisionEmpresa);
          detectedFields.push(`Supervisora: ${data.contratoSupervisionEmpresa}`);
        } else if (data.contratoEjecucionEmpresa) {
          setContratoSupervisionEmpresa(data.contratoEjecucionEmpresa);
          detectedFields.push(`Supervisora: ${data.contratoEjecucionEmpresa}`);
        }

        if (data.supervisorNombre) {
          setSupervisorNombre(data.supervisorNombre);
          detectedFields.push(`Supervisor: ${data.supervisorNombre}`);
        } else if (data.residenteNombre) {
          setSupervisorNombre(data.residenteNombre);
          detectedFields.push(`Supervisor: ${data.residenteNombre}`);
        }
      } else {
        // Ejecución (Contratista)
        if (data.contratoEjecucionNumero) {
          setContratoEjecucionNumero(data.contratoEjecucionNumero);
          detectedFields.push(`Contrato: ${data.contratoEjecucionNumero}`);
        }
        if (data.contratoEjecucionMonto && data.contratoEjecucionMonto > 0) {
          setContratoEjecucionMonto(data.contratoEjecucionMonto);
          detectedFields.push(`Monto: S/ ${data.contratoEjecucionMonto.toLocaleString("es-PE")}`);
        }
        if (data.contratoEjecucionEmpresa) {
          setContratoEjecucionEmpresa(data.contratoEjecucionEmpresa);
          detectedFields.push(`Contratista: ${data.contratoEjecucionEmpresa}`);
        }
        if (data.residenteNombre) {
          setResidenteNombre(data.residenteNombre);
          detectedFields.push(`Residente: ${data.residenteNombre}`);
        }
      }

      setScanNotice({
        message: `¡PDF Escaneado con Éxito! Archivo: "${fileName}". Se capturaron: ${
          detectedFields.length > 0 ? detectedFields.join(" • ") : "Datos preliminares del documento"
        }.`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Error escaneando PDF:", err);
      setScanNotice({
        message: "No se pudo leer el PDF o el documento no contiene texto legible.",
        type: "error",
      });
    } finally {
      setIsScanningPdf(false);
      // Reset input value to allow re-uploading the same file
      e.target.value = "";
    }
  };

  // Plantilla rápida de ejemplo para pruebas inmediatas
  const handleLoadSampleTemplate = () => {
    const randomNum = Math.floor(Math.random() * 80 + 10);
    const randomCui = `2${Math.floor(Math.random() * 899999 + 100000)}`;
    setProyecto("MEJORAMIENTO Y AMPLIACIÓN DEL SERVICIO DE TRANSITABILIDAD VIAL Y PEATONAL EN EL DISTRITO");
    setCui(randomCui);
    setEncargado("JHON");
    setEstado("EN_EJECUCION");
    setPlazoDias(180);

    // Contratista
    setContratoEjecucionNumero(`CONTRATO N° 0${randomNum}-2026-MPR`);
    setContratoEjecucionMonto(3850600.0);
    setContratoEjecucionEmpresa("CONSORCIO VIAL NOR ORIENTE");
    setResidenteNombre("Ing. Jorge Luis Ramírez Rojas (CIP 189420)");

    // Supervisión
    setContratoSupervisionNumero(`CONTRATO N° 0${Math.floor(randomNum / 3) + 1}-2026-MPR-CS`);
    setContratoSupervisionMonto(189500.0);
    setContratoSupervisionEmpresa("SUPERVISIÓN Y CONSULTORÍA DEL PERÚ S.A.C.");
    setSupervisorNombre("Ing. Carlos Mendoza Pinedo (CIP 178290)");

    // Fechas
    setEntregaTerrenoFecha("15/02/2026");
    setDocEntregaTerreno("Acta de Entrega de Terreno N° 01");
    setInicioObraFecha("16/02/2026");
    setDocInicioObra("Acta de Inicio de Obra N° 01");
    setFechaTerminoActualizado("15/08/2026");
    setObservaciones("Obra incorporada con contratos vigentes de Contratista y Supervisora según SEACE.");
    setErrorMsg(null);
  };

  // Cargar datos desde una obra existente del sistema
  const handleImportFromObra = (obraId: string) => {
    const found = availableObras.find((o) => o.id === obraId);
    if (!found) return;

    setProyecto(found.nombre || "");
    setCui(found.cui || "");
    setPlazoDias(found.plazoDias || 150);
    setContratoEjecucionNumero(found.numeroDocumentoContratista || `CONTRATO N° 022-2026-${found.cui}`);
    setContratoEjecucionMonto(found.montoContractual || 0);
    setContratoEjecucionEmpresa(found.contratista || "");
    setResidenteNombre(
      found.residente ? `${found.residente} ${found.cipResidente ? `(${found.cipResidente})` : ""}` : ""
    );

    setContratoSupervisionNumero(found.numeroDocumentoSupervisor || `CONTRATO N° 007-2026-SUP-${found.cui}`);
    setContratoSupervisionMonto(found.montoSupervision || 0);
    setContratoSupervisionEmpresa(found.supervisor || "");
    setSupervisorNombre(
      found.jefeSupervision
        ? `${found.jefeSupervision} ${found.cipJefeSupervision ? `(${found.cipJefeSupervision})` : ""}`
        : ""
    );

    if (found.fechaInicio) {
      setInicioObraFecha(found.fechaInicio);
      setDocInicioObra("Acta de Inicio de Obra");
    }
    if (found.fechaFinProgramada) {
      setFechaTerminoActualizado(found.fechaFinProgramada);
    }
  };

  const handleResetForm = () => {
    setProyecto("");
    setCui("");
    setEncargado("JHON");
    setEstado("EN_EJECUCION");
    setPlazoDias(180);
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
    setFechaTerminoActualizado("");
    setObservaciones("");
    setErrorMsg(null);
    setScanNotice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto.trim()) {
      setErrorMsg("Ingrese el nombre de la obra o proyecto.");
      return;
    }

    onSaveObra({
      proyecto: proyecto.trim(),
      cui: cui.trim() || `2${Math.floor(Math.random() * 899999 + 100000)}`,
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
      observaciones: observaciones.trim() || "Obra incorporada con contratos de ejecución y supervisión.",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-4 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  Registro Directo con Contratos de Obra & Supervisión
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-mono font-bold">
                  {entityDisplayName}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sube el contrato en PDF para escanear y capturar los datos automáticamente, o completa los campos requeridos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSampleTemplate}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Autocompletar con una plantilla modelo de contratos"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Plantilla Ejemplo</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Banner de Escaneo PDF */}
          <div className="p-3.5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-blue-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>Escanear y Capturar Datos desde PDF</span>
                    <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                      Lector OCR / Texto
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Sube tu Contrato de Ejecución o Supervisión en PDF para detectar N° de Contrato, Montos, Empresa, Ingenieros y Plazos al instante.
                  </div>
                </div>
              </div>

              {/* Botón de Carga PDF */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm">
                  {isScanningPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Escaneando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" />
                      <span>Subir Contrato PDF</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={isScanningPdf}
                    onChange={(e) => handlePdfUpload(e)}
                  />
                </label>
              </div>
            </div>

            {scanNotice && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                  scanNotice.type === "success"
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                    : "bg-rose-500/20 text-rose-200 border-rose-400/40"
                }`}
              >
                {scanNotice.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{scanNotice.message}</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Import Option if obras exist in memory */}
          {availableObras.length > 0 && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>¿Deseas autorellenar desde una obra existente en Control de Obras?</span>
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) handleImportFromObra(e.target.value);
                }}
                className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="">-- Seleccionar obra para autorellenar --</option>
                {availableObras.map((ob) => (
                  <option key={ob.id} value={ob.id}>
                    {ob.nombre.length > 55 ? `${ob.nombre.substring(0, 55)}...` : ob.nombre} (CUI: {ob.cui})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Datos Generales de la Obra */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Identificación del Proyecto / Inversión</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre de la Obra / Proyecto: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. MEJORAMIENTO DEL SERVICIO EDUCATIVO EN LA I.E. N° 005..."
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código CUI (Invierte.pe):
                </label>
                <input
                  type="text"
                  placeholder="ej. 2489120"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ingeniero Encargado (OEI):
                </label>
                <input
                  type="text"
                  list="quick-encargados-list"
                  placeholder="JHON, JOSUE, LUIS..."
                  value={encargado}
                  onChange={(e) => setEncargado(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <datalist id="quick-encargados-list">
                  <option value="JHON" />
                  <option value="JHENIFER" />
                  <option value="JEZER" />
                  <option value="JOSUE" />
                  <option value="LUIS" />
                  <option value="PICO" />
                  <option value="CARLOS" />
                  <option value="MARIELA" />
                  <option value="EDSON" />
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Estado Inicial:
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoCartera)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="EN_EJECUCION">🚧 En Ejecución de Obra</option>
                  <option value="PENDIENTE_INICIO_CONDICIONES">⏳ Pendiente Inicio (Art. 176)</option>
                  <option value="RECEPCIONADA">🏁 Obra Culminada / Recepcionada</option>
                  <option value="FINALIZADA_LIQUIDADA">⚖️ En Liquidación / Liquidada</option>
                  <option value="ACTOS_PREPARATORIOS">📋 Actos Preparatorios</option>
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
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fecha Término Estimada:
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={fechaTerminoActualizado}
                  onChange={(e) => setFechaTerminoActualizado(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Bloques de Contratos lado a lado (Contratista y Supervisora) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BLOQUE A: Contrato de Ejecución (Contratista) */}
            <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                      Contrato de Ejecución (Contratista)
                    </h4>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Datos del ejecutor de la obra
                    </span>
                  </div>
                </div>
                <label className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1">
                  <FileUp className="w-3 h-3" />
                  <span>PDF Obra</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handlePdfUpload(e, "ejecucion")}
                  />
                </label>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    N° de Contrato de Obra:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. CONTRATO N° 035-2026-MPR"
                    value={contratoEjecucionNumero}
                    onChange={(e) => setContratoEjecucionNumero(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Monto Contractual de Obra (S/.):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      value={contratoEjecucionMonto || ""}
                      onChange={(e) => setContratoEjecucionMonto(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 bg-white border border-slate-300 rounded-lg p-2 font-mono font-black text-emerald-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Empresa / Consorcio Contratista:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. CONSORCIO VIAL RIOJA"
                    value={contratoEjecucionEmpresa}
                    onChange={(e) => setContratoEjecucionEmpresa(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ingeniero Residente de Obra:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Ing. Carlos Vargas (CIP 145892)"
                    value={residenteNombre}
                    onChange={(e) => setResidenteNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* BLOQUE B: Contrato de Supervisión */}
            <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                      Contrato de Supervisión / Inspectoría
                    </h4>
                    <span className="text-[10px] text-blue-800 font-medium">
                      Datos del control y supervisión
                    </span>
                  </div>
                </div>
                <label className="text-[10px] bg-blue-200 hover:bg-blue-300 text-blue-900 font-bold px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1">
                  <FileUp className="w-3 h-3" />
                  <span>PDF Supervisión</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => handlePdfUpload(e, "supervision")}
                  />
                </label>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    N° de Contrato / O.S. Supervisión:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. CONTRATO N° 012-2026-MPR-CS"
                    value={contratoSupervisionNumero}
                    onChange={(e) => setContratoSupervisionNumero(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Monto de Supervisión (S/.):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      value={contratoSupervisionMonto || ""}
                      onChange={(e) => setContratoSupervisionMonto(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 bg-white border border-slate-300 rounded-lg p-2 font-mono font-black text-blue-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Empresa / Consultor Supervisor:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. SUPERVISORA INGENIERÍA SAC"
                    value={contratoSupervisionEmpresa}
                    onChange={(e) => setContratoSupervisionEmpresa(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jefe de Supervisión / Inspector:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Ing. Wilson Tafur (CIP 218904)"
                    value={supervisorNombre}
                    onChange={(e) => setSupervisorNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Fechas Clave y Actas */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Fechas y Actas de Aprobación de Inicio</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Entrega de Terreno (Fecha):
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={entregaTerrenoFecha}
                  onChange={(e) => setEntregaTerrenoFecha(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Doc. Entrega Terreno:
                </label>
                <input
                  type="text"
                  placeholder="ej. Acta N° 01-2026"
                  value={docEntregaTerreno}
                  onChange={(e) => setDocEntregaTerreno(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Inicio de Obra (Fecha):
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={inicioObraFecha}
                  onChange={(e) => setInicioObraFecha(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Doc. Inicio Obra:
                </label>
                <input
                  type="text"
                  placeholder="ej. Acta de Inicio N° 01"
                  value={docInicioObra}
                  onChange={(e) => setDocInicioObra(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Observaciones Generales / Notas Contractuales:
              </label>
              <textarea
                rows={2}
                placeholder="Notas técnicas sobre los contratos, adelantos o condiciones normativas..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar campos</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Incorporar Obra a Matriz con Contratos</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
