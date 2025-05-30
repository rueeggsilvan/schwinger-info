import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const { next } = router.query

  useEffect(() => {
    async function checkAndCreateProfile() {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      // Profil prüfen
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const username = user.email ? user.email.split('@')[0] : 'User'

        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          username,
        })

        if (insertError) {
          console.error('Fehler beim Anlegen des Profils:', insertError)
          alert('Fehler beim Anlegen des Profils.')
          return
        }
      } else if (profileError) {
        console.error('Fehler beim Laden des Profils:', profileError)
        alert('Fehler beim Laden des Profils.')
        return
      }

      // Weiterleitung - falls next gesetzt ist, dahin, sonst zur Startseite
      const redirectTo = next ? decodeURIComponent(next) : '/'
      router.replace(redirectTo)
    }

    checkAndCreateProfile()
  }, [router, next])

  return <p>Profil wird geprüft… Bitte warten.</p>
}
