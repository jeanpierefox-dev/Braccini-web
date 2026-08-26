import React, { useState, useEffect, useMemo, ChangeEvent, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { LoginModal } from '../components/LoginModal';
import { ClubCommentsSection } from '../components/ClubCommentsSection';
import { ContactSection } from '../components/ContactSection';
import { PublicationCommentsModal } from '../components/PublicationCommentsModal';
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
  Check,
  MessageSquare,
  Heart,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { MediaItem } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

// High-definition dynamic sports action and training photos
const DEFAULT_ACTION_PHOTOS = [
  {
    id: 'def-act-1',
    title: 'THE GAME IS WON IN THE TRENCHES',
    subtitle: 'Preparación de alto impacto y concentración en cancha',
    category: 'Entrenamiento Físico y Táctico',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1400&auto=format&fit=crop',
    tag: 'Acción y Fuerza',
    description: 'Drills de máxima intensidad, aceleración y choque táctico en jugadas divididas.'
  },
  {
    id: 'def-act-2',
    title: 'POTENCIA Y DESPLIEGUE OFENSIVO',
    subtitle: 'Ataques rápidos y sincronización de remate',
    category: 'Ofensiva y Remate',
    url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1400&auto=format&fit=crop',
    tag: 'Salto y Remate',
    description: 'Rutinas de salto explosivo, impacto al balón y búsqueda de ángulos imposibles.'
  },
  {
    id: 'def-act-3',
    title: 'MURO DEFENSIVO Y LECTURA DE JUEGO',
    subtitle: 'Coordinación milimétrica para neutralizar el ataque rival',
    category: 'Bloqueo y Cobertura',
    url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1400&auto=format&fit=crop',
    tag: 'Bloqueo Táctico',
    description: 'Posicionamiento estratégico en la red y cobertura de segundas pelotas.'
  },
  {
    id: 'def-act-4',
    title: 'AGILIDAD Y REFLEJOS EN RECEPCIÓN',
    subtitle: 'Control total bajo máxima presión de saque',
    category: 'Defensa y Recepción',
    url: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1400&auto=format&fit=crop',
    tag: 'Defensa de Campo',
    description: 'Desplazamientos veloces y armado limpio desde el fondo del terreno.'
  },
  {
    id: 'def-act-5',
    title: 'VISIÓN Y ESTRATEGIA DE EQUIPO',
    subtitle: 'Dirección técnica y trabajo coordinado en cancha',
    category: 'Estrategia',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1400&auto=format&fit=crop',
    tag: 'Estrategia Grupal',
    description: 'Armado rápido y combinaciones sincronizadas de jugadas preestablecidas.'
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
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Rotating Random Action Photo state (Mockup bottom block)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Modals
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    title: string;
    description?: string;
    tag?: string;
  } | null>(null);

  const [activeCommentsModal, setActiveCommentsModal] = useState<{
    mediaId: string;
    mediaTitle: string;
    mediaUrl: string;
    mediaCategory?: string;
  } | null>(null);

  // Admin Quick Upload States (Strictly for role === 'admin')
  const [isUploadingMainHero, setIsUploadingMainHero] = useState(false);
  const [isUploadingTrainingPhoto, setIsUploadingTrainingPhoto] = useState(false);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState<string | null>(null);
  
  const mainHeroInputRef = useRef<HTMLInputElement | null>(null);
  const trainingInputRef = useRef<HTMLInputElement | null>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#ccff00'; // Lime / vibrant athletic accent matching mockup
  const accentRgb = settings.accentRgb || '204, 255, 0';

  // Count registered players
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
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
      snapshot.forEach(d => {
        items.push({ id: d.id, ...d.data() } as MediaItem);
      });
      setMediaList(items);
    }, (err) => {
      console.warn("Could not fetch media items:", err);
    });
    return () => unsubscribe();
  }, []);

  // Listen to publication comments count in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'publication_comments'), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(d => {
        const data = d.data();
        if (data.mediaId) {
          counts[data.mediaId] = (counts[data.mediaId] || 0) + 1;
        }
      });
      setCommentsCounts(counts);
    }, (err) => {
      console.warn("Could not fetch comments counts:", err);
    });
    return () => unsubscribe();
  }, []);

  // Action / Training photos list (Combined custom uploaded trainings + defaults)
  const rotatingPhotos = useMemo(() => {
    const uploaded = mediaList
      .filter(item => item.url && !item.url.includes('youtube.com') && !item.url.includes('youtu.be'))
      .map(item => ({
        id: item.id || '',
        title: item.title || 'Sesión de Entrenamiento Oficial',
        subtitle: item.description || 'Entrenamiento táctico y preparación deportiva del club',
        category: item.type === 'training' ? 'Entrenamiento' : 'Club',
        url: item.url,
        tag: item.type === 'training' ? 'Entrenamiento' : 'Publicación',
        description: item.description || 'Contenido oficial publicado por el cuerpo técnico y administración del club.'
      }));

    if (uploaded.length > 0) {
      return [...uploaded, ...DEFAULT_ACTION_PHOTOS];
    }
    return DEFAULT_ACTION_PHOTOS;
  }, [mediaList]);

  // Automatic random rotation every 4.5 seconds
  useEffect(() => {
    if (!isAutoRotating || rotatingPhotos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => {
        // Random next index different from previous
        let next = Math.floor(Math.random() * rotatingPhotos.length);
        if (next === prev && rotatingPhotos.length > 1) {
          next = (prev + 1) % rotatingPhotos.length;
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoRotating, rotatingPhotos.length]);

  const activeSlidePhoto = rotatingPhotos[currentSlideIndex] || rotatingPhotos[0] || DEFAULT_ACTION_PHOTOS[0];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % rotatingPhotos.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + rotatingPhotos.length) % rotatingPhotos.length);
  };

  const handleRandomSlide = () => {
    const next = Math.floor(Math.random() * rotatingPhotos.length);
    setCurrentSlideIndex(next);
  };

  // Like publication
  const handleLikePost = async (postId: string) => {
    if (!postId || likedPosts[postId]) return;
    try {
      setLikedPosts(prev => ({ ...prev, [postId]: true }));
      const docRef = doc(db, 'media', postId);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });
    } catch {
      // If local preset, just mark liked
    }
  };

  // -------------------------------------------------------------
  // ADMIN-ONLY ACTIONS (Role === 'admin' strictly verified)
  // -------------------------------------------------------------

  // Admin upload Main Hero Image
  const handleQuickMainHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene permisos para cambiar la imagen de portada.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMainHero(true);
      const dataUrl = await compressImageFile(file, 1600, 1100, 0.9);
      
      // Save directly into settings
      await setDoc(doc(db, 'settings', 'general'), {
        mainTeamImageUrl: dataUrl,
        heroBgUrl: dataUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setQuickUploadSuccess('¡Foto principal de portada actualizada con éxito!');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen de portada');
    } finally {
      setIsUploadingMainHero(false);
      if (e.target) e.target.value = '';
    }
  };

  // Admin upload Training Photos (1 or multiple)
  const handleQuickTrainingUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene permisos para subir fotos de entrenamiento.');
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingTrainingPhoto(true);
      let count = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await compressImageFile(file, 1300, 950, 0.86);
        const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const autoTitle = fileNameClean ? (fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1)) : 'Entrenamiento Oficial';

        await addDoc(collection(db, 'media'), {
          title: autoTitle,
          description: 'Sesión de entrenamiento del club subida por la Administración.',
          type: 'training',
          url: dataUrl,
          likesCount: 0,
          createdBy: user?.email || 'admin',
          createdAt: serverTimestamp()
        });
        count++;
      }

      setQuickUploadSuccess(count > 1 ? `¡${count} fotos de entrenamiento agregadas con éxito!` : '¡Foto de entrenamiento agregada!');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar foto de entrenamiento');
    } finally {
      setIsUploadingTrainingPhoto(false);
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

  // Main Hero background photo (either custom admin photo or sports hero)
  const mainHeroPhoto = settings.mainTeamImageUrl || settings.heroBgUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-slate-100 selection:bg-lime-400 selection:text-black">
      <main className="flex-1">
        
        {/* Toast Alert for Admin Uploads */}
        {quickUploadSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-black shadow-2xl backdrop-blur-xl animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{quickUploadSuccess}</span>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: TOP MAIN HERO (MATCHING MOCKUP IMG_5139.jpeg)
            - Large cinematic photo full width
            - Centered bold serif/display title: "THE GAME IS WON IN THE TRENCHES"
            - Contrast Action Button: "GET STARTED FOR FREE" / "ACCESO A MIEMBROS"
            - Admin-only change photo button
           ========================================================================= */}
        <section className="relative w-full min-h-[520px] sm:min-h-[620px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-black border-b border-zinc-800">
          
          {/* Main Background Image */}
          <div className="absolute inset-0">
            <img 
              src={mainHeroPhoto} 
              alt={settings.heroTitle || "Portada Oficial"} 
              className="w-full h-full object-cover object-center brightness-95"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80" />
          </div>

          {/* Top Admin Controls (Visible ONLY to Admin) */}
          {role === 'admin' && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => mainHeroInputRef.current?.click()}
                disabled={isUploadingMainHero}
                className="inline-flex items-center gap-2 bg-black/85 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/50 shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                title="Solo Administrador: Cambiar imagen de portada principal"
              >
                {isUploadingMainHero ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Guardando Portada...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin: Cambiar Portada Principal</span>
                  </>
                )}
              </button>

              <input 
                type="file" 
                ref={mainHeroInputRef}
                accept="image/*"
                onChange={handleQuickMainHeroUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Centered Hero Content (Mockup Design) */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8 py-16 sm:py-24">
            
            {/* Club Brand Tag */}
            <div className="flex items-center justify-center gap-2.5">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain drop-shadow-xl" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm"
                  style={{ backgroundColor: '#ccff00' }}
                >
                  {settings.appName ? settings.appName.charAt(0) : 'C'}
                </div>
              )}
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white/90 drop-shadow-md">
                {settings.appName || 'CLUB DEPORTIVO'}
              </span>
            </div>

            {/* Display Headline - Exactly in the style of "THE GAME IS WON IN THE TRENCHES" */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif sm:font-black font-extrabold text-white uppercase tracking-wider leading-tight sm:leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] max-w-3xl mx-auto">
              {settings.heroTitle ? (
                settings.heroTitle
              ) : (
                <>THE GAME IS WON IN THE TRENCHES</>
              )}
            </h1>

            {/* Subtitle / Philosophy */}
            <p className="text-xs sm:text-base text-zinc-300 font-medium max-w-xl mx-auto leading-relaxed drop-shadow-md">
              {settings.heroSubtitle || settings.slogan || 'Disciplina, intensidad y pasión en cada sesión de entrenamiento.'}
            </p>

            {/* High-Contrast Action Button (Lime Yellow / Accent matching mockup) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              {!user ? (
                <>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-none sm:rounded-sm font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: '#ccff00', // Lime yellow from mockup
                      boxShadow: '0 10px 30px rgba(204, 255, 0, 0.4)'
                    }}
                  >
                    <span>{settings.ctaButtonText || 'GET STARTED FOR FREE'}</span>
                  </button>

                  <button
                    onClick={handleActivateTrial}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-none sm:rounded-sm font-bold text-xs uppercase tracking-wider text-white bg-black/80 hover:bg-black border border-white/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isTrialActive ? `Pase Activo (Día ${currentDay}/7)` : 'Pase Gratis 7 Días'}</span>
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="#dashboard"
                    className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-black shadow-2xl transition-transform hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-sm"
                    style={{
                      backgroundColor: '#ccff00',
                      boxShadow: '0 10px 30px rgba(204, 255, 0, 0.4)'
                    }}
                  >
                    <span>ENTRENAMIENTOS Y VIDEOS</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href="#profile"
                    className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-white bg-black/80 hover:bg-black border border-white/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-sm"
                  >
                    {role === 'admin' ? 'PANEL DE ADMINISTRACIÓN' : 'MI PERFIL DE JUGADOR'}
                  </a>
                </>
              )}
            </div>

          </div>

        </section>


        {/* =========================================================================
            SECTION 2: LOWER ROTATING TRAINING & ACTION BLOCK (MATCHING MOCKUP)
            - Directly underneath the top hero
            - High impact action photo changing automatically & randomly
            - Full commenting capability on each publication
            - Admin-only training photo upload button
           ========================================================================= */}
        <section className="relative w-full min-h-[480px] sm:min-h-[580px] md:min-h-[660px] flex items-center justify-center overflow-hidden bg-black border-b border-zinc-800">
          
          {/* Action Background Image with Cross-fade transition */}
          <div className="absolute inset-0">
            <img 
              key={activeSlidePhoto.id + '-' + activeSlidePhoto.url}
              src={activeSlidePhoto.url} 
              alt={activeSlidePhoto.title} 
              className="w-full h-full object-cover object-center brightness-90 animate-fade-in transition-all duration-700"
            />
            {/* Dramatic Lighting Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
          </div>

          {/* Admin-only Upload Control on Training Block */}
          {role === 'admin' && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => trainingInputRef.current?.click()}
                disabled={isUploadingTrainingPhoto}
                className="inline-flex items-center gap-2 bg-black/90 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/50 shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                title="Solo Administrador: Subir fotos de entrenamiento directamente"
              >
                {isUploadingTrainingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Subiendo Foto(s)...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin: + Subir Foto de Entrenamiento</span>
                  </>
                )}
              </button>

              <input 
                type="file" 
                ref={trainingInputRef}
                accept="image/*"
                multiple
                onChange={handleQuickTrainingUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Slide Navigation Arrows */}
          <div className="absolute inset-y-0 left-2 sm:left-4 z-20 flex items-center">
            <button
              onClick={handlePrevSlide}
              className="p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
              title="Foto anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-2 sm:right-4 z-20 flex items-center">
            <button
              onClick={handleNextSlide}
              className="p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
              title="Siguiente foto"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Lower Hero Action Content & Controls */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-6 py-14 sm:py-20">
            
            {/* Category & Random Switch Indicator */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span 
                className="px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-black shadow-lg"
                style={{ backgroundColor: '#ccff00' }}
              >
                {activeSlidePhoto.category || 'ENTRENAMIENTO OFICIAL'}
              </span>

              <button
                onClick={handleRandomSlide}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 backdrop-blur-md transition-colors cursor-pointer"
                title="Cambiar foto aleatoriamente"
              >
                <Shuffle className="w-3 h-3 text-amber-400" />
                <span>Foto Aleatoria</span>
              </button>

              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  isAutoRotating 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
                title="Pausar o activar rotación automática"
              >
                {isAutoRotating ? '● Rotación Activa' : '○ Pausado'}
              </button>
            </div>

            {/* Title & Description of Current Photo */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-xl max-w-2xl mx-auto">
                {activeSlidePhoto.title}
              </h2>
              {activeSlidePhoto.description && (
                <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed drop-shadow-md">
                  {activeSlidePhoto.description}
                </p>
              )}
            </div>

            {/* Action Bar: Comments Button + Like + Lightbox */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              
              {/* DIRECT COMMENT BUTTON FOR THIS PUBLICATION */}
              <button
                onClick={() => setActiveCommentsModal({
                  mediaId: activeSlidePhoto.id,
                  mediaTitle: activeSlidePhoto.title,
                  mediaUrl: activeSlidePhoto.url,
                  mediaCategory: activeSlidePhoto.category
                })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
              >
                <MessageSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Comentar Publicación</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {commentsCounts[activeSlidePhoto.id] || 0}
                </span>
              </button>

              {/* LIKE BUTTON */}
              <button
                onClick={() => handleLikePost(activeSlidePhoto.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${
                  likedPosts[activeSlidePhoto.id]
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                }`}
                title="Me gusta esta foto"
              >
                <Heart className={`w-4 h-4 ${likedPosts[activeSlidePhoto.id] ? 'fill-current text-rose-500' : 'text-rose-400'}`} />
                <span>Me Gusta</span>
              </button>

              {/* FULLSCREEN LIGHTBOX */}
              <button
                onClick={() => setSelectedPhotoModal({
                  url: activeSlidePhoto.url,
                  title: activeSlidePhoto.title,
                  description: activeSlidePhoto.description,
                  tag: activeSlidePhoto.tag
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                title="Ver en pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Ampliar</span>
              </button>

            </div>

            {/* Thumbnail Navigation Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {rotatingPhotos.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx 
                      ? 'w-6 bg-lime-400' 
                      : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
                  }`}
                  title={`Foto ${idx + 1}`}
                />
              ))}
            </div>

          </div>

        </section>


        {/* =========================================================================
            SECTION 3: PUBLIC PUBLICATIONS & TRAINING GALLERY FEED
            - Each post created by the Admin can be commented on
           ========================================================================= */}
        <section className="py-14 sm:py-20 bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-lime-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span>Galería de Entrenamientos y Actividades</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Publicaciones Oficiales del Club
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                  Todas las fotos y sesiones del cuerpo técnico. Haz clic en "Comentar" en cualquier publicación para compartir tu opinión.
                </p>
              </div>

              {/* Admin quick upload trigger */}
              {role === 'admin' && (
                <button
                  onClick={() => trainingInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Subir Nuevas Fotos</span>
                </button>
              )}
            </div>

            {/* Publications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rotatingPhotos.map((photo, idx) => (
                <div 
                  key={photo.id + '-grid-' + idx}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl flex flex-col transition-all duration-300 hover:shadow-2xl group"
                >
                  {/* Photo Frame */}
                  <div className="relative h-56 bg-black overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPhotoModal({
                      url: photo.url,
                      title: photo.title,
                      description: photo.description,
                      tag: photo.tag
                    })}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    
                    {/* Category Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 text-lime-300 border border-lime-400/30 backdrop-blur-md">
                        {photo.category}
                      </span>
                    </div>

                    <button
                      className="absolute bottom-3 right-3 p-2 bg-black/80 text-white rounded-xl border border-white/20 hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                      title="Ampliar foto"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body & Comments Actions */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-white line-clamp-1 group-hover:text-lime-300 transition-colors">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {photo.description || 'Sesión de entrenamiento del club.'}
                      </p>
                    </div>

                    {/* Footer Actions: Comment Button + Likes */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <button
                        onClick={() => setActiveCommentsModal({
                          mediaId: photo.id,
                          mediaTitle: photo.title,
                          mediaUrl: photo.url,
                          mediaCategory: photo.category
                        })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 bg-lime-400/10 hover:bg-lime-400/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comentar</span>
                        <span className="text-[10px] font-mono ml-0.5">
                          ({commentsCounts[photo.id] || 0})
                        </span>
                      </button>

                      <button
                        onClick={() => handleLikePost(photo.id)}
                        className={`inline-flex items-center gap-1 text-xs transition-colors cursor-pointer p-1.5 rounded-lg ${
                          likedPosts[photo.id] ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-400 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts[photo.id] ? 'fill-current text-rose-500' : ''}`} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* =========================================================================
            SECTION 4: PUBLIC STATS
           ========================================================================= */}
        <section className="py-12 bg-black border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              
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

        {/* 7-Day Free Trial Banner */}
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
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border bg-amber-500/20 text-amber-300 border-amber-500/40"
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
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-3 text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl transition-transform hover:scale-105 min-h-[52px]"
                  style={{
                    backgroundColor: '#ccff00',
                    boxShadow: '0 8px 25px rgba(204, 255, 0, 0.45)'
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
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block text-lime-400"
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
              
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'rgba(204, 255, 0, 0.15)' }}
                >
                  <Users className="w-7 h-7 text-lime-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature2Title || 'Fichas Deportivas y Médicas'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature2Desc || 'Registro completo de cada integrante con su foto deportiva formal, número de camiseta, posición y contactos de emergencia.'}
                </p>
              </div>
              
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
                  {settings.feature3Desc || 'Seguimiento transparente de mensualidades, cuotas de uniformes y comprobantes para miembros y familias.'}
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
      
      {/* Lightbox Modal for Photo Inspection */}
      {selectedPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-2.5">
                {selectedPhotoModal.tag && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-lime-400 text-black">
                    {selectedPhotoModal.tag}
                  </span>
                )}
                <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">
                  {selectedPhotoModal.title}
                </h4>
              </div>
              
              <button 
                onClick={() => setSelectedPhotoModal(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
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

      {/* Interactive Publication Comments Modal */}
      {activeCommentsModal && (
        <PublicationCommentsModal
          isOpen={true}
          mediaId={activeCommentsModal.mediaId}
          mediaTitle={activeCommentsModal.mediaTitle}
          mediaUrl={activeCommentsModal.mediaUrl}
          mediaCategory={activeCommentsModal.mediaCategory}
          onClose={() => setActiveCommentsModal(null)}
        />
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
          <span>{settings.statsFoundedYear ? `Fundado en ${settings.statsFoundedYear}` : 'Club Deportivo'}</span>
        </div>
      </footer>
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
