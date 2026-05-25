'use client';

import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuthStore();

  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Dashboard History Trap
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Check if we are at the entry point without a trap set
    if (typeof window !== 'undefined' && !window.history.state?.isDashboardTrap) {
      const currentHistoryState = window.history.state || {};
      
      // 1. Mark the current state as the entry point
      window.history.replaceState({ ...currentHistoryState, isDashboardEntry: true }, '');
      
      // 2. Push a new trap state forward
      window.history.pushState({ ...currentHistoryState, isDashboardTrap: true }, '', window.location.href);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.isDashboardEntry) {
        // The user tried to go back past the entry point.
        // Trap them by pushing them forward instantly to the trap state.
        // We use forward() instead of pushState to preserve their forward history (Feature B, C).
        window.history.forward();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Full-page premium loader during session restore
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg-base z-50 gap-4 select-none">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            QueryAI Workspace
          </span>
          <span className="text-xs text-text-muted">Loading workspace configurations...</span>
        </div>
      </div>
    );
  }

  // Fallback in case middleware bypass occurs
  if (!isAuthenticated) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base text-text-primary">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Dynamic Header */}
        <Header />

        {/* Dynamic Scrollable Page Content */}
        <main className="flex-grow overflow-y-auto p-6 relative">
          {/* Subtle background glow */}
          <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
          {children}
        </main>
      </div>
    </div>
  );
}
