import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Award,
  HelpCircle,
  MessageSquare,
  Building2,
  ShieldCheck,
  Download,
  Palette,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Briefcase,
  HardHat,
  TrendingUp,
  Scale,
  ListTree,
  FileCheck2,
  Box,
  FolderKanban,
} from "lucide-react";
import { TenderInfo, CompanyProfile } from "../types/osce";
import { LicenseSession } from "../types/auth";
import { ObraProyecto } from "../types/obras";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tender: TenderInfo;
  company: CompanyProfile;
  obra?: ObraProyecto;
  currentUser: LicenseSession | null;
  onOpenAudit: () => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
  onOpenThemeSelector: () => void;
  onOpenTeamManagement?: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  tender,
  company,
  obra,
  currentUser,
  onOpenAudit,
  onDownloadAllZip,
  isDownloadingZip,
  onOpenThemeSelector,
  onOpenTeamManagement,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isExpanded = !isCollapsed || isHovered;

  const isAdmin = currentUser?.role === "admin";
  const activeMember =
    currentUser?.activeMemberId && currentUser?.teamMembers
      ? currentUser.teamMembers.find((m) => m.id === currentUser.activeMemberId)
      : null;

  // Module state
  const isInformesTab = activeTab.startsWith("informes-") || activeTab === "obras-informe-entidad";
  const isCarteraTab = activeTab === "seguimiento-cartera";

  const [isOfertadorOpen, setIsOfertadorOpen] = useState<boolean>(
    !isInformesTab && !isCarteraTab
  );
  const [isInformesOpen, setIsInformesOpen] = useState<boolean>(isInformesTab);

  // Auto expand the module containing the active tab
  useEffect(() => {
    if (isInformesTab) {
      setIsInformesOpen(true);
    } else if (activeTab !== "admin-panel" && activeTab !== "seguimiento-cartera") {
      setIsOfertadorOpen(true);
    }
  }, [activeTab, isInformesTab]);

  // Sub-items for Module 1: Informes Técnicos & Gestión Documentaria
  const informesNavItems = [
    {
      id: "informes-locadores",
      label: "1. Locadores de Servicios (O.S.)",
      icon: Users,
    },
    {
      id: "informes-jefe-oei",
      label: "2. Informes de Gestión Técnica",
      icon: FileText,
    },
    {
      id: "informes-gerente",
      label: "3. Informes Gerencia de Inversiones",
      icon: Building2,
    },
    {
      id: "informes-memos",
      label: "4. Memorándums y Proveídos",
      icon: MessageSquare,
    },
    {
      id: "informes-entidad",
      label: "5. Valorizaciones de Obra",
      icon: FileCheck2,
    },
  ];

  // Sub-items for Module 2: Licitaciones & Concursos Públicos (SEACE) - ubicado antes de Panel Admin
  const ofertadorNavItems = [
    { id: "dashboard", label: "Dashboard del Postor", icon: LayoutDashboard },
    { id: "analyzer", label: "1. Bases & Concurso Público", icon: FileText },
    {
      id: "company",
      label: company.esConsorcio ? "2. Consorcio Postor" : "2. Perfil Empresa",
      icon: Building2,
    },
    { id: "experience", label: "3. Experiencia (Anexo 8)", icon: Award },
    { id: "personnel", label: "4. Personal y Equipos", icon: Users },
    { id: "observations", label: "5. Consultas y Asesor Legal OSCE", icon: HelpCircle },
    { id: "builder", label: "6. Armador de Oferta Final", icon: FolderTree },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-slate-950 text-slate-200 border-r border-slate-800/90 transition-all duration-200 flex flex-col shrink-0 z-40 relative select-none ${
        isExpanded ? "w-64 lg:w-72 shadow-2xl" : "w-16"
      }`}
    >
      {/* Brand & App Title */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 bg-slate-950/80">
        {isExpanded ? (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-md font-black text-xs shrink-0 tracking-wider">
              MGC
            </div>
            <div className="truncate">
              <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-1.5">
                <span>METAGESTIONCHECK</span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold truncate">
                Control de Obras & Licitaciones
              </div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md tracking-wider">
            MGC
          </div>
        )}

        {isExpanded && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-amber-400 p-1 rounded-md hover:bg-slate-800/80 transition hidden sm:block cursor-pointer"
            title={isCollapsed ? "Fijar menú expandido" : "Contraer a modo iconos"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* User Session Badge */}
      {isExpanded && currentUser && (
        <div className="px-3 pt-3 space-y-2">
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs flex items-center justify-between shadow-2xs">
            <div className="truncate min-w-0 pr-1">
              <div className="font-bold truncate text-[11px] text-slate-200">
                {activeMember ? activeMember.name : currentUser.userName}
              </div>
              <div className="text-[9px] text-amber-400 truncate flex items-center gap-1">
                {isAdmin ? (
                  <span className="font-bold text-amber-400">ADMINISTRADOR MASTER</span>
                ) : activeMember ? (
                  <span className="font-semibold capitalize text-amber-300">
                    {activeMember.cargoText || activeMember.role.replace("_", " ")}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    {currentUser.companyName}
                  </span>
                )}
              </div>
              {!isAdmin && (
                <div className="text-[8px] font-mono text-slate-500 truncate">
                  {currentUser.licenseKey}
                </div>
              )}
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
              title="Cerrar sesión / Salir"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Team Management quick trigger */}
          {!isAdmin && onOpenTeamManagement && (
            <button
              type="button"
              onClick={onOpenTeamManagement}
              className="w-full py-1.5 px-2 bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg text-[10px] font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Users className="w-3 h-3 text-amber-400" />
                <span>Equipo Asignado</span>
              </div>
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[9px] border border-amber-500/30">
                {currentUser.teamMembers?.length || 0}/{currentUser.maxTeamMembers || 5}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-2.5 space-y-2.5 overflow-y-auto" aria-label="Sidebar Navigation">
        {/* ======================================================== */}
        {/* SEGUIMIENTO DE OBRAS (DESTACADO Y DIRECTO)               */}
        {/* ======================================================== */}
        <div>
          <button
            id="sidebar-item-seguimiento-cartera"
            onClick={() => setActiveTab("seguimiento-cartera")}
            className={`w-full flex items-center ${
              isExpanded ? "justify-between px-2.5 py-2.5" : "justify-center py-2.5 px-1"
            } rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "seguimiento-cartera"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
            }`}
            title="Seguimiento de Obras"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <FolderKanban
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "seguimiento-cartera" ? "text-slate-950" : "text-amber-400"
                }`}
              />
              {isExpanded && (
                <span className="truncate uppercase tracking-wide text-[11px] font-extrabold">
                  Seguimiento de Obras
                </span>
              )}
            </div>
            {isExpanded && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  activeTab === "seguimiento-cartera"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                Matriz
              </span>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* APARTADO 1: INFORMES TÉCNICOS & GESTIÓN DOCUMENTARIA    */}
        {/* ======================================================== */}
        <div className="space-y-1 pt-1 border-t border-slate-800/70">
          {isExpanded ? (
            <button
              onClick={() => {
                setIsInformesOpen(!isInformesOpen);
                if (!isInformesOpen && !isInformesTab) {
                  setActiveTab("informes-entidad");
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isInformesTab
                  ? "bg-slate-900 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate uppercase tracking-wide text-[10px] font-bold">
                  1. Informes Técnicos
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isInformesOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("informes-locadores");
              }}
              className={`w-full flex justify-center py-2.5 rounded-lg transition ${
                isInformesTab
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
              title="Informes Técnicos & Gestión Documentaria"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {/* Desplegable de Informes */}
          {(isExpanded && isInformesOpen) && (
            <div className="space-y-0.5 pl-1.5">
              {informesNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isActive
                        ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-slate-950" : "text-slate-500"
                      }`}
                    />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* APARTADO 2: OFERTADOR / POSTOR (LICITACIONES SEACE)     */}
        {/* ======================================================== */}
        <div className="space-y-1 pt-1 border-t border-slate-800/70">
          {isExpanded ? (
            <button
              onClick={() => {
                setIsOfertadorOpen(!isOfertadorOpen);
                if (!isOfertadorOpen && !isInformesTab) {
                  setActiveTab("dashboard");
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                !isInformesTab && activeTab !== "seguimiento-cartera" && activeTab !== "admin-panel"
                  ? "bg-slate-900 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate uppercase tracking-wide text-[10px] font-bold">
                  2. Licitaciones & Concursos
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isOfertadorOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("dashboard");
              }}
              className={`w-full flex justify-center py-2.5 rounded-lg transition ${
                !isInformesTab && activeTab !== "seguimiento-cartera" && activeTab !== "admin-panel"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
              title="Licitaciones & Concursos Públicos"
            >
              <Briefcase className="w-4 h-4" />
            </button>
          )}

          {/* Desplegable de Ofertador */}
          {(isExpanded && isOfertadorOpen) && (
            <div className="space-y-0.5 pl-1.5">
              {ofertadorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isActive
                        ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-slate-950" : "text-slate-500"
                      }`}
                    />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Master Admin Tab */}
        {isAdmin && (
          <div className="pt-1 border-t border-slate-800/70">
            <button
              id="sidebar-item-admin-panel"
              onClick={() => setActiveTab("admin-panel")}
              className={`w-full flex items-center ${
                isExpanded ? "space-x-2.5 px-2.5 py-2" : "justify-center py-2 px-1"
              } rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "admin-panel"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-amber-400 hover:bg-slate-900 border border-amber-500/20"
              }`}
              title="Panel Administrador Master"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {isExpanded && <span className="truncate">Panel Licencias Admin</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Action Buttons */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <button
          onClick={onOpenAudit}
          className={`w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            isExpanded ? "px-3" : "px-1.5"
          }`}
          title="Auditoría Preventiva SEACE"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          {isExpanded && <span>Auditar Oferta</span>}
        </button>

        <button
          onClick={onDownloadAllZip}
          disabled={isDownloadingZip}
          className={`w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 ${
            isExpanded ? "px-3" : "px-1.5"
          }`}
          title="Descargar todos los Anexos en Word (.docx)"
        >
          <Download className="w-4 h-4 shrink-0 text-slate-950" />
          {isExpanded && <span>{isDownloadingZip ? "Generando..." : "Descargar Word"}</span>}
        </button>

        <button
          onClick={onOpenThemeSelector}
          className={`w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-amber-300 hover:bg-slate-900 py-1.5 rounded-lg text-xs transition cursor-pointer ${
            isExpanded ? "px-2" : "px-1"
          }`}
          title="Personalizar Interfaz"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {isExpanded && <span className="text-[11px]">Estilo & Tema</span>}
        </button>
      </div>

      {/* Footer Info & Logout */}
      {isExpanded && (
        <div className="px-3.5 py-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950 flex items-center justify-between">
          <div className="truncate min-w-0 pr-2">
            <div className="font-semibold text-slate-200 truncate">
              {currentUser?.companyName || company.razonSocial}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              RUC: {currentUser?.ruc || company.ruc}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition cursor-pointer shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
