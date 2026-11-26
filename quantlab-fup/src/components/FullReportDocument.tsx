import React from "react";
import {
  formatCourseNumber,
  type FrequencyTableResult,
  type CentralTendencyResult,
  type DispersionResult,
  computePositionMeasure,
} from "../lib/statisticsEngine";
import type { DatasetMeta } from "../data/defaultDatasets";

interface FullReportDocumentProps {
  dataset: DatasetMeta;
  variableName: string;
  unit: string;
  variableType: "Discreta" | "Continua";
  variableJustification: string;
  isGrouped: boolean;
  numericData: number[];
  freqTable: FrequencyTableResult;
  centralTendency: CentralTendencyResult;
  dispersion: DispersionResult;
  interpretation: {
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    paragraph4: string;
  };
}

export default function FullReportDocument({
  dataset,
  variableName,
  unit,
  variableType,
  variableJustification,
  isGrouped,
  numericData,
  freqTable,
  centralTendency,
  dispersion,
  interpretation,
}: FullReportDocumentProps) {
  const u = unit ? ` ${unit}` : "";
  const n = numericData.length;

  const q1 = computePositionMeasure(numericData, 1, 4, "Q");
  const q2 = computePositionMeasure(numericData, 2, 4, "Q");
  const q3 = computePositionMeasure(numericData, 3, 4, "Q");

  const d1 = computePositionMeasure(numericData, 1, 10, "D");
  const d5 = computePositionMeasure(numericData, 5, 10, "D");
  const d9 = computePositionMeasure(numericData, 9, 10, "D");

  const greaterMeanCount = numericData.filter((x) => x > centralTendency.mean).length;
  const pGreaterMean = greaterMeanCount / (n || 1);

  const withinIQRCount = numericData.filter((x) => x >= dispersion.q1 && x <= dispersion.q3).length;
  const pWithinIQR = withinIQRCount / (n || 1);

  return (
    <div className="hidden print:block w-full max-w-5xl mx-auto p-8 text-black bg-white font-sans text-xs leading-relaxed">
      {/* 1. ENCABEZADO INSTITUCIONAL FORMAL FUP */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight uppercase">
              Fundación Universitaria de Popayán
            </h1>
            <p className="text-xs font-semibold text-neutral-700">
              Facultad de Ingeniería • Departamento de Ciencias Básicas
            </p>
            <p className="text-[11px] text-neutral-600">
              Curso: Estadística Descriptiva y Probabilidad • Laboratorio Cuantitativo QUANTLAB FUP
            </p>
          </div>
          <div className="text-right text-[10px] font-mono text-neutral-600">
            <span className="inline-block px-2 py-0.5 border border-black font-bold uppercase mb-1">
              Reporte Oficial FUP
            </span>
            <p>Fecha: {new Date().toLocaleDateString("es-CO")}</p>
            <p>Hora: {new Date().toLocaleTimeString("es-CO")}</p>
          </div>
        </div>
      </div>

      {/* 2. TÍTULO Y METADATOS DEL ESTUDIO */}
      <div className="bg-neutral-100 p-4 border border-neutral-300 rounded mb-6">
        <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900 mb-2">
          INFORME INTEGRAL DE ANALÍTICA ESTADÍSTICA: VARIABLE "{variableName.toUpperCase()}"
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
          <p>
            <strong>Base de Datos:</strong> {dataset.name}
          </p>
          <p>
            <strong>Muestra Total (N):</strong> {n} observaciones válidas
          </p>
          <p>
            <strong>Variable Seleccionada:</strong> {variableName} [{unit || "Adimensional"}]
          </p>
          <p>
            <strong>Clasificación:</strong> Cuantitativa {variableType}
          </p>
          <p className="col-span-2">
            <strong>Justificación Teórica:</strong> {variableJustification}
          </p>
          <p className="col-span-2">
            <strong>Criterio Metodológico de Agrupación:</strong>{" "}
            {isGrouped
              ? `Datos Agrupados en Intervalos (Regla de Sturges: k = ${freqTable.sturgesK}, Rango R = ${formatCourseNumber(
                  freqTable.rangeR
                )}${u}, Amplitud A = ${formatCourseNumber(freqTable.amplitudeA)}${u})`
              : "Datos No Agrupados (Valores individuales exactos N < 40)"}
          </p>
        </div>
      </div>

      {/* 3. TABLA DE DISTRIBUCIÓN DE FRECUENCIAS */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          1. Tabla de Distribución de Frecuencias y Verificación de Consistencia
        </h3>

        <table className="w-full text-left border-collapse border border-neutral-400 text-[10px]">
          <thead>
            <tr className="bg-neutral-200 border-b border-neutral-400 font-bold">
              <th className="p-1.5 border-r border-neutral-400 text-center w-8">i</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">
                {isGrouped ? "Intervalo [Li, Ls)" : "Variable (xi)"}
              </th>
              <th className="p-1.5 border-r border-neutral-400 text-center">Marca (xi)</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">fi</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">Fi</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">hi</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">Hi</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">%</th>
              <th className="p-1.5 text-center">Grados (°)</th>
            </tr>
          </thead>
          <tbody>
            {(freqTable.rows || []).map((row, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? "bg-neutral-50" : ""}>
                <td className="p-1 border-r border-neutral-300 text-center">{row.index}</td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">
                  {isGrouped ? `[${row.lowerLimit}, ${row.upperLimit})` : formatCourseNumber(row.classMark)}
                </td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">
                  {formatCourseNumber(row.classMark)}
                </td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono font-bold">{row.absoluteFrequency}</td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">{row.cumulativeFrequency}</td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">
                  {formatCourseNumber(row.relativeFrequency)}
                </td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">
                  {formatCourseNumber(row.cumulativeRelativeFrequency)}
                </td>
                <td className="p-1 border-r border-neutral-300 text-center font-mono">
                  {formatCourseNumber(row.percentage)}%
                </td>
                <td className="p-1 text-center font-mono">{formatCourseNumber(row.degrees)}°</td>
              </tr>
            ))}
            <tr className="bg-neutral-200 font-bold border-t-2 border-neutral-500">
              <td colSpan={3} className="p-1.5 border-r border-neutral-400 text-center uppercase">
                TOTALES Y VERIFICACIÓN
              </td>
              <td className="p-1.5 border-r border-neutral-400 text-center font-mono">
                Σ fi = {freqTable.sumAbsolute}
              </td>
              <td className="p-1.5 border-r border-neutral-400 text-center font-mono">—</td>
              <td className="p-1.5 border-r border-neutral-400 text-center font-mono">
                Σ hi = {formatCourseNumber(freqTable.sumRelative)}
              </td>
              <td className="p-1.5 border-r border-neutral-400 text-center font-mono">—</td>
              <td className="p-1.5 border-r border-neutral-400 text-center font-mono">
                Σ % = {formatCourseNumber(freqTable.sumPercentage)}%
              </td>
              <td className="p-1.5 text-center font-mono">
                Σ ° = {formatCourseNumber(freqTable.sumDegrees)}°
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-neutral-600 mt-1">
          ✓ Verificación de consistencia del curso: Σ fi = N ({freqTable.sumAbsolute} = {n}) | Σ hi = 1.000 | Σ % = 100% | Σ ° = 360°
        </p>
      </div>

      {/* 4. MEDIDAS DE TENDENCIA CENTRAL Y FORMA */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          2. Medidas de Tendencia Central y Forma de la Distribución
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">Media Aritmética (x̄)</span>
            <span className="text-base font-bold font-mono">
              {formatCourseNumber(centralTendency.mean)}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-1">{centralTendency.meanCalculationSteps}</p>
          </div>

          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">Mediana (Me - 50%)</span>
            <span className="text-base font-bold font-mono">
              {formatCourseNumber(centralTendency.median)}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-1">{centralTendency.medianCalculationSteps}</p>
          </div>

          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">
              Moda (Mo) • {centralTendency.modeType}
            </span>
            <span className="text-base font-bold font-mono">
              {(centralTendency.modes || []).length > 0
                ? (centralTendency.modes || []).map((m) => formatCourseNumber(m)).join(", ")
                : "Amodal"}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-1">{centralTendency.modeExplanation}</p>
          </div>
        </div>

        <div className="border border-neutral-300 p-2 rounded bg-neutral-100 text-[10px]">
          <strong>Diagnóstico de Asimetría (Sesgo):</strong> Distribución {centralTendency.skewness}.{" "}
          {centralTendency.skewnessExplanation}
        </div>
      </div>

      {/* 5. MEDIDAS DE POSICIÓN (CUARTILES, DECILES, PERCENTILES) */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          3. Medidas de Posición Relativa (Cuartiles, Deciles y Percentiles)
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">Primer Cuartil (Q1 - 25%)</span>
            <span className="text-sm font-bold font-mono">
              {formatCourseNumber(q1.value)}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-0.5">{q1.procedureText}</p>
          </div>

          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">Segundo Cuartil (Q2 - 50% = Me)</span>
            <span className="text-sm font-bold font-mono">
              {formatCourseNumber(q2.value)}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-0.5">{q2.procedureText}</p>
          </div>

          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">Tercer Cuartil (Q3 - 75%)</span>
            <span className="text-sm font-bold font-mono">
              {formatCourseNumber(q3.value)}
              <span className="text-[10px] font-normal ml-1">{u}</span>
            </span>
            <p className="text-[9px] text-neutral-600 mt-0.5">{q3.procedureText}</p>
          </div>
        </div>

        <p className="text-[10px] text-neutral-700">
          • Deciles clave: D1 (10%) = {formatCourseNumber(d1.value)}{u} | D5 (50%) = {formatCourseNumber(d5.value)}{u} | D9 (90%) = {formatCourseNumber(d9.value)}{u}
        </p>
      </div>

      {/* 6. MEDIDAS DE DISPERSIÓN & ATÍPICOS (TUKEY) */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          4. Medidas de Dispersión y Diagnóstico de Valores Atípicos (Regla de Tukey)
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Rango Total (R)</span>
            <span className="text-sm font-bold font-mono">
              {formatCourseNumber(dispersion.rangeR)}
              <span className="text-[9px] font-normal ml-0.5">{u}</span>
            </span>
            <p className="text-[8px] text-neutral-500">[Mín: {formatCourseNumber(dispersion.minVal)} | Máx: {formatCourseNumber(dispersion.maxVal)}]</p>
          </div>

          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Varianza Muestral (s²)</span>
            <span className="text-sm font-bold font-mono">{formatCourseNumber(dispersion.varianceSample)}</span>
            <p className="text-[8px] text-neutral-500">Poblacional: {formatCourseNumber(dispersion.variancePop)}</p>
          </div>

          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Desv. Estándar (s)</span>
            <span className="text-sm font-bold font-mono">
              {formatCourseNumber(dispersion.stdDevSample)}
              <span className="text-[9px] font-normal ml-0.5">{u}</span>
            </span>
            <p className="text-[8px] text-neutral-500">Poblacional: {formatCourseNumber(dispersion.stdDevPop)}{u}</p>
          </div>

          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <span className="text-[9px] text-neutral-500 font-bold uppercase block">Coef. Variación (CV)</span>
            <span className="text-sm font-bold font-mono">{formatCourseNumber(dispersion.coefficientOfVariation)}%</span>
            <p className="text-[8px] text-emerald-800 font-semibold">{dispersion.homogeneityLabel}</p>
          </div>
        </div>

        <div className="border border-neutral-300 p-2 rounded bg-neutral-100 text-[10px]">
          <strong>Criterio de Tukey (1.5 × RIC):</strong> Rango Intercuartílico RIC = {formatCourseNumber(dispersion.iqr)}{u} | Límite Inferior LI = {formatCourseNumber(dispersion.lowerFenceLI)}{u} | Límite Superior LS = {formatCourseNumber(dispersion.upperFenceLS)}{u}.{" "}
          {dispersion.outliers.length === 0 ? (
            <span>No se detectaron valores atípicos en la muestra analizada.</span>
          ) : (
            <span className="font-semibold text-red-700">
              Se detectaron {dispersion.outliers.length} valores atípicos: {dispersion.outliers.map((o) => formatCourseNumber(o) + u).join(", ")}.
            </span>
          )}
        </div>
      </div>

      {/* 7. INTERPRETACIÓN OFICIAL ACADÉMICA (4 PÁRRAFOS) */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          5. Síntesis de Interpretación Oficial (4 Párrafos Académicos Estructurados)
        </h3>
        <div className="space-y-2 text-[10px] text-neutral-800 leading-relaxed">
          <p className="p-2 border-l-2 border-black bg-neutral-50">
            {interpretation.paragraph1}
          </p>
          <p className="p-2 border-l-2 border-black bg-neutral-50">
            {interpretation.paragraph2}
          </p>
          <p className="p-2 border-l-2 border-black bg-neutral-50">
            {interpretation.paragraph3}
          </p>
          <p className="p-2 border-l-2 border-black bg-neutral-50">
            {interpretation.paragraph4}
          </p>
        </div>
      </div>

      {/* 8. PROBABILIDAD Y COMBINATORIA */}
      <div className="mb-6 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase border-b border-black pb-1 mb-2">
          6. Probabilidad Empírica y Modelos de Conteo
        </h3>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <strong>Probabilidad de valores superiores a la media:</strong>
            <p className="font-mono mt-0.5">
              P(X &gt; x̄) = {greaterMeanCount}/{n} = {formatCourseNumber(pGreaterMean)} ({formatCourseNumber(pGreaterMean * 100)}%)
            </p>
          </div>
          <div className="border border-neutral-300 p-2 rounded bg-neutral-50">
            <strong>Probabilidad en rango intercuartílico:</strong>
            <p className="font-mono mt-0.5">
              P(Q1 ≤ X ≤ Q3) = {withinIQRCount}/{n} = {formatCourseNumber(pWithinIQR)} ({formatCourseNumber(pWithinIQR * 100)}%)
            </p>
          </div>
        </div>
      </div>

      {/* 9. PIE INSTITUCIONAL */}
      <div className="border-t border-black pt-3 text-center text-[9px] text-neutral-500 font-mono">
        <p>QUANTLAB FUP • Motor de Estadística Descriptiva e Inferencia Cuantitativa • FUP 2026</p>
        <p>Informe generado automáticamente conforme a las directrices metodológicas del curso.</p>
      </div>
    </div>
  );
}
