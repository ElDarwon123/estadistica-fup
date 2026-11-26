"use client";

import React, { useState, useEffect } from "react";
import {
  SetOperationsResult,
  SpinRecord,
  PresetKey,
  ChipValue,
} from "../types/probability";
import { formatCourseNumber, formatMoney } from "../lib/probabilityEngine";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Layers,
  Calculator,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SoberHUDProps {
  balance: number;
  totalBet: number;
  lastPayout: number;
  selectedChip: ChipValue;
  setSelectedChip: (chip: ChipValue) => void;
  onClearBets: () => void;
  onDoubleBets: () => void;
  onUndoBet: () => void;
  onRebet: () => void;
  canRebet: boolean;
  betStats: {
    coveredCount: number;
    winProb: number;
    winFrac: string;
    expectedValue: number;
    houseEdge: number;
  };
  stats: SetOperationsResult;
  selectedA: Set<number>;
  selectedB: Set<number>;
  activeEvent: "A" | "B";
  setActiveEvent: (event: "A" | "B") => void;
  onApplyPreset: (preset: PresetKey, target: "A" | "B") => void;
  onClearEvent: (target: "A" | "B") => void;
  onInvertEvent: (target: "A" | "B") => void;
  theoryMode: boolean;
  setTheoryMode: (enabled: boolean) => void;
  isSpinning: boolean;
  onSpinSingle: () => void;
  history: SpinRecord[];
  cameraView: "perspective" | "top" | "closeup";
  setCameraView: (view: "perspective" | "top" | "closeup") => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function SoberHUD({
  balance,
  totalBet,
  lastPayout,
  selectedChip,
  setSelectedChip,
  onClearBets,
  onDoubleBets,
  onUndoBet,
  betStats,
  stats,
  selectedA,
  selectedB,
  activeEvent,
  setActiveEvent,
  onApplyPreset,
  onClearEvent,
  onInvertEvent,
  isSpinning,
  onSpinSingle,
  history,
  cameraView,
  setCameraView,
  isMuted,
  onToggleMute,
}: SoberHUDProps) {
  const [showEventDrawer, setShowEventDrawer] = useState(false);
  const [showMathDrawer, setShowMathDrawer] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chipsSpec: { val: ChipValue; bg: string; text: string; label: string }[] = [
    { val: 1, bg: "bg-[#4da2ff]", text: "text-black", label: "$1" },
    { val: 5, bg: "bg-[#fb4903]", text: "text-white", label: "$5" },
    { val: 25, bg: "bg-[#55db9c]", text: "text-black", label: "$25" },
    { val: 100, bg: "bg-[#ffd731]", text: "text-black", label: "$100" },
    { val: 500, bg: "bg-[#5c4ade]", text: "text-white", label: "$500" },
  ];

  const presetsList: { label: string; key: PresetKey }[] = [
    { label: "Rojo (18)", key: "red" },
    { label: "Negro (18)", key: "black" },
    { label: "Verde (0)", key: "green" },
    { label: "Pares (18)", key: "even" },
    { label: "Impares (18)", key: "odd" },
    { label: "Primos (10)", key: "prime" },
    { label: "1ª Docena", key: "dozen1" },
    { label: "2ª Docena", key: "dozen2" },
    { label: "3ª Docena", key: "dozen3" },
    { label: "Mayores (>18)", key: "high" },
    { label: "Menores (≤18)", key: "low" },
    { label: "Todo Ω (37)", key: "all" },
  ];

  const lastSpin = history[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* 1. BARRA SUPERIOR: PILL CONTROLS + SALDO STICKERS */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
        {/* Saldo & Apuesta */}
        <div className="flex items-center gap-1.5">
          <div className="px-3.5 py-1.5 rounded-full bg-[#55db9c] text-black border border-black font-mono text-xs font-extrabold" suppressHydrationWarning>
            SALDO: {mounted ? formatMoney(balance) : "$2,500"}
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#ffd731] text-black border border-black font-mono text-xs font-extrabold" suppressHydrationWarning>
            APUESTA: {mounted ? formatMoney(totalBet) : "$0"}
          </div>
          {lastPayout > 0 && (
            <div className="px-3.5 py-1.5 rounded-full bg-[#4da2ff] text-black border border-black font-mono text-xs font-extrabold" suppressHydrationWarning>
              +{formatMoney(lastPayout)}
            </div>
          )}
        </div>

        {/* Cámaras & Zen */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#0c0d11] p-1 rounded-full border border-zinc-800 text-xs gap-1">
            {(["perspective", "top", "closeup"] as const).map((view) => {
              const labels = {
                perspective: "Vista 3D",
                top: "Tapete",
                closeup: "Ruleta",
              };
              return (
                <button
                  key={view}
                  onClick={() => setCameraView(view)}
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-[0.03em] transition-colors ${
                    cameraView === view
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {labels[view]}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setZenMode(!zenMode)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              zenMode
                ? "bg-white text-black border-black"
                : "bg-[#0c0d11] text-zinc-300 border-zinc-700 hover:border-white"
            }`}
          >
            {zenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{zenMode ? "HUD" : "Libre"}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full bg-[#0c0d11] border border-zinc-700 hover:border-white flex items-center justify-center transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#fb4903]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#55db9c]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. DRAWERS LATERALES: DARK SHELL + COLOR-BLOCKED STICKERS */}
      {!zenMode && (
        <div className="pointer-events-none flex-1 flex justify-between items-start pt-3 gap-4 overflow-hidden">
          {/* Izquierda: Eventos A y B */}
          <div className="pointer-events-auto flex flex-col items-start gap-2 max-w-[330px]">
            <button
              onClick={() => setShowEventDrawer(!showEventDrawer)}
              className="px-4 py-2 rounded-full bg-[#0c0d11] border border-zinc-700 hover:border-white text-xs font-bold text-white flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-[#4da2ff]" />
              <span>Eventos |A|={selectedA.size} • |B|={selectedB.size}</span>
              {showEventDrawer ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showEventDrawer && (
              <div className="w-[310px] max-h-[65dvh] overflow-y-auto bg-[#0c0d11] border border-zinc-800 rounded-[28px] p-4 text-white space-y-3">
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#14151a] border border-zinc-800">
                  <button
                    onClick={() => setActiveEvent("A")}
                    className={`py-1.5 rounded-full text-xs font-bold transition-colors ${
                      activeEvent === "A" ? "bg-[#ffd731] text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Evento A ({selectedA.size})
                  </button>
                  <button
                    onClick={() => setActiveEvent("B")}
                    className={`py-1.5 rounded-full text-xs font-bold transition-colors ${
                      activeEvent === "B" ? "bg-[#4da2ff] text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Evento B ({selectedB.size})
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => onClearEvent(activeEvent)}
                    className="flex-1 py-1.5 rounded-full bg-[#14151a] hover:bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#fb4903]" />
                    <span>Vaciar</span>
                  </button>
                  <button
                    onClick={() => onInvertEvent(activeEvent)}
                    className="flex-1 py-1.5 rounded-full bg-[#14151a] hover:bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#e9ccff]" />
                    <span>Invertir ({activeEvent}ᶜ)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {presetsList.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => onApplyPreset(p.key, activeEvent)}
                      className="px-3 py-1.5 rounded-full bg-[#14151a] hover:bg-white hover:text-black border border-zinc-800 text-[11px] font-bold text-left truncate transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Derecha: Motor Matemático */}
          <div className="pointer-events-auto flex flex-col items-end gap-2 max-w-[390px]">
            <button
              onClick={() => setShowMathDrawer(!showMathDrawer)}
              className="px-4 py-2 rounded-full bg-[#0c0d11] border border-zinc-700 hover:border-white text-xs font-bold text-white flex items-center gap-2 transition-colors"
            >
              {showMathDrawer ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <Calculator className="w-4 h-4 text-[#55db9c]" />
              <span>P(A) = {stats.fracA} • P(A|B) = {stats.fracAGivenB}</span>
            </button>

            {showMathDrawer && (
              <div className="w-[356px] max-h-[68dvh] overflow-y-auto bg-[#0c0d11] border border-zinc-800 rounded-[28px] p-4 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] slush-label text-zinc-400">Laplace & Conjuntos</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-black ${
                    stats.isCompatible ? "bg-[#55db9c] text-black" : "bg-[#fb4903] text-white"
                  }`}>
                    {stats.isCompatible ? "Compatibles" : "Incompatibles"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-[20px] bg-[#ffd731] text-black border border-black">
                    <span className="text-[10px] slush-label block">P(A)</span>
                    <span className="text-2xl slush-num block mt-1">{stats.fracA}</span>
                    <span className="text-[11px] font-mono font-bold opacity-80">
                      {formatCourseNumber(stats.probA)} ({(stats.probA * 100).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="p-3 rounded-[20px] bg-[#4da2ff] text-black border border-black">
                    <span className="text-[10px] slush-label block">P(B)</span>
                    <span className="text-2xl slush-num block mt-1">{stats.fracB}</span>
                    <span className="text-[11px] font-mono font-bold opacity-80">
                      {formatCourseNumber(stats.probB)} ({(stats.probB * 100).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="p-3 rounded-[20px] bg-[#e9ccff] text-black border border-black">
                    <span className="text-[10px] slush-label block">P(A ∩ B)</span>
                    <span className="text-2xl slush-num block mt-1">{stats.fracIntersection}</span>
                    <span className="text-[11px] font-mono font-bold opacity-80">
                      {formatCourseNumber(stats.probIntersection)}
                    </span>
                  </div>

                  <div className="p-3 rounded-[20px] bg-[#55db9c] text-black border border-black">
                    <span className="text-[10px] slush-label block">P(A ∪ B)</span>
                    <span className="text-2xl slush-num block mt-1">{stats.fracUnion}</span>
                    <span className="text-[11px] font-mono font-bold opacity-80">
                      {formatCourseNumber(stats.probUnion)}
                    </span>
                  </div>
                </div>

                {/* Condicional en Voltage Violet (#5c4ade) */}
                <div className="p-3.5 rounded-[20px] bg-[#5c4ade] text-white border border-black space-y-1">
                  <span className="text-[10px] slush-label opacity-80 block">
                    Condicional P(A | B)
                  </span>
                  <div className="text-xl slush-num">
                    {stats.fracAGivenB} = {formatCourseNumber(stats.probAGivenB)}
                  </div>
                  <p className="text-[11px] opacity-90 leading-snug pt-1">
                    {stats.conditionalExplanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CONSOLA INFERIOR DE APUESTAS */}
      <footer className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-2xl mx-auto">
        {lastSpin && (
          <div className="px-4 py-1 rounded-full bg-[#0c0d11] border border-zinc-700 text-xs font-mono text-white flex items-center gap-2">
            <span>Bola:</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-white text-xs border border-black ${
                lastSpin.color === "red"
                  ? "bg-[#fb4903]"
                  : lastSpin.color === "green"
                  ? "bg-[#55db9c] text-black"
                  : "bg-zinc-900"
              }`}
            >
              {lastSpin.number}
            </span>
            {lastPayout > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#55db9c] text-black font-bold text-[10px]">
                +{formatMoney(lastPayout)}
              </span>
            )}
          </div>
        )}

        <div className="w-full bg-[#0c0d11] border border-zinc-800 rounded-[28px] p-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Fichas Sticker */}
          <div className="flex items-center gap-1.5">
            {chipsSpec.map((c) => {
              const isSelected = selectedChip === c.val;
              return (
                <button
                  key={`chip-${c.val}`}
                  onClick={() => setSelectedChip(c.val)}
                  className={`w-10 h-10 rounded-full font-extrabold text-xs flex items-center justify-center border transition-transform ${c.bg} ${c.text} ${
                    isSelected
                      ? "border-white scale-110"
                      : "border-black opacity-75 hover:opacity-100"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={onUndoBet}
              disabled={isSpinning || totalBet === 0}
              className="px-3 py-1.5 rounded-full bg-[#14151a] hover:bg-zinc-800 disabled:opacity-40 border border-zinc-700 text-zinc-200 font-bold"
            >
              Deshacer
            </button>
            <button
              onClick={onDoubleBets}
              disabled={isSpinning || totalBet === 0 || balance < totalBet}
              className="px-3 py-1.5 rounded-full bg-[#ffd731] hover:bg-[#facc15] disabled:opacity-40 text-black font-extrabold border border-black"
            >
              2X
            </button>
            <button
              onClick={onClearBets}
              disabled={isSpinning || totalBet === 0}
              className="px-3 py-1.5 rounded-full bg-[#14151a] hover:bg-[#fb4903] disabled:opacity-40 border border-zinc-700 text-zinc-200 hover:text-white font-bold"
            >
              Limpiar
            </button>
          </div>

          {/* CTA Principal: Paper White Pill */}
          <button
            onClick={onSpinSingle}
            disabled={isSpinning}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-[#ffd731] disabled:opacity-50 text-black font-extrabold text-xs tracking-[0.032em] uppercase border border-black flex items-center gap-2 transition-colors"
          >
            {isSpinning ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Girando...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>Girar Ruleta</span>
              </>
            )}
          </button>
        </div>

        {totalBet > 0 && (
          <div className="px-4 py-1.5 rounded-full bg-[#0c0d11] border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between w-full">
            <span>Cubiertas: <strong className="text-[#ffd731]">{betStats.coveredCount}/37</strong></span>
            <span>P(Ganar): <strong className="text-[#55db9c]">{(betStats.winProb * 100).toFixed(1)}%</strong></span>
            <span className="hidden sm:inline">E[X]: <strong>{formatCourseNumber(betStats.expectedValue)}$</strong></span>
          </div>
        )}
      </footer>
    </div>
  );
}
