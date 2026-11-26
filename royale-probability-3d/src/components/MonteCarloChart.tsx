"use client";

import React, { useMemo } from "react";
import { MonteCarloDataPoint } from "../types/probability";
import { formatCourseNumber } from "../lib/probabilityEngine";

interface MonteCarloChartProps {
  dataPoints: MonteCarloDataPoint[];
  theoreticalPA: number;
  totalN: number;
}

export default function MonteCarloChart({
  dataPoints,
  theoreticalPA,
  totalN,
}: MonteCarloChartProps) {
  // Muestreo si hay más de 300 puntos para rendimiento óptimo del SVG
  const sampledPoints = useMemo(() => {
    if (dataPoints.length <= 300) return dataPoints;
    const step = Math.ceil(dataPoints.length / 300);
    const result: MonteCarloDataPoint[] = [];
    for (let i = 0; i < dataPoints.length; i += step) {
      result.push(dataPoints[i]);
    }
    // Asegurar siempre el último punto
    if (result[result.length - 1] !== dataPoints[dataPoints.length - 1]) {
      result.push(dataPoints[dataPoints.length - 1]);
    }
    return result;
  }, [dataPoints]);

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Escala Y de 0.0 a 1.0
  const getY = (val: number) => padding.top + plotHeight - Math.max(0, Math.min(1, val)) * plotHeight;
  // Escala X de 1 a totalN
  const getX = (iter: number) => {
    if (totalN <= 1) return padding.left;
    return padding.left + ((iter - 1) / (totalN - 1)) * plotWidth;
  };

  const theoreticalY = getY(theoreticalPA);

  // Generar path SVG para la frecuencia empírica
  const pathD = useMemo(() => {
    if (sampledPoints.length === 0) return "";
    return sampledPoints.reduce((acc, pt, idx) => {
      const x = getX(pt.iteration);
      const y = getY(pt.empiricalFreqA);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [sampledPoints, totalN]);

  const lastPoint = dataPoints[dataPoints.length - 1];
  const lastEmpirical = lastPoint ? lastPoint.empiricalFreqA : 0;
  const error = Math.abs(lastEmpirical - theoreticalPA);

  return (
    <div className="w-full bg-obsidian-950/80 rounded-xl border border-zinc-800 p-3.5 text-zinc-300">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/80">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Convergencia: Ley de los Grandes Números
        </span>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-gold-400 inline-block" />
            <span className="text-gold-300">P(A) = {formatCourseNumber(theoreticalPA)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-cyan-300">hN = {formatCourseNumber(lastEmpirical)}</span>
          </div>
          <div className="text-emerald-400">
            Error: {formatCourseNumber(error)}
          </div>
        </div>
      </div>

      {dataPoints.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-xs text-zinc-500 italic">
          Presiona "Girar 1 Giro", "100 Giros" o "1,000 Giros" para observar la convergencia empírica.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Rejilla Y (0, 0.25, 0.5, 0.75, 1.0) */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((level) => {
              const y = getY(level);
              return (
                <g key={`grid-${level}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-zinc-500 font-mono"
                  >
                    {level.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Línea horizontal de Probabilidad Teórica P(A) */}
            <line
              x1={padding.left}
              y1={theoreticalY}
              x2={width - padding.right}
              y2={theoreticalY}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5 3"
            />

            {/* Curva de Frecuencia Relativa Empírica h_i */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Marcador del último punto */}
            {lastPoint && (
              <circle
                cx={getX(lastPoint.iteration)}
                cy={getY(lastPoint.empiricalFreqA)}
                r="4"
                className="fill-cyan-400 stroke-obsidian-950 stroke-2"
              />
            )}
          </svg>

          {/* Ejes etiquetas */}
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono px-8 mt-1">
            <span>N = 1</span>
            <span>N = {Math.round(totalN / 2)}</span>
            <span>N = {totalN} giros</span>
          </div>
        </div>
      )}
    </div>
  );
}

