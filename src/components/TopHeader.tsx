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
  const isObras = activeTab.startsWith("obras-");

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        {/* Left: Hamburger & Active Module Switcher */}
        <div className="flex items-center space-x-3 overflow-hidden">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Mostrar / Ocultar Barra Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Module Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => onSelectTab("dashboard")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                !isObras && activeTab !== "admin-panel"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ofertador SEACE</span>
            </button>

            <button
              onClick={() => onSelectTab("obras-dashboard")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                isObras
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Control de Obras</span>
            </button>
          </div>

          {/* Active project / tender badge */}
          <div className="hidden lg:flex items-center space-x-2 text-xs truncate">
            <span className="text-slate-300">•</span>
            {!isObras ? (
              <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200/60 truncate max-w-xs">
                {tender.nomenclatura || "Ninguna oferta seleccionada"}
              </span>
            ) : (
              <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200/60 truncate max-w-xs">
                {obra?.cui ? `CUI ${obra.cui} • ${obra.nombre}` : (obra?.nombre || "Ninguna obra seleccionada")}
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
