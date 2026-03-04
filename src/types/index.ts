// Core types for AuditPro Nepal

export type EntityType = 'private_limited' | 'public_limited' | 'ngo' | 'ingo' | 'cooperative' | 'partnership' | 'proprietorship' | 'trust' | 'government';

export type AuditStage = 'planning' | 'fieldwork' | 'review' | 'reporting' | 'completed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type DocumentStatus = 'requested' | 'received' | 'reviewed' | 'approved' | 'rejected';

export interface Client {
  id: string;
  name: string;
  panNumber: string;
  entityType: EntityType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  fiscalYearEnd: string;
  registrationDate: string;
  industry: string;
  status: 'active' | 'inactive' | 'prospect';
  riskLevel: RiskLevel;
  healthScore: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEngagement {
  id: string;
  clientId: string;
  fiscalYear: string;
  stage: AuditStage;
  assignedTo: string[];
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  progress: number;
  riskLevel: RiskLevel;
  materiality: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  engagementId: string;
  stage: AuditStage;
  title: string;
  description: string;
  assignedTo: string;
  completed: boolean;
  completedAt?: string;
  dueDate: string;
  priority: Priority;
  is_mandatory?: boolean;
  compliance_source?: string;
}

export interface Document {
  id: string;
  clientId: string;
  engagementId?: string;
  name: string;
  category: string;
  status: DocumentStatus;
  requestedDate: string;
  receivedDate?: string;
  version: number;
  notes: string;
  file_url?: string;
  extracted_data?: any;
  is_ai_processed?: boolean;
  created_at: string;
}

export interface Deadline {
  id: string;
  clientId?: string;
  title: string;
  description: string;
  authority: 'IRD' | 'OCR' | 'NRB' | 'SEBON' | 'Custom';
  dueDate: string;
  reminderDays: number;
  completed: boolean;
  completedAt?: string;
  penalty?: number;
  recurring: boolean;
  recurrencePattern?: string;
  priority: Priority;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  engagementId?: string;
  staffId: string;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  rate: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  engagementId?: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  status: PaymentStatus;
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount: number;
  notes: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'partner' | 'manager' | 'senior_auditor' | 'junior_auditor' | 'article' | 'intern';
  specialization: string;
  activeEngagements: number;
  billableHoursTarget: number;
  status: 'active' | 'on_leave' | 'inactive';
  joinDate: string;
}

export interface CommunicationLog {
  id: string;
  clientId: string;
  type: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'letter';
  subject: string;
  details: string;
  staffId: string;
  date: string;
  followUpDate?: string;
  createdAt: string;
}

// Working Papers types
export interface AuditFinding {
  id: string;
  engagementId: string;
  title: string;
  description: string;
  area: string;
  riskLevel: RiskLevel;
  impact: 'financial' | 'compliance' | 'operational' | 'reputational';
  status: 'identified' | 'discussed' | 'resolved' | 'reported';
  recommendation: string;
  managementResponse: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustingEntry {
  id: string;
  engagementId: string;
  entryNumber: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  type: 'adjusting' | 'reclassifying' | 'correcting';
  status: 'proposed' | 'approved' | 'posted' | 'rejected';
  preparedBy: string;
  reviewedBy: string;
  createdAt: string;
}

export interface RiskAssessmentItem {
  id: string;
  engagementId: string;
  area: string;
  inherentRisk: 1 | 2 | 3 | 4 | 5;
  controlRisk: 1 | 2 | 3 | 4 | 5;
  detectionRisk: 1 | 2 | 3 | 4 | 5;
  overallRisk: RiskLevel;
  mitigatingControls: string;
  auditProcedures: string;
  notes: string;
  createdAt: string;
}

// WhatsApp types
export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'deadline_reminder' | 'document_request' | 'payment_reminder' | 'general' | 'meeting';
  template: string;
  variables: string[];
  createdAt: string;
}

export interface WhatsAppAlert {
  id: string;
  templateId: string;
  clientId: string;
  scheduledDate: string;
  sent: boolean;
  sentAt?: string;
  message: string;
  createdAt: string;
}

// Sync config
export interface SyncConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  autoSync: boolean;
}

// Report types
export interface GeneratedReport {
  id: string;
  type: 'audit_report' | 'management_letter' | 'tax_computation';
  clientId: string;
  engagementId?: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'final';
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Engagement Letter types
export interface EngagementLetter {
  id: string;
  clientId: string;
  engagementId?: string;
  templateName: string;
  content: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  sentDate?: string;
  signedDate?: string;
  signatoryName: string;
  signatoryDesignation: string;
  firmSignatory: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface Firm {
  id: string;
  name: string;
  pan_number: string;
  address: string;
  phone: string;
  email: string;
  registration_number: string;
  ican_membership: string;
  logo_url?: string;
}

export interface Reconciliation {
  id: string;
  client_id: string;
  period: string;
  fiscal_year: string;
  ledger_source: string;
  ird_source: string;
  ledger_data: any[];
  ird_data: any[];
  matches: any[];
  mismatches: any[];
  flagged: any[];
  total_ledger_tds: number;
  total_ird_tds: number;
  variance: number;
  match_rate: number;
  status: 'draft' | 'processing' | 'completed' | 'reviewed';
  notes: string;
  created_at: string;
}

export interface ComplianceEntry {
  id: string;
  client_id: string;
  filing_type: string;
  period: string;
  due_date_bs: string;
  due_date_ad?: string;
  status: 'pending' | 'filed' | 'overdue' | 'error' | 'exempt';
  filed_date?: string;
  portal_reference?: string;
  error_code?: string;
  penalty_amount: number;
  notes?: string;
}

export interface AgentLogAction {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  confidence: number;
  reasoning_chain: any;
  requires_approval: boolean;
  approved_at?: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  execution_time_ms: number;
  created_at: string;
}

export interface NFRSEmbedding {
  id: string;
  standard_code: string;
  standard_name: string;
  paragraph: string;
  content: string;
  metadata: any;
}

export interface AppState {
  clients: Client[];
  engagements: AuditEngagement[];
  checklists: ChecklistItem[];
  documents: Document[];
  deadlines: Deadline[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  team: TeamMember[];
  communications: CommunicationLog[];
  auditFindings: AuditFinding[];
  adjustingEntries: AdjustingEntry[];
  riskAssessments: RiskAssessmentItem[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappAlerts: WhatsAppAlert[];
  syncConfig: SyncConfig;
  reports: GeneratedReport[];
  engagementLetters: EngagementLetter[];
  firms: Firm[];
  reconciliations: Reconciliation[];
  compliance: ComplianceEntry[];
  agentLogs: AgentLogAction[];
  nfrs: NFRSEmbedding[];
}

// Dashboard stat types
export interface DashboardStats {
  totalClients: number;
  activeAudits: number;
  upcomingDeadlines: number;
  overdueItems: number;
  unbilledHours: number;
  pendingInvoices: number;
  totalRevenue: number;
  monthlyBillable: number;
}
