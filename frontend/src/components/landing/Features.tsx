'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, BarChart3, ShieldCheck, BookOpen, Database, MessagesSquare } from 'lucide-react';

const features = [
  {
    icon: MessageSquareText,
    title: 'Natural Language Queries',
    desc: 'Ask any question in plain English and get precise SQL generated instantly by our AI engine.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Auto Visualization',
    desc: 'Bar, line, pie, and scatter charts auto-selected based on your data shape — zero config needed.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: ShieldCheck,
    title: 'SQL Safety Validation',
    desc: 'Multi-layer security blocks destructive queries, enforces LIMIT, and detects injection attempts.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: BookOpen,
    title: 'Plain English Explanations',
    desc: 'Every query comes with a step-by-step breakdown that non-technical users can understand.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Database,
    title: 'Schema Explorer',
    desc: 'Browse tables, columns, relationships, and sample data with an interactive visual explorer.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: MessagesSquare,
    title: 'Conversational Follow-ups',
    desc: '"Now break that down by region" — refine queries naturally with context-aware follow-ups.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
            Everything Your Data Team Needs
          </h2>
          <p className="mt-4 text-text-muted text-lg max-w-xl mx-auto">
            A complete suite of tools to query, visualize, and understand your database.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-bg-surface/50 border border-border backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
