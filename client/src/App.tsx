import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import { SupabaseAuthAdapter } from "./hooks/use-supabase-auth-adapter";
import { DevTools } from "@/components/dev-tools";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ChatPage from "@/pages/chat-page";
import MotionShowcasePage from "@/pages/motion-showcase";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={ChatPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/motion-showcase" component={MotionShowcasePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <SupabaseAuthAdapter>
          <AuthProvider>
            <Router />
            <Toaster />
            <DevTools />
          </AuthProvider>
        </SupabaseAuthAdapter>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
