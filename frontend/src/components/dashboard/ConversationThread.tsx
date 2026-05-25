'use client';

import React, { useEffect, useRef } from 'react';
import { useConversationStore } from '@/stores/conversationStore';
import { useQueryStore } from '@/stores/queryStore';
import { Sparkles, MessageSquare, Database, ArrowRight, BarChart2 } from 'lucide-react';

export default function ConversationThread() {
  const { turns, sessionId, resetSession } = useConversationStore();
  const { queryId: activeQueryId, resetQueryState } = useQueryStore();
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the list when turns update
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleTurnClick = (turn: typeof turns[0]) => {
    // Inject the historical turn details into the queryStore display state
    useQueryStore.setState({
      question: turn.question,
      sql: turn.sql,
      results: turn.results,
      chartConfig: turn.chart_config,
      explanation: turn.explanation,
      safetyReport: turn.safety_report,
      queryId: turn.id,
      error: null,
      activeTab: (turn.chart_config && turn.chart_config.chart_type !== 'table') ? 'chart' : 'results'
    });
  };

  const handleNewQuery = () => {
    resetSession();
    resetQueryState();
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface border border-border rounded-2xl shadow-xl overflow-hidden select-none">
      {/* Top Banner: New Query */}
      <div className="p-4 border-b border-border bg-bg-surface/50">
        <button
          onClick={handleNewQuery}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer active:scale-98"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>New Query Thread</span>
        </button>
      </div>

      {/* Middle turns list */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3 select-none opacity-60">
            <MessageSquare className="w-8 h-8 text-text-muted" />
            <span className="text-xs font-semibold text-text-muted leading-relaxed">
              No queries in this thread. Ask your first question!
            </span>
          </div>
        ) : (
          turns.map((turn, index) => {
            const isActive = String(activeQueryId) === String(turn.id);
            const isManualSql = turn.question.startsWith('[Manual SQL');
            
            return (
              <button
                key={turn.id}
                onClick={() => handleTurnClick(turn)}
                className={`w-full flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-bg-elevated border-primary/50 shadow-md'
                    : 'bg-bg-base/30 border-border hover:border-text-muted/30 hover:bg-bg-elevated/40'
                }`}
              >
                {/* Visual marker bar for active turn */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-primary" />
                )}

                {/* User question bubble summary */}
                <span className="text-xs font-bold text-text-primary line-clamp-2 leading-relaxed">
                  {isManualSql ? (
                    <span className="text-primary-dark font-mono">[Manual SQL]</span>
                  ) : (
                    turn.question
                  )}
                </span>

                {/* Results stats */}
                <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span>{turn.results.row_count} rows</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <span className="uppercase font-bold">{turn.chart_config.chart_type}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
        <div ref={threadEndRef} />
      </div>
    </div>
  );
}
