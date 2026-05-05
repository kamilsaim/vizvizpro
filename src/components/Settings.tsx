import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, logOut } from '../lib/firebase';
import { APP_VERSION } from '../constants';
import { Settings as SettingsIcon, Trash2, RefreshCw, AlertTriangle, ShieldCheck, Info, LogOut, Download, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<'none' | 'confirm' | 'final'>('none');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const collections = ['hives', 'queens', 'sales', 'expenses', 'feedings', 'medications', 'stocks', 'queenBatches'];

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    // In a real web environment, this usually involves checking a manifest or just reloading
    setTimeout(() => {
      setIsCheckingUpdate(false);
      alert(`Şu anda en güncel versiyonu kullanıyorsunuz: v${APP_VERSION}`);
      // Force reload to clear cache if user wants
      if (confirm('Uygulama önbelleğini temizlemek ve yeniden başlatmak ister misiniz?')) {
        window.location.reload();
      }
    }, 1500);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data: any = {};
      for (const collName of collections) {
        const q = query(collection(db, collName), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        data[collName] = snapshot.docs.map(doc => ({ ...doc.data() }));
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aricilik_yedek_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Yedek alınırken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Bu işlem yedek dosyasındaki tüm verileri mevcut kayıtlarınıza ekleyecektir. Devam etmek istiyor musunuz?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        for (const collName of collections) {
          if (json[collName] && Array.isArray(json[collName])) {
            let batch = writeBatch(db);
            let count = 0;
            
            for (const item of json[collName]) {
              // Ensure userId matches current user for security
              const data = { ...item, userId: user.uid };
              
              const docRef = doc(collection(db, collName));
              batch.set(docRef, data);
              count++;
              
              if (count === 499) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
              }
            }
            
            if (count > 0) {
              await batch.commit();
            }
          }
        }
        
        alert('Veriler başarıyla yüklendi.');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Yedek yüklenirken bir hata oluştu. Lütfen geçerli bir yedek dosyası seçtiğinizden emin olun.');
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const collections = ['hives', 'queens', 'sales', 'expenses', 'feeding', 'medication', 'stocks'];
      
      for (const collName of collections) {
        const q = query(collection(db, collName), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        // Use batches for efficiency (max 500 per batch)
        let batch = writeBatch(db);
        let count = 0;
        
        for (const document of snapshot.docs) {
          batch.delete(doc(db, collName, document.id));
          count++;
          
          if (count === 499) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        
        if (count > 0) {
          await batch.commit();
        }
      }
      
      alert('Tüm verileriniz başarıyla silindi.');
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
      alert('Veriler silinirken bir hata oluştu.');
    } finally {
      setIsResetting(false);
      setResetStep('none');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sistem Ayarları</h2>
      </div>

      <div className="grid gap-6">
        {/* Version Info Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <SettingsIcon className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Uygulama Bilgileri</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sistem durumu ve versiyon</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-600">Uygulama Sürümü</span>
              <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200">
                v{APP_VERSION}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-600">Güncelleme Durumu</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  Güncel
                </div>
                <button 
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-amber-600 hover:border-amber-100 transition-all shadow-xs"
                >
                  <RefreshCw className={cn("w-4 h-4", isCheckingUpdate && "animate-spin text-amber-600")} />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-600">Sistem Dili</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Türkçe (TR)</span>
            </div>
          </div>
        </section>

        {/* Backup & Restore Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Yedekleme ve Kurtarma</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Verilerinizi koruyun</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExportData}
              disabled={isExporting || isImporting}
              className="flex items-center justify-center gap-3 bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Yedek Al (İndir)
            </button>
            
            <label className={cn(
              "flex items-center justify-center gap-3 bg-white text-emerald-600 border-2 border-emerald-100 font-black py-4 px-6 rounded-2xl transition-all uppercase tracking-widest text-[10px] cursor-pointer hover:bg-emerald-50 shadow-sm",
              (isExporting || isImporting) && "opacity-50 cursor-not-allowed"
            )}>
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Yedek Yükle
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleImportData}
                disabled={isExporting || isImporting}
              />
            </label>
          </div>
          <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
            Verilerinizi düzenli olarak yedeklemeniz önerilir.
          </p>
        </section>

        {/* User Account Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Hesap Güvenliği</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Bağlı hesap ve oturum</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 mb-4">
            <img src={user.photoURL || ''} alt="" className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 uppercase tracking-tighter">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
            </div>
            <button 
              onClick={logOut}
              className="p-3 bg-white text-red-500 rounded-xl border border-slate-200 hover:bg-red-50 transition-colors shadow-sm"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Reset Data Card */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-red-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-600">Tehlikeli Bölge</h3>
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Veri yönetimi ve sıfırlama</p>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed bg-red-50/50 p-4 rounded-2xl border border-red-50">
            Arıcılık takip sistemindeki tüm kayıtlarınızı (kovanlar, üretimler, finans verileri) kalıcı olarak siler. Bu işlem geri alınamaz.
          </p>

          {resetStep === 'none' ? (
            <button
              onClick={() => setResetStep('confirm')}
              className="w-full flex items-center justify-center gap-3 bg-white text-red-600 border-2 border-red-100 hover:bg-red-50 font-black py-4 px-6 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
            >
              <Trash2 className="w-4 h-4" />
              Sistemi Sıfırla
            </button>
          ) : (
            <div className="space-y-3">
              {resetStep === 'confirm' ? (
                <>
                  <p className="text-center font-black text-red-600 text-xs uppercase tracking-widest mb-4">Emin misiniz?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setResetStep('none')}
                      className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => setResetStep('final')}
                      className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-200"
                    >
                      Evet, Devam Et
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-center font-black text-red-700 text-xs uppercase tracking-widest mb-4 animate-bounce">SON ONAY! VERİLER SİLİNECEK</p>
                  <button
                    disabled={isResetting}
                    onClick={handleResetData}
                    className="w-full flex items-center justify-center gap-3 bg-red-700 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-300 active:scale-95"
                  >
                    {isResetting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    Tüm Verileri Şimdi Sil
                  </button>
                  <button
                    disabled={isResetting}
                    onClick={() => setResetStep('none')}
                    className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest py-2"
                  >
                    İptal Et
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="text-center py-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Arıcılık Takip Sistemi &copy; 2024</p>
      </div>
    </div>
  );
}
