'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { QueryHistory } from '@/lib/types';
import HistoryCard from '@/components/dashboard/HistoryCard';
import { Star, RefreshCw, Layers } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      // API call requesting stars only
      const data = await apiService.getHistory({ is_favorite: true });
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFavorites(sorted);
    } catch (error) {
      console.error('Failed to load favorites logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteToggleInList = (id: number, isFav: boolean) => {
    // If a star is toggled off (isFav = false), remove it immediately from this favorites-only view
    if (!isFav) {
      setFavorites(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      {/* Upper header segment */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-1 select-none">
        <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Star className="w-3.5 h-3.5 fill-current animate-pulse" style={{ animationDuration: '3s' }} />
          <span>Workspace Bookmarks</span>
        </div>
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
          Starred Query Configurations
        </h2>
        <p className="text-xs text-text-muted">
          Access your starred query questions, compiled SQL configurations, visual charts, and plain English explanation cards here
        </p>
      </div>

      {/* Main logs display list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-semibold text-text-muted">Loading starred workspace records...</span>
        </div>
      ) : favorites.length > 0 ? (
        <div className="flex flex-col gap-4">
          {favorites.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onFavoriteToggle={handleFavoriteToggleInList}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border rounded-2xl text-center select-none">
          <Star className="w-10 h-10 text-text-muted mb-3 opacity-60" />
          <span className="text-sm font-semibold text-text-muted">No Starred Configurations Yet</span>
          <span className="text-xs text-text-muted mt-1 max-w-[280px]">Star a query in the workspace or history logs to bookmark it for quick access here</span>
        </div>
      )}
    </div>
  );
}
