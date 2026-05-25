'use client';

import React, { useState } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { Shield, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SafetyReport() {
  const { safetyReport, results, isLoading } = useQueryStore();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !safetyReport) {
    return null;
  }

  const {
    is_safe,
    is_select_only,
    has_limit,
    no_sql_injection,
    no_blocked_keywords,
    details
  } = safetyReport;

  // Compile check metrics
  const checks = [
    { label: 'SELECT Query Only', passed: is_select_only, desc: 'Prevents database writes (INSERT, UPDATE, DELETE)' },
    { label: 'LIMIT Clause Enforced', passed: has_limit, desc: 'Avoids fetching too many records, protecting database latency' },
    { label: 'Injection Audit Passed', passed: no_sql_injection, desc: 'Checks for active SQL injection payload indicators' },
    { label: 'Keywords Check Passed', passed: no_blocked_keywords, desc: 'Locks down access to restricted schemas or configurations' }
  ];

  return (
    <div className="bg-bg-surface border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            is_safe 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-danger/10 border-danger/20 text-danger'
          }`}>
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Sandbox Security Report
            </h3>
            <span className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">
              Database isolation & compliance audit
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-bg-elevated text-xs font-semibold text-text-muted hover:text-text-primary transition-all cursor-pointer border border-transparent hover:border-border"
        >
          <span>{expanded ? 'Hide Audit' : 'Show Audit'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Core status summary */}
      <div className="flex flex-wrap items-center gap-2.5">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              check.passed
                ? 'bg-success/5 border-success/15 text-success'
                : 'bg-danger/5 border-danger/15 text-danger'
            }`}
            title={check.desc}
          >
            {check.passed ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>

      {/* Expandable detailed report panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border/60 flex flex-col gap-3 text-xs leading-relaxed text-text-muted select-none">
              <span className="font-bold text-text-primary uppercase tracking-wider text-[10px]">
                Active Threat & Sandbox Log
              </span>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span>Audit Verdict</span>
                  <span className={`font-bold uppercase ${is_safe ? 'text-success' : 'text-danger'}`}>
                    {is_safe ? 'SAFE_QUERY_PROCEED' : 'REJECTED_BLOCKED'}
                  </span>
                </div>

                {details?.blocked_keywords_found && details.blocked_keywords_found.length > 0 && (
                  <div className="flex flex-col gap-1.5 py-1.5">
                    <span className="text-danger font-semibold">Blocked Keywords Found:</span>
                    <div className="flex flex-wrap gap-1">
                      {details.blocked_keywords_found.map((word: string) => (
                        <span key={word} className="px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 font-mono">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {details?.parser_errors && details.parser_errors.length > 0 && (
                  <div className="flex flex-col gap-1.5 py-1.5">
                    <span className="text-danger font-semibold">Parser Compilation Diagnostics:</span>
                    <ul className="list-disc pl-4 flex flex-col gap-1 font-mono text-[10px] text-danger/80">
                      {details.parser_errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span>Is Select Only Check</span>
                  <span>{is_select_only ? '✓ PASS' : '❌ FAIL (Mutation action flagged)'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span>SQL Injection Check</span>
                  <span>{no_sql_injection ? '✓ PASS (No triggers)' : '❌ FAIL (Suspicious parameters)'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Query Sandbox Isolation</span>
                  <span>✓ Standard Sandbox Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
