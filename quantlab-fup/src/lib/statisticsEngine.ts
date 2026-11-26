/**
 * QUANTLAB FUP - MOTOR DE ESTADÍSTICA Y PROBABILIDAD CUANTITATIVA
 * 
 * Implementa de forma estricta las reglas metodológicas, criterios de redondeo,
 * fórmulas y procedimientos del curso universitario de Estadística Descriptiva y Probabilidad.
 */

export interface NumberFormatOptions {
  preserveExact?: boolean;
}

/**
 * Regla de redondeo obligatoria del curso:
 * 1. Si el resultado es entero exacto: sin decimales (ej. 3, 21, 30)
 * 2. Si tiene 1, 2 o 3 decimales: mostrarlos completos (ej. 3.5, 12.15, 3.875)
 * 3. Si tiene más de 3 decimales: redondear al valor más cercano de 3 cifras decimales (ej. 18/37 = 0.486)
 */
export function formatCourseNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "-";
  if (!isFinite(val)) return val > 0 ? "∞" : "-∞";

  // Comprobar si es entero exacto
  if (Number.isInteger(val)) {
    return val.toString();
  }

  // Redondeo aritmético a 3 decimales
  const rounded3 = Math.round(val * 1000) / 1000;
  if (Number.isInteger(rounded3)) {
    return rounded3.toString();
  }

  // Comprobamos la representación decimal
  const str = val.toString();
  if (str.includes(".") && !str.includes("e")) {
    const decimals = str.split(".")[1];
    if (decimals.length <= 3) {
      return str;
    }
  }

  // Si tiene más de 3 decimales, redondeamos a 3 cifras
  const roundedStr = rounded3.toFixed(3);
  // Eliminamos ceros a la derecha innecesarios respetando regla 2
  return roundedStr.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

/**
 * Convierte un cociente a fracción irreducible
 */
export function toIrreducibleFraction(numerator: number, denominator: number): string {
  if (denominator === 0) return "Indefinido";
  if (numerator === 0) return "0";
  
  const gcd = (a: number, b: number): number => {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  };

  const divisor = gcd(numerator, denominator);
  const num = Math.round(numerator / divisor);
  const den = Math.round(denominator / divisor);

  if (den === 1) return num.toString();
  return `${num}/${den}`;
}

/**
 * Fila de la tabla de distribución de frecuencias
 */
export interface FrequencyRow {
  index: number;
  intervalLabel: string;
  lowerLimit?: number;
  upperLimit?: number;
  classMark: number; // x_i (Marca de clase o valor individual)
  absoluteFrequency: number; // f_i
  cumulativeFrequency: number; // F_i
  relativeFrequency: number; // h_i
  cumulativeRelativeFrequency: number; // H_i
  percentage: number; // % = h_i * 100
  cumulativePercentage: number; // % acum
  degrees: number; // ° = h_i * 360
  cumulativeDegrees: number; // ° acum
}

export interface FrequencyTableResult {
  isGrouped: boolean;
  rows: FrequencyRow[];
  totalN: number;
  sumAbsolute: number; // Σ f_i = N
  sumRelative: number; // Σ h_i = 1
  sumPercentage: number; // Σ % = 100%
  sumDegrees: number; // Σ ° = 360°
  sturgesK?: number;
  amplitudeA?: number;
  rangeR?: number;
  minValue: number;
  maxValue: number;
}

/**
 * Genera la tabla de frecuencias para datos no agrupados (N < 40) o agrupados (N >= 40)
 */
export function computeFrequencyTable(
  data: number[],
  forcedGrouped?: boolean,
  customK?: number,
  customA?: number
): FrequencyTableResult {
  const cleanData = data.filter((v) => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  const N = cleanData.length;

  if (N === 0) {
    return {
      isGrouped: false,
      rows: [],
      totalN: 0,
      sumAbsolute: 0,
      sumRelative: 0,
      sumPercentage: 0,
      sumDegrees: 0,
      minValue: 0,
      maxValue: 0,
    };
  }

  const minVal = cleanData[0];
  const maxVal = cleanData[N - 1];
  const rangeR = maxVal - minVal;

  const isGrouped = forcedGrouped !== undefined ? forcedGrouped : N >= 40;

  if (!isGrouped) {
    // DATOS NO AGRUPADOS (Valores individuales x_i)
    const countsMap = new Map<number, number>();
    cleanData.forEach((val) => {
      countsMap.set(val, (countsMap.get(val) || 0) + 1);
    });

    const uniqueValues = Array.from(countsMap.keys()).sort((a, b) => a - b);
    let accumF = 0;
    let accumH = 0;
    let accumPct = 0;
    let accumDeg = 0;

    const rows: FrequencyRow[] = uniqueValues.map((val, idx) => {
      const fi = countsMap.get(val)!;
      accumF += fi;
      const hi = fi / N;
      accumH += hi;
      const pct = hi * 100;
      accumPct += pct;
      const deg = hi * 360;
      accumDeg += deg;

      return {
        index: idx + 1,
        intervalLabel: formatCourseNumber(val),
        classMark: val,
        absoluteFrequency: fi,
        cumulativeFrequency: accumF,
        relativeFrequency: hi,
        cumulativeRelativeFrequency: accumH,
        percentage: pct,
        cumulativePercentage: accumPct,
        degrees: deg,
        cumulativeDegrees: accumDeg,
      };
    });

    return {
      isGrouped: false,
      rows,
      totalN: N,
      sumAbsolute: accumF,
      sumRelative: accumH,
      sumPercentage: accumPct,
      sumDegrees: accumDeg,
      minValue: minVal,
      maxValue: maxVal,
      rangeR,
    };
  } else {
    // DATOS AGRUPADOS (Regla de Sturges y Amplitud A)
    // K = round(1 + 3.322 * log10(N))
    const sturgesK = customK || Math.max(3, Math.round(1 + 3.322 * Math.log10(N)));
    // A = ceil(R / k) o con decimales si R tiene decimales
    const calculatedA = rangeR === 0 ? 1 : Math.ceil(rangeR / sturgesK);
    const amplitudeA = customA || calculatedA || 1;

    const rows: FrequencyRow[] = [];
    let currentLower = minVal;
    let accumF = 0;
    let accumH = 0;
    let accumPct = 0;
    let accumDeg = 0;

    for (let i = 0; i < sturgesK; i++) {
      const currentUpper = currentLower + amplitudeA;
      const isLast = i === sturgesK - 1;

      // Conteo en [L_i, L_s) excepto el último intervalo que incluye [L_i, L_s]
      const count = cleanData.filter((val) => {
        if (isLast) {
          return val >= currentLower && val <= currentUpper + 1e-9;
        }
        return val >= currentLower && val < currentUpper;
      }).length;

      accumF += count;
      const hi = count / N;
      accumH += hi;
      const pct = hi * 100;
      accumPct += pct;
      const deg = hi * 360;
      accumDeg += deg;
      const classMark = (currentLower + currentUpper) / 2;

      rows.push({
        index: i + 1,
        intervalLabel: `[${formatCourseNumber(currentLower)}, ${formatCourseNumber(currentUpper)}${isLast ? "]" : ")"}`,
        lowerLimit: currentLower,
        upperLimit: currentUpper,
        classMark,
        absoluteFrequency: count,
        cumulativeFrequency: accumF,
        relativeFrequency: hi,
        cumulativeRelativeFrequency: accumH,
        percentage: pct,
        cumulativePercentage: accumPct,
        degrees: deg,
        cumulativeDegrees: accumDeg,
      });

      currentLower = currentUpper;
    }

    return {
      isGrouped: true,
      rows,
      totalN: N,
      sumAbsolute: accumF,
      sumRelative: accumH,
      sumPercentage: accumPct,
      sumDegrees: accumDeg,
      sturgesK,
      amplitudeA,
      rangeR,
      minValue: minVal,
      maxValue: maxVal,
    };
  }
}

/**
 * Medidas de Tendencia Central
 */
export interface CentralTendencyResult {
  mean: number; // x̄
  meanCalculationSteps: string;
  median: number; // Me
  medianCalculationSteps: string;
  modes: number[]; // Mo
  modeType: "Amodal" | "Unimodal" | "Bimodal" | "Multimodal";
  modeExplanation: string;
  skewness: "Simétrica" | "Sesgada a la Derecha (Positiva)" | "Sesgada a la Izquierda (Negativa)";
  skewnessExplanation: string;
}

export function computeCentralTendency(
  data: number[],
  freqTable: FrequencyTableResult
): CentralTendencyResult {
  const sorted = [...data].filter((v) => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  const N = sorted.length;

  if (N === 0) {
    return {
      mean: 0,
      meanCalculationSteps: "Sin datos",
      median: 0,
      medianCalculationSteps: "Sin datos",
      modes: [],
      modeType: "Amodal",
      modeExplanation: "Sin datos",
      skewness: "Simétrica",
      skewnessExplanation: "Sin datos",
    };
  }

  // Media Aritmética
  let mean = 0;
  let meanSteps = "";
  if (!freqTable.isGrouped) {
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    mean = sum / N;
    meanSteps = `x̄ = (Σ xi) / N = ${formatCourseNumber(sum)} / ${N} = ${formatCourseNumber(mean)}`;
  } else {
    // X̄ = Σ (xi * fi) / N
    const sumXiFi = freqTable.rows.reduce((acc, row) => acc + row.classMark * row.absoluteFrequency, 0);
    mean = sumXiFi / N;
    meanSteps = `x̄ = Σ (xi · fi) / N = ${formatCourseNumber(sumXiFi)} / ${N} = ${formatCourseNumber(mean)}`;
  }

  // Mediana
  let median = 0;
  let medianSteps = "";
  if (!freqTable.isGrouped) {
    if (N % 2 === 1) {
      const pos = (N + 1) / 2;
      median = sorted[pos - 1];
      medianSteps = `N es impar (${N}). Posición = (N + 1) / 2 = (${N} + 1) / 2 = ${pos}. Me = x(${pos}) = ${formatCourseNumber(median)}`;
    } else {
      const pos1 = N / 2;
      const pos2 = pos1 + 1;
      const val1 = sorted[pos1 - 1];
      const val2 = sorted[pos2 - 1];
      median = (val1 + val2) / 2;
      medianSteps = `N es par (${N}). Posiciones centrales = N/2 = ${pos1} y N/2 + 1 = ${pos2}. Me = (x(${pos1}) + x(${pos2})) / 2 = (${formatCourseNumber(val1)} + ${formatCourseNumber(val2)}) / 2 = ${formatCourseNumber(median)}`;
    }
  } else {
    // Mediana agrupada: Me = Li + ((N/2 - F(i-1)) / fi) * A
    const halfN = N / 2;
    let medianRowIdx = freqTable.rows.findIndex((r) => r.cumulativeFrequency >= halfN);
    if (medianRowIdx === -1) medianRowIdx = freqTable.rows.length - 1;
    const medianRow = freqTable.rows[medianRowIdx];
    const Li = medianRow.lowerLimit || medianRow.classMark - (freqTable.amplitudeA || 1) / 2;
    const FiPrev = medianRowIdx > 0 ? freqTable.rows[medianRowIdx - 1].cumulativeFrequency : 0;
    const fi = medianRow.absoluteFrequency;
    const A = freqTable.amplitudeA || 1;

    median = fi > 0 ? Li + ((halfN - FiPrev) / fi) * A : medianRow.classMark;
    medianSteps = `Clase mediana en Fi ≥ N/2 (${halfN}): Intervalo ${medianRow.intervalLabel}. Me = Li + [(N/2 - F(i-1)) / fi] · A = ${formatCourseNumber(Li)} + [(${halfN} - ${FiPrev}) / ${fi}] · ${A} = ${formatCourseNumber(median)}`;
  }

  // Moda
  const maxFi = Math.max(...freqTable.rows.map((r) => r.absoluteFrequency));
  const modalRows = freqTable.rows.filter((r) => r.absoluteFrequency === maxFi);

  let modes: number[] = [];
  let modeType: "Amodal" | "Unimodal" | "Bimodal" | "Multimodal" = "Unimodal";
  let modeExplanation = "";

  if (freqTable.rows.every((r) => r.absoluteFrequency === maxFi) && freqTable.rows.length > 1) {
    modeType = "Amodal";
    modes = [];
    modeExplanation = "Todos los valores o intervalos presentan la misma frecuencia; por tanto, la distribución es Amodal (no hay moda predominante).";
  } else if (modalRows.length === 1) {
    modeType = "Unimodal";
    modes = [modalRows[0].classMark];
    modeExplanation = `Unimodal: Valor o intervalo modal con mayor frecuencia absoluta (fi = ${maxFi}): ${modalRows[0].intervalLabel}.`;
  } else if (modalRows.length === 2) {
    modeType = "Bimodal";
    modes = modalRows.map((r) => r.classMark);
    modeExplanation = `Bimodal: Existen 2 modas con frecuencia fi = ${maxFi}: ${modalRows.map((r) => r.intervalLabel).join(", ")}.`;
  } else {
    modeType = "Multimodal";
    modes = modalRows.map((r) => r.classMark);
    modeExplanation = `Multimodal: Existen ${modalRows.length} modas con frecuencia fi = ${maxFi}.`;
  }

  // Indicador visual de Sesgo (Asimetría)
  const diff = mean - median;
  let skewness: "Simétrica" | "Sesgada a la Derecha (Positiva)" | "Sesgada a la Izquierda (Negativa)" = "Simétrica";
  let skewnessExplanation = "";

  if (Math.abs(diff) < 0.05) {
    skewness = "Simétrica";
    skewnessExplanation = `x̄ (${formatCourseNumber(mean)}) ≈ Me (${formatCourseNumber(median)}). La distribución es aproximadamente simétrica, con equilibrio alrededor del centro.`;
  } else if (diff > 0) {
    skewness = "Sesgada a la Derecha (Positiva)";
    skewnessExplanation = `x̄ (${formatCourseNumber(mean)}) > Me (${formatCourseNumber(median)}). La cola de la distribución se alarga hacia valores altos (asimetría positiva).`;
  } else {
    skewness = "Sesgada a la Izquierda (Negativa)";
    skewnessExplanation = `x̄ (${formatCourseNumber(mean)}) < Me (${formatCourseNumber(median)}). La cola de la distribución se alarga hacia valores bajos (asimetría negativa).`;
  }

  return {
    mean,
    meanCalculationSteps: meanSteps,
    median,
    medianCalculationSteps: medianSteps,
    modes,
    modeType,
    modeExplanation,
    skewness,
    skewnessExplanation,
  };
}

/**
 * Procedimiento de 2 Pasos para Medidas de Posición (Cuartiles, Deciles, Percentiles)
 * Paso 1: L = k * (N + 1) / M
 * Paso 2: L = j + d -> Valor = x_j + d * (x_{j+1} - x_j)
 */
export interface PositionMeasureProcedure {
  symbol: string; // ej. Q1, D5, P85
  k: number;
  totalDivisor: number; // 4, 10 o 100
  L: number; // Posición L
  j: number; // Parte entera
  d: number; // Parte decimal
  xj: number;
  xjPlus1: number;
  value: number;
  procedureText: string;
  equivalences: string[];
}

export function computePositionMeasure(
  data: number[],
  k: number,
  divisor: 4 | 10 | 100,
  symbolPrefix: "Q" | "D" | "P"
): PositionMeasureProcedure {
  const sorted = [...data].filter((v) => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  const N = sorted.length;

  if (N === 0) {
    return {
      symbol: `${symbolPrefix}${k}`,
      k,
      totalDivisor: divisor,
      L: 0,
      j: 0,
      d: 0,
      xj: 0,
      xjPlus1: 0,
      value: 0,
      procedureText: "Sin datos",
      equivalences: [],
    };
  }

  // Paso 1: Localización
  // L = k * (N + 1) / divisor
  const L = (k * (N + 1)) / divisor;
  const j = Math.floor(L);
  const d = L - j;

  let value = 0;
  let xj = 0;
  let xjPlus1 = 0;

  if (j <= 0) {
    xj = sorted[0];
    xjPlus1 = sorted[0];
    value = sorted[0];
  } else if (j >= N) {
    xj = sorted[N - 1];
    xjPlus1 = sorted[N - 1];
    value = sorted[N - 1];
  } else {
    // 1-based index: x_j is sorted[j-1], x_{j+1} is sorted[j]
    xj = sorted[j - 1];
    xjPlus1 = sorted[j];
    // Interpolación lineal
    value = xj + d * (xjPlus1 - xj);
  }

  const procedureText = `Paso 1 (Localización): L = [${k} · (${N} + 1)] / ${divisor} = ${formatCourseNumber(L)}. (Parte entera j = ${j}, parte decimal d = ${formatCourseNumber(d)}). Paso 2 (Interpolación lineal): Valor = x(${j}) + d · (x(${j + 1}) - x(${j})) = ${formatCourseNumber(xj)} + ${formatCourseNumber(d)} · (${formatCourseNumber(xjPlus1)} - ${formatCourseNumber(xj)}) = ${formatCourseNumber(value)}`;

  // Equivalencias estándar
  const equivalences: string[] = [];
  const percentileEquivalent = Math.round((k / divisor) * 100);
  if (percentileEquivalent === 25) equivalences.push("P25 = Q1");
  if (percentileEquivalent === 50) equivalences.push("P50 = Q2 = D5 = Me");
  if (percentileEquivalent === 75) equivalences.push("P75 = Q3");

  return {
    symbol: `${symbolPrefix}${k}`,
    k,
    totalDivisor: divisor,
    L,
    j,
    d,
    xj,
    xjPlus1,
    value,
    procedureText,
    equivalences,
  };
}

/**
 * Medidas de Dispersión, Tabla de Desviaciones de 3 Columnas y Detector de Atípicos
 */
export interface DeviationTableRow {
  xi: number;
  diff: number; // (x_i - x̄)
  diffSquared: number; // (x_i - x̄)^2
}

export interface DispersionResult {
  rangeR: number; // R = max - min
  iqr: number; // RIC = Q3 - Q1
  variancePop: number; // σ^2 = Σ(xi - x̄)^2 / N
  varianceSample: number; // s^2 = Σ(xi - x̄)^2 / (N - 1)
  stdDevPop: number; // σ
  stdDevSample: number; // s
  coefficientOfVariation: number; // CV = (σ / x̄) * 100%
  homogeneityLabel: "Altamente Homogéneo" | "Moderadamente Homogéneo" | "Heterogéneo";
  deviationTable: DeviationTableRow[];
  sumDiffSquared: number; // Σ (xi - x̄)^2
  lowerFenceLI: number; // LI = Q1 - 1.5 * RIC
  upperFenceLS: number; // LS = Q3 + 1.5 * RIC
  outliers: number[];
  q1: number;
  q2: number;
  q3: number;
  minVal: number;
  maxVal: number;
}

export function computeDispersion(data: number[], mean: number): DispersionResult {
  const sorted = [...data].filter((v) => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  const N = sorted.length;

  if (N === 0) {
    return {
      rangeR: 0,
      iqr: 0,
      variancePop: 0,
      varianceSample: 0,
      stdDevPop: 0,
      stdDevSample: 0,
      coefficientOfVariation: 0,
      homogeneityLabel: "Altamente Homogéneo",
      deviationTable: [],
      sumDiffSquared: 0,
      lowerFenceLI: 0,
      upperFenceLS: 0,
      outliers: [],
      q1: 0,
      q2: 0,
      q3: 0,
      minVal: 0,
      maxVal: 0,
    };
  }

  const minVal = sorted[0];
  const maxVal = sorted[N - 1];
  const rangeR = maxVal - minVal;

  const q1Proc = computePositionMeasure(sorted, 1, 4, "Q");
  const q2Proc = computePositionMeasure(sorted, 2, 4, "Q");
  const q3Proc = computePositionMeasure(sorted, 3, 4, "Q");
  const q1 = q1Proc.value;
  const q2 = q2Proc.value;
  const q3 = q3Proc.value;

  const iqr = q3 - q1;

  // Tabla de desviaciones de 3 columnas
  let sumDiffSquared = 0;
  const deviationTable: DeviationTableRow[] = sorted.map((xi) => {
    const diff = xi - mean;
    const diffSquared = diff * diff;
    sumDiffSquared += diffSquared;
    return {
      xi,
      diff,
      diffSquared,
    };
  });

  const variancePop = sumDiffSquared / N;
  const varianceSample = N > 1 ? sumDiffSquared / (N - 1) : 0;
  const stdDevPop = Math.sqrt(variancePop);
  const stdDevSample = Math.sqrt(varianceSample);

  const cv = mean !== 0 ? (stdDevPop / Math.abs(mean)) * 100 : 0;
  let homogeneityLabel: "Altamente Homogéneo" | "Moderadamente Homogéneo" | "Heterogéneo" = "Altamente Homogéneo";
  if (cv <= 15) {
    homogeneityLabel = "Altamente Homogéneo";
  } else if (cv <= 30) {
    homogeneityLabel = "Moderadamente Homogéneo";
  } else {
    homogeneityLabel = "Heterogéneo";
  }

  // Detección de atípicos (Criterio de Tukey 1.5 * RIC)
  const lowerFenceLI = q1 - 1.5 * iqr;
  const upperFenceLS = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerFenceLI || v > upperFenceLS);

  return {
    rangeR,
    iqr,
    variancePop,
    varianceSample,
    stdDevPop,
    stdDevSample,
    coefficientOfVariation: cv,
    homogeneityLabel,
    deviationTable,
    sumDiffSquared,
    lowerFenceLI,
    upperFenceLS,
    outliers,
    q1,
    q2,
    q3,
    minVal,
    maxVal,
  };
}

/**
 * Módulo 6: Redactor de Interpretación Automática (4 Párrafos Reglamentarios de Clase)
 */
export function generateCourseInterpretation(
  varName: string,
  unit: string,
  ct: CentralTendencyResult,
  disp: DispersionResult,
  freqTable: FrequencyTableResult,
  p10: number,
  p90: number
): {
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  paragraph4: string;
} {
  const u = unit ? ` ${unit}` : "";

  // Párrafo 1: Comportamiento Típico
  const paragraph1 = `1. Comportamiento Típico y Tendencia Central: La variable analizada "${varName}" presenta una media aritmética de ${formatCourseNumber(ct.mean)}${u}, indicando el promedio general de las observaciones. Por su parte, la mediana se sitúa en ${formatCourseNumber(ct.median)}${u}, lo que significa que el 50% de la muestra evaluada se encuentra por debajo de este umbral. ${ct.modeExplanation} Al comparar la media con la mediana, se observa una distribución ${ct.skewness.toLowerCase()}, ${ct.skewnessExplanation}`;

  // Párrafo 2: Dispersión y Homogeneidad
  const paragraph2 = `2. Dispersión y Homogeneidad de los Datos: La dispersión global de la muestra exhibe un rango total de ${formatCourseNumber(disp.rangeR)}${u} (comprendido entre ${formatCourseNumber(disp.minVal)}${u} y ${formatCourseNumber(disp.maxVal)}${u}) y un rango intercuartílico (RIC) de ${formatCourseNumber(disp.iqr)}${u} en el 50% central. La desviación estándar poblacional es de ${formatCourseNumber(disp.stdDevPop)}${u} alrededor de la media, generando un coeficiente de variación del ${formatCourseNumber(disp.coefficientOfVariation)}%. De acuerdo con el criterio del curso, el conjunto de datos se clasifica como "${disp.homogeneityLabel}", lo que ${disp.coefficientOfVariation <= 20 ? "garantiza alta representatividad de la media aritmética" : "sugiere cautela al utilizar la media como único parámetro de resumen"}.`;

  // Párrafo 3: Cortes de Distribución Acumulada
  const paragraph3 = `3. Posición y Cortes de Distribución Acumulada: El decil 1 (P10) establece que el 10% de los registros más bajos no supera los ${formatCourseNumber(p10)}${u}. El primer cuartil (Q1) marca que el 25% de las unidades registra ${formatCourseNumber(disp.q1)}${u} o menos. El tercer cuartil (Q3) delimita que el 75% acumula hasta ${formatCourseNumber(disp.q3)}${u} (y consecuentemente el 25% superior supera dicho registro). Finalmente, el percentil 90 (P90) alcanza ${formatCourseNumber(p90)}${u}, delimitando el 10% de mayor magnitud en el colectivo analizado.`;

  // Párrafo 4: Diagnóstico de Valores Atípicos
  const outliersCount = disp.outliers.length;
  const paragraph4 = `4. Diagnóstico de Valores Atípicos (Regla 1.5 × RIC): Los límites de control de Tukey quedaron determinados por el Límite Inferior LI = ${formatCourseNumber(disp.lowerFenceLI)}${u} y el Límite Superior LS = ${formatCourseNumber(disp.upperFenceLS)}${u}. ${outliersCount === 0 ? `No se detectaron valores atípicos en la muestra (${outliersCount} registros por fuera de los límites), evidenciando un comportamiento consistente y libre de anomalías extremas.` : `Se identificaron ${outliersCount} valores atípicos (${disp.outliers.map((o) => formatCourseNumber(o) + u).join(", ")}), los cuales se apartan del comportamiento ordinario del colectivo y ameritan revisión o aislamiento según los objetivos del estudio.`}`;

  return {
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4,
  };
}

/**
 * Módulo 7: Probabilidad Empírica y Técnicas de Conteo con BigInt
 */
export function factorialBigInt(n: number): bigint {
  if (n < 0) return 0n;
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    res *= i;
  }
  return res;
}

export function combinationsBigInt(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  if (r === 0 || r === n) return 1n;
  const k = r > n - r ? n - r : r;
  let numerator = 1n;
  let denominator = 1n;
  for (let i = 1n; i <= BigInt(k); i++) {
    numerator *= BigInt(n) - i + 1n;
    denominator *= i;
  }
  return numerator / denominator;
}

export function permutationsBigInt(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  let res = 1n;
  for (let i = 0n; i < BigInt(r); i++) {
    res *= BigInt(n) - i;
  }
  return res;
}

