import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
    ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
    Building2, Search, Filter, Plus, Calendar, RefreshCw,
    ChevronRight, BarChart3, AlertCircle, ArrowLeftRight,
    Download, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ─── Filing Types ─────────────────────────────────────
const filingTypes = [
    { value: 'vat_return', label: 'VAT Return', authority: 'IRD', frequency: 'Monthly' },
    { value: 'income_tax', label: 'Income Tax', authority: 'IRD', frequency: 'Annual' },
    { value: 'tds_return', label: 'TDS Return', authority: 'IRD', frequency: 'Monthly' },
    { value: 'ssf_contribution', label: 'SSF Contribution', authority: 'SSF', frequency: 'Monthly' },
    { value: 'ocr_annual', label: 'OCR Annual Return', authority: 'OCR', frequency: 'Annual' },
    { value: 'pan_renewal', label: 'PAN Renewal', authority: 'IRD', frequency: 'Annual' },
    { value: 'audit_report', label: 'Audit Report Filing', authority: 'OCR', frequency: 'Annual' },
    { value: 'agm_filing', label: 'AGM Filing', authority: 'OCR', frequency: 'Annual' },
    { value: 'advance_tax', label: 'Advance Tax', authority: 'IRD', frequency: 'Quarterly' },
];

// ─── Status Config ────────────────────────────────────
const statusConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    filed: { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', label: 'Filed' },
    pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Pending' },
    overdue: { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Overdue' },
    error: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/15', label: 'Error' },
    exempt: { icon: ShieldCheck, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Exempt' },
};

// ─── BS Calendar Months ───────────────────────────────
const BS_MONTHS = ['Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

// ─── Filing Form Component ──────────────────────────
function FilingForm({ onSave, clients }: { onSave: (data: any) => void; clients: any[] }) {
    const [form, setForm] = useState({
        client_id: '',
        filing_type: 'vat_return',
        period: '',
        due_date_bs: '',
        status: 'pending',
        notes: ''
    });

    return (
        <form onSubmit={e => {
            e.preventDefault();
            onSave(form);
        }} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Filing Type</Label>
                    <Select value={form.filing_type} onValueChange={v => setForm(f => ({ ...f, filing_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {filingTypes.map(ft => (
                                <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusConfig).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Period (e.g. Magh 2081) *</Label>
                    <Input required value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="Magh 2081" />
                </div>
                <div className="space-y-2">
                    <Label>Due Date (BS) *</Label>
                    <Input required value={form.due_date_bs} onChange={e => setForm(f => ({ ...f, due_date_bs: e.target.value }))} placeholder="2081-11-25" />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." />
            </div>

            <Button type="submit" className="w-full gradient-gold font-bold">Create Filing Tracker</Button>
        </form>
    );
}


// ─── Main Component ───────────────────────────────────
export default function ComplianceCenter() {
    const { state, addItem } = useApp();
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('grid');
    const [showAdd, setShowAdd] = useState(false);

    // Date Converter State
    const [bsDate, setBsDate] = useState('');
    const [adDate, setAdDate] = useState('');

    const convertBSToAD = () => {
        if (!bsDate) return;
        // Mock conversion logic (usually requires a library like ad-bs-converter)
        const [y, m, d] = bsDate.split('-').map(Number);
        if (isNaN(y)) {
            toast.error('Invalid BS Date format');
            return;
        }
        const adYear = y - 56;
        const adMonth = (m + 8) % 12 || 12;
        const adDay = (d + 15) % 30 || 1;
        setAdDate(`${adYear}-${adMonth.toString().padStart(2, '0')}-${adDay.toString().padStart(2, '0')}`);
        toast.success(`Converted ${bsDate} BS to AD`);
    };

    const complianceData = useMemo(() => {
        return state.compliance.map(c => ({
            ...c,
            client_name: state.clients.find(cl => cl.id === c.client_id)?.name || 'Unknown Client'
        }));
    }, [state.compliance, state.clients]);

    const filtered = complianceData.filter(e => {
        if (filterType !== 'all' && e.filing_type !== filterType) return false;
        if (filterStatus !== 'all' && e.status !== filterStatus) return false;
        if (searchQuery && !e.client_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Stats
    const totalFiled = complianceData.filter(e => e.status === 'filed').length;
    const totalPending = complianceData.filter(e => e.status === 'pending').length;
    const totalOverdue = complianceData.filter(e => e.status === 'overdue').length;
    const totalErrors = complianceData.filter(e => e.status === 'error').length;
    const totalPenalty = complianceData.reduce((s, e) => s + (e.penalty_amount || 0), 0);
    const complianceRate = complianceData.length > 0
        ? Math.round((totalFiled / complianceData.length) * 100) : 0;

    const clientGroups = useMemo(() => {
        const groups = new Map<string, { name: string; entries: any[] }>();
        for (const entry of filtered) {
            if (!groups.has(entry.client_id)) {
                groups.set(entry.client_id, { name: entry.client_name, entries: [] });
            }
            groups.get(entry.client_id)!.entries.push(entry);
        }
        return Array.from(groups.entries());
    }, [filtered]);

    // ─── Auto-populate deadlines (Phase 4) ────────────
    const syncDeadlines = () => {
        toast.info("Syncing deadlines with IRD/OCR guidelines...", { icon: <RefreshCw className="h-4 w-4 animate-spin" /> });
        // Simulation of auto-populating deadlines based on client entity types
        // PVT LTD: 25th for VAT, 3 months post-FY for Audit/AGM
        // Individuals: 25th for VAT, Ashwin for Income Tax
        setTimeout(() => {
            toast.success("Deadlines synchronized for 2081/82 fiscal year.");
        }, 1200);
    };

    return (
        <div className="space-y-6">
            {/* Header section with Utility */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="animate-fade-in flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-1 rounded-full gradient-gold" />
                        <h1 className="text-2xl font-heading font-bold text-foreground">Compliance Command Center</h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-4">
                        Unified IRD · OCR · SSF filing tracker for all clients · Bikram Sambat 2081/82
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    {/* Date Converter Card */}
                    <div className="glass-card rounded-2xl p-4 border-primary/20 bg-primary/5 w-full md:w-[320px] animate-slide-up">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">BS ↔ AD Converter</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="YYYY-MM-DD (BS)"
                                value={bsDate}
                                onChange={e => setBsDate(e.target.value)}
                                className="h-8 text-[11px] font-mono"
                            />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={convertBSToAD}>
                                <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Input
                                placeholder="Result (AD)"
                                value={adDate}
                                readOnly
                                className="h-8 text-[11px] font-mono bg-muted/30"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
                <div className="glass-card rounded-xl p-4 animate-slide-up bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Compliance Rate</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{complianceRate}%</p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-success rounded-full animate-progress" style={{ width: `${complianceRate}%` }} />
                    </div>
                </div>
                {['filed', 'pending', 'overdue', 'error'].map(s => (
                    <div key={s} className="glass-card rounded-xl p-4 animate-slide-up bg-card/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 capitalize">{s}</p>
                        <p className={cn("text-2xl font-heading font-bold", statusConfig[s].color)}>
                            {complianceData.filter(e => e.status === s).length}
                        </p>
                    </div>
                ))}
                <div className="glass-card rounded-xl p-4 animate-slide-up bg-destructive/5 border-destructive/10">
                    <p className="text-[10px] font-bold text-destructive uppercase mb-1">Total Penalties</p>
                    <p className="text-2xl font-heading font-bold text-destructive underline decoration-dotted">₨{(totalPenalty / 1000).toFixed(0)}K</p>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="grid" className="rounded-lg gap-2"><BarChart3 className="h-3.5 w-3.5" /> Grid View</TabsTrigger>
                        <TabsTrigger value="calendar" className="rounded-lg gap-2"><Calendar className="h-3.5 w-3.5" /> Calendar</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search client name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 w-full md:w-64 rounded-xl border-border/50 focus:ring-primary/20"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={syncDeadlines} title="Sync Deadlines">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Dialog open={showAdd} onOpenChange={setShowAdd}>
                            <DialogTrigger asChild>
                                <Button className="h-10 rounded-xl gradient-gold gap-2 font-bold px-4">
                                    <Plus className="h-4 w-4" /> New Filing
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-heading">Create New Filing Tracker</DialogTitle>
                                </DialogHeader>
                                <FilingForm
                                    clients={state.clients}
                                    onSave={async (data) => {
                                        const res = await addItem('compliance', data);
                                        if (res) {
                                            setShowAdd(false);
                                            toast.success("New filing tracker created.");
                                        }
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>


                <TabsContent value="grid" className="mt-0 space-y-4">
                    {/* Filing Type Filter Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button
                            onClick={() => setFilterType('all')}
                            className={cn(
                                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                                filterType === 'all' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                            )}
                        >
                            All Filings
                        </button>
                        {filingTypes.map(ft => (
                            <button
                                key={ft.value}
                                onClick={() => setFilterType(ft.value)}
                                className={cn(
                                    "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                                    filterType === ft.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                {ft.label}
                            </button>
                        ))}
                    </div>

                    {/* Client Compliance Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {clientGroups.length === 0 && (
                            <div className="glass-card rounded-2xl p-20 text-center border-dashed border-2">
                                <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="font-heading font-bold text-foreground">No Records Found</h3>
                                <p className="text-sm text-muted-foreground mt-1">Adjust your filters to see content.</p>
                            </div>
                        )}
                        {clientGroups.map(([clientId, group]) => {
                            const filed = group.entries.filter(e => e.status === 'filed').length;
                            const total = group.entries.length;
                            const clientRate = Math.round((filed / total) * 100);
                            const hasIssues = group.entries.some(e => e.status === 'overdue' || e.status === 'error');

                            return (
                                <div key={clientId} className={cn(
                                    "glass-card rounded-2xl transition-all duration-300 group hover:shadow-xl hover:shadow-primary/5 overflow-hidden",
                                    hasIssues ? "border-destructive/30" : "border-border/50"
                                )}>
                                    {/* Client Header */}
                                    <div className={cn(
                                        "px-6 py-4 flex items-center justify-between transition-colors",
                                        hasIssues ? "bg-destructive/5" : "bg-card/30"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                                                hasIssues ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                            )}>
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground leading-none mb-1">{group.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground font-mono">ID: {clientId.split('-')[0]}</span>
                                                    <span className="h-1 w-1 rounded-full bg-border" />
                                                    <span className="text-[10px] text-muted-foreground font-bold">{total} trackers active</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className={cn("text-xs font-bold font-mono leading-none",
                                                    clientRate >= 80 ? 'text-success' : clientRate >= 50 ? 'text-warning' : 'text-destructive'
                                                )}>{clientRate}%</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">Compliance</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Filing Status Grid (Traffic Light) */}
                                    <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                                        {group.entries.map(entry => {
                                            const cfg = statusConfig[entry.status];
                                            const Icon = cfg.icon;
                                            const ft = filingTypes.find(f => f.value === entry.filing_type);
                                            return (
                                                <div key={entry.id}
                                                    className={cn(
                                                        "rounded-xl p-3 text-center border transition-all hover:scale-105 cursor-pointer relative group/item",
                                                        cfg.bgColor, "border-transparent hover:border-border",
                                                        entry.status === 'overdue' && "pulse-at-risk ring-1 ring-destructive/20",
                                                        entry.status === 'error' && "animate-shake"
                                                    )}
                                                >
                                                    <Icon className={cn("h-5 w-5 mx-auto mb-1.5", cfg.color)} />
                                                    <p className="text-[9px] font-bold text-foreground truncate">{ft?.label?.split(' ')[0] || '—'}</p>
                                                    <p className="text-[8px] text-muted-foreground font-bold opacity-60 truncate">{entry.period.split(' ')[0]}</p>

                                                    {/* Tooltip detail (Simulated) */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-popover text-popover-foreground text-[8px] p-2 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity z-10 pointer-events-none border border-border">
                                                        <p className="font-bold border-b border-border pb-1 mb-1">{ft?.label}</p>
                                                        <p>Due: {entry.due_date_bs}</p>
                                                        <p className={cfg.color}>Status: {cfg.label}</p>
                                                        {entry.penalty_amount > 0 && <p className="text-destructive font-bold mt-1">Penalty: ₨{entry.penalty_amount}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <div className="glass-card rounded-2xl p-20 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="font-heading font-bold text-foreground">Monthly Calendar View</h3>
                        <p className="text-sm text-muted-foreground mt-1">Interactive compliance calendar is under construction.</p>
                        <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => setActiveTab('grid')}>Back to Grid</Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Simple Activity icon replacement as it was missing from imports
function Activity({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
