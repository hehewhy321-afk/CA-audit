import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
    Bot, CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
    Search, Filter, ArrowLeftRight, FileText, Sparkles,
    Shield, ChevronRight, BarChart3, Activity, HelpCircle, Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ─── Action Types ─────────────────────────────────────
const actionIcons: Record<string, any> = {
    reconcile: ArrowLeftRight,
    categorize: FileText,
    extract: Sparkles,
    flag: AlertTriangle,
    approve: CheckCircle2,
    reject: XCircle,
    match: CheckCircle2,
    query: Bot,
};

const actionColors: Record<string, string> = {
    reconcile: 'bg-info/10 text-info border-info/20',
    categorize: 'bg-primary/10 text-primary border-primary/20',
    extract: 'bg-warning/10 text-warning border-warning/20',
    flag: 'bg-destructive/10 text-destructive border-destructive/20',
    approve: 'bg-success/10 text-success border-success/20',
    reject: 'bg-destructive/10 text-destructive border-destructive/20',
    match: 'bg-success/10 text-success border-success/20',
    query: 'bg-primary/10 text-primary border-primary/20',
};

const statusBadge: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-warning/15 text-warning', label: 'Pending Review' },
    approved: { color: 'bg-success/15 text-success', label: 'Approved' },
    rejected: { color: 'bg-destructive/15 text-destructive', label: 'Rejected' },
    auto_approved: { color: 'bg-info/15 text-info', label: 'Auto Approved' },
};

// ─── Helper: Grouping by Date ─────────────────────────
function groupLogsByDate(logs: any[]) {
    const groups: Record<string, any[]> = {};
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    logs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        let label = date;
        if (date === today) label = 'Today';
        else if (date === yesterday) label = 'Yesterday';
        else label = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        if (!groups[label]) groups[label] = [];
        groups[label].push(log);
    });
    return groups;
}

// ─── Main Component ───────────────────────────────────
export default function AgentLog() {
    const { state, updateItem } = useApp();
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('feed');
    const [policy, setPolicy] = useState({
        autoApproveCap: '50000',
        confidenceFloor: '95',
        roleInheritance: 'Audit Staff',
        externalApiSync: true
    });
    const [isEditPolicyOpen, setIsEditPolicyOpen] = useState(false);

    const logs = useMemo(() => state.agentLogs || [], [state.agentLogs]);

    const filtered = logs.filter(l => {
        if (filterAction !== 'all' && l.action_type !== filterAction) return false;
        if (filterStatus !== 'all' && l.status !== filterStatus) return false;
        if (searchQuery && !(l.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const grouped = useMemo(() => groupLogsByDate(filtered), [filtered]);

    const pendingApprovals = logs.filter(l => l.status === 'pending');
    const stats = {
        total: logs.length,
        autoApproved: logs.filter(l => l.status === 'auto_approved').length,
        pending: pendingApprovals.length,
        avgConfidence: logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.confidence || 0), 0) / logs.length) : 0,
        avgTime: logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / logs.length) : 0,
    };

    const handleApproval = async (logId: string, approved: boolean) => {
        const newStatus = approved ? 'approved' : 'rejected';
        await updateItem('agentLogs', logId, { status: newStatus });
        toast.success(approved ? 'Task approved' : 'Task rejected', {
            description: `Agent action has been updated.`,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-in flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-1 rounded-full gradient-gold" />
                        <h1 className="text-2xl font-heading font-bold text-foreground">AI Agent Log</h1>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase border border-primary/20">AGENT: JUNIOR-01</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-4">
                        Immutable audit trail of autonomous decisions · Human-in-the-Loop governance
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl shrink-0">
                            <HelpCircle className="h-4 w-4" /> How to use
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] border-border/50 bg-card/95 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-heading text-foreground">How to Use the AI Agent Log</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                The AI Agent Log acts as the central governance and oversight hub for all autonomous actions executed by AuditFlow AI.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 text-sm text-muted-foreground shrink-0 max-h-[60vh] overflow-y-auto">
                            <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-primary" /> Activity Feed (Audit Trail)</h4>
                                <p className="leading-relaxed">View a real-time, immutable list of tasks the AI has performed, categorized by specific action types (e.g., Categorize, Reconcile, Flag). <strong>Click on any log entry</strong> to expand and read the AI's internal reasoning chain step-by-step.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-warning" /> Human-in-the-Loop (HITL) Approvals</h4>
                                <p className="leading-relaxed">Tasks that fall below your permitted Confidence Floor or involve high-risk actions are queued here. A human auditor must manually <strong>Approve</strong> or <strong>Reject</strong> these actions before they are permanently logged.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-info/5 border border-info/10">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><Filter className="h-4 w-4 text-info" /> Advanced Filtering</h4>
                                <p className="leading-relaxed">Use the quick-action pills ("Categorize", "Extract") to isolate specific operations, and utilize the dropdown to filter by <strong>Status</strong> (Pending, Approved, Rejected, Auto Approved).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                                <h4 className="font-bold text-foreground flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-success" /> Governance Policy Engine</h4>
                                <p className="leading-relaxed">Navigate to the HITL Approvals tab to click <strong>Edit Policy</strong>. This lets you dictate the AI's allowed autonomy boundaries, such as setting maximum transaction value caps for auto-approval limits.</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
                <div className="glass-card rounded-2xl p-4 animate-slide-up bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Actions</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 animate-slide-up bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Auto Approved</p>
                    <p className="text-2xl font-heading font-bold text-success">{stats.autoApproved}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 animate-slide-up relative bg-warning/5 border-warning/20">
                    <p className="text-[10px] font-bold text-warning uppercase mb-1">Pending Review</p>
                    <p className="text-2xl font-heading font-bold text-warning">{stats.pending}</p>
                    {stats.pending > 0 && <span className="absolute top-4 right-4 flex h-2 w-2 rounded-full bg-warning animate-pulse" />}
                </div>
                <div className="glass-card rounded-2xl p-4 animate-slide-up bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Confidence Avg</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{stats.avgConfidence}%</p>
                </div>
                <div className="glass-card rounded-2xl p-4 animate-slide-up bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Processing</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{stats.avgTime}ms</p>
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="feed" className="rounded-lg gap-2"><Activity className="h-3.5 w-3.5" /> Activity Feed</TabsTrigger>
                        <TabsTrigger value="approvals" className="rounded-lg gap-2 relative">
                            <Shield className="h-3.5 w-3.5" /> HITL Approvals
                            {stats.pending > 0 && (
                                <span className="ml-1 h-4 w-4 rounded-full bg-warning text-[9px] font-bold text-warning-foreground flex items-center justify-center animate-bounce">{stats.pending}</span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'feed' && (
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 w-full md:w-64 rounded-xl border-border/50 focus:ring-primary/20"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px] h-10 rounded-xl border-border/50 bg-background focus:ring-primary/20">
                                    <SelectValue placeholder="Status Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="auto_approved">Auto Approved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <TabsContent value="feed" className="mt-0 space-y-4">
                    {/* Filters Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button
                            onClick={() => setFilterAction('all')}
                            className={cn(
                                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                                filterAction === 'all' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                            )}
                        >
                            All Actions
                        </button>
                        {Object.keys(actionIcons).map(a => (
                            <button
                                key={a}
                                onClick={() => setFilterAction(a)}
                                className={cn(
                                    "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                                    filterAction === a ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                <span className="capitalize">{a}</span>
                            </button>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="glass-card rounded-2xl overflow-hidden border-border/50 bg-card/30">
                        {filtered.length === 0 ? (
                            <div className="p-20 text-center">
                                <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="font-heading font-bold text-foreground">No Logs Found</h3>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(grouped).map(([date, dateLogs]) => (
                                    <div key={date} className="space-y-2">
                                        <div className="px-6 py-2 bg-muted/40 border-y border-border/30 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{date}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">{dateLogs.length} events</span>
                                        </div>
                                        <div className="divide-y divide-border/20">
                                            {dateLogs.map(log => {
                                                const Icon = actionIcons[log.action_type] || Bot;
                                                const st = statusBadge[log.status] || statusBadge.pending;
                                                const isExpanded = expandedLog === log.id;

                                                return (
                                                    <div key={log.id}
                                                        className={cn("px-6 py-3 transition-all duration-200 group cursor-pointer hover:bg-accent/5",
                                                            isExpanded && "bg-accent/10"
                                                        )}
                                                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-all shadow-xs",
                                                                actionColors[log.action_type] || 'bg-muted text-muted-foreground'
                                                            )}>
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <p className="text-xs font-bold text-foreground truncate">{log.description || 'No description available'}</p>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter', st.color)}>{st.label}</span>
                                                                        <span className="text-[9px] text-muted-foreground font-medium">
                                                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {!isExpanded && (
                                                                    <div className="flex items-center gap-3 mt-1 opacity-60">
                                                                        <span className="text-[9px] text-muted-foreground font-mono">{log.execution_time_ms}ms</span>
                                                                        <span className="text-[9px] font-bold text-muted-foreground">{log.confidence}% Success</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="mt-4 ml-12 animate-slide-up space-y-4">
                                                                <div className="p-3 bg-muted/20 rounded-xl border border-border/40 text-[11px] leading-relaxed italic text-muted-foreground">
                                                                    <p className="font-bold text-foreground mb-1 not-italic">Internal Reasoning Log:</p>
                                                                    {typeof log.reasoning_chain === 'object'
                                                                        ? JSON.stringify(log.reasoning_chain)
                                                                        : String(log.reasoning_chain || 'No reasoning details')}
                                                                </div>

                                                                {log.status === 'pending' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Button size="sm" className="rounded-lg h-8 px-3 text-[10px] font-bold bg-success hover:bg-success/90"
                                                                            onClick={(e) => { e.stopPropagation(); handleApproval(log.id, true); }}>
                                                                            Approve
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="rounded-lg h-8 px-3 text-[10px] font-bold border-destructive/20 text-destructive"
                                                                            onClick={(e) => { e.stopPropagation(); handleApproval(log.id, false); }}>
                                                                            Reject
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="approvals" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {pendingApprovals.length === 0 ? (
                            <div className="col-span-full glass-card rounded-2xl p-20 text-center border-dashed border-2">
                                <Shield className="h-12 w-12 text-success/20 mx-auto mb-4" />
                                <h3 className="font-heading font-bold text-foreground">Queue is Empty</h3>
                                <p className="text-sm text-muted-foreground mt-1">All high-risk tasks have been processed.</p>
                            </div>
                        ) : (
                            pendingApprovals.map(log => {
                                const Icon = actionIcons[log.action_type] || Bot;
                                return (
                                    <div key={log.id} className="glass-card rounded-2xl p-5 border-warning/20 bg-warning/5 flex flex-col justify-between animate-slide-up group hover:shadow-xl hover:shadow-warning/10 transition-all">
                                        <div>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border bg-white shadow-sm",
                                                    actionColors[log.action_type]
                                                )}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-warning uppercase">Confidence</p>
                                                    <p className="text-lg font-heading font-bold text-warning-foreground">{log.confidence}%</p>
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-foreground mb-2 leading-tight">{log.description}</h3>
                                            <div className="p-3 bg-white/50 rounded-xl border border-warning/10 mb-6">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-2">
                                                    <AlertTriangle className="h-3 w-3 text-warning" /> Triggered Policy
                                                </p>
                                                <p className="text-[11px] font-bold text-warning-foreground">
                                                    {typeof log.reasoning_chain === 'object' && log.reasoning_chain?.rule
                                                        ? log.reasoning_chain.rule
                                                        : 'Policy review required'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 rounded-xl h-10 font-bold bg-success hover:bg-success/90"
                                                onClick={() => handleApproval(log.id, true)}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 rounded-xl h-10 font-bold border-destructive/20 text-destructive hover:bg-destructive/5"
                                                onClick={() => handleApproval(log.id, false)}>
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Policy Control Center */}
                    <div className="glass-card rounded-2xl p-6 border-primary/20 bg-primary/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" /> Governance Policy Engine
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Control the digital junior agent's permission boundaries.</p>
                            </div>

                            <Dialog open={isEditPolicyOpen} onOpenChange={setIsEditPolicyOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold bg-background shrink-0">Edit Policy</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] border-border/50">
                                    <DialogHeader>
                                        <DialogTitle>Edit Governance Policy</DialogTitle>
                                        <DialogDescription>
                                            Adjust the autonomy boundaries for your AI agents.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-5 py-4 text-sm">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="cap" className="text-right text-[11px] font-bold text-muted-foreground uppercase">Cap (₨)</Label>
                                            <Input id="cap" value={policy.autoApproveCap} onChange={(e) => setPolicy({ ...policy, autoApproveCap: e.target.value })} className="col-span-3 rounded-lg border-border/50" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="floor" className="text-right text-[11px] font-bold text-muted-foreground uppercase">Min Conf (%)</Label>
                                            <Input id="floor" value={policy.confidenceFloor} onChange={(e) => setPolicy({ ...policy, confidenceFloor: e.target.value })} className="col-span-3 rounded-lg border-border/50" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="role" className="text-right text-[11px] font-bold text-muted-foreground uppercase">Access Role</Label>
                                            <Select value={policy.roleInheritance} onValueChange={(val) => setPolicy({ ...policy, roleInheritance: val })}>
                                                <SelectTrigger className="col-span-3 rounded-lg border-border/50">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Audit Staff">Audit Staff</SelectItem>
                                                    <SelectItem value="Senior Auditor">Senior Auditor</SelectItem>
                                                    <SelectItem value="Manager">Manager</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2 justify-end col-span-4">
                                            <Label htmlFor="api-sync" className="cursor-pointer font-bold">External API Sync (IRD/OCR)</Label>
                                            <Switch id="api-sync" checked={policy.externalApiSync} onCheckedChange={(checked) => setPolicy({ ...policy, externalApiSync: !!checked })} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button className="rounded-xl w-full" onClick={() => { setIsEditPolicyOpen(false); toast.success('Governance Policy updated effectively.', { icon: '🛡️' }); }}>
                                            <Save className="mr-2 h-4 w-4" /> Apply Changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Auto-Approve Cap', value: `₨${Number(policy.autoApproveCap).toLocaleString()}`, icon: Shield, color: 'text-success', sub: 'Amount per action' },
                                { label: 'Confidence Floor', value: `${policy.confidenceFloor}%`, icon: BarChart3, color: 'text-warning', sub: 'Min AI certainty' },
                                { label: 'Role Inheritance', value: policy.roleInheritance, icon: Bot, color: 'text-primary', sub: 'Permission level' },
                                { label: 'External API Sync', value: policy.externalApiSync ? 'Enabled' : 'Disabled', icon: Eye, color: 'text-info', sub: 'IRD/OCR live link' },
                            ].map(perm => (
                                <div key={perm.label} className="bg-background rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-all group">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-3 bg-muted transition-colors group-hover:bg-primary/5")}>
                                        <perm.icon className={cn("h-4 w-4", perm.color)} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{perm.label}</p>
                                    <p className="text-sm font-bold text-foreground leading-none mb-1">{perm.value}</p>
                                    <p className="text-[9px] text-muted-foreground font-medium">{perm.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


// (End of file)
