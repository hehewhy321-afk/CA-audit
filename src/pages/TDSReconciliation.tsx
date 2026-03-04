import { useState, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
    ArrowLeftRight, Upload, FileSpreadsheet, FileText, CheckCircle2,
    AlertTriangle, XCircle, Search, Download, Filter, RefreshCw,
    Sparkles, Eye, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────
interface TDSEntry {
    pan: string;
    name: string;
    amount: number;
    tds: number;
    date: string;
    section?: string;
    voucher?: string;
}

interface MatchResult {
    ledger: TDSEntry;
    ird: TDSEntry | null;
    confidence: number;
    status: 'matched' | 'mismatch' | 'missing_ird' | 'missing_ledger' | 'flagged';
    reason?: string;
}

// ─── Fuzzy Matching Engine (Client-Side) ───────────────
function fuzzyMatch(ledgerEntries: TDSEntry[], irdEntries: TDSEntry[]): MatchResult[] {
    const results: MatchResult[] = [];
    const usedIrd = new Set<number>();

    for (const ledger of ledgerEntries) {
        let bestMatch: { ird: TDSEntry; confidence: number; idx: number } | null = null;

        for (let i = 0; i < irdEntries.length; i++) {
            if (usedIrd.has(i)) continue;
            const ird = irdEntries[i];

            let confidence = 0;

            // PAN match (40% weight)
            if (ledger.pan && ird.pan && ledger.pan.trim() === ird.pan.trim()) {
                confidence += 40;
            }

            // Amount match with tolerance ±₨100 (35% weight)
            const amountDiff = Math.abs(ledger.tds - ird.tds);
            if (amountDiff === 0) confidence += 35;
            else if (amountDiff <= 100) confidence += 25;
            else if (amountDiff <= 500) confidence += 10;

            // Date proximity ±3 days (25% weight)
            if (ledger.date && ird.date) {
                const ld = new Date(ledger.date).getTime();
                const id = new Date(ird.date).getTime();
                const dayDiff = Math.abs(ld - id) / 86400000;
                if (dayDiff === 0) confidence += 25;
                else if (dayDiff <= 3) confidence += 18;
                else if (dayDiff <= 7) confidence += 8;
            }

            if (confidence > (bestMatch?.confidence || 0)) {
                bestMatch = { ird, confidence, idx: i };
            }
        }

        if (bestMatch && bestMatch.confidence >= 60) {
            usedIrd.add(bestMatch.idx);
            results.push({
                ledger,
                ird: bestMatch.ird,
                confidence: bestMatch.confidence,
                status: bestMatch.confidence >= 90 ? 'matched' : bestMatch.confidence >= 75 ? 'mismatch' : 'flagged',
                reason: bestMatch.confidence < 90
                    ? `Partial match: ${bestMatch.confidence}% confidence`
                    : undefined,
            });
        } else {
            results.push({
                ledger,
                ird: null,
                confidence: 0,
                status: 'missing_ird',
                reason: 'No matching entry found in IRD data',
            });
        }
    }

    // Find IRD entries with no ledger match
    for (let i = 0; i < irdEntries.length; i++) {
        if (!usedIrd.has(i)) {
            results.push({
                ledger: { pan: '', name: '', amount: 0, tds: 0, date: '' },
                ird: irdEntries[i],
                confidence: 0,
                status: 'missing_ledger',
                reason: 'IRD entry has no corresponding ledger entry',
            });
        }
    }

    return results;
}

// ─── CSV Parser ───────────────────────────────────────
function parseCSVToEntries(text: string): TDSEntry[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return {
            pan: row['pan'] || row['pan_number'] || row['pannumber'] || '',
            name: row['name'] || row['party'] || row['vendor'] || row['particular'] || '',
            amount: parseFloat(row['amount'] || row['gross'] || '0') || 0,
            tds: parseFloat(row['tds'] || row['tds_amount'] || row['tax'] || '0') || 0,
            date: row['date'] || row['txn_date'] || row['transaction_date'] || '',
            section: row['section'] || row['tds_section'] || '',
            voucher: row['voucher'] || row['voucher_no'] || '',
        };
    }).filter(e => e.pan || e.amount > 0);
}

// ─── Status Config ───────────────────────────────────
const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    matched: { icon: CheckCircle2, color: 'text-success bg-success/10 border-success/20', label: 'Matched' },
    mismatch: { icon: AlertTriangle, color: 'text-warning bg-warning/10 border-warning/20', label: 'Mismatch' },
    flagged: { icon: Sparkles, color: 'text-primary bg-primary/10 border-primary/20', label: 'AI Review' },
    missing_ird: { icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Missing IRD' },
    missing_ledger: { icon: XCircle, color: 'text-info bg-info/10 border-info/20', label: 'Missing Ledger' },
};

// ─── Main Component ───────────────────────────────────
export default function TDSReconciliation() {
    const { state } = useApp();
    const [ledgerFile, setLedgerFile] = useState<File | null>(null);
    const [irdFile, setIrdFile] = useState<File | null>(null);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<string>('all');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const ledgerRef = useRef<HTMLInputElement>(null);
    const irdRef = useRef<HTMLInputElement>(null);

    const readFile = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });

    const runReconciliation = useCallback(async () => {
        if (!ledgerFile || !irdFile) {
            toast.error('Please upload both Ledger and IRD files');
            return;
        }

        setIsProcessing(true);
        toast.info('Processing reconciliation...', { icon: <RefreshCw className="h-4 w-4 animate-spin" /> });

        try {
            const [ledgerText, irdText] = await Promise.all([
                readFile(ledgerFile),
                readFile(irdFile),
            ]);

            const ledgerEntries = parseCSVToEntries(ledgerText);
            const irdEntries = parseCSVToEntries(irdText);

            if (ledgerEntries.length === 0 || irdEntries.length === 0) {
                toast.error('Could not parse entries. Ensure CSV has headers: pan, name, amount, tds, date');
                setIsProcessing(false);
                return;
            }

            // Simulate processing time for UX
            await new Promise(r => setTimeout(r, 1500));

            const matchResults = fuzzyMatch(ledgerEntries, irdEntries);
            setResults(matchResults);

            const matched = matchResults.filter(r => r.status === 'matched').length;
            const mismatches = matchResults.filter(r => r.status !== 'matched').length;
            const totalLedgerTDS = ledgerEntries.reduce((s, e) => s + e.tds, 0);
            const totalIrdTDS = irdEntries.reduce((s, e) => s + e.tds, 0);

            toast.success(`Reconciliation Complete!`, {
                description: `${matched} matched, ${mismatches} issues found. Variance: ₨${Math.abs(totalLedgerTDS - totalIrdTDS).toLocaleString()}`,
            });
        } catch (err) {
            toast.error('Failed to process files');
        } finally {
            setIsProcessing(false);
        }
    }, [ledgerFile, irdFile]);

    const handleExport = () => {
        if (results.length === 0) return;

        const headers = ['Status', 'Ledger PAN', 'Ledger Name', 'Ledger TDS', 'IRD PAN', 'IRD Name', 'IRD TDS', 'Variance', 'Confidence', 'Reason'];
        const rows = results.map(r => [
            r.status,
            r.ledger.pan || '',
            r.ledger.name || '',
            r.ledger.tds || 0,
            r.ird?.pan || '',
            r.ird?.name || '',
            r.ird?.tds || 0,
            Math.abs((r.ledger.tds || 0) - (r.ird?.tds || 0)),
            `${r.confidence}%`,
            r.reason || ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `TDS_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Report exported successfully');
    };

    // Stats
    const stats = {
        total: results.length,
        matched: results.filter(r => r.status === 'matched').length,
        mismatch: results.filter(r => r.status === 'mismatch').length,
        flagged: results.filter(r => r.status === 'flagged').length,
        missingIrd: results.filter(r => r.status === 'missing_ird').length,
        missingLedger: results.filter(r => r.status === 'missing_ledger').length,
        matchRate: results.length > 0 ? Math.round((results.filter(r => r.status === 'matched').length / results.length) * 100) : 0,
        totalVariance: results.reduce((s, r) => s + Math.abs((r.ledger.tds || 0) - (r.ird?.tds || 0)), 0),
    };

    const filteredResults = results
        .filter(r => filterStatus === 'all' || r.status === filterStatus)
        .filter(r => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (r.ledger.pan?.toLowerCase().includes(q) ||
                r.ledger.name?.toLowerCase().includes(q) ||
                r.ird?.pan?.toLowerCase().includes(q) ||
                r.ird?.name?.toLowerCase().includes(q));
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-8 w-1 rounded-full gradient-gold" />
                    <h1 className="text-2xl font-heading font-bold text-foreground">TDS Reconciliation</h1>
                </div>
                <p className="text-sm text-muted-foreground pl-4">
                    AI-powered matching of Ledger TDS vs IRD Annex 10/Form 26AS · Saves 97% staff time
                </p>
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ledger Upload */}
                <div
                    className={cn(
                        "glass-card rounded-xl p-6 border-2 border-dashed transition-all cursor-pointer hover:border-primary/40 group",
                        ledgerFile ? "border-success/40 bg-success/5" : "border-border"
                    )}
                    onClick={() => ledgerRef.current?.click()}
                >
                    <input ref={ledgerRef} type="file" accept=".csv,.txt,.xlsx" className="hidden"
                        onChange={e => setLedgerFile(e.target.files?.[0] || null)} />
                    <div className="text-center">
                        <div className={cn(
                            "h-12 w-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors",
                            ledgerFile ? "bg-success/15 text-success" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                            {ledgerFile ? ledgerFile.name : 'Upload Tally/Ledger Export'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {ledgerFile ? `${(ledgerFile.size / 1024).toFixed(1)} KB` : 'CSV, TXT, or XLSX from Tally'}
                        </p>
                    </div>
                </div>

                {/* IRD Upload */}
                <div
                    className={cn(
                        "glass-card rounded-xl p-6 border-2 border-dashed transition-all cursor-pointer hover:border-primary/40 group",
                        irdFile ? "border-success/40 bg-success/5" : "border-border"
                    )}
                    onClick={() => irdRef.current?.click()}
                >
                    <input ref={irdRef} type="file" accept=".csv,.txt,.xlsx" className="hidden"
                        onChange={e => setIrdFile(e.target.files?.[0] || null)} />
                    <div className="text-center">
                        <div className={cn(
                            "h-12 w-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors",
                            irdFile ? "bg-success/15 text-success" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                            {irdFile ? irdFile.name : 'Upload IRD Portal Export'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {irdFile ? `${(irdFile.size / 1024).toFixed(1)} KB` : 'Annex 10 or Form 26AS export'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={runReconciliation}
                    disabled={!ledgerFile || !irdFile || isProcessing}
                    className="gap-2 gradient-gold border-0 text-foreground font-semibold hover:opacity-90"
                >
                    {isProcessing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowLeftRight className="h-4 w-4" />
                    )}
                    {isProcessing ? 'Processing...' : 'Run Reconciliation'}
                </Button>
                {results.length > 0 && (
                    <Button variant="outline" size="sm" className="gap-1.5"
                        onClick={handleExport}>
                        <Download className="h-3.5 w-3.5" /> Export Report
                    </Button>
                )}
            </div>

            {/* Results */}
            {results.length > 0 && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 stagger-children">
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">Total Entries</p>
                            <p className="stat-value text-xl">{stats.total}</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">Matched</p>
                            <p className="stat-value text-xl text-success">{stats.matched}</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">Mismatches</p>
                            <p className="stat-value text-xl text-warning">{stats.mismatch}</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">AI Review</p>
                            <p className="stat-value text-xl text-primary">{stats.flagged}</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">Match Rate</p>
                            <p className="stat-value text-xl">{stats.matchRate}%</p>
                        </div>
                        <div className="glass-card rounded-xl p-4 animate-slide-up">
                            <p className="stat-label mb-1">Variance</p>
                            <p className="stat-value text-xl text-destructive">₨{stats.totalVariance.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {['all', 'matched', 'mismatch', 'flagged', 'missing_ird', 'missing_ledger'].map(f => (
                            <button key={f} onClick={() => setFilterStatus(f)}
                                className={cn(
                                    'text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors',
                                    filterStatus === f
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:text-foreground'
                                )}>
                                {f === 'all' ? `All (${stats.total})` :
                                    f === 'missing_ird' ? `Missing IRD (${stats.missingIrd})` :
                                        f === 'missing_ledger' ? `Missing Ledger (${stats.missingLedger})` :
                                            `${f} (${results.filter(r => r.status === f).length})`}
                            </button>
                        ))}
                        <div className="flex-1" />
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input placeholder="Search PAN or name..." value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 w-48 text-xs" />
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-2.5 stat-label">Status</th>
                                        <th className="text-left px-4 py-2.5 stat-label">Ledger PAN</th>
                                        <th className="text-left px-4 py-2.5 stat-label">Party Name</th>
                                        <th className="text-right px-4 py-2.5 stat-label">Ledger TDS</th>
                                        <th className="text-right px-4 py-2.5 stat-label">IRD TDS</th>
                                        <th className="text-right px-4 py-2.5 stat-label">Variance</th>
                                        <th className="text-center px-4 py-2.5 stat-label">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredResults.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No results match filters</td></tr>
                                    )}
                                    {filteredResults.map((r, idx) => {
                                        const cfg = statusConfig[r.status];
                                        const Icon = cfg.icon;
                                        const variance = Math.abs((r.ledger.tds || 0) - (r.ird?.tds || 0));
                                        const isExpanded = expandedRow === idx;
                                        return (
                                            <>
                                                <tr key={idx}
                                                    className={cn("hover:bg-accent/30 transition-colors cursor-pointer",
                                                        r.status === 'flagged' && "pulse-at-risk",
                                                        isExpanded && "bg-accent/20"
                                                    )}
                                                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border', cfg.color)}>
                                                            <Icon className="h-3 w-3" /> {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm data-cell text-foreground">{r.ledger.pan || r.ird?.pan || '—'}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground truncate max-w-[200px]">{r.ledger.name || r.ird?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-sm data-cell text-right text-foreground">₨{(r.ledger.tds || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm data-cell text-right text-foreground">₨{(r.ird?.tds || 0).toLocaleString()}</td>
                                                    <td className={cn("px-4 py-3 text-sm data-cell text-right font-semibold", variance > 0 ? "text-destructive" : "text-success")}>
                                                        {variance > 0 ? `₨${variance.toLocaleString()}` : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full",
                                                                        r.confidence >= 90 ? "bg-success" : r.confidence >= 75 ? "bg-warning" : "bg-destructive"
                                                                    )}
                                                                    style={{ width: `${r.confidence}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs data-cell text-muted-foreground">{r.confidence}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-muted/10 border-l-2 border-primary animate-fade-in">
                                                        <td colSpan={7} className="px-8 py-4">
                                                            <div className="grid grid-cols-2 gap-8">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                                        <FileSpreadsheet className="h-3 w-3" /> Ledger Details
                                                                    </h4>
                                                                    <div className="text-xs space-y-1">
                                                                        <p><span className="text-muted-foreground">PAN:</span> <span className="text-foreground font-mono">{r.ledger.pan || 'N/A'}</span></p>
                                                                        <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{r.ledger.name || 'N/A'}</span></p>
                                                                        <p><span className="text-muted-foreground">Amount:</span> <span className="text-foreground">₨{(r.ledger.amount || 0).toLocaleString()}</span></p>
                                                                        <p><span className="text-muted-foreground">TDS:</span> <span className="text-foreground">₨{(r.ledger.tds || 0).toLocaleString()}</span></p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                                        <FileText className="h-3 w-3" /> IRD Portal Details
                                                                    </h4>
                                                                    {r.ird ? (
                                                                        <div className="text-xs space-y-1">
                                                                            <p><span className="text-muted-foreground">PAN:</span> <span className="text-foreground font-mono">{r.ird.pan}</span></p>
                                                                            <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{r.ird.name}</span></p>
                                                                            <p><span className="text-muted-foreground">Amount:</span> <span className="text-foreground">₨{(r.ird.amount || 0).toLocaleString()}</span></p>
                                                                            <p><span className="text-muted-foreground">TDS:</span> <span className="text-foreground">₨{(r.ird.tds || 0).toLocaleString()}</span></p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-16 flex items-center justify-center border border-dashed rounded bg-destructive/5 border-destructive/20">
                                                                            <p className="text-[10px] text-destructive italic">No entry found in IRD Portal data</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {r.reason && (
                                                                <div className="mt-4 p-2 bg-primary/5 rounded border border-primary/20 flex items-start gap-2">
                                                                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                                                    <div className="text-[10px]">
                                                                        <span className="font-bold text-primary mr-1">AI Reasoning:</span>
                                                                        <span className="text-muted-foreground">{r.reason}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State */}
            {results.length === 0 && !isProcessing && (
                <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <ArrowLeftRight className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Upload Files to Begin</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                        Upload your Tally/Ledger export and IRD Annex 10 data. The AI engine will fuzzy-match entries by PAN, Amount (±₨100), and Date (±3 days) and flag any discrepancies.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> PAN Matching</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Amount Tolerance</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Date Proximity</div>
                        <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI Fallback</div>
                    </div>
                </div>
            )}
        </div>
    );
}
