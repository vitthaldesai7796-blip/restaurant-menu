import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Flame, Pencil, Plus, Search, Sparkles, Star, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { deleteImage, formatINR, unwrap } from '../../lib/utils'
import { ConfirmDialog, VegMark } from '../../components/ui'
import { useToast } from '../../components/Toast'
import DishForm from './DishForm.jsx'

export default function Dishes() {
  const { dishes, categories, reload } = useOutletContext()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | dish
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const list = useMemo(() => dishes.filter((d) =>
    (cat === 'all' || d.category_id === cat) && d.name.toLowerCase().includes(q.trim().toLowerCase())), [dishes, q, cat])

  const toggle = async (d) => {
    try {
      unwrap(await supabase.from('dishes').update({ is_available: !d.is_available }).eq('id', d.id).select())
      toast.success(`${d.name} is now ${d.is_available ? 'unavailable' : 'available'}.`)
      reload()
    } catch (e) { toast.error(e.message) }
  }

  const remove = async () => {
    setBusy(true)
    try {
      unwrap(await supabase.from('dishes').delete().eq('id', deleting.id).select())
      deleteImage(deleting.image_url)
      toast.success('Dish deleted.')
      setDeleting(null)
      reload()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dishes</h1>
        <button className="a-btn-primary" disabled={categories.length === 0} onClick={() => setEditing('new')}><Plus size={16} />Add dish</button>
      </div>
      {categories.length === 0 && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Create a category first (Categories page), then you can add dishes.</p>}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="a-input pl-9" placeholder="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="a-input sm:w-52" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="a-card divide-y divide-slate-100">
        {list.length === 0 && <p className="p-8 text-center text-sm text-slate-500">{dishes.length === 0 ? 'No dishes yet. Click “Add dish” to create your first one.' : 'No dishes match your search.'}</p>}
        {list.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
            {d.image_url ? <img src={d.image_url} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-md object-cover" /> : <div className="h-14 w-14 shrink-0 rounded-md bg-slate-100" />}
            <div className="min-w-0 flex-1 basis-40">
              <p className="flex items-center gap-2 text-sm font-medium"><VegMark veg={d.is_veg} /><span className="truncate">{d.name}</span></p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {catName[d.category_id]}
                {d.badge === 'bestseller' && <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-orange-700"><Flame size={11} />Bestseller</span>}
                {d.badge === 'special' && <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-violet-700"><Sparkles size={11} />Special</span>}
                {d.is_featured && <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.5 text-sky-700"><Star size={11} />Featured</span>}
              </p>
            </div>
            <span className="w-20 text-right text-sm font-semibold">{formatINR(d.price)}</span>
            <button onClick={() => toggle(d)} role="switch" aria-checked={d.is_available} title="Toggle availability"
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${d.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.is_available ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <div className="flex gap-1">
              <button className="rounded p-2 text-slate-600 hover:bg-slate-100" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}><Pencil size={16} /></button>
              <button className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && <DishForm dish={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {deleting && <ConfirmDialog title="Delete dish?" busy={busy} message={`“${deleting.name}” will be permanently removed from the menu. This cannot be undone.`} onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
