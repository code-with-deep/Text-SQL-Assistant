'use client';

import React, { useState } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { useConversationStore } from '@/stores/conversationStore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Edit2, Code, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function SQLDisplay() {
  const { sql, setSql, executeManualSql, isLoading, results } = useQueryStore();
  const { sessionId } = useConversationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editSql, setEditSql] = useState('');

  if (!sql) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center select-none min-h-[220px]">
        <Code className="w-10 h-10 text-text-muted mb-3 opacity-60" />
        <span className="text-sm font-semibold text-text-muted">No SQL Code Generated Yet</span>
        <span className="text-xs text-text-muted mt-1 max-w-[280px]">Ask a question above to generate and inspect database queries here</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditSql(sql);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleRunSql = async () => {
    if (!editSql.trim() || isLoading) return;
    try {
      // Execute the manual SQL query on backend
      const result = await executeManualSql(editSql.trim(), sessionId);

      // If we didn't have a session ID yet, record the new session ID returned by backend
      if (!sessionId && result.conversation_id) {
        useConversationStore.getState().setSessionId(result.conversation_id);
      }

      // Add the manual execution as a custom SQL turn
      useConversationStore.getState().addTurn({
        id: result.query_id.toString(),
        question: `[Manual SQL Execution]`,
        sql: editSql.trim(),
        explanation: {
          summary: 'Manually edited SQL query executed directly.',
          steps: []
        },
        results: result.results,
        chart_config: result.chart_config,
        safety_report: result.safety_report,
        execution_ms: result.execution_ms,
        created_at: new Date().toISOString()
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to execute manual SQL:', error);
    }
  };

  // Basic SQL safety parsing on client side for visual indicator badge
  const clientValidation = (() => {
    const query = isEditing ? editSql : sql;
    const cleanQuery = query.toLowerCase().trim();
    
    if (!cleanQuery) return { isSafe: true, message: 'Empty query' };
    
    const destructiveKeywords = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter', 'create table', 'grant'];
    const foundKeywords = destructiveKeywords.filter(keyword => 
      new RegExp(`\\b${keyword}\\b`).test(cleanQuery)
    );

    if (foundKeywords.length > 0) {
      return {
        isSafe: false,
        message: `Destructive actions detected: ${foundKeywords.join(', ')}`
      };
    }

    if (!cleanQuery.startsWith('select')) {
      return {
        isSafe: false,
        message: 'Only SELECT queries are authorized in sandbox mode'
      };
    }

    if (!cleanQuery.includes('limit')) {
      return {
        isSafe: true,
        message: 'Recommendation: Enforce a LIMIT to save database latency'
      };
    }

    return {
      isSafe: true,
      message: 'Query adheres to safe sandbox rules'
    };
  })();

  return (
    <div className="flex flex-col bg-bg-surface border border-border rounded-2xl shadow-xl overflow-hidden min-h-[300px]">
      {/* Top Header controls */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-surface/50 select-none">
        <div className="flex items-center gap-2">
          <Code className="w-4.5 h-4.5 text-primary shrink-0" />
          <span className="text-sm font-semibold text-text-primary">SQL Command Panel</span>
          
          {/* Safety Validation Pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
            clientValidation.isSafe 
              ? 'bg-success/10 border-success/20 text-success' 
              : 'bg-danger/10 border-danger/20 text-danger'
          }`} title={clientValidation.message}>
            {clientValidation.isSafe ? (
              <ShieldCheck className="w-3 h-3 shrink-0" />
            ) : (
              <ShieldAlert className="w-3 h-3 shrink-0 animate-pulse" />
            )}
            <span>{clientValidation.isSafe ? 'VALID SELECT' : 'SAFETY ERROR'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Action trigger controls */}
          {!isEditing ? (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
              <button
                onClick={handleStartEdit}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 text-xs text-primary hover:text-white hover:bg-primary transition-colors cursor-pointer font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5 shrink-0" />
                <span>Edit & Run</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRunSql}
                disabled={isLoading || !clientValidation.isSafe || !editSql.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
                <span>Execute SQL</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col font-mono text-sm leading-relaxed p-4 bg-slate-950 relative min-h-[220px]">
        {isEditing ? (
          <textarea
            value={editSql}
            onChange={(e) => setEditSql(e.target.value)}
            className="w-full h-full flex-grow bg-transparent text-zinc-100 font-mono resize-none focus:outline-none border-none p-2 selection:bg-indigo-500/30 selection:text-white leading-relaxed min-h-[200px]"
            placeholder="Write custom SQL query..."
          />
        ) : (
          <div className="overflow-x-auto h-full max-h-[350px]">
            <SyntaxHighlighter
              language="sql"
              style={vscDarkPlus}
              customStyle={{
                background: 'transparent',
                padding: '4px',
                margin: 0,
                fontSize: '13px',
                fontFamily: 'var(--font-mono), monospace',
                lineHeight: '1.6'
              }}
            >
              {sql}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Real-time Validation Message Banner */}
        {(!clientValidation.isSafe || isEditing) && (
          <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 select-none border border-dashed ${
            clientValidation.isSafe 
              ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400' 
              : 'bg-danger/10 border-danger/20 text-danger'
          }`}>
            <span className="font-bold shrink-0">STATUS:</span>
            <span>{clientValidation.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
