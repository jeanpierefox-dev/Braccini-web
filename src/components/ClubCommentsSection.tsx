import { useState, useEffect, type FormEvent } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { ClubComment } from '../types';
import { 
  MessageSquare, 
  Send, 
  Star, 
  Trash2, 
  ShieldCheck, 
  User as UserIcon, 
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ClubCommentsSection() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState(user?.displayName || '');
  const [userRoleType, setUserRoleType] = useState<'atleta' | 'publico' | 'entrenador'>('publico');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';

  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClubComment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ClubComment);
      });
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const authorName = user?.displayName || name.trim() || 'Aficionado del Club';
    const computedRole = role === 'admin' ? 'admin' : (user ? (userRoleType === 'entrenador' ? 'entrenador' : 'atleta') : userRoleType);

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        authorName,
        authorRole: computedRole,
        message: message.trim(),
        rating,
        userId: user?.uid || null,
        createdAt: serverTimestamp()
      });

      setMessage('');
      if (!user) setName('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err) {
      console.error("Error submitting comment:", err);
      alert("No se pudo enviar el comentario. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("¿Deseas eliminar este comentario?")) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (err) {
        console.error("Error deleting comment:", err);
      }
    }
  };

  return (
    <section id="comentarios" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.12)`,
              borderColor: `rgba(${primaryRgb}, 0.25)`,
              color: primaryColor
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Muro Comunitario</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            Voces del Club y Aficionados
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Comparte tus experiencias, mensajes de aliento para nuestros atletas o valoraciones de los entrenamientos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-5 bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              <span>Dejar un Comentario</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Abierto a atletas, cuerpo técnico y al público en general.
            </p>

            {submittedSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>¡Muchas gracias! Tu mensaje ha sido publicado en el muro.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  ¿Quién eres?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'publico', label: 'Público / Fan' },
                    { id: 'atleta', label: 'Atleta' },
                    { id: 'entrenador', label: 'Entrenador' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setUserRoleType(tab.id as any)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border ${
                        userRoleType === tab.id
                          ? 'text-white shadow-md border-transparent'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      style={userRoleType === tab.id ? {
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 12px rgba(${primaryRgb}, 0.3)`
                      } : {}}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nombre o Alias
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: primaryColor }}
                  placeholder="Ej. Familia Rodríguez / Sergio (Jugador)"
                  required
                />
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Calificación del Club
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-zinc-600 hover:text-amber-400 transition-colors focus:outline-none"
                    >
                      <Star 
                        className={`w-6 h-6 transition-all ${
                          rating >= star ? 'fill-amber-400 text-amber-400 scale-110' : 'text-zinc-700'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-400">{rating} / 5</span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mensaje o Reseña
                </label>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: primaryColor }}
                  placeholder="Escribe tu mensaje de aliento, experiencia en el club o comentario..."
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2 text-xs uppercase tracking-wider min-h-[44px]"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.35)`
                }}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Publicando...' : 'Publicar Comentario'}</span>
              </button>
            </form>
          </div>

          {/* Comments List Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Comentarios Recientes ({comments.length})
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Muro en Vivo</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-zinc-900/40 rounded-2xl h-24 animate-pulse border border-zinc-800/60" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-10 text-center text-zinc-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-60" />
                <p className="text-sm font-semibold text-zinc-400">Sé el primero en dejar un comentario o mensaje de aliento.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {comments.map((c) => {
                  const isAthlete = c.authorRole === 'atleta';
                  const isCoach = c.authorRole === 'entrenador';
                  const isAdmin = c.authorRole === 'admin';

                  return (
                    <div 
                      key={c.id} 
                      className="bg-zinc-900/70 backdrop-blur-md rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                            style={{
                              backgroundColor: isAthlete ? primaryColor : isCoach ? accentColor : isAdmin ? '#8b5cf6' : '#52525b'
                            }}
                          >
                            {isAthlete ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-white text-sm">{c.authorName}</h4>
                              <span 
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isAthlete 
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                    : isCoach 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : isAdmin 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {isAthlete ? 'Atleta Oficial' : isCoach ? 'Cuerpo Técnico' : isAdmin ? 'Admin' : 'Público General'}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {c.createdAt ? format(c.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Reciente'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: c.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}

                          {role === 'admin' && (
                            <button
                              onClick={() => handleDelete(c.id!)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                              title="Eliminar comentario (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed pl-12">
                        "{c.message}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
