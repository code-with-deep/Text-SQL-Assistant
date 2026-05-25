'use client';

import React, { useState } from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { apiService } from '@/lib/api';
import { FileSpreadsheet, Download, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportPanel() {
  const { sql, isLoading: queryLoading } = useQueryStore();
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null);
  const [success, setSuccess] = useState<'csv' | 'excel' | null>(null);

  if (!sql) return null;

  const handleExport = async (format: 'csv' | 'excel') => {
    if (exporting || queryLoading) return;
    setExporting(format);
    setSuccess(null);

    try {
      const blobFormat = format === 'excel' ? 'excel' : 'csv';
      const fileExt = format === 'excel' ? 'xlsx' : 'csv';
      const mimeType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'text/csv;charset=utf-8;';

      const fileData = await apiService.exportResults(sql, blobFormat);
      
      const blob = new Blob([fileData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `query_export_${Date.now()}.${fileExt}`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(format);
      toast.success(`${format.toUpperCase()} export completed!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error(`Failed to export data as ${format.toUpperCase()}:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2 select-none">
      {/* CSV Export Button */}
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting !== null || queryLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-surface hover:bg-bg-elevated disabled:opacity-50 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        title="Export dataset results to comma-separated CSV sheet"
      >
        {exporting === 'csv' ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
        ) : success === 'csv' ? (
          <Check className="w-3.5 h-3.5 text-success shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{success === 'csv' ? 'CSV Exported' : 'Export CSV'}</span>
      </button>

      {/* Excel Export Button */}
      <button
        onClick={() => handleExport('excel')}
        disabled={exporting !== null || queryLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-surface hover:bg-bg-elevated disabled:opacity-50 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        title="Export dataset results to standard Microsoft Excel spreadsheet"
      >
        {exporting === 'excel' ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
        ) : success === 'excel' ? (
          <Check className="w-3.5 h-3.5 text-success shrink-0" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{success === 'excel' ? 'Excel Exported' : 'Export Excel'}</span>
      </button>
    </div>
  );
}
