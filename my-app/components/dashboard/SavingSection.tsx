import { PiggyBank } from 'lucide-react';

interface SavingsData {
  reason?: string;
  current_amount?: number;
  target_amount?: number;
}

interface SavingSectionProps {
  savingsData: SavingsData | null;
}

export default function SavingSection({ savingsData }: SavingSectionProps) {
  if (!savingsData) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-purple-200 text-sm font-semibold">
          <PiggyBank className="w-5 h-5" />
          <span>Meta de Ahorro Ministerial</span>
        </div>
        <h3 className="text-xl font-black">{savingsData.reason || "Fondo para el Ministerio"}</h3>
        <p className="text-xs text-purple-100 opacity-90">
          Progreso hacia el objetivo de alcanzar los recursos necesarios.
        </p>
      </div>
      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 w-full md:w-auto justify-between md:justify-start">
        <div>
          <span className="block text-xs text-purple-200">Ahorrado</span>
          <span className="text-2xl font-black">${Number(savingsData.current_amount || 0).toFixed(2)}</span>
        </div>
        <div className="text-purple-300 font-bold">/</div>
        <div>
          <span className="block text-xs text-purple-200">Objetivo</span>
          <span className="text-2xl font-black">${Number(savingsData.target_amount || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}