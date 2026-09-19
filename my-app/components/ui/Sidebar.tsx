'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CalendarDays,
  Cake,
  CheckSquare,
  FolderKanban,
  X
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Cronograma de clases', href: '/schedule', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Grupos de maestros', href: '/groups', icon: <Users className="w-5 h-5" /> },
  { name: 'Eventos', href: '/events', icon: <CalendarDays className="w-5 h-5" /> },
  { name: 'Cumpleaños', href: '/birthdays', icon: <Cake className="w-5 h-5" /> },
  { name: 'Asistencia de niños', href: '/presence', icon: <CheckSquare className="w-5 h-5" /> },
  { name: 'Reuniones de maestros', href: '/meetings', icon: <FolderKanban className="w-5 h-5" /> },
];

function SidebarContent({ isCollapsed, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col pt-16 lg:pt-0
        transition-all duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64 shadow-xl lg:shadow-none
      `}>
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100">
          <span className="font-bold text-slate-800 text-sm">Menú</span>
          <button onClick={onCloseMobile} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1.5 mt-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <div key={item.href} title={isCollapsed ? item.name : ''} onClick={onCloseMobile}>
                <Button
                  href={item.href}
                  icon={item.icon}
                  title={isCollapsed ? undefined : item.name}
                  variant={isActive ? 'primary' : 'secondary'}
                  className={`w-full justify-start ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-200 hover:bg-blue-700'
                      : 'border-transparent bg-transparent text-slate-600 hover:bg-purple-50 hover:text-purple-700 shadow-none'
                  } ${isCollapsed ? 'lg:justify-center' : ''}`}
                />
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={
      <div className="w-64 h-screen bg-white border-r border-slate-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <SidebarContent {...props} />
    </Suspense>
  );
}