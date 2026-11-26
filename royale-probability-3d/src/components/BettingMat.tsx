"use client";

import React from "react";
import { RED_NUMBERS, BLACK_NUMBERS, POCKETS_INFO } from "../lib/probabilityEngine";
import { PresetKey } from "../types/probability";

interface BettingMatProps {
  selectedA: Set<number>;
  selectedB: Set<number>;
  activeEvent: "A" | "B";
  onToggleNumber: (num: number, target: "A" | "B") => void;
  onApplyPreset: (preset: PresetKey, target: "A" | "B") => void;
}

export default function BettingMat({
  selectedA,
  selectedB,
  activeEvent,
  onToggleNumber,
  onApplyPreset,
}: BettingMatProps) {
  // Organización tradicional de la Ruleta Europea: 3 filas horizontales de 12 columnas
  // Fila 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 (Columna 3)
  // Fila 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 (Columna 2)
  // Fila 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 (Columna 1)
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  const getStatusBadge = (num: number) => {
    const inA = selectedA.has(num);
    const inB = selectedB.has(num);
    if (inA && inB) {
      return (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-fuchsia-600 border border-white text-[9px] font-bold text-white flex items-center justify-center shadow-lg">
          ∩
        </span>
      );
    }
    if (inA) {
      return (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-gold-500 border border-black text-[8px] font-bold text-black flex items-center justify-center shadow">
          A
        </span>
      );
    }
    if (inB) {
      return (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-black text-[8px] font-bold text-black flex items-center justify-center shadow">
          B
        </span>
      );
    }
    return null;
  };

  const getNumberBg = (num: number) => {
    const inA = selectedA.has(num);
    const inB = selectedB.has(num);
    const isRed = RED_NUMBERS.has(num);
    const isBlack = BLACK_NUMBERS.has(num);

    let border = "border-gold-500/20";
    let ring = "";
    if (inA && inB) {
      ring = "ring-2 ring-fuchsia-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]";
      border = "border-fuchsia-400";
    } else if (inA) {
      ring = "ring-2 ring-gold-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
      border = "border-gold-400";
    } else if (inB) {
      ring = "ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]";
      border = "border-cyan-400";
    }

    let bg = "bg-neutral-900";
    if (num === 0) bg = "bg-emerald-800 hover:bg-emerald-700 text-white";
    else if (isRed) bg = "bg-red-700 hover:bg-red-600 text-white";
    else if (isBlack) bg = "bg-neutral-900 hover:bg-neutral-800 text-zinc-100";

    return `${bg} ${border} ${ring}`;
  };

  return (
    <div className="w-full bg-emerald-950/70 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-emerald-600/30 text-white shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-700/40 min-w-[580px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-gold-400">
            Tapete de Apuestas Oficial (Felt VIP)
          </span>
          <span className="text-[11px] text-zinc-400">
            Editando Evento Activo:{" "}
            <strong className={activeEvent === "A" ? "text-gold-400 font-bold" : "text-cyan-400 font-bold"}>
              Evento {activeEvent}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold-500 border border-black inline-block" />
            <span className="text-gold-300">A ({selectedA.size})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 border border-black inline-block" />
            <span className="text-cyan-300">B ({selectedB.size})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-fuchsia-600 border border-white inline-block" />
            <span className="text-fuchsia-300">A ∩ B</span>
          </div>
        </div>
      </div>

      <div className="min-w-[620px]">
        {/* Grilla principal */}
        <div className="flex gap-1.5">
          {/* Cero Verde (0) a la izquierda abarcando las 3 filas */}
          <button
            onClick={() => onToggleNumber(0, activeEvent)}
            className={`relative w-12 min-h-[118px] rounded flex flex-col items-center justify-center font-bold text-lg border transition-all active:scale-95 ${getNumberBg(
              0
            )}`}
            title="Casilla 0 (Verde / Banca)"
          >
            {getStatusBadge(0)}
            <span className="text-xl">0</span>
          </button>

          {/* Grilla 3 x 12 */}
          <div className="flex-1 flex flex-col gap-1.5">
            {rows.map((row, rIdx) => (
              <div key={`row-${rIdx}`} className="grid grid-cols-12 gap-1.5">
                {row.map((num) => (
                  <button
                    key={`num-${num}`}
                    onClick={() => onToggleNumber(num, activeEvent)}
                    className={`relative h-9 rounded flex items-center justify-center font-bold text-sm border transition-all active:scale-95 ${getNumberBg(
                      num
                    )}`}
                  >
                    {getStatusBadge(num)}
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Columnas 2 a 1 (Extremo derecho) */}
          <div className="w-14 flex flex-col gap-1.5">
            <button
              onClick={() => onApplyPreset("col3", activeEvent)}
              className="h-9 px-1 rounded bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-emerald-200 transition-all active:scale-95"
              title="Columna 3 (3, 6, 9...)"
            >
              2 a 1
            </button>
            <button
              onClick={() => onApplyPreset("col2", activeEvent)}
              className="h-9 px-1 rounded bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-emerald-200 transition-all active:scale-95"
              title="Columna 2 (2, 5, 8...)"
            >
              2 a 1
            </button>
            <button
              onClick={() => onApplyPreset("col1", activeEvent)}
              className="h-9 px-1 rounded bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-emerald-200 transition-all active:scale-95"
              title="Columna 1 (1, 4, 7...)"
            >
              2 a 1
            </button>
          </div>
        </div>

        {/* Apuestas Exteriores: Docenas */}
        <div className="flex gap-1.5 mt-2 ml-14">
          <button
            onClick={() => onApplyPreset("dozen1", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-bold text-gold-300 transition-all active:scale-95"
          >
            1ª Docena (1-12)
          </button>
          <button
            onClick={() => onApplyPreset("dozen2", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-bold text-gold-300 transition-all active:scale-95"
          >
            2ª Docena (13-24)
          </button>
          <button
            onClick={() => onApplyPreset("dozen3", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-bold text-gold-300 transition-all active:scale-95"
          >
            3ª Docena (25-36)
          </button>
        </div>

        {/* Apuestas Simples (Even Money) */}
        <div className="flex gap-1.5 mt-1.5 ml-14">
          <button
            onClick={() => onApplyPreset("low", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-zinc-200 transition-all active:scale-95"
          >
            1 - 18
          </button>
          <button
            onClick={() => onApplyPreset("even", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-zinc-200 transition-all active:scale-95"
          >
            PAR
          </button>
          <button
            onClick={() => onApplyPreset("red", activeEvent)}
            className="flex-1 h-8 rounded bg-red-800/80 hover:bg-red-700 border border-red-500/50 text-xs font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            ROJO
          </button>
          <button
            onClick={() => onApplyPreset("black", activeEvent)}
            className="flex-1 h-8 rounded bg-neutral-900/90 hover:bg-neutral-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            NEGRO
          </button>
          <button
            onClick={() => onApplyPreset("odd", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-zinc-200 transition-all active:scale-95"
          >
            IMPAR
          </button>
          <button
            onClick={() => onApplyPreset("high", activeEvent)}
            className="flex-1 h-8 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/40 text-xs font-semibold text-zinc-200 transition-all active:scale-95"
          >
            19 - 36
          </button>
        </div>
      </div>
    </div>
  );
}

