import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard, Users, ClipboardCheck, FileText, CalendarClock,
  BookOpen, Clock, Receipt, BookMarked, Calculator, BarChart3,
  Library, Mail, MessageCircle, UserCircle, Cpu, Settings,
  LogOut, ChevronLeft, ChevronRight, Sun, Moon,
  ArrowLeftRight, ShieldCheck, Bot,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { ChevronDown } from 'lucide-react';

const navGroups = [
  {
    title: 'Core & Practice',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/audits', label: 'Audits', icon: ClipboardCheck },
      { path: '/documents', label: 'Documents', icon: FileText },
      { path: '/deadlines', label: 'Deadlines', icon: CalendarClock },
      { path: '/working-papers', label: 'Working Papers', icon: BookOpen },
    ]
  },
  {
    title: 'Financials',
    items: [
      { path: '/time-billing', label: 'Time & Billing', icon: Clock },
      { path: '/invoices', label: 'Invoices', icon: Receipt },
      { path: '/ledgers', label: 'Ledgers & Accounts', icon: BookMarked },
      { path: '/tax-computation', label: 'Tax Computation', icon: Calculator },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
    ]
  },
  {
    title: 'AI & Automations',
    items: [
      { path: '/smart-audit', label: 'Smart Audit', icon: Cpu },
      { path: '/knowledge-base', label: 'Knowledge Base', icon: Library },
      { path: '/reconciliation', label: 'TDS Reconciliation', icon: ArrowLeftRight },
      { path: '/compliance', label: 'Compliance Center', icon: ShieldCheck },
      { path: '/agent-log', label: 'AI Agent Log', icon: Bot },
    ]
  },
  {
    title: 'Communications',
    items: [
      { path: '/communications', label: 'Client Comms', icon: MessageCircle },
      { path: '/engagement-letters', label: 'Eng. Letters', icon: Mail },
      { path: '/whatsapp', label: 'WhatsApp Alerts', icon: MessageCircle },
      { path: '/team', label: 'Team', icon: UserCircle },
    ]
  }
];

const superAdminNavItems = [
  { path: '/super-admin', label: 'SA Dashboard', icon: LayoutDashboard },
  { path: '/super-admin/ai', label: 'AI Providers', icon: Cpu },
  { path: '/super-admin/cas', label: 'CA Directory', icon: Users },
];

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const signOut = () => supabase.auth.signOut();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 relative z-20',
        collapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
        <div className="h-7 w-7 rounded-lg gradient-gold flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-xs font-bold">AF</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold text-sidebar-accent-foreground leading-tight truncate">AuditFlow</p>
            <p className="text-[10px] text-sidebar-primary font-medium">Nepal</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && profile && (
        <div className="px-3 py-2.5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-sidebar-accent-foreground">
                {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-sidebar-accent-foreground truncate">{profile.full_name || profile.email}</p>
              <p className="text-[10px] text-sidebar-foreground truncate">CA Practice</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {role === 'super_admin' ? (
          <div className="space-y-1">
            {superAdminNavItems.map(item => {
              const active = isActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-l-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                    {group.title}
                  </p>
                )}
                {group.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-l-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-1.5 py-2 border-t border-sidebar-border space-y-0.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
            'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 shrink-0 text-warning" />
          ) : (
            <Moon className="h-3.5 w-3.5 shrink-0 text-sidebar-primary" />
          )}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Settings */}
        {bottomItems.map(item => {
          const active = isActive(item.path);
          return (
            <NavLink key={item.path} to={item.path}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0'
              )}>
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Sign out */}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
            'text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
            'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            : <><ChevronLeft className="h-3.5 w-3.5 shrink-0" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
