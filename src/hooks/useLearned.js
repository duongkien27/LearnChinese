import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'tiengtrung.learned.v1'

/**
 * Persists the set of "learned" entry ids in localStorage so progress
 * survives page reloads and browser restarts. Returns the live set plus
 * helpers to toggle/check/reset membership.
 */
export function useLearned() {
  const [learned, setLearned] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Persist whenever the set changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...learned]))
    } catch {
      /* storage full or unavailable — ignore, session still works */
    }
  }, [learned])

  const toggle = useCallback((id) => {
    setLearned((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const isLearned = useCallback((id) => learned.has(id), [learned])

  const resetCategory = useCallback((ids) => {
    setLearned((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }, [])

  return { learned, toggle, isLearned, resetCategory }
}
