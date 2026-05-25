import { create } from 'zustand';
import { ConversationTurn } from '../lib/types';
import { apiService } from '../lib/api';

interface ConversationStore {
  sessionId: string | null;
  turns: ConversationTurn[];
  isFollowUp: boolean;
  isLoadingTurns: boolean;
  
  // Actions
  setSessionId: (id: string | null) => void;
  addTurn: (turn: ConversationTurn) => void;
  loadSessionTurns: (conversationId: string) => Promise<void>;
  resetSession: () => void;
  setFollowUp: (isFollowUp: boolean) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  sessionId: null,
  turns: [],
  isFollowUp: false,
  isLoadingTurns: false,

  setSessionId: (sessionId) => set({ sessionId }),
  
  addTurn: (turn) => set((state) => ({ 
    turns: [...state.turns, turn],
    isFollowUp: true // After first turn, subsequent turns are follow-ups
  })),

  loadSessionTurns: async (conversationId) => {
    set({ isLoadingTurns: true, sessionId: conversationId });
    try {
      // Fetch history items filtered by this session ID
      const history = await apiService.getHistory({ conversation_id: conversationId });
      
      // Map QueryHistory records to ConversationTurn records
      // Sort oldest to newest so they appear in chronological order
      const mappedTurns: ConversationTurn[] = history
        .filter(item => item.is_successful)
        .map((item) => ({
          id: item.id.toString(),
          question: item.question,
          sql: item.generated_sql,
          explanation: {
            summary: item.explanation,
            steps: [] // Backend only returns explanation string directly in history
          },
          results: {
            columns: item.result_preview?.columns || [],
            rows: item.result_preview?.rows || [],
            row_count: item.result_rows
          },
          chart_config: item.chart_config || {
            chart_type: (item.chart_type as any) || 'table',
            x_axis: null,
            y_axis: null,
            metrics: null,
            title: 'Results'
          },
          safety_report: item.safety_report || {
            is_safe: true,
            has_limit: true,
            is_select_only: true,
            no_blocked_keywords: true,
            no_sql_injection: true
          },
          execution_ms: item.execution_ms,
          created_at: item.created_at
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      set({ 
        turns: mappedTurns, 
        isFollowUp: mappedTurns.length > 0, 
        isLoadingTurns: false 
      });
    } catch (error) {
      console.error(`Failed to load turns for conversation: ${conversationId}`, error);
      set({ isLoadingTurns: false, turns: [], isFollowUp: false });
    }
  },

  resetSession: () => set({
    sessionId: null,
    turns: [],
    isFollowUp: false,
    isLoadingTurns: false
  }),

  setFollowUp: (isFollowUp) => set({ isFollowUp }),
}));
