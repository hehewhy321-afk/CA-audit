import { AppState, Client, AuditEngagement, TeamMember, Deadline, TimeEntry, Invoice } from '@/types';
import { generateId, now } from './storage';

export function generateSeedData(): AppState {
  const team: TeamMember[] = [
    { id: generateId(), name: 'Ram Prasad Sharma', email: 'ram@example.com', phone: '9841234567', role: 'partner', specialization: 'Tax & Audit', activeEngagements: 5, billableHoursTarget: 1800, status: 'active', joinDate: '2015-01-15' },
    { id: generateId(), name: 'Sita Devi Acharya', email: 'sita@example.com', phone: '9841234568', role: 'manager', specialization: 'Financial Audit', activeEngagements: 8, billableHoursTarget: 1600, status: 'active', joinDate: '2018-03-01' },
    { id: generateId(), name: 'Hari Bahadur KC', email: 'hari@example.com', phone: '9841234569', role: 'senior_auditor', specialization: 'NGO Audit', activeEngagements: 6, billableHoursTarget: 1500, status: 'active', joinDate: '2020-06-15' },
    { id: generateId(), name: 'Gita Adhikari', email: 'gita@example.com', phone: '9841234570', role: 'junior_auditor', specialization: 'Internal Audit', activeEngagements: 4, billableHoursTarget: 1400, status: 'active', joinDate: '2022-01-10' },
    { id: generateId(), name: 'Bikash Thapa', email: 'bikash@example.com', phone: '9841234571', role: 'article', specialization: 'General', activeEngagements: 3, billableHoursTarget: 1200, status: 'active', joinDate: '2023-07-01' },
  ];

  const clients: Client[] = [
    { id: generateId(), name: 'Nepal Hydro Power Ltd', panNumber: '301234567', entityType: 'public_limited', contactPerson: 'Suresh Karki', phone: '9851234567', email: 'suresh@nhpl.com.np', address: 'Durbar Marg, Kathmandu', fiscalYearEnd: 'Ashad', registrationDate: '2010-04-15', industry: 'Energy', status: 'active', riskLevel: 'medium', healthScore: 78, notes: 'Major client, annual audit', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Himalayan Tea Pvt Ltd', panNumber: '301234568', entityType: 'private_limited', contactPerson: 'Anita Rai', phone: '9851234568', email: 'anita@himtea.com', address: 'Thamel, Kathmandu', fiscalYearEnd: 'Ashad', registrationDate: '2015-08-20', industry: 'Agriculture', status: 'active', riskLevel: 'low', healthScore: 92, notes: 'Consistent client, good records', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Lumbini Development Trust', panNumber: '301234569', entityType: 'trust', contactPerson: 'Mohan Bahadur', phone: '9851234569', email: 'mohan@ldt.org.np', address: 'Lumbini, Rupandehi', fiscalYearEnd: 'Ashad', registrationDate: '2005-01-10', industry: 'Non-Profit', status: 'active', riskLevel: 'high', healthScore: 55, notes: 'Complex trust structure, requires extra attention', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Sagarmatha Construction Co', panNumber: '301234570', entityType: 'private_limited', contactPerson: 'Prakash Shrestha', phone: '9851234570', email: 'prakash@sagcon.com', address: 'New Baneshwor, Kathmandu', fiscalYearEnd: 'Ashad', registrationDate: '2018-11-05', industry: 'Construction', status: 'active', riskLevel: 'high', healthScore: 45, notes: 'Late submissions, needs follow-up', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Everest Microfinance', panNumber: '301234571', entityType: 'public_limited', contactPerson: 'Kamala Devi', phone: '9851234571', email: 'kamala@emf.com.np', address: 'Putalisadak, Kathmandu', fiscalYearEnd: 'Ashad', registrationDate: '2012-03-25', industry: 'Financial Services', status: 'active', riskLevel: 'medium', healthScore: 72, notes: 'NRB regulated, quarterly reviews required', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Pokhara Tech Solutions', panNumber: '301234572', entityType: 'private_limited', contactPerson: 'Rajesh Gurung', phone: '9851234572', email: 'rajesh@pts.com.np', address: 'Lakeside, Pokhara', fiscalYearEnd: 'Ashad', registrationDate: '2021-06-15', industry: 'Technology', status: 'active', riskLevel: 'low', healthScore: 88, notes: 'New client, well-organized', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Save the Children Nepal', panNumber: '301234573', entityType: 'ingo', contactPerson: 'David Wilson', phone: '9851234573', email: 'david@scn.org', address: 'Jawlakhel, Lalitpur', fiscalYearEnd: 'Ashad', registrationDate: '2000-05-01', industry: 'INGO', status: 'active', riskLevel: 'low', healthScore: 95, notes: 'Multi-currency, donor compliance required', createdAt: now(), updatedAt: now() },
    { id: generateId(), name: 'Kathmandu Cooperative Ltd', panNumber: '301234574', entityType: 'cooperative', contactPerson: 'Binod Maharjan', phone: '9851234574', email: 'binod@kcl.coop', address: 'Patan, Lalitpur', fiscalYearEnd: 'Ashad', registrationDate: '2008-09-12', industry: 'Cooperative', status: 'inactive', riskLevel: 'medium', healthScore: 60, notes: 'Dormant engagement', createdAt: now(), updatedAt: now() },
  ];

  const engagements: AuditEngagement[] = clients.filter(c => c.status === 'active').slice(0, 5).map((c, i) => ({
    id: generateId(),
    clientId: c.id,
    fiscalYear: '2081/82',
    stage: (['planning', 'fieldwork', 'fieldwork', 'review', 'reporting'] as const)[i],
    assignedTo: [team[i % team.length].id],
    startDate: '2025-01-15',
    expectedEndDate: '2025-06-30',
    progress: [15, 45, 55, 75, 90][i],
    riskLevel: c.riskLevel,
    materiality: [500000, 200000, 300000, 150000, 400000][i],
    notes: '',
    createdAt: now(),
    updatedAt: now(),
  }));

  const deadlines: Deadline[] = [
    { id: generateId(), title: 'VAT Return Filing', description: 'Monthly VAT return for all clients', authority: 'IRD', dueDate: '2025-03-25', reminderDays: 5, completed: false, recurring: true, recurrencePattern: 'monthly', priority: 'high' },
    { id: generateId(), title: 'Annual Return - OCR', description: 'Annual return filing at Company Registrar', authority: 'OCR', dueDate: '2025-04-15', reminderDays: 15, completed: false, recurring: true, recurrencePattern: 'yearly', priority: 'high' },
    { id: generateId(), title: 'TDS Deposit', description: 'Monthly TDS deposit deadline', authority: 'IRD', dueDate: '2025-03-15', reminderDays: 3, completed: true, completedAt: '2025-03-14', recurring: true, recurrencePattern: 'monthly', priority: 'urgent' },
    { id: generateId(), clientId: clients[4]?.id, title: 'NRB Quarterly Report', description: 'Quarterly financial report to Nepal Rastra Bank', authority: 'NRB', dueDate: '2025-04-30', reminderDays: 10, completed: false, recurring: true, recurrencePattern: 'quarterly', priority: 'high' },
    { id: generateId(), title: 'Income Tax Return', description: 'Annual income tax return for FY 2081/82', authority: 'IRD', dueDate: '2025-07-15', reminderDays: 30, completed: false, recurring: true, recurrencePattern: 'yearly', priority: 'urgent' },
  ];

  const timeEntries: TimeEntry[] = [];
  const invoices: Invoice[] = clients.filter(c => c.status === 'active').slice(0, 4).map((c, i) => ({
    id: generateId(),
    clientId: c.id,
    invoiceNumber: `INV-2081-${String(i + 1).padStart(3, '0')}`,
    amount: [150000, 80000, 120000, 60000][i],
    tax: [19500, 10400, 15600, 7800][i],
    total: [169500, 90400, 135600, 67800][i],
    status: (['paid', 'pending', 'partial', 'overdue'] as const)[i],
    issuedDate: '2025-01-15',
    dueDate: '2025-02-15',
    paidDate: i === 0 ? '2025-02-10' : undefined,
    paidAmount: [169500, 0, 67800, 0][i],
    notes: '',
    createdAt: now(),
  }));

  return {
    clients,
    engagements,
    checklists: [],
    documents: [],
    deadlines,
    auditFindings: [],
    adjustingEntries: [],
    riskAssessments: [],
    whatsappTemplates: [],
    whatsappAlerts: [],
    syncConfig: { enabled: false, supabaseUrl: '', supabaseAnonKey: '', syncStatus: 'idle', autoSync: false },
    reports: [],
    engagementLetters: [],
    timeEntries,
    invoices,
    team,
    communications: [],
  };
}
