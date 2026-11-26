"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { WHEEL_ORDER, POCKETS_INFO } from "../lib/probabilityEngine";
import { audioEngine } from "../lib/audioEngine";
import { Layers, Compass } from "lucide-react";

interface Roulette3DProps {
  isSpinning: boolean;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
  selectedA: Set<number>;
  selectedB: Set<number>;
  cameraView: "perspective" | "top" | "closeup";
}

// 1. COMPONENTE PARA CARGAR LA MESA REAL ABBIATI .GLB
function RealCasinoTableGLB({
  isSpinning,
  targetNumber,
  onSpinComplete,
  selectedA,
  selectedB,
}: {
  isSpinning: boolean;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
  selectedA: Set<number>;
  selectedB: Set<number>;
}) {
  const { scene } = useGLTF("/models/roulette/roulette.glb");
  const clone = useMemo(() => scene.clone(true), [scene]);
  const ballRef = useRef<THREE.Mesh>(null);

  // Coordenadas del centro de la ruleta en el modelo .GLB
  // cx: -67.15, cy: 342.82, cz: -363.22 (escala 0.007)
  const scale = 0.007;
  const wheelCenterX = -67.15 * scale;
  const wheelCenterY = 342.82 * scale;
  const wheelCenterZ = -363.22 * scale;
  const wheelRadius = 90 * scale; // ~0.63 unidades

  const spinState = useRef({
    active: false,
    startTime: 0,
    duration: 5000,
    targetPocketAngle: 0,
    initialBallAngle: 0,
    targetNum: 0,
    hasLanded: false,
  });

  useEffect(() => {
    if (isSpinning && targetNumber !== null) {
      const pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
      const anglePerPocket = (Math.PI * 2) / 37;
      spinState.current = {
        active: true,
        startTime: performance.now(),
        duration: 5000,
        targetPocketAngle: pocketIdx * anglePerPocket,
        initialBallAngle: Math.random() * Math.PI * 2,
        targetNum: targetNumber,
        hasLanded: false,
      };
    }
  }, [isSpinning, targetNumber]);

  useFrame(() => {
    const state = spinState.current;
    if (state.active) {
      const elapsed = performance.now() - state.startTime;
      const progress = Math.min(1, elapsed / state.duration);

      const easeBall = 1 - Math.pow(1 - progress, 3);
      const totalBallTurns = 8;
      const currentBallAngle = state.initialBallAngle - easeBall * (totalBallTurns * Math.PI * 2);

      let currentRadius = wheelRadius * 0.95;
      let ballY = wheelCenterY + 0.12;

      if (progress > 0.65) {
        const dropProgress = (progress - 0.65) / 0.35;
        currentRadius = wheelRadius * (0.95 - dropProgress * 0.35);
        ballY = wheelCenterY + 0.12 - dropProgress * 0.08;
      }

      if (ballRef.current) {
        ballRef.current.position.x = wheelCenterX + Math.cos(currentBallAngle) * currentRadius;
        ballRef.current.position.z = wheelCenterZ + Math.sin(currentBallAngle) * currentRadius;
        ballRef.current.position.y = ballY;
      }

      if (progress >= 1 && !state.hasLanded) {
        state.hasLanded = true;
        state.active = false;
        audioEngine.playBallDrop();

        const num = state.targetNum;
        if (selectedA.has(num) || selectedB.has(num)) {
          setTimeout(() => audioEngine.playWinChime(), 200);
        }
        onSpinComplete(num);
      }
    } else {
      if (ballRef.current && targetNumber !== null) {
        const pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
        const ang = pocketIdx * ((Math.PI * 2) / 37);
        ballRef.current.position.x = wheelCenterX + Math.cos(ang) * (wheelRadius * 0.6);
        ballRef.current.position.z = wheelCenterZ + Math.sin(ang) * (wheelRadius * 0.6);
        ballRef.current.position.y = wheelCenterY + 0.04;
      }
    }
  });

  return (
    <group position={[0, -1.8, 0]}>
      {/* Modelo .GLB completo de la mesa de casino Abbiati */}
      <primitive object={clone} scale={[scale, scale, scale]} castShadow receiveShadow />

      {/* Bola cromada */}
      <mesh ref={ballRef} position={[wheelCenterX, wheelCenterY + 0.05, wheelCenterZ]} castShadow>
        <sphereGeometry args={[0.035, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.98} />
      </mesh>

      {/* Sombra de contacto */}
      <ContactShadows position={[0, -0.05, 0]} opacity={0.7} scale={8} blur={2} />
    </group>
  );
}

// 2. COMPONENTE PARA LA RUEDA PROCEDURAL DE ALTA RESOLUCIÓN CON NÚMEROS E ILUMINACIÓN
function ProceduralVIPWheel({
  isSpinning,
  targetNumber,
  onSpinComplete,
  selectedA,
  selectedB,
}: {
  isSpinning: boolean;
  targetNumber: number | null;
  onSpinComplete: (winningNumber: number) => void;
  selectedA: Set<number>;
  selectedB: Set<number>;
}) {
  const rotorRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  const wheelTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const cx = 1024;
    const cy = 1024;
    const outerR = 980;
    const innerR = 760;
    const anglePerPocket = (Math.PI * 2) / 37;

    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(0, 0, 2048, 2048);

    WHEEL_ORDER.forEach((num, i) => {
      const startAngle = i * anglePerPocket - anglePerPocket / 2;
      const endAngle = startAngle + anglePerPocket;

      const info = POCKETS_INFO[num];
      let fill = "#18181b";
      if (num === 0) fill = "#059669";
      else if (info.color === "red") fill = "#dc2626";

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#eab308";
      ctx.stroke();

      const midAngle = i * anglePerPocket;
      const textR = (outerR + innerR) / 2;
      const tx = cx + Math.cos(midAngle) * textR;
      const ty = cy + Math.sin(midAngle) * textR;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = "bold 60px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 8;
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  const mahoganyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#261109", roughness: 0.25, metalness: 0.15 }),
    []
  );
  const brassMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d4af37", roughness: 0.18, metalness: 0.9 }),
    []
  );
  const chromeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.05, metalness: 0.98 }),
    []
  );

  const spinState = useRef({
    active: false,
    startTime: 0,
    duration: 5000,
    targetPocketAngle: 0,
    initialBallAngle: 0,
    targetNum: 0,
    hasLanded: false,
    lastTickPocket: -1,
  });

  useEffect(() => {
    if (isSpinning && targetNumber !== null) {
      const pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
      const anglePerPocket = (Math.PI * 2) / 37;
      spinState.current = {
        active: true,
        startTime: performance.now(),
        duration: 5000,
        targetPocketAngle: pocketIdx * anglePerPocket,
        initialBallAngle: Math.random() * Math.PI * 2,
        targetNum: targetNumber,
        hasLanded: false,
        lastTickPocket: -1,
      };
    }
  }, [isSpinning, targetNumber]);

  useFrame((_, delta) => {
    const state = spinState.current;
    if (state.active) {
      const elapsed = performance.now() - state.startTime;
      const progress = Math.min(1, elapsed / state.duration);

      const easeRotor = 1 - Math.pow(1 - progress, 2.8);
      const totalRotorTurns = 4;
      const currentRotorAngle = easeRotor * (totalRotorTurns * Math.PI * 2);
      if (rotorRef.current) rotorRef.current.rotation.y = currentRotorAngle;

      const easeBall = 1 - Math.pow(1 - progress, 3.2);
      const totalBallTurns = 9;
      const finalBallAngle = -(totalBallTurns * Math.PI * 2 + state.targetPocketAngle - currentRotorAngle);
      const ballAngle = state.initialBallAngle - easeBall * (state.initialBallAngle - finalBallAngle);

      let ballRadius = 3.05;
      let ballY = 0.52;

      if (progress > 0.6) {
        const fallProgress = (progress - 0.6) / 0.4;
        const fallEase = Math.sin((fallProgress * Math.PI) / 2);
        ballRadius = 3.05 - fallEase * 0.95;
        ballY = 0.52 - fallEase * 0.32;
        if (progress > 0.85 && progress < 0.98) {
          ballY += Math.max(0, Math.sin((progress - 0.85) * 40) * (1 - progress) * 0.15);
        }
      }

      if (ballRef.current) {
        ballRef.current.position.x = Math.cos(ballAngle) * ballRadius;
        ballRef.current.position.z = Math.sin(ballAngle) * ballRadius;
        ballRef.current.position.y = ballY;
      }

      const pocketSpan = (Math.PI * 2) / 37;
      const currentRelativePocket = Math.floor(Math.abs(ballAngle / pocketSpan)) % 37;
      if (currentRelativePocket !== state.lastTickPocket) {
        state.lastTickPocket = currentRelativePocket;
        if (Math.random() > 0.3) audioEngine.playFretTick(0.8 + (1 - progress) * 0.5);
      }

      if (progress >= 1 && !state.hasLanded) {
        state.hasLanded = true;
        state.active = false;
        audioEngine.playBallDrop();

        const num = state.targetNum;
        if (selectedA.has(num) || selectedB.has(num)) {
          setTimeout(() => audioEngine.playWinChime(), 200);
        }
        onSpinComplete(num);
      }
    } else {
      if (rotorRef.current && !isSpinning) {
        rotorRef.current.rotation.y += delta * 0.08;
      }
      if (ballRef.current && rotorRef.current && targetNumber !== null) {
        const pocketIdx = WHEEL_ORDER.indexOf(targetNumber);
        const angle = pocketIdx * ((Math.PI * 2) / 37) + rotorRef.current.rotation.y;
        ballRef.current.position.x = Math.cos(angle) * 2.1;
        ballRef.current.position.z = Math.sin(angle) * 2.1;
        ballRef.current.position.y = 0.20;
      }
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* Mueble de Caoba */}
      <mesh material={mahoganyMaterial} receiveShadow castShadow>
        <torusGeometry args={[3.4, 0.45, 32, 64]} />
      </mesh>
      <mesh position={[0, -0.35, 0]} material={mahoganyMaterial} receiveShadow>
        <cylinderGeometry args={[3.8, 4.0, 0.6, 64]} />
      </mesh>

      {/* Pista de Deslizamiento Metálica */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.0, 0.5, 64, 1, true]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.12} metalness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotor Central Móvil */}
      <group ref={rotorRef} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.05, 0]} material={brassMaterial}>
          <cylinderGeometry args={[0.9, 2.5, 0.3, 64]} />
        </mesh>

        {wheelTexture && (
          <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 2.65, 64]} />
            <meshStandardMaterial map={wheelTexture} roughness={0.2} metalness={0.4} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Separadores dorados */}
        {Array.from({ length: 37 }).map((_, i) => {
          const ang = (i * Math.PI * 2) / 37;
          return (
            <mesh key={`fret-${i}`} position={[Math.cos(ang) * 2.1, 0.22, Math.sin(ang) * 2.1]} rotation={[0, -ang, 0]} material={brassMaterial}>
              <boxGeometry args={[0.75, 0.05, 0.02]} />
            </mesh>
          );
        })}

        {/* Halos de Eventos A y B */}
        {WHEEL_ORDER.map((num, i) => {
          const inA = selectedA.has(num);
          const inB = selectedB.has(num);
          if (!inA && !inB) return null;

          const ang = (i * Math.PI * 2) / 37;
          let haloColor = inA && inB ? "#ec4899" : inA ? "#f59e0b" : "#06b6d4";

          return (
            <mesh key={`halo-${num}`} position={[Math.cos(ang) * 2.1, 0.24, Math.sin(ang) * 2.1]} rotation={[-Math.PI / 2, 0, ang]}>
              <planeGeometry args={[0.15, 0.35]} />
              <meshBasicMaterial color={haloColor} transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

        {/* Torreta Central */}
        <mesh position={[0, 0.35, 0]} material={brassMaterial} castShadow>
          <cylinderGeometry args={[0.3, 0.5, 0.5, 32]} />
        </mesh>
        <mesh position={[0, 0.65, 0]} material={brassMaterial} castShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} material={brassMaterial} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.08]} />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI / 2, 0]} material={brassMaterial} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.08]} />
        </mesh>
      </group>

      {/* Bola Cromada */}
      <mesh ref={ballRef} position={[2.1, 0.22, 0]} material={chromeMaterial} castShadow>
        <sphereGeometry args={[0.085, 32, 32]} />
      </mesh>

      <ContactShadows position={[0, -0.65, 0]} opacity={0.8} scale={10} blur={1.8} far={2} />
    </group>
  );
}

// 3. CONTENEDOR PRINCIPAL CON SELECTOR DE MODO (.GLB REAL vs RUEDA PROCEDURAL)
export default function Roulette3D(props: Roulette3DProps) {
  const [modelMode, setModelMode] = useState<"glb" | "procedural">("glb");
  const controlsRef = useRef<any>(null);

  // Ajuste de cámara según el modo y la vista
  useEffect(() => {
    if (!controlsRef.current) return;
    if (modelMode === "glb") {
      // Para la mesa de casino .GLB Abbiati
      if (props.cameraView === "closeup") {
        controlsRef.current.object.position.set(-0.47, 1.4, -2.1);
        controlsRef.current.target.set(-0.47, 0.6, -2.54);
      } else if (props.cameraView === "top") {
        controlsRef.current.object.position.set(0, 4.5, 0.01);
        controlsRef.current.target.set(0, 0, 0);
      } else {
        // Perspectiva mesa completa
        controlsRef.current.object.position.set(0, 3.2, 4.2);
        controlsRef.current.target.set(0, 0.3, 0);
      }
    } else {
      // Para la rueda procedural
      if (props.cameraView === "top") {
        controlsRef.current.object.position.set(0, 7.5, 0.01);
        controlsRef.current.target.set(0, 0, 0);
      } else if (props.cameraView === "closeup") {
        controlsRef.current.object.position.set(0, 2.5, 3.2);
        controlsRef.current.target.set(0, 0.2, 0);
      } else {
        controlsRef.current.object.position.set(0, 4.8, 5.2);
        controlsRef.current.target.set(0, 0.2, 0);
      }
    }
    controlsRef.current.update();
  }, [props.cameraView, modelMode]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-obsidian-950 select-none overflow-hidden rounded-xl border border-gold-500/20 shadow-2xl">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 3.2, 4.2]} fov={45} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={1.8}
          maxDistance={9.0}
          maxPolarAngle={Math.PI / 2.1}
        />

        <ambientLight intensity={0.7} color="#fffcf0" />
        <spotLight position={[0, 8, 2]} angle={0.6} penumbra={0.5} intensity={3.5} color="#fffaea" castShadow />
        <pointLight position={[-4, 3, -3]} intensity={1.4} color="#065f46" />
        <pointLight position={[4, 3, 3]} intensity={1.4} color="#b45309" />

        {modelMode === "glb" ? (
          <React.Suspense fallback={null}>
            <RealCasinoTableGLB {...props} />
          </React.Suspense>
        ) : (
          <ProceduralVIPWheel {...props} />
        )}
      </Canvas>

      {/* Selector de Modelo 3D: Modelo Real .GLB vs Rueda Maximalista */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="flex bg-obsidian-900/90 backdrop-blur-md p-1 rounded-xl border border-gold-500/30 text-xs">
          <button
            onClick={() => setModelMode("glb")}
            className={`min-h-[36px] px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              modelMode === "glb"
                ? "bg-gold-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mesa VIP Abbiati (.GLB Real)</span>
          </button>
          <button
            onClick={() => setModelMode("procedural")}
            className={`min-h-[36px] px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              modelMode === "procedural"
                ? "bg-gold-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rueda Detallada 3D</span>
          </button>
        </div>
      </div>

      {/* Badge de estado en vivo */}
      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-obsidian-900/80 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-400 pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Three.js Realtime PBR • {modelMode === "glb" ? "Modelo .GLB Activo" : "Rueda de Alta Resolución"}</span>
      </div>
    </div>
  );
}

// Pre-carga del modelo .GLB para navegación fluida
useGLTF.preload("/models/roulette/roulette.glb");
