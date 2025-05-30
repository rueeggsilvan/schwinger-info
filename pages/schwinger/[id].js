import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/layout'
import Image from 'next/image'

export default function SchwingerDetail() {
  const router = useRouter()
  const { id } = router.query

  const [schwinger, setSchwinger] = useState(null)
  const [bewertungen, setBewertungen] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
            id,
            kommentar,
            user_id
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // 2. User IDs aus Bewertungen sammeln
      const userIds = [...new Set(data.bewertungen.map(b => b.user_id))].filter(Boolean)

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
      const bewertungenWithUsernames = data.bewertungen.map(b => ({
        ...b,
        username: profilesMap[b.user_id] || null
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

        <table style={{ marginTop: '1rem', borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr><td><strong>Geburtsdatum:</strong></td><td>{schwinger.geburtsdatum || '–'}</td></tr>
            <tr><td><strong>Sternzeichen:</strong></td><td>{schwinger.sternzeichen || '–'}</td></tr>
            <tr><td><strong>Zivilstand:</strong></td><td>{schwinger.zivilstand || '–'}</td></tr>
            <tr><td><strong>Größe:</strong></td><td>{schwinger.groesse || '–'}</td></tr>
            <tr><td><strong>Gewicht:</strong></td><td>{schwinger.gewicht || '–'}</td></tr>
            <tr><td><strong>Hobbys:</strong></td><td>{schwinger.hobbys || '–'}</td></tr>
            <tr><td><strong>Erlernter Beruf:</strong></td><td>{schwinger.erlernter_beruf || '–'}</td></tr>
            <tr><td><strong>Jetziger Beruf:</strong></td><td>{schwinger.jetziger_beruf || '–'}</td></tr>
            <tr><td><strong>Besonderes:</strong></td><td>{schwinger.besonderes || '–'}</td></tr>
          </tbody>
        </table>

        <div style={{ marginTop: '1rem' }}>
          <h2>Bewertungen</h2>
          {bewertungen.length === 0 ? (
            <p>Dieser Schwinger wurde noch nicht bewertet.</p>
          ) : (
            <ul>
              {bewertungen.map(b => (
                <li key={b.id}>
                  <strong>{b.username || 'Unbekannter Nutzer'}</strong>: {b.kommentar || 'Keine Bewertungstexte'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href={`/schwinger/${id}/bewerten`}>
            <button>Bewerten</button>
          </Link>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Link href="/schwinger">
            <button>Zurück zur Liste</button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
