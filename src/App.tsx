import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import ClientPortal from "./pages/ClientPortal";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Audits from "./pages/Audits";
import Documents from "./pages/Documents";
import Deadlines from "./pages/Deadlines";
import WorkingPapers from "./pages/WorkingPapers";
import TimeBilling from "./pages/TimeBilling";
import Invoices from "./pages/Invoices";
import Ledgers from "./pages/Ledgers";
import TaxComputation from "./pages/TaxComputation";
import Reports from "./pages/Reports";
import KnowledgeBase from "./pages/KnowledgeBase";
import EngagementLetters from "./pages/EngagementLetters";
import WhatsAppAlerts from "./pages/WhatsAppAlerts";
import Team from "./pages/Team";
import Communications from "./pages/Communications";
import SmartAudit from "./pages/SmartAudit";
import TDSReconciliation from "./pages/TDSReconciliation";
import ComplianceCenter from "./pages/ComplianceCenter";
import AgentLog from "./pages/AgentLog";
import SettingsSync from "./pages/SettingsSync";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminAI from "./pages/SuperAdminAI";
import SuperAdminCAs from "./pages/SuperAdminCAs";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Super Admin portal
  if (role === 'super_admin') {
    return (
      <AppProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/super-admin" replace />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/ai" element={<SuperAdminAI />} />
            <Route path="/super-admin/cas" element={<SuperAdminCAs />} />
            <Route path="*" element={<Navigate to="/super-admin" replace />} />
          </Routes>
        </AppLayout>
      </AppProvider>
    );
  }

  // Client portal
  if (role === 'client') {
    return (
      <Routes>
        <Route path="*" element={<ClientPortal />} />
      </Routes>
    );
  }

  // Must be CA to access the main panel
  if (role !== 'ca') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-warning text-xl">!</span>
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Access Pending</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your account doesn't have the required role assigned yet. Please contact your administrator or wait for role assignment.
          </p>
          <button onClick={() => { import('@/integrations/supabase/client').then(m => m.supabase.auth.signOut()); }}
            className="text-sm text-primary hover:underline">Sign out</button>
        </div>
      </div>
    );
  }

  // CA routes
  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/working-papers" element={<WorkingPapers />} />
          <Route path="/time-billing" element={<TimeBilling />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/ledgers" element={<Ledgers />} />
          <Route path="/tax-computation" element={<TaxComputation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/engagement-letters" element={<EngagementLetters />} />
          <Route path="/whatsapp" element={<WhatsAppAlerts />} />
          <Route path="/team" element={<Team />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/smart-audit" element={<SmartAudit />} />
          <Route path="/reconciliation" element={<TDSReconciliation />} />
          <Route path="/compliance" element={<ComplianceCenter />} />
          <Route path="/agent-log" element={<AgentLog />} />
          <Route path="/settings" element={<SettingsSync />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
