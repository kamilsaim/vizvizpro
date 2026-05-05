import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Feeding, Hive } from '../types';
import { Plus, Loader2, X, Wallet, Trash2, Edit2, Info, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { format } from 'date-fns';

interface FeedingListProps {
  user: User;
}

export default function FeedingList({ user }: FeedingListProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Şerbet' as any,
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const qFeedings = query(collection(db, 'feedings'), where('userId', '==', user.uid));
    const unsubscribeFeedings = onSnapshot(qFeedings, (snapshot) => {
      setFeedings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feeding[]);
      setLoading(false);
    });

    const qHives = query(collection(db, 'hives'), where('userId', '==', user.uid));
    const unsubscribeHives = onSnapshot(qHives, (snapshot) => {
      setHives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hive[]);
    });

    return () => {
      unsubscribeFeedings();
      unsubscribeHives();
    };
  }, [user.uid]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedHiveIds([]);
    } else {
      setSelectedHiveIds(hives.map(h => h.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleHiveSelection = (id: string) => {
    setSelectedHiveIds(prev => 
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHiveIds.length === 0) {
      alert('Lütfen en az bir kovan seçiniz.');
      return;
    }

    try {
      const batch = writeBatch(db);
      
      selectedHiveIds.forEach(hiveId => {
        const feedingRef = doc(collection(db, 'feedings'));
        batch.set(feedingRef, {
          ...formData,
          hiveId,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });

        const hiveRef = doc(db, 'hives', hiveId);
        batch.update(hiveRef, {
          lastFeedingDate: formData.date
        });
      });

      await batch.commit();
      setIsAdding(false);
      setSelectedHiveIds([]);
      setSelectAll(false);
      setFormData({ type: 'Şerbet', amount: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'feedings_batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Besleme Kayıtları</h2>
        <button onClick={() => setIsAdding(true)} className="bg-amber-600 text-white flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg shadow-amber-200 font-bold active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
          Kayıt Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : feedings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-500 font-medium">Besleme kaydı bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedings.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((f) => (
            <div key={f.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-slate-900">{hives.find(h => h.id === f.hiveId)?.code || '-'} Kovan Beslemesi</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold uppercase tracking-tighter">{f.type}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{formatDate(f.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-slate-700 text-sm">{f.amount}</p>
                <button onClick={async () => {
                   if(confirm('Sil?')) await deleteDoc(doc(db, 'feedings', f.id));
                }} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Besleme Kaydı (Toplu)</h3>
                <button onClick={() => setIsAdding(false)}><X className="text-slate-400" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex flex-col min-h-0">
                <div className="space-y-3 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-bold text-slate-700">Kovan Seçimi ({selectedHiveIds.length})</label>
                        <button type="button" onClick={toggleSelectAll} className="text-xs font-bold text-amber-600">
                            {selectAll ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-2 pb-2">
                        {hives.map(hive => (
                            <button
                                key={hive.id}
                                type="button"
                                onClick={() => toggleHiveSelection(hive.id)}
                                className={cn(
                                    "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1",
                                    selectedHiveIds.includes(hive.id) 
                                        ? "bg-amber-600 border-amber-600 text-white" 
                                        : "bg-slate-50 border-slate-100 text-slate-400"
                                )}
                            >
                                {selectedHiveIds.includes(hive.id) && <Check className="w-3 h-3" />}
                                {hive.code}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Besin Türü</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 outline-none text-sm font-medium">
                            <option value="Şerbet">Şerbet</option>
                            <option value="Kek">Kek</option>
                            <option value="Fondan">Fondan</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Miktar</label>
                        <input type="text" placeholder="Örn: 2L" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 outline-none text-sm font-medium" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tarih</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 outline-none text-sm font-medium" />
                </div>

                <button type="submit" disabled={selectedHiveIds.length === 0} className="w-full bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-amber-100 disabled:opacity-50 transition-all active:scale-95">
                    {selectedHiveIds.length} Kovan İçin Kaydet
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
