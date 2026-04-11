import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  Truck, Navigation, MapPin, CheckCircle2, 
  AlertTriangle, Clock, ChevronRight, Map 
} from 'lucide-react';

const DriverPortal = () => {
    const { user } = useAuth();
    const [myShipments, setMyShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const shipmentsRef = ref(db, 'shipments');
        const unsubscribe = onValue(shipmentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const filtered = Object.values(data).filter(s => s.assignedDriverUid === user.uid);
                setMyShipments(filtered);
            } else {
                setMyShipments([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateStatus = async (shipmentId, status) => {
        const shipmentRef = ref(db, `shipments/${shipmentId}`);
        await update(shipmentRef, { 
            status: status,
            lastStatusUpdate: new Date().toISOString()
        });
    };

    return (
        <Layout>
            <div className="space-y-8 pb-20 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Field Operations</h1>
                    <p className="text-zinc-500 text-sm font-medium">Assigned logistics modules for {user?.displayName}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : myShipments.length === 0 ? (
                    <div className="card-premium p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-700">
                            <Truck className="w-8 h-8" />
                        </div>
                        <h3 className="text-white font-black uppercase tracking-widest text-xs">No Active Assignments</h3>
                        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-tighter">Your roster is currently clear. Contact HQ for relocation.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myShipments.map(s => (
                            <div key={s.id} className="card-premium p-0 overflow-hidden border-l-4 border-l-blue-500">
                                <div className="p-6 bg-zinc-900/50 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded">Active Asset</span>
                                            <h2 className="text-lg font-black text-white">{s.id}</h2>
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.cargo}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                                        s.status === 'AT_RISK' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                                    }`}>
                                        {s.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Load Point</p>
                                            <div className="flex items-center gap-2 text-white">
                                                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="text-sm font-bold">{s.origin}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Offload Point</p>
                                            <div className="flex items-center gap-2 text-white">
                                                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="text-sm font-bold">{s.destination}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {s.status === 'AT_RISK' && (
                                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex gap-4">
                                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                            <div>
                                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Reroute Alert</h4>
                                                <p className="text-xs text-white font-medium mt-1 italic">{s.riskReason}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => updateStatus(s.id, 'IN_TRANSIT')}
                                            disabled={s.status === 'IN_TRANSIT'}
                                            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-black uppercase text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Truck className="w-4 h-4" /> Start Transit
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(s.id, 'DELIVERED')}
                                            className="bg-zinc-100 hover:bg-white text-black font-black uppercase text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Delivered
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DriverPortal;
