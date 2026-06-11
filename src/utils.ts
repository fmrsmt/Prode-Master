import { HouseOdds } from './types';

export const COMMON_SCORES = [
  {a: 1, b: 0}, {a: 2, b: 0}, {a: 2, b: 1}, {a: 3, b: 0}, {a: 3, b: 1}, {a: 3, b: 2},
  {a: 0, b: 0}, {a: 1, b: 1}, {a: 2, b: 2},
  {a: 0, b: 1}, {a: 0, b: 2}, {a: 1, b: 2}, {a: 0, b: 3}, {a: 1, b: 3}, {a: 2, b: 3}
];

export function calculateTopPredictions(houses: HouseOdds[], houseIdFilter?: string) {
  const activeHouses = houseIdFilter && houseIdFilter !== 'ALL'
    ? houses.filter(h => h.id === houseIdFilter)
    : houses;

  if (activeHouses.length === 0) return [];

  const avgProbs: Record<string, number> = {};

  COMMON_SCORES.forEach(({a, b}) => {
    const key = `${a}-${b}`;
    let probSum = 0;
    let count = 0;
    activeHouses.forEach(house => {
        const oddVal = house.scores[key];
        const odd = typeof oddVal === 'string' ? parseFloat(oddVal.replace(',', '.')) : oddVal;
        if (odd && odd > 1) {
            probSum += (1 / odd);
            count++;
        }
    });

    if (count > 0) {
        avgProbs[key] = probSum / count;
    } else {
        avgProbs[key] = 0;
    }
  });

  // Calculate base outcome probabilities from 1X2 odds
  let prob1Sum = 0; let prob1Count = 0;
  let probXSum = 0; let probXCount = 0;
  let prob2Sum = 0; let prob2Count = 0;

  activeHouses.forEach(house => {
      const o1 = typeof house.odds1 === 'string' ? parseFloat(house.odds1.replace(',', '.')) : (house.odds1 as number | undefined);
      const oX = typeof house.oddsX === 'string' ? parseFloat(house.oddsX.replace(',', '.')) : (house.oddsX as number | undefined);
      const o2 = typeof house.odds2 === 'string' ? parseFloat(house.odds2.replace(',', '.')) : (house.odds2 as number | undefined);
      
      if (o1 && !Number.isNaN(o1)) { prob1Sum += 1 / o1; prob1Count++; }
      if (oX && !Number.isNaN(oX)) { probXSum += 1 / oX; probXCount++; }
      if (o2 && !Number.isNaN(o2)) { prob2Sum += 1 / o2; prob2Count++; }
  });

  let totalProbHome = prob1Count > 0 ? prob1Sum / prob1Count : 0;
  let totalProbDraw = probXCount > 0 ? probXSum / probXCount : 0;
  let totalProbAway = prob2Count > 0 ? prob2Sum / prob2Count : 0;

  // Fallback to summing exact scores if 1X2 odds are missing
  if (totalProbHome === 0 && totalProbDraw === 0 && totalProbAway === 0) {
    COMMON_SCORES.forEach(({a, b}) => {
      const p = avgProbs[`${a}-${b}`] || 0;
      if (a > b) totalProbHome += p;
      else if (a === b) totalProbDraw += p;
      else totalProbAway += p;
    });
  }

  const evResults: { scoreA: number, scoreB: number, ev: number, exactProb: number }[] = [];

  COMMON_SCORES.forEach(({a: pA, b: pB}) => {
    const keyP = `${pA}-${pB}`;
    const pExact = avgProbs[keyP] || 0;
    const pOutcome = pA > pB ? totalProbHome : pA === pB ? totalProbDraw : totalProbAway;

    // EV = 3 puntos (acierto exacto) + 1 punto (acierto de resultado sin ser exacto)
    // E(XP) = 3 * pExact + 1 * (pOutcome - pExact)
    // E(XP) = 2 * pExact + pOutcome
    const ev = (2 * pExact) + pOutcome;

    if (ev > 0) {
        evResults.push({ scoreA: pA, scoreB: pB, ev, exactProb: pExact });
    }
  });

  evResults.sort((x, y) => y.ev - x.ev);

  return evResults.slice(0, 3).map(res => ({
    scoreA: res.scoreA,
    scoreB: res.scoreB,
    expectedPoints: res.ev.toFixed(3),
    probs: {
        exact: (res.exactProb * 100).toFixed(1)
    }
  }));
}

export function calculateRecommendedPrediction(houses: HouseOdds[]) {
   const top = calculateTopPredictions(houses);
   return top.length > 0 ? top[0] : null; // For backward compatibility if needed
}

export function map1X2ToExactOdds(odds1: number, oddsX: number, odds2: number): Record<string, number> {
  const prob1 = 1 / odds1;
  const probX = 1 / oddsX;
  const prob2 = 1 / odds2;
  const totalMargin = prob1 + probX + prob2;

  // Normalize probabilities without the house margin
  const p1 = prob1 / totalMargin;
  const pX = probX / totalMargin;
  const p2 = prob2 / totalMargin;

  const exactScores: Record<string, number> = {};

  // Standard simplistic distribution logic
  const distribute = (probs: { score: string, share: number }[], baseProb: number) => {
      probs.forEach(item => {
          const exactProb = baseProb * item.share;
          exactScores[item.score] = 1 / exactProb; // Convert back to odds
      });
  };

  distribute([
      { score: '1-0', share: 0.35 },
      { score: '2-0', share: 0.25 },
      { score: '2-1', share: 0.25 },
      { score: '3-0', share: 0.08 },
      { score: '3-1', share: 0.05 },
      { score: '3-2', share: 0.02 },
  ], p1);

  distribute([
      { score: '1-1', share: 0.50 },
      { score: '0-0', share: 0.35 },
      { score: '2-2', share: 0.15 },
  ], pX);

  distribute([
      { score: '0-1', share: 0.35 },
      { score: '0-2', share: 0.25 },
      { score: '1-2', share: 0.25 },
      { score: '0-3', share: 0.08 },
      { score: '1-3', share: 0.05 },
      { score: '2-3', share: 0.02 },
  ], p2);

  return exactScores;
}

export function calculateMatchPoints(actualA: number | null, actualB: number | null, predA: number | null, predB: number | null) {
  if (actualA === null || actualB === null || predA === null || predB === null) return 0;
  if (actualA === predA && actualB === predB) return 3; // EXACT RESULT (3 points)
  
  const actualDiff = actualA - actualB;
  const predDiff = predA - predB;
  
  const actualOutcome = actualDiff > 0 ? 1 : actualDiff < 0 ? -1 : 0;
  const predOutcome = predDiff > 0 ? 1 : predDiff < 0 ? -1 : 0;
  
  if (actualOutcome === predOutcome) return 1; // CORRECT OUTCOME W/D/L (1 point)
  return 0; // ZERO POINTS
}
