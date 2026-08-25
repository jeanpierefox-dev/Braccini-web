import { useState, useEffect, type FormEvent } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc 
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
  HeartHandshake,
  CornerDownRight,
  Shield,
  Filter,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ClubCommentsSection() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  
  // Form State
  const [name, setName] = useState(user?.displayName || '');
  const [userRoleType, setUserRoleType] = useState<'atleta' | 'publico' | 'entrenador'>('publico');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Quick Admin reply modal / inline form state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  const isAdmin = role === 'admin' || user?.email === 'admin@club.com' || user?.uid === 'mock-admin-123';

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

  const ratingDescriptions: Record<number, string> = {
    5: 'Excelente - 5 estrellas ★★★★★',
    4: 'Muy bueno - 4 estrellas ★★★★☆',
    3: 'Bueno - 3 estrellas ★★★☆☆',
    2: 'Regular - 2 estrellas ★★☆☆☆',
    1: 'Por mejorar - 1 estrella ★☆☆☆☆'
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const authorName = user?.displayName || name.trim() || 'Aficionado del Club';
    const computedRole = isAdmin ? 'admin' : (user ? (userRoleType === 'entrenador' ? 'entrenador' : 'atleta') : userRoleType);

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

  const handleAdminReplySubmit = async (commentId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        adminReply: replyText.trim(),
        adminRepliedAt: serverTimestamp(),
        adminRepliedBy: user?.displayName || 'Dirección del Club'
      });
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      console.error("Error replying to comment:", err);
      alert("Error al guardar la respuesta.");
    } finally {
      setIsSubmittingReply(false);
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

  // Metrics computation
  const totalComments = comments.length;
  const ratingsList = comments.map(c => c.rating || 5);
  const averageRating = totalComments > 0 
    ? (ratingsList.reduce((acc, curr) => acc + curr, 0) / totalComments).toFixed(1)
    : '5.0';

  const countByStar = (star: number) => comments.filter(c => (c.rating || 5) === star).length;

  const filteredComments = comments.filter(c => {
    if (selectedStarFilter === 'all') return true;
    return (c.rating || 5) === selectedStarFilter;
  });

  return (
    <section id="comentarios" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.12)`,
              borderColor: `rgba(${primaryRgb}, 0.25)`,
              color: primaryColor
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Muro Comunitario y Calificaciones</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            Voces del Club, Reseñas y Calificaciones
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Mensajes de aliento de atletas, directores técnicos y aficionados. La dirección responde activamente a cada reseña.
          </p>
        </div>

        {/* Global Rating Score Banner */}
        <div className="mb-10 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Average Big Box */}
            <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-6">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-1">Calificación Promedio</span>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="text-4xl sm:text-5xl font-black text-white">{averageRating}</span>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-5 h-5 ${
                          parseFloat(averageRating) >= s 
                            ? 'fill-amber-400 text-amber-400' 
                            : parseFloat(averageRating) >= s - 0.5 
                            ? 'fill-amber-400/50 text-amber-400' 
                            : 'text-zinc-700'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {totalComments} {totalComments === 1 ? 'opinión registrada' : 'opiniones registradas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Filter Pills */}
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                  <Filter className="w-3.5 h-3.5" /> Filtrar por Calificación:
                </span>
                {selectedStarFilter !== 'all' && (
                  <button 
                    onClick={() => setSelectedStarFilter('all')}
                    className="text-amber-400 hover:underline text-xs font-semibold"
                  >
                    Mostrar todas
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedStarFilter === 'all'
                      ? 'text-white border-transparent shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  style={selectedStarFilter === 'all' ? { backgroundColor: primaryColor } : {}}
                >
                  Todas ({totalComments})
                </button>

                {[5, 4, 3, 2, 1].map((star) => {
                  const count = countByStar(star);
                  const isSelected = selectedStarFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStarFilter(star)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{star}</span>
                      <Star className={`w-3 h-3 ${isSelected ? 'fill-black text-black' : 'fill-amber-400 text-amber-400'}`} />
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-5 bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              <span>Dejar una Reseña o Mensaje</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Tu mensaje y estrellas se enviarán al buzón de la Dirección del Club.
            </p>

            {submittedSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>¡Muchas gracias! Tu reseña ha sido enviada y publicada.</span>
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

              {/* Star Rating with interactive hover feedback */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Calificación con Estrellas
                  </label>
                  <span className="text-xs font-bold text-amber-400">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-black rounded-xl border border-zinc-800">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1.5 hover:scale-125 transition-transform focus:outline-none"
                      >
                        <Star 
                          className={`w-7 h-7 transition-colors ${
                            active ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                          }`} 
                        />
                      </button>
                    );
                  })}
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
                  placeholder="Escribe tu mensaje de aliento, experiencia con los entrenamientos o sugerencia..."
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2 text-xs uppercase tracking-wider min-h-[44px]"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.35)`
                }}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Publicando...' : 'Enviar Reseña al Club'}</span>
              </button>
            </form>
          </div>

          {/* Comments List Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {selectedStarFilter === 'all' 
                  ? `Comentarios Recientes (${filteredComments.length})` 
                  : `Comentarios con ${selectedStarFilter} Estrellas (${filteredComments.length})`
                }
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
            ) : filteredComments.length === 0 ? (
              <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-10 text-center text-zinc-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-60" />
                <p className="text-sm font-semibold text-zinc-400">
                  {selectedStarFilter === 'all' 
                    ? 'Sé el primero en dejar un comentario o mensaje de aliento.'
                    : `No hay comentarios con ${selectedStarFilter} estrellas aún.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                {filteredComments.map((c) => {
                  const isAthlete = c.authorRole === 'atleta';
                  const isCoach = c.authorRole === 'entrenador';
                  const isCommentAdmin = c.authorRole === 'admin';

                  return (
                    <div 
                      key={c.id} 
                      className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all shadow-md space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                            style={{
                              backgroundColor: isAthlete ? primaryColor : isCoach ? accentColor : isCommentAdmin ? '#8b5cf6' : '#52525b'
                            }}
                          >
                            {isAthlete ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
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
                                    : isCommentAdmin 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {isAthlete ? 'Atleta Oficial' : isCoach ? 'Cuerpo Técnico' : isCommentAdmin ? 'Dirección' : 'Público General'}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {c.createdAt ? format(c.createdAt.toDate(), "d 'de' MMMM, yyyy - HH:mm", { locale: es }) : 'Reciente'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.rating && (
                            <div className="flex items-center gap-0.5 bg-black/60 px-2.5 py-1 rounded-lg border border-zinc-800">
                              {Array.from({ length: c.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id!)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                              title="Eliminar comentario (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed pl-2 sm:pl-12 border-l-2 border-zinc-800">
                        "{c.message}"
                      </p>

                      {/* Official Club Admin Reply Sub-card */}
                      {c.adminReply && (
                        <div className="mt-3 ml-2 sm:ml-10 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                {c.adminRepliedBy || 'Respuesta Oficial de la Dirección del Club'}
                              </span>
                            </div>
                            {c.adminRepliedAt && (
                              <span className="text-[9px] text-amber-300/70 font-mono">
                                {format(c.adminRepliedAt.toDate(), "d 'de' MMM, yyyy", { locale: es })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-200 leading-relaxed italic">
                            "{c.adminReply}"
                          </p>
                        </div>
                      )}

                      {/* Quick reply button for Admin */}
                      {isAdmin && !c.adminReply && replyingToId !== c.id && (
                        <div className="pl-2 sm:pl-12 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(c.id!);
                              setReplyText('');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Responder como Director del Club</span>
                          </button>
                        </div>
                      )}

                      {/* Inline Reply Form for Admin */}
                      {isAdmin && replyingToId === c.id && (
                        <div className="pl-2 sm:pl-12 pt-2 space-y-2">
                          <div className="bg-black/90 p-3 rounded-xl border border-amber-500/40 space-y-2">
                            <span className="text-[11px] font-bold text-amber-400 block">
                              Redactar Respuesta Oficial de Dirección:
                            </span>
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Escribe la respuesta institucional del club..."
                              className="w-full bg-zinc-950 text-white text-xs p-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-amber-400"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={isSubmittingReply || !replyText.trim()}
                                onClick={() => handleAdminReplySubmit(c.id!)}
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow disabled:opacity-50"
                              >
                                {isSubmittingReply ? 'Publicando...' : 'Publicar Respuesta'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

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
