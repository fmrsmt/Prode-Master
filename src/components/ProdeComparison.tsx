import React from 'react';
import { Target, Trophy, CheckCircle2, LayoutList } from 'lucide-react';
import { Prode, ActualScores, Match, HouseOdds } from '../types';
import { calculateMatchPoints, calculateTopPredictions } from '../utils';

type Props = {
  prodes: Prode[];
  actualScores: ActualScores;
  matches: Match[];
  oddsData: Record<string, HouseOdds[]>;
};

export default function ProdeComparison({ prodes, actualScores, matches, oddsData }: Props) {
  const stats = prodes.map(prode => {
    let pts = 0;
    let exacts = 0;
    let partials = 0;
    let totalEV = 0;
    
    matches.forEach(m => {
        const pred = prode.predictions[m.id];
        const actual = actualScores[m.id];
        if (pred && actual && actual.a !== null && actual.b !== null && pred.a !== null && pred.b !== null) {
            const exactPoints = prode.config?.exactPoints ?? 3;
            const partialPoints = prode.config?.partialPoints ?? 1;
            const multiplier = prode.multipliers?.[m.id] ?? 1;
            const riskMode = prode.config?.riskMode ?? 'normal';

            const pt = calculateMatchPoints(actual.a, actual.b, pred.a, pred.b, exactPoints, partialPoints, multiplier);
            pts += pt;
            if (pt === exactPoints * multiplier && pt > 0) exacts++;
            else if (pt === partialPoints * multiplier && pt > 0) partials++;

            const odds = oddsData[m.id] || [];
            if (odds.length > 0) {
               const isSecondRound = m.stage === 'Segunda Ronda';
               const adjustOddsTo120 = prode.config?.adjustOddsTo120 ?? true;
               const drawReductionFactor = prode.config?.drawReductionFactor ?? 30;
               const predictions = calculateTopPredictions(
                  odds, 
                  undefined, 
                  -1, 
                  exactPoints, 
                  partialPoints, 
                  riskMode,
                  isSecondRound,
                  adjustOddsTo120,
                  drawReductionFactor
               );
               const matchPredEV = predictions.find(p => p.scoreA === pred.a && p.scoreB === pred.b);
               if (matchPredEV) {
                  totalEV += parseFloat(matchPredEV.expectedPoints) * multiplier;
               }
            }
        }
    });

    return { ...prode, pts, exacts, partials, totalEV };
  }).sort((a, b) => b.pts - a.pts);

  return (
    <div className="flex flex-col gap-8">
      {/* Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Ranking de Prodes
            </h3>
            <p className="text-sm text-slate-500 mt-1">Comparativa de tu rendimiento en diferentes torneos/grupos de amigos.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest w-16 text-center">Pos</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Nombre</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Exactos (3pts)</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Parciales (1pt)</th>
                <th className="py-4 px-6 font-bold text-blue-600 text-xs uppercase tracking-widest text-right">Puntaje (EV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {stats.map((stat, idx) => (
                <tr key={stat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-center font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {stat.name}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono font-bold text-emerald-600">{stat.exacts}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-mono font-bold text-slate-500">{stat.partials}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex flex-col items-end justify-center">
                       <span className="text-2xl font-black font-mono text-slate-800">{stat.pts}</span>
                       <span className="text-xs font-bold text-emerald-600 font-mono">EV: {stat.totalEV.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No hay prodes creados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail by Match Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-blue-500" /> Detalle por Partido
            </h3>
            <p className="text-sm text-slate-500 mt-1">Revisa el pronóstico de cada prode por partido.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest min-w-[150px]">Partido</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center min-w-[100px]">Real</th>
                {stats.map(prode => (
                  <th key={prode.id} className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center min-w-[100px]">
                    {prode.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {matches.map(m => {
                const actual = actualScores[m.id];
                const hasActual = actual && actual.a !== null && actual.b !== null;
                const rA = hasActual ? actual.a : '-';
                const rB = hasActual ? actual.b : '-';
                
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-700 text-sm whitespace-nowrap">
                      {m.teamA.substring(0, 3).toUpperCase()} <span className="text-slate-400 mx-1">vs</span> {m.teamB.substring(0, 3).toUpperCase()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="inline-flex items-center justify-center bg-slate-100 border border-slate-200 px-3 py-1 rounded-md min-w-[80px]">
                        <span className="font-mono font-bold text-slate-800">{rA} - {rB}</span>
                      </div>
                    </td>
                    {stats.map(prode => {
                      const pred = prode.predictions[m.id];
                      const hasPred = pred && pred.a !== null && pred.b !== null;
                      const pA = hasPred ? pred.a : '-';
                      const pB = hasPred ? pred.b : '-';
                      
                      let pts = 0;
                      let exactPoints = 3;
                      let partialPoints = 1;
                      let multiplier = 1;

                      if (hasActual && hasPred) {
                        exactPoints = prode.config?.exactPoints ?? 3;
                        partialPoints = prode.config?.partialPoints ?? 1;
                        multiplier = prode.multipliers?.[m.id] ?? 1;
                        pts = calculateMatchPoints(actual.a, actual.b, pred.a, pred.b, exactPoints, partialPoints, multiplier);
                      }

                      let bgClass = "bg-white border-slate-100 text-slate-400";
                      if (hasActual && hasPred) {
                        if (pts === exactPoints * multiplier && pts > 0) bgClass = "bg-emerald-100 border-emerald-200 text-emerald-800";
                        else if (pts === partialPoints * multiplier && pts > 0) bgClass = "bg-amber-100 border-amber-200 text-amber-800";
                        else bgClass = "bg-slate-50 border-slate-200 text-slate-500";
                      } else if (hasPred) {
                        bgClass = "bg-white border-slate-200 text-slate-700";
                      }

                      return (
                        <td key={prode.id} className="py-3 px-6 text-center">
                          <div className={`inline-flex flex-col items-center justify-center border px-3 py-1 rounded-md min-w-[80px] transition-colors ${multiplier === 2 && !hasActual ? 'ring-1 ring-amber-300' : ''} ${bgClass}`}>
                            <span className="font-mono font-bold">{pA} - {pB}</span>
                            {multiplier === 2 && <span className="text-[9px] font-bold uppercase mt-0.5 opacity-60">x2</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={2 + stats.length} className="py-12 text-center text-slate-400 font-medium">No hay partidos disponibles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
