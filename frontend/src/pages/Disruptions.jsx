import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { AlertCircle, Clock, MapPin, Newspaper, Shield, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Disruptions = () => {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const disruptionsRef = ref(db, 'disruptions');
    const unsubscribe = onValue(disruptionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setDisruptions(list);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Layout>
      <div className="space-y-10 pb-20 max-w-5xl mx-auto">
        <header className="flex justify-between items-center bg-zinc-900/40 p-10 rounded-3xl border border-zinc-800/60">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-rose-500 text-black rounded-2xl">
                 <Shield className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-white tracking-tighter">Intelligence Log</h2>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Real-time threat detection engine</p>
              </div>
           </div>
        </header>

        <div className="relative border-l border-zinc-900 ml-8 space-y-16 pb-12">
          {disruptions.length === 0 && !loading && (
            <div className="ml-16 p-20 glass rounded-3xl border-dashed border-zinc-800 text-center">
               <Activity className="w-12 h-12 mx-auto mb-6 text-zinc-800" />
               <p className="text-sm font-black text-zinc-700 uppercase tracking-widest italic">Monitoring global signal silence...</p>
            </div>
          )}
          
          <AnimatePresence>
            {disruptions.map((event, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative ml-16"
              >
                {/* Timeline Anchor */}
                <div className="absolute -left-[69px] top-0 w-3 h-3 rounded-full bg-black border-2 border-zinc-800 ring-8 ring-black group shadow-[0_0_10px_rgba(39,39,42,0.5)]">
                   <div className={`w-full h-full rounded-full ${idx === 0 ? 'bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-800'}`}></div>
                </div>

                <div className="card-premium p-10 hover:border-zinc-700 transition-all duration-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-zinc-900">
                    <div className="flex items-center gap-6">
                       <span className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(event.timestamp).toLocaleString()}
                       </span>
                       <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                          Threat detected
                       </span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-black rounded-lg border border-zinc-900">
                       <p className="text-[10px] font-black text-zinc-700 uppercase">ASSET ID</p>
                       <p className="text-sm font-black text-blue-500 tracking-tight">#{event.shipmentId}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-4xl font-black text-white tracking-tighter leading-[1.1]">
                       {event.newsHeadline}
                    </h3>

                    <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-900/50 relative overflow-hidden">
                       <p className="text-base text-zinc-400 leading-relaxed font-medium">
                          {event.geminiAnalysis}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800 flex items-center gap-6 shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
                             <MapPin className="w-5 h-5 text-zinc-600" />
                          </div>
                          <div>
                             <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Impacted Sector</p>
                             <p className="text-sm font-bold text-zinc-100">{event.weatherCondition}</p>
                          </div>
                       </div>
                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex items-center justify-between gap-6 shadow-sm group hover:bg-blue-500/10 transition-colors">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                 <Newspaper className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                 <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Action Protocol</p>
                                 <p className="text-sm font-black text-white uppercase tracking-tighter">{event.actionTaken}</p>
                              </div>
                           </div>
                           
                           {event.actionTaken === 'Awaiting Manager Approval' && (
                              <button 
                                 onClick={async () => {
                                    const res = await fetch('/api/shipments/approve-reroute', {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ shipmentId: event.shipmentId })
                                    });
                                    if (res.ok) alert("Command Executed. Driver Notified.");
                                 }}
                                 className="bg-white text-black text-[9px] font-black uppercase px-6 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-blue-500/10"
                              >
                                 Authorize
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default Disruptions;
