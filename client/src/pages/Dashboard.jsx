// ─── Dashboard Page ───────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Car, CarFront, ParkingSquare, Truck } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import LogRow from '../components/ui/LogRow'
import api from '../utils/api'
import { useDetection } from '../context/DetectionContext'

export default function Dashboard() {
  const [stats, setStats]   = useState({})
  const [zones, setZones]   = useState({ zoneA: {}, zoneB: {} })
  const { latestLogs }      = useDetection()

  const fetchData = async () => {
    try {
      const [sRes, zRes] = await Promise.all([api.get('/stats'), api.get('/zones')])
      setStats(sRes.data)
      setZones(zRes.data)
    } catch (e) {}
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5000)
    return () => clearInterval(t)
  }, [])

  // Occupancy percentage helpers
  const pctA = zones.zoneA?.total > 0
    ? Math.round((zones.zoneA.occupied / zones.zoneA.total) * 100) : 0
  const pctB = zones.zoneB?.total > 0
    ? Math.round((zones.zoneB.occupied / zones.zoneB.total) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles Today"
          value={stats.totalVehiclesToday ?? 0}
          subtitle="Entries logged today"
          icon={Car}
          color="blue"
        />
        <StatCard
          title="Active Inside"
          value={stats.activeVehiclesInside ?? 0}
          subtitle="Currently parked"
          icon={ParkingSquare}
          color="green"
        />
        <StatCard
          title="Zone A Occupancy"
          value={`${pctA}%`}
          subtitle={`${zones.zoneA?.occupied ?? 0} / ${zones.zoneA?.total ?? '—'} slots`}
          icon={CarFront}
          color="purple"
        />
        <StatCard
          title="Zone B Occupancy"
          value={`${pctB}%`}
          subtitle={`${zones.zoneB?.occupied ?? 0} / ${zones.zoneB?.total ?? '—'} slots`}
          icon={Truck}
          color="amber"
        />
      </div>

      {/* Live Detection Feed */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Live Detection Feed</h2>
          </div>
          <span className="text-xs text-gray-400">Last 20 events</span>
        </div>

        {latestLogs.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No events yet — start the AI module to begin detecting
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 text-left">Plate</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Person</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Zone</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {latestLogs.map(log => <LogRow key={log._id} log={log} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
