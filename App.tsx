import React, { useState, useEffect } from 'react';
import { ReportForm } from './components/ReportForm';
import { AdminDashboard } from './components/AdminDashboard';
import { firestoreService } from './services/firebase';
import { storageService } from './services/storageService';
import { WeeklyReport } from './types';

type CloudStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';

const App: React.FC = () => {
  const [view, setView] = useState<'REPORT' | 'ADMIN'>('REPORT');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('DISCONNECTED');
  const [lastError, setLastError] = useState<any>(null);

  useEffect(() => {
    // Initial load from local storage cache
    const cached = storageService.getReports();
    setReports(cached);

    setCloudStatus('CONNECTING');
    
    const unsubscribe = firestoreService.subscribeToReports(
      (updatedReports) => {
        setReports(updatedReports);
        setCloudStatus('CONNECTED');
        setLastError(null);
        storageService.saveAllReports(updatedReports);
      },
      (error: any) => {
        console.error("Cloud Access Error:", error);
        setCloudStatus('ERROR');
        setLastError(error);
      }
    );

    return () => unsubscribe();
  }, []);

  const statusColors = {
    CONNECTED: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    CONNECTING: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse',
    ERROR: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    DISCONNECTED: 'bg-slate-300'
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">DL4ALL</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${statusColors[cloudStatus]}`}></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {cloudStatus}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Katsina State DLCs</p>
            </div>
          </div>

          <nav className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setView('REPORT')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                view === 'REPORT' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Reporting
            </button>
            <button 
              onClick={() => setView('ADMIN')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                view === 'ADMIN' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Analytics
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
            {view === 'REPORT' ? 'LGA Team Leader Portal' : 'State-Wide Operations'}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-slate-500 font-medium">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              {view === 'REPORT' ? 'Submit metrics for centralized state processing.' : 'Consolidated performance data and audit logs.'}
            </p>
            {cloudStatus === 'ERROR' && (
              <span className="text-rose-500 text-xs font-black uppercase flex items-center gap-1 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Sync Interrupted
              </span>
            )}
          </div>
        </div>

        {view === 'REPORT' ? (
          <ReportForm reports={reports} />
        ) : (
          <AdminDashboard reports={reports} error={lastError} cloudStatus={cloudStatus} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <span className="font-black text-xs">DL</span>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Digital Literacy for All</p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight">
            &copy; 2026 Katsina State Government. Secure Cloud-Linked Performance Portal.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;