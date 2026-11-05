import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { deleteImage, unwrap, uploadImage } from '../../lib/utils'
import { ConfirmDialog, Modal, Spinner } from '../../components/ui'
import ImageUploader from '../../components/ImageUploader'
import { useToast } from '../../components/Toast'

function CategoryForm({ category, categories, onClose, onSaved }) {
  const toast = useToast()
  const [name, setName] = useState(category?.name || '')
  const [file, setFile] = useState(null)
  const [removeImg, setRemoveImg] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Category name is required.')
    if (n.length > 60) return setError('Keep the name under 60 characters.')
    if (categories.some((c) => c.id !== category?.id && c.name.trim().toLowerCase() === n.toLowerCase())) return setError('A category with this name already exists.')
    setSaving(true)
    let uploaded = null
    try {
      let image_url = category?.image_url || null
      if (file) { uploaded = await uploadImage(file, 'categories', 600); image_url = uploaded } else if (removeImg) image_url = null
      unwrap(category
        ? await supabase.from('categories').update({ name: n, image_url }).eq('id', category.id).select()
        : await supabase.from('categories').insert([{ name: n, image_url, sort_order: Math.max(0, ...categories.map((c) => c.sort_order)) + 1 }]).select())
      if (category?.image_url && category.image_url !== image_url) deleteImage(category.image_url)
      toast.success(category ? 'Category updated.' : 'Category added.')
      onSaved()
    } catch (err) {
      if (uploaded) deleteImage(uploaded)
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={saving ? () => {} : onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="a-label" htmlFor="c-name">Category name *</label>
          <input id="c-name" className="a-input" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setError('') }} autoFocus />
          {error && <p className="a-err">{error}</p>}</div>
        <ImageUploader label="Category image (optional)" shape="square" url={removeImg ? null : category?.image_url} file={file}
          onFile={(f) => { setFile(f); setRemoveImg(false) }} onRemove={() => { setFile(null); setRemoveImg(true) }} />
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="a-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="a-btn-primary" disabled={saving}>{saving && <Spinner size={16} />}{category ? 'Save changes' : 'Add category'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Categories() {
  const { categories, dishes, reload } = useOutletContext()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const count = (id) => dishes.filter((d) => d.category_id === id).length

  const remove = async () => {
    if (count(deleting.id) > 0) { toast.error('This category still has dishes. Move or delete them first.'); setDeleting(null); return }
    setBusy(true)
    try {
      unwrap(await supabase.from('categories').delete().eq('id', deleting.id).select())
      deleteImage(deleting.image_url)
      toast.success('Category deleted.')
      setDeleting(null)
      reload()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button className="a-btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Add category</button>
      </div>
      <div className="a-card divide-y divide-slate-100">
        {categories.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No categories yet.</p>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-4">
            {c.image_url ? <img src={c.image_url} alt="" className="h-12 w-12 rounded-md object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400"><Tags size={20} /></span>}
            <div className="flex-1"><p className="font-medium">{c.name}</p><p className="text-xs text-slate-500">{count(c.id)} dish{count(c.id) === 1 ? '' : 'es'}</p></div>
            <button className="rounded p-2 text-slate-600 hover:bg-slate-100" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil size={16} /></button>
            <button className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      {editing && <CategoryForm category={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {deleting && <ConfirmDialog title="Delete category?" busy={busy}
        message={count(deleting.id) > 0 ? `“${deleting.name}” still has ${count(deleting.id)} dish(es). Move or delete them first.` : `“${deleting.name}” will be permanently removed.`}
        onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
