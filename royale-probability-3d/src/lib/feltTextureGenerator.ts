import * as THREE from "three";
import { RED_NUMBERS } from "./probabilityEngine";
import { RouletteParticipant } from "./rouletteTextureGenerator";

/**
 * Generador de textura de ultra-alta resolución para el paño de ruleta de casino (2048 x 1024).
 * Combina un terciopelo verde esmeralda con ribetes dorados, tipografía nítida y alineación milimétrica
 * con los colisionadores de apuestas 3D (0, 1-36, 2:1, Docenas y Apuestas Simples).
 */
export function generateCasinoFeltTexture(
  participants?: RouletteParticipant[],
  winnerIndex?: number | null
): THREE.CanvasTexture | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Fondo terciopelo verde esmeralda mate de casino de alta gama
  ctx.fillStyle = "#0a4528";
  ctx.fillRect(0, 0, 2048, 1024);

  // Micro-textura mate de paño de casino
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  for (let y = 0; y < 1024; y += 4) {
    ctx.fillRect(0, y, 2048, 2);
  }
  for (let x = 0; x < 2048; x += 8) {
    ctx.fillRect(x, 0, 2, 1024);
  }

  // Ribetes dorados perimetrales con doble filete
  ctx.strokeStyle = "#c5a059";
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 1976, 952);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e6c679";
  ctx.strokeRect(48, 48, 1952, 928);

  const activeList = participants ? participants.filter((p) => p.active) : [];
  const isPersonMode = activeList.length > 0;

  if (isPersonMode) {
    // Modo ruleta de personas (selección aleatoria de participantes)
    const N = activeList.length;
    const probPct = (100 / N).toFixed(1);

    // Encabezado institucional minimalista
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 44px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MESA DE SELECCIÓN ALEATORIA DE PARTICIPANTES", 1024, 90);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 24px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      `ESPACIO MUESTRAL |Ω| = ${N} PARTICIPANTES  •  REGLA DE LAPLACE: P(i) = 1/${N} = ${probPct}%  •  SECTOR θ = ${(360 / N).toFixed(1)}°`,
      1024,
      135
    );

    // Cuadrícula adaptativa de participantes sobre el fieltro (soporta de 1 a 100+ nombres)
    const startX = 96;
    const startY = 175;
    const availW = 1856;
    const availH = 775;

    let cols = 4;
    if (N <= 4) cols = N;
    else if (N <= 8) cols = 4;
    else if (N <= 15) cols = 5;
    else if (N <= 28) cols = 7;
    else if (N <= 48) cols = 8;
    else cols = 10;

    const rows = Math.ceil(N / cols);
    const gapX = cols >= 8 ? 10 : 18;
    const gapY = rows >= 7 ? 8 : 14;
    const cardW = (availW - (cols - 1) * gapX) / cols;
    const cardH = Math.min(130, (availH - (rows - 1) * gapY) / rows);
    const compact = cardH < 72 || cardW < 190;

    activeList.forEach((person, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = startX + c * (cardW + gapX);
      const y = startY + r * (cardH + gapY);

      const isWinner = winnerIndex === idx;

      // Fondo de la casilla
      ctx.fillStyle = isWinner ? "#78350f" : "#063d23";
      ctx.fillRect(x, y, cardW, cardH);

      // Borde dorado
      ctx.strokeStyle = isWinner ? "#fef08a" : "#c5a059";
      ctx.lineWidth = isWinner ? 5 : 2;
      ctx.strokeRect(x, y, cardW, cardH);

      if (!compact) {
        // Número de orden
        ctx.fillStyle = isWinner ? "#fef08a" : "#cbd5e1";
        ctx.font = "bold 18px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`#${idx + 1}`, x + 14, y + 24);

        // Probabilidad individual
        ctx.fillStyle = isWinner ? "#ffffff" : "#94a3b8";
        ctx.font = "600 16px system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`P = 1/${N}`, x + cardW - 14, y + 24);
      }

      // Nombre del participante ajustado al tamaño de la tarjeta
      ctx.fillStyle = "#ffffff";
      const fontSize = compact
        ? Math.max(15, Math.min(22, Math.floor(cardH * 0.36)))
        : cardH < 100
        ? 24
        : 30;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      const maxChars = compact ? 12 : 18;
      const label = compact ? `${idx + 1}. ${person.name}` : person.name;
      const displayName = label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
      ctx.fillText(displayName, x + cardW / 2, y + cardH / 2 + (compact ? 2 : 10));
    });
  } else {
    // Modo ruleta europea completa (37 casillas, 2:1, docenas, suertes sencillas)
    const gridX = 320;
    const gridY = 130;
    const cellW = 115;
    const cellH = 170;

    // CASILLA DEL CERO (0) - A la izquierda de la cuadrícula
    const zeroW = 160;
    const zeroH = cellH * 3;
    ctx.fillStyle = "#047857";
    ctx.fillRect(gridX - zeroW, gridY, zeroW, zeroH);
    ctx.strokeStyle = "#c5a059";
    ctx.lineWidth = 4;
    ctx.strokeRect(gridX - zeroW, gridY, zeroW, zeroH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 110px 'Times New Roman', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("0", gridX - zeroW / 2, gridY + zeroH / 2);

    // Cuadrícula 3x12 de los números 1 al 36
    const rows = [
      [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
      [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
      [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    ];

    rows.forEach((row, rIdx) => {
      row.forEach((num, cIdx) => {
        const cx = gridX + cIdx * cellW;
        const cy = gridY + rIdx * cellH;
        const isRed = RED_NUMBERS.has(num);

        // Fondo de casilla
        ctx.fillStyle = isRed ? "#b91c1c" : "#18181b";
        ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);

        // Borde dorado
        ctx.strokeStyle = "#c5a059";
        ctx.lineWidth = 3;
        ctx.strokeRect(cx, cy, cellW, cellH);

        // Número en blanco de alta legibilidad
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num.toString(), cx + cellW / 2, cy + cellH / 2);
      });
    });

    // COLUMNAS 2 TO 1 (Extremo Derecho)
    const colX = gridX + 12 * cellW;
    const colW = 130;
    for (let r = 0; r < 3; r++) {
      const cy = gridY + r * cellH;
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(colX + 2, cy + 2, colW - 4, cellH - 4);
      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = 3;
      ctx.strokeRect(colX, cy, colW, cellH);

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("2 to 1", colX + colW / 2, cy + cellH / 2);
    }

    // DOCENAS (1st 12, 2nd 12, 3rd 12)
    const dozenY = gridY + 3 * cellH + 18;
    const dozenW = (12 * cellW) / 3; // 460
    const dozenH = 100;
    const dozenLabels = ["1ª DOCENA (1-12)", "2ª DOCENA (13-24)", "3ª DOCENA (25-36)"];

    for (let d = 0; d < 3; d++) {
      const dx = gridX + d * dozenW;
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(dx + 2, dozenY + 2, dozenW - 4, dozenH - 4);
      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = 3;
      ctx.strokeRect(dx, dozenY, dozenW, dozenH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dozenLabels[d], dx + dozenW / 2, dozenY + dozenH / 2);
    }

    // Apuestas simples (1-18, even, red, black, odd, 19-36)
    const simpleY = dozenY + dozenH + 18;
    const simpleW = (12 * cellW) / 6; // 230
    const simpleH = 100;
    const simpleSpecs = [
      { label: "1 - 18", color: "#064e3b", textColor: "#ffffff", isDiamond: false },
      { label: "PAR", color: "#064e3b", textColor: "#ffffff", isDiamond: false },
      { label: "ROJO", color: "#b91c1c", textColor: "#ffffff", isDiamond: true, diamondColor: "#ef4444" },
      { label: "NEGRO", color: "#18181b", textColor: "#ffffff", isDiamond: true, diamondColor: "#27272a" },
      { label: "IMPAR", color: "#064e3b", textColor: "#ffffff", isDiamond: false },
      { label: "19 - 36", color: "#064e3b", textColor: "#ffffff", isDiamond: false },
    ];

    simpleSpecs.forEach((spec, idx) => {
      const sx = gridX + idx * simpleW;
      ctx.fillStyle = spec.color;
      ctx.fillRect(sx + 2, simpleY + 2, simpleW - 4, simpleH - 4);
      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, simpleY, simpleW, simpleH);

      // Si es rojo o negro, dibujar un rombo clásico
      if (spec.isDiamond) {
        ctx.fillStyle = spec.diamondColor || "#ffffff";
        ctx.beginPath();
        const midX = sx + simpleW / 2;
        const midY = simpleY + simpleH / 2;
        ctx.moveTo(midX, midY - 26);
        ctx.lineTo(midX + 45, midY);
        ctx.lineTo(midX, midY + 26);
        ctx.lineTo(midX - 45, midY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#c5a059";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(spec.label, midX, midY);
      } else {
        ctx.fillStyle = spec.textColor;
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(spec.label, sx + simpleW / 2, simpleY + simpleH / 2);
      }
    });
  }

  // Generar textura optimizada
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}
