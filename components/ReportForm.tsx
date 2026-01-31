
import React, { useState } from 'react';
import { LGAS, INITIAL_TEAMS, MONTHS } from '../constants';
import { LGA, WeeklyReport } from '../types';
import { storageService } from '../services/storageService';

export const ReportForm: React.FC = () => {
  const [lga, setLga] = useState<LGA | ''>('');
  const [teamId, setTeamId] = useState('');
  const [month, setMonth] = useState('Jan-26');
  const [week, setWeek] = useState(1);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'P' | 'ABS' | 'NDB'>('P');
  const [submitted, setSubmitted] = useState(false);

  const filteredTeams = INITIAL_TEAMS.filter(t => t.lga === lga);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lga || !teamId) return;

    const newReport: WeeklyReport = {
      id: crypto.randomUUID(),
      teamId,
      month,
      week,
      score: status === 'P' ? score : 0,
      status,
      submittedAt: new Date().toISOString()
    };

    storageService.saveReport(newReport);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Weekly Report Submission</h2>
      
      {submitted && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          Report submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select LGA</label>
          <select 
            value={lga} 
            onChange={(e) => { setLga(e.target.value as LGA); setTeamId(''); }}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            required
          >
            <option value="">-- Choose LGA --</option>
            {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {lga && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
            <select 
              value={teamId} 
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
            <select 
              value={week} 
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            >
              {[1, 2, 3, 4].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex gap-4">
            {['P', 'ABS', 'NDB'].map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  value={s} 
                  checked={status === s} 
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-600">{s === 'P' ? 'Present (Score)' : s}</span>
              </label>
            ))}
          </div>
        </div>

        {status === 'P' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score / Performance Value</label>
            <input 
              type="number" 
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              min="0"
              required
            />
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all active:scale-95 mt-6"
        >
          Send Weekly Report
        </button>
      </form>
    </div>
  );
};
