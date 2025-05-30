import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabaseClient'
import Layout from '../../../components/layout'
import felderDefinition from '../bewertungsfelder.json'
import Link from 'next/link'

export default function Bewerten() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({})
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
        // Automatisch bewerter_name setzen
        setFormData(prev => ({ ...prev, bewerter_name: data.user.email }))
      }
    }
    checkUser()
  }, [])

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.bewerter_name) {
      alert('Dein Name muss eingetragen sein.')
      return
    }

    const payload = {
      ...formData,
      schwinger_id: id,
    }

    const { error } = await supabase.from('bewertungen').insert(payload)

    if (error) {
      alert(`Fehler beim Speichern der Bewertung: ${error.message}`)
      console.error('Supabase Insert Error:', error)
    } else {
      alert('Bewertung gespeichert.')
    }
  }

  if (!user) {
    return (
      <Layout>
        <div>
          <p>Nur eingeloggte Benutzer dürfen bewerten.</p>
          <Link href="/login">Zum Login</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-3xl mx-auto">
        {felderDefinition.map((gruppe, i) => (
          <div key={i} className="border-b pb-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">{gruppe.gruppe}</h2>

            {gruppe.matrix ? (
              <table className="table-auto w-full border">
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
                      <td className="border px-2 py-1">{feld.label}</td>
                      {feld.names.map((name, idx) => (
                        <td key={idx} className="border px-2 py-1">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData[name] || ''}
                            onChange={(e) => handleChange(name, e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table-auto w-full">
                <tbody>
                  {gruppe.felder.map((feld, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-2 align-top font-medium">{feld.label}</td>
                      <td className="px-2 py-2">
                        {feld.type === 'text' ? (
                          <textarea
                            value={formData[feld.name] || ''}
                            onChange={(e) => handleChange(feld.name, e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData[feld.name] || ''}
                            onChange={(e) => handleChange(feld.name, e.target.value)}
                            className="border rounded px-2 py-1 w-32"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Bewerten
        </button>
      </form>
    </Layout>
  )
}
