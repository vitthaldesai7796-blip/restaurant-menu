import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { deleteImage, isHttpUrl, unwrap, uploadImage } from '../../lib/utils'
import { Spinner } from '../../components/ui'
import ImageUploader from '../../components/ImageUploader'
import { useToast } from '../../components/Toast'

export default function Settings() {
  const { settings, reload } = useOutletContext()
  const toast = useToast()
  const s = settings || {}
  const [f, setF] = useState({
    name: s.name || '', tagline: s.tagline || '', address: s.address || '', maps_url: s.maps_url || '', phone: s.phone || '',
    opening_hours: s.opening_hours || '', about: s.about || '', instagram_url: s.instagram_url || '', facebook_url: s.facebook_url || '',
  })
  const [logo, setLogo] = useState({ file: null, removed: false })
  const [cover, setCover] = useState({ file: null, removed: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Restaurant name is required.'
    if (f.phone && !/^[+\d][\d\s()-]{5,19}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number, e.g. +91 98765 43210.'
    ;['maps_url', 'instagram_url', 'facebook_url'].forEach((k) => { if (f[k] && !isHttpUrl(f[k].trim())) e[k] = 'Enter a full link starting with https://' })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    const uploaded = []
    try {
      let logo_url = s.logo_url || null
      let cover_image_url = s.cover_image_url || null
      if (logo.file) { logo_url = await uploadImage(logo.file, 'branding', 600); uploaded.push(logo_url) } else if (logo.removed) logo_url = null
      if (cover.file) { cover_image_url = await uploadImage(cover.file, 'branding', 1600); uploaded.push(cover_image_url) } else if (cover.removed) cover_image_url = null
      const t = (v) => (v && v.trim()) || null
      unwrap(await supabase.from('restaurant_settings').upsert({
        id: 1, name: f.name.trim(), tagline: t(f.tagline), address: t(f.address), maps_url: t(f.maps_url), phone: t(f.phone),
        opening_hours: t(f.opening_hours), about: t(f.about), instagram_url: t(f.instagram_url), facebook_url: t(f.facebook_url),
        logo_url, cover_image_url,
      }).select())
      if (s.logo_url && s.logo_url !== logo_url) deleteImage(s.logo_url)
      if (s.cover_image_url && s.cover_image_url !== cover_image_url) deleteImage(s.cover_image_url)
      setLogo({ file: null, removed: false }); setCover({ file: null, removed: false })
      toast.success('Settings saved.')
      reload()
    } catch (err) {
      uploaded.forEach(deleteImage)
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  const field = (k, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className="a-label" htmlFor={`s-${k}`}>{label}</label>
      {props.area
        ? <textarea id={`s-${k}`} rows={props.rows || 3} className="a-input" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={props.ph} />
        : <input id={`s-${k}`} className="a-input" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={props.ph} />}
      {props.hint && <p className="mt-1 text-xs text-slate-500">{props.hint}</p>}
      {errors[k] && <p className="a-err">{errors[k]}</p>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Restaurant settings</h1>
      <section className="a-card space-y-5 p-5">
        <h2 className="font-semibold">Branding</h2>
        <ImageUploader label="Logo" shape="square" url={logo.removed ? null : s.logo_url} file={logo.file}
          onFile={(file) => setLogo({ file, removed: false })} onRemove={() => setLogo({ file: null, removed: true })} />
        <ImageUploader label="Cover image (wide photo shown on the homepage)" url={cover.removed ? null : s.cover_image_url} file={cover.file}
          onFile={(file) => setCover({ file, removed: false })} onRemove={() => setCover({ file: null, removed: true })} />
        <div className="grid gap-4 sm:grid-cols-2">
          {field('name', 'Restaurant name *')}
          {field('tagline', 'Tagline', { ph: 'e.g. Fresh, flavourful and made with love' })}
        </div>
      </section>
      <section className="a-card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Contact</h2>
        {field('phone', 'Phone number', { ph: '+91 98765 43210' })}
        {field('maps_url', 'Google Maps link', { ph: 'https://maps.app.goo.gl/…', hint: 'Optional. If empty, a map link is created from the address.' })}
        {field('address', 'Address', { area: true, wide: true })}
        {field('opening_hours', 'Opening hours', { area: true, wide: true, rows: 4, ph: 'Mon–Fri: 11:00 AM – 10:30 PM\nSat–Sun: 10:00 AM – 11:30 PM' })}
      </section>
      <section className="a-card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">About & social</h2>
        {field('about', 'About the restaurant', { area: true, wide: true, rows: 4 })}
        {field('instagram_url', 'Instagram link', { ph: 'https://instagram.com/yourpage' })}
        {field('facebook_url', 'Facebook link', { ph: 'https://facebook.com/yourpage' })}
      </section>
      <button className="a-btn-primary" disabled={saving}>{saving ? <Spinner size={16} /> : <Save size={16} />}Save settings</button>
    </form>
  )
}
