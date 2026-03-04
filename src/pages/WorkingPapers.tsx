import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Plus, AlertTriangle, BookOpen, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const riskColors: Record<string, string> = {
  low: 'bg-success/15 text-success', medium: 'bg-warning/15 text-warning',
  high: 'bg-destructive/15 text-destructive', critical: 'bg-destructive/25 text-destructive',
};

const riskScoreColor = (score: number) => {
  if (score <= 5) return 'text-success';
  if (score <= 12) return 'text-warning';
  return 'text-destructive';
};

const computeOverallRisk = (ir: number, cr: number): string => {
  const score = ir * cr;
  if (score <= 4) return 'low';
  if (score <= 9) return 'medium';
  if (score <= 16) return 'high';
  return 'critical';
};

export default function WorkingPapers() {
  const { state, addItem, deleteItem } = useApp();
  const [activeTab, setActiveTab] = useState('findings');
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [filterEngagement, setFilterEngagement] = useState<string>('all');

  const engagements = state.engagements;
  const findings = filterEngagement === 'all' ? state.auditFindings : state.auditFindings.filter((f: any) => f.engagement_id === filterEngagement);
  const entries = filterEngagement === 'all' ? state.adjustingEntries : state.adjustingEntries.filter((e: any) => e.engagement_id === filterEngagement);
  const risks = filterEngagement === 'all' ? state.riskAssessments : state.riskAssessments.filter((r: any) => r.engagement_id === filterEngagement);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Working Papers</h1>
          <p className="text-sm text-muted-foreground mt-1">Findings, journal entries & risk assessment</p>
        </div>
        <Select value={filterEngagement} onValueChange={setFilterEngagement}>
          <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="All Engagements" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Engagements</SelectItem>
            {engagements.map((e: any) => {
              const client = state.clients.find((c: any) => c.id === e.client_id);
              return <SelectItem key={e.id} value={e.id}>{client?.name} — {e.fiscal_year}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="findings" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="entries" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entries ({entries.length})</TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Risk Matrix ({risks.length})</TabsTrigger>
        </TabsList>

        {/* FINDINGS TAB */}
        <TabsContent value="findings" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={showAddFinding} onOpenChange={setShowAddFinding}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Finding</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">New Audit Finding</DialogTitle></DialogHeader>
                <FindingForm engagements={engagements} clients={state.clients} onSave={async (f: any) => { await addItem('auditFindings', f); setShowAddFinding(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          {findings.length === 0 ? (
            <div className="glass-card rounded-lg p-10 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground font-medium">No findings recorded</p>
              <p className="text-sm text-muted-foreground">Add audit findings as they are identified during fieldwork</p>
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((f: any) => {
                const eng = engagements.find((e: any) => e.id === f.engagement_id);
                const client = state.clients.find((c: any) => c.id === eng?.client_id);
                return (
                  <div key={f.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', riskColors[f.risk_level])}>{f.risk_level}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">{f.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{client?.name} · {f.area} · {f.impact}</p>
                        <p className="text-sm text-foreground/80">{f.description}</p>
                        {f.recommendation && <p className="text-xs text-muted-foreground mt-2"><span className="text-primary">Recommendation:</span> {f.recommendation}</p>}
                        {f.management_response && <p className="text-xs text-muted-foreground mt-1"><span className="text-info">Mgmt Response:</span> {f.management_response}</p>}
                      </div>
                      <button onClick={() => deleteItem('auditFindings', f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ADJUSTING ENTRIES TAB */}
        <TabsContent value="entries" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Entry</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">New Adjusting Entry</DialogTitle></DialogHeader>
                <EntryForm engagements={engagements} clients={state.clients} onSave={async (e: any) => { await addItem('adjustingEntries', e); setShowAddEntry(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          {entries.length === 0 ? (
            <div className="glass-card rounded-lg p-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground font-medium">No adjusting entries</p>
              <p className="text-sm text-muted-foreground">Record proposed adjusting, reclassifying, or correcting entries</p>
            </div>
          ) : (
            <div className="glass-card rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['#', 'Date', 'Description', 'Debit', 'Credit', 'Amount', 'Type', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2 stat-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-3 py-2 text-xs data-cell text-foreground">{e.entry_number}</td>
                      <td className="px-3 py-2 text-xs data-cell text-muted-foreground">{e.date}</td>
                      <td className="px-3 py-2 text-sm text-foreground">{e.description}</td>
                      <td className="px-3 py-2 text-xs data-cell text-foreground">{e.debit_account}</td>
                      <td className="px-3 py-2 text-xs data-cell text-foreground">{e.credit_account}</td>
                      <td className="px-3 py-2 text-sm data-cell text-foreground">₨{Number(e.amount).toLocaleString()}</td>
                      <td className="px-3 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">{e.type}</span></td>
                      <td className="px-3 py-2"><span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize',
                        e.status === 'approved' ? 'bg-success/15 text-success' :
                        e.status === 'posted' ? 'bg-primary/15 text-primary' :
                        e.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                        'bg-warning/15 text-warning'
                      )}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 border-t border-border flex justify-end">
                <span className="stat-label mr-3">Total Adjustments:</span>
                <span className="data-cell text-sm font-semibold text-foreground">₨{entries.reduce((s: number, e: any) => s + Number(e.amount), 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* RISK MATRIX TAB */}
        <TabsContent value="risk" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={showAddRisk} onOpenChange={setShowAddRisk}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Risk Area</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">Risk Assessment</DialogTitle></DialogHeader>
                <RiskForm engagements={engagements} clients={state.clients} onSave={async (r: any) => { await addItem('riskAssessments', r); setShowAddRisk(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          {risks.length === 0 ? (
            <div className="glass-card rounded-lg p-10 text-center">
              <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground font-medium">No risk assessments</p>
              <p className="text-sm text-muted-foreground">Define risk areas with inherent, control, and detection risk scores</p>
            </div>
          ) : (
            <div className="glass-card rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Area', 'Inherent', 'Control', 'Detection', 'Score', 'Overall', 'Controls', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 stat-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {risks.map((r: any) => {
                    const score = r.inherent_risk * r.control_risk;
                    return (
                      <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-3 py-2 text-sm text-foreground font-medium">{r.area}</td>
                        <td className="px-3 py-2 data-cell text-sm text-center">{r.inherent_risk}</td>
                        <td className="px-3 py-2 data-cell text-sm text-center">{r.control_risk}</td>
                        <td className="px-3 py-2 data-cell text-sm text-center">{r.detection_risk}</td>
                        <td className={cn('px-3 py-2 data-cell text-sm font-semibold text-center', riskScoreColor(score))}>{score}</td>
                        <td className="px-3 py-2"><span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', riskColors[r.overall_risk])}>{r.overall_risk}</span></td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{r.mitigating_controls}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => deleteItem('riskAssessments', r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- FORMS ---

function FindingForm({ engagements, clients, onSave }: any) {
  const [form, setForm] = useState<any>({
    engagement_id: '', title: '', description: '', area: '', risk_level: 'medium',
    impact: 'financial', status: 'identified', recommendation: '', management_response: '', assigned_to: '',
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div>
        <Label className="text-xs">Engagement *</Label>
        <Select value={form.engagement_id} onValueChange={v => setForm((f: any) => ({ ...f, engagement_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{engagements.map((e: any) => { const c = clients.find((c: any) => c.id === e.client_id); return <SelectItem key={e.id} value={e.id}>{c?.name} — {e.fiscal_year}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Title *</Label><Input required value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Area</Label><Input value={form.area} onChange={e => setForm((f: any) => ({ ...f, area: e.target.value }))} placeholder="e.g. Revenue, Inventory" className="h-9" /></div>
      </div>
      <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Risk</Label><Select value={form.risk_level} onValueChange={v => setForm((f: any) => ({ ...f, risk_level: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{['low','medium','high','critical'].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Impact</Label><Select value={form.impact} onValueChange={v => setForm((f: any) => ({ ...f, impact: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{['financial','compliance','operational','reputational'].map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Status</Label><Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{['identified','discussed','resolved','reported'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs">Recommendation</Label><Textarea value={form.recommendation} onChange={e => setForm((f: any) => ({ ...f, recommendation: e.target.value }))} rows={2} /></div>
      <Button type="submit" className="w-full">Add Finding</Button>
    </form>
  );
}

function EntryForm({ engagements, clients, onSave }: any) {
  const [form, setForm] = useState<any>({
    engagement_id: '', entry_number: 'AJE-001', date: new Date().toISOString().split('T')[0],
    description: '', debit_account: '', credit_account: '', amount: 0,
    type: 'adjusting', status: 'proposed', prepared_by: '', reviewed_by: '',
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div>
        <Label className="text-xs">Engagement *</Label>
        <Select value={form.engagement_id} onValueChange={v => setForm((f: any) => ({ ...f, engagement_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{engagements.map((e: any) => { const c = clients.find((c: any) => c.id === e.client_id); return <SelectItem key={e.id} value={e.id}>{c?.name} — {e.fiscal_year}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Entry #</Label><Input value={form.entry_number} onChange={e => setForm((f: any) => ({ ...f, entry_number: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={v => setForm((f: any) => ({ ...f, type: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{['adjusting','reclassifying','correcting'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs">Description *</Label><Input required value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="h-9" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Debit Account</Label><Input value={form.debit_account} onChange={e => setForm((f: any) => ({ ...f, debit_account: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Credit Account</Label><Input value={form.credit_account} onChange={e => setForm((f: any) => ({ ...f, credit_account: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Amount (₨)</Label><Input type="number" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: +e.target.value }))} className="h-9" /></div>
      </div>
      <Button type="submit" className="w-full">Add Entry</Button>
    </form>
  );
}

function RiskForm({ engagements, clients, onSave }: any) {
  const [form, setForm] = useState<any>({
    engagement_id: '', area: '', inherent_risk: 3, control_risk: 3, detection_risk: 3,
    mitigating_controls: '', audit_procedures: '', notes: '',
  });
  const overallRisk = computeOverallRisk(form.inherent_risk, form.control_risk);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, overall_risk: overallRisk }); }} className="space-y-3">
      <div>
        <Label className="text-xs">Engagement *</Label>
        <Select value={form.engagement_id} onValueChange={v => setForm((f: any) => ({ ...f, engagement_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{engagements.map((e: any) => { const c = clients.find((c: any) => c.id === e.client_id); return <SelectItem key={e.id} value={e.id}>{c?.name} — {e.fiscal_year}</SelectItem>; })}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Risk Area *</Label><Input required value={form.area} onChange={e => setForm((f: any) => ({ ...f, area: e.target.value }))} placeholder="e.g. Revenue Recognition, Cash & Bank" className="h-9" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Inherent Risk (1-5)</Label>
          <Select value={String(form.inherent_risk)} onValueChange={v => setForm((f: any) => ({ ...f, inherent_risk: +v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Control Risk (1-5)</Label>
          <Select value={String(form.control_risk)} onValueChange={v => setForm((f: any) => ({ ...f, control_risk: +v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Detection Risk (1-5)</Label>
          <Select value={String(form.detection_risk)} onValueChange={v => setForm((f: any) => ({ ...f, detection_risk: +v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="glass-card rounded-md p-3 flex items-center justify-between">
        <span className="stat-label">Combined Risk Score</span>
        <div className="flex items-center gap-2">
          <span className={cn('data-cell text-lg font-bold', riskScoreColor(form.inherent_risk * form.control_risk))}>{form.inherent_risk * form.control_risk}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium capitalize', riskColors[overallRisk])}>{overallRisk}</span>
        </div>
      </div>
      <div><Label className="text-xs">Mitigating Controls</Label><Textarea value={form.mitigating_controls} onChange={e => setForm((f: any) => ({ ...f, mitigating_controls: e.target.value }))} rows={2} /></div>
      <div><Label className="text-xs">Audit Procedures</Label><Textarea value={form.audit_procedures} onChange={e => setForm((f: any) => ({ ...f, audit_procedures: e.target.value }))} rows={2} /></div>
      <Button type="submit" className="w-full">Add Risk Assessment</Button>
    </form>
  );
}
