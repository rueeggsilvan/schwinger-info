import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient'
import Layout from '../../../components/layout'
import felderDefinition from '../bewertungsfelder.json'
import Link from 'next/link'

export default function Bewerten() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({})
  const [savedData, setSavedData] = useState({})
  const [schwinger, setSchwinger] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bewertungExists, setBewertungExists] = useState(false)
  const router = useRouter()
  const { id } = router.query
  const currentPath = router.asPath;

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Fehler beim Abrufen des Benutzers:', userError)
        setLoading(false)
        return
      }

      setUser(user)

      // Lade Profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Fehler beim Laden des Profils:', profileError)
        alert('Fehler beim Laden des Profils')
        setLoading(false)
        return
      }

      setFormData((prev) => ({
        ...prev,
        bewerter_name: profile.username,
      }))

      // Lade Schwinger
      const { data: schwingerData, error: schwingerError } = await supabase
        .from('schwinger')
        .select('vorname, name, wohnort')
        .eq('id', id)
        .single()

      if (schwingerError && !schwingerData) {
        console.error('Fehler beim Laden des Schwingers:', schwingerError)
        alert('Schwinger konnte nicht geladen werden.')
      } else {
        setSchwinger(schwingerData)
      }

      // Bestehende Bewertung laden
      const { data: existingBewertung, error: bewertungError } = await supabase
        .from('bewertungen')
        .select('*')
        .eq('schwinger_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (bewertungError) {
        console.error('Fehler beim Laden der Bewertung:', bewertungError)
      } else if (existingBewertung) {
        setFormData(prev => ({
          ...prev,
          ...existingBewertung,
          bewerter_name: profile.username,
          
        }))
        setSavedData(existingBewertung)
        setBewertungExists(true)
      }

      setLoading(false)
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Funktion für Slider-Styles
  const getSliderClass = (name) => {
    const value = formData[name]
    const saved = savedData[name]

    if (value == null || value === '') return 'bewertungs-slider unset'
    if (saved != null && value !== saved) return 'bewertungs-slider changed'
    if (value == saved) return 'bewertungs-slider'
    return 'bewertungs-slider'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.bewerter_name) {
      alert('Dein Benutzername muss gesetzt sein.')
      return
    }

    // 1. Hole aktuellen User sicherheitshalber nochmals
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      alert('Du musst eingeloggt sein, um zu bewerten.')
      return
    }
    const currentUser = authData.user

    const payload = {
      ...formData,
      schwinger_id: id,
      user_id: currentUser.id,
    }

    // Unnötige/gefährliche Felder aus dem Payload entfernen
    delete payload.id;
    delete payload.created_at;
    delete payload.created_by; // Sicherstellen, dass wir es nicht versehentlich überschreiben

    // 2. Prüfen, ob schon eine Bewertung von diesem User für diesen Schwinger existiert
    const { data: existing, error: checkError } = await supabase
      .from('bewertungen')
      .select('id, created_by')
      .eq('schwinger_id', id)
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (checkError) {
      console.error('Fehler beim Prüfen:', checkError)
      alert('Fehler beim Prüfen der bestehenden Bewertung.')
      return
    }

    let saveError = null;

    if (existing) {
      // 3. UPDATE: Bewertung existiert bereits
      payload.updated_by = currentUser.id
      
      const { error } = await supabase
        .from('bewertungen')
        .update(payload)
        .eq('id', existing.id)
        
      saveError = error
    } else {
      // 4. INSERT: Neue Bewertung
      payload.created_by = currentUser.id
      payload.updated_by = currentUser.id

      const { error } = await supabase
        .from('bewertungen')
        .insert(payload)

      saveError = error
    }

    if (saveError) {
      console.error('Fehler beim Speichern der Bewertung:', saveError)
      alert(`Fehler beim Speichern der Bewertung: ${saveError.message}`)
    } else {
      alert('Bewertung gespeichert.')
      router.push(`/schwinger/${id}`)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Lade Benutzerdaten...</p>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div>
          <p>Nur eingeloggte Benutzer dürfen bewerten.</p>
          <Link href={`/login?next=${encodeURIComponent(currentPath)}`}>Zum Login</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="seite-bewerten w-auto mx-auto p-4">
        {schwinger && (
          <h1 className="text-2xl font-bold mb-2">
            {schwinger.name} {schwinger.vorname} ({schwinger.wohnort})
          </h1>
        )}
        <p className="info-text">
          Bitte bewerte mit Zahlen von 1 (schwach) bis 5 (sehr stark).
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {felderDefinition.map((gruppe, i) => (
            <div key={i} className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">{gruppe.gruppe}</h2>

              {gruppe.matrix ? (
                <div className="table-wrapper">
                <table className="table-auto w-auto border">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 text-left">Eigenschaft</th>
                      {gruppe.kategorien.map((kategorie, index) => (
                        <th key={index} className="border px-2 py-1">{kategorie}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gruppe.felder.map((feld, index) => (
                      <tr key={index}>
                        <td className='max-w-4x1'>{feld.label}</td>
                        {feld.names.map((name, idx) => (
                          <td key={idx}>
                          <div className="slider-container">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={formData[name] || 3}
                            onChange={(e) => handleChange(name, e.target.value)}
                            className={getSliderClass(name)}
                          />
                          <div className="slider-label-track">
                            {[1, 2, 3, 4, 5].map((zahl) => (
                              <span key={zahl}>{zahl}</span>
                            ))}
                          </div>
                          </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

              ) : (
                <div className="table-wrapper">
                <table className="table-auto w-auto">
                  <tbody>
                    {gruppe.felder.map((feld, index) => (
                      <tr key={index} className="border-b">
                        <td className="label-cell px-2 py-2 w-auto">{feld.label}</td>
                        <td className="px-2 py-2">
                          {feld.name === 'bewerter_name' ? (
                            <input
                              type="text"
                              value={formData[feld.name] || ''}
                              readOnly
                              className="border rounded px-2 py-1 w-auto"
                            />
                          ) : feld.type === 'text' ? (
                            <textarea
                              value={formData[feld.name] || ''}
                              onChange={(e) => handleChange(feld.name, e.target.value)}
                              className="border rounded px-2 py-1 w-auto"
                            />
                          ) : (
                            <><input
                                  type="range"
                                  min="1"
                                  max="5"
                                  step="1"
                                  value={formData[feld.name] || 3}
                                  onChange={(e) => handleChange(feld.name, parseInt(e.target.value))}
                                  className={getSliderClass(feld.name)} />
                                  <div className="slider-label-track">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                      <span key={num}>{num}</span>
                                    ))}
                            </div></>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          ))}
          <button type="submit">
            {bewertungExists ? 'Änderungen speichern' : 'Bewertung speichern'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
