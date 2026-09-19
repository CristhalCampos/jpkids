import { Star, AlertCircle } from 'lucide-react';
import IndividualCard from '@/components/ui/IndividualCard';

interface StarItem {
  name: string;
  image?: string;
  stars: number;
}

interface StarsSectionProps {
  topStars: StarItem[];
}

export default function StarsSection({ topStars }: StarsSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          Mejor Desempeño
        </h3>
        <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">Acumulado anual</span>
      </div>
      
      {topStars.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {topStars.map((kid, idx) => (
            <div key={idx} className="relative">
              <span className="absolute -top-2 left-2 z-10 text-xs font-extrabold bg-amber-400 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {idx + 1}
              </span>
              <IndividualCard
                name={kid.name}
                image={kid.image}
                stars={kid.stars}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 text-sm py-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
          Aún no se ha calificado a los niños con estrellas.
        </div>
      )}
    </div>
  );
}