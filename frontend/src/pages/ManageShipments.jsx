import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { 
  Plus, Trash2, Truck, MapPin, Navigation, 
  User, Package, Send, AlertCircle, Activity, ArrowRight
} from 'lucide-react';


const ManageShipments = () => {
    const [shipments, setShipments] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        origin: '',
        destination: '',
        carrier: 'Sentinel Internal',
        cargo: '',
        assignedDriverUid: ''
    });

    useEffect(() => {
        // Fetch Shipments
        const shipmentsRef = ref(db, 'shipments');
        onValue(shipmentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setShipments(Object.values(data));
            else setShipments([]);
        });

        // Fetch Drivers
        const usersRef = ref(db, 'users');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const driverList = Object.entries(data)
                    .filter(([uid, info]) => info.role === 'Driver')
                    .map(([uid, info]) => ({ uid, ...info }));
                setDrivers(driverList);
            }
        });
        setLoading(false);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.origin || !formData.destination) return;

        // Mock coordinates for the new shipment (normally would use a Geocoding API)
        const mockCoords = {
            currentLat: 40.7128 + (Math.random() - 0.5),
            currentLng: -74.0060 + (Math.random() - 0.5)
        };

        const newShipment = {
            ...formData,
            ...mockCoords,
            status: 'ON_TRACK',
            riskScore: 0,
            riskReason: 'Awaiting first analysis cycle.',
            lastUpdated: new Date().toISOString(),
            eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            route: [
                { lat: mockCoords.currentLat, lng: mockCoords.currentLng }
            ]
        };

        await set(ref(db, `shipments/${formData.id}`), newShipment);
        setFormData({ id: '', origin: '', destination: '', carrier: 'Sentinel Internal', cargo: '', assignedDriverUid: '' });
    };

    const deleteShipment = async (id) => {
        if (window.confirm(`Decommission asset ${id}?`)) {
            await remove(ref(db, `shipments/${id}`));
        }
    };

    const purgeAll = async () => {
        if (window.confirm("CRITICAL: This will purge ALL operational data. Continue?")) {
            await remove(ref(db, 'shipments'));
        }
    };

    return (
        <Layout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Entry Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Asset Intake</h1>
                        <p className="text-zinc-500 text-sm font-medium">Commission new inter-modal shipments</p>
                    </div>

                    <form onSubmit={handleSubmit} className="card-premium p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asset Identifier</label>
                            <input 
                                type="text"
                                placeholder="E.g. SN-990-X"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 transition-colors outline-none"
                                value={formData.id}
                                onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Origin</label>
                                <input 
                                    type="text"
                                    placeholder="Source City"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Destination</label>
                                <input 
                                    type="text"
                                    placeholder="Target City"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cargo Specification</label>
                            <input 
                                type="text"
                                placeholder="E.g. Bio-medicals, Electronics"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none"
                                value={formData.cargo}
                                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Assign Field Operator (Driver)</label>
                            <select 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none"
                                value={formData.assignedDriverUid}
                                onChange={(e) => setFormData({...formData, assignedDriverUid: e.target.value})}
                            >
                                <option value="">Select Personnel...</option>
                                {drivers.map(d => (
                                    <option key={d.uid} value={d.uid}>{d.displayName} ({d.email})</option>
                                ))}
                            </select>
                            {drivers.length === 0 && (
                                <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase italic">No commissioned drivers available.</p>
                            )}
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-zinc-100 hover:bg-white text-black font-black uppercase text-xs py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Deploy Asset
                        </button>
                    </form>

                    <button 
                        onClick={purgeAll}
                        className="w-full border border-red-500/20 hover:bg-red-500/5 text-red-500/60 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all"
                    >
                        Purge All Operational Data
                    </button>
                </div>

                {/* Active Registry */}
                <div className="lg:col-span-2">
                    <div className="card-premium p-0 h-full overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-zinc-100">
                                <Activity className="w-5 h-5 text-blue-500" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Live Registry</h3>
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{shipments.length} Active Modules</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {shipments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-zinc-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Registry Empty</h4>
                                        <p className="text-zinc-600 text-[10px] mt-1 uppercase font-bold tracking-tighter">Enter real operational data to begin monitoring cycle.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-900 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-3">Asset</th>
                                            <th className="px-6 py-3">Route</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {shipments.map(s => (
                                            <tr key={s.id} className="hover:bg-zinc-900/30 group transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-black text-white">{s.id}</p>
                                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{s.cargo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                                        <span>{s.origin}</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                        <span>{s.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => deleteShipment(s.id)}
                                                        className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ManageShipments;
