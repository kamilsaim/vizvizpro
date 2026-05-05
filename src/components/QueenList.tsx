import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Queen, QueenStatus, Hive, QueenBatch, QueenBatchStatus, QueenBreed, QueenLineage } from '../types';
import { Plus, Search, Loader2, X, Crown, Calendar, Info, Trash2, Microscope, ArrowRight, ClipboardCheck, Users, Edit2, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { addDays, format, differenceInDays } from 'date-fns';

interface QueenListProps {
  user: User;
}

export default function QueenList({ user }: QueenListProps) {
  const [queens, setQueens] = useState<Queen[]>([]);
  const [batches, setBatches] = useState<QueenBatch[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  
  const [transferringQueenId, setTransferringQueenId] = useState<string | null>(null);

  const initialBatch = {
    transferDate: format(new Date(), 'yyyy-MM-dd'),
    breed: 'Anadolu' as QueenBreed,
    lineage: 'F1' as QueenLineage,
    breederHiveId: '',
    starterHiveId: '',
    transferCount: 0,
    status: 'başlatıldı' as QueenBatchStatus,
    notes: ''
  };

  const [batchFormData, setBatchFormData] = useState(initialBatch);

  useEffect(() => {
    const qQueens = query(collection(db, 'queens'), where('userId', '==', user.uid));
    const unsubscribeQueens = onSnapshot(qQueens, (snapshot) => {
      setQueens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Queen[]);
    });

    const qBatches = query(collection(db, 'queenBatches'), where('userId', '==', user.uid));
    const unsubscribeBatches = onSnapshot(qBatches, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QueenBatch[]);
      setLoading(false);
    });

    const qHives = query(collection(db, 'hives'), where('userId', '==', user.uid));
    const unsubscribeHives = onSnapshot(qHives, (snapshot) => {
      setHives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hive[]);
    });

    return () => {
      unsubscribeQueens();
      unsubscribeBatches();
      unsubscribeHives();
    };
  }, [user.uid]);

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBatchId) {
        await updateDoc(doc(db, 'queenBatches', editingBatchId), batchFormData);
      } else {
        await addDoc(collection(db, 'queenBatches'), {
          ...batchFormData,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingBatch(false);
      setEditingBatchId(null);
      setBatchFormData(initialBatch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'queenBatches');
    }
  };

  const startEditBatch = (batch: QueenBatch) => {
    setEditingBatchId(batch.id);
    setBatchFormData({
      transferDate: batch.transferDate,
      breed: batch.breed || 'Anadolu',
      lineage: batch.lineage || 'F1',
      breederHiveId: batch.breederHiveId || '',
      starterHiveId: batch.starterHiveId || '',
      transferCount: batch.transferCount,
      status: batch.status,
      notes: batch.notes || ''
    });
    setIsAddingBatch(true);
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Grubu sildiğinizde içindeki tüm ana arı kayıtları da silinecektir. Emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'queenBatches', id));
      const batchQueens = queens.filter(q => q.batchId === id);
      for (const q of batchQueens) {
        await deleteDoc(doc(db, 'queens', q.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `queenBatches/${id}`);
    }
  };

  const getDayLabel = (transferDate: string) => {
    const diff = differenceInDays(new Date(), new Date(transferDate)) + 4;
    return diff;
  };

  const getMilestones = (transferDate: string) => {
    const start = new Date(transferDate);
    return [
      { day: 4, label: 'Larva Transferi', date: start },
      { day: 10, label: 'Memeler Kapanır', date: addDays(start, 6) },
      { day: 14, label: 'Dağıtım Zamanı', date: addDays(start, 10) },
      { day: 16, label: 'Çıkış (Doğum)', date: addDays(start, 12) },
    ];
  };

  const handleCreateQueensFromBatch = async (batch: QueenBatch, count: number) => {
    try {
      const birthDate = format(addDays(new Date(batch.transferDate), 12), 'yyyy-MM-dd');
      for (let i = 0; i < count; i++) {
        await addDoc(collection(db, 'queens'), {
          userId: user.uid,
          batchId: batch.id,
          status: 'koza',
          birthDate,
          createdAt: new Date().toISOString()
        });
      }
      await updateDoc(doc(db, 'queenBatches', batch.id), { status: 'memeler_kapandı', nurturedCount: count });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'queens');
    }
  };

  const handleTransferQueen = async (queenId: string, hiveId: string) => {
    try {
      const queen = queens.find(q => q.id === queenId);
      const batch = batches.find(b => b.id === queen?.batchId);
      if (!queen || !batch) return;

      const birthYear = new Date(queen.birthDate).getFullYear();
      
      const batchOp = writeBatch(db);
      
      // Update Hive
      batchOp.update(doc(db, 'hives', hiveId), {
        breed: batch.breed,
        lineage: batch.lineage,
        queenStatus: queen.status === 'aktif' ? 'Çiftleşmiş (Yumurtlayan)' : 'Bakire',
        queenYear: birthYear,
        updatedAt: new Date().toISOString()
      });

      // Mark Queen as transferred
      batchOp.update(doc(db, 'queens', queenId), {
        status: 'transferred',
        transferredToHiveId: hiveId
      });

      await batchOp.commit();
      setTransferringQueenId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transfer_queen');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Üretim Döngüsü</h2>
        <button 
          onClick={() => { setEditingBatchId(null); setBatchFormData(initialBatch); setIsAddingBatch(true); }} 
          className="bg-purple-600 text-white flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg shadow-purple-100 text-sm font-bold active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Yeni Üretim
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
          <Microscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium px-6">Henüz bir larva transfer döngüsü başlatılmadı.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {batches.sort((a,b) => b.transferDate.localeCompare(a.transferDate)).map((batch) => {
            const currentDay = getDayLabel(batch.transferDate);
            const milestones = getMilestones(batch.transferDate);
            const batchQueens = queens.filter(q => q.batchId === batch.id && q.status !== 'transferred');
            const transferredCount = queens.filter(q => q.batchId === batch.id && q.status === 'transferred').length;

            return (
              <motion.div key={batch.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-lg">
                        Day {currentDay} / {batch.lineage}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{formatDate(batch.transferDate)} {batch.breed} Grubu</h3>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{batch.transferCount} Transfer</p>
                        <p className="text-xs text-slate-400">Ana Damızlık: {hives.find(h => h.id === batch.breederHiveId)?.code || '-'}</p>
                      </div>
                      <div className="flex gap-1 border-l pl-4 border-slate-200">
                        <button onClick={() => startEditBatch(batch)} className="p-1 text-slate-300 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteBatch(batch.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-6 pb-2">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
                    <div className="flex justify-between relative z-10">
                      {milestones.map((m, i) => {
                        const isPast = currentDay >= m.day;
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-4 h-4 rounded-full border-4 border-white transition-all shadow-sm",
                              isPast ? "bg-purple-600 scale-125" : "bg-slate-300"
                            )} />
                            <div className="text-center">
                              <p className={cn("text-[9px] font-bold uppercase", isPast ? "text-purple-600" : "text-slate-400")}>{m.label}</p>
                              <p className="text-[8px] text-slate-400 font-medium">{format(m.date, 'dd MMM')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {batch.status === 'başlatıldı' && (
                    <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <div>
                        <p className="text-sm font-bold text-amber-900">Sonuç Kaydı Bekleniyor</p>
                        <p className="text-xs text-amber-700">Kaç meme başarılı kapandı?</p>
                      </div>
                      <button 
                        onClick={() => {
                          const count = prompt('Tutan meme sayısı:', batch.transferCount.toString());
                          if (count) handleCreateQueensFromBatch(batch, parseInt(count));
                        }}
                        className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95"
                      >
                        Kaydet
                      </button>
                    </div>
                  )}

                  {batchQueens.length > 0 && (
                    <div className="space-y-3 mt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Kovandaki Analar ({batchQueens.length})
                        </p>
                        {transferredCount > 0 && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                {transferredCount} Ana Aktarıldı
                            </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {batchQueens.map((q, i) => (
                          <div key={q.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-3">
                                <Crown className={cn("w-4 h-4", q.status === 'aktif' ? "text-green-500" : "text-purple-400")} />
                                <span className="text-sm font-bold text-slate-700">Ana #{i+1}</span>
                                {q.isArtificialInsemination && <Microscope className="w-3.5 h-3.5 text-blue-500" />}
                             </div>
                             <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => setTransferringQueenId(q.id)}
                                 className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-purple-600 hover:border-purple-200 transition-all"
                               >
                                 <ArrowRight className="w-3 h-3" /> Aktar
                               </button>
                               <select 
                                 value={q.status}
                                 onChange={async (e) => {
                                   await updateDoc(doc(db, 'queens', q.id), { status: e.target.value });
                                 }}
                                 className="text-xs font-bold border-none bg-transparent text-purple-600 focus:ring-0 outline-none"
                               >
                                  <option value="koza">KOZA</option>
                                  <option value="çıktı">ÇIKTI</option>
                                  <option value="çiftleşme">ÇİFTLEŞME</option>
                                  <option value="yumurtlama">YUMURTLAMA</option>
                                  <option value="aktif">AKTİF</option>
                                  <option value="kayıp">KAYIP</option>
                               </select>
                               <button onClick={async () => { if(confirm('Sil?')) await deleteDoc(doc(db, 'queens', q.id)) }} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Transfer Queen Modal */}
      <AnimatePresence>
        {transferringQueenId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTransferringQueenId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
                    <h3 className="text-xl font-bold mb-4">Kovana Aktar</h3>
                    <p className="text-sm text-slate-500 mb-6">Seçili ana arıyı hangi kovana yerleştirmek istersiniz? Kovan bilgileri (irk, kuşak, ana yılı) otomatik güncellenecektir.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {hives.map(hive => (
                            <button 
                                key={hive.id}
                                onClick={() => handleTransferQueen(transferringQueenId, hive.id)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-purple-50 hover:border-purple-200 border border-slate-100 transition-all text-left"
                            >
                                <div>
                                    <p className="font-bold text-slate-800">{hive.code}</p>
                                    <p className="text-[10px] text-slate-500">{hive.queenStatus}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300" />
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setTransferringQueenId(null)} className="w-full mt-6 py-3 text-slate-400 font-bold text-sm">Vazgeç</button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Batch Modal */}
      <AnimatePresence>
        {isAddingBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingBatch(false); setEditingBatchId(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl scale-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">{editingBatchId ? 'Üretimi Düzenle' : 'Üretim Döngüsü Başlat'}</h3>
                <button onClick={() => { setIsAddingBatch(false); setEditingBatchId(null); }} className="p-2"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSubmitBatch} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Üretilen Irk</label>
                    <select
                      value={batchFormData.breed}
                      onChange={e => setBatchFormData({ ...batchFormData, breed: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    >
                      {['Anadolu', 'Karniyol', 'Belfast', 'Kafkas', 'Muğla', 'Karpat', 'Belit', 'Karma'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Kuşak</label>
                    <select
                      value={batchFormData.lineage}
                      onChange={e => setBatchFormData({ ...batchFormData, lineage: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    >
                      {['Saf', 'F1', 'F2', 'Karma'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Damızlık Kovan</label>
                    <select
                      value={batchFormData.breederHiveId}
                      onChange={e => setBatchFormData({ ...batchFormData, breederHiveId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    >
                      <option value="">Seçiniz</option>
                      {hives.map(h => <option key={h.id} value={h.id}>{h.code}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Başlatıcı Kovan</label>
                    <select
                      value={batchFormData.starterHiveId}
                      onChange={e => setBatchFormData({ ...batchFormData, starterHiveId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    >
                      <option value="">Seçiniz</option>
                      {hives.map(h => <option key={h.id} value={h.id}>{h.code}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Transfer Tarihi</label>
                    <input
                      type="date" required
                      value={batchFormData.transferDate}
                      onChange={e => setBatchFormData({ ...batchFormData, transferDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 px-1">Transfer Sayısı</label>
                    <input
                      type="number" required min="1"
                      value={batchFormData.transferCount || 0}
                      onChange={e => setBatchFormData({ ...batchFormData, transferCount: parseInt(e.target.value) || 0 })}
                      placeholder="Örn: 100"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    />
                  </div>
                </div>

                {!editingBatchId && (
                  <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start border border-blue-100">
                    <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Hesaplanan Takvim (Day 4 Larva)</p>
                      <p className="text-[10px] text-blue-700 mt-1">
                        Çıkış: {formatDate(addDays(new Date(batchFormData.transferDate), 12))} (Day 16)
                      </p>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95">
                  {editingBatchId ? 'Güncelle' : 'Döngüyü Başlat'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
