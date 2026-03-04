import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 max-w-[1400px] mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
