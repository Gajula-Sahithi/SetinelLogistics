import React, { useState, useEffect } from 'react';
import { ref, onValue, update, push } from 'firebase/database';
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
        <header className="flex justify-between items-center bg-[var(--bg-tertiary)]/40 p-10 rounded-3xl border border-[var(--border-primary)]/60">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-rose-500 text-black rounded-2xl">
                 <Shield className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Intelligence Log</h2>
                 <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-[0.3em] mt-1">Real-time threat detection engine</p>
              </div>
           </div>
           <div className="flex gap-3">
              <button
                 onClick={async () => {
                    try {
                       const res = await fetch('/api/trigger-analysis', { method: 'POST' });
                       if (res.ok) alert('Analysis triggered successfully');
                       else alert('Failed to trigger analysis');
                    } catch (e) {
                       alert('Error triggering analysis: ' + e.message);
                    }
                 }}
                 className="px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] rounded-xl transition-all"
              >
                 Trigger Analysis
              </button>
              <button
                 onClick={async () => {
                    try {
                       const disruptionsRef = ref(db, 'disruptions');
                        await push(disruptionsRef, {
                           timestamp: new Date().toISOString(),
                           shipmentId: 'TEST-001',
                           newsHeadline: 'Test Disruption: Port Strike in Mumbai',
                           weatherCondition: 'Severe weather conditions',
                           geminiAnalysis: 'AI analysis indicates high risk due to port strike and severe weather conditions affecting the Mumbai corridor.',
                           delayProbability: 'HIGH',
                           estimatedDelayRange: '12-24 hours',
                           affectedCheckpoint: 'Mumbai Port',
                           mitigationStrategy: 'Consider rerouting via Chennai or Nhava Sheva. Coordinate with ground teams for alternate cargo handling.',
                           actionTaken: 'Awaiting Manager Approval'
                        });
                        alert('Test disruption created successfully');
                    } catch (e) {
                       alert('Error creating test disruption: ' + e.message);
                    }
                 }}
                 className="px-6 py-3 bg-[var(--warning)] hover:bg-yellow-600 text-black font-black uppercase text-[10px] rounded-xl transition-all"
              >
                 Test Disruption
              </button>
           </div>
        </header>

        <div className="relative border-l border-[var(--border-primary)] ml-8 space-y-16 pb-12">
          {disruptions.length === 0 && !loading && (
            <div className="ml-16 p-20 glass rounded-3xl border-dashed border-[var(--border-primary)] text-center">
               <Activity className="w-12 h-12 mx-auto mb-6 text-[var(--text-muted)]" />
               <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest italic">Monitoring global signal silence...</p>
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
                <div className="absolute -left-[69px] top-0 w-3 h-3 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] ring-8 ring-black group shadow-[0_0_10px_rgba(39,39,42,0.5)]">
                   <div className={`w-full h-full rounded-full ${
                     event.delayProbability === 'HIGH' ? 'bg-rose-500 animate-pulse' : 
                     event.delayProbability === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500'
                   } shadow-[0_0_15px_rgba(244,63,94,0.3)]`}></div>
                </div>

                <div className={`card-premium p-10 hover:border-zinc-700 transition-all duration-500 border-l-4 ${
                  event.delayProbability === 'HIGH' ? 'border-l-rose-500' : 
                  event.delayProbability === 'MEDIUM' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[var(--border-primary)]">
                    <div className="flex items-center gap-6">
                       <span className="flex items-center gap-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(event.timestamp).toLocaleString()}
                       </span>
                       <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                            event.delayProbability === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                            event.delayProbability === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                             {event.delayProbability || 'LOW'} PROBABILITY
                          </span>
                          <span className="px-3 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--border-primary)]">
                             {event.estimatedDelayRange || 'NO DELAY'} IMPACT
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                       <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">ASSET ID</p>
                       <p className="text-sm font-black text-blue-500 tracking-tight">#{event.shipmentId}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter leading-[1.1] flex-1">
                         {event.newsHeadline}
                      </h3>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">AFFECTED REGION</p>
                        <p className="text-lg font-black text-rose-500 tracking-tighter">{event.affectedCheckpoint || 'Global Route'}</p>
                      </div>
                    </div>

                    <div className="p-8 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)]/50 relative overflow-hidden">
                       <p className="text-base text-[var(--text-muted)] leading-relaxed font-medium">
                          {event.geminiAnalysis}
                       </p>
                    </div>

                    {event.mitigationStrategy && (
                      <div className="p-6 bg-teal-500/5 rounded-2xl border border-teal-500/20 border-dashed">
                        <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5" />
                          Proactive Mitigation Strategy
                        </p>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                          "{event.mitigationStrategy}"
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)] flex items-center gap-6 shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-primary)] shadow-inner">
                             <MapPin className="w-5 h-5 text-[var(--text-secondary)]" />
                          </div>
                          <div>
                             <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Impacted Sector</p>
                             <p className="text-sm font-bold text-[var(--text-primary)]">{event.weatherCondition}</p>
                          </div>
                       </div>
                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex items-center justify-between gap-6 shadow-sm group hover:bg-blue-500/10 transition-colors">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                 <Newspaper className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                 <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Action Protocol</p>
                                 <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">{event.actionTaken}</p>
                              </div>
                           </div>
                           
                           {event.actionTaken === 'Awaiting Manager Approval' && (
                               <button 
                                  onClick={async () => {
                                     try {
                                        const res = await fetch('/api/shipments/approve-reroute', {
                                           method: 'POST',
                                           headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify({ shipmentId: event.shipmentId })
                                        });
                                        const data = await res.json();
                                        
                                        if (res.ok) {
                                           // If backend didn't update DB, we do it here
                                           if (!data.dbUpdated) {
                                              const shipmentRef = ref(db, `shipments/${event.shipmentId}`);
                                              await update(shipmentRef, {
                                                 status: 'AT_RISK',
                                                 rerouteApproved: true,
                                                 approvalTimestamp: new Date().toISOString(),
                                                 rerouteReason: data.reason
                                              });
                                              console.log("Locally applied reroute approval to database.");
                                           }
                                           alert("Command Executed. Driver Notified via Strategic Node.");
                                        } else {
                                           alert("Failed to authorize reroute: " + (data.error || "Unknown error"));
                                        }
                                     } catch (err) {
                                        alert("Connection Error: Strategic Node might be offline.");
                                     }
                                  }}
                                  className="bg-[var(--accent-primary)] text-white text-[9px] font-black uppercase px-6 py-2 rounded-lg hover:bg-[var(--accent-hover)] transition-all shadow-xl shadow-blue-500/10"
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





