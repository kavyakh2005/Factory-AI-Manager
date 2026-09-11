import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Factory, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = async (ownerEmail: string, ownerPass: string) => {
    setEmail(ownerEmail);
    setPassword(ownerPass);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(ownerEmail, ownerPass);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-factory-950 via-slate-900 to-factory-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-emerald-500 shadow-xl shadow-indigo-500/20 text-white mb-2">
            <Factory className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-white">FACTORY AI MANAGER</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
              <Globe className="w-3 h-3" /> Web
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Intelligent Garment Manufacturing Web System (React + Supabase)
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 border border-slate-700/80 bg-factory-900/90 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="kavyakhandelwal57@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-factory-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-factory-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Factory System
            </Button>
          </form>

          {/* Quick Real Owner Sign In */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Registered Factory Owner Login</span>
            </div>
            
            <button
              type="button"
              onClick={() => quickFill('kavyakhandelwal57@gmail.com', 'Kavya@2005')}
              className="w-full p-3 text-left rounded-xl bg-factory-950 hover:bg-factory-800 border border-slate-800 hover:border-primary-500/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>Kavya Khandelwal</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[10px] font-bold">Owner</span>
                </div>
                <div className="text-slate-400 text-[11px] font-mono mt-0.5">kavyakhandelwal57@gmail.com</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </Card>

        {/* Cost & Architecture Notice */}
        <div className="text-center text-xs text-slate-500">
          Supabase PostgreSQL Architecture • ₹0/Month Recurring Infrastructure
        </div>
      </div>
    </div>
  );
};
