import React from 'react';
import { Target, Trophy, CheckCircle2 } from 'lucide-react';
import { Prode, ActualScores, Match } from '../types';
import { calculateMatchPoints } from '../utils';

type Props = {
  prodes: Prode[];
  actualScores: ActualScores;
  matches: Match[];
};

export default function ProdeComparison({ prodes, actualScores, matches }: Props) {
  const stats = prodes.map(prode => {
    let pts = 0;
    let exacts = 0;
    let partials = 0;
    
    matches.forEach(m => {
        const pred = prode.predictions[m.id];
        const actual = actualScores[m.id];
        if (pred && actual) {
            const pt = calculateMatchPoints(actual.a, actual.b, pred.a, pred.b);
            pts += pt;
            if (pt === 3) exacts++;
            if (pt === 1) partials++;
        }
    });

    return { ...prode, pts, exacts, partials };
  }).sort((a, b) => b.pts - a.pts);

  return (
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
              <th className="py-4 px-6 font-bold text-blue-600 text-xs uppercase tracking-widest text-right">Puntaje EV</th>
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
                  <span className="text-2xl font-black font-mono text-slate-800">{stat.pts}</span>
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
  );
}
