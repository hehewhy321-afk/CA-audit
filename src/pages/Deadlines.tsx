import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Check, Plus, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const priorityColors: Record<string, string> = {
  urgent: 'border-l-destructive bg-destructive/5',
  high: 'border-l-warning bg-warning/5',
  medium: 'border-l-info bg-info/5',
  low: 'border-l-muted-foreground',
};

export default function Deadlines() {
  const { state, addItem, updateItem } = useApp();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkWA, setShowBulkWA] = useState(false);

  const pending = state.deadlines.filter((d: any) => !d.completed).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date));
  const completed = state.deadlines.filter((d: any) => d.completed);

  const toggleComplete = (d: any) => {
    updateItem('deadlines', d.id, { completed: !d.completed, completed_at: d.completed ? null : new Date().toISOString() });
  };

  // Build bulk WA messages for all active clients x upcoming deadlines
  const bulkMessages = (() => {
    const firmName = state.caSettings?.firm_name || 'Our Firm';
    const messages: { clientName: string; phone: string; deadline: string; daysLeft: number; waUrl: string }[] = [];
    state.clients
      .filter((c: any) => c.status === 'active' && c.phone)
      .forEach((client: any) => {
        pending.slice(0, 3).forEach((d: any) => {
          const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
          if (daysLeft <= 30) {
            const phone = (client.phone || '').replace(/[^0-9]/g, '');
            const msg = encodeURIComponent(
              `Dear ${client.contact_person || client.name},\n\n⚠️ Compliance Reminder from ${firmName}:\n\n📋 ${d.title}\n📅 Due: ${d.due_date}\n${daysLeft < 0 ? `⛔ OVERDUE by ${Math.abs(daysLeft)} days` : `⏳ ${daysLeft} days remaining`}\n\nPlease ensure timely compliance to avoid penalties.\n\nBest regards,\n${firmName}`
            );
            messages.push({
              clientName: client.name,
              phone: client.phone,
              deadline: d.title,
              daysLeft,
              waUrl: `https://wa.me/977${phone}?text=${msg}`,
            });
          }
        });
      });
    return messages;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Deadlines & Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">{pending.length} pending · {completed.length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-success border-success/30 hover:bg-success/10"
            onClick={() => setShowBulkWA(true)}>
            <Send className="h-3.5 w-3.5" /> Send All Reminders
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Deadline</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Add Deadline</DialogTitle></DialogHeader>
              <AddDeadlineForm onSave={async (d) => { await addItem('deadlines', d); setShowAdd(false); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk WA Modal */}
      {showBulkWA && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-heading font-semibold text-foreground">Bulk WhatsApp Reminders</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{bulkMessages.length} messages ready to send</p>
              </div>
              <button onClick={() => setShowBulkWA(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {bulkMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines within 30 days for active clients with phone numbers.</p>
              ) : bulkMessages.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-accent/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.deadline}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={cn('text-xs data-cell', m.daysLeft < 0 ? 'text-destructive' : m.daysLeft <= 7 ? 'text-warning' : 'text-muted-foreground')}>
                      {m.daysLeft < 0 ? `${Math.abs(m.daysLeft)}d late` : `${m.daysLeft}d`}
                    </span>
                    <a href={m.waUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-success/10 text-success hover:bg-success/20 px-2 py-1 rounded transition-colors">
                      <MessageCircle className="h-3 w-3" /> Send
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex gap-2">
              <Button className="flex-1 gap-1.5" size="sm"
                onClick={() => {
                  bulkMessages.forEach((m, i) => setTimeout(() => window.open(m.waUrl, '_blank'), i * 800));
                  toast.success(`Opening ${bulkMessages.length} WhatsApp messages...`);
                  setShowBulkWA(false);
                }}
                disabled={bulkMessages.length === 0}>
                <Send className="h-3.5 w-3.5" /> Send All ({bulkMessages.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulkWA(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {pending.map((d: any) => {
          const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
          const isOverdue = daysLeft < 0;
          return (
            <div key={d.id} className={cn('glass-card rounded-lg border-l-4 px-4 py-3 flex items-center gap-3', priorityColors[d.priority] || '')}>
              <button onClick={() => toggleComplete(d)} className="h-5 w-5 rounded border border-border flex items-center justify-center shrink-0 hover:border-primary transition-colors">
                {d.completed && <Check className="h-3 w-3 text-primary" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.description}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">{d.authority}</span>
              {/* WA Reminder Button */}
              {d.client_id && (() => {
                const client = state.clients.find((c: any) => c.id === d.client_id);
                return client?.phone ? (
                  <button onClick={() => {
                    const phone = (client.phone || '').replace(/[^0-9]/g, '');
                    const firmName = state.caSettings?.firm_name || 'Our Firm';
                    const msg = encodeURIComponent(
                      `Dear ${client.contact_person || client.name},\n\n⚠️ Compliance Reminder:\n\n${d.title}\nDue: ${d.due_date}\n${daysLeft < 0 ? `⛔ Overdue by ${Math.abs(daysLeft)} days` : `📅 ${daysLeft} days remaining`}\n\nPlease take necessary action to avoid penalties.\n\nRegards,\n${firmName}`
                    );
                    window.open(`https://wa.me/977${phone}?text=${msg}`, '_blank');
                  }} className="text-success hover:text-success/80 shrink-0" title="Send WA Reminder">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                ) : null;
              })()}
              <div className="text-right shrink-0">
                <p className="text-sm data-cell text-foreground">{d.due_date}</p>
                <p className={cn('text-xs data-cell', isOverdue ? 'text-destructive' : daysLeft <= 7 ? 'text-warning' : 'text-muted-foreground')}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div>
          <button onClick={() => setShowCompleted(!showCompleted)} className="text-sm text-muted-foreground hover:text-foreground">
            {showCompleted ? 'Hide' : 'Show'} {completed.length} completed
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completed.map((d: any) => (
                <div key={d.id} className="glass-card rounded-lg px-4 py-2 flex items-center gap-3 opacity-60">
                  <button onClick={() => toggleComplete(d)} className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </button>
                  <p className="text-sm text-foreground line-through flex-1">{d.title}</p>
                  <span className="text-xs data-cell text-muted-foreground">{d.authority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddDeadlineForm({ onSave }: { onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({
    title: '', description: '', authority: 'IRD',
    due_date: '', reminder_days: 5, priority: 'high', recurring: false,
  });
  const [loading, setLoading] = useState(false);

  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSave(form); setLoading(false); }} className="space-y-3">
      <div><Label className="text-xs">Title *</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9" /></div>
      <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Authority</Label>
          <Select value={form.authority} onValueChange={v => setForm(f => ({ ...f, authority: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{['IRD', 'OCR', 'NRB', 'SEBON', 'Custom'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Due Date *</Label><Input type="date" required value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Reminder (days)</Label><Input type="number" value={form.reminder_days} onChange={e => setForm(f => ({ ...f, reminder_days: +e.target.value }))} className="h-9" /></div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Adding...' : 'Add Deadline'}</Button>
    </form>
  );
}
