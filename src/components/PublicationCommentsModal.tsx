import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { PublicationComment } from '../types';
import { 
  MessageSquare, 
  Send, 
  Heart, 
  ShieldCheck, 
  User, 
  Trash2, 
  CornerDownRight, 
  X, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Loader2
} from 'lucide-react';

interface PublicationCommentsModalProps {
  mediaId: string;
  mediaTitle: string;
  mediaUrl: string;
  mediaCategory?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicationCommentsModal({
  mediaId,
  mediaTitle,
  mediaUrl,
  mediaCategory,
  isOpen,
  onClose
}: PublicationCommentsModalProps) {
  const { user, role } = useAuth();
  const settings = useSettings();

  const [comments, setComments] = useState<PublicationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';

  // Load comments in real-time from Firestore
  useEffect(() => {
    if (!mediaId || !isOpen) return;

    setLoading(true);
    const q = query(
      collection(db, 'publication_comments'),
      where('mediaId', '==', mediaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: PublicationComment[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        } as PublicationComment);
      });

      // Sort client-side by createdAt ascending/descending
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeA - timeB;
      });

      setComments(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mediaId, isOpen]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const author = user 
      ? (user.displayName || user.email?.split('@')[0] || 'Miembro del Club')
      : (visitorName.trim() || 'Aficionado / Visitante');

    const authorRoleMapped: 'admin' | 'atleta' | 'entrenador' | 'socio' | 'publico' = 
      role === 'admin' ? 'admin' :
      role === 'member' ? 'socio' : 'publico';

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'publication_comments'), {
        mediaId,
        authorName: author,
        authorRole: authorRoleMapped,
        userId: user?.uid || null,
        userPhoto: user?.photoURL || null,
        message: newCommentText.trim(),
        likes: 0,
        createdAt: serverTimestamp()
      });

      setNewCommentText('');
      if (!user) {
        // Save visitor name to localStorage for convenience
        localStorage.setItem('club_visitor_name', visitorName);
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      alert('Error al publicar comentario: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminReply = async (commentId: string) => {
    if (!adminReplyText.trim() || role !== 'admin') return;

    try {
      const commentRef = doc(db, 'publication_comments', commentId);
      await updateDoc(commentRef, {
        adminReply: adminReplyText.trim(),
        adminRepliedAt: serverTimestamp()
      });

      setReplyingToCommentId(null);
      setAdminReplyText('');
    } catch (err: any) {
      console.error('Error adding admin reply:', err);
      alert('Error al responder: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (role !== 'admin') return;
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      await deleteDoc(doc(db, 'publication_comments', commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      alert('Error al eliminar comentario: ' + err.message);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (likedComments[commentId]) return;

    try {
      setLikedComments(prev => ({ ...prev, [commentId]: true }));
      const commentRef = doc(db, 'publication_comments', commentId);
      await updateDoc(commentRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Left Side / Top on Mobile: Media Preview */}
        <div className="w-full md:w-1/2 bg-black flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
          <div className="relative h-48 sm:h-64 md:h-full min-h-[220px] bg-black flex items-center justify-center overflow-hidden">
            <img 
              src={mediaUrl} 
              alt={mediaTitle} 
              className="w-full h-full object-contain md:object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:block hidden pointer-events-none" />
            
            {/* Tag / Category Badge */}
            {mediaCategory && (
              <div className="absolute top-3 left-3 z-10">
                <span 
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border text-white shadow-lg"
                  style={{
                    backgroundColor: `rgba(${primaryRgb}, 0.35)`,
                    borderColor: primaryColor
                  }}
                >
                  {mediaCategory}
                </span>
              </div>
            )}

            <div className="absolute bottom-3 left-3 right-3 text-white hidden md:block">
              <h3 className="font-black text-lg leading-snug drop-shadow-md">{mediaTitle}</h3>
              <p className="text-xs text-zinc-300 drop-shadow-md">Publicación oficial del club</p>
            </div>
          </div>
        </div>

        {/* Right Side: Comments Thread & Post Form */}
        <div className="w-full md:w-1/2 flex flex-col flex-1 bg-zinc-950 max-h-[60vh] md:max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/90 flex items-center justify-between bg-zinc-900/70">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `rgba(${primaryRgb}, 0.2)` }}
              >
                <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Comentarios de la Publicación</h4>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Cargando comentarios...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p className="text-sm font-medium text-zinc-400">Aún no hay comentarios.</p>
                <p className="text-xs text-zinc-500">¡Sé el primero en comentar esta foto o publicación!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-3.5 space-y-2 shadow-sm"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          comment.authorRole === 'admin' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                            : comment.authorRole === 'atleta'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {comment.userPhoto ? (
                          <img src={comment.userPhoto} alt={comment.authorName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          comment.authorName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{comment.authorName}</span>
                          
                          {/* Role Badge */}
                          {comment.authorRole === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Admin</span>
                            </span>
                          )}
                          {comment.authorRole === 'atleta' && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Atleta
                            </span>
                          )}
                          {comment.authorRole === 'socio' && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Socio
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Like & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => comment.id && handleLikeComment(comment.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          comment.id && likedComments[comment.id] 
                            ? 'text-rose-400 bg-rose-500/10' 
                            : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
                        }`}
                        title="Me gusta"
                      >
                        <Heart className={`w-3.5 h-3.5 ${comment.id && likedComments[comment.id] ? 'fill-current text-rose-500' : ''}`} />
                        <span className="text-[11px] font-bold">{comment.likes || 0}</span>
                      </button>

                      {role === 'admin' && (
                        <button
                          onClick={() => comment.id && handleDeleteComment(comment.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar comentario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-zinc-200 leading-relaxed pl-9">
                    {comment.message}
                  </p>

                  {/* Admin Official Reply (if any) */}
                  {comment.adminReply && (
                    <div className="ml-6 mt-2 p-2.5 bg-amber-500/10 border-l-2 border-amber-500 rounded-r-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Respuesta de la Administración</span>
                        {comment.adminRepliedAt && (
                          <span className="text-zinc-500 font-normal lowercase">
                            • {formatTimestamp(comment.adminRepliedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {comment.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Admin Reply Action Box */}
                  {role === 'admin' && !comment.adminReply && (
                    <div className="pl-9 pt-1">
                      {replyingToCommentId === comment.id ? (
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="text"
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Escribe la respuesta oficial como Administrador..."
                            className="flex-1 bg-zinc-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                            autoFocus
                          />
                          <button
                            onClick={() => comment.id && handleAdminReply(comment.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                          >
                            Responder
                          </button>
                          <button
                            onClick={() => {
                              setReplyingToCommentId(null);
                              setAdminReplyText('');
                            }}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingToCommentId(comment.id || null);
                            setAdminReplyText('');
                          }}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Responder como Admin</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

          {/* New Comment Input Box */}
          <form onSubmit={handleAddComment} className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 space-y-2.5">
            
            {/* If not logged in, ask for their name */}
            {!user && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Tu nombre o apodo (ej. Carlos M.)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={user ? `Comentar como ${user.displayName || user.email?.split('@')[0]}...` : "Escribe tu comentario sobre esta foto o entreno..."}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newCommentText.trim()}
                className="inline-flex items-center justify-center p-2.5 sm:px-4 rounded-xl text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Enviar</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
              <span>{user ? `Publicando como: ${user.displayName || user.email?.split('@')[0]}` : 'Comentarios abiertos para toda la comunidad'}</span>
              <span>Presiona Enviar para publicar</span>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
