import React, { useState } from "react";
import {
  X,
  Download,
  Sparkles,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Edit3,
} from "lucide-react";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
} from "../types/osce";
import {
  generateAnexo1Docx,
  generateAnexo2Docx,
  generateAnexo3Docx,
  generateAnexo4Docx,
  generateAnexo6EconomicoDocx,
  generateAnexo8ExperienciaDocx,
  generatePersonalYEquipamientoDocx,
  generateConsultasObservacionesDocx,
  downloadDocxBlob,
  formatPEN,
  numeroALetras,
} from "../services/docxGenerator";
import { generateAnnexContentAPI } from "../services/api";

interface AnnexEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  annexId: string;
  annexTitle: string;
  tender: TenderInfo;
  company: CompanyProfile;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  observations: ObservationItem[];
  montoOfertado: number;
  incluyeIGV: boolean;
  onSaveCustomContent: (annexId: string, content: string) => void;
}

export const AnnexEditorModal: React.FC<AnnexEditorModalProps> = ({
  isOpen,
  onClose,
  annexId,
  annexTitle,
  tender,
  company,
  personal,
  equipment,
  experience,
  observations,
  montoOfertado,
  incluyeIGV,
  onSaveCustomContent,
}) => {
  const [customText, setCustomText] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "edit">("preview");

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await generateAnnexContentAPI({
        annexType: annexTitle,
        tenderInfo: tender,
        companyInfo: company,
        customRequirements: customText,
      });
      setCustomText(generated);
      onSaveCustomContent(annexId, generated);
    } catch (error) {
      console.error("Error generating with AI:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      let blob: Blob;
      let filename = `${annexId.toUpperCase()}_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;

      switch (annexId) {
        case "anexo1":
          blob = await generateAnexo1Docx(tender, company);
          filename = `Anexo_01_Datos_del_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "anexo2":
          blob = await generateAnexo2Docx(tender, company, customText);
          filename = `Anexo_02_Cumplimiento_TDR_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "anexo3":
          blob = await generateAnexo3Docx(tender, company);
          filename = `Anexo_03_Plazo_Entrega_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "anexo4":
          blob = await generateAnexo4Docx(tender, company);
          filename = `Anexo_04_Declaracion_Art52_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "anexo6":
          blob = await generateAnexo6EconomicoDocx(tender, company, montoOfertado, incluyeIGV);
          filename = `Anexo_06_Oferta_Economica_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "anexo8":
          blob = await generateAnexo8ExperienciaDocx(tender, company, experience);
          filename = `Anexo_08_Experiencia_Postor_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "personal":
          blob = await generatePersonalYEquipamientoDocx(tender, company, personal, equipment);
          filename = `Carta_Personal_y_Equipamiento_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "observaciones":
          blob = await generateConsultasObservacionesDocx(tender, company, observations);
          filename = `Pliego_Consultas_Observaciones_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        default:
          blob = await generateAnexo1Docx(tender, company);
      }

      downloadDocxBlob(blob, filename);
    } catch (err) {
      console.error("Error downloading docx:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText || "Documento generado para OSCE.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{annexTitle}</h3>
              <p className="text-xs text-slate-400">
                {tender.nomenclatura} • {tender.entidadConvocante}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView("preview")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === "preview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Vista Previa Oficial</span>
            </button>

            <button
              onClick={() => setActiveView("edit")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeView === "edit"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Redacción / IA</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Redactando cláusulas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Redactar Cláusulas</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>

            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Generando..." : "Descargar Word (.docx)"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Document Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {activeView === "edit" ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Editor de Contenido y Cláusulas Técnicas / Declaración Jurada:
              </label>
              <textarea
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  onSaveCustomContent(annexId, e.target.value);
                }}
                rows={14}
                placeholder="Escriba o use el botón 'Auto-Redactar Cláusulas' para generar las cláusulas de cumplimiento exactas según las Bases Administrativas..."
                className="w-full text-xs font-mono text-slate-800 border border-slate-300 rounded-lg p-3.5 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed bg-slate-50/50"
              />
              <div className="text-[11px] text-slate-500">
                Los cambios se integrarán en el documento oficial al momento de exportar a Word (.docx).
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-300 p-8 text-slate-800 font-sans text-xs space-y-6">
              {/* Official Header format */}
              <div className="text-right text-[10px] text-slate-400 border-b border-slate-200 pb-2">
                {tender.nomenclatura} - SEACE OSCE
              </div>

              <div className="text-center space-y-1">
                <div className="font-bold text-base text-slate-900 tracking-wide uppercase">
                  {annexTitle}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  {tender.nomenclatura}
                </div>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="font-bold">Señores</div>
                <div className="font-bold">COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES</div>
                <div className="text-slate-800">{tender.entidadConvocante}</div>
                <div>Presente.-</div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800">
                  Referencia: <span className="font-normal">{tender.nomenclatura}</span>
                </div>
                <p className="text-justify leading-relaxed text-slate-700">
                  El que suscribe, <strong>{company.representanteLegal}</strong>, identificado con DNI N° <strong>{company.dniRepresentante}</strong>, en calidad de Representante Legal de la empresa <strong>{company.razonSocial}</strong>, con RUC N° <strong>{company.ruc}</strong>, declara bajo juramento ante ustedes en estricto cumplimiento de la Ley N° 30225 y su Reglamento:
                </p>
              </div>

              {/* Specific Content per Annex */}
              {annexId === "anexo1" && (
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-semibold text-slate-700 w-1/3">Razón Social:</td>
                        <td className="p-2 text-slate-900">{company.razonSocial}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-semibold text-slate-700">RUC:</td>
                        <td className="p-2 text-slate-900">{company.ruc}</td>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-semibold text-slate-700">RNP:</td>
                        <td className="p-2 text-slate-900">VIGENTE ({company.registroRNP})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-semibold text-slate-700">Domicilio Fiscal:</td>
                        <td className="p-2 text-slate-900">{company.domicilioFiscal} - {company.distrito}, {company.provincia}</td>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-semibold text-slate-700">Correo Notificación:</td>
                        <td className="p-2 text-slate-900">{company.email}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-semibold text-slate-700">Cuenta Bancaria / CCI:</td>
                        <td className="p-2 text-slate-900">{company.banco} | CCI: {company.cuentaCCI}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {annexId === "anexo3" && (
                <div className="bg-blue-50/60 border-2 border-blue-600/50 rounded-lg p-4 text-center space-y-1">
                  <div className="font-bold text-sm text-blue-950 uppercase">
                    PLAZO OFERTADO: {tender.plazoEjecucion.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-600 italic">
                    Conforme al Capítulo III de las Bases Administrativas
                  </div>
                </div>
              )}

              {annexId === "anexo4" && (
                <ul className="space-y-2 text-slate-700 list-disc list-inside">
                  <li>No haber incurrido y obligarse a no incurrir en actos de corrupción (Principio de Integridad).</li>
                  <li>No tener impedimento para postular ni contratar conforme al Art. 11 de la Ley 30225.</li>
                  <li>Garantizar la veracidad de todos los documentos bajo el TUO Ley 27444.</li>
                  <li>Conocer las sanciones aplicables por el Tribunal de Contrataciones del Estado (TCE).</li>
                </ul>
              )}

              {annexId === "anexo6" && (
                <div className="space-y-3">
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 font-semibold text-slate-700">Subtotal / Valor Venta:</td>
                          <td className="p-2 text-right font-mono">{formatPEN(incluyeIGV ? montoOfertado / 1.18 : montoOfertado)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 font-semibold text-slate-700">{incluyeIGV ? "IGV (18%):" : "IGV Exonerado:"}</td>
                          <td className="p-2 text-right font-mono">{formatPEN(incluyeIGV ? montoOfertado - (montoOfertado / 1.18) : 0)}</td>
                        </tr>
                        <tr className="bg-blue-50/70 font-bold">
                          <td className="p-2 text-blue-950">MONTO TOTAL OFERTADO:</td>
                          <td className="p-2 text-right font-mono text-blue-950 text-xs">{formatPEN(montoOfertado)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">
                    SON: <span className="font-bold">{numeroALetras(montoOfertado)}</span>
                  </div>
                </div>
              )}

              {/* Custom Annex 2 text preview */}
              {customText && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {customText}
                </div>
              )}

              {/* Signature Block */}
              <div className="pt-8 text-center space-y-1">
                <div className="w-64 border-t border-slate-400 mx-auto mb-2"></div>
                <div className="font-bold text-slate-900">{company.representanteLegal}</div>
                <div className="text-[11px] text-slate-600">DNI N° {company.dniRepresentante} - Representante Legal</div>
                <div className="text-[11px] font-semibold text-slate-700">{company.razonSocial}</div>
                <div className="text-[10px] text-slate-500">RUC N° {company.ruc}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Formato oficial validado según Bases Estándar OSCE vigentes</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "Generando..." : "Descargar Word (.docx)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
