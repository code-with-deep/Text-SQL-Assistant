'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { QueryHistory } from '@/lib/types';
import HistoryCard from '@/components/dashboard/HistoryCard';
import { Search, Calendar, Filter, Star, RefreshCw, Layers } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Infinite scroll simulation
  const [visibleCount, setVisibleCount] = useState(15);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (favoritesOnly) params.is_favorite = true;
      if (statusFilter !== 'all') params.is_successful = statusFilter === 'success';

      const data = await apiService.getHistory(params);
      // Sort newest to oldest
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setHistory(sorted);
    } catch (error) {
      console.error('Failed to load history items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 400); // 400ms debounce on typing

    return () => clearTimeout(delayDebounce);
  }, [search, favoritesOnly, statusFilter]);

  const handleFavoriteToggleInList = (id: number, isFav: boolean) => {
    // Optimistic inline update in parent list state
    setHistory(prev =>
      prev.map(item => (item.id === id ? { ...item, is_favorite: isFav } : item))
    );
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 15);
  };

  const visibleHistory = history.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      {/* 1. UPPER ROW: Filters and search controls */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-1 select-none">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
            SQL Execution History Logs
          </h2>
          <p className="text-xs text-text-muted">
            Search, filter, inspect, and re-run all previous AI-compiled SQL executions and charts
          </p>
        </div>

        {/* Filter elements block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-2">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search previous query questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>

          {/* Status Select dropdown */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary appearance-none cursor-pointer"
            >
              <option value="all">All Execution Status</option>
              <option value="success">Successful Queries</option>
              <option value="failed">Failed Actions</option>
            </select>
          </div>

          {/* Favorites Star Toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold select-none cursor-pointer transition-all ${
              favoritesOnly
                ? 'bg-amber-500/10 border-amber-500/35 text-amber-400 font-bold shadow-inner shadow-amber-500/5'
                : 'bg-bg-base border-border text-text-muted hover:text-text-primary hover:bg-bg-elevated/40'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Show Stars Only</span>
          </button>
        </div>
      </div>

      {/* 2. HISTORY LIST SECTION */}
      {loading && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-semibold text-text-muted">Loading execution histories...</span>
        </div>
      ) : visibleHistory.length > 0 ? (
        <div className="flex flex-col gap-4">
          {visibleHistory.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onFavoriteToggle={handleFavoriteToggleInList}
            />
          ))}

          {/* Infinite Scroll Load More trigger */}
          {history.length > visibleCount && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 bg-bg-surface hover:bg-bg-elevated border border-border hover:border-text-muted/30 text-xs font-bold text-text-muted hover:text-text-primary rounded-2xl text-center cursor-pointer select-none transition-all mt-4"
            >
              Load More Previous Logs
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-bg-surface border border-border rounded-2xl text-center select-none">
          <Layers className="w-10 h-10 text-text-muted mb-3 opacity-60" />
          <span className="text-sm font-semibold text-text-muted">No History Records Found</span>
          <span className="text-xs text-text-muted mt-1 max-w-[280px]">Try adjusting your search criteria, removing favorites filter, or run a fresh query</span>
        </div>
      )}
    </div>
  );
}
