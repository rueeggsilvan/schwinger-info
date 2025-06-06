import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        const router = useRouter();
        const currentPath = router.asPath;
        <div className="logo">
          <Link href="https://nosv.esv.ch/home/">
            <Image src="/logo.png" alt="Zur Schwingerliste" width={150} height={50} />
          </Link>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menü öffnen/schließen"
        >
          ☰
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Start
          </Link>
          <Link href="/schwinger" className="nav-link" onClick={() => setMenuOpen(false)}>
            Schwingerliste
          </Link>

          {session ? (
            <>
              <span className="nav-user">
                Eingeloggt als <strong>{profile?.username || session.user.email}</strong>
              </span>
              <Link href="/profil" className="nav-link" onClick={() => setMenuOpen(false)}>
                Profil bearbeiten
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSession(null);
                  setProfile(null);
                  setMenuOpen(false);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(currentPath)}`}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </nav>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
