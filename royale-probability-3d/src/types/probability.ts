/**
 * Definiciones de Tipos para Royale Probability 3D
 */

export type PocketColor = "green" | "red" | "black";

export interface PocketInfo {
  number: number;
  color: PocketColor;
  isEven: boolean;
  isPrime: boolean;
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
  half: "low" | "high" | null; // 1-18 or 19-36
}

export type PresetKey =
  | "red"
  | "black"
  | "green"
  | "even"
  | "odd"
  | "prime"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "col1"
  | "col2"
  | "col3"
  | "low"
  | "high"
  | "all"
  | "none";

export interface EventDefinition {
  id: "A" | "B";
  name: string;
  numbers: Set<number>;
  color: string;
}

export interface SetOperationsResult {
  cardinalOmega: number; // 37
  cardinalA: number;
  cardinalB: number;
  cardinalIntersection: number; // |A ∩ B|
  cardinalUnion: number; // |A ∪ B|
  cardinalComplementA: number; // |A^c|
  cardinalComplementB: number; // |B^c|
  
  // Probabilidades Teóricas
  probA: number; // P(A)
  probB: number; // P(B)
  probIntersection: number; // P(A ∩ B)
  probUnion: number; // P(A ∪ B)
  probComplementA: number; // P(A^c)
  probComplementB: number; // P(B^c)
  
  // Fracciones irreducibles
  fracA: string;
  fracB: string;
  fracIntersection: string;
  fracUnion: string;
  fracComplementA: string;

  // Clasificación de Sucesos
  isCompatible: boolean;
  isCertainA: boolean;
  isImpossibleA: boolean;
  isCertainB: boolean;
  isImpossibleB: boolean;

  // Probabilidad Condicional
  probAGivenB: number | null; // P(A | B)
  fracAGivenB: string;
  probBGivenA: number | null; // P(B | A)
  fracBGivenA: string;
  conditionalExplanation: string;
}

export interface SpinRecord {
  id: string;
  number: number;
  color: PocketColor;
  timestamp: number;
  inA: boolean;
  inB: boolean;
  inIntersection: boolean;
}

export type ChipValue = 1 | 5 | 25 | 100 | 500;

export interface BetPlacement {
  key: string;
  amount: number;
  label: string;
  numbers: number[];
  multiplier: number;
}

export interface RouletteRoundResult {
  winningNumber: number;
  color: PocketColor;
  totalBet: number;
  totalPayout: number;
  netProfit: number;
  winningBets: { key: string; label: string; bet: number; payout: number }[];
}

export interface MonteCarloDataPoint {
  iteration: number;
  spinResult: number;
  successesA: number;
  empiricalFreqA: number; // h_i = f_A / N
  theoreticalPA: number;
}

