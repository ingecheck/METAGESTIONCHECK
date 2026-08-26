import React, { useState, useEffect } from "react";
import {
  FileText,
  FolderTree,
  Users,
  Award,
  Building2,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Layers,
  Check,
  ShieldCheck,
  Scale,
  BadgePercent,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
  UserOfferPackage,
} from "../types/osce";
import { PROCUREMENT_GUIDELINES, ProcurementGuideline } from "../data/procurementGuidelines";

interface DashboardOverviewProps {
  tender: TenderInfo;
  company: CompanyProfile;
  personal: KeyPersonnel[];
  equipment: EquipmentItem[];
  experience: ExperienceRecord[];
  observations: ObservationItem[];
  montoOfertado: number;
  onNavigateToTab: (tab: string) => void;
  onOpenAudit: () => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
  onSelectTender?: (t: TenderInfo) => void;
  // Multi-offers management
  offersList: UserOfferPackage[];
  activeOfferId: string;
  onSelectOffer: (offerId: string) => void;
  onSaveOffer?: (offer: UserOfferPackage) => void;
  onDeleteOffer: (offerId: string) => void;
  onDuplicateOffer: (offerId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tender,
  company,
  personal,
  equipment,
  experience,
  observations,
  montoOfertado,
  onNavigateToTab,
  onOpenAudit,
  onDownloadAllZip,
  isDownloadingZip,
  onSelectTender,
  offersList,
  activeOfferId,
  onSelectOffer,
  onDeleteOffer,
  onDuplicateOffer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>(
    tender.guidelineId || "lpa-obras-32069"
  );
  const [annexFilterTab, setAnnexFilterTab] = useState<string>("all");
  const [isGuidelineDetailsOpen, setIsGuidelineDetailsOpen] = useState(true);
  const [guidelineSuccessMessage, setGuidelineSuccessMessage] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<UserOfferPackage | null>(null);
  const [isDeleteOfferModalOpen, setIsDeleteOfferModalOpen] = useState(false);

  useEffect(() => {
    if (tender.guidelineId) {
      setSelectedGuidelineId(tender.guidelineId);
    }
  }, [tender.guidelineId]);

  const activeGuideline =
    PROCUREMENT_GUIDELINES.find((g) => g.id === selectedGuidelineId) || PROCUREMENT_GUIDELINES[0];

  const handleApplyGuideline = (gl: ProcurementGuideline) => {
    setSelectedGuidelineId(gl.id);
    if (onSelectTender) {
      onSelectTender({
        ...tender,
        guidelineId: gl.id,
        guidelineRol: gl.rolPostor,
        marcoNormativo: gl.marcoNormativo,
        tipoProcedimiento: gl.tipo as any,
        objetoContratacion: gl.objetoContratacion,
      });
      setGuidelineSuccessMessage(`¡Lineamiento "${gl.nombre}" activado y sincronizado automáticamente con todos los anexos del Armador!`);
      setTimeout(() => setGuidelineSuccessMessage(null), 3500);
    }
  };

  // Calculations for progress of currently active offer
  const totalExpSoles = experience.reduce((acc, curr) => acc + (curr.montoEnSoles || 0), 0);
  const reqExpSoles = tender.valorNumerico || 1;
  const expPercentage = tender.valorNumerico
    ? Math.min(100, Math.round((totalExpSoles / reqExpSoles) * 100))
    : 0;

  const personnelReady = personal.filter((p) => p.cumpleRequisito).length;

  // Filtered offers list
  const filteredOffers = offersList.filter((off) => {
    const matchesSearch =
      off.nomenclatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (off.cui && off.cui.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" ||
      off.estadoOferta === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SECCIÓN 1: BANDEJA EXCLUSIVA DE OFERTAS Y CONVOCATORIAS (APARTADO 1)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Mis Ofertas y Convocatorias SEACE
              </h2>
              <p className="text-xs text-slate-500">
                Seleccione la oferta en la que desea trabajar para cargar sus datos en los 7 módulos del expediente
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("analyzer")}
            className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Cargar / Analizar Bases (Paso 1)</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas ({offersList.length})
            </button>
            <button
              onClick={() => setStatusFilter("En Formulación")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "En Formulación"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              En Formulación
            </button>
            <button
              onClick={() => setStatusFilter("Lista para Presentar")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "Lista para Presentar"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Listas para Presentar
            </button>
            <button
              onClick={() => setStatusFilter("Adjudicada")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "Adjudicada"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Adjudicadas
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Nomenclatura, CUI o Entidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Offers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredOffers.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <p>No se encontraron ofertas registradas con los filtros aplicados.</p>
              <button
                onClick={() => onNavigateToTab("analyzer")}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cargar PDF en Paso 1 (Análisis de Bases SEACE)</span>
              </button>
            </div>
          ) : (
            filteredOffers.map((off) => {
              const isActive = off.id === activeOfferId || off.tender.id === tender.id;
              return (
                <div
                  key={off.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between relative text-left ${
                    isActive
                      ? "border-blue-500 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Top Badges & Status */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {off.nomenclatura}
                          </span>
                          {isActive && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                              <Check className="w-3 h-3" /> Oferta Activa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {off.objetoContratacion}
                          </span>
                          {off.cui && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                              CUI: {off.cui}
                            </span>
                          )}
                          <span className="text-slate-400 font-medium">{off.plazoEjecucion}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          off.estadoOferta === "Adjudicada"
                            ? "bg-purple-100 text-purple-800"
                            : off.estadoOferta === "Lista para Presentar"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {off.estadoOferta}
                      </span>
                    </div>

                    {/* Project Name / Entity */}
                    <div className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                      {off.nombreProyecto}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{off.entidad}</span>
                    </div>

                    {/* Financial Amount */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Presupuesto Ref.:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {off.valorEstimadoReferencial}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          onSelectOffer(off.id);
                          onNavigateToTab("analyzer");
                        }}
                        title="Ver y editar bases en Paso 1"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateOffer(off.id)}
                        title="Duplicar oferta"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setOfferToDelete(off);
                          setIsDeleteOfferModalOpen(true);
                        }}
                        title="Eliminar oferta"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectOffer(off.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <span>{isActive ? "Trabajando Aquí" : "Trabajar con esta Oferta"}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: DETALLE Y MODULOS DE LA OFERTA ACTIVA SELECCIONADA            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-2xs">
              EXPEDIENTE ACTIVO • SEACE Perú
            </span>
            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-md">
              {tender.objetoContratacion || "Procedimiento de Contratación"}
            </span>
            {tender.codigoInversionCUI && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-mono font-semibold px-2 py-0.5 rounded-md">
                CUI: {tender.codigoInversionCUI}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Ley N° 30225 • D.S. N° 344-2018-EF
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {tender.nomenclatura || "Convocatoria SEACE"}
          </h1>

          {tender.nombreProyectoInversion && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              <span className="text-[10px] uppercase font-bold text-blue-600 block mb-0.5 tracking-wider">
                Proyecto de Inversión Pública (PIP / IOARR):
              </span>
              {tender.nombreProyectoInversion}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
            <div>
              <span className="text-slate-400">Entidad:</span>{" "}
              <strong className="text-slate-800">
                {tender.entidadConvocante || "Pendiente de definir"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Lugar:</span>{" "}
              <strong className="text-slate-800">
                {tender.lugarEjecucion || "PERÚ"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Sistema:</span>{" "}
              <strong className="text-slate-800">
                {tender.sistemaContratacion || "Suma Alzada"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Plazo:</span>{" "}
              <strong className="text-slate-800">
                {tender.plazoEjecucion || `${tender.plazoDias || 0} días calendario`}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Navigate to Step 1 */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={() => onNavigateToTab("analyzer")}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <span>Iniciar / Ver Paso 1 (Bases SEACE)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Valor Referencial / Estimado</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {tender.valorEstimadoReferencial || tender.valorReferencial || "S/ 0.00"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Monto en soles (Conforme a Bases)
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monto Ofertado (Anexo 6)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold text-emerald-700">
              S/ {montoOfertado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              {montoOfertado > 0 && montoOfertado <= (tender.valorNumerico || Infinity)
                ? "✓ Dentro del límite presupuestal"
                : montoOfertado > (tender.valorNumerico || 0) && (tender.valorNumerico || 0) > 0
                ? "⚠️ Supera valor referencial"
                : "Definir precio en Armador"}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Experiencia Calificada</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {expPercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${expPercentage >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                style={{ width: `${expPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Estado RNP y Postor</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-800 truncate">
              {company.razonSocial || "Empresa Postora"}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> RNP Vigente • RUC {company.ruc || "---"}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN: SELECTOR DE LINEAMIENTO NORMATIVO DE CONTRATACIÓN (LEY N° 32069) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Lineamientos Normativos por Tipo de Contratación
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Ley N° 32069 & D.S. N° 009-2025-EF
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Seleccione el lineamiento oficial correspondiente a su licitación para adaptar automáticamente los anexos requeridos, plazos legales y condiciones de evaluación.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGuidelineDetailsOpen(!isGuidelineDetailsOpen)}
            className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer self-start sm:self-auto"
          >
            <span>{isGuidelineDetailsOpen ? "Ocultar Detalles" : "Ver Detalles y Anexos"}</span>
            {isGuidelineDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {guidelineSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{guidelineSuccessMessage}</span>
          </div>
        )}

        {/* 2-Column Split: Contratistas (Izquierda) vs Supervisores (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA: CONTRATISTAS (EJECUCIÓN DE OBRAS)      */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border-2 border-blue-200 p-4 space-y-3.5 shadow-xs">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CONTRATISTAS (EJECUCIÓN DE OBRAS)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bases estándar para constructoras y consorcios ejecutores
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-600 text-white shadow-xs">
                Obras
              </span>
            </div>

            {/* Contractor Guidelines Cards */}
            <div className="space-y-3">
              {PROCUREMENT_GUIDELINES.filter(
                (gl) => gl.rolPostor.includes("Contratista") || gl.objetoContratacion === "Ejecución de Obras"
              ).map((gl) => {
                const isSelected = selectedGuidelineId === gl.id;
                return (
                  <div
                    key={gl.id}
                    onClick={() => handleApplyGuideline(gl)}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/30 shadow-sm"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {gl.codigo}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          {gl.tipo}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{gl.nombre}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{gl.descripcion}</p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                        {gl.anexosRegulados.length} Anexos Regulados
                      </span>
                      <div className="flex items-center space-x-1 font-semibold">
                        {isSelected ? (
                          <span className="flex items-center space-x-1 text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg font-bold text-xs border border-blue-300 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-blue-700" />
                            <span>Activo en Todo el Sistema</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium text-xs transition">
                            Clic para Activar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA: SUPERVISORES (CONSULTORÍA DE OBRAS)       */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-b from-emerald-50/50 to-white rounded-2xl border-2 border-emerald-200 p-4 space-y-3.5 shadow-xs">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SUPERVISORES (CONSULTORÍA DE OBRAS)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bases estándar para consultores, inspectores y supervisores
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                Supervisión
              </span>
            </div>

            {/* Supervisor Guidelines Cards */}
            <div className="space-y-3">
              {PROCUREMENT_GUIDELINES.filter(
                (gl) =>
                  gl.rolPostor.includes("Supervisor") ||
                  gl.rolPostor.includes("Consultor") ||
                  gl.objetoContratacion.includes("Consultoría")
              ).map((gl) => {
                const isSelected = selectedGuidelineId === gl.id;
                return (
                  <div
                    key={gl.id}
                    onClick={() => handleApplyGuideline(gl)}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/30 shadow-sm"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-2xs"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {gl.codigo}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {gl.tipo}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{gl.nombre}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{gl.descripcion}</p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
                        {gl.anexosRegulados.length} Anexos Regulados
                      </span>
                      <div className="flex items-center space-x-1 font-semibold">
                        {isSelected ? (
                          <span className="flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg font-bold text-xs border border-emerald-300 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Activo en Todo el Sistema</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium text-xs transition">
                            Clic para Activar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Guideline Detailed Analysis & Anexos (Ley 32069 / D.S. 009-2025-EF) */}
        {isGuidelineDetailsOpen && activeGuideline && (
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-5 border border-slate-800 mt-2">
            {/* Header of details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lineamiento Activo • {activeGuideline.rolPostor}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{activeGuideline.nombre}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeGuideline.marcoNormativo}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sincronizado Automáticamente</span>
                </span>
                <button
                  onClick={() => onNavigateToTab("builder")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Ver en Armador</span>
                </button>
              </div>
            </div>

            {/* Grid of Key Conditions and Legal Deadlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Plazos del Procedimiento</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Consultas:</strong> {activeGuideline.plazos.consultasObservaciones}
                </p>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Apelación:</strong> {activeGuideline.plazos.consentimientoApelacion}
                </p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Subcontratación y Garantías</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Subcontratación:</strong> {activeGuideline.condicionesClave.subcontratacionMaxima}
                </p>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Fiel Cumplimiento:</strong> {activeGuideline.condicionesClave.retencionGarantiaMype}
                </p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                  <Award className="w-3.5 h-3.5" />
                  <span>Experiencia del Postor</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Antigüedad:</strong> {activeGuideline.condicionesClave.antiguedadExperienciaPostor}
                </p>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Contrataciones:</strong> {activeGuideline.condicionesClave.maximoContratacionesExperiencia}
                </p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-purple-400 font-bold text-[11px]">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>Bonificaciones Aplicables</span>
                </div>
                {activeGuideline.bonificacionesAplicables.map((bon, i) => (
                  <p key={i} className="text-[11px] text-slate-300">
                    <strong className="text-white">{bon.porcentaje}:</strong> {bon.nombre} ({bon.anexo})
                  </p>
                ))}
              </div>
            </div>

            {/* Official Annexes Breakdown Table / Tabs */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Catálogo Oficial de Anexos del Lineamiento ({activeGuideline.anexosRegulados.length} Anexos)
                  </h4>
                </div>

                {/* Filter Annexes by Stage */}
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setAnnexFilterTab("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      annexFilterTab === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Todos ({activeGuideline.anexosRegulados.length})
                  </button>
                  <button
                    onClick={() => setAnnexFilterTab("oferta_tecnica")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      annexFilterTab === "oferta_tecnica"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Oferta Técnica
                  </button>
                  <button
                    onClick={() => setAnnexFilterTab("oferta_economica")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      annexFilterTab === "oferta_economica"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Oferta Económica
                  </button>
                  <button
                    onClick={() => setAnnexFilterTab("perfeccionamiento_contrato")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      annexFilterTab === "perfeccionamiento_contrato"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Contrato
                  </button>
                  <button
                    onClick={() => setAnnexFilterTab("facultativo")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      annexFilterTab === "facultativo"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Bonificaciones
                  </button>
                </div>
              </div>

              {/* Annexes List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {activeGuideline.anexosRegulados
                  .filter((anx) => annexFilterTab === "all" || anx.etapa === annexFilterTab)
                  .map((anx, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-800/70 border border-slate-700/80 rounded-lg text-xs space-y-1 hover:border-slate-600 transition"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-indigo-300 text-[11px]">{anx.numero}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                            anx.obligatorio
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {anx.obligatorio ? "Obligatorio" : "Facultativo"}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-200 truncate">{anx.nombre}</div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{anx.descripcion}</p>
                      <div className="text-[9.5px] text-slate-500 pt-1 border-t border-slate-700/40">
                        Base: {anx.baseLegal}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Offer Confirmation Modal */}
      {isDeleteOfferModalOpen && offerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-amber-50 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar Oferta / Licitación?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {offerToDelete.nomenclatura}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {offerToDelete.estado}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
                  {offerToDelete.nombreProyecto}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entidad:</span>
                    <span className="font-medium text-slate-800 truncate block">{offerToDelete.entidad}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Presupuesto Ref.:</span>
                    <span className="font-bold text-slate-900 font-mono">{offerToDelete.valorEstimadoReferencial}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Se eliminarán permanentemente todos los anexos, matriz de personal clave, equipamiento y oferta económica calculada de este proceso.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOfferModalOpen(false);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (offerToDelete) {
                    onDeleteOffer(offerToDelete.id);
                    setIsDeleteOfferModalOpen(false);
                    setOfferToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Oferta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
