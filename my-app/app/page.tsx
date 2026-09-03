import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Calendar, Sparkles } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-between font-sans">
      <nav className="w-full flex justify-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 h-16">
        <div className="w-full max-w-6xl flex justify-between items-center px-6 text-sm">
          <div className="flex items-center gap-3 font-extrabold text-slate-800 text-lg">
            <span className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            JP KIDS
          </div>
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#352EF2] text-white font-bold text-sm shadow-md shadow-blue-500/30 hover:opacity-90 transition-all"
              >
                Ir al Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#352EF2] text-white font-bold text-sm shadow-md shadow-blue-500/30 hover:opacity-90 transition-all"
              >
                Iniciar Sesión <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold mb-6 tracking-wide uppercase">
          Ministerio de Niños • <span className="font-normal">Versión Beta</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl mb-6">
          Plataforma de gestión y control para <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">maestros de niños</span>
        </h1>

        <p className="text-slate-600 text-base md:text-lg max-w-xl mb-10">
          Organiza cronogramas, asistencia, grupos y eventos de forma segura y centralizada.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left mt-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Cronogramas</h3>
            <p className="text-slate-500 text-sm">Gestiona turnos, clases y asignaciones de maestros sin confusiones.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Grupos y Asistencia</h3>
            <p className="text-slate-500 text-sm">Lleva el registro detallado de asistencia y control de grupos de niños.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Acceso Seguro</h3>
            <p className="text-slate-500 text-sm">Autenticación basada en roles y permisos específicos protegidos por Supabase.</p>
          </div>
        </div>
      </div>

      <footer className="w-full py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>JP KIDS • Todos los derechos reservados</p>
      </footer>
    </main>
  );
}