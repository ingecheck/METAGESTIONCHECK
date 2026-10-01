import React from "react";
import {
  Menu,
  ShieldCheck,
  Download,
  Palette,
  Building2,
  Bell,
  Search,
  ShieldAlert,
  LogOut,
  User,
  Briefcase,
  HardHat,
  ChevronDown,
  FolderKanban,
} from "lucide-react";
import { TenderInfo, CompanyProfile } from "../types/osce";
import { LicenseSession } from "../types/auth";
import { ObraProyecto } from "../types/obras";

interface TopHeaderProps {
  tender: TenderInfo;
  company: CompanyProfile;
  obra?: ObraProyecto;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: LicenseSession | null;
  onOpenAudit: () => void;
  onDownloadAllZip: () => void;
  isDownloadingZip: boolean;
  onOpenThemeSelector: () => void;
  onLogout: () => void;
  onOpenLoginModal?: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  tender,
  company,
  obra,
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAudit,
  onDownloadAllZip,
  isDownloadingZip,
  onOpenThemeSelector,
  onLogout,
  onOpenLoginModal,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const isAdmin = currentUser?.role === "admin";
  const isInformes = activeTab.startsWith("informes-") || activeTab === "obras-informe-entidad";
  const isCartera = activeTab === "seguimiento-cartera";
  const isObras = activeTab.startsWith("obras-") && !isInformes;
  const isOfertador = !isObras && !isInformes && !isCartera && activeTab !== "admin-panel";

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Active Module Switcher */}
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Mostrar / Ocultar Barra Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Module Switcher Pills - All 4 Apartados */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-[580px] lg:max-w-none">
            {/* 1. Concursos SEACE */}
            <button
              onClick={() => onSelectTab("dashboard")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                isOfertador
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="1. Concursos Públicos y Licitaciones SEACE"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span className="hidden md:inline">1. Concursos OSCE</span>
              <span className="md:hidden">OSCE</span>
            </button>

            {/* 2. Control de Obras */}
            <button
              onClick={() => onSelectTab("obras-dashboard")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                isObras
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
              title="2. Control y Supervisión de Obras"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span className="hidden md:inline">2. Control Obras</span>
              <span className="md:hidden">Obras</span>
            </button>

            {/* 3. Informes OEI & Inversiones (Rioja) */}
            <button
              onClick={() => onSelectTab("informes-locadores")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                isInformes
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70"
              }`}
              title="3. Informes OEI & Inversiones (Formato Oficial Rioja)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">3. Informes OEI</span>
              <span className="md:hidden">Informes</span>
            </button>

            {/* 4. Seguimiento Cartera OEI (Rioja 23 Obras) */}
            <button
              onClick={() => onSelectTab("seguimiento-cartera")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg font-black transition cursor-pointer whitespace-nowrap ${
                isCartera
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-amber-800 hover:text-amber-950 hover:bg-amber-100"
              }`}
              title="4. Seguimiento Cartera OEI (23 Obras de Rioja - 1 Click Pipeline)"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">4. Cartera OEI</span>
              <span className="sm:hidden">Cartera</span>
              <span className="text-[9px] bg-amber-900/10 text-amber-950 px-1 rounded font-mono font-bold">
                23
              </span>
            </button>
          </div>

          {/* Active project / tender badge */}
          <div className="hidden xl:flex items-center space-x-2 text-xs truncate">
            <span className="text-slate-300">•</span>
            {isCartera ? (
              <span className="bg-amber-50 text-amber-900 font-semibold px-2 py-0.5 rounded-md border border-amber-200/80 truncate max-w-xs">
                Matriz de 23 Obras • M.P. Rioja
              </span>
            ) : isInformes ? (
              <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200/80 truncate max-w-xs">
                Centro Documentario OEI • Rioja
              </span>
            ) : isObras ? (
              <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200/60 truncate max-w-xs">
                {obra?.cui ? `CUI ${obra.cui} • ${obra.nombre}` : (obra?.nombre || "Ninguna obra seleccionada")}
              </span>
            ) : (
              <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200/60 truncate max-w-xs">
                {tender.nomenclatura || "Ninguna oferta seleccionada"}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, License & Postor info */}
        <div className="flex items-center space-x-3">
          {/* Postor info / Admin status button */}
          <div className="text-right hidden sm:block">
            {currentUser ? (
              <button
                onClick={onOpenLoginModal || onLogout}
                className="text-left group p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Haga clic para cambiar de cuenta o ver licencias"
              >
                {isAdmin ? (
                  <div className="flex items-center space-x-1.5 justify-end">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-700" />
                      ADMIN MASTER
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[200px] flex items-center gap-1">
                      <span>{currentUser.companyName || company.razonSocial}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      {currentUser.activeMemberId && currentUser.teamMembers ? (
                        (() => {
                          const mem = currentUser.teamMembers.find(
                            (m) => m.id === currentUser.activeMemberId
                          );
                          return (
                            <>
                              <span className="text-blue-600 font-bold">{mem?.name || currentUser.userName}</span>
                              <span className="text-slate-500 font-medium truncate">({mem?.cargoText || mem?.role?.replace("_", " ")})</span>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <span className="text-emerald-600 font-semibold">{currentUser.userName}</span>
                          <span>•</span>
                          <span>RUC {currentUser.ruc || company.ruc}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal || onLogout}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onOpenThemeSelector}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Cambiar tema y estilos"
            >
              <Palette className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Estilo</span>
            </button>

            {!isObras && (
              <>
                <button
                  onClick={onOpenAudit}
                  className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Auditoría Preventiva SEACE"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Auditar</span>
                </button>

                <button
                  onClick={onDownloadAllZip}
                  disabled={isDownloadingZip}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Descargar todos los Anexos en Word"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingZip ? "Generando..." : "Descargar Word"}</span>
                </button>
              </>
            )}

            {currentUser && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Cerrar sesión / Cambiar de cuenta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
