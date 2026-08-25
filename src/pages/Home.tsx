import { useState, useEffect, useMemo, ChangeEvent, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Flame,
  Plus,
  Loader2,
  Check
} from 'lucide-react';
import { MediaItem } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

// Default dynamic volleyball training photos if no database photos are uploaded yet
const DEFAULT_TRAINING_PHOTOS = [
  {
    id: 'dt-1',
    title: 'Rutina de Saque en Suspensión y Potencia',
    category: 'Entrenamiento Táctico',
    url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1000&auto=format&fit=crop',
    tag: 'Saque y Remate',
    description: 'Sesión matutina enfocada en potencia de salto, rotación de hombro y precisión de saque.'
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

  // Quick upload states
  const [isUploadingMainTeam, setIsUploadingMainTeam] = useState(false);
  const [isUploadingTraining, setIsUploadingTraining] = useState(false);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState<string | null>(null);
  
  const mainTeamInputRef = useRef<HTMLInputElement | null>(null);
  const trainingInputRef = useRef<HTMLInputElement | null>(null);

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
        title: item.title || 'Foto de Entrenamiento',
        category: item.type === 'training' ? 'Entrenamiento' : 'Club',
        url: item.url,
        tag: item.type === 'training' ? 'Entreno' : 'Club',
        description: item.description || ''
      }));

    const combined = [...uploadedTrainings, ...DEFAULT_TRAINING_PHOTOS];
    
    // Deterministic shuffle with seed
    const shuffled = [...combined].sort(() => 0.5 - Math.sin(randomSeed + Math.random()));
    return shuffled.slice(0, 6);
  }, [mediaList, randomSeed]);

  const handleShufflePhotos = () => {
    setRandomSeed(prev => prev + 1);
  };

  // 1-Click direct upload for Main Team Group Image (No form, no questions asked)
  const handleQuickMainTeamUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMainTeam(true);
      const dataUrl = await compressImageFile(file, 1400, 950, 0.88);
      
      // Save directly to Firestore settings
      await setDoc(doc(db, 'settings', 'general'), {
        mainTeamImageUrl: dataUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setQuickUploadSuccess('¡Foto general del equipo actualizada con éxito!');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen del equipo');
    } finally {
      setIsUploadingMainTeam(false);
      if (e.target) e.target.value = '';
    }
  };

  // 1-Click direct upload for Training Photo (No title, no category, no description needed)
  const handleQuickTrainingUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingTraining(true);
      let count = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await compressImageFile(file, 1200, 900, 0.85);
        
        // Auto-save directly into media collection with zero extra prompts
        await addDoc(collection(db, 'media'), {
          title: `Entrenamiento ${new Date().toLocaleDateString('es-ES')}`,
          description: '',
          type: 'training',
          url: dataUrl,
          createdAt: serverTimestamp()
        });
        count++;
      }

      setQuickUploadSuccess(count > 1 ? `¡${count} fotos de entrenamiento agregadas!` : '¡Foto de entrenamiento agregada!');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar la foto de entrenamiento');
    } finally {
      setIsUploadingTraining(false);
      if (e.target) e.target.value = '';
    }
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
            HERO SECTION:
            1. Slogan + Logo + Title "Pasión, Disciplina y Victoria"
            2. Large General Group Image directly below title with 1-click change option
            3. Small Training Thumbnails directly below the group image with 1-click add
           ========================================================================= */}
        <section className="relative bg-zinc-950 text-white overflow-hidden border-b border-zinc-800/80">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src={settings.heroBgUrl || "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop"} 
              alt="Club Background" 
              className="w-full h-full object-cover opacity-15"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-zinc-950/80" />
            <div 
              className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />
            <div 
              className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
              style={{ backgroundColor: accentColor }}
            />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            
            {/* Quick Upload Toast Alert */}
            {quickUploadSuccess && (
              <div className="mb-6 mx-auto max-w-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-2xl animate-fade-in backdrop-blur-md">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{quickUploadSuccess}</span>
              </div>
            )}

            {/* 1. Header & Title Block */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              
              {/* Club Logo & Slogan Header */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                {settings.logoUrl ? (
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900/90 border p-1.5 shadow-xl flex items-center justify-center backdrop-blur-md shrink-0"
                    style={{ borderColor: primaryColor }}
                  >
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div 
                    className="w-12 h-12 rounded-2xl bg-zinc-900 border flex items-center justify-center font-black text-xl shadow-xl shrink-0"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    {settings.appName ? settings.appName.charAt(0) : 'V'}
                  </div>
                )}

                <div 
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider backdrop-blur-sm shadow-sm"
                  style={{
                    backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                    borderColor: `rgba(${primaryRgb}, 0.35)`,
                    color: '#ffffff'
                  }}
                >
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                  <span>{settings.slogan || 'Plataforma Oficial Deportiva'}</span>
                </div>
              </div>

              {/* Main Hero Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                {settings.heroTitle ? (
                  <span>{settings.heroTitle}</span>
                ) : (
                  <>
                    Pasión, Disciplina y <span style={{ color: primaryColor }}>Victoria</span>
                  </>
                )}
              </h1>

              {/* Subtitle / Description */}
              <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                {settings.heroSubtitle || settings.description || 'Plataforma institucional para miembros, atletas y cuerpo técnico. Consulta rutinas de entrenamiento, galerías fotográficas, seguimiento de jugadores y control de categorías.'}
              </p>
              
              {/* Actions & Trial Button */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {!user ? (
                  <>
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 shadow-xl min-h-[46px]"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.45)`
                      }}
                    >
                      <span>{settings.ctaButtonText || 'Acceso a Miembros'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={handleActivateTrial}
                      className="inline-flex items-center gap-2 bg-zinc-900/90 text-amber-300 hover:text-white px-5 py-3 rounded-xl text-sm font-bold transition-all border border-amber-500/40 hover:border-amber-400 min-h-[46px] shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{isTrialActive ? `Pase Activo (Día ${currentDay}/7)` : 'Pase Gratis 7 Días'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a 
                      href="#dashboard"
                      className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 border min-h-[46px]"
                      style={{
                        backgroundColor: primaryColor,
                        borderColor: `rgba(${primaryRgb}, 0.4)`,
                        boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.45)`
                      }}
                    >
                      <span>Ir a Entrenamientos</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>

                    <a 
                      href="#profile"
                      className="inline-flex items-center gap-2 bg-zinc-900/90 text-zinc-300 hover:text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors border border-zinc-800 hover:border-zinc-700 min-h-[46px]"
                    >
                      {role === 'admin' ? 'Ficha de Dirección del Club' : 'Mi Ficha Deportiva'}
                    </a>
                  </>
                )}
              </div>

            </div>

            {/* 2. LARGE GENERAL GROUP IMAGE (Directly below Title) */}
            <div className="mt-10 max-w-4xl mx-auto">
              <div className="relative group">
                
                {/* Glowing border glow effect */}
                <div 
                  className="absolute -inset-1 rounded-3xl opacity-35 blur-xl transition-all group-hover:opacity-60 pointer-events-none"
                  style={{ backgroundColor: primaryColor }}
                />

                {/* Main Card Container */}
                <div 
                  className="relative bg-zinc-900 border-2 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md" 
                  style={{ borderColor: `${primaryColor}50` }}
                >
                  
                  {/* Top Bar Header */}
                  <div className="px-4 sm:px-6 py-3 bg-zinc-950/95 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        {settings.appName || 'Club de Voleibol'} • Plantel Principal
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                        style={{
                          backgroundColor: `rgba(${accentRgb}, 0.15)`,
                          borderColor: `rgba(${accentRgb}, 0.3)`,
                          color: accentColor
                        }}
                      >
                        Temporada {new Date().getFullYear()}
                      </span>

                      {/* 1-Click Direct Change Group Image Button (No form, no prompts) */}
                      <button
                        type="button"
                        onClick={() => mainTeamInputRef.current?.click()}
                        disabled={isUploadingMainTeam}
                        className="inline-flex items-center gap-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1 rounded-lg text-[11px] font-bold transition-all border border-zinc-700 shadow-sm cursor-pointer"
                        title="Cambiar foto general del grupo directamente desde tu carpeta"
                      >
                        {isUploadingMainTeam ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cambiar Imagen del Grupo</span>
                          </>
                        )}
                      </button>

                      {/* Hidden direct file input */}
                      <input 
                        type="file" 
                        ref={mainTeamInputRef}
                        accept="image/*"
                        onChange={handleQuickMainTeamUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Main Large Photo Frame */}
                  <div className="relative h-64 sm:h-96 md:h-[420px] w-full overflow-hidden bg-black">
                    <img 
                      src={mainTeamPhoto} 
                      alt="Foto General del Grupo" 
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102 cursor-pointer"
                      onClick={() => setSelectedPhotoModal({
                        url: mainTeamPhoto,
                        title: 'Foto General del Grupo / Plantel Oficial',
                        description: `Plantel deportivo oficial del ${settings.appName || 'Club'}. Integrantes de la máxima categoría competitiva.`,
                        tag: 'Plantel Principal'
                      })}
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent pointer-events-none" />

                    {/* Watermark logo badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-zinc-950/85 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-2xl shadow-xl">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                      ) : (
                        <Flame className="w-6 h-6" style={{ color: accentColor }} />
                      )}
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider">
                          {settings.appName || 'Club de Voleibol'}
                        </div>
                        <div className="text-[10px] text-zinc-400">Equipo de Alta Competencia</div>
                      </div>
                    </div>

                    {/* Expand Lightbox Button */}
                    <button
                      onClick={() => setSelectedPhotoModal({
                        url: mainTeamPhoto,
                        title: 'Foto General del Grupo / Plantel Oficial',
                        description: `Plantel deportivo oficial del ${settings.appName || 'Club'}. Integrantes de la máxima categoría competitiva.`,
                        tag: 'Plantel Principal'
                      })}
                      className="absolute bottom-4 right-4 bg-black/75 hover:bg-black text-white p-2.5 rounded-xl border border-white/20 shadow-lg transition-transform hover:scale-110"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* 3. SMALL TRAINING THUMBNAILS (Directly below the General Group Image) */}
            <div className="mt-8 max-w-4xl mx-auto bg-zinc-950/80 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 shadow-xl backdrop-blur-md">
              
              {/* Header Bar for Small Training Photos */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Fotos de Entrenamientos y Prácticas
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({trainingPhotos.length} en rotación)
                  </span>
                </div>

                {/* Direct Action Buttons: Shuffle & Direct 1-Click Upload (No form required) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShufflePhotos}
                    className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-zinc-800 hover:border-zinc-700 shadow-sm"
                    title="Ver otras fotos aleatorias"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mezclar</span>
                  </button>

                  {/* 1-Click Direct Upload Training Photo (No Title, No Category, No Description) */}
                  <button
                    type="button"
                    onClick={() => trainingInputRef.current?.click()}
                    disabled={isUploadingTraining}
                    className="inline-flex items-center gap-1.5 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md transform active:scale-95 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    title="Subir foto de entrenamiento directamente desde tu carpeta sin formularios"
                  >
                    {isUploadingTraining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subir Foto de Entrenamiento</span>
                      </>
                    )}
                  </button>

                  {/* Hidden file input for quick training upload (supports multiple images) */}
                  <input 
                    type="file" 
                    ref={trainingInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleQuickTrainingUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Compact Responsive Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {trainingPhotos.map((photo, idx) => (
                  <div 
                    key={photo.id + '-' + idx}
                    className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 bg-black aspect-video sm:aspect-square md:aspect-video cursor-pointer shadow-md transition-all duration-300 hover:scale-105"
                    onClick={() => setSelectedPhotoModal({
                      url: photo.url,
                      title: photo.title,
                      description: photo.description || 'Fotografía de los entrenamientos y prácticas deportivas del club.',
                      tag: photo.tag
                    })}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                    
                    {/* Tiny tag label */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <span className="text-[9px] font-bold text-white block truncate drop-shadow-sm">
                        {photo.tag || photo.title}
                      </span>
                    </div>

                    {/* Zoom Icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black/80 p-1.5 rounded-lg border border-white/20 text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

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
      
      {/* Lightbox Modal for Training & Group Photos */}
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

