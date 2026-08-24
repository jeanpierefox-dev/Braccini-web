export type UserRole = 'admin' | 'member' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoURL: string;
  role: UserRole;
  clubRole?: 'entrenador' | 'jugador' | 'otro';
  
  // Ficha General
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
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
