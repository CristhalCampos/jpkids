import { Calendar, AlertCircle } from 'lucide-react';
import NoticeCard from '@/components/ui/NoticeCard';

type NoticeType = 'Evento' | 'Reunión' | 'Ayuno';

interface NoticeItem {
  type: NoticeType; // En lugar de solo string
  title: string;
  date: string;
  start_time: string;
}

interface UpcomingEventsSectionProps {
  upcomingNotices: NoticeItem[];
}

export default function UpcomingEventsSection({ upcomingNotices }: UpcomingEventsSectionProps) {
  return (
    <div className="flex flex-col justify-between">
      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-600" />
        Próximos Eventos
      </h3>
      <div className="flex-1 space-y-3">
        {upcomingNotices.length > 0 ? (
          upcomingNotices.map((anuncio, index) => (
            <NoticeCard
              key={index}
              type={anuncio.type}
              title={anuncio.title}
              date={anuncio.date}
              start_time={anuncio.start_time}
            />
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
            No hay eventos cerca por el momento.
          </div>
        )}
      </div>
    </div>
  );
}