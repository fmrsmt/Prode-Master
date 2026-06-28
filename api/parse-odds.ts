import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Need to define config for Vercel Serverless Function to allow larger payload
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!req.body || !req.body.image) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }
    
    const { matches, image, mimeType } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: image,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text: `Extrae las cotizaciones Gana-Empata-Gana (1X2) de esta casa de apuestas.
El usuario me pasó esta lista de partidos válidos (en formato string JSON):
${matches}

Devuelve los datos estrictamente como un JSON de la forma:
{
  "houseName": "Ej: Betsson",
  "matches": [
    { "matchId": "ID_DEL_PARTIDO_QUE_HACE_MATCH_EN_LA_LISTA", "odds1": 2.10, "oddsX": 3.20, "odds2": 3.50 }
  ]
}
No devuelvas texto adicional ni formato markdown. Solo el JSON. Usa tu mejor estimación para hacer el match de los nombres de la imagen con el matchId de la lista provista.`
            }
          ],
        },
      ],
      config: {
         responseMimeType: "application/json"
      }
    });

    let textContent = response.text || "{}";
    const parsed = JSON.parse(textContent);

    res.json(parsed);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
