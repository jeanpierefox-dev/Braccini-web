import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MediaItem } from '../types';
import { Video, Image as ImageIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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

  // Helper to determine if URL is likely a video
  const isVideo = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contenido Exclusivo</h1>
            <p className="text-zinc-400">Galería de entrenamientos y jugadores para miembros.</p>
          </div>
          
          <div className="flex bg-zinc-900/60 rounded-lg shadow-inner p-1 border border-zinc-800 backdrop-blur-md">
            {['all', 'training', 'player', 'general'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === type 
                    ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {type === 'all' ? 'Todos' : 
                 type === 'training' ? 'Entrenamientos' : 
                 type === 'player' ? 'Jugadores' : 'General'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-200 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800 p-16 text-center shadow-inner">
            <div className="bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
              <ImageIcon className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No hay contenido aún</h3>
            <p className="text-zinc-400">Los administradores aún no han subido material de este tipo.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => (
              <div key={item.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl hover:border-blue-500/50 transition-colors group">
                <div className="aspect-video relative bg-zinc-900 overflow-hidden">
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
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5 shadow-lg">
                    {isVideo(item.url) ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <ImageIcon className="w-3.5 h-3.5 text-red-400" />}
                    {item.type === 'training' ? 'Entrenamiento' : item.type === 'player' ? 'Jugador' : 'General'}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.createdAt ? format(item.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Subiendo...'}
                  </div>
                  <p className="text-zinc-400 text-sm line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
