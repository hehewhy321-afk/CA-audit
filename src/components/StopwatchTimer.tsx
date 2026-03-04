import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Play, Pause, Square, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function StopwatchTimer() {
  const { state, addItem } = useApp();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [clientId, setClientId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState(state.caSettings?.default_billing_rate || 2000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleStop = () => {
    setRunning(false);
    setSeconds(0);
  };

  const handleSave = async () => {
    if (seconds < 60) { toast.error('Minimum 1 minute required'); return; }
    if (!clientId) { toast.error('Select a client'); return; }

    const hours = Math.round((seconds / 3600) * 100) / 100;
    await addItem('timeEntries', {
      client_id: clientId,
      staff_id: staffId,
      date: new Date().toISOString().split('T')[0],
      hours,
      description: description || 'Tracked via stopwatch',
      billable,
      rate: Number(rate),
    });
    toast.success(`Saved ${formatTime(seconds)} (${hours}h)`);
    setSeconds(0);
    setRunning(false);
    setDescription('');
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: running ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }} />
        <h3 className="text-sm font-heading font-semibold text-foreground">Stopwatch Timer</h3>
      </div>

      {/* Timer Display */}
      <div className="text-center py-3">
        <p className={cn('text-4xl font-mono font-bold tracking-wider',
          running ? 'text-primary' : 'text-foreground'
        )}>{formatTime(seconds)}</p>
        {seconds > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {(seconds / 3600).toFixed(2)}h · ₨{Math.round((seconds / 3600) * Number(rate)).toLocaleString()}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {!running ? (
          <Button onClick={handleStart} size="sm" className="gap-1.5">
            <Play className="h-3.5 w-3.5" /> {seconds > 0 ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button onClick={handlePause} size="sm" variant="outline" className="gap-1.5">
            <Pause className="h-3.5 w-3.5" /> Pause
          </Button>
        )}
        {seconds > 0 && !running && (
          <>
            <Button onClick={handleSave} size="sm" variant="default" className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
            <Button onClick={handleStop} size="sm" variant="destructive" className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> Discard
            </Button>
          </>
        )}
      </div>

      {/* Config */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div>
          <Label className="text-xs">Client *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {state.clients.filter((c: any) => c.status === 'active').map((c: any) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Staff</Label>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select staff" /></SelectTrigger>
            <SelectContent>
              {state.team.map((t: any) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you working on?" className="h-8 text-xs" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={billable} onCheckedChange={setBillable} />
            <Label className="text-xs">Billable</Label>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Rate ₨</Label>
            <Input type="number" value={rate} onChange={e => setRate(+e.target.value)} className="h-8 w-20 text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
