import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { BarChart3, ChevronDown, Activity, Shield } from 'lucide-react';

const Analytics = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setShipments(Object.values(data));
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const statusData = [
    { name: 'On Track', value: shipments.filter(s => s.status === 'ON_TRACK').length },
    { name: 'At Risk', value: shipments.filter(s => s.status === 'AT_RISK').length },
    { name: 'Delayed', value: shipments.filter(s => s.status === 'DELAYED').length },
  ];

  const riskTrendData = [
    { name: 'Mon', risk: 12 }, { name: 'Tue', risk: 18 }, { name: 'Wed', risk: 25 },
    { name: 'Thu', risk: 45 }, { name: 'Fri', risk: 38 }, { name: 'Sat', risk: 65 }, { name: 'Sun', risk: 55 },
  ];

  const emissionsData = shipments.map(s => ({
    name: s.id,
    co2: (s.riskScore * 0.5) + 120
  })).slice(0, 5);

  const COLORS = ['#3b82f6', '#f43f5e', '#f59e0b'];

  return (
    <Layout>
      <div className="space-y-12 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-zinc-900/40 p-10 rounded-3xl border border-zinc-900">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Performance Terminal</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Cross-corridor metric synthesis</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
             {[
               { label: 'Network Safety', value: '34.2%', color: 'text-blue-500' },
               { label: 'Efficacy Ratio', value: '98.5%', color: 'text-zinc-100' },
               { label: 'Carbon intensity', value: '0.82', color: 'text-zinc-400' },
             ].map((stat, i) => (
               <div key={i}>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-none mb-3">{stat.label}</p>
                  <h4 className={`text-2xl font-black ${stat.color} tracking-tighter leading-none`}>{stat.value}</h4>
               </div>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[600px]">
          <div className="xl:col-span-2 card-premium p-10 flex flex-col">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Risk Forecast Matrix</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Rolling 7-Day Window</p>
               </div>
               <button className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-900">
                  Daily Cluster <ChevronDown className="w-3 h-3" />
               </button>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrendData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" dy={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={10} fontWeight="bold" dx={-10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-premium p-10 flex flex-col items-center">
            <h3 className="text-sm font-black text-white uppercase tracking-widest w-full mb-10">Asset Dispersion</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} 
                  />
                  <Legend verticalAlign="bottom" iconType="circle" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card-premium p-10 h-[450px] flex flex-col">
            <div className="mb-10">
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Environment Index</h3>
               <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">CO2 Exhaust Tracking</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" dy={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={10} fontWeight="bold" dx={-10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  />
                  <Bar dataKey="co2" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
