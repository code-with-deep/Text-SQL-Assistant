'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Code2, ShieldCheck, BarChart3 } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Keyboard,
    title: 'Type a Question',
    desc: 'Ask anything about your data in plain English — no SQL knowledge needed.',
    color: 'from-indigo-500 to-indigo-600',
    glow: 'shadow-indigo-500/20',
  },
  {
    num: '02',
    icon: Code2,
    title: 'AI Generates SQL',
    desc: 'Our LLM engine translates your question into optimized, safe PostgreSQL.',
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/20',
  },
  {
    num: '03',
    icon: ShieldCheck,
    title: 'Safety Validated',
    desc: 'Multi-layer validation blocks destructive queries and enforces read-only access.',
    color: 'from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    num: '04',
    icon: BarChart3,
    title: 'Chart + Explanation',
    desc: 'Instant interactive charts and plain English explanations of every query.',
    color: 'from-amber-500 to-amber-600',
    glow: 'shadow-amber-500/20',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
            From Question to Insight in{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              4 Steps
            </span>
          </h2>
          <p className="mt-4 text-text-muted text-lg max-w-xl mx-auto">
            No complex setup. No learning curve. Just ask and get answers.
          </p>
        </motion.div>

        {/* Steps grid with connecting line */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 via-emerald-500 to-amber-500 opacity-30" />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} shadow-xl ${step.glow} flex items-center justify-center mb-6`}>
                <step.icon className="w-8 h-8 text-white" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-bg-surface border-2 border-border text-xs font-bold flex items-center justify-center text-text-primary">
                  {step.num}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
