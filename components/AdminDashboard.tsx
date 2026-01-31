
import React, { useMemo, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { INITIAL_TEAMS, LGAS } from '../constants';
import { storageService } from '../services/storageService';
import { LGA, WeeklyReport } from '../types';

interface AdminDashboardProps {
  reports: WeeklyReport[];
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports, onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'RECORDS' | 'DATA'>('LEADERBOARD');
  const [filterLga, setFilterLga] = useState<LGA | 'ALL'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    let list = [...reports].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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
    downloadFile(csvContent, `dl4all_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(reports, null, 2);
    downloadFile(jsonString, `dl4all_database_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        storageService.importReports(content);
        onDataChanged();
        alert('Data merged successfully!');
      } catch (err) {
        alert('Invalid database file format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this record forever?')) {
      storageService.deleteReport(id);
      onDataChanged();
    }
  };

  const getTeamInfo = (teamId: string) => INITIAL_TEAMS.find(t => t.id === teamId);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* State-Wide Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl hover:scale-[1.02] transition-transform">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submissions</p>
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
          <button 
            onClick={() => setActiveTab('DATA')}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'DATA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SYNC
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
          <button 
            onClick={onDataChanged}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Refresh Data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              DLC Ranking
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
      ) : activeTab === 'RECORDS' ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Master Audit Log</h3>
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
                      No records found in local database.
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
      ) : (
        <div className="max-w-2xl mx-auto p-8 bg-gray-900 rounded-[32px] shadow-2xl text-white space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-black mb-2">Cloud Sync Simulation</h3>
            <p className="text-gray-400 text-sm">Since this app uses local device storage, use these tools to merge data from all LGA leaders into one master view.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-sm">Export Database</h4>
                <p className="text-[10px] text-gray-500 mt-1">Download your local records to share with the admin.</p>
              </div>
              <button 
                onClick={handleExportJSON}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all"
              >
                BACKUP DATA (.JSON)
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-sm">Import & Merge</h4>
                <p className="text-[10px] text-gray-500 mt-1">Upload files from other leaders to see their reports.</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-xl text-xs font-black transition-all"
              >
                SELECT FILE
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportJSON} 
                className="hidden" 
                accept=".json"
              />
            </div>
          </div>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
            <p className="text-[10px] text-orange-400 font-bold uppercase flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Note for Admin
            </p>
            <p className="text-[11px] text-gray-400 mt-1">When you import data, duplicates are automatically ignored. You can safely merge files from multiple LGA leaders to build the state-wide leaderboard.</p>
          </div>
        </div>
      )}
    </div>
  );
};
