import React, { useState, useMemo } from "react";
import {
  formatCourseNumber,
  toIrreducibleFraction,
  combinationsBigInt,
  permutationsBigInt,
} from "../lib/statisticsEngine";
import { Sparkles, Binary } from "lucide-react";

interface Module7ProbabilityCountingProps {
  rawData: Record<string, any>[];
  numericColumns: string[];
  totalN: number;
}

type Operator = ">" | ">=" | "<" | "<=" | "=" | "between";

interface EventCondition {
  column: string;
  operator: Operator;
  value1: number;
  value2: number;
}

export default function Module7ProbabilityCounting({
  rawData,
  numericColumns,
  totalN,
}: Module7ProbabilityCountingProps) {
  // Condiciones para Evento A y B
  const [condA, setCondA] = useState<EventCondition>({
    column: numericColumns[0] || "",
    operator: ">",
    value1: 0,
    value2: 0,
  });

  const [condB, setCondB] = useState<EventCondition>({
    column: numericColumns[1] || numericColumns[0] || "",
    operator: ">=",
    value1: 0,
    value2: 0,
  });

  // Tamaño de subconjunto de conteo r
  const [sampleR, setSampleR] = useState<number>(3);

  // Inicializar valores medios por defecto si value1 es 0
  React.useEffect(() => {
    if (rawData.length > 0 && condA.column) {
      const vals = rawData
        .map((r) => r[condA.column])
        .filter((v) => typeof v === "number" && !isNaN(v));
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        setCondA((prev) => ({ ...prev, value1: Math.round(avg * 10) / 10 }));
      }
    }
  }, [condA.column, rawData]);

  React.useEffect(() => {
    if (rawData.length > 0 && condB.column) {
      const vals = rawData
        .map((r) => r[condB.column])
        .filter((v) => typeof v === "number" && !isNaN(v));
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        setCondB((prev) => ({ ...prev, value1: Math.round(avg * 10) / 10 }));
      }
    }
  }, [condB.column, rawData]);

  // Función evaluadora de condición
  const evaluateRow = (row: Record<string, any>, cond: EventCondition): boolean => {
    const val = row[cond.column];
    if (typeof val !== "number" || isNaN(val)) return false;

    switch (cond.operator) {
      case ">":
        return val > cond.value1;
      case ">=":
        return val >= cond.value1;
      case "<":
        return val < cond.value1;
      case "<=":
        return val <= cond.value1;
      case "=":
        return Math.abs(val - cond.value1) < 1e-6;
      case "between":
        return val >= Math.min(cond.value1, cond.value2) && val <= Math.max(cond.value1, cond.value2);
      default:
        return false;
    }
  };

  // Filtrado de la Base de Datos para Eventos A y B
  const results = useMemo(() => {
    if (totalN === 0) {
      return {
        countA: 0,
        countB: 0,
        countIntersection: 0,
        countUnion: 0,
        probA: 0,
        probB: 0,
        probIntersection: 0,
        probUnion: 0,
        probAGivenB: null,
      };
    }

    let countA = 0;
    let countB = 0;
    let countIntersection = 0;
    let countUnion = 0;

    rawData.forEach((row) => {
      const inA = evaluateRow(row, condA);
      const inB = evaluateRow(row, condB);

      if (inA) countA++;
      if (inB) countB++;
      if (inA && inB) countIntersection++;
      if (inA || inB) countUnion++;
    });

    const probA = countA / totalN;
    const probB = countB / totalN;
    const probIntersection = countIntersection / totalN;
    const probUnion = countUnion / totalN;
    const probAGivenB = countB > 0 ? countIntersection / countB : null;

    return {
      countA,
      countB,
      countIntersection,
      countUnion,
      probA,
      probB,
      probIntersection,
      probUnion,
      probAGivenB,
    };
  }, [rawData, condA, condB, totalN]);

  // Técnicas de Conteo con BigInt
  const countingResults = useMemo(() => {
    const safeR = Math.max(0, Math.min(totalN, sampleR));
    const combinations = combinationsBigInt(totalN, safeR);
    const permutations = permutationsBigInt(totalN, safeR);

    return {
      safeR,
      combinations: combinations.toString(),
      permutations: permutations.toString(),
    };
  }, [totalN, sampleR]);

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: PROBABILIDAD EMPÍRICA SOBRE LA DB */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-hairline">
          <Sparkles className="w-4 h-4 text-ink" />
          <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
            01. Probabilidad Empírica sobre el Espacio Muestral Ω (N = {totalN} registros)
          </h4>
        </div>

        {/* Constructores de Filtros para Evento A y Evento B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Constructor Evento A */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-3">
            <span className="text-[11px] font-mono font-medium text-ink uppercase tracking-wider block">
              Evento A: Filtro Cuantitativo
            </span>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={condA.column}
                onChange={(e) => setCondA({ ...condA, column: e.target.value })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono focus:outline-none focus:border-ink"
              >
                {numericColumns.map((col) => (
                  <option key={`a-${col}`} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              <select
                value={condA.operator}
                onChange={(e) => setCondA({ ...condA, operator: e.target.value as Operator })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
              >
                <option value=">">&gt; Mayor</option>
                <option value=">=">&ge; Mayor o igual</option>
                <option value="<">&lt; Menor</option>
                <option value="<=">&le; Menor o igual</option>
                <option value="=">= Exacto</option>
                <option value="between">Entre valores</option>
              </select>

              <input
                type="number"
                step="any"
                value={condA.value1}
                onChange={(e) => setCondA({ ...condA, value1: Number(e.target.value) })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
                placeholder="Valor 1"
              />
            </div>
            {condA.operator === "between" && (
              <input
                type="number"
                step="any"
                value={condA.value2}
                onChange={(e) => setCondA({ ...condA, value2: Number(e.target.value) })}
                className="w-full px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
                placeholder="Valor 2 (límite superior)"
              />
            )}
            <div className="text-xs text-ink font-mono font-medium">
              Casos favorables: |A| = {results.countA} de {totalN} registros
            </div>
          </div>

          {/* Constructor Evento B */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-3">
            <span className="text-[11px] font-mono font-medium text-ink uppercase tracking-wider block">
              Evento B: Filtro Cuantitativo
            </span>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={condB.column}
                onChange={(e) => setCondB({ ...condB, column: e.target.value })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono focus:outline-none focus:border-ink"
              >
                {numericColumns.map((col) => (
                  <option key={`b-${col}`} value={col}>
                    {col}
                  </option>
                ))}
              </select>

              <select
                value={condB.operator}
                onChange={(e) => setCondB({ ...condB, operator: e.target.value as Operator })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
              >
                <option value=">">&gt; Mayor</option>
                <option value=">=">&ge; Mayor o igual</option>
                <option value="<">&lt; Menor</option>
                <option value="<=">&le; Menor o igual</option>
                <option value="=">= Exacto</option>
                <option value="between">Entre valores</option>
              </select>

              <input
                type="number"
                step="any"
                value={condB.value1}
                onChange={(e) => setCondB({ ...condB, value1: Number(e.target.value) })}
                className="px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
                placeholder="Valor 1"
              />
            </div>
            {condB.operator === "between" && (
              <input
                type="number"
                step="any"
                value={condB.value2}
                onChange={(e) => setCondB({ ...condB, value2: Number(e.target.value) })}
                className="w-full px-2.5 py-2 rounded-inputs border border-hairline text-xs bg-paper text-ink font-mono font-bold focus:outline-none focus:border-ink"
                placeholder="Valor 2 (límite superior)"
              />
            )}
            <div className="text-xs text-ink font-mono font-medium">
              Casos favorables: |B| = {results.countB} de {totalN} registros
            </div>
          </div>
        </div>

        {/* Tarjetas de Probabilidades Calculadas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* P(A) */}
          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] font-mono uppercase text-mid-gray block mb-1">P(A)</span>
            <span className="text-lg font-bold text-ink font-mono block">
              {toIrreducibleFraction(results.countA, totalN)}
            </span>
            <span className="text-xs text-mid-gray font-mono block">
              {formatCourseNumber(results.probA)} ({(results.probA * 100).toFixed(1)}%)
            </span>
          </div>

          {/* P(B) */}
          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] font-mono uppercase text-mid-gray block mb-1">P(B)</span>
            <span className="text-lg font-bold text-ink font-mono block">
              {toIrreducibleFraction(results.countB, totalN)}
            </span>
            <span className="text-xs text-mid-gray font-mono block">
              {formatCourseNumber(results.probB)} ({(results.probB * 100).toFixed(1)}%)
            </span>
          </div>

          {/* P(A ∩ B) */}
          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] font-mono uppercase text-mid-gray block mb-1">P(A ∩ B)</span>
            <span className="text-lg font-bold text-ink font-mono block">
              {toIrreducibleFraction(results.countIntersection, totalN)}
            </span>
            <span className="text-xs text-mid-gray font-mono block">
              {formatCourseNumber(results.probIntersection)} ({(results.probIntersection * 100).toFixed(1)}%)
            </span>
          </div>

          {/* P(A ∪ B) */}
          <div className="p-4 rounded-nested bg-surface-alt border border-hairline">
            <span className="text-[11px] font-mono uppercase text-mid-gray block mb-1">P(A ∪ B)</span>
            <span className="text-lg font-bold text-ink font-mono block">
              {toIrreducibleFraction(results.countUnion, totalN)}
            </span>
            <span className="text-xs text-mid-gray font-mono block">
              {formatCourseNumber(results.probUnion)} ({(results.probUnion * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Probabilidad Condicional P(A | B) */}
        <div className="p-4 sm:p-5 rounded-nested bg-surface-alt border border-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink uppercase tracking-wide font-mono">
              Probabilidad Condicional: P(A | B)
            </span>
            <span className="text-xs font-mono font-bold text-ink">
              P(A | B) = |A ∩ B| / |B| = {results.countIntersection} / {results.countB}
            </span>
          </div>
          <p className="text-xs text-mid-gray leading-relaxed font-mono">
            {results.countB > 0
              ? `P(A | B) = ${toIrreducibleFraction(results.countIntersection, results.countB)} = ${formatCourseNumber(results.probAGivenB)} (${(results.probAGivenB! * 100).toFixed(1)}%). Sabiendo que se cumple la condición B (espacio reducido a ${results.countB} registros), la probabilidad de que también cumpla A es del ${(results.probAGivenB! * 100).toFixed(1)}%.`
              : "La condición B no tiene registros favorables (|B| = 0), por lo que la probabilidad condicional P(A|B) está matemáticamente indefinida."}
          </p>
        </div>
      </div>

      {/* SECCIÓN 2: TÉCNICAS DE CONTEO CON ARITMÉTICA BIGINT */}
      <div className="p-6 rounded-cards bg-paper border border-hairline shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-ink" />
            <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
              02. Técnicas de Conteo: Muestreo Combinatorio sobre N = {totalN}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-mid-gray">Muestra (r):</span>
            <input
              type="number"
              min="1"
              max={totalN}
              value={sampleR}
              onChange={(e) => setSampleR(Math.max(1, Math.min(totalN, Number(e.target.value))))}
              className="w-16 min-h-[38px] px-2 py-1 rounded-inputs border border-hairline bg-surface-alt text-center font-bold text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Combinaciones C(N, r) */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wide block font-mono">
              Combinaciones: C({totalN}, {countingResults.safeR})
            </span>
            <span className="text-xs text-mid-gray block">
              El orden NO importa (ej. conformar un comité, grupo de estudio o muestra de control).
            </span>
            <div className="text-xs font-mono bg-paper p-2.5 rounded-inputs border border-hairline text-ink">
              C(N, r) = N! / [r! · (N - r)!]
            </div>
            <div className="p-3 rounded-inputs bg-paper border border-hairline text-ink font-mono font-bold text-sm break-all">
              {countingResults.combinations}
            </div>
          </div>

          {/* Permutaciones P(N, r) */}
          <div className="p-5 rounded-nested bg-surface-alt border border-hairline space-y-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wide block font-mono">
              Permutaciones: P({totalN}, {countingResults.safeR})
            </span>
            <span className="text-xs text-mid-gray block">
              El orden SÍ importa (ej. asignación de cargos jerárquicos o turnos de auditoría).
            </span>
            <div className="text-xs font-mono bg-paper p-2.5 rounded-inputs border border-hairline text-ink">
              P(N, r) = N! / (N - r)!
            </div>
            <div className="p-3 rounded-inputs bg-paper border border-hairline text-ink font-mono font-bold text-sm break-all">
              {countingResults.permutations}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
