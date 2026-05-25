'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { useConversationStore } from '@/stores/conversationStore';
import { useSchemaStore } from '@/stores/schemaStore';
import { Sparkles, Trash2, ArrowUpRight, CornerDownLeft, RefreshCw } from 'lucide-react';

export default function QueryInput() {
  const { question, setQuestion, askQuestion, isLoading, resetQueryState } = useQueryStore();
  const { sessionId, turns, resetSession, isFollowUp, setFollowUp } = useConversationStore();
  const { suggestions, fetchSuggestions, isLoadingSchema } = useSchemaStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    fetchSuggestions().catch(console.error);
  }, [fetchSuggestions]);

  // Auto-resize textarea heights
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;
    
    try {
      const activeSessionId = sessionId;
      const result = await askQuestion(question.trim(), activeSessionId);
      
      // If we didn't have a session ID yet, record the new session ID returned by backend
      if (!activeSessionId && result.conversation_id) {
        useConversationStore.getState().setSessionId(result.conversation_id);
      }

      // Add this query and response as a turn in the conversation thread
      useConversationStore.getState().addTurn({
        id: result.query_id.toString(),
        question: question.trim(),
        sql: result.sql,
        explanation: result.explanation,
        results: result.results,
        chart_config: result.chart_config,
        safety_report: result.safety_report,
        execution_ms: result.execution_ms,
        created_at: new Date().toISOString()
      });

      // Clear the current question input so user can type a follow-up
      setQuestion('');
    } catch (error) {
      console.error('Failed to submit question:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestedText: string) => {
    setQuestion(suggestedText);
    textareaRef.current?.focus();
  };

  const handleClear = () => {
    setQuestion('');
    resetQueryState();
  };

  const handleResetConversation = () => {
    resetSession();
    resetQueryState();
    setQuestion('');
  };

  const lastTurn = turns[turns.length - 1];

  return (
    <div className="flex flex-col gap-4 p-5 bg-bg-surface border border-border rounded-2xl shadow-xl transition-all relative">
      {/* Follow-up / New Query Indicators */}
      <div className="flex justify-between items-center select-none">
        {isFollowUp && lastTurn ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Following up on: <strong className="text-text-primary italic">"{lastTurn.question.length > 35 ? lastTurn.question.substring(0, 35) + '...' : lastTurn.question}"</strong></span>
            <button
              onClick={handleResetConversation}
              className="ml-1 text-indigo-400 hover:text-danger hover:bg-danger/10 px-1 rounded-md transition-colors cursor-pointer"
              title="Reset session to start fresh query"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Natural Language Database Search
          </span>
        )}

        {/* Clear Workspace button */}
        {(question || turns.length > 0) && (
          <button
            onClick={handleResetConversation}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-bg-elevated cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Session</span>
          </button>
        )}
      </div>

      {/* Main Textarea input frame */}
      <div className="relative border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 rounded-xl bg-bg-base transition-all p-2 flex flex-col">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your database (e.g. 'What are our top 10 selling products?')"
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent resize-none outline-none border-none p-3 text-text-primary placeholder:text-text-muted text-sm md:text-base leading-relaxed max-h-[180px] scrollbar-thin"
        />

        <div className="flex items-center justify-between border-t border-border/60 pt-2 px-2 mt-1 select-none">
          <div className="text-[10px] text-text-muted font-medium flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            <span>Press Enter to Submit</span>
          </div>

          <div className="flex items-center gap-2">
            {question && (
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="px-3.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors cursor-pointer font-semibold border border-border"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[11px] font-bold text-text-muted tracking-wider uppercase select-none">
            Suggested Queries
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-bg-elevated text-xs text-text-muted hover:text-text-primary transition-all shrink-0 cursor-pointer font-medium"
              >
                <span>{suggestion}</span>
                <ArrowUpRight className="w-3 h-3 text-text-muted/60 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
