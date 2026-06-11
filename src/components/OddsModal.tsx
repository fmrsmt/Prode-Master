import React, { useState } from "react";
import { X, Plus, Calculator, Trash2, Save } from "lucide-react";
import { Match, HouseOdds } from "../types";
import { map1X2ToExactOdds, COMMON_SCORES } from "../utils";

type Props = {
  match: Match;
  initialOdds: HouseOdds[];
  onClose: () => void;
  onSave: (odds: HouseOdds[]) => void;
};

export default function OddsModal({
  match,
  initialOdds,
  onClose,
  onSave,
}: Props) {
  const [oddsList, setOddsList] = useState<HouseOdds[]>(
    initialOdds.length > 0
      ? initialOdds
      : [
          {
            id: Date.now().toString(),
            houseName: "Casa 1",
            scores: {},
          },
        ],
  );

  function updateHouseValue(
    id: string,
    key: "houseName" | "odds1" | "oddsX" | "odds2",
    value: string,
  ) {
    setOddsList(
      oddsList.map((h) => {
        if (h.id !== id) return h;
        if (key === "houseName") return { ...h, houseName: value };

        return { ...h, [key]: value };
      }),
    );
  }

  function updateScore(houseId: string, scoreKey: string, newValue: string) {
    setOddsList(
      oddsList.map((h) => {
        if (h.id !== houseId) return h;
        const mappedScores = { ...h.scores };
        if (newValue === "") {
          delete mappedScores[scoreKey];
        } else {
          mappedScores[scoreKey] = newValue;
        }
        return { ...h, scores: mappedScores };
      }),
    );
  }

  function addHouse() {
    setOddsList([
      ...oddsList,
      {
        id: Date.now().toString(),
        houseName: `Casa ${oddsList.length + 1}`,
        scores: {},
      },
    ]);
  }

  function removeHouse(id: string) {
    setOddsList(oddsList.filter((h) => h.id !== id));
  }

  function handleSave() {
    // Save the odds without automatically hallucinating exact scores.
    // Manual exact scores are saved properly.
    const finalOdds = oddsList
      .map((h) => {
        const o1 = typeof h.odds1 === 'string' ? parseFloat(h.odds1.replace(',', '.')) : (h.odds1 as number | undefined);
        const oX = typeof h.oddsX === 'string' ? parseFloat(h.oddsX.replace(',', '.')) : (h.oddsX as number | undefined);
        const o2 = typeof h.odds2 === 'string' ? parseFloat(h.odds2.replace(',', '.')) : (h.odds2 as number | undefined);

        const exactScores: Record<string, number> = {};
        for (const [k, v] of Object.entries(h.scores)) {
          const parsedV = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : (v as number);
          if (parsedV && !Number.isNaN(parsedV) && parsedV > 1) {
            exactScores[k] = parsedV;
          }
        }

        return {
          ...h,
          odds1: (o1 === undefined || Number.isNaN(o1)) ? undefined : o1,
          oddsX: (oX === undefined || Number.isNaN(oX)) ? undefined : oX,
          odds2: (o2 === undefined || Number.isNaN(o2)) ? undefined : o2,
          scores: exactScores,
        };
      })
      .filter((h) => Object.keys(h.scores).length > 0 || h.odds1 || h.oddsX || h.odds2); // Keep if they have 1X2 OR exact scores.
    onSave(finalOdds as HouseOdds[]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Calculator className="w-5 h-5 text-blue-600" />
              Ingreso de Cuotas (1X2 y Marcadores Exactos)
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {match.teamA} vs {match.teamB}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="mb-6 bg-white border border-slate-200 p-4 rounded-xl shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Cotizaciones 1X2
              </h3>
              <button
                onClick={addHouse}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Casa Nueva
              </button>
            </div>

            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3 px-3">Casa de Apuestas</th>
                  <th className="py-3 px-3 text-center">1 (Local)</th>
                  <th className="py-3 px-3 text-center">X (Empate)</th>
                  <th className="py-3 px-3 text-center">2 (Visitante)</th>
                  <th className="py-3 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {oddsList.map((house) => (
                  <tr key={house.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <input
                        value={house.houseName}
                        onChange={(e) =>
                          updateHouseValue(
                            house.id,
                            "houseName",
                            e.target.value,
                          )
                        }
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 w-full text-slate-800 font-semibold"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={house.odds1 || ""}
                        onChange={(e) =>
                          updateHouseValue(house.id, "odds1", e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 w-full text-slate-800 text-center font-mono placeholder:text-slate-300"
                        placeholder="Ej. 2.10"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={house.oddsX || ""}
                        onChange={(e) =>
                          updateHouseValue(house.id, "oddsX", e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 w-full text-slate-800 text-center font-mono placeholder:text-slate-300"
                        placeholder="Ej. 3.20"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={house.odds2 || ""}
                        onChange={(e) =>
                          updateHouseValue(house.id, "odds2", e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 w-full text-slate-800 text-center font-mono placeholder:text-slate-300"
                        placeholder="Ej. 3.50"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => removeHouse(house.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {oddsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-slate-400 font-medium"
                    >
                      No hay cotizaciones ingresadas. Añade una casa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4">
              Cotizaciones Resultados Exactos (Opcional)
            </h3>
            
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 font-semibold text-slate-500 w-24 border-r border-slate-100 hidden md:table-cell">Sección</th>
                  <th className="py-2 px-3 font-semibold text-slate-500 w-24">Marcador</th>
                  {oddsList.map(house => (
                    <th key={house.id} className="py-2 px-2 min-w-[120px]">
                      <div className="font-semibold text-slate-800 line-clamp-1">{house.houseName || 'Casa sin nombre'}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMMON_SCORES.map(({a, b}, idx) => {
                  const isHome = a > b;
                  const isDraw = a === b;
                  const label = isHome ? `Gana ${match.teamA.substring(0,3)}` : isDraw ? 'Empate' : `Gana ${match.teamB.substring(0,3)}`;
                  const showLabel = idx === 0 || (isDraw && COMMON_SCORES[idx-1].a > COMMON_SCORES[idx-1].b) || (!isHome && !isDraw && COMMON_SCORES[idx-1].a === COMMON_SCORES[idx-1].b);

                  return (
                    <tr key={`${a}-${b}`} className="hover:bg-slate-50">
                      <td className="py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 hidden md:table-cell">
                        {showLabel ? label : ''}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">
                        {a} - {b}
                      </td>
                      {oddsList.map(house => (
                        <td key={house.id} className="py-1 px-2">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={house.scores[`${a}-${b}`] || ''}
                            onChange={(e) => updateScore(house.id, `${a}-${b}`, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow font-mono text-slate-700 text-sm"
                            placeholder="Ej. 6.50"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <Save className="w-4 h-4" /> Guardar Cotizaciones
          </button>
        </div>
      </div>
    </div>
  );
}
