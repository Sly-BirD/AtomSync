import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Target, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { switchUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // ==========================================
    // HACKATHON EVALUATOR BYPASS
    // ==========================================
    // If they use a demo email, bypass Supabase completely to avoid email bounces!
    const isDemoEmail = ['employee@atomquest.com', 'manager@atomquest.com', 'admin@atomquest.com'].includes(email);
    
    if (isDemoEmail) {
      if (password !== 'Demo123!') {
        setError("Invalid demo password. Use 'Demo123!'");
        setIsLoading(false);
        return;
      }
      if (email === 'employee@atomquest.com') switchUser('emp1');
      if (email === 'manager@atomquest.com') switchUser('mgr1');
      if (email === 'admin@atomquest.com') switchUser('admin1');
      return;
    }
    // ==========================================

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created! If you turned off email confirmations, you can sign in now.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginBottom: '16px' }}>
            <Target size={28} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome to AtomSync
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isSignUp ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(214, 48, 49, 0.1)',
            color: '#d63031',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {isLoading ? <Loader2 size={18} className="spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
