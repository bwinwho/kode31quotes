import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function Login() {
  const { firebaseUser, loading: authLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && firebaseUser) navigate('/', { replace: true });
  }, [authLoading, firebaseUser, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-3 animate-fade-up">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-300 text-2xl font-bold text-white shadow-glow">
          K
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-base-50">Kode31 Quote Studio</h1>
          <p className="mt-1 text-sm text-base-400">Internal tool · Team access only</p>
        </div>
      </div>

      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-base-700/80 bg-base-850/70 p-6 shadow-soft [animation-delay:100ms]">
        {!isFirebaseConfigured && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Firebase isn't configured yet. Add your project credentials to a <code>.env.local</code> file (see{' '}
            <code>.env.example</code>) to enable sign-in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@kode31.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" size="lg" className="mt-2 w-full" loading={loading}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <button
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          className="mt-5 w-full text-center text-sm text-base-400 transition-colors hover:text-accent-300"
        >
          {mode === 'signin' ? "New to the team? Create an account" : 'Already have an account? Sign in'}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-base-500">The first account created automatically becomes an admin.</p>
    </div>
  );
}
