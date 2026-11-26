/**
 * Motor Matemático y Reglas de la Ruleta Europea para Royale Probability 3D
 */

import { PocketColor, PocketInfo, PresetKey, SetOperationsResult } from "../types/probability";

// Secuencia circular oficial de la Ruleta Europea (37 casillas)
export const WHEEL_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const BLACK_NUMBERS = new Set<number>([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
]);

export const PRIME_NUMBERS = new Set<number>([
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31
]);

export const POCKETS_INFO: PocketInfo[] = Array.from({ length: 37 }, (_, i) => {
  const num = i;
  let color: PocketColor = "green";
  if (RED_NUMBERS.has(num)) color = "red";
  else if (BLACK_NUMBERS.has(num)) color = "black";

  let dozen: 1 | 2 | 3 | null = null;
  if (num >= 1 && num <= 12) dozen = 1;
  else if (num >= 13 && num <= 24) dozen = 2;
  else if (num >= 25 && num <= 36) dozen = 3;

  let column: 1 | 2 | 3 | null = null;
  if (num > 0) {
    const rem = num % 3;
    if (rem === 1) column = 1;
    else if (rem === 2) column = 2;
    else column = 3;
  }

  let half: "low" | "high" | null = null;
  if (num >= 1 && num <= 18) half = "low";
  else if (num >= 19 && num <= 36) half = "high";

  return {
    number: num,
    color,
    isEven: num > 0 && num % 2 === 0,
    isPrime: PRIME_NUMBERS.has(num),
    dozen,
    column,
    half,
  };
});

/**
 * Formato uniforme de moneda para evitar errores de hidratación entre cliente y servidor
 */
export function formatMoney(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "$0";
  const num = Math.round(val);
  return "$" + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Regla de formato numérico obligatoria:
 * - Enteros exactos sin decimales (ej. 0, 1, 37)
 * - De 1 a 3 decimales exactos: mostrarlos completos (ej. 0.5, 0.25)
 * - Más de 3 decimales: redondear estrictamente a 3 cifras decimales (ej. 18/37 = 0.486)
 */
export function formatCourseNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "-";
  if (!isFinite(val)) return val > 0 ? "∞" : "-∞";

  if (Number.isInteger(val)) {
    return val.toString();
  }

  const rounded = Math.round(val * 1000) / 1000;
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }

  const str = val.toString();
  if (str.includes(".") && !str.includes("e")) {
    const dec = str.split(".")[1];
    if (dec.length <= 3) {
      return str;
    }
  }

  return rounded.toFixed(3).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

/**
 * Máximo Común Divisor (Euclides)
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Fracción irreducible
 */
export function toIrreducibleFraction(numerator: number, denominator: number): string {
  if (denominator === 0) return "Indefinido";
  if (numerator === 0) return "0";
  const common = gcd(numerator, denominator);
  const n = Math.round(numerator / common);
  const d = Math.round(denominator / common);
  if (d === 1) return n.toString();
  return `${n}/${d}`;
}

/**
 * Genera el conjunto de números para un preset
 */
export function getNumbersForPreset(preset: PresetKey): Set<number> {
  const result = new Set<number>();
  switch (preset) {
    case "red":
      RED_NUMBERS.forEach((n) => result.add(n));
      break;
    case "black":
      BLACK_NUMBERS.forEach((n) => result.add(n));
      break;
    case "green":
      result.add(0);
      break;
    case "even":
      POCKETS_INFO.filter((p) => p.isEven).forEach((p) => result.add(p.number));
      break;
    case "odd":
      POCKETS_INFO.filter((p) => p.number > 0 && !p.isEven).forEach((p) => result.add(p.number));
      break;
    case "prime":
      PRIME_NUMBERS.forEach((n) => result.add(n));
      break;
    case "dozen1":
      POCKETS_INFO.filter((p) => p.dozen === 1).forEach((p) => result.add(p.number));
      break;
    case "dozen2":
      POCKETS_INFO.filter((p) => p.dozen === 2).forEach((p) => result.add(p.number));
      break;
    case "dozen3":
      POCKETS_INFO.filter((p) => p.dozen === 3).forEach((p) => result.add(p.number));
      break;
    case "col1":
      POCKETS_INFO.filter((p) => p.column === 1).forEach((p) => result.add(p.number));
      break;
    case "col2":
      POCKETS_INFO.filter((p) => p.column === 2).forEach((p) => result.add(p.number));
      break;
    case "col3":
      POCKETS_INFO.filter((p) => p.column === 3).forEach((p) => result.add(p.number));
      break;
    case "low":
      POCKETS_INFO.filter((p) => p.half === "low").forEach((p) => result.add(p.number));
      break;
    case "high":
      POCKETS_INFO.filter((p) => p.half === "high").forEach((p) => result.add(p.number));
      break;
    case "all":
      for (let i = 0; i <= 36; i++) result.add(i);
      break;
    case "none":
      break;
  }
  return result;
}

/**
 * Realiza el cálculo formal de probabilidades de Laplace, operaciones de conjuntos y probabilidad condicional
 */
export function calculateProbabilityOperations(setA: Set<number>, setB: Set<number>): SetOperationsResult {
  const cardinalOmega = 37;
  const cardinalA = setA.size;
  const cardinalB = setB.size;

  // Intersección A ∩ B
  const intersection = new Set<number>();
  setA.forEach((num) => {
    if (setB.has(num)) intersection.add(num);
  });
  const cardinalIntersection = intersection.size;

  // Unión A ∪ B
  const union = new Set<number>();
  setA.forEach((n) => union.add(n));
  setB.forEach((n) => union.add(n));
  const cardinalUnion = union.size;

  // Complementos
  const cardinalComplementA = cardinalOmega - cardinalA;
  const cardinalComplementB = cardinalOmega - cardinalB;

  // Probabilidades Teóricas (Laplace: P(E) = |E| / |Ω|)
  const probA = cardinalA / cardinalOmega;
  const probB = cardinalB / cardinalOmega;
  const probIntersection = cardinalIntersection / cardinalOmega;
  const probUnion = cardinalUnion / cardinalOmega;
  const probComplementA = cardinalComplementA / cardinalOmega;
  const probComplementB = cardinalComplementB / cardinalOmega;

  // Fracciones irreducibles
  const fracA = toIrreducibleFraction(cardinalA, cardinalOmega);
  const fracB = toIrreducibleFraction(cardinalB, cardinalOmega);
  const fracIntersection = toIrreducibleFraction(cardinalIntersection, cardinalOmega);
  const fracUnion = toIrreducibleFraction(cardinalUnion, cardinalOmega);
  const fracComplementA = toIrreducibleFraction(cardinalComplementA, cardinalOmega);

  // Clasificador de sucesos
  const isCompatible = cardinalIntersection > 0;
  const isCertainA = cardinalA === cardinalOmega;
  const isImpossibleA = cardinalA === 0;
  const isCertainB = cardinalB === cardinalOmega;
  const isImpossibleB = cardinalB === 0;

  // Probabilidad Condicional: P(A | B) = P(A ∩ B) / P(B) = |A ∩ B| / |B|
  let probAGivenB: number | null = null;
  let fracAGivenB = "Indefinido";
  let probBGivenA: number | null = null;
  let fracBGivenA = "Indefinido";
  let conditionalExplanation = "";

  if (cardinalB > 0) {
    probAGivenB = cardinalIntersection / cardinalB;
    fracAGivenB = toIrreducibleFraction(cardinalIntersection, cardinalB);
    conditionalExplanation = `Sabiendo que ocurrió el evento B (espacio muestral reducido a |B| = ${cardinalB} elementos), la probabilidad de que ocurra A es P(A|B) = |A ∩ B| / |B| = ${cardinalIntersection} / ${cardinalB} = ${fracAGivenB} (${formatCourseNumber(probAGivenB)} o ${(probAGivenB * 100).toFixed(1)}%).`;
  } else {
    conditionalExplanation = "El evento B es un evento imposible (|B| = 0), por lo cual la probabilidad condicional P(A|B) está matemáticamente indefinida (división entre cero).";
  }

  if (cardinalA > 0) {
    probBGivenA = cardinalIntersection / cardinalA;
    fracBGivenA = toIrreducibleFraction(cardinalIntersection, cardinalA);
  }

  return {
    cardinalOmega,
    cardinalA,
    cardinalB,
    cardinalIntersection,
    cardinalUnion,
    cardinalComplementA,
    cardinalComplementB,
    probA,
    probB,
    probIntersection,
    probUnion,
    probComplementA,
    probComplementB,
    fracA,
    fracB,
    fracIntersection,
    fracUnion,
    fracComplementA,
    isCompatible,
    isCertainA,
    isImpossibleA,
    isCertainB,
    isImpossibleB,
    probAGivenB,
    fracAGivenB,
    probBGivenA,
    fracBGivenA,
    conditionalExplanation,
  };
}

/**
 * Genera giros de Ruleta Europea aleatorios (0 a 36) equiprobables
 */
export function generateRandomSpins(count: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    // 0 a 36 con distribución uniforme
    results.push(Math.floor(Math.random() * 37));
  }
  return results;
}

/**
 * Obtiene los números cubiertos por una apuesta dada su clave
 */
export function getCoveredNumbersForBet(key: string): number[] {
  if (key.startsWith("num-")) {
    const num = parseInt(key.replace("num-", ""), 10);
    return isNaN(num) ? [] : [num];
  }
  switch (key) {
    case "red":
      return Array.from(RED_NUMBERS);
    case "black":
      return Array.from(BLACK_NUMBERS);
    case "green":
      return [0];
    case "even":
      return POCKETS_INFO.filter((p) => p.isEven).map((p) => p.number);
    case "odd":
      return POCKETS_INFO.filter((p) => p.number > 0 && !p.isEven).map((p) => p.number);
    case "prime":
      return Array.from(PRIME_NUMBERS);
    case "dozen1":
      return POCKETS_INFO.filter((p) => p.dozen === 1).map((p) => p.number);
    case "dozen2":
      return POCKETS_INFO.filter((p) => p.dozen === 2).map((p) => p.number);
    case "dozen3":
      return POCKETS_INFO.filter((p) => p.dozen === 3).map((p) => p.number);
    case "col1":
      return POCKETS_INFO.filter((p) => p.column === 1).map((p) => p.number);
    case "col2":
      return POCKETS_INFO.filter((p) => p.column === 2).map((p) => p.number);
    case "col3":
      return POCKETS_INFO.filter((p) => p.column === 3).map((p) => p.number);
    case "low":
      return POCKETS_INFO.filter((p) => p.half === "low").map((p) => p.number);
    case "high":
      return POCKETS_INFO.filter((p) => p.half === "high").map((p) => p.number);
    default:
      return [];
  }
}

/**
 * Multiplicador de pago para la ruleta europea (ganancia neta por unidad apostada)
 * Straight up: 35 to 1
 * Dozens & Columns: 2 to 1
 * Even-money (Red, Black, Even, Odd, 1-18, 19-36): 1 to 1
 */
export function getBetMultiplier(key: string): number {
  if (key.startsWith("num-")) return 35;
  if (key.startsWith("dozen") || key.startsWith("col")) return 2;
  return 1;
}

/**
 * Nombre legible para cualquier tipo de apuesta
 */
export function getBetLabel(key: string): string {
  if (key.startsWith("num-")) return `Número ${key.replace("num-", "")}`;
  switch (key) {
    case "red": return "Rojo";
    case "black": return "Negro";
    case "even": return "Par (Even)";
    case "odd": return "Impar (Odd)";
    case "low": return "1 a 18 (Manque)";
    case "high": return "19 a 36 (Passe)";
    case "dozen1": return "1ª Docena (1-12)";
    case "dozen2": return "2ª Docena (13-24)";
    case "dozen3": return "3ª Docena (25-36)";
    case "col1": return "Columna 1 (2:1)";
    case "col2": return "Columna 2 (2:1)";
    case "col3": return "Columna 3 (2:1)";
    default: return key;
  }
}

/**
 * Calcula el pago y liquidación de una ronda de ruleta completa
 */
export function calculateRoundResult(
  bets: Record<string, number>,
  winningNumber: number
) {
  let color: PocketColor = "green";
  if (RED_NUMBERS.has(winningNumber)) color = "red";
  else if (BLACK_NUMBERS.has(winningNumber)) color = "black";

  let totalBet = 0;
  let totalPayout = 0;
  const winningBets: { key: string; label: string; bet: number; payout: number }[] = [];

  Object.entries(bets).forEach(([key, amount]) => {
    if (amount <= 0) return;
    totalBet += amount;
    const covered = getCoveredNumbersForBet(key);
    if (covered.includes(winningNumber)) {
      const mult = getBetMultiplier(key);
      const payout = amount + amount * mult; // Devuelve la apuesta más la ganancia
      totalPayout += payout;
      winningBets.push({
        key,
        label: getBetLabel(key),
        bet: amount,
        payout,
      });
    }
  });

  const netProfit = totalPayout - totalBet;

  return {
    winningNumber,
    color,
    totalBet,
    totalPayout,
    netProfit,
    winningBets,
  };
}

/**
 * Calcula estadísticas y esperanza matemática E[X] en tiempo real para las apuestas activas
 */
export function calculateBetStats(bets: Record<string, number>) {
  const coveredSet = new Set<number>();
  let totalBet = 0;

  Object.entries(bets).forEach(([key, amount]) => {
    if (amount <= 0) return;
    totalBet += amount;
    const nums = getCoveredNumbersForBet(key);
    nums.forEach((n) => coveredSet.add(n));
  });

  const coveredCount = coveredSet.size;
  const winProb = coveredCount / 37;
  const winFrac = toIrreducibleFraction(coveredCount, 37);

  // Esperanza matemática E[X] = sum_{outcome=0}^{36} (Payout(outcome) / 37) - TotalBet
  let expectedGrossPayout = 0;
  if (totalBet > 0) {
    for (let outcome = 0; outcome <= 36; outcome++) {
      let outcomePayout = 0;
      Object.entries(bets).forEach(([key, amount]) => {
        if (amount <= 0) return;
        const nums = getCoveredNumbersForBet(key);
        if (nums.includes(outcome)) {
          outcomePayout += amount + amount * getBetMultiplier(key);
        }
      });
      expectedGrossPayout += outcomePayout / 37;
    }
  }

  const expectedValue = expectedGrossPayout - totalBet;
  const houseEdge = totalBet > 0 ? (expectedValue / totalBet) * 100 : -2.70;

  return {
    totalBet,
    coveredSet,
    coveredCount,
    winProb,
    winFrac,
    expectedValue,
    houseEdge,
  };
}

