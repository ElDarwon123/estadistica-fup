import React, { useState } from "react";
import { type DispersionResult, formatCourseNumber } from "../lib/statisticsEngine";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";

interface Module5DispersionProps {
  disp: DispersionResult;
  mean: number;
  unit: string;
}

export default function Module5Dispersion({ disp, mean, unit }: Module5DispersionProps) {
  const [showTable, setShowTable] = useState(false);
  const u = unit ? ` ${unit}` : "";

  // Coordenadas SVG para el diagrama de Boxplot
  const svgWidth = 600;
  const svgHeight = 120;
  const paddingX = 50;
  const plotWidth = svgWidth - paddingX * 2;

  // Rango global incluyendo posibles atípicos y cercas
  const allValues = [
    disp.minVal,
    disp.maxVal,
    disp.lowerFenceLI,
    disp.upperFenceLS,
    ...disp.outliers,
  ];
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const globalSpan = globalMax - globalMin || 1;

  const getSvgX = (val: number) => {
    return paddingX + ((val - globalMin) / globalSpan) * plotWidth;
  };

  const xLI = getSvgX(disp.lowerFenceLI);
  const xQ1 = getSvgX(disp.q1);
  const xQ2 = getSvgX(disp.q2);
  const xQ3 = getSvgX(disp.q3);
  const xLS = getSvgX(disp.upperFenceLS);

  return (
    <div className="space-y-6">
      {/* Cuatro Tarjetas de Medidas de Dispersión (Stat Blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Rango Total */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
            Rango Total (R)
          </span>
          <div className="text-3xl font-semibold tracking-tighter text-ink font-mono my-2">
            {formatCourseNumber(disp.rangeR)}
            <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
          </div>
          <span className="text-[11px] text-mid-gray font-mono">
            R = máx ({formatCourseNumber(disp.maxVal)}) - mín ({formatCourseNumber(disp.minVal)})
          </span>
        </div>

        {/* Rango Intercuartílico (RIC) */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
            Rango Intercuartílico (RIC)
          </span>
          <div className="text-3xl font-semibold tracking-tighter text-ink font-mono my-2">
            {formatCourseNumber(disp.iqr)}
            <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
          </div>
          <span className="text-[11px] text-mid-gray font-mono">
            RIC = Q3 ({formatCourseNumber(disp.q3)}) - Q1 ({formatCourseNumber(disp.q1)})
          </span>
        </div>

        {/* Desviación Estándar */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
            Desviación Estándar (σ)
          </span>
          <div className="text-3xl font-semibold tracking-tighter text-ink font-mono my-2">
            {formatCourseNumber(disp.stdDevPop)}
            <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
          </div>
          <span className="text-[11px] text-mid-gray font-mono">
            Varianza σ² = {formatCourseNumber(disp.variancePop)}
          </span>
        </div>

        {/* Coeficiente de Variación */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
            Coef. Variación (CV)
          </span>
          <div className="text-3xl font-semibold tracking-tighter text-ink font-mono my-2">
            {formatCourseNumber(disp.coefficientOfVariation)}%
          </div>
          <span className="text-[11px] font-mono font-medium text-ink bg-surface-alt px-2 py-0.5 rounded-badges border border-hairline self-start">
            {disp.homogeneityLabel}
          </span>
        </div>
      </div>

      {/* Acordeón Desplegable: Tabla de Desviaciones de 3 Columnas */}
      <div className="rounded-cards border border-hairline bg-paper shadow-subtle overflow-hidden">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-alt transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-ink" />
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
                Paso a Paso de Varianza: Tabla de Desviaciones (3 Columnas)
              </h4>
              <span className="text-xs text-mid-gray font-mono">
                Procedimiento formal: Σ (xi - x̄)² = {formatCourseNumber(disp.sumDiffSquared)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-ink bg-surface-alt px-3 py-1.5 rounded-buttons border border-hairline">
            <span>{showTable ? "Ocultar Tabla" : "Ver Tabla Completa"}</span>
            {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showTable && (
          <div className="border-t border-hairline p-5">
            <div className="max-h-80 overflow-y-auto rounded-nested border border-hairline">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-alt sticky top-0 text-mid-gray uppercase tracking-wider text-[11px] border-b border-hairline">
                  <tr>
                    <th className="px-4 py-2.5 text-center">#</th>
                    <th className="px-4 py-2.5">xi (Dato)</th>
                    <th className="px-4 py-2.5">xi - x̄ (Desviación)</th>
                    <th className="px-4 py-2.5">(xi - x̄)² (Desviación Cuadrática)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {disp.deviationTable.map((row, idx) => (
                    <tr key={`dev-${idx}`} className="hover:bg-surface-alt transition-colors">
                      <td className="px-4 py-2 text-center text-mid-gray">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold">{formatCourseNumber(row.xi)}</td>
                      <td className="px-4 py-2 text-mid-gray">
                        {formatCourseNumber(row.diff)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-ink">
                        {formatCourseNumber(row.diffSquared)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-alt font-bold sticky bottom-0 border-t-2 border-hairline text-ink">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 text-right uppercase text-[11px] text-mid-gray">
                      Sumatoria Total Σ (xi - x̄)²:
                    </td>
                    <td className="px-4 py-2.5 font-black">
                      {formatCourseNumber(disp.sumDiffSquared)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 p-3.5 bg-surface-alt rounded-nested border border-hairline text-xs font-mono text-ink flex flex-wrap gap-6 justify-between">
              <div>
                <strong>Varianza Poblacional:</strong> σ² = {formatCourseNumber(disp.sumDiffSquared)} / {disp.deviationTable.length} = {formatCourseNumber(disp.variancePop)}
              </div>
              <div>
                <strong>Desviación Poblacional:</strong> σ = √({formatCourseNumber(disp.variancePop)}) = {formatCourseNumber(disp.stdDevPop)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detector de Valores Atípicos (Regla 1.5 x RIC) & Diagrama de Caja (Boxplot) */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <AlertOctagon className={`w-4 h-4 ${disp.outliers.length > 0 ? "text-ember" : "text-ink"}`} />
            <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
              Detector de Valores Atípicos (Criterio de Tukey: 1.5 × RIC)
            </h4>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-badges bg-surface-alt text-ink border border-hairline">
            RIC = {formatCourseNumber(disp.iqr)}
          </span>
        </div>

        {/* Límites de Tukey */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] text-mid-gray font-mono uppercase block mb-1">Límite Inferior (LI):</span>
            <span className="text-xl font-bold text-ink font-mono block mb-1">
              {formatCourseNumber(disp.lowerFenceLI)} {u}
            </span>
            <span className="text-[11px] text-mid-gray font-mono">
              LI = Q1 - 1.5(RIC) = {formatCourseNumber(disp.q1)} - 1.5({formatCourseNumber(disp.iqr)})
            </span>
          </div>

          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] text-mid-gray font-mono uppercase block mb-1">Límite Superior (LS):</span>
            <span className="text-xl font-bold text-ink font-mono block mb-1">
              {formatCourseNumber(disp.upperFenceLS)} {u}
            </span>
            <span className="text-[11px] text-mid-gray font-mono">
              LS = Q3 + 1.5(RIC) = {formatCourseNumber(disp.q3)} + 1.5({formatCourseNumber(disp.iqr)})
            </span>
          </div>
        </div>

        {/* Diagnóstico de Atípicos Encontrados */}
        <div className="p-4 rounded-nested border flex items-center justify-between text-xs font-mono">
          {disp.outliers.length === 0 ? (
            <div className="flex items-center gap-2 text-ink">
              <CheckCircle2 className="w-4 h-4 text-ink" />
              <span>No se detectaron valores atípicos en la muestra (todos los datos están contenidos dentro de [LI, LS]).</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-ember">
              <AlertOctagon className="w-4 h-4 text-ember flex-shrink-0" />
              <span>
                Se detectaron {disp.outliers.length} valores atípicos severos:{" "}
                <strong className="text-ember font-bold">
                  {disp.outliers.map((o) => formatCourseNumber(o) + u).join(", ")}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Diagrama de Caja y Bigotes (Boxplot) en SVG Nativo Monocromático */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider block mb-2 font-mono">
            Diagrama de Caja y Bigotes (Boxplot Clínico)
          </span>
          <div className="w-full overflow-x-auto bg-surface-alt p-5 rounded-nested border border-hairline">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[650px] mx-auto overflow-visible">
              {/* Eje horizontal */}
              <line x1={paddingX} y1={60} x2={svgWidth - paddingX} y2={60} stroke="#d4d4d4" strokeWidth="1" strokeDasharray="3 3" />

              {/* Bigote izquierdo (desde LI hasta Q1) */}
              <line x1={Math.max(paddingX, xLI)} y1={60} x2={xQ1} y2={60} stroke="#0a0a0a" strokeWidth="1.5" />
              <line x1={Math.max(paddingX, xLI)} y1={45} x2={Math.max(paddingX, xLI)} y2={75} stroke="#0a0a0a" strokeWidth="1.5" />

              {/* Caja intercuartílica (desde Q1 hasta Q3) */}
              <rect
                x={xQ1}
                y={35}
                width={Math.max(2, xQ3 - xQ1)}
                height={50}
                fill="#ffffff"
                stroke="#0a0a0a"
                strokeWidth="1.5"
                rx="4"
              />

              {/* Línea de la Mediana (Q2) */}
              <line x1={xQ2} y1={35} x2={xQ2} y2={85} stroke="#0a0a0a" strokeWidth="2.5" />

              {/* Bigote derecho (desde Q3 hasta LS) */}
              <line x1={xQ3} y1={60} x2={Math.min(svgWidth - paddingX, xLS)} y2={60} stroke="#0a0a0a" strokeWidth="1.5" />
              <line x1={Math.min(svgWidth - paddingX, xLS)} y1={45} x2={Math.min(svgWidth - paddingX, xLS)} y2={75} stroke="#0a0a0a" strokeWidth="1.5" />

              {/* Valores Atípicos como puntos rojos ember */}
              {disp.outliers.map((outlier, i) => {
                const ox = getSvgX(outlier);
                return (
                  <circle
                    key={`outlier-dot-${i}`}
                    cx={ox}
                    cy={60}
                    r={5}
                    className="fill-ember stroke-paper stroke-2"
                  />
                );
              })}

              {/* Etiquetas numéricas */}
              <text x={Math.max(paddingX, xLI)} y={98} textAnchor="middle" className="text-[10px] fill-mid-gray font-mono">
                LI: {formatCourseNumber(disp.lowerFenceLI)}
              </text>
              <text x={xQ1} y={24} textAnchor="middle" className="text-[10px] fill-ink font-bold font-mono">
                Q1: {formatCourseNumber(disp.q1)}
              </text>
              <text x={xQ2} y={108} textAnchor="middle" className="text-[10px] fill-ink font-bold font-mono">
                Me: {formatCourseNumber(disp.q2)}
              </text>
              <text x={xQ3} y={24} textAnchor="middle" className="text-[10px] fill-ink font-bold font-mono">
                Q3: {formatCourseNumber(disp.q3)}
              </text>
              <text x={Math.min(svgWidth - paddingX, xLS)} y={98} textAnchor="middle" className="text-[10px] fill-mid-gray font-mono">
                LS: {formatCourseNumber(disp.upperFenceLS)}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
