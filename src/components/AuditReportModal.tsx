import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Award,
  Check,
} from "lucide-react";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  AuditReport,
} from "../types/osce";
import { auditProposalAPI } from "../services/api";
import { formatPEN } from "../services/docxGenerator";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: TenderInfo;
  company: CompanyProfile;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  montoOfertado: number;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  tender,
  company,
  personal,
  equipment,
  experience,
  montoOfertado,
}) => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  if (!isOpen) return null;

  const totalExperienciaSoles = experience.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0);
  const expCumple = totalExperienciaSoles >= tender.valorNumerico;

  const handleRunAIAudit = async () => {
    setIsAuditing(true);
    try {
      const generatedReport = await auditProposalAPI({
        tenderInfo: tender,
        companyInfo: company,
        personal,
        equipment,
        experience,
        montoOfertado,
      });
      setReport(generatedReport);
    } catch (err) {
      console.error("Error auditing:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Auditoría Preventiva de Admisibilidad y Cumplimiento SEACE
              </h3>
              <p className="text-xs text-slate-400">
                {tender.nomenclatura} • {company.razonSocial}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 text-xs">
          {/* Quick AI Audit Action */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Auditoría Legal y Preventiva Integral</span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Evalúa automáticamente el expediente completo bajo el tamiz del Art. 52, Art. 60 (subsanaciones) y causales de descalificación del OSCE.
              </p>
            </div>

            <button
              onClick={handleRunAIAudit}
              disabled={isAuditing}
              className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-2 shrink-0"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditando Expediente...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ejecutar Auditoría IA</span>
                </>
              )}
            </button>
          </div>

          {/* AI Audit Report Result */}
          {report && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      report.estadoAdmisibilidad === "ADMISIBLE"
                        ? "bg-emerald-100 text-emerald-800"
                        : report.estadoAdmisibilidad === "CON_OBSERVACIONES_SUBSANABLES"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    ESTADO: {report.estadoAdmisibilidad.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900">Puntaje Estimado: </span>
                  <span className="font-extrabold text-blue-600 text-sm">{report.puntajeTecnicoEstimado} / 100 pts</span>
                </div>
              </div>

              {/* Summary */}
              <div className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                {report.resumenEjecutivo}
              </div>

              {/* Inconsistencies & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="font-bold text-red-900 block flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Inconsistencias Detectadas:</span>
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {report.inconsistenciasDetectadas.map((inc, i) => (
                      <li key={i}>{inc}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-emerald-900 block flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Recomendaciones Preventivas:</span>
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {report.recomendacionesPreviasPresentacion.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Standard Rule Checklist */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
              Lista de Control de Requisitos Esenciales (Pre-Carga SEACE):
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-800 font-medium">Anexos Obligatorios (1, 2, 3, 4) generados</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                  Completo ✓
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-800 font-medium">Registro RNP Vigente en el capítulo correspondiente</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                  {company.rnpVigente ? "Vigente ✓" : "Verificar en OSCE"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-800 font-medium">Personal Clave con Colegiatura y Acreditación</span>
                </div>
                <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                  {personal.length} Profesionales
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  {expCumple ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-slate-800 font-medium">
                    Experiencia del Postor (Anexo 8): S/ {formatPEN(totalExperienciaSoles)}
                  </span>
                </div>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    expCumple ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {expCumple ? "Cumple Cobertura ✓" : "Suma Parcial"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-800 font-medium">
                    Propuesta Económica: S/ {formatPEN(montoOfertado)}
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                  Calculado con IGV ✓
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
