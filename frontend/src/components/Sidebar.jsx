import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Activity, MapPin,
  BarChart3, Settings, Shield, LogOut,
  FolderLock, Truck, UserCog, Database,
  PlusCircle, CheckSquare, Sun, Moon, Eye, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const Sidebar = () => {
  const { logout, role } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        { name: 'Fleet Tracking', path: '/fleet', icon: MapPin },
        { name: 'View Shipments', path: '/view-shipments', icon: Eye },
        { name: 'Manage Assets', path: '/manage', icon: Database },
        { name: 'Approve Shipments', path: '/admin/shipments', icon: CheckSquare },
      ];
    }

    if (role === 'Manager') {
      return [
        ...baseLinks,
        { name: 'Intelligence', path: '/disruptions', icon: Activity },
        { name: 'Fleet Tracking', path: '/fleet', icon: MapPin },
        { name: 'View Shipments', path: '/view-shipments', icon: Eye },
        { name: 'Request Shipment', path: '/driver/create-shipment', icon: PlusCircle },
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
    <div className="w-72 border-r border-border flex flex-col h-full bg-background transition-all duration-300">
      <div className="p-8 border-b border-border/50">
        <div className="flex items-center gap-3 group px-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/40 group-hover:rotate-6 transition-transform">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-l1-hero text-text-primary tracking-wider">RouteIQ</span>
            <span className="text-[10px] font-l5-micro text-accent -mt-1">Logistics AI</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              sidebar-link group
              ${isActive 
                ? 'sidebar-link-active' 
                : 'text-text-muted hover:text-text-primary hover:bg-surface/30'}
            `}
          >
            <link.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-[13px] font-medium tracking-tight">{link.name}</span>
            {link.path === '/disruptions' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_var(--color-danger)]"></span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 space-y-3 bg-surface/20 border-t border-border/50 backdrop-blur-sm">
        {/* Security Clearance Badge */}
        <div className="clay-card p-4 border-none !bg-surface/40">
           <div className="flex items-center justify-between mb-2">
              <span className="font-l5-micro text-text-muted">Security Clearance</span>
              <Shield className={`w-3 h-3 ${role === 'Admin' ? 'text-danger' : 'text-accent'}`} />
           </div>
           <div className="flex items-end justify-between">
              <span className={`text-base font-l2-card uppercase ${
                role === 'Admin' ? 'text-danger' : 
                role === 'Manager' ? 'text-accent' : 
                'text-teal'
              }`}>
                {role || 'Standard'}
              </span>
              <div className="flex gap-1">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={`w-1 h-3 rounded-full ${i <= (role === 'Admin' ? 3 : role === 'Manager' ? 2 : 1) ? (role === 'Admin' ? 'bg-danger' : 'bg-accent') : 'bg-text-muted/20'}`}></div>
                 ))}
              </div>
           </div>
        </div>

        {/* Theme & Settings Control */}
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 clay-card p-3 flex items-center justify-center hover:bg-surface/60 transition-colors group"
            title="Toggle Protocol"
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-violet group-hover:rotate-12 transition-transform" />
            ) : (
              <Sun className="w-5 h-5 text-warn group-hover:rotate-12 transition-transform" />
            )}
          </button>
          
          <div className="flex-1 relative flex">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full clay-card p-3 flex items-center justify-center hover:bg-surface/60 transition-colors group"
            >
              <Settings className={`w-5 h-5 text-text-muted group-hover:rotate-90 transition-transform ${settingsOpen ? 'text-accent' : ''}`} />
            </button>
            
            {settingsOpen && (
              <div className="absolute bottom-full left-0 mb-3 w-48 clay-card p-2 !bg-surface shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2 py-1.5 border-b border-border/50 mb-1">
                  <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">System Settings</span>
                </div>
                {(role === 'Admin' || role === 'Manager') && (
                  <NavLink 
                    to="/admin" 
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors text-text-primary text-xs font-bold"
                  >
                    <UserCog className="w-4 h-4 text-accent" />
                    User Control
                  </NavLink>
                )}
                {/* Fallback for non-admins to just show something if they click it */}
                <div className="flex items-center gap-3 p-2.5 rounded-lg text-text-muted text-xs font-medium cursor-not-allowed opacity-50">
                   <Settings className="w-4 h-4" />
                   Preferences (Coming Soon)
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={logout}
            className="flex-1 clay-card p-3 flex items-center justify-center hover:bg-danger/10 hover:border-danger/20 group transition-all"
            title="Terminate Session"
          >
            <LogOut className="w-5 h-5 text-text-muted group-hover:text-danger group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


