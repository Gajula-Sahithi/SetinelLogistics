import React from 'react';
import Sidebar from './Sidebar';
import { User, Bell, ChevronRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, role } = useAuth();
  const path = window.location.pathname.split('/').filter(p => p);

  return (
    <div className="flex h-screen bg-background text-text-primary selection:bg-accent/30 transition-all duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3 font-l5-micro text-text-muted">
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span className="tracking-[0.2em]">RouteIQ Protocol v4.0</span>
            <ChevronRight className="w-3 h-3 text-border" />
            <span className="text-text-primary font-bold">{path[0] || 'Operational Overview'}</span>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 clay-card !rounded-xl !bg-surface/20 border-none group">
              <Bell className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-danger rounded-full shadow-[0_0_8px_var(--color-danger)]"></span>
            </button>
            
            <div className="flex items-center gap-4 pl-4 border-l border-border/50">
              <div className="text-right">
                <p className="text-[13px] font-l2-card text-text-primary leading-none">{user?.displayName || 'Chief Officer'}</p>
                <p className="font-l5-micro text-accent mt-1">{role || 'Consultant'}</p>
              </div>
              <div className="w-11 h-11 clay-card !p-0 flex items-center justify-center bg-accent/10 border-accent/20">
                <User className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="max-w-[1600px] mx-auto px-10 py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;

