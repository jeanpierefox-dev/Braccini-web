import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, MediaItem, UserRole, Payment } from '../types';
import { Upload, Trash2, Shield, User as UserIcon, LayoutTemplate, Activity, Settings, Wallet, Printer, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '../hooks/useSettings';

export function AdminPanel() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'media' | 'users' | 'payments' | 'settings'>('media');
  const appSettings = useSettings();
  
  // Media Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'training' | 'player' | 'general'>('training');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // User Creation State
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserClubRole, setNewUserClubRole] = useState<'jugador' | 'entrenador'>('jugador');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Payment Form State
  const [paymentUser, setPaymentUser] = useState('');
  const [paymentConcept, setPaymentConcept] = useState('Cuota Mensual');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPeriod, setPaymentPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<Payment | null>(null);
  const [treasuryView, setTreasuryView] = useState<'registro' | 'mensualidades' | 'uniformes'>('registro');
  const [selectedMonth, setSelectedMonth] = useState(() => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
  });

  // Settings Form State
  const [configAppName, setConfigAppName] = useState('');
  const [configLogoUrl, setConfigLogoUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (appSettings.appName) setConfigAppName(appSettings.appName);
    if (appSettings.logoUrl) setConfigLogoUrl(appSettings.logoUrl);
  }, [appSettings]);

  useEffect(() => {
    if (role !== 'admin') return;

    // Fetch Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unUsers = onSnapshot(qUsers, (snap) => {
      const u: UserProfile[] = [];
      snap.forEach(d => u.push({ id: d.id, ...d.data() } as UserProfile));
      setUsers(u);
    }, (error) => {
      console.warn("Firestore listener error (users):", error);
    });

    // Fetch Media
    const qMedia = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unMedia = onSnapshot(qMedia, (snap) => {
      const m: MediaItem[] = [];
      snap.forEach(d => m.push({ id: d.id, ...d.data() } as MediaItem));
      setMediaList(m);
    }, (error) => {
      console.warn("Firestore listener error (media):", error);
    });

    // Fetch Payments
    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unPayments = onSnapshot(qPayments, (snap) => {
      const p: Payment[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Payment));
      setPayments(p);
    }, (error) => {
      console.warn("Firestore listener error (payments):", error);
    });

    return () => {
      unUsers();
      unMedia();
      unPayments();
    };
  }, [role]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We use a small check for file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
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
        setUrlCallback(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      setError('Título y URL son obligatorios');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'media'), {
        title,
        description,
        url,
        type,
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      });
      
      setTitle('');
      setDescription('');
      setUrl('');
      alert('Contenido subido exitosamente');
    } catch (err: any) {
      console.error(err);
      setError('Error al subir el contenido: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('¿Eliminar este contenido?')) {
      await deleteDoc(doc(db, 'media', id));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (confirm(`¿Cambiar rol a ${newRole}?`)) {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'settings', 'general'), {
        appName: configAppName,
        logoUrl: configLogoUrl
      });
      alert('Configuración guardada exitosamente');
    } catch (err: any) {
      if (err.code === 'not-found') {
         await setDoc(doc(db, 'settings', 'general'), {
           appName: configAppName,
           logoUrl: configLogoUrl
         });
         alert('Configuración guardada exitosamente');
      } else {
        console.error(err);
        alert('Error al guardar configuración');
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername || !newUserPassword) return;
    setIsAddingUser(true);
    try {
      // Initialize a secondary app to create a user without logging out the admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const email = `${newUserUsername.trim().toLowerCase()}@voleyclub.app`;
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUserPassword);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newUserName,
        email: email,
        username: newUserUsername.trim().toLowerCase(),
        role: 'member',
        clubRole: newUserClubRole,
        createdAt: serverTimestamp()
      });
      
      await secondaryAuth.signOut();
      
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserClubRole('jugador');
      alert(`Usuario creado con éxito. Username: ${newUserUsername}`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Este usuario ya existe.');
      } else if (err.code === 'auth/weak-password') {
        alert('La contraseña debe tener al menos 6 caracteres.');
      } else {
        alert('Error al agregar usuario.');
      }
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUser || !paymentAmount || !paymentConcept) return;
    setIsAddingPayment(true);
    try {
      const selectedUser = users.find(u => u.id === paymentUser);
      if (!selectedUser) throw new Error("Usuario no encontrado");

      const newPayment = {
        userId: paymentUser,
        userName: selectedUser.name || selectedUser.email,
        concept: paymentConcept,
        period: paymentConcept === 'Cuota Mensual' ? paymentPeriod : undefined,
        amount: parseFloat(paymentAmount),
        status: 'paid',
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'payments'), newPayment);
      
      setPaymentAmount('');
      setPaymentConcept('Cuota Mensual');
      alert('Pago registrado correctamente.');
    } catch (err: any) {
      console.error(err);
      alert('Error al registrar pago.');
    } finally {
      setIsAddingPayment(false);
    }
  };

  useEffect(() => {
    if (receiptToPrint) {
      setTimeout(() => {
        window.print();
        setReceiptToPrint(null);
      }, 500);
    }
  }, [receiptToPrint]);

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900">Acceso Denegado</h2>
          <p className="text-zinc-600">Solo administradores pueden ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900 text-slate-100 py-10 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:hidden">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Control CMS</h1>
            <p className="text-zinc-400">Gestiona el contenido multimedia y los accesos de usuarios.</p>
          </div>
          
          <div className="flex bg-zinc-900/60 rounded-lg shadow-inner p-1 border border-zinc-800 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'media' ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" /> Media
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users' ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Usuarios
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'payments' ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Wallet className="w-4 h-4" /> Tesorería
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Settings className="w-4 h-4" /> Configuración
            </button>
          </div>
        </div>

        {activeTab === 'media' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-inner sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" /> Cargar Nuevo
                </h3>
                
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleMediaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo de Contenido</label>
                    <select 
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="training">Entrenamiento (Video/Foto)</option>
                      <option value="player">Jugador (Foto/Clip)</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ej. Sesión de Remate - Junio"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Imagen del Contenido</label>
                    <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 w-full px-4 py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center">
                      <Upload className="w-8 h-8 mb-2 text-zinc-500" />
                      <span className="font-medium text-sm">Seleccionar Imagen desde Carpeta</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setUrl)}
                        className="hidden"
                      />
                    </label>
                    {url && (
                      <div className="mt-3">
                        <img src={url} alt="Preview" className="h-32 w-full object-cover rounded border border-zinc-800" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Descripción</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Detalles sobre el material..."
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? 'Subiendo...' : 'Publicar Contenido'}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                  <h3 className="font-bold text-white">Historial de Publicaciones</h3>
                  <span className="text-sm text-zinc-500">{mediaList.length} registros</span>
                </div>
                
                <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
                  {mediaList.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No hay contenido publicado.</div>
                  ) : mediaList.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="w-16 h-12 bg-zinc-800 rounded object-cover overflow-hidden flex-shrink-0">
                        {item.url.includes('youtube') ? (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-xs text-white border border-zinc-700">YT</div>
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="capitalize">{item.type}</span>
                          <span>•</span>
                          <span>{item.createdAt ? format(item.createdAt.toDate(), "dd MMM, yyyy", { locale: es }) : 'Nuevo'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteMedia(item.id!)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-inner sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-red-500" /> Nuevo Integrante
                </h3>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Usuario de Acceso</label>
                    <input 
                      type="text" 
                      value={newUserUsername}
                      onChange={e => setNewUserUsername(e.target.value)}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ej. jperez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
                    <input 
                      type="password" 
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Rol en el Club</label>
                    <select 
                      value={newUserClubRole}
                      onChange={e => setNewUserClubRole(e.target.value as 'jugador' | 'entrenador')}
                      className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="jugador">Jugador</option>
                      <option value="entrenador">Entrenador</option>
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isAddingUser}
                    className="w-full bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-70"
                  >
                    {isAddingUser ? 'Registrando...' : 'Agregar Usuario'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
                  <h3 className="font-bold text-white">Control de Acceso (RBAC)</h3>
                  <span className="text-sm text-zinc-500">{users.length} miembros</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-900/80 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Usuario</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Rol del Club</th>
                        <th className="px-6 py-4 font-medium">Acceso</th>
                        <th className="px-6 py-4 font-medium text-right">Permisos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-800/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                  <UserIcon className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                              <span className="font-medium text-white">{u.name || 'Sin nombre'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 text-sm">{u.email}</td>
                          <td className="px-6 py-4 text-zinc-400 text-sm capitalize">{u.clubRole || 'Jugador'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                              u.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                              disabled={u.id === user?.uid}
                              className="text-sm rounded border border-zinc-700 px-2 py-1 bg-black text-white disabled:opacity-50"
                            >
                              <option value="member">Miembro</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-zinc-800 pb-4">
              <button
                onClick={() => setTreasuryView('registro')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${treasuryView === 'registro' ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                Registro e Historial
              </button>
              <button
                onClick={() => setTreasuryView('mensualidades')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${treasuryView === 'mensualidades' ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                Control de Mensualidades
              </button>
              <button
                onClick={() => setTreasuryView('uniformes')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${treasuryView === 'uniformes' ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                Control de Uniformes
              </button>
            </div>

            {treasuryView === 'registro' && (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 shadow-inner sticky top-24">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-red-500" /> Registrar Pago
                    </h3>
                    
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Miembro</label>
                        <select 
                          value={paymentUser}
                          onChange={(e) => setPaymentUser(e.target.value)}
                          className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        >
                          <option value="">Seleccionar Integrante...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Concepto</label>
                        <select 
                          value={paymentConcept}
                          onChange={(e) => setPaymentConcept(e.target.value)}
                          className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        >
                          <option value="Cuota Mensual">Cuota Mensual</option>
                          <option value="Uniforme">Uniforme</option>
                          <option value="Inscripción">Inscripción</option>
                          <option value="Torneo">Torneo / Competencia</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      {paymentConcept === 'Cuota Mensual' && (
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Mes correspondiente</label>
                          <input 
                            type="month" 
                            value={paymentPeriod}
                            onChange={e => setPaymentPeriod(e.target.value)}
                            className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Monto (S/ o $)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          placeholder="50.00"
                        />
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isAddingPayment || !paymentUser}
                        className="w-full bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-70"
                      >
                        {isAddingPayment ? 'Guardando...' : 'Registrar Pago'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                    <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
                      <h3 className="font-bold text-white">Historial de Pagos</h3>
                      <span className="text-sm text-zinc-500">{payments.length} registros</span>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-900/80 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800 sticky top-0">
                          <tr>
                            <th className="px-6 py-4 font-medium">Fecha</th>
                            <th className="px-6 py-4 font-medium">Miembro</th>
                            <th className="px-6 py-4 font-medium">Concepto</th>
                            <th className="px-6 py-4 font-medium text-right">Monto</th>
                            <th className="px-6 py-4 font-medium text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-zinc-500">No hay pagos registrados.</td>
                            </tr>
                          ) : payments.map(p => (
                            <tr key={p.id} className="hover:bg-zinc-800/30">
                              <td className="px-6 py-4 text-sm text-zinc-400">
                                {p.createdAt ? format(p.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: es }) : 'Justo ahora'}
                              </td>
                              <td className="px-6 py-4 font-medium text-white">{p.userName}</td>
                              <td className="px-6 py-4 text-zinc-300">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs">
                                  {p.concept} {p.period ? `(${p.period})` : ''}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-red-400">
                                {Number(p.amount).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setReceiptToPrint(p)}
                                  className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded border border-zinc-600 transition-colors text-xs font-medium"
                                >
                                  <Printer className="w-3 h-3" /> Recibo
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {treasuryView === 'mensualidades' && (
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
                  <h3 className="font-bold text-white">Estado de Mensualidades</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-400">Seleccionar Mes:</label>
                    <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="rounded-lg border-zinc-800 border bg-black text-white px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-900/80 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Integrante</th>
                        <th className="px-6 py-4 font-medium">Rol</th>
                        <th className="px-6 py-4 font-medium text-center">Estado de Pago ({selectedMonth})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map(u => {
                        const monthlyPayment = payments.find(p => p.userId === u.id && p.concept === 'Cuota Mensual' && p.period === selectedMonth);
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30">
                            <td className="px-6 py-4 font-medium text-white">{u.name || u.email}</td>
                            <td className="px-6 py-4 text-sm text-zinc-400 capitalize">{u.clubRole || 'Jugador'}</td>
                            <td className="px-6 py-4 text-center">
                              {monthlyPayment ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-widest">
                                  Pagado (S/{Number(monthlyPayment.amount).toFixed(2)})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-widest">
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {treasuryView === 'uniformes' && (
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner">
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
                  <h3 className="font-bold text-white">Control de Pagos de Uniformes</h3>
                  <span className="text-sm text-zinc-500">Resumen Histórico</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-900/80 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Integrante</th>
                        <th className="px-6 py-4 font-medium text-center">Estado de Uniforme</th>
                        <th className="px-6 py-4 font-medium text-right">Monto Acumulado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {users.map(u => {
                        const uniformPayments = payments.filter(p => p.userId === u.id && p.concept === 'Uniforme');
                        const totalPaid = uniformPayments.reduce((acc, curr) => acc + Number(curr.amount), 0);
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30">
                            <td className="px-6 py-4 font-medium text-white">{u.name || u.email}</td>
                            <td className="px-6 py-4 text-center">
                              {totalPaid > 0 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-widest">
                                  Con Pagos Registrados
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-xs font-bold uppercase tracking-widest">
                                  Sin Pagos
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white">
                              {totalPaid > 0 ? `S/${totalPaid.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-inner max-w-2xl mx-auto">
            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80">
              <h3 className="font-bold text-white">Configuración del Club</h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre de la Página</label>
                  <input 
                    type="text" 
                    value={configAppName}
                    onChange={e => setConfigAppName(e.target.value)}
                    className="w-full rounded-lg border-zinc-800 border bg-black text-white px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej. TITANES VOLEY CLUB"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Logo de la Página Web</label>
                  <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 w-full px-4 py-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center">
                    <Upload className="w-6 h-6 mb-2 text-zinc-500" />
                    <span className="font-medium text-sm">Seleccionar Logo desde Carpeta</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setConfigLogoUrl)}
                      className="hidden"
                    />
                  </label>
                  {configLogoUrl && (
                     <div className="mt-3 flex items-center gap-4 p-4 bg-black rounded-lg border border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Vista Previa:</span>
                        <img src={configLogoUrl} alt="Preview" className="h-10 w-10 object-contain rounded" />
                     </div>
                  )}
                </div>
                
                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-70 uppercase tracking-wider text-xs"
                >
                  {isSavingSettings ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-zinc-900/90 backdrop-blur-sm flex justify-center items-center p-4 print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="bg-white text-zinc-900 w-full max-w-md p-8 rounded-2xl shadow-2xl print:shadow-none print:w-full print:max-w-full print:p-8">
            
            <div className="text-center mb-6 border-b-2 border-slate-200 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-wider mb-1">{appSettings.appName || 'Club de Voleibol'}</h2>
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Comprobante de Pago</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-zinc-500 text-sm font-medium">Fecha:</span>
                <span className="font-bold text-sm">
                  {receiptToPrint.createdAt ? format(receiptToPrint.createdAt.toDate(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es }) : format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-zinc-500 text-sm font-medium">Recibí de:</span>
                <span className="font-bold text-sm">{receiptToPrint.userName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-zinc-500 text-sm font-medium">Por concepto de:</span>
                <span className="font-bold text-sm">{receiptToPrint.concept}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-zinc-500 text-sm font-medium">Monto Total:</span>
                <span className="font-black text-xl tracking-tight">S/ {Number(receiptToPrint.amount).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-12 flex justify-between items-end">
              <div className="text-center w-40">
                <div className="border-t-2 border-zinc-300 pt-2 text-xs font-bold uppercase text-zinc-500">
                  Firma Autorizada
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 font-mono">ID: {receiptToPrint.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
