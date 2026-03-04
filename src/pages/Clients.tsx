import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Phone, Mail, Building2, ChevronRight, X, MessageSquare, Send, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const entityLabels: Record<string, string> = {
  private_limited: 'Pvt. Ltd.', public_limited: 'Public Ltd.', ngo: 'NGO', ingo: 'INGO',
  cooperative: 'Cooperative', partnership: 'Partnership', proprietorship: 'Proprietorship',
  trust: 'Trust', government: 'Government',
};

const riskColors: Record<string, string> = {
  low: 'text-success', medium: 'text-warning', high: 'text-destructive', critical: 'text-destructive',
};

export default function Clients() {
  const { state, addItem, updateItem } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Auto-calculate health scores
  const computeHealthScore = (client: any): number => {
    // Document completion (30%)
    const clientDocs = state.documents.filter((d: any) => d.client_id === client.id);
    const docsCompleted = clientDocs.filter((d: any) => d.status === 'approved' || d.status === 'reviewed').length;
    const docScore = clientDocs.length > 0 ? (docsCompleted / clientDocs.length) * 100 : 50;

    // Audit progress (25%)
    const clientEngagements = state.engagements.filter((e: any) => e.client_id === client.id);
    const avgProgress = clientEngagements.length > 0
      ? clientEngagements.reduce((s: number, e: any) => s + Number(e.progress), 0) / clientEngagements.length
      : 50;

    // Payment status (25%)
    const clientInvoices = state.invoices.filter((i: any) => i.client_id === client.id);
    const paidInvoices = clientInvoices.filter((i: any) => i.status === 'paid').length;
    const paymentScore = clientInvoices.length > 0 ? (paidInvoices / clientInvoices.length) * 100 : 50;

    // Last activity recency (20%) — based on latest engagement update
    const latestDate = clientEngagements.length > 0
      ? Math.max(...clientEngagements.map((e: any) => new Date(e.updated_at || e.created_at).getTime()))
      : new Date(client.created_at).getTime();
    const daysSinceActivity = (Date.now() - latestDate) / 86400000;
    const activityScore = daysSinceActivity < 7 ? 100 : daysSinceActivity < 30 ? 80 : daysSinceActivity < 90 ? 50 : 20;

    return Math.round(docScore * 0.3 + avgProgress * 0.25 + paymentScore * 0.25 + activityScore * 0.2);
  };

  // Update health scores periodically
  const clientsWithHealth = state.clients.map((c: any) => ({
    ...c,
    health_score: computeHealthScore(c),
  }));

  const filtered = clientsWithHealth.filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.pan_number || '').includes(search)) return false;
    if (filterType !== 'all' && c.entity_type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{clientsWithHealth.length} total · {clientsWithHealth.filter((c: any) => c.status === 'active').length} active</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Add New Client</DialogTitle></DialogHeader>
            <AddClientForm onSave={async (data: any) => {
              await addItem('clients', data);
              setShowAddDialog(false);
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients or PAN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Entity Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(entityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-lg divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No clients found</div>
        ) : filtered.map((client: any) => (
          <div key={client.id} onClick={() => setSelectedClient(client)}
            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors">
            <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize',
                  client.status === 'active' ? 'bg-success/15 text-success' :
                    client.status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-info/15 text-info'
                )}>{client.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">{entityLabels[client.entity_type] || client.entity_type}</span>
                <span className="text-xs data-cell text-muted-foreground">PAN: {client.pan_number}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className={cn('text-xs font-medium capitalize', riskColors[client.risk_level] || '')}>
                {client.risk_level} risk
              </span>
              <span className={cn('text-sm data-cell font-semibold',
                client.health_score >= 80 ? 'text-success' : client.health_score >= 60 ? 'text-warning' : 'text-destructive'
              )}>{client.health_score}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>

      {selectedClient && <ClientDetailPanel client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  );
}

function ClientDetailPanel({ client, onClose }: { client: any; onClose: () => void }) {
  const { state } = useApp();
  const engagements = state.engagements.filter((e: any) => e.client_id === client.id);
  const invoices = state.invoices.filter((i: any) => i.client_id === client.id);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto animate-slide-in">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <h2 className="font-heading font-semibold text-foreground">{client.name}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['PAN', client.pan_number], ['Type', entityLabels[client.entity_type] || client.entity_type],
            ['Industry', client.industry], ['FY End', client.fiscal_year_end],
            ['Contact', client.contact_person], ['Status', client.status],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="stat-label">{label}</p>
              <p className="text-sm text-foreground data-cell capitalize">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-3 w-3" /> {client.phone}
          </a>
          <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-3 w-3" /> {client.email}
          </a>
        </div>

        {/* Vision 2026: Omnichannel Communication */}
        <div className="bg-muted/40 rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Digital Channels</h3>
            <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 justify-start gap-2 bg-success/5 hover:bg-success/10 border-success/20 text-success"
              onClick={() => window.open(`https://wa.me/977${(client.phone || '').replace(/^0+/, '')}`, '_blank')}
            >
              <MessageSquare className="h-3.5 w-3.5 fill-success/10" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 justify-start gap-2 bg-info/5 hover:bg-info/10 border-info/20 text-info"
              onClick={() => window.open(`viber://chat?number=977${(client.phone || '').replace(/^0+/, '')}`, '_blank')}
            >
              <Smartphone className="h-3.5 w-3.5 fill-info/10" /> Viber
            </Button>
          </div>
          <Button
            className="w-full h-9 gap-2 group"
            onClick={() => {
              const text = encodeURIComponent(`Namaste ${client.contact_person || 'Sir/Madam'},\n\nHope you're doing well. This is ${state.caSettings?.firm_name || 'your auditor'} from AuditFlow. We've started the ${client.fiscal_year_end} audit. Could you please upload the following documents:\n1. TB/Bank Statements\n2. VAT Returns\n\nThanks!`);
              window.open(`https://wa.me/977${(client.phone || '').replace(/^0+/, '')}?text=${text}`, '_blank');
            }}
          >
            <Send className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Request Documents
          </Button>
        </div>

        <div className="flex items-center gap-3 py-2 border-y border-border">
          <div className="flex-1 text-center">
            <p className="stat-value text-lg">{client.health_score}</p>
            <p className="stat-label">Health</p>
          </div>
          <div className="flex-1 text-center">
            <p className={cn('text-lg font-semibold capitalize', riskColors[client.risk_level] || '')}>{client.risk_level}</p>
            <p className="stat-label">Risk</p>
          </div>
          <div className="flex-1 text-center">
            <p className="stat-value text-lg">{engagements.length}</p>
            <p className="stat-label">Engagements</p>
          </div>
        </div>

        {engagements.length > 0 && (
          <div>
            <h3 className="stat-label mb-2">Engagements</h3>
            <div className="space-y-2">
              {engagements.map((e: any) => (
                <div key={e.id} className="bg-muted rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{e.fiscal_year}</p>
                    <p className="text-xs text-muted-foreground capitalize">{e.stage}</p>
                  </div>
                  <span className="data-cell text-sm text-foreground">{e.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {invoices.length > 0 && (
          <div>
            <h3 className="stat-label mb-2">Invoices</h3>
            <div className="space-y-2">
              {invoices.map((i: any) => (
                <div key={i.id} className="bg-muted rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm data-cell text-foreground">{i.invoice_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">{i.status}</p>
                  </div>
                  <span className="data-cell text-sm text-foreground">₨{Number(i.total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="stat-label mb-1">WhatsApp</h3>
          <a href={`https://wa.me/977${(client.phone || '').replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-success hover:underline">
            Send Message
          </a>
        </div>
      </div>
    </div>
  );
}

function AddClientForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: '', pan_number: '', entity_type: 'private_limited',
    contact_person: '', phone: '', email: '', address: '',
    fiscal_year_end: 'Ashad', industry: '', notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Client Name *</Label>
          <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">PAN Number</Label>
          <Input value={form.pan_number} onChange={e => setForm(f => ({ ...f, pan_number: e.target.value }))} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Entity Type</Label>
          <Select value={form.entity_type} onValueChange={v => setForm(f => ({ ...f, entity_type: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(entityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Contact Person</Label>
          <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Industry</Label>
          <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="h-9" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Address</Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="h-9" />
        </div>
      </div>
      <Button type="submit" className="w-full">Add Client</Button>
    </form>
  );
}
