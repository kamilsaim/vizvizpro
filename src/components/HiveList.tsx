import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Hive, HiveStatus, QueenBreed, QueenLineage, HiveQueenStatus } from '../types';
import { Plus, Search, Loader2, X, Trash2, Edit2, Box, Calendar, Shield, Droplets, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, getQueenColor } from '../lib/utils';

interface HiveListProps {
  user: User;
}

export default function HiveList({ user }: HiveListProps) {
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const initialForm = {
    code: '',
    status: 'gelişim' as HiveStatus,
    breed: 'Anadolu' as QueenBreed,
    lineage: 'F1' as QueenLineage,
    queenStatus: 'Bakire' as HiveQueenStatus,
    queenYear: new Date().getFullYear(),
    population: 5,
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const q = query(collection(db, 'hives'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hive[]);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'hives'));
    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'hives', editingId), { ...formData, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, 'hives'), {
          ...formData,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'hives');
    }
  };

  const startEdit = (hive: Hive) => {
    setEditingId(hive.id);
    setFormData({
      code: hive.code,
      status: hive.status,
      breed: hive.breed || 'Anadolu',
      lineage: hive.lineage || 'F1',
      queenStatus: hive.queenStatus || 'Bakire',
      queenYear: hive.queenYear || new Date().getFullYear(),
      population: hive.population || 5,
      notes: hive.notes || ''
    });
    setIsAdding(true);
  };

  const filteredHives = hives.filter(h => 
    h.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Arılık Yönetimi</h2>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsAdding(true); }} className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-200">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Kovan ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-3xl outline-none shadow-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : (
        <div className="grid gap-4">
          {filteredHives.map((hive) => {
            const color = getQueenColor(hive.queenYear || 0);
            return (
              <motion.div key={hive.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-lg border border-slate-100">{hive.code}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{hive.status.toUpperCase()}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-black tracking-tighter uppercase",
                          hive.lineage === 'Saf' ? "bg-red-100 text-red-600 font-black" : 
                          hive.lineage === 'F1' ? "bg-blue-100 text-blue-600" : 
                          "bg-slate-100 text-slate-600"
                        )}>
                          {hive.lineage}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Irk: {hive.breed} • {hive.population} Çerçeve</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-amber-600 mb-1">{hive.queenStatus}</p>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => startEdit(hive)} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async () => { if(confirm('Sil?')) await deleteDoc(doc(db, 'hives', hive.id)) }} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className={cn("p-2 rounded-xl flex flex-col items-center justify-center border", color.class)}>
                    <span className="text-[8px] font-bold uppercase opacity-60">Ana Arı Rengi</span>
                    <span className="text-xs font-bold">{color.name} ({hive.queenYear})</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Droplets className="w-2 h-2" /> Son Besleme</span>
                    <span className="text-[10px] font-bold text-slate-700">{hive.lastFeedingDate ? formatDate(hive.lastFeedingDate) : '-'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Shield className="w-2 h-2" /> Son İlaç</span>
                    <span className="text-[10px] font-bold text-slate-700">{hive.lastMedicationDate ? formatDate(hive.lastMedicationDate) : '-'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Kovan Yaşı</span>
                    <span className="text-[10px] font-bold text-slate-700">{new Date().getFullYear() - (hive.queenYear || 0)} Yaşında</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAdding(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{editingId ? 'Kovan Düzenle' : 'Yeni Kovan Ekle'}</h3>
                <button onClick={() => setIsAdding(false)}><X className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Kovan No</label>
                    <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Popülasyon (Çer)</label>
                    <input type="number" value={formData.population || 0} onChange={e => setFormData({...formData, population: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Irk</label>
                    <select value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      {['Anadolu', 'Karniyol', 'Belfast', 'Kafkas', 'Muğla', 'Karpat', 'Belit', 'Karma'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Kuşak</label>
                    <select value={formData.lineage} onChange={e => setFormData({...formData, lineage: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      {['Saf', 'F1', 'F2', 'Karma'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ana Arı Durumu</label>
                    <select value={formData.queenStatus} onChange={e => setFormData({...formData, queenStatus: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                        <option value="Ana Arısız">Ana Arısız</option>
                        <option value="Meme Var">Meme Var</option>
                        <option value="Bakire">Bakire</option>
                        <option value="Çiftleşmemiş/Uçuşta">Çiftleşmemiş/Uçuşta</option>
                        <option value="Çiftleşmiş (Yumurtlayan)">Çiftleşmiş (Yumurtlayan)</option>
                        <option value="Yaşlı/Değiştirilecek">Yaşlı/Değiştirilecek</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ana Arı Yılı</label>
                    <input type="number" value={formData.queenYear || 0} onChange={e => setFormData({...formData, queenYear: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Kovan Durumu</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                       <option value="aktif">Aktif</option>
                       <option value="gelişim">Gelişim</option>
                       <option value="bölme">Bölme</option>
                       <option value="ana_ari_kutusu">Ana Arı Kutusu</option>
                       <option value="pasif">Pasif</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className={cn("w-4 h-4 rounded-full", getQueenColor(formData.queenYear).class)} />
                     <span className="text-sm font-bold text-slate-700">İşaret Rengi: {getQueenColor(formData.queenYear).name}</span>
                   </div>
                   <Info className="w-4 h-4 text-slate-300" />
                </div>

                <button type="submit" className="w-full bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-amber-100 transition-all active:scale-95">Kovanı Kaydet</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
