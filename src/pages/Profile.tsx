import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { User, Phone, Calendar, HeartPulse, Activity, AlertCircle, Hash, Target, Camera } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (e) {
        console.error("Error loading profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        
        // compress as JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfile(prev => ({ ...prev, photoURL: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        emergencyContact: profile.emergencyContact || '',
        medicalInfo: profile.medicalInfo || '',
        bloodType: profile.bloodType || '',
        jerseyNumber: profile.jerseyNumber || '',
        position: profile.position || '',
        photoURL: profile.photoURL || ''
      });
      
      if (auth.currentUser && profile.photoURL) {
        try {
          await updateProfile(auth.currentUser, {
            photoURL: profile.photoURL
          });
        } catch (e) {
          console.warn("Could not update auth profile", e);
        }
      }

      alert('Ficha actualizada correctamente');
      
      // Update local storage mock admin if needed
      if (user.uid === 'mock-admin-123') {
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
          const mockAdmin = JSON.parse(mockUserStr);
          mockAdmin.photoURL = profile.photoURL;
          localStorage.setItem('mockUser', JSON.stringify(mockAdmin));
          window.location.reload(); // Quick way to sync navbar for mock
        }
      } else {
         window.location.reload(); // Refresh to update nav avatar if Firebase auth used
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar la ficha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Cargando ficha...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900 text-slate-100 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 border-b border-zinc-800 pb-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative group cursor-pointer">
            <label className="cursor-pointer block">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="w-28 h-28 bg-zinc-800 border-2 border-zinc-700 rounded-full flex items-center justify-center overflow-hidden relative shadow-2xl group-hover:border-blue-500 transition-colors">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-zinc-500" />
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Subir Foto</span>
                </div>
              </div>
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Ficha Deportiva</h1>
            <p className="text-zinc-400 capitalize flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-white">{profile.name}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {profile.clubRole || 'Miembro'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-inner space-y-6">
            
            <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><Phone className="w-4 h-4"/> Teléfono</label>
                <input 
                  type="text" 
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. +51 987 654 321"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Fecha de Nacimiento</label>
                <input 
                  type="date" 
                  name="dateOfBirth"
                  value={profile.dateOfBirth || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2 pt-4">Datos Deportivos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><Hash className="w-4 h-4"/> Número de Camiseta</label>
                <input 
                  type="text" 
                  name="jerseyNumber"
                  value={profile.jerseyNumber || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ej. 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><Target className="w-4 h-4"/> Posición en la Cancha</label>
                <select 
                  name="position"
                  value={profile.position || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar posición...</option>
                  <option value="Armador">Armador</option>
                  <option value="Opuesto">Opuesto</option>
                  <option value="Punta">Punta / Receptor</option>
                  <option value="Central">Central</option>
                  <option value="Libero">Líbero</option>
                </select>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2 pt-4">Información Médica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><HeartPulse className="w-4 h-4"/> Tipo de Sangre</label>
                <select 
                  name="bloodType"
                  value={profile.bloodType || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Contacto de Emergencia</label>
                <input 
                  type="text" 
                  name="emergencyContact"
                  value={profile.emergencyContact || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nombre y Teléfono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> Alergias / Condiciones Médicas</label>
                <input 
                  type="text" 
                  name="medicalInfo"
                  value={profile.medicalInfo || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Especifique si padece alergias, asma, etc."
                />
              </div>
            </div>

          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70"
            >
              {saving ? 'Guardando...' : 'Guardar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
