import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode } from 'react';

interface ProtectedDashboardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'analyst' | 'viewer';
}

export function ProtectedDashboard({ 
  children, 
  requireAuth = true,
  requireRole
}: ProtectedDashboardProps) {
  const { user, loading, role, isAdmin, isAnalyst } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-32 ml-2" />
        </div>
        <main className="container py-8">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role requirements
  if (requireRole) {
    const hasAccess = 
      requireRole === 'admin' ? isAdmin :
      requireRole === 'analyst' ? isAnalyst :
      true;
      
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
