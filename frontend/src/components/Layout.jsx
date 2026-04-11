import React from 'react';
import Sidebar from './Sidebar';
import { User, Bell, ChevronRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, role } = useAuth();
  const path = window.location.pathname.split('/').filter(p => p);

  return (
    <div className="flex h-screen bg-black text-white selection:bg-blue-500/30">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            <span>Sentinel OS</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-800" />
            <span className="text-zinc-100">{path[0] || 'Operational Overview'}</span>
          </div>

          <div className="flex items-center gap-8">
            <button className="relative p-2 text-zinc-500 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            </button>
            <div className="h-8 w-px bg-zinc-900"></div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right">
                <p className="text-xs font-black text-white leading-none">{user?.displayName || 'Operator'}</p>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{role || 'Consultant'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-all">
                <User className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-10">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
