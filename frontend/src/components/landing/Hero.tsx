'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDown, Play, Zap, Users, Layers, Timer } from 'lucide-react';

const exampleQuestions = [
  'What are our top 10 products by revenue?',
  'Show monthly sales trend for the last year',
  'Which customers have the highest lifetime value?',
  'List all products with low inventory stock',
];

const exampleSQL = `SELECT p.name AS product_name,
       SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.name
ORDER BY total_revenue DESC
LIMIT 10;`;

const stats = [
  { icon: Timer, value: '< 3s', label: 'Avg Response' },
  { icon: Zap, value: '10K+', label: 'Queries Run' },
  { icon: Layers, value: '6', label: 'Table Joins' },
  { icon: Users, value: '99.9%', label: 'Uptime' },
];

export default function Hero() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [showSQL, setShowSQL] = useState(false);

  // Typewriter effect cycling through example questions
  useEffect(() => {
    let charIndex = 0;
    setDisplayedText('');
    setShowSQL(false);

    const question = exampleQuestions[currentQuestion];
    const typeInterval = setInterval(() => {
      if (charIndex < question.length) {
        setDisplayedText(question.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setShowSQL(true), 400);
        setTimeout(() => {
          setShowSQL(false);
          setCurrentQuestion((prev) => (prev + 1) % exampleQuestions.length);
        }, 4000);
      }
    }, 45);

    return () => clearInterval(typeInterval);
  }, [currentQuestion]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 animate-gradient" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          <span className="text-text-primary">Ask Your Database</span>{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Anything
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          Transform plain English into SQL instantly. No SQL knowledge required.
          Powered by AI, built for business teams.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            Start Querying Free
            <span aria-hidden>→</span>
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border text-text-muted hover:text-text-primary hover:border-text-muted text-lg font-medium px-8 py-4 rounded-xl transition-all"
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </a>
        </div>
      </motion.div>

      {/* Live demo widget — browser mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-16 w-full max-w-3xl"
      >
        <div className="rounded-2xl border border-border bg-bg-surface/60 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-surface/80">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 text-center text-xs text-text-muted font-mono">
              queryai.app/dashboard
            </div>
          </div>

          {/* Query area */}
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-border bg-bg-base/50 p-4">
              <p className="text-sm text-text-muted mb-1">Ask a question:</p>
              <p className="text-text-primary font-medium min-h-[1.5rem]">
                {displayedText}
                <span className="inline-block w-0.5 h-5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
              </p>
            </div>

            {/* SQL result */}
            {showSQL && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-indigo-500/30 bg-slate-950 p-4"
              >
                <p className="text-xs text-indigo-400 font-semibold mb-2">Generated SQL</p>
                <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed overflow-hidden">
                  {exampleSQL}
                </pre>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating stat cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto w-full"
      >
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <Icon className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-xl font-bold text-text-primary">{value}</span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-16 mb-8"
      >
        <a href="#how-it-works" className="flex flex-col items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
          <span className="text-xs font-medium">Scroll to explore</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
