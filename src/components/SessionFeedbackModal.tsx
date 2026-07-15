import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Star, HeartPulse, FileText } from "lucide-react";
import { ReservationModel } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface SessionFeedbackModalProps {
  reservation: ReservationModel & { eventTitle?: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function SessionFeedbackModal({ reservation, onClose, onSuccess }: SessionFeedbackModalProps) {
  const [utilityRating, setUtilityRating] = useState<number>(5);
  const [somaticImprovement, setSomaticImprovement] = useState<number>(5);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resRef = doc(db, "reservations", reservation.id);
      await updateDoc(resRef, {
        feedback: {
          utilityRating,
          somaticImprovement,
          comments
        }
      });
      onSuccess();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${reservation.id}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg tracking-tight">Feedback de Sesión</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
            Por favor, califica tu experiencia en la sesión <strong className="text-slate-900">{reservation.eventTitle || "Evento"}</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Star className="w-3.5 h-3.5 text-teal-600" />
                Utilidad del Encuentro (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={utilityRating}
                onChange={(e) => setUtilityRating(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono font-bold">
                <span>1</span><span>{utilityRating}</span><span>5</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                Mejora Somática Percibida (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={somaticImprovement}
                onChange={(e) => setSomaticImprovement(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono font-bold">
                <span>1</span><span>{somaticImprovement}</span><span>5</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Comentarios Adicionales
              </label>
              <textarea
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="¿Cómo te sentiste tras la sesión?"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-900/10 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar Feedback"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
