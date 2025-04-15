import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Redirect } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, User, Mail, Lock } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(3, 'Display name must be at least 3 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user } = useAuth();
  const supabaseAuth = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already logged in
  if (user || supabaseAuth.user) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signIn(data.email, data.password);
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signUp(data.email, data.password, {
        displayName: data.displayName
      });
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#111B21] mb-4 flex items-center">
            <span className="inline-block bg-[#25D366] text-white p-2 rounded-lg mr-3">
              <MessageCircle size={24} />
            </span>
            WhatsApp Web Clone
          </h1>
          <p className="text-[#8696A0] mb-8 text-lg">
            A simple and secure messaging application that lets you connect with friends, family, and colleagues.
          </p>
          <div className="hidden md:block space-y-6">
            <div className="flex items-start">
              <div className="bg-[#25D366] p-2 rounded-lg mr-4">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111B21]">Real-time messaging</h3>
                <p className="text-[#8696A0]">Send and receive messages instantly</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-[#34B7F1] p-2 rounded-lg mr-4">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111B21]">User profiles</h3>
                <p className="text-[#8696A0]">Personalize your account with status updates and profile images</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl text-[#111B21]">
                {activeTab === 'login' ? 'Login to your account' : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Sign up to start messaging with your friends'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  placeholder="your.email@example.com" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  type="password" 
                                  placeholder="Enter your password" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#25D366] hover:bg-opacity-90"
                        disabled={loading}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  placeholder="your.email@example.com" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  placeholder="Your name as shown to others" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  type="password" 
                                  placeholder="Create a password" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-[#25D366] px-3">
                                <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                <Input 
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                                  type="password" 
                                  placeholder="Confirm your password" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#25D366] hover:bg-opacity-90"
                        disabled={loading}
                      >
                        {loading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <p className="text-sm text-[#8696A0]">
                {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Button 
                  variant="link" 
                  className="p-0 text-[#25D366]" 
                  onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                >
                  {activeTab === 'login' ? 'Sign up' : 'Sign in'}
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
