import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Award, ShieldCheck, Heart, User, Calendar, MessageSquare, BookOpen, Tag } from "lucide-react";

interface SpecialistProfileProps {
  onBookSession: () => void;
}

export default function SpecialistProfile({ onBookSession }: SpecialistProfileProps) {
  const [activeTab, setActiveTab] = useState<"bio" | "especialidades" | "opiniones">("bio");

  // Simulated data for the specialist
  const specialist = {
    name: "Dra. Laura Gómez",
    specialty: "Terapeuta Somática Integrativa",
    rating: 4.9,
    reviews: 128,
    modality: "trafico", // 'trafico' gets 10% discount
    imageUrl: "https://loremflickr.com/600/600/doctor,portrait?lock=15",
    bio: "Con más de 10 años de experiencia clínica, mi enfoque se centra en la regulación del sistema nervioso mediante prácticas somáticas corporizadas. Ayudo a mis pacientes a transitar procesos de estrés crónico y trauma, reconectando con la sabiduría inherente del cuerpo para encontrar la seguridad interna y restaurar la salud emocional y física.",
    specialties: ["Ansiedad", "Manejo del Estrés", "Trauma Corporizado", "Regulación Vagal", "Fatiga Crónica"],
    opinions: [
      { id: 1, author: "María V.", date: "Hace 2 semanas", text: "La Dra. Gómez me ayudó a entender por qué mi cuerpo siempre estaba en alerta. Las sesiones son un refugio de calma.", rating: 5 },
      { id: 2, author: "Carlos M.", date: "Hace 1 mes", text: "Increíble cómo el enfoque somático ha cambiado mi forma de manejar el estrés diario. Totalmente recomendada.", rating: 5 },
      { id: 3, author: "Elena R.", date: "Hace 2 meses", text: "Muy profesional y empática. Me sentí segura desde el primer momento.", rating: 4.5 }
    ]
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
    ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FDFBF7]/80 backdrop-blur-xl border border-[#8EA393]/30 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#8EA393]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
            <img src={specialist.imageUrl} alt={specialist.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2 bg-emerald-500 text-white p-2 rounded-full shadow-md z-20 border-2 border-white" title="Perfil Verificado">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start flex-grow text-center md:text-left z-10">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/60 px-2 py-0.5 rounded-full border border-slate-200">
              Especialista
            </span>
            {specialist.modality === "trafico" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Tag className="w-3 h-3" /> 10% de Descuento Disponible
              </span>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2D2D] tracking-tight">{specialist.name}</h1>
          <p className="text-[#8EA393] font-semibold text-sm md:text-base mb-4">{specialist.specialty}</p>
          
          <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-2xl border border-[#8EA393]/20">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[#2D2D2D]">{specialist.rating}</span>
              <div className="flex gap-0.5">{renderStars(specialist.rating)}</div>
            </div>
            <div className="w-px h-6 bg-[#8EA393]/20" />
            <div className="text-xs font-semibold text-slate-500">
              {specialist.reviews} Reseñas
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto mt-4 md:mt-0 z-10 flex items-center justify-center">
           <button 
             onClick={onBookSession}
             className="w-full md:w-auto px-6 py-3.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
           >
             <Calendar className="w-5 h-5" /> Reservar Sesión y Ver Agenda
           </button>
        </div>
      </motion.div>

      {/* Tabs Section */}
      <div className="bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm min-h-[300px]">
        <div className="flex flex-wrap gap-2 md:gap-4 border-b border-[#8EA393]/20 pb-4 mb-6">
          <button 
            onClick={() => setActiveTab("bio")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "bio" ? "bg-[#8EA393] text-white shadow-sm" : "text-slate-600 hover:bg-[#8EA393]/10"
            }`}
          >
            <User className="w-4 h-4" /> Biografía
          </button>
          <button 
            onClick={() => setActiveTab("especialidades")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "especialidades" ? "bg-[#8EA393] text-white shadow-sm" : "text-slate-600 hover:bg-[#8EA393]/10"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Especialidades
          </button>
          <button 
            onClick={() => setActiveTab("opiniones")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "opiniones" ? "bg-[#8EA393] text-white shadow-sm" : "text-slate-600 hover:bg-[#8EA393]/10"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Opiniones
          </button>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === "bio" && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4"
              >
                <p>{specialist.bio}</p>
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex gap-4 mt-6">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0 h-min">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-800 text-sm mb-1">Enfoque Somático</h4>
                    <p className="text-emerald-600/80 text-xs">Basado en la Teoría Polivagal, mindfulness y prácticas de reconexión corporal para el alivio profundo del estrés.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "especialidades" && (
              <motion.div
                key="especialidades"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-wrap gap-3">
                  {specialist.specialties.map((spec, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-[#8EA393]/30 text-[#2D2D2D] font-bold text-sm rounded-xl shadow-sm flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-[#8EA393]" /> {spec}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "opiniones" && (
              <motion.div
                key="opiniones"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {specialist.opinions.map(op => (
                  <div key={op.id} className="bg-white/60 backdrop-blur-sm border border-[#8EA393]/20 p-5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                           {op.author.charAt(0)}
                         </div>
                         <div>
                           <h4 className="font-bold text-[#2D2D2D] text-sm leading-none">{op.author}</h4>
                           <span className="text-xs text-slate-400">{op.date}</span>
                         </div>
                      </div>
                      <div className="flex gap-0.5">
                        {renderStars(op.rating)}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm pt-2">{op.text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}
