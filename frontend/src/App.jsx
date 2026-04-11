import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import Analytics from './pages/Analytics';
import CarbonReport from './pages/Carbon';
import Disruptions from './pages/Disruptions';
import AdminPanel from './pages/AdminPanel';
import ManageShipments from './pages/ManageShipments';
import DriverPortal from './pages/DriverPortal';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/heatmap" 
            element={
              <ProtectedRoute>
                <Heatmap />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/disruptions" 
            element={
              <ProtectedRoute>
                <Disruptions />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/carbon" 
            element={
              <ProtectedRoute>
                <CarbonReport />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/manage" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <ManageShipments />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/driver" 
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DriverPortal />
              </ProtectedRoute>
            } 
          />

          {/* Fallback routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/unauthorized" element={
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-white p-6 text-center text-slate-300">
              <h1 className="text-6xl font-black text-red-500 mb-6 tracking-tighter">403</h1>
              <h2 className="text-3xl font-bold mb-4">Secure Zone Access Restricted</h2>
              <p className="max-w-lg mx-auto text-slate-400">Your current credentials do not grant access to this secure compartment. Please contact a system administrator if you believe this is an error.</p>
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="mt-10 bg-accent hover:bg-accent/90 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-accent/20"
              >
                Back to Dashboard
              </button>
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

