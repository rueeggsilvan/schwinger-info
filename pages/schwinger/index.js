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
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [filteredSchwinger])

  return (
    <Layout>
      <main className="main-content">
        <h1>Schwingerliste</h1>

        <input
          type="text"
          placeholder="Suche..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
        />

        <select
          value={teilverbandFilter}
          onChange={e => setTeilverbandFilter(e.target.value)}
          style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
        >
          <option value="">Alle Teilverbände</option>
          <option value="OSV">OSV</option>
          <option value="EOV">EOV</option>
          <option value="BVS">BVS</option>
          <option value="NOSV">NOSV</option>
        </select>

        {loading && <p>Lade Daten...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <ul className="grid-list">
          {filteredSchwinger.slice(0, visibleCount).map(s => {
            return (
              <li key={s.id} className="grid-list-item">
              <Link href={`/schwinger/${s.id}`} className="item-link">
                {s.bild_url ? (
                  <Image
                    src={s.bild_url}
                    alt={`${s.vorname} ${s.name}`}
                    width={100}
                    height={100}
                    className="item-image"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="item-image placeholder">Kein Bild</div>
                )}
                  <div className="item-text">
                  <div><strong>{s.vorname} {s.name}</strong></div>
                  <div>{s.wohnort}</div>
                  <div>{s.tv}</div>
                {/* Weitere Infos hier */}
                </div>
              </Link>
            </li>
            )
          })}
        </ul>

        <div ref={loaderRef} style={{ height: '1px' }}></div>
      </main>
    </Layout>
  )
}
