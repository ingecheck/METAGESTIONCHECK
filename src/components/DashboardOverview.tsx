import React, { useState } from "react";
import {
  FileText,
  FolderTree,
  Users,
  Award,
  MessageSquare,
  Building2,
  ShieldCheck,
  Download,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  MapPin,
  Check,
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
import { NewOfferModal } from "./NewOfferModal";

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
  onSelectTender: (t: TenderInfo) => void;
  // Multi-offers management
  offersList: UserOfferPackage[];
  activeOfferId: string;
  onSelectOffer: (offerId: string) => void;
  onSaveOffer: (offer: UserOfferPackage) => void;
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
  offersList,
  activeOfferId,
  onSelectOffer,
  onSaveOffer,
  onDeleteOffer,
  onDuplicateOffer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewOfferModalOpen, setIsNewOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<UserOfferPackage | null>(null);

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

  // Stages status in chronological order for active offer
  const stages = [
    {
      stepNumber: "Paso 1",
      title: "1. Análisis de Bases SEACE",
      subtitle: `${tender.nomenclatura || "Subir o analizar Bases PDF"}`,
      icon: FileText,
      status: tender.nomenclatura ? "Bases Extraídas" : "Pendiente",
      statusColor: tender.nomenclatura
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : "text-slate-600 bg-slate-50 border-slate-200",
      tab: "analyzer",
      detail: `Presupuesto: ${tender.valorEstimadoReferencial || tender.valorReferencial || "S/ 514,737.28"}`,
    },
    {
      stepNumber: "Paso 2",
      title: company.esConsorcio ? "2. Consorcio Postor" : "2. Perfil Empresa Postora",
      subtitle: company.esConsorcio
        ? `${company.nombreConsorcio || "Consorcio"} (${company.integrantesConsorcio?.length || 2} empresas)`
        : `${company.razonSocial || "Configurar datos de la empresa"}`,
      icon: Building2,
      status: company.ruc || company.esConsorcio ? "Configurado" : "Pendiente",
      statusColor: company.ruc || company.esConsorcio
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : "text-amber-700 bg-amber-50 border-amber-200",
      tab: "company",
      detail: company.esConsorcio
        ? `Consorcio • Rep: ${company.representanteComunConsorcio || company.representanteLegal}`
        : `RUC: ${company.ruc || "Sin RUC"} • ${company.rnpVigente ? "RNP Vigente ✓" : "RNP Pendiente"}`,
    },
    {
      stepNumber: "Paso 3",
      title: "3. Experiencia del Postor (Anexo 8)",
      subtitle: `${experience.length} contratos acumulados`,
      icon: Award,
      status: expPercentage >= 100 ? "100% Cubierto" : `${expPercentage}% del monto`,
      statusColor:
        expPercentage >= 100
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-blue-700 bg-blue-50 border-blue-200",
      tab: "experience",
      detail: `S/ ${totalExpSoles.toLocaleString("es-PE")} acumulados`,
    },
    {
      stepNumber: "Paso 4",
      title: "4. Personal Clave y Equipos",
      subtitle: `${personal.length} profesionales / ${equipment.length} equipos`,
      icon: Users,
      status: personnelReady > 0 ? "Acreditado" : "Pendiente",
      statusColor:
        personnelReady > 0
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-amber-700 bg-amber-50 border-amber-200",
      tab: "personnel",
      detail: `${personnelReady} perfiles con constancias`,
    },
    {
      stepNumber: "Paso 5",
      title: "5. Consultas y Observaciones",
      subtitle: `${observations.length} consultas/observaciones formuladas`,
      icon: HelpCircle,
      status: observations.length > 0 ? `${observations.length} Registradas` : "Opcional",
      statusColor:
        observations.length > 0
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-slate-600 bg-slate-50 border-slate-200",
      tab: "observations",
      detail: "Pliego formal Ley N° 30225",
    },
    {
      stepNumber: "Paso 6",
      title: "6. Consultor Legal OSCE",
      subtitle: "Consultoría y jurisprudencia del Tribunal",
      icon: MessageSquare,
      status: "Disponible",
      statusColor: "text-purple-700 bg-purple-50 border-purple-200",
      tab: "legal-ai",
      detail: "Consultas especializadas de normativa",
    },
    {
      stepNumber: "Paso 7 (Final)",
      title: "7. Armador de Oferta Final",
      subtitle: company.esConsorcio
        ? "7 Anexos Word (incluye Promesa de Consorcio)"
        : "6 Anexos Word + Foliación + Auditoría",
      icon: FolderTree,
      status: "Listo para exportar",
      statusColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
      tab: "builder",
      detail: `Oferta: S/ ${montoOfertado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
    },
  ];

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
            onClick={() => {
              setEditingOffer(null);
              setIsNewOfferModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Oferta / Convocatoria</span>
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
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No se encontraron ofertas con los filtros aplicados. Haga clic en "+ Nueva Oferta / Convocatoria" para registrar una.
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
                          setEditingOffer(off);
                          setIsNewOfferModalOpen(true);
                        }}
                        title="Editar datos de la convocatoria"
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
                      {offersList.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar la oferta "${off.nomenclatura}"?`)) {
                              onDeleteOffer(off.id);
                            }
                          }}
                          title="Eliminar oferta"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
            {tender.nomenclatura || "Armador de Ofertas SEACE"}
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

        {/* Action Buttons */}
        <div className="flex flex-row lg:flex-col items-center sm:items-stretch gap-2.5 w-full sm:w-auto shrink-0">
          <button
            id="btn-dashboard-download-all"
            onClick={onDownloadAllZip}
            disabled={isDownloadingZip}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingZip ? "Generando ZIP..." : "Descargar Expediente (.docx)"}</span>
          </button>

          <button
            id="btn-dashboard-open-audit"
            onClick={onOpenAudit}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/50 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Auditoría de Admisibilidad</span>
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

      {/* 3. Main Dashboard Sections: Modules Progress & Quick Anexos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Workflow Steps & Anexos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Modules Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Módulos de Conformación del Expediente
                </h2>
                <p className="text-xs text-slate-500">
                  Estructura ordenada de acuerdo a las Bases Estándar y Reglamento OSCE
                </p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-md border border-blue-200/60">
                7 Pasos Secuenciales
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {stages.map((stg, idx) => {
                const Icon = stg.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => onNavigateToTab(stg.tab)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition bg-slate-50/50 hover:bg-white cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {stg.stepNumber}
                          </span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${stg.statusColor}`}>
                          {stg.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {stg.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {stg.subtitle}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium text-slate-600">{stg.detail}</span>
                      <span className="flex items-center text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                        Abrir <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Access to Anexos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                Anexos Obligatorios Listos para Descarga
              </h3>
              <button
                onClick={() => onNavigateToTab("builder")}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center"
              >
                Ver armador completo <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 1</span>
                  <span className="text-slate-500">Declaración Jurada de Datos del Postor</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 2</span>
                  <span className="text-slate-500">Declaración de Cumplimiento de TDR / EE.TT.</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 3</span>
                  <span className="text-slate-500">Declaración Jurada de Plazo de Entrega</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 4</span>
                  <span className="text-slate-500">Declaración Jurada Art. 52 Reglamento e Integridad</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 6</span>
                  <span className="text-slate-500">Oferta Económica Detallada en Soles</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Anexo N° 8</span>
                  <span className="text-slate-500">Experiencia del Postor en la Especialidad</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">.docx</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Quick Tools & Legal Support */}
        <div className="space-y-6">
          {/* Quick Legal Support */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-sky-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Consultoría Normativa OSCE</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consulta sobre causales de no admisión, subsanación de ofertas (Art. 60 RLCE) o formulación de consultas técnicas a las Bases.
            </p>
            <button
              onClick={() => onNavigateToTab("legal-ai")}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Abrir Consultor Legal</span>
            </button>
          </div>
        </div>
      </div>

      {/* New / Edit Offer Modal */}
      <NewOfferModal
        isOpen={isNewOfferModalOpen}
        onClose={() => {
          setIsNewOfferModalOpen(false);
          setEditingOffer(null);
        }}
        onSaveOffer={onSaveOffer}
        editingOffer={editingOffer}
      />
    </div>
  );
};
