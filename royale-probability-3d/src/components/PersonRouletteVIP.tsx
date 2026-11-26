"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Play,
  RotateCcw,
  Users,
  Trophy,
  History,
  Trash2,
  Plus,
  Upload,
  UserCheck,
  UserX,
  Shuffle,
  Percent,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { formatStat, toIrreducibleFraction } from "../lib/statCalculatorEngine";
import { audioEngine } from "../lib/audioEngine";

// Paleta de colores de casino VIP para los sectores de la ruleta
const VIP_SECTOR_COLORS = [
  { bg: "#064e3b", text: "#a7f3d0", border: "#10b981" }, // Verde Esmeralda VIP
  { bg: "#7f1d1d", text: "#fecaca", border: "#ef4444" }, // Rojo Rubí Real
  { bg: "#78350f", text: "#fef08a", border: "#f59e0b" }, // Oro y Ámbar
  { bg: "#1e1b4b", text: "#c7d2fe", border: "#6366f1" }, // Zafiro Profundo
  { bg: "#581c87", text: "#f5d0fe", border: "#c084fc" }, // Púrpura Imperial
  { bg: "#14532d", text: "#bbf7d0", border: "#22c55e" }, // Verde Menta Casino
  { bg: "#831843", text: "#fbcfe8", border: "#ec4899" }, // Magenta Seda
  { bg: "#0f172a", text: "#e2e8f0", border: "#94a3b8" }, // Negro Obsidiana
];

interface Participant {
  id: string;
  name: string;
  active: boolean;
}

interface SpinRecord {
  id: string;
  roundNumber: number;
  winnerName: string;
  nAtSpin: number;
  theoreticalProb: number;
  timestamp: string;
  mode: "con_reemplazo" | "sin_reemplazo";
}

export default function PersonRouletteVIP() {
  // Lista inicial de personas por defecto
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "Valentina", active: true },
    { id: "2", name: "Alejandro", active: true },
    { id: "3", name: "Camila", active: true },
    { id: "4", name: "Sebastián", active: true },
    { id: "5", name: "Mariana", active: true },
    { id: "6", name: "Mateo", active: true },
    { id: "7", name: "Isabella", active: true },
    { id: "8", name: "Santiago", active: true },
  ]);

  // Modo de selección: Con reemplazo (normal) vs Sin reemplazo (eliminación)
  const [selectionMode, setSelectionMode] = useState<"con_reemplazo" | "sin_reemplazo">("con_reemplazo");

  // Entrada de texto para agregar participantes
  const [newNameInput, setNewNameInput] = useState("");
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Estado del giro
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [winnerModal, setWinnerModal] = useState<{ name: string; probability: string; round: number } | null>(null);

  // Historial de giros
  const [history, setHistory] = useState<SpinRecord[]>([]);

  // Referencias canvas y animación
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Participantes activos (Espacio muestral Omega)
  const activeParticipants = useMemo(
    () => participants.filter((p) => p.active),
    [participants]
  );
  const N = activeParticipants.length;

  // Ángulo de cada sector: theta = 360 / N
  const sectorAngleDeg = N > 0 ? 360 / N : 0;
  const sectorAngleRad = N > 0 ? (2 * Math.PI) / N : 0;

  // Probabilidad clásica individual (Regla de Laplace)
  const theoreticalProb = N > 0 ? 1 / N : 0;
  const theoreticalFraction = N > 0 ? toIrreducibleFraction(1, N) : "0";
  const theoreticalPct = N > 0 ? formatStat(theoreticalProb * 100) : "0";
  const theoreticalDecimal = N > 0 ? formatStat(theoreticalProb) : "0";

  // Frecuencias empíricas a partir del historial
  const empiricalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      counts[h.winnerName] = (counts[h.winnerName] || 0) + 1;
    });
    return counts;
  }, [history]);

  // Dibujar la ruleta en el Canvas 2D VIP
  const drawWheel = useCallback(
    (rotationAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 24;

      ctx.clearRect(0, 0, size, size);

      // Si no hay participantes activos
      if (N === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#475569";
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Sin participantes activos", center, center);
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((rotationAngle * Math.PI) / 180);

      // Dibujar cada sector equitativo
      for (let i = 0; i < N; i++) {
        const startAng = i * sectorAngleRad;
        const endAng = startAng + sectorAngleRad;
        const color = VIP_SECTOR_COLORS[i % VIP_SECTOR_COLORS.length];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAng, endAng);
        ctx.closePath();

        // Gradiente radial de lujo para cada sector
        const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
        grad.addColorStop(0, color.bg);
        grad.addColorStop(1, "#0a0a0f");
        ctx.fillStyle = grad;
        ctx.fill();

        // Borde dorado entre sectores
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#eab308";
        ctx.stroke();

        // Texto del nombre de la persona en el sector
        ctx.save();
        ctx.rotate(startAng + sectorAngleRad / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";

        // Ajuste de tamaño de fuente según el número de participantes
        const fontSize = Math.max(10, Math.min(16, Math.floor(220 / N)));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 6;

        // Truncar nombre si es muy largo
        const pName = activeParticipants[i].name;
        const displayName = pName.length > 14 ? pName.slice(0, 13) + "…" : pName;
        ctx.fillText(displayName, radius - 28, 0);
        ctx.restore();
      }

      // Anillo exterior dorado biselado de casino
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.lineWidth = 14;
      const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      rimGrad.addColorStop(0, "#ca8a04");
      rimGrad.addColorStop(0.5, "#fef08a");
      rimGrad.addColorStop(1, "#854d0e");
      ctx.strokeStyle = rimGrad;
      ctx.stroke();

      // Bulbos luminosos alrededor del bisel exterior
      const bulbCount = Math.max(16, N * 2);
      for (let b = 0; b < bulbCount; b++) {
        const bAng = (b * 2 * Math.PI) / bulbCount;
        const bx = Math.cos(bAng) * (radius + 2);
        const by = Math.sin(bAng) * (radius + 2);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, 2 * Math.PI);
        ctx.fillStyle = b % 2 === 0 ? "#fef08a" : "#ffffff";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      // Eje central dorado con relieve metálico
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, 2 * Math.PI);
      const hubGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 42);
      hubGrad.addColorStop(0, "#fef08a");
      hubGrad.addColorStop(0.6, "#ca8a04");
      hubGrad.addColorStop(1, "#451a03");
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Emblema Omega en el centro
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#18181b";
      ctx.font = "bold 22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Ω", 0, 0);

      ctx.restore();
    },
    [N, activeParticipants, sectorAngleRad]
  );

  // Redibujar rueda al cambiar participantes o rotación
  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation]);

  // Manejador del giro con física de desaceleración realista
  const spinWheel = () => {
    if (isSpinning || N === 0) return;

    audioEngine.playChipSound();
    setIsSpinning(true);
    setWinnerModal(null);

    // Selección aleatoria equiprobable: índice ganador de 0 a N-1
    const winnerIndex = Math.floor(Math.random() * N);
    const winnerPerson = activeParticipants[winnerIndex];

    // El puntero está fijo en la parte superior (270 grados en canvas estándar)
    // Para que el sector `winnerIndex` quede en el puntero (top = 270 deg)
    // Ángulo medio del sector = winnerIndex * sectorAngleDeg + sectorAngleDeg / 2
    // FinalRotation % 360 = (270 - sectorMidAngle) % 360
    const sectorMidAngle = winnerIndex * sectorAngleDeg + sectorAngleDeg / 2;
    const targetSectorOffset = (270 - sectorMidAngle + 360) % 360;

    // Giros completos (5 a 8 vueltas completas para emoción física)
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const currentBase = Math.floor(currentRotation / 360) * 360;
    const targetAngle = currentBase + extraSpins + targetSectorOffset;

    const startAngle = currentRotation;
    const totalDelta = targetAngle - startAngle;
    const duration = 5500; // 5.5 segundos de desaceleración realista
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Easing cúbico hacia afuera (Cubic Out / Quintic Out para frenado físico suave)
      const ease = 1 - Math.pow(1 - progress, 4);
      const angle = startAngle + totalDelta * ease;

      // Sonido de clic mecánico cuando el puntero pasa por un sector
      if (Math.abs(angle - lastTickAngle) >= sectorAngleDeg * 0.95) {
        audioEngine.playFretTick();
        lastTickAngle = angle;
      }

      setCurrentRotation(angle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Giro completado exitosamente
        setIsSpinning(false);
        audioEngine.playWinChime();

        // Confeti de celebración
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#facc15", "#10b981", "#ef4444", "#38bdf8"],
        });

        // Registrar en historial
        const newRecord: SpinRecord = {
          id: Math.random().toString(),
          roundNumber: history.length + 1,
          winnerName: winnerPerson.name,
          nAtSpin: N,
          theoreticalProb: 1 / N,
          timestamp: new Date().toLocaleTimeString(),
          mode: selectionMode,
        };
        setHistory((prev) => [newRecord, ...prev]);

        // Mostrar modal de ganador
        setWinnerModal({
          name: winnerPerson.name,
          probability: `${theoreticalFraction} (${theoreticalPct}%)`,
          round: newRecord.roundNumber,
        });

        // Si estamos en MODO SIN REEMPLAZO: eliminar automáticamente a la persona para el siguiente giro
        if (selectionMode === "sin_reemplazo") {
          setTimeout(() => {
            setParticipants((prev) =>
              prev.map((p) => (p.id === winnerPerson.id ? { ...p, active: false } : p))
            );
          }, 1800);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Agregar participante individual
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNameInput.trim();
    if (!trimmed) return;
    setParticipants((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), name: trimmed, active: true },
    ]);
    setNewNameInput("");
  };

  // Agregar en lote (pegar lista)
  const handleApplyBulk = () => {
    const rawTokens = bulkTextInput.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (rawTokens.length === 0) return;
    const newItems: Participant[] = rawTokens.map((name) => ({
      id: Date.now().toString() + Math.random(),
      name,
      active: true,
    }));
    setParticipants((prev) => [...prev, ...newItems]);
    setBulkTextInput("");
    setShowBulkModal(false);
  };

  // Carga de archivo TXT o CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const names = text.split(/[\n,;\r]+/).map((s) => s.trim()).filter(Boolean);
      const newItems: Participant[] = names.map((name) => ({
        id: Date.now().toString() + Math.random(),
        name,
        active: true,
      }));
      setParticipants(newItems);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Toggle activo/inactivo
  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  // Eliminar participante
  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // Reiniciar a todos activos
  const activateAll = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, active: true })));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-slate-100">
      {/* Encabezado VIP de la ruleta de personas */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 text-amber-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PROGRAMA 1 • CURSO DE ESTADÍSTICA
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> RULETA CASINO VIP
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400">
              Ruleta de Casino para Selección Aleatoria de Personas
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Simulador formal de selección aleatoria con división equitativa de sectores,
              telemetría en tiempo real bajo la regla clásica de Laplace e historial empírico.
            </p>
          </div>

          {/* Selector de Modo: Con Reemplazo vs Sin Reemplazo */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-amber-500/30 flex flex-col gap-1.5 self-start md:self-auto">
            <span className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider px-1">
              Modo de Selección Probabilística:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectionMode("con_reemplazo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectionMode === "con_reemplazo"
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Con Reemplazo (P cte)
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode("sin_reemplazo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectionMode === "sin_reemplazo"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Sin Reemplazo (Eliminación)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de telemetría probabilística en tiempo real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Espacio Muestral */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" /> Espacio Muestral (Ω)
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
              |Ω| = {N}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{N} Participantes</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {N > 0 ? "Elementos equiprobables activos" : "Sin participantes activos"}
          </p>
        </div>

        {/* Probabilidad Clásica Laplace (Fracción Irreducible) */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-400" /> Regla de Laplace
            </span>
            <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
              P = 1 / N
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {theoreticalFraction}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fracción irreducible por persona
          </p>
        </div>

        {/* Probabilidad Decimal y Porcentaje */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Decimal y Porcentaje
            </span>
            <span className="text-xs text-amber-400 font-mono">P(i)</span>
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {theoreticalPct}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Decimal: {theoreticalDecimal} (máx 3 dec)
          </p>
        </div>

        {/* Geometría de Sector Equitativo */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Ángulo de Sector (θ)
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              360° / {N || 1}
            </span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {formatStat(sectorAngleDeg)}°
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Garantía visual de equiprobabilidad
          </p>
        </div>
      </div>

      {/* Zona central: ruleta interactiva y panel de participantes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado izquierdo/central: la ruleta y el botón de giro */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative">
          {/* Puntero Superior Dorado Fijo con indicador de aguja */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-5 h-7 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 clip-pointer shadow-xl drop-shadow-[0_4px_8px_rgba(234,179,8,0.6)] animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white -mt-1 shadow-md" />
          </div>

          {/* Lienzo Canvas 2D de la Ruleta */}
          <div className="relative my-2">
            <canvas
              ref={canvasRef}
              width={460}
              height={460}
              className="max-w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Botón Principal de Giro VIP */}
          <div className="w-full max-w-sm mt-4 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={spinWheel}
              disabled={isSpinning || N === 0}
              className={`w-full py-4 px-8 rounded-xl font-black text-lg tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-2xl ${
                isSpinning || N === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-amber-500/25 border-2 border-yellow-200"
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              {isSpinning ? "Girando Ruleta..." : "GIRAR RULETA VIP"}
            </button>

            {selectionMode === "sin_reemplazo" && (
              <span className="text-xs text-red-400/90 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                El ganador será retirado de la ruleta tras el giro.
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho: gestión del espacio muestral y participantes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> Gestión de Participantes ({participants.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={activateAll}
                  title="Activar a todos"
                  className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3" /> Todos
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 bg-sky-950/60 px-2.5 py-1 rounded border border-sky-500/30"
                >
                  Pegar Lista
                </button>
              </div>
            </div>

            {/* Agregar participante rápido */}
            <form onSubmit={handleAddSingle} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder="Nombre de la persona..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-lg font-bold text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </form>

            {/* Carga de archivo TXT / CSV */}
            <div className="mb-4">
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-lg text-xs text-slate-400 hover:text-slate-200 cursor-pointer bg-slate-950/50 transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Cargar archivo con nombres (.txt, .csv)</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Lista lateral de participantes editable */}
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {participants.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No hay participantes. Agrega nombres para comenzar.
                </p>
              ) : (
                participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      p.active
                        ? "bg-slate-950 border border-slate-800 text-slate-200"
                        : "bg-slate-950/40 border border-slate-900 text-slate-600 line-through"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono text-slate-500 w-5">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold truncate">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleParticipant(p.id)}
                        title={p.active ? "Desactivar" : "Activar"}
                        className={`p-1 rounded transition-colors ${
                          p.active
                            ? "text-emerald-400 hover:bg-emerald-950/60"
                            : "text-slate-500 hover:bg-slate-800"
                        }`}
                      >
                        {p.active ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        title="Eliminar"
                        className="p-1 text-red-400 hover:bg-red-950/60 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de historial y probabilidad empírica (frecuencia relativa) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <History className="w-5 h-5" /> Historial de Giros y Probabilidad Empírica
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Frecuencia relativa empírica hi = fi / T comparada con la probabilidad teórica
              clásica bajo la Ley de los Grandes Números.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar Historial
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Aún no se han realizado giros. Presiona "GIRAR RULETA VIP" para iniciar la simulación.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Giro #</th>
                  <th className="py-2.5 px-3">Ganador(a)</th>
                  <th className="py-2.5 px-3">Modo</th>
                  <th className="py-2.5 px-3">Espacio |Ω|</th>
                  <th className="py-2.5 px-3">Prob. Teórica (1/N)</th>
                  <th className="py-2.5 px-3">Veces Ganadas (fi)</th>
                  <th className="py-2.5 px-3">Freq. Empírica (hi)</th>
                  <th className="py-2.5 px-3">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((record) => {
                  const fi = empiricalCounts[record.winnerName] || 1;
                  const hi = fi / history.length;
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-amber-400 font-bold">
                        #{record.roundNumber}
                      </td>
                      <td className="py-2 px-3 font-sans font-bold text-slate-100 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        {record.winnerName}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                            record.mode === "con_reemplazo"
                              ? "bg-amber-950 text-amber-300"
                              : "bg-red-950 text-red-300"
                          }`}
                        >
                          {record.mode === "con_reemplazo" ? "Con Reemplazo" : "Sin Reemplazo"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">
                        N = {record.nAtSpin}
                      </td>
                      <td className="py-2 px-3 text-amber-300">
                        {toIrreducibleFraction(1, record.nAtSpin)} ({formatStat((1 / record.nAtSpin) * 100)}%)
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {fi} vez{fi > 1 ? "ces" : ""}
                      </td>
                      <td className="py-2 px-3 text-sky-400 font-bold">
                        {formatStat(hi)} ({formatStat(hi * 100)}%)
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-sans">
                        {record.timestamp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de ganador celebratorio */}
      {winnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
              ¡SELECCIÓN ALEATORIA GANADORA!
            </span>

            <h3 className="text-3xl font-black text-white mt-3 mb-1 truncate">
              {winnerModal.name}
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Giro #{winnerModal.round} • Probabilidad Clásica de Salida:{" "}
              <span className="text-amber-300 font-bold font-mono">{winnerModal.probability}</span>
            </p>

            {selectionMode === "sin_reemplazo" && (
              <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-2.5 mb-5 text-xs text-red-300">
                Persona eliminada de la ruleta para la siguiente ronda.
              </div>
            )}

            <button
              type="button"
              onClick={() => setWinnerModal(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal para pegar lista en lote */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-amber-300 mb-2">
              Pegar Lista de Participantes
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pega los nombres de las personas separados por saltos de línea, comas o puntos y comas.
            </p>
            <textarea
              rows={6}
              value={bulkTextInput}
              onChange={(e) => setBulkTextInput(e.target.value)}
              placeholder="Juan Pérez&#10;María Gómez&#10;Carlos Ruiz&#10;Laura Torres..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400"
              >
                Cargar Participantes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
