import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Coins,
  ShieldCheck,
  Scale,
  FileCheck2,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  ArrowRight,
  Printer,
  Copy,
  Info,
  UserCheck,
  Plus,
  Trash2,
  Users,
  MessageSquare,
  Briefcase,
  FileSignature,
} from "lucide-react";
import {
  CategoriaDocumentoOEI,
  TipoDocumentoOEI,
  EntityValuationReportConfig,
  SAMPLE_RIOJA_ENTITY_REPORT,
  SAMPLE_RIOJA_LOCADOR_CONFORMIDAD,
  SAMPLE_RIOJA_CARTA_LOCADOR,
  SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL,
  SAMPLE_RIOJA_GERENTE_ELEVACION,
  SAMPLE_RIOJA_NOTA_INFORMATIVA,
  PRESETS_DOCUMENTOS_OEI,
} from "../../types/entityReports";
import { ObraProyecto, ValorizacionMensual } from "../../types/obras";
import {
  generateEntityValuationReportDocx,
  getEntityValuationReportHtml,
  buildEntityReportFromObra,
} from "../../services/entityValuationReportGenerator";
import { formatPEN, numeroALetras, downloadDocxBlob } from "../../services/docxGenerator";
import { WordDocumentEditor } from "../WordDocumentEditor";

interface EntityValuationReportsManagerProps {
  currentObra?: ObraProyecto;
  valorizaciones?: ValorizacionMensual[];
  initialTab?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const EntityValuationReportsManager: React.FC<EntityValuationReportsManagerProps> = ({
  currentObra,
  valorizaciones = [],
  initialTab,
  onNavigateToTab,
}) => {
  // Determine starting category based on navigation
  const initialCategory: CategoriaDocumentoOEI = useMemo(() => {
    if (initialTab === "informes-locadores") return "LOCADORES";
    if (initialTab === "informes-jefe-oei") return "JEFE_OEI";
    if (initialTab === "informes-gerente") return "GERENTE_INVERSIONES";
    if (initialTab === "informes-memos") return "NOTAS_MEMORANDUMS";
    return "VALORIZACIONES";
  }, [initialTab]);

  const [selectedCategory, setSelectedCategory] = useState<CategoriaDocumentoOEI>(initialCategory);

  // Initialize report configuration
  const [reportConfig, setReportConfig] = useState<EntityValuationReportConfig>(() => {
    if (initialTab === "informes-locadores") return SAMPLE_RIOJA_LOCADOR_CONFORMIDAD;
    if (initialTab === "informes-jefe-oei") return SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL;
    if (initialTab === "informes-gerente") return SAMPLE_RIOJA_GERENTE_ELEVACION;
    if (initialTab === "informes-memos") return SAMPLE_RIOJA_NOTA_INFORMATIVA;

    if (currentObra && valorizaciones && valorizaciones.length > 0) {
      return buildEntityReportFromObra(currentObra, valorizaciones[0]);
    }
    return SAMPLE_RIOJA_ENTITY_REPORT;
  });

  // Switch category when initialTab changes
  useEffect(() => {
    if (initialTab === "informes-locadores") {
      setSelectedCategory("LOCADORES");
      setReportConfig(SAMPLE_RIOJA_LOCADOR_CONFORMIDAD);
    } else if (initialTab === "informes-jefe-oei") {
      setSelectedCategory("JEFE_OEI");
      setReportConfig(SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL);
    } else if (initialTab === "informes-gerente") {
      setSelectedCategory("GERENTE_INVERSIONES");
      setReportConfig(SAMPLE_RIOJA_GERENTE_ELEVACION);
    } else if (initialTab === "informes-memos") {
      setSelectedCategory("NOTAS_MEMORANDUMS");
      setReportConfig(SAMPLE_RIOJA_NOTA_INFORMATIVA);
    } else if (initialTab === "informes-entidad" || initialTab === "obras-informe-entidad") {
      setSelectedCategory("VALORIZACIONES");
      if (currentObra && valorizaciones.length > 0) {
        setReportConfig(buildEntityReportFromObra(currentObra, valorizaciones[0]));
      } else {
        setReportConfig(SAMPLE_RIOJA_ENTITY_REPORT);
      }
    }
  }, [initialTab]);

  const [activeTab, setActiveTab] = useState<"params" | "preview">("preview");
  const [activeConfigTab, setActiveConfigTab] = useState<"cabecera" | "especificos" | "actividades" | "conclusiones">("especificos");
  const [isDownloading, setIsDownloading] = useState(false);
  const [customHtml, setCustomHtml] = useState<string>("");
  const [hasCustomEdits, setHasCustomEdits] = useState(false);
  const [selectedValNum, setSelectedValNum] = useState<number>(reportConfig.numeroValorizacion || 4);

  // Generate initial HTML from config
  useEffect(() => {
    const generated = getEntityValuationReportHtml(reportConfig);
    setCustomHtml(generated);
    setHasCustomEdits(false);
  }, [reportConfig]);

  // Recalculate financial totals dynamically for valuations
  const handleFinancialChange = (field: keyof EntityValuationReportConfig, value: number) => {
    setReportConfig((prev) => {
      const updated = { ...prev, [field]: value };

      const vBruta = field === "valorizacionBruta" ? value : updated.valorizacionBruta;
      const kFactor = field === "factorKReajuste" ? value : updated.factorKReajuste;
      const reajusteCalculado = Number((vBruta * Math.max(0, kFactor - 1)).toFixed(2));
      const rMonto = field === "reajusteMontoK" ? value : reajusteCalculado;
      const dedReajuste = field === "deduccionReajusteNoCorresponde" ? value : updated.deduccionReajusteNoCorresponde;
      const rNeto = Number(Math.max(0, rMonto - dedReajuste).toFixed(2));

      const amortDir = field === "amortizacionAdelantoDirectoMes" ? value : updated.amortizacionAdelantoDirectoMes;
      const amortMat = field === "amortizacionMaterialesMes" ? value : updated.amortizacionMaterialesMes;
      const retGarantia = field === "retencionFondoGarantiaMes" ? value : updated.retencionFondoGarantiaMes;
      const pen = field === "penalidadesMora" ? value : updated.penalidadesMora;
      const otrasPen = field === "otrasPenalidades" ? value : updated.otrasPenalidades;

      const subtotalNeto = Number(Math.max(0, vBruta + rNeto - amortDir - amortMat - retGarantia - pen - otrasPen).toFixed(2));
      const igv = Number((subtotalNeto * 0.18).toFixed(2));
      const totalCancelar = Number((subtotalNeto + igv).toFixed(2));
      const letras = numeroALetras(totalCancelar);

      return {
        ...updated,
        reajusteMontoK: rMonto,
        reajusteNeto: rNeto,
        montoNetoAPagar: subtotalNeto,
        igv18Pct: igv,
        totalFacturarCancelar: totalCancelar,
        montoTotalLetras: letras,
      };
    });
  };

  // Recalculate honorario for Locadores
  const handleLocadorHonorarioChange = (monto: number) => {
    setReportConfig((prev) => ({
      ...prev,
      montoHonorarioMensual: monto,
      montoNetoAPagar: monto,
      totalFacturarCancelar: monto,
      montoTotalLetras: numeroALetras(monto),
    }));
  };

  // Switch category and load preset
  const handleSelectCategory = (cat: CategoriaDocumentoOEI) => {
    setSelectedCategory(cat);
    if (cat === "LOCADORES") {
      setReportConfig(SAMPLE_RIOJA_LOCADOR_CONFORMIDAD);
    } else if (cat === "JEFE_OEI") {
      setReportConfig(SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL);
    } else if (cat === "GERENTE_INVERSIONES") {
      setReportConfig(SAMPLE_RIOJA_GERENTE_ELEVACION);
    } else if (cat === "NOTAS_MEMORANDUMS") {
      setReportConfig(SAMPLE_RIOJA_NOTA_INFORMATIVA);
    } else if (cat === "VALORIZACIONES") {
      if (currentObra && valorizaciones.length > 0) {
        setReportConfig(buildEntityReportFromObra(currentObra, valorizaciones[0]));
      } else {
        setReportConfig(SAMPLE_RIOJA_ENTITY_REPORT);
      }
    }
  };

  // Sync with available obra valorizaciones
  const handleSelectObraValorizacion = (valIndex: number) => {
    if (!valorizaciones || valorizaciones.length === 0) return;
    const targetVal = valorizaciones[valIndex] || valorizaciones[0];
    if (targetVal) {
      setSelectedValNum(targetVal.numero);
      if (currentObra) {
        const synced = buildEntityReportFromObra(currentObra, targetVal, reportConfig.tipoInforme);
        setReportConfig(synced);
      }
    }
  };

  // Sync current Obra into the active report
  const handleSyncCurrentObra = () => {
    if (!currentObra) {
      alert("No hay una obra activa seleccionada para sincronizar.");
      return;
    }
    const year = new Date().getFullYear();
    setReportConfig((prev) => ({
      ...prev,
      cui: currentObra.cui || prev.cui,
      nombreObra: currentObra.nombre ? currentObra.nombre.toUpperCase() : prev.nombreObra,
      contratoNumero: currentObra.numeroDocumentoContratista || prev.contratoNumero,
      contratistaRazonSocial: currentObra.contratista ? currentObra.contratista.toUpperCase() : prev.contratistaRazonSocial,
      contratistaRuc: currentObra.rucContratista || prev.contratistaRuc,
      supervisorEmpresa: currentObra.supervisor || prev.supervisorEmpresa,
      supervisorNombre: currentObra.jefeSupervision || prev.supervisorNombre,
      montoContratoVigente: currentObra.montoContractual || prev.montoContratoVigente,
      plazoContractualDias: currentObra.plazoDias || prev.plazoContractualDias,
      fechaInicioPlazo: currentObra.fechaInicio || prev.fechaInicioPlazo,
      fechaFinContractual: currentObra.fechaFinProgramada || prev.fechaFinContractual,
    }));
  };

  // Download Docx directly
  const handleDownloadDocx = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateEntityValuationReportDocx(reportConfig);
      const cleanDocNum = reportConfig.numeroDocumento.replace(/[\/\\:\s]/g, "_");
      const filename = `${cleanDocNum}_Rioja.docx`;
      downloadDocxBlob(blob, filename);
    } catch (error) {
      console.error("Error generating docx:", error);
      alert("Hubo un error al generar el archivo Word. Por favor revisa los datos.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Add item to dynamic string lists
  const handleAddListItem = (
    field: "actividadesRealizadas" | "entregablesPresentados" | "conclusiones" | "recomendaciones" | "novedadesRiesgos" | "accionesRequeridas" | "baseLegalList",
    defaultText: string = "Nueva actividad técnica registrada"
  ) => {
    setReportConfig((prev) => {
      const currentList = prev[field] || [];
      return {
        ...prev,
        [field]: [...currentList, defaultText],
      };
    });
  };

  const handleUpdateListItem = (
    field: "actividadesRealizadas" | "entregablesPresentados" | "conclusiones" | "recomendaciones" | "novedadesRiesgos" | "accionesRequeridas" | "baseLegalList",
    index: number,
    value: string
  ) => {
    setReportConfig((prev) => {
      const currentList = [...(prev[field] || [])];
      currentList[index] = value;
      return {
        ...prev,
        [field]: currentList,
      };
    });
  };

  const handleDeleteListItem = (
    field: "actividadesRealizadas" | "entregablesPresentados" | "conclusiones" | "recomendaciones" | "novedadesRiesgos" | "accionesRequeridas" | "baseLegalList",
    index: number
  ) => {
    setReportConfig((prev) => {
      const currentList = (prev[field] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [field]: currentList,
      };
    });
  };

  const isLocador = selectedCategory === "LOCADORES";
  const isJefeOei = selectedCategory === "JEFE_OEI";
  const isGerente = selectedCategory === "GERENTE_INVERSIONES";
  const isMemo = selectedCategory === "NOTAS_MEMORANDUMS";
  const isValorizacion = selectedCategory === "VALORIZACIONES";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-7 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Módulo 3 • Gestión Documentaria OEI
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Municipalidad Provincial de Rioja
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Ley N° 30225 & Invierte.pe
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Centro Documentario & Informes de Inversiones (OEI)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Generador integral de documentos oficiales para la <strong>Oficina de Ejecución de Inversiones (OEI)</strong> y la <strong>Gerencia de Desarrollo Urbano e Infraestructura</strong>: conformidades y cartas de locadores, informes técnicos situacionales, elevaciones a Gerencia Municipal con proyectos de resolución, notas informativas y valorizaciones de obra en Microsoft Word (.docx).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleSyncCurrentObra}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Copia los datos de la obra seleccionada en el sistema"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              Sincronizar Obra
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Generando..." : "Descargar Word (.docx)"}
            </button>
          </div>
        </div>

        {/* 5 CATEGORY PILLS */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => handleSelectCategory("LOCADORES")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer text-left ${
              selectedCategory === "LOCADORES"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="leading-tight truncate">1. Locadores (O.S.)</div>
              <div className={`text-[10px] font-normal truncate ${selectedCategory === "LOCADORES" ? "text-slate-900" : "text-slate-400"}`}>
                Conformidad & Cartas
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectCategory("JEFE_OEI")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer text-left ${
              selectedCategory === "JEFE_OEI"
                ? "bg-blue-500 text-white font-black shadow-lg shadow-blue-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="leading-tight truncate">2. Jefe de OEI</div>
              <div className={`text-[10px] font-normal truncate ${selectedCategory === "JEFE_OEI" ? "text-blue-100" : "text-slate-400"}`}>
                Informes Situacionales
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectCategory("GERENTE_INVERSIONES")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer text-left ${
              selectedCategory === "GERENTE_INVERSIONES"
                ? "bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="leading-tight truncate">3. Gerente Inversiones</div>
              <div className={`text-[10px] font-normal truncate ${selectedCategory === "GERENTE_INVERSIONES" ? "text-indigo-100" : "text-slate-400"}`}>
                Elevación a GM & RGM
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectCategory("NOTAS_MEMORANDUMS")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer text-left ${
              selectedCategory === "NOTAS_MEMORANDUMS"
                ? "bg-purple-500 text-white font-black shadow-lg shadow-purple-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="leading-tight truncate">4. Notas & Memos</div>
              <div className={`text-[10px] font-normal truncate ${selectedCategory === "NOTAS_MEMORANDUMS" ? "text-purple-100" : "text-slate-400"}`}>
                Comunicaciones OEI
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSelectCategory("VALORIZACIONES")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer text-left ${
              selectedCategory === "VALORIZACIONES"
                ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
            }`}
          >
            <FileCheck2 className="w-4 h-4 shrink-0" />
            <div className="truncate">
              <div className="leading-tight truncate">5. Valorizaciones</div>
              <div className={`text-[10px] font-normal truncate ${selectedCategory === "VALORIZACIONES" ? "text-slate-900" : "text-slate-400"}`}>
                Planilla Mensual Rioja
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Preset Fast Selector Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Plantilla Oficial Activa:
          </span>

          {isLocador && (
            <>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_LOCADOR_CONFORMIDAD)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                  reportConfig.tipoInforme === "INFORME_CONFORMIDAD_LOCADOR"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Conformidad de Locador OEI (O.S. 452)
              </button>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_CARTA_LOCADOR)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                  reportConfig.tipoInforme === "CARTA_INFORME_LOCADOR"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Carta del Locador Presentando Informe
              </button>
            </>
          )}

          {isJefeOei && (
            <>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_JEFE_OEI_SITUACIONAL)}
                className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                Informe Situacional de Obra y Adicional N° 01 (Jr. Colón y San Martín)
              </button>
            </>
          )}

          {isGerente && (
            <>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_GERENTE_ELEVACION)}
                className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                Informe Gerencial de Elevación a GM con Proyecto de Resolución
              </button>
            </>
          )}

          {isMemo && (
            <>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_NOTA_INFORMATIVA)}
                className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                Nota Informativa a Logística / Control Patrimonial
              </button>
            </>
          )}

          {isValorizacion && (
            <>
              <button
                onClick={() => setReportConfig(SAMPLE_RIOJA_ENTITY_REPORT)}
                className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                Informe Oficial Rioja (Val N° 04)
              </button>
              {valorizaciones && valorizaciones.length > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-slate-500 font-medium">Valorización:</span>
                  <select
                    value={selectedValNum}
                    onChange={(e) => handleSelectObraValorizacion(parseInt(e.target.value) - 1)}
                    className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800"
                  >
                    {valorizaciones.map((v, idx) => (
                      <option key={v.numero || idx} value={v.numero}>
                        Val N° {String(v.numero).padStart(2, "0")} ({v.mesPeriodo})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {reportConfig.numeroDocumento}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PARAMETER EDITOR (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Form Section Tabs */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveConfigTab("especificos")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  activeConfigTab === "especificos"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {isLocador ? "Datos Locador" : isValorizacion ? "Planilla Val." : "Datos Obra"}
              </button>
              <button
                onClick={() => setActiveConfigTab("cabecera")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  activeConfigTab === "cabecera"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                Cabecera & Ruteo
              </button>
              <button
                onClick={() => setActiveConfigTab("actividades")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  activeConfigTab === "actividades"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {isLocador ? "Actividades" : "Análisis Técnico"}
              </button>
              <button
                onClick={() => setActiveConfigTab("conclusiones")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                  activeConfigTab === "conclusiones"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                Dictamen
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-4 space-y-4 text-xs">
              {/* TAB 1: DATOS ESPECÍFICOS SEGÚN CATEGORÍA */}
              {activeConfigTab === "especificos" && (
                <div className="space-y-3.5">
                  {isLocador ? (
                    // FORMULARIO LOCADORES DE SERVICIOS
                    <>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                        <span>Datos del Locador y Orden de Servicio</span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold">
                          Contratación Directa
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nombre Completo del Locador
                        </label>
                        <input
                          type="text"
                          value={reportConfig.locadorNombre || ""}
                          onChange={(e) => setReportConfig({ ...reportConfig, locadorNombre: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI</label>
                          <input
                            type="text"
                            value={reportConfig.locadorDni || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, locadorDni: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">RUC (10...)</label>
                          <input
                            type="text"
                            value={reportConfig.locadorRuc || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, locadorRuc: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Profesión / Especialidad & CIP
                        </label>
                        <input
                          type="text"
                          value={reportConfig.locadorProfesion || ""}
                          onChange={(e) => setReportConfig({ ...reportConfig, locadorProfesion: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Orden de Servicio N°
                          </label>
                          <input
                            type="text"
                            value={reportConfig.ordenServicioNumero || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, ordenServicioNumero: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Fecha de Orden
                          </label>
                          <input
                            type="text"
                            value={reportConfig.ordenServicioFecha || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, ordenServicioFecha: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Meta Presupuestal
                          </label>
                          <input
                            type="text"
                            value={reportConfig.metaPresupuestal || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, metaPresupuestal: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            N° Entregable / Mes
                          </label>
                          <input
                            type="text"
                            value={reportConfig.numeroEntregable || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, numeroEntregable: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Recibo por Honorarios N°
                          </label>
                          <input
                            type="text"
                            value={reportConfig.reciboHonorariosNumero || ""}
                            onChange={(e) => setReportConfig({ ...reportConfig, reciboHonorariosNumero: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Honorario Mensual (S/)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={reportConfig.montoHonorarioMensual || 4500}
                            onChange={(e) => handleLocadorHonorarioChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Periodo del Servicio
                        </label>
                        <input
                          type="text"
                          value={reportConfig.periodoServicio || ""}
                          onChange={(e) => setReportConfig({ ...reportConfig, periodoServicio: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                    </>
                  ) : isValorizacion ? (
                    // FORMULARIO PLANILLA FINANCIERA VALORIZACIÓN
                    <>
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                          Planilla de Liquidación Val. N° {reportConfig.numeroValorizacion}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                          Cálculo Automático
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1. Valorización Bruta del Mes (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={reportConfig.valorizacionBruta}
                          onChange={(e) => handleFinancialChange("valorizacionBruta", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Coeficiente K Reajuste
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={reportConfig.factorKReajuste}
                            onChange={(e) => handleFinancialChange("factorKReajuste", parseFloat(e.target.value) || 1)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Reajuste Neto (S/)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={reportConfig.reajusteNeto}
                            onChange={(e) => handleFinancialChange("reajusteNeto", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-blue-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Amort. Adelanto Directo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={reportConfig.amortizacionAdelantoDirectoMes}
                            onChange={(e) => handleFinancialChange("amortizacionAdelantoDirectoMes", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Amort. Materiales
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={reportConfig.amortizacionMaterialesMes}
                            onChange={(e) => handleFinancialChange("amortizacionMaterialesMes", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-red-600"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                        <div className="flex justify-between text-slate-700 text-xs">
                          <span>Subtotal Neto:</span>
                          <span className="font-mono font-bold">{formatPEN(reportConfig.montoNetoAPagar)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700 text-xs">
                          <span>I.G.V. (18%):</span>
                          <span className="font-mono font-bold">{formatPEN(reportConfig.igv18Pct)}</span>
                        </div>
                        <div className="flex justify-between text-blue-900 text-sm font-black pt-1 border-t border-blue-200">
                          <span>Total a Facturar / Cancelar:</span>
                          <span className="font-mono">{formatPEN(reportConfig.totalFacturarCancelar)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    // FORMULARIO DATOS CONTRACTUALES DE OBRA (JEFE OEI / GERENTE / MEMOS)
                    <>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                        Datos del Proyecto de Inversión Pública
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Código CUI</label>
                          <input
                            type="text"
                            value={reportConfig.cui}
                            onChange={(e) => setReportConfig({ ...reportConfig, cui: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Contrato N°</label>
                          <input
                            type="text"
                            value={reportConfig.contratoNumero}
                            onChange={(e) => setReportConfig({ ...reportConfig, contratoNumero: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre de la Obra</label>
                        <textarea
                          rows={3}
                          value={reportConfig.nombreObra}
                          onChange={(e) => setReportConfig({ ...reportConfig, nombreObra: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Contratista Ejecutor</label>
                          <input
                            type="text"
                            value={reportConfig.contratistaRazonSocial}
                            onChange={(e) => setReportConfig({ ...reportConfig, contratistaRazonSocial: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto Contractual (S/)</label>
                          <input
                            type="number"
                            value={reportConfig.montoContratoVigente}
                            onChange={(e) => setReportConfig({ ...reportConfig, montoContratoVigente: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Plazo Contractual (días)</label>
                          <input
                            type="number"
                            value={reportConfig.plazoContractualDias}
                            onChange={(e) => setReportConfig({ ...reportConfig, plazoContractualDias: parseInt(e.target.value) || 180 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Término</label>
                          <input
                            type="text"
                            value={reportConfig.fechaFinContractual}
                            onChange={(e) => setReportConfig({ ...reportConfig, fechaFinContractual: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: CABECERA & RUTEO ADMINISTRATIVO */}
              {activeConfigTab === "cabecera" && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                    Identificación y Ruteo Oficial
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Número Oficial del Documento
                    </label>
                    <input
                      type="text"
                      value={reportConfig.numeroDocumento}
                      onChange={(e) => setReportConfig({ ...reportConfig, numeroDocumento: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Lugar y Fecha</label>
                      <input
                        type="text"
                        value={reportConfig.lugarFecha}
                        onChange={(e) => setReportConfig({ ...reportConfig, lugarFecha: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Entidad</label>
                      <input
                        type="text"
                        value={reportConfig.entidadNombre}
                        onChange={(e) => setReportConfig({ ...reportConfig, entidadNombre: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  {/* Destinatario (A) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                      Destinatario (A:)
                    </span>
                    <input
                      type="text"
                      placeholder="Nombre del destinatario"
                      value={reportConfig.destinatarioNombre}
                      onChange={(e) => setReportConfig({ ...reportConfig, destinatarioNombre: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Cargo del destinatario"
                      value={reportConfig.destinatarioCargo}
                      onChange={(e) => setReportConfig({ ...reportConfig, destinatarioCargo: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-600"
                    />
                  </div>

                  {/* Remitente (DE) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                      Remitente (DE:)
                    </span>
                    <input
                      type="text"
                      placeholder="Nombre del remitente"
                      value={reportConfig.remitenteNombre}
                      onChange={(e) => setReportConfig({ ...reportConfig, remitenteNombre: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Cargo del remitente"
                      value={reportConfig.remitenteCargo}
                      onChange={(e) => setReportConfig({ ...reportConfig, remitenteCargo: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Asunto</label>
                    <textarea
                      rows={2}
                      value={reportConfig.asuntoTexto}
                      onChange={(e) => setReportConfig({ ...reportConfig, asuntoTexto: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 leading-relaxed font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Referencias</label>
                    <textarea
                      rows={3}
                      value={reportConfig.referenciaTexto}
                      onChange={(e) => setReportConfig({ ...reportConfig, referenciaTexto: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVIDADES, ENTREGABLES & ANÁLISIS */}
              {activeConfigTab === "actividades" && (
                <div className="space-y-4">
                  {isLocador ? (
                    <>
                      {/* Actividades realizadas */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Actividades Desarrolladas ({reportConfig.actividadesRealizadas?.length || 0})
                          </span>
                          <button
                            onClick={() => handleAddListItem("actividadesRealizadas", "Nueva labor técnica realizada")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>
                        {(reportConfig.actividadesRealizadas || []).map((act, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 mt-1.5">{idx + 1}.</span>
                            <textarea
                              rows={2}
                              value={act}
                              onChange={(e) => handleUpdateListItem("actividadesRealizadas", idx, e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px]"
                            />
                            <button
                              onClick={() => handleDeleteListItem("actividadesRealizadas", idx)}
                              className="text-slate-400 hover:text-red-600 p-1 mt-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Entregables */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Entregables Presentados ({reportConfig.entregablesPresentados?.length || 0})
                          </span>
                          <button
                            onClick={() => handleAddListItem("entregablesPresentados", "Informe técnico específico")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>
                        {(reportConfig.entregablesPresentados || []).map((ent, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 mt-1.5">{idx + 1}.</span>
                            <input
                              type="text"
                              value={ent}
                              onChange={(e) => handleUpdateListItem("entregablesPresentados", idx, e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px]"
                            />
                            <button
                              onClick={() => handleDeleteListItem("entregablesPresentados", idx)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Antecedentes del Proyecto
                        </label>
                        <textarea
                          rows={3}
                          value={reportConfig.antecedentesTexto || ""}
                          onChange={(e) => setReportConfig({ ...reportConfig, antecedentesTexto: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Análisis Técnico y Situación
                        </label>
                        <textarea
                          rows={4}
                          value={reportConfig.analisisTecnicoTexto || ""}
                          onChange={(e) => setReportConfig({ ...reportConfig, analisisTecnicoTexto: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                        />
                      </div>

                      {/* Riesgos y Novedades */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Riesgos / Novedades de Campo
                          </span>
                          <button
                            onClick={() => handleAddListItem("novedadesRiesgos", "Nueva condición o riesgo detectado")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>
                        {(reportConfig.novedadesRiesgos || []).map((r, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 mt-1.5">•</span>
                            <textarea
                              rows={2}
                              value={r}
                              onChange={(e) => handleUpdateListItem("novedadesRiesgos", idx, e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px]"
                            />
                            <button
                              onClick={() => handleDeleteListItem("novedadesRiesgos", idx)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: CONCLUSIONES, RECOMENDACIONES & BASE LEGAL */}
              {activeConfigTab === "conclusiones" && (
                <div className="space-y-4">
                  {/* Conclusiones */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Conclusiones Oficiales ({reportConfig.conclusiones.length})
                      </span>
                      <button
                        onClick={() => handleAddListItem("conclusiones", "Conclusión técnica fundamentada")}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    </div>
                    {reportConfig.conclusiones.map((concl, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 mt-1.5">{idx + 1}.</span>
                        <textarea
                          rows={2}
                          value={concl}
                          onChange={(e) => handleUpdateListItem("conclusiones", idx, e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px]"
                        />
                        <button
                          onClick={() => handleDeleteListItem("conclusiones", idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Recomendaciones */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Recomendaciones y Trámite ({reportConfig.recomendaciones.length})
                      </span>
                      <button
                        onClick={() => handleAddListItem("recomendaciones", "Recomendación de trámite administrativo")}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    </div>
                    {reportConfig.recomendaciones.map((recom, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-[10px] font-bold text-blue-600 mt-1.5">{idx + 1}.</span>
                        <textarea
                          rows={2}
                          value={recom}
                          onChange={(e) => handleUpdateListItem("recomendaciones", idx, e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px]"
                        />
                        <button
                          onClick={() => handleDeleteListItem("recomendaciones", idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOCUMENT PREVIEW & WORD EDITOR (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Editor Action Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileSignature className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Vista Previa Word • Edición Directa
                </span>
                {hasCustomEdits && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                    Edición manual activa
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const generated = getEntityValuationReportHtml(reportConfig);
                    setCustomHtml(generated);
                    setHasCustomEdits(false);
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  title="Restablece el contenido a los datos del formulario"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restablecer
                </button>
                <button
                  onClick={handleDownloadDocx}
                  disabled={isDownloading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar (.docx)
                </button>
              </div>
            </div>

            {/* Word Document Editor Workspace */}
            <div className="p-4 bg-slate-100/60 min-h-[600px]">
              <WordDocumentEditor
                htmlContent={customHtml}
                onChange={(newHtml) => {
                  setCustomHtml(newHtml);
                  setHasCustomEdits(true);
                }}
                documentTitle={reportConfig.numeroDocumento}
                subtitle={`${reportConfig.entidadNombre} • ${reportConfig.entidadGerencia}`}
                onDownloadDocx={handleDownloadDocx}
                isGeneratingDocx={isDownloading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
