import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, User, Shield, Phone, Mail, Building, Plus, MoreVertical, Ban, CheckCircle, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SuperAdminCAs() {
    const queryClient = useQueryClient();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', fullName: '', firmName: '', phone: '' });

    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [selectedCa, setSelectedCa] = useState<any>(null);
    const [suspensionReason, setSuspensionReason] = useState("");

    const { data: cas, isLoading } = useQuery({
        queryKey: ['super-admin-cas'],
        queryFn: async () => {
            // 1. Fetch user roles that are 'ca'
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'ca');

            if (rolesError) throw rolesError;

            const userIds = roles.map(r => r.user_id);

            if (userIds.length === 0) return [];

            // 2. Fetch profiles for those users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('user_id', userIds)
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            return profiles;
        }
    });

    const inviteMutation = useMutation({
        mutationFn: async (data: { email: string, fullName: string, firmName: string, phone: string }) => {
            const { data: resData, error } = await supabase.functions.invoke('invite-ca', {
                body: { email: data.email, name: data.fullName, firm_name: data.firmName, phone: data.phone }
            });

            if (error) {
                throw new Error(error.message || "Failed to invite CA");
            }
            if (resData?.error) {
                throw new Error(resData.error);
            }
            return resData;
        },
        onSuccess: () => {
            toast.success("CA invited successfully! An email has been sent.");
            setIsInviteModalOpen(false);
            setInviteData({ email: '', fullName: '', firmName: '', phone: '' });
            queryClient.invalidateQueries({ queryKey: ['super-admin-cas'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
        },
        onError: (err: any) => {
            toast.error(err.message || "An error occurred while inviting the CA.");
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (data: { userId: string, newStatus: string, reason: string | null }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ status: data.newStatus, suspension_reason: data.reason })
                .eq('user_id', data.userId);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            toast.success(`CA has been ${variables.newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
            setIsSuspendModalOpen(false);
            setSuspensionReason("");
            queryClient.invalidateQueries({ queryKey: ['super-admin-cas'] });
        },
        onError: (err: any) => {
            toast.error(err.message || "An error occurred while updating status.");
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteData.email || !inviteData.fullName) {
            toast.error("Email and Name are required.");
            return;
        }
        inviteMutation.mutate(inviteData);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground mb-1">CA Directory</h1>
                    <p className="text-muted-foreground">Oversight and management of all Chartered Accountant accounts.</p>
                </div>

                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Invite CA
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleInvite}>
                            <DialogHeader>
                                <DialogTitle>Invite New CA</DialogTitle>
                                <DialogDescription>
                                    Send an invitation link to a Chartered Accountant to join the platform.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ca@example.com"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={inviteData.fullName}
                                        onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="firm">Firm Name (Optional)</Label>
                                    <Input
                                        id="firm"
                                        placeholder="Doe & Associates"
                                        value={inviteData.firmName}
                                        onChange={(e) => setInviteData({ ...inviteData, firmName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+977 98..."
                                        value={inviteData.phone}
                                        onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={inviteMutation.isPending}>
                                    {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Suspend Modal */}
                <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (selectedCa) {
                                toggleStatusMutation.mutate({ userId: selectedCa.user_id, newStatus: 'suspended', reason: suspensionReason });
                            }
                        }}>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">Suspend CA Account</DialogTitle>
                                <DialogDescription>
                                    Suspend {selectedCa?.full_name}'s access to the platform. They will not be able to log in.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="reason">Reason for suspension (visible to CA)</Label>
                                    <Input
                                        id="reason"
                                        placeholder="e.g., Pending payment, Terms violation"
                                        value={suspensionReason}
                                        onChange={(e) => setSuspensionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsSuspendModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="destructive" disabled={toggleStatusMutation.isPending}>
                                    {toggleStatusMutation.isPending ? "Suspending..." : "Suspend CA"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {cas && cas.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">No CA Accounts Found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            There are currently no users with the CA role registered in the system. Use the Invite CA button to add them.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cas?.map(ca => (
                        <Card key={ca.id} className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors shadow-sm flex flex-col">
                            <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
                                        {ca.full_name ? ca.full_name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <CardTitle className="text-base truncate" title={ca.full_name || 'Unnamed CA'}>
                                            {ca.full_name || 'Unnamed CA'}
                                        </CardTitle>
                                        {ca.status === 'suspended' ? (
                                            <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 mt-1 rounded-sm text-[10px] px-1.5 py-0">
                                                <Ban className="w-2.5 h-2.5 mr-1" /> Suspended
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-success/5 text-success border-success/20 mt-1 rounded-sm text-[10px] px-1.5 py-0">
                                                <Shield className="w-2.5 h-2.5 mr-1" /> Active
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -m-2">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px]">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("View Details coming soon")}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>View Details</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("Password reset link sent")}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            <span>Reset Password</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {ca.status === 'suspended' ? (
                                            <DropdownMenuItem className="text-success focus:bg-success/10 cursor-pointer" onClick={() => toggleStatusMutation.mutate({ userId: ca.user_id, newStatus: 'active', reason: null })}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span>Reactivate CA</span>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => {
                                                setSelectedCa(ca);
                                                setIsSuspendModalOpen(true);
                                            }}>
                                                <Ban className="mr-2 h-4 w-4" />
                                                <span>Suspend CA</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="space-y-3 pb-4 flex-1">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground" title={ca.firm_name || 'No firm specified'}>
                                    <Building className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{ca.firm_name || 'No firm specified'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground" title={ca.phone || 'No phone number'}>
                                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{ca.phone || 'No phone number'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground" title={ca.email || 'No email provided'}>
                                    <Mail className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate">{ca.email || 'No email provided'}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 pb-4">
                                <div className="w-full text-xs text-muted-foreground/50 text-center">
                                    Joined {new Date(ca.created_at).toLocaleDateString()}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
