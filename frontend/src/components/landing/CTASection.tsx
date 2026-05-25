'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-bg-base">
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-violet-950/20 to-bg-base -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Subtle tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Deployment</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight max-w-2xl">
            Ready to stop waiting for the{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              data team?
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Get started in under 2 minutes. Connect your database, ask your questions, and receive SQL queries and interactive insights immediately. No credit card required.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl px-8 py-4 font-semibold text-base transition-all hover:scale-105 shadow-xl hover:shadow-indigo-500/30"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-border hover:bg-bg-elevated text-text-primary rounded-xl px-8 py-4 font-semibold text-base transition-all"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
