import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { deleteImage, unwrap, uploadImage } from '../../lib/utils'
import { Modal, Spinner } from '../../components/ui'
import ImageUploader from '../../components/ImageUploader'
import { useToast } from '../../components/Toast'

export default function DishForm({ dish, categories, onClose, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState(dish ? {
    name: dish.name, description: dish.description || '', category_id: dish.category_id, price: String(dish.price),
    is_veg: dish.is_veg, badge: dish.badge || '', is_available: dish.is_available, is_featured: dish.is_featured,
  } : { name: '', description: '', category_id: categories[0]?.id || '', price: '', is_veg: true, badge: '', is_available: true, is_featured: false })
  const [file, setFile] = useState(null)
  const [removeImg, setRemoveImg] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Dish name is required.'
    else if (f.name.trim().length > 80) e.name = 'Keep the name under 80 characters.'
    if (f.description.length > 300) e.description = 'Keep the description under 300 characters.'
    if (!f.category_id) e.category_id = 'Choose a category.'
    const p = Number(f.price)
    if (f.price === '' || Number.isNaN(p)) e.price = 'Enter a price.'
    else if (p < 0 || p > 100000) e.price = 'Price must be between ₹0 and ₹1,00,000.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    let uploaded = null
    try {
      let image_url = dish?.image_url || null
      if (file) { uploaded = await uploadImage(file, 'dishes'); image_url = uploaded }
      else if (removeImg) image_url = null
      const payload = {
        name: f.name.trim(), description: f.description.trim() || null, category_id: f.category_id,
        price: Number(f.price), is_veg: f.is_veg, badge: f.badge || null,
        is_available: f.is_available, is_featured: f.is_featured, image_url,
      }
      unwrap(dish
        ? await supabase.from('dishes').update(payload).eq('id', dish.id).select()
        : await supabase.from('dishes').insert([payload]).select())
      if (dish?.image_url && dish.image_url !== image_url) deleteImage(dish.image_url)
      toast.success(dish ? 'Dish updated.' : 'Dish added.')
      onSaved()
    } catch (err) {
      if (uploaded) deleteImage(uploaded)
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal title={dish ? 'Edit dish' : 'Add dish'} onClose={saving ? () => {} : onClose} wide>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ImageUploader label="Dish photo" url={removeImg ? null : dish?.image_url} file={file}
          onFile={(x) => { setFile(x); setRemoveImg(false) }} onRemove={() => { setFile(null); setRemoveImg(true) }} />
        <div><label className="a-label" htmlFor="d-name">Dish name *</label>
          <input id="d-name" className="a-input" value={f.name} maxLength={80} onChange={(e) => set('name', e.target.value)} />
          {errors.name && <p className="a-err">{errors.name}</p>}</div>
        <div><label className="a-label" htmlFor="d-desc">Description</label>
          <textarea id="d-desc" rows={3} className="a-input" value={f.description} maxLength={300} onChange={(e) => set('description', e.target.value)} />
          <div className="flex justify-between"><span>{errors.description && <span className="a-err">{errors.description}</span>}</span><span className="text-xs text-slate-400">{f.description.length}/300</span></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="a-label" htmlFor="d-cat">Category *</label>
            <select id="d-cat" className="a-input" value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Select…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>{errors.category_id && <p className="a-err">{errors.category_id}</p>}</div>
          <div><label className="a-label" htmlFor="d-price">Price (₹) *</label>
            <input id="d-price" type="number" inputMode="decimal" min="0" step="0.5" className="a-input" value={f.price} onChange={(e) => set('price', e.target.value)} />
            {errors.price && <p className="a-err">{errors.price}</p>}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="a-label">Food type</span>
            <div className="flex gap-4 text-sm">
              {[[true, 'Veg'], [false, 'Non-veg']].map(([v, l]) => (
                <label key={l} className="flex items-center gap-2"><input type="radio" name="veg" checked={f.is_veg === v} onChange={() => set('is_veg', v)} />{l}</label>))}
            </div></div>
          <div><label className="a-label" htmlFor="d-badge">Badge</label>
            <select id="d-badge" className="a-input" value={f.badge} onChange={(e) => set('badge', e.target.value)}>
              <option value="">None</option><option value="bestseller">Bestseller</option><option value="special">Special</option></select></div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_available} onChange={(e) => set('is_available', e.target.checked)} />Available now</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />Show in “Featured dishes”</label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="a-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="a-btn-primary" disabled={saving}>{saving && <Spinner size={16} />}{dish ? 'Save changes' : 'Add dish'}</button>
        </div>
      </form>
    </Modal>
  )
}
