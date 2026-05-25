import { create } from 'zustand';
import { SchemaTable, Relationship } from '../lib/types';
import { apiService } from '../lib/api';

interface SchemaStore {
  tables: SchemaTable[];
  relationships: Relationship[];
  suggestions: string[];
  selectedTable: SchemaTable | null;
  tableDetails: Record<string, SchemaTable>; // Caches full details of tables by table name
  isLoadingSchema: boolean;
  isLoadingTable: boolean;
  isLoaded: boolean;
  error: string | null;
  
  // Actions
  fetchSchema: (force?: boolean) => Promise<void>;
  fetchSuggestions: (force?: boolean) => Promise<void>;
  selectTable: (tableName: string) => Promise<void>;
  refreshSchemaCache: () => Promise<void>;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  tables: [],
  relationships: [],
  suggestions: [],
  selectedTable: null,
  tableDetails: {},
  isLoadingSchema: false,
  isLoadingTable: false,
  isLoaded: false,
  error: null,

  fetchSchema: async (force = false) => {
    if (get().isLoaded && !force && get().tables.length > 0) {
      return;
    }
    set({ isLoadingSchema: true, error: null });
    try {
      const data = await apiService.getSchema();
      // The API returns tables as an object keyed by table name.
      // Convert to array for frontend consumption.
      const rawTables = data.tables || {};
      const tablesArray: SchemaTable[] = Array.isArray(rawTables)
        ? rawTables
        : Object.values(rawTables);
      set({ 
        tables: tablesArray, 
        relationships: data.relationships || [], 
        isLoaded: true,
        isLoadingSchema: false 
      });

      // Default select the first table if none is selected
      if (tablesArray.length > 0 && !get().selectedTable) {
        get().selectTable(tablesArray[0].name).catch(console.error);
      }
    } catch (error: any) {
      set({ 
        isLoadingSchema: false, 
        error: error.response?.data?.detail || error.message || 'Failed to fetch database schema' 
      });
    }
  },

  fetchSuggestions: async (force = false) => {
    if (get().suggestions.length > 0 && !force) {
      return;
    }
    try {
      const suggestions = await apiService.getSuggestions();
      set({ suggestions });
    } catch (error) {
      console.error('Failed to load suggestion chips:', error);
    }
  },

  selectTable: async (tableName) => {
    const { tableDetails, tables } = get();
    
    // Find basic table info from list
    const baseTable = tables.find(t => t.name === tableName) || null;
    
    // If details already cached, set immediately
    if (tableDetails[tableName]) {
      set({ selectedTable: tableDetails[tableName] });
      return;
    }

    set({ isLoadingTable: true });
    
    // Set basic info first so screen updates immediately while loading details
    if (baseTable) {
      set({ selectedTable: baseTable });
    }

    try {
      const detailTable = await apiService.getTableDetail(tableName);
      set({
        tableDetails: {
          ...tableDetails,
          [tableName]: detailTable
        },
        selectedTable: detailTable,
        isLoadingTable: false
      });
    } catch (error) {
      console.error(`Failed to load details for table: ${tableName}`, error);
      set({ isLoadingTable: false });
    }
  },

  refreshSchemaCache: async () => {
    // In Django ViewSet, there isn't a separate cache refresh URL, it's cached on django level,
    // but schema ViewSet recreates on list if requested or we can reload schema and suggestions.
    set({ tableDetails: {}, selectedTable: null });
    await Promise.all([
      get().fetchSchema(true),
      get().fetchSuggestions(true)
    ]);
  }
}));
