import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'ca' | 'client'>('ca');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-heading font-bold text-foreground">
            AuditPro<span className="text-primary">Nepal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">CA Practice Management System</p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <Tabs value={tab} onValueChange={v => setTab(v as 'ca' | 'client')}>
            <TabsList className="w-full bg-muted mb-6">
              <TabsTrigger value="ca" className="flex-1">CA Login</TabsTrigger>
              <TabsTrigger value="client" className="flex-1">Client Portal</TabsTrigger>
            </TabsList>

            <TabsContent value="ca">
              <LoginForm
                title="Chartered Accountant Login"
                description="Sign in with your CA credentials"
                onSubmit={async (email, password) => {
                  const { error } = await signIn(email, password);
                  if (error) toast({ title: 'Login failed', description: error, variant: 'destructive' });
                }}
              />
            </TabsContent>

            <TabsContent value="client">
              <Tabs defaultValue="login">
                <TabsList className="w-full bg-muted/50 mb-4">
                  <TabsTrigger value="login" className="flex-1 text-xs">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1 text-xs">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm
                    title="Client Portal"
                    description="View and submit your documents"
                    onSubmit={async (email, password) => {
                      const { error } = await signIn(email, password);
                      if (error) toast({ title: 'Login failed', description: error, variant: 'destructive' });
                    }}
                  />
                </TabsContent>
                <TabsContent value="signup">
                  <SignUpForm
                    onSubmit={async (email, password, name) => {
                      const { error } = await signUp(email, password, name, 'client');
                      if (error) {
                        toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
                      } else {
                        toast({ title: 'Account created', description: 'Please check your email to confirm your account.' });
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          CA accounts are created by firm administrators
        </p>
      </div>
    </div>
  );
}

function LoginForm({ title, description, onSubmit }: {
  title: string; description: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(email, password);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div>
        <Label className="text-xs">Email</Label>
        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-10" placeholder="email@example.com" />
      </div>
      <div>
        <Label className="text-xs">Password</Label>
        <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="h-10" placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
        <LogIn className="h-4 w-4" />
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

function SignUpForm({ onSubmit }: {
  onSubmit: (email: string, password: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(email, password, name);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Create Client Account</h2>
        <p className="text-xs text-muted-foreground">Sign up to access your document portal</p>
      </div>
      <div>
        <Label className="text-xs">Full Name</Label>
        <Input required value={name} onChange={e => setName(e.target.value)} className="h-10" placeholder="Your full name" />
      </div>
      <div>
        <Label className="text-xs">Email</Label>
        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-10" placeholder="email@example.com" />
      </div>
      <div>
        <Label className="text-xs">Password</Label>
        <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="h-10" placeholder="Min 6 characters" />
      </div>
      <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
        <UserPlus className="h-4 w-4" />
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
