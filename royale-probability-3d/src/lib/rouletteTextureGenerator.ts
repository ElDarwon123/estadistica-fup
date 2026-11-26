import * as THREE from "three";
import { WHEEL_ORDER, RED_NUMBERS } from "./probabilityEngine";

export interface RouletteParticipant {
  id: string;
  name: string;
  active: boolean;
}

// Colores sobrios y elegantes de casino para los sectores de personas
const SECTOR_CASINO_COLORS = [
  "#065f46", // Verde esmeralda profundo
  "#991b1b", // Rojo rubí mate
  "#1e3a5f", // Azul medianoche
  "#854d0e", // Ámbar dorado mate
  "#4c1d95", // Púrpura casino
  "#0f766e", // Verde azulado
  "#831843", // Borgoña
  "#1e293b", // Pizarra grafito
  "#14532d", // Verde bosque
  "#7c2d12", // Caoba tostada
];

/**
 * Generador de textura circular completa en resolución ultra-alta (2048 x 2048)
 * para el plato giratorio de la Ruleta (Rotor 3D).
 * 
 * Si se proporcionan participantes activos (N >= 1), genera una ruleta de selección
 * aleatoria con N sectores idénticos (θ = 360° / N) rotulados con los nombres de las personas.
 * Si no hay participantes, genera la clásica ruleta europea de 37 casillas.
 */
export function generateCircularRouletteTexture(
  theme: "mahogany" | "obsidian" = "mahogany",
  participants?: RouletteParticipant[]
): THREE.CanvasTexture | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const centerX = 1024;
  const centerY = 1024;

  // Fondo base del disco
  ctx.fillStyle = theme === "obsidian" ? "#0f0f12" : "#2a0d07";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 1024, 0, Math.PI * 2);
  ctx.fill();

  // Radios de los diferentes anillos
  const rOuterTrack = 1010;
  const rOuterPocket = 980;
  const rInnerPocket = 670;
  const rInnerDish = 660;
  const rCenterHub = 260;

  // Anillo de pista de bola exterior oscura
  ctx.fillStyle = "#141418";
  ctx.beginPath();
  ctx.arc(centerX, centerY, rOuterTrack, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, rOuterPocket, Math.PI * 2, 0, true);
  ctx.fill();

  // Borde dorado exterior
  ctx.strokeStyle = "#c5a059";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rOuterPocket, 0, Math.PI * 2);
  ctx.stroke();

  // Generación de sectores: personas o ruleta europea
  const activeList = participants ? participants.filter((p) => p.active) : [];
  const isPersonMode = activeList.length > 0;
  const numPockets = isPersonMode ? activeList.length : 37;
  const anglePerPocket = (Math.PI * 2) / numPockets;

  if (isPersonMode) {
    // Ruleta de Personas (N sectores equiprobables)
    activeList.forEach((person, i) => {
      const startAngle = i * anglePerPocket - Math.PI / 2;
      const endAngle = (i + 1) * anglePerPocket - Math.PI / 2;
      const midAngle = startAngle + anglePerPocket / 2;

      const bgColor = SECTOR_CASINO_COLORS[i % SECTOR_CASINO_COLORS.length];

      // Sector de la persona
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, rOuterPocket, startAngle, endAngle);
      ctx.arc(centerX, centerY, rInnerPocket, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = bgColor;
      ctx.fill();

      // Flete / separación dorada
      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = numPockets > 30 ? 2 : 3.5;
      ctx.stroke();

      // Rotulación del nombre de la persona
      const rText = (rOuterPocket + rInnerPocket) / 2;
      const textX = centerX + Math.cos(midAngle) * rText;
      const textY = centerY + Math.sin(midAngle) * rText;

      ctx.save();
      ctx.translate(textX, textY);

      const displayName = person.name.length > 14 ? person.name.slice(0, 12) + "…" : person.name;

      if (numPockets <= 14) {
        // Texto tangencial (legible horizontalmente desde el exterior)
        ctx.rotate(midAngle + Math.PI / 2);
        const fontSize = Math.max(26, Math.min(50, Math.floor(600 / numPockets)));
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      } else {
        // Texto radial para sectores más angostos
        ctx.rotate(midAngle);
        const fontSize = Math.max(20, Math.min(38, Math.floor(520 / numPockets)));
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      }

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayName, 0, 0);

      ctx.restore();
      ctx.restore();
    });
  } else {
    // Ruleta Europea de 37 casillas
    WHEEL_ORDER.forEach((num, i) => {
      const startAngle = i * anglePerPocket - Math.PI / 2;
      const endAngle = (i + 1) * anglePerPocket - Math.PI / 2;
      const midAngle = startAngle + anglePerPocket / 2;

      let bgColor = "#18181b";
      if (num === 0) {
        bgColor = "#047857";
      } else if (RED_NUMBERS.has(num)) {
        bgColor = "#b91c1c";
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, rOuterPocket, startAngle, endAngle);
      ctx.arc(centerX, centerY, rInnerPocket, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = bgColor;
      ctx.fill();

      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      const rText = (rOuterPocket + rInnerPocket) / 2;
      const textX = centerX + Math.cos(midAngle) * rText;
      const textY = centerY + Math.sin(midAngle) * rText;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(midAngle + Math.PI / 2);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(num.toString(), 0, 0);

      ctx.restore();
      ctx.restore();
    });
  }

  // Anillo dorado interior de retención de las casillas
  ctx.strokeStyle = "#c5a059";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rInnerPocket, 0, Math.PI * 2);
  ctx.stroke();

  // Plato cónico interior de caoba pulida u obsidiana
  ctx.fillStyle = theme === "obsidian" ? "#141419" : "#38120a";
  ctx.beginPath();
  ctx.arc(centerX, centerY, rInnerDish, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, rCenterHub, Math.PI * 2, 0, true);
  ctx.fill();

  // Textura sutil de madera/laca en el plato interior
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 2;
  for (let r = rCenterHub + 20; r < rInnerDish; r += 15) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Los 8 radios dorados radiales
  for (let s = 0; s < 8; s++) {
    const spokeAngle = (s * Math.PI * 2) / 8 - Math.PI / 2;
    const x1 = centerX + Math.cos(spokeAngle) * (rCenterHub + 5);
    const y1 = centerY + Math.sin(spokeAngle) * (rCenterHub + 5);
    const x2 = centerX + Math.cos(spokeAngle) * (rInnerDish - 5);
    const y2 = centerY + Math.sin(spokeAngle) * (rInnerDish - 5);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x1 + 2, y1 + 2);
    ctx.lineTo(x2 + 2, y2 + 2);
    ctx.stroke();

    ctx.strokeStyle = "#c5a059";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Núcleo central dorado con el emblema de Espacio Muestral Ω
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.arc(centerX, centerY, rCenterHub, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#c5a059";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rCenterHub, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(centerX, centerY, rCenterHub * 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rCenterHub * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // Emblema Ω en el centro
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 110px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ω", centerX, centerY);

  // Crear y configurar textura Three.js
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}
