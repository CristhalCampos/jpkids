'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, CheckCheck, LogOut } from 'lucide-react';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';

interface Reminder {
  id: string;
  teacher_id: string;
  message_reminder: string;
  date_time: string;
  was_read: boolean;
}

interface TeacherData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface NavbarProps {
  onToggleSidebar: () => void;
  onToggleCollapseDesktop?: () => void;
}

export default function Navbar({ onToggleSidebar, onToggleCollapseDesktop }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData>({});
  const [isLoading, setIsLoading] = useState(true);

  const [notifOpen, setNotifOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('teachers')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data) {
          setTeacherData({
            first_name: data.first_name || 'Maestra',
            last_name: data.last_name || '',
            avatar_url: data.avatar_url || ''
          });
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const fetchReminders = async () => {
      const { data: rems } = await supabase
        .from('reminders')
        .select('*')
        .eq('teacher_id', userId)
        .order('date_time', { ascending: false });
      if (rems) {
        setReminders(rems);
        setUnreadCount(rems.filter((r) => !r.was_read).length);
      }
    };
    fetchReminders();
  }, [userId, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('reminders').update({ was_read: true }).eq('id', id);
    const updated = reminders.map((r) => (r.id === id ? { ...r, was_read: true } : r));
    setReminders(updated);
    setUnreadCount(updated.filter((r) => !r.was_read).length);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = `${teacherData.first_name?.[0] || ''}${teacherData.last_name?.[0] || ''}`.toUpperCase() || 'JP';
  const fullName = `${teacherData.first_name || ''} ${teacherData.last_name || ''}`.trim() || 'Usuario';

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors lg:hidden"
          aria-label="Abrir menú móvil"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Botón exclusivo para colapsar en desktop */}
        {onToggleCollapseDesktop && (
          <button
            onClick={onToggleCollapseDesktop}
            className="hidden lg:block p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors"
            aria-label="Contraer menú"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <div className="flex items-center h-full">
          <Logo horizontal={true} noMargin={true} size={30} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors relative"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notificaciones</p>
                {/* SENIOR: MANTENIDO FUCSIA (No es un botón) */}
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} nuevas
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {reminders.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No hay notificaciones</p>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.id}
                      // SENIOR: MANTENIDO FUCSIA (Es un fondo de estado, no un botón)
                      className={`p-3 text-xs flex items-start justify-between gap-2 transition-colors ${
                        rem.was_read ? 'bg-white opacity-75' : 'bg-purple-50/50 font-medium'
                      }`}
                    >
                      <div>
                        <p className="text-slate-700">{rem.message_reminder}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(rem.date_time).toLocaleDateString()} -{' '}
                          {new Date(rem.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!rem.was_read && (
                        // SENIOR: CAMBIADO A AZUL (Es un botón de acción)
                        <button
                          onClick={() => handleMarkAsRead(rem.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                          title="Marcar como leído"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil de Usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 rounded-full lg:rounded-2xl transition-colors focus:outline-none"
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-purple-200 overflow-hidden flex-shrink-0 relative">
              {/* SENIOR: MANTENIDO FUCSIA (Es un avatar, no un botón) */}
              {teacherData.avatar_url ? (
                <Image src={teacherData.avatar_url} alt={fullName} fill sizes="40px" className="object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <span className="hidden lg:block font-semibold text-sm text-slate-700 pr-2">
              {isLoading ? 'Cargando...' : fullName}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 lg:hidden">
                <p className="text-xs font-semibold text-slate-800">{fullName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}