import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullscreenLoader } from '@/components/ui/Spinner';
import { AppShell } from '@/components/layout/AppShell';

export function ProtectedRoute({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { firebaseUser, appUser, loading, isAdmin } = useAuth();

  if (loading) return <FullscreenLoader />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (adminOnly && appUser && !isAdmin) return <Navigate to="/" replace />;

  return <AppShell>{children}</AppShell>;
}
