'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Database,
  Clock,
  Star,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  AlertTriangle
} from 'lucide-react';

const sidebarLinks = [
  { label: 'Query', href: '/dashboard', icon: Sparkles },
  { label: 'Schema Explorer', href: '/dashboard/schema', icon: Database },
  { label: 'Query History', href: '/dashboard/history', icon: Clock },
  { label: 'Favorites', href: '/dashboard/favorites', icon: Star },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col h-screen bg-bg-surface border-r border-border shrink-0 select-none relative z-30"
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 -right-3.5 bg-bg-surface hover:bg-bg-elevated border border-border p-1 rounded-full text-text-muted hover:text-text-primary shadow-md hover:shadow-indigo-500/10 transition-all z-40 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Top: Branding / Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 group overflow-hidden">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-shadow shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent truncate font-sans whitespace-nowrap"
                >
                  QueryAI
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Middle: User Profile (Compact/Expanded) */}
        <div className="p-4 border-b border-border flex items-center gap-3 overflow-hidden bg-bg-surface/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-5 h-5" />}
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-semibold text-text-primary truncate max-w-[160px]">
                  {user?.name || 'Workspace Account'}
                </span>
                <span className="text-xs text-text-muted truncate max-w-[160px]">
                  {user?.email || 'user@workspace.com'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Core Navigation Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-primary transition-colors'}`} />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm truncate whitespace-nowrap font-sans"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Logout Trigger */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3.5 px-3 py-3 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all cursor-pointer group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:text-danger transition-colors" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm truncate whitespace-nowrap font-sans font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Logout Confirmation Dialog (Portal-like Modal overlay) */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-surface border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-5 text-center"
            >
              <div className="mx-auto p-3 rounded-full bg-danger/10 text-danger border border-danger/20 w-fit">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-text-primary">Confirm Sign Out</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Are you sure you want to end your active workspace session? You will need to log in again to query the database.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border text-text-primary rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-danger/10"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
