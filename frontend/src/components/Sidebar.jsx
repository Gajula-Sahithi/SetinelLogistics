import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Activity, 
  BarChart3, Settings, Shield, LogOut,
  FolderLock, Truck, UserCog, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, role } = useAuth();

  const getLinks = () => {
    const baseLinks = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Risk Heatmap', path: '/heatmap', icon: Map },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Sustainability', path: '/carbon', icon: Settings },
    ];

    if (role?.toLowerCase() === 'admin') {
      return [
        ...baseLinks,
        { name: 'Intelligence', path: '/disruptions', icon: Activity },
        { name: 'Manage Assets', path: '/manage', icon: Database },
        { name: 'System Access', path: '/admin', icon: UserCog },
      ];
    }

    if (role === 'Manager') {
      return [
        ...baseLinks,
        { name: 'Intelligence', path: '/disruptions', icon: Activity },
        { name: 'Manage Assets', path: '/manage', icon: Database },
      ];
    }

    if (role === 'Driver') {
      return [
        { name: 'Field Portal', path: '/driver', icon: Truck },
      ];
    }

    return baseLinks; // Analyst / Viewer
  };

  const links = getLinks();

  return (
    <div className="w-64 border-r border-zinc-900 flex flex-col h-full bg-black">
      <div className="p-8 border-b border-zinc-900">
        <div className="flex items-center gap-3 group px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black heading-hero">Sentinel<span className="text-zinc-500 font-medium">AI</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-zinc-900 text-white font-bold border border-zinc-800' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'}
            `}
          >
            <link.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm tracking-tight">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-zinc-900 bg-zinc-950/50">
        <div className="mb-4 px-4 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-zinc-600" />
              Security Clearance
            </p>
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-black uppercase tracking-wider ${
                role === 'Admin' ? 'text-red-500' : 
                role === 'Manager' ? 'text-blue-500' : 
                'text-zinc-400'
              }`}>
                {role || 'Authenticating...'}
              </p>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                role ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'
              }`} />
            </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm font-bold tracking-tight text-zinc-400 group-hover:text-rose-400">System Signoff</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

