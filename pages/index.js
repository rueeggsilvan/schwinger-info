import Layout from '../components/layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <h1>Willkommen! 🎉</h1>
      <p>Nutze die Schwingerliste um einen Schwinger auszuwählen, sein Profil anzusehen und ihn zu bewerten.</p>
      <Link href="/schwinger">
        <button style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Zur Schwingerliste
        </button>
      </Link>
    </Layout>
  );
}

