import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import { UserProfile, EventModel, ReservationModel } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { Activity, Users, DollarSign, Calendar, MessageSquare, ShieldAlert, Sparkles, Plus, AlertCircle, FileText, CheckCircle2, Wallet, Clock, Video } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import TherapistWallet from "./TherapistWallet";

const stressEvolutionData = [
  { month: "Ene", estres: 85, resiliencia: 30 },
  { month: "Feb", estres: 75, resiliencia: 45 },
  { month: "Mar", estres: 65, resiliencia: 55 },
  { month: "Abr", estres: 50, resiliencia: 68 },
  { month: "May", estres: 42, resiliencia: 75 },
  { month: "Jun", estres: 35, resiliencia: 85 },
];

const mockPatientsHistory = [
  { id: "pat-1", name: "María P.", lastSession: "2023-10-15", state: "Mejora", stateColor: "text-emerald-600 bg-emerald-50", notes: "Reducción significativa de cortisol. Mayor control parasimpático." },
  { id: "pat-2", name: "Carlos T.", lastSession: "2023-10-12", state: "Estable", stateColor: "text-[#8EA393] bg-[#8EA393]/10", notes: "Patrón de sueño mejorado. Se recomienda continuar con respiración 4-7-8." },
  { id: "pat-3", name: "Laura G.", lastSession: "2023-10-10", state: "Observación", stateColor: "text-amber-600 bg-amber-50", notes: "Episodios de taquicardia aislados. Derivada a chequeo preventivo." },
  { id: "pat-4", name: "Javier M.", lastSession: "2023-10-08", state: "Mejora", stateColor: "text-emerald-600 bg-emerald-50", notes: "Incremento en la variabilidad de la frecuencia cardíaca (HRV)." },
];

interface ProfessionalDashboardProps {
  profile: UserProfile;
  onRefreshEvents: () => void;
}

export default function ProfessionalDashboard({ profile, onRefreshEvents }: ProfessionalDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [therapistEvents, setTherapistEvents] = useState<EventModel[]>([]);
  const [reservations, setReservations] = useState<ReservationModel[]>([]);
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; date: string; replied?: boolean; replyText?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"metrics" | "events" | "services" | "community" | "patients" | "wallet">("metrics");
  const [replyInput, setReplyInput] = useState<string>("");
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Load reservations and community questions
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all events created by this therapist
        let eventsSnapshot;
        try {
          eventsSnapshot = await getDocs(collection(db, "events"));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "events");
          return;
        }
        const evsList: EventModel[] = [];
        eventsSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.createdBy === profile.id) {
            evsList.push({
              id: docSnap.id,
              title: d.title || "",
              description: d.description || "",
              type: d.type || "taller",
              date: d.date || "",
              time: d.time || "",
              modality: d.modality || "online",
              location: d.location || "",
              capacity: Number(d.capacity || 0),
              price: Number(d.price || 0),
              createdBy: d.createdBy || "",
              createdByName: d.createdByName || "",
              registeredUsers: d.registeredUsers || [],
            });
          }
        });
        setTherapistEvents(evsList);

        let reservationsSnapshot;
        try {
          reservationsSnapshot = await getDocs(collection(db, "reservations"));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "reservations");
          return;
        }
        const resList: ReservationModel[] = [];
        reservationsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          resList.push({
            id: docSnap.id,
            eventId: data.eventId,
            userId: data.userId,
            status: data.status,
            bookingCode: data.bookingCode,
            createdAt: data.createdAt,
            feedback: data.feedback,
          });
        });
        setReservations(resList);

        // Seed some mock patient questions for community tab
        setMessages([
          {
            id: "msg-1",
            user: "Carlos Gómez (Paciente)",
            text: "Hola Dra, llevo 3 días sintiendo opresión en el pecho y bruxismo severo al despertar. ¿Qué ejercicio de respiración me recomienda para regularme rápido?",
            date: "Hoy, 09:30 AM",
            replied: false,
          },
          {
            id: "msg-2",
            user: "Marta Sánchez (Paciente)",
            text: "¡Hola! Asistí a su taller del sábado pasado y fue maravilloso. Quería saber si las sesiones individuales están cubiertas por algún seguro holístico o reembolso.",
            date: "Ayer, 04:15 PM",
            replied: true,
            replyText: "Hola Marta, me alegra mucho que te gustara. Para reembolsos, emitimos factura médica oficial con mis credenciales clínicas para que puedas tramitarla con tu aseguradora.",
          },
        ]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [profile.id]);

  // Calculate metrics
  const isTraffic = profile.therapistModality === "trafico";
  const totalBookings = reservations.filter((r) => therapistEvents.some((e) => e.id === r.eventId)).length;
  
  const totalEarnings = therapistEvents.reduce((acc, ev) => {
    const registrationsCount = ev.registeredUsers?.length || 0;
    if (isTraffic) {
      const finalPrice = ev.price * 0.9; // 10% discount to user
      const netEarnings = finalPrice * 0.8; // 20% platform retention from the discounted price
      return acc + (registrationsCount * Math.max(0, netEarnings));
    } else {
      return acc + (registrationsCount * ev.price);
    }
  }, 0);

  const therapistReservationsWithFeedback = reservations.filter(
    (r) => therapistEvents.some((e) => e.id === r.eventId) && r.feedback
  );

  const handlePostReply = (msgId: string) => {
    if (!replyInput.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, replied: true, replyText: replyInput }
          : msg
      )
    );
    setReplyInput("");
    setActiveMessageId(null);
  };

  return (
    <div id="therapist-dashboard-root" className="space-y-6">
      
      {/* Bio and Validation Banner */}
      <div className="bg-gradient-to-r from-teal-600/5 to-emerald-600/5 rounded-3xl p-6 border border-[#8EA393]/30/50 flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <Logo iconSize="h-7 w-7" hideText />
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Bienvenido, {profile.name}</h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" /> Especialista Validado
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 max-w-xl">
            Tu enfoque holístico: <span className="font-semibold text-slate-700">{profile.holisticApproach || "Regulación Somática Integral"}</span>
          </p>
          <p className="text-xs text-slate-400 font-mono">Credenciales: {profile.credentials || "Reg. Sanitario N-9482-B"}</p>
        </div>

        <div className="flex gap-2 shrink-0 font-mono text-2xs md:text-xs">
          <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm text-center">
            <span className="text-slate-400 block font-bold">EVENTOS PUBLICADOS</span>
            <span className="text-base md:text-lg font-extrabold text-[#8EA393]">{therapistEvents.length}</span>
          </div>
          <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm text-center">
            <span className="text-slate-400 block font-bold">RESERVAS TOTALES</span>
            <span className="text-base md:text-lg font-extrabold text-emerald-600">{totalBookings}</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-100 pb-px gap-1 overflow-x-auto">
        {[
          { id: "metrics", label: "Métricas y Control", icon: Activity },
          { id: "agenda", label: "Mi Agenda Somática", icon: Clock },
          { id: "wallet", label: "Mi Billetera", icon: Wallet },
          { id: "patients", label: "Historial Clínico", icon: Users },
          { id: "events", label: "Gestión de Eventos", icon: Calendar },
          { id: "services", label: "Catálogo de Servicios", icon: FileText },
          { id: "community", label: "Comunidad & Preguntas", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`therapist-tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs md:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "border-[#8EA393] text-[#8EA393]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="min-h-[300px]">
        {activeTab === "agenda" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#2D2D2D] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#8EA393]" />
                    Próximas Citas (1-on-1)
                  </h3>
                  <p className="text-sm text-[#2D2D2D]/60 mt-1">
                    Gestiona tus encuentros individuales de telemedicina.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Mock data for agenda */}
                {[
                  { id: "c1", patient: "Sofía Martínez", date: "Lunes, 16 Oct", time: "11:00 AM", status: "confirmed" },
                  { id: "c2", patient: "Carlos Gómez", date: "Lunes, 16 Oct", time: "03:00 PM", status: "confirmed" },
                  { id: "c3", patient: "Andrea Rojas", date: "Martes, 17 Oct", time: "10:00 AM", status: "confirmed" },
                ].map((c) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#8EA393]/20 flex items-center justify-center text-[#8EA393] font-bold text-sm">
                        {c.patient.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[#2D2D2D] text-sm">{c.patient}</div>
                        <div className="text-xs text-[#2D2D2D]/60 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" /> {c.date} 
                          <span className="mx-1">•</span>
                          <Clock className="w-3.5 h-3.5" /> {c.time}
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-[#8EA393] hover:bg-[#7A8F7F] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                      <Video className="w-4 h-4" />
                      Iniciar Sesión Virtual
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "wallet" && (
          <TherapistWallet 
            profile={profile} 
            events={therapistEvents} 
            reservations={reservations} 
          />
        )}
        
        {activeTab === "metrics" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-[#8EA393]/10 rounded-2xl text-[#8EA393]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Asistencia Acumulada</span>
                <span className="text-2xl font-extrabold text-slate-800">{totalBookings} Alumnos</span>
                <p className="text-3xs text-slate-400 mt-1">Suscritos en tus talleres activos</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Ingresos Netos ({isTraffic ? "Tráfico" : "Espacio"})</span>
                <span className="text-2xl font-extrabold text-slate-800">${totalEarnings.toFixed(2)}</span>
                <p className="text-3xs text-slate-400 mt-1">
                  {isTraffic ? "Comisión del 20% por evento retenida automáticamente" : "Cobro mensual de $250 pendiente"}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Calificación Promedio</span>
                <span className="text-2xl font-extrabold text-slate-800">4.9 / 5.0</span>
                <p className="text-3xs text-slate-400 mt-1">Basado en 24 reseñas de pacientes</p>
              </div>
            </div>

            {/* Global statistics block */}
            <div className="md:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Análisis de Impacto en Pacientes</h4>
                <p className="text-xs text-slate-500">Mapeo del éxito terapéutico y reducción del estado simpático reportado tras tus eventos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Reducción Promedio Ansiedad", val: "-42%", desc: "Tras 1er taller somático" },
                  { label: "Retorno de Clientes", val: "78%", desc: "Compran más de 2 servicios" },
                  { label: "Tasa de Asistencia", val: "94%", desc: "Bajo índice de cancelación" },
                  { label: "Estado Calmado Reportado", val: "89%", desc: "Encuesta post-evento" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide block">{stat.label}</span>
                    <span className="text-xl font-extrabold text-[#8EA393] font-sans">{stat.val}</span>
                    <p className="text-3xs text-slate-400">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Stress Evolution Chart */}
              <div className="pt-4 border-t border-slate-100">
                <div className="mb-4">
                  <h5 className="font-bold text-slate-800 text-sm">Evolución de Estrés vs. Resiliencia (Últimos 6 meses)</h5>
                  <p className="text-xs text-slate-500">Promedio general de los pacientes atendidos.</p>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stressEvolutionData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" name="Nivel de Estrés (Simpático)" dataKey="estres" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Resiliencia (Vagal Ventral)" dataKey="resiliencia" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "patients" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800">Historial Clínico Simplificado</h4>
                <p className="text-xs text-slate-500">Pacientes y alumnos de tus talleres y sesiones</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {mockPatientsHistory.map((patient) => (
                <div key={patient.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm md:text-base">{patient.name}</h5>
                      <span className="text-xs text-slate-400 font-mono">Última sesión: {patient.lastSession}</span>
                    </div>
                    <span className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${patient.stateColor}`}>
                      {patient.state}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      <span className="text-slate-400 font-bold block mb-1 text-3xs uppercase tracking-widest">Notas Clínicas / Evolución</span>
                      {patient.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {activeTab === "patients" && therapistReservationsWithFeedback.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 mt-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800">Feedback de Sesiones Recientes</h4>
                <p className="text-xs text-slate-500">Evaluación de utilidad y mejora somática por parte de los pacientes</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {therapistReservationsWithFeedback.map((res) => {
                const event = therapistEvents.find(e => e.id === res.eventId);
                return (
                  <div key={res.id} className="py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{event?.title || "Evento"}</h5>
                        <span className="text-xs text-slate-400 font-mono">Reserva: {res.bookingCode}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5 bg-[#8EA393]/10 text-[#8EA393] px-3 py-1.5 rounded-xl border border-[#8EA393]/30/50">
                         Utilidad: <strong className="text-teal-900">{res.feedback?.utilityRating}/5</strong>
                      </span>
                      <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-100/50">
                         Mejora Somática: <strong className="text-rose-900">{res.feedback?.somaticImprovement}/5</strong>
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                        "{res.feedback?.comments}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "events" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800">Tus Talleres y Clases Activas</h4>
            </div>

            {therapistEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No has publicado ningún evento todavía. Haz clic en "Crear Evento" para empezar.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {therapistEvents.map((ev) => {
                  const registrationsCount = ev.registeredUsers?.length || 0;
                  return (
                    <div key={ev.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{ev.type}</span>
                        <h5 className="font-bold text-slate-800 text-sm md:text-base">{ev.title}</h5>
                        <p className="text-xs text-slate-400">{ev.date} - {ev.time}hs | {ev.modality === "online" ? "Virtual" : ev.location}</p>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="text-3xs font-bold text-slate-400 block uppercase">Inscritos</span>
                          <span className="text-sm font-extrabold text-slate-800">{registrationsCount} / {ev.capacity}</span>
                        </div>
                        <div>
                          <span className="text-3xs font-bold text-slate-400 block uppercase">Recaudado Neto</span>
                          <span className="text-sm font-extrabold text-emerald-600">
                            ${(registrationsCount * (isTraffic ? Math.max(0, (ev.price * 0.9) * 0.8) : ev.price)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "services" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <h4 className="font-bold text-slate-800">Catálogo de Servicios Profesionales</h4>
            <p className="text-xs text-slate-500">Configura tus terapias individuales recurrentes disponibles para reserva directa.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                { title: "Evaluación Clínico-Somática Individual", duration: "60 mins", price: "80€", desc: "Diagnóstico completo del estado del sistema nervioso con prescripción de rutinas somáticas personalizadas." },
                { title: "Mentoría de Coherencia Cardíaca Avanzada", duration: "45 mins", price: "60€", desc: "Entrenamiento individual con biofeedback clínico para optimizar la variabilidad de la frecuencia cardíaca." }
              ].map((serv, i) => (
                <div key={i} className="p-4 border border-slate-100 hover:border-[#8EA393]/30 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-800 text-sm">{serv.title}</h5>
                    <span className="text-xs font-extrabold text-[#8EA393] bg-[#8EA393]/10 px-2.5 py-1 rounded-xl">{serv.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{serv.desc}</p>
                  <div className="pt-2 border-t border-slate-100/60 text-3xs font-mono text-slate-400">
                    Duración: {serv.duration} | Canal: Videollamada Protegida
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "community" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <h4 className="font-bold text-slate-800">Consultas de la Comunidad</h4>
            <p className="text-xs text-slate-500">Resuelve dudas e interactúa de forma segura. Tus respuestas validan tu expertise clínico.</p>

            <div className="space-y-4 pt-2">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{msg.user}</span>
                    <span className="text-slate-400 font-mono">{msg.date}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                    {msg.text}
                  </p>

                  {msg.replied ? (
                    <div className="pl-4 border-l-2 border-teal-500 bg-[#8EA393]/10/20 p-3 rounded-r-xl space-y-1">
                      <div className="text-xs font-bold text-teal-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Tu Respuesta Clínica
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {msg.replyText}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeMessageId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            placeholder="Escribe tu respuesta profesional..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveMessageId(null);
                                setReplyInput("");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-2xs font-semibold rounded-lg"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handlePostReply(msg.id)}
                              className="px-4 py-1.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white text-2xs font-semibold rounded-lg"
                            >
                              Publicar Respuesta
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          id={`respond-msg-btn-${msg.id}`}
                          onClick={() => setActiveMessageId(msg.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#8EA393] hover:text-teal-800 font-semibold bg-white border border-[#8EA393]/30/60 px-3 py-1.5 rounded-lg shadow-2xs"
                        >
                          Responder Consulta
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
