import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove, set } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { 
  Plus, Trash2, Truck, MapPin, Navigation, 
  User, Package, Send, AlertCircle, Activity, ArrowRight,
  Users, Shield, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const ManageShipments = () => {
    const { role } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('shipments'); // 'shipments' | 'drivers'
    const [formData, setFormData] = useState({
        id: '',
        origin: '',
        destination: '',
        carrier: 'RouteIQ Internal',
        cargo: '',
        transportType: 'Road', // Road, Rail, Air, Sea
        driverEmail: '',
        driverPhone: '',
        driverName: ''
    });
    
    // Driver creation form state
    const [driverForm, setDriverForm] = useState({
        email: '',
        displayName: '',
        phone: ''
    });
    const [driverCreated, setDriverCreated] = useState(false);

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

    const geocodeCity = async (cityName) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.origin || !formData.destination) return;

        // Geocode origin and destination using OpenStreetMap Nominatim (free)
        const originCoords = await geocodeCity(formData.origin);
        const destCoords = await geocodeCity(formData.destination);

        // Use geocoded coordinates or fallback to mock
        const coords = originCoords || {
            currentLat: 40.7128 + (Math.random() - 0.5),
            currentLng: -74.0060 + (Math.random() - 0.5)
        };

        const newShipment = {
            ...formData,
            currentLat: coords.currentLat,
            currentLng: coords.currentLng,
            originLat: originCoords?.lat,
            originLng: originCoords?.lng,
            destLat: destCoords?.lat,
            destLng: destCoords?.lng,
            status: 'ON_TRACK',
            riskScore: 0,
            riskReason: 'Awaiting first analysis cycle.',
            lastUpdated: new Date().toISOString(),
            eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            route: [
                { lat: coords.currentLat, lng: coords.currentLng }
            ]
        };

        await set(ref(db, `shipments/${formData.id}`), newShipment);
        setFormData({ 
            id: '', 
            origin: '', 
            destination: '', 
            carrier: 'RouteIQ Internal', 
            cargo: '',
            transportType: 'Road',
            driverEmail: '',
            driverPhone: '',
            driverName: ''
        });
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

    const createDriver = async (e) => {
        e.preventDefault();
        if (!driverForm.email || !driverForm.displayName) return;
        
        const normalizedEmail = driverForm.email.toLowerCase().trim();
        const driverUid = `driver-${normalizedEmail.split('@')[0]}-${Date.now()}`;
        
        try {
            await set(ref(db, `users/${driverUid}`), {
                email: normalizedEmail,
                displayName: driverForm.displayName,
                phone: driverForm.phone,
                role: 'Driver',
                status: 'Active',
                createdAt: new Date().toISOString(),
                createdBy: 'Manager',
                isDriverAccount: true
            });
            
            setDriverCreated(true);
            setDriverForm({ email: '', displayName: '', phone: '' });
            setTimeout(() => setDriverCreated(false), 3000);
        } catch (error) {
            console.error("Error creating driver:", error);
        }
    };

    const isAdmin = role === 'Admin';

    return (
        <Layout>
            <div className="space-y-6 pb-20">
                {/* Tab Navigation - Admin Only */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Asset Management</h1>
                        <p className="text-[var(--text-tertiary)] text-sm font-medium">Admin-only shipment and personnel control</p>
                    </div>
                </div>

                {!isAdmin && (
                    <div className="card-premium p-8 text-center space-y-4">
                        <Shield className="w-12 h-12 text-[var(--error)] mx-auto" />
                        <h3 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-sm">Access Restricted</h3>
                        <p className="text-[var(--text-secondary)] text-xs">Only Administrators can directly manage assets. Please use "Request Shipment" to submit new shipment requests for Admin approval.</p>
                    </div>
                )}

                {isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Entry Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Asset Intake</h2>
                                <p className="text-[var(--text-tertiary)] text-sm font-medium">Commission new inter-modal shipments</p>
                            </div>

                    <form onSubmit={handleSubmit} className="card-premium p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Asset Identifier</label>
                            <input 
                                type="text"
                                placeholder="E.g. SN-990-X"
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] transition-colors outline-none"
                                value={formData.id}
                                onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Origin</label>
                                <input 
                                    type="text"
                                    placeholder="Source City"
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Destination</label>
                                <input 
                                    type="text"
                                    placeholder="Target City"
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Cargo Specification</label>
                            <input 
                                type="text"
                                placeholder="E.g. Bio-medicals, Electronics"
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                value={formData.cargo}
                                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Transport Type</label>
                            <select 
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                value={formData.transportType}
                                onChange={(e) => setFormData({...formData, transportType: e.target.value})}
                                required
                            >
                                <option value="Road">Road (Truck)</option>
                                <option value="Rail">Rail (Train)</option>
                                <option value="Air">Air (Cargo Plane)</option>
                                <option value="Sea">Sea (Container Ship)</option>
                                <option value="Multi-modal">Multi-modal (Combined)</option>
                            </select>
                        </div>

                        {/* Driver Assignment - Manual Entry */}
                        <div className="border-t border-[var(--border-primary)] pt-4 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-[var(--accent-primary)]" />
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Assign Driver</label>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Driver Email</label>
                                <input 
                                    type="email"
                                    placeholder="driver@email.com"
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                    value={formData.driverEmail}
                                    onChange={(e) => setFormData({...formData, driverEmail: e.target.value})}
                                />
                                <p className="text-[10px] text-[var(--text-secondary)]">Driver will use this email to login and see assigned shipments</p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Driver Phone</label>
                                <input 
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                    value={formData.driverPhone}
                                    onChange={(e) => setFormData({...formData, driverPhone: e.target.value})}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Driver Name</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., John Smith"
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                                    value={formData.driverName}
                                    onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-xs py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
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
                        <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Live Registry</h3>
                            </div>
                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">{shipments.length} Active Modules</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {shipments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center">
                                        <Package className="w-8 h-8 text-[var(--text-muted)]" />
                                    </div>
                                    <div>
                                        <h4 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">Registry Empty</h4>
                                        <p className="text-[var(--text-secondary)] text-[10px] mt-1 uppercase font-bold tracking-tighter">Enter real operational data to begin monitoring cycle.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-3">Asset</th>
                                            <th className="px-6 py-3">Route</th>
                                            <th className="px-6 py-3">Assigned Driver</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-primary)]">
                                        {shipments.map(s => (
                                            <tr key={s.id} className="hover:bg-[var(--bg-tertiary)]/30 group transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-black text-[var(--text-primary)]">{s.id}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{s.cargo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                                        <span>{s.origin}</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                        <span>{s.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {s.driverEmail ? (
                                                        <div>
                                                            <p className="text-xs text-[var(--text-secondary)]">{s.driverName}</p>
                                                            <p className="text-[10px] text-[var(--text-tertiary)]">{s.driverEmail}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-[var(--text-secondary)] italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => deleteShipment(s.id)}
                                                        className="p-2 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
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
                )}
            </div>
        </Layout>
    );
};

export default ManageShipments;



