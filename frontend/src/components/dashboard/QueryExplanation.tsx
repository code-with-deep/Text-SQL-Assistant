'use client';

import React, { useState } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { Lightbulb, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueryExplanation() {
  const { explanation, isLoading } = useQueryStore();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5 bg-bg-surface border border-border rounded-2xl min-h-[140px] animate-shimmer select-none justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-sm font-semibold text-text-muted">AI is explaining query logic...</span>
        </div>
      </div>
    );
  }

  if (!explanation || !explanation.summary) {
    return null;
  }

  const hasSteps = explanation.steps && explanation.steps.length > 0;

  return (
    <div className="bg-bg-surface border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-4 hover:-translate-y-[1px] hover:shadow-2xl transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Lightbulb className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Query Insight & Breakdown
          </h3>
        </div>

        {hasSteps && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-bg-elevated text-xs font-semibold text-text-muted hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-border"
          >
            <span>{expanded ? 'Hide Steps' : 'Explore Steps'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Main explanation text */}
      <div className="flex flex-col gap-3">
        <p className="text-sm md:text-base text-text-muted leading-relaxed font-sans">
          {explanation.summary}
        </p>

        {/* Collapsible Steps list */}
        <AnimatePresence>
          {expanded && hasSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border/60 flex flex-col gap-3 select-none">
                <span className="text-[11px] font-bold text-text-muted tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Step-by-Step SQL Plan</span>
                </span>
                
                <ol className="flex flex-col gap-2">
                  {explanation.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-xs leading-relaxed text-text-muted">
                      <div className="w-5 h-5 rounded-full bg-bg-elevated border border-border flex items-center justify-center font-bold text-primary text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
