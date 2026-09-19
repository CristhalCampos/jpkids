'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleItem {
  id: string | number;
  date: string;
  day: string;
  group_id?: number | string;
}

interface ScheduleSectionProps {
  weeklySchedule?: ScheduleItem[];
  teacherGroups?: number[];
}

export default function ScheduleSection({ weeklySchedule = [], teacherGroups = [] }: ScheduleSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [weeklySchedule]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Cronograma
        </h3>

        <div className="flex items-center gap-4">
          <Link
            href="/schedule"
            className="text-sm font-medium text-purple-600 cursor-pointer hover:underline"
          >
            Ver todo
          </Link>

          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-1 text-slate-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-1 text-slate-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {weeklySchedule.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {weeklySchedule.map((item, idx) => {
            const dateObj = new Date(item.date + 'T00:00:00');
            const dayName = item.day ? item.day.toUpperCase() : '';
            const dayNumber = dateObj.getDate();
            const monthName = dateObj.toLocaleString('es', { month: 'short' }).toUpperCase();
            const isToday = item.date === todayStr;
            const isTeacherGroupDay = item.group_id && teacherGroups.includes(Number(item.group_id));
            const isHighlighted = isToday || Boolean(isTeacherGroupDay);

            return (
              <div
                key={item.id || idx}
                className={`min-w-[140px] flex-1 p-4 rounded-2xl flex flex-col items-center justify-center text-center border shrink-0 transition-all ${
                  isHighlighted
                    ? 'bg-purple-50 border-purple-200 shadow-xs'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className={`text-xs font-bold tracking-wide ${isHighlighted ? 'text-purple-600' : 'text-slate-400'}`}>
                  {dayName}
                </span>

                <div className="my-1 flex items-baseline gap-1">
                  <span className={`text-xl font-extrabold ${isHighlighted ? 'text-purple-900' : 'text-slate-800'}`}>
                    {dayNumber}
                  </span>
                  <span className={`text-xs font-bold uppercase ${isHighlighted ? 'text-purple-600' : 'text-slate-500'}`}>
                    {monthName}
                  </span>
                </div>

                {item.group_id && (
                  <span className={`text-[11px] font-semibold mt-1 px-2 py-0.5 rounded-md ${
                    isHighlighted ? 'bg-purple-200/60 text-purple-800' : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    Grupo {item.group_id}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 text-sm py-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
          <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
          No hay actividades programadas en el cronograma próximamente.
        </div>
      )}
    </div>
  );
}