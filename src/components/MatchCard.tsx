import React, { useState } from 'react';
import { Calculator, CheckCircle2, CircleDashed, Filter } from 'lucide-react';
import { Match, HouseOdds } from '../types';
import { calculateMatchPoints, calculateTopPredictions } from '../utils';
import { FLAGS } from '../flags';

type Props = {
  key?: React.Key;
  match: Match;
  actualScoreA: number | null;
  actualScoreB: number | null;
  predictedScoreA: number | null;
  predictedScoreB: number | null;
  oddsData: HouseOdds[];
  onUpdateActual?: (a: number | null, b: number | null) => void;
  onUpdatePrediction?: (a: number | null, b: number | null) => void;
  mode: 'prode' | 'results';
  exactPoints?: number;
  partialPoints?: number;
  multiplier?: number;
  onToggleMultiplier?: () => void;
  riskMode?: 'conservative' | 'normal' | 'risky';
};

export default function MatchCard({ 
  match, actualScoreA, actualScoreB, predictedScoreA, predictedScoreB, 
  oddsData, onUpdateActual, onUpdatePrediction, mode, 
  exactPoints = 3, partialPoints = 1, multiplier = 1, onToggleMultiplier,
  riskMode = 'normal'
}: Props) {
  const [selectedHouse, setSelectedHouse] = useState<string>('ALL');

  const points = calculateMatchPoints(actualScoreA, actualScoreB, predictedScoreA, predictedScoreB, exactPoints, partialPoints, multiplier);
  const hasResult = actualScoreA !== null && actualScoreB !== null;

  const parseScore = (val: string) => {
    if (val === '') return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const hasOdds = oddsData && oddsData.length > 0;
  const topPredictions = hasOdds ? calculateTopPredictions(oddsData, selectedHouse, 3, exactPoints, partialPoints, riskMode) : [];

  return (
    <div className={`bg-white border hover:border-blue-300 shadow-sm hover:shadow-md transition-all rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group ${multiplier === 2 ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'}`}>
      {hasResult && mode === 'prode' && (
        <div className={`absolute top-0 right-0 px-4 py-1.5 text-xs font-bold rounded-bl-xl ${points === exactPoints * multiplier ? 'bg-blue-100 text-blue-700' : points === partialPoints * multiplier ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
          +{points} pts
        </div>
      )}

      {mode === 'prode' && onToggleMultiplier && (
        <button 
          onClick={onToggleMultiplier}
          className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${multiplier === 2 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'}`}
          title="Marcar partido por doble de puntos"
        >
          x2
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{match.stage}</span>
        <span className="text-xs font-medium text-slate-500">{match.formattedDate}</span>
      </div>

      {/* Teams Lineup */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right font-semibold text-lg leading-tight text-slate-900 flex flex-col items-end gap-1">
          {FLAGS[match.teamA] ? <img src={`https://flagcdn.com/w40/${FLAGS[match.teamA]}.png`} alt={match.teamA} className="w-8 h-auto shadow-sm rounded-sm" /> : <span className="text-2xl">🏳️</span>}
          <span>{match.teamA}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-mono font-medium shrink-0">VS</div>
        <div className="text-left font-semibold text-lg leading-tight text-slate-900 flex flex-col items-start gap-1">
          {FLAGS[match.teamB] ? <img src={`https://flagcdn.com/w40/${FLAGS[match.teamB]}.png`} alt={match.teamB} className="w-8 h-auto shadow-sm rounded-sm" /> : <span className="text-2xl">🏳️</span>}
          <span>{match.teamB}</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full my-1"></div>

      {mode === 'prode' && (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-6">
                {/* Mi Prode Section */}
                <div className="flex flex-col gap-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Mi Predicción
                </label>
                <div className="flex items-center gap-3">
                    <input 
                    type="number"
                    min="0"
                    value={predictedScoreA === null ? '' : predictedScoreA}
                    onChange={(e) => onUpdatePrediction?.(parseScore(e.target.value), predictedScoreB)}
                    className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono text-blue-600 font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                    <span className="text-slate-400 font-medium">-</span>
                    <input 
                    type="number"
                    min="0"
                    value={predictedScoreB === null ? '' : predictedScoreB}
                    onChange={(e) => onUpdatePrediction?.(predictedScoreA, parseScore(e.target.value))}
                    className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-mono text-blue-600 font-bold focus:border-blue-500 focus:bg-white outline-none transition-colors"
                    />
                </div>
                </div>

                {/* Resultado Real (Read-only view en Prode mode) */}
                <div className="flex flex-col gap-2 items-end">
                <label className="text-[11px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <CircleDashed className="w-3.5 h-3.5 text-slate-400" /> Resultado Oficial
                </label>
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xl font-mono text-slate-500 font-bold">
                        {actualScoreA === null ? '-' : actualScoreA}
                    </div>
                    <span className="text-slate-400 font-medium">-</span>
                    <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xl font-mono text-slate-500 font-bold">
                        {actualScoreB === null ? '-' : actualScoreB}
                    </div>
                </div>
                </div>
            </div>

            {hasOdds && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[11px] text-slate-600 uppercase tracking-widest font-bold flex items-center gap-1.5">
                            <Calculator className="w-3.5 h-3.5 text-amber-500" /> Top Resultados Esperados (EV)
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <Filter className="w-3 h-3 text-slate-400" />
                          <select 
                            value={selectedHouse}
                            onChange={e => setSelectedHouse(e.target.value)}
                            className="bg-white border border-slate-200 rounded-md px-2 py-1 outline-none focus:border-blue-500 font-medium text-slate-600 max-w-[100px]"
                          >
                            <option value="ALL">Promedio Todas</option>
                            {oddsData.map(h => <option key={h.id} value={h.id}>{h.houseName}</option>)}
                          </select>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {topPredictions.map((tp, idx) => (
                            <button
                                key={idx}
                                onClick={() => onUpdatePrediction?.(tp.scoreA, tp.scoreB)}
                                className="flex items-center justify-between w-full bg-white border border-slate-200 hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition-all rounded-lg px-3 py-2 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-lg font-black text-slate-800 tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                                        {tp.scoreA} - {tp.scoreB}
                                    </span>
                                    {idx === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">Mejor Opción</span>}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-emerald-600 font-mono">+{tp.expectedPoints} EV</div>
                                </div>
                            </button>
                        ))}
                        {topPredictions.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-2">No hay cuotas exactas cargadas bajo estos filtros.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}

      {mode === 'results' && (
        <div className="flex flex-col gap-2 items-center">
            <label className="text-[11px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <CircleDashed className="w-3.5 h-3.5 text-slate-400" /> Cargar Resultado Oficial
            </label>
            <div className="flex items-center gap-3">
                <input 
                type="number"
                min="0"
                placeholder="?"
                value={actualScoreA === null ? '' : actualScoreA}
                onChange={(e) => onUpdateActual?.(parseScore(e.target.value), actualScoreB)}
                className="w-16 h-16 bg-white border border-slate-300 rounded-xl text-center text-2xl font-mono text-slate-900 font-bold focus:border-slate-500 focus:shadow-md outline-none transition-all shadow-sm"
                />
                <span className="text-slate-400 font-medium">-</span>
                <input 
                type="number"
                min="0"
                placeholder="?"
                value={actualScoreB === null ? '' : actualScoreB}
                onChange={(e) => onUpdateActual?.(actualScoreA, parseScore(e.target.value))}
                className="w-16 h-16 bg-white border border-slate-300 rounded-xl text-center text-2xl font-mono text-slate-900 font-bold focus:border-slate-500 focus:shadow-md outline-none transition-all shadow-sm"
                />
            </div>
        </div>
      )}

    </div>
  );
}
