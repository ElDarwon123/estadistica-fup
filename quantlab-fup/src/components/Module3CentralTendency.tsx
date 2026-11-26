import React from "react";
import { type CentralTendencyResult, formatCourseNumber } from "../lib/statisticsEngine";
import { Target, Activity, BarChart2, Scale } from "lucide-react";

interface Module3CentralTendencyProps {
  ct: CentralTendencyResult;
  unit: string;
}

export default function Module3CentralTendency({ ct, unit }: Module3CentralTendencyProps) {
  const u = unit ? ` ${unit}` : "";

  return (
    <div className="space-y-6">
      {/* 1. Tres Tarjetas Principales de Tendencia Central (Stat Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Media Aritmética */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                Media Aritmética (x̄)
              </span>
              <Target className="w-4 h-4 text-ink" />
            </div>
            <div className="text-4xl font-semibold tracking-tighter text-ink font-mono mb-1.5">
              {formatCourseNumber(ct.mean)}
              <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
            </div>
            <p className="text-xs text-mid-gray leading-relaxed">
              Punto de equilibrio o centro de gravedad del conjunto muestral.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink bg-surface-alt p-3 rounded-nested">
            {ct.meanCalculationSteps}
          </div>
        </div>

        {/* Mediana */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                Mediana (Me)
              </span>
              <Activity className="w-4 h-4 text-ink" />
            </div>
            <div className="text-4xl font-semibold tracking-tighter text-ink font-mono mb-1.5">
              {formatCourseNumber(ct.median)}
              <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
            </div>
            <p className="text-xs text-mid-gray leading-relaxed">
              Valor central que divide la muestra en dos mitades simétricas (50%).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink bg-surface-alt p-3 rounded-nested">
            {ct.medianCalculationSteps}
          </div>
        </div>

        {/* Moda */}
        <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-mid-gray">
                Moda (Mo)
              </span>
              <BarChart2 className="w-4 h-4 text-ink" />
            </div>
            <div className="text-4xl font-semibold tracking-tighter text-ink font-mono mb-1.5">
              {ct.modes.length > 0
                ? ct.modes.map((m) => formatCourseNumber(m)).join(", ")
                : "Amodal"}
              <span className="text-xs font-normal text-mid-gray ml-1 font-mono">{u}</span>
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-badges text-[11px] font-mono font-medium bg-surface-alt text-ink border border-hairline mb-2">
              {ct.modeType}
            </span>
          </div>
          <div className="mt-2 pt-3 border-t border-hairline text-[11px] text-mid-gray bg-surface-alt p-3 rounded-nested font-mono">
            {ct.modeExplanation}
          </div>
        </div>
      </div>

      {/* 2. Diagnóstico de Asimetría y Forma de la Distribución */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Scale className="w-4 h-4 text-ink" />
          <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
            Diagnóstico de Asimetría y Comparación x̄ vs Me
          </h4>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-5 rounded-nested bg-surface-alt border border-hairline">
          {/* Comparación x̄ vs Me */}
          <div className="flex items-center gap-4 font-mono">
            <div className="text-center">
              <span className="text-[10px] text-mid-gray uppercase block">x̄ (Media)</span>
              <span className="text-xl font-bold text-ink">
                {formatCourseNumber(ct.mean)}
              </span>
            </div>
            <span className="text-mid-gray font-bold text-lg">
              {Math.abs(ct.mean - ct.median) < 0.05 ? "≈" : ct.mean > ct.median ? ">" : "<"}
            </span>
            <div className="text-center">
              <span className="text-[10px] text-mid-gray uppercase block">Me (Mediana)</span>
              <span className="text-xl font-bold text-ink">
                {formatCourseNumber(ct.median)}
              </span>
            </div>
          </div>

          {/* Badge del tipo de sesgo */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-badges bg-ink text-paper text-xs font-mono font-medium mb-1.5">
              <span>{ct.skewness}</span>
            </div>
            <p className="text-xs text-mid-gray leading-relaxed font-sans">
              {ct.skewnessExplanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
