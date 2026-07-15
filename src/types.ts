export type UserRole = "patient" | "therapist" | "admin" | "especialista";
export type TherapistModality = "espacio" | "trafico";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  bio?: string;
  specialties?: string[];
  credentials?: string;
  holisticApproach?: string;
  isApproved?: boolean;
  isVIP?: boolean;
  termsAcceptedDate?: string;
  termsVersion?: string;
  courtesyExpiry?: string;
  therapistModality?: TherapistModality;
  fcmToken?: string;
  habits?: {
    date: string;
    stressLevel: number;
    hoursSleep: number;
    nutritionalRating: number;
    symptoms: string[];
  }[];
}

export type EventType = "taller" | "masterclass" | "retiro" | "sesion_grupal" | "terapia_individual";
export type EventModality = "online" | "presencial";

export interface EventModel {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  modality: EventModality;
  location: string;
  capacity: number;
  price: number;
  createdBy: string;
  createdByName: string;
  creatorModality?: TherapistModality;
  registeredUsers?: string[];
}

export interface AssessmentModel {
  id: string;
  userId: string;
  date: string;
  sleep: string;
  nutrition: string;
  anxiety: number;
  symptoms: string[];
  state: "simpatico" | "parasimpatico" | "mixto";
  score: number;
  diagnosis: string;
  recommendations: string[];
  emotionalState?: string;
  biodescodificacion?: string;
}

export interface ReservationModel {
  id: string;
  eventId: string;
  userId: string;
  status: "confirmed" | "pending" | "cancelled";
  bookingCode: string;
  createdAt: string;
  reminderEnabled?: boolean;
  feedback?: {
    utilityRating: number;
    somaticImprovement: number;
    comments: string;
  };
}
