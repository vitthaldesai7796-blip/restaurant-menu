import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../auth.jsx'
import { Spinner } from '../../components/ui'

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    try { await signIn(email.trim(), password) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white"><ShieldCheck size={22} /></span>
          <div><h1 className="text-lg font-semibold text-slate-900">Admin sign in</h1><p className="text-xs text-slate-500">Restaurant menu manager</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className="a-label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" className="a-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="a-label" htmlFor="pw">Password</label>
            <input id="pw" type="password" autoComplete="current-password" className="a-input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="a-btn-primary w-full" disabled={busy}>{busy ? <Spinner size={16} /> : <Lock size={16} />}Sign in</button>
        </form>
        <a href="/" className="mt-6 block text-center text-xs text-slate-500 hover:text-slate-700">Back to menu</a>
      </div>
    </div>
  )
}
