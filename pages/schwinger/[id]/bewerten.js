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
        setFormData(prev => ({ ...prev, bewerter_name: data.user.email })) // Nur dieses Feld ist Pflicht
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
      alert('Bitte gib deinen Namen an.')
      return
    }

    const payload = {
      ...formData,
      schwinger_id: id
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
      <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-4xl mx-auto">
        {felderDefinition.map((gruppe, i) => (
          <div key={i} className="border-b pb-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">{gruppe.gruppe}</h2>

            {!gruppe.matrix ? (
              <table className="table-auto w-full">
              <tbody>
                {gruppe.felder.map((feld, index) => (
                  <tr key={index} className="align-top">
                    <td className="pr-4 py-2 font-medium w-64">{feld.label}</td>
                    <td className="py-2">
                      {feld.type === 'text' ? (
                        <textarea
                          value={formData[feld.name] || ''}
                          onChange={(e) => handleChange(feld.name, e.target.value)}
                          className="border rounded px-3 py-2 w-full"
                        />
                      ) : (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData[feld.name] || ''}
                          onChange={(e) => handleChange(feld.name, e.target.value)}
                          className="border rounded px-2 py-1 w-24"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
              gruppe.felder.map((feld, index) => (
                <div key={index} className="mb-4">
                  {feld.type === 'text' ? (
                    <>
                      <label className="block font-medium mb-1">{feld.label}</label>
                      <textarea
                        value={formData[feld.name] || ''}
                        onChange={(e) => handleChange(feld.name, e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </>
                  ) : (
                    <div className="flex items-center">
                      <label className="w-64 font-medium">{feld.label}</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData[feld.name] || ''}
                        onChange={(e) => handleChange(feld.name, e.target.value)}
                        className="border rounded px-2 py-1 w-24"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}

        <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded">
          Bewertung speichern
        </button>
      </form>
    </Layout>
  )
}
