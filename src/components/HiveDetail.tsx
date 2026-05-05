import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Hive, Feeding, Medication } from '../types';
import { X, Droplets, Shield, Calendar, Info, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatDate, getQueenColor } from '../lib/utils';

interface HiveDetailProps {
  hive: Hive;
  onClose: () => void;
}

export default function HiveDetail({ hive, onClose }: HiveDetailProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qFeedings = query(
      collection(db, 'feedings'), 
      where('hiveId', '==', hive.id),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubscribeFeedings = onSnapshot(qFeedings, (snapshot) => {
      setFeedings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feeding[]);
    });

    const qMedications = query(
      collection(db, 'medications'), 
      where('hiveId', '==', hive.id),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubscribeMedications = onSnapshot(qMedications, (snapshot) => {
      setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medication[]);
    });

    return () => {
      unsubscribeFeedings();
      unsubscribeMedications();
    };
  }, [hive.id]);

  const color = getQueenColor(hive.queenYear || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex gap-4">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl border transition-colors shadow-lg",
              hive.queenStatus === 'Ana Arısız' ? "bg-slate-300 border-slate-400 text-slate-700" : 
              (color.hex === '#FFFFFF' || color.hex === '#FACC15' ? "text-slate-800" : "text-white")
            )}
            style={hive.queenStatus !== 'Ana Arısız' ? { backgroundColor: color.hex, borderColor: color.hex === '#FFFFFF' ? '#e2e8f0' : color.hex } : {}}
            >
              {hive.code}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{hive.code} No'lu Kovan</h3>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {hive.status}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                {hive.breed} {hive.lineage} • {hive.population} Çerçeve
              </p>
              <div className={cn(
                "mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
                hive.queenStatus === 'Ana Arısız' ? "bg-slate-500" : 
                hive.queenStatus === 'Meme Var' ? "bg-amber-600" :
                hive.queenStatus === 'Çiftleşmiş (Yumurtlayan)' ? "bg-green-600" : "bg-blue-600"
              )}>
                {hive.queenStatus}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 shadow-sm">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
               <Droplets className="w-5 h-5 text-amber-600 mx-auto mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Son Besleme</p>
               <p className="font-bold text-slate-900">{hive.lastFeedingDate ? formatDate(hive.lastFeedingDate) : '-'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
               <Shield className="w-5 h-5 text-blue-600 mx-auto mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Son İlaç</p>
               <p className="font-bold text-slate-900">{hive.lastMedicationDate ? formatDate(hive.lastMedicationDate) : '-'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
               <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-2" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ana Arı Yılı</p>
               <p className="font-bold text-slate-900">{hive.queenYear}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feeding History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                   <Droplets className="w-4 h-4 text-amber-600" />
                   Besleme Geçmişi
                </h4>
              </div>
              <div className="space-y-2">
                {feedings.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold italic">Kayıt bulunamadı.</p>
                ) : (
                  feedings.map(f => (
                    <div key={f.id} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-amber-900">{f.type}</p>
                        <p className="text-[10px] font-bold text-amber-600 opacity-60 uppercase">{formatDate(f.date)}</p>
                      </div>
                      <span className="text-xs font-black text-amber-700">{f.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Medication History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                   <Shield className="w-4 h-4 text-blue-600" />
                   İlaçlama Geçmişi
                </h4>
              </div>
              <div className="space-y-2">
                {medications.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold italic">Kayıt bulunamadı.</p>
                ) : (
                  medications.map(m => (
                    <div key={m.id} className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-blue-900">{m.medicineName}</p>
                        <p className="text-[10px] font-bold text-blue-600 opacity-60 uppercase">{formatDate(m.date)}</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">{m.type}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
             <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-400" />
                Kovan Notları
             </h4>
             <p className="text-sm font-medium text-slate-600 leading-relaxed min-h-[60px]">
                {hive.notes || 'Herhangi bir not bulunmuyor.'}
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 mt-auto">
          <p className="text-center text-[10px] font-black font-mono text-slate-300 uppercase tracking-[0.2em] mb-4">
             Sistem Kimliği: {hive.id}
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs shadow-xl shadow-slate-200"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}
