import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/layout'
import Image from 'next/image'
import BewertungsVorschau from '../../components/BewertungsVorschau'


export default function SchwingerDetail() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const { id } = router.query

  const [schwinger, setSchwinger] = useState(null)
  const [bewertungen, setBewertungen] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showEditForm, setShowEditForm] = useState(false)
  const [editSchwinger, setEditSchwinger] = useState({
    vorname: '',
    name: '',
    wohnort: '',
    bild_url: '',
    tv: '',
    link_pdf: '',
  })
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user)
    })
  }, [])

  useEffect(() => {
    if (!id) return

    async function fetchSchwingerUndBewertungen() {
      setLoading(true)

      // 1. Schwinger mit Bewertungen laden ohne Profile
      const { data, error } = await supabase
        .from('schwinger')
        .select(`
          *,
          bewertungen (
            *
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // 2. User IDs aus Bewertungen sammeln (erstellt/aktualisiert)
      const userIds = Array.from(
        new Set(
          [].concat(data.bewertungen || []).reduce((acc, b) => {
            if (b.created_by) acc.push(b.created_by)
            if (b.updated_by) acc.push(b.updated_by)
            return acc
          }, [])
        )
      ).filter(Boolean)

      // 3. Profile laden
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      if (profilesError) {
        setError(profilesError.message)
        setLoading(false)
        return
      }

      // 4. Profile map
      const profilesMap = {}
      profilesData.forEach(p => {
        profilesMap[p.id] = p.username
      })

      // 5. Profile in Bewertungen einfügen
      const bewertungenWithUsernames = [].concat(data.bewertungen || []).map(b => ({
        ...b,
        created_username: profilesMap[b.created_by] || null,
        updated_username: profilesMap[b.updated_by] || null
      }))

      setSchwinger(data)
      setBewertungen(bewertungenWithUsernames)
      
      setEditSchwinger({
        vorname: data.vorname || '',
        name: data.name || '',
        wohnort: data.wohnort || '',
        bild_url: data.bild_url || '',
        tv: data.tv || '',
        link_pdf: data.link_pdf || ''
      })

      setLoading(false)
    }

    fetchSchwingerUndBewertungen()
  }, [id])

  const handleEditSchwinger = async (e) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(false)

    if (!editSchwinger.vorname || !editSchwinger.name || !editSchwinger.tv) {
      setEditError('Vorname, Name und Teilverband sind Pflichtfelder.')
      return
    }

    try {
      const { error } = await supabase
        .from('schwinger')
        .update({
          vorname: editSchwinger.vorname,
          name: editSchwinger.name,
          wohnort: editSchwinger.wohnort || null,
          bild_url: editSchwinger.bild_url || null,
          tv: editSchwinger.tv,
          link_pdf: editSchwinger.link_pdf || null,
        })
        .eq('id', id)

      if (error) throw error

      setEditSuccess(true)
      setSchwinger(prev => ({
        ...prev,
        ...editSchwinger
      }))
      setShowEditForm(false)
    } catch (error) {
      setEditError(error.message)
      console.error('Fehler beim Aktualisieren des Schwingers:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditSchwinger(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  if (loading) return <p>Lädt...</p>
  if (error) return <p>Fehler: {error}</p>
  if (!schwinger) return <p>Schwinger nicht gefunden</p>

  return (
    <Layout>
      <div className="responsive-padding">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {schwinger.vorname} {schwinger.name} ({schwinger.wohnort}) - {schwinger.tv}
          {user && !showEditForm && (
            <button
              onClick={() => setShowEditForm(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', padding: 0 }}
              title="Schwinger bearbeiten"
            >
              ✏️
            </button>
          )}
        </h1>

        {/* Edit Schwinger Form */}
        {user && showEditForm && (
          <div style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--color-background)' }}>
            <h2>Schwinger bearbeiten</h2>
            <form onSubmit={handleEditSchwinger}>
              {editError && <p style={{ color: 'red', marginBottom: '1rem' }}>{editError}</p>}
              {editSuccess && <p style={{ color: 'green', marginBottom: '1rem' }}>Schwinger erfolgreich aktualisiert!</p>}

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="vorname" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Vorname (Pflichtfeld):</label>
                <input
                  type="text"
                  id="vorname"
                  name="vorname"
                  value={editSchwinger.vorname}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Nachname (Pflichtfeld):</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editSchwinger.name}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="wohnort" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Wohnort:</label>
                <input
                  type="text"
                  id="wohnort"
                  name="wohnort"
                  value={editSchwinger.wohnort}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="bild_url" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Bild URL:</label>
                <input
                  type="text"
                  id="bild_url"
                  name="bild_url"
                  value={editSchwinger.bild_url}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="tv" className="info-text" style={{ display: 'block', marginBottom: '0.5rem' }}>Teilverband (Pflichtfeld):</label>
                <select
                  id="tv"
                  name="tv"
                  value={editSchwinger.tv}
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
                  value={editSchwinger.link_pdf}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="button">
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditError(null)
                    setEditSuccess(false)
                    if (schwinger) {
                      setEditSchwinger({
                        vorname: schwinger.vorname || '',
                        name: schwinger.name || '',
                        wohnort: schwinger.wohnort || '',
                        bild_url: schwinger.bild_url || '',
                        tv: schwinger.tv || '',
                        link_pdf: schwinger.link_pdf || ''
                      })
                    }
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

        {schwinger.bild_url ? (
          <Image
            src={schwinger.bild_url}
            alt={schwinger.name}
            width={200}
            height={200}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <p>Kein Bild verfügbar</p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <h2>Bewertungen</h2>
          {bewertungen.length === 0 ? (
            <p>Dieser Schwinger wurde noch nicht bewertet.</p>
          ) : (
            <ul className='noPoints'>
              {bewertungen.map(b => (
                <li key={b.id}>
                  <div>Bewertung erstellt von:  <strong>{b.created_username || '-'}</strong></div>
                  <div>Zuletzt geändert von:    <strong>{b.updated_username || '-'}</strong></div>
                  <div>Zuletzt bewertet am: <strong>{b.updated_at ? new Date(b.updated_at).toLocaleDateString('de-CH') : '-'}</strong></div>
                  <div>Kommentar: {b.kommentar || '-'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href={`/schwinger/${id}/bewerten`} className="button">
            Bewertung bearbeiten / erstellen
          </Link>
        </div>

        <div style={{marginTop: '1rem'}}>
          <a href="https://esv.ch/ranglisten/statistiken/" target="_blank" rel="noopener noreferrer" className="button">
            Paarungen
          </a>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <Link href="/schwinger" className="button">
            Zurück zur Liste
          </Link>
        </div>

        {schwinger.link_pdf ? (
        <div style={{ width: '100%' }}>

          <a href={schwinger.link_pdf} target="_blank" rel="noopener noreferrer">
            <iframe
              src={schwinger.link_pdf}
              style={{ width: '100%', height: '500px', border: '1px solid #ccc', marginTop: '1rem' }}
            />
          </a>
        </div>
      ) : (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
          Kein PDF verfügbar.
        </p>
      )}

      {user && bewertungen.length > 0 && (
      <BewertungsVorschau bewertung={bewertungen[0]} />
      )}

      </div>
    </Layout>
  )
}
