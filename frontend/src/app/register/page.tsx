'use client';

import React from 'react';
import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { motion } from 'framer-motion';
import { Database, Sparkles, Shield, BarChart3 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-bg-base overflow-hidden">
      {/* Left side: Premium Shifting Gradient and Feature Showcases */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-center justify-center p-12 overflow-hidden border-r border-border">
        {/* Animated Gradient Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-violet-950/40 to-slate-950 -z-10" />
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />

        <div className="max-w-md flex flex-col gap-12 relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              QueryAI
            </span>
          </Link>

          {/* Heading */}
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Join Thousands of{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Data Innovators
              </span>
            </h1>
            <p className="text-base text-text-muted leading-relaxed">
              Connect to your databases and instantly empower non-technical and technical teammates with plain English analytics.
            </p>
          </div>

          {/* Floating cards */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Sparkles, title: 'AI-Generated SQL', desc: 'Queries generated and optimized instantly by Gemini LLM.' },
              { icon: Shield, title: 'Safety-First Sandboxing', desc: 'Safe execution engine locks down write actions.' },
              { icon: BarChart3, title: 'Instant Interactive Charts', desc: 'Automatic chart generation mapping data to visual graphs.' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg hover:bg-white/10 transition-all duration-200"
                >
                  <div className="p-2 h-fit rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-text-primary">{card.title}</span>
                    <span className="text-xs text-text-muted leading-relaxed">{card.desc}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-bg-base relative">
        {/* Subtle background glow for mobile/smaller screens */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl lg:hidden pointer-events-none" />
        <RegisterForm />
      </div>
    </div>
  );
}
