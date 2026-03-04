import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, Scale, FileText, ChevronRight, Plus, Trash2, Edit2, ShieldCheck, Library, Sparkles, Send, Loader2, Bot, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  tax_law: { label: 'Tax Law', icon: Scale, color: 'bg-warning/15 text-warning' },
  nsa_standard: { label: 'NSA Standard', icon: BookOpen, color: 'bg-info/15 text-info' },
  nfrs: { label: 'NFRS', icon: FileText, color: 'bg-success/15 text-success' },
  company_act: { label: 'Company Act', icon: Scale, color: 'bg-primary/15 text-primary' },
  nrb: { label: 'NRB Directive', icon: FileText, color: 'bg-destructive/15 text-destructive' },
  guide: { label: 'Practice Guide', icon: BookOpen, color: 'bg-secondary text-secondary-foreground' },
  custom: { label: 'Custom', icon: FileText, color: 'bg-accent text-accent-foreground' },
  general: { label: 'General', icon: FileText, color: 'bg-muted text-muted-foreground' },
};

// System articles (built-in reference)
const systemArticles = [
  { id: 'sys-1', title: 'Income Tax Act, 2058 — Overview', category: 'tax_law', is_system: true, tags: ['income tax', 'ITA 2058', 'tax rates'], content: 'The Income Tax Act, 2058 (2002) is the primary legislation governing income tax in Nepal.\n\nKEY PROVISIONS:\n- Section 4: Imposition of Tax\n- Section 5: Taxable Income = assessable income - allowable deductions\n- Income Heads: Business (S.7), Employment (S.8), Investment (S.9)\n\nRATES (FY 2081/82):\nIndividual: 1% (up to 5L), 10% (5-7L), 20% (7-10L), 30% (10-20L), 36% (above 20L)\nCorporate: 25% general, 30% bank/finance, 20% special industry\n\nWITHHOLDING TAX: Sections 87-88\nPENALTIES: Late filing 0.1%/day, Understatement 50%, Evasion up to 100%' },
  { id: 'sys-2', title: 'Value Added Tax Act, 2052', category: 'tax_law', is_system: true, tags: ['VAT', 'filing', 'input credit'], content: 'VAT RATE: 13%\nREGISTRATION: >50L goods / >20L services\nFILING: Monthly by 25th\nZERO-RATED: Exports, diplomat services\nEXEMPT: Agriculture, education, health\nPENALTY: NPR 10,000 or 0.05%/day' },
  { id: 'sys-3', title: 'TDS Rates and Compliance', category: 'tax_law', is_system: true, tags: ['TDS', 'withholding', 'section 87'], content: 'DEPOSIT: Within 25 days of following month\n87(1) Rent: 10%\n87(2) Dividend: 5%\n87(3) Interest: 15% (general), 5% (bank)\n87(5) Goods/services: 1.5% (>50K)\n87(6) Commission: 15% (>25K)\n88(1) Salary: Per slab\n88(2) Deposit interest: 5%' },
  { id: 'sys-4', title: 'NSA 200 — Overall Objectives', category: 'nsa_standard', is_system: true, tags: ['NSA 200', 'audit objectives', 'reasonable assurance'], content: 'Objective: Obtain reasonable assurance about whether FS are free from material misstatement.\nKey: Professional Skepticism, Professional Judgment, Sufficient Appropriate Evidence\nAudit Risk = Inherent Risk × Control Risk × Detection Risk\nEthical: Independence, Integrity, Objectivity, Competence, Confidentiality' },
  { id: 'sys-5', title: 'NSA 315 — Risk Assessment', category: 'nsa_standard', is_system: true, tags: ['NSA 315', 'risk assessment', 'internal controls'], content: 'Understanding: Entity nature, industry, accounting policies, strategies, performance\nIC Components: Control environment, Risk assessment, Information system, Control activities, Monitoring\nSignificant Risks: Revenue recognition (presumed), Management override (presumed), Related parties, Non-routine transactions' },
  { id: 'sys-6', title: 'NSA 700 — Auditor\'s Report', category: 'nsa_standard', is_system: true, tags: ['NSA 700', 'audit report', 'opinion'], content: 'OPINIONS: Unmodified (clean), Qualified (material not pervasive), Adverse (material and pervasive), Disclaimer (insufficient evidence)\nSTRUCTURE: Title, Addressee, Opinion, Basis, Going Concern, KAM, Other Info, Responsibilities, Signature, Date' },
  { id: 'sys-7', title: 'NFRS Overview', category: 'nfrs', is_system: true, tags: ['NFRS', 'IFRS', 'tiers'], content: 'Tier 1 (Full NFRS/IFRS): Listed, banks, insurance\nTier 2 (NFRS for SMEs): >3 crore turnover\nTier 3 (Micro): Below SME threshold\nKey: NFRS 1, 9, 15, 16; NAS 1, 2, 7, 8, 12, 16, 37, 40' },
  { id: 'sys-8', title: 'Companies Act 2063 — Auditor Provisions', category: 'company_act', is_system: true, tags: ['Companies Act', 'appointment', 'duties'], content: 'APPOINTMENT (S.111): By AGM, max 3 terms for public co\nDISQUAL (S.112): Directors, employees, debtors, related persons\nDUTIES (S.113): Audit books, report true/fair view, compliance, IC adequacy\nAGM: Within 6 months of FY end with audited FS' },
  { id: 'sys-9', title: 'NRB Directives for Banking Audit', category: 'nrb', is_system: true, tags: ['NRB', 'banking', 'capital adequacy'], content: 'CAPITAL: Min 11%, Tier 1 min 7%\nLOAN CLASS: Pass (current), Sub-standard (3-6m), Doubtful (6-12m), Loss (>12m)\nPROVISION: Pass 1%, Sub-standard 25%, Doubtful 50%, Loss 100%\nSOL: Fund 25%, Non-fund 50% of core capital' },
  { id: 'sys-10', title: 'Nepali Fiscal Year — Key Dates', category: 'guide', is_system: true, tags: ['fiscal year', 'deadlines', 'calendar'], content: 'FY: Shrawan 1 to Ashad end\nMONTHLY: VAT/TDS by 25th\nQUARTERLY: Advance tax 40/70/100% by Poush/Chaitra/Ashad\nANNUAL: Tax return within 3 months (Ashoj), AGM within 6 months (Poush)\nPENALTY: Tax 0.1%/day, VAT NPR 10K or 0.05%/day, Annual return NPR 5K/month' },
];

export default function KnowledgeBase() {
  const { state, addItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('articles'); // 'articles' | 'chat'

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Combine system articles with DB articles
  const allArticles = useMemo(() => {
    const dbArticles = state.knowledgeArticles.map((a: any) => ({
      ...a,
      tags: a.tags || [],
    }));
    return [...systemArticles, ...dbArticles];
  }, [state.knowledgeArticles]);

  const filtered = useMemo(() => {
    return allArticles.filter((a: any) => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q) || (a.tags || []).some((t: string) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [search, activeCategory, allArticles]);

  const usedCategories = useMemo(() => {
    const cats = new Set(allArticles.map((a: any) => a.category));
    return ['all', ...Array.from(cats)];
  }, [allArticles]);

  const handleChatSubmit = async () => {
    if (!chatQuery.trim()) return;

    const userMsg = { role: 'user', content: chatQuery };
    setChatHistory(prev => [...prev, userMsg]);
    setChatQuery('');
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('nfrs-rag', {
        body: { query: userMsg.content }
      });

      if (error) throw error;

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.citations
      }]);
    } catch (err: any) {
      const errorMsg = err.message || "AI Provider Error";
      toast.error(`AI Agent Issue: ${errorMsg}`);
      console.error("RAG Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (selectedArticle) {
    const cfg = categoryConfig[selectedArticle.category] || categoryConfig.general;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Knowledge Base
        </button>
        <div className="glass-card rounded-lg p-6 animate-fade-in shadow-xl shadow-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
            {selectedArticle.is_system && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">CORE LAW</span>}
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">{selectedArticle.title}</h1>
          <div className="flex flex-wrap gap-1 mb-4">
            {(selectedArticle.tags || []).map((tag: string) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">{tag}</span>
            ))}
          </div>
          <div className="bg-muted/30 rounded-xl p-6 border border-border/50 relative">
            <div className="absolute top-4 right-4 text-muted-foreground opacity-20"><FileText className="h-20 w-20" /></div>
            <pre className="text-sm font-sans whitespace-pre-wrap text-foreground/90 leading-relaxed relative z-10">
              {selectedArticle.content}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full", activeTab === 'chat' ? "h-[calc(100vh-6rem)] overflow-hidden" : "space-y-6")}>
      {activeTab !== 'chat' && (
        <div className="flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-1 rounded-full gradient-gold" />
              <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">Intelligence Base</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-4">{allArticles.length} active documents · Nepal Statutory Index v2.1</p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl"><Plus className="h-3.5 w-3.5" />Add Internal Article</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">Add Knowledge Base Article</DialogTitle></DialogHeader>
                <ArticleForm onSave={async (data: any) => {
                  await addItem('knowledgeArticles', data);
                  setShowAdd(false);
                  toast.success('Article added to Intelligence Base');
                }} />
              </DialogContent>
            </Dialog>
            <Button className="gradient-gold gap-2 rounded-xl font-bold" onClick={() => setActiveTab('chat')}>
              <Sparkles className="h-4 w-4" /> Ask AI Agent
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'articles' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Search & Category Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search laws, standards, keywords..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-border/50" />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {usedCategories.map(cat => {
                const cfg = cat === 'all' ? null : categoryConfig[cat as string] || categoryConfig.general;
                const count = cat === 'all' ? allArticles.length : allArticles.filter((a: any) => a.category === cat).length;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat as string)}
                    className={cn('text-[11px] px-3 py-1.5 rounded-full font-bold transition-all border shrink-0',
                      activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    )}>
                    {cat === 'all' ? 'All Reference' : cfg?.label || cat}
                    <span className="ml-1.5 opacity-50 font-medium">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((article: any) => {
              const cfg = categoryConfig[article.category] || categoryConfig.general;
              const Icon = cfg.icon;
              return (
                <div key={article.id} className="glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all border-border/40"
                  onClick={() => setSelectedArticle(article)}>
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all', cfg.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground leading-tight truncate">{article.title}</h3>
                      {article.is_system && <ShieldCheck className="h-3 w-3 text-primary shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {article.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 overflow-hidden">
                        {(article.tags || []).slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium truncate max-w-[80px]">{tag}</span>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-primary flex items-center gap-1 uppercase tracking-tighter">Read More <ArrowRight className="h-2.5 w-2.5" /></span>
                    </div>
                  </div>
                  {!article.is_system && (
                    <button onClick={(e) => { e.stopPropagation(); deleteItem('knowledgeArticles', article.id); toast.success('Article archived'); }}
                      className="text-muted-foreground hover:text-destructive shrink-0 transition-colors p-1 opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl p-20 text-center border-dashed border-2">
              <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-foreground">No statutory records found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try expanding your search query.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden border border-border/50 shadow-lg relative w-full">
          <div className="p-3 border-b border-border bg-card/50 flex items-center justify-between backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setActiveTab('articles')} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-none mb-1">NFRS AI Agent</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Powered by Statutory DB</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setChatHistory([])} className="h-8 gap-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors border-primary/20">
              <Plus className="h-3.5 w-3.5" /> Start New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto text-center w-full mt-[-2rem] animate-fade-in">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-xl shadow-primary/5">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-foreground mb-3 tracking-tight">How can I help you today?</h1>
                <p className="text-muted-foreground mb-10 text-sm max-w-md mx-auto leading-relaxed">Ask me about NFRS standards, statutory guidelines, tax regulations, or let me assist you with drafting professional emails.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div onClick={() => setChatQuery("Analyze the latest NSA 200 guidelines")} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group flex items-start gap-3 text-left shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><Bot className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Analyze NSA 200</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Summarize the latest guidelines</p>
                    </div>
                  </div>
                  <div onClick={() => setChatQuery("Explain TDS rates for rent under Section 87")} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group flex items-start gap-3 text-left shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><Scale className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">TDS for Rent (Sec 87)</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Explain the applicable rates</p>
                    </div>
                  </div>
                  <div onClick={() => setChatQuery("Draft an email requesting financial docs from a client")} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group flex items-start gap-3 text-left shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Client Request Email</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Draft a document request</p>
                    </div>
                  </div>
                  <div onClick={() => setChatQuery("How to handle lease accounting under NFRS 16")} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group flex items-start gap-3 text-left shadow-sm">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><Library className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">NFRS 16 Leases</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">How to handle accounting</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] md:max-w-[75%] flex flex-col gap-1.5", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn("px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10"
                      : "bg-card border border-border shadow-sm rounded-tl-sm text-foreground"
                  )}>
                    {msg.content}
                  </div>
                  {msg.sources && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.sources.map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1 border border-primary/10">
                          <BookOpen className="h-2.5 w-2.5" /> {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground animate-pulse">Consulting the latest statutory index...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border shrink-0 z-10 w-full flex justify-center">
            <div className="w-full max-w-5xl relative flex items-center bg-card border border-border/80 rounded-[24px] shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Textarea
                placeholder="Message the NFRS AI Agent..."
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit();
                  }
                }}
                rows={1}
                className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent py-3.5 pl-5 pr-14 text-[15px] shadow-none focus-visible:ring-0 w-full [&::-webkit-scrollbar]:hidden"
              />
              <Button
                onClick={handleChatSubmit}
                disabled={!chatQuery.trim() || isTyping}
                size="icon"
                className="absolute right-2 bottom-1.5 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:bg-muted disabled:text-muted-foreground"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ArticleForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: '', category: 'custom', content: '', tags: '',
  });

  return (
    <form onSubmit={e => {
      e.preventDefault();
      onSave({
        title: form.title,
        category: form.category,
        content: form.content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_system: false,
      });
    }} className="space-y-3">
      <div>
        <Label className="text-xs">Title *</Label>
        <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9" />
      </div>
      <div>
        <Label className="text-xs">Category</Label>
        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(categoryConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Content *</Label>
        <Textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder="Write your article content..." />
      </div>
      <div>
        <Label className="text-xs">Tags (comma-separated)</Label>
        <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="h-9" placeholder="e.g. tax, compliance, audit" />
      </div>
      <Button type="submit" className="w-full">Add Article</Button>
    </form>
  );
}
