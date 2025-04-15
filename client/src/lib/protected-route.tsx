import { useAuth } from "@/hooks/use-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { user: supabaseUser, isLoading: isSupabaseLoading } = useSupabaseAuth();
  
  const isLoading = isAuthLoading || isSupabaseLoading;
  const isAuthenticated = user || supabaseUser;

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />
}
