import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { 
  TrendingUp, ShieldCheck, Zap, Activity, Filter, Search, 
  MapPin, Clock, ArrowRight, Anchor, Truck, Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm] = useState('');

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setShipments(Object.values(data));
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = [
    { label: 'Network Integrity', value: '48.2%', delta: '+2.1%', icon: ShieldCheck, color: 'text-zinc-100' },
    { label: 'Active Corridors', value: shipments.length, delta: '0', icon: Activity, color: 'text-blue-500' },
    { label: 'Risk Mitigation', value: '94%', delta: '+12%', icon: Zap, color: 'text-zinc-100' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'DELAYED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'AT_RISK': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const getModeIcon = (carrier) => {
    if (carrier?.toLowerCase().includes('maersk')) return Anchor;
    if (carrier?.toLowerCase().includes('fedex')) return Plane;
    return Truck;
  };

  const filteredShipments = shipments.filter(s => {
    const matchesFilter = filter === 'ALL' || s.status === filter;
    return matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Global Overview</h1>
              <p className="text-zinc-500 text-sm font-medium">Real-time spatial monitoring engine</p>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-3">
                 <Search className="w-4 h-4 text-zinc-600" />
                 <input 
                    type="text" 
                    placeholder="Search asset ID..." 
                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-700 w-40"
                 />
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="card-premium p-6 flex flex-col justify-between h-40">
               <div className="flex justify-between items-center text-zinc-600">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
               </div>
               <div>
                  <h4 className="text-4xl font-black text-white tracking-tighter mb-2">{stat.value}</h4>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{stat.delta}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Assets Table */}
        <div className="card-premium p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Asset Registry
             </h3>
             <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                {['ALL', 'ON_TRACK', 'AT_RISK', 'DELAYED'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/30 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <th className="px-6 py-4">Asset ID</th>
                  <th className="px-6 py-4">Route Corridors</th>
                  <th className="px-6 py-4 text-center">Protocol Status</th>
                  <th className="px-6 py-4">Intelligence Analysis</th>
                  <th className="px-6 py-4 text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {loading ? (
                   [...Array(5)].map((_, i) => (
                     <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-6 h-16 bg-zinc-900/20"></td>
                     </tr>
                   ))
                ) : (
                <AnimatePresence>
                  {filteredShipments.map((shipment) => {
                    const ModeIcon = getModeIcon(shipment.carrier);
                    return (
                      <motion.tr 
                        key={shipment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                 <ModeIcon className="w-5 h-5 text-zinc-100" />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-white tracking-tight">{shipment.id}</p>
                                 <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{shipment.carrier}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-3 text-zinc-300 font-bold">
                              <span className="text-xs">{shipment.origin}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-600" />
                              <span className="text-xs">{shipment.destination}</span>
                           </div>
                           <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-black">Inter-modal Corridor</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.15em] border ${getStatusColor(shipment.status)}`}>
                              {shipment.status.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-6 py-6 max-w-xs">
                           <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic line-clamp-2">
                              {shipment.riskReason || "No anomalies detected in current cycle."}
                           </p>
                        </td>
                        <td className="px-6 py-6 text-right">
                              </div>
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
