import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, ArrowRight, UserCheck } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const allowedEmails = ['gantannagarisrinath123@gmail.com', 'gajulasahithi2006@gmail.com'];
    if (!allowedEmails.includes(email.toLowerCase().trim())) {
      setError('Access Denied: High-level clearance required.');
      setLoading(false);
      return;
    }

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid matching credentials for admin node.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-cyan-500/30">
      
      {/* Dynamic Glowing Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/20 blur-[150px] rounded-full animate-pulse opacity-60" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] mb-8 backdrop-blur-xl group relative">
             <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Shield className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 tracking-tight mb-3">
            RouteIQ
          </h1>
          <p className="text-xs sm:text-sm font-bold text-cyan-400/80 tracking-[0.4em] uppercase">
            Risk Intelligence Terminal
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="relative rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
          {/* Subtle Top Inner Glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="p-8 sm:p-10">
            {!isAdminMode ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">Operator Portal</h2>
                  <p className="text-sm text-zinc-400 font-medium">Authenticate to access the global logistics theatre.</p>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-2xl bg-zinc-100 text-black py-4 px-6 flex items-center justify-center font-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="relative z-10 tracking-wide">Sign in with Google</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Or access via</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                    onClick={() => setIsAdminMode(true)}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/30 transition-all group"
                   >
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                         <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-100 uppercase tracking-wider">Admin Root</span>
                   </button>
                   <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                      <div className="p-2.5 rounded-xl bg-white/5 text-zinc-500">
                         <Globe className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Enterprise SSO</span>
                   </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-zinc-100 flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                       <UserCheck className="w-5 h-5" />
                     </div>
                     Root Access
                  </h2>
                  <button 
                    type="button"
                    onClick={() => setIsAdminMode(false)}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    &larr; Back
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Node</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@routeiq.ai"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Security Key</label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-xs font-bold flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-4 px-6 font-black uppercase tracking-wider text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Execute Authorization
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] font-bold text-zinc-600 tracking-[0.3em] uppercase">
            ISO-27001 Certified System &bull; Â© 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


