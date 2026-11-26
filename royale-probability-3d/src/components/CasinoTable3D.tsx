"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { audioEngine } from "../lib/audioEngine";
import { generateCasinoFeltTexture } from "../lib/feltTextureGenerator";
import { RouletteParticipant } from "../lib/rouletteTextureGenerator";
import { ChipValue } from "../types/probability";
import RealisticRouletteWheel from "./RealisticRouletteWheel";

interface CasinoTable3DProps {
  isSpinning: boolean;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
  // Apuestas de Casino (Modo Juego Completo)
  bets: Record<string, number>;
  onPlaceBet: (betKey: string) => void;
  selectedChip: ChipValue;
  // Eventos Matemáticos (Modo Teoría A y B)
  selectedA: Set<number>;
  selectedB: Set<number>;
  activeEvent: "A" | "B";
  onToggleNumberEvent: (num: number, target: "A" | "B") => void;
  theoryMode: boolean;
  lastWinningNumber: number | null;
  wheelTheme?: "mahogany" | "obsidian";
  participants?: RouletteParticipant[];
  winnerPersonIndex?: number | null;
}

// Chip 3D multi-denominación de casino realista
function RenderChipStack({
  amount,
  position,
}: {
  amount: number;
  position: [number, number, number];
}) {
  const chips = useMemo(() => {
    let rem = amount;
    const list: { val: number; color: string; ringColor: string }[] = [];

    const denomSpecs = [
      { val: 500, color: "#7e22ce", ringColor: "#facc15" }, // Púrpura real
      { val: 100, color: "#18181b", ringColor: "#facc15" }, // Negro carbón
      { val: 25, color: "#047857", ringColor: "#facc15" },  // Verde esmeralda
      { val: 5, color: "#dc2626", ringColor: "#ffffff" },   // Rojo carmesí
      { val: 1, color: "#1d4ed8", ringColor: "#ffffff" },   // Azul cobalto
    ];

    for (const spec of denomSpecs) {
      const count = Math.floor(rem / spec.val);
      for (let i = 0; i < count; i++) {
        list.push(spec);
        if (list.length >= 6) break;
      }
      rem %= spec.val;
      if (list.length >= 6) break;
    }

    if (list.length === 0 && amount > 0) {
      list.push({ val: 1, color: "#1d4ed8", ringColor: "#ffffff" });
    }

    return list;
  }, [amount]);

  if (amount <= 0 || chips.length === 0) return null;

  return (
    <group position={position}>
      {chips.map((chip, idx) => (
        <group key={`chip-stack-${idx}`} position={[0, idx * 0.024, 0]}>
          {/* Cuerpo cilíndrico principal de la ficha */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.02, 28]} />
            <meshStandardMaterial
              color={chip.color}
              roughness={0.28}
              metalness={0.15}
            />
          </mesh>

          {/* Inserto dorado / blanco perimetral */}
          <mesh position={[0, 0.0105, 0]}>
            <cylinderGeometry args={[0.054, 0.054, 0.002, 28]} />
            <meshStandardMaterial
              color={chip.ringColor}
              roughness={0.18}
              metalness={0.82}
            />
          </mesh>

          {/* Inserto central */}
          <mesh position={[0, 0.0115, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.002, 28]} />
            <meshStandardMaterial
              color={chip.color}
              roughness={0.35}
              metalness={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Componente principal de la mesa 3D
export default function CasinoTable3D({
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
  wheelTheme = "mahogany",
  participants,
  winnerPersonIndex,
}: CasinoTable3DProps) {
  const [hoveredBetKey, setHoveredBetKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Textura procedural del paño (2048 x 1024) generada de forma reactiva en el cliente
  // Solo resalta al ganador en el tapete cuando la ruleta termina de girar
  const feltTexture = useMemo(() => {
    if (!mounted || typeof window === "undefined") return null;
    return generateCasinoFeltTexture(participants, isSpinning ? null : winnerPersonIndex);
  }, [mounted, participants, isSpinning, winnerPersonIndex]);

  // Material de caoba barnizada con brillo cálido y tono rojizo visible
  const mahoganyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a190f",
        roughness: 0.24,
        metalness: 0.12,
      }),
    []
  );

  // Material de latón / oro pulido de alta reflectividad
  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f7c844",
        roughness: 0.14,
        metalness: 0.9,
      }),
    []
  );

  // Material de cuero / acolchado del reposabrazos cálido
  const armrestMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2c120a",
        roughness: 0.38,
        metalness: 0.06,
      }),
    []
  );

  // Dimensiones y centro del paño de apuestas 3D (4.8m ancho x 2.4m fondo)
  const feltCenter = { x: 1.15, z: 0 };
  const feltDims = { w: 4.8, d: 2.4 };
  const feltMinX = feltCenter.x - feltDims.w / 2; // -1.25
  const feltMinZ = feltCenter.z - feltDims.d / 2; // -1.20

  // Convierte coordenadas de píxel del canvas (2048 x 1024) a coordenadas 3D del mundo
  const canvasToWorld = (canvasX: number, canvasY: number) => {
    return {
      x: feltMinX + (canvasX / 2048) * feltDims.w,
      z: feltMinZ + (canvasY / 1024) * feltDims.d,
    };
  };

  // Coordenadas calculadas con precisión para cada casilla del tapete
  const betSlots = useMemo(() => {
    const slots: Record<
      string,
      { x: number; z: number; w: number; d: number; label: string }
    > = {};

    const gridX = 320;
    const gridY = 130;
    const cellW = 115;
    const cellH = 170;
    const zeroW = 160;
    const zeroH = cellH * 3;

    // Cero (0)
    const zeroPos = canvasToWorld(gridX - zeroW / 2, gridY + zeroH / 2);
    slots["num-0"] = {
      x: zeroPos.x,
      z: zeroPos.z,
      w: (zeroW / 2048) * feltDims.w,
      d: (zeroH / 1024) * feltDims.d,
      label: "0",
    };

    // Números 1 a 36 (3 filas x 12 columnas)
    const rows = [
      [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
      [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
      [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    ];

    rows.forEach((row, rIdx) => {
      row.forEach((num, cIdx) => {
        const cx = gridX + cIdx * cellW + cellW / 2;
        const cy = gridY + rIdx * cellH + cellH / 2;
        const pos = canvasToWorld(cx, cy);
        slots[`num-${num}`] = {
          x: pos.x,
          z: pos.z,
          w: (cellW / 2048) * feltDims.w,
          d: (cellH / 1024) * feltDims.d,
          label: num.toString(),
        };
      });
    });

    // Columnas 2 to 1 (extremo derecho)
    const colX = gridX + 12 * cellW + 65;
    const colKeys = ["col3", "col2", "col1"];
    for (let r = 0; r < 3; r++) {
      const cy = gridY + r * cellH + cellH / 2;
      const pos = canvasToWorld(colX, cy);
      slots[colKeys[r]] = {
        x: pos.x,
        z: pos.z,
        w: (130 / 2048) * feltDims.w,
        d: (cellH / 1024) * feltDims.d,
        label: "2:1",
      };
    }

    // Docenas (1st 12, 2nd 12, 3rd 12)
    const dozenY = gridY + 3 * cellH + 18 + 50;
    const dozenW = (12 * cellW) / 3;
    const dozenKeys = ["dozen1", "dozen2", "dozen3"];
    dozenKeys.forEach((key, idx) => {
      const cx = gridX + idx * dozenW + dozenW / 2;
      const pos = canvasToWorld(cx, dozenY);
      slots[key] = {
        x: pos.x,
        z: pos.z,
        w: (dozenW / 2048) * feltDims.w,
        d: (100 / 1024) * feltDims.d,
        label: `${idx + 1}ª Docena`,
      };
    });

    // Apuestas Simples (1-18, EVEN, RED, BLACK, ODD, 19-36)
    const simpleY = gridY + 3 * cellH + 18 + 100 + 18 + 50;
    const simpleW = (12 * cellW) / 6;
    const simpleKeys = ["low", "even", "red", "black", "odd", "high"];
    const simpleLabels = ["1-18", "EVEN", "RED", "BLACK", "ODD", "19-36"];
    simpleKeys.forEach((key, idx) => {
      const cx = gridX + idx * simpleW + simpleW / 2;
      const pos = canvasToWorld(cx, simpleY);
      slots[key] = {
        x: pos.x,
        z: pos.z,
        w: (simpleW / 2048) * feltDims.w,
        d: (100 / 1024) * feltDims.d,
        label: simpleLabels[idx],
      };
    });

    return slots;
  }, []);

  // Manejador unificado de clic en cualquier casilla de la mesa 3D
  const handleSlotClick = (key: string) => {
    if (isSpinning) return;

    if (theoryMode) {
      if (key.startsWith("num-")) {
        const num = parseInt(key.replace("num-", ""), 10);
        onToggleNumberEvent(num, activeEvent);
        audioEngine.playChipSound();
      }
    } else {
      // Modo Casino: Colocar ficha
      onPlaceBet(key);
      audioEngine.playChipSound();
    }
  };

  return (
    <group position={[0, -0.2, 0]}>
      {/* Mueble de la mesa (cajón de caoba maciza continuo) */}
      {/* Cuerpo principal rectangular de madera maciza */}
      <mesh
        position={[0, 0, 0]}
        material={mahoganyMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[7.6, 0.9, 3.2]} />
      </mesh>

      {/* Extremos redondeados semicilíndricos */}
      <mesh
        position={[-3.8, 0, 0]}
        material={mahoganyMaterial}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[1.6, 1.6, 0.9, 32, 1, false, Math.PI / 2, Math.PI]}
        />
      </mesh>
      <mesh
        position={[3.8, 0, 0]}
        material={mahoganyMaterial}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[1.6, 1.6, 0.9, 32, 1, false, -Math.PI / 2, Math.PI]}
        />
      </mesh>

      {/* Doble filete metálico de latón dorado alrededor de la mesa */}
      {/* Filete superior */}
      <mesh position={[0, 0.22, 0]} material={brassMaterial}>
        <boxGeometry args={[7.64, 0.04, 3.24]} />
      </mesh>
      <mesh position={[-3.8, 0.22, 0]} material={brassMaterial}>
        <cylinderGeometry
          args={[1.62, 1.62, 0.04, 32, 1, false, Math.PI / 2, Math.PI]}
        />
      </mesh>
      <mesh position={[3.8, 0.22, 0]} material={brassMaterial}>
        <cylinderGeometry
          args={[1.62, 1.62, 0.04, 32, 1, false, -Math.PI / 2, Math.PI]}
        />
      </mesh>

      {/* Filete inferior */}
      <mesh position={[0, -0.22, 0]} material={brassMaterial}>
        <boxGeometry args={[7.64, 0.04, 3.24]} />
      </mesh>
      <mesh position={[-3.8, -0.22, 0]} material={brassMaterial}>
        <cylinderGeometry
          args={[1.62, 1.62, 0.04, 32, 1, false, Math.PI / 2, Math.PI]}
        />
      </mesh>
      <mesh position={[3.8, -0.22, 0]} material={brassMaterial}>
        <cylinderGeometry
          args={[1.62, 1.62, 0.04, 32, 1, false, -Math.PI / 2, Math.PI]}
        />
      </mesh>

      {/* Pedestal cilíndrico de soporte inferior */}
      <mesh position={[0, -0.85, 0]} material={mahoganyMaterial} receiveShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.8, 36]} />
      </mesh>
      <mesh position={[0, -1.23, 0]} material={brassMaterial}>
        <cylinderGeometry args={[1.6, 1.6, 0.06, 36]} />
      </mesh>

      {/* Reposabrazos / barandas perimetrales */}
      {/* Baranda Trasera (Superior) */}
      <mesh
        position={[0, 0.52, -1.5]}
        material={armrestMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[7.6, 0.14, 0.22]} />
      </mesh>
      {/* Baranda Delantera (Inferior) */}
      <mesh
        position={[0, 0.52, 1.5]}
        material={armrestMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[7.6, 0.14, 0.22]} />
      </mesh>
      {/* Baranda Izquierda */}
      <mesh
        position={[-3.7, 0.52, 0]}
        material={armrestMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.22, 0.14, 3.22]} />
      </mesh>
      {/* Baranda Derecha */}
      <mesh
        position={[3.7, 0.52, 0]}
        material={armrestMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.22, 0.14, 3.22]} />
      </mesh>
      {/* Divisorio de madera entre la ruleta y el tapete */}
      <mesh
        position={[-1.32, 0.49, 0]}
        material={mahoganyMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.1, 0.07, 2.76]} />
      </mesh>

      {/* Paño de apuestas verde esmeralda hundido (felt betting) */}
      <mesh
        position={[feltCenter.x, 0.462, feltCenter.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[feltDims.w, feltDims.d]} />
        {feltTexture ? (
          <meshStandardMaterial
            key={`felt-textured-${mounted}`}
            map={feltTexture}
            color="#ffffff"
            roughness={0.65}
            metalness={0.04}
            onUpdate={(m) => {
              m.needsUpdate = true;
            }}
          />
        ) : (
          <meshStandardMaterial
            key="felt-fallback"
            color="#0c542f"
            roughness={0.65}
            metalness={0.04}
          />
        )}
      </mesh>

      {/* La ruleta realista 3D animada */}
      <RealisticRouletteWheel
        position={[-2.55, 0.462, 0]}
        scale={0.95}
        isSpinning={isSpinning}
        targetNumber={targetNumber}
        onSpinComplete={onSpinComplete}
        selectedA={selectedA}
        selectedB={selectedB}
        lastWinningNumber={lastWinningNumber}
        theme={wheelTheme}
        participants={participants}
        winnerPersonIndex={winnerPersonIndex}
      />

      {/* Bandeja de fichas decorativa (rack en borde trasero) */}
      <group position={[-0.7, 0.50, -1.35]}>
        <mesh material={mahoganyMaterial}>
          <boxGeometry args={[1.8, 0.04, 0.26]} />
        </mesh>
        {[-0.6, -0.3, 0, 0.3, 0.6].map((posX, i) => {
          return (
            <group key={`tray-chip-${i}`} position={[posX, 0.02, 0]}>
              <RenderChipStack amount={50} position={[0, 0, 0]} />
            </group>
          );
        })}
      </group>

      {/* Capa interactiva: detección de apuestas y fichas 3D */}
      {!(participants && participants.some((p) => p.active)) &&
        Object.entries(betSlots).map(([key, slot]) => {
        const betAmount = bets[key] || 0;
        const isHovered = hoveredBetKey === key;

        let isA = false;
        let isB = false;
        if (key.startsWith("num-")) {
          const num = parseInt(key.replace("num-", ""), 10);
          isA = selectedA.has(num);
          isB = selectedB.has(num);
        }

        const isWinningNumber =
          key.startsWith("num-") &&
          lastWinningNumber === parseInt(key.replace("num-", ""), 10);

        return (
          <group
            key={`interactive-${key}`}
            position={[slot.x, 0.465, slot.z]}
          >
            {/* Plano de clic y hover */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                handleSlotClick(key);
              }}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setHoveredBetKey(key);
              }}
              onPointerOut={() => {
                setHoveredBetKey(null);
              }}
            >
              <planeGeometry args={[slot.w, slot.d]} />
              <meshBasicMaterial
                color={
                  isWinningNumber
                    ? "#facc15"
                    : isHovered
                    ? "#fef08a"
                    : isA && isB
                    ? "#ec4899"
                    : isA
                    ? "#f59e0b"
                    : isB
                    ? "#06b6d4"
                    : "#ffffff"
                }
                transparent
                opacity={
                  isWinningNumber
                    ? 0.45
                    : isHovered
                    ? 0.25
                    : isA || isB
                    ? 0.2
                    : 0.001
                }
              />
            </mesh>

            {/* Borde brillante al pasar el cursor */}
            {isHovered && (
              <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry
                  args={[new THREE.PlaneGeometry(slot.w, slot.d)]}
                />
                <lineBasicMaterial color="#fef08a" linewidth={2} />
              </lineSegments>
            )}

            {/* Fichas 3D físicas apiladas en la casilla */}
            {betAmount > 0 && (
              <RenderChipStack
                amount={betAmount}
                position={[0, 0.005, 0]}
              />
            )}

            {/* Ficha indicadora en Modo Teoría A y B si no hay apuesta puesta */}
            {theoryMode && betAmount === 0 && (isA || isB) && (
              <RenderChipStack
                amount={isA && isB ? 25 : isA ? 5 : 1}
                position={[0, 0.005, 0]}
              />
            )}
          </group>
        );
      })}

      {/* Sombra de contacto suave en el suelo */}
      <ContactShadows
        position={[0, -1.25, 0]}
        opacity={0.8}
        scale={12}
        blur={2.4}
        far={3}
      />
    </group>
  );
}
