import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Receipt, Plus, Trash2, MessageCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { exportInvoiceAsPdfProgrammatic } from '@/lib/pdfExport';

const statusColors: Record<string, string> = {
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  partial: 'bg-info/15 text-info',
  overdue: 'bg-destructive/15 text-destructive',
};

export default function Invoices() {
  const { state, addItem, updateItem } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const totalInvoiced = state.invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
  const totalPaid = state.invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.paid_amount || i.total || 0), 0);
  const totalPending = state.invoices.filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + (Number(i.total || 0) - Number(i.paid_amount || 0)), 0);

  const sendWA = (inv: any) => {
    const client = state.clients.find((c: any) => c.id === inv.client_id);
    if (!client?.phone) { toast.error('Client has no phone number'); return; }
    const phone = (client.phone || '').replace(/[^0-9]/g, '');
    const firmName = state.caSettings?.firm_name || 'Our Firm';
    const msg = encodeURIComponent(
      `Dear ${client.contact_person || client.name},\n\nThis is a fee invoice from ${firmName}.\n\nInvoice #: ${inv.invoice_number}\nAmount: NPR ${Number(inv.total).toLocaleString()}\nDue Date: ${inv.due_date}\n\nPlease arrange payment via bank transfer or eSewa/Khalti.\n\nThank you,\n${firmName}`
    );
    window.open(`https://wa.me/977${phone}?text=${msg}`, '_blank');
    if (inv.status === 'pending') updateItem('invoices', inv.id, { status: 'pending' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{state.invoices.length} invoices</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Create Invoice</DialogTitle></DialogHeader>
            <InvoiceForm clients={state.clients} onSave={async (data: any) => { await addItem('invoices', data); setShowAdd(false); toast.success('Invoice created'); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Total Invoiced</p>
          <p className="stat-value">₨{totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Collected</p>
          <p className="stat-value text-success">₨{totalPaid.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Outstanding</p>
          <p className="stat-value text-warning">₨{totalPending.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="stat-label">Collection Rate</p>
          <p className="stat-value">{totalInvoiced ? Math.round(totalPaid / totalInvoiced * 100) : 0}%</p>
        </div>
      </div>

      <div className="glass-card rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Invoice #', 'Client', 'Amount', 'Status', 'Issued', 'Due', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-2 stat-label">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {state.invoices.map((inv: any) => {
              const client = state.clients.find((c: any) => c.id === inv.client_id);
              return (
                <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-2.5 text-sm data-cell text-foreground">{inv.invoice_number}</td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{client?.name}</td>
                  <td className="px-4 py-2.5 text-sm data-cell text-foreground">₨{Number(inv.total).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <Select value={inv.status} onValueChange={v => updateItem('invoices', inv.id, { status: v })}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['pending', 'partial', 'paid', 'overdue'].map(s => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2.5 text-sm data-cell text-muted-foreground">{inv.issued_date}</td>
                  <td className="px-4 py-2.5 text-sm data-cell text-muted-foreground">{inv.due_date}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => sendWA(inv)} className="text-success hover:text-success/80" title="Send via WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          try {
                            exportInvoiceAsPdfProgrammatic(inv, client, state.caSettings?.firm_name || 'CA Firm');
                            toast.success('PDF downloaded');
                          } catch {
                            toast.error('PDF export failed');
                          }
                        }}
                        className="text-muted-foreground hover:text-primary" title="Download PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.invoices.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No invoices yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LineItem { description: string; hours: number; rate: number; amount: number }

function InvoiceForm({ clients, onSave }: { clients: any[]; onSave: (data: any) => void }) {
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', hours: 0, rate: 2000, amount: 0 },
  ]);

  const addLine = () => setLineItems([...lineItems, { description: '', hours: 0, rate: 2000, amount: 0 }]);
  const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = value;
    if (field === 'hours' || field === 'rate') {
      updated[idx].amount = updated[idx].hours * updated[idx].rate;
    }
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0);
  const tax = Math.round(subtotal * 0.13); // 13% VAT
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      client_id: clientId,
      invoice_number: invoiceNumber,
      issued_date: issuedDate,
      due_date: dueDate,
      amount: subtotal,
      tax,
      total,
      notes: notes + '\n---LINE ITEMS---\n' + lineItems.map(l => `${l.description}: ${l.hours}h × ₨${l.rate} = ₨${l.amount}`).join('\n'),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs">Client *</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Invoice #</Label><Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-9" /></div>
        <div><Label className="text-xs">Issue Date</Label><Input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} className="h-9" /></div>
        <div><Label className="text-xs">Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9" /></div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Line Items</Label>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={addLine}>
            <Plus className="h-3 w-3" /> Add Line
          </Button>
        </div>
        <div className="space-y-2">
          {lineItems.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input placeholder="Description" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} className="h-8 text-xs flex-1" />
              <Input type="number" placeholder="Hrs" value={line.hours || ''} onChange={e => updateLine(idx, 'hours', +e.target.value)} className="h-8 text-xs w-16" />
              <Input type="number" placeholder="Rate" value={line.rate || ''} onChange={e => updateLine(idx, 'rate', +e.target.value)} className="h-8 text-xs w-20" />
              <span className="text-xs data-cell text-foreground w-20 text-right">₨{line.amount.toLocaleString()}</span>
              {lineItems.length > 1 && (
                <button type="button" onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 text-right">
          <p className="text-xs text-muted-foreground">Subtotal: ₨{subtotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">VAT (13%): ₨{tax.toLocaleString()}</p>
          <p className="text-sm font-semibold text-foreground">Total: ₨{total.toLocaleString()}</p>
        </div>
      </div>

      <div><Label className="text-xs">Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9" /></div>
      <Button type="submit" className="w-full" disabled={!clientId}>Create Invoice</Button>
    </form>
  );
}
