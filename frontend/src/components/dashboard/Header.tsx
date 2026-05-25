'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bell, User as UserIcon, Settings, LogOut, ChevronDown, UserCheck } from 'lucide-react';

const routeTitleMap: Record<string, string> = {
  '/dashboard': 'AI Query Assistant',
  '/dashboard/schema': 'Database Schema Explorer',
  '/dashboard/history': 'Execution Query History',
  '/dashboard/favorites': 'Starred Configurations',
  '/dashboard/settings': 'Workspace Settings'
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Wait until mounted on client to prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside user dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitle = routeTitleMap[pathname] || 'Workspace Dashboard';

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-bg-surface px-6 flex items-center justify-between relative z-20 shrink-0 select-none">
      {/* Left side: Dynamic Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-text-primary tracking-tight font-sans">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Actions & User Menu */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors border border-border cursor-pointer"
          aria-label="Toggle Theme"
        >
          {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>


        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-border hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-bg-surface border border-border shadow-2xl p-2 flex flex-col gap-1 z-50 overflow-hidden"
              >
                {/* User Info Header */}
                <div className="px-3.5 py-3 border-b border-border flex flex-col">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Signed In As</span>
                  <span className="text-sm font-bold text-text-primary truncate mt-0.5">{user?.name || 'Workspace Account'}</span>
                  <span className="text-xs text-text-muted truncate">{user?.email || 'user@workspace.com'}</span>
                </div>

                {/* Dropdown Links */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all cursor-pointer text-left w-full"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Profile Overview</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/dashboard/settings');
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all cursor-pointer text-left w-full"
                >
                  <Settings className="w-4 h-4" />
                  <span>Workspace Settings</span>
                </button>

                <hr className="border-border my-1" />

                {/* Logout Trigger */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/10 transition-all cursor-pointer text-left w-full font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
