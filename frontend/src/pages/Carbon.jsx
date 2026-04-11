import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { Globe2, Zap, Activity, ShieldCheck, Download } from 'lucide-react';

const CarbonReport = () => {
  const [shipments, setShipments] = useState([]);
  const stats = {
    totalEmissions: 4250,
    savings: 120,
    offset: 50,
    intensity: 0.85
  };

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setShipments(Object.values(data));
    });
    return () => unsubscribe();
  }, []);

  return (
    <Layout>
      <div className="space-y-12 pb-20 max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-zinc-900/40 p-10 rounded-3xl border border-zinc-900">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Sustainability Ledger</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Neural ESG Intelligence tracking</p>
          </div>
          <button className="flex items-center gap-3 bg-white text-black hover:bg-zinc-200 px-6 py-3.5 rounded-xl transition-all font-bold text-xs shadow-xl">
            <Download className="w-4 h-4" />
            Compliance Export
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Cumulative Emissions', value: stats.totalEmissions, unit: 'kg CO2', icon: Globe2, color: 'text-zinc-100' },
            { label: 'Mitigation Savings', value: stats.savings, unit: 'kg CO2', icon: Zap, color: 'text-blue-500' },
            { label: 'Fleet Intensity', value: stats.intensity, unit: 'g/km/t', icon: Activity, color: 'text-zinc-400' },
            { label: 'Offset Indexing', value: stats.offset, unit: '%', icon: ShieldCheck, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="card-premium p-8 flex flex-col justify-between h-44">
               <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-lg bg-zinc-900 border border-zinc-800 ${stat.color}`}>
                     <stat.icon className="w-5 h-5" />
                  </div>
               </div>
               <div>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-none mb-3">{stat.label}</p>
                  <h4 className="text-3xl font-black text-white tracking-tighter">
                     {stat.value} <span className="text-[10px] font-bold text-zinc-700 ml-1 italic">{stat.unit}</span>
                  </h4>
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[500px]">
           <div className="xl:col-span-2 card-premium p-0 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-zinc-900 bg-zinc-900/50">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Environmental Corridor Audit</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {shipments.slice(0, 8).map((s, idx) => (
                   <div key={s.id} className="flex items-center justify-between p-5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-colors">
                      <div className="flex items-center gap-6">
                         <span className="text-[9px] font-black text-zinc-800 tabular-nums">0{idx + 1}</span>
                         <div>
                            <p className="text-xs font-black text-white">{s.id}</p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{s.carrier}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-emerald-500 tabular-nums">142.4 kg CO2</p>
                         <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest mt-1">Efficiency Match 94%</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="card-premium p-8 flex flex-col items-center justify-center text-center">
              <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#18181b" strokeWidth="6" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="440" strokeDashoffset="88" />
                 </svg>
                 <div>
                    <p className="text-5xl font-black text-white tracking-tighter">A<span className="text-blue-500 font-medium">+</span></p>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-2">ESG Rating</p>
                 </div>
              </div>
              <div className="space-y-4 w-full">
                 <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Neutrality Goal</span>
                    <span className="text-sm font-black text-white">82%</span>
                 </div>
                 <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Biofuel Adoption</span>
                    <span className="text-sm font-black text-white">14%</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default CarbonReport;
