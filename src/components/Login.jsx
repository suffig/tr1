import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { ErrorHandler, FormValidator } from '../utils/errorHandling';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      FormValidator.validateRequired(email, 'E-Mail');
      FormValidator.validateRequired(password, 'Passwort');
      FormValidator.validateEmail(email);

      if (!isLogin && password.length < 6) {
        throw new Error('Passwort muss mindestens 6 Zeichen haben');
      }

      const { error } = isLogin
        ? await supabase.auth.signInWithPassword({
            email: FormValidator.sanitizeInput(email),
            password
          })
        : await supabase.auth.signUp({
            email: FormValidator.sanitizeInput(email),
            password
          });

      if (error) throw error;

      if (!isLogin) {
        ErrorHandler.showUserError(
          'Bitte bestätige deine Email und logge dich dann ein.',
          'success'
        );
        setIsLogin(true);
      } else {
        ErrorHandler.showUserError('Erfolgreich angemeldet!', 'success');
      }
    } catch (error) {
      ErrorHandler.handleAuthError(error, isLogin ? 'Anmeldung' : 'Registrierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-green to-primary-green-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⚽</div>
            <h1 className="text-2xl font-bold text-text-primary">
              FIFA Tracker
            </h1>
            <p className="text-text-muted mt-2">
              Verfolge FIFA-Spiele, Spieler und Statistiken
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="deine@email.de"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Dein Passwort"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  {isLogin ? 'Anmelden...' : 'Registrieren...'}
                </div>
              ) : (
                isLogin ? 'Anmelden' : 'Registrieren'
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-green hover:text-primary-green-dark text-sm font-medium"
              disabled={loading}
            >
              {isLogin 
                ? 'Noch kein Konto? Registrieren'
                : 'Bereits ein Konto? Anmelden'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}