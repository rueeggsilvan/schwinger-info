import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/layout';

export default function Profil() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage('Bitte erst einloggen.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) {
        setMessage('Fehler beim Laden des Profils.');
      } else {
        setProfile(data);
        setUsername(data.username);
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function updateUsername(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage('Bitte erst einloggen.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);

    if (error) {
      setMessage('Fehler beim Speichern.');
    } else {
      setMessage('Benutzername wurde aktualisiert.');
      setProfile({ ...profile, username });
    }
    setLoading(false);
  }

  if (loading) return <Layout><p>Lädt...</p></Layout>;

  return (
    <Layout>
      <h1>Profil bearbeiten</h1>
      {message && <p>{message}</p>}
      <form onSubmit={updateUsername}>
        <label>
          Benutzername:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          Speichern
        </button>
      </form>
    </Layout>
  );
}
