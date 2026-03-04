import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StopwatchTimer } from '@/components/StopwatchTimer';

export default function TimeBilling() {
  const { state, addItem } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const totalHours = state.timeEntries.reduce((s: number, t: any) => s + Number(t.hours), 0);
  const billableHours = state.timeEntries.filter((t: any) => t.billable).reduce((s: number, t: any) => s + Number(t.hours), 0);
  const billableAmount = state.timeEntries.filter((t: any) => t.billable).reduce((s: number, t: any) => s + Number(t.hours) * Number(t.rate), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Time & Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Track billable hours and generate invoices</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Log Time</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Log Time Entry</DialogTitle></DialogHeader>
            <TimeEntryForm clients={state.clients} team={state.team} onSave={async (entry: any) => {
              await addItem('timeEntries', entry);
              setShowAdd(false);
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stopwatch */}
        <div className="md:col-span-1">
          <StopwatchTimer />
        </div>

        {/* Stats + Entries */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-lg p-4">
              <p className="stat-label">Total Hours</p>
              <p className="stat-value">{totalHours.toFixed(1)}</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <p className="stat-label">Billable Hours</p>
              <p className="stat-value">{billableHours.toFixed(1)}</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <p className="stat-label">Billable Amount</p>
              <p className="stat-value">₨{billableAmount.toLocaleString()}</p>
            </div>
          </div>

          {state.timeEntries.length === 0 ? (
            <div className="glass-card rounded-lg p-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No time entries yet</p>
              <p className="text-sm text-muted-foreground mt-1">Use the stopwatch or log time manually</p>
            </div>
          ) : (
            <div className="glass-card rounded-lg divide-y divide-border">
              {[...state.timeEntries].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')).map((entry: any) => {
                const client = state.clients.find((c: any) => c.id === entry.client_id);
                const staff = state.team.find((t: any) => t.id === entry.staff_id);
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{client?.name}</p>
                      <p className="text-xs text-muted-foreground">{staff?.name} · {entry.description}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded font-medium',
                      entry.billable ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                    )}>{entry.billable ? 'Billable' : 'Non-billable'}</span>
                    <span className="data-cell text-sm text-foreground">{entry.hours}h</span>
                    <span className="data-cell text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeEntryForm({ clients, team, onSave }: { clients: any[]; team: any[]; onSave: (e: any) => void }) {
  const [form, setForm] = useState({
    client_id: '', staff_id: '', date: new Date().toISOString().split('T')[0],
    hours: 1, description: '', billable: true, rate: 2000,
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div>
        <Label className="text-xs">Client *</Label>
        <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.filter((c: any) => c.status === 'active').map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Staff *</Label>
        <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select staff" /></SelectTrigger>
          <SelectContent>{team.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Hours</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: +e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Rate (₨/hr)</Label><Input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: +e.target.value }))} className="h-9" /></div>
      </div>
      <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9" /></div>
      <Button type="submit" className="w-full">Log Entry</Button>
    </form>
  );
}
