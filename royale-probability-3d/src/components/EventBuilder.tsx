"use client";

import React from "react";
import { PresetKey } from "../types/probability";
import { PRIME_NUMBERS, RED_NUMBERS, BLACK_NUMBERS } from "../lib/probabilityEngine";
import { Layers, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

interface EventBuilderProps {
  activeEvent: "A" | "B";
  setActiveEvent: (event: "A" | "B") => void;
  selectedA: Set<number>;
  selectedB: Set<number>;
  onApplyPreset: (preset: PresetKey, target: "A" | "B") => void;
  onToggleNumber: (num: number, target: "A" | "B") => void;
  onClearEvent: (target: "A" | "B") => void;
  onInvertEvent: (target: "A" | "B") => void;
}

export default function EventBuilder({
  activeEvent,
  setActiveEvent,
  selectedA,
  selectedB,
  onApplyPreset,
  onToggleNumber,
  onClearEvent,
  onInvertEvent,
}: EventBuilderProps) {
  const currentSet = activeEvent === "A" ? selectedA : selectedB;
  const isA = activeEvent === "A";

  const presetsList: { label: string; key: PresetKey; desc: string }[] = [
    { label: "Rojo", key: "red", desc: "18 números rojos" },
    { label: "Negro", key: "black", desc: "18 números negros" },
    { label: "Verde (0)", key: "green", desc: "Casilla 0 de la banca" },
    { label: "Pares", key: "even", desc: "2, 4, 6, ..., 36" },
    { label: "Impares", key: "odd", desc: "1, 3, 5, ..., 35" },
    { label: "Primos", key: "prime", desc: "{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31}" },
    { label: "1ª Docena", key: "dozen1", desc: "1 al 12" },
    { label: "2ª Docena", key: "dozen2", desc: "13 al 24" },
    { label: "3ª Docena", key: "dozen3", desc: "25 al 36" },
    { label: "Mayores (>18)", key: "high", desc: "19 al 36 (Passe)" },
    { label: "Menores (≤18)", key: "low", desc: "1 al 18 (Manque)" },
    { label: "Espacio Ω", key: "all", desc: "Todos los 37 números" },
  ];

  return (
    <div className="flex flex-col h-full bg-obsidian-900/90 backdrop-blur-xl border border-gold-500/20 rounded-xl p-4 text-zinc-200 shadow-2xl overflow-y-auto">
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-gold-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Constructor de Eventos
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-gold-300 border border-gold-500/30">
          |Ω| = 37
        </span>
      </div>

      {/* Selector de Evento Activo (Pestañas accesibles) */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <button
          onClick={() => setActiveEvent("A")}
          className={`min-h-[46px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border ${
            isA
              ? "bg-gold-500/20 border-gold-400 text-gold-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-gold-400 inline-block" />
          <span>Evento A ({selectedA.size})</span>
        </button>

        <button
          onClick={() => setActiveEvent("B")}
          className={`min-h-[46px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border ${
            !isA
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
          <span>Evento B ({selectedB.size})</span>
        </button>
      </div>

      {/* Espacio Muestral y Estado Actual */}
      <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 mb-3 text-xs">
        <div className="flex justify-between items-center mb-1 text-zinc-400">
          <span>Elementos en Evento {activeEvent}:</span>
          <span className="font-mono font-bold text-white">
            |{activeEvent}| = {currentSet.size} de 37
          </span>
        </div>
        <div className="max-h-16 overflow-y-auto text-[11px] font-mono text-zinc-300 bg-zinc-900/80 p-1.5 rounded border border-zinc-800 break-words">
          {currentSet.size === 0 ? (
            <span className="text-zinc-500 italic">Conjunto Vacío (∅) - Evento Imposible</span>
          ) : currentSet.size === 37 ? (
            <span className="text-emerald-400 font-semibold">Espacio Muestral Completo (Ω) - Evento Seguro</span>
          ) : (
            `{ ${Array.from(currentSet).sort((a, b) => a - b).join(", ")} }`
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onClearEvent(activeEvent)}
          className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Vaciar ({activeEvent})</span>
        </button>
        <button
          onClick={() => onInvertEvent(activeEvent)}
          className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          title="Seleccionar el complemento A^c o B^c"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Invertir ({activeEvent}ᶜ)</span>
        </button>
      </div>

      {/* Chips de Presets */}
      <div className="mb-4">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Presets Clásicos de Casino
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {presetsList.map((p) => (
            <button
              key={p.key}
              onClick={() => onApplyPreset(p.key, activeEvent)}
              className="min-h-[44px] px-2 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-left transition-all active:scale-95 group flex flex-col justify-center"
            >
              <span className="text-xs font-semibold text-zinc-200 group-hover:text-gold-300 transition-colors">
                {p.label}
              </span>
              <span className="text-[10px] text-zinc-500 leading-tight">
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selector Manual de Casillas (0 a 36) */}
      <div className="mt-auto pt-3 border-t border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Selección Manual Casilla por Casilla
        </span>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 37 }, (_, i) => {
            const isSelected = currentSet.has(i);
            const isRed = RED_NUMBERS.has(i);
            const isGreen = i === 0;

            let badgeColor = "bg-zinc-900 text-zinc-300 border-zinc-800";
            if (isSelected) {
              badgeColor = isA
                ? "bg-gold-500 text-black font-bold border-gold-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                : "bg-cyan-400 text-black font-bold border-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.7)]";
            } else if (isGreen) {
              badgeColor = "bg-emerald-950 text-emerald-300 border-emerald-700/50";
            } else if (isRed) {
              badgeColor = "bg-red-950/80 text-red-300 border-red-800/50";
            }

            return (
              <button
                key={`btn-manual-${i}`}
                onClick={() => onToggleNumber(i, activeEvent)}
                className={`h-8 rounded text-xs font-mono font-medium border transition-all active:scale-90 flex items-center justify-center ${badgeColor}`}
                title={`Casilla ${i}`}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

