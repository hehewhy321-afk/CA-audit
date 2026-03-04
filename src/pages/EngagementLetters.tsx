import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Plus, FileSignature, Trash2, Eye, Send, Pen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: Clock, color: 'text-warning', bg: 'bg-warning/15' },
  sent: { icon: Send, color: 'text-info', bg: 'bg-info/15' },
  signed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/15' },
  expired: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/15' },
};

export default function EngagementLetters() {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [viewLetter, setViewLetter] = useState<any>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Engagement Letters</h1><p className="text-sm text-muted-foreground mt-1">{state.engagementLetters.length} letters</p></div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />New Letter</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Letter</DialogTitle></DialogHeader>
            <LetterForm clients={state.clients} onSave={async l => { await addItem('engagementLetters', l); setShowCreate(false); }} /></DialogContent></Dialog>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {['draft','sent','signed','expired'].map(status => {
          const cfg = statusConfig[status]; const Icon = cfg.icon;
          const count = state.engagementLetters.filter((l: any) => l.status === status).length;
          return (<div key={status} className="glass-card rounded-lg p-3 flex items-center gap-3"><div className={cn('h-8 w-8 rounded-md flex items-center justify-center', cfg.bg)}><Icon className={cn('h-4 w-4', cfg.color)} /></div><div><p className="stat-value text-lg">{count}</p><p className="stat-label capitalize">{status}</p></div></div>);
        })}
      </div>
      {state.engagementLetters.length > 0 && (
        <div className="glass-card rounded-lg divide-y divide-border">
          {state.engagementLetters.map((letter: any) => {
            const client = state.clients.find((c: any) => c.id === letter.client_id);
            const cfg = statusConfig[letter.status] || statusConfig.draft; const Icon = cfg.icon;
            return (<div key={letter.id} className="px-4 py-3 flex items-center gap-3">
              <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{letter.template_name} — {client?.name}</p><p className="text-xs text-muted-foreground">Valid until: {letter.valid_until}</p></div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', cfg.bg, cfg.color)}>{letter.status}</span>
              <div className="flex gap-1">
                <button onClick={() => setViewLetter(letter)} className="p-1 text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></button>
                <button onClick={() => {
                  const next = letter.status === 'draft' ? 'sent' : letter.status === 'sent' ? 'signed' : letter.status;
                  updateItem('engagementLetters', letter.id, { status: next, ...(letter.status === 'draft' ? { sent_date: new Date().toISOString().split('T')[0] } : {}), ...(letter.status === 'sent' ? { signed_date: new Date().toISOString().split('T')[0] } : {}) });
                }} className="p-1 text-muted-foreground hover:text-success"><Send className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteItem('engagementLetters', letter.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>);
          })}
        </div>
      )}
      {viewLetter && (<Dialog open={!!viewLetter} onOpenChange={() => setViewLetter(null)}><DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{viewLetter.template_name}</DialogTitle></DialogHeader><pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90 bg-muted rounded-lg p-4">{viewLetter.content}</pre></DialogContent></Dialog>)}
    </div>
  );
}

function LetterForm({ clients, onSave }: { clients: any[]; onSave: (l: any) => Promise<void> }) {
  const [clientId, setClientId] = useState('');
  const [vars, setVars] = useState({ firmName: '', firmSignatory: '', auditFee: '150000', signatoryName: '', signatoryDesignation: '', validUntil: '' });
  const [loading, setLoading] = useState(false);
  const client = clients.find((c: any) => c.id === clientId);

  return (<form onSubmit={async e => { e.preventDefault(); setLoading(true);
    const content = `ENGAGEMENT LETTER\n\nTo: ${client?.contact_person || '___'}\n${client?.name || '___'}\n\nRE: Statutory Audit — FY 2081/82\n\nFee: NPR ${vars.auditFee}\n\n${vars.firmName}\n${vars.firmSignatory}\n\nACCEPTED:\n${vars.signatoryName}\n${vars.signatoryDesignation}`;
    await onSave({ client_id: clientId, template_name: 'Statutory Audit', content, status: 'draft', signatory_name: vars.signatoryName, signatory_designation: vars.signatoryDesignation, firm_signatory: vars.firmSignatory, valid_until: vars.validUntil || new Date(Date.now() + 365*86400000).toISOString().split('T')[0] });
    setLoading(false);
  }} className="space-y-3">
    <div><Label className="text-xs">Client *</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{clients.filter((c: any) => c.status === 'active').map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Firm Name</Label><Input value={vars.firmName} onChange={e => setVars(v => ({ ...v, firmName: e.target.value }))} className="h-9" /></div><div><Label className="text-xs">Firm Signatory</Label><Input value={vars.firmSignatory} onChange={e => setVars(v => ({ ...v, firmSignatory: e.target.value }))} className="h-9" /></div></div>
    <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Client Signatory</Label><Input value={vars.signatoryName} onChange={e => setVars(v => ({ ...v, signatoryName: e.target.value }))} className="h-9" /></div><div><Label className="text-xs">Designation</Label><Input value={vars.signatoryDesignation} onChange={e => setVars(v => ({ ...v, signatoryDesignation: e.target.value }))} className="h-9" /></div></div>
    <div><Label className="text-xs">Fee (₨)</Label><Input value={vars.auditFee} onChange={e => setVars(v => ({ ...v, auditFee: e.target.value }))} className="h-9" /></div>
    <Button type="submit" className="w-full" disabled={loading || !clientId}>{loading ? 'Creating...' : 'Create Letter'}</Button>
  </form>);
}
