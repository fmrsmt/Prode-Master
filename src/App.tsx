/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Target, Trophy, Plus, Settings2, BarChart3, ListChecks, DollarSign, Target as TargetIcon, User, LogOut } from 'lucide-react';
import { INITIAL_FIXTURE } from './data';
import { Match, Prode, ActualScores, HouseOdds } from './types';
import MatchCard from './components/MatchCard';
import OddsManager from './components/OddsManager';
import ProdeComparison from './components/ProdeComparison';
import { calculateMatchPoints } from './utils';
import { db, auth, signInWithGoogle, logOut } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

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
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [prodes, setProdes] = useState<Prode[]>([{ id: '1', name: 'Mi Prode', predictions: {} }]);
  const [actualScores, setActualScores] = useState<ActualScores>({});
  const [oddsData, setOddsData] = useState<Record<string, HouseOdds[]>>({});
  
  const [activeTabId, setActiveTabId] = useState<string>('RESULTS'); // 'RESULTS', 'ODDS', 'RANKING' or Prode ID

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const path = `users/${currentUser.uid}/data/state`;
        try {
          const docRef = doc(db, 'users', currentUser.uid, 'data', 'state');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.prodes) setProdes(JSON.parse(data.prodes));
            if (data.actualScores) setActualScores(JSON.parse(data.actualScores));
            if (data.oddsData) setOddsData(JSON.parse(data.oddsData));
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || isInitializing) return;
    const path = `users/${user.uid}/data/state`;
    const saveData = async () => {
      try {
        await setDoc(doc(db, 'users', user.uid, 'data', 'state'), {
          ownerId: user.uid,
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
  }, [prodes, actualScores, oddsData, user, isInitializing]);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center text-center">
          <TargetIcon className="w-16 h-16 text-blue-600 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido a Prode Master</h1>
          <p className="text-slate-500 mb-8">Guarda tus prodes, resultados y cotizaciones en la nube. Inicia sesión para continuar.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Ingresar con Google
          </button>
        </div>
      </div>
    );
  }

  const activeProde = prodes.find(p => p.id === activeTabId);

  // Calc score for active prode
  let totalPoints = 0;
  let hitsExact = 0;
  if (activeProde) {
    INITIAL_FIXTURE.forEach(m => {
        const pred = activeProde.predictions[m.id];
        const actual = actualScores[m.id];
        if (pred && actual) {
            const pts = calculateMatchPoints(actual.a, actual.b, pred.a, pred.b);
            totalPoints += pts;
            if (pts === 3) hitsExact++;
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
                <button onClick={logOut} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                    <LogOut className="w-4 h-4" /> Salir
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Gestor matemático 2026. Optimiza tus predicciones maximizando tu esperanza (EV) usando probabilidades derivables.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-3">
             <div className="flex items-center gap-3 bg-slate-100 rounded-full py-1.5 px-3">
                <img src={user?.photoURL || ''} alt={user?.displayName || 'User'} className="w-6 h-6 rounded-full bg-slate-300" />
                <span className="text-xs font-bold text-slate-700">{user?.displayName || user?.email}</span>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button onClick={logOut} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                  Salir
                </button>
             </div>
             
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
           <ProdeComparison prodes={prodes} actualScores={actualScores} matches={INITIAL_FIXTURE} />
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
                <div className="flex items-center gap-3 w-full max-w-sm">
                    <input 
                      type="text" 
                      value={activeProde.name}
                      onChange={(e) => {
                         setProdes(prodes.map(p => p.id === activeProde.id ? { ...p, name: e.target.value } : p));
                      }}
                      className="w-full px-4 py-2 border-b-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 bg-transparent outline-none text-xl font-bold text-slate-800 transition-colors"
                      placeholder="Nombre del Prode"
                    />
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
