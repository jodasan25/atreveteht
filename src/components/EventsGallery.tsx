import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { EventModel } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { Calendar, Clock, User, Tag, MapPin, Video, CheckCircle2 } from "lucide-react";

export default function EventsGallery() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "events"));
      const snapshot = await getDocs(q);
      const eventsList = snapshot.docs.map((doc) => ({
        ...(doc.data() as EventModel),
        id: doc.id,
      }));
      
      // If empty, supply some mock data for preview purposes
      if (eventsList.length === 0) {
        setEvents([
          {
            id: "m-1",
            title: "Masterclass: Regulación de Estrés",
            description: "Aprende a regular tu sistema nervioso con herramientas de vanguardia.",
            type: "masterclass",
            date: "2026-08-15",
            time: "18:00",
            modality: "online",
            location: "Google Meet",
            capacity: 50,
            price: 25,
            createdBy: "u-1",
            createdByName: "Dr. Carlos Ruiz",
            creatorModality: "trafico",
            registeredUsers: []
          },
          {
            id: "m-2",
            title: "Taller Somático: Conexión Corporal",
            description: "Ejercicios prácticos para reconectar con tu cuerpo y emociones.",
            type: "taller",
            date: "2026-08-20",
            time: "10:00",
            modality: "presencial",
            location: "Centro Holístico Integrativo, Madrid",
            capacity: 15,
            price: 45,
            createdBy: "u-2",
            createdByName: "Lic. Ana Pérez",
            creatorModality: "espacio",
            registeredUsers: []
          },
          {
            id: "m-3",
            title: "Terapia de Integración Colectiva",
            description: "Sesión grupal para sanar traumas colectivos y encontrar paz interior.",
            type: "sesion_grupal",
            date: "2026-08-25",
            time: "19:00",
            modality: "online",
            location: "Zoom",
            capacity: 30,
            price: 15,
            createdBy: "u-3",
            createdByName: "Dra. Laura Gómez",
            creatorModality: "trafico",
            registeredUsers: []
          }
        ]);
      } else {
        setEvents(eventsList);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      handleFirestoreError(error, OperationType.GET, "events");
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate a relevant image URL based on title
  const getImageUrl = (title: string, index: number) => {
    const keywords = ["yoga", "meditation", "therapy", "relax", "mindfulness", "health", "wellness"];
    // Use the index to pick a different keyword, and random number to avoid cache
    const kw = keywords[index % keywords.length];
    return `https://loremflickr.com/600/400/${kw}?lock=${index + 10}`;
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#8EA393]/30 border-t-[#8EA393] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#2D2D2D] flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#8EA393]" />
          Próximos Talleres y Masterclasses
        </h2>
        <p className="text-sm text-slate-500 mt-1">Explora experiencias de regulación somática y bienestar profundo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev, idx) => {
          const isTrafico = ev.creatorModality === "trafico";
          const finalPrice = isTrafico ? ev.price * 0.9 : ev.price; // 10% OFF if trafico

          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-[#FDFBF7]/80 backdrop-blur-md border border-[#8EA393]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow group"
            >
              {/* Event Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img 
                  src={getImageUrl(ev.title, idx)} 
                  alt={ev.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Modality Badge overlay */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
                  {ev.modality === "online" ? <Video className="w-3 h-3 text-[#8EA393]" /> : <MapPin className="w-3 h-3 text-[#8EA393]" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">{ev.modality}</span>
                </div>
                
                {/* 10% OFF Badge */}
                {isTrafico && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                    <Tag className="w-3 h-3" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">10% OFF</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA393] bg-[#8EA393]/10 px-2 py-0.5 rounded-md inline-block mb-2">
                    {ev.type.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-[#2D2D2D] text-lg leading-tight line-clamp-2 group-hover:text-[#8EA393] transition-colors">{ev.title}</h3>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="line-clamp-1">{ev.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(ev.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.time} H</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-[#8EA393]/20 flex items-center justify-between">
                  <div>
                    {isTrafico ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 line-through">${ev.price.toFixed(2)}</span>
                        <span className="text-lg font-extrabold text-[#2D2D2D]">${finalPrice.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-extrabold text-[#2D2D2D]">${finalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  
                  <button className="px-4 py-2 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
                    <CheckCircle2 className="w-4 h-4" /> Reservar Mi Cupo
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
