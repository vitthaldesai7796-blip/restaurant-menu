import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, LogOut, Menu as MenuIcon, QrCode, Salad, Settings as Cog, Tags, X } from 'lucide-react'
import { useAuth } from '../../auth.jsx'
import { useMenuData } from '../../hooks'
import { Spinner } from '../../components/ui'

const links = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'dishes', label: 'Dishes', icon: Salad },
  { to: 'categories', label: 'Categories', icon: Tags },
  { to: 'settings', label: 'Restaurant settings', icon: Cog },
  { to: 'qr', label: 'QR code', icon: QrCode },
]

export default function AdminLayout() {
  const { session, signOut } = useAuth()
  const data = useMenuData()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Icon size={18} />{label}
        </NavLink>
      ))}
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"><ExternalLink size={18} />View customer menu</a>
    </nav>
  )
  const footer = (
    <div className="border-t border-slate-800 p-4">
      <p className="mb-3 truncate text-xs text-slate-400">{session?.user?.email}</p>
      <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"><LogOut size={16} />Log out</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 py-5 lg:flex">
        <p className="px-6 pb-6 text-base font-semibold text-white">{data.settings?.name || 'Menu admin'}</p>
        {nav}{footer}
      </aside>
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
        <p className="truncate font-semibold">{data.settings?.name || 'Menu admin'}</p>
        <button onClick={() => setOpen(true)} aria-label="Open menu"><MenuIcon /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-64 flex-col bg-slate-900 py-5">
            <button className="absolute right-3 top-3 text-slate-300" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
            <p className="px-6 pb-6 text-base font-semibold text-white">Menu admin</p>{nav}{footer}
          </div>
        </div>
      )}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {data.loading ? <div className="flex justify-center py-20 text-slate-500"><Spinner size={28} /></div>
          : data.error ? <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">Could not load data: {data.error}</p>
          : <Outlet context={data} />}
      </main>
    </div>
  )
}
