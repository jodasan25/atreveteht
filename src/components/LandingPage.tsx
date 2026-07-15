import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, UserCircle, Star, Sparkles, HeartPulse, Activity } from "lucide-react";
import heroImage from "../assets/images/wellness_telemedicine_hero_1783776956459.jpg";

interface LandingPageProps {
  onStartTest: () => void;
  onJoinSpecialist: () => void;
}

export default function LandingPage({ onStartTest, onJoinSpecialist }: LandingPageProps) {
  const announcements = [
    "Próximo Campamento Holístico: 'Adultas en Fuga' – Sábado 26 de Septiembre de 2026. ¡Quedan pocos cupos!",
    "Masterclass Exclusiva: Estrategias somáticas para desbloquear el sistema nervioso simpático.",
    "Beneficio Exclusivo: Regístrate hoy y obtén 15 días gratis en la Sala de Prácticas Somáticas."
  ];

  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const prevAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const nextAnnouncement = () => {
    setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center -mt-8 pt-8 space-y-12 pb-16">
      
      {/* Decorative background gradient specific to landing if needed, though App bg is used. 
          We'll add absolute elements for the pastel olive green & cream look */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#8EA393]/20 rounded-full blur-[120px] mix-blend-multiply opacity-70"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#FDFBF7] rounded-full blur-[100px] opacity-80"></div>
      </div>

      {/* Main Hero Container - Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(142,163,147,0.15)] rounded-[2rem] p-8 md:p-16 text-center"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/80 text-[#8EA393] text-sm font-bold uppercase tracking-widest shadow-sm mb-6">
          <Sparkles className="w-4 h-4" /> Salud Integrativa
        </span>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#2D2D2D] tracking-tight mb-6 leading-tight">
          Atrévete a habitar tu cuerpo
        </h1>
        
        <p className="text-lg md:text-2xl text-slate-600 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
          Tu espacio digital de regulación somática y bienestar para calibrar tu sistema nervioso.
        </p>

        {/* Target Audience Glass Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          <div className="bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <HeartPulse className="w-32 h-32 text-[#8EA393]" />
             </div>
             <h3 className="text-xl font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
               <span className="bg-[#8EA393]/20 p-2 rounded-xl text-[#8EA393]"><UserCircle className="w-6 h-6" /></span>
               Para Ti
             </h3>
             <p className="text-slate-600 font-medium relative z-10">
               Si buscas liberar estrés acumulado, regular tu ansiedad y conectar con tu calma.
             </p>
          </div>

          <div className="bg-white/40 backdrop-blur-md border border-white/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Activity className="w-32 h-32 text-[#8EA393]" />
             </div>
             <h3 className="text-xl font-bold text-[#2D2D2D] mb-3 flex items-center gap-2">
               <span className="bg-[#8EA393]/20 p-2 rounded-xl text-[#8EA393]"><Star className="w-6 h-6" /></span>
               Para Especialistas
             </h3>
             <p className="text-slate-600 font-medium relative z-10">
               Expande tu consulta con herramientas de automatización y atención somática.
             </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            onClick={onStartTest}
            className="w-full sm:w-auto px-8 py-4 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(142,163,147,0.39)] hover:shadow-[0_6px_20px_rgba(142,163,147,0.23)] active:scale-95 text-lg"
          >
            [Iniciar Test Somático Gratis]
          </button>
          
          <button 
            onClick={onJoinSpecialist}
            className="w-full sm:w-auto px-8 py-4 bg-white/60 hover:bg-white/80 backdrop-blur-md border-2 border-[#8EA393] text-[#8EA393] font-bold rounded-xl transition-all shadow-sm active:scale-95 text-lg"
          >
            [Unirme como Especialista]
          </button>
        </div>

        {/* Large Format Image */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden border-8 border-white/40 shadow-2xl">
          <img 
            src={heroImage} 
            alt="Bienestar y Naturaleza" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#8EA393]/40 to-transparent mix-blend-overlay"></div>
        </div>
      </motion.div>

      {/* Dynamic Banner Slider */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-4xl mx-auto"
      >
        <div className="bg-[#FDFBF7]/60 backdrop-blur-md border border-[#8EA393]/40 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
          <button 
            onClick={prevAnnouncement}
            className="p-2 bg-white/50 hover:bg-white/80 text-[#8EA393] rounded-full transition-colors backdrop-blur-sm border border-white/60 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="overflow-hidden flex-grow relative h-12 flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentAnnouncement}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-[#2D2D2D] font-semibold text-sm md:text-base absolute w-full px-2"
              >
                {announcements[currentAnnouncement]}
              </motion.p>
            </AnimatePresence>
          </div>

          <button 
            onClick={nextAnnouncement}
            className="p-2 bg-white/50 hover:bg-white/80 text-[#8EA393] rounded-full transition-colors backdrop-blur-sm border border-white/60 shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

    </div>
  );
}
