import { create } from 'zustand';
import { QueryResult, ChartConfig, SafetyReport } from '../lib/types';
import { apiService } from '../lib/api';

interface QueryStore {
  question: string;
  sql: string;
  results: {
    columns: string[];
    rows: Record<string, any>[];
    row_count: number;
  } | null;
  chartConfig: ChartConfig | null;
  explanation: {
    summary: string;
    steps: string[];
  } | null;
  safetyReport: SafetyReport | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'results' | 'chart' | 'sql';
  queryId: string | number | null;
  executionMs: number | null;
  
  // Actions
  setQuestion: (question: string) => void;
  setSql: (sql: string) => void;
  setActiveTab: (tab: 'results' | 'chart' | 'sql') => void;
  updateChartType: (chartType: ChartConfig['chart_type']) => void;
  
  askQuestion: (question: string, conversationId: string | null) => Promise<QueryResult>;
  executeManualSql: (sql: string, conversationId: string | null) => Promise<QueryResult>;
  resetQueryState: () => void;
}

const initialQueryState = {
  question: '',
  sql: '',
  results: null,
  chartConfig: null,
  explanation: null,
  safetyReport: null,
  isLoading: false,
  error: null,
  activeTab: 'results' as const,
  queryId: null,
  executionMs: null,
};

export const useQueryStore = create<QueryStore>((set, get) => ({
  ...initialQueryState,

  setQuestion: (question) => set({ question }),
  setSql: (sql) => set({ sql }),
  setActiveTab: (activeTab) => set({ activeTab }),

  updateChartType: (chartType) => {
    const { chartConfig } = get();
    if (chartConfig) {
      set({
        chartConfig: {
          ...chartConfig,
          chart_type: chartType,
        },
      });
    }
  },

  askQuestion: async (question, conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.queryNL(question, conversationId);
      
      // Auto-set the active tab: if a valid visualization is recommended, show Chart, else Results
      const hasChart = response.chart_config && response.chart_config.chart_type !== 'table';
      const activeTab = hasChart ? 'chart' : 'results';

      set({
        question,
        sql: response.sql,
        results: response.results,
        chartConfig: response.chart_config,
        explanation: response.explanation,
        safetyReport: response.safety_report,
        queryId: response.query_id,
        executionMs: response.execution_ms,
        activeTab,
        isLoading: false,
      });

      return response;
    } catch (error: any) {
      const errMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'An error occurred while executing your query.';
      
      set({ 
        isLoading: false, 
        error: errMessage,
        sql: error.response?.data?.sql || '',
        safetyReport: error.response?.data?.safety_report || null,
        executionMs: null,
      });
      throw error;
    }
  },

  executeManualSql: async (sql, conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.executeSql(sql, conversationId);
      
      const hasChart = response.chart_config && response.chart_config.chart_type !== 'table';
      const activeTab = hasChart ? 'chart' : 'results';

      set({
        sql: response.sql,
        results: response.results,
        chartConfig: response.chart_config,
        explanation: response.explanation,
        safetyReport: response.safety_report,
        queryId: response.query_id,
        executionMs: response.execution_ms,
        activeTab,
        isLoading: false,
      });

      return response;
    } catch (error: any) {
      const errMessage = error.response?.data?.error || error.response?.data?.detail || error.message || 'An error occurred while executing SQL.';
      set({ 
        isLoading: false, 
        error: errMessage,
        safetyReport: error.response?.data?.safety_report || null,
        executionMs: null,
      });
      throw error;
    }
  },

  resetQueryState: () => set(initialQueryState),
}));
