// ─── Topbar ───────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon, Wifi } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

// Map routes to human-readable titles
const TITLES = {
  '/dashboard':              'Dashboard',
  '/live':                   'Live Detection',
  '/zones':                  'Zone Overview',
  '/logs/entry':             'Entry Logs',
  '/logs/exit':              'Exit Logs',
  '/management/members':     'Members',
  '/management/guests':      'Guests',
  '/management/delivery':    'Delivery',
  '/management/other':       'Other Vehicles',
  '/settings':               'Settings',
}

export default function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [time, setTime] = useState(new Date())
  const [online, setOnline] = useState(true)

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Check backend heartbeat every 10s
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/health')
        setOnline(r.ok)
      } catch {
        setOnline(false)
      }
    }
    check()
    const t = setInterval(check, 10000)
    return () => clearInterval(t)
  }, [])

  const title = TITLES[location.pathname] || 'Smart Park AI'

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse-slow' : 'bg-rose-500'}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
            {online ? 'System Online' : 'Offline'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

        {/* Date + Time */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{formattedTime}</p>
          <p className="text-xs text-gray-400">{formattedDate}</p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light'
            ? <Moon className="w-4 h-4 text-gray-500" />
            : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </header>
  )
}
