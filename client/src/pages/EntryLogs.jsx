// ─── Entry Logs Page ──────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { LogIn, Search, RefreshCw } from 'lucide-react'
import LogRow from '../components/ui/LogRow'
import api from '../utils/api'

export default function EntryLogs() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs?action=ENTRY&limit=200')
      setLogs(res.data)
    } catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchLogs()
    const t = setInterval(fetchLogs, 5000)
    return () => clearInterval(t)
  }, [])

  const filtered = logs.filter(l =>
    l.plateNumber.includes(search.toUpperCase()) ||
    (l.personName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.flatNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="card p-4 flex items-center gap-3">
        <LogIn className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">Entry Logs</h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plate, name, flat..."
            className="form-input pl-8 w-64 text-xs"
          />
        </div>
        <button onClick={fetchLogs} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 text-left">Plate</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Person</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No entry logs found</td></tr>
              ) : filtered.map(log => <LogRow key={log._id} log={log} />)}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          {filtered.length} records · Auto-deleted after 10 days
        </div>
      </div>
    </div>
  )
}
