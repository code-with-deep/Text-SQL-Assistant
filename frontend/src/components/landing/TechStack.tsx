'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Code, Cpu, BarChart, Server } from 'lucide-react';

const technologies = [
  { name: 'Next.js 14', category: 'Frontend Framework', icon: Code, color: 'text-zinc-100 group-hover:text-white bg-zinc-800/40 border-zinc-700' },
  { name: 'Django REST', category: 'Backend Server', icon: Server, color: 'text-emerald-400 group-hover:text-emerald-300 bg-emerald-950/20 border-emerald-900/30' },
  { name: 'PostgreSQL', category: 'Target Database', icon: Database, color: 'text-sky-400 group-hover:text-sky-300 bg-sky-950/20 border-sky-900/30' },
  { name: 'Gemini AI', category: 'SQL LLM Engine', icon: Cpu, color: 'text-indigo-400 group-hover:text-indigo-300 bg-indigo-950/20 border-indigo-900/30' },
  { name: 'Recharts', category: 'Data Visualization', icon: BarChart, color: 'text-amber-400 group-hover:text-amber-300 bg-amber-950/20 border-amber-900/30' }
];

export default function TechStack() {
  return (
    <section className="py-16 md:py-24 border-t border-border bg-bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center flex flex-col items-center gap-4 mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Tech Infrastructure
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Built with best-in-class technology
          </h2>
          <p className="text-sm md:text-base text-text-muted max-w-xl">
            Our infrastructure uses enterprise-grade technology to guarantee speed, safety, and precise database interactions.
          </p>
        </div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {technologies.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group flex flex-col items-center p-6 bg-bg-surface/50 border border-border rounded-2xl hover:border-text-muted/30 transition-all text-center hover:scale-[1.03] hover:shadow-lg"
              >
                <div className={`p-3 rounded-xl border mb-3 transition-colors ${tech.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {tech.name}
                </span>
                <span className="text-xs text-text-muted mt-1">
                  {tech.category}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
