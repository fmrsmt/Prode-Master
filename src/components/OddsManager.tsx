import React, { useState, useRef, useMemo } from 'react';
import { Target, TrendingUp, DollarSign, Upload, Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { Match, HouseOdds, ActualScores } from '../types';
import OddsModal from './OddsModal';
import { calculateTopPredictions } from '../utils';

type Props = {
  matches: Match[];
  oddsData: Record<string, HouseOdds[]>;
  onUpdateOdds: (matchId: string, houses: HouseOdds[]) => void;
  onBulkUpdateOdds?: (data: Record<string, HouseOdds[]>) => void;
  actualScores: ActualScores;
};

export default function OddsManager({ matches, oddsData, onUpdateOdds, onBulkUpdateOdds, actualScores }: Props) {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [successStr, setSuccessStr] = useState<string | null>(null);
  const [houseNameInput, setHouseNameInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1200;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setErrorStr(null);
    setSuccessStr(null);

    try {
      const compressedBlob = await compressImage(file);
      
      const formData = new FormData();
      formData.append('image', compressedBlob, 'image.jpg');
      
      const payloadMatches = matches.map(m => ({ id: m.id, teamA: m.teamA, teamB: m.teamB }));
      formData.append('matches', JSON.stringify(payloadMatches));

      const response = await fetch('/api/parse-odds', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Error al parsear odds';
        try {
          const d = JSON.parse(text);
          errorMsg = d.error || errorMsg;
        } catch (e) {
          errorMsg = `Error del servidor (${response.status}): ${text.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      const textResult = await response.text();
      let result;
      try {
        result = JSON.parse(textResult);
      } catch (e) {
        throw new Error(`Respuesta inválida del servidor: ${textResult.substring(0, 100)}`);
      }
      
      const houseName = houseNameInput.trim() || result.houseName || 'Casa Genérica';
      const parsedMatches = result.matches || [];

      const newOddsData: Record<string, HouseOdds[]> = {};
      let countLoaded = 0;

      parsedMatches.forEach((pm: any) => {
        if (pm.matchId && pm.odds1 && pm.oddsX && pm.odds2) {
          const matchId = pm.matchId;
          const exactScoresMap = pm.scores || {};
          
          const newHouseObj: HouseOdds = {
            id: Date.now().toString() + Math.random().toString(),
            houseName,
            odds1: pm.odds1,
            oddsX: pm.oddsX,
            odds2: pm.odds2,
            scores: exactScoresMap
          };

          const existingHouses = oddsData[matchId] || [];
          newOddsData[matchId] = [...existingHouses, newHouseObj];
          countLoaded++;
        }
      });

      if (onBulkUpdateOdds) {
        onBulkUpdateOdds(newOddsData);
        setSuccessStr(`Se cargaron cuotas para ${countLoaded} partido(s) de la casa: ${houseName}.`);
        setHouseNameInput('');
      }

    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || 'Error al procesar la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            await processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [matches, oddsData, onBulkUpdateOdds, houseNameInput]);

  const [isDragOver, setIsDragOver] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    }
  };

  // Calculate Global EV Rankings
  const globalEVRankings = useMemo(() => {
    interface GlobalEVResult {
      match: Match;
      scoreA: number;
      scoreB: number;
      expectedPoints: string;
      exactProb: string;
    }

    const allEVList: GlobalEVResult[] = [];
    matches.forEach(m => {
      const hasResult = actualScores[m.id] && actualScores[m.id].a !== null && actualScores[m.id].b !== null;
      if (hasResult) return;

      const houses = oddsData[m.id] || [];
      if (houses.length > 0) {
        // limit = 0 to get all calculated predictions for the match, or just 10, doesn't matter too much, we just need top results
        // Let's get top 5 per match and then sort globally
        const top = calculateTopPredictions(houses, undefined, 5);
        top.forEach(t => {
          allEVList.push({
            match: m,
            scoreA: t.scoreA,
            scoreB: t.scoreB,
            expectedPoints: t.expectedPoints,
            exactProb: t.probs.exact
          });
        });
      }
    });

    allEVList.sort((a, b) => parseFloat(b.expectedPoints) - parseFloat(a.expectedPoints));
    return allEVList.slice(0, 20); // Top 20 best global results
  }, [matches, oddsData, actualScores]);

  return (
    <div 
      className={`flex flex-col gap-6 relative transition-colors ${isDragOver ? 'bg-emerald-50 rounded-2xl ring-4 ring-emerald-400 ring-inset opacity-80' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-blue-600" /> Comparativa de Cotizaciones
            </h3>
            <p className="text-sm text-slate-500">
              Carga una captura de pantalla (1X2) con IA o edita manualmente. Puedes pegar (Ctrl+V) o arrastrar imágenes aquí.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 flex-wrap">
             <input 
                type="text" 
                placeholder="Nombre casa (opcional)" 
                value={houseNameInput}
                onChange={(e) => setHouseNameInput(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-blue-500 outline-none w-48"
             />
             <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             <button 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all text-sm disabled:opacity-50"
             >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? 'Procesando...' : 'Escanear Imagen'}
             </button>
          </div>
        </div>

        {errorStr && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorStr}
          </div>
        )}

        {successStr && (
          <div className="m-6 mb-0 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-2">
            <Target className="w-4 h-4 shrink-0" /> {successStr}
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...matches].sort((a, b) => {
            const aHasResult = actualScores[a.id] && actualScores[a.id].a !== null && actualScores[a.id].b !== null;
            const bHasResult = actualScores[b.id] && actualScores[b.id].a !== null && actualScores[b.id].b !== null;
            if (aHasResult && !bHasResult) return 1;
            if (!aHasResult && bHasResult) return -1;
            return 0;
          }).map(match => {
            const housesLoaded = oddsData[match.id] || [];
            const hasResult = actualScores[match.id] && actualScores[match.id].a !== null && actualScores[match.id].b !== null;
            return (
              <div 
                key={match.id} 
                onClick={() => setEditingMatch(match)}
                className={`border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors p-4 rounded-xl cursor-pointer flex flex-col gap-3 group ${hasResult ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{match.stage}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{housesLoaded.length} Casas</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="truncate">{match.teamA}</span>
                  {hasResult ? (
                    <span className="text-emerald-600 font-black mx-2 text-sm">{actualScores[match.id].a} - {actualScores[match.id].b}</span>
                  ) : (
                    <span className="text-slate-400 mx-2 text-xs">vs</span>
                  )}
                  <span className="truncate">{match.teamB}</span>
                </div>
                {housesLoaded.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600 font-semibold bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-100/50 flex justify-between">
                    <span>Cotizaciones cargadas</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {globalEVRankings.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-2">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-emerald-500" /> Ranking Global de EV
            </h3>
            <p className="text-sm text-slate-500">
              Los mejores resultados para pronosticar considerando todos los partidos con cuotas cargadas, ordenados por maximización de puntaje en el prode.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest min-w-[200px]">Partido</th>
                  <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Resultado</th>
                  <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Prob. Exacto</th>
                  <th className="py-4 px-6 font-bold text-emerald-600 text-xs uppercase tracking-widest text-right">EV (Esperanza)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {globalEVRankings.map((rev, idx) => (
                  <tr key={`${rev.match.id}-${rev.scoreA}-${rev.scoreB}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 text-sm font-bold text-slate-700">
                      {rev.match.teamA.substring(0, 3).toUpperCase()} <span className="text-slate-400 font-medium">vs</span> {rev.match.teamB.substring(0, 3).toUpperCase()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="inline-flex items-center justify-center bg-slate-100 border border-slate-200 px-3 py-1 rounded-md min-w-[70px]">
                        <span className="font-mono font-bold text-slate-800">{rev.scoreA} - {rev.scoreB}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className="font-mono text-slate-500 font-medium">{rev.exactProb}%</span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className="text-lg font-black font-mono text-emerald-600">+{rev.expectedPoints} pt</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingMatch && (
        <OddsModal 
          match={editingMatch}
          initialOdds={oddsData[editingMatch.id] || []}
          onSave={(houses) => {
            onUpdateOdds(editingMatch.id, houses);
            setEditingMatch(null);
          }}
          onClose={() => setEditingMatch(null)}
        />
      )}
    </div>
  );
}
