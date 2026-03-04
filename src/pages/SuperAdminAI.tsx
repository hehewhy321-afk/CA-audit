import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Check, Key, Pencil, Settings2, Trash2, Cpu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminAI() {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editApiKey, setEditApiKey] = useState("");
    const [editModelName, setEditModelName] = useState("");

    const { data: providers, isLoading } = useQuery({
        queryKey: ['ai_providers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_providers')
                .select('*')
                .order('provider_name');

            if (error) throw error;
            return data;
        }
    });

    const activateMutation = useMutation({
        mutationFn: async (id: string) => {
            // 1. Deactivate all
            const { error: deactivateError } = await supabase
                .from('ai_providers')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

            if (deactivateError) throw deactivateError;

            // 2. Activate the selected one
            const { error: activateError } = await supabase
                .from('ai_providers')
                .update({ is_active: true })
                .eq('id', id);

            if (activateError) throw activateError;
        },
        onSuccess: () => {
            toast.success("Active AI provider updated successfully");
            queryClient.invalidateQueries({ queryKey: ['ai_providers'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
        },
        onError: (error: any) => {
            toast.error("Failed to update active provider: " + error.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, api_key, model_name }: { id: string, api_key: string, model_name: string }) => {
            const updates: any = {};
            if (api_key) updates.api_key = api_key;
            if (model_name) updates.model_name = model_name;

            const { error } = await supabase
                .from('ai_providers')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("AI provider configured successfully");
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ['ai_providers'] });
        },
        onError: (error: any) => {
            toast.error("Failed to update configuration: " + error.message);
        }
    });

    const handleEdit = (provider: any) => {
        setEditingId(provider.id);
        setEditApiKey(provider.api_key === 'pending' ? '' : provider.api_key);
        setEditModelName(provider.model_name);
    };

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, api_key: editApiKey, model_name: editModelName });
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground mb-1">AI Providers</h1>
                    <p className="text-muted-foreground">Manage dynamic AI configurations and active engines.</p>
                </div>
                <Button variant="outline" className="mt-4 md:mt-0 gap-2">
                    <Cpu className="w-4 h-4" /> Add Custom Provider
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {providers?.map((provider) => (
                    <Card
                        key={provider.id}
                        className={`border transition-all duration-200 ${provider.is_active ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border/50 bg-card/50 hover:border-border'}`}
                    >
                        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${provider.is_active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="capitalize text-lg">{provider.provider_name}</CardTitle>
                                        <CardDescription>Model: {provider.model_name}</CardDescription>
                                    </div>
                                </div>
                                {provider.is_active && (
                                    <Badge variant="default" className="bg-primary/20 text-primary border-0 font-medium tracking-wide shadow-none px-3 py-1">
                                        ACTIVE ENGINE
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {editingId === provider.id ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Key className="w-3.5 h-3.5" /> API Key
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="Enter API Key"
                                            value={editApiKey}
                                            onChange={(e) => setEditApiKey(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Settings2 className="w-3.5 h-3.5" /> Model Name
                                        </label>
                                        <Input
                                            placeholder="e.g. gemini-2.0-flash"
                                            value={editModelName}
                                            onChange={(e) => setEditModelName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" onClick={() => handleSave(provider.id)} disabled={updateMutation.isPending}>
                                            Save Changes
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
                                        {provider.api_key === 'pending' || !provider.api_key ? (
                                            <span className="text-sm text-destructive flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0"></span> Config Required
                                            </span>
                                        ) : (
                                            <span className="text-sm text-success flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-success flex-shrink-0"></span> Configured
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        {editingId !== provider.id && (
                            <CardFooter className="pt-2 pb-4 border-t border-border/50 bg-muted/10 gap-2 flex-wrap sm:flex-nowrap">
                                <Button
                                    variant={provider.is_active ? "secondary" : "default"}
                                    className="flex-1 min-w-[120px]"
                                    disabled={provider.is_active || activateMutation.isPending || provider.api_key === 'pending'}
                                    onClick={() => activateMutation.mutate(provider.id)}
                                >
                                    {provider.is_active ? (
                                        <><Check className="w-4 h-4 mr-2" /> Active</>
                                    ) : (
                                        'Set as Active'
                                    )}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleEdit(provider)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
