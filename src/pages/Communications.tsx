import { MessageSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Communications() {
  const { state } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">Client communication log</p>
      </div>

      <div className="glass-card rounded-lg p-12 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">Communication Log</p>
        <p className="text-sm text-muted-foreground mt-1">Track all emails, calls, WhatsApp messages, and meetings with clients</p>
      </div>
    </div>
  );
}
