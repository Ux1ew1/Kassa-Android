/**
 * Theme utilities and hook for persisting the UI theme.
 */
import { useEffect, useState } from 'react'

/**
 * Local storage key for the theme preference.
 * @type {string}
 */
const STORAGE_KEY = 'kassa-theme'

/**
 * Returns the preferred theme based on localStorage and system preference.
 * @returns {'light'|'dark'} Preferred theme.
 */
export function getPreferredTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  let saved = null

  try {
    saved = window.localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    saved = null
  }
  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

/**
 * Applies the theme to the document root.
 * @param {'light'|'dark'} theme - Theme to apply.
 */
function applyTheme(theme) {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

/**
 * Synchronizes the initial theme with the DOM and saved preference.
 * @returns {void}
 */
export function syncInitialTheme() {
  const preferred = getPreferredTheme()
  applyTheme(preferred)
}

/**
 * React hook to manage theme state and persistence.
 * @returns {{theme: 'light'|'dark', toggleTheme: Function, setTheme: Function}}
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => getPreferredTheme())

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch (error) {
      // ignore write errors
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme, setTheme }
}
