import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Sale, SaleType, Stock } from '../types';
import { Plus, Search, Loader2, X, ShoppingBag, Trash2, TrendingUp, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

interface SaleListProps {
  user: User;
}

export default function SaleList({ user }: SaleListProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    type: 'bal' as SaleType,
    productName: '',
    quantity: 1,
    unit: 'adet' as any,
    price: 0,
    customerInfo: '',
    date: format(new Date(), 'yyyy-MM-dd')
  };

  const [formData, setFormData] = useState(initialForm);
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'sales'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
      setSales(data.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales'));
    return () => unsubscribe();
  }, [user.uid]);

  // Fetch stocks for selection
  useEffect(() => {
    const q = query(collection(db, 'stocks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Stock[]);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trimmedProductName = formData.productName.trim();
      
      if (editingId) {
        // Revert old stock if quantity or product changed
        const oldSale = sales.find(s => s.id === editingId);
        if (oldSale) {
          await adjustStock(oldSale.productName.trim(), oldSale.quantity, 'add');
        }
        
        await updateDoc(doc(db, 'sales', editingId), {
          ...formData,
          productName: trimmedProductName
        });
        
        // Apply new stock deduction
        await adjustStock(trimmedProductName, formData.quantity, 'subtract');
      } else {
        await addDoc(collection(db, 'sales'), {
          ...formData,
          productName: trimmedProductName,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });

        // Deduct from Stock
        await adjustStock(trimmedProductName, formData.quantity, 'subtract');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    }
  };

  const adjustStock = async (productName: string, quantity: number, mode: 'add' | 'subtract') => {
    if (!productName) return;
    
    try {
      // Find the stock item (case insensitive would be better but let's stick to exact for consistency)
      const stockQ = query(
        collection(db, 'stocks'), 
        where('userId', '==', user.uid),
        where('productName', '==', productName)
      );
      const stockSnapshot = await getDocs(stockQ);
      
      if (!stockSnapshot.empty) {
        const stockDoc = stockSnapshot.docs[0];
        const stockData = stockDoc.data() as Stock;
        const newQuantity = mode === 'add' 
          ? stockData.quantity + quantity 
          : Math.max(0, stockData.quantity - quantity);
          
        await updateDoc(doc(db, 'stocks', stockDoc.id), {
          quantity: newQuantity,
          updatedAt: new Date().toISOString()
        });
        console.log(`Stock adjusted for ${productName}: ${newQuantity}`);
      } else {
        console.warn(`No matching stock found for: ${productName}`);
      }
    } catch (error) {
      console.error('Stock adjustment error:', error);
    }
  };

  const startEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      type: sale.type,
      productName: sale.productName || '',
      quantity: sale.quantity,
      unit: sale.unit,
      price: sale.price,
      customerInfo: sale.customerInfo || '',
      date: sale.date
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;
    try {
      const saleToDelete = sales.find(s => s.id === id);
      if (saleToDelete) {
        await adjustStock(saleToDelete.productName, saleToDelete.quantity, 'add');
      }
      await deleteDoc(doc(db, 'sales', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
    }
  };

  const totalIncome = sales.reduce((acc, curr) => acc + (Number(curr.price || 0) * Number(curr.quantity || 0)), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Satış Kayıtları</h2>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsAdding(true); }} className="bg-green-600 text-white p-3 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-green-600 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-green-100 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-green-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Toplam Gelir</p>
          <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="p-4 bg-green-500 rounded-[1.5rem] relative z-10">
          <TrendingUp className="w-8 h-8" />
        </div>
        <ShoppingBag className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 rotate-12" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2rem]">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Henüz bir satış kaydı bulunmuyor</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {sales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tighter">{sale.productName || sale.type.replace('_', ' ').toUpperCase()}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(sale.date)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{sale.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-black text-slate-900 tracking-tighter">{formatCurrency(sale.price * sale.quantity)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.quantity} {sale.unit}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => startEdit(sale)} className="p-1.5 text-slate-200 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(sale.id)} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {sale.customerInfo && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{sale.customerInfo}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Satışı Düzenle' : 'Yeni Satış'}</h3>
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
                        onClick={() => setFormData({ ...formData, type: t.id as SaleType, productName: formData.productName || t.label })}
                        className={cn(
                          "py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          formData.type === t.id ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ürün Detayı</label>
                  <input
                    type="text" required
                    value={formData.productName}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Örn: Süzme Çiçek Balı"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                  
                  {stocks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mevcut Stoktan Seç:</p>
                      <div className="flex flex-wrap gap-2">
                        {stocks.map(stock => (
                          <button
                            key={stock.id}
                            type="button"
                            onClick={() => setFormData({ 
                              ...formData, 
                              productName: stock.productName, 
                              unit: stock.unit,
                              type: stock.category
                            })}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                              formData.productName === stock.productName 
                                ? "bg-amber-100 border-amber-200 text-amber-700" 
                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            {stock.productName} ({stock.quantity} {stock.unit})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birim Fiyat (TL)</label>
                  <input
                    type="number" required min="0"
                    value={formData.price || 0}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Müşteri / Not</label>
                  <input
                    type="text"
                    value={formData.customerInfo}
                    onChange={e => setFormData({ ...formData, customerInfo: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İşlem Tarihi</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                </div>

                <button type="submit" className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-green-100 transition-all active:scale-95 mt-4">
                  {editingId ? 'Güncelle' : 'Satışı Kaydet'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
