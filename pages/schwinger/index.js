import { useEffect, useState, useRef, useCallback } from 'react'
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

  const [userSession, setUserSession] = useState(null)
  const [showAddSchwingerForm, setShowAddSchwingerForm] = useState(false)
  const [newSchwinger, setNewSchwinger] = useState({
    vorname: '',
    name: '',
    wohnort: '',
    bild_url: '',
    tv: '',
    link_pdf: '',
  })
  const [addSchwingerError, setAddSchwingerError] = useState(null)
  const [addSchwingerSuccess, setAddSchwingerSuccess] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchSchwinger = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('schwinger')
      .select(`
        *,
        bewertungen (
          created_by,
          updated_by
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Fehler beim Laden:', error)
      setError(error.message)
      setLoading(false)
      return
    }

    const userIds = Array.from(
      new Set(
        data.reduce((acc, s) => {
          ;[].concat(s.bewertungen || []).forEach(b => {
            if (b.created_by) acc.push(b.created_by)
            if (b.updated_by) acc.push(b.updated_by)
          })
          return acc
        }, [])
      )
    ).filter(Boolean)

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
      const bewertungenWithUsernames = [].concat(s.bewertungen || []).map(b => ({
        ...b,
        created_username: profilesMap[b.created_by] || null,
        updated_username: profilesMap[b.updated_by] || null,
      }))
      return { ...s, bewertungen: bewertungenWithUsernames }
    })

    setSchwinger(dataWithProfiles)
    setFilteredSchwinger(dataWithProfiles)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSchwinger()
  }, [fetchSchwinger, refreshTrigger])

  useEffect(() => {
    const filtered = schwinger
    .filter(s => s.tv && s.tv !== 'NOSV') // NOSV und leere raus
    .filter(s => {
      const searchString = `${s.vorname} ${s.name} ${s.wohnort}`.toLowerCase()
      const matchesSearch = searchString.includes(searchTerm.toLowerCase())
      const matchesTeilverband = !teilverbandFilter || s.tv === teilverbandFilter
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
   
  const handleAddSchwinger = async (e) => {
    e.preventDefault()
    setAddSchwingerError(null)
    setAddSchwingerSuccess(false)

    if (!newSchwinger.vorname || !newSchwinger.name || !newSchwinger.tv) {
      setAddSchwingerError('Vorname, Name und Teilverband sind Pflichtfelder.')
      return
    }

    try {
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('schwinger')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)

      if (maxIdError) throw maxIdError

      const newId = (maxIdData && maxIdData.length > 0) ? maxIdData[0].id + 1 : 1

      const { error } = await supabase.from('schwinger').insert([
        {
          id: newId,
          vorname: newSchwinger.vorname,
          name: newSchwinger.name,
          wohnort: newSchwinger.wohnort || null,
          bild_url: newSchwinger.bild_url || null,
          tv: newSchwinger.tv,
          link_pdf: newSchwinger.link_pdf || null,
        },
      ])

      if (error) throw error

      setAddSchwingerSuccess(true)
      setNewSchwinger({
        vorname: '',
        name: '',
        wohnort: '',
        bild_url: '',
        tv: '',
        link_pdf: '',
      })
      setShowAddSchwingerForm(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      setAddSchwingerError(error.message)
      console.error('Fehler beim Hinzufügen des Schwingers:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSchwinger(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  return (
    <Layout>
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>Schwingerliste</h1>
          {userSession && !showAddSchwingerForm && (
            <button
              onClick={() => setShowAddSchwingerForm(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', color: '#4CAF50', padding: 0 }}
              title="Neuen Schwinger erfassen"
            >
              ➕
            </button>
          )}
        </div>

        {/* Add Schwinger Form */}
        {userSession && showAddSchwingerForm && (
          <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--color-background)' }}>
            <h2>Neuen Schwinger erfassen</h2>
            <form onSubmit={handleAddSchwinger}>
              {addSchwingerError && <p style={{ color: 'red', marginBottom: '1rem' }}>{addSchwingerError}</p>}
              {addSchwingerSuccess && <p style={{ color: 'green', marginBottom: '1rem' }}>Schwinger erfolgreich hinzugefügt!</p>}

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="vorname" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Vorname (Pflichtfeld):</label>
                <input
                  type="text"
                  id="vorname"
                  name="vorname"
                  value={newSchwinger.vorname}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Nachname (Pflichtfeld):</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newSchwinger.name}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="wohnort" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Wohnort:</label>
                <input
                  type="text"
                  id="wohnort"
                  name="wohnort"
                  value={newSchwinger.wohnort}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="bild_url" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Bild URL:</label>
                <input
                  type="text"
                  id="bild_url"
                  name="bild_url"
                  value={newSchwinger.bild_url}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="tv" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Teilverband (Pflichtfeld):</label>
                <select
                  id="tv"
                  name="tv"
                  value={newSchwinger.tv}
                  onChange={handleInputChange}
                >
                  <option value="">Wähle einen Teilverband</option>
                  <option value="ISV">ISV</option>
                  <option value="SWSV">SWSV</option>
                  <option value="BKSV">BKSV</option>
                  <option value="NWSV">NWSV</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="link_pdf" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Link PDF:</label>
                <input
                  type="text"
                  id="link_pdf"
                  name="link_pdf"
                  value={newSchwinger.link_pdf}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="button">
                  Schwinger hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSchwingerForm(false)
                    setAddSchwingerError(null)
                    setAddSchwingerSuccess(false)
                    setNewSchwinger({ vorname: '', name: '', wohnort: '', bild_url: '', tv: '', link_pdf: '' })
                  }}
                  className="button"
                  style={{ backgroundColor: '#6c757d' }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        <input
          type="text"
          placeholder="Suchbegriff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />

        <select
          value={teilverbandFilter}
          onChange={(e) => setTeilverbandFilter(e.target.value)}
          style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Wähle einen Teilverband</option>
          <option value="ISV">ISV</option>
          <option value="SWSV">SWSV</option>
          <option value="BKSV">BKSV</option>
          <option value="NWSV">NWSV</option>
        </select>

        {loading && <p>Lade Daten...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <ul className="grid-list">
          {filteredSchwinger.slice(0, visibleCount).map(s => {
            const ersteBewertung = s.bewertungen?.[0]
            const bewertungUsername = ersteBewertung?.created_username
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
                  <div>{bewertungUsername ? `Bewertet von: ${bewertungUsername}` : 'Noch nicht bewertet'}</div>
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
