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
  BookOpen,
  Scale,
  CheckCircle2,
  Sparkles,
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
  const isAdmin = currentUser?.role === "admin";

  const activeMember = currentUser?.activeMemberId && currentUser?.teamMembers
    ? currentUser.teamMembers.find((m) => m.id === currentUser.activeMemberId)
    : null;

  // Accordion open/close state for all main modules
  const isObrasTab = activeTab.startsWith("obras-") && activeTab !== "obras-informe-entidad";
  const isInformesTab = activeTab.startsWith("informes-") || activeTab === "obras-informe-entidad";
  const isCarteraTab = activeTab === "seguimiento-cartera";
  const isRiojaEntity =
    currentUser?.role === "entidad" ||
    currentUser?.entityType === "municipalidad" ||
    currentUser?.companyName?.toUpperCase().includes("RIOJA") ||
    currentUser?.licenseKey?.toUpperCase().includes("RIOJA");

  const [isOfertadorOpen, setIsOfertadorOpen] = useState<boolean>(
    !isObrasTab && !isInformesTab && !isCarteraTab && !isRiojaEntity
  );
  const [isObrasOpen, setIsObrasOpen] = useState<boolean>(isObrasTab);
  const [isInformesOpen, setIsInformesOpen] = useState<boolean>(isInformesTab || isRiojaEntity);

  // Auto expand the module containing the active tab
  useEffect(() => {
    if (isInformesTab) {
      setIsInformesOpen(true);
    } else if (isObrasTab) {
      setIsObrasOpen(true);
    } else if (activeTab === "seguimiento-cartera") {
      // Keep focused
    } else if (activeTab !== "admin-panel" && !isRiojaEntity) {
      setIsOfertadorOpen(true);
    }
  }, [activeTab, isObrasTab, isInformesTab, isRiojaEntity]);

  // Sub-items for Module 1: Ofertador / Postor / Concursos Públicos
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

  // Sub-items for Module 2: Control de Obras / Entidades
  const obrasNavItems = [
    { id: "obras-dashboard", label: "Panel General de Obra", icon: HardHat },
    { id: "obras-lector", label: "1. Análisis de Contratos / O.S.", icon: FileText },
    { id: "obras-inicio", label: "2. Procedimiento Inicio de Obra", icon: FileCheck2 },
    { id: "obras-auditoria", label: "3. Auditoría Excel vs Escaneado", icon: ShieldAlert },
    { id: "obras-valorizaciones", label: "4. Curva S y Valorizaciones", icon: TrendingUp },
    { id: "obras-partidas", label: "5. Cuadro Partidas Ejecutadas", icon: ListTree },
    { id: "obras-adicionales", label: "6. Adicionales y Plazos", icon: Scale },
    { id: "obras-liquidacion", label: "7. Recepción y Liquidación", icon: Award },
    { id: "obras-bim", label: "8. Experiencia BIM 3D y 4D", icon: Box },
  ];

  // Sub-items for Module 3: Gestión Documentaria & Informes de Inversiones (OEI / Gerencia / Rioja)
  const informesNavItems = [
    {
      id: "informes-locadores",
      label: "1. Locadores de Servicios (O.S.)",
      icon: Users,
    },
    {
      id: "informes-jefe-oei",
      label: "2. Informes Jefe de OEI",
      icon: FileText,
    },
    {
      id: "informes-gerente",
      label: "3. Informes Gerente Inversiones",
      icon: Building2,
    },
    {
      id: "informes-memos",
      label: "4. Notas & Memorándums OEI",
      icon: MessageSquare,
    },
    {
      id: "informes-entidad",
      label: "5. Valorizaciones de Obra (Rioja)",
      icon: FileCheck2,
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 flex flex-col shrink-0 z-30 ${
        isCollapsed ? "w-18" : "w-64 lg:w-72"
      }`}
    >
      {/* Brand & App Title */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md font-black text-xs shrink-0 tracking-wider">
              MGC
            </div>
            <div className="truncate">
              <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-1.5">
                <span>METAGESTIONCHECK</span>
              </div>
              <div className="text-[10px] text-blue-400 font-medium truncate">
                Concursos Públicos & Obras
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-md tracking-wider">
            MGC
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition hidden sm:block cursor-pointer"
          title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Session Badge */}
      {!isCollapsed && currentUser && (
        <div className="px-3 pt-3 space-y-2">
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isAdmin
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : activeMember
                ? "bg-blue-950/60 border-blue-800/60 text-slate-200"
                : "bg-slate-950/60 border-slate-800 text-slate-300"
            }`}
          >
            <div className="truncate min-w-0 pr-1">
              <div className="font-bold truncate text-[11px] flex items-center gap-1">
                <span>{activeMember ? activeMember.name : currentUser.userName}</span>
              </div>
              <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                {isAdmin ? (
                  <span className="text-amber-400 font-semibold">ADMINISTRADOR MASTER</span>
                ) : activeMember ? (
                  <span className="text-blue-300 font-semibold capitalize">
                    {activeMember.cargoText || activeMember.role.replace("_", " ")}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Titular: {currentUser.companyName}
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
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition cursor-pointer shrink-0"
              title="Cerrar sesión / Cambiar perfil"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Team Management quick trigger for Titular or Admin */}
          {!isAdmin && onOpenTeamManagement && (
            <button
              type="button"
              onClick={onOpenTeamManagement}
              className="w-full py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-[10px] font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Users className="w-3 h-3 text-blue-400" />
                <span>Gestionar Mi Equipo</span>
              </div>
              <span className="bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-mono text-[9px] border border-blue-700/50">
                {currentUser.teamMembers?.length || 0}/{currentUser.maxTeamMembers || 5}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Navigation List with Modules Accordion */}
      <nav className="flex-1 px-2.5 py-2 space-y-3 overflow-y-auto" aria-label="Sidebar Navigation">
        {/* Quick Access Shortcut for OEI / Rioja */}
        {!isCollapsed && (
          <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-indigo-500/10 border border-amber-500/30 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <span>⭐ ACCESOS OEI RIOJA</span>
              </span>
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black text-[9px]">
                23 Obras
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("seguimiento-cartera")}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === "seguimiento-cartera"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-white"
                }`}
                title="4. Seguimiento Cartera OEI (23 Proyectos)"
              >
                <FolderKanban className="w-3 h-3 shrink-0 text-amber-400" />
                <span className="truncate">4. Cartera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsInformesOpen(true);
                  setActiveTab("informes-locadores");
                }}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                  isInformesTab
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-800 text-emerald-300 hover:bg-slate-700 hover:text-white"
                }`}
                title="3. Informes OEI & Inversiones (Oficial Rioja)"
              >
                <Building2 className="w-3 h-3 shrink-0 text-emerald-400" />
                <span className="truncate">3. Informes</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* APARTADO 1: OFERTADOR / POSTOR (LICITACIONES SEACE)     */}
        {/* ======================================================== */}
        <div className="space-y-1">
          {!isCollapsed ? (
            <button
              onClick={() => {
                setIsOfertadorOpen(!isOfertadorOpen);
                if (!isOfertadorOpen && isObrasTab) {
                  setActiveTab("dashboard");
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                !isObrasTab && activeTab !== "admin-panel"
                  ? "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Briefcase className="w-3 h-3" />
                </div>
                <span className="truncate uppercase tracking-wide text-[11px]">
                  1. Concursos Públicos / Licitaciones
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {ofertadorNavItems.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isOfertadorOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsCollapsed(false);
              }}
              className="w-full flex justify-center py-2 text-blue-400 hover:bg-slate-800 rounded-lg"
              title="Módulo Ofertador / Licitaciones SEACE"
            >
              <Briefcase className="w-4 h-4" />
            </button>
          )}

          {/* Desplegable de Ofertador */}
          {(!isCollapsed ? isOfertadorOpen : true) && (
            <div className="space-y-0.5 pl-1">
              {ofertadorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer group text-left ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* APARTADO 2: ENTIDADES & CONTROL DE OBRAS               */}
        {/* ======================================================== */}
        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          {!isCollapsed ? (
            <button
              onClick={() => {
                setIsObrasOpen(!isObrasOpen);
                if (!isObrasOpen && !isObrasTab) {
                  setActiveTab("obras-dashboard");
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isObrasTab
                  ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <HardHat className="w-3 h-3" />
                </div>
                <span className="truncate uppercase tracking-wide text-[11px]">
                  2. Control de Obras
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {obrasNavItems.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isObrasOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("obras-dashboard");
                setIsCollapsed(false);
              }}
              className="w-full flex justify-center py-2 text-indigo-400 hover:bg-slate-800 rounded-lg"
              title="Módulo Control de Obras / Entidades"
            >
              <HardHat className="w-4 h-4" />
            </button>
          )}

          {/* Desplegable de Control de Obras */}
          {(!isCollapsed ? isObrasOpen : true) && (
            <div className="space-y-0.5 pl-1">
              {obrasNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer group text-left ${
                      isActive
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* APARTADO 3: INFORMES AUTOMÁTICOS DE ENTIDAD (RIOJA / OSCE) */}
        {/* ======================================================== */}
        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          {!isCollapsed ? (
            <button
              onClick={() => {
                setIsInformesOpen(!isInformesOpen);
                if (!isInformesOpen && !isInformesTab) {
                  setActiveTab("informes-entidad");
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isInformesTab
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Building2 className="w-3 h-3" />
                </div>
                <span className="truncate uppercase tracking-wide text-[11px]">
                  3. Informes OEI & Inversiones
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {informesNavItems.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isInformesOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveTab("informes-locadores");
                setIsCollapsed(false);
              }}
              className="w-full flex justify-center py-2 text-emerald-400 hover:bg-slate-800 rounded-lg"
              title="3. Gestión Documentaria & Informes OEI (Rioja)"
            >
              <Building2 className="w-4 h-4" />
            </button>
          )}

          {/* Desplegable de Informes de Entidad */}
          {(!isCollapsed ? isInformesOpen : true) && (
            <div className="space-y-0.5 pl-1">
              {informesNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer group text-left ${
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-white" : "text-emerald-400 group-hover:text-emerald-200"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* APARTADO 4: SEGUIMIENTO DE CARTERA OEI (1-CLICK PIPELINE) */}
        {/* ======================================================== */}
        <div className="pt-1 border-t border-slate-800/60">
          <button
            id="sidebar-item-seguimiento-cartera"
            onClick={() => setActiveTab("seguimiento-cartera")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "seguimiento-cartera"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                : "text-amber-400 hover:bg-slate-800/80 hover:text-amber-300"
            }`}
            title={isCollapsed ? "4. Seguimiento de Cartera OEI" : undefined}
          >
            <div className="flex items-center space-x-2 truncate">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shadow-2xs shrink-0 ${
                  activeTab === "seguimiento-cartera"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-amber-500 text-slate-950"
                }`}
              >
                <FolderKanban className="w-3 h-3" />
              </div>
              {!isCollapsed && (
                <span className="truncate uppercase tracking-wide text-[11px]">
                  4. Seguimiento Cartera OEI
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-500/30">
                23 Obras
              </span>
            )}
          </button>
        </div>

        {/* Master Admin Tab */}
        {isAdmin && (
          <div className="pt-1 border-t border-slate-800/60">
            <button
              id="sidebar-item-admin-panel"
              onClick={() => setActiveTab("admin-panel")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "admin-panel"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
              title={isCollapsed ? "Panel Administrador" : undefined}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Panel Licencias Admin</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Action Buttons */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 space-y-2">
        {!isObrasTab ? (
          <>
            <button
              onClick={onOpenAudit}
              className={`w-full flex items-center justify-center space-x-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isCollapsed ? "px-2" : "px-3"
              }`}
              title="Auditoría Preventiva SEACE"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span>Auditar Oferta</span>}
            </button>

            <button
              onClick={onDownloadAllZip}
              disabled={isDownloadingZip}
              className={`w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50 ${
                isCollapsed ? "px-2" : "px-3"
              }`}
              title="Descargar todos los Anexos en Word (.docx) comprimidos en ZIP"
            >
              <Download className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{isDownloadingZip ? "Generando..." : "Descargar Word"}</span>}
            </button>
          </>
        ) : (
          <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-800/40 text-[11px] text-indigo-300">
            <div className="font-bold flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modo Control Obra</span>
            </div>
            {!isCollapsed && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                CUI N° {obra?.cui || "2489102"} • {obra?.plazoDias || 180} días
              </div>
            )}
          </div>
        )}

        <button
          onClick={onOpenThemeSelector}
          className={`w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-white hover:bg-slate-800 py-1.5 rounded-lg text-xs transition cursor-pointer ${
            isCollapsed ? "px-1" : "px-2"
          }`}
          title="Cambiar Estilo y Tema"
        >
          <Palette className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          {!isCollapsed && <span className="text-[11px]">Cambiar Estilo</span>}
        </button>
      </div>

      {/* Postor Footer info */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60 flex items-center justify-between">
          <div className="truncate">
            <div className="font-semibold text-slate-200 truncate">
              {isObrasTab ? obra?.contratista || company.razonSocial : company.razonSocial}
            </div>
            <div className="text-[10px] text-slate-500">
              RUC: {isObrasTab ? obra?.rucContratista || company.ruc : company.ruc}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
