import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar as CalendarIcon, MapPin, Users, DollarSign, Plus, Filter, Search, ChevronLeft, ChevronRight, Check, X, Clock, Video } from "lucide-react";
import { EventModel, EventType, EventModality } from "../types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

interface CalendarModuleProps {
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
  currentUserModality?: "espacio" | "trafico";
  selectedTagFilter: string;
  clearTagFilter: () => void;
  onBookEvent: (event: EventModel) => void;
  refreshTrigger: number;
}

const getTherapistAvatar = (name: string) => {
  if (name.includes("Lucía") || name.includes("Mendoza")) {
    // Beautiful, professional portrait matching the dark blazer, friendly, smiling specialist look of input_file_1
    return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"; 
  }
  if (name.includes("Carlos") || name.includes("Ortiz")) {
    // Highly empathetic specialist / therapist portrait
    return "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200"; 
  }
  if (name.includes("Elena") || name.includes("Rostova")) {
    // Beautiful portrait with serene natural lighting
    return "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=200&h=200"; 
  }
  return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200"; // General specialist avatar
};

const getEventCoverImage = (type: string, title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes("calma") || t.includes("sistema") || t.includes("somático") || t.includes("soma")) {
    // Couch / sofa relaxation scene (Salud Diseñada para Fluir - input_file_5)
    return "https://images.unsplash.com/photo-1595981267035-7b04ec82237e?auto=format&fit=crop&q=80&w=600&h=350"; 
  }
  if (t.includes("coherencia") || t.includes("cardíaca") || t.includes("ritmo")) {
    // Tablet with a line graph showing calming trend on wood desk next to coffee (Menos Riesgo, Más Bienestar - input_file_2)
    return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=600&h=350"; 
  }
  if (type === "retiro" || t.includes("retiro")) {
    // Woman on mountain top with hands wide open celebrating light and health (Bienestar en Plena Luz - input_file_3)
    return "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=600&h=350"; 
  }
  if (t.includes("sonido") || t.includes("cuántica") || t.includes("frecuencias")) {
    // Close-up serene breathing and peace of mind (El Alivio de Ser Escuchado - input_file_7)
    return "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600&h=350"; 
  }
  // Group / corporate meeting / collaborative health (Evolución con Esencia Humana - input_file_4)
  if (t.includes("grupal") || t.includes("comunidad") || t.includes("equipo")) {
    return "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600&h=350";
  }
  // Technology and active health apps (Tecnología que te entiende - input_file_8)
  return "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600&h=350"; 
};

export default function CalendarModule({
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserModality,
  selectedTagFilter,
  clearTagFilter,
  onBookEvent,
  refreshTrigger,
}: CalendarModuleProps) {
  // Date states for the calendar grid
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 7)); // Default to July 2026
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedQuickTag, setSelectedQuickTag] = useState<string>("all");

  // Create event form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newType, setNewType] = useState<EventType>("taller");
  const [newDate, setNewDate] = useState<string>("2026-07-07");
  const [newTime, setNewTime] = useState<string>("18:00");
  const [newModality, setNewModality] = useState<EventModality>("online");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newCapacity, setNewCapacity] = useState<number>(20);
  const [newPrice, setNewPrice] = useState<number>(35);
  const [formError, setFormError] = useState<string | null>(null);

  // Active event details view
  const [selectedEvent, setSelectedEvent] = useState<EventModel | null>(null);

  // Load events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const q = collection(db, "events");
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "events");
        throw err;
      }
      const eventsList: EventModel[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        eventsList.push({
          id: docSnap.id,
          title: data.title,
          description: data.description || "",
          type: data.type,
          date: data.date,
          time: data.time,
          modality: data.modality,
          location: data.location,
          capacity: Number(data.capacity),
          price: Number(data.price),
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          creatorModality: data.creatorModality,
          registeredUsers: data.registeredUsers || [],
        });
      });

      // If no events exist in database, seed some beautiful clinical/somatics events for demo
      if (eventsList.length === 0) {
        const seedEvents: Omit<EventModel, "id">[] = [
          {
            title: "Soma & Calma: Regulación del Sistema Nervioso",
            description: "Taller teórico-práctico de técnicas somáticas, liberación miofascial y respiración profunda para desactivar la dominancia simpática crónica.",
            type: "taller",
            date: "2026-07-08",
            time: "19:00",
            modality: "presencial",
            location: "Centro de Bienestar Integral, Madrid",
            capacity: 15,
            price: 45,
            createdBy: "admin_seed",
            createdByName: "Dra. Lucía Mendoza (Terapeuta Somática)",
            registeredUsers: [],
          },
          {
            title: "Masterclass: Coherencia Cardíaca y Estrés",
            description: "Aprende a regular la variabilidad del ritmo cardíaco (HRV) para calmar tu mente de inmediato y generar resiliencia emocional.",
            type: "masterclass",
            date: "2026-07-12",
            time: "18:00",
            modality: "online",
            location: "Enlace Zoom privado (Atrévete Virtual)",
            capacity: 100,
            price: 25,
            createdBy: "admin_seed",
            createdByName: "Dr. Carlos Ortiz (Neurólogo Integrativo)",
            registeredUsers: [],
          },
          {
            title: "Retiro Somático: El Arte de la Regeneración",
            description: "Un fin de semana completo inmerso en la naturaleza con nutrición adaptógena, baños de bosque y liberación del psoas.",
            type: "retiro",
            date: "2026-07-18",
            time: "09:00",
            modality: "presencial",
            location: "Santuario de Guadarrama, Segovia",
            capacity: 10,
            price: 180,
            createdBy: "admin_seed",
            createdByName: "Elena Rostova (Guía Holística)",
            registeredUsers: [],
          },
          {
            title: "Terapia de Sonido Cuántica",
            description: "Sesión individual de cuencos de cuarzo y frecuencias de solfeggio para sintonizar el nervio vago y promover relajación profunda.",
            type: "terapia_individual",
            date: "2026-07-15",
            time: "11:30",
            modality: "presencial",
            location: "Sala de Silencio, Barcelona",
            capacity: 1,
            price: 75,
            createdBy: "admin_seed",
            createdByName: "Dr. Carlos Ortiz (Neurólogo Integrativo)",
            registeredUsers: [],
          },
        ];

        for (const ev of seedEvents) {
          try {
            const docRef = await addDoc(collection(db, "events"), ev);
            eventsList.push({ id: docRef.id, ...ev });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, "events");
          }
        }
      }

      setEvents(eventsList);
    } catch (err) {
      console.warn("Error loading events, using mock seeds fallback:", err);
      const fallbackEvents: EventModel[] = [
        {
          id: "seed-1",
          title: "Soma & Calma: Regulación del Sistema Nervioso",
          description: "Taller teórico-práctico de técnicas somáticas, liberación miofascial y respiración profunda para desactivar la dominancia simpática crónica.",
          type: "taller",
          date: "2026-07-08",
          time: "19:00",
          modality: "presencial",
          location: "Centro de Bienestar Integral, Madrid",
          capacity: 15,
          price: 45,
          createdBy: "admin_seed",
          createdByName: "Dra. Lucía Mendoza (Terapeuta Somática)",
          registeredUsers: [],
        },
        {
          id: "seed-2",
          title: "Masterclass: Coherencia Cardíaca y Estrés",
          description: "Aprende a regular la variabilidad del ritmo cardíaco (HRV) para calmar tu mente de inmediato y generar resiliencia emocional.",
          type: "masterclass",
          date: "2026-07-12",
          time: "18:00",
          modality: "online",
          location: "Enlace Zoom privado (Atrévete Virtual)",
          capacity: 100,
          price: 25,
          createdBy: "admin_seed",
          createdByName: "Dr. Carlos Ortiz (Neurólogo Integrativo)",
          registeredUsers: [],
        },
        {
          id: "seed-3",
          title: "Retiro Somático: El Arte de la Regeneración",
          description: "Un fin de semana completo inmerso en la naturaleza con nutrición adaptógena, baños de bosque y liberación del psoas.",
          type: "retiro",
          date: "2026-07-18",
          time: "09:00",
          modality: "presencial",
          location: "Santuario de Guadarrama, Segovia",
          capacity: 10,
          price: 180,
          createdBy: "admin_seed",
          createdByName: "Elena Rostova (Guía Holística)",
          registeredUsers: [],
        },
        {
          id: "seed-4",
          title: "Terapia de Sonido Cuántica",
          description: "Sesión individual de cuencos de cuarzo y frecuencias de solfeggio para sintonizar el nervio vago y promover relajación profunda.",
          type: "terapia_individual",
          date: "2026-07-15",
          time: "11:30",
          modality: "presencial",
          location: "Sala de Silencio, Barcelona",
          capacity: 1,
          price: 75,
          createdBy: "admin_seed",
          createdByName: "Dr. Carlos Ortiz (Neurólogo Integrativo)",
          registeredUsers: [],
        }
      ];
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newTitle || !newDate || !newTime || !newLocation) {
      setFormError("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      const eventPayload: Omit<EventModel, "id"> = {
        title: newTitle,
        description: newDesc,
        type: newType,
        date: newDate,
        time: newTime,
        modality: newModality,
        location: newLocation,
        capacity: Number(newCapacity),
        price: Number(newPrice),
        createdBy: currentUserId,
        createdByName: currentUserName || "Terapeuta Validado",
        creatorModality: currentUserModality,
        registeredUsers: [],
      };

      try {
        await addDoc(collection(db, "events"), eventPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "events");
        throw err;
      }
      
      // Reset form
      setNewTitle("");
      setNewDesc("");
      setNewType("taller");
      setNewDate("2026-07-07");
      setNewTime("18:00");
      setNewModality("online");
      setNewLocation("");
      setNewCapacity(20);
      setNewPrice(35);
      setShowCreateForm(false);
      
      // Reload events list
      loadEvents();
    } catch (err: any) {
      console.error("Error creating event:", err);
      setFormError("No se pudo crear el evento. Intenta nuevamente.");
    }
  };

  // Filter events based on selections
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.createdByName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" ? true : ev.type === selectedType;
    const matchesModality = selectedModality === "all" ? true : ev.modality === selectedModality;
    
    // Support the tag filter triggered by the wellness evaluator recommendations
    const matchesTagFilter = selectedTagFilter 
      ? ev.title.toLowerCase().includes(selectedTagFilter.toLowerCase()) || 
        ev.description.toLowerCase().includes(selectedTagFilter.toLowerCase())
      : true;

    // Quick tag filter
    let matchesQuickTag = true;
    if (selectedQuickTag !== "all") {
      const titleLower = ev.title.toLowerCase();
      const descLower = ev.description.toLowerCase();
      
      if (selectedQuickTag === "neuro") {
        matchesQuickTag = titleLower.includes("neuro") || titleLower.includes("regulación") || titleLower.includes("sistema") || titleLower.includes("nervioso") || titleLower.includes("coherencia") ||
                          descLower.includes("neuro") || descLower.includes("regulación") || descLower.includes("sistema") || descLower.includes("nervioso") || descLower.includes("coherencia");
      } else if (selectedQuickTag === "somatic") {
        matchesQuickTag = titleLower.includes("somática") || titleLower.includes("somático") || titleLower.includes("soma") ||
                          descLower.includes("somática") || descLower.includes("somático") || descLower.includes("soma");
      } else if (selectedQuickTag === "masterclass") {
        matchesQuickTag = ev.type === "masterclass" || titleLower.includes("masterclass") || descLower.includes("masterclass");
      }
    }

    return matchesSearch && matchesType && matchesModality && matchesTagFilter && matchesQuickTag;
  });

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Array(31).fill(null).map((_, i) => new Date(year, month, i + 1)).filter((d) => d.getMonth() === month);
  };

  const daysOfCurrentMonth = getDaysInMonth(currentDate);
  const startDayOffset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust starting offset to make Monday first
  const adjustedOffset = startDayOffset === 0 ? 6 : startDayOffset - 1;

  const navigateMonth = (direction: "next" | "prev") => {
    const shift = direction === "next" ? 1 : -1;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + shift, 1));
  };

  const getEventsForDay = (day: Date) => {
    const dateStr = day.toISOString().split("T")[0];
    return events.filter((ev) => ev.date === dateStr);
  };

  const formattedMonthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const getEventBgColor = (type: EventType) => {
    switch (type) {
      case "taller": return "bg-[#8EA393]/10 text-[#8EA393] hover:bg-teal-100/80 border-[#8EA393]/30";
      case "masterclass": return "bg-sky-50 text-sky-700 hover:bg-sky-100/80 border-sky-100";
      case "retiro": return "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border-amber-100";
      case "sesion_grupal": return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border-indigo-100";
      case "terapia_individual": return "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border-rose-100";
    }
  };

  const mapTypeLabel = (type: EventType) => {
    switch (type) {
      case "taller": return "Taller Clínico-Somático";
      case "masterclass": return "Masterclass Especializada";
      case "retiro": return "Retiro de Bienestar";
      case "sesion_grupal": return "Sesión Grupal Reguladora";
      case "terapia_individual": return "Sesión Individual Clínica";
    }
  };

  return (
    <div id="calendar-module-root" className="space-y-6">
      
      {/* Search and Filters Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="event-search-input"
              type="text"
              placeholder="Buscar talleres, terapias, especialistas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-teal-500 rounded-2xl text-sm transition-all focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Category / Type Select */}
            <select
              id="event-category-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-xs md:text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="all">Todas las Categorías</option>
              <option value="taller">Talleres</option>
              <option value="masterclass">Masterclasses</option>
              <option value="retiro">Retiros de Bienestar</option>
              <option value="sesion_grupal">Sesiones Grupales</option>
              <option value="terapia_individual">Terapias Individuales</option>
            </select>

            {/* Modality Select */}
            <select
              id="event-modality-select"
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-xs md:text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="all">Cualquier Modalidad</option>
              <option value="online">Online / Virtual</option>
              <option value="presencial">Presencial / Físico</option>
            </select>

            {/* Create Event Button for Therapists */}
            {(currentUserRole === "therapist" || currentUserRole === "admin") && (
              <button
                id="toggle-create-event-form-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-semibold rounded-xl text-xs md:text-sm transition-all shadow-sm shadow-teal-600/10"
              >
                <Plus className="w-4 h-4" /> Crear Evento
              </button>
            )}
          </div>
        </div>

        {/* Quick Tag Filters */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0 uppercase tracking-wider font-mono">
            <Filter className="w-3.5 h-3.5 text-[#8EA393]" /> Filtrado Rápido:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "✨ Todo", color: "bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-300" },
              { id: "neuro", label: "🧠 Neuro-regulación", color: "bg-purple-50 border-purple-100 hover:bg-purple-100/70 text-purple-700 border" },
              { id: "somatic", label: "🌱 Somática", color: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70 text-emerald-700 border" },
              { id: "masterclass", label: "🎓 Masterclass", color: "bg-blue-50 border-blue-100 hover:bg-blue-100/70 text-blue-700 border" },
            ].map((tag) => {
              const isActive = selectedQuickTag === tag.id;
              return (
                <button
                  key={tag.id}
                  id={`quick-tag-${tag.id}`}
                  type="button"
                  onClick={() => setSelectedQuickTag(tag.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? "bg-[#8EA393] border border-teal-600 text-white shadow-sm scale-102" 
                      : `${tag.color}`
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI recommended Filter active */}
        {selectedTagFilter && (
          <div className="inline-flex items-center gap-2.5 bg-[#8EA393]/10 border border-[#8EA393]/30 text-teal-800 text-xs md:text-sm px-4 py-2 rounded-xl">
            <span className="font-semibold">Filtro Inteligente:</span>
            <span>Talleres recomendados para calmar tu sistema</span>
            <button id="clear-ai-filter-btn" onClick={clearTagFilter} className="text-teal-500 hover:text-teal-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateEvent} className="bg-white border border-[#8EA393]/30 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#8EA393]" /> Publicar Nuevo Evento o Taller
                </h3>
                <button
                  type="button"
                  id="close-create-form-btn"
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Título del Evento *</label>
                  <input
                    id="new-event-title"
                    type="text"
                    required
                    placeholder="Ej. Taller de Coherencia Cardíaca para Estrés"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Categoría del Evento *</label>
                  <select
                    id="new-event-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="taller">Taller Clínico-Somático</option>
                    <option value="masterclass">Masterclass Especializada</option>
                    <option value="retiro">Retiro de Bienestar</option>
                    <option value="sesion_grupal">Sesión Grupal</option>
                    <option value="terapia_individual">Terapia Individual</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Descripción del Taller / Enfoque Clínico</label>
                  <textarea
                    id="new-event-desc"
                    rows={3}
                    placeholder="Describe los beneficios para el sistema nervioso, dinámicas y metodologías holísticas aplicadas..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha *</label>
                  <input
                    id="new-event-date"
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hora de Inicio *</label>
                  <input
                    id="new-event-time"
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modalidad *</label>
                  <select
                    id="new-event-modality"
                    value={newModality}
                    onChange={(e) => setNewModality(e.target.value as EventModality)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="online">Online (Virtual)</option>
                    <option value="presencial">Presencial (Ubicación física)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Enlace o Dirección Física *</label>
                  <input
                    id="new-event-location"
                    type="text"
                    required
                    placeholder="Ej. Enlace de Zoom o C/ Gran Vía 42, Madrid"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacidad Máxima *</label>
                  <input
                    id="new-event-capacity"
                    type="number"
                    min="1"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Precio de Entrada (€) *</label>
                  <input
                    id="new-event-price"
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  id="cancel-create-btn"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="submit-create-event-btn"
                  className="px-6 py-2.5 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-600/10"
                >
                  Publicar Evento
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Calendar Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Calendar View representation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 capitalize">
              {formattedMonthName}
            </h3>
            <div className="flex items-center gap-1">
              <button
                id="prev-month-btn"
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                id="next-month-btn"
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Start day offsets */}
            {Array.from({ length: adjustedOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="aspect-square bg-slate-50/20 rounded-2xl" />
            ))}

            {/* Calendar Days */}
            {daysOfCurrentMonth.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square p-2.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    isToday
                      ? "bg-[#8EA393]/10/20 border-teal-200"
                      : "bg-slate-50/10 border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className={`text-xs md:text-sm font-bold leading-none ${
                    isToday ? "text-[#8EA393]" : "text-slate-500"
                  }`}>
                    {day.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <button
                          key={ev.id}
                          id={`calendar-event-dot-${ev.id}`}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left truncate text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getEventBgColor(ev.type)}`}
                        >
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayEvents.length - 2} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Event details or Global Events list */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          {selectedEvent ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEventBgColor(selectedEvent.type)}`}>
                  {mapTypeLabel(selectedEvent.type)}
                </span>
                <button
                  id="deselect-event-btn"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Premium Event Cover Image */}
              <div className="w-full h-40 overflow-hidden rounded-2xl relative shadow-sm group-hover:shadow-md transition-all duration-300">
                <img
                  src={getEventCoverImage(selectedEvent.type, selectedEvent.title)}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={getTherapistAvatar(selectedEvent.createdByName)}
                  alt={selectedEvent.createdByName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-lg font-bold text-slate-800 leading-snug">{selectedEvent.title}</h4>
                  <p className="text-xs text-[#8EA393] font-semibold mt-0.5 flex items-center gap-1">
                    Por {selectedEvent.createdByName}
                  </p>
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100/60">
                {selectedEvent.description}
              </p>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Fecha y Hora</p>
                    <p>{new Date(selectedEvent.date).toLocaleDateString("es-ES", { dateStyle: "long" })} - {selectedEvent.time}hs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    {selectedEvent.modality === "online" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Ubicación / Modalidad</p>
                    <p className="capitalize">{selectedEvent.modality} - {selectedEvent.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Aforo / Cupos Disponibles</p>
                    <p>{selectedEvent.capacity - (selectedEvent.registeredUsers?.length || 0)} plazas disponibles (Máx. {selectedEvent.capacity})</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block">Inversión</span>
                  <span className="text-2xl font-extrabold text-slate-800">{selectedEvent.price}€</span>
                </div>
                
                <button
                  id={`book-event-btn-${selectedEvent.id}`}
                  onClick={() => onBookEvent(selectedEvent)}
                  disabled={(selectedEvent.registeredUsers?.length || 0) >= selectedEvent.capacity}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                    (selectedEvent.registeredUsers?.length || 0) >= selectedEvent.capacity
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#8EA393] hover:bg-[#7A8F7F] text-white shadow-teal-600/15"
                  }`}
                >
                  {(selectedEvent.registeredUsers?.length || 0) >= selectedEvent.capacity ? "Agotado" : "Reservar Plaza"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 h-full flex flex-col">
              <div>
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#8EA393]" /> Próximos Eventos Disponibles
                </h4>
                <p className="text-xs text-slate-400">Filtrados según tus preferencias</p>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-sm">
                  Cargando catálogo...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No se encontraron eventos</p>
                  <p className="text-xs mt-1">Prueba a cambiar tus criterios de búsqueda o filtro.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {filteredEvents.map((ev) => (
                    <button
                      key={ev.id}
                      id="calendar-event-card"
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left p-4 rounded-2xl border border-[#EAEAEA] bg-[#F3F3F3] hover:bg-[#EAEAEA] hover:border-teal-300 flex items-start gap-3.5 transition-all group shadow-sm font-sans"
                    >
                      <img
                        src={getTherapistAvatar(ev.createdByName)}
                        alt={ev.createdByName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 font-sans">
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEventBgColor(ev.type)}`}>
                            {ev.type}
                          </span>
                          <div className="text-right">
                            {ev.creatorModality === "trafico" ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 rounded uppercase mb-0.5">10% OFF</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-slate-400 line-through">${ev.price}</span>
                                  <span className="text-xs font-bold text-[#8EA393]">${(ev.price * 0.9).toFixed(2)}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-[#2D2D2D]">${ev.price}</span>
                            )}
                          </div>
                        </div>
                        <h5 className="font-bold text-[#2D2D2D] text-xs md:text-sm group-hover:text-[#8EA393] transition-colors mt-1.5 line-clamp-1">{ev.title}</h5>
                        <p className="text-[10px] text-slate-600 flex items-center gap-1.5 mt-1 font-sans">
                          <Clock className="w-3 h-3 text-slate-400" /> {ev.date} a las {ev.time}hs
                        </p>
                        <p className="text-[10px] text-slate-600 flex items-center gap-1.5 font-sans">
                          {ev.modality === "online" ? <Video className="w-3 h-3 text-slate-400" /> : <MapPin className="w-3 h-3 text-slate-400" />}
                          <span className="truncate max-w-[180px]">{ev.location}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
