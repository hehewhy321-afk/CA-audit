import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Simplified state types using Supabase row types
export interface AppState {
  clients: any[];
  engagements: any[];
  checklists: any[];
  documents: any[];
  deadlines: any[];
  timeEntries: any[];
  invoices: any[];
  team: any[];
  communications: any[];
  auditFindings: any[];
  adjustingEntries: any[];
  riskAssessments: any[];
  whatsappTemplates: any[];
  whatsappAlerts: any[];
  reports: any[];
  engagementLetters: any[];
  knowledgeArticles: any[];
  firms: any[];
  reconciliations: any[];
  compliance: any[];
  agentLogs: any[];
  nfrs: any[];
  caSettings: any | null;
  loading: boolean;
}

const defaultState: AppState = {
  clients: [], engagements: [], checklists: [], documents: [], deadlines: [],
  timeEntries: [], invoices: [], team: [], communications: [],
  auditFindings: [], adjustingEntries: [], riskAssessments: [],
  whatsappTemplates: [], whatsappAlerts: [], reports: [],
  engagementLetters: [], knowledgeArticles: [],
  firms: [], reconciliations: [], compliance: [], agentLogs: [], nfrs: [],
  caSettings: null, loading: true,
};

interface AppContextType {
  state: AppState;
  refresh: () => Promise<void>;
  // CRUD helpers
  addItem: (table: string, item: any) => Promise<any>;
  updateItem: (table: string, id: string, updates: any) => Promise<void>;
  deleteItem: (table: string, id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const tableMap: Record<string, string> = {
  clients: 'clients',
  engagements: 'audit_engagements',
  checklists: 'checklist_items',
  documents: 'documents',
  deadlines: 'deadlines',
  timeEntries: 'time_entries',
  invoices: 'invoices',
  team: 'team_members',
  communications: 'communication_logs',
  auditFindings: 'audit_findings',
  adjustingEntries: 'adjusting_entries',
  riskAssessments: 'risk_assessments',
  whatsappTemplates: 'whatsapp_templates',
  whatsappAlerts: 'whatsapp_alerts',
  reports: 'generated_reports',
  engagementLetters: 'engagement_letters',
  knowledgeArticles: 'knowledge_base_articles',
  firms: 'firms',
  reconciliations: 'reconciliations',
  compliance: 'compliance_calendar',
  agentLogs: 'agent_logs',
  nfrs: 'nfrs_embeddings',
  caSettings: 'ca_settings',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(defaultState);

  const loadAll = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }
    setState(s => ({ ...s, loading: true }));

    const queries = Object.entries(tableMap).map(async ([key, table]) => {
      const { data } = await (supabase.from(table as any) as any).select('*').order('created_at', { ascending: false });
      return [key, data || []] as [string, any[]];
    });

    const results = await Promise.all(queries);
    const newState: any = { ...defaultState, loading: false };
    for (const [key, data] of results) {
      if (key === 'caSettings') {
        newState.caSettings = data?.[0] || null;
      } else {
        newState[key] = data;
      }
    }
    setState(newState);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addItem = useCallback(async (stateKey: string, item: any) => {
    const table = tableMap[stateKey];
    if (!table || !user) return null;
    const row = { ...item, ca_user_id: user.id };
    delete row.id;
    const { data, error } = await (supabase.from(table as any) as any).insert(row).select().single();
    if (!error && data) {
      setState(s => {
        if (stateKey === 'caSettings') return { ...s, caSettings: data };
        return { ...s, [stateKey]: [data, ...(s as any)[stateKey]] };
      });
    }
    return data;
  }, [user]);

  const updateItem = useCallback(async (stateKey: string, id: string, updates: any) => {
    const table = tableMap[stateKey];
    if (!table) return;
    const { data, error } = await (supabase.from(table as any) as any).update(updates).eq('id', id).select().single();
    if (!error && data) {
      setState(s => {
        if (stateKey === 'caSettings') return { ...s, caSettings: data };
        const arr = (s as any)[stateKey] as any[];
        return { ...s, [stateKey]: arr.map((i: any) => i.id === id ? data : i) };
      });
    }
  }, []);

  const deleteItem = useCallback(async (stateKey: string, id: string) => {
    const table = tableMap[stateKey];
    if (!table) return;
    await (supabase.from(table as any) as any).delete().eq('id', id);
    setState(s => {
      const arr = (s as any)[stateKey] as any[];
      return { ...s, [stateKey]: arr.filter((i: any) => i.id !== id) };
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, refresh: loadAll, addItem, updateItem, deleteItem }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
