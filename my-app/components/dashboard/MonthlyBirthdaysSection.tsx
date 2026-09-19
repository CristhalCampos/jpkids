import { Gift, AlertCircle } from 'lucide-react';
import GroupCard from '@/components/ui/GroupCard';

interface BirthdayItem {
  name: string;
  image?: string;
}

interface MonthlyBirthdaysSectionProps {
  monthlyBirthdays: BirthdayItem[];
}

export default function MonthlyBirthdaysSection({ monthlyBirthdays }: MonthlyBirthdaysSectionProps) {
  return (
    <div className="flex flex-col justify-between">
      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-500" />
        Cumpleaños del Mes
      </h3>
      <div className="border-2 border-pink-400 rounded-2xl p-1 bg-pink-50/20 flex-1">
        {monthlyBirthdays.length > 0 ? (
          <GroupCard
            title="Cumpleaños del Mes"
            items={monthlyBirthdays}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-8 h-8 text-pink-400 mb-2" />
            No hay cumpleaños cerca este mes.
          </div>
        )}
      </div>
    </div>
  );
}