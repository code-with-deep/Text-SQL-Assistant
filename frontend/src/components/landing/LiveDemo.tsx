'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const demoQueries = [
  { q: 'Top 10 customers by total spending', rows: 10, chart: 'bar' },
  { q: 'Monthly revenue trend over last 12 months', rows: 12, chart: 'line' },
  { q: 'Product category distribution by revenue', rows: 8, chart: 'pie' },
  { q: 'Average order value by customer tier', rows: 3, chart: 'bar' },
];

export default function LiveDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let charIdx = 0;
    setTypedText('');
    const q = demoQueries[activeIdx].q;
    const interval = setInterval(() => {
      if (charIdx < q.length) {
        setTypedText(q.slice(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setActiveIdx((prev) => (prev + 1) % demoQueries.length);
        }, 3000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [activeIdx]);

  const current = demoQueries[activeIdx];

  return (
    <section id="demo" className="py-24 px-4 bg-slate-950/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
            See It In Action
          </h2>
          <p className="mt-4 text-text-muted text-lg max-w-xl mx-auto">
            Watch how natural language becomes instant database insights.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Query input simulation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-bg-surface/60 backdrop-blur-sm p-6"
          >
            <p className="text-sm text-text-muted mb-3 font-medium">Natural Language Input</p>
            <div className="rounded-xl border border-border bg-bg-base/50 p-4 min-h-[60px]">
              <p className="text-text-primary font-medium">
                {typedText}
                <span className="inline-block w-0.5 h-5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
              </p>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {demoQueries.map((dq, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    i === activeIdx
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-border text-text-muted hover:text-text-primary hover:border-text-muted'
                  }`}
                >
                  {dq.q.slice(0, 30)}...
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right: Results preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-bg-surface/60 backdrop-blur-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-muted font-medium">Query Results</p>
              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {current.rows} rows
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {current.chart} chart
                </span>
              </div>
            </div>
            {/* Mini mock chart bars */}
            <div className="flex items-end gap-2 h-40 px-4">
              {Array.from({ length: 8 }).map((_, i) => {
                const height = 30 + Math.random() * 70;
                return (
                  <motion.div
                    key={`${activeIdx}-${i}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500 opacity-80"
                  />
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Try it yourself
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
