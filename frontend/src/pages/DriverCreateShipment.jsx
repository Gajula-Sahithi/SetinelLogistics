import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Plus, Truck, MapPin, Package, Send, CheckCircle, AlertCircle } from 'lucide-react';

const DriverCreateShipment = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        origin: '',
        destination: '',
        cargo: '',
        weight: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.origin || !formData.destination) return;

        setLoading(true);
        
        // Generate coordinates (mock - in production use geocoding API)
        const mockCoords = {
            currentLat: 40.7128 + (Math.random() - 0.5) * 2,
            currentLng: -74.0060 + (Math.random() - 0.5) * 2
        };

        const newShipment = {
            ...formData,
            ...mockCoords,
            status: 'PENDING_APPROVAL', // Requires admin approval
            riskScore: 0,
            riskReason: 'Awaiting approval and first analysis cycle.',
            lastUpdated: new Date().toISOString(),
            eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            route: [{ lat: mockCoords.currentLat, lng: mockCoords.currentLng }],
            createdBy: user?.uid,
            createdByName: user?.displayName || user?.email,
            assignedDriverUid: user?.uid, // Auto-assign to creating driver
            carrier: 'RouteIQ Driver Network',
            requiresApproval: true
        };

        try {
            await set(ref(db, `shipments/${formData.id}`), newShipment);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ id: '', origin: '', destination: '', cargo: '', weight: '', notes: '' });
            }, 3000);
        } catch (error) {
            console.error("Error creating shipment:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Submit Shipment</h1>
                    <p className="text-[var(--text-tertiary)] text-sm font-medium">Create new logistics entry for admin approval</p>
                </div>

                {success && (
                    <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">Shipment submitted successfully! Awaiting admin approval.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" />
                                Shipment ID
                            </label>
                            <input 
                                type="text"
                                required
                                placeholder="e.g., SHIP-2024-001"
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.id}
                                onChange={(e) => setFormData({...formData, id: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                <Truck className="w-3.5 h-3.5" />
                                Cargo Description
                            </label>
                            <input 
                                type="text"
                                placeholder="e.g., Electronics, Furniture..."
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.cargo}
                                onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                Origin Location
                            </label>
                            <input 
                                type="text"
                                required
                                placeholder="e.g., New York, NY"
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.origin}
                                onChange={(e) => setFormData({...formData, origin: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                Destination
                            </label>
                            <input 
                                type="text"
                                required
                                placeholder="e.g., Los Angeles, CA"
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.destination}
                                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                                Weight (kg)
                            </label>
                            <input 
                                type="number"
                                placeholder="e.g., 1500"
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.weight}
                                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                                Additional Notes
                            </label>
                            <input 
                                type="text"
                                placeholder="Any special handling instructions..."
                                className="w-full bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-primary)]">
                        <div className="flex items-start gap-3 mb-6 text-[var(--text-tertiary)]">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-xs">
                                This shipment will be created with <span className="text-amber-400 font-bold">PENDING APPROVAL</span> status. 
                                An administrator must review and approve it before it becomes active.
                            </p>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit for Approval
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default DriverCreateShipment;



