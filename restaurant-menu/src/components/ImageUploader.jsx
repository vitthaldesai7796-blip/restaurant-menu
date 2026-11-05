import { useEffect, useMemo, useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'

/** Pick an image from computer / phone gallery and preview it. The upload happens when the form is saved. */
export default function ImageUploader({ label, url, file, onFile, onRemove, shape = 'landscape' }) {
  const input = useRef(null)
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }, [objectUrl])
  const preview = objectUrl || url
  const box = shape === 'square' ? 'h-28 w-28' : 'h-32 w-full sm:w-56'

  return (
    <div>
      <span className="a-label">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className={`${box} overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50`}>
          {preview
            ? <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-slate-400"><ImagePlus size={22} />No image</div>}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
          <button type="button" className="a-btn-ghost" onClick={() => input.current?.click()}><ImagePlus size={16} />{preview ? 'Change image' : 'Choose image'}</button>
          {preview && <button type="button" className="a-btn-ghost text-red-600" onClick={onRemove}><Trash2 size={16} />Remove</button>}
          <p className="text-xs text-slate-500">JPG, PNG or WebP. Resized automatically.</p>
        </div>
      </div>
    </div>
  )
}
