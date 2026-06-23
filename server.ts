import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.post("/api/parse-odds", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }
      
      const { matches } = req.body;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: req.file.buffer.toString("base64"),
                  mimeType: req.file.mimetype,
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
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
