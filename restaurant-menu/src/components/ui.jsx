import { useEffect } from 'react'
import { ImageOff, Loader2, X } from 'lucide-react'

export const Spinner = ({ size = 20, className = '' }) => <Loader2 size={size} className={`animate-spin ${className}`} />

export const FullPageLoader = ({ label = 'Loading…' }) => (
  <div className="flex min-h-screen items-center justify-center gap-3 text-slate-500"><Spinner /> {label}</div>
)

/** Indian-standard veg / non-veg mark */
export function VegMark({ veg, className = '' }) {
  const c = veg ? '#16a34a' : '#b91c1c'
  return (
    <span title={veg ? 'Vegetarian' : 'Non-vegetarian'} aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-2 bg-white ${className}`} style={{ borderColor: c }}>
      <span className="h-2 w-2 rounded-full" style={{ background: c }} />
    </span>
  )
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[95vh] w-full flex-col rounded-t-xl bg-white shadow-2xl sm:rounded-xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="a-btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="a-btn-danger" onClick={onConfirm} disabled={busy}>{busy && <Spinner size={16} />}{confirmLabel}</button>
      </div>
    </Modal>
  )
}

export const ImagePlaceholder = ({ className = '' }) => (
  <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}><ImageOff size={22} /></div>
)
