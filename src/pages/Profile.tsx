import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { UserProfile } from '../types';
import { generatePlayerRegistrationPDF } from '../utils/pdfGenerators';
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
  IdCard, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Ruler,
  Weight,
  Layers,
  Building2,
  Briefcase,
  Quote,
  Shield,
  FileDown,
  PenTool,
  X
} from 'lucide-react';

export function Profile() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'card'>('card');
  
  // Modal for PDF Download with Signatures
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianDni, setGuardianDni] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Padre / Madre / Tutor Legal');
  const [playerSignName, setPlayerSignName] = useState('');
  const [guardianSignName, setGuardianSignName] = useState('');

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  // Check if current user is Admin (Executive Director)
  const isAdmin = role === 'admin' || profile.role === 'admin' || user?.email === 'admin@club.com' || user?.uid === 'mock-admin-123';

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          if (data.guardianName) setGuardianName(data.guardianName);
          if (data.guardianDni) setGuardianDni(data.guardianDni);
          if (data.guardianPhone) setGuardianPhone(data.guardianPhone);
          if (data.guardianRelationship) setGuardianRelationship(data.guardianRelationship);
          if (data.isMinor !== undefined) setIsMinor(data.isMinor);
          setPlayerSignName(data.name || user.displayName || '');
          setGuardianSignName(data.guardianName || '');
        } else {
          // initialize with available auth data
          const initialData: Partial<UserProfile> = {
            name: user.displayName || (isAdmin ? 'Director General del Club' : ''),
            email: user.email || '',
            photoURL: user.photoURL || '',
            clubRole: isAdmin ? 'director' : 'jugador',
            executiveRole: isAdmin ? 'Presidente / Director del Club' : undefined,
            tenurePeriod: isAdmin ? 'Gestión 2024 - 2028' : undefined,
          };
          setProfile(initialData);
          setPlayerSignName(user.displayName || '');
        }
      } catch (e) {
        console.error("Error loading profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, isAdmin]);

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
      
      let updateData: Record<string, any> = {
        name: profile.name || user.displayName || (isAdmin ? 'Director General' : ''),
        photoURL: profile.photoURL || '',
        dni: profile.dni || '',
        phone: profile.phone || '',
      };

      if (isAdmin) {
        // Executive Director fields
        updateData = {
          ...updateData,
          role: 'admin',
          clubRole: 'director',
          executiveRole: profile.executiveRole || 'Presidente / Director del Club',
          institutionalBio: profile.institutionalBio || '',
          tenurePeriod: profile.tenurePeriod || 'Gestión 2024 - 2028',
          officePhone: profile.officePhone || profile.phone || '',
          officeEmail: profile.officeEmail || profile.email || '',
          officeLocation: profile.officeLocation || '',
        };
      } else {
        // Athletic Player / Coach fields
        updateData = {
          ...updateData,
          category: profile.category || '',
          height: profile.height || '',
          weight: profile.weight || '',
          dominantHand: profile.dominantHand || '',
          jumpReach: profile.jumpReach || '',
          joinedYear: profile.joinedYear || '',
          dateOfBirth: profile.dateOfBirth || '',
          emergencyContact: profile.emergencyContact || '',
          emergencyPhone: profile.emergencyPhone || '',
          medicalInfo: profile.medicalInfo || '',
          bloodType: profile.bloodType || '',
          jerseyNumber: profile.jerseyNumber || '',
          position: profile.position || '',
          clubRole: profile.clubRole || 'jugador',
          isMinor: isMinor,
          guardianName: guardianName || profile.guardianName || '',
          guardianDni: guardianDni || profile.guardianDni || '',
          guardianPhone: guardianPhone || profile.guardianPhone || '',
          guardianRelationship: guardianRelationship || profile.guardianRelationship || '',
        };
      }

      await setDoc(docRef, updateData, { merge: true });
      
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
      alert('Error al guardar la ficha.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // Merge latest inputs
    const completeProfile: UserProfile = {
      id: user?.uid || 'ATH-01',
      name: profile.name || user?.displayName || 'Deportista',
      email: profile.email || user?.email || '',
      role: (profile.role as any) || 'member',
      clubRole: (profile.clubRole as any) || 'jugador',
      photoURL: profile.photoURL || '',
      dni: profile.dni || '',
      phone: profile.phone || '',
      jerseyNumber: profile.jerseyNumber || '',
      position: profile.position || '',
      category: profile.category || '',
      dateOfBirth: profile.dateOfBirth || '',
      joinedYear: profile.joinedYear || '',
      height: profile.height || '',
      weight: profile.weight || '',
      dominantHand: profile.dominantHand || '',
      jumpReach: profile.jumpReach || '',
      bloodType: profile.bloodType || '',
      emergencyContact: profile.emergencyContact || '',
      emergencyPhone: profile.emergencyPhone || '',
      medicalInfo: profile.medicalInfo || '',
      isMinor: isMinor,
      guardianName: guardianName || profile.guardianName || '',
      guardianDni: guardianDni || profile.guardianDni || '',
      guardianPhone: guardianPhone || profile.guardianPhone || '',
      guardianRelationship: guardianRelationship || profile.guardianRelationship || '',
      playerSignature: playerSignName,
      guardianSignature: guardianSignName,
    };

    generatePlayerRegistrationPDF(completeProfile, settings);
    setShowPdfModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${primaryColor} transparent` }} />
          <span className="text-sm font-mono text-zinc-400">Cargando expediente...</span>
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
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                {isAdmin ? 'ALTA DIRECCIÓN Y PRESIDENCIA' : (settings.appName || 'CLUB DE VOLEIBOL')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {isAdmin 
                ? (profile.name || user?.displayName || 'Ficha General de Director del Club')
                : (profile.name || user?.displayName || 'Mi Ficha y Carnet Deportivo')
              }
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'card' ? 'form' : 'card')}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    viewMode === 'card'
                      ? 'bg-zinc-900 text-white border-zinc-700'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  <IdCard className="w-4 h-4" />
                  <span>{viewMode === 'card' ? 'Modificar Mis Datos' : 'Ver Carnet Deportivo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Ficha A4</span>
                </button>
              </>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm animate-fade-in">
            <Check className="w-5 h-5 shrink-0" />
            <span className="font-bold">¡Ficha actualizada exitosamente en la base de datos oficial del club!</span>
          </div>
        )}

        {/* Modal for PDF Generation with Signatures */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowPdfModal(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-zinc-800 pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
                  <FileDown className="w-3.5 h-3.5" /> Ficha Formal A4
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">Generar Expediente PDF Oficial</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Este documento cuenta con diseño corporativo formal, membrete institucional y secciones de firmas legales requeridas por el club.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-400" /> Firma / Nombre del Jugador
                  </label>
                  <input 
                    type="text" 
                    value={playerSignName}
                    onChange={(e) => setPlayerSignName(e.target.value)}
                    placeholder="Escribe el nombre o firma del atleta"
                    className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2.5 text-sm focus:ring-2 outline-none font-medium"
                    style={{ ['--tw-ring-color' as any]: primaryColor }}
                  />
                </div>

                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isMinor}
                      onChange={(e) => setIsMinor(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-black border-zinc-700"
                    />
                    <span className="text-xs font-bold text-amber-300">¿El jugador es menor de edad? (Requiere firma de apoderado)</span>
                  </label>

                  {isMinor && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre Completo del Apoderado</label>
                        <input 
                          type="text" 
                          value={guardianName}
                          onChange={(e) => {
                            setGuardianName(e.target.value);
                            setGuardianSignName(e.target.value);
                          }}
                          placeholder="Ej. Roberto Mendoza Ramos"
                          className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: primaryColor }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">DNI del Apoderado</label>
                          <input 
                            type="text" 
                            value={guardianDni}
                            onChange={(e) => setGuardianDni(e.target.value)}
                            placeholder="Ej. 09876543"
                            className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs focus:ring-2 outline-none"
                            style={{ ['--tw-ring-color' as any]: primaryColor }}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Teléfono Apoderado</label>
                          <input 
                            type="text" 
                            value={guardianPhone}
                            onChange={(e) => setGuardianPhone(e.target.value)}
                            placeholder="Ej. 987654321"
                            className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs focus:ring-2 outline-none"
                            style={{ ['--tw-ring-color' as any]: primaryColor }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Firma / Conformidad del Apoderado</label>
                        <input 
                          type="text" 
                          value={guardianSignName}
                          onChange={(e) => setGuardianSignName(e.target.value)}
                          placeholder="Nombre para validar la firma legal"
                          className="w-full rounded-xl border border-zinc-800 bg-black text-white px-3.5 py-2 text-xs focus:ring-2 outline-none"
                          style={{ ['--tw-ring-color' as any]: primaryColor }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Ficha PDF A4</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION FOR EXECUTIVE DIRECTOR */}
        {isAdmin ? (
          <>
            {viewMode === 'form' ? (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                {/* Director Form */}
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
                        style={{ borderColor: accentColor }}
                      >
                        {profile.photoURL ? (
                          <img src={profile.photoURL} alt="Foto oficial" className="w-full h-full object-cover" />
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
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo del Director / Titular</label>
                      <input 
                        type="text" 
                        name="name"
                        value={profile.name || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 text-base font-bold focus:ring-2 outline-none"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. Ing. Carlos Mendoza Ruiz"
                        required
                      />
                    </div>
                    <p className="text-xs text-zinc-400">
                      Ficha de acreditación y representación institucional oficial de la Presidencia del Club.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white text-base sm:text-lg">Datos Institucionales y Despacho</h3>
                    </div>
                    <span className="text-xs text-amber-400 font-mono">Presidencia</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-zinc-500" /> Cargo Directivo
                      </label>
                      <input 
                        type="text" 
                        name="executiveRole"
                        value={profile.executiveRole || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. Presidente / Director General"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <IdCard className="w-4 h-4 text-zinc-500" /> DNI / Documento
                      </label>
                      <input 
                        type="text" 
                        name="dni"
                        value={profile.dni || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. 10982341"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-zinc-500" /> Período de Mandato
                      </label>
                      <input 
                        type="text" 
                        name="tenurePeriod"
                        value={profile.tenurePeriod || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. Gestión 2024 - 2028"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-zinc-500" /> Teléfono de Despacho
                      </label>
                      <input 
                        type="text" 
                        name="officePhone"
                        value={profile.officePhone || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. +51 987 654 321"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-zinc-500" /> Sede Oficial
                      </label>
                      <input 
                        type="text" 
                        name="officeLocation"
                        value={profile.officeLocation || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: accentColor }}
                        placeholder="Ej. Sede Central / Complejo Deportivo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                      <Quote className="w-4 h-4 text-zinc-500" /> Mensaje Institucional / Biografía Ejecutiva
                    </label>
                    <textarea 
                      rows={3}
                      name="institutionalBio"
                      value={profile.institutionalBio || ''}
                      onChange={handleChange}
                      className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                      style={{ ['--tw-ring-color' as any]: accentColor }}
                      placeholder="Visión y compromiso de la gestión directiva con la formación deportiva integral."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="text-black font-black py-3.5 px-8 rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-60 text-xs sm:text-sm uppercase tracking-wider min-h-[48px]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {saving ? 'Guardando...' : 'Guardar Ficha Directiva'}
                  </button>
                </div>
              </form>
            ) : (
              /* Director Card View */
              <div className="max-w-2xl mx-auto bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-3xl border-2 border-amber-500/50 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                        CREDENCIAL INSTITUCIONAL DE ALTA DIRECCIÓN
                      </span>
                      <h2 className="text-xl font-black text-white uppercase">{settings.appName || 'CLUB DE VOLEIBOL'}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-black">
                      PRESIDENCIA
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <div className="w-36 h-44 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-zinc-900 mx-auto">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt="Director" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-zinc-600 m-auto" />
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <h3 className="text-xl font-black text-white">{profile.name || 'Director General'}</h3>
                    <p className="text-xs text-amber-400 font-bold">{profile.executiveRole || 'Presidente del Club'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-2">
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 block">DNI</span>
                        <span className="font-bold">{profile.dni || '-'}</span>
                      </div>
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 block">MANDATO</span>
                        <span className="font-bold">{profile.tenurePeriod || '2024-2028'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* SECTION FOR ATHLETES & COACHES */
          <>
            {/* CARNET DEPORTIVO ON-SCREEN */}
            {viewMode === 'card' && (
              <div className="space-y-8 animate-fade-in">
                {/* Sports Credential Badge Card */}
                <div className="max-w-xl mx-auto">
                  
                  {/* Credential Wrapper Card with Lanyard Hole & Modern Sports Club Aesthetics */}
                  <div className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-3xl border-2 border-zinc-700/80 shadow-2xl p-6 sm:p-8 overflow-hidden">
                    
                    {/* Top Lanyard Slot */}
                    <div className="w-14 h-2 rounded-full bg-zinc-800 border border-zinc-700 mx-auto mb-6 shadow-inner" />

                    {/* Ambient Glows */}
                    <div 
                      className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div 
                      className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Credential Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                        {settings.logoUrl ? (
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo Club" 
                            className="w-12 h-12 object-contain rounded-xl bg-zinc-900/80 p-1 border border-zinc-700 shadow" 
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {settings.appName ? settings.appName.charAt(0) : 'V'}
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                            CARNET DEPORTIVO OFICIAL
                          </span>
                          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                            {settings.appName || 'CLUB DE VOLEIBOL'}
                          </h2>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            {settings.slogan || 'Pasión y Disciplina'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div 
                          className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {profile.clubRole || 'JUGADOR'}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                          TEMPORADA 2026
                        </div>
                      </div>
                    </div>

                    {/* Athlete Photo + Main Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5 relative z-10 items-center">
                      
                      {/* Photo Box */}
                      <div className="flex flex-col items-center justify-center">
                        <div 
                          className="w-32 h-40 rounded-2xl overflow-hidden border-2 bg-zinc-900 shadow-xl relative flex items-center justify-center group"
                          style={{ borderColor: primaryColor }}
                        >
                          {profile.photoURL ? (
                            <img src={profile.photoURL} alt="Foto Deportista" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-14 h-14 text-zinc-600" />
                          )}

                          {profile.jerseyNumber && (
                            <div 
                              className="absolute bottom-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg border border-white/30"
                              style={{ backgroundColor: accentColor }}
                            >
                              #{profile.jerseyNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Key Athlete Info */}
                      <div className="sm:col-span-2 space-y-3 text-center sm:text-left">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Deportista Titular</span>
                          <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                            {profile.name || user?.displayName || 'Nombre no configurado'}
                          </h3>
                          {profile.dni && (
                            <span className="text-xs text-zinc-400 font-mono block mt-0.5">DNI: {profile.dni}</span>
                          )}
                        </div>

                        {/* Quick Spec Pills */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Posición</span>
                            <span className="font-bold text-white truncate block">{profile.position || 'Por definir'}</span>
                          </div>

                          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Categoría</span>
                            <span className="font-bold text-white truncate block">{profile.category || 'Formativa'}</span>
                          </div>

                          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Estatura / Peso</span>
                            <span className="font-bold text-white">{profile.height || '--'} / {profile.weight || '--'}</span>
                          </div>

                          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                            <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">G. Sanguíneo</span>
                            <span className="font-bold text-amber-400">{profile.bloodType || 'Sin dato'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barcode and Stamp Verification Strip */}
                    <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-4 text-xs text-zinc-400 relative z-10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                          <span className="text-[10px] font-bold text-white block">Acreditación Oficial Activa</span>
                          <span className="text-[8px] text-zinc-500 font-mono">ID: {user?.uid.substring(0, 8).toUpperCase() || 'ATH-2026'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-mono text-zinc-500 block">Válido para competencias</span>
                        <span className="text-[10px] font-bold uppercase" style={{ color: primaryColor }}>{settings.appName || 'Club Oficial'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Below Credential */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPdfModal(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 6px 20px -4px rgba(${primaryRgb}, 0.5)`
                      }}
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Descargar Ficha Formal A4 (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('form')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors"
                    >
                      <IdCard className="w-4 h-4" />
                      <span>Editar Ficha Completa</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ATHLETE FORM VIEW */}
            {viewMode === 'form' && (
              <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                
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
                    <p className="text-xs text-zinc-400">
                      Mantén tus datos actualizados para el control de categorías, dorsales y expedientes de partidos oficiales.
                    </p>
                  </div>
                </div>

                {/* Section 1: Sports & Club Information */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5" style={{ color: primaryColor }} />
                      <h3 className="font-bold text-white text-base sm:text-lg">Datos Deportivos y Categoría</h3>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">Ficha Técnica</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <IdCard className="w-4 h-4 text-zinc-500" /> DNI / Documento de Identidad
                      </label>
                      <input 
                        type="text" 
                        name="dni"
                        value={profile.dni || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 74829103"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-zinc-500" /> Número de Camiseta (Dorsal)
                      </label>
                      <input 
                        type="text" 
                        name="jerseyNumber"
                        value={profile.jerseyNumber || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm font-bold text-amber-400"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-zinc-500" /> Posición en Cancha
                      </label>
                      <select 
                        name="position"
                        value={profile.position || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                      >
                        <option value="">Seleccionar posición...</option>
                        <option value="Armador / Colocador">Armador / Colocador (Setter)</option>
                        <option value="Opuesto">Opuesto (Opposite)</option>
                        <option value="Punta Receptor">Punta Receptor (Outside Hitter)</option>
                        <option value="Central / Bloqueador">Central / Bloqueador (Middle Blocker)</option>
                        <option value="Líbero">Líbero (Defensa)</option>
                        <option value="Universal">Universal</option>
                        <option value="Cuerpo Técnico">Cuerpo Técnico / Entrenador</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-zinc-500" /> Categoría Formativa
                      </label>
                      <input 
                        type="text" 
                        name="category"
                        value={profile.category || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. Sub-16, Juvenil, Mayores, Libre"
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
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-zinc-500" /> Año de Ingreso al Club
                      </label>
                      <input 
                        type="text" 
                        name="joinedYear"
                        value={profile.joinedYear || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 2022"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Biometric & Athletic Specs */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                      <h3 className="font-bold text-white text-base sm:text-lg">Parámetros Físicos y Biométricos</h3>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">Mediciones</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-zinc-500" /> Estatura (cm / m)
                      </label>
                      <input 
                        type="text" 
                        name="height"
                        value={profile.height || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 1.82 m"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Weight className="w-4 h-4 text-zinc-500" /> Peso (kg)
                      </label>
                      <input 
                        type="text" 
                        name="weight"
                        value={profile.weight || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 74 kg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-zinc-500" /> Mano Dominante
                      </label>
                      <select 
                        name="dominantHand"
                        value={profile.dominantHand || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Derecha (Diestro)">Derecha (Diestro)</option>
                        <option value="Izquierda (Zurdo)">Izquierda (Zurdo)</option>
                        <option value="Ambidiestro">Ambidiestro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-zinc-500" /> Alcance de Salto
                      </label>
                      <input 
                        type="text" 
                        name="jumpReach"
                        value={profile.jumpReach || ''}
                        onChange={handleChange}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 3.05 m"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Medical & Emergency Contact */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-5 h-5" style={{ color: primaryColor }} />
                      <h3 className="font-bold text-white text-base sm:text-lg">Información Médica y Contactos de Emergencia</h3>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">Seguridad</span>
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
                        <User className="w-4 h-4 text-zinc-500" /> Contacto de Emergencia
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

                {/* Section 4: Guardian / Legal Tutor (Menores de edad) */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white text-base sm:text-lg">Datos del Apoderado o Tutor Legal (Menores de Edad)</h3>
                    </div>
                    <span className="text-xs text-amber-400 font-mono">Apoderado</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nombre Completo del Apoderado</label>
                      <input 
                        type="text" 
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. Roberto Mendoza Ramos"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">DNI del Apoderado</label>
                      <input 
                        type="text" 
                        value={guardianDni}
                        onChange={(e) => setGuardianDni(e.target.value)}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. 09876543"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Teléfono / WhatsApp</label>
                      <input 
                        type="text" 
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full rounded-xl border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 outline-none text-sm"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                        placeholder="Ej. +51 987 654 321"
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
                    <span>Ver Carnet Deportivo Oficial</span>
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
          </>
        )}

      </div>
    </div>
  );
}
