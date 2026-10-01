// ─── Zone Overview Page ───────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { ParkingSquare, Users, Truck, RefreshCw } from 'lucide-react'
import api from '../utils/api'

function ZoneCard({ zone, data, color }) {
  const pct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  const textColor = pct >= 90 ? 'text-rose-600 dark:text-rose-400' : pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
          }`}>
            <ParkingSquare className={`w-6 h-6 ${
              color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
            }`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Zone {zone}</h2>
            <p className="text-xs text-gray-400">
              {zone === 'A' ? 'Members Only' : 'Guests, Delivery & Others'}
            </p>
          </div>
        </div>
        <span className={`text-3xl font-bold ${textColor}`}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>Occupancy</span>
          <span>{data.occupied} / {data.total} slots</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.total ?? '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Slots</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{data.occupied ?? '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Occupied</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.available ?? '—'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available</p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
        pct >= 90
          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
          : pct >= 70
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
      }`}>
        {pct >= 90 ? '🔴 Almost Full — Redirect vehicles' : pct >= 70 ? '🟡 Filling Up' : '🟢 Plenty of Space Available'}
      </div>
    </div>
  )
}

export default function ZoneOverview() {
  const [zones, setZones]     = useState({ zoneA: { total: 0, occupied: 0, available: 0 }, zoneB: { total: 0, occupied: 0, available: 0 } })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones')
      setZones(res.data)
      setLastUpdate(new Date())
    } catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchZones()
    const t = setInterval(fetchZones, 5000)
    return () => clearInterval(t)
  }, [])

  const totalOccupied = (zones.zoneA?.occupied ?? 0) + (zones.zoneB?.occupied ?? 0)
  const totalCapacity = (zones.zoneA?.total ?? 0) + (zones.zoneB?.total ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary bar */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ParkingSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Total: <strong className="text-gray-900 dark:text-white">{totalOccupied}</strong> / {totalCapacity} occupied
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          {lastUpdate
            ? `Updated ${lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Loading...'}
        </div>
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <div className="card p-6 h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />
            <div className="card p-6 h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />
          </>
        ) : (
          <>
            <ZoneCard zone="A" data={zones.zoneA} color="blue" />
            <ZoneCard zone="B" data={zones.zoneB} color="purple" />
          </>
        )}
      </div>
    </div>
  )
}
