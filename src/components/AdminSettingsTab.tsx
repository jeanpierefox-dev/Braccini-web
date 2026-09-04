import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClubSettings } from '../types';
import { Save, Loader2, Image as ImageIcon, Settings2, Palette, Shield } from 'lucide-react';

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<Partial<ClubSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'club_profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as ClubSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    let finalValue = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = parseFloat(value);
    }
    
    setSettings(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const docRef = doc(db, 'settings', 'club_profile');
      await setDoc(docRef, settings, { merge: true });
      setMessage('Ajustes guardados correctamente.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage('Error al guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings2 className="w-5 h-5" /> Configuración de la Plataforma</h2>
          <p className="text-xs text-zinc-400 mt-1">Personaliza la apariencia y los datos principales del club.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm font-semibold text-center border border-emerald-500/30">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidad y General */}
        <div className="space-y-4">
          <h3 className="font-semibold text-emerald-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Identidad del Club
          </h3>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre de la App / Club</label>
            <input 
              type="text" 
              name="appName" 
              value={settings.appName || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Eslogan</label>
            <input 
              type="text" 
              name="slogan" 
              value={settings.slogan || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Descripción Corta</label>
            <textarea 
              name="description" 
              value={settings.description || ''} 
              onChange={handleChange}
              rows={3}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center justify-between">
              Logo (URL)
              {settings.logoUrl && <img src={settings.logoUrl} alt="Logo preview" className="w-6 h-6 object-contain" />}
            </label>
            <input 
              type="text" 
              name="logoUrl" 
              value={settings.logoUrl || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Diseño y Apariencia */}
        <div className="space-y-4">
          <h3 className="font-semibold text-amber-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Diseño y Colores
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Color Principal (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  name="primaryColor" 
                  value={settings.primaryColor || '#10b981'} 
                  onChange={handleChange}
                  className="w-8 h-8 rounded cursor-pointer bg-black"
                />
                <input 
                  type="text" 
                  name="primaryColor" 
                  value={settings.primaryColor || '#10b981'} 
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Color Acento (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  name="accentColor" 
                  value={settings.accentColor || '#fbbf24'} 
                  onChange={handleChange}
                  className="w-8 h-8 rounded cursor-pointer bg-black"
                />
                <input 
                  type="text" 
                  name="accentColor" 
                  value={settings.accentColor || '#fbbf24'} 
                  onChange={handleChange}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center justify-between">
              Fondo de Portada / Hero (URL)
              {settings.heroBgUrl && <img src={settings.heroBgUrl} alt="Hero preview" className="w-10 h-6 object-cover rounded" />}
            </label>
            <input 
              type="text" 
              name="heroBgUrl" 
              value={settings.heroBgUrl || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center justify-between">
              Foto Oficial del Equipo Principal (URL)
            </label>
            <input 
              type="text" 
              name="mainTeamImageUrl" 
              value={settings.mainTeamImageUrl || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Textos Principales */}
        <div className="space-y-4">
          <h3 className="font-semibold text-blue-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Portada
          </h3>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Título de Portada</label>
            <input 
              type="text" 
              name="heroTitle" 
              value={settings.heroTitle || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Subtítulo de Portada</label>
            <input 
              type="text" 
              name="heroSubtitle" 
              value={settings.heroSubtitle || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Texto del Botón de Llamado a Acción</label>
            <input 
              type="text" 
              name="ctaButtonText" 
              value={settings.ctaButtonText || ''} 
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="space-y-4">
          <h3 className="font-semibold text-purple-400 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Estadísticas y Cifras
          </h3>
          
          <label className="flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-lg cursor-pointer">
            <input 
              type="checkbox" 
              name="statsAutoCountPlayers" 
              checked={settings.statsAutoCountPlayers !== false} 
              onChange={handleChange}
              className="w-4 h-4 accent-emerald-500"
            />
            <div className="text-sm">
              <span className="font-semibold text-white block">Contar atletas automáticamente</span>
              <span className="text-xs text-zinc-500">Usa los jugadores reales registrados en la base de datos</span>
            </div>
          </label>
          
          <div className={`transition-opacity ${settings.statsAutoCountPlayers !== false ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Atletas (Anulación Manual)</label>
            <input 
              type="text" 
              name="statsAthletes" 
              value={settings.statsAthletes || ''} 
              onChange={handleChange}
              placeholder="ej. 120+"
              disabled={settings.statsAutoCountPlayers !== false}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Campeonatos Logrados</label>
            <input 
              type="text" 
              name="statsChampionships" 
              value={settings.statsChampionships || ''} 
              onChange={handleChange}
              placeholder="ej. 20+"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Año de Fundación</label>
            <input 
              type="text" 
              name="statsFoundedYear" 
              value={settings.statsFoundedYear || ''} 
              onChange={handleChange}
              placeholder="ej. 2015"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
