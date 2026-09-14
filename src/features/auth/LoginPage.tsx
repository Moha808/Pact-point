import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Briefcase, ArrowRight, AlertCircle, Eye, EyeOff, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type PageView = 'login' | 'forgot';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<PageView>('login');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      await loginWithEmail(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    try {
      setForgotError(null);
      setForgotLoading(true);
      await sendPasswordReset(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setForgotError('No account found with that email address.');
      } else if (code === 'auth/invalid-email') {
        setForgotError('Please enter a valid email address.');
      } else {
        setForgotError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated">

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === 'forgot' && (
            <>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-teal-700 text-teal-400 dark:text-white flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Reset your password</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your account email and we'll send you a secure reset link.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col items-center gap-3 text-center">
                  <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-sm font-bold text-teal-800 dark:text-teal-300">Reset link sent!</p>
                    <p className="text-xs text-teal-700 dark:text-teal-400 mt-1">
                      Check your inbox at <strong>{forgotEmail}</strong>. Follow the link to set a new password.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setView('login');
                      setForgotSuccess(false);
                      setForgotEmail('');
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white font-semibold text-sm shadow transition-colors flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? 'Sending reset link...' : 'Send Password Reset Link'}
                    {!forgotLoading && <ArrowRight className="w-4 h-4 text-teal-400 dark:text-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setView('login'); setForgotError(null); }}
                    className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 pt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── LOGIN VIEW ── */}
          {view === 'login' && (
            <>
              {/* Header */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-teal-700 text-teal-400 dark:text-white flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Sign in to PactPoint</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Access your active dealrooms, counteroffers, and agreements
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Regular Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Business Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your corporate email (e.g. name@company.com)"
                    {...register('email')}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setForgotError(null); setForgotSuccess(false); }}
                      className="text-xs text-teal-700 dark:text-teal-400 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your account password"
                      {...register('password')}
                      className="w-full px-3.5 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white font-semibold text-sm shadow transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
                  <ArrowRight className="w-4 h-4 text-teal-400 dark:text-white" />
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Need a new business account? </span>
                <Link to="/signup" className="text-xs font-bold text-teal-800 dark:text-teal-400 hover:underline">
                  Register here
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
