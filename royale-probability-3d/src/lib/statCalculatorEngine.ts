import * as XLSX from "xlsx";

/**
 * Regla Global de Redondeo Obligatoria:
 * - Entero exacto -> sin decimales (ej. 3, 21, 28)
 * - 1, 2 o 3 decimales exactos -> completos (ej. 3.5, 12.15, 3.875)
 * - Más de 3 decimales -> redondear a 3 cifras decimales al valor más cercano
 */
export function formatStat(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (!isFinite(value)) return value > 0 ? "∞" : "-∞";

  // Redondeo base a 6 decimales para limpiar artefactos de punto flotante de JS (ej. 0.1 + 0.2)
  const cleanVal = Math.round(value * 1000000) / 1000000;

  if (Number.isInteger(cleanVal)) {
    return cleanVal.toString();
  }

  // Redondear a un máximo de 3 cifras decimales
  const rounded = Math.round(cleanVal * 1000) / 1000;
  return rounded.toString();
}

/**
 * Convierte una división a fracción irreducible (ej. 2/4 -> 1/2)
 */
export function toIrreducibleFraction(numerator: number, denominator: number): string {
  if (denominator === 0) return "0";
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  };
  const divisor = gcd(numerator, denominator);
  const num = numerator / divisor;
  const den = denominator / divisor;
  if (den === 1) return num.toString();
  return `${num}/${den}`;
}

// ============================================================================
// TIPOS DE DATOS Y RESULTADOS ESTADÍSTICOS
// ============================================================================

export interface FrequencyRow {
  label: string; // "x_i" o "[L_i, L_s)"
  classMark: number; // x_i
  fi: number; // Frecuencia absoluta
  Fi: number; // Frecuencia acumulada
  hi: number; // Frecuencia relativa
  Hi: number; // Frecuencia relativa acumulada
  pct: number; // Porcentaje
  deg: number; // Grados para torta
}

export interface VarianceRow {
  xi: number;
  diff: number; // xi - x_bar
  diffSq: number; // (xi - x_bar)^2
}

export interface PositionCalculationStep {
  type: "Cuartil" | "Decil" | "Percentil";
  symbol: string; // "Q1", "D5", "P75"
  k: number;
  divisor: 4 | 10 | 100;
  formulaStr: string;
  L: number; // Localización
  isInteger: boolean;
  j: number; // Parte entera
  d: number; // Parte decimal
  xj: number;
  xjPlus1: number;
  interpolatedValue: number;
  formattedValue: string;
}

export interface CompleteStatAnalysis {
  rawCount: number;
  n: number;
  unit: string;
  isGrouped: boolean;
  sortedData: number[];

  // Límites
  min: number;
  max: number;
  range: number;

  // Parámetros Sturges si es agrupado
  sturgesK?: number;
  classAmplitude?: number;

  // A. Tabla de frecuencias
  frequencyTable: FrequencyRow[];
  totalFi: number;
  totalHi: number;
  totalPct: number;
  totalDeg: number;

  // B. Tendencia Central
  mean: number;
  median: number;
  modes: number[];
  modeType: "Amodal" | "Unimodal" | "Bimodal" | "Multimodal";

  // C. Posición
  q1: PositionCalculationStep;
  q2: PositionCalculationStep;
  q3: PositionCalculationStep;

  // D. Dispersión y Atípicos
  iqr: number;
  variance: number;
  varianceTable: VarianceRow[];
  sumVarianceDiffSq: number;
  stdDev: number;
  cv: number; // Porcentaje

  lowerOutlierLimit: number; // LI = Q1 - 1.5 * RIC
  upperOutlierLimit: number; // LS = Q3 + 1.5 * RIC
  outliers: number[];
  hasOutliers: boolean;

  // Interpretación en 4 puntos
  interpretation: {
    centralTendency: string;
    dispersion: string;
    cumulativeDistribution: string;
    outlierDiagnosis: string;
  };
}

// ============================================================================
// MOTOR DE CÁLCULO ESTADÍSTICO
// ============================================================================

export function calculatePositionMeasure(
  sorted: number[],
  k: number,
  divisor: 4 | 10 | 100,
  type: "Cuartil" | "Decil" | "Percentil"
): PositionCalculationStep {
  const N = sorted.length;
  const L = (k * (N + 1)) / divisor;
  const j = Math.floor(L);
  const d = L - j;

  // Índices 1-based en fórmula, 0-based en array
  // Si L es entero exacto
  let val: number;
  let xj = 0;
  let xjPlus1 = 0;

  if (Math.abs(d) < 0.0000001) {
    const idx = Math.max(1, Math.min(N, j)) - 1;
    val = sorted[idx];
    xj = val;
    xjPlus1 = val;
  } else {
    const idx1 = Math.max(1, Math.min(N, j)) - 1;
    const idx2 = Math.max(1, Math.min(N, j + 1)) - 1;
    xj = sorted[idx1];
    xjPlus1 = sorted[idx2];
    val = xj + d * (xjPlus1 - xj);
  }

  const symbolPrefix = divisor === 4 ? "Q" : divisor === 10 ? "D" : "P";
  const symbol = `${symbolPrefix}${k}`;
  const formulaStr = `L = (${k} × (${N} + 1)) / ${divisor} = ${formatStat(L)}`;

  return {
    type,
    symbol,
    k,
    divisor,
    formulaStr,
    L,
    isInteger: Math.abs(d) < 0.0000001,
    j,
    d,
    xj,
    xjPlus1,
    interpolatedValue: val,
    formattedValue: formatStat(val),
  };
}

export function performStatAnalysis(
  numbers: number[],
  unit: string = "",
  forceGrouped?: boolean
): CompleteStatAnalysis {
  const rawCount = numbers.length;
  // Validación estricta de máximo 100 datos
  const data = numbers.slice(0, 100);
  const n = data.length;

  if (n === 0) {
    throw new Error("No hay datos numéricos válidos para analizar.");
  }

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  // Criterio de agrupación obligatorio: N >= 40 o si se fuerza
  const isGrouped = forceGrouped !== undefined ? forceGrouped : n >= 40;

  let frequencyTable: FrequencyRow[] = [];
  let sturgesK: number | undefined;
  let classAmplitude: number | undefined;

  if (!isGrouped) {
    // ----------------------------------------------------
    // DATOS NO AGRUPADOS (N < 40)
    // ----------------------------------------------------
    // Conteo por cada valor único
    const countMap = new Map<number, number>();
    sorted.forEach((val) => {
      countMap.set(val, (countMap.get(val) || 0) + 1);
    });

    const uniqueValues = Array.from(countMap.keys()).sort((a, b) => a - b);
    let accumFi = 0;

    frequencyTable = uniqueValues.map((val) => {
      const fi = countMap.get(val)!;
      accumFi += fi;
      const hi = fi / n;
      const Hi = accumFi / n;
      const pct = hi * 100;
      const deg = hi * 360;

      return {
        label: formatStat(val),
        classMark: val,
        fi,
        Fi: accumFi,
        hi,
        Hi,
        pct,
        deg,
      };
    });
  } else {
    // ----------------------------------------------------
    // DATOS AGRUPADOS (N >= 40): Sturges y Amplitud
    // k = round(1 + 3.322 * log10(N))
    // A = ceil(R / k)
    // ----------------------------------------------------
    const kCalc = Math.round(1 + 3.322 * Math.log10(n));
    sturgesK = Math.max(3, kCalc);
    // Si el rango es 0, amplitud mínima de 1
    classAmplitude = range > 0 ? Math.ceil(range / sturgesK) : 1;
    if (classAmplitude === 0) classAmplitude = 1;

    let accumFi = 0;
    frequencyTable = [];

    for (let i = 0; i < sturgesK; i++) {
      const Li = min + i * classAmplitude;
      const Ls = Li + classAmplitude;
      const isLast = i === sturgesK - 1;

      // Conteo en [Li, Ls) o [Li, Ls] para el último intervalo
      let fi = 0;
      sorted.forEach((x) => {
        if (isLast) {
          if (x >= Li && x <= Ls) fi++;
        } else {
          if (x >= Li && x < Ls) fi++;
        }
      });

      accumFi += fi;
      const classMark = (Li + Ls) / 2;
      const hi = fi / n;
      const Hi = accumFi / n;
      const pct = hi * 100;
      const deg = hi * 360;

      frequencyTable.push({
        label: `[${formatStat(Li)}, ${formatStat(Ls)}${isLast ? "]" : ")"}`,
        classMark,
        fi,
        Fi: accumFi,
        hi,
        Hi,
        pct,
        deg,
      });
    }
  }

  // Totales de verificación
  const totalFi = frequencyTable.reduce((acc, row) => acc + row.fi, 0);
  const totalHi = frequencyTable.reduce((acc, row) => acc + row.hi, 0);
  const totalPct = frequencyTable.reduce((acc, row) => acc + row.pct, 0);
  const totalDeg = frequencyTable.reduce((acc, row) => acc + row.deg, 0);

  // ----------------------------------------------------
  // B. MEDIDAS DE TENDENCIA CENTRAL
  // ----------------------------------------------------
  let mean = 0;
  if (!isGrouped) {
    mean = sorted.reduce((sum, x) => sum + x, 0) / n;
  } else {
    // Para agrupados: suma(xi * fi) / n
    const sumXiFi = frequencyTable.reduce(
      (acc, row) => acc + row.classMark * row.fi,
      0
    );
    mean = sumXiFi / n;
  }

  // Mediana sobre datos ordenados
  let median = 0;
  if (n % 2 !== 0) {
    // Impar: posición (N + 1) / 2 (0-indexed: (N-1)/2)
    median = sorted[Math.floor(n / 2)];
  } else {
    // Par: promedio de N/2 y N/2 + 1
    const m1 = sorted[n / 2 - 1];
    const m2 = sorted[n / 2];
    median = (m1 + m2) / 2;
  }

  // Moda
  const counts = new Map<number, number>();
  sorted.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
  let maxFreq = 0;
  counts.forEach((f) => {
    if (f > maxFreq) maxFreq = f;
  });

  const uniqueValCount = counts.size;
  let modes: number[] = [];
  let modeType: "Amodal" | "Unimodal" | "Bimodal" | "Multimodal" = "Unimodal";

  if (maxFreq === 1 || counts.size === 1 || Array.from(counts.values()).every((f) => f === maxFreq)) {
    // Si todos tienen la misma frecuencia, se considera Amodal
    modeType = "Amodal";
    modes = [];
  } else {
    counts.forEach((freq, val) => {
      if (freq === maxFreq) modes.push(val);
    });
    modes.sort((a, b) => a - b);

    if (modes.length === 1) modeType = "Unimodal";
    else if (modes.length === 2) modeType = "Bimodal";
    else modeType = "Multimodal";
  }

  // ----------------------------------------------------
  // C. MEDIDAS DE POSICIÓN (Q1, Q2, Q3)
  // ----------------------------------------------------
  const q1 = calculatePositionMeasure(sorted, 1, 4, "Cuartil");
  const q2 = calculatePositionMeasure(sorted, 2, 4, "Cuartil");
  const q3 = calculatePositionMeasure(sorted, 3, 4, "Cuartil");

  // ----------------------------------------------------
  // D. MEDIDAS DE DISPERSIÓN Y ATÍPICOS
  // ----------------------------------------------------
  const iqr = q3.interpolatedValue - q1.interpolatedValue;

  // Varianza poblacional: suma(xi - x_bar)^2 / N
  let sumVarianceDiffSq = 0;
  const varianceTable: VarianceRow[] = sorted.map((xi) => {
    const diff = xi - mean;
    const diffSq = diff * diff;
    sumVarianceDiffSq += diffSq;
    return { xi, diff, diffSq };
  });

  const variance = sumVarianceDiffSq / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Detector de Tukey (1.5 * RIC)
  const lowerOutlierLimit = q1.interpolatedValue - 1.5 * iqr;
  const upperOutlierLimit = q3.interpolatedValue + 1.5 * iqr;

  const outliers = sorted.filter(
    (x) => x < lowerOutlierLimit || x > upperOutlierLimit
  );
  const hasOutliers = outliers.length > 0;

  // ----------------------------------------------------
  // INTERPRETACIÓN AUTOMÁTICA EN 4 PUNTOS
  // ----------------------------------------------------
  const unitSuffix = unit.trim() ? ` ${unit.trim()}` : "";

  // 1. Comportamiento típico
  const modeText =
    modeType === "Amodal"
      ? "la distribución es amodal (no existe un valor predominante)"
      : `la moda es ${modes.map((m) => formatStat(m)).join(", ")}${unitSuffix} (${modeType.toLowerCase()})`;

  const centralTendency = `El conjunto de datos presenta una media aritmética de ${formatStat(
    mean
  )}${unitSuffix} y una mediana de ${formatStat(
    median
  )}${unitSuffix}. Adicionalmente, ${modeText}. La proximidad entre la media y la mediana sugiere una distribución relativamente ${
    Math.abs(mean - median) < stdDev * 0.25 ? "simétrica" : "asimétrica"
  } respecto al centro de los datos.`;

  // 2. Dispersión y variabilidad
  let cvQuality = "baja";
  let cvDesc = "datos homogéneos y altamente concentrados en torno a la media";
  if (cv >= 15 && cv <= 30) {
    cvQuality = "moderada";
    cvDesc = "variabilidad moderada y representatividad media";
  } else if (cv > 30) {
    cvQuality = "alta";
    cvDesc = "datos heterogéneos y dispersos respecto al promedio central";
  }

  const dispersion = `Los datos presentan un rango total de ${formatStat(
    range
  )}${unitSuffix} y un rango intercuartílico (RIC) de ${formatStat(
    iqr
  )}${unitSuffix}. La desviación estándar poblacional es de ${formatStat(
    stdDev
  )}${unitSuffix}, con un coeficiente de variación (CV) del ${formatStat(
    cv
  )}%, lo que indica una variabilidad ${cvQuality} (${cvDesc}).`;

  // 3. Distribución acumulada
  const p10 = calculatePositionMeasure(sorted, 10, 100, "Percentil");
  const p90 = calculatePositionMeasure(sorted, 90, 100, "Percentil");

  const cumulativeDistribution = `En términos de posición acumulada, el 10% inferior de las observaciones no supera los ${p10.formattedValue}${unitSuffix} (P10), mientras que el 25% inicial se ubica por debajo de ${q1.formattedValue}${unitSuffix} (Q1). La mitad de las observaciones (50%) es inferior a ${formatStat(
    median
  )}${unitSuffix} (Mediana / Q2). Asimismo, el 75% no excede los ${q3.formattedValue}${unitSuffix} (Q3) y el 90% se encuentra por debajo de ${p90.formattedValue}${unitSuffix} (P90), concentrando el 50% central en el intervalo [${q1.formattedValue}, ${q3.formattedValue}]${unitSuffix}.`;

  // 4. Diagnóstico de atípicos
  let outlierDiagnosis = "";
  if (!hasOutliers) {
    outlierDiagnosis = `Aplicando la regla de Tukey con una barrera de 1.5 × RIC, los límites de control se establecen en LI = ${formatStat(
      lowerOutlierLimit
    )}${unitSuffix} y LS = ${formatStat(
      upperOutlierLimit
    )}${unitSuffix}. No se detectaron valores atípicos (outliers) en la muestra; todas las observaciones se encuentran contenidas dentro del rango admisible.`;
  } else {
    outlierDiagnosis = `Con base en el criterio de 1.5 × RIC, los límites de aceptación son [${formatStat(
      lowerOutlierLimit
    )}, ${formatStat(
      upperOutlierLimit
    )}]${unitSuffix}. Se identificaron ${
      outliers.length
    } valor(es) atípico(s): ${outliers
      .map((x) => formatStat(x))
      .join(", ")}${unitSuffix}. Estos registros se alejan significativamente del comportamiento central y requieren supervisión contextual.`;
  }

  return {
    rawCount,
    n,
    unit: unit.trim(),
    isGrouped,
    sortedData: sorted,
    min,
    max,
    range,
    sturgesK,
    classAmplitude,
    frequencyTable,
    totalFi,
    totalHi,
    totalPct,
    totalDeg,
    mean,
    median,
    modes,
    modeType,
    q1,
    q2,
    q3,
    iqr,
    variance,
    varianceTable,
    sumVarianceDiffSq,
    stdDev,
    cv,
    lowerOutlierLimit,
    upperOutlierLimit,
    outliers,
    hasOutliers,
    interpretation: {
      centralTendency,
      dispersion,
      cumulativeDistribution,
      outlierDiagnosis,
    },
  };
}

// ============================================================================
// PARSER DE ARCHIVOS (CSV, TXT, EXCEL XLSX) Y TEXTO MANUAL
// ============================================================================

export function parseRawTextToNumbers(text: string): {
  numbers: number[];
  warning?: string;
} {
  // Separa por comas, puntos y comas, espacios, tabulaciones o saltos de línea
  const tokens = text.split(/[\s,;]+/).filter((t) => t.trim().length > 0);
  const nums: number[] = [];

  for (const token of tokens) {
    // Normalizar coma decimal europea a punto
    const clean = token.replace(",", ".");
    const val = parseFloat(clean);
    if (!isNaN(val) && isFinite(val)) {
      nums.push(val);
    }
  }

  let warning: string | undefined;
  if (nums.length > 100) {
    warning = `El conjunto contiene ${nums.length} datos. Por especificación del curso, se procesarán exactamente los primeros 100 datos.`;
  }

  return { numbers: nums.slice(0, 100), warning };
}

export async function parseFileToNumbers(file: File): Promise<{
  numbers: number[];
  warning?: string;
}> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
    }) as unknown[][];

    const allNums: number[] = [];
    jsonRows.forEach((row) => {
      if (Array.isArray(row)) {
        row.forEach((cell) => {
          const val = parseFloat(String(cell).replace(",", "."));
          if (!isNaN(val) && isFinite(val)) {
            allNums.push(val);
          }
        });
      }
    });

    let warning: string | undefined;
    if (allNums.length > 100) {
      warning = `El archivo Excel contiene ${allNums.length} registros numéricos. Se han truncado a los primeros 100 registros máximos obligatorios.`;
    }
    return { numbers: allNums.slice(0, 100), warning };
  } else {
    // CSV o TXT
    const text = await file.text();
    return parseRawTextToNumbers(text);
  }
}
