import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Heart,
  Brain,
  Calendar as CalendarIcon,
  User,
  Shield,
  LogOut,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Mail,
  Lock,
  Moon,
  Clock,
  BriefcaseMedical,
  ShieldAlert,
  FileText,
  Bell
} from "lucide-react";
import { UserProfile, EventModel, AssessmentModel, ReservationModel, UserRole } from "./types";
import { db, auth, handleFirestoreError, OperationType, getFirebaseMessaging } from "./lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";

// Component imports
import Logo from "./components/Logo";
import NervousSystemEvaluator from "./components/NervousSystemEvaluator";
import SomaticEvolutionChart from "./components/SomaticEvolutionChart";
import CalendarModule from "./components/CalendarModule";
import BookingModal from "./components/BookingModal";
import SessionFeedbackModal from "./components/SessionFeedbackModal";
import ProfessionalDashboard from "./components/ProfessionalDashboard";
import AdminPanel from "./components/AdminPanel";
import AppointmentCalendar from "./components/AppointmentCalendar";
import PatientPaywall from "./components/PatientPaywall";
import TherapistPaywall from "./components/TherapistPaywall";
import EventsGallery from "./components/EventsGallery";
import EmotionalGym from "./components/EmotionalGym";
import SpecialistProfile from "./components/SpecialistProfile";
import LandingPage from "./components/LandingPage";
import { dbPool } from "./config/db";

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Login / Register Form States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authRole, setAuthRole] = useState<UserRole>("patient");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authVipCode, setAuthVipCode] = useState<string>("");
  const [showVipInput, setShowVipInput] = useState<boolean>(false);

  // Therapist validation form fields
  const [credentials, setCredentials] = useState<string>("");
  const [holisticApproach, setHolisticApproach] = useState<string>("");
  const [therapistModality, setTherapistModality] = useState<"espacio" | "trafico">("espacio");

  // Terms and Conditions states
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showTermsWarning, setShowTermsWarning] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Global state triggers
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"landing" | "dashboard" | "calendar" | "professional" | "admin" | "appointment-preview" | "events-gallery" | "emotional-gym" | "specialist-profile">("landing");
  const [bookingEvent, setBookingEvent] = useState<EventModel | null>(null);
  const [refreshEventsTrigger, setRefreshEventsTrigger] = useState<number>(0);

  // Users assessments list
  const [assessmentsHistory, setAssessmentsHistory] = useState<AssessmentModel[]>([]);
  // User reservations list
  const [userReservations, setUserReservations] = useState<(ReservationModel & { eventTitle?: string, eventDate?: string, eventTime?: string })[]>([]);
  const [feedbackReservation, setFeedbackReservation] = useState<(ReservationModel & { eventTitle?: string }) | null>(null);

  // Paywall simulation toggles
  const [simulatePatientPaywall, setSimulatePatientPaywall] = useState<boolean>(false);
  const [simulateTherapistPaywall, setSimulateTherapistPaywall] = useState<boolean>(false);

  // Notifications system
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: "success" | "info" }[]>([]);

  const addToast = (title: string, message: string, type: "success" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const setupNotifications = async (uid: string) => {
    try {
      if (!('Notification' in window)) return;
      
      const msg = await getFirebaseMessaging();
      if (!msg) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          const currentToken = await getToken(msg, { vapidKey: "BPJ8-l9lS_Qj_YF91rRRYY8L_rI0l5V2vS9yE_" }); // Replace with real VAPID key if in production
          if (currentToken) {
            await updateDoc(doc(db, "users", uid), { fcmToken: currentToken });
          }
        } catch (err) {
          console.warn("Failed to get FCM token, using fallback notifications:", err);
        }

        onMessage(msg, (payload) => {
          addToast(payload.notification?.title || "Nueva Notificación", payload.notification?.body || "", "info");
        });
      }
    } catch (error) {
      console.warn("Notification setup failed", error);
    }
  };

  // Background Notification Simulation for Reminders and Feedback
  useEffect(() => {
    if (!currentUser || userProfile?.role !== "patient") return;

    // Check for feedback
    if (feedbackReservation && feedbackReservation.feedback && !feedbackReservation.feedback.comments.includes("Notified")) {
      if (Notification.permission === 'granted') {
        new Notification("Feedback Recibido", {
          body: `El terapeuta ha dejado feedback para tu sesión de ${feedbackReservation.eventTitle}`
        });
        addToast("Feedback Recibido", `El terapeuta ha dejado feedback para tu sesión de ${feedbackReservation.eventTitle}`, "success");
      }
    }

    // Check for upcoming events (Simulating by checking if any event is today)
    const today = new Date().toISOString().split('T')[0];
    const upcoming = userReservations.find(r => r.eventDate === today && r.status === "confirmed");
    if (upcoming && Notification.permission === 'granted') {
      const notificationKey = `notified_${upcoming.id}`;
      if (!localStorage.getItem(notificationKey)) {
        new Notification("Recordatorio de Evento", {
          body: `Tienes un evento programado para hoy: ${upcoming.eventTitle} a las ${upcoming.eventTime}`
        });
        localStorage.setItem(notificationKey, "true");
        addToast("Recordatorio", `Tu evento ${upcoming.eventTitle} es hoy a las ${upcoming.eventTime}.`, "info");
      }
    }
  }, [feedbackReservation, userReservations, currentUser, userProfile]);

  // Monitor Auth Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        // Load or create Firestore profile
        const profileRef = doc(db, "users", user.uid);
        let docSnap;
        try {
          docSnap = await getDoc(profileRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
          return;
        }

        if (docSnap && docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.role === "therapist" || profileData.role === "especialista") {
            setActiveTab("professional");
          } else if (profileData.role === "admin") {
            setActiveTab("admin");
          } else {
            setActiveTab("landing");
          }
          setupNotifications(user.uid);
        } else {
          // If no profile exists yet (e.g. anonymous or missing doc), seed one
          const newProfile: UserProfile = {
            id: user.uid,
            email: user.email || "anonimo@atrevetehealth.com",
            name: "Invitado Holístico",
            role: "patient",
            createdAt: new Date().toISOString(),
            isApproved: false,
            habits: [
              { date: "2026-07-04", stressLevel: 8, hoursSleep: 5.5, nutritionalRating: 4, symptoms: ["Bruxismo", "Palpitaciones"] },
              { date: "2026-07-05", stressLevel: 7, hoursSleep: 6, nutritionalRating: 6, symptoms: ["Mente acelerada"] },
              { date: "2026-07-06", stressLevel: 5, hoursSleep: 7, nutritionalRating: 8, symptoms: [] }
            ]
          };
          try {
            await setDoc(profileRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
          setUserProfile(newProfile);
          setActiveTab("landing");
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        // Auto sign-in anonymously for testing experience as patient if not logged in
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Anonymous authentication failed, setting up a mock offline user session as fallback:", err);
          // Set up a mock guest user offline session so the application can be previewed without blockages
          const fallbackUid = "guest_offline_user";
          const fallbackUser = {
            uid: fallbackUid,
            isAnonymous: true,
            email: "anonimo@atrevetehealth.com"
          };
          setCurrentUser(fallbackUser);
          
          const fallbackProfile: UserProfile = {
            id: fallbackUid,
            email: "anonimo@atrevetehealth.com",
            name: "Invitado Holístico (Demo)",
            role: "patient",
            createdAt: new Date().toISOString(),
            isApproved: true,
            credentials: "",
            holisticApproach: "",
            habits: [
              { date: "2026-07-04", stressLevel: 8, hoursSleep: 5.5, nutritionalRating: 4, symptoms: ["Bruxismo", "Palpitaciones"] },
              { date: "2026-07-05", stressLevel: 7, hoursSleep: 6, nutritionalRating: 6, symptoms: ["Mente acelerada"] },
              { date: "2026-07-06", stressLevel: 5, hoursSleep: 7, nutritionalRating: 8, symptoms: [] }
            ]
          };
          setUserProfile(fallbackProfile);
          setActiveTab("landing");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch assessments and tickets for current user
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        if (currentUser.uid === "guest_offline_user") {
          const localAssessments = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
          setAssessmentsHistory(localAssessments);

          const localReservations = JSON.parse(localStorage.getItem("offline_reservations") || "[]");
          setUserReservations(localReservations);
          return;
        }

        // Load Assessments
        let assessmentsSnap;
        try {
          assessmentsSnap = await getDocs(collection(db, "assessments"));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "assessments");
          return;
        }
        const myAssessments: AssessmentModel[] = [];
        assessmentsSnap.forEach((snap) => {
          const d = snap.data();
          if (d.userId === currentUser.uid) {
            myAssessments.push(d as AssessmentModel);
          }
        });
        setAssessmentsHistory(myAssessments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Load Reservations
        let resSnap;
        try {
          resSnap = await getDocs(collection(db, "reservations"));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "reservations");
          return;
        }
        const myRes: ReservationModel[] = [];
        resSnap.forEach((snap) => {
          const d = snap.data();
          if (d.userId === currentUser.uid) {
            myRes.push(d as ReservationModel);
          }
        });

        // Load Events details for tickets
        let eventsSnap;
        try {
          eventsSnap = await getDocs(collection(db, "events"));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, "events");
          return;
        }
        const eventsMap: { [id: string]: EventModel } = {};
        eventsSnap.forEach((snap) => {
          eventsMap[snap.id] = snap.data() as EventModel;
        });

        const detailedReservations = myRes.map((r) => ({
          ...r,
          eventTitle: eventsMap[r.eventId]?.title || "Taller Somático",
          eventDate: eventsMap[r.eventId]?.date || "2026-07-07",
          eventTime: eventsMap[r.eventId]?.time || "18:00",
        }));

        setUserReservations(detailedReservations);
      } catch (err) {
        console.warn("Error loading user historical data:", err);
      }
    };

    fetchUserData();
  }, [currentUser, refreshEventsTrigger]);

  // Notifications system: Real-time listener for patients
  useEffect(() => {
    if (!currentUser || currentUser.uid === "guest_offline_user") return;
    
    let initialLoadAssessments = true;
    let initialLoadReservations = true;

    const qAssessments = query(collection(db, "assessments"), where("userId", "==", currentUser.uid));
    const unsubscribeAssessments = onSnapshot(qAssessments, (snapshot) => {
      if (initialLoadAssessments) {
        initialLoadAssessments = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          addToast("Evaluación Somática", "Tienes un nuevo diagnóstico somático disponible.", "info");
        } else if (change.type === "modified") {
          addToast("Actualización de Evaluación", "Tu estado somático ha sido actualizado.", "info");
        }
      });
    });

    const qReservations = query(collection(db, "reservations"), where("userId", "==", currentUser.uid));
    const unsubscribeReservations = onSnapshot(qReservations, (snapshot) => {
      if (initialLoadReservations) {
        initialLoadReservations = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          addToast("Nueva Reserva Confirmada", `Tu reserva ${change.doc.data().bookingCode} ha sido confirmada con éxito.`, "success");
        }
      });
    });

    return () => {
      unsubscribeAssessments();
      unsubscribeReservations();
    };
  }, [currentUser]);

  // Auth operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === "register") {
      if (!termsAccepted) {
        setShowTermsWarning(true);
        return;
      }
      
      if (!authEmail || !authPassword || !authName) {
        setAuthError("Por favor completa todos los campos.");
        return;
      }
      try {
        const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        
        const isValidVip = authVipCode.trim().length > 0;
        if (isValidVip) {
          localStorage.setItem(`vip_${credential.user.uid}`, 'true');
        }

        const profilePayload: UserProfile = {
          id: credential.user.uid,
          email: authEmail,
          name: authName,
          role: authRole,
          createdAt: new Date().toISOString(),
          isApproved: authRole === "therapist" ? (isValidVip ? true : false) : true,
          isVIP: isValidVip,
          credentials: authRole === "therapist" ? credentials : "",
          holisticApproach: authRole === "therapist" ? holisticApproach : "",
          therapistModality: (authRole === "therapist" || authRole === "especialista") ? therapistModality : undefined,
          habits: authRole === "patient" ? [
            { date: "2026-07-04", stressLevel: 8, hoursSleep: 5, nutritionalRating: 5, symptoms: ["Insomnio", "Bruxismo"] },
            { date: "2026-07-05", stressLevel: 7, hoursSleep: 6, nutritionalRating: 6, symptoms: ["Mente acelerada"] },
            { date: "2026-07-06", stressLevel: 5, hoursSleep: 7, nutritionalRating: 8, symptoms: [] }
          ] : [],
          termsAcceptedDate: new Date().toISOString(),
          termsVersion: "2.0-Blindada"
        };

        try {
          await setDoc(doc(db, "users", credential.user.uid), profilePayload);
          
          // Simulando uso de Pooling en la DB Postgres Backend
          try {
            const client = await dbPool.connect();
            await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [credential.user.uid, authName, authEmail]);
            client.release();
          } catch (dbErr) {
            console.error("Pooling connection error", dbErr);
          }
          
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
          throw err;
        }
        setUserProfile(profilePayload);
        setShowAuthModal(false);
      } catch (err: any) {
        setAuthError("No se pudo registrar. Verifica tus datos o si el email ya existe.");
      }
    } else {
      if (!authEmail || !authPassword) {
        setAuthError("Por favor ingresa tu email y contraseña.");
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setShowAuthModal(false);
      } catch (err: any) {
        setAuthError("Credenciales incorrectas. Intenta nuevamente.");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    // Refresh page / state cleanly
    window.location.reload();
  };

  // Helper to switch preview role instantly for demo/reviewing purposes
  const handleInstantRoleSwitch = async (targetRole: UserRole) => {
    if (!currentUser) return;
    try {
      const isAppr = targetRole === "therapist" || targetRole === "admin";
      const updatedProfile: Partial<UserProfile> = {
        role: targetRole,
        isApproved: isAppr,
        name: targetRole === "patient" ? "Paciente Ejemplo" : targetRole === "therapist" ? "Dra. Sofía Alarcón" : "Admin Principal",
        credentials: targetRole === "therapist" ? "N-Colegiado 842-S" : "",
        holisticApproach: targetRole === "therapist" ? "Neurología Funcional y Regulación Somática" : ""
      };
      if (currentUser.uid !== "guest_offline_user") {
        const userRef = doc(db, "users", currentUser.uid);
        try {
          await updateDoc(userRef, updatedProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          return;
        }
      }
      setUserProfile((prev) => prev ? { ...prev, ...updatedProfile } as UserProfile : null);
      if (targetRole === "patient") setActiveTab("dashboard");
      if (targetRole === "therapist") setActiveTab("professional");
      if (targetRole === "admin") setActiveTab("admin");
      setRefreshEventsTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error switching preview role:", err);
    }
  };

  // --- TRIAL LOGIC FOR PATIENTS ---
  const isPatient = userProfile?.role === "patient";
  const trialStartDate = userProfile?.createdAt ? new Date(userProfile.createdAt) : new Date();
  const now = new Date();
  const diffMs = now.getTime() - trialStartDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const trialDaysRemaining = Math.max(0, 15 - Math.floor(diffDays));
  
  const localVipStatus = userProfile ? localStorage.getItem(`vip_${userProfile.id}`) : null;
  const isActuallyVIP = userProfile?.isVIP || localVipStatus === 'true';

  const isTrialExpired = !isActuallyVIP && ((isPatient && trialDaysRemaining <= 0) || simulatePatientPaywall);
  const isTherapistSpaceExpired = !isActuallyVIP && (userProfile?.role === "therapist" && userProfile?.therapistModality === "espacio" && simulateTherapistPaywall);

  return (
    <div id="atrevete-app-container" className="min-h-screen bg-slate-50/50 text-slate-800 font-sans flex flex-col selection:bg-[#8EA393]/100/10 selection:text-teal-900">
      
      {/* Floating Demo Sandbox Mode banner for easy assessment */}
      <div id="sandbox-preview-bar" className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap gap-3 items-center justify-between text-2xs md:text-xs font-mono font-bold border-b border-slate-800 shrink-0">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Sparkles className="w-4 h-4 animate-spin-slow" /> ENTORNO EVALUATIVO DE SOLUCIONES IA
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden lg:inline">SIMULAR PAYWALL:</span>
          <button
            onClick={() => setSimulatePatientPaywall(!simulatePatientPaywall)}
            className={`px-3 py-1 rounded-lg transition-all ${simulatePatientPaywall ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Paciente Vencido
          </button>
          <button
            onClick={() => setSimulateTherapistPaywall(!simulateTherapistPaywall)}
            className={`px-3 py-1 rounded-lg transition-all ${simulateTherapistPaywall ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Espacio Inactivo
          </button>
          <div className="w-px h-4 bg-slate-700 mx-2 hidden sm:block"></div>
          <span className="text-slate-400 hidden lg:inline">PROBAR VISTAS INSTANTÁNEAMENTE:</span>
          <button
            onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
            className={`px-3 py-1 rounded-lg transition-all bg-slate-800 text-slate-300 hover:bg-slate-700`}
          >
            [Ir a Registro]
          </button>
          <button
            id="role-switch-patient-btn"
            onClick={() => { handleInstantRoleSwitch("patient"); setShowAuthModal(false); }}
            className={`px-3 py-1 rounded-lg transition-all ${
              userProfile?.role === "patient" ? "bg-[#8EA393] text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            [Ir a Dashboard Usuario]
          </button>
          <button
            id="role-switch-therapist-btn"
            onClick={() => { handleInstantRoleSwitch("therapist"); setShowAuthModal(false); }}
            className={`px-3 py-1 rounded-lg transition-all ${
              (userProfile?.role === "therapist" || userProfile?.role === "especialista") ? "bg-[#8EA393] text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            [Ir a Dashboard Terapeuta]
          </button>
          <button
            onClick={() => { setActiveTab("appointment-preview"); setShowAuthModal(false); }}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === "appointment-preview" ? "bg-[#8EA393] text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            [Ver Calendario Citas]
          </button>
          <button
            onClick={() => { handleInstantRoleSwitch("admin"); setShowAuthModal(false); setActiveTab("admin"); }}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              activeTab === "admin" ? "bg-amber-500 text-white" : "bg-slate-800 text-amber-500 hover:bg-slate-700"
            }`}
          >
            [Ir a Panel Admin]
          </button>
          <button
            onClick={() => { handleInstantRoleSwitch("patient"); setShowAuthModal(false); setActiveTab("events-gallery"); }}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              activeTab === "events-gallery" ? "bg-purple-500 text-white" : "bg-slate-800 text-purple-400 hover:bg-slate-700"
            }`}
          >
            [Ver Sección Talleres]
          </button>
          <button
            onClick={() => { handleInstantRoleSwitch("patient"); setShowAuthModal(false); setActiveTab("emotional-gym"); }}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              activeTab === "emotional-gym" ? "bg-[#8EA393] text-white" : "bg-slate-800 text-[#8EA393] hover:bg-slate-700"
            }`}
          >
            [Ir a Gimnasio Emocional]
          </button>
          <button
            onClick={() => { handleInstantRoleSwitch("patient"); setShowAuthModal(false); setActiveTab("specialist-profile"); }}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              activeTab === "specialist-profile" ? "bg-[#8EA393] text-white" : "bg-slate-800 text-[#8EA393] hover:bg-slate-700"
            }`}
          >
            [Ver Perfil Especialista]
          </button>
          <button
            onClick={() => { handleInstantRoleSwitch("patient"); setShowAuthModal(false); setActiveTab("landing"); }}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              activeTab === "landing" ? "bg-[#8EA393] text-white" : "bg-slate-800 text-[#8EA393] hover:bg-slate-700"
            }`}
          >
            [Ir a Portada Principal]
          </button>
        </div>
      </div>

      {/* Main navigation Header */}
      <header id="app-main-header" className="bg-[#8EA393]/100 border-b border-[#8EA393]/30 py-4 px-6 md:px-12 flex justify-between items-center shrink-0 shadow-sm">
        <Logo light={true} className="mr-[15px]" />

        {/* Global tab options */}
        <nav className="hidden lg:flex items-center gap-2 text-xs md:text-sm font-bold">
          {userProfile?.role === "patient" && (
            <button
              id="nav-dashboard-tab"
              onClick={() => setActiveTab("dashboard")}
              className={`px-4.5 py-2 rounded-xl transition-all ${
                activeTab === "dashboard" ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Mi Salud Somática
            </button>
          )}

          <button
            id="nav-calendar-tab"
            onClick={() => setActiveTab("calendar")}
            className={`px-4.5 py-2 rounded-xl transition-all ${
              activeTab === "calendar" ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Calendario de Eventos
          </button>

          {(userProfile?.role === "therapist" || userProfile?.role === "especialista") && (
            <button
              id="nav-professional-tab"
              onClick={() => setActiveTab("professional")}
              className={`px-4.5 py-2 rounded-xl transition-all ${
                activeTab === "professional" ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Control Profesional
            </button>
          )}

          {userProfile?.role === "admin" && (
            <button
              id="nav-admin-tab"
              onClick={() => setActiveTab("admin")}
              className={`px-4.5 py-2 rounded-xl transition-all ${
                activeTab === "admin" ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              Moderación Admin
            </button>
          )}
        </nav>

        {/* Auth status panel */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block">{userProfile.name}</span>
                <span className="text-[10px] text-teal-100/80 font-bold block uppercase tracking-wider font-mono">
                  Rol: {userProfile.role}
                </span>
              </div>
              <button
                id="enable-notifications-btn"
                onClick={() => setupNotifications(currentUser.uid)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
                title="Habilitar notificaciones"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                id="sign-out-btn"
                onClick={handleSignOut}
                className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-100 rounded-xl transition-all border border-white/10"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="open-auth-modal-btn"
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
              }}
              className="px-4.5 py-2.5 bg-white hover:bg-[#8EA393]/10 text-teal-800 font-bold rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-4 h-4" /> Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </header>

      {/* Trial Banner for Patients */}
      {isPatient && (
        <div className={`shrink-0 text-center py-2 px-4 text-xs font-bold ${isTrialExpired ? 'bg-red-500 text-white' : 'bg-[#8EA393]/10 text-teal-800 border-b border-[#8EA393]/30'}`}>
          {isTrialExpired ? (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              Tu periodo de prueba ha expirado. Para continuar realizando evaluaciones, suscríbete.
              <button className="px-3 py-1 bg-white text-red-600 rounded-md font-extrabold text-xs shadow-sm hover:bg-slate-50 transition-colors">
                Suscribirse por $5/mes
              </button>
            </div>
          ) : (
            <span>
              Periodo de prueba activo: te quedan <span className="font-extrabold">{trialDaysRemaining}</span> días.
            </span>
          )}
        </div>
      )}

      {/* Main Workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Activity className="w-10 h-10 text-[#8EA393] animate-pulse" />
            <p className="text-sm font-semibold text-slate-500">Iniciando portal seguro integrativo...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* 0. LANDING PAGE VIEW */}
            {activeTab === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <LandingPage 
                  onStartTest={() => { setAuthMode("register"); setShowAuthModal(true); }}
                  onJoinSpecialist={() => { setAuthRole("therapist"); setAuthMode("register"); setShowAuthModal(true); }}
                />
              </motion.div>
            )}

            {/* 1. PATIENT / CLINICAL WORKSPACE VIEW */}
            {activeTab === "dashboard" && userProfile?.role === "patient" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {isTrialExpired ? (
                  <PatientPaywall onSubscribe={() => console.log('Suscrito')} />
                ) : (
                  <>
                    {/* Header / IA Status block matching Clean Minimalism template */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                      Bienvenido/a, {userProfile?.name?.split(" ")[0] || "Elena"}.
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Tu sistema nervioso está hoy en equilibrio regenerativo y de autorregulación.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100 self-start md:self-auto">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Estado Actual (IA)</span>
                      <span className="text-sm font-semibold text-[#8EA393]">
                        {assessmentsHistory.length > 0 && assessmentsHistory[0].state === "simpatico" ? "Simpático / Activo" : "Parasimpático / Calma"}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#8EA393]/10 border border-[#8EA393]/30 flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#8EA393] rounded-full pulse-dot"></div>
                    </div>
                  </div>
                </div>

                {/* Visual health tracking summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Personalized diagnostics history */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6"
                  >
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#8EA393]" /> Monitoreo Somático Continuo
                      </h3>
                      <p className="text-xs text-slate-400">Progreso histórico de tu reactividad simpática y descanso</p>
                    </div>

                    {/* Historical charts simulation */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { label: "Reactividad Promedio", val: "5.4 / 10", color: "text-rose-600 bg-rose-50 border-rose-100", desc: "Estrés / Alerta" },
                        { label: "Promedio Horas Sueño", val: "6.8 hs", color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Reparación cerebral" },
                        { label: "Equilibrio Nutricional", val: "7.2 / 10", color: "text-[#8EA393] bg-[#8EA393]/10 border-[#8EA393]/30", desc: "Absorción de energía" }
                      ].map((card, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                          <span className={`text-base md:text-lg font-extrabold ${card.color.split(" ")[0]} font-mono`}>{card.val}</span>
                          <span className="text-[9px] text-slate-400 block">{card.desc}</span>
                        </div>
                      ))}
                    </div>

                    {/* Timeline logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Historial de Evaluaciones</h4>
                      
                      {assessmentsHistory.length === 0 ? (
                        <div className="p-5 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          No tienes evaluaciones registradas. Comienza con el cuestionario de abajo para mapear tu sistema nervioso.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                          {assessmentsHistory.map((ass) => (
                            <div key={ass.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs bg-slate-50/20">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-700 capitalize">{ass.date}</span>
                                <p className="text-[10px] text-slate-400">Ansiedad: {ass.anxiety}/10 | Síntomas: {ass.symptoms?.length || 0}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  ass.state === "simpatico" ? "bg-rose-50 text-rose-700" : "bg-[#8EA393]/10 text-[#8EA393]"
                                }`}>
                                  {ass.state} ({ass.score}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <SomaticEvolutionChart assessments={assessmentsHistory} />
                  </motion.div>

                  {/* Right Column: Registered Tickets and Passes */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#8EA393]" /> Tus Tickets & Pases
                        </h3>
                        <p className="text-xs text-slate-400">Próximos eventos reguladores reservados</p>
                      </div>

                      {userReservations.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          No tienes reservas de plaza vigentes. Explora el calendario clínico para reservar tu boleto.
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                          {userReservations.map((res) => (
                            <div key={res.id} className="p-3 bg-[#8EA393]/10/20 rounded-2xl border border-teal-50/40 space-y-1 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-[#8EA393] block tracking-widest">{res.bookingCode}</span>
                                <h5 className="font-bold text-slate-800 text-xs line-clamp-1">{res.eventTitle}</h5>
                                <p className="text-[10px] text-slate-400 font-mono">{res.eventDate} - {res.eventTime}hs</p>
                              </div>
                              {res.status === "confirmed" && !res.feedback && (
                                <button
                                  onClick={() => setFeedbackReservation(res)}
                                  className="text-[10px] px-2 py-1 bg-white hover:bg-[#8EA393]/10 text-[#8EA393] font-bold rounded-lg border border-[#8EA393]/30 transition-colors shadow-sm whitespace-nowrap"
                                >
                                  Dejar Feedback
                                </button>
                              )}
                              {res.feedback && (
                                <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Completado
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      id="view-calendar-cta-btn"
                      onClick={() => setActiveTab("calendar")}
                      className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all text-center block"
                    >
                      Explorar Calendario Completo
                    </button>
                  </motion.div>

                </div>

                {/* Gemini AI Interactive Health Assessment Motor */}
                <NervousSystemEvaluator
                  userId={currentUser?.uid || "mock_uid"}
                  onNewAssessment={(ass) => {
                    setAssessmentsHistory((prev) => [ass, ...prev]);
                    setRefreshEventsTrigger((p) => p + 1);
                  }}
                  onFilterEvents={(tag) => {
                    setSelectedTagFilter(tag);
                    setActiveTab("calendar");
                  }}
                />

                {/* Events Gallery directly in Dashboard */}
                <div className="pt-8 border-t border-slate-100">
                  <EventsGallery />
                </div>
                
                {/* Emotional Gym directly in Dashboard */}
                <div className="pt-8 border-t border-slate-100">
                  <EmotionalGym />
                </div>
                  </>
                )}
              </motion.div>
            )}

            {/* 2. CALENDARIO DINÁMICO & GESTIÓN DE EVENTOS */}
            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                {isTrialExpired ? (
                  <PatientPaywall onSubscribe={() => console.log('Suscrito')} />
                ) : (
                  <CalendarModule
                    currentUserId={currentUser?.uid || "mock_uid"}
                    currentUserRole={userProfile?.role || "patient"}
                    currentUserName={userProfile?.name || "Invitado"}
                    currentUserModality={userProfile?.therapistModality}
                    selectedTagFilter={selectedTagFilter}
                    clearTagFilter={() => setSelectedTagFilter("")}
                    onBookEvent={(event) => setBookingEvent(event)}
                    refreshTrigger={refreshEventsTrigger}
                  />
                )}
              </motion.div>
            )}

            {/* 3. THERAPIST PROFESSIONAL CONTROL PANEL */}
            {activeTab === "professional" && (userProfile?.role === "therapist" || userProfile?.role === "especialista") && (
              <motion.div
                key="professional"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                {isTherapistSpaceExpired ? (
                  <TherapistPaywall onSubscribe={() => console.log('Suscrito')} />
                ) : (
                  <ProfessionalDashboard
                    profile={userProfile}
                    onRefreshEvents={() => setRefreshEventsTrigger((p) => p + 1)}
                  />
                )}
              </motion.div>
            )}

            {/* 4. ADMIN PANEL CONTROL */}
            {activeTab === "admin" && userProfile?.role === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <AdminPanel
                  onRefreshData={() => setRefreshEventsTrigger((p) => p + 1)}
                />
              </motion.div>
            )}

            {activeTab === "appointment-preview" && (
              <motion.div
                key="appointment-preview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="pt-4"
              >
                <AppointmentCalendar 
                  therapistName="Dra. Sofía Alarcón" 
                  therapistModality="trafico"
                  basePrice={50}
                />
              </motion.div>
            )}

            {activeTab === "events-gallery" && (
              <motion.div
                key="events-gallery"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="pt-4"
              >
                <EventsGallery />
              </motion.div>
            )}

            {activeTab === "emotional-gym" && (
              <motion.div
                key="emotional-gym"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="pt-4"
              >
                <EmotionalGym />
              </motion.div>
            )}

            {activeTab === "specialist-profile" && (
              <motion.div
                key="specialist-profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="pt-4"
              >
                <SpecialistProfile onBookSession={() => setActiveTab("calendar")} />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* FOOTER */}
      <footer id="app-main-footer" className="bg-white border-t border-slate-100 py-6 px-12 text-center text-xs text-slate-400 shrink-0">
        <p>© 2026 Atrévete HealthTech S.L. - Ecosistema Clínico Integrativo para la Regulación del Sistema Nervioso.</p>
        <p className="mt-1">Todos los datos sanitarios se encriptan bajo estándares HIPAA / RGPD de máxima seguridad.</p>
      </footer>

      {/* Booking Checkout Modal Portal */}
      <AnimatePresence>
        {bookingEvent && currentUser && (
          <BookingModal
            event={bookingEvent}
            userId={currentUser.uid}
            userEmail={userProfile?.email || "usuario@atrevetehealth.com"}
            onClose={() => setBookingEvent(null)}
            onSuccess={() => {
              setRefreshEventsTrigger((prev) => prev + 1);
              setBookingEvent(null);
            }}
          />
        )}
        {feedbackReservation && (
          <SessionFeedbackModal
            reservation={feedbackReservation}
            onClose={() => setFeedbackReservation(null)}
            onSuccess={() => {
              setRefreshEventsTrigger((prev) => prev + 1);
              setFeedbackReservation(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Authentication Register/Login Overlay Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div id="auth-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 overflow-hidden shadow-2xl relative space-y-6"
            >
              <div className="flex justify-center border-b border-slate-100 pb-5">
                <Logo iconSize="h-10 w-10" />
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {authMode === "login" ? "Acceso Integrativo" : "Crea tu Cuenta Segura"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Accede a tus diagnósticos de sistema nervioso</p>
                </div>
                <button
                  id="close-auth-modal-btn"
                  onClick={() => setShowAuthModal(false)}
                  className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "register" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Nombre Completo</label>
                      <input
                        id="auth-register-name"
                        type="text"
                        required
                        placeholder="Ej. Dra. Sofía Alarcón o Carlos Gómez"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Tipo de Perfil</label>
                      <select
                        id="auth-register-role"
                        value={authRole}
                        onChange={(e) => setAuthRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                      >
                        <option value="patient">Usuario/Paciente (activa 15 días de prueba gratis)</option>
                        <option value="therapist">Especialista/Terapeuta</option>
                      </select>
                    </div>

                    {authRole === "therapist" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 pt-1"
                      >
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Modalidad de Especialista</label>
                          <select
                            id="auth-register-modality"
                            value={therapistModality}
                            onChange={(e) => setTherapistModality(e.target.value as "espacio" | "trafico")}
                            className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-xs focus:outline-none"
                            required
                          >
                            <option value="espacio">Suscripción por Espacio ($250/mes - Mantén el 100% de tus ingresos)</option>
                            <option value="trafico">Pago por Tráfico ($0/mes - 20% de comisión por consulta y etiqueta exclusiva de 10% OFF)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Número de Colegiado / Credenciales Sanitarias</label>
                          <input
                            id="auth-register-credentials"
                            type="text"
                            required
                            placeholder="Ej. Colegiado N-8492-M"
                            value={credentials}
                            onChange={(e) => setCredentials(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Enfoque Holístico / Médico</label>
                          <input
                            id="auth-register-approach"
                            type="text"
                            required
                            placeholder="Ej. Psicología somática, acupuntura"
                            value={holisticApproach}
                            onChange={(e) => setHolisticApproach(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Correo Electrónico</label>
                  <div className="relative">
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="nombre@correo.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider block">Contraseña</label>
                  <div className="relative">
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#8EA393]/30 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
                  </div>
                </div>

                <div className="pt-2 pb-2">
                  <button 
                    type="button" 
                    onClick={() => setShowVipInput(!showVipInput)}
                    className="text-xs text-[#8EA393] hover:text-[#7A8F7F] font-semibold underline flex items-center gap-1"
                  >
                    ¿Tienes un código de invitación VIP? Ingrésalo aquí
                  </button>
                  <AnimatePresence>
                    {showVipInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <input
                          type="text"
                          placeholder="Ej. VIP-CORTESIA-2026"
                          value={authVipCode}
                          onChange={(e) => setAuthVipCode(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white/40 backdrop-blur-md border border-[#8EA393]/40 focus:border-[#8EA393] rounded-xl text-sm focus:outline-none text-[#2D2D2D] shadow-inner"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {authMode === "register" && (
                  <div className="flex items-start gap-2.5 bg-[#8EA393]/5 p-3 rounded-xl border border-[#8EA393]/20">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 accent-[#8EA393]"
                    />
                    <label htmlFor="terms-checkbox" className="text-xs text-[#2D2D2D] leading-tight cursor-pointer select-none">
                      He leído y acepto la <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} className="text-[#8EA393] hover:text-[#7A8F7F] underline font-bold">Política de Privacidad y Deslinde de Responsabilidad</button> de Atrévete HealthTech.
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-auth-btn"
                  className="w-full py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  {authMode === "login" ? "Acceder a mi Cuenta" : "Registrarse y Entrar"}
                </button>
              </form>

              <div className="text-center">
                <button
                  id="toggle-auth-mode-btn"
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                >
                  {authMode === "login" ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms and Conditions Warning Modal */}
      <AnimatePresence>
        {showTermsWarning && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[110]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#8EA393]/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-5"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-[#2D2D2D]">Acción Requerida</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                ¡Atención! Para continuar con el registro y garantizar un entorno seguro de salud digital, es obligatorio leer y aceptar la Política de Privacidad y Deslinde de Responsabilidad (Seguridad Blindada) de la plataforma.
              </p>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsWarning(false);
                }}
                className="w-full py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-bold rounded-xl text-sm transition-all shadow-md"
              >
                Entendido y Aceptar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms and Conditions Text Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[110]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(142,163,147,0.15)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8EA393]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

              <div className="px-6 py-5 flex justify-between items-center border-b border-[#8EA393]/20 relative z-10 bg-white/30 backdrop-blur-sm">
                <h3 className="font-extrabold text-[#2D2D2D] text-lg md:text-xl flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#8EA393]" />
                  Política de Privacidad y Deslinde de Responsabilidad (Seguridad Blindada)
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-[#2D2D2D]/60 hover:text-[#2D2D2D] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 text-[#2D2D2D] relative z-10 custom-scrollbar">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#8EA393] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Uso bajo riesgo del usuario
                  </h4>
                  <p className="text-sm leading-relaxed font-medium">
                    Atrévete HealthTech provee herramientas de bienestar digital y regulación somática. El usuario comprende y acepta que es el <strong>único responsable de su uso</strong> y se compromete a no aplicar estas técnicas en estados de crisis médica, emergencias o episodios psiquiátricos graves. Estas herramientas no sustituyen diagnósticos ni tratamientos médicos formales.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#8EA393] uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Exoneración de responsabilidad de los propietarios
                  </h4>
                  <p className="text-sm leading-relaxed font-medium">
                    Los propietarios y administradores de la plataforma (Carla G. Rodríguez C. y José D. Santana) <strong>no son responsables en ningún caso</strong> de mala praxis, errores de interpretación, o daños directos e indirectos derivados del uso indebido de los servicios ofrecidos, ni de la información o recomendaciones proporcionadas por terceros (como los especialistas y terapeutas registrados en el directorio).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#8EA393] uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Seguridad Blindada contra Ataques
                  </h4>
                  <p className="text-sm leading-relaxed font-medium">
                    La plataforma implementa estrictos protocolos de cifrado AES-256 de grado militar y medidas proactivas de mitigación contra ataques DDoS. El usuario reconoce y acepta que, ante incidentes de fuerza mayor, vulnerabilidades zero-day, o ataques cibernéticos externos, la plataforma y sus dueños no asumen responsabilidad civil, penal ni administrativa por filtraciones o caídas de servicio que no sean imputables a una negligencia directa y comprobable de los administradores.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#8EA393] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Cumplimiento Legal (Venezuela e Internacional)
                  </h4>
                  <p className="text-sm leading-relaxed font-medium">
                    Nuestras operaciones se rigen estrictamente bajo el marco de la <strong>Ley Especial contra los Delitos Informáticos de Venezuela</strong>. Asimismo, cumplimos proactivamente con los estándares internacionales de privacidad y protección de datos (GDPR y LOPD), garantizando que la gestión de datos sensibles de salud e historial de bienestar se almacene bajo estricta confidencialidad digital, sin ser vendidos ni compartidos con terceros sin el consentimiento explícito del titular.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-[#8EA393]/20 bg-white/30 backdrop-blur-sm flex justify-end gap-3 relative z-10">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-5 py-3 bg-black/5 hover:bg-black/10 text-[#2D2D2D] font-bold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                  }}
                  className="px-6 py-3 bg-[#8EA393] hover:bg-[#7A8F7F] text-white font-extrabold rounded-xl text-sm transition-all shadow-lg active:scale-95"
                >
                  He leído y Acepto las Condiciones Legales y de Privacidad
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 w-80 ${
                t.type === "success" 
                  ? "bg-[#8EA393]/10 border-teal-200 text-teal-800" 
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#8EA393] shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">{t.title}</h4>
                <p className="text-xs opacity-80 mt-0.5">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Minimal placeholder component to satisfy typescript imports
function X({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
