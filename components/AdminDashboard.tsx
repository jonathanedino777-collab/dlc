
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { INITIAL_TEAMS, LGAS } from '../constants';
import { storageService } from '../services/storageService';
import { LGA } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'RECORDS'>('LEADERBOARD');
  const [filterLga, setFilterLga] = useState<LGA | 'ALL'>('ALL');
  
  const reports = storageService.getReports();

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

  const getTeamInfo = (teamId: string) => INITIAL_TEAMS.find(t => t.id === teamId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'LEADERBOARD' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Leaderboard
          </button>
          <button 
            onClick={() => setActiveTab('RECORDS')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'RECORDS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Records
          </button>
        </div>

        {activeTab === 'RECORDS' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase">Filter by LGA:</span>
            <select 
              value={filterLga}
              onChange={(e) => setFilterLga(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All LGAs</option>
              {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Leaderboard (Highest to Lowest)</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="totalScore" radius={[4, 4, 0, 0]} barSize={32}>
                    {leaderboardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Team</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">LGA</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Submissions</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ground Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaderboardData.map((team, index) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-blue-600 leading-none mb-1">{team.id}</span>
                          <span className="text-xs text-gray-500 truncate w-32 sm:w-auto">{team.members.join(' & ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">
                          {team.lga}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{team.reportCount} reports</td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">{team.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Individual Submission Records</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
              {filteredReports.length} Total Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Team</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No records found for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const team = getTeamInfo(report.teamId);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-900 font-medium">
                            {new Date(report.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                            {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-gray-700 leading-none">{report.teamId}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{team?.lga}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-600">Week {report.week}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{report.month}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            report.status === 'P' ? 'bg-green-100 text-green-700' :
                            report.status === 'ABS' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">
                          {report.score}
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
