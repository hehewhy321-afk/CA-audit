import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, Upload, Clock, CheckCircle, XCircle, AlertCircle,
  LogOut, Sparkles, Loader2, ChevronDown, ChevronUp, Database,
  ArrowRight, ShieldCheck, MapPin, Calendar, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

type DocStatus = 'requested' | 'received' | 'reviewed' | 'approved' | 'rejected';

const statusConfig: Record<DocStatus, { icon: any; color: string; label: string }> = {
  requested: { icon: Clock, color: 'text-warning bg-warning/10 border-warning/20', label: 'Requested' },
  received: { icon: Upload, color: 'text-info bg-info/10 border-info/20', label: 'Received' },
  reviewed: { icon: AlertCircle, color: 'text-primary bg-primary/10 border-primary/20', label: 'Reviewed' },
  approved: { icon: CheckCircle, color: 'text-success bg-success/10 border-success/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Rejected' },
};

interface PortalDoc {
  id: string;
  name: string;
  category: string | null;
  status: DocStatus;
  notes: string | null;
  version: number;
  file_url: string | null;
  is_ai_processed?: boolean;
  extracted_data?: {
    pan_number?: string;
    vat_amount?: number;
    invoice_date?: string;
    vendor_name?: string;
    category?: string;
    confidence?: number;
  };
  received_date?: string;
}

export default function ClientPortal() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<PortalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    const { data, error } = await (supabase
      .from('documents')
      .select('id, name, category, status, notes, version, file_url, is_ai_processed, extracted_data, received_date')
      .order('created_at', { ascending: false }) as any);
    if (!error && data) setDocs(data as PortalDoc[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadDocs();

    // Subscribe to realtime updates for this client's documents
    const channel = supabase
      .channel('document_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents'
      }, (payload) => {
        setDocs(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d));
        if (payload.new.is_ai_processed && !payload.old.is_ai_processed) {
          toast({
            title: 'AI Analysis Complete',
            description: `Data extracted from ${payload.new.name}`,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadDocs, toast]);

  const handleFileUpload = async (docId: string, file: File) => {
    setIsUploading(docId);
    try {
      const path = `${user!.id}/${docId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

      const { error: updateError } = await supabase.from('documents').update({
        status: 'received' as DocStatus,
        file_url: urlData.publicUrl,
        received_date: new Date().toISOString().split('T')[0],
        is_ai_processed: false // Reset AI status on new upload
      }).eq('id', docId);

      if (updateError) throw updateError;

      toast({
        title: 'Upload successful',
        description: 'AI is now analyzing your document...',
      });

      // Simulate AI kick-off for UI demo
      setTimeout(() => {
        loadDocs();
      }, 500);

    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Error uploading file', variant: 'destructive' });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">Client Portal</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1.5 font-mono">
              Secure <ArrowRight className="h-2.5 w-2.5" /> {profile?.full_name || user?.email?.split('@')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-foreground">AuditFlow Nepal</p>
            <p className="text-[10px] text-muted-foreground">Practice Intelligence v2.0</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 hover:bg-destructive/10 hover:text-destructive group transition-all">
            <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
        {/* Welcome Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-5 border border-border/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="h-12 w-12" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Required</p>
            <p className="text-3xl font-heading font-bold text-warning">{docs.filter(d => d.status === 'requested').length}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-border/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle className="h-12 w-12" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Approved</p>
            <p className="text-3xl font-heading font-bold text-success">{docs.filter(d => d.status === 'approved').length}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-border/50 relative overflow-hidden group hidden lg:block">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="h-12 w-12" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Processed</p>
            <p className="text-3xl font-heading font-bold text-primary">{docs.filter(d => d.is_ai_processed).length}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-border/50 relative overflow-hidden group hidden lg:block">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="h-12 w-12" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Files</p>
            <p className="text-3xl font-heading font-bold text-foreground">{docs.length}</p>
          </div>
        </section>

        {/* Upload Queue / Document List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Database className="h-4 w-4" /> Document Queue
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated 2m ago</span>
            </div>
          </div>

          {loading ? (
            <div className="glass-card rounded-2xl p-20 text-center animate-pulse">
              <Loader2 className="h-8 w-8 text-primary/40 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Synchronizing vault...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="glass-card rounded-2xl p-20 text-center border-dashed border-2 border-border/50">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Your auditor hasn't requested any documents yet. You'll be notified when they do.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc, idx) => {
                const cfg = statusConfig[doc.status];
                const Icon = cfg.icon;
                const isExpanded = expandedDoc === doc.id;
                const processing = isUploading === doc.id || (doc.status === 'received' && !doc.is_ai_processed);

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "glass-card rounded-2xl border transition-all duration-300 animate-slide-up overflow-hidden",
                      isExpanded ? "border-primary/30 ring-1 ring-primary/10" : "border-border/50 hover:border-primary/20",
                      idx === 0 && "mt-0"
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                        doc.status === 'requested' ? "bg-muted text-muted-foreground animate-pulse" : cfg.color
                      )}>
                        {processing ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground tracking-tight truncate pr-2">
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded uppercase">
                                {doc.category || 'Uncategorized'}
                              </span>
                              {doc.received_date && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" /> {doc.received_date}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn('text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border', cfg.color)}>
                              {cfg.label}
                            </span>
                            {doc.is_ai_processed && (
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="text-[9px] font-bold text-primary uppercase">AI Analyzed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {processing && (
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span>{isUploading === doc.id ? 'UPLOADING...' : 'AI OCR EXTRACTING...'}</span>
                              <span>{isUploading === doc.id ? '45%' : '90%'}</span>
                            </div>
                            <Progress value={isUploading === doc.id ? 45 : 90} className="h-1 bg-muted" />
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2 pl-2">
                        {doc.status === 'requested' && !isUploading && (
                          <label className="cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input
                              type="file"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(doc.id, f);
                              }}
                            />
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                              <Upload className="h-4 w-4" />
                            </div>
                          </label>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/50 bg-muted/20 animate-fade-in">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Notes/Instructions */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="h-3 w-3" /> Auditor Instructions
                            </h4>
                            <div className="bg-background rounded-xl p-3 border border-border/50">
                              <p className="text-xs text-foreground italic leading-relaxed">
                                "{doc.notes || 'Please upload the requested document for verification.'}"
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-2 font-mono uppercase tracking-tighter">
                                Version {doc.version} · Global ID: {doc.id.split('-')[0]}
                              </p>
                            </div>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors w-full justify-center"
                              >
                                View Current Version <ArrowRight className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          {/* AI Extracted Data */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" /> AI Verification Result
                            </h4>
                            {doc.is_ai_processed && doc.extracted_data ? (
                              <div className="bg-card rounded-xl border border-primary/20 p-3 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2">
                                  <div className="flex items-center gap-1 bg-success/10 border border-success/20 px-1.5 py-0.5 rounded-md">
                                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="text-[9px] font-bold text-success capitalize">Match {doc.extracted_data.confidence}%</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground flex items-center gap-1"><Hash className="h-2.5 w-2.5" /> PAN Number</p>
                                    <p className="font-bold font-mono text-foreground text-xs">{doc.extracted_data.pan_number || 'Pending'}</p>
                                  </div>
                                  <div className="space-y-1 text-right">
                                    <p className="text-muted-foreground flex items-center gap-1 justify-end">Amount <Database className="h-2.5 w-2.5" /></p>
                                    <p className="font-bold text-foreground text-xs">₨{(doc.extracted_data.vat_amount || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Invoice Date</p>
                                    <p className="font-bold text-foreground text-xs">{doc.extracted_data.invoice_date || 'Pending'}</p>
                                  </div>
                                  <div className="space-y-1 text-right">
                                    <p className="text-muted-foreground flex items-center gap-1 justify-end"><MapPin className="h-2.5 w-2.5" /> Vendor</p>
                                    <p className="font-bold text-foreground text-xs truncate">{doc.extracted_data.vendor_name || 'Pending'}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-muted/40 rounded-xl border border-dashed border-border/50 p-6 text-center">
                                {doc.status === 'requested' ? (
                                  <p className="text-[10px] text-muted-foreground italic">Upload document to initiate AI scan</p>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <p className="text-[10px] text-primary font-bold animate-pulse">OCR SCANNING IN PROGRESS...</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Support Info */}
      <footer className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-border px-6 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <p className="text-[10px] font-medium text-foreground uppercase tracking-wider">All Systems Operational</p>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Bank-grade 256-bit Encryption
        </p>
      </footer>
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
