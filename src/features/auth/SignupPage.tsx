import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import {
  Briefcase,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  Scale,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business legal name is required'),
  email: z.string().email('Please enter a valid corporate email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
  phone: z.string().min(8, 'Valid contact phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'negotiator']),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'owner',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      await signupWithEmail(data);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-teal-700 text-teal-400 dark:text-white flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Create Enterprise Account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Join the business dealmaking network to initiate and negotiate commercial agreements
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Your Primary Organization Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setValue('role', 'owner')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === 'owner'
                      ? 'border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 ring-1 ring-teal-700 dark:ring-teal-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Business Owner</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    For founders & executives initiating deals and approving final contract terms.
                  </p>
                </div>

                <div
                  onClick={() => setValue('role', 'negotiator')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === 'negotiator'
                      ? 'border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 ring-1 ring-teal-700 dark:ring-teal-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Negotiator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    For legal counsel, brokers, or advisors bargaining on a client's behalf.
                  </p>
                </div>
              </div>
              <input type="hidden" {...register('role')} />
            </div>

            {/* Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full legal name (e.g. Elena Rostova)"
                  {...register('fullName')}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Choose a unique username (e.g. erostova)"
                  {...register('username')}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                {errors.username && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.username.message}</p>
                )}
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Business / Legal Entity Name
              </label>
              <input
                type="text"
                placeholder="Enter your registered business name (e.g. Vantage Logistics Corp)"
                {...register('businessName')}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
              {errors.businessName && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your corporate email (e.g. elena@vantage.com)"
                  {...register('email')}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number (e.g. +234 800 000 0000)"
                  {...register('phone')}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a secure password (min. 6 characters)"
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

            {/* Privacy notice */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <span>
                Administrative accounts are provisioned separately by platform security officers.
                Your room activity will be subject to binding digital paper trails.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white font-semibold text-sm shadow transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Creating Secure Account...' : 'Complete Registration & Open Dealroom'}
              <ArrowRight className="w-4 h-4 text-teal-400 dark:text-white" />
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Already registered on PactPoint? </span>
            <Link to="/login" className="text-xs font-bold text-teal-800 dark:text-teal-400 hover:underline">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
