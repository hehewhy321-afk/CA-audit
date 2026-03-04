import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Plus, Send, MessageCircle, Trash2, ExternalLink, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categoryColors: Record<string, string> = {
  deadline_reminder: 'bg-warning/15 text-warning', document_request: 'bg-info/15 text-info',
  payment_reminder: 'bg-destructive/15 text-destructive', general: 'bg-secondary text-secondary-foreground',
  meeting: 'bg-success/15 text-success',
};

function resolveTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  return result;
}

export default function WhatsAppAlerts() {
  const { state, addItem, deleteItem } = useApp();
  const [showSend, setShowSend] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">WhatsApp Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Send reminders via wa.me deep links</p>
        </div>
        <Dialog open={showSend} onOpenChange={setShowSend}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Send className="h-3.5 w-3.5" />Send Alert</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Send WhatsApp Alert</DialogTitle></DialogHeader>
            <SendAlertForm templates={state.whatsappTemplates} clients={state.clients} onSave={async (a) => { await addItem('whatsappAlerts', a); setShowSend(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="quick-send">
        <TabsList className="bg-muted">
          <TabsTrigger value="quick-send">Quick Send</TabsTrigger>
          <TabsTrigger value="templates">Templates ({state.whatsappTemplates.length})</TabsTrigger>
          <TabsTrigger value="history">History ({state.whatsappAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-send" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.deadlines.filter((d: any) => !d.completed).sort((a: any, b: any) => (a.due_date || '').localeCompare(b.due_date || '')).slice(0, 6).map((d: any) => {
              const client = d.client_id ? state.clients.find((c: any) => c.id === d.client_id) : null;
              const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
              const targets = client ? [client] : state.clients.filter((c: any) => c.status === 'active');
              return (
                <div key={d.id} className="glass-card rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.authority} · {d.due_date}</p>
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                      daysLeft < 0 ? 'bg-destructive/15 text-destructive' : daysLeft <= 7 ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info'
                    )}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {targets.slice(0, 3).map((t: any) => (
                      <a key={t.id} href={`https://wa.me/977${(t.phone || '').replace(/^0+/, '')}?text=${encodeURIComponent(`Namaste ${t.contact_person}, reminder: ${d.title} is due on ${d.due_date}.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-success/10 text-success hover:bg-success/20">
                        <MessageCircle className="h-3 w-3" />{(t.contact_person || '').split(' ')[0]}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-3 space-y-3">
          <div className="flex justify-end">
            <Dialog open={showAddTemplate} onOpenChange={setShowAddTemplate}>
              <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Template</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">New Template</DialogTitle></DialogHeader>
                <TemplateForm onSave={async t => { await addItem('whatsappTemplates', t); setShowAddTemplate(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.whatsappTemplates.map((t: any) => (
              <div key={t.id} className="glass-card rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{t.name}</h3>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium capitalize', categoryColors[t.category] || '')}>{(t.category || '').replace(/_/g, ' ')}</span>
                  </div>
                  <button onClick={() => deleteItem('whatsappTemplates', t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">{t.template}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          {state.whatsappAlerts.length === 0 ? (
            <div className="glass-card rounded-lg p-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground font-medium">No alerts sent yet</p>
            </div>
          ) : (
            <div className="glass-card rounded-lg divide-y divide-border">
              {state.whatsappAlerts.map((a: any) => {
                const client = state.clients.find((c: any) => c.id === a.client_id);
                return (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <MessageCircle className={cn('h-4 w-4 shrink-0', a.sent ? 'text-success' : 'text-warning')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{client?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', a.sent ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>{a.sent ? 'Sent' : 'Scheduled'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SendAlertForm({ templates, clients, onSave }: any) {
  const [templateId, setTemplateId] = useState('');
  const [clientId, setClientId] = useState('');
  const [message, setMessage] = useState('');
  const template = templates.find((t: any) => t.id === templateId);
  const client = clients.find((c: any) => c.id === clientId);

  const applyTemplate = () => {
    if (!template || !client) return;
    setMessage(resolveTemplate(template.template, { clientName: client.contact_person || client.name, firmName: 'AuditPro Nepal' }));
  };

  const waLink = client ? `https://wa.me/977${(client.phone || '').replace(/^0+/, '')}?text=${encodeURIComponent(message)}` : '';

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Template</Label>
        <Select value={templateId} onValueChange={setTemplateId}><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{templates.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
      </div>
      <div><Label className="text-xs">Client *</Label>
        <Select value={clientId} onValueChange={setClientId}><SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{clients.filter((c: any) => c.status === 'active').map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
      </div>
      {template && client && <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>Apply Template</Button>}
      <div><Label className="text-xs">Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="font-mono text-xs" /></div>
      <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => {
        if (client) onSave({ template_id: templateId || null, client_id: clientId, scheduled_date: new Date().toISOString().split('T')[0], sent: true, sent_at: new Date().toISOString(), message });
      }} className={cn('flex items-center justify-center gap-2 rounded-md h-9 text-sm font-medium transition-colors w-full',
        client && message ? 'bg-success text-success-foreground hover:bg-success/90' : 'bg-muted text-muted-foreground pointer-events-none')}>
        <ExternalLink className="h-3.5 w-3.5" />Open in WhatsApp
      </a>
    </div>
  );
}

function TemplateForm({ onSave }: { onSave: (t: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', category: 'general', template: '', variables: '' });
  const [loading, setLoading] = useState(false);
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSave({ ...form, variables: form.variables.split(',').map(v => v.trim()).filter(Boolean) }); setLoading(false); }} className="space-y-3">
      <div><Label className="text-xs">Name *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" /></div>
      <div><Label className="text-xs">Category</Label>
        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{['deadline_reminder', 'document_request', 'payment_reminder', 'general', 'meeting'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Template Text</Label><Textarea value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} rows={3} placeholder="Use {{variableName}}" className="font-mono text-xs" /></div>
      <div><Label className="text-xs">Variables (comma-separated)</Label><Input value={form.variables} onChange={e => setForm(f => ({ ...f, variables: e.target.value }))} className="h-9" /></div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Template'}</Button>
    </form>
  );
}
