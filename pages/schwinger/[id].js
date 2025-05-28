import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Layout from '../../components/layout'

export default function SchwingerDetail() {
  const router = useRouter()
  const { id } = router.query

  const [schwinger, setSchwinger] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    async function fetchSchwinger() {
      setLoading(true)
      const { data, error } = await supabase
        .from('schwinger')
        .select('*')
        .eq('id', id)
        .single()
      if (error) setError(error.message)
      else setSchwinger(data)
      setLoading(false)
    }
    fetchSchwinger()
  }, [id])

  if (loading) return <p>Lädt...</p>
  if (error) return <p>Fehler: {error}</p>
  if (!schwinger) return <p>Schwinger nicht gefunden</p>

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>{schwinger.vorname} {schwinger.name} ({schwinger.wohnort})</h1>

        {schwinger.bild_url ? (
          <img src={schwinger.bild_url} alt={`${schwinger.vorname} ${schwinger.name}`} width={200} />
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
