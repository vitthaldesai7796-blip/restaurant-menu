import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'

/**
 * Loads categories, dishes and settings, and keeps them fresh:
 *  1. Supabase Realtime (instant)  2. refetch when the tab becomes visible  3. 60s polling fallback
 */
export function useMenuData() {
  const [state, setState] = useState({ categories: [], dishes: [], settings: null, loading: true, error: null })
  const timer = useRef(null)

  const load = useCallback(async () => {
    const [c, d, s] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order').order('name'),
      supabase.from('dishes').select('*').order('created_at', { ascending: false }),
      supabase.from('restaurant_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = c.error || d.error || s.error
    if (err) {
      setState((p) => ({ ...p, loading: false, error: err.message }))
      return
    }
    setState({ categories: c.data || [], dishes: d.data || [], settings: s.data || null, loading: false, error: null })
  }, [])

  const scheduleReload = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(load, 250)
  }, [load])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`menu-live-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, scheduleReload)
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    const poll = setInterval(load, 60000)
    return () => {
      clearTimeout(timer.current)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [load, scheduleReload])

  return { ...state, reload: load }
}
