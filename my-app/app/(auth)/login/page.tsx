'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/ui/Logo';
import Footer from '@/components/ui/Footer';
import Button from '@/components/ui/Button';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales inválidas o usuario no registrado.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col items-center justify-between p-4 font-sans text-center"
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
          <div className="bg-white rounded-[34px] px-6 py-10 flex flex-col items-center text-left">
            <div className="w-full text-center mb-6">
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">
                Iniciar Sesión
              </h1>
              <p className="text-slate-500 text-sm">
                Ingresa a la plataforma del ministerio de niños
              </p>
            </div>

            {error && (
              <div className="w-full mb-6 p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">Correo electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <label className="text-xs font-bold text-slate-700 ml-1">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Ver contraseña"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                title={loading ? "Verificando..." : "Ingresar"}
                className="w-full py-3.5 rounded-2xl bg-[#352EF2] hover:opacity-90 text-white font-bold shadow-md shadow-blue-500/30 text-sm transition-all text-center flex items-center justify-center"
              />
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}