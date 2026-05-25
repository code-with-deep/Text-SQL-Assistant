'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; agreeTerms?: string; general?: string }>({});
  const [shouldShake, setShouldShake] = useState(false);

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-border' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-danger' };
    if (score === 2 || score === 3) return { score, label: 'Medium', color: 'bg-warning' };
    return { score, label: 'Strong', color: 'bg-success' };
  }, [password]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms & conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    try {
      await register(name, email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      
      const message = err?.response?.data?.detail || err?.response?.data?.email?.[0] || err?.message || 'Registration failed';
      setErrors({ general: message });
    }
  };

  return (
    <motion.div
      animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md p-8 bg-bg-surface/50 border border-border backdrop-blur-md rounded-2xl shadow-xl flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create Account</h2>
        <p className="text-sm text-text-muted">Get started querying databases with AI for free today</p>
      </div>

      {errors.general && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-sm text-danger animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-2.5 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.name ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.name && <span className="text-xs text-danger font-medium">{errors.name}</span>}
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-2.5 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.email ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.email && <span className="text-xs text-danger font-medium">{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-2.5 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.password ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                <span>PASSWORD STRENGTH</span>
                <span className="uppercase">{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden flex gap-0.5">
                <div className={`h-full flex-grow rounded-full transition-all duration-300 ${passwordStrength.color}`} style={{ maxWidth: passwordStrength.score >= 1 ? '100%' : '0%' }} />
                <div className={`h-full flex-grow rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} style={{ maxWidth: passwordStrength.score >= 2 ? '100%' : '0%' }} />
                <div className={`h-full flex-grow rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} style={{ maxWidth: passwordStrength.score >= 3 ? '100%' : '0%' }} />
                <div className={`h-full flex-grow rounded-full transition-all duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} style={{ maxWidth: passwordStrength.score >= 4 ? '100%' : '0%' }} />
              </div>
            </div>
          )}

          {errors.password && <span className="text-xs text-danger font-medium">{errors.password}</span>}
        </div>

        {/* Confirm Password Field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-2.5 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.confirmPassword ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.confirmPassword && <span className="text-xs text-danger font-medium">{errors.confirmPassword}</span>}
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 w-4.5 h-4.5 rounded border-border bg-bg-base text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="agree-terms" className="text-xs text-text-muted select-none cursor-pointer leading-normal">
              I agree to the{' '}
              <span className="font-semibold text-primary hover:underline cursor-not-allowed">Terms of Service</span> and{' '}
              <span className="font-semibold text-primary hover:underline cursor-not-allowed">Privacy Policy</span>
            </label>
          </div>
          {errors.agreeTerms && <span className="text-xs text-danger font-medium">{errors.agreeTerms}</span>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Setting up your personal database...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </motion.div>
  );
}
