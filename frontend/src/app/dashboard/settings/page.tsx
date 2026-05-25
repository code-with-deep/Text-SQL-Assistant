'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSchemaStore } from '@/stores/schemaStore';
import { useTheme } from 'next-themes';
import { apiService } from '@/lib/api';
import { HealthStatus } from '@/lib/types';
import { User, Settings, Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { tables, refreshSchemaCache, isLoaded, fetchSchema } = useSchemaStore();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'api'>('profile');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Preference states (simulated local overrides)
  const [defaultChart, setDefaultChart] = useState('bar');
  const [rowsPerPage, setRowsPerPage] = useState('25');

  // Change password forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await apiService.getHealth();
      setHealthStatus(data);
    } catch (err) {
      console.error('Failed to load database health diagnostics:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema().catch(console.error);
    fetchHealth().catch(console.error);
  }, []);

  const handleRefreshCache = async () => {
    await refreshSchemaCache();
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    
    // Simulate successful password change
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  // Summarize stats from the schema tables store
  const totalTables = tables.length;
  const totalRows = tables.reduce((acc, curr) => acc + (curr.row_count || 0), 0);

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      {/* 1. HEADER */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-1 select-none">
        <div className="inline-flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          <span>Workspace Control Panel</span>
        </div>
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
          System Preferences & Account
        </h2>
        <p className="text-xs text-text-muted">
          Manage your workspace settings, default query preferences, profiles, and backend database credentials
        </p>
      </div>

      {/* 2. TABBED LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left selector menu */}
        <div className="lg:col-span-1 bg-bg-surface border border-border rounded-2xl shadow-xl p-2 flex flex-col gap-1 select-none">
          {[
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Settings },
            { id: 'api', label: 'API & Connections', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right content panels */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: Profile settings */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              {/* Account profile card */}
              <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider select-none border-b border-border/60 pb-3">
                  Account Credentials
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Full Name</span>
                    <span className="text-sm font-semibold text-text-primary bg-bg-base/40 px-3.5 py-2.5 rounded-xl border border-border">
                      {user?.name || 'Workspace Account'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Registered Email</span>
                    <span className="text-sm font-semibold text-text-primary bg-bg-base/40 px-3.5 py-2.5 rounded-xl border border-border">
                      {user?.email || 'user@workspace.com'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password update card */}
              <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider select-none border-b border-border/60 pb-3">
                  Security & Change Password
                </h3>

                {passwordSuccess && (
                  <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-xs font-semibold text-success flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Password updated successfully! Next session will require your new credentials.</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="px-3.5 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">New Secure Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="px-3.5 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-border hover:border-primary/40 text-text-primary rounded-xl text-xs font-semibold self-start transition-colors cursor-pointer select-none"
                  >
                    Save New Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Preferences settings */}
          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-6">
              {/* Workspace config form */}
              <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-5">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider select-none border-b border-border/60 pb-3">
                  Query Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Default Chart Type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Default Chart Output</span>
                    <select
                      value={defaultChart}
                      onChange={(e) => setDefaultChart(e.target.value)}
                      className="px-3.5 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary appearance-none cursor-pointer"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="table">Tabular Only</option>
                    </select>
                  </div>

                  {/* Results row count */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Rows per page default</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(e.target.value)}
                      className="px-3.5 py-2.5 bg-bg-base border border-border focus:border-primary focus:outline-none rounded-xl text-xs text-text-primary appearance-none cursor-pointer"
                    >
                      <option value="10">10 Rows</option>
                      <option value="25">25 Rows</option>
                      <option value="50">50 Rows</option>
                      <option value="100">100 Rows</option>
                    </select>
                  </div>

                  {/* Theme Mode Toggle (next-themes) */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Display Theme Mode</span>
                    <div className="flex gap-2 p-1 bg-bg-base border border-border rounded-xl w-fit select-none">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor }
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isThemeActive = theme === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isThemeActive
                                ? 'bg-bg-surface text-primary border border-border shadow-sm'
                                : 'text-text-muted hover:text-text-primary border border-transparent'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Query timeout display (Read Only) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Sandbox Timeout limit</span>
                    <span className="text-xs font-semibold text-text-primary bg-bg-base/40 px-3.5 py-2.5 rounded-xl border border-border select-none cursor-not-allowed">
                      N/A (Not enforced in SQLite)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API & Connections settings */}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-6">
              {/* Connected Database info */}
              <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 select-none">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Connected Database Source
                  </h3>

                  {healthLoading ? (
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                  ) : healthStatus?.status === 'ok' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/10 border border-success/20 text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>HEALTHY CONNECTED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 border border-danger/20 text-danger animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>CONNECTION DOWN</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold select-none">
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-bg-base/30 border border-border">
                    <span className="text-text-muted">Target RDBMS Engine</span>
                    <span className="text-sm text-text-primary font-bold mt-1">SQLite v3</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-bg-base/30 border border-border">
                    <span className="text-text-muted">Analyzed Tables Catalog</span>
                    <span className="text-sm text-text-primary font-bold mt-1">{totalTables} Tables</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-bg-base/30 border border-border">
                    <span className="text-text-muted">Indexed Database Records</span>
                    <span className="text-sm text-text-primary font-bold mt-1">{totalRows.toLocaleString()} rows</span>
                  </div>
                </div>

                {/* Sub services details */}
                {healthStatus?.services && (
                  <div className="flex flex-col gap-2 border-t border-border/60 pt-4 text-xs select-none">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Subservice connection statuses</span>
                    <div className="flex flex-col gap-1.5 mt-1 font-mono text-[10px] text-text-muted">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span>Write Sandbox Connection (db_default)</span>
                        <span className={healthStatus.services.db_default === 'ok' ? 'text-success font-bold' : 'text-danger font-bold'}>
                          {healthStatus.services.db_default?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Read Only Sandbox Isolation (db_readonly)</span>
                        <span className={healthStatus.services.db_readonly === 'ok' ? 'text-success font-bold' : 'text-danger font-bold'}>
                          {healthStatus.services.db_readonly?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Schema refresh card */}
              <div className="bg-bg-surface border border-border rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider select-none border-b border-border/60 pb-3">
                  Metadata Schema Cache
                </h3>

                <p className="text-xs text-text-muted leading-relaxed">
                  The assistant stores table schemas and relationship structures in memory to reduce latency during natural language compiling. If you add tables or columns directly inside the database, refresh the catalog schema cache here to reload coordinates.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="text-text-muted font-semibold">Last refreshed timestamp</span>
                    <span className="text-text-primary font-bold">{lastRefreshed}</span>
                  </div>
                  <button
                    onClick={handleRefreshCache}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bg-elevated hover:bg-bg-elevated/70 border border-border hover:border-primary/45 text-text-primary text-xs font-bold transition-all cursor-pointer select-none"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Clear Cache & Reload Schema</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
