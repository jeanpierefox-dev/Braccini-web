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
  serverTimestamp,
  where,
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { LoginModal } from '../components/LoginModal';
import { MissionVisionSection } from '../components/MissionVisionSection';
import { PrivatePlatformSection } from '../components/PrivatePlatformSection';
import { ClubCommentsSection } from '../components/ClubCommentsSection';
import { ContactSection } from '../components/ContactSection';
import { ClubRatingSection } from '../components/ClubRatingSection';
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
  Layers,
  Filter,
  Share2
} from 'lucide-react';
import { MediaItem, UserProfile } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

// High-definition dynamic sports action and training photos
const DEFAULT_ACTION_PHOTOS = [
  {
    id: 'def-act-1',
    title: 'THE GAME IS WON IN THE TRENCHES',
    subtitle: 'Preparación de alto impacto y concentración en cancha',
    category: 'entrenos',
    categoryLabel: 'Entrenamiento Físico y Táctico',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1400&auto=format&fit=crop',
    tag: 'Acción y Fuerza',
    description: 'Drills de máxima intensidad, aceleración y choque táctico en jugadas divididas.'
  },
  {
    id: 'def-act-2',
    title: 'POTENCIA Y DESPLIEGUE OFENSIVO',
    subtitle: 'Ataques rápidos y sincronización de remate',
    category: 'entrenos',
    categoryLabel: 'Ofensiva y Remate',
    url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=1400&auto=format&fit=crop',
    tag: 'Salto y Remate',
    description: 'Rutinas de salto explosivo, impacto al balón y búsqueda de ángulos imposibles.'
  },
  {
    id: 'def-act-3',
    title: 'PARTIDO OFICIAL DE CAMPEONATO',
    subtitle: 'Coordinación milimétrica para neutralizar el ataque rival',
    category: 'partidos',
    categoryLabel: 'Partidos Oficiales',
    url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1400&auto=format&fit=crop',
    tag: 'Partido y Bloqueo',
    description: 'Despliegue competitivo en finales y torneos interclubes.'
  },
  {
    id: 'def-act-4',
    title: 'PASEO DE INTEGRACIÓN Y CAMARADERÍA',
    subtitle: 'Unión, valores deportivos y recreación del plantel',
    category: 'paseos',
    categoryLabel: 'Paseos e Integración',
    url: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=1400&auto=format&fit=crop',
    tag: 'Paseo y Convivencia',
    description: 'Jornadas de integración fuera de la cancha fortaleciendo el espíritu de equipo.'
  },
  {
    id: 'def-act-5',
    title: 'VISIÓN Y ESTRATEGIA DE EQUIPO',
    subtitle: 'Dirección técnica y trabajo coordinado en cancha',
    category: 'institucional',
    categoryLabel: 'Institucional',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1400&auto=format&fit=crop',
    tag: 'Staff Técnico',
    description: 'Análisis de pizarras tácticas y correcciones posicionales por el cuerpo técnico.'
  }
];

import { Eye, Building2, User as UserIcon } from "lucide-react";

const isVideo = (url?: string) => url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i));
export function Home() {
  useEffect(() => {
    // Increment page views
    const incrementViews = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'club_profile');
        await setDoc(settingsRef, {
          pageViews: increment(1)
        }, { merge: true });
      } catch (e) {
        console.error("Error incrementing page views", e);
      }
    };
    incrementViews();
  }, []);
  const [showLogin, setShowLogin] = useState(false);
  const { user, role } = useAuth();
  const settings = useSettings();
  const { isTrialActive, daysRemaining, currentDay, startTrial } = useVisitorTrial();

    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [dbMedia, setDbMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    title: string;
    description?: string;
    tag?: string;
  } | null>(null);

  // Publications Filter (all, entrenos, partidos, paseos, institucional)
  const [publicationCategoryFilter, setPublicationCategoryFilter] = useState<string>('all');

  // Publication Comments Modal state
  const [activeCommentsModal, setActiveCommentsModal] = useState<{
    mediaId: string;
    mediaTitle: string;
    mediaUrl: string;
    mediaCategory?: string;
  } | null>(null);

  // Admin Quick Upload States
  const [isUploadingMainHero, setIsUploadingMainHero] = useState(false);
  const [isUploadingTrainingPhoto, setIsUploadingTrainingPhoto] = useState(false);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState<string | null>(null);

  // Admin Editing Post state
  const [editingPost, setEditingPost] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    url: string;
    isDefault?: boolean;
  } | null>(null);
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);

  // Likes tracking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Comments counts per media
  const [commentsCounts, setCommentsCounts] = useState<Record<string, number>>({});

  // Registered players real count
  const [registeredPlayersCount, setRegisteredPlayersCount] = useState<number | null>(null);
  const [directorProfile, setDirectorProfile] = useState<UserProfile | null>(null);

  // Hidden default publications from admin settings
  const hiddenDefaults = settings.hiddenDefaultPublications || [];

  const mainHeroInputRef = useRef<HTMLInputElement>(null);
  const trainingInputRef = useRef<HTMLInputElement>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  // Real-time listener for Media uploaded to Firestore
  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MediaItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MediaItem);
      });
      setDbMedia(list);
      setLoadingMedia(false);
    }, (error) => {
      console.warn("Error fetching public media:", error);
      setLoadingMedia(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for Registered Players Count
  useEffect(() => {
    const qPlayers = query(collection(db, 'users'), where('clubRole', '==', 'jugador'));
    const unsubscribe = onSnapshot(qPlayers, (snapshot) => {
      setRegisteredPlayersCount(snapshot.size);
    }, (error) => {
      console.warn("Error counting players:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const qDirector = query(collection(db, 'users'), where('clubRole', '==', 'director'), limit(1));
    const unsubscribe = onSnapshot(qDirector, (snapshot) => {
      if (!snapshot.empty) {
        setDirectorProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile);
      } else {
        setDirectorProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to total comments per publication
  useEffect(() => {
    const qComments = query(collection(db, 'comments'));
    const unsubscribe = onSnapshot(qComments, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.mediaId) {
          counts[data.mediaId] = (counts[data.mediaId] || 0) + 1;
        }
      });
      setCommentsCounts(counts);
    }, (err) => {
      console.warn("Comments count listener:", err);
    });
    return () => unsubscribe();
  }, []);

  // Combine custom media and default action photos
  const rotatingPhotos = useMemo(() => {
    const visibleDefaults = DEFAULT_ACTION_PHOTOS.filter(item => !hiddenDefaults.includes(item.id)).map(item => ({
      ...item,
      isDefault: true,
      likesCount: 0
    }));

    if (dbMedia.length === 0) {
      return visibleDefaults;
    }

    const customPhotos = dbMedia.map((m) => {
      const cat = m.category || (m.type === 'training' ? 'entrenos' : (m.type === 'partidos' ? 'partidos' : (m.type === 'paseos' ? 'paseos' : 'institucional')));
      const catLabel = 
        cat === 'entrenos' ? 'Entrenamiento Oficial' :
        cat === 'partidos' ? 'Partido Oficial' :
        cat === 'paseos' ? 'Paseo e Integración' :
        'Institucional';

      return {
        id: m.id,
        title: m.title,
        subtitle: m.description ? m.description.slice(0, 70) + (m.description.length > 70 ? '...' : '') : 'Sesión del club',
        category: cat,
        categoryLabel: catLabel,
        url: m.url,
        tag: m.tag || 'Cuerpo Técnico',
        description: m.description,
        isDefault: false,
        likesCount: m.likesCount || 0
      };
    });

    return [...customPhotos, ...visibleDefaults];
  }, [dbMedia, hiddenDefaults]);

  // Filtered publications based on selected category tab
  const filteredRotatingPhotos = useMemo(() => {
    if (publicationCategoryFilter === 'all') return rotatingPhotos;
    return rotatingPhotos.filter(item => {
      const cat = item.category?.toLowerCase() || '';
      return cat === publicationCategoryFilter.toLowerCase();
    });
  }, [rotatingPhotos, publicationCategoryFilter]);

  // Auto-rotate the active slide photo every 5.5 seconds
  useEffect(() => {
    if (!isAutoRotating || rotatingPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % rotatingPhotos.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoRotating, rotatingPhotos.length]);

  const activeSlidePhoto = rotatingPhotos[currentSlideIndex] || DEFAULT_ACTION_PHOTOS[0];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % rotatingPhotos.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + rotatingPhotos.length) % rotatingPhotos.length);
  };

  const handleRandomSlide = () => {
    if (rotatingPhotos.length <= 1) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * rotatingPhotos.length);
    } while (randomIndex === currentSlideIndex);
    setCurrentSlideIndex(randomIndex);
  };

  const handleLikePost = async (photoId: string) => {
    setLikedPosts(prev => ({ ...prev, [photoId]: !prev[photoId] }));
    try {
      if (!photoId.startsWith('def-')) {
        const isCurrentlyLiked = !!likedPosts[photoId];
        await updateDoc(doc(db, 'media', photoId), {
          likesCount: increment(isCurrentlyLiked ? -1 : 1)
        });
      }
    } catch (err) {
      console.warn("Like update failed:", err);
    }
  };

  // Admin upload Main Hero Image (Portada)
  const handleQuickMainHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene permisos para cambiar la imagen de portada.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMainHero(true);
      const dataUrl = await compressImageFile(file, 1920, 1080, 0.88);

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

  // Admin upload Training Photos
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
          category: 'entrenos',
          url: dataUrl,
          likesCount: 0,
          createdBy: user?.email || 'admin',
          createdAt: serverTimestamp()
        });
        count++;
      }

      setQuickUploadSuccess(count > 1 ? `¡${count} fotos agregadas con éxito!` : '¡Foto agregada con éxito!');
      setTimeout(() => setQuickUploadSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar foto');
    } finally {
      setIsUploadingTrainingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Admin Delete Publication
  const handleDeletePublication = async (photo: { id: string; title: string; isDefault?: boolean }) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene permisos para eliminar publicaciones.');
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la publicación "${photo.title}"?`);
    if (!confirmDelete) return;

    try {
      if (photo.isDefault || photo.id.startsWith('def-')) {
        const currentHidden = settings.hiddenDefaultPublications || [];
        if (!currentHidden.includes(photo.id)) {
          await setDoc(doc(db, 'settings', 'general'), {
            hiddenDefaultPublications: [...currentHidden, photo.id],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
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

      const catNormalized = 
        editingPost.category === 'partidos' ? 'partidos' :
        editingPost.category === 'paseos' ? 'paseos' :
        editingPost.category === 'institucional' ? 'institucional' : 'entrenos';

      if (editingPost.isDefault || editingPost.id.startsWith('def-')) {
        await addDoc(collection(db, 'media'), {
          title: editingPost.title,
          description: editingPost.description,
          type: 'training',
          category: catNormalized,
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
        await updateDoc(doc(db, 'media', editingPost.id), {
          title: editingPost.title,
          description: editingPost.description,
          category: catNormalized,
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

    const handleMediaClick = (url: string) => {
    if (isVideo(url)) {
      if (!user) {
        setShowLogin(true);
      } else {
        setActiveVideoUrl(url);
      }
    }
  };

  const handleActivateTrial = () => {
    startTrial();
    window.location.hash = '#dashboard';
  };

  const displayedAthletesCount = settings.statsAutoCountPlayers !== false && registeredPlayersCount !== null
    ? `${registeredPlayersCount} Atletas`
    : (settings.statsAthletes || '120+');

  const mainHeroPhoto = settings.mainTeamImageUrl || settings.heroBgUrl || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-slate-100 selection:bg-amber-400 selection:text-black">
      <main className="flex-1">
        
        {/* Toast Alert for Admin Actions */}
        {quickUploadSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-heading font-black shadow-2xl backdrop-blur-xl animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{quickUploadSuccess}</span>
          </div>
        )}

        {/* =========================================================================
            SECCIÓN 1: PORTADA OFICIAL Y FOTOS ALEATORIAS DE ACCIÓN
            - Escudo agrandado arriba en primer plano
            - Imagen de portada completa (no recortada)
            - Títulos y botones debajo de la portada
            - Carrusel de fotos de entrenamientos y partidos aleatorias
            - Exclusivo Adm para cambiar la portada
           ========================================================================= */}
        <section id="portada" className="relative w-full bg-black border-b border-zinc-900 py-8 sm:py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Escudo del Club Destacado y Agrandado en la parte superior */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 z-10 relative">
              {settings.logoUrl ? (
                <div className="relative transition-transform hover:scale-105">
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo Oficial del Club" 
                    className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl" 
                  />
                </div>
              ) : (
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center font-heading font-black text-white text-4xl sm:text-5xl shadow-2xl border-2 border-white/20"
                  style={{ backgroundColor: primaryColor }}
                >
                  {settings.appName ? settings.appName.charAt(0) : 'C'}
                </div>
              )}

              <div className="space-y-1">
                <span 
                  className="text-xs sm:text-sm font-heading font-black uppercase tracking-[0.3em]"
                  style={{ color: accentColor }}
                >
                  {settings.appName || 'CLUB DEPORTIVO OFICIAL'}
                </span>
                {settings.slogan && (
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
                    {settings.slogan}
                  </p>
                )}
              </div>
            </div>

            {/* Contenedor de Imagen de Portada Completa (Sin recuadro) */}
            <div className="relative group w-full -mt-6 sm:-mt-10 z-0">
              <div className="relative w-full flex items-center justify-center">
                <img 
                  src={mainHeroPhoto} 
                  alt={settings.heroTitle || "Portada Oficial del Club"} 
                  className="w-full h-auto max-h-[70vh] object-cover mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>

              {/* Botón Exclusivo para el Administrador para Cambiar Portada */}
              {role === 'admin' && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                  <button
                    onClick={() => mainHeroInputRef.current?.click()}
                    disabled={isUploadingMainHero}
                    className="inline-flex items-center gap-2 bg-black/90 hover:bg-black text-amber-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider border border-amber-500/60 shadow-2xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
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

            {/* Palabras y botones colocados DEBAJO de la imagen de portada */}
            <div className="text-center space-y-6 max-w-4xl mx-auto pt-2">
              
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white uppercase tracking-tight leading-tight drop-shadow-xl">
                {settings.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>THE GAME IS WON IN THE TRENCHES</>
                )}
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-medium max-w-2xl mx-auto leading-relaxed">
                {settings.heroSubtitle || settings.slogan || 'Disciplina, intensidad y pasión en cada sesión de entrenamiento.'}
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                {!user ? (
                  <>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 30px rgba(${primaryRgb}, 0.4)`
                      }}
                    >
                      <span>{settings.ctaButtonText || 'INGRESAR A LA PLATAFORMA'}</span>
                      <ArrowRight className="w-4 h-4" />
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
                      className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 font-heading font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-white shadow-2xl transition-transform hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-xl"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 30px rgba(${primaryRgb}, 0.4)`
                      }}
                    >
                      <span>ENTRENAMIENTOS Y VIDEOS</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>

                    <a
                      href="#profile"
                      className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 shadow-xl transition-all hover:scale-105 cursor-pointer min-h-[48px] flex items-center justify-center gap-2 rounded-xl"
                    >
                      {role === 'admin' ? 'PANEL DE ADMINISTRACIÓN' : 'MI CARNET Y PERFIL'}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* =========================================================================
                SECCIÓN 2: MISIÓN, VISIÓN Y VALORES INSTITUCIONALES DEL CLUB
                (Movido justo debajo de la portada)
               ========================================================================= */}
            <MissionVisionSection />
            {/* =========================================================================
                SECCIÓN: ESTADÍSTICAS DEL CLUB Y DIRECTOR
               ========================================================================= */}
            <div className="py-12 border-b border-zinc-900 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Users className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{displayedAthletesCount}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Jugadores</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: accentColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Eye className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.pageViews || 0}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Visitas web</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Trophy className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.statsChampionships || '20+'}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Campeonatos</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: accentColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Building2 className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.statsFoundedYear || '2015'}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Fundación</p>
                </div>
              </div>

              {directorProfile && (
                <div className="mt-12 bg-zinc-950 rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 transition-transform scale-y-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-zinc-900 shrink-0 shadow-xl bg-zinc-900">
                      {directorProfile.photoURL ? (
                        <img src={directorProfile.photoURL} alt="Director" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-zinc-600 m-auto mt-8" />
                      )}
                   </div>
                   <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                        <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                          Dirección General
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
                          {directorProfile.name || 'Director General'}
                        </h3>
                        <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                          {directorProfile.executiveRole || 'Presidente del Club'}
                        </p>
                      </div>
                      <div className="text-sm text-zinc-400 italic leading-relaxed max-w-3xl border-l-2 border-zinc-800 pl-4 py-1">
                        "{directorProfile.institutionalBio || 'Comprometidos con el desarrollo integral y deportivo de nuestra comunidad, formando atletas con valores, disciplina y pasión por el deporte.'}"
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* CARRUSEL DE FOTOS DE ENTRENAMIENTO Y ACCIÓN */}
            <div className="pt-10 border-t border-zinc-900 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-heading font-black uppercase tracking-[0.2em] text-amber-400">
                    <Activity className="w-4 h-4" />
                    <span>Momentos de Entrenamiento y Cancha</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-0.5">
                    Fotos de Acción Deportiva
                  </h3>
                </div>

                {role === 'admin' && (
                  <button
                    onClick={() => trainingInputRef.current?.click()}
                    disabled={isUploadingTrainingPhoto}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {isUploadingTrainingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Subir Foto de Cancha</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            {/* Visor de Foto Activa */}
            <div className="relative w-full rounded-3xl group">
              <div 
                  className="relative w-full flex items-center justify-center bg-black overflow-hidden min-h-[260px] sm:min-h-[380px] max-h-[520px] group/video cursor-pointer"
                  onClick={() => handleMediaClick(activeSlidePhoto.url)}
                >
                  {isVideo(activeSlidePhoto.url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 rounded-xl relative group-hover/video:bg-zinc-800 transition-colors">
                       <Play className="w-16 h-16 text-zinc-600 group-hover/video:text-white transition-colors" />
                       <span className="text-zinc-500 text-sm mt-4 font-bold group-hover/video:text-white transition-colors">Ver Video</span>
                    </div>
                  ) : (
                    <img 
                      key={activeSlidePhoto.id + '-' + activeSlidePhoto.url}
                      src={activeSlidePhoto.url} 
                      alt={activeSlidePhoto.title} 
                      className="w-full h-auto max-h-[520px] object-contain mx-auto rounded-xl animate-fade-in transition-all duration-500"
                    />
                  )}
                </div>

                {/* Flechas de Navegación */}
                <div className="absolute inset-y-0 left-4 z-20 flex items-center">
                  <button
                    onClick={handlePrevSlide}
                    className="p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-2xl"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="absolute inset-y-0 right-4 z-20 flex items-center">
                  <button
                    onClick={handleNextSlide}
                    className="p-2.5 sm:p-3 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 hover:border-white/50 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-2xl"
                    title="Siguiente foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Palabras y controles DEBAJO de la foto */}
              <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
                
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span 
                    className="px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-heading font-black uppercase tracking-widest text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {activeSlidePhoto.categoryLabel || 'ENTRENAMIENTO OFICIAL'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                    {activeSlidePhoto.title}
                  </h3>
                  {activeSlidePhoto.description && (
                    <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
                      {activeSlidePhoto.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveCommentsModal({
                      mediaId: activeSlidePhoto.id,
                      mediaTitle: activeSlidePhoto.title,
                      mediaUrl: activeSlidePhoto.url,
                      mediaCategory: activeSlidePhoto.category
                    })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Comentar Publicación</span>
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-heading font-black px-2 py-0.5 rounded-full">
                      {commentsCounts[activeSlidePhoto.id] || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => handleLikePost(activeSlidePhoto.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all hover:scale-105 cursor-pointer ${
                      likedPosts[activeSlidePhoto.id]
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedPosts[activeSlidePhoto.id] ? 'fill-current text-rose-500' : 'text-rose-400'}`} />
                    <span>Me Gusta</span>
                  </button>

                  <button
                    onClick={() => setSelectedPhotoModal({
                      url: activeSlidePhoto.url,
                      title: activeSlidePhoto.title,
                      description: activeSlidePhoto.description,
                      tag: activeSlidePhoto.tag
                    })}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Ampliar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: activeSlidePhoto.title,
                          text: activeSlidePhoto.description,
                          url: window.location.href,
                        }).catch(()=>console.log("Error sharing"));
                      } else {
                        alert("La opción de compartir no está disponible en este dispositivo/navegador.");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>Compartir</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* =========================================================================
            SECCIÓN 3: PUBLICACIONES OFICIALES Y GALERÍA POR CATEGORÍA
            - Filtros por rol: Entrenos, Partidos, Paseos, Institucional
            - Interacción con comentarios y Likes
            - Edición y eliminación por parte del Administrador
           ========================================================================= */}
        <section id="publicaciones" className="py-14 sm:py-20 bg-zinc-950 border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Encabezado y Selector de Categorías */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: accentColor }}>
                  <Activity className="w-4 h-4" />
                  <span>Galería de Actividades y Eventos</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight">
                  Publicaciones Oficiales
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                  Explora las sesiones de entrenamiento, partidos oficiales y paseos institucionales del club.
                </p>
              </div>

              {/* Filtros de Categoría */}
              <div className="flex flex-wrap gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 self-start md:self-auto">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'entrenos', label: '🏐 Entrenos' },
                  { id: 'partidos', label: '🏆 Partidos' },
                  { id: 'paseos', label: '🌴 Paseos' },
                  { id: 'institucional', label: '🏛️ Institucional' },
                ].map(cat => {
                  const isActive = publicationCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setPublicationCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive 
                          ? 'text-white shadow-md' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      style={isActive ? {
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 12px rgba(${primaryRgb}, 0.35)`
                      } : {}}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cuadrícula de Publicaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRotatingPhotos.map((photo, idx) => (
                <div 
                  key={photo.id + '-pub-' + idx}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl flex flex-col transition-all duration-300 hover:shadow-2xl group"
                >
                  <div 
                    className="relative h-60 bg-black overflow-hidden flex items-center justify-center cursor-pointer"
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
                    
                    <div className="absolute top-3 left-3">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-heading font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md"
                        style={{
                          backgroundColor: photo.category === 'entrenos' ? primaryColor : (photo.category === 'partidos' ? '#ef4444' : accentColor)
                        }}
                      >
                        {photo.categoryLabel || photo.category}
                      </span>
                    </div>

                    {role === 'admin' && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingPost({
                            id: photo.id,
                            title: photo.title,
                            description: photo.description || '',
                            category: photo.category || 'entrenos',
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

                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-white line-clamp-1 group-hover:text-zinc-200 transition-colors">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {photo.description || 'Publicación oficial del club.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <button
                        onClick={() => setActiveCommentsModal({
                          mediaId: photo.id,
                          mediaTitle: photo.title,
                          mediaUrl: photo.url,
                          mediaCategory: photo.category
                        })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Comentarios</span>
                        <span className="text-[10px] font-mono ml-0.5 text-zinc-400">
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
            SECCIÓN 4: PLATAFORMA PRIVADA Y MEMBRESÍAS (1, 3 Y 12 MESES)
            - Acceso a entrenamientos y videos por tiempo limitado
            - Verificación de membresía del usuario o solicitud de renovación
           ========================================================================= */}
        {!settings.hidePrivatePlatform && <PrivatePlatformSection />}


        {/* =========================================================================
            SECCIÓN 5: COMENTARIOS Y VALORACIONES DE LA COMUNIDAD
            - Atletas, padres y socios pueden comentar con respuestas oficiales
           ========================================================================= */}
        <ClubCommentsSection />


        {/* =========================================================================
            SECCIÓN 6: CONTACTO Y REDES SOCIALES
            - Sedes oficiales, números, WhatsApp, Instagram, Facebook, TikTok
           ========================================================================= */}
        <ContactSection />


        {/* =========================================================================
            SECCIÓN 7: CALIFICACIÓN DEL CLUB
            - Al final de la página con promedio de estrellas y pilares de calidad
           ========================================================================= */}
        <ClubRatingSection />

      </main>
      
      {/* Modal para Visualizar Foto Ampliada */}
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
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-black uppercase tracking-wider bg-amber-400 text-black">
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

      {/* Modal del Administrador para Editar Publicación */}
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
                  <p className="text-xs text-zinc-400">Modifica los datos de esta publicación</p>
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="entrenos">🏐 Entrenos</option>
                  <option value="partidos">🏆 Partidos</option>
                  <option value="paseos">🌴 Paseos</option>
                  <option value="institucional">🏛️ Institucional</option>
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="Escribe detalles de la publicación..."
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
                  disabled={isSavingPostEdit}
                  className="px-5 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black shadow-lg cursor-pointer flex items-center gap-2"
                >
                  {isSavingPostEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interactivo de Comentarios para Publicaciones */}
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

      
      {/* Video Player Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-black border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-md">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">Reproductor Institucional</h3>
              <button 
                onClick={() => setActiveVideoUrl(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full flex-1 aspect-video flex items-center justify-center pt-16">
              {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
                <iframe 
                  className="w-full h-full"
                  src={activeVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={activeVideoUrl} controls autoPlay className="w-full h-full max-h-full object-contain"></video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-xs text-zinc-500 gap-4">
        <div className="flex items-center gap-2.5">
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded" />}
          <span className="font-bold uppercase tracking-wider text-zinc-300">{settings.appName}</span>
        </div>
        <p className="text-[11px] font-mono tracking-wider uppercase text-center sm:text-left">
          © {new Date().getFullYear()} {settings.appName}. Plataforma Oficial Corporativa Deportiva.
        </p>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span>{settings.statsFoundedYear ? `Fundado en ${settings.statsFoundedYear}` : 'Club Deportivo'}</span>
        </div>
      </footer>
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
