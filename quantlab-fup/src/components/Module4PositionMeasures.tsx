import React, { useState, useMemo } from "react";
import {
  computePositionMeasure,
  formatCourseNumber,
} from "../lib/statisticsEngine";
import { Compass, Sliders, BookmarkCheck } from "lucide-react";

interface Module4PositionMeasuresProps {
  data: number[];
  unit: string;
}

export default function Module4PositionMeasures({ data, unit }: Module4PositionMeasuresProps) {
  const [selectedPercentile, setSelectedPercentile] = useState<number>(85);
  const u = unit ? ` ${unit}` : "";

  // Cuartiles Q1, Q2, Q3
  const q1 = useMemo(() => computePositionMeasure(data, 1, 4, "Q"), [data]);
  const q2 = useMemo(() => computePositionMeasure(data, 2, 4, "Q"), [data]);
  const q3 = useMemo(() => computePositionMeasure(data, 3, 4, "Q"), [data]);

  // Deciles D1 a D9
  const deciles = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => computePositionMeasure(data, i + 1, 10, "D"));
  }, [data]);

  // Percentil interactivo actual
  const currentPercentile = useMemo(() => {
    return computePositionMeasure(data, selectedPercentile, 100, "P");
  }, [data, selectedPercentile]);

  return (
    <div className="space-y-6">
      {/* 1. Cuartiles Fijos (Q1, Q2, Q3) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-ink" />
          <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
            01. Cuartiles de la Distribución (Q1, Q2, Q3)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[q1, q2, q3].map((q) => (
            <div
              key={q.symbol}
              className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                    {q.symbol === "Q1" ? "Primer Cuartil (Q1 - 25%)" : q.symbol === "Q2" ? "Segundo Cuartil (Q2 - 50% = Me)" : "Tercer Cuartil (Q3 - 75%)"}
                  </span>
                  {q.equivalences.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-badges bg-surface-alt text-ink font-mono border border-hairline">
                      {q.equivalences.join(" • ")}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-semibold tracking-tighter text-ink font-mono mb-1.5">
                  {formatCourseNumber(q.value)}
                  <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink bg-surface-alt p-3 rounded-nested leading-relaxed">
                {q.procedureText}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Deciles Clave (D1 a D9) */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-4">
        <h4 className="text-sm font-semibold tracking-tight text-ink uppercase flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-ink" />
          <span>02. Deciles de la Muestra (D1 hasta D9)</span>
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5">
          {deciles.map((d) => (
            <div
              key={d.symbol}
              className="p-3 rounded-nested bg-surface-alt border border-hairline text-center"
            >
              <span className="text-[10px] font-mono text-mid-gray uppercase block mb-1">
                {d.symbol} ({(d.k * 10)}%)
              </span>
              <span className="text-sm font-bold text-ink font-mono">
                {formatCourseNumber(d.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Calculadora Interactiva de Percentiles (P1 a P99) */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-ink" />
            <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
              03. Calculadora Interactiva de Percentiles (P1 a P99)
            </h4>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-badges bg-surface-alt text-ink border border-hairline">
            P_{selectedPercentile} = {selectedPercentile}% acumulado
          </span>
        </div>

        {/* Slider interactivo y control numérico */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="99"
              value={selectedPercentile}
              onChange={(e) => setSelectedPercentile(Number(e.target.value))}
              className="flex-1 h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer accent-ink"
            />
            <input
              type="number"
              min="1"
              max="99"
              value={selectedPercentile}
              onChange={(e) => setSelectedPercentile(Math.max(1, Math.min(99, Number(e.target.value))))}
              className="w-16 min-h-[40px] px-2 py-1 rounded-inputs border border-hairline text-center font-mono font-bold text-sm bg-surface-alt text-ink focus:outline-none focus:border-ink"
            />
          </div>

          {/* Resultado y Paso a Paso Completo */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-mid-gray uppercase font-mono block">
                  Valor Resultante del Percentil {selectedPercentile}:
                </span>
                <span className="text-3xl font-semibold tracking-tighter text-ink font-mono">
                  {formatCourseNumber(currentPercentile.value)}
                  <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
                </span>
              </div>
              {currentPercentile.equivalences.length > 0 && (
                <div className="text-right">
                  <span className="text-[11px] font-mono text-mid-gray uppercase block">
                    Equivalencia Oficial:
                  </span>
                  <span className="text-xs font-mono font-bold text-ink">
                    {currentPercentile.equivalences.join(" = ")}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-hairline text-xs font-mono text-ink leading-relaxed">
              {currentPercentile.procedureText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
