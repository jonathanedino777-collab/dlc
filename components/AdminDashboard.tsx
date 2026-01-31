import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { INITIAL_TEAMS, LGAS } from '../constants';
import { firestoreService } from '../services/firebase';
import { LGA, WeeklyReport } from '../types';

interface AdminDashboardProps {
  reports: WeeklyReport[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports }) => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'RECORDS'>('LEADERBOARD');
  const [filterLga, setFilterLga] = useState<LGA | 'ALL'>('ALL');
  
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
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* State-Wide Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl hover:scale-[1.02] transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Submissions</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-blue-600 leading-none">{stats.total}</p>
            <span className="text-[10px] text-gray-400 font-bold mb-1">REPORTS</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl hover:scale-[1.02] transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">State Aggregate</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-green-600 leading-none">{stats.totalScore}</p>
            <span className="text-[10px] text-gray-400 font-bold mb-1">POINTS</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl hover:scale-[1.02] transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Presence</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-orange-500 leading-none">{stats.presenceRate}%</p>
            <span className="text-[10px] text-gray-400 font-bold mb-1">ATTENDANCE</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-3 rounded-3xl border border-gray-100 shadow-lg">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'LEADERBOARD' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            LEADERBOARD
          </button>
          <button 
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'RECORDS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            RECORDS
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'RECORDS' && (
            <select 
              value={filterLga}
              onChange={(e) => setFilterLga(e.target.value as any)}
              className="flex-1 sm:flex-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All LGAs</option>
              {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
        </div>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              State DLC Ranking
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="totalScore" radius={[8, 8, 0, 0]} barSize={40}>
                    {leaderboardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">DLC Team</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">LGA</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaderboardData.map((team, index) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-100 text-gray-500' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-gray-900 leading-none">{team.id}</span>
                          <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold truncate max-w-[150px]">{team.members.join(' & ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">
                          {team.lga}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-black text-gray-900">{team.totalScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Master Cloud Audit Log</h3>
            <button 
              onClick={handleExportCSV}
              className="text-[10px] font-black bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              EXPORT CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Score</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">
                      No global cloud records found.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const team = getTeamInfo(report.teamId);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-[11px] text-gray-900 font-bold">
                            {new Date(report.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-[9px] text-gray-400 uppercase font-black">
                            {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-gray-700 leading-none">{report.teamId}</span>
                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest mt-1">{team?.lga}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-black text-gray-600">Week {report.week}</div>
                          <div className="text-[9px] text-gray-400 font-bold">{report.month}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            report.status === 'P' ? 'bg-green-100 text-green-700' :
                            report.status === 'ABS' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">
                          {report.score}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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