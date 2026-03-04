import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Check, Plus, ChevronRight, X, AlertCircle, Shield, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const stageOrder = ['planning', 'fieldwork', 'review', 'reporting', 'completed'];
const stageColors: Record<string, string> = {
  planning: 'bg-info/20 text-info',
  fieldwork: 'bg-warning/20 text-warning',
  review: 'bg-primary/20 text-primary',
  reporting: 'bg-success/20 text-success',
  completed: 'bg-muted text-muted-foreground',
};

const checklistCategories = [
  'Financial Statements', 'Bank', 'Tax', 'Assets', 'HR', 'Corporate', 'Registration', 'Legal', 'Liabilities', 'Other'
];

interface Props {
  engagement: any;
  onClose: () => void;
}

export function EngagementDetail({ engagement, onClose }: Props) {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const [showAddItem, setShowAddItem] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  const client = state.clients.find((c: any) => c.id === engagement.client_id);
  const checklists = state.checklists.filter((c: any) => c.engagement_id === engagement.id);
  const findings = state.auditFindings.filter((f: any) => f.engagement_id === engagement.id);
  const documents = state.documents.filter((d: any) => d.engagement_id === engagement.id);

  // Group by category
  const categories = new Map<string, any[]>();
  checklists.forEach((item: any) => {
    const cat = item.stage || 'Other';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(item);
  });

  const totalItems = checklists.length;
  const completedItems = checklists.filter((c: any) => c.completed).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : engagement.progress;

  // Update engagement progress when checklist changes
  useEffect(() => {
    if (totalItems > 0 && progress !== engagement.progress) {
      updateItem('engagements', engagement.id, { progress });
    }
  }, [progress, totalItems]);

  const toggleChecklist = async (item: any) => {
    await updateItem('checklists', item.id, {
      completed: !item.completed,
      completed_at: item.completed ? null : new Date().toISOString(),
    });
  };

  const advanceStage = async () => {
    const currentIdx = stageOrder.indexOf(engagement.stage);
    if (currentIdx < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIdx + 1];
      await updateItem('engagements', engagement.id, { stage: nextStage });
      toast.success(`Advanced to ${nextStage}`);
    }
  };

  const filteredCategories = filterCategory === 'all'
    ? Array.from(categories.entries())
    : Array.from(categories.entries()).filter(([cat]) => cat === filterCategory);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <span>{client?.name}</span>
            <span className="text-muted-foreground font-normal text-sm">FY {engagement.fiscal_year}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Stage & Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {stageOrder.map((stage, idx) => {
              const isCurrent = stage === engagement.stage;
              const isPast = stageOrder.indexOf(stage) < stageOrder.indexOf(engagement.stage);
              return (
                <div key={stage} className="flex items-center gap-1">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-all',
                    isCurrent ? stageColors[stage] + ' ring-2 ring-offset-1 ring-primary/30' :
                      isPast ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  )}>{stage}</span>
                  {idx < stageOrder.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{completedItems}/{totalItems} items completed</span>
                <span className="text-sm font-semibold data-cell text-foreground">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {engagement.stage !== 'completed' && (
              <Button size="sm" variant="outline" onClick={advanceStage} className="gap-1 shrink-0">
                <ChevronRight className="h-3.5 w-3.5" /> Advance Stage
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="stat-label">Risk</p>
              <p className={cn('text-sm font-semibold capitalize',
                engagement.risk_level === 'high' || engagement.risk_level === 'critical' ? 'text-destructive' :
                  engagement.risk_level === 'medium' ? 'text-warning' : 'text-success'
              )}>{engagement.risk_level}</p>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="stat-label">Materiality</p>
              <p className="text-sm font-semibold text-foreground data-cell">₨{Number(engagement.materiality || 0).toLocaleString()}</p>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="stat-label">Findings</p>
              <p className="text-sm font-semibold text-foreground data-cell">{findings.length}</p>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="stat-label">Documents</p>
              <p className="text-sm font-semibold text-foreground data-cell">{documents.length}</p>
            </div>
          </div>

          {/* Vision 2026: Track 5 - One-Stop Tools */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">UDIN Generation (BETA)</h4>
                <p className="text-[10px] text-muted-foreground italic">Prepare data for ICAN UDIN portal</p>
              </div>
            </div>
            <Button size="sm" className="gap-1.5 gradient-gold border-0 hover:opacity-90 transition-opacity" onClick={() => toast.info('UDIN Data Prepared!', { description: 'Payload ready for ICAN Portal sync (Vision 2026 feature).' })}>
              <ExternalLink className="h-3.5 w-3.5" /> Generate UDIN
            </Button>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-heading font-semibold text-foreground">Audit Checklist</h3>
              <div className="flex items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.from(categories.keys()).map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setShowAddItem(true)}>
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>
            </div>

            {totalItems === 0 ? (
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No checklist items yet. Add items or configure checklist templates in Settings.</p>
                <Button size="sm" className="mt-3 gap-1" onClick={() => setShowAddItem(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.map(([category, items]) => (
                  <div key={category} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider capitalize">{category}</h4>
                      <span className="text-xs text-muted-foreground">
                        {items.filter((i: any) => i.completed).length}/{items.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group">
                          <button onClick={() => toggleChecklist(item)}
                            className={cn('h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                              item.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'
                            )}>
                            {item.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                          </button>
                          <span className={cn('text-sm flex-1 flex items-center gap-2', item.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
                            {item.title}
                            {item.is_mandatory && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase border border-primary/20 shrink-0">
                                <Shield className="h-2.5 w-2.5" /> Mandatory
                              </span>
                            )}
                          </span>
                          {item.is_mandatory ? (
                            <div className="text-muted-foreground/30 px-1" title="Required by ICAN">
                              <Lock className="h-3 w-3" />
                            </div>
                          ) : (
                            <button onClick={() => deleteItem('checklists', item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {engagement.notes && (
            <div className="bg-muted/30 rounded-lg p-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</h3>
              <p className="text-sm text-foreground">{engagement.notes}</p>
            </div>
          )}
        </div>

        {/* Add Checklist Item Dialog */}
        {showAddItem && (
          <AddChecklistItem
            engagementId={engagement.id}
            onSave={async (item: any) => {
              await addItem('checklists', item);
              setShowAddItem(false);
            }}
            onClose={() => setShowAddItem(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddChecklistItem({ engagementId, onSave, onClose }: { engagementId: string; onSave: (item: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', stage: 'planning', priority: 'medium', due_date: '',
    engagement_id: engagementId,
  });

  return (
    <div className="border-t border-border pt-4 mt-4">
      <h4 className="text-sm font-heading font-semibold mb-3">Add Checklist Item</h4>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-2">
        <Input placeholder="Item title *" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Category/Stage" /></SelectTrigger>
            <SelectContent>
              {checklistCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['low', 'medium', 'high', 'urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">Add Item</Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
