import * as THREE from "three";

/**
 * Generador procedural de alfombra de casino de lujo (1024 x 1024)
 * Diseñado con patrones de damasco y arabescos dorados sobre fondo carmesí profundo.
 */
export function generateCasinoCarpetTexture(): THREE.CanvasTexture | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  // Fondo terciopelo rojo carmesí / borgoña profundo de casino
  ctx.fillStyle = "#3b0a0e";
  ctx.fillRect(0, 0, 1024, 1024);

  // Cuadrícula alterna de rombos
  const step = 128;
  for (let x = 0; x < 1024; x += step) {
    for (let y = 0; y < 1024; y += step) {
      if ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) {
        ctx.fillStyle = "#2c0609";
        ctx.fillRect(x, y, step, step);
      }
    }
  }

  // Florituras y rosetas doradas de alfombra de lujo
  for (let x = 64; x < 1024; x += step) {
    for (let y = 64; y < 1024; y += step) {
      // Círculo exterior dorado sutil
      ctx.beginPath();
      ctx.arc(x, y, 36, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Rombos decorativos interiores
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -18, 36, 36);

      // Núcleo dorado cálido
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 191, 36, 0.5)";
      ctx.fill();
      ctx.restore();
    }
  }

  // Conexiones de arabescos entre motivos
  ctx.strokeStyle = "rgba(217, 119, 6, 0.25)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Textura suave de trama de tejido
  ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
  for (let y = 0; y < 1024; y += 4) {
    ctx.fillRect(0, y, 1024, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}
