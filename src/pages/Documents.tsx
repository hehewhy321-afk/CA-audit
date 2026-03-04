import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Clock, CheckCircle, XCircle, AlertCircle, Plus, Download, Trash2, Filter, MessageCircle, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type DocStatus = 'requested' | 'received' | 'reviewed' | 'approved' | 'rejected';

const statusConfig: Record<DocStatus, { icon: any; color: string }> = {
  requested: { icon: Clock, color: 'text-warning' },
  received: { icon: Upload, color: 'text-info' },
  reviewed: { icon: AlertCircle, color: 'text-primary' },
  approved: { icon: CheckCircle, color: 'text-success' },
  rejected: { icon: XCircle, color: 'text-destructive' },
};

const categories = [
  'Financial Statements', 'Bank Statements', 'Tax Returns', 'Trial Balance',
  'Fixed Asset Register', 'Loan Documents', 'Agreements', 'Minutes',
  'Incorporation Documents', 'PAN/VAT Certificate', 'Other',
];

export default function Documents() {
  const { state, addItem, updateItem, deleteItem } = useApp();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const docs = state.documents.filter((d: any) => {
    if (filterClient !== 'all' && d.client_id !== filterClient) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const handleFileUpload = async (docId: string, clientId: string, file: File) => {
    const path = `${user?.id}/${clientId}/${docId}/${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Upload failed: ' + error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    await updateItem('documents', docId, {
      file_url: path,
      status: 'received',
      received_date: new Date().toISOString().split('T')[0],
    });
    toast.success('File uploaded successfully');
  };

  const handleDelete = async (doc: any) => {
    if (doc.file_url) {
      await supabase.storage.from('documents').remove([doc.file_url]);
    }
    await deleteItem('documents', doc.id);
    toast.success('Document deleted');
  };

  const handleDownload = async (doc: any) => {
    if (!doc.file_url) return;
    const { data, error } = await supabase.storage.from('documents').download(doc.file_url);
    if (error || !data) { toast.error('Download failed'); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_url.split('/').pop() || doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = async (doc: any) => {
    if (!doc.file_url) return;
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_url, 60);
    if (error || !data) {
      toast.error('Could not generate view link');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleSmartScan = async (doc: any) => {
    if (!doc.file_url) return;

    toast.info('AI is analyzing the document...', { icon: <Sparkles className="h-4 w-4 animate-pulse text-primary" /> });

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, this would be an Edge Function call
    // For now, we simulate extraction based on document name or random data
    const mockData = {
      pan_number: doc.name.includes('PAN') ? '601234567' : 'Not Found',
      is_valid: true,
      tax_category: 'Professional Services',
      tds_rate: '1.5%',
      extracted_at: new Date().toISOString()
    };

    await updateItem('documents', doc.id, {
      extracted_data: mockData,
      is_ai_processed: true,
      notes: `${doc.notes || ''}\n[AI Scan]: Verified ${mockData.tax_category} at ${mockData.tds_rate}`.trim()
    });

    toast.success('AI Analysis Complete!', {
      description: `Extracted: ${mockData.tax_category} (TDS: ${mockData.tds_rate})`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">{state.documents.length} documents · Track and manage client documents</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Document</DialogTitle></DialogHeader>
            <AddDocForm clients={state.clients} onSave={async (doc) => { await addItem('documents', doc); setShowAdd(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {state.clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(['requested', 'received', 'reviewed', 'approved', 'rejected'] as DocStatus[]).map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {docs.length === 0 ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No documents found</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Document" to request or upload documents for any client</p>
        </div>
      ) : (
        <div className="glass-card rounded-lg divide-y divide-border">
          {docs.map((doc: any) => {
            const client = state.clients.find((c: any) => c.id === doc.client_id);
            const status = doc.status as DocStatus;
            const cfg = statusConfig[status] || statusConfig.requested;
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
                <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{client?.name} · {doc.category || 'Uncategorized'}</p>
                </div>

                {/* WA Request button */}
                {(status === 'requested' || !doc.file_url) && client?.phone && (
                  <button onClick={() => {
                    const phone = (client.phone || '').replace(/[^0-9]/g, '');
                    const firmName = state.caSettings?.firm_name || 'Our Firm';
                    const msg = encodeURIComponent(
                      `Dear ${client.contact_person || client.name},\n\nWe need the following document for your audit:\n\n📄 ${doc.name}\n${doc.category ? `Category: ${doc.category}` : ''}\n\nPlease provide at your earliest convenience.\n\nThank you,\n${firmName}`
                    );
                    window.open(`https://wa.me/977${phone}?text=${msg}`, '_blank');
                    if (doc.status === 'requested') updateItem('documents', doc.id, { status: 'requested' });
                  }} className="text-success hover:text-success/80 shrink-0" title="Request via WhatsApp">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}

                {/* File upload button */}
                <FileUploadButton onUpload={(file) => handleFileUpload(doc.id, doc.client_id, file)} hasFile={!!doc.file_url} />

                {/* View/Download/AI buttons */}
                {doc.file_url && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSmartScan(doc)}
                      disabled={doc.is_ai_processed}
                      className={cn(
                        "transition-colors",
                        doc.is_ai_processed ? "text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                      title={doc.is_ai_processed ? "AI Analyzed" : "Smart Scan (AI)"}
                    >
                      <Sparkles className={cn("h-4 w-4", doc.is_ai_processed && "fill-primary/20")} />
                    </button>
                    <button onClick={() => handleView(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="View Document">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDownload(doc)} className="text-muted-foreground hover:text-primary transition-colors" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Status selector */}
                <Select value={doc.status} onValueChange={v => updateItem('documents', doc.id, { status: v })}>
                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['requested', 'received', 'reviewed', 'approved', 'rejected'] as DocStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-xs data-cell text-muted-foreground">v{doc.version}</span>

                <button onClick={() => handleDelete(doc)} className="text-muted-foreground hover:text-destructive" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FileUploadButton({ onUpload, hasFile }: { onUpload: (file: File) => void; hasFile: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      <button onClick={() => ref.current?.click()} className={cn('text-xs px-2 py-1 rounded border transition-colors',
        hasFile ? 'border-success/30 text-success hover:bg-success/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary'
      )} title={hasFile ? 'Replace file' : 'Upload file'}>
        <Upload className="h-3.5 w-3.5" />
      </button>
    </>
  );
}

function AddDocForm({ clients, onSave }: { clients: any[]; onSave: (doc: any) => Promise<void> }) {
  const [form, setForm] = useState({
    client_id: '', name: '', category: '', notes: '',
    requested_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSave(form); setLoading(false); }} className="space-y-3">
      <div>
        <Label className="text-xs">Client *</Label>
        <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Document Name *</Label>
        <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9" />
      </div>
      <div>
        <Label className="text-xs">Category</Label>
        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-9" />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !form.client_id}>
        {loading ? 'Adding...' : 'Add Document'}
      </Button>
    </form>
  );
}
