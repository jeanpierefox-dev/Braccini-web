import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MediaItem } from '../types';
import { Trash2, Edit2, Plus, X, Loader2, Save, Image as ImageIcon, Video, Upload } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { compressImageFile } from '../utils/imageCompressor';

export function AdminMediaTab() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettings();
  const primaryColor = settings.primaryColor || '#10b981';

  const [isEditing, setIsEditing] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Partial<MediaItem>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'media'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData: MediaItem[] = [];
      snapshot.forEach(doc => {
        mediaData.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      // Sort by createdAt descending locally
      mediaData.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setMediaItems(mediaData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (item: MediaItem) => {
    setCurrentMedia(item);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentMedia({
      title: '',
      description: '',
      subtitle: '',
      url: '',
      category: 'entrenos',
      categoryLabel: 'Entrenamiento Físico',
      tag: '',
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este elemento multimedia?')) {
      try {
        await deleteDoc(doc(db, 'media', id));
      } catch (e) {
        console.error("Error al eliminar", e);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const dataUrl = await compressImageFile(file, 1200, 1200, 0.85);
      setCurrentMedia({ ...currentMedia, url: dataUrl });
    } catch (err) {
      console.error(err);
      alert('Error al procesar la imagen');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Si el tag está vacío, autogenerar uno
      const tag = currentMedia.tag || (currentMedia.category === 'entrenos' ? 'Entrenamiento' : 'Partido');
      
      const payload = {
        ...currentMedia,
        tag,
        updatedAt: serverTimestamp()
      };

      if (currentMedia.id) {
        await updateDoc(doc(db, 'media', currentMedia.id), payload);
      } else {
        await addDoc(collection(db, 'media'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving media:", error);
      alert("Error al guardar archivo multimedia");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4 bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-800">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" /> Biblioteca Multimedia y Táctica
        </h2>
        <button
          onClick={handleAddNew}
          className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Recurso
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-black p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4">
            <h3 className="font-bold text-lg">{currentMedia.id ? 'Editar Publicación' : 'Crear Publicación'}</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Título Principal</label>
                <input 
                  type="text" 
                  value={currentMedia.title || ''} 
                  onChange={(e) => setCurrentMedia({...currentMedia, title: e.target.value})}
                  required
                  placeholder="Ej. Análisis Táctico Defensa"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Subtítulo Corto</label>
                <input 
                  type="text" 
                  value={currentMedia.subtitle || ''} 
                  onChange={(e) => setCurrentMedia({...currentMedia, subtitle: e.target.value})}
                  placeholder="Ej. Jugadas de estrategia en zona 2"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Categoría</label>
                <select 
                  value={currentMedia.category || 'entrenos'} 
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    let label = 'Entrenamiento Físico';
                    if (cat === 'partidos') label = 'Partidos Oficiales';
                    if (cat === 'tactica') label = 'Táctica y Estrategia';
                    if (cat === 'paseos') label = 'Paseos e Integración';
                    setCurrentMedia({...currentMedia, category: cat, categoryLabel: label});
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="entrenos">Entrenamiento Físico</option>
                  <option value="partidos">Partidos Oficiales / Campeonatos</option>
                  <option value="tactica">Táctica y Estrategia</option>
                  <option value="paseos">Paseos e Integración</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Reseña / Descripción Informativa</label>
                <textarea 
                  value={currentMedia.description || ''} 
                  onChange={(e) => setCurrentMedia({...currentMedia, description: e.target.value})}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center flex flex-col items-center justify-center min-h-[160px] relative">
                {currentMedia.url ? (
                  currentMedia.url.includes('youtube.com') || currentMedia.url.includes('vimeo.com') ? (
                     <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
                       <Video className="w-12 h-12 text-zinc-600" />
                       <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs rounded">Video URL</span>
                     </div>
                  ) : (
                    <img src={currentMedia.url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  )
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs">Sin imagen seleccionada</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Subir Imagen desde Carpeta</label>
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-lg px-3 py-2.5 text-sm flex justify-center items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Seleccionar Imagen Local
                </button>
              </div>

              <div className="text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">O</div>


            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-emerald-500 text-black px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Publicación
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map(item => (
            <div key={item.id} className="bg-black rounded-xl border border-zinc-800 overflow-hidden flex flex-col group relative">
              <div className="h-32 bg-zinc-900 relative">
                {item.url && (
                  item.url.includes('youtube.com') || item.url.includes('vimeo.com') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-zinc-600" />
                    </div>
                  ) : (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  )
                )}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-zinc-700">
                  {item.categoryLabel}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-sm text-white line-clamp-1">{item.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/50 justify-end">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {mediaItems.length === 0 && <p className="text-zinc-500 col-span-full py-8 text-center border border-dashed border-zinc-800 rounded-xl">No hay elementos multimedia registrados.</p>}
        </div>
      )}
    </div>
  );
}
