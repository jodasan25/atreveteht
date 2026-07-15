import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Smartphone, Shield, ShieldCheck, Ticket, Download, Mail, RefreshCw, X, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import Logo from "./Logo";
import { EventModel, ReservationModel } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";

interface BookingModalProps {
  event: EventModel;
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ event, userId, userEmail, onClose, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<"payment" | "processing" | "success">("payment");
  const [paymentMethod, setPaymentMethod] = useState<"pago_movil" | "cripto">("pago_movil");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [ticketCode, setTicketCode] = useState<string>("");
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  const finalPrice = event.creatorModality === "trafico" ? Number((event.price * 0.9).toFixed(2)) : event.price;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentReference.length < 5) {
      setPaymentError("Número de referencia inválido. Ingrese el ID de la transacción completo.");
      return;
    }

    setStep("processing");

    // Simulate Payment Gateway processing
    setTimeout(async () => {
      try {
        const uniqueCode = "ATH-" + Math.floor(100000 + Math.random() * 900000) + "-" + event.id.substr(0, 2).toUpperCase();
        setTicketCode(uniqueCode);

        const reservationPayload: ReservationModel = {
          id: Math.random().toString(36).substr(2, 9),
          eventId: event.id,
          userId: userId,
          status: "confirmed",
          bookingCode: uniqueCode,
          createdAt: new Date().toISOString(),
          reminderEnabled,
        };

        if (userId === "guest_offline_user") {
          // Store locally in offline reservations
          const localReservations = JSON.parse(localStorage.getItem("offline_reservations") || "[]");
          const detailedRes = {
            ...reservationPayload,
            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
          };
          localReservations.unshift(detailedRes);
          localStorage.setItem("offline_reservations", JSON.stringify(localReservations));
        } else {
          // Write reservation to Firestore securely
          try {
            await addDoc(collection(db, "reservations"), reservationPayload);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, "reservations");
            throw err;
          }

          // Update Event registered list so capacity adjusts
          const eventRef = doc(db, "events", event.id);
          try {
            await updateDoc(eventRef, {
              registeredUsers: arrayUnion(userId),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `events/${event.id}`);
            throw err;
          }
        }

        setStep("success");
      } catch (err: any) {
        console.error("Error finalizing booking:", err);
        setPaymentError("No se pudo procesar tu reserva. Intenta de nuevo.");
        setStep("payment");
      }
    }, 2000);
  };

  return (
    <div id="booking-modal-overlay" className="fixed inset-0 bg-[#2D2D2D]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FDFBF7] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        
        {/* Header (hidden on success step) */}
        {step !== "success" && (
          <div className="p-6 border-b border-[#8EA393]/20 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#2D2D2D]">Reserva de Plaza</h3>
              <p className="text-xs text-[#2D2D2D]/60 mt-0.5">Pasarela de pago local y cripto</p>
            </div>
            <button
              id="close-booking-modal-btn"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 text-[#2D2D2D]/50 hover:text-[#2D2D2D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              {/* Event summary */}
              <div className="bg-white p-4 rounded-2xl border border-[#8EA393]/30 space-y-2">
                <span className="text-2xs font-mono font-bold text-[#8EA393] uppercase tracking-widest">Resumen del Evento</span>
                <h4 className="text-sm font-bold text-[#2D2D2D] line-clamp-1">{event.title}</h4>
                <div className="flex flex-wrap text-xs text-[#2D2D2D]/60 gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date} - {event.time}hs</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                </div>
                <div className="pt-2 border-t border-[#8EA393]/20 flex justify-between items-center text-sm font-bold text-[#2D2D2D]">
                  <span>Total a Pagar</span>
                  <div className="flex flex-col items-end">
                    {event.creatorModality === "trafico" && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 rounded uppercase mb-0.5">10% OFF</span>
                    )}
                    <span className="text-[#8EA393] font-extrabold text-base">${finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                    {paymentError}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pago_movil")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === "pago_movil" ? "border-[#8EA393] bg-[#8EA393]/5" : "border-black/5 hover:bg-black/5"
                      }`}
                    >
                      <Smartphone className={`w-6 h-6 mb-1 ${paymentMethod === "pago_movil" ? "text-[#8EA393]" : "text-[#2D2D2D]/40"}`} />
                      <span className={`text-xs font-bold ${paymentMethod === "pago_movil" ? "text-[#2D2D2D]" : "text-[#2D2D2D]/60"}`}>Pago Móvil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cripto")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === "cripto" ? "border-[#8EA393] bg-[#8EA393]/5" : "border-black/5 hover:bg-black/5"
                      }`}
                    >
                      <Wallet className={`w-6 h-6 mb-1 ${paymentMethod === "cripto" ? "text-[#8EA393]" : "text-[#2D2D2D]/40"}`} />
                      <span className={`text-xs font-bold ${paymentMethod === "cripto" ? "text-[#2D2D2D]" : "text-[#2D2D2D]/60"}`}>Binance (Cripto)</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#8EA393]/30 text-sm">
                  {paymentMethod === "pago_movil" ? (
                    <div className="space-y-3">
                      <span className="font-bold text-[#2D2D2D] text-xs uppercase tracking-widest block mb-2">Datos Receptores (Pago Móvil)</span>
                      <div className="flex flex-col gap-1 text-[#2D2D2D]/80 text-xs">
                        <span className="font-mono"><strong>Opción 1:</strong> Banco de Venezuela (0102) | C.I. 18.478.170 | Tel: 0414-4031678</span>
                        <span className="font-mono"><strong>Opción 2:</strong> BNC - Banco Nacional de Crédito (0191) | C.I. 13.518.664 | Tel: 0414-4187215</span>
                      </div>
                      <p className="text-3xs text-[#2D2D2D]/50 pt-2 border-t border-[#8EA393]/10">Calcula la tasa del BCV del día para realizar el pago en Bs.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="font-bold text-[#2D2D2D] text-xs uppercase tracking-widest block mb-2">Datos Receptores (Binance)</span>
                      <div className="flex flex-col gap-1 text-[#2D2D2D]/80 text-xs">
                        <span className="font-mono"><strong>Binance ID (Pay):</strong> 163305332</span>
                      </div>
                      <p className="text-3xs text-[#2D2D2D]/50 pt-2 border-t border-[#8EA393]/10">Envía exactamente ${finalPrice.toFixed(2)} USDT y copia el Order ID.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Nº de Referencia / ID de Transacción</label>
                  <input
                    id="payment-reference"
                    type="text"
                    required
                    placeholder="Ej. 12345678"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#8EA393]/30 cursor-pointer hover:bg-[#8EA393]/5 transition-colors">
                  <input 
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#8EA393] rounded border-[#8EA393]/30 focus:ring-[#8EA393] mt-0.5 cursor-pointer accent-[#8EA393]"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-[#2D2D2D] block">Recordatorio por Email</span>
                    <span className="text-3xs text-[#2D2D2D]/60 block mt-0.5">Recibir una notificación 24hs antes de tu cita.</span>
                  </div>
                </label>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    id="cancel-payment-btn"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-transparent hover:bg-black/5 text-[#2D2D2D] font-bold rounded-xl text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="submit-payment-btn"
                    className="px-6 py-2.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-xs md:text-sm transition-all shadow-md flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Confirmar Pago
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <RefreshCw className="w-12 h-12 text-[#8EA393] animate-spin" />
              <div>
                <h4 className="text-lg font-bold text-[#2D2D2D]">Verificando transacción...</h4>
                <p className="text-xs text-[#2D2D2D]/60 mt-1">Estamos validando tu pago en nuestro sistema.</p>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 md:p-8 space-y-6 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#2D2D2D]">¡Reserva Confirmada!</h3>
                <p className="text-xs text-[#2D2D2D]/60">Tu pago ha sido validado correctamente.</p>
              </div>

              {/* Virtual Ticket */}
              <div className="w-full bg-white border border-[#8EA393]/30 rounded-3xl p-5 relative overflow-hidden space-y-4 shadow-sm">
                {/* Side cuts for ticket effect */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FDFBF7] rounded-full -ml-2 border-r border-[#8EA393]/30" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FDFBF7] rounded-full -mr-2 border-l border-[#8EA393]/30" />
                
                <div className="flex justify-between items-center">
                  <Logo iconSize="h-6 w-6" className="scale-90 origin-left" />
                  <span className="text-xs font-mono font-bold text-[#8EA393]">{ticketCode}</span>
                </div>
                
                <div className="text-left space-y-1">
                  <h4 className="text-sm font-bold text-[#2D2D2D] line-clamp-1">{event.title}</h4>
                  <p className="text-[11px] text-[#2D2D2D]/60">Especialista: {event.createdByName}</p>
                </div>
                
                <div className="grid grid-cols-2 text-left gap-3 text-2xs font-mono text-[#2D2D2D]/60">
                  <div>
                    <span className="block font-bold text-[#2D2D2D]/40">FECHA / HORA</span>
                    <span>{event.date} @ {event.time}hs</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#2D2D2D]/40">UBICACIÓN</span>
                    <span className="truncate block">{event.location}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-dashed border-[#8EA393]/30 flex items-center justify-between">
                  <div>
                    <span className="block text-3xs font-bold text-[#2D2D2D]/40 font-mono">USUARIO</span>
                    <span className="text-[11px] text-[#2D2D2D]/80 font-medium">{userEmail}</span>
                  </div>
                  {/* Decorative QR simulation */}
                  <div className="w-12 h-12 bg-white border border-[#8EA393]/30 rounded p-1 flex flex-wrap gap-[2px]">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={`w-2.5 h-2.5 ${Math.random() > 0.4 ? "bg-[#8EA393]" : "bg-transparent"}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="p-3 bg-[#8EA393]/10 border border-[#8EA393]/20 rounded-2xl text-[#8EA393] text-2xs md:text-xs flex items-center justify-center gap-2 font-medium">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Te enviamos un correo de confirmación con los accesos.</span>
                </div>
                <button
                  id="finish-booking-btn"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="w-full py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  Entendido y Guardar Pass
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
