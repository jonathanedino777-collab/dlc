import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { INITIAL_TEAMS, LGAS } from '../constants';
import { firestoreService } from '../services/firebase';
import { LGA, WeeklyReport } from '../types';

interface AdminDashboardProps {
  reports: WeeklyReport[];
  error?: any;
  cloudStatus?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports, error, cloudStatus }) => {
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'REGISTRY'>('INSIGHTS');
  const [filterLga, setFilterLga] = useState<LGA | 'ALL'>('ALL');
  const [copied, setCopied] = useState(false);
  
  const isPermissionError = useMemo(() => {
    const errMsg = error?.message?.toLowerCase() || '';
    return errMsg.includes('permission') || errMsg.includes('insufficient');
  }, [error]);

  const stats = useMemo(() => {
    const total = reports.length;
    const totalScore = reports.reduce((sum, r) => sum + r.score, 0);
    const presenceCount = reports.filter(r => r.status === 'P').length;
    const presenceRate = total > 0 ? ((presenceCount / total) * 100).toFixed(1) : 0;
    
    return { total, totalScore, presenceRate };
  }, [reports]);

  const leaderboardData = useMemo(() => {
    return INITIAL_TEAMS.map(team => {
      const teamReports = reports.filter(r => r.teamId === team.id);
      const totalScore = teamReports.reduce((sum, r) => sum + r.score, 0);
      return {
        ...team,
        totalScore,
        reportCount: teamReports.length
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [reports]);

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (filterLga !== 'ALL') {
      list = list.filter(r => {
        const team = INITIAL_TEAMS.find(t => t.id === r.teamId);
        return team?.lga === filterLga;
      });
    }
    return list;
  }, [reports, filterLga]);

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lgaActivity = useMemo(() => {
    return LGAS.map(lga => {
      const lgaReports = reports.filter(r => {
        const team = INITIAL_TEAMS.find(t => t.id === r.teamId);
        return team?.lga === lga;
      });
      return { lga, count: lgaReports.length };
    });
  }, [reports]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* URGENT: Firebase Rules Fix Card */}
      {(cloudStatus === 'SYNC_ERROR' || isPermissionError) && (
        <div className="bg-rose-950 rounded-[2.5rem] p-1 shadow-2xl border border-rose-500/30 overflow-hidden">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.4rem] p-8 md:p-12 relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <svg className="w-32 h-32 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Permission Denied</span>
                </div>
                
                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                  Restore Database Access
                </h3>
                
                <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                  The system is currently <span className="text-rose-400 font-bold">LOCKED</span> due to Firebase security rules. Users cannot submit data and it will not display on the dashboard until you apply the fix below.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                  >
                    Open Firebase Console
                  </a>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all active:scale-95"
                  >
                    Refresh Connection
                  </button>
                </div>
              </div>

              <div className="w-full md:w-auto flex-shrink-0 bg-black/60 rounded-3xl p-8 border border-white/5 font-mono shadow-inner group">
                <div className="flex justify-between items-center mb-6">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paste into 'Rules' tab</p>
                   <button 
                    onClick={handleCopyRules}
                    className="text-[10px] font-black uppercase text-indigo-400 hover:text-white px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 transition-all active:scale-95"
                   >
                     {copied ? 'Copied!' : 'Copy Fix'}
                   </button>
                </div>
                <div className="text-[11px] leading-relaxed space-y-1 text-slate-400 pr-4">
                  <p><span className="text-indigo-400">rules_version</span> = '2';</p>
                  <p><span className="text-indigo-400">service</span> cloud.firestore {'{'}</p>
                  <p className="ml-4">match /databases/{'{'}database{'}'}/documents {'{'}</p>
                  <p className="ml-8">match /reports/{'{'}document=**{'}'} {'{'}</p>
                  <p className="ml-12 text-emerald-400 font-bold">allow read, write: if true;</p>
                  <p className="ml-8">{'}'}</p>
                  <p className="ml-4">{'}'}</p>
                  <p>{'}'}</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-6 border-t border-white/5 pt-4 italic">
                  * Note: Enabling 'if true' allows public access for testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Submissions', value: stats.total, color: 'text-indigo-600' },
          { label: 'State Points', value: stats.totalScore, color: 'text-emerald-600' },
          { label: 'Engagement', value: `${stats.presenceRate}%`, color: 'text-amber-500' },
          { label: 'LGAs Reporting', value: LGAS.length, color: 'text-slate-900' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{item.label}</p>
            <span className={`text-4xl font-black ${item.color} tracking-tighter`}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            {['INSIGHTS', 'REGISTRY'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'INSIGHTS' ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={leaderboardData.slice(0, 8)}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                   <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                   <Tooltip 
                      contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} 
                      cursor={{fill: '#F8FAFC'}}
                   />
                   <Bar dataKey="totalScore" radius={[10, 10, 0, 0]} barSize={40}>
                     {leaderboardData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-lg font-black text-slate-900">Historical Registry</h3>
                 <select 
                    value={filterLga} 
                    onChange={e => setFilterLga(e.target.value as any)}
                    className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-slate-200"
                 >
                   <option value="ALL">All Clusters</option>
                   {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
               </div>
               <div className="overflow-x-auto max-h-[500px]">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Period</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">DLC ID</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredReports.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="text-xs font-black text-slate-900">{r.month}</div>
                            <div className="text-[10px] text-slate-400 font-bold">Week {r.week}</div>
                          </td>
                          <td className="px-8 py-5 font-mono text-xs font-black text-indigo-600">{r.teamId}</td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-8 opacity-60">LGA Pulse</h3>
              <div className="space-y-6">
                {lgaActivity.map(item => (
                  <div key={item.lga} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="uppercase tracking-wider">{item.lga}</span>
                      <span className="opacity-60">{item.count} Reports</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-white rounded-full transition-all duration-1000" 
                        style={{width: `${Math.min(100, (item.count / 10) * 100)}%`}}
                       />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};