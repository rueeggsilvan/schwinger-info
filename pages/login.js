import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/layout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname + window.location.search);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    const emailTrimmed = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTrimmed,
      password: password,
    });

    if (error) {
      console.error(error);
      setMessage('Login fehlgeschlagen. Kontrolliere E-Mail oder Passwort.');
    } else {
      setMessage('Login erfolgreich!');
      window.location.href = '/profil'; // Redirect nach Login
    }
  };

  return (
    <Layout>
      <div>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </Layout>
  );
}
