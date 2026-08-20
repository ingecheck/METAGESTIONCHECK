import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Download,
  Sparkles,
  RefreshCw,
  Scale,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Send,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  Gavel,
  Lightbulb,
} from "lucide-react";
import { TenderInfo, CompanyProfile, ObservationItem } from "../types/osce";
import { formulateObservationsAPI, legalChatAPI } from "../services/api";
import { generateConsultasObservacionesDocx, downloadDocxBlob } from "../services/docxGenerator";

interface ObservationsManagerProps {
  tender: TenderInfo;
  company: CompanyProfile;
  observations: ObservationItem[];
  setObservations: React.Dispatch<React.SetStateAction<ObservationItem[]>>;
  onNavigateToTab?: (tab: string) => void;
}

const COMMON_LEGAL_QUESTIONS = [
  {
    title: "¿Es legal exigir experiencia en la misma región o provincia?",
    query: "¿Puede una entidad exigir en las bases que el postor o su personal tengan experiencia exclusivamente en el departamento o provincia de la obra?",
  },
  {
    title: "¿Es legal exigir marcas específicas en maquinaria?",
    query: "¿Es legal que el Capítulo III de las Bases exija una marca o procedencia específica para el equipamiento estratégico?",
  },
  {
    title: "¿Se puede descalificar por un error de foliación o de cálculo?",
    query: "¿Constituye causal de descalificación o no admisión la falta de foliación o un error aritmético en la oferta económica?",
  },
  {
    title: "¿Cómo observar plazos de entrega desproporcionados?",
    query: "¿Cómo sustentar jurídicamente una observación por un plazo de ejecución que resulta técnica y físicamente imposible de cumplir?",
  },
];

export const ObservationsManager: React.FC<ObservationsManagerProps> = ({
  tender,
  company,
  observations,
  setObservations,
  onNavigateToTab,
}) => {
  const [isFormulatingAI, setIsFormulatingAI] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Integrated Legal Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "advisor"; text: string; time: string }>>([
    {
      sender: "advisor",
      text: `Hola, soy su Asesor Legal Especializado en Contratación Pública del Perú. Estoy analizando las Bases del procedimiento "${tender.nomenclatura || 'Convocatoria'}". Puede consultarme cualquier duda normativa sobre la Ley N° 30225, D.S. N° 344-2018-EF, la nueva Ley N° 32069 y Pronunciamientos del Tribunal del OSCE para formular sus observaciones formales.`,
      time: "En línea",
    },
  ]);

  // New Observation form state
  const [tipo, setTipo] = useState<"Consulta" | "Observación">("Observación");
  const [numeral, setNumeral] = useState("Capítulo III - Numeral 3.2 (Requisitos de Calificación)");
  const [consulta, setConsulta] = useState("");
  const [sustento, setSustento] = useState("");
  const [propuesta, setPropuesta] = useState("Se solicita suprimir la exigencia restrictiva y acogerse a los Principios de Libertad de Concurrencia y Transparencia.");

  const handleFormulateAI = async () => {
    setIsFormulatingAI(true);
    setStatusMessage(null);
    try {
      const generatedObs = await formulateObservationsAPI({
        tenderInfo: tender,
        specificIssues: tender.observacionesRiesgos?.join("; ") || "Revisión integral de requisitos de calificación y posibles restricciones indebidas",
      });
      if (generatedObs && generatedObs.length > 0) {
        setObservations(generatedObs);
        setStatusMessage(`Se formularon automáticamente ${generatedObs.length} consultas y observaciones con sustento legal OSCE.`);
      }
    } catch (err) {
      console.error("Error generating observations:", err);
    } finally {
      setIsFormulatingAI(false);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatMessage;
    if (!textToSend.trim()) return;

    const userEntry = {
      sender: "user" as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userEntry]);
    if (!presetText) setChatMessage("");
    setIsSendingChat(true);

    try {
      const reply = await legalChatAPI({
        message: textToSend,
        tenderContext: tender,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          sender: "advisor" as const,
          text: reply || "Conforme al TUO de la Ley N° 30225, el Comité de Selección debe absolver motivadamente las consultas y observaciones presentadas.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Legal chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "advisor" as const,
          text: "Conforme a los Artículos 2 y 29 del TUO de la Ley N° 30225, está prohibido establecer requisitos que limiten indebidamente la libre concurrencia de postores.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleConvertReplyToObservation = (text: string) => {
    const newObs: ObservationItem = {
      id: "obs-" + Date.now(),
      numeralBases: "Capítulo III - Requisitos de Calificación",
      tipo: "Observación",
      consultaObservacion: `Se observa la exigencia restrictiva formulada en las Bases por contravenir los Principios de la Contratación Estatal.`,
      sustentoLegalTecnico: text.length > 300 ? text.substring(0, 300) + "..." : text,
      propuestaSolucion: "Se solicita que el Comité de Selección modifique las Bases conforme a los criterios jurisprudenciales del OSCE.",
    };
    setObservations([...observations, newObs]);
    setStatusMessage("Se añadió la opinión del Asesor Legal como una Observación formal en el pliego.");
  };

  const handleAddObservation = () => {
    if (!consulta.trim()) return;
    const newObs: ObservationItem = {
      id: "obs-" + Date.now(),
      numeralBases: numeral || "Capítulo III",
      tipo,
      consultaObservacion: consulta,
      sustentoLegalTecnico: sustento || "Art. 2 y Art. 29 del TUO de la Ley N° 30225 y Principio de Libre Concurrencia.",
      propuestaSolucion: propuesta || "Se solicita modificar el extremo observado suprimiendo la restricción o aceptando documentos equivalentes.",
    };
    setObservations([...observations, newObs]);
    setConsulta("");
    setSustento("");
    setShowAddForm(false);
    setStatusMessage("Consulta u Observación registrada en el pliego.");
  };

  const handleDeleteObservation = (id: string) => {
    setObservations(observations.filter((o) => o.id !== id));
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateConsultasObservacionesDocx(tender, company, observations);
      downloadDocxBlob(blob, `Pliego_Consultas_Observaciones_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* 1. Header with Fully Unconstrained Title & Step Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Paso 5 de 7 • Etapa de Absolución de Consultas y Observaciones • Art. 72 RLCE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pliego de Consultas y Observaciones con Asesor Legal OSCE
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Plantee consultas técnicas u observaciones jurídicas por vulneración a la Ley de Contrataciones. Consulte en vivo con el Asesor Legal Integrado y exporte el pliego en formato Word compatible con el SEACE.
            </p>
          </div>

          {/* Quick Step Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 xl:pt-0 shrink-0">
            <button
              onClick={() => (onNavigateToTab ? onNavigateToTab("personnel") : null)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-300 shadow-sm"
              title="Regresar al Paso 4: Personal Clave y Equipamiento"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Paso 4: Personal / Equipos</span>
            </button>

            <button
              onClick={handleFormulateAI}
              disabled={isFormulatingAI}
              className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
              title="Auto-formular pliego de consultas y observaciones"
            >
              {isFormulatingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Estructurando Consultas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Auto-Formular Consultas</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Descargar Pliego de Consultas y Observaciones en Word"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{isDownloading ? "Generando..." : "Descargar Pliego (.docx)"}</span>
            </button>

            <button
              onClick={() => (onNavigateToTab ? onNavigateToTab("builder") : null)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              title="Continuar al Armado de Ofertas"
            >
              <span>Armado de Ofertas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Side-by-Side: Integrated Legal Advisor & Question Formulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live OSCE Legal Advisor Chatbot */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[580px] overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Gavel className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block">Asesor Legal OSCE en Vivo</span>
                <span className="text-[10px] text-emerald-400 font-mono">● Especialista en Ley 30225 / 32069</span>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Jurisprudencia OSCE
            </span>
          </div>

          {/* Preset Questions Chips */}
          <div className="bg-slate-50 p-2.5 border-b border-slate-200 overflow-x-auto flex space-x-2 shrink-0">
            {COMMON_LEGAL_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChatMessage(q.query)}
                className="text-[10px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full px-2.5 py-1 whitespace-nowrap transition cursor-pointer font-medium shrink-0"
              >
                {q.title}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3 shadow-xs ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {msg.sender === "advisor" && idx > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleConvertReplyToObservation(msg.text)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer bg-indigo-50 px-2 py-1 rounded"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Convertir en Observación del Pliego</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9.5px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            {isSendingChat && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>El Asesor Legal está analizando la normativa OSCE...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Consulte sobre un requisito o artículo de las bases..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleSendChatMessage() : null)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-500"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={isSendingChat || !chatMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Formal Observations & Consultations List */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 flex flex-col h-[580px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Pliego Formal para Presentación ({observations.length} ítems)
              </h3>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Consulta/Obs</span>
            </button>
          </div>

          {/* Observation Items Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {observations.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs">
                  No hay consultas ni observaciones formuladas aún.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleFormulateAI}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                  >
                    Auto-Formular Pliego de Consultas
                  </button>
                </div>
              </div>
            ) : (
              observations.map((obs, idx) => (
                <div
                  key={obs.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-200 transition space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        Ítem {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          obs.tipo === "Observación"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {obs.tipo}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">{obs.numeralBases}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteObservation(obs.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10.5px] font-bold text-slate-700 block uppercase">Consulta / Observación:</span>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">{obs.consultaObservacion}</p>
                  </div>

                  <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 block uppercase">Sustento Técnico-Legal:</span>
                    <p className="text-[11px] text-amber-900">{obs.sustentoLegalTecnico}</p>
                  </div>

                  <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-blue-900 block uppercase">Pretensión / Propuesta de Solución:</span>
                    <p className="text-[11px] text-blue-900">{obs.propuestaSolucion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Modal for Adding Observation */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Formular Consulta u Observación a las Bases
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Solicitud:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="Observación">Observación (Vulneración Normativa)</option>
                    <option value="Consulta">Consulta (Aclaración / Ambigüedad)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numeral / Sección de Bases:</label>
                  <input
                    type="text"
                    value={numeral}
                    onChange={(e) => setNumeral(e.target.value)}
                    placeholder="Ej: Capítulo III - Numeral 3.2"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalle de la Consulta u Observación:</label>
                <textarea
                  rows={3}
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  placeholder="Describa con precisión la exigencia observada o la duda en las especificaciones técnicas..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sustento Legal y Técnico (Artículos OSCE / Pronunciamientos):</label>
                <textarea
                  rows={2}
                  value={sustento}
                  onChange={(e) => setSustento(e.target.value)}
                  placeholder="Ej: Vulneración al Principio de Libertad de Concurrencia (Art. 2 Ley 30225) y Pronunciamiento N° 450-2023/OSCE-DGR..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pretensión o Propuesta de Solución:</label>
                <input
                  type="text"
                  value={propuesta}
                  onChange={(e) => setPropuesta(e.target.value)}
                  placeholder="Ej: Se solicita suprimir la exigencia restrictiva o aceptar documentos alternativos..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddObservation}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer"
              >
                Guardar en Pliego
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/40 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            Paso 5 de 7 • Consultas y Observaciones Listas
          </div>
          <h4 className="text-base font-bold text-white mt-0.5">
            Siguiente Paso: Consolidación y Armado del Expediente de Oferta
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Genere todos los Anexos oficiales del OSCE y organice interactivamente sus PDFs y documentos de sustento en las carpetas de admisión, habilitación, calificación y propuesta económica.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => (onNavigateToTab ? onNavigateToTab("builder") : null)}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow cursor-pointer flex items-center space-x-2"
          >
            <span>Continuar al Armado de Ofertas (Paso 7)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
