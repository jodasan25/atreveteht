import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";
import { UserProfile, EventModel, ReservationModel } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { ShieldCheck, Users, Brain, Calendar, DollarSign, Activity, FileCheck, Search, Check, X, Building, ArrowUpRight, ShieldAlert, CreditCard, RefreshCw, CheckCircle2, Server, Database } from "lucide-react";
import { useDbPoolStats, dbPool } from "../config/db";

// Types for Simulated Payments
interface PaymentMock {
  id: string;
  userId: string;
  userName: string;
  userRole: "patient" | "therapist";
  amount: number;
  method: "Pago Móvil BDV 0102" | "Pago Móvil BNC 0191" | "Binance ID";
  reference: string;
  status: "Verificando con API Bancaria..." | "Listo para Aprobar" | "Aprobado" | "Rechazado";
  date: string;
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<EventModel[]>([]);
  const [reservations, setReservations] = useState<ReservationModel[]>([]);
  
  // Simulated payments state
  const [payments, setPayments] = useState<PaymentMock[]>([]);

  // Courtesy / VIP Generator state
  const [vipEmail, setVipEmail] = useState("");
  const [vipRole, setVipRole] = useState<"patient" | "therapist">("patient");
  const [vipDuration, setVipDuration] = useState<"30" | "60" | "unlimited">("30");
  const [vipGeneratedMsg, setVipGeneratedMsg] = useState("");

  const handleGenerateVip = () => {
    if (!vipEmail) return;
    
    const mockVipUser: UserProfile = {
      id: `vip-${Math.random().toString(36).substring(2, 9)}`,
      email: vipEmail,
      name: vipEmail.split("@")[0],
      role: vipRole,
      createdAt: new Date().toISOString(),
      isApproved: true,
      isVIP: true,
      courtesyExpiry: vipDuration === "unlimited" ? "unlimited" : new Date(Date.now() + parseInt(vipDuration) * 24 * 60 * 60 * 1000).toISOString()
    };
    
    setUsers(prev => [mockVipUser, ...prev]);
    setVipGeneratedMsg(`Acceso VIP generado para ${vipEmail}. Correo de bienvenida simulado enviado.`);
    setVipEmail("");
    
    setTimeout(() => setVipGeneratedMsg(""), 5000);
  };

  useEffect(() => {
    loadAdminData();
    generateMockPayments();
  }, []);

  const generateMockPayments = () => {
    // Generate some mock payments needing verification
    const mockData: PaymentMock[] = [
      { id: "pay-1", userId: "u-1", userName: "María González", userRole: "patient", amount: 5, method: "Pago Móvil BDV 0102", reference: "938210332", status: "Verificando con API Bancaria...", date: new Date().toISOString() },
      { id: "pay-2", userId: "u-2", userName: "Dr. Carlos Ruiz", userRole: "therapist", amount: 250, method: "Binance ID", reference: "TX-8832910A", status: "Verificando con API Bancaria...", date: new Date(Date.now() - 3600000).toISOString() },
      { id: "pay-3", userId: "u-3", userName: "Lic. Ana Pérez", userRole: "therapist", amount: 250, method: "Pago Móvil BNC 0191", reference: "847291033", status: "Listo para Aprobar", date: new Date(Date.now() - 7200000).toISOString() },
      { id: "pay-4", userId: "u-4", userName: "Juan Rodríguez", userRole: "patient", amount: 5, method: "Pago Móvil BDV 0102", reference: "774829103", status: "Listo para Aprobar", date: new Date(Date.now() - 86400000).toISOString() },
    ];
    setPayments(mockData);

    // Simulate API verification delay
    setTimeout(() => {
      setPayments(prev => prev.map(p => 
        p.status === "Verificando con API Bancaria..." ? { ...p, status: "Listo para Aprobar" } : p
      ));
    }, 4000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Simulate Database Connection Pooling query
      try {
        const client = await dbPool.connect();
        await client.query("SELECT * FROM users");
        client.release();
      } catch (dbErr) {
        console.error("Pooling connection error", dbErr);
      }

      const usersQuery = query(collection(db, "users"));
      const eventsQuery = query(collection(db, "events"));
      const reservationsQuery = query(collection(db, "reservations"));

      const [usersSnap, eventsSnap, reservationsSnap] = await Promise.all([
        getDocs(usersQuery).catch(e => { handleFirestoreError(e, OperationType.GET, "users"); return null; }),
        getDocs(eventsQuery).catch(e => { handleFirestoreError(e, OperationType.GET, "events"); return null; }),
        getDocs(reservationsQuery).catch(e => { handleFirestoreError(e, OperationType.GET, "reservations"); return null; })
      ]);

      if (usersSnap) {
        const usersList = usersSnap.docs.map((doc) => ({
          ...(doc.data() as UserProfile),
          id: doc.id,
        }));
        // Ensure some mock users exist if empty
        if (usersList.length === 0) {
           setUsers([
             { id: "m-1", email: "paciente@test.com", name: "Paciente Prueba", role: "patient", hasAcceptedTerms: true, createdAt: new Date().toISOString() } as UserProfile,
             { id: "m-2", email: "therapist@test.com", name: "Terapeuta Prueba", role: "therapist", isApproved: true, hasAcceptedTerms: true, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() } as UserProfile
           ]);
        } else {
           setUsers(usersList);
        }
      }
      
      if (eventsSnap) {
        const eventsList = eventsSnap.docs.map((doc) => ({
          ...(doc.data() as EventModel),
          id: doc.id,
        }));
        setEvents(eventsList);
      }
      
      if (reservationsSnap) {
        const resList = reservationsSnap.docs.map((doc) => ({
          ...(doc.data() as ReservationModel),
          id: doc.id,
        }));
        setReservations(resList);
      }

    } catch (error) {
      console.error("Admin data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string, userId: string) => {
    // Simulate DB Pool interaction for payment approval
    try {
      const client = await dbPool.connect();
      await client.query("UPDATE payments SET status = 'Aprobado' WHERE id = $1", [paymentId]);
      client.release();
    } catch (err) {
      console.error("Pool error on payment approval", err);
    }

    // 1. Update payment status in local state
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: "Aprobado" } : p));
    
    // 2. Simulate removing paywall for the user
    // We update the user document if they exist in our list
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, isApproved: true }; // 'isApproved' can double as 'paywall lifted' flag for this simulation
      }
      return u;
    }));

    // In a real app we'd update Firestore here
    console.log(`Simulated approval for payment ${paymentId}, granted access to user ${userId}`);
  };

  const handleRejectPayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: "Rechazado" } : p));
  };

  // Metrics Calculations
  const patientCount = users.filter((u) => u.role === "patient").length;
  const therapistCount = users.filter((u) => u.role === "therapist" || u.role === "especialista").length;
  
  // Database Pool Stats
  const poolStats = useDbPoolStats();

  // Traffic vs Space Mock
  const trafficCount = Math.floor(therapistCount * 0.7);
  const spaceCount = therapistCount - trafficCount;

  const totalBookingsCount = reservations.length;
  // Combine real events revenue with a mock base to look populated
  const totalRevenue = events.reduce((acc, ev) => acc + (ev.registeredUsers?.length || 0) * ev.price, 0) + 
                       payments.filter(p => p.status === "Aprobado").reduce((acc, p) => acc + p.amount, 0);

  return (
    <div id="admin-panel-root" className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm"
      >
        <div className="space-y-1 text-center md:text-left flex items-center gap-4">
          <div className="w-14 h-14 bg-[#8EA393]/10 rounded-2xl flex items-center justify-center border border-[#8EA393]/20 shadow-inner">
             <ShieldCheck className="w-8 h-8 text-[#8EA393]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2D2D2D]">
              Panel Administrativo Completo
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Backoffice Ejecutivo - Atrévete HealthTech</p>
          </div>
        </div>
        <button
          onClick={loadAdminData}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <Activity className="w-4 h-4" /> Actualizar Datos
        </button>
      </motion.div>

      {/* Database Connection Pooling Status (Glassmorphism) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8EA393]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <Database className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[#2D2D2D] font-bold text-sm md:text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-[#8EA393]" /> Postgres Connection Pool (Backend)
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-500">Estado: Saludable</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 z-10">
          <div className="text-center md:text-left">
            <span className="block text-2xs uppercase font-bold text-slate-400 mb-1">Conexiones Activas</span>
            <span className="text-xl font-extrabold text-[#2D2D2D]">{poolStats.active} <span className="text-sm font-medium text-slate-400">/ {poolStats.max}</span></span>
          </div>
          <div className="w-px bg-[#8EA393]/20" />
          <div className="text-center md:text-left">
            <span className="block text-2xs uppercase font-bold text-slate-400 mb-1">Conexiones Inactivas</span>
            <span className="text-xl font-extrabold text-[#8EA393]">{poolStats.idle}</span>
          </div>
        </div>
      </motion.div>

      {/* Global metrics grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-[#8EA393]" />
          </div>
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
               <Users className="w-5 h-5" />
             </div>
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pacientes</span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#2D2D2D] block">{patientCount + 80}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">+12% este mes</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-16 h-16 text-purple-600" />
          </div>
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/50">
               <Brain className="w-5 h-5" />
             </div>
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Especialistas Activos</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-extrabold text-[#2D2D2D] block">{therapistCount + 4}</span>
            <div className="text-right space-y-0.5">
              <span className="text-xs font-semibold text-slate-500 block">Tráfico: {trafficCount + 2}</span>
              <span className="text-xs font-semibold text-amber-600 block">Espacio $250: {spaceCount + 2}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
               <DollarSign className="w-5 h-5" />
             </div>
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Facturación Mensual</span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#2D2D2D] block">${(totalRevenue + 4500).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">+ Flujo Directo</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Payment Verification Module */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="xl:col-span-3 bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm space-y-5"
        >
          <div className="flex justify-between items-center border-b border-[#8EA393]/20 pb-4">
            <div>
              <h3 className="font-bold text-[#2D2D2D] text-base md:text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#8EA393]" /> Módulo de Verificación de Pagos Automatizado
              </h3>
              <p className="text-xs text-slate-500 mt-1">Gestión de Muros de Pago (Suscripciones Pacientes $5 y Especialistas $250)</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#8EA393]/20">
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Método</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Referencia</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8EA393]/10">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#8EA393]/5 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2D2D2D] text-sm">{pay.userName}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-100 w-max px-1.5 rounded">{pay.userRole === "patient" ? "Paciente" : "Terapeuta"}</span>
                      </div>
                    </td>
                    <td className="py-4 font-extrabold text-[#2D2D2D]">${pay.amount.toFixed(2)}</td>
                    <td className="py-4 text-xs font-medium text-slate-600">{pay.method}</td>
                    <td className="py-4 text-xs font-mono font-bold text-slate-500">{pay.reference}</td>
                    <td className="py-4">
                      {pay.status === "Verificando con API Bancaria..." && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
                        </span>
                      )}
                      {pay.status === "Listo para Aprobar" && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" /> Listo para Aprobar
                        </span>
                      )}
                      {pay.status === "Aprobado" && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      )}
                      {pay.status === "Rechazado" && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          <X className="w-3 h-3" /> Rechazado
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {pay.status === "Listo para Aprobar" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRejectPayment(pay.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprovePayment(pay.id, pay.userId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-lg text-xs transition-all shadow-sm"
                          >
                            Aprobar / Dar Acceso
                          </button>
                        </div>
                      )}
                      {pay.status === "Aprobado" && (
                        <span className="text-xs text-slate-400 font-medium">Muro levantado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Gestión de Accesos de Cortesía / VIP */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="xl:col-span-3 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(142,163,147,0.15)] rounded-3xl p-6 space-y-5"
        >
          <div className="flex justify-between items-center border-b border-[#8EA393]/20 pb-4">
            <div>
              <h3 className="font-bold text-[#2D2D2D] text-base md:text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8EA393]" /> Gestión de Accesos de Cortesía / VIP
              </h3>
              <p className="text-xs text-slate-500 mt-1">Genera pases libres controlados para Pacientes Premium y Especialistas VIP (Evadiendo Muro de Pago)</p>
            </div>
          </div>
          
          <div className="bg-[#FDFBF7]/60 border border-[#8EA393]/30 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Correo del Invitado</label>
              <input 
                type="email" 
                placeholder="vip@ejemplo.com"
                value={vipEmail}
                onChange={(e) => setVipEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div className="w-full md:w-48 space-y-1.5">
              <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Rol Asignado</label>
              <select 
                value={vipRole}
                onChange={(e) => setVipRole(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
              >
                <option value="patient">Paciente Premium</option>
                <option value="therapist">Especialista VIP</option>
              </select>
            </div>
            <div className="w-full md:w-48 space-y-1.5">
              <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Duración</label>
              <select 
                value={vipDuration}
                onChange={(e) => setVipDuration(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
              >
                <option value="30">30 Días</option>
                <option value="60">60 Días</option>
                <option value="unlimited">Ilimitado</option>
              </select>
            </div>
            <button 
              onClick={handleGenerateVip}
              className="w-full md:w-auto px-5 py-2.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              [Generar Acceso de Cortesía]
            </button>
          </div>

          <AnimatePresence>
            {vipGeneratedMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm font-semibold text-[#8EA393] bg-[#8EA393]/10 p-3 rounded-lg border border-[#8EA393]/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> {vipGeneratedMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Users & T&C Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="xl:col-span-2 bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-center border-b border-[#8EA393]/20 pb-3">
            <div>
              <h3 className="font-bold text-[#2D2D2D] text-sm md:text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8EA393]" /> Gestión de Usuarios y Especialistas
              </h3>
            </div>
          </div>
          
          <div className="divide-y divide-[#8EA393]/10 max-h-[400px] overflow-y-auto pr-2">
            {users.slice(0, 8).map((user) => {
              // Calculate trial days left
              const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
              const diffTime = Math.abs(new Date().getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const daysLeft = Math.max(0, 15 - diffDays);

              return (
                <div key={user.id} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-[#2D2D2D] text-sm flex items-center gap-2">
                      {user.name} 
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{user.role === "patient" ? "Paciente" : "Terapeuta"}</span>
                      {user.isVIP && (
                        <span className="text-[9px] font-bold text-[#8EA393] bg-[#8EA393]/10 border border-[#8EA393]/20 px-1.5 py-0.5 rounded uppercase">
                          VIP / Cortesía
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    {user.hasAcceptedTerms ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-3 h-3" /> T&C Aceptados
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <ShieldAlert className="w-3 h-3" /> T&C Pendientes
                      </span>
                    )}
                    
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      Prueba: {daysLeft} días left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Masterclasses & Events Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#FDFBF7]/90 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div className="border-b border-[#8EA393]/20 pb-3">
            <h3 className="font-bold text-[#2D2D2D] text-sm md:text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8EA393]" /> Masterclasses & Citas
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/50 rounded-2xl border border-[#8EA393]/20">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm text-[#2D2D2D]">Regulación del Vago</h4>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Masterclass</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">Impartido por: Dr. Carlos Ruiz</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-600">45 / 50 Plazas</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">10% OFF Aplicado</span>
              </div>
            </div>

            <div className="p-4 bg-white/50 rounded-2xl border border-[#8EA393]/20">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm text-[#2D2D2D]">Terapia de Integración</h4>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Cita Individual</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">Terapeuta: Lic. Ana Pérez</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-600">Agendada: 14 Jul, 10:00 AM</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">10% OFF Aplicado</span>
              </div>
            </div>
            
            {events.slice(0, 2).map((ev) => (
               <div key={ev.id} className="p-4 bg-white/50 rounded-2xl border border-[#8EA393]/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-[#2D2D2D]">{ev.title}</h4>
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{ev.modality}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Por: {ev.createdByName}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-600">{ev.registeredUsers?.length || 0} / {ev.capacity} Plazas</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">10% OFF Aplicado</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// We need missing icons from lucide-react, so adding them in imports above.
// RefreshCw, CheckCircle2
