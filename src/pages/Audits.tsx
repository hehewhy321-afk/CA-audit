import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Table2, Kanban, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EngagementDetail } from '@/components/EngagementDetail';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { toast } from 'sonner';

// ---- Checklist templates mirrored from SettingsSync for auto-populate ----
const checklistTemplates: Record<string, { text: string; category: string; required: boolean }[]> = {
  statutory: [
    { text: 'Trial Balance (as at Ashadh end)', category: 'Financial Statements', required: true },
    { text: 'Bank Statements (all accounts)', category: 'Bank', required: true },
    { text: 'Bank Reconciliation Statements', category: 'Bank', required: true },
    { text: 'VAT Returns (all periods)', category: 'Tax', required: true },
    { text: 'TDS Certificates & Challans', category: 'Tax', required: true },
    { text: 'Income Tax Return copy', category: 'Tax', required: true },
    { text: 'Fixed Asset Register', category: 'Assets', required: true },
    { text: 'Stock/Inventory Register', category: 'Assets', required: false },
    { text: 'Debtors & Creditors Ledger', category: 'Ledgers', required: true },
    { text: 'Salary Register & Pay Slips', category: 'HR', required: true },
    { text: 'Board Meeting Minutes', category: 'Corporate', required: true },
    { text: 'AGM Minutes', category: 'Corporate', required: true },
    { text: 'Memorandum & Articles of Association', category: 'Corporate', required: true },
    { text: 'PAN/VAT Registration Certificate', category: 'Registration', required: true },
    { text: 'Company Registration Certificate', category: 'Registration', required: true },
    { text: 'Lease/Rent Agreement', category: 'Legal', required: false },
    { text: 'Loan Agreements & Sanction Letters', category: 'Liabilities', required: false },
    { text: 'SSF Records', category: 'HR', required: true },
    { text: 'PF/Gratuity Fund Records', category: 'HR', required: true },
    // --- Vision 2026 Mandatory ICAN Items ---
    { text: 'Quality Management System Review (NSQM-1)', category: 'Compliance', required: true },
    { text: 'Engagement Quality Control Review (NSA-220)', category: 'Compliance', required: true },
    { text: 'Sustainability Disclosure Review (NSRS S1/S2 Draft)', category: 'Compliance', required: true },
  ],
  tax: [
    { text: 'Income Tax Return', category: 'Tax', required: true },
    { text: 'Financial Statements (Audited)', category: 'Financial Statements', required: true },
    { text: 'TDS Statements & Challans', category: 'Tax', required: true },
    { text: 'VAT Records (all periods)', category: 'Tax', required: true },
    { text: 'Advance Tax Payment Receipts', category: 'Tax', required: true },
    { text: 'Income Tax Assessment Orders (previous)', category: 'Tax', required: false },
    { text: 'Capital Expenditure Invoices', category: 'Assets', required: false },
  ],
  internal: [
    { text: 'Internal Control Review Document', category: 'Financial Statements', required: true },
    { text: 'Process Flow Documentation', category: 'Other', required: true },
    { text: 'Risk Register', category: 'Other', required: true },
    { text: 'Previous Internal Audit Report', category: 'Other', required: false },
    { text: 'Management Action Plan', category: 'Other', required: false },
    { text: 'Bank Statements (sample)', category: 'Bank', required: true },
    { text: 'Payroll Records (sample months)', category: 'HR', required: true },
  ],
  compliance: [
    { text: 'Regulatory Filing Records', category: 'Registration', required: true },
    { text: 'Compliance Policy Documents', category: 'Other', required: true },
    { text: 'License & Permit Certificates', category: 'Registration', required: true },
    { text: 'Board Resolutions', category: 'Corporate', required: true },
    { text: 'Environmental & Labour Compliance', category: 'Other', required: false },
  ],
  due_diligence: [
    { text: 'Audited Financial Statements (3 years)', category: 'Financial Statements', required: true },
    { text: 'Management Accounts', category: 'Financial Statements', required: true },
    { text: 'Tax Clearance Certificate', category: 'Tax', required: true },
    { text: 'Company Registration Documents', category: 'Registration', required: true },
    { text: 'Liabilities Schedule', category: 'Liabilities', required: true },
    { text: 'Contracts & Agreements', category: 'Legal', required: true },
    { text: 'Fixed Asset Register', category: 'Assets', required: true },
    { text: 'Debtors & Creditors Listing', category: 'Ledgers', required: true },
  ],
};

const stageColors: Record<string, string> = {
  planning: 'bg-info/20 text-info border-info/30',
  fieldwork: 'bg-warning/20 text-warning border-warning/30',
  review: 'bg-primary/20 text-primary border-primary/30',
  reporting: 'bg-success/20 text-success border-success/30',
  completed: 'bg-muted text-muted-foreground border-border',
};

const stageOrder = ['planning', 'fieldwork', 'review', 'reporting', 'completed'];

const auditTypes = [
  { value: 'statutory', label: 'Statutory Audit' },
  { value: 'tax', label: 'Tax Audit' },
  { value: 'internal', label: 'Internal Audit' },
  { value: 'compliance', label: 'Compliance Audit' },
  { value: 'performance', label: 'Performance Audit' },
  { value: 'forensic', label: 'Forensic Audit' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'special', label: 'Special Audit' },
];

// ---- Draggable Card ----
function DraggableCard({ eng, client, onOpen, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: eng.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-muted/50 rounded-md p-2.5 hover:bg-accent/30 transition-colors cursor-pointer group border border-transparent hover:border-border/50',
        isDragging && 'opacity-50'
      )}
      onClick={() => onOpen(eng)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{client?.name}</p>
            <p className="text-xs text-muted-foreground data-cell mt-0.5 capitalize">
              {auditTypes.find(t => t.value === getAuditType(eng))?.label || getAuditType(eng) || 'Audit'} · FY {eng.fiscal_year}
            </p>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(eng.id); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-muted-foreground">{eng.progress || 0}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${eng.progress || 0}%` }} />
        </div>
      </div>
    </div>
  );
}

// ---- Droppable Column ----
function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn('p-2 space-y-2 min-h-[140px] rounded-b-lg transition-colors', isOver && 'bg-accent/20')}
    >
      {children}
    </div>
  );
}

// ---- Sort helper ----
type SortField = 'client' | 'audit_type' | 'fiscal_year' | 'stage' | 'progress' | 'risk_level';

// Extract audit_type from notes field prefix [type:xxx] or from dedicated field
function getAuditType(eng: any): string {
  if (eng.audit_type) return eng.audit_type;
  const match = (eng.notes || '').match(/^\[type:([^\]]+)\]/);
  return match ? match[1] : 'statutory';
}

export default function Audits() {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [detailEng, setDetailEng] = useState<any | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [sortField, setSortField] = useState<SortField>('stage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [tableFilter, setTableFilter] = useState<'all' | 'active' | 'completed'>('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const engId = active.id as string;
    const newStage = over.id as string;
    const eng = state.engagements.find((e: any) => e.id === engId);
    if (eng && eng.stage !== newStage && stageOrder.includes(newStage)) {
      await updateItem('engagements', engId, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
    }
  }, [state.engagements, updateItem]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedEngagements = [...state.engagements]
    .filter((e: any) => {
      if (tableFilter === 'active') return e.stage !== 'completed';
      if (tableFilter === 'completed') return e.stage === 'completed';
      return true;
    })
    .sort((a: any, b: any) => {
      let av = '', bv = '';
      if (sortField === 'client') {
        const ca = state.clients.find((c: any) => c.id === a.client_id);
        const cb = state.clients.find((c: any) => c.id === b.client_id);
        av = ca?.name || ''; bv = cb?.name || '';
      } else if (sortField === 'audit_type') { av = a.audit_type || ''; bv = b.audit_type || ''; }
      else if (sortField === 'fiscal_year') { av = a.fiscal_year || ''; bv = b.fiscal_year || ''; }
      else if (sortField === 'stage') { av = String(stageOrder.indexOf(a.stage)); bv = String(stageOrder.indexOf(b.stage)); }
      else if (sortField === 'progress') { av = String(a.progress || 0); bv = String(b.progress || 0); }
      else if (sortField === 'risk_level') { av = a.risk_level || ''; bv = b.risk_level || ''; }
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />;
  };

  const activeEng = activeId ? state.engagements.find((e: any) => e.id === activeId) : null;
  const activeClient = activeEng ? state.clients.find((c: any) => c.id === activeEng.client_id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Audit Engagements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {state.engagements.length} engagements · {state.engagements.filter((e: any) => e.stage !== 'completed').length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
            <button onClick={() => setViewMode('kanban')}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                viewMode === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <Kanban className="h-3.5 w-3.5" /> Board
            </button>
            <button onClick={() => setViewMode('table')}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Engagement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">New Audit Engagement</DialogTitle></DialogHeader>
              <EngagementForm
                clients={state.clients}
                onSave={async (data: any) => {
                  // Store audit_type in notes since column may not exist in DB yet
                  // We'll read it back from notes prefix
                  const auditType = data.audit_type || 'statutory';
                  const { audit_type: _at, ...dbData } = data;
                  // Encode audit_type into notes so we don't lose it
                  const notesWithType = `[type:${auditType}] ${data.notes || ''}`.trim();
                  const eng = await addItem('engagements', { ...dbData, notes: notesWithType });
                  if (!eng) {
                    toast.error('Failed to create engagement. Please try again.');
                    return;
                  }
                  // Auto-populate checklist from template
                  const templateKey = auditType.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
                  const templateItems = checklistTemplates[templateKey] || checklistTemplates['statutory'];
                  // Map template categories to valid audit_stage enum values
                  const stageMap: Record<string, string> = {
                    'Financial Statements': 'fieldwork',
                    'Bank': 'fieldwork',
                    'Tax': 'fieldwork',
                    'Assets': 'fieldwork',
                    'Ledgers': 'fieldwork',
                    'HR': 'fieldwork',
                    'Corporate': 'planning',
                    'Registration': 'planning',
                    'Legal': 'planning',
                    'Liabilities': 'fieldwork',
                    'Other': 'review',
                    'Compliance': 'review',
                  };
                  if (eng.id && templateItems?.length > 0) {
                    for (const item of templateItems) {
                      await addItem('checklists', {
                        engagement_id: eng.id,
                        title: item.text,
                        stage: stageMap[item.category] || 'fieldwork',
                        is_mandatory: item.required,
                        compliance_source: item.category === 'Compliance' ? 'ICAN' : 'firm',
                        priority: item.required ? 'high' : 'medium',
                        completed: false,
                      });
                    }
                    toast.success(`✓ Engagement created with ${templateItems.length} checklist items`);
                  } else {
                    toast.success('Engagement created');
                  }
                  setShowAdd(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stageOrder.map(stage => {
              const items = state.engagements.filter((e: any) => e.stage === stage);
              return (
                <div key={stage} className="glass-card rounded-lg">
                  <div className={cn('px-3 py-2 border-b border-border flex items-center justify-between rounded-t-lg')}>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize border', stageColors[stage])}>
                      {stage}
                    </span>
                    <span className="text-xs data-cell text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  </div>
                  <DroppableColumn stage={stage}>
                    {items.map((eng: any) => {
                      const client = state.clients.find((c: any) => c.id === eng.client_id);
                      return (
                        <DraggableCard
                          key={eng.id}
                          eng={eng}
                          client={client}
                          onOpen={setDetailEng}
                          onDelete={(id: string) => deleteItem('engagements', id)}
                        />
                      );
                    })}
                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground/50 text-center py-6">Drop here</p>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeEng && (
              <div className="bg-card rounded-md p-2.5 shadow-2xl border border-border opacity-90 w-48">
                <p className="text-sm font-medium text-foreground truncate">{activeClient?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{activeEng.stage}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setTableFilter(f)}
                className={cn('text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors',
                  tableFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}>
                {f}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-1">({sortedEngagements.length})</span>
          </div>

          <div className="glass-card rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { key: 'client', label: 'Client' },
                    { key: 'audit_type', label: 'Type' },
                    { key: 'fiscal_year', label: 'FY' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'progress', label: 'Progress' },
                    { key: 'risk_level', label: 'Risk' },
                  ].map(col => (
                    <th key={col.key}
                      className="text-left px-4 py-2.5 stat-label cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => toggleSort(col.key as SortField)}>
                      {col.label}<SortIcon field={col.key as SortField} />
                    </th>
                  ))}
                  <th className="text-left px-4 py-2.5 stat-label">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedEngagements.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No engagements found</td></tr>
                )}
                {sortedEngagements.map((eng: any) => {
                  const client = state.clients.find((c: any) => c.id === eng.client_id);
                  const risk = eng.risk_level || 'medium';
                  return (
                    <tr key={eng.id}
                      className="hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => setDetailEng(eng)}>
                      <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[160px] truncate">{client?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                        {auditTypes.find(t => t.value === getAuditType(eng))?.label || getAuditType(eng) || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs data-cell text-muted-foreground">{eng.fiscal_year}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize border', stageColors[eng.stage] || 'bg-muted text-muted-foreground border-border')}>
                          {eng.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${eng.progress || 0}%` }} />
                          </div>
                          <span className="text-xs data-cell text-muted-foreground w-9">{eng.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium capitalize',
                          risk === 'high' || risk === 'critical' ? 'text-destructive' :
                            risk === 'medium' ? 'text-warning' : 'text-success'
                        )}>{risk}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); setDetailEng(eng); }}
                          className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Engagement Detail Dialog */}
      {detailEng && <EngagementDetail engagement={detailEng} onClose={() => setDetailEng(null)} />}
    </div>
  );
}

// ---- Engagement Form ----
function EngagementForm({ clients, initial, onSave }: { clients: any[]; initial?: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    client_id: initial?.client_id || '',
    audit_type: initial?.audit_type || 'statutory',
    fiscal_year: initial?.fiscal_year || '2081/82',
    stage: initial?.stage || 'planning',
    risk_level: initial?.risk_level || 'medium',
    progress: initial?.progress || 0,
    materiality: initial?.materiality || 0,
    start_date: initial?.start_date || '',
    expected_end_date: initial?.expected_end_date || '',
    notes: initial?.notes || '',
  });

  const selectedTemplate = checklistTemplates[form.audit_type] || checklistTemplates['statutory'];

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div>
        <Label className="text-xs">Client *</Label>
        <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Audit Type *</Label>
        <Select value={form.audit_type} onValueChange={v => setForm(f => ({ ...f, audit_type: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {auditTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedTemplate.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            ✓ {selectedTemplate.length} checklist items will be auto-loaded from template
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Fiscal Year</Label><Input value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))} className="h-9" /></div>
        <div>
          <Label className="text-xs">Stage</Label>
          <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{stageOrder.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Risk Level</Label>
          <Select value={form.risk_level} onValueChange={v => setForm(f => ({ ...f, risk_level: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{['low', 'medium', 'high', 'critical'].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Materiality (₨)</Label><Input type="number" value={form.materiality} onChange={e => setForm(f => ({ ...f, materiality: +e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Expected End</Label><Input type="date" value={form.expected_end_date} onChange={e => setForm(f => ({ ...f, expected_end_date: e.target.value }))} className="h-9" /></div>
      </div>
      <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
      <Button type="submit" className="w-full" disabled={!form.client_id}>{initial ? 'Update' : 'Create'} Engagement</Button>
    </form>
  );
}
