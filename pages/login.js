import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/layout';

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname + window.location.search)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `http://localhost:3000/auth-callback?next=${encodeURIComponent(currentPath)}`
      }
    })
    if (error) {
      setMessage('Eingegebene E-Mail nicht in der Userdatenbank vorhanden. Kontrolliere deine Eingabe, sollte das Problem weiterhin bestehen, kontaktiere einen Administrator.')
    } else {
      setMessage('Check deine E-Mail – Link wurde gesendet.')
    }
  }

  return (
    <Layout>
      <div>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Magic Link senden</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </Layout>
  )
}
