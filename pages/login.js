import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/layout';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { next } = router.query; // z.B. /schwinger/5

  {/*
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname + window.location.search);
    }
  }, []);
  */}

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

      const user = data.user;

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          const username = user.email.split('@')[0];

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              { id: user.id, username: username }
            ]);

          if (insertError) {
            console.error('Fehler beim Erstellen des Profils:', insertError);
          }
        }

        router.push(next ?? '/profil');
      }
    }
  };

  return (
    <Layout>
      <div>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
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
