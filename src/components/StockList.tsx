import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Stock, SaleType } from '../types';
import { Plus, Loader2, X, Package, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

interface StockListProps {
  user: User;
  isDashboardView?: boolean;
}

export default function StockList({ user, isDashboardView = false }: StockListProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    productName: '',
    quantity: 0,
    unit: 'adet' as any,
    category: 'bal' as SaleType
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const q = query(collection(db, 'stocks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Stock[];
      setStocks(data.sort((a, b) => a.productName.localeCompare(b.productName)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'stocks'));
    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'stocks', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'stocks'), {
          ...formData,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stocks');
    }
  };

  const startEdit = (stock: Stock) => {
    setEditingId(stock.id);
    setFormData({
      productName: stock.productName,
      quantity: stock.quantity,
      unit: stock.unit,
      category: stock.category
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu stok kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'stocks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stocks/${id}`);
    }
  };

  if (loading && !isDashboardView) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className={cn("font-black text-slate-800 tracking-tighter flex items-center gap-2", isDashboardView ? "text-xl" : "text-2xl")}>
          <Package className="w-6 h-6 text-amber-600" />
          Mevcut Stok Durumu
        </h2>
        {!isDashboardView && (
          <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsAdding(true); }} className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {stocks.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-[2rem]">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Stokta ürün bulunmuyor</p>
        </div>
      ) : (
        <div className={cn("grid gap-4", isDashboardView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {stocks.map((stock) => (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    stock.quantity <= 5 ? "bg-red-500 shadow-red-100" : "bg-amber-500 shadow-amber-100"
                  )}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tighter">{stock.productName}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stock.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className={cn(
                      "text-2xl font-black tracking-tighter",
                      stock.quantity <= 0 ? "text-red-500" : "text-slate-900"
                    )}>
                      {stock.quantity}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stock.unit}</p>
                  </div>
                  {!isDashboardView && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => startEdit(stock)} className="p-1.5 text-slate-200 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(stock.id)} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
              {stock.quantity <= 5 && stock.quantity > 0 && (
                <div className="mt-4 flex items-center gap-2 text-red-500 px-3 py-2 bg-red-50 rounded-xl">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Kritik Stok Seviyesi!</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Stoğu Düzenle' : 'Yeni Stok Ekle'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'bal', label: 'Bal' },
                      { id: 'ana_ari', label: 'Ana Arı' },
                      { id: 'ari_kolonisi', label: 'Arı Kolonisi' },
                      { id: 'diger', label: 'Diğer' }
                    ].map((t) => (
                      <button
                        key={t.id} type="button"
                        onClick={() => setFormData({ ...formData, category: t.id as SaleType })}
                        className={cn(
                          "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          formData.category === t.id ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ürün Adı</label>
                  <input
                    type="text" required
                    placeholder="Örn: Süzme Çiçek Balı"
                    value={formData.productName}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miktar</label>
                    <input
                      type="number" required min="0" step="0.1"
                      value={formData.quantity || 0}
                      onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birim</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm appearance-none"
                    >
                      <option value="adet">Adet</option>
                      <option value="kg">KG</option>
                      <option value="plaka">Plaka</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-amber-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-amber-100 transition-all active:scale-95 mt-4">
                  {editingId ? 'Güncelle' : 'Stoğu Kaydet'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
