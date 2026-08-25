import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, MediaItem, UserRole, Payment, ClubSettings, ThemeMode } from '../types';
import { 
  Upload, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  LayoutTemplate, 
  Activity, 
  Settings, 
  Wallet, 
  Printer, 
  Plus,
  Palette,
  Eye,
  Smartphone,
  CheckCircle,
  Megaphone,
  Trophy,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '../hooks/useSettings';
import { extractColorsFromImage, ExtractedColors, hexToRgb } from '../utils/colorExtractor';
import { DevicePreviewModal } from '../components/DevicePreviewModal';

export function AdminPanel() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'media' | 'users' | 'payments' | 'settings'>('media');
  const appSettings = useSettings();
  
  // Media Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'training' | 'player' | 'general'>('training');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // User Creation State
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserClubRole, setNewUserClubRole] = useState<'jugador' | 'entrenador'>('jugador');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Payment Form State
  const [paymentUser, setPaymentUser] = useState('');
  const [paymentConcept, setPaymentConcept] = useState('Cuota Mensual');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPeriod, setPaymentPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<Payment | null>(null);
  const [treasuryView, setTreasuryView] = useState<'registro' | 'mensualidades' | 'uniformes'>('registro');
  const [selectedMonth, setSelectedMonth] = useState(() => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
  });

  // Settings / Customizer Form State
  const [configAppName, setConfigAppName] = useState('');
  const [configSlogan, setConfigSlogan] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [configLogoUrl, setConfigLogoUrl] = useState('');
  const [configPrimaryColor, setConfigPrimaryColor] = useState('#2563eb');
  const [configAccentColor, setConfigAccentColor] = useState('#f59e0b');
  const [configThemeMode, setConfigThemeMode] = useState<ThemeMode>('dark');
  
  const [configHeroTitle, setConfigHeroTitle] = useState('');
  const [configHeroSubtitle, setConfigHeroSubtitle] = useState('');
  const [configHeroBgUrl, setConfigHeroBgUrl] = useState('');
  const [configCtaButtonText, setConfigCtaButtonText] = useState('Acceso a Miembros');
  
  const [configShowAnnouncement, setConfigShowAnnouncement] = useState(true);
  const [configAnnouncementText, setConfigAnnouncementText] = useState('');
  
  const [configStatsChampionships, setConfigStatsChampionships] = useState('15+');
  const [configStatsAthletes, setConfigStatsAthletes] = useState('120');
  const [configStatsCategories, setConfigStatsCategories] = useState('8');
  const [configStatsFoundedYear, setConfigStatsFoundedYear] = useState('2010');
  const [configStatsAutoCountPlayers, setConfigStatsAutoCountPlayers] = useState(true);

  const [configContactPhone, setConfigContactPhone] = useState('');
  const [configContactWhatsApp, setConfigContactWhatsApp] = useState('');
  const [configContactEmail, setConfigContactEmail] = useState('');
  const [configContactLocation, setConfigContactLocation] = useState('');
  const [configSocialInstagram, setConfigSocialInstagram] = useState('');
  const [configSocialFacebook, setConfigSocialFacebook] = useState('');
  const [configSocialTikTok, setConfigSocialTikTok] = useState('');

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Sync settings when loaded from Firestore
  useEffect(() => {
    if (appSettings.appName) setConfigAppName(appSettings.appName);
    if (appSettings.slogan) setConfigSlogan(appSettings.slogan);
    if (appSettings.description) setConfigDescription(appSettings.description);
    if (appSettings.logoUrl) setConfigLogoUrl(appSettings.logoUrl);
    if (appSettings.primaryColor) setConfigPrimaryColor(appSettings.primaryColor);
    if (appSettings.accentColor) setConfigAccentColor(appSettings.accentColor);
    if (appSettings.themeMode) setConfigThemeMode(appSettings.themeMode);
    
    if (appSettings.heroTitle) setConfigHeroTitle(appSettings.heroTitle);
    if (appSettings.heroSubtitle) setConfigHeroSubtitle(appSettings.heroSubtitle);
    if (appSettings.heroBgUrl) setConfigHeroBgUrl(appSettings.heroBgUrl);
    if (appSettings.ctaButtonText) setConfigCtaButtonText(appSettings.ctaButtonText);
    
    if (appSettings.showAnnouncement !== undefined) setConfigShowAnnouncement(appSettings.showAnnouncement);
    if (appSettings.announcementText) setConfigAnnouncementText(appSettings.announcementText);
    
    if (appSettings.statsChampionships) setConfigStatsChampionships(appSettings.statsChampionships);
    if (appSettings.statsAthletes) setConfigStatsAthletes(appSettings.statsAthletes);
    if (appSettings.statsCategories) setConfigStatsCategories(appSettings.statsCategories);
    if (appSettings.statsFoundedYear) setConfigStatsFoundedYear(appSettings.statsFoundedYear);
    if (appSettings.statsAutoCountPlayers !== undefined) setConfigStatsAutoCountPlayers(appSettings.statsAutoCountPlayers);

    if (appSettings.contactPhone) setConfigContactPhone(appSettings.contactPhone);
    if (appSettings.contactWhatsApp) setConfigContactWhatsApp(appSettings.contactWhatsApp);
    if (appSettings.contactEmail) setConfigContactEmail(appSettings.contactEmail);
    if (appSettings.contactLocation) setConfigContactLocation(appSettings.contactLocation);
    if (appSettings.socialInstagram) setConfigSocialInstagram(appSettings.socialInstagram);
    if (appSettings.socialFacebook) setConfigSocialFacebook(appSettings.socialFacebook);
    if (appSettings.socialTikTok) setConfigSocialTikTok(appSettings.socialTikTok);
  }, [appSettings]);

  useEffect(() => {
    if (role !== 'admin') return;

    // Fetch Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unUsers = onSnapshot(qUsers, (snap) => {
      const u: UserProfile[] = [];
      snap.forEach(d => u.push({ id: d.id, ...d.data() } as UserProfile));
      setUsers(u);
    }, (error) => {
      console.warn("Firestore listener error (users):", error);
    });

    // Fetch Media
    const qMedia = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unMedia = onSnapshot(qMedia, (snap) => {
      const m: MediaItem[] = [];
      snap.forEach(d => m.push({ id: d.id, ...d.data() } as MediaItem));
      setMediaList(m);
    }, (error) => {
      console.warn("Firestore listener error (media):", error);
    });

    // Fetch Payments
    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unPayments = onSnapshot(qPayments, (snap) => {
      const p: Payment[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Payment));
      setPayments(p);
    }, (error) => {
      console.warn("Firestore listener error (payments):", error);
    });

    return () => {
      unUsers();
      unMedia();
      unPayments();
    };
  }, [role]);

  // Image Upload with Automatic Color Extraction
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/png'); // Preserve logo transparency
        setConfigLogoUrl(dataUrl);

        // Run automatic color extraction from the uploaded logo
        setIsExtractingColors(true);
        try {
          const colors = await extractColorsFromImage(dataUrl);
          setConfigPrimaryColor(colors.primary);
          setConfigAccentColor(colors.accent);
          setExtractedPalette(colors.palette);
        } catch (err) {
          console.warn("Color extraction notice:", err);
        } finally {
          setIsExtractingColors(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualColorExtract = async () => {
    if (!configLogoUrl) {
      alert('Por favor sube o selecciona un logo primero.');
      return;
    }
    setIsExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(configLogoUrl);
      setConfigPrimaryColor(colors.primary);
      setConfigAccentColor(colors.accent);
      setExtractedPalette(colors.palette);
    } catch (err) {
      console.warn("Error extracting colors", err);
    } finally {
      setIsExtractingColors(false);
    }
  };

  const handleMediaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      setError('Título y URL son obligatorios');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'media'), {
        title,
        description,
        url,
        type,
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      });
      
      setTitle('');
      setDescription('');
      setUrl('');
      alert('Contenido publicado exitosamente');
    } catch (err: any) {
      console.error(err);
      setError('Error al subir el contenido: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('¿Eliminar este contenido?')) {
      await deleteDoc(doc(db, 'media', id));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (confirm(`¿Cambiar rol a ${newRole}?`)) {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    const primaryRgbObj = hexToRgb(configPrimaryColor);
    const accentRgbObj = hexToRgb(configAccentColor);

    const payload: ClubSettings = {
      appName: configAppName.trim() || 'TITANES VOLEY CLUB',
      slogan: configSlogan.trim(),
      description: configDescription.trim(),
      logoUrl: configLogoUrl,
      primaryColor: configPrimaryColor,
      primaryRgb: `${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}`,
      accentColor: configAccentColor,
      accentRgb: `${accentRgbObj.r}, ${accentRgbObj.g}, ${accentRgbObj.b}`,
      themeMode: configThemeMode,
      
      heroTitle: configHeroTitle,
      heroSubtitle: configHeroSubtitle,
      heroBgUrl: configHeroBgUrl,
      ctaButtonText: configCtaButtonText,
      
      showAnnouncement: configShowAnnouncement,
      announcementText: configAnnouncementText,
      
      statsChampionships: configStatsChampionships,
      statsAthletes: configStatsAthletes,
      statsCategories: configStatsCategories,
      statsFoundedYear: configStatsFoundedYear,
      statsAutoCountPlayers: configStatsAutoCountPlayers,

      contactPhone: configContactPhone,
      contactWhatsApp: configContactWhatsApp,
      contactEmail: configContactEmail,
      contactLocation: configContactLocation,
      socialInstagram: configSocialInstagram,
      socialFacebook: configSocialFacebook,
      socialTikTok: configSocialTikTok,
      autoColorExtracted: true
    };

    try {
      await setDoc(doc(db, 'settings', 'general'), payload, { merge: true });
      alert('¡Configuración y tema del club guardados exitosamente!');
    } catch (err: any) {
      console.error(err);
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername || !newUserPassword) return;
    setIsAddingUser(true);
    try {
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const email = `${newUserUsername.trim().toLowerCase()}@voleyclub.app`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUserPassword);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newUserName,
        email: email,
        username: newUserUsername.trim().toLowerCase(),
        role: 'member',
        clubRole: newUserClubRole,
        createdAt: serverTimestamp()
      });
      
      await secondaryAuth.signOut();
      
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserClubRole('jugador');
      alert(`Usuario creado con éxito: ${newUserUsername}`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Este usuario ya existe.');
      } else if (err.code === 'auth/weak-password') {
        alert('La contraseña debe tener al menos 6 caracteres.');
      } else {
        alert('Error al agregar usuario.');
      }
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentUser || !paymentAmount || !paymentConcept) return;
    setIsAddingPayment(true);
    try {
      const selectedUser = users.find(u => u.id === paymentUser);
      if (!selectedUser) throw new Error("Usuario no encontrado");

      const newPayment = {
        userId: paymentUser,
        userName: selectedUser.name || selectedUser.email,
        concept: paymentConcept,
        period: paymentConcept === 'Cuota Mensual' ? paymentPeriod : undefined,
        amount: parseFloat(paymentAmount),
        status: 'paid',
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'payments'), newPayment);
      
      setPaymentAmount('');
      setPaymentConcept('Cuota Mensual');
      alert('Pago registrado correctamente.');
    } catch (err: any) {
      console.error(err);
      alert('Error al registrar pago.');
    } finally {
      setIsAddingPayment(false);
    }
  };

  useEffect(() => {
    if (receiptToPrint) {
      setTimeout(() => {
        window.print();
        setReceiptToPrint(null);
      }, 500);
    }
  }, [receiptToPrint]);

  // Draft settings for real-time live preview
  const primaryRgbObj = hexToRgb(configPrimaryColor);
  const accentRgbObj = hexToRgb(configAccentColor);
  const draftClubSettings: ClubSettings = {
    appName: configAppName || appSettings.appName,
    slogan: configSlogan || appSettings.slogan,
    description: configDescription || appSettings.description,
    logoUrl: configLogoUrl || appSettings.logoUrl,
    primaryColor: configPrimaryColor,
    primaryRgb: `${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}`,
    accentColor: configAccentColor,
    accentRgb: `${accentRgbObj.r}, ${accentRgbObj.g}, ${accentRgbObj.b}`,
    themeMode: configThemeMode,
    heroTitle: configHeroTitle,
    heroSubtitle: configHeroSubtitle,
    heroBgUrl: configHeroBgUrl,
    ctaButtonText: configCtaButtonText,
    showAnnouncement: configShowAnnouncement,
    announcementText: configAnnouncementText,
    statsChampionships: configStatsChampionships,
    statsAthletes: configStatsAthletes,
    statsCategories: configStatsCategories,
    statsFoundedYear: configStatsFoundedYear,
    statsAutoCountPlayers: configStatsAutoCountPlayers,
    contactPhone: configContactPhone,
    contactWhatsApp: configContactWhatsApp,
    contactEmail: configContactEmail,
    contactLocation: configContactLocation,
    socialInstagram: configSocialInstagram,
    socialFacebook: configSocialFacebook,
    socialTikTok: configSocialTikTok
  };

  // Real-time count of registered players & staff
  const registeredAthletesCount = users.filter(u => u.clubRole !== 'entrenador').length;
  const registeredStaffCount = users.filter(u => u.clubRole === 'entrenador').length;

  return (
    <div className="min-h-screen bg-black text-slate-100 py-4 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header with Responsive Mobile/Desktop Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="w-2.5 h-2.5 rounded-full animate-pulse" 
                style={{ backgroundColor: configPrimaryColor }} 
              />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Control Central Administrador</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">Panel de Administración</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">Gestión de contenidos, fichas de jugadores, métricas y diseño del club.</p>
          </div>

          {/* Quick Action: Live Device Preview Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-transform hover:scale-105 border min-h-[44px]"
              style={{
                backgroundColor: configPrimaryColor,
                borderColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.5)`,
                boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.35)`
              }}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Simulador Móvil / PC en Vivo</span>
            </button>
          </div>
        </div>

        {/* Real-Time Live KPI Stats Bar (Mobile Optimized Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3 shadow-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
              style={{ backgroundColor: configPrimaryColor }}
            >
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block truncate">Jugadores Registrados</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{registeredAthletesCount}</span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono">En vivo</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3 shadow-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/20 border border-amber-500/30 shrink-0"
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block truncate">Torneos / Trofeos</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{configStatsChampionships}</span>
                <span className="text-[10px] text-zinc-500">del club</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3 shadow-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 shrink-0"
            >
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block truncate">Entrenamientos</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{mediaList.length}</span>
                <span className="text-[10px] text-zinc-500">publicados</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3 shadow-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-400 bg-cyan-500/20 border border-cyan-500/30 shrink-0"
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block truncate">Fundado En</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{configStatsFoundedYear}</span>
                <span className="text-[10px] text-zinc-500">{configStatsCategories} categs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Responsive Horizontal Scroll) */}
        <div className="flex overflow-x-auto space-x-2 border-b border-zinc-800 pb-3 mb-8 no-scrollbar">
          {[
            { id: 'media', label: 'Contenido Multimedia', icon: LayoutTemplate },
            { id: 'users', label: 'Usuarios y Fichas', icon: UserIcon },
            { id: 'payments', label: 'Tesorería y Pagos', icon: Wallet },
            { id: 'settings', label: 'Modo General y Tema', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
                style={isActive ? {
                  backgroundColor: configPrimaryColor,
                  boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.3)`
                } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MEDIA */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" style={{ color: configPrimaryColor }} />
                  <span>Nuevo Contenido</span>
                </h3>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleMediaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Título del Material</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. Rutina de Saque Potencia"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Tipo de Contenido</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    >
                      <option value="training">Entrenamiento (Video / Foto)</option>
                      <option value="player">Jugador (Foto / Perfil)</option>
                      <option value="general">General / Club</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">URL o Archivo Multimedia</label>
                    <input 
                      type="url" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none mb-2"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="https://youtube.com/... o URL de imagen"
                    />
                    
                    <div className="text-center text-zinc-600 text-xs my-1">ó subir desde carpeta</div>

                    <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 w-full px-4 py-3 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 text-xs font-semibold">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span>Seleccionar Foto o Video</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setUrl(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Descripción</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Detalles sobre el ejercicio, posición o notas técnicas..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 text-xs uppercase tracking-wider min-h-[44px]"
                    style={{
                      backgroundColor: configPrimaryColor,
                      boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.4)`
                    }}
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar Contenido'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                  <h3 className="font-bold text-white text-sm sm:text-base">Material Publicado</h3>
                  <span className="text-xs text-zinc-400 font-mono">{mediaList.length} elementos</span>
                </div>
                
                <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
                  {mediaList.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-sm">
                      No hay contenido multimedia publicado.
                    </div>
                  ) : mediaList.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 bg-black rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-zinc-800">
                          {item.url?.includes('youtube') || item.url?.includes('youtu.be') ? (
                            <div className="text-xs text-zinc-400 font-mono">VIDEO</div>
                          ) : (
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-zinc-400 truncate max-w-sm">{item.description || 'Sin descripción'}</p>
                          <span 
                            className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: item.type === 'training' ? configPrimaryColor : configAccentColor }}
                          >
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMedia(item.id!)}
                        className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                        title="Eliminar contenido"
                        aria-label="Eliminar contenido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" style={{ color: configPrimaryColor }} />
                  <span>Crear Nuevo Integrante</span>
                </h3>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. Carlos Mendoza"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre de Usuario (Login)</label>
                    <input 
                      type="text" 
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. cmendoza"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Contraseña Inicial</label>
                    <input 
                      type="password" 
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Rol en el Club</label>
                    <select
                      value={newUserClubRole}
                      onChange={(e) => setNewUserClubRole(e.target.value as any)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    >
                      <option value="jugador">Jugador / Atleta</option>
                      <option value="entrenador">Entrenador / Staff Técnico</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={isAddingUser}
                    className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 text-xs uppercase tracking-wider min-h-[44px]"
                    style={{
                      backgroundColor: configPrimaryColor,
                      boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.4)`
                    }}
                  >
                    {isAddingUser ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                  <h3 className="font-bold text-white text-sm sm:text-base">Miembros Registrados</h3>
                  <span className="text-xs text-zinc-400 font-mono">{users.length} miembros</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3.5">Integrante</th>
                        <th className="px-5 py-3.5">Rol Club</th>
                        <th className="px-5 py-3.5">Permisos</th>
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-500">No hay usuarios registrados.</td>
                        </tr>
                      ) : users.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-4 font-semibold text-white">
                            <div>{u.name || u.email}</div>
                            {u.username && <div className="text-xs text-zinc-500 font-mono font-normal">@{u.username}</div>}
                          </td>
                          <td className="px-5 py-4 capitalize text-zinc-300">
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                              style={{ 
                                backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.15)`,
                                color: configPrimaryColor
                              }}
                            >
                              {u.clubRole || 'Jugador'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {u.role !== 'admin' ? (
                              <button
                                onClick={() => handleUpdateRole(u.id, 'admin')}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Hacer Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(u.id, 'member')}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                Quitar Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS / TREASURY */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
              {[
                { id: 'registro', label: 'Registrar Pago' },
                { id: 'mensualidades', label: 'Control de Mensualidades' },
                { id: 'uniformes', label: 'Control de Uniformes' },
              ].map(tv => (
                <button
                  key={tv.id}
                  onClick={() => setTreasuryView(tv.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    treasuryView === tv.id 
                      ? 'text-white shadow-md' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                  style={treasuryView === tv.id ? {
                    backgroundColor: configPrimaryColor
                  } : {}}
                >
                  {tv.label}
                </button>
              ))}
            </div>

            {treasuryView === 'registro' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4" style={{ color: configPrimaryColor }} />
                      <span>Ingresar Comprobante</span>
                    </h3>
                    
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Miembro / Atleta</label>
                        <select
                          value={paymentUser}
                          onChange={(e) => setPaymentUser(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                          required
                        >
                          <option value="">Seleccionar Miembro...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name || u.email} ({u.clubRole || 'Jugador'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Concepto</label>
                        <select
                          value={paymentConcept}
                          onChange={(e) => setPaymentConcept(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                        >
                          <option value="Cuota Mensual">Cuota Mensual</option>
                          <option value="Uniforme">Uniforme Oficial</option>
                          <option value="Inscripción / Matrícula">Inscripción / Matrícula</option>
                          <option value="Torneo / Arbitraje">Torneo / Arbitraje</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      {paymentConcept === 'Cuota Mensual' && (
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mes Correspondiente</label>
                          <input 
                            type="month" 
                            value={paymentPeriod}
                            onChange={(e) => setPaymentPeriod(e.target.value)}
                            className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                            style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Monto (S/)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                          placeholder="Ej. 100.00"
                          required
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isAddingPayment}
                        className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 text-xs uppercase tracking-wider min-h-[44px]"
                        style={{
                          backgroundColor: configPrimaryColor,
                          boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.4)`
                        }}
                      >
                        {isAddingPayment ? 'Guardando...' : 'Registrar Pago'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                      <h3 className="font-bold text-white text-sm sm:text-base">Historial de Pagos</h3>
                      <span className="text-xs text-zinc-400 font-mono">{payments.length} registros</span>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800 sticky top-0">
                          <tr>
                            <th className="px-5 py-3.5">Fecha</th>
                            <th className="px-5 py-3.5">Miembro</th>
                            <th className="px-5 py-3.5">Concepto</th>
                            <th className="px-5 py-3.5 text-right">Monto</th>
                            <th className="px-5 py-3.5 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-zinc-500">No hay pagos registrados.</td>
                            </tr>
                          ) : payments.map(p => (
                            <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 text-xs text-zinc-400">
                                {p.createdAt ? format(p.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: es }) : 'Reciente'}
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">{p.userName}</td>
                              <td className="px-5 py-4 text-zinc-300">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs">
                                  {p.concept} {p.period ? `(${p.period})` : ''}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-black text-emerald-400">
                                S/ {Number(p.amount).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  onClick={() => setReceiptToPrint(p)}
                                  className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors text-xs font-semibold"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Recibo
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {treasuryView === 'mensualidades' && (
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-white text-sm sm:text-base">Estado de Mensualidades</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400 font-semibold">Seleccionar Mes:</label>
                    <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="rounded-lg border-zinc-800 border bg-black text-white px-3 py-1 text-xs focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3.5">Integrante</th>
                        <th className="px-5 py-3.5">Rol</th>
                        <th className="px-5 py-3.5 text-center">Estado de Pago ({selectedMonth})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                      {users.map(u => {
                        const monthlyPayment = payments.find(p => p.userId === u.id && p.concept === 'Cuota Mensual' && p.period === selectedMonth);
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-4 font-semibold text-white">{u.name || u.email}</td>
                            <td className="px-5 py-4 text-xs text-zinc-400 capitalize">{u.clubRole || 'Jugador'}</td>
                            <td className="px-5 py-4 text-center">
                              {monthlyPayment ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                  Pagado (S/ {Number(monthlyPayment.amount).toFixed(2)})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {treasuryView === 'uniformes' && (
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm sm:text-base">Control de Pagos de Uniformes</h3>
                  <span className="text-xs text-zinc-400">Resumen Acumulado</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3.5">Integrante</th>
                        <th className="px-5 py-3.5 text-center">Estado</th>
                        <th className="px-5 py-3.5 text-right">Monto Pagado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                      {users.map(u => {
                        const uniformPayments = payments.filter(p => p.userId === u.id && p.concept === 'Uniforme');
                        const totalPaid = uniformPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-4 font-semibold text-white">{u.name || u.email}</td>
                            <td className="px-5 py-4 text-center">
                              {totalPaid > 0 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                  Con Pagos Registrados
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-bold uppercase tracking-wider">
                                  Sin Pagos
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-white">
                              {totalPaid > 0 ? `S/ ${totalPaid.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GENERAL CLUB MODE, LOGO & THEME CUSTOMIZER */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Quick Preview Banner */}
            <div 
              className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
              style={{
                backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.1)`,
                borderColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.3)`
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
                  style={{ backgroundColor: configPrimaryColor }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Personalización Integral del Club</h4>
                  <p className="text-xs text-zinc-400">Edita colores, logos, textos del banner y revisa cómo se adapta en celular, tablet y PC.</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: configPrimaryColor }}
              >
                <Eye className="w-4 h-4" />
                <span>Abrir Vista Previa en Vivo</span>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-8">
              
              {/* SECTION 1: LOGO & AUTOMATIC COLOR THEME */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5" style={{ color: configPrimaryColor }} />
                    <h3 className="font-bold text-white text-base sm:text-lg">Logo y Paleta de Colores Dinámica</h3>
                  </div>
                  {isExtractingColors && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extrayendo colores del logo...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Logo Upload Box */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Logo Oficial del Club</label>
                    <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 w-full p-6 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors flex flex-col items-center justify-center text-center">
                      <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                      <span className="font-bold text-sm text-white">Subir Logo desde Carpeta</span>
                      <span className="text-[11px] text-zinc-500 mt-1">PNG, JPG, SVG (Los colores se extraerán automáticamente)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {configLogoUrl && (
                      <div className="mt-4 p-4 bg-black rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={configLogoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg bg-zinc-900 p-1 border border-zinc-800" />
                          <div>
                            <span className="text-xs font-bold text-white block">Logo Cargado</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">Listo para la página</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleManualColorExtract}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Re-extraer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Extracted Colors & Customizer */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Color Primario (Extraído del Logo)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={configPrimaryColor}
                          onChange={(e) => setConfigPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input 
                          type="text" 
                          value={configPrimaryColor}
                          onChange={(e) => setConfigPrimaryColor(e.target.value)}
                          className="w-32 rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-xs font-mono"
                        />
                        <span 
                          className="text-xs px-3 py-1.5 rounded-lg font-bold text-white shadow-sm"
                          style={{ backgroundColor: configPrimaryColor }}
                        >
                          Color Principal
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Color de Acento / Destacado</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={configAccentColor}
                          onChange={(e) => setConfigAccentColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input 
                          type="text" 
                          value={configAccentColor}
                          onChange={(e) => setConfigAccentColor(e.target.value)}
                          className="w-32 rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-xs font-mono"
                        />
                        <span 
                          className="text-xs px-3 py-1.5 rounded-lg font-bold text-white shadow-sm"
                          style={{ backgroundColor: configAccentColor }}
                        >
                          Color Acento
                        </span>
                      </div>
                    </div>

                    {/* Extracted Palette Swatches */}
                    {extractedPalette.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 block mb-2">Paleta detectada del logo:</span>
                        <div className="flex flex-wrap gap-2">
                          {extractedPalette.map((color, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setConfigPrimaryColor(color)}
                              className="w-8 h-8 rounded-lg border border-zinc-700 transition-transform hover:scale-110 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={`Usar ${color} como color principal`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>

              {/* SECTION 2: CLUB IDENTITY & TEXTS */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
                <h3 className="font-bold text-white text-base sm:text-lg border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <span>Identidad y Textos del Club</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre Oficial de la Página / Club</label>
                    <input 
                      type="text" 
                      value={configAppName}
                      onChange={e => setConfigAppName(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. TITANES VOLEY CLUB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Lema / Slogan</label>
                    <input 
                      type="text" 
                      value={configSlogan}
                      onChange={e => setConfigSlogan(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. Pasión, Disciplina y Victoria"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Descripción Institucional</label>
                    <textarea 
                      value={configDescription}
                      onChange={e => setConfigDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Breve reseña sobre el club y los objetivos deportivos..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: HERO BANNER & URGENT ANNOUNCEMENT */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
                <h3 className="font-bold text-white text-base sm:text-lg border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <Megaphone className="w-5 h-5" style={{ color: configAccentColor }} />
                  <span>Banner Principal y Comunicados</span>
                </h3>

                {/* Announcement Toggle */}
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-sm font-bold text-white block">Barra Superior de Avisos</span>
                      <span className="text-xs text-zinc-400">Muestra una franja destacada en la parte superior de la web.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-end sm:self-auto">
                    <input 
                      type="checkbox" 
                      checked={configShowAnnouncement} 
                      onChange={e => setConfigShowAnnouncement(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {configShowAnnouncement && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Texto del Comunicado</label>
                    <input 
                      type="text" 
                      value={configAnnouncementText}
                      onChange={e => setConfigAnnouncementText(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. 🔥 ¡Temporada 2026 Abierta! Consulta los horarios de entrenamiento."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Título del Banner Principal</label>
                    <input 
                      type="text" 
                      value={configHeroTitle}
                      onChange={e => setConfigHeroTitle(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. Pasión, Disciplina y Victoria"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mensaje Principal / Subtítulo</label>
                    <input 
                      type="text" 
                      value={configHeroSubtitle}
                      onChange={e => setConfigHeroSubtitle(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Mensaje de bienvenida que sale en la pantalla principal..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Texto del Botón de Acción</label>
                    <input 
                      type="text" 
                      value={configCtaButtonText}
                      onChange={e => setConfigCtaButtonText(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. Acceso a Miembros"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">URL de Fondo del Banner</label>
                    <input 
                      type="url" 
                      value={configHeroBgUrl}
                      onChange={e => setConfigHeroBgUrl(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: PUBLIC METRICS / STATS */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{ color: configPrimaryColor }} />
                    <h3 className="font-bold text-white text-base sm:text-lg">Métricas y Estadísticas del Club</h3>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">Conteo en tiempo real</span>
                </div>

                {/* Auto count toggle */}
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-sm font-bold text-white block">Conteo Automático de Atletas Registrados</span>
                      <span className="text-xs text-zinc-400">Calcula automáticamente el total de atletas ({registeredAthletesCount} registrados) en la pantalla principal.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-end sm:self-auto">
                    <input 
                      type="checkbox" 
                      checked={configStatsAutoCountPlayers} 
                      onChange={e => setConfigStatsAutoCountPlayers(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Torneos Participados / Copas</label>
                    <input 
                      type="text" 
                      value={configStatsChampionships}
                      onChange={e => setConfigStatsChampionships(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="15+"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      {configStatsAutoCountPlayers ? 'Atletas (Automático)' : 'Atletas (Manual)'}
                    </label>
                    <input 
                      type="text" 
                      value={configStatsAutoCountPlayers ? String(registeredAthletesCount) : configStatsAthletes}
                      disabled={configStatsAutoCountPlayers}
                      onChange={e => setConfigStatsAthletes(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none disabled:opacity-60"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Categorías Formativas</label>
                    <input 
                      type="text" 
                      value={configStatsCategories}
                      onChange={e => setConfigStatsCategories(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Año de Fundación del Club</label>
                    <input 
                      type="text" 
                      value={configStatsFoundedYear}
                      onChange={e => setConfigStatsFoundedYear(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="2010"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: CONTACT & SOCIAL NETWORKS */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
                <h3 className="font-bold text-white text-base sm:text-lg border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <span>Contacto y Canales Oficiales del Club</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">WhatsApp Oficial (Chat Directo)</label>
                    <input 
                      type="text" 
                      value={configContactWhatsApp}
                      onChange={e => setConfigContactWhatsApp(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="+51 987 654 321"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={configContactEmail}
                      onChange={e => setConfigContactEmail(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="contacto@club.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Instagram Oficial</label>
                    <input 
                      type="text" 
                      value={configSocialInstagram}
                      onChange={e => setConfigSocialInstagram(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="https://instagram.com/tuclub o @tuclub"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Facebook Oficial</label>
                    <input 
                      type="text" 
                      value={configSocialFacebook}
                      onChange={e => setConfigSocialFacebook(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="https://facebook.com/tuclub"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">TikTok Oficial</label>
                    <input 
                      type="text" 
                      value={configSocialTikTok}
                      onChange={e => setConfigSocialTikTok(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="https://tiktok.com/@tuclub"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Teléfono Fijo / Central</label>
                    <input 
                      type="text" 
                      value={configContactPhone}
                      onChange={e => setConfigContactPhone(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="(01) 456-7890"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Sede / Ubicación Cancha</label>
                    <input 
                      type="text" 
                      value={configContactLocation}
                      onChange={e => setConfigContactLocation(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Polideportivo Central, Cancha Principal"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE & PREVIEW ACTIONS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[48px]"
                >
                  <Eye className="w-4 h-4" />
                  <span>Probar en Simulador Móvil / PC</span>
                </button>

                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto text-white font-bold py-3.5 px-10 rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-70 uppercase tracking-wider text-xs sm:text-sm min-h-[48px]"
                  style={{
                    backgroundColor: configPrimaryColor,
                    boxShadow: `0 8px 25px -4px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.5)`
                  }}
                >
                  {isSavingSettings ? 'Guardando Configuración...' : 'Guardar y Publicar Cambios'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* RECEIPT MODAL FOR PRINTING */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex justify-center items-center p-4 print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="bg-white text-zinc-900 w-full max-w-md p-8 rounded-2xl shadow-2xl print:shadow-none print:w-full print:max-w-full print:p-8">
            
            <div className="text-center mb-6 border-b-2 border-slate-200 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-wider mb-1">{appSettings.appName || 'Club de Voleibol'}</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Comprobante de Pago Oficial</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-zinc-500 font-medium">Fecha:</span>
                <span className="font-bold">
                  {receiptToPrint.createdAt ? format(receiptToPrint.createdAt.toDate(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) : format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-zinc-500 font-medium">Recibí de:</span>
                <span className="font-bold">{receiptToPrint.userName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-zinc-500 font-medium">Por concepto de:</span>
                <span className="font-bold">{receiptToPrint.concept}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-zinc-500 font-medium">Monto Total:</span>
                <span className="font-black text-xl text-zinc-900">S/ {Number(receiptToPrint.amount).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-12 flex justify-between items-end">
              <div className="text-center w-40">
                <div className="border-t-2 border-zinc-300 pt-2 text-xs font-bold uppercase text-zinc-500">
                  Firma Autorizada
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 font-mono">ID: {receiptToPrint.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE DEVICE PREVIEW SIMULATOR MODAL */}
      <DevicePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        draftSettings={draftClubSettings}
        sampleMedia={mediaList}
        sampleUsers={users}
      />

    </div>
  );
}
