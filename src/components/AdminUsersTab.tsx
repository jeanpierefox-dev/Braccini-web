import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Trash2, Edit2, Plus, X, Loader2, Save, User as UserIcon, FileDown } from 'lucide-react';
import { generatePlayerRegistrationPDF } from '../utils/pdfGenerators';
import { useSettings } from '../hooks/useSettings';

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettings();
  const primaryColor = settings.primaryColor || '#10b981';

  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setCurrentUser(user);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentUser({
      name: '',
      email: '',
      role: 'user',
      clubRole: 'jugador',
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (e) {
        console.error("Error al eliminar", e);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser.id) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          ...currentUser,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'users'), {
          ...currentUser,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4 bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-800">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="w-5 h-5" /> Gestión de Usuarios
        </h2>
        <button
          onClick={handleAddNew}
          className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-black p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4">
            <h3 className="font-bold text-lg">{currentUser.id ? 'Editar Usuario' : 'Crear Usuario'}</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={currentUser.name || ''} 
                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={currentUser.email || ''} 
                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Privilegios (Plataforma)</label>
              <select 
                value={currentUser.role || 'user'} 
                onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as any})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="user">Usuario Regular</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Rol en el Club</label>
              <select 
                value={currentUser.clubRole || 'jugador'} 
                onChange={(e) => setCurrentUser({...currentUser, clubRole: e.target.value as any})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="jugador">Jugador</option>
                <option value="entrenador">Entrenador</option>
                <option value="director">Director / Dirigente</option>
                <option value="socio">Socio / Padre</option>
                <option value="administrador">Administrador IT</option>
                <option value="">Ninguno</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-emerald-500 text-black px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {users.map(u => (
            <div key={u.id} className="bg-black p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-700">
                  {u.photoURL ? <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-zinc-500" />}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{u.name || 'Sin nombre'}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col sm:items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-300'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                    {u.clubRole || 'Sin Rol'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(u)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-zinc-500 text-center py-8">No hay usuarios registrados.</p>}
        </div>
      )}
    </div>
  );
}
