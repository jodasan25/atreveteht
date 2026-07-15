import React, { useState } from 'react';
import { motion } from "motion/react";
import { Wallet, ArrowUpRight, DollarSign, RefreshCw, FileText, Calendar, Building, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { UserProfile, EventModel, ReservationModel } from '../types';

interface Props {
  profile: UserProfile;
  events: EventModel[];
  reservations: ReservationModel[];
}

export default function TherapistWallet({ profile, events, reservations }: Props) {
  const isTraffic = profile.therapistModality === 'trafico';
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showPaySpaceModal, setShowPaySpaceModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pago_movil" | "cripto">("pago_movil");
  
  // Calculate earnings history based on modality
  const earningsHistory = events.map(ev => {
    const evReservations = reservations.filter(r => r.eventId === ev.id && r.status === "confirmed");
    const count = evReservations.length;
    
    let grossEarnings = count * ev.price;
    let netEarnings = grossEarnings;
    let platformFee = 0;
    
    if (isTraffic) {
      const finalPrice = ev.price * 0.9; // 10% discount to user
      grossEarnings = count * finalPrice;
      netEarnings = grossEarnings * 0.8; // 20% platform fee
      platformFee = grossEarnings * 0.2;
    }

    return {
      id: ev.id,
      title: ev.title,
      date: ev.date,
      count,
      grossEarnings,
      platformFee,
      netEarnings
    };
  }).filter(h => h.count > 0);

  const totalNetEarnings = earningsHistory.reduce((acc, curr) => acc + curr.netEarnings, 0);

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FDFBF7] border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8EA393]/10 text-[#8EA393] rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-widest block">Balance Disponible</span>
              <span className="text-2xl font-extrabold text-[#2D2D2D]">${totalNetEarnings.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowWithdrawForm(true)}
            className="w-full py-2 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" /> Solicitar Retiro
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-[#8EA393]/20 rounded-3xl p-6 shadow-sm flex flex-col justify-center"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mt-1">
              {isTraffic ? <RefreshCw className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-widest block mb-1">Modalidad Actual</span>
              <span className="text-lg font-bold text-[#2D2D2D] capitalize">
                {isTraffic ? "Tráfico (Comisión 20%)" : "Espacio ($250/mes)"}
              </span>
              <p className="text-xs text-[#2D2D2D]/60 mt-1">
                {isTraffic 
                  ? "Cero costo fijo. Compartes un % por reserva." 
                  : "Conservas el 100% de tus ingresos por pacientes."}
              </p>
            </div>
          </div>
        </motion.div>

        {!isTraffic && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xs font-bold text-emerald-800/60 uppercase tracking-widest block mb-1">Estado de Suscripción</span>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-bold text-emerald-800">Activa</span>
              </div>
              <p className="text-xs text-emerald-700/80">Próximo corte: 01 del mes siguiente.</p>
            </div>
            <button 
              onClick={() => setShowPaySpaceModal(true)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Pagar Mensualidad
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white border border-[#8EA393]/20 rounded-3xl p-6 shadow-sm space-y-4"
      >
        <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#8EA393]" /> Historial de Ingresos
        </h3>
        
        {earningsHistory.length === 0 ? (
          <div className="text-center p-8 bg-black/5 rounded-2xl border border-dashed border-black/10">
            <p className="text-sm text-[#2D2D2D]/60 font-medium">Aún no hay transacciones generadas por tus eventos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FDFBF7] text-[#2D2D2D]/70 text-xs uppercase font-bold border-b border-[#8EA393]/20">
                <tr>
                  <th className="p-3 rounded-tl-xl">Evento / Servicio</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-center">Reservas</th>
                  {isTraffic && <th className="p-3 text-right text-red-500">Retención (20%)</th>}
                  <th className="p-3 text-right rounded-tr-xl">Ingreso Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8EA393]/10">
                {earningsHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-black/5 transition-colors">
                    <td className="p-3 font-medium text-[#2D2D2D]">{item.title}</td>
                    <td className="p-3 text-[#2D2D2D]/60 text-xs">{item.date}</td>
                    <td className="p-3 text-center font-mono">{item.count}</td>
                    {isTraffic && (
                      <td className="p-3 text-right font-mono text-red-500">
                        -${item.platformFee.toFixed(2)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold text-[#8EA393] font-mono">
                      ${item.netEarnings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Withdrawal Form Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-[#2D2D2D]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-md p-6 relative shadow-xl">
            <button onClick={() => setShowWithdrawForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 text-[#2D2D2D]/50 hover:text-[#2D2D2D]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">Retirar Fondos</h3>
            <p className="text-xs text-[#2D2D2D]/60 mb-6">Solicita transferencia a tu banco en Bs o Binance (USDT).</p>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Retiro solicitado con éxito.'); setShowWithdrawForm(false); }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2D2D]/70">Método de Retiro</label>
                <select className="w-full p-2.5 rounded-xl border border-[#8EA393]/30 bg-white text-sm focus:outline-none focus:border-[#8EA393]">
                  <option>Pago Móvil / Banco Nacional</option>
                  <option>Binance (USDT)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2D2D]/70">Datos de la cuenta</label>
                <textarea 
                  required 
                  placeholder="Ej. Banesco, C.I: 12.345.678, Telf: 0414-1234567"
                  className="w-full p-3 rounded-xl border border-[#8EA393]/30 bg-white text-sm focus:outline-none focus:border-[#8EA393] min-h-[80px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2D2D2D]/70">Monto a retirar ($)</label>
                <input 
                  type="number" 
                  max={totalNetEarnings} 
                  required 
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl border border-[#8EA393]/30 bg-white text-sm focus:outline-none focus:border-[#8EA393]"
                />
                <p className="text-3xs text-[#2D2D2D]/50">Máximo disponible: ${totalNetEarnings.toFixed(2)}</p>
              </div>
              <button type="submit" className="w-full py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm transition-all mt-4">
                Confirmar Retiro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pay Space Modal (Same as Patient Checkout logic visually) */}
      {showPaySpaceModal && (
        <div className="fixed inset-0 bg-[#2D2D2D]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-[#8EA393]/20 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2D2D2D]">Pagar Mensualidad de Espacio</h3>
                <p className="text-xs text-[#2D2D2D]/60 mt-0.5">Suscripción de $250 / mes</p>
              </div>
              <button onClick={() => setShowPaySpaceModal(false)} className="p-1 rounded-full hover:bg-black/5 text-[#2D2D2D]/50 hover:text-[#2D2D2D]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); alert('Pago reportado para validación.'); setShowPaySpaceModal(false); }} className="space-y-5">
                
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
                      <span className={`text-xs font-bold ${paymentMethod === "pago_movil" ? "text-[#2D2D2D]" : "text-[#2D2D2D]/60"}`}>Pago Móvil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cripto")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === "cripto" ? "border-[#8EA393] bg-[#8EA393]/5" : "border-black/5 hover:bg-black/5"
                      }`}
                    >
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
                      <p className="text-3xs text-[#2D2D2D]/50 pt-2 border-t border-[#8EA393]/10">Calcula la tasa del BCV del día para realizar el pago de $250 en Bs.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="font-bold text-[#2D2D2D] text-xs uppercase tracking-widest block mb-2">Datos Receptores (Binance)</span>
                      <div className="flex flex-col gap-1 text-[#2D2D2D]/80 text-xs">
                        <span className="font-mono"><strong>Binance ID (Pay):</strong> 163305332</span>
                      </div>
                      <p className="text-3xs text-[#2D2D2D]/50 pt-2 border-t border-[#8EA393]/10">Envía exactamente $250 USDT y copia el Order ID.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Nº de Referencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 12345678"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Reportar Pago
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
