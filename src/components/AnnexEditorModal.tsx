import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  RefreshCw,
  FileCheck2,
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
  generateAnexo5PromesaConsorcioDocx,
  generateContratoConsorcioDocx,
  generateAnexo6EconomicoDocx,
  generateAnexo8ExperienciaDocx,
  generatePersonalYEquipamientoDocx,
  generateConsultasObservacionesDocx,
  downloadDocxBlob,
} from "../services/docxGenerator";
import { generateAnnexContentAPI } from "../services/api";
import { WordDocumentEditor } from "./WordDocumentEditor";
import { getGeneralAnnexHtml } from "../services/annexHtmlTemplates";

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
  observations?: ObservationItem[];
  montoOfertado: number;
  incluyeIGV: boolean;
  onSaveCustomContent: (annexId: string, content: string) => void;
  initialContent?: string;
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
  observations = [],
  montoOfertado,
  incluyeIGV,
  onSaveCustomContent,
  initialContent,
}) => {
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const initializedAnnexRef = useRef<string | null>(null);

  // Initialize template ONLY when modal opens or annexId changes, NEVER on typing re-renders
  useEffect(() => {
    if (isOpen && initializedAnnexRef.current !== annexId) {
      initializedAnnexRef.current = annexId;
      const initial = getGeneralAnnexHtml(annexId, annexTitle, tender, company, {
        montoOfertado,
        incluyeIGV,
        personal,
        equipment,
        experience,
        observations,
      });
      setCurrentHtml(initial);
    }
    if (!isOpen) {
      initializedAnnexRef.current = null;
    }
  }, [isOpen, annexId]);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await generateAnnexContentAPI({
        annexType: annexTitle,
        tenderInfo: tender,
        companyInfo: company,
      });

      if (generated) {
        const enrichedHtml = `
          ${currentHtml}
          <div style="margin-top: 16px; padding: 12px; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 4px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #166534;">CLÁUSULAS ADICIONALES GENERADAS POR IA CONFORME A LAS BASES:</p>
            <p style="margin: 0; text-align: justify; font-size: 9.5pt;">${generated.replace(/\n/g, "<br/>")}</p>
          </div>
        `;
        setCurrentHtml(enrichedHtml);
        onSaveCustomContent(annexId, generated);
      }
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
          blob = await generateAnexo2Docx(tender, company);
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
        case "anexo5":
          blob = await generateAnexo5PromesaConsorcioDocx(tender, company);
          filename = `Anexo_05_Promesa_Formal_Consorcio_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
          break;
        case "contratoConsorcio":
          blob = await generateContratoConsorcioDocx(tender, company);
          filename = `Contrato_Privado_Consorcio_Notarial_${tender.nomenclatura.replace(/[\/\\:]/g, "_")}.docx`;
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

  const handleResetToDefault = () => {
    const fresh = getGeneralAnnexHtml(annexId, annexTitle, tender, company, {
      montoOfertado,
      incluyeIGV,
      personal,
      equipment,
      experience,
      observations,
    });
    setCurrentHtml(fresh);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                  {annexTitle}
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400/30 uppercase">
                  Editor Word Interactivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tender.nomenclatura} • {tender.entidadConvocante}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Redactar cláusulas legales de cumplimiento con IA"
            >
              {isGeneratingAI ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingAI ? "Redactando con IA..." : "Auto-Redactar Cláusulas IA"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Word Document Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90">
          <WordDocumentEditor
            initialHtml={currentHtml}
            documentTitle={annexTitle}
            documentSubtitle={`${tender.nomenclatura} • ${company.esConsorcio ? "Oferta en Consorcio" : "Oferta Individual"}`}
            nomenclatura={tender.nomenclatura}
            onContentChange={(html, plainText) => {
              setCurrentHtml(html);
              onSaveCustomContent(annexId, plainText);
            }}
            onDownloadDocx={handleDownloadDocx}
            onResetToDefault={handleResetToDefault}
            isDownloadingDocx={isDownloading}
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Los cambios que realices directamente en la hoja se conservarán para tu oferta y exportación en Word (.docx).
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg transition cursor-pointer text-xs self-end"
          >
            Aceptar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
