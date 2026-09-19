'use client';
import { useState, useEffect, JSX } from 'react';

type NoticeType = 'Evento' | 'Reunión' | 'Ayuno';

interface NoticeCardProps {
  type?: NoticeType;
  title?: string;
  date?: string;
  start_time?: string;
  time_range?: string;
}

interface TimeLeftState {
  days: number;
  hours: number;
  isPast: boolean;
  isToday: boolean;
}

export default function NoticeCard({
  type = 'Evento',
  title,
  date,
  start_time,
  time_range
}: NoticeCardProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeftState>({ days: 0, hours: 0, isPast: false, isToday: false });
  
  const typeStyles: Record<NoticeType, string> = {
    Evento: 'bg-purple-50 border-purple-200 text-purple-700',
    Reunión: 'bg-blue-50 border-blue-200 text-blue-700',
    Ayuno: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  useEffect(() => {
    if (!date) return;

    const calculateTimeLeft = () => {
      const targetString = start_time ? `${date}T${start_time}` : `${date}T00:00:00`;
      const targetDate = new Date(targetString);
      const now = new Date();

      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, isPast: true, isToday: false });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);

      const isToday = days === 0 && targetDate.getDate() === now.getDate();

      setTimeLeft({ days, hours, isPast: false, isToday });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [date, start_time]);

  const renderCountdownText = (): JSX.Element => {
    if (timeLeft.isPast) {
      return <span className="text-slate-400">Finalizado / En curso</span>;
    }
    if (timeLeft.isToday) {
      return <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">🔥 ¡Es hoy!</span>;
    }

    const textParts: string[] = [];
    if (timeLeft.days > 0) {
      textParts.push(`${timeLeft.days} ${timeLeft.days === 1 ? 'día' : 'días'}`);
    }
    if (timeLeft.hours > 0 || timeLeft.days === 0) {
      textParts.push(`${timeLeft.hours} ${timeLeft.hours === 1 ? 'hora' : 'horas'}`);
    }

    return (
      <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
        ⏳ Faltan {textParts.join(' y ')}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${typeStyles[type] || typeStyles.Evento}`}>
            {type}
          </span>
          <span className="text-xs text-slate-400 font-medium">{date}</span>
        </div>

        {title && (
          <h4 className="font-bold text-slate-800 text-base mb-2 line-clamp-2">
            {title}
          </h4>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
        {type === 'Ayuno' && time_range ? (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              🕒 {time_range}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {renderCountdownText()}
            </span>
          </div>
        ) : (
          <div className="w-full text-center">
            {renderCountdownText()}
          </div>
        )}
      </div>
    </div>
  );
}