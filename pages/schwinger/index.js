import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Layout from '../../components/layout'
import Image from 'next/image'

export default function Home() {
  const [schwinger, setSchwinger] = useState([])
  const [filteredSchwinger, setFilteredSchwinger] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSchwinger() {
      setLoading(true)
      const { data, error } = await supabase
        .from('schwinger')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Fehler beim Laden:', error)
        setError(error.message)
      } else {
        setSchwinger(data)
        setFilteredSchwinger(data)
      }
      setLoading(false)
    }
    fetchSchwinger()
  }, [])

  useEffect(() => {
    const filtered = schwinger.filter(s =>
      `${s.vorname} ${s.name} ${s.wohnort}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSchwinger(filtered)
  }, [searchTerm, schwinger])

  if (loading) return <p>Lade Schwingerliste...</p>
  if (error) return <p style={{ color: 'red' }}>Fehler: {error}</p>

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>Schwingerliste</h1>
        <input
          type="text"
          placeholder="Nach Schwinger suchen (Name, Vorname, Wohnort)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%', maxWidth: '400px' }}
        />
        {filteredSchwinger.length === 0 && <p>Keine Schwinger gefunden.</p>}
        <ul>
          {filteredSchwinger.map((s) => (
            <li key={s.id} style={{ margin: '1rem 0' }}>
              <Link
                href={`/schwinger/${s.id}`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                {s.bild_url ? (
                <Image
                    src={s.bild_url}
                    alt={s.name}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover' }}
                />
                ) : (
                  <div style={{
                    width: 100, height: 100, backgroundColor: '#ccc',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                  }}>
                    Kein Bild
                  </div>
                )}
                <div>
                  <div><strong>{s.vorname} {s.name}</strong></div>
                  <div>{s.wohnort}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}


