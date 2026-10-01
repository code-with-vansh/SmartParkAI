// ─── Theme Context ────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../utils/api'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  // Load theme from backend settings on mount
  useEffect(() => {
    api.get('/settings').then(res => {
      const t = res.data?.theme || 'light'
      setTheme(t)
      applyTheme(t)
    }).catch(() => {
      // fallback to localStorage if backend unavailable
      const saved = localStorage.getItem('sp-theme') || 'light'
      setTheme(saved)
      applyTheme(saved)
    })
  }, [])

  const applyTheme = (t) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem('sp-theme', next)
    try {
      await api.put('/settings', { theme: next })
    } catch (e) { /* ignore */ }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
