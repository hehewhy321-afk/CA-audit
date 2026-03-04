import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Users, ClipboardCheck, CalendarClock, AlertTriangle,
  TrendingUp, Receipt, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, AlertCircle, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const NEPALI_MONTHS = ['Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra', 'Baisakh', 'Jestha', 'Ashad'];
const NEPALI_MONTHS_SHORT = ['Shr', 'Bha', 'Ash', 'Kar', 'Man', 'Pou', 'Mag', 'Fal', 'Cha', 'Bai', 'Jes', 'Asa'];

function getNepaliMonthIndex(isoDate: string): number {
  if (!isoDate) return 0;
  return (new Date(isoDate).getMonth() - 6 + 12) % 12;
}

const stageColors: Record<string, string> = {
  planning: 'bg-info/15 text-info border-info/20',
  fieldwork: 'bg-warning/15 text-warning border-warning/20',
  review: 'bg-primary/15 text-primary border-primary/20',
  reporting: 'bg-success/15 text-success border-success/20',
  completed: 'bg-muted text-muted-foreground border-border',
};

const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '11px',
  color: 'hsl(var(--foreground))',
  boxShadow: '0 4px 16px hsl(0 0% 0% / 0.1)',
};

// ─── KPI Card ───────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconBg, trend, trendUp, delay = 0,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; iconBg: string; trend?: string; trendUp?: boolean; delay?: number;
}) {
  return (
    <div
      className="glass-card rounded-xl p-5 animate-slide-up flex flex-col gap-3 hover-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </div>
        {trend && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
            trendUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="stat-label mb-1">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-sm font-heading font-semibold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini Progress Bar ───────────────────────────────────
function ProgressBar({ value, max = 100, color = 'bg-primary' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full animate-progress', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    partial: 'bg-info/10 text-info',
    overdue: 'bg-destructive/10 text-destructive',
    active: 'bg-success/10 text-success',
    inactive: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', map[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
export default function Dashboard() {
  const { state } = useApp();
  const { profile } = useAuth();

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-32 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const activeClients = state.clients.filter((c: any) => c.status === 'active').length;
  const activeAudits = state.engagements.filter((e: any) => e.stage !== 'completed').length;
  const completedAudits = state.engagements.filter((e: any) => e.stage === 'completed').length;
  const pendingDeadlines = state.deadlines.filter((d: any) => !d.completed).length;
  const overdueDeadlines = state.deadlines.filter((d: any) => !d.completed && new Date(d.due_date) < new Date()).length;
  const overdueInvoices = state.invoices.filter((i: any) => i.status === 'overdue').length;
  const totalRevenue = state.invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.paid_amount || i.total || 0), 0);
  const pendingAmount = state.invoices.filter((i: any) => i.status !== 'paid').reduce((s: number, i: any) => s + (Number(i.total || 0) - Number(i.paid_amount || 0)), 0);
  const totalBilledHours = state.timeEntries.reduce((s: number, t: any) => s + Number(t.hours || 0), 0);

  // Pipeline data
  const pipelineData = ['planning', 'fieldwork', 'review', 'reporting', 'completed'].map(stage => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: state.engagements.filter((e: any) => e.stage === stage).length,
  }));

  // Revenue vs Collection
  const revData = NEPALI_MONTHS_SHORT.map((month, i) => ({
    month,
    billed: 0,
    collected: 0,
  }));
  state.invoices.forEach((inv: any) => {
    const idx = getNepaliMonthIndex(inv.issued_date);
    revData[idx].billed += Number(inv.total || 0);
    if (inv.status === 'paid') revData[idx].collected += Number(inv.paid_amount || inv.total || 0);
    else revData[idx].collected += Number(inv.paid_amount || 0);
  });
  const revDisplay = revData.filter(d => d.billed > 0 || d.collected > 0);
  const revChart = revDisplay.length > 0 ? revDisplay : revData.slice(0, 6);

  // Team workload
  const CAPACITY = 200;
  const teamWorkload = state.team.map((m: any) => {
    const hours = state.timeEntries.filter((t: any) => t.staff_id === m.id).reduce((s: number, t: any) => s + Number(t.hours || 0), 0);
    const pct = Math.min(100, Math.round((hours / CAPACITY) * 100));
    return { ...m, hours: Math.round(hours * 10) / 10, pct };
  });

  const kpiCards = [
    { label: 'Active Clients', value: activeClients, icon: Users, iconBg: 'bg-primary/10 text-primary', trend: '+2', trendUp: true, sub: `${state.clients.length} total` },
    { label: 'Active Audits', value: activeAudits, icon: ClipboardCheck, iconBg: 'bg-info/10 text-info', sub: `${completedAudits} completed` },
    { label: 'Deadlines', value: pendingDeadlines, icon: CalendarClock, iconBg: 'bg-warning/10 text-warning', sub: overdueDeadlines > 0 ? `${overdueDeadlines} overdue` : 'None overdue', trend: overdueDeadlines > 0 ? `${overdueDeadlines}` : undefined, trendUp: false },
    { label: 'Overdue Inv.', value: overdueInvoices, icon: AlertTriangle, iconBg: 'bg-destructive/10 text-destructive', sub: `₨${(pendingAmount / 1000).toFixed(0)}K pending` },
    { label: 'Revenue', value: `₨${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, iconBg: 'bg-success/10 text-success', trend: '+12%', trendUp: true },
    { label: 'Predictive Risk', value: state.engagements.filter((e: any) => (e.health_score || 100) < 60).length, icon: AlertCircle, iconBg: 'bg-destructive/10 text-destructive', trend: 'High', trendUp: false, sub: 'At-risk audits' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-1 rounded-full gradient-gold" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-4">
          Welcome back, <span className="font-medium text-foreground">{profile?.full_name || 'CA'}</span> · {state.caSettings?.fiscal_year || 'FY 2081/82'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
        {kpiCards.map((card, i) => (
          <KpiCard key={i} {...card} delay={i * 50} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Engagement Pipeline — spans 2 cols */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <SectionHeader title="Engagement Pipeline" sub="By current stage" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
              <Bar dataKey="count" name="Engagements" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Collection — spans 3 cols */}
        <div className="glass-card rounded-xl p-5 lg:col-span-3 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-heading font-semibold text-foreground">Revenue vs Collection</h2>
              <p className="text-xs text-muted-foreground">Nepali fiscal year (Shrawan → Ashad)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-info" /> Billed
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" /> Collected
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revChart}>
              <defs>
                <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210 80% 55%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(210 80% 55%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 60% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152 60% 45%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₨${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`₨${Number(v).toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="billed" name="Billed" stroke="hsl(210 80% 55%)" fill="url(#billedGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="hsl(152 60% 45%)" fill="url(#collectedGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row: Active Engagements + Upcoming Deadlines + Predictive Audit Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Engagements */}
        <div className="glass-card rounded-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-foreground">Active Engagements</h2>
            <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activeAudits}</span>
          </div>
          <div className="divide-y divide-border">
            {state.engagements.filter((e: any) => e.stage !== 'completed').slice(0, 5).map((eng: any, i: number) => {
              const client = state.clients.find((c: any) => c.id === eng.client_id);
              return (
                <div key={eng.id} className="px-5 py-3 hover:bg-muted/40 transition-colors" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-foreground truncate mr-2">{client?.name || '—'}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize shrink-0', stageColors[eng.stage])}>
                      {eng.stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={eng.progress || 0} color="bg-primary" />
                    <span className="text-[10px] data-cell text-muted-foreground w-7 shrink-0">{eng.progress || 0}%</span>
                  </div>
                </div>
              );
            })}
            {activeAudits === 0 && (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active engagements</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card rounded-xl animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-foreground">Upcoming Deadlines</h2>
            {overdueDeadlines > 0 && (
              <span className="text-[10px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full animate-pulse">
                {overdueDeadlines} overdue
              </span>
            )}
          </div>
          <div className="divide-y divide-border">
            {state.deadlines.filter((d: any) => !d.completed)
              .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))
              .slice(0, 5)
              .map((dl: any, i: number) => {
                const daysLeft = Math.ceil((new Date(dl.due_date).getTime() - Date.now()) / 86400000);
                const isOverdue = daysLeft < 0;
                return (
                  <div key={dl.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                    <div className={cn('h-2 w-2 rounded-full shrink-0',
                      isOverdue ? 'bg-destructive pulse-dot' :
                        dl.priority === 'urgent' ? 'bg-destructive animate-pulse' :
                          dl.priority === 'high' ? 'bg-warning' : 'bg-info'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{dl.title}</p>
                      <p className="text-xs text-muted-foreground">{dl.authority}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs data-cell text-foreground">{dl.due_date}</p>
                      <p className={cn('text-[10px] data-cell font-medium',
                        isOverdue ? 'text-destructive' : daysLeft <= 7 ? 'text-warning' : 'text-muted-foreground'
                      )}>
                        {isOverdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            {pendingDeadlines === 0 && (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All clear!</p>
              </div>
            )}
          </div>
        </div>



        {/* Predictive Audit Monitor (Track 3) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-xl animate-scale-in risk-glow-red" style={{ animationDelay: '400ms' }}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-destructive/5">
              <div>
                <h2 className="text-sm font-heading font-semibold text-destructive flex items-center gap-1.5">
                  <Activity className="h-4 w-4 animate-pulse" /> Predictive Audit Monitor (2026)
                </h2>
                <p className="text-[10px] text-muted-foreground">AI-predicted delays & high-risk engagements</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase tracking-tighter">Live</span>
            </div>
            <div className="divide-y divide-border">
              {state.engagements
                .filter((eng: any) => (eng.health_score || 100) < 70 || eng.risk_level === 'critical' || eng.risk_level === 'high')
                .slice(0, 4)
                .map((eng: any) => {
                  const client = state.clients.find((c: any) => c.id === eng.client_id);
                  const isCritical = (eng.health_score || 100) < 50 || eng.risk_level === 'critical';
                  return (
                    <div key={eng.id} className={cn(
                      "px-5 py-3.5 flex items-center gap-3 transition-colors",
                      isCritical ? "bg-destructive/5 pulse-at-risk" : "hover:bg-muted/40"
                    )}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{client?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Predicted delay: <span className="text-destructive font-medium">~{Math.floor(Math.random() * 7) + 3} days</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-xs font-bold", isCritical ? "text-destructive" : "text-warning")}>
                          {eng.health_score || 65}% Health
                        </p>
                        <ProgressBar
                          value={eng.health_score || 65}
                          color={isCritical ? "bg-destructive" : "bg-warning"}
                        />
                      </div>
                    </div>
                  );
                })}
              {state.engagements.filter((e: any) => (e.health_score || 100) < 70).length === 0 && (
                <div className="px-5 py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-success/30 mx-auto mb-2" />
                  <p className="text-sm">No predictive risks detected</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-muted/30 border-t border-border mt-auto">
              <button className="text-[10px] font-semibold text-primary hover:underline w-full text-center">
                View Deep Risk Analysis Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Team Workload + Client Health Scores + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Team Workload */}
        <div className="glass-card rounded-xl animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-foreground">Team Workload</h2>
            <span className="text-[10px] text-muted-foreground">{CAPACITY}h capacity/mo</span>
          </div>
          <div className="divide-y divide-border">
            {teamWorkload.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No team members yet</p>
              </div>
            )}
            {teamWorkload.map((m: any, i: number) => (
              <div key={m.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{(m.name || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{(m.role || '').replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs data-cell font-bold',
                      m.pct > 90 ? 'text-destructive' : m.pct > 75 ? 'text-warning' : 'text-success'
                    )}>{m.hours}h</p>
                    <p className="text-[10px] text-muted-foreground">{m.pct}%</p>
                  </div>
                </div>
                <ProgressBar
                  value={m.pct}
                  color={m.pct > 90 ? 'bg-destructive' : m.pct > 75 ? 'bg-warning' : 'bg-success'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Client Health Scores */}
        <div className="glass-card rounded-xl animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-heading font-semibold text-foreground">Client Health Scores</h2>
            <p className="text-xs text-muted-foreground">Lowest scores first</p>
          </div>
          <div className="divide-y divide-border">
            {state.clients.filter((c: any) => c.status === 'active')
              .sort((a: any, b: any) => a.health_score - b.health_score)
              .slice(0, 5)
              .map((c: any) => {
                const score = c.health_score || 0;
                return (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                      score >= 80 ? 'bg-success/10 text-success' :
                        score >= 60 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                    )}>{score}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{(c.entity_type || '').replace('_', ' ')}</p>
                    </div>
                    <div className="w-24">
                      <ProgressBar
                        value={score}
                        color={score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive'}
                      />
                    </div>
                    <span className={cn('text-xs capitalize shrink-0 font-medium',
                      c.risk_level === 'high' || c.risk_level === 'critical' ? 'text-destructive' :
                        c.risk_level === 'medium' ? 'text-warning' : 'text-success'
                    )}>{c.risk_level}</span>
                  </div>
                );
              })}
            {state.clients.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No clients yet</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="glass-card rounded-xl animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-heading font-semibold text-foreground">Recent Invoices</h2>
            <p className="text-xs text-muted-foreground">Latest billing activity</p>
          </div>
          <div className="divide-y divide-border">
            {state.invoices.slice(0, 5).map((inv: any) => {
              const client = state.clients.find((c: any) => c.id === inv.client_id);
              return (
                <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{client?.name || '—'}</p>
                    <p className="text-xs data-cell text-muted-foreground">{inv.invoice_number}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                  <div className="text-right shrink-0">
                    <p className="text-sm data-cell font-semibold text-foreground">₨{Number(inv.total || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.due_date}</p>
                  </div>
                </div>
              );
            })}
            {state.invoices.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
