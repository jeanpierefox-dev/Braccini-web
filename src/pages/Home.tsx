import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { LoginModal } from '../components/LoginModal';
import { ClubCommentsSection } from '../components/ClubCommentsSection';
import { ContactSection } from '../components/ContactSection';
import { 
  ArrowRight, 
  Trophy, 
  Users, 
  Video, 
  ShieldCheck, 
  Medal, 
  Star,
  Sparkles,
  Play,
  Calendar,
  CheckCircle2,
  Shuffle,
  Camera,
  Maximize2,
  X,
  Upload,
  Activity,
  Flame
} from 'lucide-react';
import { MediaItem } from '../types';

// Default dynamic volleyball training photos if no database photos are uploaded yet
const DEFAULT_TRAINING_PHOTOS = [
  {
    id: 'dt-1',
    title: 'Rutina de Saque en Suspensión y Potencia',
    category: 'Entrenamiento Táctico',
    url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1000&auto=format&fit=crop',
    tag: 'Saque y Remate',
    description: 'Sesión matutina enfocada en potencia de salto, rotación de hombro y precisión de saque dirigida por el cuerpo técnico.'
  },
  {
    id: 'dt-2',
    title: 'Sistema de Bloqueo Doble y Lectura de Red',
    category: 'Táctica de Red',
    url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1000&auto=format&fit=crop',
    tag: 'Bloqueo y Malla',
    description: 'Coordinación entre centrales y puntas para cierre de diagonales y coberturas rápidas.'
  },
  {
    id: 'dt-3',
    title: 'Defensa de Campo y Recepción Bajo Presión',
    category: 'Defensa y Reflejos',
    url: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1000&auto=format&fit=crop',
    tag: 'Recepción',
    description: 'Drills de agilidad y desplazamientos laterales para asegurar la salida limpia hacia el armador.'
  },
  {
    id: 'dt-4',
    title: 'Armado Rápido y Distribución Ofensiva',
    category: 'Estrategia',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1000&auto=format&fit=crop',
    tag: 'Armado',
    description: 'Ejercicios de tempo 1 y tempo 2 para superar los bloqueos rivales en situaciones de contraataque.'
  },
  {
    id: 'dt-5',
    title: 'Acondicionamiento Físico y Pliometría',
    category: 'Físico',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1000&auto=format&fit=crop',
    tag: 'Preparación Física',
    description: 'Circuito de fuerza explosiva, salto vertical y resistencia neuromuscular para el plantel.'
  },
  {
    id: 'dt-6',
    title: 'Charla Táctica y Análisis de Partido',
    category: 'Dirección Técnica',
    url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=1000&auto=format&fit=crop',
    tag: 'Estrategia',
    description: 'Revisión en pizarra y feedback individualizado para la siguiente fecha del torneo oficial.'
  }
];

export function Home() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const { isTrialActive, startTrial, daysRemaining, currentDay } = useVisitorTrial();
  const [showLogin, setShowLogin] = useState(false);
  const [registeredPlayersCount, setRegisteredPlayersCount] = useState<number | null>(null);
  
  // Media items from database
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [randomSeed, setRandomSeed] = useState(0);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    title: string;
    description?: string;
    tag?: string;
  } | null>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  // Listen to users count in real-time (Strictly excluding Admin directors)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      // Exclude Admin role from athletes count
      const athleteCount = snapshot.docs.filter(d => {
        const data = d.data();
        return data.role !== 'admin' && data.clubRole !== 'entrenador';
      }).length;
      setRegisteredPlayersCount(athleteCount);
    }, (err) => {
      console.warn("Could not count registered players:", err);
    });
    return () => unsubscribe();
  }, []);

  // Listen to media items in real-time
  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MediaItem[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      setMediaList(items);
    }, (err) => {
      console.warn("Could not fetch media gallery:", err);
    });
    return () => unsubscribe();
  }, []);

  // Combine uploaded training photos with defaults and shuffle
  const trainingPhotos = useMemo(() => {
    const uploadedTrainings = mediaList
      .filter(item => item.url && !item.url.includes('youtube.com') && !item.url.includes('youtu.be'))
      .map(item => ({
        id: item.id,
        title: item.title,
        category: item.type === 'training' ? 'Entrenamiento Oficial' : 'Actividad del Club',
        url: item.url,
        tag: item.type === 'training' ? 'Entreno' : 'Club',
        description: item.description || 'Fotografía de los entrenamientos y actividades oficiales del club.'
      }));

    const combined = [...uploadedTrainings, ...DEFAULT_TRAINING_PHOTOS];
    
    // Deterministic shuffle with seed
    const shuffled = [...combined].sort(() => 0.5 - Math.sin(randomSeed + Math.random()));
    return shuffled.slice(0, 6);
  }, [mediaList, randomSeed]);

  const handleShufflePhotos = () => {
    setRandomSeed(prev => prev + 1);
  };

  const handleActivateTrial = () => {
    startTrial();
    window.location.hash = '#dashboard';
  };

  const displayedAthletesCount = settings.statsAutoCountPlayers !== false && registeredPlayersCount !== null
    ? `${registeredPlayersCount} Atletas`
    : (settings.statsAthletes || '120+');
  
  // Default Main Team photo fallback
  const mainTeamPhoto = settings.mainTeamImageUrl || "https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-slate-100">
      <main className="flex-1">
        
        {/* =========================================================================
            HERO SECTION: LOGO + OFFICIAL MAIN TEAM PICTURE + ACTIONS
           ========================================================================= */}
        <section className="relative bg-zinc-950 text-white overflow-hidden border-b border-zinc-800/80">
          <div className="absolute inset-0">
            <img 
              src={settings.heroBgUrl || "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop"} 
              alt="Club Background" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div 
              className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />
            <div 
              className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
              style={{ backgroundColor: accentColor }}
            />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Slogan, Logo Header, Title, Description, and CTAs */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                
                {/* Logo & Club Badge Header */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  {settings.logoUrl ? (
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900/90 border-2 p-2 shadow-2xl flex items-center justify-center backdrop-blur-md transform transition-transform hover:scale-105 shrink-0"
                      style={{ borderColor: primaryColor }}
                    >
                      <img src={settings.logoUrl} alt="Logo Oficial" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border-2 flex items-center justify-center font-black text-2xl shadow-2xl shrink-0"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {settings.appName ? settings.appName.charAt(0) : 'V'}
                    </div>
                  )}

                  <div className="flex flex-col items-center sm:items-start">
                    <div 
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider backdrop-blur-sm shadow-sm"
                      style={{
                        backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                        borderColor: `rgba(${primaryRgb}, 0.35)`,
                        color: '#ffffff'
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                      <span>{settings.slogan || 'Plataforma Oficial Deportiva'}</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-widest">
                      {settings.appName || 'CLUB DE VOLEIBOL'}
                    </span>
                  </div>
                </div>

                {/* Main Hero Title */}
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight">
                  {settings.heroTitle ? (
                    <span>{settings.heroTitle}</span>
                  ) : (
                    <>
                      Pasión, Disciplina y <span style={{ color: primaryColor }}>Victoria</span>
                    </>
                  )}
                </h1>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {settings.heroSubtitle || settings.description || 'Plataforma institucional para miembros, atletas y cuerpo técnico. Consulta rutinas de entrenamiento, galerías fotográficas, seguimiento de jugadores y control de categorías.'}
                </p>
                
                {/* Actions & Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  {!user ? (
                    <>
                      <button 
                        onClick={() => setShowLogin(true)}
                        className="inline-flex items-center gap-2.5 text-white px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 shadow-xl min-h-[48px]"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.45)`
                        }}
                      >
                        <span>{settings.ctaButtonText || 'Acceso a Miembros'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={handleActivateTrial}
                        className="inline-flex items-center gap-2 bg-zinc-900/90 text-amber-300 hover:text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all border border-amber-500/40 hover:border-amber-400 min-h-[48px] shadow-lg"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{isTrialActive ? `Pase Activo (Día ${currentDay}/7)` : 'Pase Gratis 7 Días'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <a 
                        href="#dashboard"
                        className="inline-flex items-center gap-2.5 text-white px-7 py-3.5 rounded-xl text-base font-bold transition-all transform hover:scale-105 border min-h-[48px]"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: `rgba(${primaryRgb}, 0.4)`,
                          boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.45)`
                        }}
                      >
                        <span>Ir a Entrenamientos</span>
                        <ArrowRight className="w-5 h-5" />
                      </a>

                      <a 
                        href="#profile"
                        className="inline-flex items-center gap-2 bg-zinc-900/90 text-zinc-300 hover:text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors border border-zinc-800 hover:border-zinc-700 min-h-[48px]"
                      >
                        {role === 'admin' ? 'Ficha de Dirección del Club' : 'Mi Ficha Deportiva'}
                      </a>
                    </>
                  )}
                </div>

                {/* Highlights bar */}
                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-zinc-400 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{settings.statsChampionships || '18'} Torneos oficiales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>{displayedAthletesCount}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Grand Official Main Team Presentation Frame */}
              <div className="lg:col-span-6">
                <div className="relative group">
                  
                  {/* Glowing background halo */}
                  <div 
                    className="absolute -inset-1 rounded-3xl opacity-40 blur-xl transition-all group-hover:opacity-75"
                    style={{ backgroundColor: primaryColor }}
                  />

                  {/* Main Presentation Card */}
                  <div className="relative bg-zinc-900/90 border-2 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md" style={{ borderColor: `${primaryColor}40` }}>
                    
                    {/* Official Card Top Bar */}
                    <div className="px-5 py-3 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Plantel Oficial Principal
                        </span>
                      </div>
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `rgba(${accentRgb}, 0.2)`,
                          color: accentColor
                        }}
                      >
                        Temporada {new Date().getFullYear()}
                      </span>
                    </div>

                    {/* Official Main Team Photo */}
                    <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-black">
                      <img 
                        src={mainTeamPhoto} 
                        alt="Equipo Principal" 
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                        onClick={() => setSelectedPhotoModal({
                          url: mainTeamPhoto,
                          title: 'Foto Oficial del Equipo Principal',
                          description: `Plantel deportivo oficial del ${settings.appName || 'Club'}. Integrantes de la máxima categoría competitiva.`,
                          tag: 'Plantel Principal'
                        })}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

                      {/* Logo watermark badge in bottom-left */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-2xl shadow-xl">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        ) : (
                          <Flame className="w-6 h-6" style={{ color: accentColor }} />
                        )}
                        <div>
                          <div className="text-xs font-black text-white uppercase tracking-wider">
                            {settings.appName || 'Voley Club'}
                          </div>
                          <div className="text-[10px] text-zinc-400">Equipo de Alta Competencia</div>
                        </div>
                      </div>

                      {/* Click to expand button */}
                      <button
                        onClick={() => setSelectedPhotoModal({
                          url: mainTeamPhoto,
                          title: 'Foto Oficial del Equipo Principal',
                          description: `Plantel deportivo oficial del ${settings.appName || 'Club'}. Integrantes de la máxima categoría competitiva.`,
                          tag: 'Plantel Principal'
                        })}
                        className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white p-2.5 rounded-xl border border-white/20 shadow-lg transition-transform hover:scale-110"
                        title="Ver en pantalla completa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Footer caption of the Team Card */}
                    <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">
                        {settings.appName || 'Club'} • Primera División
                      </span>
                      {role === 'admin' && (
                        <a 
                          href="#admin" 
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <span>Cambiar foto desde panel</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            RANDOM TRAINING PHOTOS SECTION (Fotos Aleatorias de Entrenamientos)
           ========================================================================= */}
        <section className="py-14 sm:py-20 bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header with Shuffle Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.12)`,
                    borderColor: `rgba(${accentRgb}, 0.3)`,
                    color: accentColor
                  }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Galería en Acción</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Fotos de Entrenamientos y Actividades
                </h2>
                <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                  Instantáneas de las prácticas diarias, rutinas de preparación física, saques y jugadas tácticas del club.
                </p>
              </div>

              {/* Control Buttons: Shuffle & Upload */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShufflePhotos}
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-800 hover:border-zinc-700 shadow-md transform active:scale-95"
                >
                  <Shuffle className="w-4 h-4 text-amber-400" />
                  <span>Ver otras fotos aleatorias</span>
                </button>

                {role === 'admin' && (
                  <a
                    href="#admin"
                    className="inline-flex items-center gap-1.5 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                  </a>
                )}
              </div>
            </div>

            {/* Training Photos Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingPhotos.map((photo, idx) => (
                <div 
                  key={photo.id + '-' + idx}
                  className="group relative bg-zinc-900/70 rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700 shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                  onClick={() => setSelectedPhotoModal({
                    url: photo.url,
                    title: photo.title,
                    description: photo.description,
                    tag: photo.tag
                  })}
                >
                  {/* Photo Container */}
                  <div className="relative h-56 w-full overflow-hidden bg-black">
                    <img 
                      src={photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow"
                        style={{
                          backgroundColor: `rgba(${primaryRgb}, 0.25)`,
                          borderColor: `rgba(${primaryRgb}, 0.5)`,
                          color: '#ffffff'
                        }}
                      >
                        {photo.tag}
                      </span>
                    </div>

                    {/* View Icon */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-2 rounded-xl border border-white/20">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Photo Info Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-950/80 border-t border-zinc-900">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                        {photo.category}
                      </span>
                      <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {photo.title}
                      </h3>
                      {photo.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {photo.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Sesión de Entrenamiento</span>
                      <span className="font-bold text-zinc-400 group-hover:text-white transition-colors">Ver foto →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Public Stats Section with Dynamic Counts */}
        <section className="py-12 bg-black border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Tournaments Participated / Campeonatos */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Trophy className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsChampionships || '18'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Torneos y Campeonatos
                </div>
              </div>
              
              {/* Registered Players / Athletes Count */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Users className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {displayedAthletesCount}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Jugadores Registrados
                </div>
              </div>

              {/* Categories */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Medal className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsCategories || 'Sub-13, Sub-15, Sub-17, Mayores'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Categorías del Club
                </div>
              </div>

              {/* Founded Year */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Star className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsFoundedYear || '2015'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Fundado en
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 7-Day Free Trial Banner for Visitors */}
        <section className="py-12 bg-gradient-to-b from-zinc-950 to-zinc-900/90 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className="rounded-3xl p-8 sm:p-10 border relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl"
              style={{
                backgroundColor: `rgba(${primaryRgb}, 0.07)`,
                borderColor: `rgba(${primaryRgb}, 0.25)`
              }}
            >
              <div className="max-w-2xl">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.15)`,
                    borderColor: `rgba(${accentRgb}, 0.3)`,
                    color: accentColor
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Acceso de Visita Gratuito</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Prueba 7 Días Gratis de Entrenamientos y Tácticas
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                  Conoce nuestra metodología deportiva sin costo. Explora videos de jugadas, tácticas de bloqueo y rutinas de preparación física guiadas por nuestros entrenadores certificados.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sin necesidad de tarjeta ni registro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Acceso completo por 7 días continuos</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto">
                <button
                  onClick={handleActivateTrial}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-3 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl transition-transform hover:scale-105 min-h-[52px]"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 8px 25px rgba(${primaryRgb}, 0.45)`
                  }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isTrialActive ? `Continuar Visita (Día ${currentDay}/7)` : 'Activar Pase Gratis de 7 Días'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-24 bg-black text-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <span 
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block"
                style={{ color: primaryColor }}
              >
                Módulos Integrados
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Plataforma Privada y de Rendimiento
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Gestionamos el progreso de nuestros deportistas con herramientas de alto nivel organizativo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Video className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature1Title || 'Videos de Entrenamiento'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature1Desc || 'Analiza jugadas, perfecciona técnicas de saque, remate y bloqueo con material grabado por el cuerpo técnico.'}
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Users className="w-7 h-7" style={{ color: accentColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature2Title || 'Fichas Deportivas y Médicas'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature2Desc || 'Registro completo de cada integrante con su foto deportiva formal, número de camiseta, posición y contactos de emergencia.'}
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <ShieldCheck className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature3Title || 'Control de Tesorería'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature3Desc || 'Seguimiento transparente de mensualidades, cuotas de uniformes y generación de comprobantes para miembros y familias.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Athlete & Public Comments Section */}
        <ClubCommentsSection />

        {/* Contact & Social Section */}
        <ContactSection />

      </main>
      
      {/* Lightbox Modal for Training Photos */}
      {selectedPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-2.5">
                {selectedPhotoModal.tag && (
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: `rgba(${primaryRgb}, 0.2)`,
                      color: primaryColor
                    }}
                  >
                    {selectedPhotoModal.tag}
                  </span>
                )}
                <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">
                  {selectedPhotoModal.title}
                </h4>
              </div>
              
              <button 
                onClick={() => setSelectedPhotoModal(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
              <img 
                src={selectedPhotoModal.url} 
                alt={selectedPhotoModal.title} 
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            {selectedPhotoModal.description && (
              <div className="p-5 bg-zinc-950 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800">
                {selectedPhotoModal.description}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-6 bg-black border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-xs text-zinc-500 gap-3">
        <div className="flex items-center gap-2">
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />}
          <span className="font-bold uppercase tracking-wider text-zinc-400">{settings.appName}</span>
        </div>
        <p className="text-[11px] font-mono tracking-wider uppercase">
          © {new Date().getFullYear()} {settings.appName}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span>{settings.statsFoundedYear ? `Fundado en ${settings.statsFoundedYear}` : 'Vóley Club'}</span>
        </div>
      </footer>
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

