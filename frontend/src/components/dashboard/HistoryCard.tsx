'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStore } from '@/stores/queryStore';
import { useConversationStore } from '@/stores/conversationStore';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { QueryHistory } from '@/lib/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Star, Play, Copy, Check, ChevronDown, ChevronUp, Clock, Layers, Database, Calendar } from 'lucide-react';

interface HistoryCardProps {
  item: QueryHistory;
  onFavoriteToggle?: (id: number, isFavorite: boolean) => void;
}

export default function HistoryCard({ item, onFavoriteToggle }: HistoryCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item.is_favorite);
  const [copied, setCopied] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavState = !isFavorite;
    setIsFavorite(newFavState); // Optimistic UI update

    try {
      await apiService.toggleFavorite(item.id);
      if (onFavoriteToggle) {
        onFavoriteToggle(item.id, newFavState);
      }
      toast.success(newFavState ? 'Saved to favorites!' : 'Removed from favorites.');
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
      setIsFavorite(!newFavState); // Revert on failure
      toast.error('Failed to update favorites. Please try again.');
    }
  };

  const handleCopySql = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.generated_sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Inject the turn parameters into queryStore
    useQueryStore.setState({
      question: item.question,
      sql: item.generated_sql,
      results: item.result_preview ? {
        columns: item.result_preview.columns,
        rows: item.result_preview.rows,
        row_count: item.result_rows
      } : null,
      chartConfig: item.chart_config,
      explanation: {
        summary: item.explanation,
        steps: []
      },
      safetyReport: item.safety_report,
      queryId: item.id,
      error: null,
      activeTab: item.chart_type !== 'table' ? 'chart' : 'results'
    });

    if (item.conversation_id) {
      useConversationStore.getState().setSessionId(item.conversation_id);
    }

    router.push('/dashboard');
  };

  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-bg-surface border border-border hover:border-text-muted/30 rounded-2xl p-4 flex flex-col gap-4 shadow-md transition-all duration-200">
      {/* 1. TOP ROW */}
      <div 
        onClick={() => setExpanded(!expanded)} 
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Question Text */}
          <span className="text-sm font-bold text-text-primary group-hover:text-primary leading-snug truncate max-w-[550px]">
            {item.question}
          </span>
          
          {/* Badge list */}
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {/* Success badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              item.is_successful 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}>
              {item.is_successful ? 'SUCCESS' : 'FAILED'}
            </span>

            {/* Row Count Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
              <Database className="w-3 h-3 shrink-0" />
              <span>{item.result_rows} rows</span>
            </span>

            {/* Execution badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{item.execution_ms}ms</span>
            </span>

            {/* Chart Type Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
              <span>{item.chart_type}</span>
            </span>

            {/* Timestamp */}
            <span className="inline-flex items-center gap-1 text-text-muted px-2">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Favorite Toggle Star */}
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isFavorite 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-bg-elevated/40 border-border text-text-muted hover:text-text-primary'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Mark as favorite configuration'}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>

          {/* Rerun Query */}
          <button
            onClick={handleReRun}
            className="p-2 rounded-xl bg-bg-elevated/40 border border-border hover:border-primary/50 text-text-muted hover:text-primary transition-all cursor-pointer"
            title="Load configuration and re-execute query"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>

          {/* Copy SQL */}
          <button
            onClick={handleCopySql}
            className="p-2 rounded-xl bg-bg-elevated/40 border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Copy compiled SQL to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Toggle Accordion */}
          <button className="p-2 rounded-xl text-text-muted hover:text-text-primary">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. COLLAPSED DRAWER AREA */}
      {expanded && (
        <div className="pt-4 border-t border-border/60 flex flex-col gap-4">
          {/* SQL Block */}
          <div className="flex flex-col gap-1.5 font-mono text-xs select-none">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Generated SQL Statement</span>
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-border p-3 max-h-[220px] overflow-y-auto">
              <SyntaxHighlighter
                language="sql"
                style={vscDarkPlus}
                customStyle={{
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}
              >
                {item.generated_sql}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Summary Explanation */}
          {item.explanation && (
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">AI Insight Explanation</span>
              <p className="text-text-muted leading-relaxed max-w-3xl">
                {item.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
