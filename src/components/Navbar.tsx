import React from "react";
import {
  FileText,
  Building2,
  Users,
  Award,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Download,
  FolderTree,
  Sparkles,
  Palette,
  LayoutDashboard,
} from "lucide-react";
import { TenderInfo, CompanyProfile } from "../types/osce";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tender: TenderInfo;
  company: CompanyProfile;
  onOpenAudit: () => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
  onOpenThemeSelector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  tender,
  company,
  onOpenAudit,
  onDownloadAllZip,
  isDownloadingZip,
  onOpenThemeSelector,
}) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard Principal", icon: LayoutDashboard },
    { id: "analyzer", label: "1. Bases SEACE", icon: FileText },
    { id: "company", label: "2. Perfil Empresa", icon: Building2 },
    { id: "experience", label: "3. Experiencia", icon: Award },
    { id: "personnel", label: "4. Personal y Equipos", icon: Users },
    { id: "observations", label: "5. Consultas y Asesor OSCE", icon: HelpCircle },
    { id: "builder", label: "6. Armador de Oferta", icon: FolderTree },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      {/* Top Banner with Tender and Company Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center space-x-2 bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-md border border-blue-800/60 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate">{tender.nomenclatura}</span>
          </div>
          <span className="text-slate-400 hidden md:inline">•</span>
          <span className="text-slate-300 font-medium hidden md:inline truncate max-w-xs lg:max-w-md">
            {tender.entidadConvocante}
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-700">
            {tender.objetoContratacion}
          </span>
        </div>

        <div className="flex items-center space-x-3 ml-auto">
          <div className="text-right hidden sm:block">
            <div className="text-slate-200 font-medium truncate max-w-[200px]">
              {company.razonSocial}
            </div>
            <div className="text-[11px] text-slate-400">
              RUC: {company.ruc} | {company.rnpVigente ? "RNP Vigente ✓" : "RNP No Vigente ⚠️"}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-navbar-theme-selector"
              onClick={onOpenThemeSelector}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Cambiar estilo y tema visual de la página"
            >
              <Palette className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Estilo / Tema</span>
            </button>

            <button
              id="btn-navbar-audit"
              onClick={onOpenAudit}
              className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Auditoría de Admisibilidad y Cumplimiento SEACE"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Auditar Oferta</span>
            </button>

            <button
              id="btn-navbar-download-zip"
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Descargar todos los Anexos en Word (.docx) comprimidos en ZIP"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingZip ? "Generando ZIP..." : "Descargar Word (.docx)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
