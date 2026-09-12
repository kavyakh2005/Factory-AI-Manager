import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import { Factory, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Globe, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, loginWithGoogle, handleOAuthSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  // Listen to incoming Supabase Google OAuth redirects & sessions
  useEffect(() => {
    const processInitialSession = async () => {
      if (isSupabaseConfigured) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            await handleOAuthSession(session.user);
            navigate(from, { replace: true });
          }
        } catch (err) {
          console.warn('Initial session check error:', err);
        }
      }
    };

    processInitialSession();

    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await handleOAuthSession(session.user);
            navigate(from, { replace: true });
          } catch (err) {
            console.warn('Auth state change error:', err);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [navigate, from, handleOAuthSession]);

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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMessage(err?.message || 'Google Sign-In failed. Please check Supabase configuration.');
      setIsGoogleLoading(false);
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
            Shree Raas Krishnam Creation • Garment ERP
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 border border-slate-700/80 bg-factory-900/90 shadow-2xl backdrop-blur-md">
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Google OAuth Sign-In Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 group active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="tracking-wide">
                {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google Account'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-factory-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Or Sign In with Email & Password
              </span>
              <div className="border-t border-slate-800 w-full"></div>
            </div>

            {/* 2. Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full py-3 mt-2 font-bold"
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Factory System
              </Button>
            </form>
          </div>

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
                  <span className="px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[10px] font-bold">
                    Owner
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                  kavyakhandelwal57@gmail.com
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </Card>

        {/* Cost & Architecture Notice */}
        <div className="text-center text-xs text-slate-500">
          Supabase PostgreSQL Architecture • Google OAuth Enabled
        </div>
      </div>
    </div>
  );
};
