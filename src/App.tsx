/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Target, Trophy, Plus, Settings2, BarChart3, ListChecks, DollarSign, Target as TargetIcon } from 'lucide-react';
import { INITIAL_FIXTURE } from './data';
import { Match, Prode, ActualScores, HouseOdds } from './types';
import MatchCard from './components/MatchCard';
import OddsManager from './components/OddsManager';
import ProdeComparison from './components/ProdeComparison';
import { calculateMatchPoints } from './utils';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  const [prodes, setProdes] = useState<Prode[]>([{ id: '1', name: 'Mi Prode', predictions: {} }]);
  const [actualScores, setActualScores] = useState<ActualScores>({});
  const [oddsData, setOddsData] = useState<Record<string, HouseOdds[]>>({});
  
  const [activeTabId, setActiveTabId] = useState<string>('RESULTS'); // 'RESULTS', 'ODDS', 'RANKING' or Prode ID

  useEffect(() => {
    let unsubscribe = () => {};
    const loadData = async () => {
      const docRef = doc(db, 'public', 'state');
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.prodes) setProdes(JSON.parse(data.prodes));
          if (data.actualScores) setActualScores(JSON.parse(data.actualScores));
          if (data.oddsData) setOddsData(JSON.parse(data.oddsData));
        }
        setIsInitializing(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'public/state');
        setIsInitializing(false);
      });
    };
    loadData();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    const path = `public/state`;
    const saveData = async () => {
      try {
        await setDoc(doc(db, 'public', 'state'), {
          prodes: JSON.stringify(prodes),
          actualScores: JSON.stringify(actualScores),
          oddsData: JSON.stringify(oddsData)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };
    
    // Simple debounce to avoid spamming Firestore
    const handler = setTimeout(() => {
      saveData();
    }, 1000);
    return () => clearTimeout(handler);
  }, [prodes, actualScores, oddsData, isInitializing]);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando...</div>;
  }

  const activeProde = prodes.find(p => p.id === activeTabId);

  // Calc score for active prode
  let totalPoints = 0;
  let hitsExact = 0;
  if (activeProde) {
    INITIAL_FIXTURE.forEach(m => {
        const pred = activeProde.predictions[m.id];
        const actual = actualScores[m.id];
        if (pred && actual && actual.a !== null && actual.b !== null && pred.a !== null && pred.b !== null) {
            const exactPoints = activeProde.config?.exactPoints ?? 3;
            const partialPoints = activeProde.config?.partialPoints ?? 1;
            const multiplier = activeProde.multipliers?.[m.id] ?? 1;
            
            const pts = calculateMatchPoints(actual.a, actual.b, pred.a, pred.b, exactPoints, partialPoints, multiplier);
            totalPoints += pts;
            if (pts === exactPoints * multiplier && pts > 0) hitsExact++;
        }
    });
  }

  const handleUpdatePrediction = (matchId: string, a: number | null, b: number | null) => {
    if (!activeProde) return;
    setProdes(prodes.map(p => {
        if (p.id !== activeProde.id) return p;
        return { ...p, predictions: { ...p.predictions, [matchId]: { a, b } } };
    }));
  };

  const handleToggleMultiplier = (matchId: string) => {
    if (!activeProde) return;
    setProdes(prodes.map(p => {
        if (p.id !== activeProde.id) return p;
        const multipliers = { ...(p.multipliers || {}) };
        if (multipliers[matchId] === 2) {
          delete multipliers[matchId];
        } else {
          multipliers[matchId] = 2;
        }
        return { ...p, multipliers };
    }));
  };

  const handleUpdateActual = (matchId: string, a: number | null, b: number | null) => {
    setActualScores({ ...actualScores, [matchId]: { a, b } });
  };

  const addNewProde = () => {
    const newProde: Prode = {
      id: Date.now().toString(),
      name: `Prode ${prodes.length + 1}`,
      predictions: {}
    };
    setProdes([...prodes, newProde]);
    setActiveTabId(newProde.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header Panel */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 bg-opacity-95 backdrop-blur-md pb-6 pt-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 text-blue-600 mb-1">
                <TargetIcon className="w-7 h-7" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prode Master</h1>
              </div>
              
              <div className="md:hidden flex items-center gap-4">
              </div>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Gestor matemático 2026. Optimiza tus predicciones maximizando tu esperanza (EV) usando probabilidades derivables.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-3">
             
             {activeProde && (
              <div className="flex items-center gap-6 bg-white border border-slate-200 py-3 px-6 rounded-2xl shadow-sm">
                  <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{activeProde.name}</span>
                  <div className="text-3xl font-mono font-bold text-slate-900 flex items-baseline gap-1">
                      {totalPoints} <span className="text-sm font-sans font-medium text-slate-500">pts</span>
                  </div>
                  </div>
                  <div className="h-10 w-px bg-slate-200"></div>
                  <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1"><Trophy className="w-3 h-3"/> Exactos</span>
                  <div className="text-xl font-mono font-bold text-blue-600">{hitsExact}</div>
                  </div>
              </div>
             )}
          </div>

        </div>

        {/* Local Navigation Tabs */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-wrap gap-2">
            <button
                onClick={() => setActiveTabId('RESULTS')}
                className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-lg transition-colors ${
                    activeTabId === 'RESULTS' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
                <Settings2 className="w-4 h-4" /> Resultados Reales
            </button>
            <button
                onClick={() => setActiveTabId('ODDS')}
                className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-lg transition-colors ${
                    activeTabId === 'ODDS' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
                <DollarSign className="w-4 h-4" /> Cotizaciones
            </button>
            <button
                onClick={() => setActiveTabId('RANKING')}
                className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-lg transition-colors ${
                    activeTabId === 'RANKING' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
                <BarChart3 className="w-4 h-4" /> Comparar Prodes
            </button>

            <div className="w-px h-8 bg-slate-200 mx-2 self-center"></div>

            {prodes.map(p => (
                <button
                    key={p.id}
                    onClick={() => setActiveTabId(p.id)}
                    className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-lg transition-colors ${
                        activeTabId === p.id 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-blue-50 border text-blue-700 border-blue-100 hover:bg-blue-100'
                    }`}
                >
                    <ListChecks className="w-4 h-4" /> {p.name}
                </button>
            ))}
            <button
                onClick={addNewProde}
                className="px-3 py-2 text-sm font-bold flex items-center gap-1 text-slate-400 hover:text-slate-700 bg-transparent rounded-lg transition-colors"
                title="Nuevo Prode"
            >
                <Plus className="w-4 h-4" /> Add
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        
        {activeTabId === 'RANKING' && (
           <ProdeComparison prodes={prodes} actualScores={actualScores} matches={INITIAL_FIXTURE} oddsData={oddsData} />
        )}

        {activeTabId === 'ODDS' && (
           <OddsManager 
              matches={INITIAL_FIXTURE} 
              oddsData={oddsData} 
              onUpdateOdds={(id, h) => setOddsData({...oddsData, [id]: h})}
              onBulkUpdateOdds={(data) => setOddsData({ ...oddsData, ...data })}
           />
        )}

        {/* View para Resultados y Carga de Prodes */}
        {(activeTabId === 'RESULTS' || activeProde) && (
            <div className="flex flex-col gap-6">
              {activeProde && (
                <div className="flex flex-col gap-3 w-full max-w-sm mb-4">
                    <input 
                      type="text" 
                      value={activeProde.name}
                      onChange={(e) => {
                         setProdes(prodes.map(p => p.id === activeProde.id ? { ...p, name: e.target.value } : p));
                      }}
                      className="w-full px-4 py-2 border-b-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 bg-transparent outline-none text-xl font-bold text-slate-800 transition-colors"
                      placeholder="Nombre del Prode"
                    />
                    <div className="flex flex-wrap items-center gap-4 px-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                           Puntos Exacto: 
                           <input type="number" min="0" value={activeProde.config?.exactPoints ?? 3} onChange={(e) => {
                               const val = parseInt(e.target.value) || 0;
                               setProdes(prodes.map(p => p.id === activeProde.id ? { ...p, config: { ...(p.config || { exactPoints: 3, partialPoints: 1 }), exactPoints: val } } : p));
                           }} className="w-14 text-center border border-slate-200 rounded-md py-1 bg-white focus:outline-none focus:border-blue-500 text-slate-800" />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                           Puntos Parcial: 
                           <input type="number" min="0" value={activeProde.config?.partialPoints ?? 1} onChange={(e) => {
                               const val = parseInt(e.target.value) || 0;
                               setProdes(prodes.map(p => p.id === activeProde.id ? { ...p, config: { ...(p.config || { exactPoints: 3, partialPoints: 1 }), partialPoints: val } } : p));
                           }} className="w-14 text-center border border-slate-200 rounded-md py-1 bg-white focus:outline-none focus:border-blue-500 text-slate-800" />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                           Riesgo EV: 
                           <select 
                               value={activeProde.config?.riskMode || 'normal'}
                               onChange={(e) => {
                                   const val = e.target.value as 'conservative' | 'normal' | 'risky';
                                   setProdes(prodes.map(p => p.id === activeProde.id ? { ...p, config: { ...(p.config || { exactPoints: 3, partialPoints: 1 }), riskMode: val } } : p));
                               }}
                               className="border border-slate-200 rounded-md py-1 px-2 bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                           >
                               <option value="conservative">Conservador</option>
                               <option value="normal">Normal</option>
                               <option value="risky">Arriesgado</option>
                           </select>
                        </label>
                    </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INITIAL_FIXTURE.map((match) => {
                  const actual = actualScores[match.id] || { a: null, b: null };
                  const pred = activeProde ? activeProde.predictions[match.id] || { a: null, b: null } : { a: null, b: null };
                  const odds = oddsData[match.id] || [];

                  return (
                      <MatchCard 
                          key={match.id}
                          match={match}
                          actualScoreA={actual.a}
                          actualScoreB={actual.b}
                          predictedScoreA={pred.a}
                          predictedScoreB={pred.b}
                          oddsData={odds}
                          onUpdatePrediction={(a, b) => handleUpdatePrediction(match.id, a, b)}
                          onUpdateActual={(a, b) => handleUpdateActual(match.id, a, b)}
                          mode={activeTabId === 'RESULTS' ? 'results' : 'prode'}
                          exactPoints={activeProde?.config?.exactPoints ?? 3}
                          partialPoints={activeProde?.config?.partialPoints ?? 1}
                          multiplier={activeProde?.multipliers?.[match.id] ?? 1}
                          onToggleMultiplier={() => handleToggleMultiplier(match.id)}
                          riskMode={activeProde?.config?.riskMode || 'normal'}
                      />
                  );
              })}
              </div>
            </div>
        )}

      </main>

    </div>
  );
}
