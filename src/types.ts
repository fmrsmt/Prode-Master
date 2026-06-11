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

export type Prode = {
  id: string;
  name: string;
  predictions: Record<string, { a: number | null; b: number | null }>;
};

export type ActualScores = Record<string, { a: number | null; b: number | null }>;
