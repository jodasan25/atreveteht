import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, X, Wind, Zap, Moon, Heart } from "lucide-react";

interface Exercise {
  id: string;
  title: string;
  duration: string; // "3 min"
  category: "ansiedad" | "bloqueo" | "dormir";
  imageUrl: string;
}

const exercises: Exercise[] = [
  {
    id: "ex-1",
    title: "Respiración Cuadrada (3 min)",
    duration: "3 min",
    category: "ansiedad",
    imageUrl: "https://loremflickr.com/600/400/meditation?lock=21"
  },
  {
    id: "ex-2",
    title: "Suspiro Fisiológico (2 min)",
    duration: "2 min",
    category: "ansiedad",
    imageUrl: "https://loremflickr.com/600/400/relax?lock=22"
  },
  {
    id: "ex-3",
    title: "Sacudida Somática (5 min)",
    duration: "5 min",
    category: "bloqueo",
    imageUrl: "https://loremflickr.com/600/400/energy?lock=23"
  },
  {
    id: "ex-4",
    title: "Enraizamiento 5-4-3-2-1 (4 min)",
    duration: "4 min",
    category: "bloqueo",
    imageUrl: "https://loremflickr.com/600/400/nature?lock=24"
  },
  {
    id: "ex-5",
    title: "Escaneo Corporal Profundo (10 min)",
    duration: "10 min",
    category: "dormir",
    imageUrl: "https://loremflickr.com/600/400/sleep?lock=25"
  },
  {
    id: "ex-6",
    title: "Meditación Guiada para el Descanso (15 min)",
    duration: "15 min",
    category: "dormir",
    imageUrl: "https://loremflickr.com/600/400/calm?lock=26"
  }
];

export default function EmotionalGym() {
  const [filter, setFilter] = useState<"todos" | "ansiedad" | "bloqueo" | "dormir">("todos");
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  
  const filteredExercises = filter === "todos" 
    ? exercises 
    : exercises.filter(ex => ex.category === filter);

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Filters */}
      <div className="bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2D2D2D] flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#8EA393]" />
            Mi Gimnasio Emocional: Prácticas de Regulación
          </h2>
          <p className="text-sm text-slate-500 mt-1">Herramientas somáticas para equilibrar tu sistema nervioso en minutos.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("todos")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${filter === "todos" ? "bg-[#8EA393] text-white" : "bg-white/50 text-slate-600 border border-[#8EA393]/20 hover:bg-[#8EA393]/10"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("ansiedad")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${filter === "ansiedad" ? "bg-[#8EA393] text-white" : "bg-white/50 text-slate-600 border border-[#8EA393]/20 hover:bg-[#8EA393]/10"}`}
          >
            <Wind className="w-4 h-4" /> Calmar Ansiedad
          </button>
          <button
            onClick={() => setFilter("bloqueo")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${filter === "bloqueo" ? "bg-[#8EA393] text-white" : "bg-white/50 text-slate-600 border border-[#8EA393]/20 hover:bg-[#8EA393]/10"}`}
          >
            <Zap className="w-4 h-4" /> Salir del Bloqueo
          </button>
          <button
            onClick={() => setFilter("dormir")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 ${filter === "dormir" ? "bg-[#8EA393] text-white" : "bg-white/50 text-slate-600 border border-[#8EA393]/20 hover:bg-[#8EA393]/10"}`}
          >
            <Moon className="w-4 h-4" /> Para Dormir
          </button>
        </div>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((ex, idx) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="group relative bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-64"
          >
            <div className="absolute inset-0 z-0">
               <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-end">
              <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{ex.duration}</span>
              <h3 className="font-bold text-white text-lg leading-tight mb-4">{ex.title}</h3>
              
              <button 
                onClick={() => setActiveExercise(ex)}
                className="w-12 h-12 bg-[#8EA393] hover:bg-[#7A8F7F] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <Play className="w-5 h-5 ml-1" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeExercise && (
          <MediaPlayerModal exercise={activeExercise} onClose={() => setActiveExercise(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MediaPlayerModal({ exercise, onClose }: { exercise: Exercise, onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return p + 0.5; // slow progress simulation
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#8EA393]/40 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center"
      >
        {/* Soft waves background animation */}
        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000 ${isPlaying ? 'opacity-40' : 'opacity-10'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#8EA393] rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400 rounded-full blur-2xl animate-ping" style={{ animationDuration: '4s' }} />
        </div>

        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-slate-200/50 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 w-full flex flex-col items-center mt-4">
          <div className="w-32 h-32 rounded-3xl overflow-hidden mb-6 shadow-lg border-4 border-white/50">
            <img src={exercise.imageUrl} alt={exercise.title} className="w-full h-full object-cover" />
          </div>
          
          <span className="text-xs font-bold text-[#8EA393] uppercase tracking-wider mb-2">{exercise.category}</span>
          <h3 className="text-xl font-bold text-[#2D2D2D] mb-8 leading-tight">{exercise.title}</h3>
          
          {/* Progress Bar */}
          <div className="w-full mb-8">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8EA393] transition-all duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-mono font-medium text-slate-400">
              <span>0:00</span>
              <span>{exercise.duration}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={togglePlay}
              className="w-16 h-16 bg-[#8EA393] hover:bg-[#7A8F7F] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
