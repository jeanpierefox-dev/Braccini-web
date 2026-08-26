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
  deleteDoc,
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
  HelpCircle,
  Edit3,
  Trash2,
  Shield,
  Layers
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

  // Action / Training photos list (Combined custom uploaded trainings + defaults minus hidden)
  const [editingPost, setEditingPost] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    url: string;
    isDefault?: boolean;
  } | null>(null);
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);

  const rotatingPhotos = useMemo(() => {
    const hiddenSet = new Set(settings.hiddenDefaultPublications || []);
    
    const uploaded = mediaList
      .filter(item => item.url && !item.url.includes('youtube.com') && !item.url.includes('youtu.be'))
      .map(item => ({
        id: item.id || '',
        title: item.title || 'Sesión de Entrenamiento Oficial',
        subtitle: item.description || 'Entrenamiento táctico y preparación deportiva del club',
        category: item.type === 'training' ? 'Entrenamiento' : 'Club',
        url: item.url,
        tag: item.type === 'training' ? 'Entrenamiento' : 'Publicación',
        description: item.description || 'Contenido oficial publicado por el cuerpo técnico y administración del club.',
        isDefault: false
      }));

    const validDefaults = DEFAULT_ACTION_PHOTOS.filter(p => !hiddenSet.has(p.id));

    if (uploaded.length > 0) {
      return [...uploaded, ...validDefaults];
    }
    return validDefaults.length > 0 ? validDefaults : DEFAULT_ACTION_PHOTOS;
  }, [mediaList, settings.hiddenDefaultPublications]);

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

  // Admin Delete Publication (Works for both custom and default items)
  const handleDeletePublication = async (photo: { id: string; title: string; isDefault?: boolean }) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene permisos para eliminar publicaciones.');
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la publicación "${photo.title}"?`);
    if (!confirmDelete) return;

    try {
      if (photo.isDefault || photo.id.startsWith('def-')) {
        // Hide default publication
        const currentHidden = settings.hiddenDefaultPublications || [];
        if (!currentHidden.includes(photo.id)) {
          await setDoc(doc(db, 'settings', 'general'), {
            hiddenDefaultPublications: [...currentHidden, photo.id],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
        // Delete Firestore document
        await deleteDoc(doc(db, 'media', photo.id));
      }
      setQuickUploadSuccess('Publicación eliminada correctamente.');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la publicación.');
    }
  };

  // Admin Save Edited Publication
  const handleSavePublicationEdit = async () => {
    if (!editingPost || role !== 'admin') return;

    try {
      setIsSavingPostEdit(true);

      if (editingPost.isDefault || editingPost.id.startsWith('def-')) {
        // If editing a default post, create a new media item with edited data and hide the default
        await addDoc(collection(db, 'media'), {
          title: editingPost.title,
          description: editingPost.description,
          type: editingPost.category === 'Entrenamiento' ? 'training' : 'general',
          url: editingPost.url,
          likesCount: 0,
          createdBy: user?.email || 'admin',
          createdAt: serverTimestamp()
        });

        const currentHidden = settings.hiddenDefaultPublications || [];
        if (!currentHidden.includes(editingPost.id)) {
          await setDoc(doc(db, 'settings', 'general'), {
            hiddenDefaultPublications: [...currentHidden, editingPost.id],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
        // Update existing media document
        await updateDoc(doc(db, 'media', editingPost.id), {
          title: editingPost.title,
          description: editingPost.description,
          type: editingPost.category === 'Entrenamiento' ? 'training' : 'general',
          url: editingPost.url,
          updatedAt: serverTimestamp()
        });
      }

      setQuickUploadSuccess('¡Publicación actualizada correctamente!');
      setEditingPost(null);
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar los cambios de la publicación.');
    } finally {
      setIsSavingPostEdit(false);
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
            SECTION 1: TOP MAIN HERO (FULL PORTADA IMAGE + TEXT UNDERNEATH)
            - Enlarged club logo highlighted at top
            - Complete portada image (not background crop)
            - Words and action buttons placed underneath the image
            - Admin-only change portada photo control
           ========================================================================= */}
        <section className="relative w-full bg-black border-b border-zinc-800 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Top Club Identity - Highlighted & Enlarged Logo */}
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              {settings.logoUrl ? (
                <div className="relative p-1.5 rounded-3xl bg-zinc-900 border-2 border-lime-400/40 shadow-[0_0_25px_rgba(204,255,0,0.2)]">
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo Oficial" 
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain rounded-2xl drop-shadow-2xl" 
                  />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center font-black text-black text-3xl sm:text-4xl shadow-[0_0_25px_rgba(204,255,0,0.3)] border-2 border-white/20"
                  style={{ backgroundColor: '#ccff00' }}
                >
                  {settings.appName ? settings.appName.charAt(0) : 'C'}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-lime-400">
                  {settings.appName || 'CLUB DEPORTIVO'}
                </span>
                {settings.slogan && (
                  <p className="text-xs text-zinc-400 font-medium tracking-wide">
                    {settings.slogan}
                  </p>
                )}
              </div>
            </div>

            {/* Complete Portada Image Container (Not cropped background) */}
            <div className="relative bg-zinc-950 rounded-3xl border border-zinc-800 p-2 sm:p-4 shadow-2xl overflow-hidden group">
              <div className="relative w-full flex items-center justify-center bg-black/90 rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[420px] max-h-[560px]">
                <img 
                  src={mainHeroPhoto} 
                  alt={settings.heroTitle || "Portada Oficial del Club"} 
                  className="w-full h-auto max-h-[560px] object-contain mx-auto rounded-xl shadow-inner transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>

              {/* Admin-only Button to Change Portada */}
              {role === 'admin' && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                  <button
                    onClick={() => mainHeroInputRef.current?.click()}
                    disabled={isUploadingMainHero}
                    className="inline-flex items-center gap-2 bg-black/90 hover:bg-black text-amber-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/60 shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
                    title="Solo Administrador: Cambiar imagen de portada principal"
                  >
                    {isUploadingMainHero ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Guardando Portada...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Admin: Cambiar Portada</span>
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
            </div>

            {/* Words, Headline and Action Buttons (UNDERNEATH the Portada Image) */}
            <div className="text-center space-y-6 max-w-4xl mx-auto pt-2">
              
              {/* Display Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-xl">
                {settings.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>THE GAME IS WON IN THE TRENCHES</>
                )}
              </h1>

              {/* Subtitle / Philosophy */}
              <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-medium max-w-2xl mx-auto leading-relaxed">
                {settings.heroSubtitle || settings.slogan || 'Disciplina, intensidad y pasión en cada sesión de entrenamiento.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                {!user ? (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#ccff00',
                        boxShadow: '0 10px 30px rgba(204, 255, 0, 0.4)'
                      }}
                    >
                      <span>{settings.ctaButtonText || 'GET STARTED FOR FREE'}</span>
                    </button>

                    <button
                      onClick={handleActivateTrial}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 shadow-xl transition-all hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{isTrialActive ? `Pase Activo (Día ${currentDay}/7)` : 'Pase Gratis 7 Días'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="#dashboard"
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-black shadow-2xl transition-transform hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-xl"
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
                      className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 shadow-xl transition-all hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-xl"
                    >
                      {role === 'admin' ? 'PANEL DE ADMINISTRACIÓN' : 'MI PERFIL DE JUGADOR'}
                    </a>
                  </>
                )}
              </div>

            </div>

          </div>
        </section>


        {/* =========================================================================
            SECTION 2: ROTATING TRAINING PHOTOS (COMPLETE IMAGE + TEXT UNDERNEATH)
            - Complete photo shown in its frame
            - Words, titles, descriptions and actions placed UNDER the photo
            - Admin-only controls to upload, edit, and delete any publication
           ========================================================================= */}
        <section className="relative w-full bg-zinc-950 border-b border-zinc-800 py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-black uppercase tracking-[0.2em] text-lime-400">
                  <Activity className="w-4 h-4" />
                  <span>Sesiones en Cancha y Preparación</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Fotos de Entrenamientos del Club
                </h2>
              </div>

              {/* Admin-only Upload & Edit Controls */}
              {role === 'admin' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => trainingInputRef.current?.click()}
                    disabled={isUploadingTrainingPhoto}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 cursor-pointer"
                    title="Solo Administrador: Subir fotos de entrenamiento"
                  >
                    {isUploadingTrainingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Subir Foto</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingPost({
                      id: activeSlidePhoto.id,
                      title: activeSlidePhoto.title,
                      description: activeSlidePhoto.description,
                      category: activeSlidePhoto.category,
                      url: activeSlidePhoto.url,
                      isDefault: activeSlidePhoto.isDefault
                    })}
                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Admin: Editar esta publicación"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeletePublication(activeSlidePhoto)}
                    className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Admin: Eliminar esta publicación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
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
            </div>

            {/* Complete Training Photo Container (Not cropped background) */}
            <div className="relative bg-black rounded-3xl border border-zinc-800 p-2 sm:p-4 shadow-2xl overflow-hidden">
              <div className="relative w-full flex items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[380px] max-h-[520px]">
                <img 
                  key={activeSlidePhoto.id + '-' + activeSlidePhoto.url}
                  src={activeSlidePhoto.url} 
                  alt={activeSlidePhoto.title} 
                  className="w-full h-auto max-h-[520px] object-contain mx-auto rounded-xl animate-fade-in transition-all duration-500"
                />
              </div>

              {/* Navigation Arrows on Left and Right of the Photo */}
              <div className="absolute inset-y-0 left-4 z-20 flex items-center">
                <button
                  onClick={handlePrevSlide}
                  className="p-2 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-2xl"
                  title="Foto anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute inset-y-0 right-4 z-20 flex items-center">
                <button
                  onClick={handleNextSlide}
                  className="p-2 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-2xl"
                  title="Siguiente foto"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Words, Details & Interactive Actions (UNDERNEATH the Training Photo) */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
              
              {/* Category Badge and Rotation Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span 
                  className="px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-black shadow-lg"
                  style={{ backgroundColor: '#ccff00' }}
                >
                  {activeSlidePhoto.category || 'ENTRENAMIENTO OFICIAL'}
                </span>

                <button
                  onClick={handleRandomSlide}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
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

              {/* Title & Description of Active Photo */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                  {activeSlidePhoto.title}
                </h3>
                {activeSlidePhoto.description && (
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
                    {activeSlidePhoto.description}
                  </p>
                )}
              </div>

              {/* Interactive Buttons (Comments, Like, Lightbox) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                
                {/* Comment on this publication */}
                <button
                  onClick={() => setActiveCommentsModal({
                    mediaId: activeSlidePhoto.id,
                    mediaTitle: activeSlidePhoto.title,
                    mediaUrl: activeSlidePhoto.url,
                    mediaCategory: activeSlidePhoto.category
                  })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 shadow-xl transition-all hover:scale-105 cursor-pointer group"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Comentar Publicación</span>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {commentsCounts[activeSlidePhoto.id] || 0}
                  </span>
                </button>

                {/* Like Button */}
                <button
                  onClick={() => handleLikePost(activeSlidePhoto.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all hover:scale-105 cursor-pointer ${
                    likedPosts[activeSlidePhoto.id]
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                  }`}
                  title="Me gusta esta foto"
                >
                  <Heart className={`w-4 h-4 ${likedPosts[activeSlidePhoto.id] ? 'fill-current text-rose-500' : 'text-rose-400'}`} />
                  <span>Me Gusta</span>
                </button>

                {/* Fullscreen Lightbox */}
                <button
                  onClick={() => setSelectedPhotoModal({
                    url: activeSlidePhoto.url,
                    title: activeSlidePhoto.title,
                    description: activeSlidePhoto.description,
                    tag: activeSlidePhoto.tag
                  })}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-all hover:scale-105 cursor-pointer"
                  title="Ver en pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Ampliar</span>
                </button>

              </div>

              {/* Navigation Indicator Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-3">
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

          </div>
        </section>


        {/* =========================================================================
            SECTION 3: PUBLIC PUBLICATIONS & TRAINING GALLERY FEED
            - Complete photos with Admin Edit & Delete buttons
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
                  Todas las fotos y sesiones del cuerpo técnico. Comenta cualquier publicación para interactuar con el club.
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
                  {/* Photo Frame (Complete presentation) */}
                  <div className="relative h-60 bg-black overflow-hidden flex items-center justify-center cursor-pointer"
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

                    {/* Admin Edit & Delete buttons on card */}
                    {role === 'admin' && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingPost({
                            id: photo.id,
                            title: photo.title,
                            description: photo.description,
                            category: photo.category,
                            url: photo.url,
                            isDefault: photo.isDefault
                          })}
                          className="p-1.5 bg-black/80 hover:bg-zinc-800 text-amber-300 rounded-lg border border-amber-500/40 transition-colors"
                          title="Editar publicación"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePublication(photo)}
                          className="p-1.5 bg-black/80 hover:bg-red-900/60 text-red-300 rounded-lg border border-red-500/40 transition-colors"
                          title="Eliminar publicación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

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

      {/* Admin Edit Publication Modal */}
      {editingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setEditingPost(null)}
        >
          <div 
            className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Editar Publicación</h3>
                  <p className="text-xs text-zinc-400">Modifica los datos de esta foto o cambia la imagen</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPost(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Foto de la Publicación
                </label>
                <div className="flex items-center gap-3">
                  <img 
                    src={editingPost.url} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-xl border border-zinc-700 bg-black"
                  />
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="edit-post-file-input"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file, 1600, 1200, 0.85);
                            setEditingPost({ ...editingPost, url: compressed });
                          } catch (err) {
                            console.error("Error al comprimir imagen:", err);
                          }
                        }
                      }}
                      className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Sube una nueva foto si deseas reemplazar la actual</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Título de la Publicación
                </label>
                <input 
                  type="text" 
                  value={editingPost.title}
                  onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                  placeholder="Ej. Sesión Táctica de Remate"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select 
                  value={editingPost.category}
                  onChange={e => setEditingPost({ ...editingPost, category: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="Entrenamientos">Entrenamientos</option>
                  <option value="Tácticas">Tácticas</option>
                  <option value="Torneos">Torneos</option>
                  <option value="Preparación Física">Preparación Física</option>
                  <option value="Gimnasio">Gimnasio</option>
                  <option value="Oficial">Oficial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Descripción o Detalles
                </label>
                <textarea 
                  value={editingPost.description}
                  onChange={e => setEditingPost({ ...editingPost, description: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime-400 resize-none"
                  placeholder="Escribe detalles del entrenamiento o sesión..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePublicationEdit}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-lime-400 hover:bg-lime-300 text-black shadow-lg cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
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
