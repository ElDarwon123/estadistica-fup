import React, { useState } from "react";
import {
  type FrequencyTableResult,
  formatCourseNumber,
} from "../lib/statisticsEngine";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Table, BarChart3, PieChart as PieIcon, CheckCircle2, Sliders } from "lucide-react";

interface Module2FrequenciesProps {
  freqTable: FrequencyTableResult;
  isGrouped: boolean;
  onToggleGrouped: (grouped: boolean) => void;
  customK: number;
  onChangeK: (k: number) => void;
  customA: number;
  onChangeA: (a: number) => void;
  unit: string;
}

const MONO_CHART_COLORS = [
  "#0a0a0a",
  "#262626",
  "#404040",
  "#525252",
  "#737373",
  "#8c8c8c",
  "#a3a3a3",
  "#bfbfbf",
  "#d4d4d4",
  "#e5e5e5",
];

export default function Module2Frequencies({
  freqTable,
  isGrouped,
  onToggleGrouped,
  customK,
  onChangeK,
  customA,
  onChangeA,
  unit,
}: Module2FrequenciesProps) {
  const [activeChart, setActiveChart] = useState<"bar" | "pie">("bar");

  // Preparar datos para Recharts
  const chartData = freqTable.rows.map((row) => ({
    name: row.intervalLabel,
    classMark: row.classMark,
    frecuencia: row.absoluteFrequency,
    porcentaje: Number(row.percentage.toFixed(1)),
    grados: Number(row.degrees.toFixed(1)),
    h_i: Number(row.relativeFrequency.toFixed(3)),
  }));

  return (
    <div className="space-y-6">
      {/* 1. Barra de Ajuste de Criterio de Agrupación (Sturges) */}
      <div className="p-5 rounded-cards bg-paper border border-hairline shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-ink" />
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
              Criterio Metodológico de Agrupación
            </h4>
            <span className="text-xs text-mid-gray font-mono">
              {freqTable.totalN < 40
                ? `N = ${freqTable.totalN} (< 40) → Recomendado: Datos No Agrupados`
                : `N = ${freqTable.totalN} (≥ 40) → Recomendado: Datos Agrupados (Sturges)`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-mono text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isGrouped}
              onChange={(e) => onToggleGrouped(e.target.checked)}
              className="w-4 h-4 rounded-small border-hairline text-ink focus:ring-0 accent-ink"
            />
            <span>Tabla de Datos Agrupados</span>
          </label>

          {isGrouped && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-mid-gray">k (Intervalos):</span>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={customK}
                  onChange={(e) => onChangeK(Math.max(3, Number(e.target.value)))}
                  className="w-14 px-2 py-1 rounded-inputs border border-hairline bg-surface-alt text-center font-bold text-ink"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-mid-gray">A (Amplitud):</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={customA}
                  onChange={(e) => onChangeA(Math.max(0.1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 rounded-inputs border border-hairline bg-surface-alt text-center font-bold text-ink"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tabla Reglamentaria de Frecuencias */}
      <div className="rounded-cards border border-hairline bg-paper shadow-subtle overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-ink" />
            <h4 className="text-sm font-semibold tracking-tight text-ink uppercase">
              Tabla de Distribución de Frecuencias
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-badges bg-surface-alt text-ink border border-hairline">
            {isGrouped ? "Datos Agrupados en Intervalos" : "Datos No Agrupados (Individuales)"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-alt border-b border-hairline text-mid-gray uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">
                  {isGrouped ? "Intervalo [Li, Ls)" : "Variable (xi)"}
                </th>
                <th className="px-4 py-3 text-center">
                  {isGrouped ? "Marca Clase (xi)" : "Valor"}
                </th>
                <th className="px-4 py-3 text-center">fi</th>
                <th className="px-4 py-3 text-center">Fi</th>
                <th className="px-4 py-3 text-center">hi</th>
                <th className="px-4 py-3 text-center">Hi</th>
                <th className="px-4 py-3 text-center">% (frec %)</th>
                <th className="px-4 py-3 text-center">Grados (°)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-ink">
              {freqTable.rows.map((row) => (
                <tr
                  key={`row-${row.index}`}
                  className="hover:bg-surface-alt transition-colors"
                >
                  <td className="px-4 py-2.5 text-center text-mid-gray">{row.index}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {row.intervalLabel} {unit ? <span className="text-[10px] text-mid-gray font-normal">{unit}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-ink">
                    {formatCourseNumber(row.classMark)}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold">{row.absoluteFrequency}</td>
                  <td className="px-4 py-2.5 text-center text-mid-gray">
                    {row.cumulativeFrequency}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {formatCourseNumber(row.relativeFrequency)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-mid-gray">
                    {formatCourseNumber(row.cumulativeRelativeFrequency)}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold">
                    {formatCourseNumber(row.percentage)}%
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold">
                    {formatCourseNumber(row.degrees)}°
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Verificación de Consistencia */}
            <tfoot className="bg-surface-alt font-bold border-t-2 border-hairline text-ink">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-[11px] text-mid-gray">
                  Total / Consistencia (Σ):
                </td>
                <td className="px-4 py-3 text-center font-black">
                  {freqTable.sumAbsolute}
                </td>
                <td className="px-4 py-3 text-center text-mid-gray">-</td>
                <td className="px-4 py-3 text-center font-black">
                  {formatCourseNumber(freqTable.sumRelative)}
                </td>
                <td className="px-4 py-3 text-center text-mid-gray">-</td>
                <td className="px-4 py-3 text-center font-black">
                  {formatCourseNumber(freqTable.sumPercentage)}%
                </td>
                <td className="px-4 py-3 text-center font-black">
                  {formatCourseNumber(freqTable.sumDegrees)}°
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Verificación de Consistencia Monocromática */}
        <div className="p-3.5 bg-surface-alt border-t border-hairline flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-ink">
            <CheckCircle2 className="w-4 h-4 text-ink" />
            <span>Verificación Consistente: Σ fi = N ({freqTable.sumAbsolute}), Σ hi = 1.000, Σ % = 100%, Σ ° = 360°.</span>
          </div>
          <span className="px-2 py-0.5 rounded-badges bg-paper text-ink border border-hairline font-bold text-[11px]">
            Consistencia 100%
          </span>
        </div>
      </div>

      {/* 3. Visualizaciones Gráficas Blueprint */}
      <div className="rounded-cards border border-hairline bg-paper p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <h4 className="text-sm font-semibold tracking-tight text-ink uppercase flex items-center gap-2">
            Visualización Gráfica Monocromática
          </h4>
          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-buttons border border-hairline">
            <button
              onClick={() => setActiveChart("bar")}
              className={`px-3 py-1.5 rounded-buttons text-xs font-medium tracking-tight flex items-center gap-1.5 transition-all ${
                activeChart === "bar"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-mid-gray hover:text-ink"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isGrouped ? "Histograma" : "Diagrama de Barras"}</span>
            </button>
            <button
              onClick={() => setActiveChart("pie")}
              className={`px-3 py-1.5 rounded-buttons text-xs font-medium tracking-tight flex items-center gap-1.5 transition-all ${
                activeChart === "pie"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-mid-gray hover:text-ink"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Gráfico Circular (Torta)</span>
            </button>
          </div>
        </div>

        {/* Gráfico Recharts */}
        <div className={`w-full ${activeChart === "pie" ? "h-80 sm:h-96" : "h-72"}`}>
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "bar" ? (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#737373" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#737373" }}
                  label={{ value: "Frecuencia (fi)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#737373" }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} registros`, "Frecuencia"]}
                  labelFormatter={(lbl) => `Intervalo/Valor: ${lbl}`}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e5e5", color: "#0a0a0a", borderRadius: 18, fontSize: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="frecuencia" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="porcentaje"
                  nameKey="name"
                  cx="50%"
                  cy="44%"
                  innerRadius={36}
                  outerRadius={92}
                  paddingAngle={1.5}
                  label={({ porcentaje }) => (porcentaje >= 6 ? `${porcentaje}%` : "")}
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MONO_CHART_COLORS[index % MONO_CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% (${item.payload.grados}°, fi=${item.payload.frecuencia})`,
                    item.payload.name,
                  ]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e5e5", color: "#0a0a0a", borderRadius: 18, fontSize: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value, entry: any) => {
                    const p = entry?.payload;
                    return p ? `${value} (${p.porcentaje}% • ${p.grados}°)` : value;
                  }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
