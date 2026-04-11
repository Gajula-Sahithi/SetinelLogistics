import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { Users, Shield, UserCheck, Search, Mail, ShieldAlert } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userList = Object.entries(data).map(([uid, info]) => ({
                    uid,
                    ...info
                }));
                setUsers(userList);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateRole = async (uid, newRole) => {
        const userRef = ref(db, `users/${uid}`);
        await update(userRef, { role: newRole });
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles = ['Admin', 'Manager', 'Analyst', 'Driver', 'Viewer'];

    return (
        <Layout>
            <div className="space-y-8 pb-20">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1">Command Hierarchy</h1>
                        <p className="text-zinc-500 text-sm font-medium">Elevate staff credentials and manage sector access</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 max-w-md bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl">
                    <Search className="w-5 h-5 text-zinc-600" />
                    <input 
                        type="text" 
                        placeholder="Filter by email or designation..." 
                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="card-premium p-0 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Personnel Registry</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/30 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                                    <th className="px-6 py-4">Operator</th>
                                    <th className="px-6 py-4">Email Context</th>
                                    <th className="px-6 py-4">Current Designation</th>
                                    <th className="px-6 py-4 text-right">Access Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-600 font-bold uppercase tracking-widest animate-pulse">Synchronizing Registry...</td></tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.uid} className="hover:bg-zinc-900/40 transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                                                        {u.photoURL ? <img src={u.photoURL} alt="" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800"><Shield className="w-5 h-5" /></div>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{u.displayName || 'Unknown Operator'}</p>
                                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Last Activity: {new Date(u.lastLogin).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    <Mail className="w-3.5 h-3.5 text-zinc-600" />
                                                    <span className="text-xs font-medium">{u.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 font-mono">
                                                <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.15em] border ${
                                                    u.role === 'Admin' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                                    u.role === 'Manager' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                                                    'text-zinc-500 bg-zinc-800 border-zinc-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                {/* Ensure hardcoded admins can't be demoted via UI for safety */}
                                                {(u.email === 'gantannagarisrinath123@gmail.com' || u.email === 'gajulasahithi2006@gmail.com') ? (
                                                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest flex items-center justify-end gap-2">
                                                        <ShieldAlert className="w-4 h-4" /> Root Authorization
                                                    </span>
                                                ) : (
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {roles.map(r => (
                                                            <button 
                                                                key={r}
                                                                onClick={() => updateRole(u.uid, r)}
                                                                disabled={u.role === r}
                                                                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${
                                                                    u.role === r ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-black hover:bg-white active:scale-95'
                                                                }`}
                                                            >
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminPanel;
