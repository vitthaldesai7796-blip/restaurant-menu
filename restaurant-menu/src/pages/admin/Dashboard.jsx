import { Link, useOutletContext } from 'react-router-dom'
import { Ban, CheckCircle2, Salad, Tags } from 'lucide-react'
import { formatINR } from '../../lib/utils'
import { VegMark } from '../../components/ui'

export default function Dashboard() {
  const { dishes, categories } = useOutletContext()
  const available = dishes.filter((d) => d.is_available).length
  const stats = [
    { label: 'Total dishes', value: dishes.length, icon: Salad, tone: 'bg-indigo-100 text-indigo-700' },
    { label: 'Available', value: available, icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Unavailable', value: dishes.length - available, icon: Ban, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Categories', value: categories.length, icon: Tags, tone: 'bg-sky-100 text-sky-700' },
  ]
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const recent = dishes.slice(0, 6)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="a-card flex items-center gap-4 p-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}><Icon size={22} /></span>
            <div><p className="text-2xl font-semibold leading-none">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>
      <div className="a-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold">Recently added dishes</h2>
          <Link to="/admin/dishes" className="text-sm text-indigo-600 hover:underline">Manage dishes</Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No dishes yet. <Link to="/admin/dishes" className="text-indigo-600 underline">Add your first dish</Link>.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                {d.image_url ? <img src={d.image_url} alt="" className="h-11 w-11 rounded object-cover" /> : <div className="h-11 w-11 rounded bg-slate-100" />}
                <div className="min-w-0 flex-1"><p className="flex items-center gap-2 truncate text-sm font-medium"><VegMark veg={d.is_veg} />{d.name}</p>
                  <p className="text-xs text-slate-500">{catName[d.category_id]} · {new Date(d.created_at).toLocaleDateString('en-IN')}</p></div>
                <span className="text-sm font-semibold">{formatINR(d.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
