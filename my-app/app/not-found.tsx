"use client";
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import Footer from '@/components/ui/Footer';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-between font-sans p-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <header className="pt-6 flex justify-center">
        <Logo horizontal={false} size={45} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="p-[2px] rounded-[36px] bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-xl w-full max-w-md">
          <div className="bg-white rounded-[34px] px-6 py-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600">
              <FileQuestion className="w-8 h-8" />
            </div>

            <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
              404
            </span>

            <h2 className="text-xl font-bold text-slate-800 mb-2">
              ¡Página no encontrada!
            </h2>
            
            <p className="text-slate-500 text-sm mb-8 px-4">
              La ruta que buscas no existe o fue movida.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <Button
                href="/"
                title="Volver al inicio"
                icon={<Home className="w-4 h-4" />}
                variant="primary"
                className="w-full sm:w-auto"
              />
              <Button
                onClick={() => router.back()}
                title="Regresar"
                icon={<ArrowLeft className="w-4 h-4" />}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Regresar
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}