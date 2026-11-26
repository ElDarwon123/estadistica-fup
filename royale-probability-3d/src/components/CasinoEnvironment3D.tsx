"use client";

import React, { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { generateCasinoCarpetTexture } from "../lib/carpetTextureGenerator";

// ============================================================================
// 0. GESTOR DE MATERIALES Y TEXTURAS 3D NATIVAS DE CASINO
// ============================================================================
function useCasinoMaterials() {
  const textures = useTexture({
    tex4: "/models/casino/Textures_4.png",
    texLines: "/models/casino/Lines.png",
    texScreens1: "/models/casino/Screens_1.png",
    texSlots: "/models/casino/Slots.png",
    texChain: "/models/casino/Chain_BaseColor.png",
    texFabricNormal: "/models/casino/Fabric_Normal.png",
  });

  const materials = useMemo(() => {
    // Configurar mapeo de color SRGB para que los colores no se vean lavados ni oscuros
    [
      textures.tex4,
      textures.texLines,
      textures.texScreens1,
      textures.texSlots,
      textures.texChain,
    ].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = true;
      t.needsUpdate = true;
    });

    // 1. Material de textura principal (Cuerpo, ropa, caras, cabello, gabinetes)
    const matColor = new THREE.MeshStandardMaterial({
      map: textures.tex4,
      roughness: 0.42,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });

    // 2. Material de líneas y acentos (Faldas, vestidos, patrones)
    const matLines = new THREE.MeshStandardMaterial({
      map: textures.texLines,
      roughness: 0.45,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // 3. Marquesinas y partes luminosas de las tragamonedas
    const matEmission = new THREE.MeshStandardMaterial({
      map: textures.tex4,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures.tex4,
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    // 4. Pantallas de juego animadas / encendidas de las tragamonedas
    const matScreens = new THREE.MeshStandardMaterial({
      map: textures.texScreens1,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures.texScreens1,
      emissiveIntensity: 2.8,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // 5. Rodillos y símbolos de las tragamonedas (Cerezas, 777, campanas)
    const matSlots = new THREE.MeshStandardMaterial({
      map: textures.texSlots,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures.texSlots,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // 6. Tapizado de tela borgoña de las sillas de casino
    const matFabric = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#880808"),
      normalMap: textures.texFabricNormal,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 7. Cadenas, biseles y adornos metálicos
    const matChain = new THREE.MeshStandardMaterial({
      map: textures.texChain,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures.texChain,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });

    // 8. Vidrio de tragamonedas y acuarios
    const matGlass = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#bae6fd"),
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    return {
      matColor,
      matLines,
      matEmission,
      matScreens,
      matSlots,
      matFabric,
      matChain,
      matGlass,
    };
  }, [textures]);

  const getMaterial = useCallback(
    (name: string) => {
      const lower = (name || "").toLowerCase();
      if (lower.includes("lines")) return materials.matLines;
      if (lower.includes("screen")) return materials.matScreens;
      if (lower.includes("slot")) return materials.matSlots;
      if (lower.includes("emission")) return materials.matEmission;
      if (lower.includes("fabric")) return materials.matFabric;
      if (lower.includes("chain")) return materials.matChain;
      if (lower.includes("glass")) return materials.matGlass;
      return materials.matColor;
    },
    [materials]
  );

  return { getMaterial };
}

// Componente para renderizar cualquier modelo OBJ con sus texturas completas
function CasinoAsset({
  name,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  getMaterial,
}: {
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  getMaterial: (name: string) => THREE.Material;
}) {
  const obj = useLoader(OBJLoader, `/models/casino/${name}.obj`);

  const scene = useMemo(() => {
    const cloned = obj.clone(true);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => getMaterial(m.name || ""));
        } else if (mesh.material) {
          mesh.material = getMaterial(mesh.material.name || "");
        } else {
          mesh.material = getMaterial("");
        }
      }
    });
    return cloned;
  }, [obj, getMaterial]);

  const scaleArray: [number, number, number] =
    typeof scale === "number" ? [scale, scale, scale] : scale;

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scaleArray}
    />
  );
}

// ============================================================================
// 1. EL CANDELABRO DE CRISTAL EN ESPIRAL HELICOIDAL (RÉPLICA FOTO MOUNT AIRY)
// ============================================================================
export function HelicalCrystalChandelier({
  position = [0, 2.5, 0],
  scale = 1.0,
  lightIntensity = 3.0,
}: {
  position?: [number, number, number];
  scale?: number;
  lightIntensity?: number;
}) {
  const { prisms, outerTiers } = useMemo(() => {
    const list: { pos: [number, number, number]; rotY: number; scale: number }[] = [];
    const height = 1.75 * scale;
    const radius = 0.32 * scale;
    const count = 40;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6.0;
      const y = -t * height;
      const r = radius * (1.0 - t * 0.22);

      list.push({
        pos: [Math.cos(angle) * r, y, Math.sin(angle) * r],
        rotY: angle,
        scale: 1.0 - t * 0.15,
      });

      list.push({
        pos: [Math.cos(angle + Math.PI) * r, y - 0.03 * scale, Math.sin(angle + Math.PI) * r],
        rotY: angle + Math.PI,
        scale: 1.0 - t * 0.15,
      });
    }

    const tiers: { pos: [number, number, number]; radius: number; count: number }[] = [
      { pos: [0, -0.08 * scale, 0], radius: 0.36 * scale, count: 14 },
      { pos: [0, -0.25 * scale, 0], radius: 0.32 * scale, count: 12 },
    ];

    return { prisms: list, outerTiers: tiers };
  }, [scale]);

  const lightCoreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#f59e0b",
        emissiveIntensity: 2.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.92,
      }),
    []
  );

  const crystalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#fef08a",
        emissiveIntensity: 0.28,
        roughness: 0.04,
        metalness: 0.45,
        flatShading: true,
        transparent: true,
        opacity: 0.88,
      }),
    []
  );

  const chromeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.08,
        metalness: 0.95,
      }),
    []
  );

  return (
    <group position={position}>
      <mesh position={[0, 1.2 * scale, 0]} material={chromeMaterial}>
        <cylinderGeometry args={[0.012 * scale, 0.012 * scale, 2.4 * scale, 8]} />
      </mesh>
      <mesh position={[0, 0.04 * scale, 0]} material={chromeMaterial}>
        <cylinderGeometry args={[0.44 * scale, 0.48 * scale, 0.06 * scale, 32]} />
      </mesh>
      <mesh position={[0, -0.01 * scale, 0]} rotation={[-Math.PI / 2, 0, 0]} material={chromeMaterial}>
        <torusGeometry args={[0.44 * scale, 0.025 * scale, 16, 36]} />
      </mesh>

      <mesh position={[0, -0.88 * scale, 0]} material={lightCoreMaterial}>
        <cylinderGeometry args={[0.10 * scale, 0.07 * scale, 1.65 * scale, 20]} />
      </mesh>

      <pointLight
        position={[0, -0.88 * scale, 0]}
        intensity={lightIntensity}
        color="#fed7aa"
        distance={7.0 * scale}
        decay={2}
      />

      {prisms.map((p, idx) => (
        <group key={`prism-${idx}`} position={p.pos} rotation={[0, p.rotY, 0]}>
          <mesh position={[0, 0.025 * scale, 0]} material={chromeMaterial}>
            <cylinderGeometry args={[0.004 * scale, 0.004 * scale, 0.03 * scale, 6]} />
          </mesh>
          <mesh material={crystalMaterial} scale={[p.scale, p.scale, p.scale]}>
            <octahedronGeometry args={[0.062 * scale, 0]} />
          </mesh>
        </group>
      ))}

      {outerTiers.map((tier, tIdx) => (
        <group key={`tier-${tIdx}`} position={tier.pos}>
          {Array.from({ length: tier.count }).map((_, cIdx) => {
            const ang = (cIdx * Math.PI * 2) / tier.count;
            return (
              <mesh
                key={`tier-c-${tIdx}-${cIdx}`}
                position={[Math.cos(ang) * tier.radius, 0, Math.sin(ang) * tier.radius]}
                material={crystalMaterial}
              >
                <octahedronGeometry args={[0.055 * scale, 0]} />
              </mesh>
            );
          })}
        </group>
      ))}

      <mesh position={[0, -1.82 * scale, 0]} material={crystalMaterial}>
        <octahedronGeometry args={[0.09 * scale, 0]} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 2. BARRA CIRCULAR CENTRAL CON DOSEL ILUMINADO (RÉPLICA FOTO MOUNT AIRY)
// ============================================================================
function CentralBarLounge({ position = [0, -1.45, -9.5] }: { position?: [number, number, number] }) {
  const mahoganyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a1309",
        roughness: 0.22,
        metalness: 0.12,
      }),
    []
  );

  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f7c844",
        roughness: 0.14,
        metalness: 0.9,
      }),
    []
  );

  const canopyMagentaCore = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#f43f5e",
        emissiveIntensity: 3.8,
        roughness: 0.15,
      }),
    []
  );

  const canopyAmberDome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fffae8",
        emissive: "#f59e0b",
        emissiveIntensity: 3.2,
        roughness: 0.2,
      }),
    []
  );

  return (
    <group position={position}>
      {/* Mostrador circular continuo de la barra */}
      <mesh position={[0, 0.45, 0]} material={mahoganyMaterial} receiveShadow castShadow>
        <cylinderGeometry args={[3.3, 3.1, 0.9, 48, 1, true]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mahoganyMaterial}>
        <torusGeometry args={[3.2, 0.2, 16, 48]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]} material={brassMaterial}>
        <torusGeometry args={[3.36, 0.03, 16, 48]} />
      </mesh>

      {/* Tira LED dorada bajo el mostrador */}
      <mesh position={[0, 0.83, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.15, 0.025, 12, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#facc15"
          emissiveIntensity={3.2}
          roughness={0.1}
        />
      </mesh>

      {/* Núcleo central con botellas */}
      <mesh position={[0, 0.7, 0]} material={mahoganyMaterial}>
        <cylinderGeometry args={[1.6, 1.6, 1.4, 32]} />
      </mesh>
      {[0.4, 0.75, 1.1].map((yShelf, sIdx) => (
        <group key={`shelf-${sIdx}`} position={[0, yShelf, 0]}>
          <mesh material={brassMaterial} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.7, 0.03, 12, 32]} />
          </mesh>
          {Array.from({ length: 18 }).map((_, bIdx) => {
            const bAng = (bIdx * Math.PI * 2) / 18;
            return (
              <mesh
                key={`bottle-${sIdx}-${bIdx}`}
                position={[Math.cos(bAng) * 1.62, 0.09, Math.sin(bAng) * 1.62]}
              >
                <cylinderGeometry args={[0.026, 0.026, 0.16, 8]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive={bIdx % 2 === 0 ? "#f59e0b" : "#10b981"}
                  emissiveIntensity={1.6}
                  transparent
                  opacity={0.85}
                  roughness={0.1}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Estructura del Dosel Superior iluminado */}
      <group position={[0, 1.4, 0]}>
        {Array.from({ length: 8 }).map((_, cIdx) => {
          const colAng = (cIdx * Math.PI * 2) / 8;
          return (
            <mesh
              key={`canopy-col-${cIdx}`}
              position={[Math.cos(colAng) * 1.7, 0.45, Math.sin(colAng) * 1.7]}
              material={brassMaterial}
            >
              <cylinderGeometry args={[0.045, 0.045, 0.9, 12]} />
            </mesh>
          );
        })}

        <mesh position={[0, 0.5, 0]} material={canopyMagentaCore}>
          <cylinderGeometry args={[2.3, 1.4, 0.75, 36, 1, true]} />
        </mesh>

        <mesh position={[0, 0.95, 0]} material={canopyAmberDome}>
          <cylinderGeometry args={[2.9, 2.3, 0.45, 36, 1, true]} />
        </mesh>

        <mesh position={[0, 1.18, 0]} rotation={[-Math.PI / 2, 0, 0]} material={brassMaterial}>
          <torusGeometry args={[2.92, 0.06, 16, 36]} />
        </mesh>

        <pointLight position={[0, 0.8, 0]} intensity={4.5} color="#f59e0b" distance={9} decay={2} />

        {/* Constelación de candelabros alrededor del dosel */}
        {Array.from({ length: 6 }).map((_, cIdx) => {
          const chAng = (cIdx * Math.PI * 2) / 6;
          return (
            <HelicalCrystalChandelier
              key={`canopy-ch-${cIdx}`}
              position={[Math.cos(chAng) * 2.85, 1.1, Math.sin(chAng) * 2.85]}
              scale={0.42}
              lightIntensity={2.0}
            />
          );
        })}
      </group>

      {/* Taburetes de la barra */}
      {Array.from({ length: 14 }).map((_, stIdx) => {
        const sAng = (stIdx * Math.PI * 2) / 14;
        const sDist = 3.8;
        return (
          <group
            key={`stool-${stIdx}`}
            position={[Math.cos(sAng) * sDist, 0, Math.sin(sAng) * sDist]}
            rotation={[0, -sAng - Math.PI / 2, 0]}
          >
            <mesh position={[0, 0.3, 0]} material={brassMaterial}>
              <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={brassMaterial}>
              <cylinderGeometry args={[0.18, 0.2, 0.03, 16]} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
              <meshStandardMaterial color="#2d0f07" roughness={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================================================
// 3. GRAN TECHO ARQUITECTÓNICO CIRCULAR CON ARTESONADO Y LUZ INDIRECTA
// ============================================================================
function GrandCasinoCeiling() {
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38140b",
        roughness: 0.35,
        metalness: 0.1,
      }),
    []
  );

  const goldMolding = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f7c844",
        roughness: 0.14,
        metalness: 0.9,
      }),
    []
  );

  return (
    <group position={[0, 6.2, -3.5]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[24, 48]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {Array.from({ length: 16 }).map((_, idx) => {
        const ang = (idx * Math.PI * 2) / 16;
        return (
          <mesh
            key={`radial-beam-${idx}`}
            position={[Math.cos(ang) * 9, -0.06, Math.sin(ang) * 9]}
            rotation={[0, -ang, 0]}
            material={woodMaterial}
          >
            <boxGeometry args={[16, 0.12, 0.22]} />
          </mesh>
        );
      })}

      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[7.2, 0.08, 16, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fef08a"
          emissiveIntensity={3.5}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={goldMolding}>
        <torusGeometry args={[7.45, 0.08, 16, 48]} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 4. ESCENA COMPLETA 3D DE CASINO CON TEXTURAS DE ALTA DEFINICIÓN Y PERSONAJES
// ============================================================================
function CasinoSceneContent() {
  const { getMaterial } = useCasinoMaterials();

  const carpetTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return generateCasinoCarpetTexture();
  }, []);

  return (
    <group>
      {/* 1. SUELO ALFOMBRADO ROJO BORGOÑA Y ORO REALISTA 3D */}
      <mesh position={[0, -1.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[65, 65]} />
        {carpetTexture ? (
          <meshStandardMaterial
            map={carpetTexture}
            roughness={0.65}
            metalness={0.05}
          />
        ) : (
          <meshStandardMaterial color="#3b0a0e" roughness={0.65} metalness={0.05} />
        )}
      </mesh>

      {/* 2. GRAN TECHO ARQUITECTÓNICO CIRCULAR */}
      <GrandCasinoCeiling />

      {/* 3. RÉPLICAS DEL CANDELABRO DE CRISTAL HELICOIDAL (ELEVADOS PARA NO OBSTRUIR EL TAPETE) */}
      <HelicalCrystalChandelier position={[-4.6, 4.5, -0.8]} scale={0.82} lightIntensity={3.8} />
      <HelicalCrystalChandelier position={[4.6, 4.5, -0.8]} scale={0.82} lightIntensity={3.8} />
      <HelicalCrystalChandelier position={[-3.2, 4.3, -3.8]} scale={0.68} lightIntensity={2.8} />
      <HelicalCrystalChandelier position={[3.2, 4.3, -3.8]} scale={0.68} lightIntensity={2.8} />

      {/* ================================================================== */}
      {/* 4. LA SHOWGIRL CROUPIER TEXTURIZADA EN LA MESA DE RULETA           */}
      {/* ================================================================== */}
      <group position={[-1.35, -0.42, -1.65]}>
        {/* Plataforma de caoba elegante detrás de la mesa */}
        <mesh position={[0, -0.52, 0]} receiveShadow>
          <boxGeometry args={[1.5, 0.95, 1.1]} />
          <meshStandardMaterial color="#300d06" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[1.54, 0.04, 1.14]} />
          <meshStandardMaterial color="#f7c844" roughness={0.15} metalness={0.85} />
        </mesh>

        {/* Modelo 3D de la Showgirl completamente texturizada */}
        <CasinoAsset
          name="20_Showgirl"
          position={[0, 0, 0]}
          rotation={[0, 0.12, 0]}
          scale={0.96}
          getMaterial={getMaterial}
        />

        {/* Foco cálido dedicado para destacar a la croupier */}
        <spotLight
          position={[0, 3.8, 1.5]}
          intensity={4.2}
          color="#fff5e6"
          angle={0.55}
          penumbra={0.7}
          castShadow
        />
      </group>

      {/* ================================================================== */}
      {/* 5. MÁQUINAS TRAGAMONEDAS 3D Y SILLAS TEXTURIZADAS EN LOS PASILLOS   */}
      {/* ================================================================== */}
      {/* Banco Flanco Izquierdo */}
      {[
        { z: 1.0, model: "Slot_Machine_01" },
        { z: -0.8, model: "Slot_Machine_Aquarium_01" },
        { z: -2.6, model: "Slot_Machine_02" },
        { z: -4.4, model: "Slot_Machine_01" },
        { z: -6.2, model: "Slot_Machine_Aquarium_01" },
      ].map((item, idx) => (
        <group key={`slot-left-group-${idx}`} position={[-5.4, -1.45, item.z]}>
          <CasinoAsset
            name={item.model}
            position={[0, 0, 0]}
            rotation={[0, Math.PI / 2.3, 0]}
            scale={0.82}
            getMaterial={getMaterial}
          />
          <CasinoAsset
            name="Chair_06"
            position={[0.85, 0, 0.15]}
            rotation={[0, -Math.PI / 2.3, 0]}
            scale={0.9}
            getMaterial={getMaterial}
          />
          <pointLight
            position={[0.6, 1.2, 0]}
            color={idx % 2 === 0 ? "#facc15" : "#38bdf8"}
            intensity={0.8}
            distance={3.0}
            decay={2}
          />
        </group>
      ))}

      {/* Banco Flanco Derecho */}
      {[
        { z: 1.0, model: "Slot_Machine_02" },
        { z: -0.8, model: "Slot_Machine_01" },
        { z: -2.6, model: "Slot_Machine_Aquarium_01" },
        { z: -4.4, model: "Slot_Machine_02" },
        { z: -6.2, model: "Slot_Machine_01" },
      ].map((item, idx) => (
        <group key={`slot-right-group-${idx}`} position={[5.4, -1.45, item.z]}>
          <CasinoAsset
            name={item.model}
            position={[0, 0, 0]}
            rotation={[0, -Math.PI / 2.3, 0]}
            scale={0.82}
            getMaterial={getMaterial}
          />
          <CasinoAsset
            name="Chair_06"
            position={[-0.85, 0, 0.15]}
            rotation={[0, Math.PI / 2.3, 0]}
            scale={0.9}
            getMaterial={getMaterial}
          />
          <pointLight
            position={[-0.6, 1.2, 0]}
            color={idx % 2 === 0 ? "#ec4899" : "#facc15"}
            intensity={0.8}
            distance={3.0}
            decay={2}
          />
        </group>
      ))}

      {/* ================================================================== */}
      {/* 6. NPCS PERSONAJES VIVOS EN EL CASINO TOTALMENTE TEXTURIZADOS       */}
      {/* ================================================================== */}
      {/* NPC 1: Guardia de Seguridad (18_Security) */}
      <group position={[-3.8, -1.45, -2.6]}>
        <CasinoAsset
          name="18_Security"
          position={[0, 0, 0]}
          rotation={[0, Math.PI / 3.2, 0]}
          scale={0.92}
          getMaterial={getMaterial}
        />
      </group>

      {/* NPC 2: Jugador jugando en las tragamonedas (36) */}
      <group position={[4.65, -1.45, 1.0]}>
        <CasinoAsset
          name="36"
          position={[0, 0, 0]}
          rotation={[0, -Math.PI / 2.3, 0]}
          scale={0.9}
          getMaterial={getMaterial}
        />
      </group>

      {/* NPC 3: Jugador VIP observando la mesa de ruleta (75) — separado de la esquina de la mesa */}
      <group position={[3.95, -0.42, -2.15]}>
        <mesh position={[0, -0.52, 0]} receiveShadow>
          <boxGeometry args={[1.2, 0.95, 1.1]} />
          <meshStandardMaterial color="#300d06" roughness={0.3} metalness={0.1} />
        </mesh>
        <CasinoAsset
          name="75"
          position={[0, 0, 0]}
          rotation={[0, -Math.PI / 5, 0]}
          scale={0.92}
          getMaterial={getMaterial}
        />
      </group>

      {/* NPC 4: Cajero / Bartender en la barra del fondo (1_Cashier) */}
      <group position={[0, -1.45, -8.2]}>
        <CasinoAsset
          name="1_Cashier"
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={0.9}
          getMaterial={getMaterial}
        />
      </group>

      {/* ================================================================== */}
      {/* 7. BARRA CIRCULAR CENTRAL CON DOSEL ILUMINADO AL FONDO             */}
      {/* ================================================================== */}
      <CentralBarLounge position={[0, -1.45, -9.5]} />

      {/* Letrero Neón de Casino sobre el fondo */}
      <group position={[0, 2.7, -9.0]}>
        <CasinoAsset
          name="Neon_Sign_01"
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={0.75}
          getMaterial={getMaterial}
        />
      </group>

      {/* 8. COLUMNAS ARQUITECTÓNICAS DECORATIVAS CON APLIQUES DE LUZ */}
      {[-7.5, 7.5].map((colX, i) => (
        <group key={`column-${i}`} position={[colX, 1.8, -3.5]}>
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[0.5, 0.58, 6.5, 16]} />
            <meshStandardMaterial color="#2d1007" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[colX > 0 ? -0.52 : 0.52, 0.4, 0]}>
            <boxGeometry args={[0.12, 0.55, 0.22]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#f59e0b"
              emissiveIntensity={3.0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Componente principal envuelto en Suspense
export default function CasinoEnvironment3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <CasinoSceneContent />
    </Suspense>
  );
}
