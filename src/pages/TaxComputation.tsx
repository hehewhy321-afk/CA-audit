import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Nepal Income Tax Rates FY 2081/82
const individualSlabs = [
  { from: 0, to: 500000, rate: 1, label: '1%' },
  { from: 500000, to: 700000, rate: 10, label: '10%' },
  { from: 700000, to: 1000000, rate: 20, label: '20%' },
  { from: 1000000, to: 2000000, rate: 30, label: '30%' },
  { from: 2000000, to: Infinity, rate: 36, label: '36%' },
];

const coupleSlabs = [
  { from: 0, to: 600000, rate: 1, label: '1%' },
  { from: 600000, to: 800000, rate: 10, label: '10%' },
  { from: 800000, to: 1100000, rate: 20, label: '20%' },
  { from: 1100000, to: 2000000, rate: 30, label: '30%' },
  { from: 2000000, to: Infinity, rate: 36, label: '36%' },
];

const corporateRates: Record<string, number> = {
  'general': 25,
  'bank_finance': 30,
  'special_industry': 20,
  'export': 20,
  'cooperative': 15,
  'ngo': 0,
};

// TDS Rates
const tdsRates = [
  { section: '88(1)', description: 'Salary', rate: 'As per slab', threshold: 'N/A' },
  { section: '88(2)', description: 'Interest (Bank deposits)', rate: '5%', threshold: 'N/A' },
  { section: '88(3)', description: 'Natural Resource Royalty', rate: '15%', threshold: 'N/A' },
  { section: '88(4)', description: 'Service Fee', rate: '15%', threshold: '₨25,000+' },
  { section: '87(1)', description: 'Rent (Land/Building/Furniture)', rate: '10%', threshold: 'N/A' },
  { section: '87(2)', description: 'Dividend', rate: '5%', threshold: 'N/A' },
  { section: '87(5)', description: 'Payment for Goods/Services', rate: '1.5%', threshold: '₨50,000+' },
  { section: '87(6)', description: 'Consultancy/Commission', rate: '15%', threshold: '₨25,000+' },
  { section: '87(7)', description: 'Capital Gains (Securities)', rate: '5%/10%', threshold: 'N/A' },
  { section: '87(8)', description: 'Contract/Sub-contract', rate: '1.5%', threshold: '₨50,000+' },
  { section: '87(9)', description: 'Mining', rate: '2%', threshold: 'N/A' },
];

function computeTax(income: number, slabs: typeof individualSlabs): { breakdowns: { range: string; taxable: number; rate: string; tax: number }[]; total: number } {
  const breakdowns: { range: string; taxable: number; rate: string; tax: number }[] = [];
  let remaining = income;
  let total = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.to === Infinity ? remaining : slab.to - slab.from;
    const taxable = Math.min(remaining, slabWidth);
    const tax = taxable * (slab.rate / 100);
    breakdowns.push({
      range: slab.to === Infinity ? `₨${slab.from.toLocaleString()}+` : `₨${slab.from.toLocaleString()} - ₨${slab.to.toLocaleString()}`,
      taxable,
      rate: slab.label,
      tax,
    });
    total += tax;
    remaining -= taxable;
  }

  return { breakdowns, total };
}

export default function TaxComputation() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Tax Computation</h1>
        <p className="text-sm text-muted-foreground mt-1">Nepal income tax calculators & TDS reference</p>
      </div>

      <Tabs defaultValue="individual">
        <TabsList className="bg-muted">
          <TabsTrigger value="individual">Individual Tax</TabsTrigger>
          <TabsTrigger value="corporate">Corporate Tax</TabsTrigger>
          <TabsTrigger value="tds">TDS Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="individual"><IndividualTaxCalc /></TabsContent>
        <TabsContent value="corporate"><CorporateTaxCalc /></TabsContent>
        <TabsContent value="tds"><TDSReference /></TabsContent>
      </Tabs>
    </div>
  );
}

function IndividualTaxCalc() {
  const [income, setIncome] = useState(1500000);
  const [status, setStatus] = useState<'individual' | 'couple'>('individual');
  const [hasSSF, setHasSSF] = useState(false);

  const slabs = status === 'couple' ? coupleSlabs : individualSlabs;
  const ssfDeduction = hasSSF ? Math.min(income * 0.31, 500000) : 0;
  const taxableIncome = Math.max(0, income - ssfDeduction);
  const { breakdowns, total } = useMemo(() => computeTax(taxableIncome, slabs), [taxableIncome, slabs]);
  const effectiveRate = taxableIncome > 0 ? ((total / taxableIncome) * 100).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
      <div className="space-y-3">
        <div className="glass-card rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-heading font-semibold text-foreground">Input</h3>
          <div>
            <Label className="text-xs">Annual Gross Income (₨)</Label>
            <Input type="number" value={income} onChange={e => setIncome(+e.target.value)} className="h-9 data-cell" />
          </div>
          <div>
            <Label className="text-xs">Filing Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={hasSSF} onChange={e => setHasSSF(e.target.checked)} className="rounded" />
            SSF Contribution (31% deduction, max ₨5L)
          </label>
        </div>

        {/* Tax Slab Reference */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-2">FY 2081/82 Slabs ({status === 'couple' ? 'Couple' : 'Individual'})</h3>
          <div className="space-y-1">
            {slabs.map((s, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{s.to === Infinity ? `Above ₨${s.from.toLocaleString()}` : `₨${s.from.toLocaleString()} – ₨${s.to.toLocaleString()}`}</span>
                <span className="data-cell text-foreground font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-heading font-semibold text-foreground">Tax Computation Sheet</h3>

        <div className="space-y-1 border-b border-border pb-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Income</span><span className="data-cell text-foreground">₨{income.toLocaleString()}</span></div>
          {hasSSF && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Less: SSF Deduction</span><span className="data-cell text-destructive">-₨{ssfDeduction.toLocaleString()}</span></div>}
          <div className="flex justify-between text-sm font-medium"><span className="text-foreground">Taxable Income</span><span className="data-cell text-foreground">₨{taxableIncome.toLocaleString()}</span></div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 stat-label">Slab</th>
              <th className="text-right py-1 stat-label">Taxable</th>
              <th className="text-right py-1 stat-label">Rate</th>
              <th className="text-right py-1 stat-label">Tax</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map((b, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1.5 text-xs text-muted-foreground">{b.range}</td>
                <td className="py-1.5 text-xs data-cell text-right text-foreground">₨{b.taxable.toLocaleString()}</td>
                <td className="py-1.5 text-xs data-cell text-right text-foreground">{b.rate}</td>
                <td className="py-1.5 text-xs data-cell text-right text-foreground">₨{b.tax.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-2 border-t border-border space-y-1">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-foreground">Total Tax Liability</span>
            <span className="data-cell text-primary text-lg">₨{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Effective Tax Rate</span>
            <span className="data-cell text-foreground">{effectiveRate}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Monthly Tax</span>
            <span className="data-cell text-foreground">₨{Math.round(total / 12).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorporateTaxCalc() {
  const [income, setIncome] = useState(5000000);
  const [entityType, setEntityType] = useState('general');

  const rate = corporateRates[entityType] || 25;
  const tax = income * (rate / 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
      <div className="glass-card rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-heading font-semibold text-foreground">Input</h3>
        <div>
          <Label className="text-xs">Taxable Profit (₨)</Label>
          <Input type="number" value={income} onChange={e => setIncome(+e.target.value)} className="h-9 data-cell" />
        </div>
        <div>
          <Label className="text-xs">Entity Type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Company (25%)</SelectItem>
              <SelectItem value="bank_finance">Bank/Finance (30%)</SelectItem>
              <SelectItem value="special_industry">Special Industry (20%)</SelectItem>
              <SelectItem value="export">Export-oriented (20%)</SelectItem>
              <SelectItem value="cooperative">Cooperative (15%)</SelectItem>
              <SelectItem value="ngo">NGO/Non-profit (0%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-heading font-semibold text-foreground">Corporate Tax Computation</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxable Profit</span><span className="data-cell text-foreground">₨{income.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax Rate</span><span className="data-cell text-foreground">{rate}%</span></div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
            <span className="text-foreground">Corporate Tax</span>
            <span className="data-cell text-primary text-lg">₨{tax.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="stat-label mb-2">All Corporate Rates (FY 2081/82)</h4>
          <div className="space-y-1">
            {Object.entries(corporateRates).map(([k, v]) => (
              <div key={k} className={cn('flex justify-between text-xs px-2 py-1 rounded', k === entityType ? 'bg-primary/10' : '')}>
                <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="data-cell text-foreground">{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TDSReference() {
  return (
    <div className="glass-card rounded-lg mt-3">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-heading font-semibold text-foreground">TDS Rates — Income Tax Act 2058</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {['Section', 'Nature of Payment', 'TDS Rate', 'Threshold'].map(h => (
              <th key={h} className="text-left px-4 py-2 stat-label">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tdsRates.map((r, i) => (
            <tr key={i} className="hover:bg-accent/30 transition-colors">
              <td className="px-4 py-2.5 text-xs data-cell text-primary">{r.section}</td>
              <td className="px-4 py-2.5 text-sm text-foreground">{r.description}</td>
              <td className="px-4 py-2.5 text-sm data-cell font-medium text-foreground">{r.rate}</td>
              <td className="px-4 py-2.5 text-xs data-cell text-muted-foreground">{r.threshold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
