import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Layout from '../../components/layout'
import Image from 'next/image'

export default function Home() {
  const [schwinger, setSchwinger] = useState([])
  const [filteredSchwinger, setFilteredSchwinger] = useState([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [teilverbandFilter, setTeilverbandFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loaderRef = useRef(null)

  useEffect(() => {
    async function fetchSchwinger() {
      setLoading(true)
      const { data, error } = await supabase
        .from('schwinger')
        .select(`
          *,
          bewertungen (
            user_id
          )
        `)
        .order('name', { ascending: true })

      if (error) {
        console.error('Fehler beim Laden:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      const userIds = [...new Set(data.flatMap(s => s.bewertungen.map(b => b.user_id)))].filter(Boolean)

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      if (profilesError) {
        console.error('Fehler beim Laden der Profile:', profilesError)
        setError(profilesError.message)
        setLoading(false)
        return
      }

      const profilesMap = {}
      profilesData.forEach(p => {
        profilesMap[p.id] = p.username
      })

      const dataWithProfiles = data.map(s => {
        const bewertungenWithUsernames = s.bewertungen.map(b => ({
          ...b,
          username: profilesMap[b.user_id] || null
        }))
        return { ...s, bewertungen: bewertungenWithUsernames }
      })

      setSchwinger(dataWithProfiles)
      setFilteredSchwinger(dataWithProfiles)
      setLoading(false)
    }

    fetchSchwinger()
  }, [])

  useEffect(() => {
    const filtered = schwinger
      .filter(s => s.tv !== 'NOSV')
      .filter(s => {
        const matchesSearch = `${s.vorname} ${s.name} ${s.wohnort}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTeilverband = teilverbandFilter === '' || s.tv === teilverbandFilter
        return matchesSearch && matchesTeilverband
      })
    setFilteredSchwinger(filtered)
    setVisibleCount(10)
  }, [searchTerm, teilverbandFilter, schwinger])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const first = entries[0]
      if (first.isIntersecting) {
        setVisibleCount(prev => {
          const newCount = prev + 10
          return newCount > filteredSchwinger.length ? filteredSchwinger.length : newCount
        })
      }
    }, { threshold: 1 })

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) observer.unobserve(currentLoader)
    }
  }, [filteredSchwinger])

  if (loading) return <p>Lade Schwingerliste...</p>
  if (error) return <p style={{ color: 'red' }}>Fehler: {error}</p>

  const teilverbandOptions = Array.from(new Set(schwinger.map(s => s.tv).filter(Boolean))).sort()

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>Schwingerliste</h1>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Suche nach Name oder Ort"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, minWidth: '200px' }}
          />
          <select
            value={teilverbandFilter}
            onChange={e => setTeilverbandFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Alle Teilverbände</option>
            {teilverbandOptions.map(tv => (
              <option key={tv} value={tv}>{tv}</option>
            ))}
          </select>
        </div>

        <ul className="grid-list">
          {filteredSchwinger.slice(0, visibleCount).map(s => (
            <li key={s.id} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {s.bild_url ? (
                <img
                  src={s.bild_url}
                  alt={`${s.vorname} ${s.name}`}
                  className="list-image"
                  loading="lazy"
                />
              ) : (
                <div
                  className="list-image"
                  style={{ backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999', fontSize: '0.8rem' }}
                >
                  Kein Bild
                </div>
              )}
              <div>
                <Link href={`/schwinger/${s.id}`}>
                  <a style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    {s.vorname} {s.name}
                  </a>
                </Link>
                <p>{s.tv}</p>
                <p>{s.wohnort}</p>
              </div>
            </li>
          ))}
        </ul>

        <div ref={loaderRef} style={{ height: '1px' }} />

        {visibleCount < filteredSchwinger.length && (
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>Scroll nach unten zum Laden...</p>
        )}

        {filteredSchwinger.length === 0 && (
          <p>Keine Schwinger gefunden.</p>
        )}
      </div>
    </Layout>
  )
}
