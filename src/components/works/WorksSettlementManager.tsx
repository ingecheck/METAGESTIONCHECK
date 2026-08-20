import React, { useState } from "react";
import {
  Award,
  DollarSign,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Percent,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { LiquidacionResumen, ObraProyecto, PenalidadMoraCalculo } from "../../types/obras";

interface WorksSettlementManagerProps {
  obra: ObraProyecto;
  liquidacion: LiquidacionResumen;
  setLiquidacion: React.Dispatch<React.SetStateAction<LiquidacionResumen>>;
}

export const WorksSettlementManager: React.FC<WorksSettlementManagerProps> = ({
  obra,
  liquidacion,
  setLiquidacion,
}) => {
  // Penalty calculator interactive state
  const [diasAtraso, setDiasAtraso] = useState<number>(0);
  const plazoVigente = obra.plazoDias + 20; // con ampliación
  const montoVigente = obra.montoContractual + 185420 - 32150;
  const factorF = plazoVigente > 60 ? 0.15 : 0.4;

  // Formula OSCE Art. 162 RLCE: Penalidad Diaria = (0.10 * Monto) / (F * Plazo)
  const penalidadDiaria = (0.1 * montoVigente) / (factorF * plazoVigente);
  const penalidadTotalCalculada = penalidadDiaria * diasAtraso;
  const penalidadMaxima10Pct = 0.1 * montoVigente;
  const excedeTope10Pct = penalidadTotalCalculada > penalidadMaxima10Pct;

  // Final Settlement Math
  const totalAutorizado =
    liquidacion.montoTotalContratoFinal +
    liquidacion.reajustesTotalesK +
    liquidacion.mayoresGastosGenerales +
    liquidacion.interesesLegales;

  const totalDeduccionesYPagos =
    liquidacion.totalPagadoACuenta +
    liquidacion.penalidadesPorMoraAplicadas +
    liquidacion.otrasPenalidades;

  const saldoFinalCalculado = totalAutorizado - totalDeduccionesYPagos;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Módulo 2 • Control de Obras • Recepción y Liquidación Final (Art. 208 - 209 RLCE)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Recepción de Obra y Liquidación Técnica-Financiera
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Cuadro de cierre contractual, determinación del saldo neto final a favor del contratista o de la entidad, conciliación de amortizaciones de adelantos, reajustes K y cálculo normativo de penalidades por mora.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => alert("Acta de Recepción y Expediente de Liquidación de Obra exportados exitosamente.")}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Acta y Liquidación</span>
          </button>
        </div>
      </div>

      {/* FINAL SETTLEMENT SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
              Balance General de Liquidación de Obra
            </span>
            <h2 className="text-lg font-bold text-white">
              Saldo Final Determinado de la Obra
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">
              Saldo Neto a Favor del Contratista
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              S/ {saldoFinalCalculado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Monto Total Autorizado (con K):</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              S/ {totalAutorizado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">Incluye adicionales y reajuste K</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Pagado a Cuenta (Valorizaciones):</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              S/ {liquidacion.totalPagadoACuenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">5 valorizaciones canceladas</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Amortización Adelantos (100%):</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              S/ {(liquidacion.adelantoDirectoTotalAmortizado + liquidacion.adelantoMaterialesTotalAmortizado).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Totalmente amortizados</span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Penalidades por Mora:</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              S/ {liquidacion.penalidadesPorMoraAplicadas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">0 días de atraso injustificado</span>
          </div>
        </div>
      </div>

      {/* DETAILED LIQUIDATION TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs">
        <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Estructura de la Liquidación Financiera Final de Obra</span>
          </div>
          <span className="text-[11px] bg-slate-800 px-2.5 py-0.5 rounded text-indigo-300 font-mono">
            Art. 209 RLCE
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700">
              A. Componentes del Costo Total de la Obra (A Favor del Contratista)
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between p-3 bg-slate-50 font-semibold text-slate-800">
                <span>1. Monto del Contrato Principal</span>
                <span className="font-mono">S/ {obra.montoContractual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>2. Presupuesto de Prestaciones Adicionales Aprobadas (+)</span>
                <span className="font-mono text-purple-700">+ S/ {liquidacion.montoAdicionalesAprobados.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>3. Presupuesto de Deductivos Vinculados (-)</span>
                <span className="font-mono text-rose-700">- S/ {liquidacion.montoDeductivosAprobados.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                <span>Total Contrato Final de Obra</span>
                <span className="font-mono">S/ {liquidacion.montoTotalContratoFinal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>4. Reajustes Definitivos por Coeficiente K (Fórmula Polinómica)</span>
                <span className="font-mono text-purple-700">+ S/ {liquidacion.reajustesTotalesK.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>5. Mayores Gastos Generales Variables Acreditados</span>
                <span className="font-mono text-purple-700">+ S/ {liquidacion.mayoresGastosGenerales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-indigo-50/80 font-black text-indigo-950">
                <span>TOTAL AUTORIZADO DE LA OBRA (A)</span>
                <span className="font-mono">S/ {totalAutorizado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-700">
              B. Deducciones y Pagos a Cuenta Efectuados por la Entidad
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>1. Total Neto Pagado a Cuenta en Valorizaciones 1 a 5</span>
                <span className="font-mono text-slate-900">S/ {liquidacion.totalPagadoACuenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-white text-slate-700">
                <span>2. Penalidades por Mora Incurridas</span>
                <span className="font-mono text-rose-700">S/ {liquidacion.penalidadesPorMoraAplicadas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-100 font-bold text-slate-900">
                <span>TOTAL DEDUCCIONES Y PAGOS EFECTUADOS (B)</span>
                <span className="font-mono">S/ {totalDeduccionesYPagos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between font-black text-emerald-950 text-sm">
            <span>SALDO FINAL DE LIQUIDACIÓN A FAVOR DEL CONTRATISTA (A - B)</span>
            <span className="font-mono text-base">S/ {saldoFinalCalculado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* OSCE PENALTY CALCULATOR (ART. 162 RLCE) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 text-xs">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Calculadora Normativa de Penalidad Diaria por Mora (Art. 162 RLCE)
            </h3>
            <p className="text-slate-500 text-xs">
              Fórmula Oficial OSCE: <code className="font-mono font-bold text-rose-700">Penalidad Diaria = (0.10 × Monto Vigente) / (F × Plazo Vigente en Días)</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold block text-[10px]">Monto Contractual Vigente:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              S/ {montoVigente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Con adicionales y deductivos</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold block text-[10px]">Plazo Vigente y Factor F:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {plazoVigente} días • Factor F = {factorF}
            </span>
            <span className="text-[10px] text-slate-400 block">F=0.15 para plazos &gt; 60 días</span>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-1">
            <span className="text-rose-800 font-semibold block text-[10px]">Penalidad Diaria Resultante:</span>
            <span className="font-mono font-black text-rose-950 text-sm">
              S/ {penalidadDiaria.toLocaleString("es-PE", { minimumFractionDigits: 2 })} / día
            </span>
            <span className="text-[10px] text-rose-700 block">Tope 10%: S/ {penalidadMaxima10Pct.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Interactive delay simulator */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="font-bold text-slate-700 whitespace-nowrap">Simular Días de Atraso Injustificado:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={diasAtraso}
              onChange={(e) => setDiasAtraso(parseInt(e.target.value) || 0)}
              className="w-20 border border-slate-300 rounded-lg p-1.5 font-bold text-center text-slate-900 bg-white"
            />
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Penalidad Acumulada a Deducir:</span>
            <span className="text-base font-black text-rose-700 font-mono">
              S/ {penalidadTotalCalculada.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
