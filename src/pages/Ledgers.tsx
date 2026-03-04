import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { BookOpen, Upload, Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface LedgerEntry {
  date: string;
  particular: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  accountHead: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
}

interface TrialBalanceRow {
  accountHead: string;
  type: string;
  debit: number;
  credit: number;
}

const accountTypes = ['asset', 'liability', 'equity', 'income', 'expense'];

export default function Ledgers() {
  const { state } = useApp();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'accountHead' | 'debit' | 'credit'>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterClient, setFilterClient] = useState('all');

  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('CSV must have headers and data rows'); return; }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const particularIdx = headers.findIndex(h => h.includes('particular') || h.includes('narration') || h.includes('description'));
        const voucherIdx = headers.findIndex(h => h.includes('voucher') || h.includes('ref'));
        const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('dr'));
        const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('cr'));
        const accountIdx = headers.findIndex(h => h.includes('account') || h.includes('head') || h.includes('ledger'));
        const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('group'));

        if (debitIdx === -1 && creditIdx === -1) { toast.error('CSV must have Debit/Credit columns'); return; }

        let runningBalance = 0;
        const parsed: LedgerEntry[] = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const debit = parseFloat(cols[debitIdx] || '0') || 0;
          const credit = parseFloat(cols[creditIdx] || '0') || 0;
          runningBalance += debit - credit;
          return {
            date: cols[dateIdx] || '',
            particular: cols[particularIdx] || cols[1] || '',
            voucherNo: cols[voucherIdx] || '',
            debit,
            credit,
            balance: runningBalance,
            accountHead: cols[accountIdx] || 'General',
            type: (cols[typeIdx] || 'expense').toLowerCase() as any,
          };
        }).filter(e => e.particular || e.debit || e.credit);

        setEntries(parsed);
        toast.success(`Imported ${parsed.length} entries from CSV`);
      } catch {
        toast.error('Failed to parse CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Derived data
  const filtered = entries.filter(e => {
    if (search && !e.particular.toLowerCase().includes(search.toLowerCase()) && !e.accountHead.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortField === 'date') return mul * a.date.localeCompare(b.date);
    if (sortField === 'accountHead') return mul * a.accountHead.localeCompare(b.accountHead);
    if (sortField === 'debit') return mul * (a.debit - b.debit);
    return mul * (a.credit - b.credit);
  });

  // Trial balance
  const accountMap = new Map<string, { type: string; debit: number; credit: number }>();
  entries.forEach(e => {
    const existing = accountMap.get(e.accountHead) || { type: e.type, debit: 0, credit: 0 };
    existing.debit += e.debit;
    existing.credit += e.credit;
    accountMap.set(e.accountHead, existing);
  });
  const trialBalance: TrialBalanceRow[] = Array.from(accountMap.entries()).map(([head, vals]) => ({
    accountHead: head, ...vals,
  }));
  const tbDebitTotal = trialBalance.reduce((s, r) => s + r.debit, 0);
  const tbCreditTotal = trialBalance.reduce((s, r) => s + r.credit, 0);

  // Debtors / Creditors
  const debtors = trialBalance.filter(r => r.type === 'asset' && r.debit > r.credit);
  const creditors = trialBalance.filter(r => r.type === 'liability' && r.credit > r.debit);

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Ledgers & Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} entries · Trial Balance, Chart of Accounts, Debtors & Creditors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <span><Upload className="h-3.5 w-3.5" /> Import CSV</span>
            </Button>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Total Debit</p>
          <p className="stat-value flex items-center gap-1"><TrendingUp className="h-4 w-4 text-success" />₨{totalDebit.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Total Credit</p>
          <p className="stat-value flex items-center gap-1"><TrendingDown className="h-4 w-4 text-destructive" />₨{totalCredit.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Accounts</p>
          <p className="stat-value">{accountMap.size}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Balance Diff</p>
          <p className={cn('stat-value', Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-success' : 'text-destructive')}>
            ₨{Math.abs(totalDebit - totalCredit).toLocaleString()}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">Import Your Ledger Data</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Upload a CSV file with columns: Date, Particular/Narration, Voucher No, Debit, Credit, Account Head, Type (asset/liability/equity/income/expense)
          </p>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
            <Button className="gap-1.5" asChild><span><Upload className="h-4 w-4" /> Import CSV File</span></Button>
          </label>
          <div className="mt-6 text-left max-w-lg mx-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2">Sample CSV format:</p>
            <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
{`Date,Particular,Voucher,Debit,Credit,Account,Type
2081-01-01,Opening Balance,JV-001,500000,0,Cash,asset
2081-01-05,Sales Revenue,INV-001,0,150000,Sales,income
2081-01-10,Office Rent,PV-001,25000,0,Rent Expense,expense
2081-01-15,Ram & Sons,INV-002,75000,0,Debtors,asset
2081-01-20,Supplier Payment,PV-002,0,50000,Creditors,liability`}
            </pre>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="ledger" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ledger">General Ledger</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="debtors-creditors">Debtors & Creditors</TabsTrigger>
          </TabsList>

          {/* General Ledger */}
          <TabsContent value="ledger" className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {accountTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="glass-card rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { key: 'date' as const, label: 'Date' },
                      { key: 'accountHead' as const, label: 'Account' },
                      { key: 'debit' as const, label: 'Debit (₨)' },
                      { key: 'credit' as const, label: 'Credit (₨)' },
                    ].map(col => (
                      <th key={col.key} className="text-left px-4 py-2 stat-label cursor-pointer hover:text-foreground" onClick={() => toggleSort(col.key)}>
                        <span className="flex items-center gap-1">{col.label} <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-2 stat-label">Particular</th>
                    <th className="text-left px-4 py-2 stat-label">Voucher</th>
                    <th className="text-right px-4 py-2 stat-label">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.slice(0, 200).map((entry, i) => (
                    <tr key={i} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2 text-sm data-cell text-foreground">{entry.date}</td>
                      <td className="px-4 py-2">
                        <span className="text-sm text-foreground">{entry.accountHead}</span>
                        <span className={cn('text-[10px] ml-1.5 px-1.5 py-0.5 rounded capitalize',
                          entry.type === 'asset' ? 'bg-info/15 text-info' :
                          entry.type === 'liability' ? 'bg-warning/15 text-warning' :
                          entry.type === 'income' ? 'bg-success/15 text-success' :
                          entry.type === 'expense' ? 'bg-destructive/15 text-destructive' :
                          'bg-muted text-muted-foreground'
                        )}>{entry.type}</span>
                      </td>
                      <td className="px-4 py-2 text-sm data-cell text-foreground">{entry.debit ? `₨${entry.debit.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-2 text-sm data-cell text-foreground">{entry.credit ? `₨${entry.credit.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-2 text-sm text-foreground truncate max-w-[200px]">{entry.particular}</td>
                      <td className="px-4 py-2 text-xs data-cell text-muted-foreground">{entry.voucherNo}</td>
                      <td className={cn('px-4 py-2 text-sm data-cell text-right font-medium',
                        entry.balance >= 0 ? 'text-foreground' : 'text-destructive'
                      )}>₨{entry.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td className="px-4 py-2 text-sm font-semibold text-foreground" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-sm font-semibold data-cell text-foreground">₨{totalDebit.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm font-semibold data-cell text-foreground">₨{totalCredit.toLocaleString()}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
              {filtered.length > 200 && <p className="px-4 py-2 text-xs text-muted-foreground">Showing first 200 of {filtered.length} entries</p>}
            </div>
          </TabsContent>

          {/* Trial Balance */}
          <TabsContent value="trial-balance" className="space-y-3">
            <div className="glass-card rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 stat-label">Account Head</th>
                    <th className="text-left px-4 py-2 stat-label">Type</th>
                    <th className="text-right px-4 py-2 stat-label">Debit (₨)</th>
                    <th className="text-right px-4 py-2 stat-label">Credit (₨)</th>
                    <th className="text-right px-4 py-2 stat-label">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trialBalance.sort((a, b) => a.accountHead.localeCompare(b.accountHead)).map((row, i) => (
                    <tr key={i} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-2 text-sm font-medium text-foreground">{row.accountHead}</td>
                      <td className="px-4 py-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded capitalize',
                          row.type === 'asset' ? 'bg-info/15 text-info' :
                          row.type === 'liability' ? 'bg-warning/15 text-warning' :
                          row.type === 'income' ? 'bg-success/15 text-success' :
                          row.type === 'expense' ? 'bg-destructive/15 text-destructive' :
                          'bg-muted text-muted-foreground'
                        )}>{row.type}</span>
                      </td>
                      <td className="px-4 py-2 text-sm data-cell text-right">{row.debit ? `₨${row.debit.toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-2 text-sm data-cell text-right">{row.credit ? `₨${row.credit.toLocaleString()}` : '-'}</td>
                      <td className={cn('px-4 py-2 text-sm data-cell text-right font-medium',
                        row.debit - row.credit >= 0 ? 'text-foreground' : 'text-destructive'
                      )}>₨{(row.debit - row.credit).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td className="px-4 py-2 text-sm font-bold text-foreground" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-sm font-bold data-cell text-right">₨{tbDebitTotal.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm font-bold data-cell text-right">₨{tbCreditTotal.toLocaleString()}</td>
                    <td className={cn('px-4 py-2 text-sm font-bold data-cell text-right',
                      Math.abs(tbDebitTotal - tbCreditTotal) < 0.01 ? 'text-success' : 'text-destructive'
                    )}>
                      {Math.abs(tbDebitTotal - tbCreditTotal) < 0.01 ? '✓ Balanced' : `₨${(tbDebitTotal - tbCreditTotal).toLocaleString()} diff`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TabsContent>

          {/* Chart of Accounts */}
          <TabsContent value="chart-of-accounts" className="space-y-3">
            {accountTypes.map(type => {
              const accounts = trialBalance.filter(r => r.type === type);
              if (accounts.length === 0) return null;
              const groupTotal = accounts.reduce((s, r) => s + (r.debit - r.credit), 0);
              return (
                <div key={type} className="glass-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn('text-sm font-heading font-semibold capitalize',
                      type === 'asset' ? 'text-info' :
                      type === 'liability' ? 'text-warning' :
                      type === 'income' ? 'text-success' :
                      type === 'expense' ? 'text-destructive' : 'text-foreground'
                    )}>{type}s</h3>
                    <span className="text-sm data-cell font-medium text-foreground">₨{Math.abs(groupTotal).toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    {accounts.map((acc, i) => {
                      const net = acc.debit - acc.credit;
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                          <span className="text-sm text-foreground">{acc.accountHead}</span>
                          <span className={cn('text-sm data-cell font-medium', net >= 0 ? 'text-foreground' : 'text-destructive')}>
                            ₨{Math.abs(net).toLocaleString()} {net < 0 ? 'Cr' : 'Dr'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Debtors & Creditors */}
          <TabsContent value="debtors-creditors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-lg p-4">
                <h3 className="text-sm font-heading font-semibold text-info mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Debtors (Receivables)
                </h3>
                {debtors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No debtors found in imported data</p>
                ) : (
                  <div className="space-y-2">
                    {debtors.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                        <span className="text-sm text-foreground">{d.accountHead}</span>
                        <span className="text-sm data-cell font-semibold text-info">₨{(d.debit - d.credit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 px-3 border-t border-border mt-2">
                      <span className="text-sm font-semibold text-foreground">Total Receivables</span>
                      <span className="text-sm data-cell font-bold text-info">₨{debtors.reduce((s, d) => s + d.debit - d.credit, 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="glass-card rounded-lg p-4">
                <h3 className="text-sm font-heading font-semibold text-warning mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Creditors (Payables)
                </h3>
                {creditors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No creditors found in imported data</p>
                ) : (
                  <div className="space-y-2">
                    {creditors.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                        <span className="text-sm text-foreground">{c.accountHead}</span>
                        <span className="text-sm data-cell font-semibold text-warning">₨{(c.credit - c.debit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 px-3 border-t border-border mt-2">
                      <span className="text-sm font-semibold text-foreground">Total Payables</span>
                      <span className="text-sm data-cell font-bold text-warning">₨{creditors.reduce((s, c) => s + c.credit - c.debit, 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
