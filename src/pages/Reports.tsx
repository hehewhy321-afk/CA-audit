import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { FileOutput, Plus, Trash2, Copy, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToText } from '@/lib/export-utils';

const reportTemplates: Record<string, { name: string; template: string }> = {
  audit_report: { name: "Independent Auditor's Report", template: "INDEPENDENT AUDITOR'S REPORT\n\nTo the Shareholders of {{clientName}}\n\nOpinion\nWe have audited the financial statements of {{clientName}}...\n\n{{firmName}}\nChartered Accountants\n\n{{partnerName}}\nDate: {{reportDate}}" },
  management_letter: { name: 'Management Letter', template: "MANAGEMENT LETTER\n\nTo the Board of Directors\n{{clientName}}\n\nObservations:\n{{findings}}\n\n{{firmName}}\n{{partnerName}}" },
  tax_computation: { name: 'Tax Computation', template: "TAX COMPUTATION STATEMENT\nClient: {{clientName}}\nPAN: {{panNumber}}\n\nTaxable Income: {{taxableIncome}}\nTax Payable: {{taxPayable}}\n\nPrepared by: {{partnerName}}\n{{firmName}}" },
};

const statusColors: Record<string, string> = { draft: 'bg-warning/15 text-warning', review: 'bg-info/15 text-info', final: 'bg-success/15 text-success' };

export default function Reports() {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const [showGen, setShowGen] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Report Generator</h1><p className="text-sm text-muted-foreground mt-1">{state.reports.length} reports</p></div>
        <Dialog open={showGen} onOpenChange={setShowGen}><DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Generate</Button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Generate Report</DialogTitle></DialogHeader>
            <GenForm clients={state.clients} engagements={state.engagements} findings={state.auditFindings} onSave={async r => { await addItem('reports', r); setShowGen(false); }} /></DialogContent></Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(reportTemplates).map(([key, t]) => (
          <div key={key} className="glass-card rounded-lg p-4 hover:glow-gold transition-shadow cursor-pointer" onClick={() => setShowGen(true)}>
            <FileOutput className="h-6 w-6 text-primary mb-2" /><h3 className="text-sm font-medium text-foreground">{t.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-2 data-cell">{state.reports.filter((r: any) => r.type === key).length} generated</p>
          </div>
        ))}
      </div>
      {state.reports.length > 0 && (
        <div className="glass-card rounded-lg divide-y divide-border">
          {state.reports.map((r: any) => {
            const client = state.clients.find((c: any) => c.id === r.client_id);
            return (<div key={r.id} className="px-4 py-3 flex items-center gap-3">
              <FileOutput className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{r.title}</p><p className="text-xs text-muted-foreground">{client?.name}</p></div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', statusColors[r.status])}>{r.status}</span>
              <div className="flex gap-1">
                <button onClick={() => setViewReport(r)} className="p-1 text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></button>
                <button onClick={() => exportToText(r.content, r.title)} className="p-1 text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteItem('reports', r.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>);
          })}
        </div>
      )}
      {viewReport && (<Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}><DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{viewReport.title}</DialogTitle></DialogHeader><pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90 bg-muted rounded-lg p-4">{viewReport.content}</pre></DialogContent></Dialog>)}
    </div>
  );
}

function GenForm({ clients, engagements, findings, onSave }: any) {
  const [type, setType] = useState('audit_report');
  const [clientId, setClientId] = useState('');
  const [vars, setVars] = useState({ firmName: '', partnerName: '', reportDate: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const client = clients.find((c: any) => c.id === clientId);
  const clientFindings = findings.filter((f: any) => { const eng = engagements.find((e: any) => e.client_id === clientId); return eng && f.engagement_id === eng.id; });

  const generate = async () => {
    setLoading(true);
    let content = reportTemplates[type].template;
    const allVars: Record<string, string> = { ...vars, clientName: client?.name || '___', panNumber: client?.pan_number || '___', findings: clientFindings.map((f: any, i: number) => `${i+1}. ${f.title}: ${f.description}`).join('\n') || 'None', taxableIncome: '___', taxPayable: '___' };
    for (const [k, v] of Object.entries(allVars)) content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    await onSave({ type, client_id: clientId, title: `${reportTemplates[type].name} — ${client?.name || 'Draft'}`, content, status: 'draft', generated_by: vars.partnerName || 'System' });
    setLoading(false);
  };

  return (<div className="space-y-3">
    <div><Label className="text-xs">Type</Label><Select value={type} onValueChange={setType}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(reportTemplates).map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}</SelectContent></Select></div>
    <div><Label className="text-xs">Client *</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{clients.filter((c: any) => c.status === 'active').map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Firm Name</Label><Input value={vars.firmName} onChange={e => setVars(v => ({ ...v, firmName: e.target.value }))} className="h-9" /></div><div><Label className="text-xs">Partner</Label><Input value={vars.partnerName} onChange={e => setVars(v => ({ ...v, partnerName: e.target.value }))} className="h-9" /></div></div>
    <Button onClick={generate} className="w-full" disabled={loading || !clientId}>{loading ? 'Generating...' : 'Generate Report'}</Button>
  </div>);
}
