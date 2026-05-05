import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Hive, HiveStatus, QueenBreed, QueenLineage, HiveQueenStatus } from '../types';
import { Plus, Search, Loader2, X, Trash2, Edit2, Box, Calendar, Shield, Droplets, Info, AlertCircle, Sparkle, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, getQueenColor } from '../lib/utils';
import HiveDetail from './HiveDetail';

interface HiveListProps {
  user: User;
}

export default function HiveList({ user }: HiveListProps) {
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [queenStatusFilter, setQueenStatusFilter] = useState<HiveQueenStatus | 'Hepsi'>('Hepsi');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'code'>('date-desc');
  const [selectedHiveForDetail, setSelectedHiveForDetail] = useState<Hive | null>(null);
  
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

  const filteredHives = hives
    .filter(h => {
      const matchesSearch = 
        h.code.toLowerCase().includes(search.toLowerCase()) ||
        (h.breed && h.breed.toLowerCase().includes(search.toLowerCase())) ||
        (h.lineage && h.lineage.toLowerCase().includes(search.toLowerCase()));
      const matchesQueenStatus = queenStatusFilter === 'Hepsi' || h.queenStatus === queenStatusFilter;
      return matchesSearch && matchesQueenStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

  const queenStatusOptions: (HiveQueenStatus | 'Hepsi')[] = [
    'Hepsi',
    'Ana Arısız',
    'Meme Var',
    'Bakire',
    'Çiftleşmemiş/Uçuşta',
    'Çiftleşmiş (Yumurtlayan)',
    'Yaşlı/Değiştirilecek'
  ];

  const getQueenStatusStyles = (status?: HiveQueenStatus) => {
    switch (status) {
      case 'Ana Arısız':
        return { 
          bg: 'bg-slate-50', 
          border: 'border-slate-200', 
          text: 'text-slate-600',
          badge: 'bg-slate-500',
          iconColor: 'text-slate-500'
        };
      case 'Meme Var':
        return { 
          bg: 'bg-amber-50', 
          border: 'border-amber-200', 
          text: 'text-amber-600',
          badge: 'bg-amber-600',
          iconColor: 'text-amber-500'
        };
      case 'Bakire':
      case 'Çiftleşmemiş/Uçuşta':
        return { 
          bg: 'bg-blue-50', 
          border: 'border-blue-200', 
          text: 'text-blue-600',
          badge: 'bg-blue-600',
          iconColor: 'text-blue-500'
        };
      case 'Çiftleşmiş (Yumurtlayan)':
        return { 
          bg: 'bg-green-50', 
          border: 'border-green-200', 
          text: 'text-green-600',
          badge: 'bg-green-600',
          iconColor: 'text-green-500'
        };
      case 'Yaşlı/Değiştirilecek':
        return { 
          bg: 'bg-purple-50', 
          border: 'border-purple-200', 
          text: 'text-purple-600',
          badge: 'bg-purple-600',
          iconColor: 'text-purple-500'
        };
      default:
        return { 
          bg: 'bg-white', 
          border: 'border-slate-100', 
          text: 'text-slate-600',
          badge: 'bg-slate-600',
          iconColor: 'text-slate-400'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Arılık Yönetimi</h2>
        <button onClick={() => { setEditingId(null); setFormData(initialForm); setIsAdding(true); }} className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-200">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Kovan ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-3xl outline-none shadow-sm" />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewLayout('grid')}
            className={cn("p-2 rounded-xl transition-all", viewLayout === 'grid' ? "bg-amber-100 text-amber-600 shadow-sm" : "text-slate-400")}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewLayout('list')}
            className={cn("p-2 rounded-xl transition-all", viewLayout === 'list' ? "bg-amber-100 text-amber-600 shadow-sm" : "text-slate-400")}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 flex-1 no-scrollbar">
          {queenStatusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setQueenStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                queenStatusFilter === status 
                  ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none shadow-sm"
        >
          <option value="date-desc">En Yeni</option>
          <option value="date-asc">En Eski</option>
          <option value="code">Kovan No</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : (
        <div className={cn(
            "grid gap-4 transition-all",
            viewLayout === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
        )}>
          {filteredHives.map((hive) => {
            const color = getQueenColor(hive.queenYear || 0);
            const statusStyles = getQueenStatusStyles(hive.queenStatus);
            
            if (viewLayout === 'grid') {
              return (
                <motion.div 
                  key={hive.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "relative p-4 rounded-3xl border shadow-sm flex flex-col items-center text-center gap-3 transition-all aspect-square justify-center group overflow-hidden cursor-pointer hover:shadow-md",
                    statusStyles.bg,
                    statusStyles.border
                  )}
                  onClick={() => setSelectedHiveForDetail(hive)}
                >
                  <div 
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl border transition-colors shadow-sm",
                      hive.queenStatus === 'Ana Arısız' ? "bg-slate-300 border-slate-400 text-slate-700" : 
                      (color.hex === '#FFFFFF' || color.hex === '#FACC15' ? "text-slate-800" : "text-white")
                    )}
                    style={hive.queenStatus !== 'Ana Arısız' ? { backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#e2e8f0' : color.hex } : {}}
                  >
                    {hive.code}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">{hive.code} - {hive.status.toUpperCase()}</h4>
                    <div className="flex flex-col gap-1 items-center">
                       <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm",
                        statusStyles.badge
                      )}>
                        {hive.queenStatus}
                      </div>
                      <div className="flex gap-1">
                         <span className="text-[7px] font-bold text-slate-500 uppercase bg-slate-100 px-1 rounded">{hive.breed} {hive.lineage}</span>
                         <span className="text-[7px] font-bold text-amber-600 bg-amber-50 px-1 rounded">{hive.population} ÇR</span>
                      </div>
                    </div>
                  </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity z-10">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(hive); }} className="p-1.5 bg-white shadow-md rounded-lg text-blue-500 hover:scale-110 transition-transform"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={async (e) => { e.stopPropagation(); if(confirm('Sil?')) await deleteDoc(doc(db, 'hives', hive.id)) }} className="p-1.5 bg-white shadow-md rounded-lg text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: color.hex }} />
                </motion.div>
              );
            }
            
            return (
              <motion.div 
                key={hive.id} 
                className={cn(
                  "p-5 rounded-3xl border shadow-sm space-y-4 transition-all cursor-pointer hover:shadow-md",
                  statusStyles.bg,
                  statusStyles.border
                )}
                onClick={() => setSelectedHiveForDetail(hive)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border transition-colors",
                      hive.queenStatus === 'Ana Arısız' ? "bg-slate-200 border-slate-300 text-slate-700" : 
                      (color.hex === '#FFFFFF' || color.hex === '#FACC15' ? "text-slate-800" : "text-white")
                    )}
                    style={hive.queenStatus !== 'Ana Arısız' ? { backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#e2e8f0' : color.hex } : {}}
                    >
                      {hive.code}
                    </div>
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
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-1.5",
                      statusStyles.badge,
                      "text-white shadow-sm"
                    )}>
                      {hive.queenStatus === 'Ana Arısız' && <AlertCircle className="w-3 h-3" />}
                      {hive.queenStatus === 'Meme Var' && <Sparkle className="w-3 h-3" />}
                      {hive.queenStatus}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(hive); }} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async (e) => { e.stopPropagation(); if(confirm('Sil?')) await deleteDoc(doc(db, 'hives', hive.id)) }} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Notlar</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    placeholder="Kovan hakkında notlar..."
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                  />
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

      <AnimatePresence>
        {selectedHiveForDetail && (
          <HiveDetail hive={selectedHiveForDetail} onClose={() => setSelectedHiveForDetail(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
