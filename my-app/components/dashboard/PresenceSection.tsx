import { TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';

interface PresenceItem {
  name: string;
  percentage: number;
}

interface PresenceSectionProps {
  bestPresence: PresenceItem[];
  classesTaughtCount: number;
}

export default function PresenceSection({ bestPresence, classesTaughtCount }: PresenceSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        Mejor Asistencia
      </h3>
      {bestPresence.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-3">
            {bestPresence.map((kid, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-purple-50 text-purple-700 font-bold' : 'bg-slate-50 text-slate-700 font-bold'}`}>
                <span className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                  {idx + 1}. {kid.name}
                </span>
                <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {kid.percentage}%
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-center">
            <Clock className="w-8 h-8 text-amber-600 mb-1" />
            <span className="font-extrabold text-amber-800 text-base">{classesTaughtCount} Clases Impartidas</span>
            <p className="text-xs text-amber-600 mt-0.5">Excelente rendimiento.</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 text-sm py-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
          Aún no hay registro de asistencia.
        </div>
      )}
    </div>
  );
}