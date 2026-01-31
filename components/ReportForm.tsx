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
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);

    const reportData = {
      teamId,
      month,
      week,
      score: status === 'P' ? score : 0,
      status,
    };

    try {
      // 1. Attempt Cloud Save
      await firestoreService.saveReport(reportData);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Cloud Submission Failed:", err);
      
      // 2. Fallback: Save Locally if cloud fails
      const localReport: WeeklyReport = {
        ...reportData,
        id: `local_${Date.now()}`,
        submittedAt: new Date().toISOString(),
      };
      storageService.saveReport(localReport);
      
      setErrorMsg("Sync Pending: Your report is saved locally on this device.");
      setSubmitted(true); // Still show success UI but with the warning
    } finally {
      setIsSubmitting(false);
      setScore(0);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-gray-100 transition-all">
        <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Weekly Submission
        </h2>
        
        {submitted && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn border ${errorMsg ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${errorMsg ? 'bg-orange-500' : 'bg-green-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{errorMsg ? 'Saved Locally' : 'Report Synced Successfully!'}</p>
              <p className="text-[10px] opacity-80 leading-tight">{errorMsg || 'Visible to state administrators immediately.'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target LGA</label>
            <select 
              value={lga} 
              onChange={(e) => { setLga(e.target.value as LGA); setTeamId(''); }}
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-semibold text-gray-700 shadow-sm"
              required
            >
              <option value="">-- Choose LGA --</option>
              {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {lga && (
            <div className="animate-slideDown">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Team Selection</label>
              <select 
                value={teamId} 
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-semibold text-gray-700 shadow-sm"
                required
              >
                <option value="">-- Choose Team --</option>
                {filteredTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.members.join(' & ')}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Period Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-semibold text-gray-700 shadow-sm"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reporting Week</label>
              <select 
                value={week} 
                onChange={(e) => setWeek(Number(e.target.value))}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-semibold text-gray-700 shadow-sm"
              >
                {[1, 2, 3, 4].map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Attendance Status</label>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
              {['P', 'ABS', 'NDB'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s as any)}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                    status === s 
                    ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s === 'P' ? 'PRESENT' : s === 'ABS' ? 'ABSENT' : 'NO DATA'}
                </button>
              ))}
            </div>
          </div>

          {status === 'P' && (
            <div className="animate-slideDown">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Weekly Performance Score</label>
              <input 
                type="number" 
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-black text-2xl text-center text-blue-600 shadow-inner"
                min="0"
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl shadow-xl font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1'
            }`}
          >
            {isSubmitting ? (
              <span className="animate-pulse">SYNCING...</span>
            ) : (
              <>
                SUBMIT WEEKLY REPORT
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </>
            )}
          </button>
        </form>
      </div>

      {teamId && myRecentReports.length > 0 && (
        <div className="p-6 bg-gray-900 rounded-3xl shadow-2xl text-white">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            My Device History
          </h3>
          <div className="space-y-3">
            {myRecentReports.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <div className="text-xs font-bold">{r.month} - Week {r.week}</div>
                  <div className="text-[10px] text-gray-400">{new Date(r.submittedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-blue-300">+{r.score}</div>
                  <div className={`text-[10px] font-bold ${r.status === 'P' ? 'text-green-400' : 'text-red-400'}`}>{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};