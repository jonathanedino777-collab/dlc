import React, { useState, useEffect } from 'react';
import { ReportForm } from './components/ReportForm';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { firestoreService } from './services/firebase';
import { storageService } from './services/storageService';
import { WeeklyReport, AuthUser } from './types';

type CloudStatus = 'ONLINE' | 'OFFLINE' | 'SYNC_ERROR' | 'INITIALIZING';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<'REPORT' | 'ADMIN'>('REPORT');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('INITIALIZING');
  const [lastSyncError, setLastSyncError] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('dl4all_auth');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView(user.role === 'ADMIN' ? 'ADMIN' : 'REPORT');
    }

    const cached = storageService.getReports();
    setReports(cached);

    const unsubscribe = firestoreService.subscribeToReports(
      (updatedReports) => {
        setReports(updatedReports);
        setCloudStatus('ONLINE');
        setLastSyncError(null);
        storageService.saveAllReports(updatedReports);
      },
      (error: any) => {
        setCloudStatus('SYNC_ERROR');
        setLastSyncError(error);
        if (error.message === 'PERMISSION_DENIED') {
          setShowDiagnostic(true);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('dl4all_auth', JSON.stringify(user));
    setView(user.role === 'ADMIN' ? 'ADMIN' : 'REPORT');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dl4all_auth');
  };

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';\n\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusTheme = {
    ONLINE: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Cloud Synchronized' },
    INITIALIZING: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Connecting...' },
    SYNC_ERROR: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Access Denied' },
    OFFLINE: { color: 'text-slate-400', bg: 'bg-slate-400', label: 'Offline' }
  };

  const currentStatus = statusTheme[cloudStatus];
  const isPermissionError = lastSyncError?.message === 'PERMISSION_DENIED';

  return (
    <div className="min-h-screen flex flex-col">
      {/* GLOBAL DIAGNOSTIC MODAL */}
      {showDiagnostic && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowDiagnostic(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative animate-fadeIn border border-white/20">
            <div className="bg-rose-600 p-8 sm:p-10 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black tracking-tight leading-none">Database Access Error</h3>
                  <p className="text-rose-100 text-sm font-bold mt-3 uppercase tracking-widest opacity-80">Action Required: Fix Firestore Rules</p>
                </div>
                <button onClick={() => setShowDiagnostic(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 sm:p-10 space-y-8">
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                  <p className="text-slate-900 font-black text-sm uppercase tracking-tight">Public Access Required</p>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">The server is rejecting reports because the database rules are too strict. To allow all centers to report, apply the fix below in your Firebase Console.</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-900 font-black text-xs uppercase tracking-widest px-2">Copy this Code (Admin Only)</p>
                <div className="bg-slate-900 rounded-3xl p-6 font-mono relative group overflow-hidden">
                  <button 
                    onClick={handleCopyRules}
                    className="absolute top-4 right-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all z-10"
                  >
                    {copied ? 'Copied!' : 'Copy Fix Code'}
                  </button>
                  <div className="text-[11px] leading-relaxed text-indigo-300">
                    <p>rules_version = '2';</p>
                    <p>service cloud.firestore {'{'}</p>
                    <p className="ml-4">match /databases/{'{'}database{'}'}/documents {'{'}</p>
                    <p className="ml-8">match /{'{'}document=**{'}'} {'{'}</p>
                    <p className="ml-12 text-emerald-400 font-bold">allow read, write: if true;</p>
                    <p className="ml-8">{'}'}</p>
                    <p className="ml-4">{'}'}</p>
                    <p>{'}'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <a 
                  href="https://console.firebase.google.com/project/dlcs-b8f53/firestore/rules" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-3 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
                >
                  Go to Rules Console
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <button 
                  onClick={() => window.location.reload()} 
                  className="py-5 bg-slate-100 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Screen (Shows status if denied) */}
      {!currentUser ? (
        <>
          {isPermissionError && (
            <div className="bg-rose-600 text-white p-4 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 animate-slideDown">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Cloud Access Blocked: Permissions Required
              <button onClick={() => setShowDiagnostic(true)} className="bg-white text-rose-600 px-4 py-1.5 rounded-full hover:bg-rose-50 transition-colors">FIX ACCESS</button>
            </div>
          )}
          <Login onLogin={handleLogin} />
        </>
      ) : (
        <>
          <header className="sticky top-0 z-[100] glass-panel border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">DL4ALL</h1>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-100 shadow-sm ${currentStatus.color}`}>
                      <span className={`w-2 h-2 rounded-full status-pulse ${currentStatus.bg}`}></span>
                      <span className="text-[10px] font-black uppercase tracking-tight">{currentStatus.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {currentUser.role === 'ADMIN' && (
                  <nav className="hidden md:flex bg-slate-100/80 p-1 rounded-xl">
                    <button onClick={() => setView('REPORT')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${view === 'REPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>FIELD VIEW</button>
                    <button onClick={() => setView('ADMIN')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>ANALYTICS</button>
                  </nav>
                )}
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-900 leading-none">{currentUser.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{currentUser.role === 'ADMIN' ? 'State HQ' : currentUser.lga}</p>
                  </div>
                  <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
            {isPermissionError && (
              <div className="mb-10 p-6 bg-rose-600 rounded-3xl text-white shadow-xl flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-tight leading-none uppercase">Database Access Denied</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Updates are currently saved locally only. {currentUser.role === 'ADMIN' ? 'Please fix the Rules in your console.' : 'Please contact the State Administrator.'}</p>
                  </div>
                </div>
                {currentUser.role === 'ADMIN' && (
                  <button onClick={() => setShowDiagnostic(true)} className="bg-white text-rose-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-lg active:scale-95">REPAIR ACCESS</button>
                )}
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{view === 'REPORT' ? 'Field Submission' : 'State Operations'}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Logged in as: {currentUser.role === 'ADMIN' ? 'System Administrator' : `${currentUser.lga} Unit Leader`}</p>
            </div>

            {view === 'REPORT' ? (
              <ReportForm reports={reports} />
            ) : (
              <AdminDashboard reports={reports} error={lastSyncError} cloudStatus={cloudStatus} />
            )}
          </main>
        </>
      )}

      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 text-sm">DL4ALL KATSINA</h4>
            <p className="text-xs text-slate-400 font-medium">Digital Literacy Center Monitoring Platform</p>
          </div>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 Government of Katsina State</p>
        </div>
      </footer>
    </div>
  );
};

export default App;