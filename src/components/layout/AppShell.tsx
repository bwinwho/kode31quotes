import type { ReactNode } from 'react';
import { BottomNav, SideNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <SideNav />
      <div className="sm:pl-64">
        <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 sm:px-8 sm:pb-16 sm:pt-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
