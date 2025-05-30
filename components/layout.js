import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Layout({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!error) setProfile(profileData);
      }
    };
    getSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error) setProfile(data);
            else setProfile(null);
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">
          <Image src="/logo.png" alt="Zur Schwingerliste" width={150} height={50} />
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">
            Start
          </Link>
          <Link href="/schwinger" className="nav-link">
            Schwingerliste
          </Link>

          {session ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="nav-user">
                Eingeloggt als <strong>{profile?.username || session.user.email}</strong>
              </span>
              <Link href="/profil">
                <button>Profil bearbeiten</button>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSession(null);
                  setProfile(null);
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="nav-link">
              Login
            </Link>
          )}
        </nav>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}
