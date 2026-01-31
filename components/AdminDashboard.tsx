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
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'RECORDS'>('LEADERBOARD');
  const [filterLga, setFilterLga] = useState<LGA | 'ALL'>('ALL');
  const [copied, setCopied] = useState(false);
  
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
    navigator.clipboard.writeText('allow read, write: if true;');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'TeamID', 'LGA', 'Month', 'Week', 'Status', 'Score'];
    const csvData = filteredReports.map(r => {
      const team = INITIAL_TEAMS.find(t => t.id === r.teamId);
      return [
        new Date(r.submittedAt).toLocaleDateString(),
        r.teamId,
        team?.lga || 'Unknown',
        r.month,
        r.week,
        r.status,
        r.score
      ].join(',');
    });
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dl4all_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this cloud record forever?')) {
      await firestoreService.deleteReport(id);
    }
  };

  const getTeamInfo = (teamId: string) => INITIAL_TEAMS.find(t => t.id === teamId);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Enhanced Technical Diagnostic Card - Only shows on error in Admin View */}
      {cloudStatus === 'ERROR' && (
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-slate-800 animate-slideDown">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">Action Required: Cloud Security Lock</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  The central cloud database has entered a <span className="text-white font-bold">Read-Only state</span> due to Firebase security policy. To resume state-wide synchronization, update your Firestore Rules.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Open Firebase Console
                  </a>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
                  >
                    Retry Sync
                  </button>
                </div>
              </div>

              <div className="bg-black/50 rounded-2xl border border-slate-700 p-5 font-mono">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Firestore Rules Update</span>
                  <button 
                    onClick={handleCopyRules}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-400 px-3 py-1 rounded-lg border border-slate-600 transition-all active:scale-95"
                  >
                    {copied ? 'COPIED!' : 'COPY CODE'}
                  </button>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-indigo-400">rules_version <span className="text-slate-300">=</span> <span className="text-emerald-400">'2'</span>;</div>
                  <div className="text-slate-500 italic">// Apply this rule to enable data flow</div>
                  <div className="text-indigo-400">allow <span className="text-slate-300">read, write:</span> <span className="text-emerald-400">if true;</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Submissions</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-indigo-600 tracking-tighter">{stats.total}</span>
            <span className="text-xs font-bold text-slate-400 uppercase">Entries</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Aggregate Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-emerald-600 tracking-tighter">{stats.totalScore}</span>
            <span className="text-xs font-bold text-slate-400 uppercase">Points</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Engagement</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-amber-500 tracking-tighter">{stats.presenceRate}%</span>
            <span className="text-xs font-bold text-slate-400 uppercase">Rate</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-lg">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`flex-1 px-6 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'LEADERBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            LEADERBOARD
          </button>
          <button 
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 px-6 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'RECORDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            RECORDS
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'RECORDS' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <span className="pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
              <select 
                value={filterLga}
                onChange={(e) => setFilterLga(e.target.value as any)}
                className="bg-transparent border-none rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-0 text-slate-700"
              >
                <option value="ALL">All LGAs</option>
                {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
          <button 
            onClick={handleExportCSV}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export
          </button>
        </div>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h3 className="text-base font-black text-slate-800 mb-10 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              State DLC Performance Matrix
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="id" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10}} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1.5rem', 
                      border: 'none', 
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                      padding: '1rem'
                    }}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="totalScore" radius={[12, 12, 0, 0]} barSize={45}>
                    {leaderboardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-base font-black text-slate-800">Top Performers</h3>
            </div>
            <div className="overflow-y-auto flex-1 max-h-[440px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Center</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaderboardData.map((team, index) => (
                    <tr key={team.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                          index === 0 ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' : 
                          index === 1 ? 'bg-slate-100 text-slate-500' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-slate-400 font-bold'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-slate-900 text-sm">{team.id}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">{team.lga}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-lg font-black text-slate-900">{team.totalScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DLC Information</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Performance</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                        <p className="font-black uppercase text-xs tracking-[0.2em]">No operational records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const team = getTeamInfo(report.teamId);
                    return (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="text-xs font-black text-slate-900 mb-1">
                            {new Date(report.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-indigo-600 text-sm leading-none">{report.teamId}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{team?.lga}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                            report.status === 'P' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            report.status === 'ABS' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              report.status === 'P' ? 'bg-emerald-500' :
                              report.status === 'ABS' ? 'bg-rose-500' : 'bg-slate-400'
                            }`}></span>
                            {report.status === 'P' ? 'PRESENT' : report.status === 'ABS' ? 'ABSENT' : 'NO DATA'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xl font-black text-slate-900">{report.score}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Pts</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};