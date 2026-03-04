import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { UsersRound, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleLabels: Record<string, string> = {
  partner: 'Partner', manager: 'Manager', senior_auditor: 'Senior Auditor',
  junior_auditor: 'Junior Auditor', article: 'Article Trainee', intern: 'Intern',
};
const roleColors: Record<string, string> = {
  partner: 'bg-primary/15 text-primary', manager: 'bg-success/15 text-success',
  senior_auditor: 'bg-info/15 text-info', junior_auditor: 'bg-warning/15 text-warning',
  article: 'bg-muted text-muted-foreground', intern: 'bg-muted text-muted-foreground',
};

export default function Team() {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">{state.team.length} members · {state.team.filter((t: any) => t.status === 'active').length} active</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Member</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle className="font-heading">Add Team Member</DialogTitle></DialogHeader>
            <TeamMemberForm onSave={async (m) => { await addItem('team', m); setShowAdd(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {state.team.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <UsersRound className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No team members yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your team to assign engagements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.team.map((member: any) => (
            <div key={member.id} className="glass-card rounded-lg p-4 hover:glow-gold transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent-foreground">{member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', roleColors[member.role] || 'bg-muted text-muted-foreground')}>
                    {roleLabels[member.role] || member.role}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(member)} className="text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteItem('team', member.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div><p className="stat-label">Engagements</p><p className="text-sm data-cell text-foreground">{member.active_engagements || 0}</p></div>
                <div><p className="stat-label">Target Hours</p><p className="text-sm data-cell text-foreground">{member.billable_hours_target || 0}</p></div>
              </div>
              <div className="mt-2 flex justify-between">
                <p className="text-xs text-muted-foreground">{member.specialization}</p>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', member.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>{member.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent><DialogHeader><DialogTitle className="font-heading">Edit Team Member</DialogTitle></DialogHeader>
            <TeamMemberForm
              initial={editing}
              onSave={async (m) => { await updateItem('team', editing.id, m); setEditing(null); }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TeamMemberForm({ initial, onSave }: { initial?: any; onSave: (m: any) => Promise<void> }) {
  const [f, setF] = useState({
    name: initial?.name || '', email: initial?.email || '', phone: initial?.phone || '',
    role: initial?.role || 'junior_auditor', specialization: initial?.specialization || '',
    active_engagements: initial?.active_engagements || 0,
    billable_hours_target: initial?.billable_hours_target || 1400,
    status: initial?.status || 'active', join_date: initial?.join_date || new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSave(f); setLoading(false); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Name *</Label><Input required value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Email</Label><Input value={f.email} onChange={e => setF(x => ({ ...x, email: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={e => setF(x => ({ ...x, phone: e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Role</Label>
          <Select value={f.role} onValueChange={v => setF(x => ({ ...x, role: v }))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-xs">Specialization</Label><Input value={f.specialization} onChange={e => setF(x => ({ ...x, specialization: e.target.value }))} className="h-9" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Active Engagements</Label><Input type="number" value={f.active_engagements} onChange={e => setF(x => ({ ...x, active_engagements: +e.target.value }))} className="h-9" /></div>
        <div><Label className="text-xs">Billable Target (hrs)</Label><Input type="number" value={f.billable_hours_target} onChange={e => setF(x => ({ ...x, billable_hours_target: +e.target.value }))} className="h-9" /></div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : initial ? 'Update Member' : 'Add Member'}</Button>
    </form>
  );
}
