'use client';

import React from 'react';
import { useSchemaStore } from '@/stores/schemaStore';
import { Key, Link as LinkIcon, AlertCircle, BarChart3, HelpCircle, Eye } from 'lucide-react';

export default function TablePreview() {
  const { selectedTable, isLoadingTable, selectTable } = useSchemaStore();

  if (isLoadingTable) {
    return (
      <div className="flex flex-col gap-4 p-5 bg-bg-surface border border-border rounded-2xl min-h-[300px] animate-shimmer select-none justify-center items-center">
        <span className="text-sm font-semibold text-text-muted">Loading table metadata...</span>
      </div>
    );
  }

  if (!selectedTable) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[300px] select-none">
        <AlertCircle className="w-10 h-10 text-text-muted mb-3 opacity-60" />
        <span className="text-sm font-semibold text-text-muted">No Table Selected</span>
        <span className="text-xs text-text-muted mt-1 max-w-[280px]">Select a table from the catalog list to see column attributes, sample data, and schema statistics here</span>
      </div>
    );
  }

  const { name, row_count, columns = [], preview_rows = [] } = selectedTable;

  const handleFkClick = async (tableName: string | null | undefined) => {
    if (tableName) {
      await selectTable(tableName);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. COLUMN ATTRIBUTES GRID */}
      <div className="bg-bg-surface border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 select-none">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Metadata Schema</span>
            <h3 className="text-base font-bold text-text-primary">
              Columns in {name}
            </h3>
          </div>
          <span className="text-xs text-text-muted font-bold bg-bg-elevated px-2.5 py-1 rounded-lg border border-border">
            {row_count} total rows
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase font-bold select-none">
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3 text-center">Constraints</th>
                <th className="py-2.5 px-3 text-center">Nullable</th>
                <th className="py-2.5 px-3">Stats & Insights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {columns.map((col) => (
                <tr key={col.name} className="hover:bg-bg-elevated/20 transition-colors">
                  <td className="py-3 px-3 font-semibold text-text-primary">{col.name}</td>
                  <td className="py-3 px-3 text-text-muted font-mono">{col.type}</td>
                  
                  {/* PK/FK Indicators */}
                  <td className="py-3 px-3 text-center select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      {col.is_pk && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400" title="Primary Key">
                          <Key className="w-2.5 h-2.5 shrink-0" />
                          <span>PK</span>
                        </span>
                      )}
                      {col.is_fk && (
                        <button
                          onClick={() => handleFkClick(col.references_table)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                          title={`References table: ${col.references_table}(${col.references_column})`}
                        >
                          <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                          <span>FK → {col.references_table}</span>
                        </button>
                      )}
                      {!col.is_pk && !col.is_fk && <span className="text-text-muted/30">—</span>}
                    </div>
                  </td>

                  {/* Nullability */}
                  <td className="py-3 px-3 text-center select-none">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${col.nullable ? 'bg-indigo-500/30' : 'bg-success'}`} title={col.nullable ? 'Allows Null values' : 'Non-Null (Required)'} />
                  </td>

                  {/* Quick stats panel */}
                  <td className="py-3 px-3 text-text-muted">
                    <div className="flex flex-col gap-1 text-[10px]">
                      {col.null_values_count !== undefined && col.null_values_count > 0 && (
                        <span className="text-danger font-semibold">Null rows: {col.null_values_count}</span>
                      )}
                      {col.unique_values_count !== undefined && (
                        <span>Uniques: {col.unique_values_count}</span>
                      )}
                      {col.avg_value !== undefined && col.avg_value !== null && (
                        <div className="flex gap-2 font-mono">
                          <span>min: {col.min_value}</span>
                          <span>max: {col.max_value}</span>
                          <span className="text-primary font-bold">avg: {Number(col.avg_value).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SAMPLE DATA PREVIEW */}
      {preview_rows.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 select-none">
            <div className="flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Sample Record Explorer (First 10 rows)
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted font-bold select-none uppercase">
                  {columns.map((col) => (
                    <th key={col.name} className="py-2.5 px-3">{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {preview_rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-bg-elevated/20 transition-colors">
                    {columns.map((col) => {
                      const val = row[col.name];
                      return (
                        <td key={col.name} className="py-2.5 px-3 max-w-[200px] truncate text-text-primary font-mono">
                          {val === null || val === undefined ? (
                            <span className="text-text-muted/30 italic">NULL</span>
                          ) : typeof val === 'boolean' ? (
                            val ? 'TRUE' : 'FALSE'
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VALUE DISTRIBUTION breakdown */}
      {columns.some(col => col.value_distribution && col.value_distribution.length > 0) && (
        <div className="bg-bg-surface border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 select-none">
            <BarChart3 className="w-4.5 h-4.5 text-primary" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Categorical Value Distributions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns
              .filter(col => col.value_distribution && col.value_distribution.length > 0)
              .map(col => (
                <div key={col.name} className="flex flex-col gap-2.5 p-4 rounded-xl bg-bg-base/30 border border-border">
                  <span className="text-xs font-bold text-text-primary font-mono">{col.name}</span>
                  <div className="flex flex-col gap-2">
                    {col.value_distribution?.map((dist, i) => (
                      <div key={i} className="flex flex-col gap-1 text-[11px] font-semibold">
                        <div className="flex justify-between items-center text-text-muted">
                          <span className="text-text-primary truncate max-w-[150px]">{dist.value || 'NULL'}</span>
                          <span>{dist.count} rows ({Number(dist.percentage).toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all bg-indigo-500"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
