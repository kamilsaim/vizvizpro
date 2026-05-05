import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Hive, Queen, Sale, Expense, QueenBatch } from '../types';
import { Box, Crown, TrendingUp, TrendingDown, Clock, Calendar, ChevronRight, Droplets, Shield, Sparkle, Package, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency, formatDate, getQueenColor } from '../lib/utils';
import { addDays, format, differenceInDays } from 'date-fns';
import StockList from './StockList';
import HiveDetail from './HiveDetail';

interface DashboardProps {
  user: User;
  setActiveTab: (tab: any) => void;
}

interface StatFilter {
  type: 'breed' | 'lineage' | 'status';
  value: string;
  label: string;
}

export default function Dashboard({ user, setActiveTab }: DashboardProps) {
  const [data, setData] = useState({
    hives: [] as Hive[],
    queens: [] as Queen[],
    batches: [] as QueenBatch[],
    sales: [] as Sale[],
    expenses: [] as Expense[]
  });
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<StatFilter | null>(null);
  const [selectedHiveForDetail, setSelectedHiveForDetail] = useState<Hive | null>(null);

  useEffect(() => {
    const qHives = query(collection(db, 'hives'), where('userId', '==', user.uid));
    const qBatches = query(collection(db, 'queenBatches'), where('userId', '==', user.uid));
    const qSales = query(collection(db, 'sales'), where('userId', '==', user.uid));
    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', user.uid));

    const unsubHives = onSnapshot(qHives, (s) => setData(prev => ({ ...prev, hives: s.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Hive[] })));
    const unsubBatches = onSnapshot(qBatches, (s) => setData(prev => ({ ...prev, batches: s.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QueenBatch[] })));
    const unsubSales = onSnapshot(qSales, (s) => setData(prev => ({ ...prev, sales: s.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[] })));
    const unsubExpenses = onSnapshot(qExpenses, (s) => setData(prev => ({ ...prev, expenses: s.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[] })));

    setLoading(false);
    return () => {
      unsubHives();
      unsubBatches();
      unsubSales();
      unsubExpenses();
    };
  }, [user.uid]);

  const totalIncome = data.sales.reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 0)), 0);
  const totalExpense = data.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const profit = totalIncome - totalExpense;

  const breedStats = data.hives.reduce((acc, h) => {
    acc[h.breed] = (acc[h.breed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lineageStats = data.hives.reduce((acc, h) => {
    acc[h.lineage] = (acc[h.lineage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const queenStatusStats = data.hives.reduce((acc, h) => {
    acc[h.queenStatus] = (acc[h.queenStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const upcomingHatchings = data.batches
    .map(batch => ({
      ...batch,
      hatchDate: addDays(new Date(batch.transferDate), 12),
      daysLeft: differenceInDays(addDays(new Date(batch.transferDate), 12), new Date())
    }))
    .filter(b => b.daysLeft >= -2 && b.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const stats = [
    { label: 'Kovan Sayısı', value: data.hives.length, sub: 'Aktif Koloni', icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Üretim', value: upcomingHatchings.length, sub: 'Beklenen Çıkım', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Giderler', value: formatCurrency(totalExpense), sub: 'Toplam Harcama', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Ciro', value: formatCurrency(totalIncome), sub: 'Toplam Satış', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Hoş Geldiniz, {user.displayName?.split(' ')[0]}</h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <Sparkle className="w-3 h-3 text-amber-500" />
                Arılık Durumu: Verimli • {data.hives.length} Kovan
            </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-default group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Irk Dağılımı</h4>
          </div>
          <div className="flex flex-wrap gap-2">
             {Object.entries(breedStats).map(([breed, count]) => (
                <button 
                  key={breed} 
                  onClick={() => setSelectedStat({ type: 'breed', value: breed, label: `${breed} Irkı Kovanlar` })}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-amber-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all group"
                >
                   <span className="text-[10px] font-black text-slate-900 group-hover:text-amber-700 uppercase tracking-tight">{breed}</span>
                   <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">{count}</span>
                </button>
             ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kuşak Durumu</h4>
          </div>
          <div className="flex flex-wrap gap-2">
             {Object.entries(lineageStats).map(([lineage, count]) => (
                <button 
                  key={lineage} 
                  onClick={() => setSelectedStat({ type: 'lineage', value: lineage, label: `${lineage} Kuşak Kovanlar` })}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group"
                >
                   <span className="text-[10px] font-black text-slate-900 group-hover:text-blue-700 uppercase tracking-tight">{lineage}</span>
                   <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg">{count}</span>
                </button>
             ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Sparkle className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ana Arı Durumu</h4>
          </div>
          <div className="flex flex-wrap gap-2">
             {Object.entries(queenStatusStats).map(([status, count]) => (
                <button 
                  key={status} 
                  onClick={() => setSelectedStat({ type: 'status', value: status, label: `${status} Kovanlar` })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all hover:shadow-sm active:scale-95",
                    status === 'Ana Arısız' ? "bg-red-50 border-red-100 hover:bg-red-100" :
                    status === 'Meme Var' ? "bg-amber-50 border-amber-100 hover:bg-amber-100" :
                    status === 'Çiftleşmiş (Yumurtlayan)' ? "bg-green-50 border-green-100 hover:bg-green-100" : "bg-purple-50 border-purple-100 hover:bg-purple-100"
                  )}
                >
                   <span className={cn(
                     "text-[9px] font-black uppercase tracking-tight",
                     status === 'Ana Arısız' ? "text-red-700" :
                     status === 'Meme Var' ? "text-amber-700" :
                     status === 'Çiftleşmiş (Yumurtlayan)' ? "text-green-700" : "text-purple-700"
                   )}>{status}</span>
                   <span className={cn(
                     "text-[9px] font-black px-1.5 py-0.5 rounded-lg",
                     status === 'Ana Arısız' ? "bg-red-600 text-white" :
                     status === 'Meme Var' ? "bg-amber-600 text-white" :
                     status === 'Çiftleşmiş (Yumurtlayan)' ? "bg-green-600 text-white" : "bg-purple-600 text-white"
                   )}>{count}</span>
                </button>
             ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Hatching Calendar */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tighter">
              <Clock className="w-6 h-6 text-purple-600" />
              Çıkım Takvimi
            </h3>
            <button onClick={() => setActiveTab('queens')} className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-full transition-colors">
              Üretim Paneli
            </button>
          </div>
          
          {upcomingHatchings.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Yakın zamanda beklenen çıkış yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingHatchings.map((batch) => (
                <div key={batch.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-purple-200 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2",
                      batch.daysLeft < 0 ? "bg-slate-50 border-slate-100 text-slate-400" :
                      batch.daysLeft <= 3 ? "bg-red-50 border-red-100 text-red-600" :
                      "bg-purple-50 border-purple-100 text-purple-600"
                    )}>
                      <span className="text-xl font-black tracking-tighter leading-none">{format(batch.hatchDate, 'dd')}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">{format(batch.hatchDate, 'MMM')}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tighter">{batch.breed} {batch.lineage} Grubu</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg",
                            batch.daysLeft === 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                        )}>
                            {batch.daysLeft === 0 ? 'Bugün Çıkıyor!' : 
                            batch.daysLeft < 0 ? 'Çıktı' : 
                            `${batch.daysLeft} Gün`}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{formatDate(batch.transferDate)} Transfer</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-800 tracking-tight">{batch.transferCount} Meme</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day {differenceInDays(new Date(), new Date(batch.transferDate)) + 4}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Hive Status */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 px-2 flex items-center gap-2 tracking-tighter">
            <Box className="w-6 h-6 text-amber-600" />
            Kovanlarım
          </h3>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 space-y-5 shadow-sm">
             {data.hives.filter(h => h.status === 'aktif').slice(0, 5).map(hive => (
               <div key={hive.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-sm text-slate-500 border border-slate-100">{hive.code}</div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{hive.breed}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hive.queenStatus}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hive.lastFeedingDate && <Droplets className="w-4 h-4 text-amber-400" />}
                    {hive.lastMedicationDate && <Shield className="w-4 h-4 text-blue-400" />}
                  </div>
               </div>
             ))}
             <button 
                onClick={() => setActiveTab('hives')} 
                className="w-full bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all"
             >
               Tüm Envanter ({data.hives.length})
             </button>
          </div>
        </div>
      </div>
      {/* Stock Status */}
      <div className="pt-10 border-t border-slate-100">
        <StockList user={user} isDashboardView={true} />
        <div className="mt-6 flex justify-center">
            <button 
                onClick={() => setActiveTab('stocks')} 
                className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
            >
                Stok Yönetimine Git <ChevronRight className="w-3 h-3" />
            </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedStat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStat(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter">{selectedStat.label}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Toplam {
                    data.hives.filter(h => 
                      selectedStat.type === 'breed' ? h.breed === selectedStat.value :
                      selectedStat.type === 'lineage' ? h.lineage === selectedStat.value :
                      h.queenStatus === selectedStat.value
                    ).length
                  } Kovan</p>
                </div>
                <button onClick={() => setSelectedStat(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
                {data.hives
                  .filter(h => 
                    selectedStat.type === 'breed' ? h.breed === selectedStat.value :
                    selectedStat.type === 'lineage' ? h.lineage === selectedStat.value :
                    h.queenStatus === selectedStat.value
                  )
                  .map(hive => (
                    <button
                      key={hive.id}
                      onClick={() => setSelectedHiveForDetail(hive)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl border border-slate-100 hover:border-amber-100 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-500">{hive.code}</div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{hive.breed} • {hive.lineage}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{hive.queenStatus}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className={cn("w-3 h-3 rounded-full", getQueenColor(hive.queenYear).class)} />
                         <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </button>
                  ))
                }
              </div>
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
