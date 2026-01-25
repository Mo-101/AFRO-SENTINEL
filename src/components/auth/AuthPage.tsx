import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: AuthFormValues) => {
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-african">AFRO Sentinel</h1>
          <p className="text-muted-foreground mt-1">Watchtower Intelligence System</p>
        </div>

        <Card className="card-african">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Enter your details to create your account'
                : 'Enter your credentials to access the dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isSignUp && (
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dr. Jane Doe"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@organization.org"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  form.reset();
                }}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              By continuing, you agree to monitor disease signals responsibly.
            </p>

            {/* Test Credentials - Remove before production */}
            <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Test Credentials
              </p>
              <div className="space-y-1 text-xs font-mono">
                <p><span className="text-muted-foreground">Email:</span> admin@afrosentinel.test</p>
                <p><span className="text-muted-foreground">Pass:</span> Admin123!</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-7"
                onClick={() => {
                  form.setValue('email', 'admin@afrosentinel.test');
                  form.setValue('password', 'Admin123!');
                }}
              >
                Auto-fill credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
