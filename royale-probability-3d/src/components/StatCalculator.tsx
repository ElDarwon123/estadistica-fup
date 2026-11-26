"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calculator,
  Upload,
  Sparkles,
  Shuffle,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart,
  LineChart,
  BookOpen,
  Info,
  CheckCircle2,
  Table as TableIcon,
  HelpCircle,
  Hash,
  Sliders,
  Layers,
} from "lucide-react";
import {
  performStatAnalysis,
  parseRawTextToNumbers,
  parseFileToNumbers,
  formatStat,
  calculatePositionMeasure,
  CompleteStatAnalysis,
  PositionCalculationStep,
} from "../lib/statCalculatorEngine";

export default function StatCalculator() {
  // Datos iniciales de prueba (25 datos representativos para N < 40)
  const [rawInputText, setRawInputText] = useState<string>(
    "12, 15, 14, 18, 20, 15, 22, 19, 17, 16, 25, 20, 18, 15, 21, 24, 19, 18, 17, 23, 20, 19, 16, 22, 30"
  );
  const [unitInput, setUnitInput] = useState<string>("horas");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Toggle de forzar agrupación (automático por defecto)
  const [groupingOverride, setGroupingOverride] = useState<"auto" | "no_grouped" | "grouped">("auto");

  // Acordeón de tabla de varianza desplegable
  const [showVarianceTable, setShowVarianceTable] = useState<boolean>(false);

  // Selector interactivo de posición (Percentil o Decil personalizado)
  const [positionType, setPositionType] = useState<"decil" | "percentil">("percentil");
  const [positionK, setPositionK] = useState<number>(75);

  // Pestaña visual de gráficos
  const [activeChartTab, setActiveChartTab] = useState<"bar" | "polygon" | "pie">("bar");

  // Generador aleatorio
  const [randomCount, setRandomCount] = useState<number>(50);
  const [randomMin, setRandomMin] = useState<number>(10);
  const [randomMax, setRandomMax] = useState<number>(100);
  const [randomDecimals, setRandomDecimals] = useState<boolean>(false);

  // Parsear datos actuales
  const parsedData = useMemo(() => {
    return parseRawTextToNumbers(rawInputText);
  }, [rawInputText]);

  // Actualizar warning si excede 100
  useEffect(() => {
    if (parsedData.warning) {
      setWarningMessage(parsedData.warning);
    } else {
      setWarningMessage(null);
    }
  }, [parsedData.warning]);

  // Análisis estadístico completo
  const analysis: CompleteStatAnalysis | null = useMemo(() => {
    if (parsedData.numbers.length === 0) return null;
    try {
      const forceGrouped =
        groupingOverride === "auto"
          ? undefined
          : groupingOverride === "grouped";
      return performStatAnalysis(parsedData.numbers, unitInput, forceGrouped);
    } catch {
      return null;
    }
  }, [parsedData.numbers, unitInput, groupingOverride]);

  // Cálculo interactivo de posición seleccionado por el usuario
  const customPositionStep: PositionCalculationStep | null = useMemo(() => {
    if (!analysis || analysis.sortedData.length === 0) return null;
    if (positionType === "decil") {
      const k = Math.max(1, Math.min(9, positionK));
      return calculatePositionMeasure(analysis.sortedData, k, 10, "Decil");
    } else {
      const k = Math.max(1, Math.min(99, positionK));
      return calculatePositionMeasure(analysis.sortedData, k, 100, "Percentil");
    }
  }, [analysis, positionType, positionK]);

  // Manejador de archivo (CSV, XLSX, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseFileToNumbers(file);
      setRawInputText(result.numbers.join(", "));
      if (result.warning) setWarningMessage(result.warning);
      else setWarningMessage(null);
    } catch (err) {
      setWarningMessage("Error al leer el archivo. Asegúrate de que contenga datos numéricos válidos.");
    }
    e.target.value = "";
  };

  // Generador aleatorio de datos
  const generateRandomSample = () => {
    const count = Math.min(100, Math.max(5, randomCount));
    const nums: number[] = [];
    for (let i = 0; i < count; i++) {
      if (randomDecimals) {
        const val = Math.random() * (randomMax - randomMin) + randomMin;
        nums.push(Math.round(val * 100) / 100);
      } else {
        const val = Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin;
        nums.push(val);
      }
    }
    setRawInputText(nums.join(", "));
    setWarningMessage(null);
  };

  const unitSuffix = unitInput.trim() ? ` ${unitInput.trim()}` : "";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100">
      {/* 1. ENCABEZADO DE LA CALCULADORA ESTADÍSTICA (MINIMALISTA) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                PROGRAMA 2 • CURSO DE ESTADÍSTICA
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
                LÍMITE ESTRICTO: MÁX. 100 DATOS
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
              Calculadora Estadística y Análisis de Frecuencias
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Cálculo riguroso de frecuencias, medidas de tendencia central, cuartiles/deciles/percentiles con
              interpolación lineal, dispersión, varianza poblacional, atípicos e interpretación automática.
            </p>
          </div>

          {/* Campo de Unidad de Medida */}
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col gap-1 self-start md:self-auto">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Unidad de Medida (Editable):
            </label>
            <input
              type="text"
              value={unitInput}
              onChange={(e) => setUnitInput(e.target.value)}
              placeholder="ej. kg, horas, años, notas..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* ALERTA DE LÍMITE DE 100 DATOS */}
      {warningMessage && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-4 flex items-center gap-3 text-amber-200 text-xs shadow-lg animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* 2. PANEL DE INGESTA DE DATOS (MANUAL, ARCHIVO, ALEATORIO) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Ingreso de Datos Numéricos ({parsedData.numbers.length} / 100)
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Criterio de Agrupación Switch */}
            <span className="text-slate-400 hidden sm:inline">Criterio:</span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setGroupingOverride("auto")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  groupingOverride === "auto"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Automático: N < 40 No agrupados, N >= 40 Agrupados (Sturges)"
              >
                Auto (N&lt;40 / N&ge;40)
              </button>
              <button
                type="button"
                onClick={() => setGroupingOverride("no_grouped")}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                  groupingOverride === "no_grouped"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                No Agrupados
              </button>
              <button
                type="button"
                onClick={() => setGroupingOverride("grouped")}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                  groupingOverride === "grouped"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Agrupados
              </button>
            </div>
          </div>
        </div>

        {/* Área de texto de entrada */}
        <textarea
          rows={3}
          value={rawInputText}
          onChange={(e) => setRawInputText(e.target.value)}
          placeholder="Ingresa números separados por comas, espacios o saltos de línea (ej. 12, 15.5, 18, 20)..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
        />

        {/* Acciones de carga: Archivo y Generador Aleatorio */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Carga de archivo CSV / XLSX / TXT */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-emerald-300 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cargar Archivo (.csv, .xlsx, .txt)</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Ejemplos rápidos predefinidos */}
            <button
              type="button"
              onClick={() => {
                setRawInputText("12, 15, 14, 18, 20, 15, 22, 19, 17, 16, 25, 20, 18, 15, 21, 24, 19, 18, 17, 23, 20, 19, 16, 22, 30");
                setUnitInput("horas");
              }}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Muestra N=25 (No Agrupados)
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = [
                  45, 52, 48, 60, 55, 62, 58, 50, 49, 65,
                  54, 58, 61, 53, 56, 47, 51, 59, 63, 57,
                  46, 55, 58, 62, 60, 54, 52, 57, 61, 50,
                  53, 59, 64, 48, 56, 58, 63, 51, 55, 60,
                  49, 57, 62, 54, 53, 58, 65, 50, 56, 59
                ];
                setRawInputText(sample.join(", "));
                setUnitInput("kg");
              }}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Muestra N=50 (Agrupados Sturges)
            </button>
          </div>

          {/* Generador aleatorio */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">N:</span>
            <input
              type="number"
              min={5}
              max={100}
              value={randomCount}
              onChange={(e) => setRandomCount(parseInt(e.target.value) || 30)}
              className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-emerald-300"
            />
            <button
              type="button"
              onClick={generateRandomSample}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-bold text-xs"
            >
              <Shuffle className="w-3 h-3" /> Generar
            </button>
          </div>
        </div>
      </div>

      {!analysis ? (
        <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/60 rounded-2xl border border-slate-800">
          Ingresa al menos un dato numérico válido para generar los cálculos estadísticos completos.
        </div>
      ) : (
        <>
          {/* 3. RESUMEN DE PARÁMETROS GLOBALES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Datos (N)
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {analysis.n}
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.isGrouped ? "Agrupados en intervalos" : "Datos individuales"}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mínimo (xmín)
              </span>
              <div className="text-xl font-black text-slate-200 font-mono mt-0.5">
                {formatStat(analysis.min)}{unitSuffix}
              </div>
              <span className="text-[10px] text-slate-500">Primer dato ordenado</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Máximo (xmáx)
              </span>
              <div className="text-xl font-black text-slate-200 font-mono mt-0.5">
                {formatStat(analysis.max)}{unitSuffix}
              </div>
              <span className="text-[10px] text-slate-500">Último dato ordenado</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rango (R)
              </span>
              <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                {formatStat(analysis.range)}{unitSuffix}
              </div>
              <span className="text-[10px] text-slate-500">xmáx - xmín</span>
            </div>

            {analysis.isGrouped && (
              <>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                    Intervalos (k Sturges)
                  </span>
                  <div className="text-xl font-black text-purple-300 font-mono mt-0.5">
                    k = {analysis.sturgesK}
                  </div>
                  <span className="text-[10px] text-slate-500">1 + 3.322·log10(N)</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                    Amplitud (A)
                  </span>
                  <div className="text-xl font-black text-sky-300 font-mono mt-0.5">
                    A = {analysis.classAmplitude}
                  </div>
                  <span className="text-[10px] text-slate-500">ceil(R / k)</span>
                </div>
              </>
            )}
          </div>

          {/* 4. TABLA DE DISTRIBUCIÓN DE FRECUENCIAS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <TableIcon className="w-4 h-4" /> Tabla de Distribución de Frecuencias
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estructura obligatoria con frecuencias absolutas, acumuladas, relativas, porcentaje y grados para gráfico circular.
                </p>
              </div>
              <span className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-400 font-mono">
                {analysis.isGrouped ? "Datos Agrupados [Li, Ls)" : "Datos No Agrupados (xi)"}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">
                      {analysis.isGrouped ? "Intervalo [Li, Ls)" : "Variable (xi)"}
                    </th>
                    {analysis.isGrouped && (
                      <th className="py-2.5 px-3">Marca de Clase (xi)</th>
                    )}
                    <th className="py-2.5 px-3">Freq. Absoluta (fi)</th>
                    <th className="py-2.5 px-3">Freq. Acumulada (Fi)</th>
                    <th className="py-2.5 px-3">Freq. Relativa (hi)</th>
                    <th className="py-2.5 px-3">Freq. Rel. Acum. (Hi)</th>
                    <th className="py-2.5 px-3">Porcentaje (%)</th>
                    <th className="py-2.5 px-3">Grados (°)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {analysis.frequencyTable.map((row, idx) => (
                    <tr key={`freq-row-${idx}`} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-amber-300">
                        {row.label}
                      </td>
                      {analysis.isGrouped && (
                        <td className="py-2 px-3 text-slate-300">
                          {formatStat(row.classMark)}
                        </td>
                      )}
                      <td className="py-2 px-3 text-emerald-400 font-bold">
                        {row.fi}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {row.Fi}
                      </td>
                      <td className="py-2 px-3 text-sky-400">
                        {formatStat(row.hi)}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {formatStat(row.Hi)}
                      </td>
                      <td className="py-2 px-3 text-yellow-300 font-bold">
                        {formatStat(row.pct)}%
                      </td>
                      <td className="py-2 px-3 text-purple-300">
                        {formatStat(row.deg)}°
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* FILA DE TOTAL / VERIFICACIÓN OBLIGATORIA */}
                <tfoot className="bg-slate-950 font-mono font-bold text-xs border-t-2 border-emerald-500/40 text-emerald-300">
                  <tr>
                    <td className="py-2.5 px-3 uppercase tracking-wider">
                      TOTAL (Verificación)
                    </td>
                    {analysis.isGrouped && <td className="py-2.5 px-3">—</td>}
                    <td className="py-2.5 px-3 text-emerald-400 font-black">
                      Σ fi = {analysis.totalFi}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">—</td>
                    <td className="py-2.5 px-3 text-sky-400 font-black">
                      Σ hi = {formatStat(analysis.totalHi)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">—</td>
                    <td className="py-2.5 px-3 text-yellow-300 font-black">
                      Σ % = {formatStat(analysis.totalPct)}%
                    </td>
                    <td className="py-2.5 px-3 text-purple-300 font-black">
                      Σ ° = {formatStat(analysis.totalDeg)}°
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. MEDIDAS DE TENDENCIA CENTRAL Y POSICIÓN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MEDIDAS DE TENDENCIA CENTRAL */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Medidas de Tendencia Central
              </h3>

              <div className="space-y-3">
                {/* Media Aritmética */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-bold uppercase tracking-wider text-emerald-400">
                      Media Aritmética (x̄)
                    </span>
                    <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                      {analysis.isGrouped ? "Σ(xi·fi) / N" : "Σxi / N"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-300 font-mono">
                    {formatStat(analysis.mean)}{unitSuffix}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Promedio general ponderado de las observaciones
                  </p>
                </div>

                {/* Mediana */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-bold uppercase tracking-wider text-sky-400">
                      Mediana (Me)
                    </span>
                    <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                      Posición {analysis.n % 2 !== 0 ? "(N+1)/2" : "N/2 y (N/2)+1"}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-sky-300 font-mono">
                    {formatStat(analysis.median)}{unitSuffix}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    El 50% de los datos se ubica por debajo de este valor central
                  </p>
                </div>

                {/* Moda */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-bold uppercase tracking-wider text-amber-400">
                      Moda (Mo) • {analysis.modeType}
                    </span>
                    <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {analysis.modeType}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {analysis.modes.length > 0
                      ? `${analysis.modes.map((m) => formatStat(m)).join(", ")}${unitSuffix}`
                      : "Sin moda"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {analysis.modeType === "Amodal"
                      ? "Todas las observaciones tienen la misma frecuencia (no hay valor predominante)"
                      : "Valor(es) con la mayor frecuencia absoluta observada"}
                  </p>
                </div>
              </div>
            </div>

            {/* MEDIDAS DE POSICIÓN INTERACTIVAS (CUARTILES, DECILES, PERCENTILES) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Medidas de Posición con Interpolación Lineal
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  L = k(N+1) / D
                </span>
              </div>

              {/* Tarjetas fijas de Cuartiles Q1, Q2, Q3 */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 text-center">
                  <span className="text-[10px] font-bold text-purple-300 block">Q1 (P25 - 25%)</span>
                  <div className="text-lg font-black text-purple-200 font-mono mt-0.5">
                    {analysis.q1.formattedValue}{unitSuffix}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    L = {formatStat(analysis.q1.L)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/30 text-center">
                  <span className="text-[10px] font-bold text-sky-300 block">Q2 (Me - 50%)</span>
                  <div className="text-lg font-black text-sky-200 font-mono mt-0.5">
                    {analysis.q2.formattedValue}{unitSuffix}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    L = {formatStat(analysis.q2.L)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 text-center">
                  <span className="text-[10px] font-bold text-purple-300 block">Q3 (P75 - 75%)</span>
                  <div className="text-lg font-black text-purple-200 font-mono mt-0.5">
                    {analysis.q3.formattedValue}{unitSuffix}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    L = {formatStat(analysis.q3.L)}
                  </span>
                </div>
              </div>

              {/* Selector interactivo de cualquier Decil o Percentil */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Calcular posición:</span>
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setPositionType("decil");
                          setPositionK(5);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          positionType === "decil"
                            ? "bg-purple-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Decil (D1 - D9)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPositionType("percentil");
                          setPositionK(75);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          positionType === "percentil"
                            ? "bg-purple-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Percentil (P1 - P99)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 font-sans">k =</span>
                    <input
                      type="number"
                      min={1}
                      max={positionType === "decil" ? 9 : 99}
                      value={positionK}
                      onChange={(e) => setPositionK(parseInt(e.target.value) || 1)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center text-xs text-amber-300 font-bold"
                    />
                  </div>
                </div>

                {/* Detalle paso a paso del cálculo con interpolación */}
                {customPositionStep && (
                  <div className="bg-slate-900/90 rounded-lg p-3 border border-purple-500/20 text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-300">
                        {customPositionStep.symbol} = {customPositionStep.formattedValue}{unitSuffix}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {customPositionStep.type} número {customPositionStep.k}
                      </span>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <div>
                        <span className="text-slate-500">Paso 1 (Localización): </span>
                        {customPositionStep.formulaStr}
                      </div>
                      <div>
                        <span className="text-slate-500">Paso 2 (Descomposición): </span>
                        Parte entera j = {customPositionStep.j}, parte decimal d = {formatStat(customPositionStep.d)}
                      </div>
                      <div>
                        <span className="text-slate-500">Paso 3 (Valores en lista ordenada): </span>
                        x_{customPositionStep.j} = {formatStat(customPositionStep.xj)}{unitSuffix},{" "}
                        x_{customPositionStep.j + 1} = {formatStat(customPositionStep.xjPlus1)}{unitSuffix}
                      </div>
                      {!customPositionStep.isInteger ? (
                        <div className="text-purple-300">
                          <span className="text-slate-500">Paso 4 (Interpolación lineal): </span>
                          Valor = {formatStat(customPositionStep.xj)} + {formatStat(customPositionStep.d)} × ({formatStat(customPositionStep.xjPlus1)} - {formatStat(customPositionStep.xj)}) ={" "}
                          <span className="font-bold text-white">{customPositionStep.formattedValue}{unitSuffix}</span>
                        </div>
                      ) : (
                        <div className="text-purple-300">
                          <span className="text-slate-500">Paso 4: </span>
                          Como L es entero exacto, el valor es directamente x_{customPositionStep.j} ={" "}
                          <span className="font-bold text-white">{customPositionStep.formattedValue}{unitSuffix}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6. MEDIDAS DE DISPERSIÓN, TABLA DE VARIANZA Y DETECCIÓN DE ATÍPICOS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-yellow-300 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Medidas de Dispersión y Detección de Valores Atípicos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rango Intercuartílico */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rango Intercuartílico (RIC)
                </span>
                <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                  {formatStat(analysis.iqr)}{unitSuffix}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Q3 ({analysis.q3.formattedValue}) - Q1 ({analysis.q1.formattedValue})
                </span>
              </div>

              {/* Varianza Poblacional */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Varianza Poblacional (σ²)
                </span>
                <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
                  {formatStat(analysis.variance)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Σ(xi - x̄)² / N = {formatStat(analysis.sumVarianceDiffSq)} / {analysis.n}
                </span>
              </div>

              {/* Desviación Estándar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Desviación Estándar (σ)
                </span>
                <div className="text-2xl font-black text-sky-300 font-mono mt-1">
                  {formatStat(analysis.stdDev)}{unitSuffix}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Raíz cuadrada de la varianza √σ²
                </span>
              </div>

              {/* Coeficiente de Variación */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Coeficiente Variación (CV)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      analysis.cv < 15
                        ? "bg-emerald-950 text-emerald-300"
                        : analysis.cv <= 30
                        ? "bg-amber-950 text-amber-300"
                        : "bg-red-950 text-red-300"
                    }`}
                  >
                    {analysis.cv < 15 ? "Baja" : analysis.cv <= 30 ? "Moderada" : "Alta"}
                  </span>
                </div>
                <div className="text-2xl font-black text-yellow-300 font-mono mt-1">
                  {formatStat(analysis.cv)}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  (σ / |x̄|) × 100%
                </span>
              </div>
            </div>

            {/* BOTÓN / ACORDEÓN PARA DESPLEGAR LA TABLA DE 3 COLUMNAS DE VARIANZA */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <button
                type="button"
                onClick={() => setShowVarianceTable(!showVarianceTable)}
                className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  Tabla Detallada de Desviaciones Cuadráticas para Varianza: [xi, (xi - x̄), (xi - x̄)²]
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  {showVarianceTable ? "Ocultar tabla" : "Ver cálculo completo paso a paso"}
                  {showVarianceTable ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {showVarianceTable && (
                <div className="p-4 border-t border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">
                    Suma total de desviaciones cuadráticas:{" "}
                    <span className="font-mono text-emerald-300 font-bold">
                      Σ(xi - x̄)² = {formatStat(analysis.sumVarianceDiffSq)}
                    </span>
                    . Dividido entre N = {analysis.n} observaciones da una varianza poblacional σ² ={" "}
                    <span className="font-mono text-amber-300 font-bold">
                      {formatStat(analysis.variance)}
                    </span>
                    .
                  </p>

                  <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Dato #</th>
                          <th className="py-2 px-3">Dato xi</th>
                          <th className="py-2 px-3">Desviación (xi - x̄)</th>
                          <th className="py-2 px-3">Desviación Cuadrática (xi - x̄)²</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {analysis.varianceTable.map((row, i) => (
                          <tr key={`var-row-${i}`} className="hover:bg-slate-800/20">
                            <td className="py-1.5 px-3 text-slate-500">#{i + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-200">
                              {formatStat(row.xi)}
                            </td>
                            <td className="py-1.5 px-3 text-sky-400">
                              {formatStat(row.diff)}
                            </td>
                            <td className="py-1.5 px-3 text-emerald-300 font-bold">
                              {formatStat(row.diffSq)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 font-bold text-xs border-t border-slate-700 text-emerald-400">
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-right uppercase">
                            Sumatoria Total Σ(xi - x̄)²:
                          </td>
                          <td className="py-2 px-3 font-mono font-black text-amber-300">
                            {formatStat(analysis.sumVarianceDiffSq)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* DETECTOR DE VALORES ATÍPICOS (CRITERIO DE TUKEY 1.5 * RIC) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Diagnóstico de Valores Atípicos (Regla 1.5 × RIC)
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                    analysis.hasOutliers
                      ? "bg-red-950 text-red-300 border border-red-500/40"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {analysis.hasOutliers
                    ? `Detectados: ${analysis.outliers.length} valor(es)`
                    : "No existen valores atípicos"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">
                    Límite Inferior (LI = Q1 - 1.5·RIC):
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {formatStat(analysis.lowerOutlierLimit)}{unitSuffix}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">
                    Límite Superior (LS = Q3 + 1.5·RIC):
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {formatStat(analysis.upperOutlierLimit)}{unitSuffix}
                  </span>
                </div>
              </div>

              {analysis.hasOutliers && (
                <div className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg font-mono">
                  Valores identificados fuera de los límites:{" "}
                  <span className="font-bold text-white">
                    {analysis.outliers.map((x) => formatStat(x)).join(", ")}{unitSuffix}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 7. VISUALIZACIÓN GRÁFICA PERTINENTE (BARRAS, POLÍGONO, TORTA) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Visualización Gráfica Interactiva
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Histograma/Barras, Polígono de Frecuencias y Gráfico Circular interactivo con porcentajes y grados.
                </p>
              </div>

              {/* Selector de tipo de gráfico */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("bar")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                    activeChartTab === "bar"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Barras / Histograma
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("polygon")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                    activeChartTab === "polygon"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" /> Polígono
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("pie")}
                  className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                    activeChartTab === "pie"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" /> Torta (%) y (°)
                </button>
              </div>
            </div>

            {/* LIENZO DEL GRÁFICO (RENDERIZADO SVG INTERACTIVO Y NATIVO) */}
            <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center min-h-[300px]">
              {activeChartTab === "bar" && (
                <div className="w-full max-w-3xl overflow-x-auto">
                  <div className="min-w-[480px] h-64 flex items-end gap-2 pb-6 pt-6 px-4 border-b border-l border-slate-700 relative">
                    {/* Líneas guía horizontales */}
                    {[0.25, 0.5, 0.75, 1].map((pct, idx) => (
                      <div
                        key={`grid-${idx}`}
                        className="absolute left-0 right-0 border-t border-slate-800/80 pointer-events-none"
                        style={{ bottom: `${pct * 80 + 20}%` }}
                      />
                    ))}

                    {/* Barras de frecuencia */}
                    {(() => {
                      const maxFi = Math.max(...analysis.frequencyTable.map((r) => r.fi), 1);
                      return analysis.frequencyTable.map((row, i) => {
                        const heightPct = (row.fi / maxFi) * 75;
                        return (
                          <div
                            key={`bar-${i}`}
                            className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                          >
                            {/* Tooltip flotante */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-emerald-500/40 text-[10px] text-emerald-300 px-2 py-1 rounded shadow-xl pointer-events-none z-10 whitespace-nowrap font-mono">
                              {row.label}: fi={row.fi} ({formatStat(row.pct)}%)
                            </div>

                            <span className="text-[10px] font-mono font-bold text-emerald-400 mb-0.5">
                              {row.fi}
                            </span>
                            <div
                              className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-t transition-colors"
                              style={{ height: `${Math.max(4, heightPct)}%` }}
                            />
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-full text-center mt-1">
                              {row.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="text-center text-[11px] text-slate-500 mt-2 font-mono">
                    Eje X: {analysis.isGrouped ? "Intervalos de clase [Li, Ls)" : `Valores xi (${unitInput})`} • Eje Y: Frecuencia Absoluta (fi)
                  </div>
                </div>
              )}

              {activeChartTab === "polygon" && (
                <div className="w-full max-w-3xl overflow-x-auto">
                  <div className="min-w-[480px] h-64 relative pb-6 pt-6 px-8 border-b border-l border-slate-700">
                    {/* SVG con polígono de frecuencias */}
                    {(() => {
                      const rows = analysis.frequencyTable;
                      const maxFi = Math.max(...rows.map((r) => r.fi), 1);
                      const width = 600;
                      const height = 180;
                      const stepX = width / Math.max(1, rows.length);

                      // Coordenadas de los puntos
                      const points = rows.map((r, i) => {
                        const x = i * stepX + stepX / 2;
                        const y = height - (r.fi / maxFi) * (height - 30);
                        return { x, y, row: r };
                      });

                      const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");

                      return (
                        <svg
                          viewBox={`0 0 ${width} ${height + 30}`}
                          className="w-full h-full overflow-visible"
                        >
                          {/* Área bajo la curva suave */}
                          <polygon
                            points={`0,${height} ${pointsStr} ${width},${height}`}
                            fill="rgba(16, 185, 129, 0.15)"
                          />

                          {/* Línea conectora del polígono */}
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Puntos y etiquetas */}
                          {points.map((p, idx) => (
                            <g key={`poly-p-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={5}
                                fill="#facc15"
                                stroke="#18181b"
                                strokeWidth={2}
                              />
                              <text
                                x={p.x}
                                y={p.y - 10}
                                textAnchor="middle"
                                fill="#a7f3d0"
                                fontSize="10"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {p.row.fi}
                              </text>
                              <text
                                x={p.x}
                                y={height + 18}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {formatStat(p.row.classMark)}
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="text-center text-[11px] text-slate-500 mt-2 font-mono">
                    Polígono que conecta las marcas de clase xi con sus respectivas frecuencias absolutas fi.
                  </div>
                </div>
              )}

              {activeChartTab === "pie" && (
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                  {/* Gráfico circular SVG */}
                  {(() => {
                    const rows = analysis.frequencyTable;
                    let accumDeg = 0;
                    const r = 90;
                    const cx = 110;
                    const cy = 110;

                    const sectorColors = [
                      "#10b981", "#f59e0b", "#3b82f6", "#ec4899",
                      "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16",
                      "#d97706", "#6366f1"
                    ];

                    const slices = rows.map((row, i) => {
                      const startAng = accumDeg;
                      const endAng = accumDeg + row.deg;
                      accumDeg += row.deg;

                      const startRad = (startAng * Math.PI) / 180;
                      const endRad = (endAng * Math.PI) / 180;

                      const x1 = cx + r * Math.cos(startRad);
                      const y1 = cy + r * Math.sin(startRad);
                      const x2 = cx + r * Math.cos(endRad);
                      const y2 = cy + r * Math.sin(endRad);

                      const largeArc = row.deg > 180 ? 1 : 0;
                      const pathData =
                        row.deg >= 359.9
                          ? `M ${cx - r}, ${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`
                          : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

                      return {
                        pathData,
                        color: sectorColors[i % sectorColors.length],
                        row,
                      };
                    });

                    return (
                      <div className="flex flex-col items-center">
                        <svg width={220} height={220} className="drop-shadow-xl">
                          {slices.map((s, idx) => (
                            <path
                              key={`slice-${idx}`}
                              d={s.pathData}
                              fill={s.color}
                              stroke="#0f172a"
                              strokeWidth={2}
                              className="hover:opacity-85 transition-opacity cursor-pointer"
                            />
                          ))}
                          {/* Círculo central para estilo donut elegante */}
                          <circle cx={cx} cy={cy} r={38} fill="#0f172a" stroke="#334155" strokeWidth={2} />
                          <text
                            x={cx}
                            y={cy + 4}
                            textAnchor="middle"
                            fill="#facc15"
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            100%
                          </text>
                        </svg>
                      </div>
                    );
                  })()}

                  {/* Leyenda con porcentaje y grados de cada sector */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 text-xs font-mono pr-2 custom-scrollbar">
                    {analysis.frequencyTable.map((row, idx) => {
                      const sectorColors = [
                        "#10b981", "#f59e0b", "#3b82f6", "#ec4899",
                        "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16",
                        "#d97706", "#6366f1"
                      ];
                      const color = sectorColors[idx % sectorColors.length];
                      return (
                        <div
                          key={`pie-legend-${idx}`}
                          className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800"
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-slate-200 truncate w-24">
                            {row.label}
                          </span>
                          <span className="text-yellow-300 font-bold">
                            {formatStat(row.pct)}%
                          </span>
                          <span className="text-purple-300 text-[11px]">
                            ({formatStat(row.deg)}°)
                          </span>
                          <span className="text-slate-500 text-[11px] ml-auto">
                            fi={row.fi}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 8. PANEL DE INTERPRETACIÓN AUTOMÁTICA EN 4 PUNTOS OBLIGATORIOS (MINIMALISTA) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-zinc-100">
                Panel de Interpretación Estadística Automática (Informe Obligatorio)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              {/* Punto 1: Comportamiento típico */}
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  1. Comportamiento Típico y Centralidad
                </h4>
                <p className="text-zinc-300">
                  {analysis.interpretation.centralTendency}
                </p>
              </div>

              {/* Punto 2: Dispersión y variabilidad */}
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  2. Dispersión y Grado de Variabilidad
                </h4>
                <p className="text-zinc-300">
                  {analysis.interpretation.dispersion}
                </p>
              </div>

              {/* Punto 3: Distribución acumulada */}
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-yellow-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  3. Distribución Acumulada y Cortes Percentilares
                </h4>
                <p className="text-zinc-300">
                  {analysis.interpretation.cumulativeDistribution}
                </p>
              </div>

              {/* Punto 4: Diagnóstico de atípicos */}
              <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  4. Diagnóstico de Valores Atípicos (Tukey 1.5 × RIC)
                </h4>
                <p className="text-zinc-300">
                  {analysis.interpretation.outlierDiagnosis}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
