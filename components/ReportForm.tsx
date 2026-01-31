import React, { useState, useMemo } from 'react';
import { LGAS, INITIAL_TEAMS, MONTHS } from '../constants';
import { LGA, WeeklyReport } from '../types';
import { firestoreService } from '../services/firebase';
import { storageService } from '../services/storageService';

interface ReportFormProps {
  reports: WeeklyReport[];
}

export const ReportForm: React.FC<ReportFormProps> = ({ reports }) => {
  const [lga, setLga] = useState<LGA | ''>('');
  const [teamId, setTeamId] = useState('');
  const [month, setMonth] = useState('Jan-26');
  const [week, setWeek] = useState(1);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'P' | 'ABS' | 'NDB'>('P');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{type: 'SUCCESS' | 'LOCAL' | 'ERROR', msg: string} | null>(null);

  const filteredTeams = INITIAL_TEAMS.filter(t => t.lga === lga);

  const myRecentReports = useMemo(() => {
    return reports
      .filter(r => r.teamId === teamId)
      .slice(0, 3);
  }, [reports, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lga || !teamId) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    const reportData = {
      teamId,
      month,
      week,
      score: status === 'P' ? score : 0,
      status,
    };

    try {
      await firestoreService.saveReport(reportData);
      setSubmissionResult({ type: 'SUCCESS', msg: 'Report successfully synced to State Headquarters.' });
    } catch (err: any) {
      const localReport: WeeklyReport = {
        ...reportData,
        id: `local_${Date.now()}`,
        submittedAt: new Date().toISOString(),
      };
      storageService.saveReport(localReport);
      
      const isPermission = err.message?.includes('PERMISSION_DENIED');
      setSubmissionResult({ 
        type: isPermission ? 'ERROR' : 'LOCAL', 
        msg: isPermission 
          ? 'Permission denied. Please ask the Administrator to update Firestore Security Rules.' 
          : 'Saved on device. Auto-sync will resume when connectivity is restored.' 
      });
    } finally {
      setIsSubmitting(false);
      setScore(0);
      setTimeout(() => setSubmissionResult(null), 6000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20">
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        {/* Progress Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
           <div className={`h-full bg-indigo-600 transition-all duration-500 ${lga ? 'w-1/3' : 'w-0'} ${teamId ? 'w-2/3' : ''} ${submissionResult ? 'w-full' : ''}`} />
        </div>

        <h2 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          </div>
          New Performance Entry
        </h2>
        
        {submissionResult && (
          <div className={`mb-10 p-6 rounded-3xl flex items-center gap-5 animate-slideDown border ${
            submissionResult.type === 'ERROR' ? 'bg-rose-50 text-rose-800 border-rose-100' :
            submissionResult.type === 'LOCAL' ? 'bg-amber-50 text-amber-800 border-amber-100' : 
            'bg-emerald-50 text-emerald-800 border-emerald-100'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg ${
              submissionResult.type === 'ERROR' ? 'bg-rose-500 shadow-rose-200' :
              submissionResult.type === 'LOCAL' ? 'bg-amber-500 shadow-amber-200' : 
              'bg-emerald-500 shadow-emerald-200'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight">
                {submissionResult.type === 'ERROR' ? 'Permission Error' :
                 submissionResult.type === 'LOCAL' ? 'Pending Synchronization' : 
                 'Mission Successful'}
              </p>
              <p className="text-xs font-medium opacity-70 mt-1">{submissionResult.msg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Local Gov Area</label>
              <select 
                value={lga} 
                onChange={(e) => { setLga(e.target.value as LGA); setTeamId(''); }}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[1.5rem] transition-all outline-none font-bold text-slate-700 shadow-sm"
                required
              >
                <option value="">Select LGA</option>
                {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Team Selection</label>
              <select 
                value={teamId} 
                disabled={!lga}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[1.5rem] transition-all outline-none font-bold text-slate-700 shadow-sm disabled:opacity-40"
                required
              >
                <option value="">{lga ? 'Choose Team' : 'Select LGA First'}</option>
                {filteredTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.id} — {t.members[0]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Reporting Period</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[1.5rem] font-bold text-slate-700 shadow-sm outline-none"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Week</label>
              <select 
                value={week} 
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[1.5rem] font-bold text-slate-700 shadow-sm outline-none"
              >
                {[1, 2, 3, 4].map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Center Attendance</label>
            <div className="flex gap-3 bg-slate-100/80 p-2 rounded-[1.5rem]">
              {['P', 'ABS', 'NDB'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s as any)}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                    status === s 
                    ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s === 'P' ? 'PRESENT' : s === 'ABS' ? 'ABSENT' : 'NO DATA'}
                </button>
              ))}
            </div>
          </div>

          {status === 'P' && (
            <div className="space-y-3 animate-slideDown">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Weekly Merit Score</label>
              <input 
                type="number" 
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[2rem] transition-all outline-none font-black text-4xl text-center text-indigo-600 shadow-inner"
                min="0"
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-6 rounded-[2rem] shadow-2xl shadow-indigo-600/20 font-black transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 text-sm tracking-[0.1em] ${
              isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isSubmitting ? (
              <span className="animate-pulse">COMMITTING DATA...</span>
            ) : (
              <>
                SUBMIT PERFORMANCE REPORT
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </>
            )}
          </button>
        </form>
      </div>

      {teamId && myRecentReports.length > 0 && (
        <div className="p-10 bg-slate-900 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
           </div>
           <h3 className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            Submission History
          </h3>
          <div className="space-y-4">
            {myRecentReports.map(r => (
              <div key={r.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div>
                  <div className="text-xs font-black text-slate-100">{r.month} • Week {r.week}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Processed: {new Date(r.submittedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-indigo-400">+{r.score}</div>
                  <div className={`text-[9px] font-black uppercase tracking-widest ${r.status === 'P' ? 'text-emerald-400' : 'text-rose-400'}`}>{r.status === 'P' ? 'Active' : 'Missing'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};