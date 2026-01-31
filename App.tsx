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
    // Check for existing session
    const savedUser = localStorage.getItem('dl4all_auth');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView(user.role === 'ADMIN' ? 'ADMIN' : 'REPORT');
    }

    // Load from local storage cache
    const cached = storageService.getReports();
    setReports(cached);

    // Connect to Cloud
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
        if (error.message?.includes('PERMISSION_DENIED')) {
          setShowDiagnostic(true);
        }
        console.warn("System running in Local-Only mode:", error.message);
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
    const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const statusTheme = {
    ONLINE: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Cloud Synchronized' },
    INITIALIZING: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Connecting...' },
    SYNC_ERROR: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Local-Only Mode' },
    OFFLINE: { color: 'text-slate-400', bg: 'bg-slate-400', label: 'Offline' }
  };

  const currentStatus = statusTheme[cloudStatus];
  const isPermissionError = lastSyncError?.message?.includes('PERMISSION_DENIED');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Diagnostic Notification */}
      {isPermissionError && !showDiagnostic && (
        <div className="fixed bottom-6 right-6 z-[200] animate-bounce">
          <button 
            onClick={() => setShowDiagnostic(true)}
            className="bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 ring-4 ring-rose-600/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="text-xs font-black uppercase tracking-widest">Fix Permissions</span>
          </button>
        </div>
      )}

      {/* Diagnostic Modal */}
      {showDiagnostic && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowDiagnostic(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-fadeIn">
            <div className="bg-rose-600 p-8 text-white relative">
              <button onClick={() => setShowDiagnostic(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <h3 className="text-2xl font-black tracking-tight">System Diagnostic</h3>
              <p className="text-rose-100 text-sm font-medium mt-1 uppercase tracking-widest opacity-80">Security Protocol Violation Detected</p>
            </div>
            <div className="p-8 sm:p-10 space-y-8">
              <div className="space-y-4">
                <p className="text-slate-900 font-bold text-lg leading-tight">Your Firestore Security Rules are blocking the app.</p>
                <p className="text-slate-500 text-sm leading-relaxed">To fix the <span className="font-mono bg-slate-100 px-1 rounded text-rose-600">Missing or insufficient permissions</span> error, you must update your rules in the Firebase Console.</p>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 font-mono relative group">
                <button 
                  onClick={handleCopyRules}
                  className="absolute top-4 right-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  {copied ? 'Copied!' : 'Copy Rules'}
                </button>
                <div className="text-[11px] leading-relaxed text-slate-300">
                  <p><span className="text-indigo-400">rules_version</span> = '2';</p>
                  <p><span className="text-indigo-400">service</span> cloud.firestore {'{'}</p>
                  <p className="ml-4">match /databases/{'{'}database{'}'}/documents {'{'}</p>
                  <p className="ml-8">match /{'{'}document=**{'}'} {'{'}</p>
                  <p className="ml-12 text-emerald-400 font-bold">allow read, write: if true;</p>
                  <p className="ml-8">{'}'}</p>
                  <p className="ml-4">{'}'}</p>
                  <p>{'}'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="https://console.firebase.google.com/project/dlcs-b8f53/firestore/rules" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Open Rules Console
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <button 
                  onClick={() => window.location.reload()} 
                  className="py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Confirm Fix & Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <button 
                  onClick={() => setView('REPORT')} 
                  className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                    view === 'REPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  FIELD VIEW
                </button>
                <button 
                  onClick={() => setView('ADMIN')} 
                  className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                    view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ANALYTICS
                </button>
              </nav>
            )}

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{currentUser.role === 'ADMIN' ? 'State HQ' : currentUser.lga}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {view === 'REPORT' ? 'Field Submission' : 'State Operations'}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
            Logged in as: {currentUser.role === 'ADMIN' ? 'System Administrator' : `${currentUser.lga} Unit Leader`}
          </p>
        </div>

        {view === 'REPORT' ? (
          <ReportForm reports={reports} />
        ) : (
          <AdminDashboard reports={reports} error={lastSyncError} cloudStatus={cloudStatus} />
        )}
      </main>

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