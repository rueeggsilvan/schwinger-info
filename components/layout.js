import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';


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
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#333', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div><Image src="/logo.png" alt="Zur Schwingerliste" width={100} height={60} /></div>
        <nav>
          <Link href="/" style={{ color: 'white', marginRight: '20px' }}>Start</Link>
          <Link href="/schwinger" style={{ color: 'white', marginRight: '20px' }}> Schwingerliste </Link>
          {session ? (
            <span>Eingeloggt als {session.user.email}</span>
          ) : (
            <Link href="/login" style={{ color: 'white' }}>Login</Link>
          )}
        </nav>
      </header>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}