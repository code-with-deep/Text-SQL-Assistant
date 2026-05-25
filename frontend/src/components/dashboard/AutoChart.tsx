'use client';

import React from 'react';
import { useQueryStore } from '@/stores/queryStore';
import ChartTypeSelector from './ChartTypeSelector';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3, Download, RefreshCw, AlertCircle } from 'lucide-react';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

export default function AutoChart() {
  const { results, chartConfig, question, isLoading } = useQueryStore();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl min-h-[350px] animate-shimmer select-none">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
        <span className="text-sm font-semibold text-text-muted">Generating interactive visualization...</span>
      </div>
    );
  }

  if (!results || !results.rows || results.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[350px] select-none">
        <BarChart3 className="w-10 h-10 text-text-muted mb-3 opacity-60" />
        <span className="text-sm font-semibold text-text-muted">No Data Available for Visualization</span>
        <span className="text-xs text-text-muted mt-1 max-w-[280px]">Submit a successful query to see automated data charting options</span>
      </div>
    );
  }

  if (!chartConfig || chartConfig.chart_type === 'table') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[350px] select-none">
        <AlertCircle className="w-10 h-10 text-text-muted mb-3 opacity-60" />
        <span className="text-sm font-semibold text-text-muted">Table View Selected</span>
        <span className="text-xs text-text-muted mt-1 max-w-[280px]">Use the results tab to browse columns, page rows, and download dataset files</span>
      </div>
    );
  }

  // Get keys to chart
  const xAxisKey = chartConfig.x_axis || results.columns[0];
  // Determine metrics to plot (if empty, grab the first numeric column)
  const metrics = chartConfig.metrics && chartConfig.metrics.length > 0 
    ? chartConfig.metrics 
    : results.columns.filter(col => col !== xAxisKey).slice(0, 3);

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border rounded-2xl text-center min-h-[350px] select-none">
        <AlertCircle className="w-10 h-10 text-warning mb-3 opacity-80" />
        <span className="text-sm font-semibold text-text-primary">Unable to Chart Dataset</span>
        <span className="text-xs text-text-muted mt-1 max-w-[320px]">This query doesn't yield measurable values or metrics (e.g. counts, sums) to render visual charts.</span>
      </div>
    );
  }

  const chartTitle = chartConfig.title || `Insights: ${question || 'Database Query'}`;

  // Export Chart SVG to PNG Downloader
  const handleDownloadPng = () => {
    const container = document.getElementById('recharts-outer-wrapper');
    const svg = container?.querySelector('svg');
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svg.clientWidth || 800;
        canvas.height = svg.clientHeight || 400;
        const context = canvas.getContext('2d');
        if (context) {
          // Dark background matches bg-surface slate-800
          context.fillStyle = '#1e293b'; 
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = png;
          downloadLink.download = `${chartTitle.replace(/\s+/g, '_').toLowerCase()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    }
  };

  const renderChartContent = () => {
    switch (chartConfig.chart_type) {
      case 'line':
        return (
          <LineChart data={results.rows} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            {metrics.map((metric, i) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'pie':
        // Pie charts typically take the x_axis key as segment name and the first metric as value
        const pieMetric = metrics[0];
        return (
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
            <Pie
              data={results.rows}
              dataKey={pieMetric}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              labelLine={true}
            >
              {results.rows.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'scatter':
        const scatterY = metrics[0];
        return (
          <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} name={xAxisKey} />
            <YAxis dataKey={scatterY} stroke="var(--text-muted)" fontSize={11} tickLine={false} name={scatterY} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Scatter name={`${xAxisKey} vs ${scatterY}`} data={results.rows} fill="var(--primary)" />
          </ScatterChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={results.rows} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            {metrics.map((metric, i) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col bg-bg-surface border border-border rounded-2xl shadow-xl p-5 gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-4 select-none">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Dynamic Data Chart</span>
          <h3 className="text-base font-bold text-text-primary leading-tight">
            {chartTitle}
          </h3>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <ChartTypeSelector />
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer font-semibold shrink-0"
            title="Download Chart as PNG Image"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Export PNG</span>
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-[400px] flex items-center justify-center relative" id="recharts-outer-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartContent()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
