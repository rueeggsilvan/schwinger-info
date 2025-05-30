import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient'
import Layout from '../../../components/layout'
import felderDefinition from '../bewertungsfelder.json'
import Link from 'next/link'

export default function Bewerten() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const router = useRouter()
  const { id } = router.query // schwinger id

  // User und Profil laden
  useEffect(() => {
    const loadUserAndProfile = async () => {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        setError('Fehler beim Laden des Users')
        return
      }

      if (!currentUser) {
        setError('Bitte erst einloggen, um zu bewerten.')
        return
      }

      setUser(currentUser)

      // Profil mit Username laden
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        setError('Fehler beim Laden des Profils')
        return
      }

      setProfile(profileData)

      // Bewerter-Name im Formular setzen (username oder fallback Email)
      setFormData((prev) => ({
        ...prev,
        bewerter_name: profileData?.username || currentUser.email || '',
      }))
    }

    loadUserAndProfile()
  }, [])

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('Du musst eingeloggt sein, um eine Bewertung abzugeben.')
      setLoading(false)
      return
    }

    // Bewertung abspeichern
    try {
      const bewertungsDaten = {
        schwinger_id: id,
        user_id: user.id,
        bewerter_name: formData.bewerter_name,
        kommentar: formData.kommentar || '',
        // je nachdem, welche Felder du noch hast, kannst du sie hier ergänzen
      }

      const { error: insertError } = await supabase
        .from('bewertungen')
        .insert([bewertungsDaten])

      if (insertError) {
        setError('Fehler beim Abspeichern der Bewertung: ' + insertError.message)
        setLoading(false)
        return
      }

      setSuccess('Bewertung erfolgreich gespeichert!')
      setFormData({ bewerter_name: formData.bewerter_name, kommentar: '' })
    } catch (err) {
      setError('Fehler: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <h1>Schwinger bewerten</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Bewerter Name:
              <input
                type="text"
                name="bewerter_name"
                value={formData.bewerter_name || ''}
                onChange={(e) => handleChange('bewerter_name', e.target.value)}
                required
                disabled={true} // falls nicht änderbar, sonst false
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              Kommentar:
              <textarea
                name="kommentar"
                value={formData.kommentar || ''}
                onChange={(e) => handleChange('kommentar', e.target.value)}
                rows={5}
                style={{ width: '100%', padding: '0.5rem' }}
                placeholder="Deine Bewertung"
              />
            </label>
          </div>

          {/* Wenn du weitere Bewertungsfelder hast, kannst du sie hier mit ähnlicher Logik rendern */}

          <button type="submit" disabled={loading}>
            {loading ? 'Speichert...' : 'Bewertung absenden'}
          </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
          <Link href={`/schwinger/${id}`}>
            <button>Zurück zum Schwinger</button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
