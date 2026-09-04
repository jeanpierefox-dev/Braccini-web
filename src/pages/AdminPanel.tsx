import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, MediaItem, MediaCategory, UserRole, Payment, ClubSettings, ThemeMode, ClubComment, UniformOrder, MonthlyFeeRecord } from '../types';
import { AdminSettingsTab } from '../components/AdminSettingsTab';
import { AdminUsersTab } from '../components/AdminUsersTab';
import { AdminMediaTab } from '../components/AdminMediaTab';
import { Upload, Trash2, Shield, User as UserIcon, LayoutTemplate, Activity, Settings, Wallet, Printer, Plus, Palette, Eye, Smartphone, CheckCircle, Megaphone, Trophy, Sparkles, RefreshCw, Phone, Mail, MapPin, Instagram, Facebook, FileText, MessageSquare, Star, CornerDownRight, ShieldCheck, Filter, Check, Send, Building2, AlertCircle, Shirt, FileDown, FileSpreadsheet, Layers, X, Edit2, Edit3, DollarSign, CheckSquare } from "lucide-react";

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFeeRecord[]>([]);
  const [uniformOrders, setUniformOrders] = useState<UniformOrder[]>([]);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedUniformBatch, setSelectedUniformBatch] = useState('Todos los Lotes');
  const [pageViews, setPageViews] = useState(0);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    const unsubFees = onSnapshot(collection(db, 'monthly_fees'), (snap) => {
      setMonthlyFees(snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyFeeRecord)));
    });
    const unsubUniforms = onSnapshot(collection(db, 'uniform_orders'), (snap) => {
      setUniformOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as UniformOrder)));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'club_profile'), (doc) => {
      if (doc.exists() && doc.data().pageViews) {
        setPageViews(doc.data().pageViews);
      }
    });

    return () => {
      unsubUsers();
      unsubFees();
      unsubUniforms();
      unsubSettings();
    };
  }, []);

  const handleDeleteUniformBatch = async (batchName: string) => {
    if (batchName === 'Todos los Lotes') return;
    if (!confirm(`¿Estás seguro de que deseas ELIMINAR todo el lote "${batchName}" y todos sus pedidos? Esta acción no se puede deshacer.`)) return;
    try {
      const batchOrders = uniformOrders.filter(o => o.batchName === batchName);
      for (const order of batchOrders) {
        if (order.id) {
          await deleteDoc(doc(db, 'uniform_orders', order.id));
        }
      }
      setSelectedUniformBatch('Todos los Lotes');
    } catch (err) {
      console.error(err);
      alert('Error al eliminar lote');
    }
  };

  const batches = ['Todos los Lotes', ...Array.from(new Set(uniformOrders.map(o => o.batchName)))].filter(Boolean);
  const athletesCount = users.filter(u => u.clubRole === 'jugador').length;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 lg:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-emerald-500" /> Panel de Administración
        </h1>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <h3 className="text-zinc-400 text-sm">Total Usuarios</h3>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <h3 className="text-zinc-400 text-sm">Total Atletas (Jugadores)</h3>
            <p className="text-2xl font-bold">{athletesCount}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <h3 className="text-zinc-400 text-sm">Visitas a la Página</h3>
            <p className="text-2xl font-bold">{pageViews}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-zinc-800 pb-2">
          {['settings', 'finances', 'uniforms', 'media', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-400'}`}
            >
              {tab === 'settings' ? 'Configuración' : tab === 'finances' ? 'Mensualidades' : tab === 'uniforms' ? 'Uniformes' : tab === 'media' ? 'Biblioteca' : 'Usuarios'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
                {activeTab === 'settings' && <AdminSettingsTab />}
        
        {activeTab === 'finances' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <h2 className="text-xl font-bold">Control de Mensualidades</h2>
              <button
                onClick={() => setShowMatrixModal(true)}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700 transition-colors shadow-lg"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Matriz Rápida de Pagos</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'uniforms' && (
          <div className="space-y-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <h2 className="text-xl font-bold">Control de Uniformes</h2>
            <div className="flex items-center gap-4">
              <select 
                value={selectedUniformBatch}
                onChange={(e) => setSelectedUniformBatch(e.target.value)}
                className="bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white"
              >
                {batches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {selectedUniformBatch !== 'Todos los Lotes' && (
                <button
                  type="button"
                  onClick={() => handleDeleteUniformBatch(selectedUniformBatch)}
                  className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors"
                >
                  Eliminar Lote
                </button>
              )}
            </div>
            
            {/* List Uniforms */}
            <div className="space-y-2 mt-4">
              {uniformOrders.filter(o => selectedUniformBatch === 'Todos los Lotes' || o.batchName === selectedUniformBatch).map(order => (
                <div key={order.id} className="bg-black p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{order.userName} - {order.itemType || order.type}</p>
                    <p className="text-xs text-zinc-400">Talla: {order.size} | Número: {order.number || order.jerseyNumber}</p>
                  </div>
                  <div className="text-xs text-zinc-500">{order.batchName}</div>
                </div>
              ))}
              {uniformOrders.length === 0 && <p className="text-zinc-500">No hay pedidos de uniformes.</p>}
            </div>
          </div>
        )}

        {activeTab === 'media' && <AdminMediaTab />}
        {activeTab === 'users' && <AdminUsersTab />}
      </div>

      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden relative my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky top-0 z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <CheckSquare className="w-7 h-7 text-emerald-500" />
                Matriz Rápida de Pagos
              </h2>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-900/80 sticky top-0 z-10 shadow-sm backdrop-blur-md">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 w-64 bg-zinc-900/80">Jugador</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 w-32 bg-zinc-900/80 text-center">Categoría</th>
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(m => (
                      <th key={m} className="px-3 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 text-center bg-zinc-900/80">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {users.filter(u => u.clubRole === 'jugador' && !u.isFeeExempt).map(u => (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">{u.name || u.email}</td>
                      <td className="px-5 py-3 text-zinc-400 whitespace-nowrap text-center text-[11px]">{u.category || 'N/A'}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                        const monthStr = String(m).padStart(2, '0');
                        const monthPeriod = `${new Date().getFullYear()}-${monthStr}`;
                        
                        const fee = monthlyFees.find(f => f.userId === u.id && f.monthPeriod === monthPeriod);
                        const isPaid = fee?.status === 'paid' || fee?.status === 'al_dia';
                        
                        return (
                          <td key={m} className="px-3 py-3 text-center border-l border-zinc-800/30">
                            <button
                              onClick={async () => {
                                try {
                                  if (fee) {
                                    // toggle
                                    await updateDoc(doc(db, 'monthly_fees', fee.id!), {
                                      status: isPaid ? 'pending' : 'paid',
                                      paidAt: isPaid ? null : serverTimestamp()
                                    });
                                  } else {
                                    // create new paid fee
                                    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                    await addDoc(collection(db, 'monthly_fees'), {
                                      userId: u.id,
                                      userName: u.name || u.email,
                                      userCategory: u.category || '',
                                      category: u.category || '',
                                      month: monthNames[m-1],
                                      year: new Date().getFullYear(),
                                      monthPeriod: monthPeriod,
                                      monthName: `${monthNames[m-1]} ${new Date().getFullYear()}`,
                                      amount: 100,
                                      status: 'paid',
                                      paidAt: serverTimestamp(),
                                      createdAt: serverTimestamp()
                                    });
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-all ${isPaid ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 border border-zinc-700 text-transparent hover:border-emerald-500 hover:bg-zinc-800'}`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
