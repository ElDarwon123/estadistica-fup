"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import confetti from "canvas-confetti";
import {
  RED_NUMBERS,
  BLACK_NUMBERS,
  getNumbersForPreset,
  calculateProbabilityOperations,
  generateRandomSpins,
  calculateRoundResult,
  calculateBetStats,
} from "../lib/probabilityEngine";
import {
  PresetKey,
  SpinRecord,
  MonteCarloDataPoint,
  ChipValue,
} from "../types/probability";
import { audioEngine } from "../lib/audioEngine";
import CasinoTable3D from "../components/CasinoTable3D";
import CasinoEnvironment3D from "../components/CasinoEnvironment3D";
import SoberHUD from "../components/SoberHUD";
import Roulette3DMinimalistHUD, { SpinPersonRecord } from "../components/Roulette3DMinimalistHUD";
import { RouletteParticipant } from "../lib/rouletteTextureGenerator";
import StatCalculator from "../components/StatCalculator";
import { formatStat } from "../lib/statCalculatorEngine";
import { Users, Calculator, Dices, Sun, Moon } from "lucide-react";

// Escena 3D interactiva con iluminación de estudio de casino VIP
function Interactive3DScene({
  isSpinning,
  targetNumber,
  onSpinComplete,
  bets,
  onPlaceBet,
  selectedChip,
  selectedA,
  selectedB,
  activeEvent,
  onToggleNumberEvent,
  theoryMode,
  lastWinningNumber,
  cameraView,
  wheelTheme,
  participants,
  winnerPersonIndex,
  lightBackground = false,
}: {
  isSpinning: boolean;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
  bets: Record<string, number>;
  onPlaceBet: (betKey: string) => void;
  selectedChip: ChipValue;
  selectedA: Set<number>;
  selectedB: Set<number>;
  activeEvent: "A" | "B";
  onToggleNumberEvent: (num: number, target: "A" | "B") => void;
  theoryMode: boolean;
  lastWinningNumber: number | null;
  cameraView: "perspective" | "top" | "closeup";
  wheelTheme: "mahogany" | "obsidian";
  participants?: RouletteParticipant[];
  winnerPersonIndex?: number | null;
  lightBackground?: boolean;
}) {
  const controlsRef = useRef<any>(null);

  // Transiciones de cámara según el botón seleccionado
  useEffect(() => {
    if (!controlsRef.current) return;
    if (cameraView === "top") {
      // Vista cenital directamente sobre el tapete de apuestas (por debajo del techo)
      controlsRef.current.object.position.set(1.15, 4.65, 0.01);
      controlsRef.current.target.set(1.15, 0.46, 0);
    } else if (cameraView === "closeup") {
      // Vista cenital (desde arriba) centrada directamente sobre la ruleta
      controlsRef.current.object.position.set(-2.55, 3.25, 0.01);
      controlsRef.current.target.set(-2.55, 0.46, 0);
    } else {
      // Vista general 3D (Ángulo cinematográfico con perspectiva al salón de casino y candelabros)
      controlsRef.current.object.position.set(-0.5, 3.2, 4.9);
      controlsRef.current.target.set(0.3, 0.42, 0);
    }
    controlsRef.current.update();
  }, [cameraView]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.35,
        antialias: true,
      }}
      className="w-full h-full select-none"
    >
      <PerspectiveCamera makeDefault position={[-0.5, 3.2, 4.9]} fov={48} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={2.0}
        maxDistance={12.0}
        maxPolarAngle={Math.PI / 2.05} // Evita sumergirse por debajo del suelo
      />

      {/* Color de fondo del entorno 3D adaptativo */}
      <color attach="background" args={[lightBackground ? "#0f172a" : "#09090b"]} />

      {/* 1. Fondo, Salón y Alfombra de Casino 3D */}
      <Suspense fallback={null}>
        <CasinoEnvironment3D />
      </Suspense>

      {/* 2. Micro-partículas doradas flotantes en suspensión */}
      <Sparkles
        count={35}
        scale={[12, 5, 8]}
        position={[0, 2.5, 0]}
        size={2.5}
        speed={0.3}
        opacity={lightBackground ? 0.25 : 0.35}
        color={lightBackground ? "#a855f7" : "#facc15"}
      />

      {/* 3. Iluminación cálida de casino de alta potencia y visibilidad */}
      {/* Luz ambiental que llena el espacio */}
      <ambientLight intensity={lightBackground ? 2.8 : 1.7} color={lightBackground ? "#ffffff" : "#fff2db"} />

      {/* Candelabro cenital principal sobre la mesa de casino */}
      <spotLight
        position={[0, 9.5, 2]}
        angle={0.82}
        penumbra={0.7}
        intensity={5.5}
        color="#fff7e0"
        castShadow
        shadow-mapSize={2048}
        shadow-bias={-0.0001}
      />

      {/* Foco directo potente sobre la ruleta: resalta caoba, oro y casillas */}
      <spotLight
        position={[-2.55, 8.2, 1.2]}
        angle={0.55}
        penumbra={0.6}
        intensity={4.8}
        color="#ffecc0"
        castShadow
        shadow-mapSize={1024}
      />

      {/* Foco directo potente sobre el paño de apuestas para números cristalinos */}
      <spotLight
        position={[1.2, 8.2, 1.2]}
        angle={0.7}
        penumbra={0.6}
        intensity={4.8}
        color="#fff8e7"
        castShadow
        shadow-mapSize={1024}
      />

      {/* Luz direccional frontal para iluminar el lateral y bisel de la mesa */}
      <directionalLight position={[1, 7, 7]} intensity={1.8} color="#fff3db" />

      {/* Contraluz (rim light) para recortar con elegancia la silueta de la mesa */}
      <directionalLight position={[-2, 6, -6]} intensity={1.4} color="#fde68a" />

      {/* Luces puntuales doradas de ambiente */}
      <pointLight position={[-4.5, 3.5, 0]} intensity={2.5} color="#f59e0b" distance={10} />
      <pointLight position={[4.5, 3.5, 0]} intensity={2.5} color="#f59e0b" distance={10} />
      <pointLight position={[0, 4, -3]} intensity={3.0} color="#fbbf24" distance={10} />
      <pointLight position={[0, 4, 3]} intensity={2.2} color="#fbbf24" distance={10} />

      {/* La Mesa de Casino 3D Interactiva */}
      <CasinoTable3D
        isSpinning={isSpinning}
        targetNumber={targetNumber}
        onSpinComplete={onSpinComplete}
        bets={bets}
        onPlaceBet={onPlaceBet}
        selectedChip={selectedChip}
        selectedA={selectedA}
        selectedB={selectedB}
        activeEvent={activeEvent}
        onToggleNumberEvent={onToggleNumberEvent}
        theoryMode={theoryMode}
        lastWinningNumber={lastWinningNumber}
        wheelTheme={wheelTheme}
        participants={participants}
        winnerPersonIndex={winnerPersonIndex}
      />
    </Canvas>
  );
}

export default function RoyaleProbabilityPage() {
  // 0. CONTROL DE PROGRAMA ACTIVO (ENTREGABLES DEL CURSO DE ESTADÍSTICA)
  const [activeTab, setActiveTab] = useState<"roulette_person" | "stat_calculator" | "roulette_3d">("roulette_person");
  // Toggle de Fondo Claro adaptativo para el HUD Liquid Iridescence y el entorno 3D
  const [lightBackground, setLightBackground] = useState<boolean>(false);

  // Soporte para deep-linking mediante parámetro en la URL (?tab=calc / ?tab=3d / ?tab=roulette)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "calc" || tab === "stat_calculator") setActiveTab("stat_calculator");
      else if (tab === "3d" || tab === "roulette_3d") setActiveTab("roulette_3d");
      else if (tab === "roulette" || tab === "roulette_person") setActiveTab("roulette_person");

      const light = params.get("light");
      if (light === "1" || light === "true") setLightBackground(true);
    }
  }, []);

  // =========================================================================
  // PROGRAMA 1: ESTADO DE RULETA 3D DE SELECCIÓN DE PERSONAS
  // =========================================================================
  const [participants, setParticipants] = useState<RouletteParticipant[]>([
    { id: "1", name: "Valentina", active: true },
    { id: "2", name: "Alejandro", active: true },
    { id: "3", name: "Camila", active: true },
    { id: "4", name: "Sebastián", active: true },
    { id: "5", name: "Mariana", active: true },
    { id: "6", name: "Santiago", active: true },
    { id: "7", name: "Isabella", active: true },
    { id: "8", name: "Mateo", active: true },
  ]);
  const [selectionMode, setSelectionMode] = useState<"con_reemplazo" | "sin_reemplazo">("con_reemplazo");
  const [winnerPersonIndex, setWinnerPersonIndex] = useState<number | null>(null);
  const [winnerPersonModal, setWinnerPersonModal] = useState<{
    name: string;
    probability: string;
    round: number;
  } | null>(null);
  const [personHistory, setPersonHistory] = useState<SpinPersonRecord[]>([]);

  const activeParticipants = useMemo(() => {
    return participants.filter((p) => p.active);
  }, [participants]);

  const handleAddParticipant = useCallback((name: string) => {
    setParticipants((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random(), name, active: true },
    ]);
  }, []);

  const handleBulkAdd = useCallback((names: string[]) => {
    const newItems: RouletteParticipant[] = names.map((name) => ({
      id: Date.now().toString() + Math.random(),
      name,
      active: true,
    }));
    setParticipants((prev) => [...prev, ...newItems]);
  }, []);

  const handleToggleParticipant = useCallback((id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }, []);

  const handleDeleteParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleActivateAll = useCallback(() => {
    setParticipants((prev) => prev.map((p) => ({ ...p, active: true })));
  }, []);

  // 1. ESTADO DEL JUEGO DE CASINO (EL JUEGO COMPLETO)
  const [balance, setBalance] = useState<number>(2500);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(5);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [betHistoryStack, setBetHistoryStack] = useState<{ key: string; amount: number }[]>([]);
  const [lastRoundBets, setLastRoundBets] = useState<Record<string, number>>({});
  const [lastPayout, setLastPayout] = useState<number>(0);
  const [lastWinningNumber, setLastWinningNumber] = useState<number | null>(null);
  const [wheelTheme, setWheelTheme] = useState<"mahogany" | "obsidian">("mahogany");

  // 2. ESTADO DE EVENTOS MATEMÁTICOS (LAPLACE Y CONDICIONAL)
  const [selectedA, setSelectedA] = useState<Set<number>>(() => getNumbersForPreset("red"));
  const [selectedB, setSelectedB] = useState<Set<number>>(() => getNumbersForPreset("even"));
  const [activeEvent, setActiveEvent] = useState<"A" | "B">("A");
  const [theoryMode, setTheoryMode] = useState<boolean>(false);

  // 3. CONTROL DE GIRO Y CÁMARA 3D
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetNumber, setTargetNumber] = useState<number | null>(0);
  const [cameraView, setCameraView] = useState<"perspective" | "top" | "closeup">("perspective");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 4. HISTORIAL Y MONTE CARLO
  const [history, setHistory] = useState<SpinRecord[]>([]);
  const [monteCarloPoints, setMonteCarloPoints] = useState<MonteCarloDataPoint[]>([]);

  // 5. CÁLCULO DE PROBABILIDADES Y ESPERANZA MATEMÁTICA
  const betStats = useMemo(() => calculateBetStats(bets), [bets]);
  const stats = useMemo(
    () => calculateProbabilityOperations(selectedA, selectedB),
    [selectedA, selectedB]
  );

  // MANEJADORES DE APUESTAS DE CASINO
  const handlePlaceBet = useCallback(
    (key: string) => {
      if (balance < selectedChip) return;

      setBalance((prev) => prev - selectedChip);
      setBets((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + selectedChip,
      }));
      setBetHistoryStack((prev) => [...prev, { key, amount: selectedChip }]);
    },
    [balance, selectedChip]
  );

  const handleClearBets = useCallback(() => {
    if (betStats.totalBet <= 0) return;
    setBalance((prev) => prev + betStats.totalBet);
    setBets({});
    setBetHistoryStack([]);
  }, [betStats.totalBet]);

  const handleDoubleBets = useCallback(() => {
    if (betStats.totalBet <= 0 || balance < betStats.totalBet) return;
    setBalance((prev) => prev - betStats.totalBet);
    setBets((prev) => {
      const next: Record<string, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[k] = v * 2;
      });
      return next;
    });
  }, [balance, betStats.totalBet]);

  const handleUndoBet = useCallback(() => {
    if (betHistoryStack.length === 0) return;
    const lastAction = betHistoryStack[betHistoryStack.length - 1];

    setBalance((prev) => prev + lastAction.amount);
    setBets((prev) => {
      const cur = prev[lastAction.key] || 0;
      const nextVal = cur - lastAction.amount;
      const next = { ...prev };
      if (nextVal <= 0) {
        delete next[lastAction.key];
      } else {
        next[lastAction.key] = nextVal;
      }
      return next;
    });
    setBetHistoryStack((prev) => prev.slice(0, -1));
  }, [betHistoryStack]);

  const handleRebet = useCallback(() => {
    const totalNeeded = Object.values(lastRoundBets).reduce((a, b) => a + b, 0);
    if (totalNeeded <= 0 || balance < totalNeeded) return;

    setBalance((prev) => prev - totalNeeded);
    setBets({ ...lastRoundBets });
  }, [balance, lastRoundBets]);

  // MANEJADORES DE EVENTOS A Y B
  const handleApplyPreset = useCallback((preset: PresetKey, target: "A" | "B") => {
    const newSet = getNumbersForPreset(preset);
    if (target === "A") setSelectedA(newSet);
    else setSelectedB(newSet);
  }, []);

  const handleToggleNumberEvent = useCallback((num: number, target: "A" | "B") => {
    if (target === "A") {
      setSelectedA((prev) => {
        const next = new Set(prev);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        return next;
      });
    } else {
      setSelectedB((prev) => {
        const next = new Set(prev);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        return next;
      });
    }
  }, []);

  const handleClearEvent = useCallback((target: "A" | "B") => {
    if (target === "A") setSelectedA(new Set());
    else setSelectedB(new Set());
  }, []);

  const handleInvertEvent = useCallback((target: "A" | "B") => {
    const invert = (prev: Set<number>) => {
      const next = new Set<number>();
      for (let i = 0; i <= 36; i++) {
        if (!prev.has(i)) next.add(i);
      }
      return next;
    };
    if (target === "A") setSelectedA((prev) => invert(prev));
    else setSelectedB((prev) => invert(prev));
  }, []);

  // GIRO DE RULETA 3D Y LIQUIDACIÓN
  const handleSpinSingle = useCallback(() => {
    if (isSpinning) return;
    const winningNum = Math.floor(Math.random() * 37);
    setTargetNumber(winningNum);
    setIsSpinning(true);
    setLastPayout(0);
  }, [isSpinning]);

  const handleSpinComplete = useCallback(
    (winningNum: number) => {
      setIsSpinning(false);
      setLastWinningNumber(winningNum);

      // 1. Liquidación de apuestas del casino
      const roundResult = calculateRoundResult(bets, winningNum);
      if (roundResult.totalPayout > 0) {
        setBalance((prev) => prev + roundResult.totalPayout);
        setLastPayout(roundResult.totalPayout);
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.65 },
          colors: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899"],
        });
        setTimeout(() => audioEngine.playWinChime(), 150);
      }

      // Guardar apuestas para botón Rebet y limpiar mesa para la siguiente ronda
      setLastRoundBets({ ...bets });
      setBets({});
      setBetHistoryStack([]);

      // 2. Registro estadístico y pedagógico
      const inA = selectedA.has(winningNum);
      const inB = selectedB.has(winningNum);
      const inIntersection = inA && inB;

      let color: "green" | "red" | "black" = "green";
      if (RED_NUMBERS.has(winningNum)) color = "red";
      else if (BLACK_NUMBERS.has(winningNum)) color = "black";

      const record: SpinRecord = {
        id: `${Date.now()}-${Math.random()}`,
        number: winningNum,
        color,
        timestamp: Date.now(),
        inA,
        inB,
        inIntersection,
      };

      setHistory((prev) => [record, ...prev]);

      // 3. Punto de Monte Carlo
      setMonteCarloPoints((prev) => {
        const iteration = prev.length + 1;
        const prevSuccesses = prev.length > 0 ? prev[prev.length - 1].successesA : 0;
        const curSuccesses = prevSuccesses + (inA ? 1 : 0);
        return [
          ...prev,
          {
            iteration,
            spinResult: winningNum,
            successesA: curSuccesses,
            empiricalFreqA: curSuccesses / iteration,
            theoreticalPA: stats.probA,
          },
        ];
      });
    },
    [bets, selectedA, selectedB, stats.probA]
  );

  // GIROS POR LOTES PARA MONTE CARLO
  const handleSpinBatch = useCallback(
    (count: number) => {
      if (isSpinning) return;
      const batch = generateRandomSpins(count);

      setMonteCarloPoints((prev) => {
        let curSuccesses = prev.length > 0 ? prev[prev.length - 1].successesA : 0;
        const newPoints: MonteCarloDataPoint[] = [];

        batch.forEach((num, idx) => {
          const iter = prev.length + idx + 1;
          if (selectedA.has(num)) curSuccesses++;
          newPoints.push({
            iteration: iter,
            spinResult: num,
            successesA: curSuccesses,
            empiricalFreqA: curSuccesses / iter,
            theoreticalPA: stats.probA,
          });
        });

        return [...prev, ...newPoints];
      });

      const newRecords: SpinRecord[] = batch.slice(-10).map((num, i) => {
        let color: "green" | "red" | "black" = "green";
        if (RED_NUMBERS.has(num)) color = "red";
        else if (BLACK_NUMBERS.has(num)) color = "black";
        return {
          id: `batch-${Date.now()}-${i}`,
          number: num,
          color,
          timestamp: Date.now(),
          inA: selectedA.has(num),
          inB: selectedB.has(num),
          inIntersection: selectedA.has(num) && selectedB.has(num),
        };
      });

      setHistory((prev) => [...newRecords.reverse(), ...prev]);
      const lastNum = batch[batch.length - 1];
      setTargetNumber(lastNum);
      setLastWinningNumber(lastNum);
      audioEngine.playWinChime();
    },
    [isSpinning, selectedA, selectedB, stats.probA]
  );

  const handleResetMonteCarlo = useCallback(() => {
    setMonteCarloPoints([]);
    setHistory([]);
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  }, [isMuted]);

  // =========================================================================
  // PROGRAMA 1: GIRO Y FÍSICA EN RULETA 3D DE PERSONAS
  // =========================================================================
  const handleSpin3DPerson = useCallback(() => {
    if (isSpinning || activeParticipants.length === 0) return;
    const winnerIdx = Math.floor(Math.random() * activeParticipants.length);
    setWinnerPersonIndex(winnerIdx);
    setIsSpinning(true);
    setWinnerPersonModal(null);
    audioEngine.playChipSound();
  }, [isSpinning, activeParticipants]);

  const handleSpin3DPersonComplete = useCallback(
    (winningIdx: number) => {
      setIsSpinning(false);
      const winnerPerson = activeParticipants[winningIdx];
      if (!winnerPerson) return;

      audioEngine.playWinChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d97706", "#059669", "#2563eb", "#dc2626"],
      });

      const N = activeParticipants.length;
      const rec: SpinPersonRecord = {
        id: Math.random().toString(),
        roundNumber: personHistory.length + 1,
        winnerName: winnerPerson.name,
        nAtSpin: N,
        theoreticalProb: 1 / N,
        timestamp: new Date().toLocaleTimeString(),
        mode: selectionMode,
      };

      setPersonHistory((prev) => [rec, ...prev]);
      setWinnerPersonModal({
        name: winnerPerson.name,
        probability: `1/${N} (${formatStat((1 / N) * 100)}%)`,
        round: rec.roundNumber,
      });

      if (selectionMode === "sin_reemplazo") {
        setTimeout(() => {
          setParticipants((prev) =>
            prev.map((p) => (p.id === winnerPerson.id ? { ...p, active: false } : p))
          );
        }, 1600);
      }
    },
    [activeParticipants, selectionMode, personHistory.length]
  );

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col overflow-hidden font-sans select-none bg-[#09090b] text-white">
      {/* BARRA SUPERIOR DE NAVEGACIÓN (SLUSH DARK PILL NAV) */}
      <header className="z-50 flex-shrink-0 px-4 py-2.5 flex items-center justify-between bg-[#09090b] border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-black text-black flex items-center justify-center font-black text-sm">
            Ω
          </div>
          <span className="text-xs font-extrabold tracking-[0.032em] uppercase text-white">
            Royale Probability 3D
          </span>
        </div>

        {/* SELECTOR DE PESTAÑAS EN PÍLDORAS (1600px radius) */}
        <nav className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("roulette_person")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.03em] border transition-colors ${
              activeTab === "roulette_person"
                ? "bg-white text-black border-black"
                : "bg-[#14151a] text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ruleta Personas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stat_calculator")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.03em] border transition-colors ${
              activeTab === "stat_calculator"
                ? "bg-white text-black border-black"
                : "bg-[#14151a] text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roulette_3d")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-[0.03em] border transition-colors ${
              activeTab === "roulette_3d"
                ? "bg-white text-black border-black"
                : "bg-[#14151a] text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white"
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Ruleta Casino</span>
          </button>
        </nav>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA ACTIVA */}
      <main className="relative flex-1 overflow-hidden">
        {/* PROGRAMA 1: RULETA 3D DE SELECCIÓN ALEATORIA DE PERSONAS */}
        {activeTab === "roulette_person" && (
          <div className="relative w-full h-full overflow-hidden">
            {/* ESCENA 3D DEL CASINO CON LA MESA Y RULETA DE PERSONAS */}
            <div className="absolute inset-0 z-0">
              <Interactive3DScene
                isSpinning={isSpinning}
                targetNumber={winnerPersonIndex}
                onSpinComplete={handleSpin3DPersonComplete}
                bets={{}}
                onPlaceBet={() => {}}
                selectedChip={selectedChip}
                selectedA={selectedA}
                selectedB={selectedB}
                activeEvent={activeEvent}
                onToggleNumberEvent={() => {}}
                theoryMode={false}
                lastWinningNumber={winnerPersonIndex}
                cameraView={cameraView}
                wheelTheme={wheelTheme}
                participants={participants}
                winnerPersonIndex={winnerPersonIndex}
                lightBackground={lightBackground}
              />
            </div>

            {/* HUD LIQUID IRIDESCENCE DE LA RULETA 3D */}
            <Roulette3DMinimalistHUD
              participants={participants}
              activeParticipants={activeParticipants}
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
              onAddParticipant={handleAddParticipant}
              onBulkAdd={handleBulkAdd}
              onToggleParticipant={handleToggleParticipant}
              onDeleteParticipant={handleDeleteParticipant}
              onActivateAll={handleActivateAll}
              isSpinning={isSpinning}
              onSpin={handleSpin3DPerson}
              cameraView={cameraView}
              setCameraView={setCameraView}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              history={personHistory}
              winnerModal={winnerPersonModal}
              onCloseWinnerModal={() => setWinnerPersonModal(null)}
              lightBackground={lightBackground}
              onToggleLightBackground={() => setLightBackground((prev) => !prev)}
            />
          </div>
        )}

        {/* PROGRAMA 2: CALCULADORA ESTADÍSTICA (HASTA 100 DATOS) */}
        {activeTab === "stat_calculator" && (
          <div className="w-full h-full overflow-y-auto bg-zinc-950 p-2 sm:p-4">
            <StatCalculator />
          </div>
        )}

        {/* SIMULADOR 3D DE CASINO EUROPEO CON FICHAS */}
        {activeTab === "roulette_3d" && (
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Interactive3DScene
                isSpinning={isSpinning}
                targetNumber={targetNumber}
                onSpinComplete={handleSpinComplete}
                bets={bets}
                onPlaceBet={handlePlaceBet}
                selectedChip={selectedChip}
                selectedA={selectedA}
                selectedB={selectedB}
                activeEvent={activeEvent}
                onToggleNumberEvent={handleToggleNumberEvent}
                theoryMode={theoryMode}
                lastWinningNumber={lastWinningNumber}
                cameraView={cameraView}
                wheelTheme={wheelTheme}
                lightBackground={lightBackground}
              />
            </div>

            <SoberHUD
              balance={balance}
              totalBet={betStats.totalBet}
              lastPayout={lastPayout}
              selectedChip={selectedChip}
              setSelectedChip={setSelectedChip}
              onClearBets={handleClearBets}
              onDoubleBets={handleDoubleBets}
              onUndoBet={handleUndoBet}
              onRebet={handleRebet}
              canRebet={Object.keys(lastRoundBets).length > 0}
              betStats={betStats}
              stats={stats}
              selectedA={selectedA}
              selectedB={selectedB}
              activeEvent={activeEvent}
              setActiveEvent={setActiveEvent}
              onApplyPreset={handleApplyPreset}
              onClearEvent={handleClearEvent}
              onInvertEvent={handleInvertEvent}
              theoryMode={theoryMode}
              setTheoryMode={setTheoryMode}
              isSpinning={isSpinning}
              onSpinSingle={handleSpinSingle}
              history={history}
              cameraView={cameraView}
              setCameraView={setCameraView}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          </div>
        )}
      </main>
    </div>
  );
}
