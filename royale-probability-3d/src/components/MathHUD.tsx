"use client";

import React, { useState } from "react";
import { SetOperationsResult, SpinRecord, MonteCarloDataPoint } from "../types/probability";
import { formatCourseNumber } from "../lib/probabilityEngine";
import MonteCarloChart from "./MonteCarloChart";
import {
  Calculator,
  HelpCircle,
  Play,
  FastForward,
  RotateCcw,
  History,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface MathHUDProps {
  stats: SetOperationsResult;
  selectedA: Set<number>;
  selectedB: Set<number>;
  isSpinning: boolean;
  onSpinSingle: () => void;
  onSpinBatch: (count: number) => void;
  onResetMonteCarlo: () => void;
  history: SpinRecord[];
  monteCarloPoints: MonteCarloDataPoint[];
}

export default function MathHUD({
  stats,
  selectedA,
  selectedB,
  isSpinning,
  onSpinSingle,
  onSpinBatch,
  onResetMonteCarlo,
  history,
  monteCarloPoints,
}: MathHUDProps) {
  const [activeTab, setActiveTab] = useState<"laplace" | "conditional" | "montecarlo">("laplace");

  const totalN = monteCarloPoints.length;
  const successesA = monteCarloPoints.filter((pt) => selectedA.has(pt.spinResult)).length;
  const lastEmpirical = totalN > 0 ? successesA / totalN : 0;
  const errorA = Math.abs(lastEmpirical - stats.probA);

  return (
    <div className="flex flex-col h-full bg-obsidian-900/90 backdrop-blur-xl border border-gold-500/20 rounded-xl p-4 text-zinc-200 shadow-2xl overflow-y-auto">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gold-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Motor Matemático en Tiempo Real
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-emerald-500/30">
          Laplace + Monte Carlo
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 my-3">
        <button
          onClick={() => setActiveTab("laplace")}
          className={`min-h-[44px] rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 active:scale-95 ${
            activeTab === "laplace"
              ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Operaciones</span>
        </button>
        <button
          onClick={() => setActiveTab("conditional")}
          className={`min-h-[44px] rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 active:scale-95 ${
            activeTab === "conditional"
              ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Condicional</span>
        </button>
        <button
          onClick={() => setActiveTab("montecarlo")}
          className={`min-h-[44px] rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 active:scale-95 ${
            activeTab === "montecarlo"
              ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Monte Carlo</span>
        </button>
      </div>

      {/* Pestaña 1: operaciones y regla de laplace */}
      {activeTab === "laplace" && (
        <div className="space-y-3">
          {/* Clasificador de Sucesos Badge */}
          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block font-medium">Clasificación de Eventos:</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                {stats.isCompatible ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Sucesos Compatibles (A ∩ B ≠ ∅)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">Incompatibles / Mutuamente Excluyentes (A ∩ B = ∅)</span>
                  </>
                )}
              </span>
            </div>
            <div className="text-right">
              {stats.isCertainA && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-semibold block">
                  A es Seguro (Ω)
                </span>
              )}
              {stats.isImpossibleA && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 font-semibold block">
                  A es Imposible (∅)
                </span>
              )}
            </div>
          </div>

          {/* Tarjetas de Probabilidades de Laplace */}
          <div className="grid grid-cols-2 gap-2">
            {/* P(A) */}
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-gold-500/30">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gold-400">P(A)</span>
                <span className="text-[10px] text-zinc-400 font-mono">|A|/|Ω|</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.fracA}
              </div>
              <div className="flex justify-between text-xs text-zinc-400 font-mono mt-1">
                <span>{formatCourseNumber(stats.probA)}</span>
                <span className="text-gold-300 font-semibold">
                  {(stats.probA * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* P(B) */}
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-cyan-500/30">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-cyan-400">P(B)</span>
                <span className="text-[10px] text-zinc-400 font-mono">|B|/|Ω|</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.fracB}
              </div>
              <div className="flex justify-between text-xs text-zinc-400 font-mono mt-1">
                <span>{formatCourseNumber(stats.probB)}</span>
                <span className="text-cyan-300 font-semibold">
                  {(stats.probB * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* P(A ∩ B) Intersección */}
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-fuchsia-500/30">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-fuchsia-400">P(A ∩ B)</span>
                <span className="text-[10px] text-zinc-400 font-mono">|A ∩ B|/|Ω|</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.fracIntersection}
              </div>
              <div className="flex justify-between text-xs text-zinc-400 font-mono mt-1">
                <span>{formatCourseNumber(stats.probIntersection)}</span>
                <span className="text-fuchsia-300 font-semibold">
                  {(stats.probIntersection * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* P(A ∪ B) Unión */}
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-emerald-500/30">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-emerald-400">P(A ∪ B)</span>
                <span className="text-[10px] text-zinc-400 font-mono">|A ∪ B|/|Ω|</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {stats.fracUnion}
              </div>
              <div className="flex justify-between text-xs text-zinc-400 font-mono mt-1">
                <span>{formatCourseNumber(stats.probUnion)}</span>
                <span className="text-emerald-300 font-semibold">
                  {(stats.probUnion * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Complemento P(A^c) */}
          <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-zinc-300 block">
                Complemento P(Aᶜ) = 1 - P(A)
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {stats.cardinalComplementA} de 37 casillas
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-bold text-zinc-200 block">
                {stats.fracComplementA} ({formatCourseNumber(stats.probComplementA)})
              </span>
              <span className="text-xs text-zinc-400">
                {(stats.probComplementA * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Demostración de la Regla de Adición */}
          <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 font-mono">
            <span className="text-[11px] text-zinc-500 uppercase font-semibold block mb-1">
              Verificación de la Regla de la Adición:
            </span>
            <div className="text-zinc-300">
              P(A ∪ B) = P(A) + P(B) - P(A ∩ B)
            </div>
            <div className="text-gold-300 text-[11px] mt-0.5">
              {formatCourseNumber(stats.probUnion)} = {formatCourseNumber(stats.probA)} + {formatCourseNumber(stats.probB)} - {formatCourseNumber(stats.probIntersection)}
            </div>
          </div>
        </div>
      )}

      {/* Pestaña 2: probabilidad condicional */}
      {activeTab === "conditional" && (
        <div className="space-y-3">
          {/* Tarjeta de Fórmula Principal */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-gold-500/30">
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-wide block mb-1">
              Fórmula de Probabilidad Condicional
            </span>
            <div className="text-base font-bold text-white font-mono bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 text-center">
              P(A | B) = P(A ∩ B) / P(B) = |A ∩ B| / |B|
            </div>
            <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
              {stats.conditionalExplanation}
            </p>
          </div>

          {/* Valores Calculados */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-0.5">P(A | B)</span>
              <span className="text-lg font-bold text-gold-400 font-mono block">
                {stats.fracAGivenB}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {stats.probAGivenB !== null ? `${formatCourseNumber(stats.probAGivenB)} (${(stats.probAGivenB * 100).toFixed(1)}%)` : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-0.5">P(B | A)</span>
              <span className="text-lg font-bold text-cyan-400 font-mono block">
                {stats.fracBGivenA}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {stats.probBGivenA !== null ? `${formatCourseNumber(stats.probBGivenA)} (${(stats.probBGivenA * 100).toFixed(1)}%)` : "N/A"}
              </span>
            </div>
          </div>

          {/* Test de Independencia Estocástica */}
          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase block mb-1">
              Independencia de Sucesos:
            </span>
            {stats.probAGivenB !== null && Math.abs(stats.probAGivenB - stats.probA) < 0.001 ? (
              <span className="text-emerald-400 font-semibold">
                Eventos Independientes: P(A | B) = P(A). La ocurrencia de B no altera la probabilidad de A.
              </span>
            ) : (
              <span className="text-amber-300">
                Eventos Dependientes: P(A | B) ≠ P(A). La información de B modifica la probabilidad de ocurrencia de A.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 3: simulador monte carlo y convergencia */}
      {activeTab === "montecarlo" && (
        <div className="space-y-3">
          {/* Controles de Simulación */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onSpinSingle}
              disabled={isSpinning}
              className="min-h-[46px] rounded-lg bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-black font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg"
            >
              <Play className="w-4 h-4 fill-black mb-0.5" />
              <span>1 Giro 3D</span>
            </button>

            <button
              onClick={() => onSpinBatch(100)}
              disabled={isSpinning}
              className="min-h-[46px] rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 border border-emerald-500/40"
            >
              <FastForward className="w-4 h-4 mb-0.5" />
              <span>+100 Giros</span>
            </button>

            <button
              onClick={() => onSpinBatch(1000)}
              disabled={isSpinning}
              className="min-h-[46px] rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 border border-cyan-500/40"
            >
              <TrendingUp className="w-4 h-4 mb-0.5" />
              <span>+1,000 Giros</span>
            </button>
          </div>

          {/* Gráfico de Convergencia */}
          <MonteCarloChart
            dataPoints={monteCarloPoints}
            theoreticalPA={stats.probA}
            totalN={totalN}
          />

          {/* Tabla Comparativa de Frecuencias */}
          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs">
            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-zinc-800">
              <span className="font-semibold text-zinc-300">Resumen Empírico (Ley Débil)</span>
              <button
                onClick={onResetMonteCarlo}
                className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Reiniciar simulador Monte Carlo"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-zinc-300 font-mono">
              <div>
                <span className="text-[11px] text-zinc-500 block">Total Giros (N):</span>
                <span className="font-bold text-white text-sm">{totalN}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Apariciones de A (f_A):</span>
                <span className="font-bold text-gold-400 text-sm">{successesA}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Frec. Relativa (h_A):</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {formatCourseNumber(lastEmpirical)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Prob. Teórica P(A):</span>
                <span className="font-bold text-gold-400 text-sm">
                  {formatCourseNumber(stats.probA)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Giros Recientes (Pill Tray) */}
      <div className="mt-auto pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <History className="w-3.5 h-3.5" />
            <span>Últimos Giros ({history.length})</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={onResetMonteCarlo}
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 min-h-[36px]">
          {history.length === 0 ? (
            <span className="text-[11px] text-zinc-600 italic">
              Aún no hay giros registrados.
            </span>
          ) : (
            history.slice(0, 14).map((rec) => {
              let badgeBg = "bg-neutral-800 text-white";
              if (rec.color === "red") badgeBg = "bg-red-700 text-white";
              else if (rec.color === "green") badgeBg = "bg-emerald-700 text-white";

              return (
                <div
                  key={rec.id}
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs border border-white/20 shadow ${badgeBg}`}
                  title={`Número ${rec.number} (${rec.color})`}
                >
                  {rec.number}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

