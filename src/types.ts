export type Match = {
  id: string;
  stage: string;
  teamA: string;
  teamB: string;
  datetime: string;
  formattedDate: string;
};

export type HouseOdds = {
  id: string;
  houseName: string;
  odds1?: number | string;
  oddsX?: number | string;
  odds2?: number | string;
  scores: Record<string, number | string>;
};

export interface ProdeConfig {
  exactPoints: number;
  partialPoints: number;
  riskMode?: 'conservative' | 'normal' | 'risky';
  evaluationMinutes?: 90 | 120;
  adjustOddsTo120?: boolean;
  drawReductionFactor?: number; // percentage reduction, e.g. 30 for 30%
}

export type Prode = {
  id: string;
  name: string;
  predictions: Record<string, { a: number | null; b: number | null }>;
  multipliers?: Record<string, number>;
  config?: ProdeConfig;
};

export type ActualScores = Record<string, { a: number | null; b: number | null }>;
