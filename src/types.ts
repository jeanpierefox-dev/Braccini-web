export type UserRole = 'admin' | 'member' | 'guest';
export type MediaType = 'training' | 'player' | 'general';
export type ThemeMode = 'dark' | 'midnight' | 'club-contrast' | 'slate';

export interface ClubSettings {
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
  clubRole?: 'entrenador' | 'jugador' | 'director' | 'otro';
  
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
  createdBy: string;
  createdAt: any;
}
