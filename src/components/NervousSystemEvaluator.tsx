import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Moon, Coffee, ShieldAlert, Sparkles, Activity, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { AssessmentModel } from "../types";
import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface NervousSystemEvaluatorProps {
  userId: string;
  onNewAssessment: (assessment: AssessmentModel) => void;
  onFilterEvents: (tag: string) => void;
}

const SYMPTOM_OPTIONS = [
  { id: "palpitations", label: "Palpitaciones o pecho apretado", category: "simpatico" },
  { id: "bruxism", label: "Mandíbula tensa / Bruxismo", category: "simpatico" },
  { id: "rumination", label: "Mente acelerada o rumiación", category: "simpatico" },
  { id: "fatigue", label: "Fatiga crónica / Desgano", category: "parasimpatico_bloqueado" },
  { id: "shallow_breathing", label: "Dificultad para respirar profundo", category: "simpatico" },
  { id: "hypersensitivity", label: "Hipersensibilidad al ruido o luz", category: "simpatico" },
  { id: "digestive", label: "Malestar o pesadez digestiva", category: "mixto" },
  { id: "cold_limbs", label: "Manos o pies fríos", category: "simpatico" },
];

const EMOTIONAL_OPTIONS = [
  { value: "Estrés / Frustración", desc: "Siento frustración, rabia contenida, urgencia o estrés agudo constante.", color: "text-red-500 bg-red-50 border-red-100" },
  { value: "Apatía / Tristeza", desc: "Siento desgano, cansancio emocional profundo, tristeza o sensación de colapso.", color: "text-amber-500 bg-amber-50 border-amber-100" },
  { value: "Ansiedad / Preocupación", desc: "Rumiación mental, miedo al futuro, inquietud o dudas constantes.", color: "text-rose-500 bg-rose-50 border-rose-100" },
  { value: "Equilibrio / Paz", desc: "Me siento tranquilo, con ecuanimidad, gratitud y balance emocional.", color: "text-emerald-500 bg-emerald-50 border-emerald-100" }
];

const BIODESCODIFICACION_OPTIONS = [
  { value: "Conflicto de Desvalorización", desc: "Tensión muscular, dolor en articulaciones, o sensación de 'no ser suficiente'.", color: "text-blue-500 bg-blue-50 border-blue-100" },
  { value: "Conflicto de Supervivencia / Territorio", desc: "Problemas digestivos, acidez o inflamación intestinal (miedo a digerir situaciones).", color: "text-amber-500 bg-amber-50 border-amber-100" },
  { value: "Conflicto de Sobrecarga", desc: "Sensación de cargar todo el peso o responsabilidades del mundo en la espalda.", color: "text-purple-500 bg-purple-50 border-purple-100" },
  { value: "Conflicto de Separación / Desprotección", desc: "Hipersensibilidad en la piel, alertas excesivas ante ruidos o luz, miedo al abandono.", color: "text-red-500 bg-red-50 border-red-100" },
  { value: "Sin Conflictos Activos", desc: "Siento que mis emociones y mi cuerpo están en perfecta sintonía y libres de bloqueos.", color: "text-emerald-500 bg-emerald-50 border-emerald-100" }
];

export default function NervousSystemEvaluator({ userId, onNewAssessment, onFilterEvents }: NervousSystemEvaluatorProps) {
  const [step, setStep] = useState<number>(1);
  const [sleep, setSleep] = useState<string>("");
  const [nutrition, setNutrition] = useState<string>("");
  const [anxiety, setAnxiety] = useState<number>(5);
  const [emotionalState, setEmotionalState] = useState<string>("");
  const [biodescodificacion, setBiodescodificacion] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentModel | null>(null);

  // Breathing simulation state for the loader
  const [breathPhase, setBreathPhase] = useState<"Inhala" | "Retén" | "Exhala" | "Vacío">("Inhala");

  const handleSymptomToggle = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const startBreathingCycle = () => {
    let count = 0;
    const phases: ("Inhala" | "Retén" | "Exhala" | "Vacío")[] = ["Inhala", "Retén", "Exhala", "Vacío"];
    const interval = setInterval(() => {
      count = (count + 1) % 4;
      setBreathPhase(phases[count]);
    }, 4000);
    return interval;
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    const breathInterval = startBreathingCycle();

    try {
      const response = await fetch("/api/evaluate-nervous-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sleep,
          nutrition,
          anxiety,
          symptoms: selectedSymptoms,
          emotionalState,
          biodescodificacion,
        }),
      });

      if (!response.ok) {
        throw new Error("La solicitud al servidor falló.");
      }

      const data = await response.json();
      
      const newAssessment: AssessmentModel = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        date: new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        sleep,
        nutrition,
        anxiety,
        symptoms: selectedSymptoms,
        emotionalState,
        biodescodificacion,
        state: data.state || "simpatico",
        score: data.score || 50,
        diagnosis: data.diagnosis || "No se pudo obtener un diagnóstico detallado.",
        recommendations: data.recommendations || [
          "Realiza respiraciones profundas diafragmáticas.",
          "Camina descalzo sobre el césped o haz estiramientos somáticos.",
        ],
      };

      // Save to Firestore securely if possible (fail-safe for local preview if unauthenticated or offline)
      try {
        if (userId === "guest_offline_user") {
          const localAssessments = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
          localAssessments.unshift(newAssessment);
          localStorage.setItem("offline_assessments", JSON.stringify(localAssessments));
        } else {
          await addDoc(collection(db, "assessments"), {
            ...newAssessment,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, "assessments");
        console.warn("Could not save to Firestore collection, holding in local storage:", dbErr);
        const localAssessments = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
        localAssessments.unshift(newAssessment);
        localStorage.setItem("offline_assessments", JSON.stringify(localAssessments));
      }

      setResult(newAssessment);
      onNewAssessment(newAssessment);
      setStep(7); // Show results screen (step 7)
    } catch (err: any) {
      console.error(err);
      setError("Ocurrió un error al procesar el diagnóstico. Por favor intenta de nuevo.");
    } finally {
      clearInterval(breathInterval);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSleep("");
    setNutrition("");
    setAnxiety(5);
    setEmotionalState("");
    setBiodescodificacion("");
    setSelectedSymptoms([]);
    setResult(null);
    setError(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      id="nervous-system-evaluator-container" 
      className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Evaluador del Sistema Nervioso</h2>
          <p className="text-sm text-slate-500">Mapeo clínico-somático interactivo en tiempo real</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={{
                scale: breathPhase === "Inhala" ? 1.4 : breathPhase === "Exhala" ? 0.9 : breathPhase === "Retén" ? 1.4 : 0.9,
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-teal-100 flex items-center justify-center border-4 border-teal-500/30 mb-8"
            >
              <span className="text-teal-700 font-medium text-lg font-mono">{breathPhase}</span>
            </motion.div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Conectando con la IA de Atrévete...</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Sincroniza tu respiración mientras analizamos tus biomarcadores corporales y mapeamos tus bloqueos somáticos.
            </p>
          </motion.div>
        )}

        {!loading && step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 1 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">¿Cómo describirías tu sueño en las últimas noches?</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "Muy deficiente / Insomnio", desc: "Me cuesta conciliar el sueño o me despierto cansado y alerta.", icon: Moon, color: "text-red-500 bg-red-50 border-red-100" },
                { value: "Regular / Interrumpido", desc: "Duermo pero tengo interrupciones y me despierto con pesadez.", icon: Brain, color: "text-amber-500 bg-amber-50 border-amber-100" },
                { value: "Bueno / Reparador", desc: "Duermo profundo, descanso y me despierto con energía natural.", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 border-emerald-100" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    id={`sleep-btn-${item.value.replace(/\s+/g, "-")}`}
                    onClick={() => {
                      setSleep(item.value);
                      setStep(2);
                    }}
                    className={`flex items-start text-left gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      sleep === item.value 
                        ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500" 
                        : "border-slate-100 hover:border-teal-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm md:text-base">{item.value}</h4>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {!loading && step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 2 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">¿Cómo catalogas tu patrón nutricional actual?</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "Falta de apetito / Desbalanceado", desc: "Saltos de comida, digestión tensa, inflamación frecuente.", icon: Coffee, color: "text-red-500 bg-red-50 border-red-100" },
                { value: "Moderadamente saludable / Con antojos", desc: "Como bien pero sufro de antojos dulces o consumo exceso de estimulantes.", icon: Brain, color: "text-amber-500 bg-amber-50 border-amber-100" },
                { value: "Equilibrado / Consciente", desc: "Alimentación basada en alimentos reales, con buena digestión y energía estable.", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 border-emerald-100" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    id={`nutrition-btn-${item.value.replace(/\s+/g, "-")}`}
                    onClick={() => {
                      setNutrition(item.value);
                      setStep(3);
                    }}
                    className={`flex items-start text-left gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      nutrition === item.value 
                        ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500" 
                        : "border-slate-100 hover:border-teal-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm md:text-base">{item.value}</h4>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                id="back-step-2"
                onClick={() => setStep(1)}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Atrás
              </button>
            </div>
          </motion.div>
        )}

        {!loading && step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 3 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">¿Cuál es tu nivel promedio de ansiedad / estrés diario?</h3>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center space-y-4">
              <span className="text-5xl font-extrabold text-teal-600 font-sans tracking-tight">
                {anxiety}
              </span>
              <p className="text-sm font-medium text-slate-600">
                {anxiety <= 3 ? "Estado de calma óptimo / Relajación" : anxiety <= 7 ? "Estrés moderado / Alerta activa" : "Estrés severo / Sobrecarga emocional"}
              </p>
              
              <input
                id="anxiety-range-input"
                type="range"
                min="1"
                max="10"
                value={anxiety}
                onChange={(e) => setAnxiety(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>1 (Paz Absoluta)</span>
                <span>5</span>
                <span>10 (Sobrecarga)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                id="back-step-3"
                onClick={() => setStep(2)}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Atrás
              </button>
              <button
                id="next-step-3"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-teal-600/15"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {!loading && step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 4 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">¿Cómo describirías tu estado emocional predominante?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Identifica la emoción que más resuena en tu día a día.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {EMOTIONAL_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  id={`emotional-btn-${item.value.replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setEmotionalState(item.value);
                    setStep(5);
                  }}
                  className={`flex items-start text-left gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    emotionalState === item.value 
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500" 
                      : "border-slate-100 hover:border-teal-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm md:text-base">{item.value}</h4>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                id="back-step-4"
                onClick={() => setStep(3)}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Atrás
              </button>
              {emotionalState && (
                <button
                  id="next-step-4"
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-teal-600/15"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {!loading && step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 5 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">¿Con qué bloqueo o conflicto de la Biodescodificación te identificas?</h3>
              <p className="text-xs text-slate-500 mt-0.5">La biodescodificación estudia el origen metafísico y biológico de los síntomas físicos.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {BIODESCODIFICACION_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  id={`biodesc-btn-${item.value.replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setBiodescodificacion(item.value);
                    setStep(6);
                  }}
                  className={`flex items-start text-left gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    biodescodificacion === item.value 
                      ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500" 
                      : "border-slate-100 hover:border-teal-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm md:text-base">{item.value}</h4>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                id="back-step-5"
                onClick={() => setStep(4)}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Atrás
              </button>
              {biodescodificacion && (
                <button
                  id="next-step-5"
                  onClick={() => setStep(6)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-teal-600/15"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {!loading && step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-medium text-teal-600 uppercase tracking-widest">Paso 6 de 6</span>
              <h3 className="text-lg font-semibold text-slate-800 mt-1">Selecciona los síntomas o bloqueos corporales recurrentes:</h3>
              <p className="text-xs text-slate-500 mt-0.5">Elige todos los que apliquen para afinar tu diagnóstico somático.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <button
                  key={symptom.id}
                  id={`symptom-btn-${symptom.id}`}
                  onClick={() => handleSymptomToggle(symptom.label)}
                  className={`flex items-center justify-between text-left p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    selectedSymptoms.includes(symptom.label)
                      ? "border-teal-500 bg-teal-50/40 text-teal-800 font-semibold shadow-sm"
                      : "border-slate-100 hover:bg-slate-50/60 text-slate-700"
                  }`}
                >
                  <span>{symptom.label}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    selectedSymptoms.includes(symptom.label)
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300"
                  }`}>
                    {selectedSymptoms.includes(symptom.label) && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                id="back-step-6"
                onClick={() => setStep(5)}
                className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Atrás
              </button>
              <button
                id="submit-evaluation-btn"
                onClick={handleEvaluate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Generar Diagnóstico IA
              </button>
            </div>
          </motion.div>
        )}

        {!loading && step === 7 && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <div className="md:col-span-1 flex flex-col items-center text-center py-4 border-b md:border-b-0 md:border-r border-slate-200/60">
                <div className="relative flex items-center justify-center mb-3">
                  {/* Gauge Arc representation */}
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke={result.state === "simpatico" ? "#f43f5e" : result.state === "parasimpatico" ? "#10b981" : "#f59e0b"}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="301.6"
                      strokeDashoffset={301.6 - (301.6 * result.score) / 100}
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold font-sans text-slate-800">
                    {result.score}%
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Puntaje de Bienestar
                </span>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    result.state === "simpatico"
                      ? "bg-rose-50 text-rose-700 border border-rose-100/50"
                      : result.state === "parasimpatico"
                      ? "bg-teal-50 text-teal-700 border border-teal-100/50"
                      : "bg-amber-50 text-amber-700 border border-amber-100/50"
                  }`}>
                    Dominancia {result.state.charAt(0).toUpperCase() + result.state.slice(1)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                    {result.date}
                  </span>
                </div>
                
                <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100/30">
                  <p className="text-sm leading-relaxed text-teal-700 font-medium italic">
                    "{result.diagnosis}"
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recomendación de Gemini</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" /> "Respiros" y Recomendaciones de Autocuidado Somático:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-teal-50/20 hover:bg-teal-50/40 rounded-2xl border border-teal-50/50 flex gap-3 transition-colors">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 font-medium">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl border border-teal-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h5 className="font-bold text-slate-800 text-sm md:text-base">¿Deseas profundizar en tu regulación corporal?</h5>
                <p className="text-xs text-slate-500">Tenemos talleres clínicos-somáticos específicos para tu estado actual.</p>
              </div>
              <button
                id="filter-workshops-btn"
                onClick={() => {
                  const tag = result.state === "simpatico" ? "Soma & Calma" : "Coherencia";
                  onFilterEvents(tag);
                }}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-teal-700 hover:text-teal-900 bg-white px-4 py-2.5 rounded-xl border border-teal-100 shadow-sm transition-all"
              >
                Explorar Talleres Recomendados <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="re-evaluate-btn"
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Realizar Nuevo Test
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
