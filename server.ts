import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily to avoid crashing if GEMINI_API_KEY is not defined immediately
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Gemini features will run in mock mode.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// System Nervous Evaluation Endpoint via Gemini API
app.post("/api/evaluate-nervous-system", async (req, res) => {
  try {
    const { sleep, nutrition, anxiety, symptoms, emotionalState, biodescodificacion } = req.body;

    if (!sleep || !nutrition || anxiety === undefined) {
      return res.status(400).json({ error: "Missing required evaluation parameters." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a simulated high-quality mock response in Spanish if no API key is provided, so it doesn't crash
      const isSympathetic = anxiety > 5 || (symptoms && symptoms.length > 2);
      const mockState = isSympathetic ? "simpatico" : "parasimpatico";
      const mockScore = isSympathetic ? Math.max(30, 90 - anxiety * 8) : Math.min(95, 75 + (10 - anxiety) * 2);
      
      const mockResponse = {
        state: mockState,
        score: mockScore,
        diagnosis: isSympathetic 
          ? `Tu sistema nervioso muestra una clara dominancia del estado Simpático (lucha o huida). Con respecto a tu estado emocional (${emotionalState || "tensión/estrés"}) y la Biodescodificación de tus bloqueos (${biodescodificacion || "sobrecarga muscular/articular"}), observamos una clara somatización de conflictos biológicos de supervivencia o territorio. Te sugerimos firmemente consultar con un profesional médico integrativo o un terapeuta holístico para descodificar en profundidad estos bloqueos, liberar la energía contenida en tus tejidos y estructurar un plan de regulación somática personalizado.`
          : `Tu sistema nervioso se encuentra predominantemente en estado Parasimpático (descanso y digestión). El análisis de tu estado emocional (${emotionalState || "calma y equilibrio"}) y los principios de Biodescodificación (${biodescodificacion || "armonía"}) indican una liberación exitosa de tus tensiones y conflictos. Para sostener y expandir esta resiliencia, te recomendamos el acompañamiento continuo de médicos integrativos o terapeutas holísticos especializados en reprogramación somática integral.`,
        recommendations: isSympathetic
          ? [
              "Agenda una consulta con un médico integrativo o un terapeuta holístico en Biodescodificación para identificar el conflicto biológico raíz.",
              "Respira en caja (Inhala 4s, mantén 4s, exhala 4s, mantén 4s) por 3 minutos.",
              "Haz un ejercicio de enraizamiento somático (5 cosas que ves, 4 que tocas, 3 que oyes, 2 que hueles, 1 que pruebas).",
              "Reduce el consumo de cafeína, estimulantes y pantallas durante las próximas 4 horas."
            ]
          : [
              "Consolida tus avances con una sesión de mantenimiento junto a tu terapeuta holístico o médico integrativo.",
              "Continúa con tus prácticas diarias de introspección.",
              "Realiza estiramientos suaves o yoga restaurativo para mantener la flexibilidad.",
              "Te sugerimos la Masterclass 'Profundizando en la Coherencia Cardíaca' de nuestra plataforma."
            ]
      };
      return res.json(mockResponse);
    }

    const client = getAiClient();
    
    const prompt = `Actúa como un médico integrativo senior, especialista en Biodescodificación y experto en regulación del sistema nervioso.
Analiza el siguiente perfil del usuario obtenido del Monitoreo Somático:
- Calidad de sueño: ${sleep}
- Alimentación/Nutrición: ${nutrition}
- Nivel de Ansiedad reportado (1 al 10): ${anxiety}
- Síntomas y bloqueos corporales: ${symptoms ? symptoms.join(", ") : "ninguno"}
- Estado Emocional reportado: ${emotionalState || "No especificado"}
- Conflicto/Bloqueo según la Biodescodificación: ${biodescodificacion || "No especificado"}

INSTRUCCIONES CRÍTICAS:
1. Determina el estado del sistema nervioso del usuario (simpático, parasimpatico o mixto) y calcula un puntaje de bienestar general (0 a 100).
2. Redacta un diagnóstico empático, cercano y sumamente profesional (en español). En el diagnóstico, debes incorporar de manera explícita el análisis de su estado emocional y el conflicto biológico según la Biodescodificación.
3. El diagnóstico DEBE sugerir y referir de manera explícita al usuario a consultar con médicos (profesionales médicos integrativos) o a terapeutas holísticos expertos para un acompañamiento profundo y personalizado.
4. Genera una lista de 4 recomendaciones prácticas, donde al menos una de ellas recomiende un enfoque terapéutico guiado por terapeutas holísticos o médicos especializados.

Devuelve la respuesta estrictamente en formato JSON con las siguientes claves:
{
  "state": "simpatico" o "parasimpatico" o "mixto",
  "score": número del 0 al 100,
  "diagnosis": "Diagnóstico empático y terapéutico detallado explicando su estado actual corporal, mental, análisis emocional, biodescodificación y referencias explícitas a médicos o terapeutas holísticos",
  "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3", "Recomendación 4"]
}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini model.");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Error evaluating nervous system state:", error);
    res.status(500).json({ error: "No se pudo realizar el análisis del sistema nervioso. Intente nuevamente.", details: error.message });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
