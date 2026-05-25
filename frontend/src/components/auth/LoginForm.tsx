'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [shouldShake, setShouldShake] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      
      const message = err?.response?.data?.detail || err?.message || 'Invalid email or password';
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
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h2>
        <p className="text-sm text-text-muted">Enter your credentials to access your database workspace</p>
      </div>

      {errors.general && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-sm text-danger animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.email ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.email && <span className="text-xs text-danger font-medium">{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3 bg-bg-base border rounded-xl text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:outline-none transition-all ${
                errors.password ? 'border-danger focus:ring-danger' : 'border-border focus:border-primary'
              }`}
            />
          </div>
          {errors.password && <span className="text-xs text-danger font-medium">{errors.password}</span>}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="w-4.5 h-4.5 rounded border-border bg-bg-base text-primary focus:ring-primary"
          />
          <label htmlFor="remember-me" className="text-xs font-semibold text-text-muted select-none cursor-pointer">
            Remember this device
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign up free
        </Link>
      </div>
    </motion.div>
  );
}
