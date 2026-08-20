import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  Scale,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Shield,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { TenderInfo, CompanyProfile } from "../types/osce";
import { legalChatAPI } from "../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface LegalAssistantProps {
  tender: TenderInfo;
  company: CompanyProfile;
  onNavigateToTab?: (tab: string) => void;
}

export const LegalAssistant: React.FC<LegalAssistantProps> = ({
  tender,
  company,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `¡Hola! Soy su Asesor Legal Especialista en Contrataciones con el Estado Peruano (Ley N° 30225, D.S. N° 344-2018-EF, Directivas y Resoluciones del Tribunal del OSCE).\n\nEstoy analizando el procedimiento **${tender.nomenclatura}** de **${tender.entidadConvocante}** para la empresa **${company.razonSocial}**.\n\n¿En qué puedo orientarle hoy? Puede consultar sobre subsanación de ofertas, requisitos de admisibilidad, experiencia en consorcio, o recursos de apelación.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    "¿Qué defectos en la oferta son subsanables según el Art. 60 del Reglamento?",
    "¿Cómo se acredita la experiencia en consorcio según la Directiva OSCE?",
    "¿Qué documentos son obligatorios para la firma de contrato según el Art. 139?",
    "¿Cuáles son los límites del 90% y 110% en licitaciones de obra (Art. 68)?",
    "¿Cuándo y ante quién se interpone el Recurso de Apelación (Tribunal vs Entidad)?",
    "¿Se puede reemplazar al personal clave antes de la suscripción del contrato?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }],
      }));

      const reply = await legalChatAPI({
        message: query,
        tenderContext: tender,
        chatHistory: history,
      });

      const assistantMsg: Message = {
        role: "assistant",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        role: "assistant",
        text: "Ocurrió un error al consultar al asesor legal. Por favor verifique su conexión o intente reformular la consulta.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Paso 6 de 7 • Consultor Normativo Especializado • Ley N° 30225</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Consultor Legal de Contrataciones Públicas
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Resuelva dudas normativas complejas sobre la admisibilidad de su propuesta, causales de descalificación, cálculo de penalidades y jurisprudencia del Tribunal de Contrataciones.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigateToTab ? onNavigateToTab("builder") : null}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow cursor-pointer"
          >
            <span>Ir al Paso 7: Armador de Oferta Final</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Consultas Frecuentes de Postores en el SEACE:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-left text-xs bg-white hover:bg-blue-50/80 hover:text-blue-900 border border-slate-200 hover:border-blue-300 p-2.5 rounded-lg transition text-slate-700 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[520px] overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm space-y-1"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center space-x-1.5 text-indigo-600 font-bold text-[11px] mb-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Consultor Normativo OSCE</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] text-right mt-1 ${
                    m.role === "user" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 text-xs shadow-sm flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-slate-600">Consultando Ley 30225 y resoluciones del TCE...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escriba su consulta legal o técnica respecto al procedimiento..."
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Next Step Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/40 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
            Paso 6 Completado • Consultas Legales Resueltas
          </div>
          <h4 className="text-base font-bold text-white mt-0.5">
            Último Paso: Armador de Oferta Final y Generación de Expediente Word (.docx / ZIP)
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Genere todos los Anexos OSCE (Anexos 1 al 8, Carta de Personal/Equipos, Oferta Económica) listos para firma y foliación.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateToTab ? onNavigateToTab("builder") : null}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow cursor-pointer flex items-center space-x-2"
          >
            <span>Ir al Paso 7: Armador de Oferta Final</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
