import { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Bot, Cpu, Upload, Play, Trash2, FileSpreadsheet, FileText, Image,
  CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp,
  Download, Eye, X, Clock, Zap, Shield, RefreshCw, Save, FlaskConical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

// ─── Audit Rule Chips ───────────────────────────────────
const AUDIT_RULES = [
  { id: 'duplicate_detection', label: 'Duplicate Detection', desc: 'Find duplicate entries by amount, date, or description', category: 'Data Integrity' },
  { id: 'missing_entries', label: 'Missing Entries', desc: 'Detect gaps in sequential numbering or dates', category: 'Data Integrity' },
  { id: 'amount_threshold', label: 'Amount Threshold', desc: 'Flag transactions exceeding materiality threshold', category: 'Materiality' },
  { id: 'date_sequence', label: 'Date Sequence Errors', desc: 'Identify out-of-order or future-dated entries', category: 'Data Integrity' },
  { id: 'unbalanced_entries', label: 'Unbalanced Entries', desc: 'Detect debit/credit mismatches', category: 'Accuracy' },
  { id: 'tax_compliance', label: 'Tax Compliance (ITA 2058)', desc: 'Check TDS rates, VAT calculations, PAN validity', category: 'Compliance' },
  { id: 'revenue_recognition', label: 'Revenue Recognition', desc: 'Verify revenue timing and classification per NFRS', category: 'NFRS' },
  { id: 'expense_classification', label: 'Expense Classification', desc: 'Validate expense categorization and approvals', category: 'Classification' },
  { id: 'bank_reconciliation', label: 'Bank Reconciliation', desc: 'Match bank statements against book entries', category: 'Reconciliation' },
  { id: 'intercompany', label: 'Intercompany Transactions', desc: 'Flag intercompany balances and eliminations', category: 'Related Party' },
  { id: 'related_party', label: 'Related Party Transactions', desc: 'Identify related party dealings per NAS', category: 'Related Party' },
  { id: 'round_numbers', label: 'Round Number Detection', desc: 'Flag suspiciously round amounts (fraud indicator)', category: 'Forensic' },
  { id: 'benfords_law', label: "Benford's Law Analysis", desc: 'Statistical analysis of leading digit distribution', category: 'Forensic' },
  { id: 'weekend_holiday', label: 'Weekend/Holiday Transactions', desc: 'Flag entries on non-business days', category: 'Forensic' },
  { id: 'sequential_gaps', label: 'Sequential Gap Detection', desc: 'Find missing voucher/invoice numbers', category: 'Data Integrity' },
  { id: 'depreciation_check', label: 'Depreciation Check', desc: 'Verify depreciation rates per Companies Act', category: 'Compliance' },
  { id: 'provision_adequacy', label: 'Provision Adequacy', desc: 'Check provisions for doubtful debts, warranties', category: 'Valuation' },
  { id: 'cutoff_testing', label: 'Cut-off Testing', desc: 'Verify transactions near period-end boundaries', category: 'Timing' },
];

const RULE_CATEGORIES = [...new Set(AUDIT_RULES.map(r => r.category))];

const severityConfig: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  high: { color: 'bg-warning/15 text-warning border-warning/30', icon: AlertTriangle },
  medium: { color: 'bg-info/15 text-info border-info/30', icon: Info },
  low: { color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

export default function SmartAudit() {
  const { state } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'auto' | 'ai'>('auto');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [customRule, setCustomRule] = useState('');
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [clientId, setClientId] = useState('');
  const [engagementId, setEngagementId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [params, setParams] = useState({ materiality: 100000, tolerance: 5, fiscal_year: '2081/82' });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [resultsMode, setResultsMode] = useState<'auto' | 'ai'>('auto');
  const [sessions, setSessions] = useState<any[]>([]);
  const [viewSession, setViewSession] = useState<any>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load past sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('smart_audit_sessions')
      .select('*')
      .eq('ca_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSessions(data);
  }, [user]);

  useState(() => { loadSessions(); });

  const toggleRule = (id: string) => {
    setSelectedRules(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedRules(AUDIT_RULES.map(r => r.id));
  const clearAll = () => { setSelectedRules([]); setCustomRules([]); };

  const addCustomRule = () => {
    if (customRule.trim() && !customRules.includes(customRule.trim())) {
      setCustomRules(prev => [...prev, customRule.trim()]);
      setCustomRule('');
    }
  };

  // ─── Demo Data ────────────────────────────────────────
  const DEMO_CSV_LEDGER = `Voucher No,Date,Particulars,Debit,Credit,Account Head
V001,2081-04-01,Opening Balance - Cash,500000,0,Cash
V002,2081-04-03,Purchase of Office Supplies,15000,0,Office Expenses
V003,2081-04-03,Purchase of Office Supplies,15000,0,Office Expenses
V004,2081-04-05,Received from Debtors,0,250000,Accounts Receivable
V005,2081-04-07,Salary Payment - Baishakh,180000,0,Salary Expense
V006,2081-04-10,Rent Payment,50000,0,Rent Expense
V007,2081-04-12,Sales Revenue,0,320000,Sales
V008,2081-04-15,Purchase of Raw Materials,200000,0,Raw Materials
V009,2081-04-18,Electricity Bill,8500,0,Utilities
V010,2081-04-20,Phone Bill Payment,3500,0,Utilities
V012,2081-04-25,Insurance Premium,100000,0,Insurance
V013,2081-04-28,Bank Interest Received,0,12000,Interest Income
V014,2081-05-01,Sales Revenue,0,450000,Sales
V015,2081-05-03,Raw Material Purchase,175000,0,Raw Materials
V016,2081-05-05,Salary Payment - Jestha,180000,0,Salary Expense
V017,2081-05-07,Vehicle Repair,25000,0,Vehicle Expenses
V018,2081-05-10,Advertising Expense,60000,0,Marketing
V019,2081-05-12,Loan EMI Payment,80000,0,Loan Repayment
V020,2081-05-15,Sales Revenue - Cash,0,200000,Sales
V021,2081-05-18,Stationery Purchase,5000,0,Office Expenses
V022,2081-05-20,Consultation Fee Paid,50000,0,Professional Fees
V023,2081-05-22,Sales Return,30000,0,Sales Return
V024,2081-05-25,TDS Deposited,18000,0,TDS Payable
V025,2081-05-28,VAT Payment,65000,0,VAT Payable
V026,2081-06-01,Sales Revenue,0,380000,Sales
V027,2081-06-03,Salary Payment - Ashadh,180000,0,Salary Expense
V028,2081-06-05,Office Furniture Purchase,150000,0,Furniture
V029,2081-06-08,Sundry Debtors Collection,0,100000,Accounts Receivable
V030,2081-06-10,Telephone Expense,4000,0,Utilities
V031,2081-06-12,Donation to Charity,50000,0,Donation
V032,2081-06-14,Sales - Related Party (ABC Pvt Ltd),0,500000,Sales
V033,2081-06-15,Purchase from Related Party (XYZ Ltd),300000,0,Purchases
V034,2081-06-18,Interest on Loan,12000,0,Interest Expense
V035,2081-06-20,Depreciation - Machinery,45000,0,Depreciation
V036,2081-06-22,Audit Fee Provision,0,75000,Provisions
V037,2081-06-25,Cash Withdrawal,100000,0,Cash
V038,2081-06-28,Year-end Adjustment,50000,0,Adjustments
V039,2081-06-29,Saturday Transaction - Salary Advance,20000,0,Advances
V040,2081-06-30,Closing Adjustment Entry,0,15000,Adjustments`;

  const DEMO_CSV_BANK = `Date,Description,Debit,Credit,Balance,Cheque No
2081-04-01,Opening Balance,0,0,1250000,
2081-04-05,Cheque Deposit - Debtors,0,250000,1500000,CHQ-4401
2081-04-07,Salary Transfer - Baishakh,180000,0,1320000,
2081-04-10,Rent Payment - Cheque,50000,0,1270000,CHQ-4402
2081-04-15,Raw Material Payment,200000,0,1070000,CHQ-4403
2081-04-25,Insurance Premium,100000,0,970000,CHQ-4404
2081-04-28,Interest Credit,0,12000,982000,
2081-05-03,Material Purchase,175000,0,807000,CHQ-4405
2081-05-05,Salary Transfer - Jestha,180000,0,627000,
2081-05-10,Advertisement Payment,60000,0,567000,CHQ-4406
2081-05-12,EMI Debit,80000,0,487000,
2081-05-15,Cash Deposit - Sales,0,200000,687000,
2081-05-20,Consultation Fee,50000,0,637000,CHQ-4407
2081-05-24,TDS Payment,18000,0,619000,
2081-05-25,VAT Payment,65000,0,554000,
2081-06-01,Sales Deposit,0,380000,934000,
2081-06-03,Salary Transfer - Ashadh,180000,0,754000,
2081-06-05,Furniture Purchase,150000,0,604000,CHQ-4408
2081-06-08,Debtor Collection,0,100000,704000,
2081-06-14,Related Party Receipt,0,500000,1204000,
2081-06-18,Loan Interest,12000,0,1192000,
2081-06-25,Cash Withdrawal,100000,0,1092000,
2081-06-30,Service Charges,1500,0,1090500,`;

  const loadDemoFiles = () => {
    const ledgerBlob = new Blob([DEMO_CSV_LEDGER], { type: 'text/csv' });
    const bankBlob = new Blob([DEMO_CSV_BANK], { type: 'text/csv' });
    const ledgerFile = new File([ledgerBlob], 'demo_general_ledger_2081.csv', { type: 'text/csv' });
    const bankFile = new File([bankBlob], 'demo_bank_statement_2081.csv', { type: 'text/csv' });
    setFiles([ledgerFile, bankFile]);
    setSelectedRules(['duplicate_detection', 'amount_threshold', 'sequential_gaps', 'round_numbers', 'benfords_law', 'unbalanced_entries', 'weekend_holiday', 'related_party']);
    setParams({ materiality: 100000, tolerance: 5, fiscal_year: '2081/82' });
    setActiveTab('auto');
    toast({ title: 'Demo loaded', description: '2 sample files + 8 audit rules pre-selected. Hit "Run Auto Audit" to test!' });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const maxFiles = activeTab === 'auto' ? 20 : 50;
    const validExts = activeTab === 'auto'
      ? ['.xlsx', '.xls', '.csv']
      : ['.xlsx', '.xls', '.csv', '.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx'];

    const filtered = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!validExts.includes(ext)) {
        toast({ title: 'Invalid file type', description: `${f.name} is not supported in ${activeTab === 'auto' ? 'Auto' : 'AI'} Audit mode.`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    if (files.length + filtered.length > maxFiles) {
      toast({ title: 'Too many files', description: `Maximum ${maxFiles} files allowed.`, variant: 'destructive' });
      return;
    }
    setFiles(prev => [...prev, ...filtered]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(`[Could not read: ${file.name}]`);
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const runAudit = async () => {
    if (!user) return;
    if (selectedRules.length === 0 && customRules.length === 0) {
      toast({ title: 'No rules selected', description: 'Please select at least one audit rule.', variant: 'destructive' });
      return;
    }
    if (files.length === 0) {
      toast({ title: 'No files', description: 'Please upload at least one file.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setResults(null);

    try {
      const allRuleLabels = [
        ...selectedRules.map(id => AUDIT_RULES.find(r => r.id === id)?.label || id),
        ...customRules,
      ];

      // Create session record
      const { data: session, error: sessErr } = await supabase
        .from('smart_audit_sessions')
        .insert({
          ca_user_id: user.id,
          client_id: clientId || null,
          engagement_id: engagementId || null,
          mode: activeTab,
          name: `Smart Audit - ${activeTab === 'auto' ? 'Auto' : 'AI'} - ${new Date().toLocaleDateString()}`,
          rules: allRuleLabels,
          parameters: params,
          file_names: files.map(f => f.name),
          status: 'pending',
        } as any)
        .select()
        .single();

      if (sessErr) throw sessErr;

      // Read file contents
      const fileContents = await Promise.all(
        files.map(async (f) => {
          const ext = f.name.split('.').pop()?.toLowerCase() || '';
          if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
            // For binary files, send base64 with a note
            const b64 = await readFileAsBase64(f);
            return { name: f.name, content: `[BASE64 ${ext.toUpperCase()} file - analyze visually]\ndata:${f.type};base64,${b64.substring(0, 30000)}` };
          }
          const text = await readFileAsText(f);
          return { name: f.name, content: text };
        })
      );

      // Upload files to storage
      for (const f of files) {
        const path = `${user.id}/${session.id}/${f.name}`;
        await supabase.storage.from('smart-audit-files').upload(path, f);
      }

      if (activeTab === 'auto') {
        // Auto audit: rule-based processing (client-side for Excel/CSV)
        const autoResults = runAutoAudit(fileContents, allRuleLabels, params);

        await supabase
          .from('smart_audit_sessions')
          .update({ status: 'completed', results: autoResults, summary: autoResults.summary?.key_observations || 'Auto audit completed' } as any)
          .eq('id', session.id);

        setResults(autoResults);
        setResultsMode('auto');
        setShowResultsDialog(true);
        toast({ title: 'Auto Audit Complete', description: `Found ${autoResults.findings?.length || 0} findings.` });
      } else {
        // AI audit: send to edge function
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('ai-audit', {
          body: {
            sessionId: session.id,
            mode: 'ai',
            rules: allRuleLabels,
            parameters: params,
            fileContents,
          },
        });

        if (fnErr) throw fnErr;
        if (fnData?.error) throw new Error(fnData.error);

        setResults(fnData.results);
        setResultsMode('ai');
        setShowResultsDialog(true);
        toast({ title: 'AI Audit Complete', description: `Found ${fnData.results?.findings?.length || 0} findings.` });
      }

      loadSessions();
    } catch (err: any) {
      console.error('Audit error:', err);
      toast({ title: 'Audit Failed', description: err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const saveToReport = async () => {
    if (!results || !user) return;
    const client = state.clients.find((c: any) => c.id === clientId);

    const reportContent = `SMART AUDIT REPORT
${'='.repeat(60)}
Mode: ${activeTab === 'auto' ? 'Auto Audit (Rule-Based)' : 'AI Audit (AI-Powered)'}
Client: ${client?.name || 'N/A'}
Date: ${new Date().toLocaleDateString()}
Compliance Score: ${results.compliance_score || 'N/A'}%

EXECUTIVE SUMMARY
${'-'.repeat(40)}
${results.summary?.key_observations || 'No summary available'}

FINDINGS (${results.findings?.length || 0})
${'-'.repeat(40)}
${(results.findings || []).map((f: any, i: number) =>
  `${i + 1}. [${(f.severity || 'medium').toUpperCase()}] ${f.title || f.rule}
   Rule: ${f.rule}
   Description: ${f.description}
   Affected: ${f.affected_items || 'N/A'}
   Impact: NPR ${f.amount_impact || 'N/A'}
   Recommendation: ${f.recommendation}`
).join('\n\n')}

STATISTICS
${'-'.repeat(40)}
Items Reviewed: ${results.summary?.total_items_reviewed || 'N/A'}
Critical: ${results.summary?.critical_count || 0}
High: ${results.summary?.high_count || 0}
Medium: ${results.summary?.medium_count || 0}
Low: ${results.summary?.low_count || 0}
Overall Risk: ${results.summary?.overall_risk_rating || 'N/A'}
`;

    try {
      await supabase.from('generated_reports').insert({
        ca_user_id: user.id,
        client_id: clientId || state.clients[0]?.id,
        engagement_id: engagementId || null,
        type: 'audit_report',
        title: `Smart Audit Report - ${client?.name || 'General'} - ${new Date().toLocaleDateString()}`,
        content: reportContent,
        status: 'draft',
        generated_by: 'Smart Audit Engine',
      });
      toast({ title: 'Report Saved', description: 'Smart Audit report saved to Reports section.' });
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  };

  const toggleFinding = (idx: number) => {
    setExpandedFindings(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Smart Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered and rule-based automated audit analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="gap-1.5" onClick={loadDemoFiles}>
            <FlaskConical className="h-3.5 w-3.5" /> Try Demo
          </Button>
          <Button variant="outline" size="sm" onClick={loadSessions}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> History
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'auto' | 'ai'); setFiles([]); setResults(null); }}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="auto" className="gap-2">
            <Cpu className="h-4 w-4" /> Auto Audit
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" /> AI Audit
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Configuration (now wider) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mode info banner */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3 px-4">
                {activeTab === 'auto' ? (
                  <div className="flex items-start gap-3">
                    <Cpu className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto Audit — Rule-Based Engine</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Processes Excel/CSV files using deterministic rules. Supports up to 20 files per session.
                        Best for structured financial data with predictable patterns.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">AI Audit — AI-Powered Analysis</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Accepts any format: Excel, CSV, PDF, images, documents. Uses AI to interpret and analyze.
                        Best for unstructured data, scanned documents, and complex analysis.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client & Engagement */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-heading">Audit Scope</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {state.clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Engagement (optional)</Label>
                    <Select value={engagementId} onValueChange={setEngagementId}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select engagement" /></SelectTrigger>
                      <SelectContent>
                        {state.engagements
                          .filter((e: any) => !clientId || e.client_id === clientId)
                          .map((e: any) => {
                            const cl = state.clients.find((c: any) => c.id === e.client_id);
                            return <SelectItem key={e.id} value={e.id}>{cl?.name} — FY {e.fiscal_year}</SelectItem>;
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Materiality (₨)</Label>
                    <Input type="number" className="h-9" value={params.materiality}
                      onChange={e => setParams(p => ({ ...p, materiality: +e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Tolerance (%)</Label>
                    <Input type="number" min={0} max={100} className="h-9" value={params.tolerance}
                      onChange={e => setParams(p => ({ ...p, tolerance: +e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Fiscal Year</Label>
                    <Input className="h-9" value={params.fiscal_year}
                      onChange={e => setParams(p => ({ ...p, fiscal_year: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Rules — compact button to open dialog */}
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-medium text-foreground">Audit Rules & Conditions</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedRules.length + customRules.length === 0
                        ? 'No rules selected — click to configure'
                        : `${selectedRules.length} standard + ${customRules.length} custom rules selected`}
                    </p>
                    {(selectedRules.length > 0 || customRules.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRules.slice(0, 4).map(id => {
                          const rule = AUDIT_RULES.find(r => r.id === id);
                          return (
                            <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                              {rule?.label}
                            </span>
                          );
                        })}
                        {selectedRules.length + customRules.length > 4 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{selectedRules.length + customRules.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0 ml-3" onClick={() => setShowRulesDialog(true)}>
                    <Shield className="h-3.5 w-3.5" /> Configure Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rules Dialog */}
            <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center justify-between pr-6">
                    <span>Audit Rules & Conditions</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>Select All</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>Clear</Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  {RULE_CATEGORIES.map(cat => (
                    <div key={cat}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {AUDIT_RULES.filter(r => r.category === cat).map(rule => {
                          const active = selectedRules.includes(rule.id);
                          return (
                            <button
                              key={rule.id}
                              onClick={() => toggleRule(rule.id)}
                              title={rule.desc}
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                                active
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                              )}
                            >
                              {active && <CheckCircle2 className="h-3 w-3" />}
                              {rule.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Custom Rules</p>
                    <div className="flex gap-2 mb-2">
                      <Input placeholder="Add a custom audit rule..." className="h-8 text-xs" value={customRule}
                        onChange={e => setCustomRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomRule()} />
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addCustomRule}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customRules.map((cr, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-border">
                          {cr}
                          <button onClick={() => setCustomRules(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button size="sm" onClick={() => setShowRulesDialog(false)}>
                      Done ({selectedRules.length + customRules.length} rules)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* File Upload */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-heading flex items-center justify-between">
                  <span>Upload Files</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {files.length}/{activeTab === 'auto' ? 20 : 50} files
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag files here
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {activeTab === 'auto'
                      ? 'Supports: .xlsx, .xls, .csv (max 20 files)'
                      : 'Supports: Excel, CSV, PDF, Images, Documents (max 50 files)'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={activeTab === 'auto'
                      ? '.xlsx,.xls,.csv'
                      : '.xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.txt,.doc,.docx'}
                    onChange={handleFiles}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {files.map((f, i) => {
                      const ext = f.name.split('.').pop()?.toLowerCase() || '';
                      const Icon = ['jpg', 'jpeg', 'png'].includes(ext) ? Image
                        : ['pdf'].includes(ext) ? FileText : FileSpreadsheet;
                      return (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/50 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1 text-foreground">{f.name}</span>
                          <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                          <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Run button */}
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={processing || files.length === 0 || (selectedRules.length === 0 && customRules.length === 0)}
              onClick={runAudit}
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {activeTab === 'auto' ? 'Running Auto Audit...' : 'AI is Analyzing...'}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run {activeTab === 'auto' ? 'Auto' : 'AI'} Audit
                </>
              )}
            </Button>
          </div>

          {/* Right Column: History only */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No audit sessions yet</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {sessions.map((s: any) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-2.5 py-2 rounded-md bg-muted/50 hover:bg-accent/50 transition-colors"
                        onClick={() => {
                          if (s.results) {
                            setResults(s.results);
                            setResultsMode(s.mode === 'ai' ? 'ai' : 'auto');
                            setExpandedFindings(new Set());
                            setShowResultsDialog(true);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground truncate">{s.name}</span>
                          <Badge variant={s.status === 'completed' ? 'default' : s.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                            {s.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] h-4",
                            s.mode === 'ai' ? 'border-primary/40 text-primary' : ''
                          )}>
                            {s.mode === 'ai' ? '🤖 AI' : '⚙️ Auto'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      {/* ─── Results Dialog with Charts ─── */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              <div className="flex items-center justify-between pr-6">
                <span className="flex items-center gap-2">
                  {resultsMode === 'ai' ? <Bot className="h-5 w-5 text-primary" /> : <Cpu className="h-5 w-5 text-primary" />}
                  {resultsMode === 'ai' ? 'AI Audit Results' : 'Auto Audit Results'}
                  <Badge variant={resultsMode === 'ai' ? 'default' : 'secondary'} className="text-[10px] h-5 ml-1">
                    {resultsMode === 'ai' ? '🤖 AI-Powered' : '⚙️ Rule-Based'}
                  </Badge>
                </span>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={saveToReport}>
                  <Save className="h-3 w-3" /> Save to Reports
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {results && (
            <div className="space-y-5 mt-2">
              {/* Mode Info Banner */}
              <div className={cn(
                'rounded-lg p-3 border flex items-center gap-3',
                resultsMode === 'ai'
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-muted/50 border-border'
              )}>
                {resultsMode === 'ai' ? (
                  <>
                    <Bot className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Generated by AI Engine</p>
                      <p className="text-xs text-muted-foreground">This analysis was performed by AI using advanced pattern recognition and Nepal-specific compliance knowledge (ITA 2058, NFRS, NAS).</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Cpu className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Generated by Rule-Based Engine</p>
                      <p className="text-xs text-muted-foreground">This analysis was performed using deterministic rules on structured CSV/Excel data. Results are based on pattern matching only.</p>
                    </div>
                  </>
                )}
              </div>
              {/* Top: Score + Severity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {results.compliance_score != null && (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30 border border-border">
                    <div className={cn(
                      'inline-flex items-center justify-center h-20 w-20 rounded-full border-4 text-2xl font-bold',
                      results.compliance_score >= 80 ? 'border-success text-success' :
                        results.compliance_score >= 60 ? 'border-warning text-warning' : 'border-destructive text-destructive'
                    )}>
                      {results.compliance_score}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Compliance Score</p>
                  </div>
                )}
                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Critical', count: results.summary?.critical_count || 0, color: 'text-destructive', bg: 'bg-destructive/10' },
                    { label: 'High', count: results.summary?.high_count || 0, color: 'text-warning', bg: 'bg-warning/10' },
                    { label: 'Medium', count: results.summary?.medium_count || 0, color: 'text-info', bg: 'bg-info/10' },
                    { label: 'Low', count: results.summary?.low_count || 0, color: 'text-muted-foreground', bg: 'bg-muted/50' },
                  ].map(s => (
                    <div key={s.label} className={cn('rounded-lg p-3 text-center border border-border', s.bg)}>
                      <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Severity Pie */}
                <Card>
                  <CardHeader className="py-2 px-4"><CardTitle className="text-xs font-heading">Severity Distribution</CardTitle></CardHeader>
                  <CardContent className="px-2 pb-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Critical', value: results.summary?.critical_count || 0 },
                            { name: 'High', value: results.summary?.high_count || 0 },
                            { name: 'Medium', value: results.summary?.medium_count || 0 },
                            { name: 'Low', value: results.summary?.low_count || 0 },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                          dataKey="value" paddingAngle={3}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="hsl(0 84% 60%)" />
                          <Cell fill="hsl(38 92% 50%)" />
                          <Cell fill="hsl(217 91% 60%)" />
                          <Cell fill="hsl(215 20% 65%)" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Findings by Rule Bar */}
                <Card>
                  <CardHeader className="py-2 px-4"><CardTitle className="text-xs font-heading">Findings by Rule</CardTitle></CardHeader>
                  <CardContent className="px-2 pb-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={(() => {
                          const ruleCounts: Record<string, number> = {};
                          (results.findings || []).forEach((f: any) => {
                            const rule = f.rule || 'Unknown';
                            ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
                          });
                          return Object.entries(ruleCounts)
                            .map(([rule, count]) => ({ rule: rule.length > 20 ? rule.substring(0, 20) + '…' : rule, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 8);
                        })()}
                        layout="vertical"
                        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 25%)" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215 20% 65%)' }} />
                        <YAxis type="category" dataKey="rule" width={130} tick={{ fontSize: 10, fill: 'hsl(215 20% 65%)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(215 20% 25%)', borderRadius: 8, fontSize: 12, color: 'hsl(210 40% 98%)' }} />
                        <Bar dataKey="count" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Summary */}
              {results.summary?.key_observations && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">Executive Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{results.summary.key_observations}</p>
                  {results.summary?.total_items_reviewed && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Items reviewed: {results.summary.total_items_reviewed} · Overall risk: <span className="font-medium capitalize">{results.summary.overall_risk_rating}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Findings */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{results.findings?.length || 0} Findings</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(results.findings || []).map((f: any, i: number) => {
                    const sev = severityConfig[f.severity] || severityConfig.medium;
                    const SevIcon = sev.icon;
                    const expanded = expandedFindings.has(i);
                    return (
                      <div key={i} className={cn('rounded-md border p-3', sev.color)}>
                        <button className="w-full text-left flex items-start gap-2" onClick={() => toggleFinding(i)}>
                          <SevIcon className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{f.title || f.rule}</p>
                            <p className="text-xs opacity-70">{f.rule}</p>
                          </div>
                          {f.amount_impact && <span className="text-xs font-mono shrink-0">₨{Number(f.amount_impact).toLocaleString()}</span>}
                          {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                        </button>
                        {expanded && (
                          <div className="mt-2 ml-6 space-y-1.5 text-sm">
                            <p>{f.description}</p>
                            {f.affected_items && <p><strong>Affected:</strong> {f.affected_items}</p>}
                            {f.amount_impact && <p><strong>Impact:</strong> ₨ {Number(f.amount_impact).toLocaleString()}</p>}
                            {f.recommendation && <p className="text-primary"><strong>Recommendation:</strong> {f.recommendation}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Auto Audit Engine (Client-Side Rule Processing) ────
function runAutoAudit(
  fileContents: { name: string; content: string }[],
  rules: string[],
  params: { materiality: number; tolerance: number; fiscal_year: string }
): any {
  const findings: any[] = [];
  let totalItems = 0;

  for (const file of fileContents) {
    const lines = file.content.split('\n').filter(l => l.trim());
    if (lines.length < 2) continue;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(l => {
      const vals = l.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    });
    totalItems += rows.length;

    // Amount column detection
    const amtCol = headers.find(h => /amount|total|debit|credit|value|sum/i.test(h)) || '';
    const dateCol = headers.find(h => /date|time/i.test(h)) || '';
    const descCol = headers.find(h => /desc|particular|narration|detail/i.test(h)) || '';
    const numCol = headers.find(h => /number|no|num|voucher|invoice/i.test(h)) || '';

    const amounts = rows.map(r => parseFloat(r[amtCol]) || 0);

    // Rule: Duplicate Detection
    if (rules.some(r => /duplicate/i.test(r))) {
      const seen = new Map<string, number[]>();
      rows.forEach((r, i) => {
        const key = `${r[amtCol]}-${r[dateCol]}-${r[descCol]}`;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(i + 2);
      });
      seen.forEach((indices, key) => {
        if (indices.length > 1) {
          findings.push({
            rule: 'Duplicate Detection', severity: 'high', title: `Duplicate entries found in ${file.name}`,
            description: `${indices.length} identical entries found with matching amount, date, and description.`,
            affected_items: `Rows: ${indices.join(', ')}`, recommendation: 'Review and remove duplicate entries.', amount_impact: null
          });
        }
      });
    }

    // Rule: Amount Threshold
    if (rules.some(r => /threshold|materiality/i.test(r))) {
      rows.forEach((r, i) => {
        const amt = parseFloat(r[amtCol]) || 0;
        if (Math.abs(amt) > params.materiality) {
          findings.push({
            rule: 'Amount Threshold', severity: 'medium', title: `Amount exceeds materiality in ${file.name}`,
            description: `Row ${i + 2}: Amount ₨${amt.toLocaleString()} exceeds materiality threshold of ₨${params.materiality.toLocaleString()}.`,
            affected_items: `Row ${i + 2}: ${r[descCol] || 'N/A'}`, recommendation: 'Perform detailed substantive testing.', amount_impact: amt
          });
        }
      });
    }

    // Rule: Round Numbers
    if (rules.some(r => /round/i.test(r))) {
      let roundCount = 0;
      rows.forEach((r) => {
        const amt = parseFloat(r[amtCol]) || 0;
        if (amt > 1000 && amt % 1000 === 0) roundCount++;
      });
      if (roundCount > rows.length * 0.3) {
        findings.push({
          rule: 'Round Number Detection', severity: 'medium', title: `High frequency of round numbers in ${file.name}`,
          description: `${roundCount} of ${rows.length} entries (${((roundCount / rows.length) * 100).toFixed(1)}%) are round numbers. This exceeds the 30% threshold.`,
          affected_items: `${roundCount} entries`, recommendation: 'Investigate for potential manipulation or estimation.', amount_impact: null
        });
      }
    }

    // Rule: Sequential Gaps
    if (rules.some(r => /sequential|gap|missing/i.test(r)) && numCol) {
      const nums = rows.map(r => parseInt(r[numCol])).filter(n => !isNaN(n)).sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] - nums[i - 1] > 1) {
          for (let g = nums[i - 1] + 1; g < nums[i]; g++) gaps.push(g);
        }
      }
      if (gaps.length > 0) {
        findings.push({
          rule: 'Sequential Gap Detection', severity: 'high', title: `Missing sequence numbers in ${file.name}`,
          description: `${gaps.length} gaps found in sequential numbering.`,
          affected_items: `Missing: ${gaps.slice(0, 20).join(', ')}${gaps.length > 20 ? '...' : ''}`,
          recommendation: 'Investigate missing vouchers/invoices for completeness.', amount_impact: null
        });
      }
    }

    // Rule: Benford's Law
    if (rules.some(r => /benford/i.test(r))) {
      const benfordExpected = [0, 30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];
      const digitCounts = new Array(10).fill(0);
      let validCount = 0;
      amounts.forEach(a => {
        if (Math.abs(a) >= 10) {
          const firstDigit = parseInt(String(Math.abs(a))[0]);
          if (firstDigit >= 1 && firstDigit <= 9) { digitCounts[firstDigit]++; validCount++; }
        }
      });
      if (validCount > 50) {
        let deviation = 0;
        for (let d = 1; d <= 9; d++) {
          const actual = (digitCounts[d] / validCount) * 100;
          deviation += Math.abs(actual - benfordExpected[d]);
        }
        if (deviation > 15) {
          findings.push({
            rule: "Benford's Law Analysis", severity: deviation > 30 ? 'critical' : 'high',
            title: `Digit distribution anomaly in ${file.name}`,
            description: `Leading digit distribution deviates from Benford's Law by ${deviation.toFixed(1)}%. This may indicate data manipulation.`,
            affected_items: `${validCount} amounts analyzed`, recommendation: 'Perform forensic analysis on the dataset.', amount_impact: null
          });
        }
      }
    }

    // Rule: Unbalanced Entries
    if (rules.some(r => /unbalanced|balance/i.test(r))) {
      const debitCol = headers.find(h => /debit/i.test(h));
      const creditCol = headers.find(h => /credit/i.test(h));
      if (debitCol && creditCol) {
        const totalDebit = rows.reduce((s, r) => s + (parseFloat(r[debitCol]) || 0), 0);
        const totalCredit = rows.reduce((s, r) => s + (parseFloat(r[creditCol]) || 0), 0);
        const diff = Math.abs(totalDebit - totalCredit);
        if (diff > params.tolerance) {
          findings.push({
            rule: 'Unbalanced Entries', severity: diff > params.materiality ? 'critical' : 'high',
            title: `Debit/Credit imbalance in ${file.name}`,
            description: `Total debits (₨${totalDebit.toLocaleString()}) differ from credits (₨${totalCredit.toLocaleString()}) by ₨${diff.toLocaleString()}.`,
            affected_items: 'All entries', recommendation: 'Identify and correct the balancing difference.', amount_impact: diff
          });
        }
      }
    }
  }

  // Classify counts
  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const low = findings.filter(f => f.severity === 'low').length;
  const total = findings.length;
  const score = Math.max(0, 100 - (critical * 20 + high * 10 + medium * 5 + low * 2));
  const risk = critical > 0 ? 'critical' : high > 2 ? 'high' : medium > 5 ? 'medium' : 'low';

  return {
    findings,
    summary: {
      total_items_reviewed: totalItems,
      total_findings: total,
      critical_count: critical,
      high_count: high,
      medium_count: medium,
      low_count: low,
      overall_risk_rating: risk,
      key_observations: total === 0
        ? `Auto audit completed with no findings across ${totalItems} items.`
        : `Auto audit identified ${total} finding(s) across ${totalItems} items. ${critical > 0 ? `${critical} critical issue(s) require immediate attention. ` : ''}Overall compliance score: ${score}/100.`,
    },
    compliance_score: score,
  };
}
