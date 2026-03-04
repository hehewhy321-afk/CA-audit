import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Database, Settings, Save, Plus, Trash2, Edit2, BookOpen, CalendarClock, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const entityLabels: Record<string, string> = {
  private_limited: 'Pvt. Ltd.', public_limited: 'Public Ltd.', ngo: 'NGO', ingo: 'INGO',
  cooperative: 'Cooperative', partnership: 'Partnership', proprietorship: 'Proprietorship',
  trust: 'Trust', government: 'Government',
};

export default function SettingsSync() {
  const { state, addItem, updateItem } = useApp();
  const { profile } = useAuth();
  const settings = state.caSettings;

  const [form, setForm] = useState({
    firm_name: settings?.firm_name || profile?.firm_name || '',
    firm_pan: settings?.firm_pan || '',
    firm_address: settings?.firm_address || '',
    fiscal_year: settings?.fiscal_year || '2081/82',
    default_billing_rate: settings?.default_billing_rate || 2000,
    tax_slabs: JSON.stringify(settings?.tax_slabs || [
      { min: 0, max: 400000, rate: 1 },
      { min: 400000, max: 500000, rate: 10 },
      { min: 500000, max: 700000, rate: 20 },
      { min: 700000, max: 2000000, rate: 30 },
      { min: 2000000, max: null, rate: 36 },
    ], null, 2),
    tds_rates: JSON.stringify(settings?.tds_rates || [
      { type: 'Salary', rate: 'As per slab' },
      { type: 'Rent (Land/Building)', rate: 10 },
      { type: 'Service Fee', rate: 15 },
      { type: 'Interest', rate: 15 },
      { type: 'Dividend', rate: 5 },
    ], null, 2),
    corporate_rates: JSON.stringify(settings?.corporate_rates || {
      general: 25, bank_finance: 30, special_industry: 20, cooperative: 20, reinsurance: 5,
    }, null, 2),
  });

  const handleSave = async () => {
    try {
      const data = {
        firm_name: form.firm_name,
        firm_pan: form.firm_pan,
        firm_address: form.firm_address,
        fiscal_year: form.fiscal_year,
        default_billing_rate: Number(form.default_billing_rate),
        tax_slabs: JSON.parse(form.tax_slabs),
        tds_rates: JSON.parse(form.tds_rates),
        corporate_rates: JSON.parse(form.corporate_rates),
      };
      if (settings?.id) {
        await updateItem('caSettings', settings.id, data);
      } else {
        await addItem('caSettings', data);
      }
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Invalid JSON in tax configuration');
    }
  };

  const dataStats = {
    clients: state.clients.length,
    engagements: state.engagements.length,
    deadlines: state.deadlines.length,
    timeEntries: state.timeEntries.length,
    invoices: state.invoices.length,
    team: state.team.length,
    findings: state.auditFindings.length,
  };
  const totalRecords = Object.values(dataStats).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Firm settings, templates, tax rates, and configuration</p>
      </div>

      <Tabs defaultValue="firm" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="firm">Firm Details</TabsTrigger>
          <TabsTrigger value="tax">Tax Config</TabsTrigger>
          <TabsTrigger value="checklists">Checklist Templates</TabsTrigger>
          <TabsTrigger value="deadlines">Deadline Rules</TabsTrigger>
          <TabsTrigger value="fees">Fee Structures</TabsTrigger>
          <TabsTrigger value="data">Data Overview</TabsTrigger>
        </TabsList>

        {/* Firm Details */}
        <TabsContent value="firm">
          <div className="glass-card rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-heading font-semibold text-foreground">Firm Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Firm Name</Label><Input value={form.firm_name} onChange={e => setForm(f => ({ ...f, firm_name: e.target.value }))} className="h-9" /></div>
              <div><Label className="text-xs">Firm PAN</Label><Input value={form.firm_pan} onChange={e => setForm(f => ({ ...f, firm_pan: e.target.value }))} className="h-9" /></div>
              <div className="col-span-2"><Label className="text-xs">Address</Label><Input value={form.firm_address} onChange={e => setForm(f => ({ ...f, firm_address: e.target.value }))} className="h-9" /></div>
              <div><Label className="text-xs">Fiscal Year</Label><Input value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))} className="h-9" /></div>
              <div><Label className="text-xs">Default Billing Rate (₨/hr)</Label><Input type="number" value={form.default_billing_rate} onChange={e => setForm(f => ({ ...f, default_billing_rate: +e.target.value }))} className="h-9" /></div>
            </div>
            <Button onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
          </div>
        </TabsContent>

        {/* Tax Configuration */}
        <TabsContent value="tax">
          <div className="glass-card rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-heading font-semibold text-foreground">Tax Configuration (Nepal)</h2>
            <div>
              <Label className="text-xs">Income Tax Slabs (JSON)</Label>
              <textarea value={form.tax_slabs} onChange={e => setForm(f => ({ ...f, tax_slabs: e.target.value }))}
                className="w-full h-32 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">TDS Rates (JSON)</Label>
              <textarea value={form.tds_rates} onChange={e => setForm(f => ({ ...f, tds_rates: e.target.value }))}
                className="w-full h-32 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">Corporate Tax Rates (JSON)</Label>
              <textarea value={form.corporate_rates} onChange={e => setForm(f => ({ ...f, corporate_rates: e.target.value }))}
                className="w-full h-28 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono" />
            </div>
            <Button onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Settings</Button>
          </div>
        </TabsContent>

        {/* Checklist Templates */}
        <TabsContent value="checklists">
          <ChecklistTemplateEditor />
        </TabsContent>

        {/* Deadline Rules */}
        <TabsContent value="deadlines">
          <DeadlineRulesEditor />
        </TabsContent>

        {/* Fee Structures */}
        <TabsContent value="fees">
          <FeeStructuresEditor />
        </TabsContent>

        {/* Data Overview */}
        <TabsContent value="data">
          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-heading font-semibold text-foreground">Data Overview</h2>
              <span className="text-xs data-cell text-muted-foreground ml-auto">{totalRecords} total records</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(dataStats).map(([key, count]) => (
                <div key={key} className="bg-muted rounded-md p-3">
                  <p className="stat-label capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="stat-value text-lg">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Checklist Template Editor =====
const defaultTemplates = [
  {
    name: 'Statutory Audit',
    category: 'statutory',
    items: [
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
      { text: 'PAN/VAT Registration Certificate', category: 'Registration', required: true },
      { text: 'Company Registration Certificate', category: 'Registration', required: true },
      { text: 'SSF Records', category: 'HR', required: true },
    ],
  },
  {
    name: 'Tax Audit',
    category: 'tax',
    items: [
      { text: 'Income Tax Return', category: 'Tax', required: true },
      { text: 'Financial Statements', category: 'Financial Statements', required: true },
      { text: 'TDS Statements', category: 'Tax', required: true },
      { text: 'VAT Records', category: 'Tax', required: true },
      { text: 'Advance Tax Payments', category: 'Tax', required: true },
    ],
  },
];

function ChecklistTemplateEditor() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');

  const template = templates[activeTemplate];

  const addItem = () => {
    if (!newItemText.trim()) return;
    const updated = [...templates];
    updated[activeTemplate].items.push({ text: newItemText, category: newItemCategory, required: false });
    setTemplates(updated);
    setNewItemText('');
    toast.success('Item added');
  };

  const removeItem = (idx: number) => {
    const updated = [...templates];
    updated[activeTemplate].items.splice(idx, 1);
    setTemplates(updated);
  };

  const toggleRequired = (idx: number) => {
    const updated = [...templates];
    updated[activeTemplate].items[idx].required = !updated[activeTemplate].items[idx].required;
    setTemplates(updated);
  };

  const addTemplate = () => {
    setTemplates([...templates, { name: 'New Template', category: 'custom', items: [] }]);
    setActiveTemplate(templates.length);
  };

  const categories = ['Financial Statements', 'Bank', 'Tax', 'Assets', 'Ledgers', 'HR', 'Corporate', 'Registration', 'Legal', 'Other'];

  return (
    <div className="glass-card rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold text-foreground">Checklist Templates</h2>
        </div>
        <Button size="sm" variant="outline" onClick={addTemplate} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> New Template
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {templates.map((t, i) => (
          <button key={i} onClick={() => setActiveTemplate(i)}
            className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              i === activeTemplate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}>{t.name} ({t.items.length})</button>
        ))}
      </div>

      {template && (
        <div className="space-y-3">
          <Input value={template.name} onChange={e => {
            const updated = [...templates];
            updated[activeTemplate].name = e.target.value;
            setTemplates(updated);
          }} className="h-9 font-medium" placeholder="Template name" />

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {template.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded shrink-0',
                  item.required ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
                )}>{item.required ? 'Required' : 'Optional'}</span>
                <span className="text-xs text-muted-foreground shrink-0 w-28 truncate">{item.category}</span>
                <span className="text-sm text-foreground flex-1">{item.text}</span>
                <button onClick={() => toggleRequired(idx)} className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100">
                  {item.required ? 'Make Optional' : 'Make Required'}
                </button>
                <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="New item text..." className="h-8 text-xs flex-1" />
            <Select value={newItemCategory} onValueChange={setNewItemCategory}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs" onClick={addItem}>Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Deadline Rules Editor =====
const defaultDeadlineRules = [
  { name: 'VAT Monthly Filing', description: 'File VAT returns', dayOfMonth: 25, month: 'every', applicableTo: ['all'], advanceWarningDays: 5, penalty: 'NPR 1,000/month or 0.1%/day', active: true },
  { name: 'TDS Deposit', description: 'Deposit TDS collected', dayOfMonth: 25, month: 'every', applicableTo: ['all'], advanceWarningDays: 5, penalty: 'NPR 5,000 + 15% p.a. interest', active: true },
  { name: 'Income Tax Filing (Corporate)', description: 'File annual corporate tax return', dayOfMonth: null, month: 'Poush', applicableTo: ['private_limited', 'public_limited'], advanceWarningDays: 30, penalty: 'NPR 5,000 or 0.5%/month', active: true },
  { name: 'Audit Report Submission', description: 'Submit audit report to authorities', dayOfMonth: null, month: 'Ashwin', applicableTo: ['all'], advanceWarningDays: 30, penalty: 'NPR 25,000/year', active: true },
  { name: 'AGM Deadline', description: 'Hold Annual General Meeting', dayOfMonth: null, month: 'Ashwin', applicableTo: ['private_limited', 'public_limited'], advanceWarningDays: 30, penalty: 'Per Companies Act 2063', active: true },
  { name: 'SSF Contribution', description: 'Pay SSF contributions', dayOfMonth: 28, month: 'every', applicableTo: ['all'], advanceWarningDays: 5, penalty: '15% interest + 10% penalty', active: true },
];

function DeadlineRulesEditor() {
  const [rules, setRules] = useState(defaultDeadlineRules);
  const [showAdd, setShowAdd] = useState(false);

  const addRule = (rule: any) => {
    setRules([...rules, rule]);
    setShowAdd(false);
    toast.success('Rule added');
  };

  const toggleActive = (idx: number) => {
    const updated = [...rules];
    updated[idx].active = !updated[idx].active;
    setRules(updated);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="glass-card rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold text-foreground">Deadline Rules Engine</h2>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add Rule
        </Button>
      </div>

      {showAdd && (
        <DeadlineRuleForm onSave={addRule} onCancel={() => setShowAdd(false)} />
      )}

      <div className="space-y-2">
        {rules.map((rule, idx) => (
          <div key={idx} className={cn('rounded-lg border px-4 py-3 transition-opacity', rule.active ? 'border-border' : 'border-border opacity-50')}>
            <div className="flex items-center gap-3">
              <Switch checked={rule.active} onCheckedChange={() => toggleActive(idx)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs data-cell text-foreground">
                  {rule.month === 'every' ? `Day ${rule.dayOfMonth} of every month` : `${rule.month} end`}
                </p>
                <p className="text-[10px] text-muted-foreground">{rule.advanceWarningDays}d advance warning</p>
              </div>
              <button onClick={() => removeRule(idx)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{rule.penalty}</span>
              {rule.applicableTo.map((t: string) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {t === 'all' ? 'All entities' : entityLabels[t] || t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeadlineRuleForm({ onSave, onCancel }: { onSave: (rule: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', dayOfMonth: 25, month: 'every', applicableTo: ['all'],
    advanceWarningDays: 5, penalty: '', active: true,
  });

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Rule Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" /></div>
        <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-8 text-xs" /></div>
        <div><Label className="text-xs">Day of Month</Label><Input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: +e.target.value }))} className="h-8 text-xs" /></div>
        <div>
          <Label className="text-xs">Month</Label>
          <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="every" className="text-xs">Every Month</SelectItem>
              {['Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'].map(m => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Advance Warning (days)</Label><Input type="number" value={form.advanceWarningDays} onChange={e => setForm(f => ({ ...f, advanceWarningDays: +e.target.value }))} className="h-8 text-xs" /></div>
        <div><Label className="text-xs">Penalty</Label><Input value={form.penalty} onChange={e => setForm(f => ({ ...f, penalty: e.target.value }))} className="h-8 text-xs" placeholder="e.g. NPR 1,000/month" /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="text-xs" onClick={() => onSave(form)}>Add Rule</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ===== Fee Structures Editor =====
const defaultFeeStructures = [
  { name: 'Statutory Audit — Small', entityType: 'private_limited', revenueRange: 'Up to NPR 1 Cr', baseFee: 50000 },
  { name: 'Statutory Audit — Medium', entityType: 'private_limited', revenueRange: 'NPR 1-10 Cr', baseFee: 150000 },
  { name: 'Statutory Audit — Large', entityType: 'public_limited', revenueRange: 'NPR 10+ Cr', baseFee: 350000 },
  { name: 'Tax Audit — Standard', entityType: 'private_limited', revenueRange: 'Any', baseFee: 75000 },
  { name: 'NGO Audit', entityType: 'ngo', revenueRange: 'Any', baseFee: 40000 },
  { name: 'Cooperative Audit', entityType: 'cooperative', revenueRange: 'Any', baseFee: 30000 },
];

function FeeStructuresEditor() {
  const [fees, setFees] = useState(defaultFeeStructures);
  const [showAdd, setShowAdd] = useState(false);

  const addFee = (fee: any) => {
    setFees([...fees, fee]);
    setShowAdd(false);
    toast.success('Fee structure added');
  };

  return (
    <div className="glass-card rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-heading font-semibold text-foreground">Fee Structures</h2>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add Structure
        </Button>
      </div>

      {showAdd && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <FeeForm onSave={addFee} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      <div className="space-y-2">
        {fees.map((fee, idx) => (
          <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{fee.name}</p>
              <p className="text-xs text-muted-foreground">
                {entityLabels[fee.entityType] || fee.entityType} · {fee.revenueRange}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold data-cell text-foreground">₨{fee.baseFee.toLocaleString()}</span>
              <button onClick={() => setFees(fees.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeForm({ onSave, onCancel }: { onSave: (fee: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', entityType: 'private_limited', revenueRange: '', baseFee: 50000 });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div><Label className="text-xs">Structure Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" /></div>
      <div>
        <Label className="text-xs">Entity Type</Label>
        <Select value={form.entityType} onValueChange={v => setForm(f => ({ ...f, entityType: v }))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(entityLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Revenue Range</Label><Input value={form.revenueRange} onChange={e => setForm(f => ({ ...f, revenueRange: e.target.value }))} className="h-8 text-xs" placeholder="e.g. NPR 1-10 Cr" /></div>
      <div><Label className="text-xs">Base Fee (₨)</Label><Input type="number" value={form.baseFee} onChange={e => setForm(f => ({ ...f, baseFee: +e.target.value }))} className="h-8 text-xs" /></div>
      <div className="col-span-2 flex gap-2">
        <Button size="sm" className="text-xs" onClick={() => onSave(form)}>Add</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
