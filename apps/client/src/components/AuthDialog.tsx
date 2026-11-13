import { FormEvent, useState } from 'react';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';


interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
}

export function AuthDialog({ open, onClose, onSubmit }: AuthDialogProps) {
const lang: LanguageCode = useLangStore((store) => store.language);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(mode, email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.auth_fail[lang]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Zamknij">
          ×
        </button>
        <h2 id="auth-title">{mode === 'login' ? localization.auth_login[lang] : localization.auth_signup[lang]}</h2>
        <p className="muted">
          {localization.auth_acc_desc[lang]}
        </p>
        <form className="form-grid" onSubmit={submit}>
          <label>
            {localization.auth_email[lang]}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="np. robert@example.pl" required />
          </label>
          <label>
            {localization.auth_password[lang]}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>
          {error && <p className="error-box">{error}</p>}
          <button className="primary" disabled={loading}>
            {loading ? localization.auth_wait[lang] : mode === 'login' ?  localization.auth_login[lang] : localization.auth_signup[lang]}
          </button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? localization.auth_login_l[lang] : localization.auth_signup_l[lang]}
        </button>
      </section>
    </div>
  );
}
