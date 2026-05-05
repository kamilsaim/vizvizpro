import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import { Layout, LogIn, LogOut, Loader2, Home, Box, Crown, ShoppingCart, Wallet, AlertCircle, Droplets, Shield, Package, Settings as SettingsIcon, Menu as MenuIcon, X } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './components/Logo';

// Components
import Dashboard from './components/Dashboard';
import HiveList from './components/HiveList';
import QueenList from './components/QueenList';
import SaleList from './components/SaleList';
import ExpenseList from './components/ExpenseList';
import FeedingList from './components/FeedingList';
import MedicationList from './components/MedicationList';
import StockList from './components/StockList';
import Settings from './components/Settings';
import { APP_VERSION, APP_STALE_CACHE_KEY } from './constants';

type Tab = 'dashboard' | 'hives' | 'queens' | 'sales' | 'expenses' | 'feeding' | 'medication' | 'stocks' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for updates/stale cache
    const storedVersion = localStorage.getItem(APP_STALE_CACHE_KEY);
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`Updating from ${storedVersion} to ${APP_VERSION}`);
      // You could clear specific local storage items here if needed
      localStorage.setItem(APP_STALE_CACHE_KEY, APP_VERSION);
      // Optional: force reload to clear all caches if drastic changes happened
      // window.location.reload(); 
    } else if (!storedVersion) {
      localStorage.setItem(APP_STALE_CACHE_KEY, APP_VERSION);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Logo size="lg" className="mb-8 animate-pulse" />
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
        <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Veriler Getiriliyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-white"
        >
          <Logo size="lg" className="justify-center mb-10" />
          
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Hoş Geldiniz</h1>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">Arılık verimliliğinizi, ana arı üretimini ve finansal kayıtlarınızı tek noktadan yönetin.</p>
          
          {authError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Giriş Hatası</p>
                <p className="text-xs text-red-600 leading-relaxed font-medium">{authError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-amber-200 active:scale-95"
          >
            {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {isSigningIn ? 'Giriş Yapılıyor...' : 'Google ile Bağlan'}
          </button>
          
          <p className="mt-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sürüm {APP_VERSION}</p>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} setActiveTab={setActiveTab} />;
      case 'hives': return <HiveList user={user} />;
      case 'queens': return <QueenList user={user} />;
      case 'sales': return <SaleList user={user} />;
      case 'expenses': return <ExpenseList user={user} />;
      case 'feeding': return <FeedingList user={user} />;
      case 'medication': return <MedicationList user={user} />;
      case 'stocks': return <StockList user={user} />;
      case 'settings': return <Settings user={user} />;
      default: return <Dashboard user={user} setActiveTab={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Ana Sayfa' },
    { id: 'hives', icon: Box, label: 'Kovanlar' },
    { id: 'queens', icon: Crown, label: 'Üretim' },
    { id: 'feeding', icon: Droplets, label: 'Besleme' },
    { id: 'medication', icon: Shield, label: 'İlaçlama' },
    { id: 'sales', icon: ShoppingCart, label: 'Satışlar' },
    { id: 'stocks', icon: Package, label: 'Stoklar' },
    { id: 'expenses', icon: Wallet, label: 'Giderler' },
    { id: 'settings', icon: SettingsIcon, label: 'Ayarlar' },
  ];

  const mobilePrimaryNav = navItems.slice(0, 3);
  const mobileSecondaryNav = navItems.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0 md:pl-64 lg:pl-72">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 lg:w-72 bg-white border-r border-slate-200 p-8 z-20">
        <Logo className="mb-12" />

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
                activeTab === item.id 
                  ? "bg-amber-600 text-white shadow-xl shadow-amber-200" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-xl bg-slate-200 border-2 border-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tighter">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate font-bold">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-500 font-bold text-xs hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-between p-4 px-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <Logo size="sm" />
        <button onClick={logOut} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-2 py-4 pb-6 flex items-center justify-around z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        {mobilePrimaryNav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as Tab);
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 min-w-[60px] transition-all",
              activeTab === item.id ? "text-amber-600 scale-110" : "text-slate-300"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id && "drop-shadow-[0_4px_8px_rgba(217,119,6,0.3)]")} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
        
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "flex flex-col items-center gap-1.5 min-w-[60px] transition-all",
            isMobileMenuOpen || mobileSecondaryNav.some(n => n.id === activeTab) ? "text-amber-600 scale-110" : "text-slate-300"
          )}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          <span className="text-[8px] font-black uppercase tracking-widest">Menü</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="md:hidden fixed inset-x-0 bottom-[84px] bg-white rounded-t-[2.5rem] p-8 z-40 shadow-2xl border-t border-slate-100"
            >
              <div className="grid grid-cols-3 gap-6">
                {mobileSecondaryNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as Tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border",
                      activeTab === item.id 
                        ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" 
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter">{user.displayName}</p>
                    <p className="text-[9px] text-slate-400 truncate font-bold">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logOut}
                  className="p-3 bg-red-50 text-red-500 rounded-xl active:scale-95 transition-transform"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
