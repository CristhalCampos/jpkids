import Button from '@/components/ui/Button';
import { Wrench } from 'lucide-react';

export default function Page() {
  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="p-[2px] rounded-[36px] bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-xl w-full max-w-md">
        <div className="bg-white rounded-[34px] px-6 py-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600">
            <Wrench className="w-8 h-8 animate-bounce" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            En construcción
          </h1>
          
          <p className="text-slate-500 text-sm mb-8 px-4">
            Estamos trabajando para tener esta sección lista muy pronto. ¡Vuelve más tarde!
          </p>

          <Button
            href="/dashboard"
            title="Volver al Dashboard"
            variant="primary"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}