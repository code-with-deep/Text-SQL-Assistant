'use client';

import React from 'react';
import { useQueryStore } from '@/stores/queryStore';
import { BarChart, LineChart, PieChart, ScatterChart, Table2 } from 'lucide-react';
import { ChartConfig } from '@/lib/types';

const chartOptions: { type: ChartConfig['chart_type']; label: string; icon: React.ComponentType<any> }[] = [
  { type: 'bar', label: 'Bar Chart', icon: BarChart },
  { type: 'line', label: 'Line Chart', icon: LineChart },
  { type: 'pie', label: 'Pie Chart', icon: PieChart },
  { type: 'scatter', label: 'Scatter Plot', icon: ScatterChart },
  { type: 'table', label: 'Tabular Data', icon: Table2 }
];

export default function ChartTypeSelector() {
  const { chartConfig, updateChartType, results } = useQueryStore();

  if (!results || !chartConfig) return null;

  return (
    <div className="flex items-center gap-1.5 p-1 bg-bg-elevated/60 border border-border rounded-xl w-fit select-none">
      {chartOptions.map((opt) => {
        const Icon = opt.icon;
        const isActive = chartConfig.chart_type === opt.type;

        return (
          <button
            key={opt.type}
            onClick={() => updateChartType(opt.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-bg-surface text-primary border border-border shadow-sm shadow-indigo-500/5'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface/30 border border-transparent'
            }`}
            title={opt.label}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}</span>
          </button>
        );
      })}
    </div>
  );
}
