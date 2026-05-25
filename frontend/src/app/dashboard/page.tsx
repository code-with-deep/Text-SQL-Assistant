'use client';

import React, { useEffect, useState } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { useConversationStore } from '@/stores/conversationStore';
import ConversationThread from '@/components/dashboard/ConversationThread';
import QueryInput from '@/components/dashboard/QueryInput';
import ResultsTable from '@/components/dashboard/ResultsTable';
import AutoChart from '@/components/dashboard/AutoChart';
import SQLDisplay from '@/components/dashboard/SQLDisplay';
import QueryExplanation from '@/components/dashboard/QueryExplanation';
import SafetyReport from '@/components/dashboard/SafetyReport';
import { Sparkles, Shield, BarChart3, Database, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const { 
    activeTab, 
    setActiveTab, 
    isLoading, 
    results, 
    sql,
    error 
  } = useQueryStore();

  const { sessionId } = useConversationStore();

  // Multi-step animated progress indicators during AI compilation
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    'Analyzing database schema...',
    'Generating optimal SQL structure...',
    'Validating sandbox security queries...',
    'Executing sandboxed database connection...',
    'Rendering visual analytics insights...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="flex gap-6 h-full min-h-[calc(100vh-8rem)] items-stretch">
      {/* Left Column: Conversation Turns Timeline */}
      <div className="w-[300px] shrink-0 hidden md:block">
        <ConversationThread />
      </div>

      {/* Right Column: Active Workspace Query Panels */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
        {/* Core Input box */}
        <QueryInput />

        {/* Dynamic Errors Block */}
        {error && !isLoading && (
          <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm select-none">
              <Shield className="w-5 h-5 animate-pulse" />
              <span>Compilation or Sandbox Execution Failed</span>
            </div>
            <p className="text-xs font-medium leading-relaxed font-mono">{error}</p>
          </div>
        )}

        {/* AI Loading State with Step Progress */}
        {isLoading ? (
          <div className="p-8 bg-bg-surface border border-border rounded-2xl flex flex-col items-center justify-center min-h-[350px] gap-6 select-none animate-pulse">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-400 absolute" />
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-sm font-bold text-text-primary">
                AI is compiling insights...
              </span>
              <span className="text-xs text-primary font-semibold transition-all">
                {loadingSteps[loadingStep]}
              </span>
            </div>

            {/* Simulated progress indicators */}
            <div className="flex gap-1.5">
              {loadingSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-1 rounded-full transition-all duration-300 ${
                    i <= loadingStep ? 'bg-primary' : 'bg-bg-elevated'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Results Display Area (tabbed card) */}
            {(results || sql) && (
              <div className="flex flex-col gap-5">
                {/* Visual Tab Selector Row */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-1 select-none">
                  {[
                    { id: 'results', label: 'Dataset Results', icon: Database },
                    { id: 'chart', label: 'Visualization Insights', icon: BarChart3 },
                    { id: 'sql', label: 'SQL Statement', icon: Layers }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                          isActive
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Switchable tab contents */}
                <div>
                  {activeTab === 'results' && <ResultsTable />}
                  {activeTab === 'chart' && <AutoChart />}
                  {activeTab === 'sql' && <SQLDisplay />}
                </div>

                {/* Explanatory insights and Security card */}
                <QueryExplanation />
                <SafetyReport />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
