import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, ArrowRight } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation for primary admins
    const allowedEmails = ['gantannagarisrinath123@gmail.com', 'gajulasahithi2006@gmail.com'];
    if (!allowedEmails.includes(email.toLowerCase().trim())) {
      setError('Access Denied: High-level clearance required.');
      return;
    }

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid matching credentials for admin node.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-4xl font-black heading-hero mb-3">Sentinel<span className="text-blue-500">AI</span></h1>
          <p className="text-zinc-500 text-sm font-medium">Enterprise Logistics Risk Intelligence</p>
        </div>

        <div className="card-premium p-8 bg-zinc-900/50 backdrop-blur-xl border-zinc-800">
          {!isAdminMode ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Operator Portal</h2>
                <p className="text-zinc-500 text-xs">Authorize to access the global operational theatre.</p>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all duration-300"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Secure Access</span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setIsAdminMode(true)}
                  className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center gap-2 group hover:border-blue-500/50 transition-colors"
                 >
                    <Lock className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[9px] font-bold text-zinc-600 group-hover:text-blue-400 uppercase tracking-widest">Admin Command</span>
                 </button>
                 <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center gap-2 group cursor-not-allowed opacity-50">
                    <Globe className="w-4 h-4 text-zinc-600" />
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">External SSO</span>
                 </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    Admin Command
                  </h2>
                  <button 
                    type="button"
                    onClick={() => setIsAdminMode(false)}
                    className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold tracking-widest"
                  >
                    Back
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Node</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sentinel.ai"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Secure Protocol</label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 group"
              >
                Execute Authorization
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-12 text-[10px] font-black text-zinc-800 uppercase tracking-[0.3em]">
          ISO-27001 Certified System &bull; © 2026 Sentinel Logistics
        </p>
      </div>
    </div>
  );
};

export default Login;
