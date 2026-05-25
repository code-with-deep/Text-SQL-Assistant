// TypeScript Interfaces for the Text-to-SQL Assistant Application

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Database schema structures
export interface Column {
  name: string;
  type: string;
  is_pk: boolean;
  is_fk: boolean;
  nullable: boolean;
  references_table?: string | null;
  references_column?: string | null;
  // stats below are loaded via table details
  min_value?: any;
  max_value?: any;
  avg_value?: any;
  unique_values_count?: number;
  null_values_count?: number;
  value_distribution?: { value: string; count: number; percentage: number }[];
}

export interface SchemaTable {
  name: string;
  row_count: number;
  column_count: number;
  columns?: Column[];
  preview_rows?: Record<string, any>[];
}

export interface Relationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
}

export interface SchemaData {
  tables: SchemaTable[] | Record<string, SchemaTable>;
  relationships: Relationship[];
}

// Safety report structures
export interface SafetyReport {
  is_safe: boolean;
  has_limit: boolean;
  is_select_only: boolean;
  no_blocked_keywords: boolean;
  no_sql_injection: boolean;
  details?: {
    blocked_keywords_found?: string[];
    parser_errors?: string[];
    [key: string]: any;
  };
}

// Query result structures
export interface QueryResult {
  query_id: string | number;
  sql: string;
  explanation: {
    summary: string;
    steps: string[];
  };
  results: {
    columns: string[];
    rows: Record<string, any>[];
    row_count: number;
  };
  chart_config: ChartConfig;
  safety_report: SafetyReport;
  execution_ms: number;
  conversation_id: string;
}

// Chart configuration structures
export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
  x_axis: string | null;
  y_axis: string | null; // Keep for compatibility
  metrics: string[] | null; // Fields to display as series/values
  title: string;
}

// Conversation Turn structure
export interface ConversationTurn {
  id: string;
  question: string;
  sql: string;
  explanation: {
    summary: string;
    steps: string[];
  };
  results: {
    columns: string[];
    rows: Record<string, any>[];
    row_count: number;
  };
  chart_config: ChartConfig;
  safety_report: SafetyReport;
  execution_ms: number;
  created_at: string;
}

// Query history log from backend
export interface QueryHistory {
  id: string | number;
  question: string;
  generated_sql: string;
  explanation: string;
  result_preview: {
    columns: string[];
    rows: Record<string, any>[];
    truncated: boolean;
  } | null;
  chart_type: string;
  chart_config: ChartConfig | null;
  safety_report: SafetyReport | null;
  result_rows: number;
  execution_ms: number;
  is_favorite: boolean;
  is_successful: boolean;
  error_message: string | null;
  conversation_id: string | null;
  created_at: string;
}

// API Health status structures
export interface HealthStatus {
  status: 'ok' | 'error';
  services: {
    db_default: string;
    db_readonly: string;
    llm_configured?: boolean;
  };
}
