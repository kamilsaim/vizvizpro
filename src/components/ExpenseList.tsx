import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Expense } from '../types';
import { Plus, Loader2, X, Wallet, Trash2, ReceiptText, Edit2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

interface ExpenseListProps {
  user: User;
}

export default function ExpenseList({ user }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    description: '',
    amount: 0,
    category: 'Yem',
    date: format(new Date(), 'yyyy-MM-dd')
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(data.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));
    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'expenses', editingId), formData);
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...formData,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu harcamayı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const categories = ['Yem', 'İlaç', 'Ekipman', 'Nakliye', 'İşçilik', 'Diğer'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Gider Kayıtları</h2>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsAdding(true); }} className="bg-red-500 text-white p-3 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-red-500 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-red-100 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-red-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Toplam Harcama</p>
          <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(totalExpense)}</h3>
        </div>
        <div className="p-4 bg-red-400 rounded-[1.5rem] relative z-10">
          <Wallet className="w-8 h-8" />
        </div>
        <ReceiptText className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 rotate-12" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2rem]">
          <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Henüz bir harcama kaydı bulunmuyor</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                      <ReceiptText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 tracking-tighter truncate md:max-w-xs">{expense.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(expense.date)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{expense.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className="font-black text-slate-900 tracking-tighter">{formatCurrency(expense.amount)}</p>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => startEdit(expense)} className="p-1.5 text-slate-200 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
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
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingId ? 'Gideri Düzenle' : 'Yeni Gider'}</h3>
                <button onClick={() => setIsAdding(false)} className="p-2"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c} type="button"
                        onClick={() => setFormData({ ...formData, category: c })}
                        className={cn(
                          "py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          formData.category === c ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-100" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gider Açıklaması</label>
                  <input
                    type="text" required
                    placeholder="Örn: 20 KG şurupluk şeker"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tutar (TL)</label>
                  <input
                    type="number" required min="0" step="0.01"
                    value={formData.amount || 0}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
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

                <button type="submit" className="w-full bg-red-500 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-red-100 transition-all active:scale-95 mt-4">
                  {editingId ? 'Güncelle' : 'Gideri Kaydet'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
