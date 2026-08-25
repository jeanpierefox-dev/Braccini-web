import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { UserProfile } from '../types';
import { 
  User, 
  Phone, 
  Calendar, 
  HeartPulse, 
  Activity, 
  AlertCircle, 
  Hash, 
  Target, 
  Camera, 
  Check, 
  Printer, 
  IdCard, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Ruler,
  Weight,
  Layers,
  FileBadge
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Profile() {
  const { user } = useAuth();
  const settings = useSettings();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'card'>('form');

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // initialize with available auth data
          setProfile({
            name: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            clubRole: 'jugador',
          });
        }
      } catch (e) {
        console.error("Error loading profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setProfile(prev => ({ ...prev, photoURL: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const docRef = doc(db, 'users', user.uid);
      const updateData = {
        name: profile.name || user.displayName || '',
        dni: profile.dni || '',
        category: profile.category || '',
        height: profile.height || '',
        weight: profile.weight || '',
        dominantHand: profile.dominantHand || '',
        jumpReach: profile.jumpReach || '',
        joinedYear: profile.joinedYear || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        medicalInfo: profile.medicalInfo || '',
        bloodType: profile.bloodType || '',
        jerseyNumber: profile.jerseyNumber || '',
        position: profile.position || '',
        clubRole: profile.clubRole || 'jugador',
        photoURL: profile.photoURL || ''
      };

      await updateDoc(docRef, updateData);
      
      if (auth.currentUser && profile.photoURL) {
        try {
          await updateProfile(auth.currentUser, {
            photoURL: profile.photoURL,
            displayName: profile.name
          });
        } catch (e) {
          console.warn("Could not update auth profile", e);
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      
      if (user.uid === 'mock-admin-123') {
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
          const mockAdmin = JSON.parse(mockUserStr);
          mockAdmin.photoURL = profile.photoURL;
          mockAdmin.name = profile.name;
          localStorage.setItem('mockUser', JSON.stringify(mockAdmin));
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar la ficha deportiva.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${primaryColor} transparent` }} />
          <span className="text-sm font-mono text-zinc-400">Cargando ficha deportiva...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Control Bar with View Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{settings.appName || 'CLUB DE VOLEIBOL'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {profile.name || user?.displayName || 'Mi Ficha de Jugador'}
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'form' 
                  ? 'text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
              }`}
              style={viewMode === 'form' ? {
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.35)`
              } : {}}
            >
              <FileBadge className="w-4 h-4" />
              <span>Editar Datos</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'card' 
                  ? 'text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
              }`}
              style={viewMode === 'card' ? {
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.35)`
              } : {}}
            >
              <IdCard className="w-4 h-4" />
              <span>Ficha Oficial</span>
            </button>
          </div>
        </div>

        {/* Saved Notification */}
        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
            <Check className="w-5 h-5 shrink-0" />
            <span className="font-semibold">¡Ficha deportiva actualizada exitosamente! Los cambios ya se reflejan en tu carnet corporativo.</span>
          </div>
        )}

        {/* MODE 1: DATA EDITING FORM */}
        {viewMode === 'form' && (
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Header & Photo Upload */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative group cursor-pointer shrink-0">
                <label className="cursor-pointer block">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div 
                    className="w-32 h-32 bg-zinc-950 border-2 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-2xl transition-transform group-hover:scale-105"
                    style={{ borderColor: primaryColor }}
                  >
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt="Foto deportiva" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-zinc-600" />
                    )}
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Subir Foto</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo del Integrante</label>
                  <input 
                    type="text" 
                    name="name"
                    value={profile.name || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-base font-bold focus:ring-2 outline-none"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">DNI / Documento de Identidad</label>
                    <input 
                      type="text" 
                      name="dni"
                      value={profile.dni || ''}
                      onChange={handleChange}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: primaryColor }}
                      placeholder="Ej. 74839201"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Rol en el Club</label>
                    <select
                      name="clubRole"
                      value={profile.clubRole || 'jugador'}
                      onChange={handleChange}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2 text-sm focus:ring-2 outline-none"
                      style={{ ['--tw-ring-color' as any]: primaryColor }}
                    >
                      <option value="jugador">Jugador / Atleta</option>
                      <option value="entrenador">Entrenador / Staff Técnico</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Athletic & Sports Details */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Ficha Técnica Deportiva</h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Datos de Rendimiento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-zinc-500" /> Posición en Cancha
                  </label>
                  <select 
                    name="position"
                    value={profile.position || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  >
                    <option value="">Seleccionar posición...</option>
                    <option value="Armador">Armador / Armadora</option>
                    <option value="Opuesto">Opuesto / Opuesta</option>
                    <option value="Punta Receptor">Punta / Receptor</option>
                    <option value="Central">Central / Bloqueador</option>
                    <option value="Libero">Líbero</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-zinc-500" /> Número de Camiseta
                  </label>
                  <input 
                    type="text" 
                    name="jerseyNumber"
                    value={profile.jerseyNumber || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. 10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-zinc-500" /> Categoría Formativa
                  </label>
                  <select
                    name="category"
                    value={profile.category || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  >
                    <option value="">Seleccionar categoría...</option>
                    <option value="Sub-12 (Semillero)">Sub-12 (Semillero)</option>
                    <option value="Sub-14 (Infantil)">Sub-14 (Infantil)</option>
                    <option value="Sub-17 (Menores)">Sub-17 (Menores)</option>
                    <option value="Juvenil (Sub-19)">Juvenil (Sub-19)</option>
                    <option value="Mayores / Superior">Mayores / Superior</option>
                    <option value="Libre / Competitivo">Libre / Competitivo</option>
                    <option value="Master (+35)">Master (+35)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-zinc-500" /> Estatura (cm / m)
                  </label>
                  <input 
                    type="text" 
                    name="height"
                    value={profile.height || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. 182 cm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Weight className="w-4 h-4 text-zinc-500" /> Peso Corporal
                  </label>
                  <input 
                    type="text" 
                    name="weight"
                    value={profile.weight || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. 74 kg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-zinc-500" /> Mano Dominante
                  </label>
                  <select
                    name="dominantHand"
                    value={profile.dominantHand || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Diestro / Derecha">Diestro / Derecha</option>
                    <option value="Zurdo / Izquierda">Zurdo / Izquierda</option>
                    <option value="Ambidiestro">Ambidiestro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-zinc-500" /> Alcance Salto/Ataque
                  </label>
                  <input 
                    type="text" 
                    name="jumpReach"
                    value={profile.jumpReach || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. 295 cm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-500" /> Año de Ingreso al Club
                  </label>
                  <input 
                    type="text" 
                    name="joinedYear"
                    value={profile.joinedYear || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. 2024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-500" /> Fecha de Nacimiento
                  </label>
                  <input 
                    type="date" 
                    name="dateOfBirth"
                    value={profile.dateOfBirth || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-3.5 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact, Medical & Emergency */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-white text-base sm:text-lg">Información Médica y Contactos de Emergencia</h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Seguridad y Protocolo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-zinc-500" /> Teléfono Personal / WhatsApp
                  </label>
                  <input 
                    type="text" 
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. +51 987 654 321"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-zinc-500" /> Grupo Sanguíneo
                  </label>
                  <select 
                    name="bloodType"
                    value={profile.bloodType || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  >
                    <option value="">Seleccionar grupo...</option>
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-zinc-500" /> Nombre de Contacto de Emergencia
                  </label>
                  <input 
                    type="text" 
                    name="emergencyContact"
                    value={profile.emergencyContact || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. María Mendoza (Madre)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-zinc-500" /> Teléfono de Emergencia
                  </label>
                  <input 
                    type="text" 
                    name="emergencyPhone"
                    value={profile.emergencyPhone || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Ej. +51 912 345 678"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-zinc-500" /> Alergias, Medicación o Condiciones Físicas
                  </label>
                  <textarea 
                    rows={2}
                    name="medicalInfo"
                    value={profile.medicalInfo || ''}
                    onChange={handleChange}
                    className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                    placeholder="Indique si padece asma, alergias a antiinflamatorios, cirugías recientes, etc."
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button 
                type="button"
                onClick={() => setViewMode('card')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[48px]"
              >
                <IdCard className="w-4 h-4" />
                <span>Generar Carnet Deportivo Oficial</span>
              </button>

              <button 
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto text-white font-bold py-3.5 px-8 rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-60 text-xs sm:text-sm uppercase tracking-wider min-h-[48px]"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 8px 25px -4px rgba(${primaryRgb}, 0.5)`
                }}
              >
                {saving ? 'Guardando Ficha...' : 'Guardar y Actualizar Ficha'}
              </button>
            </div>

          </form>
        )}

        {/* MODE 2: ATHLETIC CORPORATE ID CARD & CERTIFICATE */}
        {viewMode === 'card' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Action buttons on top of card */}
            <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800"
              >
                ← Volver a Editar Datos
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Descargar Ficha Formal</span>
                </button>
              </div>
            </div>

            {/* Official Card Container (Print ready) */}
            <div className="max-w-2xl mx-auto bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-3xl border-2 border-zinc-700/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden print:border-zinc-300 print:bg-white print:text-zinc-900 print:shadow-none print:max-w-full">
              
              {/* Background ambient watermarks */}
              <div 
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none print:hidden"
                style={{ backgroundColor: primaryColor }}
              />
              <div 
                className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none print:hidden"
                style={{ backgroundColor: accentColor }}
              />

              {/* CARD TOP BRANDING HEADER */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-5 mb-6 relative z-10 print:border-zinc-300">
                <div className="flex items-center gap-3">
                  {settings.logoUrl ? (
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo Club" 
                      className="w-14 h-14 object-contain rounded-xl bg-zinc-900/80 p-1 border border-zinc-700" 
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {settings.appName.charAt(0) || 'V'}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block print:text-zinc-600">
                      FICHA OFICIAL DEPORTIVA Y CORPORATIVA
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight print:text-zinc-900">
                      {settings.appName || 'CLUB DE VOLEIBOL'}
                    </h2>
                    <p className="text-[11px] text-zinc-400 print:text-zinc-500 font-medium">
                      {settings.slogan || 'Pasión, Disciplina y Excelencia Deportiva'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div 
                    className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white mb-1 shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {profile.clubRole || 'JUGADOR'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono print:text-zinc-500">
                    ID: {user?.uid.slice(0, 8).toUpperCase() || 'VT-2026'}
                  </div>
                </div>
              </div>

              {/* ATHLETE BODY PROFILE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 relative z-10">
                
                {/* Photo & Jersey Emblem */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div 
                    className="w-36 h-44 rounded-2xl overflow-hidden border-2 bg-zinc-900 shadow-xl relative flex items-center justify-center print:border-zinc-400"
                    style={{ borderColor: primaryColor }}
                  >
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt="Foto Atleta" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-zinc-600" />
                    )}

                    {profile.jerseyNumber && (
                      <div 
                        className="absolute bottom-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg border border-white/30"
                        style={{ backgroundColor: accentColor }}
                      >
                        #{profile.jerseyNumber}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span 
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border"
                      style={{ 
                        backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                        borderColor: `rgba(${primaryRgb}, 0.4)`,
                        color: primaryColor
                      }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Ficha Verificada
                    </span>
                  </div>
                </div>

                {/* Athlete Corporate Specs */}
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 print:text-zinc-600">Nombre del Deportista</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight print:text-zinc-900">
                      {profile.name || user?.displayName || 'Nombre no especificado'}
                    </h3>
                    {profile.dni && (
                      <span className="text-xs text-zinc-400 font-mono block mt-0.5 print:text-zinc-600">DNI / DOC: {profile.dni}</span>
                    )}
                  </div>

                  {/* 2x2 Grid of Key Stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 print:border-zinc-300 print:bg-zinc-100">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Posición</span>
                      <span className="text-xs font-bold text-white print:text-zinc-900">{profile.position || 'Por definir'}</span>
                    </div>

                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 print:border-zinc-300 print:bg-zinc-100">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Categoría</span>
                      <span className="text-xs font-bold text-white print:text-zinc-900">{profile.category || 'General'}</span>
                    </div>

                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 print:border-zinc-300 print:bg-zinc-100">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Estatura / Peso</span>
                      <span className="text-xs font-bold text-white print:text-zinc-900">
                        {profile.height || '-'} / {profile.weight || '-'}
                      </span>
                    </div>

                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 print:border-zinc-300 print:bg-zinc-100">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Grupo Sanguíneo</span>
                      <span className="text-xs font-bold text-amber-400 print:text-zinc-900">{profile.bloodType || 'No registrado'}</span>
                    </div>
                  </div>

                  {/* Secondary Details */}
                  <div className="text-xs text-zinc-400 space-y-1 pt-1 print:text-zinc-700">
                    <div className="flex justify-between border-b border-zinc-800/80 pb-1 print:border-zinc-300">
                      <span>Mano dominante:</span>
                      <span className="font-semibold text-white print:text-zinc-900">{profile.dominantHand || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/80 pb-1 print:border-zinc-300">
                      <span>Alcance de salto:</span>
                      <span className="font-semibold text-white print:text-zinc-900">{profile.jumpReach || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/80 pb-1 print:border-zinc-300">
                      <span>Contacto de Emergencia:</span>
                      <span className="font-semibold text-white print:text-zinc-900">
                        {profile.emergencyContact || '-'} {profile.emergencyPhone ? `(${profile.emergencyPhone})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* CARD FOOTER WITH SIGNATURE & AUTHENTICITY STAMP */}
              <div className="border-t-2 border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 relative z-10 print:border-zinc-300 print:text-zinc-600">
                <div>
                  <span className="text-[10px] font-mono block">
                    Fecha de Emisión: {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  <span className="text-[9px] text-zinc-500">Documento deportivo expedido para registro y competencias oficiales.</span>
                </div>

                <div className="text-center sm:text-right border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                  <div className="w-36 border-t-2 border-zinc-600 mx-auto sm:ml-auto pt-1 font-bold text-[10px] uppercase text-zinc-300 print:text-zinc-700">
                    Dirección Técnica
                  </div>
                  <span className="text-[9px] text-zinc-500">Sello de Conformidad</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
