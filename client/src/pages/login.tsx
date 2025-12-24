import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

type AuthStep = 'login' | 'otp';

export default function Login() {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, verifyOtp, pendingEmail } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast({
          title: 'Verification Code Sent',
          description: result.message,
        });
        setStep('otp');
      } else {
        toast({
          title: 'Login Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await verifyOtp(pendingEmail || email, otp);
      
      if (result.success) {
        toast({
          title: 'Welcome!',
          description: 'Login successful',
        });
        setLocation('/');
      } else {
        toast({
          title: 'Verification Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleBackToLogin() {
    setStep('login');
    setOtp('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">AISiksha Admin</h1>
          <p className="text-muted-foreground mt-2">Guru Admin Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 'otp' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToLogin}
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {step === 'login' ? 'Admin Login' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'login' 
                ? 'Sign in with your admin credentials' 
                : `Enter the verification code sent to ${pendingEmail || email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-password"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                      autoFocus
                      data-testid="input-otp"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in 5 minutes
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          OurShiksha Guru Admin Portal v1.0
        </p>
      </div>
    </div>
  );
}
