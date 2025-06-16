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
      setLoading(false)
    }

    fetchSchwingerUndBewertungen()
  }, [id])

  if (loading) return <p>Lädt...</p>
  if (error) return <p>Fehler: {error}</p>
  if (!schwinger) return <p>Schwinger nicht gefunden</p>

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>{schwinger.vorname} {schwinger.name} ({schwinger.wohnort})</h1>

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
                  <div>Bewertung erstellt von:  <strong>{b.created_username || '-'}</strong>.</div>
                  <div>Zuletzt geändert von:    <strong>{b.updated_username || '-'}</strong>.</div>
                  <div>Kommentar: {b.kommentar || 'Keine Bewertungstexte'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href={`/schwinger/${id}/bewerten`}>
            <button>Bewertung bearbeiten / erstellen</button>
          </Link>
        </div>

        <div style={{marginTop: '1rem'}}>
          <Link href="https://esv.ch/ranglisten/statistiken/">
            <button>Paarungen</button>
          </Link>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <Link href="/schwinger">
            <button>Zurück zur Liste</button>
          </Link>
        </div>

        {schwinger.link_pdf ? (
        <div style={{ width: '100%' }}>

          <a href={schwinger.link_pdf} target="_blank" rel="noopener noreferrer">
            <iframe
              src={schwinger.link_pdf}
              style={{ width: '100%', height: '800px', border: '1px solid #ccc', marginTop: '1rem' }}
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
