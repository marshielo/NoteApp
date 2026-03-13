'use client';

import { useUIStore } from '@/stores/ui-store';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBackButton?: boolean;
  headerRightContent?: React.ReactNode;
}

/**
 * Main application shell layout.
 * Wraps pages with Header + optional Sidebar + Main content area.
 */
export function AppShell({
  children,
  showSidebar = true,
  showBackButton = false,
  headerRightContent,
}: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        onMenuClick={toggleSidebar}
        showBackButton={showBackButton}
        rightContent={headerRightContent}
      />

      <div className="flex pt-14">
        {showSidebar && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main content — offset by sidebar width on desktop when sidebar is visible */}
        <main
          className={`min-w-0 flex-1 transition-[margin] duration-250 ${
            showSidebar ? 'lg:ml-[260px]' : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
