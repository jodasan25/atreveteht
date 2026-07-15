import React from 'react';
import { motion } from "motion/react";
import { Lock, ShieldCheck, UserX, CalendarX } from 'lucide-react';

interface Props {
  onSubscribe: () => void;
}

export default function TherapistPaywall({ onSubscribe }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-[#FDFBF7] border border-[#8EA393]/30 rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto my-12"
    >
      <div className="w-16 h-16 bg-[#8EA393]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-[#8EA393]" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-extrabold text-[#2D2D2D] mb-4">
        Suscripción de Espacio Inactiva
      </h2>
      
      <p className="text-[#2D2D2D]/70 text-sm md:text-base mb-8 max-w-lg mx-auto">
        Tu membresía mensual está vencida. Al estar en la modalidad "Suscripción por Espacio", es necesario mantenerla activa para conservar el 100% de tus ganancias libres de comisión.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-red-100/50 rounded-2xl p-4 flex items-start gap-3 text-left">
          <CalendarX className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <h4 className="font-bold text-[#2D2D2D] text-sm">Agenda Congelada</h4>
            <p className="text-xs text-[#2D2D2D]/60 mt-0.5">Los pacientes no pueden reservar nuevos cupos en tus eventos.</p>
          </div>
        </div>
        
        <div className="bg-white border border-red-100/50 rounded-2xl p-4 flex items-start gap-3 text-left">
          <UserX className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <h4 className="font-bold text-[#2D2D2D] text-sm">Perfil Oculto</h4>
            <p className="text-xs text-[#2D2D2D]/60 mt-0.5">Tu perfil y servicios no son visibles en el directorio médico.</p>
          </div>
        </div>
      </div>

      <button
        onClick={onSubscribe}
        className="px-8 py-3.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm md:text-base transition-all shadow-md flex items-center gap-2 mx-auto"
      >
        <ShieldCheck className="w-5 h-5" />
        Pagar Mensualidad del Espacio ($250/mes)
      </button>
    </motion.div>
  );
}
