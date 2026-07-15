import React from 'react';
import { motion } from "motion/react";
import { Lock, Shield, Sparkles } from 'lucide-react';

interface Props {
  onSubscribe: () => void;
}

export default function PatientPaywall({ onSubscribe }: Props) {
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
        Tu periodo de prueba ha finalizado
      </h2>
      
      <p className="text-[#2D2D2D]/70 text-sm md:text-base mb-8 max-w-lg mx-auto">
        Para continuar con tu regulación somática, realizar nuevas evaluaciones del sistema nervioso, visualizar tu evolución histórica y acceder al directorio de especialistas, activa tu suscripción mensual.
      </p>

      <div className="bg-white border border-[#8EA393]/20 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
        <h4 className="font-bold text-[#2D2D2D] mb-4 text-center">¿Qué incluye la suscripción?</h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#8EA393] shrink-0" />
            <span className="text-sm text-[#2D2D2D]">Evaluaciones somáticas ilimitadas con IA</span>
          </li>
          <li className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#8EA393] shrink-0" />
            <span className="text-sm text-[#2D2D2D]">Histórico visual interactivo de evolución</span>
          </li>
          <li className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#8EA393] shrink-0" />
            <span className="text-sm text-[#2D2D2D]">Acceso total al directorio de especialistas</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onSubscribe}
        className="px-8 py-3.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm md:text-base transition-all shadow-md flex items-center gap-2 mx-auto"
      >
        <Shield className="w-5 h-5" />
        Activar mi Suscripción ($5/mes)
      </button>
    </motion.div>
  );
}
