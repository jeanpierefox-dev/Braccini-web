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
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserProfile, 
  MediaItem, 
  MediaCategory,
  UserRole, 
  Payment, 
  ClubSettings, 
  ThemeMode, 
  ClubComment,
  UniformOrder,
  MonthlyFeeRecord
} from '../types';
import { 
  generateUniformBatchPDF,
  generatePlayerFeeStatementPDF,
  generateGeneralTreasuryReportPDF
} from '../utils/pdfGenerators';
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
  FileText,
  MessageSquare,
  Star,
  CornerDownRight,
  ShieldCheck,
  Filter,
  Check,
  Send,
  Building2,
  AlertCircle,
  Shirt,
  FileDown,
  FileSpreadsheet,
  Layers,
  X,
  Edit2,
  Edit3,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '../hooks/useSettings';
import { extractColorsFromImage, ExtractedColors, hexToRgb } from '../utils/colorExtractor';
import { DevicePreviewModal } from '../components/DevicePreviewModal';
import { compressImageFile } from '../utils/imageCompressor';

export function AdminPanel() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'media' | 'users' | 'payments' | 'comments' | 'settings'>('media');
  const appSettings = useSettings();
  
  // Media Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'training' | 'player' | 'general'>('training');
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>('entrenos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickUploadingMedia, setIsQuickUploadingMedia] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commentsList, setCommentsList] = useState<ClubComment[]>([]);

  // User Creation / Edit State
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserClubRole, setNewUserClubRole] = useState<'jugador' | 'entrenador'>('jugador');
  const [newUserCategory, setNewUserCategory] = useState('Categoría Libre');
  const [newUserFeeExempt, setNewUserFeeExempt] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

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
  const [treasuryView, setTreasuryView] = useState<'dashboard' | 'registro' | 'mensualidades' | 'uniformes'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
  });

  // Uniforms State
  const [uniformOrders, setUniformOrders] = useState<UniformOrder[]>([]);
  const [selectedUniformBatch, setSelectedUniformBatch] = useState<string>('Todos los Lotes');
  const [showUniformModal, setShowUniformModal] = useState(false);
  const [editingUniformOrder, setEditingUniformOrder] = useState<UniformOrder | null>(null);
  const [uniformForm, setUniformForm] = useState<Partial<UniformOrder>>({
    itemType: 'completo',
    size: 'M',
    number: '',
    nameOnBack: '',
    batchName: 'Lote Apertura 2026',
    price: 85,
    isPaid: false,
    status: 'pendiente',
    notes: ''
  });

  // Monthly Fees State
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFeeRecord[]>([]);
  const [feeMonthFilter, setFeeMonthFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [feePlayerFilter, setFeePlayerFilter] = useState<string>('all');
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState<Partial<MonthlyFeeRecord>>({
    monthPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    monthName: 'Mes Deportivo',
    amount: 100,
    paidAmount: 100,
    status: 'al_dia',
    notes: ''
  });

  // Comments / Feedback Mailbox State
  const [commentStatusFilter, setCommentStatusFilter] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [commentStarFilter, setCommentStarFilter] = useState<number | 'all'>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySuccessId, setReplySuccessId] = useState<string | null>(null);

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
  const [configMainTeamImageUrl, setConfigMainTeamImageUrl] = useState('');
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

  // Misión y Visión
  const [configShowMissionVision, setConfigShowMissionVision] = useState(true);
  const [configHidePrivatePlatform, setConfigHidePrivatePlatform] = useState(false);
  const [configMissionTitle, setConfigMissionTitle] = useState('Nuestra Misión');
  const [configMissionText, setConfigMissionText] = useState('Formar atletas íntegros de alto rendimiento en voleibol...');
  const [configVisionTitle, setConfigVisionTitle] = useState('Nuestra Visión');
  const [configVisionText, setConfigVisionText] = useState('Ser la institución deportiva de voleibol referente en formación...');

  // Planes de Membresía y Acceso
  const [configPlan1MonthPrice, setConfigPlan1MonthPrice] = useState(45);
  const [configPlan3MonthsPrice, setConfigPlan3MonthsPrice] = useState(120);
  const [configPlan12MonthsPrice, setConfigPlan12MonthsPrice] = useState(420);
  const [configMembershipPaymentInfo, setConfigMembershipPaymentInfo] = useState('Yape / Plin al 987 654 321 o BCP 191-12345678-0-12');

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
    if (appSettings.mainTeamImageUrl) setConfigMainTeamImageUrl(appSettings.mainTeamImageUrl);
    if (appSettings.ctaButtonText) setConfigCtaButtonText(appSettings.ctaButtonText);
    
    if (typeof appSettings.showAnnouncement === 'boolean') setConfigShowAnnouncement(appSettings.showAnnouncement);
    if (appSettings.announcementText) setConfigAnnouncementText(appSettings.announcementText);
    
    if (appSettings.statsChampionships) setConfigStatsChampionships(appSettings.statsChampionships);
    if (appSettings.statsAthletes) setConfigStatsAthletes(appSettings.statsAthletes);
    if (appSettings.statsCategories) setConfigStatsCategories(appSettings.statsCategories);
    if (appSettings.statsFoundedYear) setConfigStatsFoundedYear(appSettings.statsFoundedYear);
    if (typeof appSettings.statsAutoCountPlayers === 'boolean') setConfigStatsAutoCountPlayers(appSettings.statsAutoCountPlayers);

    if (appSettings.contactPhone) setConfigContactPhone(appSettings.contactPhone);
    if (appSettings.contactWhatsApp) setConfigContactWhatsApp(appSettings.contactWhatsApp);
    if (appSettings.contactEmail) setConfigContactEmail(appSettings.contactEmail);
    if (appSettings.contactLocation) setConfigContactLocation(appSettings.contactLocation);
    if (appSettings.socialInstagram) setConfigSocialInstagram(appSettings.socialInstagram);
    if (appSettings.socialFacebook) setConfigSocialFacebook(appSettings.socialFacebook);
    if (appSettings.socialTikTok) setConfigSocialTikTok(appSettings.socialTikTok);

    if (typeof appSettings.showMissionVision === 'boolean') setConfigShowMissionVision(appSettings.showMissionVision);
    if (typeof appSettings.hidePrivatePlatform === 'boolean') setConfigHidePrivatePlatform(appSettings.hidePrivatePlatform);
    if (appSettings.missionTitle) setConfigMissionTitle(appSettings.missionTitle);
    if (appSettings.missionText) setConfigMissionText(appSettings.missionText);
    if (appSettings.visionTitle) setConfigVisionTitle(appSettings.visionTitle);
    if (appSettings.visionText) setConfigVisionText(appSettings.visionText);

    if (typeof appSettings.plan1MonthPrice === 'number') setConfigPlan1MonthPrice(appSettings.plan1MonthPrice);
    if (typeof appSettings.plan3MonthsPrice === 'number') setConfigPlan3MonthsPrice(appSettings.plan3MonthsPrice);
    if (typeof appSettings.plan12MonthsPrice === 'number') setConfigPlan12MonthsPrice(appSettings.plan12MonthsPrice);
    if (appSettings.membershipPaymentInfo) setConfigMembershipPaymentInfo(appSettings.membershipPaymentInfo);
  }, [appSettings]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (role !== 'admin') return;

    // Fetch Users
    const qUsers = query(collection(db, 'users'));
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

    // Fetch Comments / Feedback Mailbox
    const qComments = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unComments = onSnapshot(qComments, (snap) => {
      const c: ClubComment[] = [];
      snap.forEach(d => c.push({ id: d.id, ...d.data() } as ClubComment));
      setCommentsList(c);
    }, (error) => {
      console.warn("Firestore listener error (comments):", error);
    });

    // Fetch Uniform Orders
    const qUniforms = query(collection(db, 'uniform_orders'), orderBy('createdAt', 'desc'));
    const unUniforms = onSnapshot(qUniforms, (snap) => {
      const u: UniformOrder[] = [];
      snap.forEach(d => u.push({ id: d.id, ...d.data() } as UniformOrder));
      setUniformOrders(u);
    }, (error) => {
      console.warn("Firestore listener error (uniform_orders):", error);
    });

    // Fetch Monthly Fee Records
    const qFees = query(collection(db, 'monthly_fees'), orderBy('createdAt', 'desc'));
    const unFees = onSnapshot(qFees, (snap) => {
      const f: MonthlyFeeRecord[] = [];
      snap.forEach(d => f.push({ id: d.id, ...d.data() } as MonthlyFeeRecord));
      setMonthlyFees(f);
    }, (error) => {
      console.warn("Firestore listener error (monthly_fees):", error);
    });

    return () => {
      unUsers();
      unMedia();
      unPayments();
      unComments();
      unUniforms();
      unFees();
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
        
        const dataUrl = canvas.toDataURL('image/png');
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

  // Upload handler for Main Team Official Photo (Imagen Oficial del Equipo Principal)
  const handleMainTeamImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 900;
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setConfigMainTeamImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload handler for Hero Background Banner
  const handleHeroBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 900;
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setConfigHeroBgUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload handler for Media Library files
  const handleMediaFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de imagen o video válido.');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setUrl(dataUrl);
          if (!title) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct fast upload for training photos (bypasses form fields)
  const handleQuickMediaDirectUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsQuickUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedBase64 = await compressImageFile(file, 1280, 900, 0.85);
        const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const autoTitle = fileNameClean ? (fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1)) : 'Entrenamiento';

        await addDoc(collection(db, 'media'), {
          title: autoTitle,
          description: '',
          url: compressedBase64,
          type: 'training',
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error('Error in quick media upload:', err);
      alert('Error al subir fotos rápidamente: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsQuickUploadingMedia(false);
      e.target.value = '';
    }
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
      setError('Por favor selecciona una foto desde tu carpeta o dispositivo y asigna un título');
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
        category: mediaCategory,
        createdBy: user?.uid || 'admin',
        createdAt: serverTimestamp(),
      });

      setTitle('');
      setDescription('');
      setUrl('');
      setType('training');
      setMediaCategory('entrenos');
    } catch (err: any) {
      setError(err.message || 'Error al subir multimedia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este contenido?')) {
      try {
        await deleteDoc(doc(db, 'media', id));
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Assign time-limited membership access (1, 3, 12 months, unlimited, or revoke)
  const handleSetUserMembership = async (userId: string, months: number | 'unlimited' | 'revoke') => {
    try {
      if (months === 'revoke') {
        await updateDoc(doc(db, 'users', userId), {
          membershipStatus: 'expired',
          hasAccessToPrivatePlatform: false,
          membershipPlan: 'free',
          membershipEndDate: new Date(Date.now() - 86400000).toISOString()
        });
        alert('Acceso a plataforma privada revocado.');
        return;
      }

      let endDate: Date;
      let planName = 'custom';

      if (months === 'unlimited') {
        endDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
        planName = 'unlimited';
      } else {
        const currentUser = users.find(u => u.id === userId);
        const currentEnd = currentUser?.membershipEndDate ? new Date(currentUser.membershipEndDate) : new Date();
        const baseDate = currentEnd > new Date() ? currentEnd : new Date();
        
        endDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
        planName = months === 1 ? '1_month' : (months === 3 ? '3_months' : '12_months');
      }

      await updateDoc(doc(db, 'users', userId), {
        membershipStatus: 'active',
        hasAccessToPrivatePlatform: true,
        membershipPlan: planName,
        membershipEndDate: endDate.toISOString()
      });

      alert(`¡Membresía actualizada! Acceso habilitado hasta ${format(endDate, "dd/MM/yyyy", { locale: es })}.`);
    } catch (err: any) {
      console.error("Error setting membership:", err);
      alert('Error al actualizar membresía: ' + err.message);
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserUsername || !newUserName) {
      alert('Nombre completo y nombre de usuario son obligatorios');
      return;
    }

    if (!editingUserId && newUserPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsAddingUser(true);
    const cleanUsername = newUserUsername.toLowerCase().trim();
    const generatedEmail = `${cleanUsername}@club.com`;
    let createdUid: string | null = editingUserId;

    try {
      if (editingUserId) {
        // Edit existing user
        const updatePayload: any = {
          name: newUserName.trim(),
          username: cleanUsername,
          clubRole: newUserClubRole,
          category: newUserCategory,
          isFeeExempt: newUserFeeExempt,
        };
        
        if (newUserPassword.trim().length >= 6) {
           updatePayload.password = newUserPassword;
        }

        await updateDoc(doc(db, 'users', editingUserId), updatePayload);
        alert(`¡Ficha de @${cleanUsername} actualizada exitosamente!`);
      } else {
        // Create new user
        const appName = `SecondaryApp_${Date.now()}`;
        let secondaryAppInstance: any = null;
        try {
          // 1. Intentar creación en Firebase Auth vía secondary app
          try {
            secondaryAppInstance = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryAppInstance);
            
            const userCredential = await createUserWithEmailAndPassword(
              secondaryAuth,
              generatedEmail,
              newUserPassword
            );
            createdUid = userCredential.user.uid;
          } catch (authErr: any) {
            console.warn("Firebase Auth secondary creation failed, saving to Firestore directly:", authErr);
            createdUid = `user_${cleanUsername}_${Date.now()}`;
          }

          // 2. Guardar ficha del usuario en Firestore
          await setDoc(doc(db, 'users', createdUid), {
            name: newUserName.trim(),
            email: generatedEmail,
            username: cleanUsername,
            password: newUserPassword,
            role: 'member',
            clubRole: newUserClubRole,
            category: newUserCategory,
            isFeeExempt: newUserFeeExempt,
            photoURL: '',
            createdAt: serverTimestamp(),
          });

          // 3. Inicializar cuota si no está exonerado y es jugador
          if (newUserClubRole === 'jugador' && !newUserFeeExempt) {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const monthPeriod = `${y}-${m}`;
            const monthFormatted = format(d, "MMMM yyyy", { locale: es });
            const monthName = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);
            
            await addDoc(collection(db, 'monthly_fees'), {
              userId: createdUid,
              userName: newUserName.trim(),
              userCategory: newUserCategory,
              monthPeriod,
              monthName,
              amount: 100,
              paidAmount: 0,
              status: 'pendiente',
              dueDate: `${y}-${m}-15`,
              createdAt: serverTimestamp()
            });
          }

          alert(`¡Usuario @${cleanUsername} registrado exitosamente!`);
        } finally {
          if (secondaryAppInstance) {
            try {
              await deleteApp(secondaryAppInstance);
            } catch (e) {}
          }
        }
      }

      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserClubRole('jugador');
      setNewUserCategory('Categoría Libre');
      setNewUserFeeExempt(false);
      setEditingUserId(null);
    } catch (err: any) {
      console.error("Error al registrar/editar usuario:", err);
      alert('Error: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleEditUserClick = (u: UserProfile) => {
    setNewUserName(u.name || '');
    setNewUserUsername(u.username || '');
    setNewUserPassword(''); // blank implies keeping old password
    setNewUserClubRole(u.clubRole as any || 'jugador');
    setNewUserCategory(u.category || 'Categoría Libre');
    setNewUserFeeExempt(!!u.isFeeExempt);
    setEditingUserId(u.id!);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de forma permanente?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentUser || !paymentAmount || isNaN(Number(paymentAmount))) {
      alert('Por favor ingresa un integrante y monto válido');
      return;
    }

    setIsAddingPayment(true);
    try {
      const selectedUserObj = users.find(u => u.id === paymentUser);
      const userName = selectedUserObj ? selectedUserObj.name : 'Desconocido';

      const newPaymentDoc = await addDoc(collection(db, 'payments'), {
        userId: paymentUser,
        userName: userName,
        concept: paymentConcept,
        amount: Number(paymentAmount),
        period: paymentPeriod,
        status: 'paid',
        createdBy: user?.uid || 'admin',
        createdAt: serverTimestamp()
      });

      const newPayment: Payment = {
        id: newPaymentDoc.id,
        userId: paymentUser,
        userName: userName,
        concept: paymentConcept,
        amount: Number(paymentAmount),
        period: paymentPeriod,
        status: 'paid',
        createdBy: user?.uid || 'admin',
        createdAt: null
      };

      setPaymentAmount('');
      setReceiptToPrint(newPayment);
    } catch (err: any) {
      console.error(err);
      alert('Error al registrar pago');
    } finally {
      setIsAddingPayment(false);
    }
  };

  // UNIFORM ORDER HANDLERS
  const handleOpenNewUniformModal = (preselectedUser?: UserProfile) => {
    if (preselectedUser) {
      setUniformForm({
        userId: preselectedUser.id,
        userName: preselectedUser.name || preselectedUser.email,
        itemType: 'completo',
        size: 'M',
        number: preselectedUser.jerseyNumber || '',
        nameOnBack: preselectedUser.name?.split(' ')?.[0]?.toUpperCase() || '',
        batchName: selectedUniformBatch !== 'Todos los Lotes' ? selectedUniformBatch : 'Lote Apertura 2026',
        price: 85,
        isPaid: false,
        status: 'pendiente',
        notes: ''
      });
    } else {
      const firstPlayer = users[0];
      setUniformForm({
        userId: firstPlayer?.id || '',
        userName: firstPlayer?.name || firstPlayer?.email || '',
        itemType: 'completo',
        size: 'M',
        number: firstPlayer?.jerseyNumber || '',
        nameOnBack: firstPlayer?.name?.split(' ')?.[0]?.toUpperCase() || '',
        batchName: selectedUniformBatch !== 'Todos los Lotes' ? selectedUniformBatch : 'Lote Apertura 2026',
        price: 85,
        isPaid: false,
        status: 'pendiente',
        notes: ''
      });
    }
    setEditingUniformOrder(null);
    setShowUniformModal(true);
  };

  const handleEditUniformOrder = (order: UniformOrder) => {
    setEditingUniformOrder(order);
    setUniformForm({ ...order });
    setShowUniformModal(true);
  };

  const handleSaveUniformOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!uniformForm.userId || !uniformForm.size) {
      alert('Por favor selecciona un integrante y talla.');
      return;
    }

    try {
      const selectedUserObj = users.find(u => u.id === uniformForm.userId);
      const userName = selectedUserObj ? (selectedUserObj.name || selectedUserObj.email) : (uniformForm.userName || 'Deportista');
      
      const payload: Partial<UniformOrder> = {
        userId: uniformForm.userId,
        userName: userName,
        userCategory: selectedUserObj?.category || 'General',
        itemType: uniformForm.itemType || 'completo',
        size: uniformForm.size || 'M',
        number: uniformForm.number || selectedUserObj?.jerseyNumber || 'S/N',
        nameOnBack: uniformForm.nameOnBack || userName.split(' ')?.[0]?.toUpperCase() || 'CLUB',
        batchName: uniformForm.batchName || 'Lote Apertura 2026',
        price: Number(uniformForm.price) || 85,
        isPaid: Boolean(uniformForm.isPaid),
        status: uniformForm.status || 'pendiente',
        notes: uniformForm.notes || ''
      };

      if (editingUniformOrder) {
        await updateDoc(doc(db, 'uniform_orders', editingUniformOrder.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'uniform_orders'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      setShowUniformModal(false);
      setEditingUniformOrder(null);
    } catch (err: any) {
      console.error('Error saving uniform order:', err);
      alert('Error al guardar el pedido de uniforme: ' + err.message);
    }
  };

  const handleDeleteUniformOrder = async (orderId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido de uniforme?')) return;
    try {
      await deleteDoc(doc(db, 'uniform_orders', orderId));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el pedido.');
    }
  };

  const handleToggleUniformPaid = async (order: UniformOrder) => {
    try {
      await updateDoc(doc(db, 'uniform_orders', order.id), {
        isPaid: !order.isPaid
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadUniformBatchPDF = (targetBatch: string) => {
    const filtered = targetBatch === 'Todos los Lotes' 
      ? uniformOrders 
      : uniformOrders.filter(o => o.batchName === targetBatch);

    if (filtered.length === 0) {
      alert('No hay pedidos en este lote para exportar.');
      return;
    }

    generateUniformBatchPDF(filtered, targetBatch, appSettings);
  };

  // MONTHLY FEE HANDLERS
  const handleOpenNewFeeModal = (preselectedUser?: UserProfile) => {
    const selectedMonthStr = feeMonthFilter;
    const [y, m] = selectedMonthStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthFormatted = format(dateObj, "MMMM yyyy", { locale: es });

    setFeeForm({
      userId: preselectedUser?.id || users[0]?.id || '',
      userName: preselectedUser?.name || users[0]?.name || '',
      monthPeriod: selectedMonthStr,
      monthName: monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1),
      amount: 100,
      paidAmount: 100,
      status: 'al_dia',
      dueDate: `${y}-${m}-15`,
      notes: ''
    });
    setShowFeeModal(true);
  };

  const handleSaveMonthlyFee = async (e: FormEvent) => {
    e.preventDefault();
    if (!feeForm.userId || !feeForm.amount) {
      alert('Por favor selecciona un integrante y monto.');
      return;
    }

    try {
      const selectedUserObj = users.find(u => u.id === feeForm.userId);
      const userName = selectedUserObj ? (selectedUserObj.name || selectedUserObj.email) : 'Deportista';
      const amt = Number(feeForm.amount) || 0;
      const paid = Number(feeForm.paidAmount) || 0;
      
      let calcStatus: 'al_dia' | 'pendiente' | 'parcial' | 'vencido' = 'al_dia';
      if (paid >= amt) calcStatus = 'al_dia';
      else if (paid > 0) calcStatus = 'parcial';
      else calcStatus = 'pendiente';

      const payload = {
        userId: feeForm.userId,
        userName: userName,
        userCategory: selectedUserObj?.category || 'General',
        monthPeriod: feeForm.monthPeriod || feeMonthFilter,
        monthName: feeForm.monthName || 'Mes Deportivo',
        amount: amt,
        paidAmount: paid,
        status: calcStatus,
        dueDate: feeForm.dueDate || '',
        paidAt: paid > 0 ? (feeForm.paidAt || format(new Date(), 'yyyy-MM-dd')) : '',
        notes: feeForm.notes || ''
      };

      await addDoc(collection(db, 'monthly_fees'), {
        ...payload,
        createdAt: serverTimestamp()
      });

      setShowFeeModal(false);
    } catch (err: any) {
      console.error('Error saving fee:', err);
      alert('Error al registrar cuota: ' + err.message);
    }
  };

  const handleQuickGenerateFeesForMonth = async () => {
    if (!window.confirm(`¿Deseas generar la cuota de S/ 100 para todos los integrantes activos para el mes ${feeMonthFilter}?`)) return;

    try {
      const [y, m] = feeMonthFilter.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
      const monthFormatted = format(dateObj, "MMMM yyyy", { locale: es });
      const monthTitle = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);

      let createdCount = 0;
      for (const u of users) {
        // Check if fee already exists for this user in this period
        const existing = monthlyFees.find(f => f.userId === u.id && f.monthPeriod === feeMonthFilter);
        if (!existing) {
          await addDoc(collection(db, 'monthly_fees'), {
            userId: u.id,
            userName: u.name || u.email,
            userCategory: u.category || 'General',
            monthPeriod: feeMonthFilter,
            monthName: monthTitle,
            amount: 100,
            paidAmount: 0,
            status: 'pendiente',
            dueDate: `${y}-${m}-15`,
            createdAt: serverTimestamp()
          });
          createdCount++;
        }
      }

      alert(`¡Se generaron ${createdCount} cuotas mensuales para el periodo ${monthTitle}!`);
    } catch (err: any) {
      console.error(err);
      alert('Error al generar cuotas masivas: ' + err.message);
    }
  };

  const handleDeleteMonthlyFee = async (feeId: string) => {
    if (!window.confirm('¿Eliminar registro de cuota?')) return;
    try {
      await deleteDoc(doc(db, 'monthly_fees', feeId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPlayerStatement = (targetUser: UserProfile) => {
    const userFees = monthlyFees.filter(f => f.userId === targetUser.id);
    generatePlayerFeeStatementPDF(targetUser, userFees, appSettings);
  };

  const handleDownloadGeneralTreasury = () => {
    generateGeneralTreasuryReportPDF(users, monthlyFees, feeMonthFilter, appSettings);
  };

  // Reply to comment
  const handleSaveAdminReply = async (commentId: string) => {
    if (!replyInputText.trim()) return;
    setIsReplying(true);
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        adminReply: replyInputText.trim(),
        adminRepliedAt: serverTimestamp(),
        adminRepliedBy: user?.displayName || 'Dirección del Club'
      });
      setActiveReplyId(null);
      setReplyInputText('');
      setReplySuccessId(commentId);
      setTimeout(() => setReplySuccessId(null), 3000);
    } catch (err) {
      console.error("Error saving reply:", err);
      alert("No se pudo guardar la respuesta.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteAdminReply = async (commentId: string) => {
    if (confirm("¿Deseas eliminar la respuesta oficial a este comentario?")) {
      try {
        await updateDoc(doc(db, 'comments', commentId), {
          adminReply: null,
          adminRepliedAt: null,
          adminRepliedBy: null
        });
      } catch (err) {
        console.error("Error deleting reply:", err);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("¿Estás seguro de eliminar este comentario del muro?")) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
      } catch (err) {
        console.error("Error deleting comment:", err);
      }
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const primaryRgbObj = hexToRgb(configPrimaryColor);
      const accentRgbObj = hexToRgb(configAccentColor);

      const settingsData: Partial<ClubSettings> = {
        appName: configAppName.trim() || 'CLUB DE VOLEIBOL',
        slogan: configSlogan.trim(),
        description: configDescription.trim(),
        logoUrl: configLogoUrl.trim(),
        primaryColor: configPrimaryColor,
        primaryRgb: `${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}`,
        accentColor: configAccentColor,
        accentRgb: `${accentRgbObj.r}, ${accentRgbObj.g}, ${accentRgbObj.b}`,
        themeMode: configThemeMode,
        heroTitle: configHeroTitle.trim(),
        heroSubtitle: configHeroSubtitle.trim(),
        heroBgUrl: configHeroBgUrl.trim(),
        mainTeamImageUrl: configMainTeamImageUrl.trim(),
        ctaButtonText: configCtaButtonText.trim() || 'Acceso a Miembros',
        showAnnouncement: configShowAnnouncement,
        announcementText: configAnnouncementText.trim(),
        statsChampionships: configStatsChampionships.trim(),
        statsAthletes: configStatsAthletes.trim(),
        statsCategories: configStatsCategories.trim(),
        statsFoundedYear: configStatsFoundedYear.trim(),
        statsAutoCountPlayers: configStatsAutoCountPlayers,
        contactPhone: configContactPhone.trim(),
        contactWhatsApp: configContactWhatsApp.trim(),
        contactEmail: configContactEmail.trim(),
        contactLocation: configContactLocation.trim(),
        socialInstagram: configSocialInstagram.trim(),
        socialFacebook: configSocialFacebook.trim(),
        socialTikTok: configSocialTikTok.trim(),
        showMissionVision: configShowMissionVision,
        hidePrivatePlatform: configHidePrivatePlatform,
        missionTitle: configMissionTitle.trim(),
        missionText: configMissionText.trim(),
        visionTitle: configVisionTitle.trim(),
        visionText: configVisionText.trim(),
        plan1MonthPrice: Number(configPlan1MonthPrice) || 45,
        plan3MonthsPrice: Number(configPlan3MonthsPrice) || 120,
        plan12MonthsPrice: Number(configPlan12MonthsPrice) || 420,
        membershipPaymentInfo: configMembershipPaymentInfo.trim(),
      };

      await setDoc(doc(db, 'settings', 'general'), settingsData, { merge: true });
      alert('¡Configuraciones y diseño del club guardados exitosamente!');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (receiptToPrint) {
      window.print();
      setTimeout(() => {
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
    mainTeamImageUrl: configMainTeamImageUrl || appSettings.mainTeamImageUrl,
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
    hidePrivatePlatform: configHidePrivatePlatform
  };

  // Real-time count of registered players & staff (Strictly EXCLUDES admin role from player count)
  const registeredAthletesCount = users.filter(u => u.role !== 'admin' && u.clubRole !== 'entrenador').length;
  const registeredStaffCount = users.filter(u => u.role !== 'admin' && u.clubRole === 'entrenador').length;
  const registeredDirectorsCount = users.filter(u => u.role === 'admin' || u.clubRole === 'director').length;

  // Comments metrics
  const totalCommentsCount = commentsList.length;
  const unrepliedCommentsCount = commentsList.filter(c => !c.adminReply).length;
  const repliedCommentsCount = commentsList.filter(c => !!c.adminReply).length;
  const averageStarScore = totalCommentsCount > 0
    ? (commentsList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalCommentsCount).toFixed(1)
    : '5.0';

  // Filtered comments for Mailbox
  const filteredComments = commentsList.filter(c => {
    if (commentStatusFilter === 'unreplied' && c.adminReply) return false;
    if (commentStatusFilter === 'replied' && !c.adminReply) return false;
    if (commentStarFilter !== 'all' && (c.rating || 5) !== commentStarFilter) return false;
    return true;
  });

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
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">Gestión de contenidos, buzón de comentarios, atletas y diseño del club.</p>
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
                <span className="text-[10px] text-emerald-400 font-bold font-mono">Sin Adm</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3 shadow-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/20 border border-amber-500/30 shrink-0"
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block truncate">Buzón de Reseñas</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{commentsList.length}</span>
                {unrepliedCommentsCount > 0 ? (
                  <span className="text-[10px] text-amber-400 font-bold font-mono">{unrepliedCommentsCount} pendientes</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">Al día</span>
                )}
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
            { id: 'comments', label: 'Buzón de Reseñas', icon: MessageSquare, badge: unrepliedCommentsCount },
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
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all relative ${
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MEDIA */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-1 space-y-6">
              {/* Option 1: Fast 1-Click Upload (No title/desc/category required) */}
              <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-700/60 p-5 shadow-xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.2)` }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: configPrimaryColor }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Subida Rápida (1 Clic)</h4>
                    <p className="text-[11px] text-zinc-400">Fotos de entrenamientos directo de tu carpeta</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Sube una o varias fotos a la vez sin necesidad de escribir título, categoría ni descripción.
                </p>
                <label className={`cursor-pointer w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all text-white ${
                  isQuickUploadingMedia ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.25)`,
                  borderColor: configPrimaryColor
                }}>
                  {isQuickUploadingMedia ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Comprimiendo y Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" style={{ color: configPrimaryColor }} />
                      <span>Elegir Foto(s) de Entreno</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    disabled={isQuickUploadingMedia}
                    onChange={handleQuickMediaDirectUpload}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Option 2: Detailed Media Form */}
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" style={{ color: configPrimaryColor }} />
                  <span>Publicación Detallada</span>
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
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Categoría de Publicación</label>
                    <select
                      value={mediaCategory}
                      onChange={(e) => setMediaCategory(e.target.value as any)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    >
                      <option value="entrenos">🏋️ Entrenamientos y Técnicas</option>
                      <option value="partidos">🏐 Partidos y Torneos Oficiales</option>
                      <option value="paseos">🌴 Paseos y Confraternidad</option>
                      <option value="institucional">🏛️ Institucional y Comunicados</option>
                      <option value="general">⭐ General</option>
                    </select>
                  </div>

                  {/* File Upload Only - No URL Input */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Foto o Video (Seleccionar desde Carpeta)</label>
                    
                    {url ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black p-2 flex items-center gap-3">
                        {type === 'training' && url.startsWith('data:video') ? (
                          <video src={url} className="w-20 h-16 object-cover rounded-lg" controls />
                        ) : (
                          <img src={url} alt="Vista previa" className="w-20 h-16 object-cover rounded-lg border border-zinc-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{title || 'Archivo seleccionado'}</p>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            ✓ Imagen lista para publicar
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors">
                            Cambiar
                            <input 
                              type="file" 
                              accept="image/*,video/*"
                              onChange={handleMediaFileUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setUrl('')}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 w-full p-5 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.15)` }}
                        >
                          <Upload className="w-6 h-6" style={{ color: configPrimaryColor }} />
                        </div>
                        <span className="text-xs font-bold text-white">Haz clic para abrir tu carpeta y elegir la foto</span>
                        <span className="text-[11px] text-zinc-500">Admite fotos (JPG, PNG, WEBP) o videos cortos</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*"
                          onChange={handleMediaFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Descripción Opcional</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Detalles sobre este ejercicio..."
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
                    {isSubmitting ? 'Guardando...' : 'Publicar Contenido'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                <h3 className="font-bold text-white text-sm sm:text-base mb-4 border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <span>Material Multimedia Publicado</span>
                  <span className="text-xs text-zinc-400 font-mono">{mediaList.length} elementos</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {mediaList.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                      <LayoutTemplate className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay contenido publicado aún.</p>
                    </div>
                  ) : mediaList.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 flex justify-between items-start gap-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex gap-3 min-w-0">
                        {item.url.startsWith('data:image') || item.url.includes('jpg') || item.url.includes('png') || item.url.includes('unsplash') ? (
                          <img src={item.url} alt="" className="w-14 h-14 rounded-lg object-cover bg-zinc-900 shrink-0 border border-zinc-800" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800 text-zinc-500">
                            <LayoutTemplate className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
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

        {/* TAB 2: COMMENTS & RATINGS MAILBOX */}
        {activeTab === 'comments' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Mailbox KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5 shadow-lg flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
                  style={{ backgroundColor: configPrimaryColor }}
                >
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-400 block">Total de Reseñas</span>
                  <span className="text-2xl font-black text-white">{totalCommentsCount}</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5 shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/20 border border-amber-500/30 shrink-0">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-400 block">Calificación Promedio</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-white">{averageStarScore}</span>
                    <span className="text-xs text-amber-400 font-bold">/ 5 ★</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5 shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/20 border border-amber-500/30 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-400 block">Pendientes de Respuesta</span>
                  <span className="text-2xl font-black text-amber-400">{unrepliedCommentsCount}</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5 shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-400 block">Respondidos por Dirección</span>
                  <span className="text-2xl font-black text-emerald-400">{repliedCommentsCount}</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Status filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Estado:</span>
                {[
                  { id: 'all', label: `Todos (${totalCommentsCount})` },
                  { id: 'unreplied', label: `Pendientes (${unrepliedCommentsCount})` },
                  { id: 'replied', label: `Respondidos (${repliedCommentsCount})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCommentStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      commentStatusFilter === f.id
                        ? 'text-white border-transparent shadow'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    style={commentStatusFilter === f.id ? { backgroundColor: configPrimaryColor } : {}}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Star rating filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Estrellas:</span>
                <button
                  onClick={() => setCommentStarFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    commentStarFilter === 'all'
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Todas
                </button>
                {[5, 4, 3, 2, 1].map(s => (
                  <button
                    key={s}
                    onClick={() => setCommentStarFilter(s)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      commentStarFilter === s
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{s}</span>
                    <Star className={`w-3 h-3 ${commentStarFilter === s ? 'fill-black' : 'fill-amber-400 text-amber-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: configPrimaryColor }} />
                  <span>Bandeja de Entrada de Mensajes y Calificaciones</span>
                </h3>
                <span className="text-xs text-zinc-400 font-mono">{filteredComments.length} mensajes filtrados</span>
              </div>

              {filteredComments.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50 text-zinc-600" />
                  <p className="text-sm font-semibold">No se encontraron comentarios en este filtro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComments.map(c => {
                    const isAthlete = c.authorRole === 'atleta';
                    const isCoach = c.authorRole === 'entrenador';
                    const isCommentAdmin = c.authorRole === 'admin';
                    const isReplyingThis = activeReplyId === c.id;

                    return (
                      <div 
                        key={c.id}
                        className={`bg-zinc-950/90 rounded-2xl p-5 border transition-all shadow-md space-y-3 ${
                          !c.adminReply 
                            ? 'border-amber-500/40 hover:border-amber-500/70' 
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {/* Header of Comment */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                              style={{
                                backgroundColor: isAthlete ? configPrimaryColor : isCoach ? configAccentColor : isCommentAdmin ? '#8b5cf6' : '#52525b'
                              }}
                            >
                              {isAthlete ? <ShieldCheck className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-white text-sm">{c.authorName}</h4>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isAthlete 
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                    : isCoach 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : isCommentAdmin 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {isAthlete ? 'Atleta Oficial' : isCoach ? 'Cuerpo Técnico' : isCommentAdmin ? 'Dirección' : 'Público'}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500">
                                {c.createdAt ? format(c.createdAt.toDate(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) : 'Reciente'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {c.rating && (
                              <div className="flex items-center gap-0.5 bg-black px-2.5 py-1 rounded-lg border border-zinc-800">
                                {Array.from({ length: c.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteComment(c.id!)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                              title="Eliminar comentario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comment Message */}
                        <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed pl-2 sm:pl-12 border-l-2 border-zinc-800">
                          "{c.message}"
                        </p>

                        {/* Existing Admin Reply */}
                        {c.adminReply && (
                          <div className="mt-3 ml-2 sm:ml-10 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1 relative">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                  {c.adminRepliedBy || 'Respuesta Oficial de la Dirección del Club'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {c.adminRepliedAt && (
                                  <span className="text-[9px] text-amber-300/70 font-mono">
                                    {format(c.adminRepliedAt.toDate(), "dd 'de' MMM, yyyy", { locale: es })}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteAdminReply(c.id!)}
                                  className="text-[10px] text-red-400 hover:underline"
                                  title="Borrar esta respuesta"
                                >
                                  Eliminar respuesta
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-200 leading-relaxed italic">
                              "{c.adminReply}"
                            </p>
                          </div>
                        )}

                        {replySuccessId === c.id && (
                          <div className="text-xs text-emerald-400 flex items-center gap-1 font-bold pl-2 sm:pl-12">
                            <Check className="w-4 h-4" /> ¡Respuesta enviada y visible para todos los miembros!
                          </div>
                        )}

                        {/* Action buttons to trigger response editor */}
                        {!isReplyingThis && (
                          <div className="pl-2 sm:pl-12 pt-1 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyId(c.id!);
                                setReplyInputText(c.adminReply || '');
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" />
                              <span>{c.adminReply ? 'Modificar Respuesta Oficial' : 'Responder a esta Reseña'}</span>
                            </button>
                          </div>
                        )}

                        {/* Reply Form */}
                        {isReplyingThis && (
                          <div className="pl-2 sm:pl-12 pt-2 space-y-2">
                            <div className="bg-black p-4 rounded-xl border border-amber-500/50 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Redactar Respuesta Oficial del Club a {c.authorName}:</span>
                                </span>
                              </div>

                              <textarea
                                rows={3}
                                value={replyInputText}
                                onChange={e => setReplyInputText(e.target.value)}
                                placeholder="Escribe el mensaje oficial de respuesta o agradecimiento de la dirección del club..."
                                className="w-full bg-zinc-950 text-white text-xs sm:text-sm p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-amber-400"
                              />

                              <div className="flex items-center justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyId(null)}
                                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isReplying || !replyInputText.trim()}
                                  onClick={() => handleSaveAdminReply(c.id!)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{isReplying ? 'Publicando...' : 'Publicar Respuesta Oficial'}</span>
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
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" style={{ color: configPrimaryColor }} />
                    <span>{editingUserId ? 'Editar Integrante' : 'Crear Nuevo Integrante'}</span>
                  </div>
                  {editingUserId && (
                    <button 
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUserUsername('');
                        setNewUserName('');
                        setNewUserPassword('');
                        setNewUserClubRole('jugador');
                        setNewUserCategory('Categoría Libre');
                        setNewUserFeeExempt(false);
                      }}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  )}
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
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Ej. cmendoza"
                      required
                      disabled={!!editingUserId}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                      {editingUserId ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña Inicial'}
                    </label>
                    <input 
                      type="password" 
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder={editingUserId ? "Cambiar contraseña..." : "Mínimo 6 caracteres"}
                      required={!editingUserId}
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
                      <option value="jugador">Jugador / Atleta (Ficha Deportiva)</option>
                      <option value="entrenador">Entrenador / Staff Técnico (Ficha Técnica)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Categoría / Grupo</label>
                    <select
                      value={newUserCategory}
                      onChange={(e) => setNewUserCategory(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    >
                      <option value="Categoría Libre">Categoría Libre</option>
                      <option value="U12">U12 / Infantil</option>
                      <option value="U14">U14 / Menores</option>
                      <option value="U16">U16 / Cadetes</option>
                      <option value="U18">U18 / Juvenil</option>
                      <option value="Mayores">Mayores / Primera</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newUserFeeExempt} 
                        onChange={e => setNewUserFeeExempt(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    <span className="text-xs text-zinc-400 font-semibold">Exonerado de Cuotas Mensuales (Becado)</span>
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
                    {isAddingUser ? 'Guardando...' : (editingUserId ? 'Guardar Cambios' : 'Crear Usuario')}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">Miembros Registrados</h3>
                    <p className="text-[11px] text-zinc-400">
                      {registeredAthletesCount} Atletas registrados • {registeredStaffCount} Entrenadores • {registeredDirectorsCount} Dirección
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{users.length} total</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3.5">Integrante</th>
                        <th className="px-5 py-3.5">Ficha y Rol</th>
                        <th className="px-5 py-3.5">Membresía / Acceso</th>
                        <th className="px-5 py-3.5">Permisos</th>
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500">No hay usuarios registrados.</td>
                        </tr>
                      ) : users.map(u => {
                        const isUserAdmin = u.role === 'admin' || u.clubRole === 'director';
                        const isUserCoach = u.clubRole === 'entrenador';
                        const isAccessActive = u.membershipStatus === 'active' || isUserAdmin || (u.membershipEndDate && new Date(u.membershipEndDate) > new Date());
                        const expiryDateFormatted = u.membershipEndDate ? format(new Date(u.membershipEndDate), "dd/MM/yyyy", { locale: es }) : null;

                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-5 py-4 font-semibold text-white">
                              <div>{u.name || u.email}</div>
                              {u.username && <div className="text-xs text-zinc-500 font-mono font-normal">@{u.username}</div>}
                            </td>
                            <td className="px-5 py-4 text-zinc-300">
                              {isUserAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Shield className="w-3 h-3" /> Ficha de Director
                                </span>
                              ) : isUserCoach ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  <ShieldCheck className="w-3 h-3" /> Entrenador (Ficha Técnica)
                                </span>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                                  style={{ 
                                    backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.15)`,
                                    color: configPrimaryColor
                                  }}
                                >
                                  <UserIcon className="w-3 h-3" /> Jugador / Atleta
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-1.5">
                                {isUserAdmin ? (
                                  <span className="text-[11px] font-bold text-emerald-400">Acceso Ilimitado (Admin)</span>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`inline-block w-2 h-2 rounded-full ${isAccessActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                      <span className={`text-[11px] font-bold ${isAccessActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isAccessActive ? (expiryDateFormatted ? `Activo hasta ${expiryDateFormatted}` : 'Activo') : 'Vencido / Sin acceso'}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSetUserMembership(u.id, 1)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                                        title="Habilitar acceso por 1 Mes"
                                      >
                                        +1 Mes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetUserMembership(u.id, 3)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                                        title="Habilitar acceso por 3 Meses"
                                      >
                                        +3 Meses
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetUserMembership(u.id, 12)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                                        title="Habilitar acceso por 12 Meses"
                                      >
                                        +12 Meses
                                      </button>
                                      {isAccessActive && (
                                        <button
                                          type="button"
                                          onClick={() => handleSetUserMembership(u.id, 'revoke')}
                                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                                          title="Revocar acceso inmediatamente"
                                        >
                                          Revocar
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                isUserAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isUserAdmin ? (
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
                                <button
                                  onClick={() => handleEditUserClick(u)}
                                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS / TREASURY */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
              {[
                { id: 'dashboard', label: 'Dashboard Financiero' },
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

            {treasuryView === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest block mb-2">Ingresos Totales (Mes Actual)</span>
                    <h3 className="text-3xl font-black text-white">
                      S/ {monthlyFees.filter(f => f.monthPeriod === feeMonthFilter).reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest block mb-2">Por Cobrar (Mes Actual)</span>
                    <h3 className="text-3xl font-black text-amber-400">
                      S/ {monthlyFees.filter(f => f.monthPeriod === feeMonthFilter).reduce((acc, curr) => {
                        const amount = Number(curr.amount) || 0;
                        const paid = Number(curr.paidAmount) || 0;
                        return acc + Math.max(0, amount - paid);
                      }, 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest block mb-2">Deuda Total Histórica</span>
                    <h3 className="text-3xl font-black text-red-400">
                      S/ {monthlyFees.reduce((acc, curr) => {
                        const amount = Number(curr.amount) || 0;
                        const paid = Number(curr.paidAmount) || 0;
                        return acc + Math.max(0, amount - paid);
                      }, 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest block mb-2">Jugadores Activos</span>
                    <h3 className="text-3xl font-black text-emerald-400">
                      {users.filter(u => u.clubRole === 'jugador').length}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pagos Vencidos / Pendientes */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                      <h4 className="font-bold text-white text-sm">Mensualidades Pendientes de Pago</h4>
                      <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Atención Requerida</span>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {monthlyFees.filter(f => {
                        const amount = Number(f.amount) || 0;
                        const paid = Number(f.paidAmount) || 0;
                        return amount > paid;
                      }).sort((a, b) => {
                        const diffA = (Number(a.amount) || 0) - (Number(a.paidAmount) || 0);
                        const diffB = (Number(b.amount) || 0) - (Number(b.paidAmount) || 0);
                        return diffB - diffA; // Sort by highest debt first
                      }).slice(0, 15).map(f => {
                        const pending = (Number(f.amount) || 0) - (Number(f.paidAmount) || 0);
                        return (
                          <div key={f.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-zinc-800">
                            <div>
                              <p className="font-bold text-sm text-white">{f.userName}</p>
                              <p className="text-[10px] text-zinc-500 font-mono uppercase">{f.monthName} • {f.userCategory || 'Sin categoría'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-red-400 font-mono">S/ {pending.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                      {monthlyFees.filter(f => (Number(f.amount) || 0) > (Number(f.paidAmount) || 0)).length === 0 && (
                        <div className="text-center text-zinc-500 text-xs py-8">
                          No hay deudas pendientes registradas.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Últimos Pagos Registrados */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                      <h4 className="font-bold text-white text-sm">Últimos Recibos Emitidos</h4>
                      <button onClick={() => setTreasuryView('registro')} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Ver todos</button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {payments.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-zinc-800">
                          <div>
                            <p className="font-bold text-sm text-white">{p.userName}</p>
                            <p className="text-[10px] text-zinc-500 font-mono uppercase">{p.concept} • {p.createdAt ? format(p.createdAt.toDate(), "dd/MM") : 'Hoy'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-400 font-mono">S/ {Number(p.amount).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <div className="text-center text-zinc-500 text-xs py-8">
                          No hay pagos recientes.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {treasuryView === 'registro' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4" style={{ color: configPrimaryColor }} />
                      <span>Nuevo Comprobante</span>
                    </h3>
                    
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Integrante / Atleta</label>
                        <select 
                          value={paymentUser}
                          onChange={(e) => setPaymentUser(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                          required
                        >
                          <option value="">Seleccionar integrante...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email} ({u.clubRole || 'jugador'})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Concepto de Pago</label>
                        <select 
                          value={paymentConcept}
                          onChange={(e) => setPaymentConcept(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                        >
                          <option value="Cuota Mensual">Cuota Mensual / Mensualidad</option>
                          <option value="Matrícula de Ingreso">Matrícula de Ingreso</option>
                          <option value="Uniforme Oficial">Uniforme Oficial / Camiseta</option>
                          <option value="Arbitraje y Torneo">Arbitraje y Torneo</option>
                          <option value="Otro">Otro Concepto</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Monto (S/ o $)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                          placeholder="Ej. 120.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Periodo / Mes Correspondiente</label>
                        <input 
                          type="month" 
                          value={paymentPeriod}
                          onChange={(e) => setPaymentPeriod(e.target.value)}
                          className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isAddingPayment}
                        className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-60 text-xs uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px]"
                        style={{
                          backgroundColor: configPrimaryColor,
                          boxShadow: `0 4px 14px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.4)`
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        <span>{isAddingPayment ? 'Registrando...' : 'Registrar e Imprimir Recibo'}</span>
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                      <h3 className="font-bold text-white text-sm sm:text-base">Historial de Recibos Emitidos</h3>
                      <span className="text-xs text-zinc-400 font-mono">{payments.length} recibos</span>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800 sticky top-0">
                          <tr>
                            <th className="px-5 py-3.5">Fecha</th>
                            <th className="px-5 py-3.5">Integrante</th>
                            <th className="px-5 py-3.5">Concepto</th>
                            <th className="px-5 py-3.5">Monto</th>
                            <th className="px-5 py-3.5 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-zinc-500">No hay pagos registrados.</td>
                            </tr>
                          ) : payments.map(p => (
                            <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                                {p.createdAt ? format(p.createdAt.toDate(), "dd/MM/yyyy", { locale: es }) : 'Hoy'}
                              </td>
                              <td className="px-5 py-4 font-semibold text-white">{p.userName}</td>
                              <td className="px-5 py-4 text-zinc-300">
                                <div>{p.concept}</div>
                                {p.period && <div className="text-[10px] text-zinc-500 font-mono">Periodo: {p.period}</div>}
                              </td>
                              <td className="px-5 py-4 font-bold text-white whitespace-nowrap">
                                S/ {Number(p.amount).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => setReceiptToPrint(p)}
                                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
                                  title="Reimprimir Recibo"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Recibo</span>
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

            {/* TAB 4: MENSUALIDADES (CUOTAS MENSUALES Y REPORTES) */}
            {treasuryView === 'mensualidades' && (
              <div className="space-y-6">
                
                {/* Control Bar */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base sm:text-lg font-black text-white">Control y Resumen de Cuotas Mensuales</h3>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Controla el saldo de cada deportista (lo que va pagando y lo que falta pagar), emite estados de cuenta por jugador y descarga el reporte general.
                      </p>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadGeneralTreasury}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Descargar Resumen General (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickGenerateFeesForMonth}
                        className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700 transition-colors"
                        title="Genera automáticamente cuotas pendientes para todos los miembros"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Generar Cuotas del Mes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenNewFeeModal()}
                        className="inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: configPrimaryColor }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Cuota</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-semibold">Mes Periodo:</span>
                      <input 
                        type="month" 
                        value={feeMonthFilter}
                        onChange={(e) => setFeeMonthFilter(e.target.value)}
                        className="bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:ring-2"
                        style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-semibold">Filtrar Atleta:</span>
                      <select 
                        value={feePlayerFilter}
                        onChange={(e) => setFeePlayerFilter(e.target.value)}
                        className="bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white outline-none focus:ring-2 max-w-[200px]"
                        style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      >
                        <option value="all">Todos los Integrantes</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Per-Player Financial Balances Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(feePlayerFilter === 'all' ? users : users.filter(u => u.id === feePlayerFilter)).map(u => {
                    const userFees = monthlyFees.filter(f => f.userId === u.id);
                    const totalAssigned = userFees.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                    const totalPaid = userFees.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
                    const totalPending = Math.max(0, totalAssigned - totalPaid);
                    const isUpToDate = totalPending === 0 && totalAssigned > 0;

                    return (
                      <div 
                        key={u.id} 
                        className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
                          isUpToDate 
                            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                            : totalPending > 0
                              ? 'bg-zinc-900/80 border-red-500/30'
                              : 'bg-zinc-900/80 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3 border-b border-zinc-800/80 pb-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">
                              {u.category || 'Categoría Libre'}
                            </span>
                            <h4 className="text-base font-black text-white leading-tight">{u.name || u.email}</h4>
                            <span className="text-[10px] text-zinc-400 font-mono">Dorsal: #{u.jerseyNumber || 'S/N'}</span>
                          </div>

                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            isUpToDate 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : totalPending > 0
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {isUpToDate ? 'Al Día' : totalPending > 0 ? `Debe S/ ${totalPending}` : 'Sin Cuotas'}
                          </span>
                        </div>

                        {/* Balance Meter */}
                        <div className="grid grid-cols-2 gap-2 bg-black/60 rounded-xl p-3 mb-4 border border-zinc-800 text-xs">
                          <div>
                            <span className="text-[9px] text-zinc-500 font-bold block uppercase">Pagado</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">S/ {totalPaid.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-bold block uppercase">Falta Pagar</span>
                            <span className={`text-sm font-black font-mono ${totalPending > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                              S/ {totalPending.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons per athlete */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadPlayerStatement(u)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>PDF Estado de Cuenta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenNewFeeModal(u)}
                            className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            + Cuota
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table of Monthly Fee Records */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-bold text-white text-sm sm:text-base">Detalle de Cuotas Emitidas</h3>
                    <span className="text-xs text-zinc-400 font-mono">{monthlyFees.length} registros</span>
                  </div>

                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800 sticky top-0">
                        <tr>
                          <th className="px-5 py-3.5">Mes / Periodo</th>
                          <th className="px-5 py-3.5">Deportista</th>
                          <th className="px-5 py-3.5">Cuota</th>
                          <th className="px-5 py-3.5">Pagado</th>
                          <th className="px-5 py-3.5">Saldo Deuda</th>
                          <th className="px-5 py-3.5">Estado</th>
                          <th className="px-5 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-xs">
                        {monthlyFees.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-zinc-500">
                              No hay cuotas mensuales registradas aún. Haz clic en "Generar Cuotas del Mes" o "Registrar Cuota".
                            </td>
                          </tr>
                        ) : (
                          (feeMonthFilter ? monthlyFees.filter(f => f.monthPeriod === feeMonthFilter) : monthlyFees).map(f => {
                            const pending = Math.max(0, (Number(f.amount) || 0) - (Number(f.paidAmount) || 0));
                            return (
                              <tr key={f.id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-5 py-3.5 font-mono text-zinc-300 font-bold">{f.monthName || f.monthPeriod}</td>
                                <td className="px-5 py-3.5 font-bold text-white">{f.userName}</td>
                                <td className="px-5 py-3.5 font-mono text-zinc-300">S/ {Number(f.amount).toFixed(2)}</td>
                                <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">S/ {Number(f.paidAmount || 0).toFixed(2)}</td>
                                <td className="px-5 py-3.5 font-mono font-bold text-red-400">
                                  {pending > 0 ? `S/ ${pending.toFixed(2)}` : 'S/ 0.00'}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    f.status === 'al_dia' || pending === 0 
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : pending > 0 && Number(f.paidAmount) > 0
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {f.status === 'al_dia' || pending === 0 ? 'Al Día' : pending > 0 && Number(f.paidAmount) > 0 ? 'Parcial' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right space-x-2">
                                  <button
                                    onClick={() => handleDeleteMonthlyFee(f.id)}
                                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Eliminar cuota"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL FOR MONTHLY FEE CREATION */}
                {showFeeModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
                      <button 
                        onClick={() => setShowFeeModal(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="border-b border-zinc-800 pb-3">
                        <h3 className="text-lg font-black text-white">Registrar Cuota Mensual</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Control de cuota individual por deportista</p>
                      </div>

                      <form onSubmit={handleSaveMonthlyFee} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Deportista / Integrante</label>
                          <select 
                            value={feeForm.userId}
                            onChange={(e) => setFeeForm(prev => ({ ...prev, userId: e.target.value }))}
                            className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                            style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                            required
                          >
                            <option value="">Seleccionar atleta...</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Periodo (Mes)</label>
                            <input 
                              type="month"
                              value={feeForm.monthPeriod}
                              onChange={(e) => {
                                const val = e.target.value;
                                const [y, m] = val.split('-');
                                const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                                const name = format(d, "MMMM yyyy", { locale: es });
                                setFeeForm(prev => ({ 
                                  ...prev, 
                                  monthPeriod: val,
                                  monthName: name.charAt(0).toUpperCase() + name.slice(1)
                                }));
                              }}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs font-mono outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Monto de la Cuota (S/)</label>
                            <input 
                              type="number"
                              step="0.01"
                              value={feeForm.amount}
                              onChange={(e) => setFeeForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Monto Pagado (S/)</label>
                            <input 
                              type="number"
                              step="0.01"
                              value={feeForm.paidAmount}
                              onChange={(e) => setFeeForm(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs outline-none font-bold text-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Fecha Límite</label>
                            <input 
                              type="date"
                              value={feeForm.dueDate || ''}
                              onChange={(e) => setFeeForm(prev => ({ ...prev, dueDate: e.target.value }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowFeeModal(false)}
                            className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg"
                            style={{ backgroundColor: configPrimaryColor }}
                          >
                            Guardar Cuota
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: UNIFORMES (PEDIDOS Y CONFECCIÓN) */}
            {treasuryView === 'uniformes' && (
              <div className="space-y-6">
                
                {/* Control Bar */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base sm:text-lg font-black text-white">Control de Uniformes e Indumentaria</h3>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Configura uniformes completos o camisetas, tallas, dorsales y alias en espalda. Genera la hoja técnica en PDF por lote para enviar a confección.
                      </p>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadUniformBatchPDF(selectedUniformBatch)}
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Descargar PDF para Confección</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenNewUniformModal()}
                        className="inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: configPrimaryColor }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Pedido de Uniforme</span>
                      </button>
                    </div>
                  </div>

                  {/* Batch Selector Filter */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-400 font-semibold">Seleccionar Lote de Pedido:</span>
                    <select 
                      value={selectedUniformBatch}
                      onChange={(e) => setSelectedUniformBatch(e.target.value)}
                      className="bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white outline-none focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                    >
                      <option value="Todos los Lotes">Todos los Lotes</option>
                      {Array.from(new Set(uniformOrders.map(o => o.batchName))).filter(Boolean).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="Lote Apertura 2026">Lote Apertura 2026</option>
                      <option value="Lote Clausura 2026">Lote Clausura 2026</option>
                    </select>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="font-bold text-white text-sm sm:text-base">Lista de Pedidos ({selectedUniformBatch})</h3>
                    <span className="text-xs text-zinc-400 font-mono">
                      {selectedUniformBatch === 'Todos los Lotes' ? uniformOrders.length : uniformOrders.filter(o => o.batchName === selectedUniformBatch).length} prendas
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800 sticky top-0">
                        <tr>
                          <th className="px-5 py-3.5">Deportista</th>
                          <th className="px-5 py-3.5">Tipo Prenda</th>
                          <th className="px-5 py-3.5">Talla</th>
                          <th className="px-5 py-3.5">Dorsal</th>
                          <th className="px-5 py-3.5">Alias / Espalda</th>
                          <th className="px-5 py-3.5">Lote</th>
                          <th className="px-5 py-3.5">Estado Pago</th>
                          <th className="px-5 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-xs">
                        {(selectedUniformBatch === 'Todos los Lotes' ? uniformOrders : uniformOrders.filter(o => o.batchName === selectedUniformBatch)).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-zinc-500">
                              No hay pedidos de uniforme en este lote. Haz clic en "Nuevo Pedido de Uniforme" para registrar.
                            </td>
                          </tr>
                        ) : (
                          (selectedUniformBatch === 'Todos los Lotes' ? uniformOrders : uniformOrders.filter(o => o.batchName === selectedUniformBatch)).map(o => (
                            <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-white">
                                {o.userName}
                                <span className="text-[10px] text-zinc-500 block font-normal">{o.userCategory || 'General'}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                  o.itemType === 'completo' 
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}>
                                  {o.itemType === 'completo' ? 'Completo (Camiseta + Short)' : 'Sólo Camiseta'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-bold font-mono text-amber-400">{o.size}</td>
                              <td className="px-5 py-3.5 font-bold font-mono text-white text-sm">#{o.number || 'S/N'}</td>
                              <td className="px-5 py-3.5 font-mono text-zinc-200 font-bold uppercase tracking-wider">{o.nameOnBack || '-'}</td>
                              <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">{o.batchName}</td>
                              <td className="px-5 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUniformPaid(o)}
                                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full transition-transform hover:scale-105 ${
                                    o.isPaid 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  }`}
                                >
                                  {o.isPaid ? 'Pagado' : 'Pendiente'}
                                </button>
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-2">
                                <button
                                  onClick={() => handleEditUniformOrder(o)}
                                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                                  title="Editar pedido"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUniformOrder(o.id)}
                                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                  title="Eliminar pedido"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL FOR UNIFORM ORDER CREATION & EDITING */}
                {showUniformModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
                      <button 
                        onClick={() => setShowUniformModal(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="border-b border-zinc-800 pb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                          <Shirt className="w-3.5 h-3.5" /> Confección de Indumentaria
                        </div>
                        <h3 className="text-lg font-black text-white">
                          {editingUniformOrder ? 'Editar Pedido de Uniforme' : 'Nuevo Pedido de Uniforme'}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Personaliza tipo de prenda, dorsal, nombre en espalda y lote de envío al taller.
                        </p>
                      </div>

                      <form onSubmit={handleSaveUniformOrder} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Deportista / Titular</label>
                          <select 
                            value={uniformForm.userId}
                            onChange={(e) => {
                              const uId = e.target.value;
                              const selectedU = users.find(u => u.id === uId);
                              setUniformForm(prev => ({ 
                                ...prev, 
                                userId: uId,
                                userName: selectedU?.name || selectedU?.email || '',
                                number: selectedU?.jerseyNumber || prev.number || '',
                                nameOnBack: selectedU?.name ? selectedU.name.split(' ')[0].toUpperCase() : prev.nameOnBack
                              }));
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none"
                            style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                            required
                          >
                            <option value="">Seleccionar atleta...</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo de Uniforme</label>
                            <select 
                              value={uniformForm.itemType}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, itemType: e.target.value as any }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none"
                            >
                              <option value="completo">Completo (Camiseta + Short)</option>
                              <option value="solo_camiseta">Sólo Camiseta Oficial</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Talla</label>
                            <select 
                              value={uniformForm.size}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, size: e.target.value }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none font-bold"
                            >
                              <option value="12">Talla 12 (Niño)</option>
                              <option value="14">Talla 14 (Juvenil)</option>
                              <option value="16">Talla 16 (Juvenil)</option>
                              <option value="XS">XS</option>
                              <option value="S">S (Small)</option>
                              <option value="M">M (Medium)</option>
                              <option value="L">L (Large)</option>
                              <option value="XL">XL (Extra Large)</option>
                              <option value="XXL">XXL</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Número / Dorsal</label>
                            <input 
                              type="text" 
                              value={uniformForm.number || ''}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, number: e.target.value }))}
                              placeholder="Ej. 10"
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none font-bold text-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Alias en Espalda (Estampado)</label>
                            <input 
                              type="text" 
                              value={uniformForm.nameOnBack || ''}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, nameOnBack: e.target.value.toUpperCase() }))}
                              placeholder="Ej. MENDOZA"
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none uppercase font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Lote de Pedido</label>
                            <input 
                              type="text" 
                              value={uniformForm.batchName || ''}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, batchName: e.target.value }))}
                              placeholder="Ej. Lote Apertura 2026"
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">Precio (S/)</label>
                            <input 
                              type="number" 
                              value={uniformForm.price}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                              className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-xs outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={uniformForm.isPaid}
                              onChange={(e) => setUniformForm(prev => ({ ...prev, isPaid: e.target.checked }))}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-black border-zinc-700"
                            />
                            <span className="text-xs font-bold text-white">¿Uniforme Cancelado / Pagado?</span>
                          </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowUniformModal(false)}
                            className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg"
                            style={{ backgroundColor: configPrimaryColor }}
                          >
                            {editingUniformOrder ? 'Actualizar Pedido' : 'Guardar Pedido'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* TAB 5: SETTINGS & BRANDING CUSTOMIZER */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-8 animate-fade-in">
            
            {/* SECTION 1: VISUAL IDENTITY & THEME */}
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Identidad Visual, Logo y Colores Inteligentes</h3>
                </div>
                <button
                  type="button"
                  onClick={handleManualColorExtract}
                  disabled={isExtractingColors || !configLogoUrl}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isExtractingColors ? 'Extrayendo...' : 'Re-extraer Paleta del Logo'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Logo Uploader */}
                <div className="flex flex-col items-center justify-center p-5 bg-black rounded-2xl border border-zinc-800 text-center space-y-3">
                  <div 
                    className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 flex items-center justify-center overflow-hidden p-2 relative shadow-inner"
                    style={{ borderColor: configPrimaryColor }}
                  >
                    {configLogoUrl ? (
                      <img src={configLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-white font-black text-2xl" style={{ color: configPrimaryColor }}>
                        {configAppName ? configAppName.charAt(0) : 'V'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow">
                      <span>{configLogoUrl ? 'Cambiar Logo' : 'Subir Logo Oficial'}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {configLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setConfigLogoUrl('')}
                        className="text-xs text-red-400 hover:text-red-300 bg-zinc-900 border border-zinc-800 px-2.5 py-2 rounded-xl"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">Seleccionar desde tu carpeta (PNG, JPG, SVG)</span>
                </div>

                {/* Primary & Accent Color Pickers */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Color Principal (Club)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={configPrimaryColor} 
                          onChange={e => setConfigPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input 
                          type="text" 
                          value={configPrimaryColor} 
                          onChange={e => setConfigPrimaryColor(e.target.value)}
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Color Secundario / Acento</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={configAccentColor} 
                          onChange={e => setConfigAccentColor(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                        <input 
                          type="text" 
                          value={configAccentColor} 
                          onChange={e => setConfigAccentColor(e.target.value)}
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extracted Palette Suggestions */}
                  {extractedPalette.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1.5">Colores detectados en tu logo:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {extractedPalette.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setConfigPrimaryColor(col)}
                            className="w-7 h-7 rounded-lg shadow-md border border-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: col }}
                            title={`Usar ${col} como color principal`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Theme Mode Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Modo de Apariencia</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConfigThemeMode('dark')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          configThemeMode === 'dark'
                            ? 'bg-zinc-800 text-white border-white/40 shadow-lg'
                            : 'bg-black text-zinc-500 border-zinc-800'
                        }`}
                      >
                        🌙 Oscuro Deportivo (Dark)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfigThemeMode('light')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          configThemeMode === 'light'
                            ? 'bg-zinc-800 text-white border-white/40 shadow-lg'
                            : 'bg-black text-zinc-500 border-zinc-800'
                        }`}
                      >
                        ☀️ Claro Deportivo (Light)
                      </button>
                    </div>
                  </div>

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

                {/* Hero Background Image Uploader */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Foto de Fondo del Banner (Desde Carpeta)</label>
                  {configHeroBgUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black p-2 flex items-center gap-3">
                      <img src={configHeroBgUrl} alt="Fondo Banner" className="w-16 h-12 object-cover rounded-lg border border-zinc-800" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Fondo Personalizado</p>
                        <span className="text-[10px] text-emerald-400 font-semibold">✓ Imagen cargada</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors">
                          Cambiar
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleHeroBgUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setConfigHeroBgUrl('')}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 w-full p-3 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 transition-all flex items-center justify-center gap-2 text-xs font-bold">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span>Elegir Fondo desde Carpeta</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleHeroBgUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Main Team Official Photo Uploader */}
                <div className="md:col-span-2 bg-black/60 rounded-2xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-white">Foto Oficial del Equipo Principal (Portada Inicio)</label>
                      <p className="text-[11px] text-zinc-400">Esta fotografía grupal se lucirá en el centro del inicio junto al logo del club.</p>
                    </div>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{ 
                        backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.15)`,
                        borderColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.3)`,
                        color: configPrimaryColor
                      }}
                    >
                      Plantel Principal
                    </span>
                  </div>

                  {configMainTeamImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 p-2.5 flex flex-col sm:flex-row items-center gap-4">
                      <img 
                        src={configMainTeamImageUrl} 
                        alt="Foto Oficial Equipo" 
                        className="w-full sm:w-48 h-28 object-cover rounded-lg border border-zinc-800 shadow-md" 
                      />
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-sm font-bold text-white">Foto Oficial del Equipo Principal Cargada</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Se exhibe como imagen de portada estelar en la pantalla de inicio.</p>
                        <span className="inline-block mt-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✓ Lista para la afición y miembros
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow">
                          Cambiar Foto
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleMainTeamImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setConfigMainTeamImageUrl('')}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 text-zinc-300 w-full p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.15)` }}
                      >
                        <Upload className="w-6 h-6" style={{ color: configPrimaryColor }} />
                      </div>
                      <span className="text-xs font-bold text-white">Haz clic aquí para seleccionar la foto oficial del equipo desde tu carpeta</span>
                      <span className="text-[11px] text-zinc-500">Formato horizontal recomendado (PNG, JPG, WEBP)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleMainTeamImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
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
                    <span className="text-xs text-zinc-400">Calcula automáticamente el total de atletas ({registeredAthletesCount} atletas registrados, excluyendo al usuario Adm) en la pantalla principal.</span>
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
                    placeholder="Av. Principal 123, Complejo Deportivo"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: PLATAFORMA PRIVADA VISIBILITY */}
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Acceso a Plataforma Privada</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!configHidePrivatePlatform} 
                    onChange={e => setConfigHidePrivatePlatform(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <p className="text-xs text-zinc-400">
                Muestra u oculta los botones y secciones de "Plataforma Privada" y "Acceso a Miembros" en la página pública principal.
              </p>
            </div>

            {/* SECTION 7: MISIÓN Y VISIÓN INSTITUCIONAL */}
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Misión y Visión Institucional</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={configShowMissionVision} 
                    onChange={e => setConfigShowMissionVision(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <p className="text-xs text-zinc-400">
                Configura los pilares del club. Si desactivas el interruptor, la sección no se mostrará en la página pública. Solo el Administrador puede modificar estos textos.
              </p>

              {configShowMissionVision && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
                    <label className="block text-xs font-semibold text-zinc-400">Título de la Misión</label>
                    <input 
                      type="text" 
                      value={configMissionTitle}
                      onChange={e => setConfigMissionTitle(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Nuestra Misión"
                    />
                    <label className="block text-xs font-semibold text-zinc-400">Texto de la Misión</label>
                    <textarea 
                      rows={4}
                      value={configMissionText}
                      onChange={e => setConfigMissionText(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm focus:ring-2 outline-none resize-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Describe la misión formativa y deportiva..."
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
                    <label className="block text-xs font-semibold text-zinc-400">Título de la Visión</label>
                    <input 
                      type="text" 
                      value={configVisionTitle}
                      onChange={e => setConfigVisionTitle(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Nuestra Visión"
                    />
                    <label className="block text-xs font-semibold text-zinc-400">Texto de la Visión</label>
                    <textarea 
                      rows={4}
                      value={configVisionText}
                      onChange={e => setConfigVisionText(e.target.value)}
                      className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm focus:ring-2 outline-none resize-none"
                      style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                      placeholder="Describe la visión futura del club..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: PLANES DE MEMBRESÍA Y PAGOS */}
            <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" style={{ color: configPrimaryColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Tarifas de Membresías y Acceso a la Plataforma</h3>
                </div>
                <span className="text-xs text-emerald-400 font-bold">1, 3 y 12 Meses</span>
              </div>

              <p className="text-xs text-zinc-400">
                Define el costo en Soles (S/) de las membresías por tiempo limitado que los socios y jugadores abonarán para acceder al contenido privado del club (entrenamientos, pizarra táctica, videos).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Plan 1 Mes (S/)</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={configPlan1MonthPrice}
                    onChange={e => setConfigPlan1MonthPrice(Number(e.target.value))}
                    className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm font-mono font-bold focus:ring-2 outline-none"
                    style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                  />
                  <span className="text-[11px] text-zinc-500">Acceso durante 30 días calendario</span>
                </div>

                <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Plan 3 Meses / Trimestre (S/)</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={configPlan3MonthsPrice}
                    onChange={e => setConfigPlan3MonthsPrice(Number(e.target.value))}
                    className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm font-mono font-bold focus:ring-2 outline-none"
                    style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                  />
                  <span className="text-[11px] text-zinc-500">Acceso durante 90 días calendario</span>
                </div>

                <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Plan Anual / 12 Meses (S/)</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={configPlan12MonthsPrice}
                    onChange={e => setConfigPlan12MonthsPrice(Number(e.target.value))}
                    className="w-full rounded-xl border-zinc-800 border bg-zinc-900 text-white px-3.5 py-2 text-sm font-mono font-bold focus:ring-2 outline-none"
                    style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                  />
                  <span className="text-[11px] text-zinc-500">Acceso total durante 365 días</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Instrucciones de Pago / Números de Cuenta / Billeteras Digitales</label>
                <input 
                  type="text" 
                  value={configMembershipPaymentInfo}
                  onChange={e => setConfigMembershipPaymentInfo(e.target.value)}
                  className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-sm focus:ring-2 outline-none"
                  style={{ ['--tw-ring-color' as any]: configPrimaryColor }}
                  placeholder="Ej. Yape / Plin al 987 654 321 o Transferencia BCP Cta. 191-12345678-0-12"
                />
                <p className="text-[11px] text-zinc-500 mt-1">Este texto aparecerá en la sección de plataforma privada para orientar a los socios.</p>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl border border-zinc-800 shadow-2xl z-30">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px]"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Previsualizar Cambios en Vivo</span>
              </button>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto text-white font-bold py-3 px-8 rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-60 text-xs sm:text-sm uppercase tracking-wider min-h-[44px]"
                style={{
                  backgroundColor: configPrimaryColor,
                  boxShadow: `0 8px 25px -4px rgba(${primaryRgbObj.r}, ${primaryRgbObj.g}, ${primaryRgbObj.b}, 0.5)`
                }}
              >
                {isSavingSettings ? 'Guardando...' : 'Guardar y Publicar Ajustes'}
              </button>
            </div>

          </form>
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
