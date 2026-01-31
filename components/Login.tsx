import React, { useState } from 'react';
import { AuthUser, UserRole, LGA } from '../types';
import { LGAS } from '../constants';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('FIELD_OFFICER');
  const [name, setName] = useState('');
  const [lga, setLga] = useState<LGA | ''>('');
  const [passcode, setPasscode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'ADMIN' && passcode !== 'ADMIN26') {
      alert('Invalid Administrator Passcode');
      return;
    }
    onLogin({
      role,
      name: name || (role === 'ADMIN' ? 'State Admin' : 'Officer'),
      lga: role === 'FIELD_OFFICER' ? (lga as LGA) : undefined
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mb-6 rotate-3">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Gateway</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">DL4ALL Katsina State</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setRole('FIELD_OFFICER')}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                role === 'FIELD_OFFICER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              FIELD OFFICER
            </button>
            <button
              onClick={() => setRole('ADMIN')}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                role === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              ADMINISTRATOR
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'ADMIN' ? 'Enter Admin Name' : 'Enter Your Name'}
                className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                required
              />
            </div>

            {role === 'FIELD_OFFICER' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assigned LGA</label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value as LGA)}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  required
                >
                  <option value="">Select your LGA</option>
                  {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">System Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-sm tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] mt-4"
            >
              ENTER DASHBOARD
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[11px] text-slate-400 font-medium">
          Secure Cloud-Link: <span className="text-emerald-500 font-bold uppercase tracking-tighter">Verified Connection</span>
        </p>
      </div>
    </div>
  );
};