import React from "react";
import { Palette, Check, Sun, Moon, Briefcase, Eye } from "lucide-react";

export type ThemeOption = "slate" | "navy" | "corporate-dark" | "emerald";

export interface ThemeConfig {
  id: ThemeOption;
  name: string;
  category: "Claro Institucional" | "Oscuro Profesional" | "Contraste Jurídico" | "Técnico Verde";
  description: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  bodyClass: string;
  cardClass: string;
  navbarBg: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "slate",
    name: "Clásico Institucional (Slate)",
    category: "Claro Institucional",
    description: "Esquema estándar sobrio con fondo gris pizarra suave y detalles en azul SEACE.",
    previewBg: "#f1f5f9",
    previewCard: "#ffffff",
    previewAccent: "#2563eb",
    bodyClass: "bg-slate-100 text-slate-900",
    cardClass: "bg-white border-slate-200 text-slate-900",
    navbarBg: "bg-slate-900",
  },
  {
    id: "navy",
    name: "Azul Jurídico / Contrataciones",
    category: "Claro Institucional",
    description: "Tono azul frío de alta legibilidad, ideal para revisión de bases y redacción de ofertas.",
    previewBg: "#f0f4f8",
    previewCard: "#ffffff",
    previewAccent: "#0284c7",
    bodyClass: "bg-slate-50 text-slate-900",
    cardClass: "bg-white border-sky-200 text-slate-900",
    navbarBg: "bg-sky-950",
  },
  {
    id: "corporate-dark",
    name: "Oscuro Ejecutivo (Dark Mode)",
    category: "Oscuro Profesional",
    description: "Fondo oscuro de alto descanso visual para jornadas nocturnas de armado de expedientes.",
    previewBg: "#0f172a",
    previewCard: "#1e293b",
    previewAccent: "#38bdf8",
    bodyClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-slate-900 border-slate-800 text-slate-100",
    navbarBg: "bg-slate-900",
  },
  {
    id: "emerald",
    name: "Ingeniería y Obras (Verde Técnico)",
    category: "Técnico Verde",
    description: "Esquema con acentos en verde esmeralda, enfocado en obras públicas y supervisión técnica.",
    previewBg: "#f0fdf4",
    previewCard: "#ffffff",
    previewAccent: "#059669",
    bodyClass: "bg-zinc-100 text-zinc-900",
    cardClass: "bg-white border-emerald-200 text-zinc-900",
    navbarBg: "bg-emerald-950",
  },
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeOption;
  onSelectTheme: (theme: ThemeOption) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="theme-selector-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="theme-selector-panel"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Selector de Estilo y Tema Visual
              </h2>
              <p className="text-xs text-slate-300">
                Elige el tema visual y combinación de colores preferida para la aplicación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Theme Options Grid */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Temas Disponibles ({THEMES.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  id={`theme-card-${theme.id}`}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative text-left ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white p-1 rounded-full shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    {/* Visual Preview Box */}
                    <div
                      className="w-full h-16 rounded-lg p-2 flex items-center justify-between mb-3 border border-slate-300/60 shadow-xs"
                      style={{ backgroundColor: theme.previewBg }}
                    >
                      <div
                        className="w-2/3 h-10 rounded-md border border-slate-300/40 p-1.5 flex flex-col justify-between"
                        style={{ backgroundColor: theme.previewCard }}
                      >
                        <div className="w-1/2 h-1.5 bg-slate-400/50 rounded-full"></div>
                        <div className="w-3/4 h-1 bg-slate-300/50 rounded-full"></div>
                      </div>
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold shadow-xs"
                        style={{ backgroundColor: theme.previewAccent }}
                      >
                        SEACE
                      </div>
                    </div>

                    <div className="font-semibold text-sm text-slate-800">
                      {theme.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {theme.description}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-600">{theme.category}</span>
                    {isSelected ? (
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="text-slate-400 hover:text-slate-600">Clic para aplicar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Los cambios de estilo se aplican de inmediato en tiempo real.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Listo / Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
