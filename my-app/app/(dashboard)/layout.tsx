'use client';

import { useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import Sidebar from '@/components/ui/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleToggleSidebar = () => {
    setIsOpenMobile(prev => !prev);
  };

  const handleToggleCollapseDesktop = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        onToggleCollapseDesktop={handleToggleCollapseDesktop}
      />

      <div className="flex pt-16 flex-1 relative overflow-hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
        />

        <main className={`flex-1 p-6 transition-all duration-300 overflow-y-auto ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-0'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}