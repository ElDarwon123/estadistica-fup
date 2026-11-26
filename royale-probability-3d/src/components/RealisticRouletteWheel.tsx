"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WHEEL_ORDER } from "../lib/probabilityEngine";
import { audioEngine } from "../lib/audioEngine";
import { generateCircularRouletteTexture, RouletteParticipant } from "../lib/rouletteTextureGenerator";

export interface RealisticRouletteWheelProps {
  position?: [number, number, number];
  scale?: number;
  isSpinning: boolean;
  targetNumber?: number | null;
  onSpinComplete: (winningResult: number) => void;
  selectedA?: Set<number>;
  selectedB?: Set<number>;
  lastWinningNumber?: number | null;
  theme?: "mahogany" | "obsidian";
  participants?: RouletteParticipant[];
  winnerPersonIndex?: number | null;
}

export default function RealisticRouletteWheel({
  position = [-2.55, 0.46, 0],
  scale = 0.95,
  isSpinning,
  targetNumber,
  onSpinComplete,
  selectedA,
  selectedB,
  lastWinningNumber,
  theme = "mahogany",
  participants,
  winnerPersonIndex,
}: RealisticRouletteWheelProps) {
  const rotorRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeParticipants = useMemo(() => {
    return participants ? participants.filter((p) => p.active) : [];
  }, [participants]);

  const isPersonMode = activeParticipants.length > 0;
  const numPockets = isPersonMode ? activeParticipants.length : 37;

  // Textura circular de alta fidelidad generada de forma reactiva en el cliente
  const wheelFaceTexture = useMemo(() => {
    if (!mounted || typeof window === "undefined") return null;
    return generateCircularRouletteTexture(theme, participants);
  }, [mounted, theme, participants]);

  // Material de la madera exterior del tazón
  const bowlWoodMaterial = useMemo(() => {
    if (theme === "obsidian") {
      return new THREE.MeshStandardMaterial({
        color: "#18181f",
        roughness: 0.18,
        metalness: 0.25,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: "#43160e", // Caoba cálida y distinguida
      roughness: 0.22,
      metalness: 0.1,
    });
  }, [theme]);

  // Listón perimetral exterior blanco marfil (distintivo de la Imagen 1 de referencia)
  const stripeMaterial = useMemo(() => {
    if (theme === "obsidian") {
      return new THREE.MeshStandardMaterial({
        color: "#f7c844",
        roughness: 0.16,
        metalness: 0.85,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: "#f8fafc",
      roughness: 0.25,
      metalness: 0.05,
    });
  }, [theme]);

  // Latón / oro pulido de alta reflectividad
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f7c844",
        roughness: 0.14,
        metalness: 0.9,
      }),
    []
  );

  // Pista de rodadura oscura donde corre la bola
  const ballTrackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#22222a",
        roughness: 0.1,
        metalness: 0.85,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Estado de física y desaceleración de la bola y rotor
  const spinState = useRef({
    active: false,
    startTime: 0,
    duration: 5200,
    targetPocketAngle: 0,
    initialBallAngle: 0,
    targetNum: 0,
    hasLanded: false,
    lastTickPocket: -1,
  });

  useEffect(() => {
    if (isSpinning) {
      let pocketIdx = 0;
      let targetResult = 0;

      if (isPersonMode) {
        pocketIdx = winnerPersonIndex !== null && winnerPersonIndex !== undefined ? winnerPersonIndex : 0;
        targetResult = pocketIdx;
      } else if (targetNumber !== null && targetNumber !== undefined) {
        pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
        targetResult = targetNumber;
      }

      const anglePerPocket = (Math.PI * 2) / numPockets;
      spinState.current = {
        active: true,
        startTime: performance.now(),
        duration: 5200,
        targetPocketAngle: -(pocketIdx * anglePerPocket),
        initialBallAngle: Math.random() * Math.PI * 2,
        targetNum: targetResult,
        hasLanded: false,
        lastTickPocket: -1,
      };
    }
  }, [isSpinning, targetNumber, winnerPersonIndex, isPersonMode, numPockets]);

  useFrame((_, delta) => {
    const state = spinState.current;
    if (state.active) {
      const elapsed = performance.now() - state.startTime;
      const progress = Math.min(1, elapsed / state.duration);

      // Desaceleración suave del rotor
      const easeRotor = 1 - Math.pow(1 - progress, 2.7);
      const totalRotorTurns = 4;
      const currentRotorAngle = easeRotor * (totalRotorTurns * Math.PI * 2);
      if (rotorRef.current) rotorRef.current.rotation.y = currentRotorAngle;

      // Bola en sentido contrario
      const easeBall = 1 - Math.pow(1 - progress, 3.2);
      const totalBallTurns = 9;
      const finalBallAngle = -(
        totalBallTurns * Math.PI * 2 +
        state.targetPocketAngle -
        currentRotorAngle
      );
      const ballAngle =
        state.initialBallAngle -
        easeBall * (state.initialBallAngle - finalBallAngle);

      let ballRadiusTrack = 0.98;
      let ballY = 0.045;

      // Caída desde la pista exterior a la casilla
      if (progress > 0.65) {
        const fallProgress = (progress - 0.65) / 0.35;
        const fallEase = Math.sin((fallProgress * Math.PI) / 2);
        ballRadiusTrack = 0.98 - fallEase * 0.168; // Cae exactamente en el anillo de casillas (radio ~0.812)
        ballY = 0.045 - fallEase * 0.027; // Cae a la profundidad de la casilla
      }

      if (ballRef.current) {
        ballRef.current.position.x = Math.cos(ballAngle) * ballRadiusTrack;
        ballRef.current.position.z = Math.sin(ballAngle) * ballRadiusTrack;
        ballRef.current.position.y = ballY;
      }

      // Sonido de clic mecánico contra deflectores y trastes
      const pocketSpan = (Math.PI * 2) / numPockets;
      const curPocket = Math.floor(Math.abs(ballAngle / pocketSpan)) % numPockets;
      if (curPocket !== state.lastTickPocket) {
        state.lastTickPocket = curPocket;
        if (Math.random() > 0.3) {
          audioEngine.playFretTick(0.85 + (1 - progress) * 0.5);
        }
      }

      if (progress >= 1 && !state.hasLanded) {
        state.hasLanded = true;
        state.active = false;
        audioEngine.playBallDrop();
        onSpinComplete(state.targetNum);
      }
    } else {
      // Rotación suave del rotor en reposo
      if (rotorRef.current && !isSpinning) {
        rotorRef.current.rotation.y += delta * 0.07;
      }
      // La bola descansa fijada dentro de la casilla ganadora acompañando el giro
      if (ballRef.current && rotorRef.current) {
        let pocketIdx = -1;
        if (isPersonMode && winnerPersonIndex !== null && winnerPersonIndex !== undefined) {
          pocketIdx = winnerPersonIndex;
        } else if (!isPersonMode && targetNumber !== null && targetNumber !== undefined) {
          pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
        }

        if (pocketIdx >= 0) {
          const angle =
            pocketIdx * ((Math.PI * 2) / numPockets) - Math.PI / 2 + rotorRef.current.rotation.y;
          ballRef.current.position.x = Math.cos(angle) * 0.812;
          ballRef.current.position.z = Math.sin(angle) * 0.812;
          ballRef.current.position.y = 0.018;
        }
      }
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Estator exterior: tazón de caoba con reborde y pista */}
      {/* Pared cilíndrica exterior de madera */}
      <mesh position={[0, -0.06, 0]} material={bowlWoodMaterial} receiveShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.22, 64, 1, true]} />
      </mesh>

      {/* Listón horizontal perimetral blanco (referencia Imagen 1) */}
      <mesh position={[0, -0.06, 0]} material={stripeMaterial}>
        <cylinderGeometry args={[1.226, 1.226, 0.024, 64, 1, true]} />
      </mesh>

      {/* Anillo de reborde superior horizontal de madera */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={bowlWoodMaterial}
        receiveShadow
      >
        <ringGeometry args={[1.06, 1.22, 64]} />
      </mesh>

      {/* Filete dorado perimetral sobre el reborde superior */}
      <mesh
        position={[0, 0.051, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={goldMaterial}
      >
        <torusGeometry args={[1.14, 0.007, 12, 64]} />
      </mesh>

      {/* Pista de rodadura metálica exterior (inclinada hacia adentro) */}
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[1.06, 0.95, 0.05, 64, 1, true]} />
        <primitive object={ballTrackMaterial} attach="material" />
      </mesh>

      {/* 8 Deflectores romboidales dorados en la pista (diamonds) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const ang = (i * Math.PI * 2) / 8;
        return (
          <mesh
            key={`deflector-${i}`}
            position={[
              Math.cos(ang) * 1.01,
              0.035,
              Math.sin(ang) * 1.01,
            ]}
            rotation={[0, -ang + Math.PI / 4, 0]}
            material={goldMaterial}
          >
            <boxGeometry args={[0.032, 0.014, 0.032]} />
          </mesh>
        );
      })}

      {/* Anillo dorado de separación entre la pista exterior y el rotor */}
      <mesh
        position={[0, 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={goldMaterial}
      >
        <torusGeometry args={[0.95, 0.008, 12, 64]} />
      </mesh>

      {/* Rotor giratorio: cara, trastes y torreta */}
      <group ref={rotorRef} position={[0, 0.006, 0]}>
        {/* DISCO CIRCULAR CON TODA LA CARA DE LA RULETA (Casillas, Números, Radios) */}
        <mesh
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[0.945, 64]} />
          {wheelFaceTexture ? (
            <meshStandardMaterial
              key={`rotor-textured-${theme}-${mounted}`}
              map={wheelFaceTexture}
              color="#ffffff"
              roughness={0.25}
              metalness={0.12}
              side={THREE.DoubleSide}
              onUpdate={(m) => {
                m.needsUpdate = true;
              }}
            />
          ) : (
            <meshStandardMaterial
              key={`rotor-fallback-${theme}`}
              color={theme === "obsidian" ? "#18181f" : "#43160e"}
              roughness={0.25}
              metalness={0.12}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>

        {/* 37 Trastes metálicos 3D en relieve entre casillas */}
        {Array.from({ length: 37 }).map((_, i) => {
          const ang = (i * Math.PI * 2) / 37 - Math.PI / 2;
          return (
            <mesh
              key={`fret-3d-${i}`}
              position={[
                Math.cos(ang) * 0.81,
                0.004,
                Math.sin(ang) * 0.81,
              ]}
              rotation={[0, -ang, 0]}
              material={goldMaterial}
            >
              <boxGeometry args={[0.26, 0.008, 0.006]} />
            </mesh>
          );
        })}

        {/* Anillo dorado en relieve en el borde interior de las casillas */}
        <mesh
          position={[0, 0.004, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={goldMaterial}
        >
          <torusGeometry args={[0.67, 0.007, 12, 64]} />
        </mesh>

        {/* LOS 8 RADIOS RADIALES 3D DORADOS (SPOKES - Idénticos a Imagen 1) */}
        {Array.from({ length: 8 }).map((_, s) => {
          const spokeAngle = (s * Math.PI * 2) / 8 - Math.PI / 2;
          const spokeLen = 0.67 - 0.20;
          const midR = (0.67 + 0.20) / 2;
          return (
            <mesh
              key={`spoke-3d-${s}`}
              position={[
                Math.cos(spokeAngle) * midR,
                0.005,
                Math.sin(spokeAngle) * midR,
              ]}
              rotation={[0, -spokeAngle, 0]}
              material={goldMaterial}
            >
              <boxGeometry args={[spokeLen, 0.008, 0.012]} />
            </mesh>
          );
        })}

        {/* Torreta central dorada de 4 brazos con esferas */}
        <group position={[0, 0.005, 0]}>
          {/* Base escalonada de cáliz */}
          <mesh position={[0, 0.015, 0]} material={goldMaterial} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.03, 32]} />
          </mesh>
          <mesh position={[0, 0.045, 0]} material={goldMaterial} castShadow>
            <cylinderGeometry args={[0.08, 0.16, 0.04, 32]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} material={goldMaterial}>
            <cylinderGeometry args={[0.05, 0.07, 0.035, 24]} />
          </mesh>

          {/* Columna vertical central */}
          <mesh position={[0, 0.14, 0]} material={goldMaterial}>
            <cylinderGeometry args={[0.03, 0.038, 0.10, 24]} />
          </mesh>

          {/* Nudo central esférico */}
          <mesh position={[0, 0.20, 0]} material={goldMaterial}>
            <sphereGeometry args={[0.046, 24, 24]} />
          </mesh>

          {/* Cruz horizontal de 4 brazos */}
          <mesh position={[0, 0.20, 0]} material={goldMaterial} castShadow>
            <boxGeometry args={[0.48, 0.018, 0.018]} />
          </mesh>
          <mesh
            position={[0, 0.20, 0]}
            rotation={[0, Math.PI / 2, 0]}
            material={goldMaterial}
            castShadow
          >
            <boxGeometry args={[0.48, 0.018, 0.018]} />
          </mesh>

          {/* 4 Esferas doradas en las puntas de los 4 brazos */}
          {[-0.24, 0.24].map((offset, i) => (
            <React.Fragment key={`spheres-tips-${i}`}>
              <mesh position={[offset, 0.20, 0]} material={goldMaterial}>
                <sphereGeometry args={[0.026, 16, 16]} />
              </mesh>
              <mesh position={[0, 0.20, offset]} material={goldMaterial}>
                <sphereGeometry args={[0.026, 16, 16]} />
              </mesh>
            </React.Fragment>
          ))}

          {/* Remate esférico superior */}
          <mesh position={[0, 0.25, 0]} material={goldMaterial}>
            <sphereGeometry args={[0.024, 16, 16]} />
          </mesh>
        </group>
      </group>

      {/* Bola metálica cromada */}
      <mesh
        ref={ballRef}
        position={[0.98, 0.045, 0]}
        castShadow
      >
        <sphereGeometry args={[0.032, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.02}
          metalness={0.98}
        />
      </mesh>
    </group>
  );
}
