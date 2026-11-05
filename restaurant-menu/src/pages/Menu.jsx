import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, ExternalLink, Facebook, Flame, Instagram, MapPin, Phone, Search, Sparkles, Star, UtensilsCrossed, X } from 'lucide-react'
import { useMenuData } from '../hooks'
import { formatINR, mapsLink } from '../lib/utils'
import { Spinner, VegMark } from '../components/ui'

function DishCard({ dish, categoryName, className = '' }) {
  const off = !dish.is_available
  return (
    <article className={`group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-ink-900/10 ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
        {dish.image_url ? (
          <img src={dish.image_url} alt={dish.name} loading="lazy" decoding="async"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${off ? 'grayscale opacity-60' : ''}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300"><UtensilsCrossed size={34} /></div>
        )}
        {dish.badge && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-saffron-500 px-2.5 py-1 text-xs font-semibold text-ink-900 shadow">
            {dish.badge === 'bestseller' ? <Flame size={12} /> : <Sparkles size={12} />}
            {dish.badge === 'bestseller' ? 'Bestseller' : 'Special'}
          </span>
        )}
        {off && <span className="absolute inset-x-0 bottom-0 bg-ink-900/85 py-1.5 text-center text-xs font-medium text-white">Currently unavailable</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <VegMark veg={dish.is_veg} className="mt-0.5" />
          <h3 className="font-display text-[15px] font-semibold leading-snug sm:text-lg">{dish.name}</h3>
        </div>
        {dish.description && <p className="line-clamp-2 text-xs leading-relaxed text-ink-600 sm:text-sm">{dish.description}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-xs text-ink-500">{categoryName}</span>
          <span className="font-display text-lg font-bold text-ink-900">{formatINR(dish.price)}</span>
        </div>
      </div>
    </article>
  )
}

function Row({ title, icon: Icon, dishes, catName }) {
  if (!dishes.length) return null
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12">
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold"><Icon size={22} className="text-saffron-600" />{title}</h2>
      <div className="hide-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {dishes.map((d) => <DishCard key={d.id} dish={d} categoryName={catName[d.category_id]} className="w-60 shrink-0 snap-start sm:w-64" />)}
      </div>
    </section>
  )
}

export default function Menu() {
  const { categories, dishes, settings, loading, error, reload } = useMenuData()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [diet, setDiet] = useState('all')
  const [sort, setSort] = useState('default')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const menuRef = useRef(null)

  const name = settings?.name || 'Our Menu'
  useEffect(() => { document.title = `${name} – Menu` }, [name])

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const counts = useMemo(() => {
    const m = {}
    dishes.forEach((d) => { if (!onlyAvailable || d.is_available) m[d.category_id] = (m[d.category_id] || 0) + 1 })
    return m
  }, [dishes, onlyAvailable])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = dishes.filter((d) =>
      (!onlyAvailable || d.is_available) &&
      (cat === 'all' || d.category_id === cat) &&
      (diet === 'all' || (diet === 'veg' ? d.is_veg : !d.is_veg)) &&
      (!term || d.name.toLowerCase().includes(term)))
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [dishes, q, cat, diet, sort, onlyAvailable])

  const filtering = q || cat !== 'all' || diet !== 'all'
  const featured = dishes.filter((d) => d.is_featured && d.is_available)
  const popular = dishes.filter((d) => d.badge === 'bestseller' && d.is_available)
  const map = mapsLink(settings)
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <header className="relative isolate overflow-hidden bg-ink-900 text-white">
        {settings?.cover_image_url && <img src={settings.cover_image_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900 via-ink-900/60 to-ink-900/30" />
        <div className="mx-auto flex min-h-[26rem] max-w-6xl flex-col justify-end px-4 pb-10 pt-20 sm:min-h-[32rem] sm:pb-14">
          <div className="flex items-center gap-4">
            {settings?.logo_url
              ? <img src={settings.logo_url} alt={`${name} logo`} className="h-16 w-16 rounded-full bg-white object-cover ring-2 ring-saffron-500 sm:h-20 sm:w-20" />
              : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-500 text-ink-900 sm:h-20 sm:w-20"><UtensilsCrossed size={30} /></span>}
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">{name}</h1>
          </div>
          {settings?.tagline && <p className="mt-4 max-w-xl text-base text-ink-100 sm:text-lg">{settings.tagline}</p>}
          <form className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-ink-900 shadow-xl"
            onSubmit={(e) => { e.preventDefault(); scrollToMenu() }}>
            <Search size={18} className="text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a dish…" aria-label="Search dishes"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-ink-400" />
            <button className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-700">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-100">
            {settings?.opening_hours && <span className="inline-flex items-center gap-2"><Clock size={16} className="text-saffron-400" />Hours below</span>}
            {map && <a href={map} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MapPin size={16} className="text-saffron-400" />Get directions</a>}
            {settings?.phone && <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-white"><Phone size={16} className="text-saffron-400" />{settings.phone}</a>}
          </div>
        </div>
      </header>

      {loading && <div className="flex justify-center py-24 text-ink-500"><Spinner size={28} /></div>}
      {error && !loading && (
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800">
          <p>We couldn’t load the menu. Please check your connection.</p>
          <button onClick={reload} className="mt-3 rounded-md bg-red-700 px-4 py-2 text-white">Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {!filtering && <Row title="Featured dishes" icon={Star} dishes={featured} catName={catName} />}
          {!filtering && <Row title="Popular dishes" icon={Flame} dishes={popular} catName={catName} />}

          {/* Menu */}
          <section ref={menuRef} className="mx-auto max-w-6xl scroll-mt-2 px-4 pt-12">
            <h2 className="mb-4 font-display text-3xl font-semibold">Menu</h2>
            <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b border-ink-900/10 bg-paper/95 px-4 py-3 backdrop-blur">
              <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                {[{ id: 'all', name: 'All', image_url: null }, ...categories].map((c) => (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      cat === c.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-800 hover:border-ink-500'}`}>
                    {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="h-5 w-5 rounded-full object-cover" />}
                    {c.name}{c.id !== 'all' && <span className="text-xs opacity-60">{counts[c.id] || 0}</span>}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" aria-label="Search dishes"
                    className="w-full rounded-full border border-ink-200 bg-white py-2 pl-9 pr-8 outline-none focus:border-ink-600" />
                  {q && <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"><X size={14} /></button>}
                </div>
                <div className="flex overflow-hidden rounded-full border border-ink-200 bg-white" role="group" aria-label="Diet filter">
                  {[['all', 'All'], ['veg', 'Veg'], ['non-veg', 'Non-veg']].map(([v, l]) => (
                    <button key={v} onClick={() => setDiet(v)} className={`px-3.5 py-2 ${diet === v ? 'bg-saffron-500 font-semibold text-ink-900' : 'text-ink-700'}`}>{l}</button>
                  ))}
                </div>
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by price"
                  className="rounded-full border border-ink-200 bg-white px-3 py-2 outline-none">
                  <option value="default">Sort: Latest</option>
                  <option value="low">Price: Low to high</option>
                  <option value="high">Price: High to low</option>
                </select>
                <label className="flex cursor-pointer items-center gap-2 text-ink-700">
                  <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 accent-ink-700" />
                  Available only
                </label>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-ink-600">
                <UtensilsCrossed size={40} className="mx-auto mb-3 text-ink-300" />
                <p className="font-display text-xl">{dishes.length === 0 ? 'The menu is being prepared.' : 'No dishes found.'}</p>
                <p className="mt-1 text-sm">{dishes.length === 0 ? 'Please check back soon.' : 'Try a different search or clear the filters.'}</p>
                {filtering && <button onClick={() => { setQ(''); setCat('all'); setDiet('all') }} className="mt-4 rounded-full bg-ink-900 px-5 py-2 text-sm text-white">Clear filters</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {filtered.map((d) => <DishCard key={d.id} dish={d} categoryName={catName[d.category_id]} />)}
              </div>
            )}
          </section>

          {/* About + contact */}
          <footer className="mt-20 bg-ink-900 text-ink-100">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
              <div>
                <h2 className="font-display text-2xl text-white">About us</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{settings?.about || `Welcome to ${name}.`}</p>
              </div>
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl text-white"><Clock size={20} className="text-saffron-400" />Opening hours</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{settings?.opening_hours || 'Please call us for timings.'}</p>
              </div>
              <div className="space-y-3 text-sm">
                <h2 className="font-display text-2xl text-white">Find us</h2>
                {settings?.address && <p className="flex gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-saffron-400" /><span className="whitespace-pre-line">{settings.address}</span></p>}
                {settings?.phone && <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex gap-2 hover:text-white"><Phone size={18} className="shrink-0 text-saffron-400" />{settings.phone}</a>}
                {map && <a href={map} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-saffron-500 px-4 py-2 font-medium text-ink-900 hover:bg-saffron-400"><ExternalLink size={16} />Open in Google Maps</a>}
                <div className="flex gap-3 pt-2">
                  {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-ink-600 p-2 hover:bg-ink-800"><Instagram size={18} /></a>}
                  {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-ink-600 p-2 hover:bg-ink-800"><Facebook size={18} /></a>}
                </div>
              </div>
            </div>
            <p className="border-t border-ink-700 py-4 text-center text-xs text-ink-300">© {new Date().getFullYear()} {name}</p>
          </footer>
        </>
      )}
    </div>
  )
}
