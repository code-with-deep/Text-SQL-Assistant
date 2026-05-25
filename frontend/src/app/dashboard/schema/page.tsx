'use client';

import React, { useEffect, useState } from 'react';
import { useSchemaStore } from '@/stores/schemaStore';
import TablePreview from '@/components/dashboard/TablePreview';
import ERDiagram from '@/components/dashboard/ERDiagram';
import { Search, Database, RefreshCw, Layers, Sparkles } from 'lucide-react';

export default function SchemaExplorerPage() {
  const { 
    tables, 
    fetchSchema, 
    selectTable, 
    selectedTable, 
    isLoadingSchema, 
    refreshSchemaCache 
  } = useSchemaStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch catalog on mount
  useEffect(() => {
    fetchSchema().catch(console.error);
  }, [fetchSchema]);

  // Filter tables by search query
  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableSelect = async (tableName: string) => {
    await selectTable(tableName);
  };

  const handleRefresh = async () => {
    await refreshSchemaCache();
  };

  if (isLoadingSchema && tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-4 select-none">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm font-semibold text-text-muted">Loading relational schema catalog...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none border-b border-border/60 pb-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Database Explorer</span>
          </div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
            Relational Schema Catalog
          </h2>
          <p className="text-xs text-text-muted">
            Inspect database tables, datatypes, schemas, foreign-keys, sample records, and relational maps
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all select-none"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>Refresh Cache</span>
        </button>
      </div>

      {/* Main Three-Panel Split Grid */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* PANEL 1: Table List Sidebar */}
        <div className="w-full md:w-60 shrink-0 flex flex-col bg-bg-surface border border-border rounded-2xl shadow-xl p-4 gap-4 h-[550px] md:h-auto">
          <div className="relative select-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Filter tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-bg-base border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
            />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
            {filteredTables.length > 0 ? (
              filteredTables.map((table) => {
                const isSelected = selectedTable?.name === table.name;
                return (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`w-full flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                        : 'bg-bg-base/30 border-border hover:border-text-muted/30 hover:bg-bg-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                        {table.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] mt-2 select-none">
                      <span className={isSelected ? 'text-indigo-200' : 'text-text-muted'}>
                        {table.column_count} fields
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        isSelected 
                          ? 'bg-indigo-700 text-white' 
                          : 'bg-bg-elevated border border-border text-text-muted'
                      }`}>
                        {table.row_count} rows
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-text-muted">
                No matching tables found
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Table Attributes, Columns & Sample rows */}
        <div className="flex-grow min-w-0">
          <TablePreview />
        </div>

        {/* PANEL 3: Labeled Relationship ER Diagram */}
        <div className="w-full lg:w-[480px] shrink-0 hidden xl:block">
          <ERDiagram />
        </div>
      </div>
    </div>
  );
}
