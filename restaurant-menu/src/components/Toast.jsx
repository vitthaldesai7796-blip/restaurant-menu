import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { uid } from '../lib/utils'

const Ctx = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback((type, message) => {
    const id = uid()
    setItems((l) => [...l, { id, type, message }])
    setTimeout(() => remove(id), type === 'error' ? 6000 : 3500)
  }, [remove])
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] space-y-2 sm:left-auto sm:w-96" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {t.type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <p className="flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Dismiss"><X size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
