import { useState } from 'react';
import { Lock, LogIn, UserPlus, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'daftar'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          setError(
            authError.message.includes('Invalid login credentials')
              ? 'Email atau password salah.'
              : 'Terjadi kesalahan. Coba lagi beberapa saat.'
          );
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (authError) {
          setError(
            authError.message.includes('already registered')
              ? 'Akun dengan email ini sudah terdaftar. Silakan masuk.'
              : 'Terjadi kesalahan. Coba lagi beberapa saat.'
          );
        } else if (data.user) {
          setInfo(
            'Akun berhasil dibuat. Jika email kamu belum terdaftar sebagai admin, hubungi admin yang ada untuk menambahkan email kamu.'
          );
          setMode('login');
          setPassword('');
        }
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FEF1F7] via-white to-[#FDF2F8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-pink-100/50">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FB5EA8] text-white">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dampingcare Management System</h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'login'
                ? 'Masuk untuk melanjutkan ke aplikasi'
                : 'Daftar akun baru (hanya email yang diizinkan dapat mengakses)'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4 text-gray-400" /> Email
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password kamu"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 font-semibold text-white transition hover:bg-[#e04b93] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              'Memproses…'
            ) : mode === 'login' ? (
              <>
                <LogIn className="h-5 w-5" /> Masuk
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" /> Daftar
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'daftar' : 'login');
              setError('');
              setInfo('');
            }}
            className="font-semibold text-[#FB5EA8] hover:underline"
          >
            {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </p>
      </div>
    </div>
  );
}
