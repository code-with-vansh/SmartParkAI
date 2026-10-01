// ─── LogRow ───────────────────────────────────────────────────────────────────
import React from 'react'

const typeBadge = (type) => {
  const map = {
    Member:      'badge-member',
    Guest:       'badge-guest',
    Delivery:    'badge-delivery',
    Plumber:     'badge-other',
    Electrician: 'badge-other',
    Other:       'badge-other',
    Unknown:     'badge-other',
  }
  return map[type] || 'badge-other'
}

export default function LogRow({ log }) {
  const time = new Date(log.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
  const date = new Date(log.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Plate */}
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white tracking-wider">
          {log.plateNumber}
        </span>
      </td>
      {/* Action */}
      <td className="px-4 py-3">
        <span className={log.action === 'ENTRY' ? 'badge-entry' : 'badge-exit'}>
          {log.action}
        </span>
      </td>
      {/* Person */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900 dark:text-gray-100">{log.personName || '—'}</p>
        <p className="text-xs text-gray-400">{log.flatNumber || ''}</p>
      </td>
      {/* Type */}
      <td className="px-4 py-3">
        <span className={typeBadge(log.personType)}>{log.personType}</span>
      </td>
      {/* Zone */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Zone {log.zone}</span>
      </td>
      {/* Time */}
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{time}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </td>
    </tr>
  )
}
