import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
//import './global.css'; // nur nötig, falls nicht global importiert

export default function Layout({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">
          <Image src="/logo.png" alt="Zur Schwingerliste" width={100} height={60} />
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Start</Link>
          <Link href="/schwinger" className="nav-link">Schwingerliste</Link>
          {session ? (
            <span className="nav-user">Eingeloggt als {session.user.email}</span>
          ) : (
            <Link href="/login" className="nav-link">Login</Link>
          )}
        </nav>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}