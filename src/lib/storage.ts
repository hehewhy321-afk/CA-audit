import { AppState, Client, AuditEngagement, TeamMember, Deadline, TimeEntry, Invoice, Document, ChecklistItem, CommunicationLog } from '@/types';

const STORAGE_KEY = 'auditpro_nepal';

const defaultState: AppState = {
  clients: [],
  engagements: [],
  checklists: [],
  documents: [],
  deadlines: [],
  timeEntries: [],
  invoices: [],
  team: [],
  communications: [],
  auditFindings: [],
  adjustingEntries: [],
  riskAssessments: [],
  whatsappTemplates: [],
  whatsappAlerts: [],
  syncConfig: { enabled: false, supabaseUrl: '', supabaseAnonKey: '', syncStatus: 'idle', autoSync: false },
  reports: [],
  engagementLetters: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return JSON.parse(raw) as AppState;
  } catch {
    return { ...defaultState };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function now(): string {
  return new Date().toISOString();
}

// CRUD helpers
export function addItem<T>(state: AppState, key: keyof AppState, item: T): AppState {
  const newState = { ...state, [key]: [...(state[key] as any[]), item] };
  saveState(newState);
  return newState;
}

export function updateItem<T extends { id: string }>(state: AppState, key: keyof AppState, item: T): AppState {
  const arr = state[key] as any[];
  const newState = { ...state, [key]: arr.map(i => i.id === item.id ? item : i) };
  saveState(newState);
  return newState;
}

export function deleteItem(state: AppState, key: keyof AppState, id: string): AppState {
  const arr = state[key] as any[];
  const newState = { ...state, [key]: arr.filter((i: any) => i.id !== id) };
  saveState(newState);
  return newState;
}
