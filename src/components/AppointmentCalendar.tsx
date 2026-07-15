import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Calendar, X, ShieldCheck, CreditCard, Info } from "lucide-react";
import { TherapistModality } from "../types";

interface AppointmentCalendarProps {
  therapistName: string;
  therapistModality?: TherapistModality;
  basePrice?: number;
}

const mockSchedule = [
  { day: "Lunes", slots: [{ time: "09:00", available: true }, { time: "10:00", available: false }, { time: "11:00", available: true }, { time: "15:00", available: true }] },
  { day: "Martes", slots: [{ time: "09:00", available: false }, { time: "10:00", available: true }, { time: "12:00", available: false }, { time: "16:00", available: true }] },
  { day: "Miércoles", slots: [{ time: "10:00", available: true }, { time: "11:00", available: true }, { time: "14:00", available: true }, { time: "15:00", available: false }] },
  { day: "Jueves", slots: [{ time: "09:00", available: true }, { time: "11:00", available: false }, { time: "13:00", available: true }, { time: "16:00", available: true }] },
  { day: "Viernes", slots: [{ time: "09:00", available: false }, { time: "10:00", available: false }, { time: "12:00", available: true }, { time: "14:00", available: true }] },
];

export default function AppointmentCalendar({ therapistName, therapistModality, basePrice = 60 }: AppointmentCalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isTrafico = therapistModality === "trafico";
  const discountAmount = isTrafico ? basePrice * 0.1 : 0;
  const finalPrice = basePrice - discountAmount;

  const handleSlotClick = (day: string, time: string, available: boolean) => {
    if (!available) return;
    setSelectedSlot({ day, time });
    setShowConfirmModal(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-3xl border border-[#8EA393]/20 shadow-sm overflow-hidden flex flex-col h-full max-w-5xl mx-auto"
    >
      <div className="bg-[#FDFBF7] p-6 md:p-8 border-b border-[#8EA393]/10">
        <h3 className="text-xl font-bold text-[#2D2D2D] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#8EA393]" />
          Disponibilidad de {therapistName}
        </h3>
        <p className="text-sm text-[#2D2D2D]/60 mt-1">Selecciona un horario disponible para agendar tu sesión integrativa (lapsos de 1 hora).</p>
      </div>

      <div className="p-6 md:p-8 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-5 gap-4 mb-4">
            {mockSchedule.map((dayData, idx) => (
              <div key={idx} className="text-center font-bold text-xs uppercase tracking-widest text-[#2D2D2D]/70 bg-slate-50 py-2 rounded-xl">
                {dayData.day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-4">
            {mockSchedule.map((dayData, idx) => (
              <div key={idx} className="space-y-3">
                {dayData.slots.map((slot, sIdx) => (
                  <button
                    key={sIdx}
                    disabled={!slot.available}
                    onClick={() => handleSlotClick(dayData.day, slot.time, slot.available)}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all border ${
                      slot.available 
                        ? "bg-white border-[#8EA393] text-[#8EA393] hover:bg-[#8EA393] hover:text-white cursor-pointer shadow-sm"
                        : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot.time}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && selectedSlot && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FDFBF7] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 md:p-8 border-b border-[#8EA393]/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#2D2D2D]">Confirma tu Sesión</h3>
                    <p className="text-xs font-semibold text-[#2D2D2D]/60 mt-1 uppercase tracking-wider">
                      con {therapistName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1 rounded-full hover:bg-slate-200/50 text-[#2D2D2D]/40 hover:text-[#2D2D2D]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#8EA393]/20 shadow-sm mb-6">
                  <div className="bg-[#8EA393]/10 p-2.5 rounded-xl text-[#8EA393]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2D2D2D]">{selectedSlot.day}, Próxima Semana</div>
                    <div className="text-xs font-semibold text-[#2D2D2D]/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {selectedSlot.time} (60 min)
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#2D2D2D]/70 font-semibold">Costo Base:</span>
                    <span className="text-[#2D2D2D] font-mono font-bold">${basePrice.toFixed(2)}</span>
                  </div>
                  
                  {isTrafico && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                      <span className="font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> 10% Dcto. Automático:
                      </span>
                      <span className="font-mono font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[#2D2D2D] font-bold text-base">Total a Pagar:</span>
                    <span className="text-xl font-mono font-bold text-[#2D2D2D]">${finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {isTrafico && (
                  <div className="mt-4 flex items-start gap-2 text-3xs text-[#2D2D2D]/50 bg-emerald-50/50 p-3 rounded-xl">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                    <span>Este especialista ofrece un descuento exclusivo a través de Atrévete HealthTech para impulsar el acceso a la salud mental.</span>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 bg-white flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#2D2D2D]/60 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Simular procesamiento
                    setShowConfirmModal(false);
                    alert("Sesión confirmada (Simulación). Serás redirigido a la pasarela de pago.");
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#8EA393] hover:bg-[#7A8F7F] text-white shadow-md flex items-center gap-2 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Confirmar y Proceder al Pago
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
