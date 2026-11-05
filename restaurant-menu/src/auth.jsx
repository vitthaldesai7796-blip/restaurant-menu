import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { FullPageLoader } from './components/ui'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAdmin = useCallback(async (s) => {
    if (!s) { setIsAdmin(false); return }
    const { data, error } = await supabase.rpc('is_admin')
    setIsAdmin(!error && data === true)
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      // defer: calling Supabase inside this callback can dead-lock
      setTimeout(async () => { await checkAdmin(s); setLoading(false) }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [checkAdmin])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message)
    const { data: ok, error: e2 } = await supabase.rpc('is_admin')
    if (e2 || ok !== true) {
      await supabase.auth.signOut()
      throw new Error('This account is not authorized to manage the menu.')
    }
    setIsAdmin(true)
  }, [])

  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])

  const value = useMemo(() => ({ session, isAdmin, loading, signIn, signOut }), [session, isAdmin, loading, signIn, signOut])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <FullPageLoader label="Checking access…" />
  if (!session || !isAdmin) return <Navigate to="/admin" replace />
  return <Outlet />
}
