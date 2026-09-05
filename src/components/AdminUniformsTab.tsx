import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UniformOrder } from '../types';
import { Trash2, Edit2, Plus, X, Loader2, Save, Shirt, Download, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export function AdminUniformsTab() {
  const [uniformOrders, setUniformOrders] = useState<UniformOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = useSettings();
  const primaryColor = settings.primaryColor || '#10b981';

  const [selectedBatch, setSelectedBatch] = useState<string>('Todos');
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Partial<UniformOrder>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'uniform_orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: UniformOrder[] = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() } as UniformOrder);
      });
      setUniformOrders(orders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const batches = Array.from(new Set(uniformOrders.map(o => o.batchName))).filter(Boolean);

  const handleEdit = (order: UniformOrder) => {
    setCurrentOrder(order);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentOrder({
      userName: '',
      jerseyName: '',
      jerseyNumber: '',
      size: 'M',
      itemType: 'Completo',
      paymentStatus: 'Pendiente',
      batchName: batches.length > 0 ? batches[0] : 'Lote 1',
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este pedido?')) {
      try {
        await deleteDoc(doc(db, 'uniform_orders', id));
      } catch (e) {
        console.error("Error al eliminar", e);
      }
    }
  };

  const handleDeleteBatch = async (batchName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar TODO el ${batchName}?`)) {
      try {
        const batchOrders = uniformOrders.filter(o => o.batchName === batchName);
        for (const order of batchOrders) {
          if (order.id) await deleteDoc(doc(db, 'uniform_orders', order.id));
        }
        setSelectedBatch('Todos');
      } catch (e) {
        console.error("Error deleting batch", e);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...currentOrder,
        type: currentOrder.itemType, // legacy support
        number: currentOrder.jerseyNumber, // legacy support
        updatedAt: serverTimestamp()
      };

      if (currentOrder.id) {
        await updateDoc(doc(db, 'uniform_orders', currentOrder.id), payload);
      } else {
        await addDoc(collection(db, 'uniform_orders'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      // Auto select the batch we just saved to
      if (currentOrder.batchName) setSelectedBatch(currentOrder.batchName);
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error al guardar pedido");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const toExport = selectedBatch === 'Todos' ? uniformOrders : uniformOrders.filter(o => o.batchName === selectedBatch);
    if (toExport.length === 0) return;
    
    const headers = ['Lote', 'Jugador', 'Nombre Camiseta', 'Numero', 'Talla', 'Tipo', 'Estado Pago'];
    const rows = toExport.map(o => [
      o.batchName || '',
      o.userName || '',
      o.jerseyName || '',
      o.jerseyNumber || o.number || '',
      o.size || '',
      o.itemType || o.type || '',
      o.paymentStatus || ''
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_uniformes_${selectedBatch.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = selectedBatch === 'Todos' 
    ? uniformOrders 
    : uniformOrders.filter(o => o.batchName === selectedBatch);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4 bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shirt className="w-5 h-5 text-amber-500" /> Pedidos y Lotes de Uniformes
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="bg-zinc-800 text-white border border-zinc-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button
            onClick={handleAddNew}
            className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </div>

      {!isEditing && (
        <div className="flex items-center gap-4 py-2">
          <label className="text-sm font-bold text-zinc-400">Filtrar por Lote:</label>
          <select 
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="Todos">Todos los Lotes</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          
          {selectedBatch !== 'Todos' && (
            <button
              onClick={() => handleDeleteBatch(selectedBatch)}
              className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg border border-red-500/30 transition-colors ml-auto"
            >
              Eliminar {selectedBatch} Completo
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-black p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4">
            <h3 className="font-bold text-lg">{currentOrder.id ? 'Editar Pedido' : 'Crear Pedido'}</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre del Jugador</label>
              <input 
                type="text" 
                value={currentOrder.userName || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, userName: e.target.value})}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre en Camiseta</label>
              <input 
                type="text" 
                value={currentOrder.jerseyName || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, jerseyName: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Número</label>
              <input 
                type="text" 
                value={currentOrder.jerseyNumber || currentOrder.number || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, jerseyNumber: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Talla</label>
              <select 
                value={currentOrder.size || 'M'} 
                onChange={(e) => setCurrentOrder({...currentOrder, size: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="4">4 (Niño)</option>
                <option value="6">6 (Niño)</option>
                <option value="8">8 (Niño)</option>
                <option value="10">10 (Niño)</option>
                <option value="12">12 (Niño)</option>
                <option value="14">14 (Niño)</option>
                <option value="16">16 (Niño)</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo de Pedido</label>
              <select 
                value={currentOrder.itemType || currentOrder.type || 'Completo'} 
                onChange={(e) => setCurrentOrder({...currentOrder, itemType: e.target.value as any})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Completo">Completo (Polo + Short)</option>
                <option value="Solo Polo">Solo Polo</option>
                <option value="Solo Short">Solo Short</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Control de Pago</label>
              <select 
                value={currentOrder.paymentStatus || 'Pendiente'} 
                onChange={(e) => setCurrentOrder({...currentOrder, paymentStatus: e.target.value as any})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Abono a Cuenta">Abono a Cuenta</option>
                <option value="Pagado">Pagado Total</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Lote (Agrupación)</label>
              <input 
                type="text" 
                value={currentOrder.batchName || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, batchName: e.target.value})}
                placeholder="Ej. Lote 1, Torneo Verano..."
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-amber-500 text-black px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Pedido
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-4">
              <div className="col-span-2">Jugador</div>
              <div>Camiseta</div>
              <div>Detalle</div>
              <div>Lote</div>
              <div>Pago</div>
              <div className="text-right">Acciones</div>
            </div>
            
            <div className="space-y-2">
              {filteredOrders.map(o => (
                <div key={o.id} className="bg-black p-4 rounded-xl border border-zinc-800 grid grid-cols-7 gap-4 items-center">
                  <div className="col-span-2 font-bold text-white text-sm truncate">
                    {o.userName}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase">{o.jerseyName || '-'}</div>
                    <div className="text-xs text-zinc-400">N° {o.jerseyNumber || o.number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300">{o.itemType || o.type}</div>
                    <div className="text-xs text-zinc-500">Talla: {o.size}</div>
                  </div>
                  <div>
                    <span className="text-xs bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{o.batchName}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                      o.paymentStatus === 'Pagado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                      o.paymentStatus === 'Abono a Cuenta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {o.paymentStatus || 'Pendiente'}
                    </span>
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(o)} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(o.id!)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div className="p-8 text-center text-zinc-500 bg-black rounded-xl border border-dashed border-zinc-800">
                  No hay pedidos de uniformes en este lote.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
