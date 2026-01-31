import React, { useState, useEffect } from 'react';
import { ReportForm } from './components/ReportForm';
import { AdminDashboard } from './components/AdminDashboard';
import { firestoreService } from './services/firebase';
import { WeeklyReport } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'REPORT' | 'ADMIN'>('REPORT');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');

  useEffect(() => {
    // Subscribe to real-time updates from Firestore
    const unsubscribe = firestoreService.subscribeToReports(
      (updatedReports) => {
        setReports(updatedReports);
        setCloudStatus('CONNECTED');
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        setCloudStatus('ERROR');
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">DL4ALL</h1>
                <span className={`flex h-2 w-2 rounded-full shadow-lg ${
                  cloudStatus === 'CONNECTED' ? 'bg-green-500 shadow-green-500/50' : 
                  cloudStatus === 'ERROR' ? 'bg-red-500 shadow-red-500/50' : 'bg-gray-300'
                }`} title={cloudStatus}></span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">KATSINA STATE DLCs</p>
            </div>
          </div>

          <nav className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('REPORT')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                view === 'REPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reporting
            </button>
            <button 
              onClick={() => setView('ADMIN')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                view === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admin Panel
            </button>
          </nav>
        </div>
      </header>

      {/* Connection Error Banner */}
      {cloudStatus === 'ERROR' && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase py-2 text-center tracking-widest">
          Cloud sync blocked by Firestore rules. Update rules in Firebase Console.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
            {view === 'REPORT' ? 'LGA Team Leader Report' : 'Performance Analytics'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto px-4">
            {view === 'REPORT' 
              ? 'Submit your weekly progress report. All submissions are synced globally in real-time.'
              : 'Monitor DLC performance metrics and team leaderboard synced across the state.'}
          </p>
        </div>

        {view === 'REPORT' ? (
          <ReportForm reports={reports} />
        ) : (
          <AdminDashboard reports={reports} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs sm:text-sm text-gray-400 font-medium">&copy; 2026 DL4ALL Katsina State. Official Cloud-Synced Performance Portal.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;