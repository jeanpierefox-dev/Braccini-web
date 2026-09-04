export type UserRole = 'admin' | 'member' | 'guest';
export type MediaType = 'training' | 'player' | 'general' | 'entrenos' | 'partidos' | 'paseos';
export type MediaCategory = 'entrenos' | 'partidos' | 'paseos' | 'institucional' | 'general';
export type ThemeMode = 'dark' | 'midnight' | 'club-contrast' | 'slate';

export interface ClubSettings {
  pageViews?: number;
  appName: string;
  slogan?: string;
  description?: string;
  logoUrl: string;
  primaryColor?: string;
  primaryRgb?: string;
  accentColor?: string;
  accentRgb?: string;
  themeMode?: ThemeMode;
  
  // Hero / Banner settings
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgUrl?: string;
  mainTeamImageUrl?: string; // Foto oficial del equipo principal
  ctaButtonText?: string;
  
  // Misión y Visión Institucional (Editable y Eliminable solo por Admin)
  showMissionVision?: boolean;
  hidePrivatePlatform?: boolean;
  missionTitle?: string;
  missionText?: string;
  visionTitle?: string;
  visionText?: string;
  valuesTitle?: string;
  valuesList?: string[];
  
  // Precios de Planes y Membresías por tiempo limitado (1, 3 y 12 meses)
  plan1MonthPrice?: number;
  plan3MonthsPrice?: number;
  plan12MonthsPrice?: number;
  membershipPaymentInfo?: string;
  
  // Announcement bar
  showAnnouncement?: boolean;
  announcementText?: string;
  
  // Feature Cards Content
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
  
  // Public Stats
  statsChampionships?: string; // Torneos participados / Campeonatos
  statsAthletes?: string; // Conteo atletas
  statsCategories?: string; // Categorías formativas
  statsFoundedYear?: string; // Año de fundación modificable
  statsAutoCountPlayers?: boolean; // Conteo en tiempo real de jugadores registrados
  
  // Contact & Social Networks
  contactPhone?: string;
  contactEmail?: string;
  contactLocation?: string;
  contactWhatsApp?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTikTok?: string;
  
  autoColorExtracted?: boolean;
  hiddenDefaultPublications?: string[];
  playerCategories?: string[];
}

export interface ClubComment {
  id?: string;
  authorName: string;
  authorRole: 'atleta' | 'publico' | 'entrenador' | 'admin';
  message: string;
  rating?: number;
  userId?: string;
  createdAt: any;
  adminReply?: string;
  adminRepliedAt?: any;
  adminRepliedBy?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name: string;
  photoURL: string;
  role: UserRole;
  clubRole?: 'entrenador' | 'jugador' | 'director' | 'otro' | 'administrador';
  
  // Control de Acceso por Tiempo Limitado (1, 3, 12 meses)
  membershipStatus?: 'active' | 'expired' | 'none';
  membershipPlan?: '1_month' | '3_months' | '12_months' | 'custom' | 'unlimited';
  membershipStartDate?: string;
  membershipEndDate?: string;
  membershipFeePaid?: number;
  membershipDurationMonths?: number;
  hasAccessToPrivatePlatform?: boolean;

  // Ficha General como Director / Presidente del Club (Solo Admin)
  executiveRole?: string; // ej. Presidente del Club, Director Deportivo, Gerente General
  institutionalBio?: string; // Mensaje / Visión de la Dirección
  tenurePeriod?: string; // ej. Gestión 2024 - 2028
  officePhone?: string;
  officeEmail?: string;
  officeLocation?: string;

  // Ficha Deportiva y Corporativa (Solo Jugadores y Entrenadores)
  dni?: string;
  category?: string;
  height?: string;
  weight?: string;
  dominantHand?: string;
  jumpReach?: string;
  joinedYear?: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  bloodType?: string;
  jerseyNumber?: string;
  position?: string;

  // Apoderado / Tutor Legal (para menores de edad)
  isMinor?: boolean;
  isUnderAge?: boolean;
  guardianName?: string;
  guardianDni?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  playerSignature?: string;
  guardianSignature?: string;
  
  // Exoneración / Beca de Cuotas Mensuales
  isFeeExempt?: boolean;
  feeExemptReason?: string;

  createdAt?: any;
}

export interface UniformOrder {
  id?: string;
  userId: string;
  userName: string;
  userCategory?: string;
  itemType?: string;
  type?: 'completo' | 'camiseta'; // Completo (Camiseta + Short) o Sólo Camiseta
  size: string; // Tallas: 12, 14, 16, S, M, L, XL, XXL
  number?: string;
  jerseyNumber?: string; // Número
  alias?: string; // Nombre / Alias en espalda
  nameOnBack?: string;
  batchName: string; // Nombre de lote para confección (ej. "Lote Marzo 2026")
  price?: number;
  isPaid?: boolean;
  paymentStatus?: 'pagado' | 'pendiente';
  status?: string;
  orderStatus?: 'pendiente' | 'confeccion' | 'entregado';
  notes?: string;
  createdAt?: any;
}

export interface MonthlyFeeRecord {
  id?: string;
  userId: string;
  userName: string;
  category?: string;
  userCategory?: string;
  month?: string; // Enero, Febrero, Marzo, etc.
  year?: number;
  monthPeriod?: string; // ej. 2026-03
  monthName?: string; // ej. Marzo 2026
  amount: number;
  paidAmount?: number;
  dueDate?: string;
  status: 'paid' | 'pending' | 'al_dia' | 'pendiente' | 'parcial' | 'exonerado';
  paidAt?: any;
  paymentMethod?: string; // Efectivo, Yape/Plin, Transferencia, Tarjeta
  receiptNumber?: string;
  notes?: string;
  createdAt: any;
}

export interface Payment {
  id?: string;
  userId: string;
  userName: string;
  concept: string;
  period?: string;
  amount: number;
  status: 'paid' | 'pending';
  createdBy: string;
  createdAt: any;
}

export interface MediaItem {
  id?: string;
  title: string;
  description: string;
  url: string;
  type: MediaType;
  category?: MediaCategory;
  tag?: string;
  createdBy?: string;
  likesCount?: number;
  createdAt: any;
}

export interface PublicationComment {
  id?: string;
  mediaId: string;
  authorName: string;
  authorRole: 'admin' | 'atleta' | 'entrenador' | 'socio' | 'publico';
  userId?: string;
  userPhoto?: string;
  message: string;
  createdAt: any;
  likes?: number;
  adminReply?: string;
  adminRepliedAt?: any;
}

export interface DirectInquiryMessage {
  id?: string;
  inquiryId?: string;
  senderName: string;
  senderRole: 'visitante' | 'atleta' | 'socio' | 'admin';
  senderId?: string;
  senderEmail?: string;
  senderPhone?: string;
  message: string;
  category?: 'inscripciones' | 'horarios' | 'pagos' | 'general' | 'entrenamientos';
  status?: 'abierto' | 'respondido' | 'cerrado';
  createdAt: any;
  replyTo?: string;
}
