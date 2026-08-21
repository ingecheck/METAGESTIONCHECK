import React, { useState } from "react";
import {
  Building2,
  HardHat,
  TrendingUp,
  Scale,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ObraProyecto,
  ValorizacionMensual,
  AsientoCuadernoObra,
  ModificacionObra,
  LiquidacionResumen,
} from "../../types/obras";
import { WorksDashboard } from "./WorksDashboard";
import { WorksValuations } from "./WorksValuations";
import { WorksModificationsManager } from "./WorksModificationsManager";
import { WorksSettlementManager } from "./WorksSettlementManager";

interface WorksControlSuiteProps {
  obra: ObraProyecto;
  setObra: React.Dispatch<React.SetStateAction<ObraProyecto>>;
  valorizaciones: ValorizacionMensual[];
  setValorizaciones: React.Dispatch<React.SetStateAction<ValorizacionMensual[]>>;
  asientos: AsientoCuadernoObra[];
  setAsientos: React.Dispatch<React.SetStateAction<AsientoCuadernoObra[]>>;
  modificaciones: ModificacionObra[];
  setModificaciones: React.Dispatch<React.SetStateAction<ModificacionObra[]>>;
  liquidacion: LiquidacionResumen;
  setLiquidacion: React.Dispatch<React.SetStateAction<LiquidacionResumen>>;
  subTab?: string;
  onNavigateSubtab?: (subtab: string) => void;
}

export const WorksControlSuite: React.FC<WorksControlSuiteProps> = ({
  obra,
  setObra,
  valorizaciones,
  setValorizaciones,
  asientos,
  setAsientos,
  modificaciones,
  setModificaciones,
  liquidacion,
  setLiquidacion,
  subTab = "dashboard-obras",
  onNavigateSubtab,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<string>("dashboard-obras");
  const currentSubTab = subTab || internalSubTab;

  const handleSubTabChange = (tabId: string) => {
    if (onNavigateSubtab) {
      onNavigateSubtab(tabId);
    } else {
      setInternalSubTab(tabId);
    }
  };

  const navSubItems = [
    { id: "dashboard-obras", label: "Panel Principal", icon: Building2 },
    { id: "valorizaciones", label: "1. Curva S y Valorizaciones", icon: TrendingUp },
    { id: "adicionales", label: "2. Adicionales y Plazos", icon: Scale },
    { id: "liquidacion", label: "3. Recepción y Liquidación", icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Works Control Top Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-1.5 overflow-x-auto flex items-center gap-1.5">
        {navSubItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSubTabChange(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Subtab Component */}
      {currentSubTab === "dashboard-obras" && (
        <WorksDashboard
          obra={obra}
          setObra={setObra}
          valorizaciones={valorizaciones}
          asientos={asientos}
          modificaciones={modificaciones}
          onNavigateSubtab={handleSubTabChange}
        />
      )}

      {currentSubTab === "valorizaciones" && (
        <WorksValuations
          obra={obra}
          valorizaciones={valorizaciones}
          setValorizaciones={setValorizaciones}
        />
      )}

      {currentSubTab === "adicionales" && (
        <WorksModificationsManager
          obra={obra}
          modificaciones={modificaciones}
          setModificaciones={setModificaciones}
        />
      )}

      {currentSubTab === "liquidacion" && (
        <WorksSettlementManager
          obra={obra}
          liquidacion={liquidacion}
          setLiquidacion={setLiquidacion}
        />
      )}
    </div>
  );
};
