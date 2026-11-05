import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './auth.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { isConfigured } from './lib/supabase'
import Menu from './pages/Menu.jsx'
import Login from './pages/admin/Login.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Dishes from './pages/admin/Dishes.jsx'
import Categories from './pages/admin/Categories.jsx'
import Settings from './pages/admin/Settings.jsx'
import QRPage from './pages/admin/QRPage.jsx'

function MissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        <h1 className="mb-2 text-lg font-semibold">Supabase is not configured</h1>
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> as environment variables
          (a local <code>.env</code> file, or Cloudflare Pages &gt; Settings &gt; Variables), then rebuild. See README.md.</p>
      </div>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <MissingConfig />
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/admin">
            <Route index element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dishes" element={<Dishes />} />
                <Route path="categories" element={<Categories />} />
                <Route path="settings" element={<Settings />} />
                <Route path="qr" element={<QRPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  )
}
