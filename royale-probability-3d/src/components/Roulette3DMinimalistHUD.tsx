"use client";

import React, { useState } from "react";
import {
  Play,
  Users,
  Trophy,
  History,
  Trash2,
  Plus,
  Upload,
  UserCheck,
  UserX,
  X,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatStat, toIrreducibleFraction } from "../lib/statCalculatorEngine";
import { RouletteParticipant } from "../lib/rouletteTextureGenerator";

export interface SpinPersonRecord {
  id: string;
  roundNumber: number;
  winnerName: string;
  nAtSpin: number;
  theoreticalProb: number;
  timestamp: string;
  mode: "con_reemplazo" | "sin_reemplazo";
}

interface Roulette3DMinimalistHUDProps {
  participants: RouletteParticipant[];
  activeParticipants: RouletteParticipant[];
  selectionMode: "con_reemplazo" | "sin_reemplazo";
  setSelectionMode: (mode: "con_reemplazo" | "sin_reemplazo") => void;
  onAddParticipant: (name: string) => void;
  onBulkAdd: (names: string[]) => void;
  onToggleParticipant: (id: string) => void;
  onDeleteParticipant: (id: string) => void;
  onActivateAll: () => void;
  isSpinning: boolean;
  onSpin: () => void;
  cameraView: "perspective" | "top" | "closeup";
  setCameraView: (view: "perspective" | "top" | "closeup") => void;
  isMuted: boolean;
  onToggleMute: () => void;
  history: SpinPersonRecord[];
  winnerModal: { name: string; probability: string; round: number } | null;
  onCloseWinnerModal: () => void;
  lightBackground?: boolean;
  onToggleLightBackground?: () => void;
}

export default function Roulette3DMinimalistHUD({
  participants,
  activeParticipants,
  selectionMode,
  setSelectionMode,
  onAddParticipant,
  onBulkAdd,
  onToggleParticipant,
  onDeleteParticipant,
  onActivateAll,
  isSpinning,
  onSpin,
  cameraView,
  setCameraView,
  isMuted,
  onToggleMute,
  history,
  winnerModal,
  onCloseWinnerModal,
}: Roulette3DMinimalistHUDProps) {
  const [newNameInput, setNewNameInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const N = activeParticipants.length;
  const theoreticalFraction = N > 0 ? toIrreducibleFraction(1, N) : "0";
  const theoreticalDec = N > 0 ? formatStat(1 / N) : "0";
  const theoreticalPct = N > 0 ? formatStat((1 / N) * 100) : "0";
  const sectorAngleDeg = N > 0 ? formatStat(360 / N) : "0";

  const empiricalCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      map[h.winnerName] = (map[h.winnerName] || 0) + 1;
    });
    return map;
  }, [history]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNameInput.trim();
    if (!trimmed) return;
    onAddParticipant(trimmed);
    setNewNameInput("");
  };

  const handleBulkSubmit = () => {
    const tokens = bulkTextInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length > 0) {
      onBulkAdd(tokens);
      setBulkTextInput("");
      setShowBulkModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const names = text.split(/[\n,;\r]+/).map((s) => s.trim()).filter(Boolean);
      if (names.length > 0) {
        onBulkAdd(names);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between font-sans">
      {/* 1. BARRA SUPERIOR: PILL CONTROLS (1600px radius, 0 shadows) */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-[0.03em] bg-[#0c0d11] text-white border border-zinc-700 hover:border-white transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isSidebarOpen ? "Ocultar Panel" : `Participantes (${N})`}</span>
        </button>

        {/* Controles de Cámara, Historial y Audio */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#0c0d11] border border-zinc-800">
          {(["perspective", "closeup", "top"] as const).map((view) => {
            const labels = {
              perspective: "Vista 3D",
              closeup: "Ruleta",
              top: "Tapete",
            };
            const isActive = cameraView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => setCameraView(view)}
                className={`px-3.5 py-1.5 text-xs font-bold tracking-[0.03em] rounded-full transition-colors ${
                  isActive
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {labels[view]}
              </button>
            );
          })}

          <div className="w-[1px] h-4 mx-1 bg-zinc-800" />

          <button
            type="button"
            onClick={() => setShowHistoryDrawer((prev) => !prev)}
            className={`p-1.5 rounded-full transition-colors ${
              showHistoryDrawer
                ? "bg-[#ffd731] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Historial de giros"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#fb4903]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#55db9c]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. PANEL LATERAL IZQUIERDO: DARK SHELL + COLOR-BLOCKED SLUSH STICKERS */}
      {isSidebarOpen && (
        <div className="pointer-events-auto absolute top-16 left-3 sm:left-4 bottom-24 w-80 sm:w-[348px] rounded-[28px] p-4 flex flex-col gap-3 bg-[#0c0d11] text-white border border-zinc-800 overflow-hidden">
          {/* Header compacto */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-extrabold tracking-[-0.01em] text-white">
              Ruleta de Personas
            </h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="w-7 h-7 rounded-full bg-[#181920] border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selector de Modo en Píldora */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#14151a] border border-zinc-800">
            <button
              type="button"
              onClick={() => setSelectionMode("con_reemplazo")}
              className={`py-2 px-3 rounded-full text-[11px] font-bold tracking-[0.03em] uppercase transition-colors ${
                selectionMode === "con_reemplazo"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Con Reemplazo
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("sin_reemplazo")}
              className={`py-2 px-3 rounded-full text-[11px] font-bold tracking-[0.03em] uppercase transition-colors ${
                selectionMode === "sin_reemplazo"
                  ? "bg-[#fb4903] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sin Reemplazo
            </button>
          </div>

          {/* STICKER TELEMETRY BLOCKS (Slush Color-Blocked Palette, 1px #000 border, crushed numbers) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Sticker 1: Electric Blue (#4da2ff) */}
            <div className="p-3.5 rounded-[20px] bg-[#4da2ff] text-black border border-black flex flex-col justify-between">
              <span className="text-[10px] slush-label">Espacio Ω</span>
              <div className="text-[32px] slush-num mt-1">{N}</div>
              <span className="text-[11px] font-semibold mt-1 opacity-80">
                {N === 1 ? "1 activo" : "activos"}
              </span>
            </div>

            {/* Sticker 2: Lavender (#e9ccff) */}
            <div className="p-3.5 rounded-[20px] bg-[#e9ccff] text-black border border-black flex flex-col justify-between">
              <span className="text-[10px] slush-label">Ángulo θ</span>
              <div className="text-[32px] slush-num mt-1">{sectorAngleDeg}°</div>
              <span className="text-[11px] font-semibold mt-1 opacity-80">
                360° / {N || 1}
              </span>
            </div>

            {/* Sticker 3: Mint Pop (#55db9c) — Regla de Laplace */}
            <div className="col-span-2 p-3.5 rounded-[20px] bg-[#55db9c] text-black border border-black flex items-center justify-between">
              <div>
                <span className="text-[10px] slush-label block">
                  Laplace P(i) = 1/N
                </span>
                <div className="text-[26px] slush-num mt-1">
                  {theoreticalFraction}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-extrabold">{theoreticalDec}</div>
                <div className="text-xs font-bold opacity-80">
                  {theoreticalPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Ingreso */}
          <form onSubmit={handleAddSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              placeholder="Agregar participante..."
              className="flex-1 rounded-full px-4 py-2 text-xs bg-[#14151a] text-white border border-zinc-700 outline-none placeholder-zinc-500 focus:border-white transition-colors"
            />
            <button
              type="submit"
              disabled={!newNameInput.trim()}
              className="px-4 py-2 bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-bold text-xs rounded-full flex items-center gap-1 border border-black transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Acciones de Carga Masiva */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="flex-1 py-1.5 px-3 rounded-full text-[11px] font-bold tracking-[0.03em] flex items-center justify-center gap-1.5 bg-[#14151a] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#ffd731]" /> Lista
            </button>
            <label className="flex-1 py-1.5 px-3 rounded-full text-[11px] font-bold tracking-[0.03em] flex items-center justify-center gap-1.5 bg-[#14151a] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#4da2ff]" /> Archivo
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Lista de Participantes con Scrollbar visible */}
          <div
            className="flex-1 overflow-y-scroll space-y-1.5 pr-1.5 border-t border-zinc-800 pt-2.5 min-h-[120px]"
            style={{ scrollbarGutter: "stable" }}
          >
            <div className="flex items-center justify-between text-[10px] px-1 mb-1 slush-label text-zinc-400">
              <span>Lista ({participants.length})</span>
              <button
                type="button"
                onClick={onActivateAll}
                className="text-[#4da2ff] hover:underline"
              >
                Activar Todos
              </button>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">
                Sin participantes.
              </div>
            ) : (
              participants.map((person, idx) => (
                <div
                  key={person.id}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-2xl text-xs border transition-colors ${
                    person.active
                      ? "bg-[#14151a] border-zinc-800 text-zinc-100"
                      : "bg-[#0c0d11] border-zinc-800/60 text-zinc-600 line-through"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-[#ffd731] text-black text-[10px] font-extrabold flex items-center justify-center border border-black">
                      {idx + 1}
                    </span>
                    <span className="truncate font-medium">{person.name}</span>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => onToggleParticipant(person.id)}
                      className={`p-1 rounded-full transition-colors ${
                        person.active
                          ? "text-[#55db9c] hover:bg-zinc-800"
                          : "text-zinc-600 hover:bg-zinc-800"
                      }`}
                      title={person.active ? "Desactivar" : "Activar"}
                    >
                      {person.active ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteParticipant(person.id)}
                      className="p-1 text-zinc-500 hover:text-[#fb4903] rounded-full hover:bg-zinc-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PANEL LATERAL DERECHO: HISTORIAL */}
      {showHistoryDrawer && (
        <div className="pointer-events-auto absolute top-16 right-3 sm:right-4 bottom-24 w-76 rounded-[28px] p-4 flex flex-col gap-3 bg-[#0c0d11] text-white border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs slush-label text-white">
              Historial ({history.length})
            </span>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="w-7 h-7 rounded-full bg-[#181920] border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                Sin giros realizados.
              </div>
            ) : (
              history.map((h, i) => {
                const count = empiricalCounts[h.winnerName] || 1;
                const empFreq = (count / history.length).toFixed(3);
                return (
                  <div
                    key={h.id || i}
                    className="p-3 rounded-[16px] border border-zinc-800 bg-[#14151a] text-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">
                        #{history.length - i}. {h.winnerName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {h.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 font-mono">
                      <span>P = 1/{h.nAtSpin}</span>
                      <span className="text-[#55db9c] font-bold">
                        hi = {count}/{history.length} ({empFreq})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. CTA PRINCIPAL INFERIOR: FILLED PILL BUTTON (Paper White #ffffff, #000000 ink, 0 shadow) */}
      <div className="p-4 flex items-center justify-center pointer-events-auto">
        <button
          type="button"
          onClick={onSpin}
          disabled={isSpinning || N === 0}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-[#ffd731] disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs tracking-[0.032em] uppercase rounded-full border border-black transition-colors"
        >
          {isSpinning ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Girando Ruleta...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black text-black" />
              <span>Girar Ruleta</span>
            </>
          )}
        </button>
      </div>

      {/* 5. MODAL DE GANADOR */}
      {winnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto">
          <div className="rounded-[30px] p-6 max-w-sm w-full text-center bg-[#0c0d11] text-white border border-zinc-700">
            <div className="w-14 h-14 rounded-full bg-[#ffd731] border border-black mx-auto mb-3 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-black" />
            </div>

            <span className="px-3 py-1 rounded-full bg-[#4da2ff] text-black border border-black font-bold text-[10px] uppercase tracking-[0.032em] inline-block mb-2">
              Seleccionado
            </span>

            <h3 className="text-3xl font-extrabold my-1 tracking-[-0.02em] text-white">
              {winnerModal.name}
            </h3>

            <div className="rounded-[20px] p-3.5 my-4 bg-[#55db9c] text-black border border-black">
              <div className="text-[10px] slush-label opacity-80 mb-0.5">
                Probabilidad Laplace
              </div>
              <div className="font-extrabold text-xl slush-num">
                {winnerModal.probability}
              </div>
            </div>

            {selectionMode === "sin_reemplazo" && (
              <p className="text-xs text-[#fb4903] mb-4 font-bold">
                Retirado de la ruleta para el siguiente tiro.
              </p>
            )}

            <button
              type="button"
              onClick={onCloseWinnerModal}
              className="w-full py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-[0.032em] border border-black transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA PEGAR LISTA */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 pointer-events-auto">
          <div className="rounded-[30px] p-6 max-w-md w-full bg-[#0c0d11] text-white border border-zinc-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.03em]">
                Pegar Lista
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="w-7 h-7 rounded-full bg-[#181920] border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={bulkTextInput}
              onChange={(e) => setBulkTextInput(e.target.value)}
              rows={6}
              placeholder="Valentina&#10;Alejandro&#10;Camila..."
              className="w-full p-3 rounded-[20px] bg-[#14151a] text-white border border-zinc-700 font-mono text-xs outline-none focus:border-white"
            />
            <div className="flex gap-2 justify-end mt-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkTextInput.trim()}
                className="px-5 py-2 rounded-full bg-white hover:bg-[#55db9c] disabled:opacity-40 text-black font-bold text-xs border border-black transition-colors"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
