import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, Bot, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['super-admin-stats'],
        queryFn: async () => {
            const [
                { count: totalUsers },
                { count: totalCas },
                { data: activeProviders },
                { count: totalProviders }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'ca'),
                supabase.from('ai_providers').select('provider_name, model_name').eq('is_active', true).limit(1),
                supabase.from('ai_providers').select('*', { count: 'exact', head: true })
            ]);

            const activeProvider = activeProviders && activeProviders.length > 0 ? activeProviders[0] : null;

            return {
                totalUsers: totalUsers || 0,
                totalCas: totalCas || 0,
                activeProviderName: activeProvider?.provider_name || 'None',
                activeProviderModel: activeProvider?.model_name || '',
                totalProviders: totalProviders || 0,
            };
        }
    });

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground mb-1">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Central control panel for AuditPro Nepal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats?.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active CAs</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-success" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats?.totalCas}</div>
                        <p className="text-xs text-muted-foreground mt-1">Approved & working</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active AI</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-warning" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize text-foreground">{stats?.activeProviderName}</div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{stats?.activeProviderModel}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Available AI Models</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-info/10 flex items-center justify-center">
                            <Cpu className="h-4 w-4 text-info" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats?.totalProviders}</div>
                        <p className="text-xs text-muted-foreground mt-1">Configured in system</p>
                    </CardContent>
                </Card>
            </div>

            {/* Space for future components like recent activity or system health */}
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 text-center border-dashed">
                <Cpu className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">System Health & Metrics</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Detailed metrics, server logs, and advanced configuration options will be available in future updates.
                </p>
            </div>
        </div>
    );
}
