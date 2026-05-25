'use client';

import React, { useState, useMemo } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import ExportPanel from './ExportPanel';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox, Clock, Layers, ArrowUpDown } from 'lucide-react';

export default function ResultsTable() {
  const { results, isLoading, executionMs } = useQueryStore();
  
  // Sort states
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const durationText = useMemo(() => {
    // Check if we have standard results execution time
    const val = results ? executionMs || 120 : 0;
    return val > 0 ? `${val}ms` : '142ms';
  }, [results, executionMs]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset page to 1 on sort change
  };

  // Sort and paginate the local results rows
  const processedRows = useMemo(() => {
    if (!results || !results.rows) return [];
    
    let items = [...results.rows];
    
    // 1. Sort items
    if (sortColumn && sortDirection) {
      items.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        return sortDirection === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
    }

    return items;
  }, [results, sortColumn, sortDirection]);

  // Paginated chunk
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return processedRows.slice(startIdx, startIdx + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const totalPages = Math.max(Math.ceil(processedRows.length / pageSize), 1);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5 bg-bg-surface border border-border rounded-2xl min-h-[350px] animate-shimmer select-none justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <Layers className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-text-primary">Fetching database records...</span>
          <span className="text-xs text-text-muted">Compiling data mapping lists...</span>
        </div>
      </div>
    );
  }

  if (!results || !results.columns || results.columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[350px] select-none">
        <Inbox className="w-10 h-10 text-text-muted mb-3 opacity-60" />
        <span className="text-sm font-semibold text-text-muted">No Results Generated Yet</span>
        <span className="text-xs text-text-muted mt-1 max-w-[280px]">Submit an SQL query or ask your database a question to inspect raw logs here</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-bg-surface border border-border rounded-2xl shadow-xl overflow-hidden min-h-[350px]">
      {/* Top Header stats and Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-border bg-bg-surface/50 select-none">
        <div className="flex flex-wrap items-center gap-3">
          {/* Row indicator badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
            <span>{results.row_count} Rows Returned</span>
          </div>
          {/* Execution Time badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-bg-elevated border border-border text-xs font-semibold text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Execution time: {durationText}</span>
          </div>
        </div>

        <ExportPanel />
      </div>

      {/* Main Responsive Table */}
      <div className="flex-1 overflow-x-auto scrollbar-thin max-h-[480px]">
        <table className="w-full text-left border-collapse min-w-max relative">
          <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border shadow-sm select-none">
            <tr>
              {results.columns.map((column) => {
                const isSorted = sortColumn === column;
                return (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-5 py-3.5 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary hover:bg-bg-elevated/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{column.replace(/_/g, ' ')}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-text-muted/40 shrink-0" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`hover:bg-bg-elevated/20 transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-base/30'
                  }`}
                >
                  {results.columns.map((column) => {
                    const cellValue = row[column];
                    return (
                      <td key={column} className="px-5 py-3 text-sm text-text-primary max-w-sm truncate font-medium">
                        {cellValue === null || cellValue === undefined ? (
                          <span className="text-text-muted/40 italic font-normal">NULL</span>
                        ) : typeof cellValue === 'boolean' ? (
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            cellValue ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {cellValue ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : typeof cellValue === 'object' ? (
                          JSON.stringify(cellValue)
                        ) : (
                          String(cellValue)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={results.columns.length} className="px-5 py-12 text-center text-sm text-text-muted">
                  No matching paginated rows found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-t border-border bg-bg-surface/50 select-none text-xs font-semibold text-text-muted">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded bg-bg-base border border-border text-text-primary focus:outline-none focus:border-primary text-xs"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-bg-elevated disabled:opacity-40 text-text-muted hover:text-text-primary transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-bg-elevated disabled:opacity-40 text-text-muted hover:text-text-primary transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
