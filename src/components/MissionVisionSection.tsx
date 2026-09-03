import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Target, 
  Compass, 
  Award, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export function MissionVisionSection() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const isAdmin = role === 'admin' || user?.email === 'admin@club.com';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [missionTitle, setMissionTitle] = useState(settings.missionTitle || 'Nuestra Misión Institucional');
  const [missionText, setMissionText] = useState(
    settings.missionText || 
    'Formar atletas de voleibol con los más altos estándares técnicos, tácticos y físicos, inculcando valores de disciplina, resiliencia y compañerismo que los potencien como deportistas de élite y personas íntegras.'
  );
  
  const [visionTitle, setVisionTitle] = useState(settings.visionTitle || 'Nuestra Visión de Futuro');
  const [visionText, setVisionText] = useState(
    settings.visionText || 
    'Consolidarnos como el club formativo y competitivo líder a nivel nacional e internacional, reconocido por la excelencia en su metodología deportiva, su cuerpo técnico especializado y el desarrollo integral de sus deportistas.'
  );
  
  const [valuesTitle, setValuesTitle] = useState(settings.valuesTitle || 'Pilares y Valores del Club');
  const [valuesList, setValuesList] = useState<string[]>(
    settings.valuesList && settings.valuesList.length > 0 
      ? settings.valuesList 
      : [
        'Disciplina y Constancia Deportiva',
        'Trabajo en Equipo y Solidaridad',
        'Excelencia Técnica y Mentalidad Ganadora',
        'Respeto, Juego Limpio e Integridad',
        'Pasión y Pertenencia Institucional'
      ]
  );
  const [newValueInput, setNewValueInput] = useState('');

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  // If hidden by admin and user is NOT admin, do not render
  if (settings.showMissionVision === false && !isAdmin) {
    return null;
  }

  const handleAddValue = () => {
    if (!newValueInput.trim()) return;
    setValuesList([...valuesList, newValueInput.trim()]);
    setNewValueInput('');
  };

  const handleRemoveValue = (index: number) => {
    setValuesList(valuesList.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, 'settings', 'general'), {
        showMissionVision: true,
        missionTitle: missionTitle.trim(),
        missionText: missionText.trim(),
        visionTitle: visionTitle.trim(),
        visionText: visionText.trim(),
        valuesTitle: valuesTitle.trim(),
        valuesList: valuesList.filter(v => v.trim().length > 0),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsEditing(false);
    } catch (err) {
      console.error("Error saving mission/vision:", err);
      alert("Error al guardar la Misión y Visión.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    const newStatus = settings.showMissionVision === false;
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        showMissionVision: newStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error updating visibility:", err);
    }
  };

  const handleDeleteSection = async () => {
    if (!confirm("¿Deseas ocultar/eliminar la sección de Misión y Visión de la página principal? (Podrás reactivarla desde este panel en cualquier momento).")) {
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        showMissionVision: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditing(false);
    } catch (err) {
      console.error("Error disabling mission/vision:", err);
    }
  };

  return (
    <section id="mision-vision" className="relative py-14 sm:py-20 bg-zinc-950 border-t border-b border-zinc-900 overflow-hidden">
      {/* Background Subtle Corporate Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Admin Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span 
                className="text-xs font-heading font-black uppercase tracking-[0.25em]"
                style={{ color: accentColor }}
              >
                Identidad y Propósito Institucional
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight uppercase">
              Misión, Visión y Valores
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-1 max-w-2xl">
              Los cimientos deportivos, éticos y formativos que impulsan a nuestra institución hacia la excelencia.
            </p>
          </div>

          {/* Admin Control Bar */}
          {isAdmin && (
            <div className="flex items-center gap-2 self-start md:self-auto bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cerrar Edición' : 'Editar Misión/Visión (Adm)'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVisibility}
                title={settings.showMissionVision === false ? "Sección Oculta al Público" : "Sección Visible"}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  settings.showMissionVision === false 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {settings.showMissionVision === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleDeleteSection}
                title="Ocultar de la página principal"
                className="p-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Visibility Alert if Hidden for Public but Seen by Admin */}
        {isAdmin && settings.showMissionVision === false && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <strong>Atención Adm:</strong> Esta sección está actualmente <strong>oculta</strong> para los visitantes.
            </span>
            <button
              onClick={handleToggleVisibility}
              className="px-3 py-1 rounded-lg bg-amber-500 text-black font-heading font-black text-[11px] uppercase tracking-wider"
            >
              Publicar / Mostrar
            </button>
          </div>
        )}

        {/* EDITING FORM FOR ADMIN */}
        {isEditing && isAdmin ? (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="text-base font-bold text-white">Editar Misión, Visión y Valores del Club</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mission Edit */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Título de la Misión
                </label>
                <input
                  type="text"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />

                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block pt-2">
                  Descripción de la Misión
                </label>
                <textarea
                  rows={4}
                  value={missionText}
                  onChange={(e) => setMissionText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Vision Edit */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Título de la Visión
                </label>
                <input
                  type="text"
                  value={visionTitle}
                  onChange={(e) => setVisionTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />

                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block pt-2">
                  Descripción de la Visión
                </label>
                <textarea
                  rows={4}
                  value={visionText}
                  onChange={(e) => setVisionText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Values Edit */}
            <div className="border-t border-zinc-800 pt-5 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Título de la Sección de Valores
              </label>
              <input
                type="text"
                value={valuesTitle}
                onChange={(e) => setValuesTitle(e.target.value)}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />

              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block pt-2">
                Lista de Valores y Pilares
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar nuevo pilar (ej. Disciplina y Respeto)..."
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddValue}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {valuesList.map((val, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(idx)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios Oficiales'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* CORPORATE DISPLAY CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-4">
          
          {/* Card 1: MISIÓN */}
          <div className="bg-zinc-950 rounded-2xl p-8 sm:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 transition-transform origin-left scale-x-100 group-hover:scale-x-105"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-zinc-800/50"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, color: primaryColor }}
                >
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                    Rumbo Deportivo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                    {settings.missionTitle || 'Nuestra Misión'}
                  </h3>
                </div>
              </div>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {settings.missionText || missionText}
              </p>
            </div>
          </div>

          {/* Card 2: VISIÓN */}
          <div className="bg-zinc-950 rounded-2xl p-8 sm:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div 
              className="absolute top-0 left-0 right-0 h-1.5 transition-transform origin-left scale-x-100 group-hover:scale-x-105"
              style={{ backgroundColor: accentColor }}
            />
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-zinc-800/50"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.1)`, color: accentColor }}
                >
                  <Compass className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                    Proyección y Futuro
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                    {settings.visionTitle || 'Nuestra Visión'}
                  </h3>
                </div>
              </div>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {settings.visionText || visionText}
              </p>
            </div>
          </div>

          {/* Row 3: PILARES Y VALORES INSTITUCIONALES */}
          <div className="lg:col-span-2 mt-4 bg-zinc-950 rounded-2xl p-8 sm:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-zinc-900 pb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-zinc-800/50"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, color: primaryColor }}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-heading font-black text-white uppercase tracking-tight">
                    {settings.valuesTitle || 'Valores Institucionales'}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">La filosofía deportiva que rige nuestros entrenamientos y competencias</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(settings.valuesList && settings.valuesList.length > 0 ? settings.valuesList : valuesList).map((val, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 transition-colors hover:bg-zinc-900 hover:border-zinc-700"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-black shrink-0"
                    style={{ backgroundColor: `rgba(${idx % 2 === 0 ? primaryRgb : accentRgb}, 0.1)`, color: idx % 2 === 0 ? primaryColor : accentColor }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm font-semibold text-zinc-300 leading-snug">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
