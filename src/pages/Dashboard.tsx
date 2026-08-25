import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MediaItem } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { Video, Image as ImageIcon, Calendar, Sparkles, UserPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const settings = useSettings();
  const { user } = useAuth();
  const { isTrialActive, daysRemaining, currentDay } = useVisitorTrial();

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData: MediaItem[] = [];
      snapshot.forEach((doc) => {
        mediaData.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      setMedia(mediaData);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching media:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMedia = filter === 'all' 
    ? media 
    : media.filter(m => m.type === filter);

  const isVideo = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Visitor 7-Day Trial Banner */}
        {!user && isTrialActive && (
          <div 
            className="p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3"
            style={{
              backgroundColor: `rgba(${accentRgb}, 0.1)`,
              borderColor: `rgba(${accentRgb}, 0.35)`
            }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg font-black"
                style={{ backgroundColor: accentColor }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-white">
                    Pase de Visita Gratuito Activo (Día {currentDay} de 7)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3" /> {daysRemaining} {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Estás visualizando todos los contenidos y rutinas técnicas del club en modo visitante.
                </p>
              </div>
            </div>

            <a 
              href="#home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Inscribirme al Club</span>
            </a>
          </div>
        )}

        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Material de Entrenamiento</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">Contenido y Rutinas Técnicas</h1>
            <p className="text-sm text-zinc-400 mt-1">Galería de entrenamientos, tácticas de saque, recepción y partidos del club.</p>
          </div>
          
          {/* Responsive Filter Buttons */}
          <div className="flex flex-wrap bg-zinc-900/80 rounded-xl p-1 border border-zinc-800 backdrop-blur-md self-start sm:self-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'training', label: 'Entrenamientos' },
              { id: 'player', label: 'Jugadores' },
              { id: 'general', label: 'General' }
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                  style={isActive ? {
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`
                  } : {}}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-zinc-900/50 rounded-2xl h-72 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800 p-12 sm:p-20 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
              style={{ 
                backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                borderColor: `rgba(${primaryRgb}, 0.2)`
              }}
            >
              <ImageIcon className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No hay contenido disponible</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              El cuerpo técnico aún no ha publicado material en esta categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => (
              <div 
                key={item.id} 
                className="bg-zinc-900/80 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl transition-all duration-300 hover:border-zinc-700 group flex flex-col"
              >
                <div className="aspect-video relative bg-zinc-950 overflow-hidden">
                  {isVideo(item.url) ? (
                    item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                      <iframe 
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${
                          item.url.includes('youtu.be/') 
                            ? item.url.split('youtu.be/')[1].split('?')[0]
                            : item.url.split('v=')[1]?.split('&')[0]
                        }`} 
                        allowFullScreen 
                      />
                    ) : (
                      <video src={item.url} controls className="w-full h-full object-cover" />
                    )
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  )}
                  
                  <div 
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md"
                    style={{
                      backgroundColor: item.type === 'training' ? primaryColor : accentColor
                    }}
                  >
                    {isVideo(item.url) ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    <span>{item.type === 'training' ? 'Entrenamiento' : item.type === 'player' ? 'Jugador' : 'General'}</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug group-hover:text-zinc-200 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.createdAt ? format(item.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Reciente'}</span>
                    </div>
                    <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

