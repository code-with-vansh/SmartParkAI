// ─── Detection Context ────────────────────────────────────────────────────────
// Manages state for unknown vehicle popup and live detection feed
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../utils/api'

const DetectionContext = createContext()

export function DetectionProvider({ children }) {
  const [latestLogs, setLatestLogs]         = useState([])
  const [unknownVehicle, setUnknownVehicle] = useState(null) // triggers popup
  const [pollInterval, setPollInterval]     = useState(2000)
  const intervalRef = useRef(null)

  // Fetch latest logs for live feed
  const fetchLatestLogs = async () => {
    try {
      const res = await api.get('/logs/latest')
      setLatestLogs(res.data)
    } catch (e) { /* silent */ }
  }

  // Load detection interval from settings
  useEffect(() => {
    api.get('/settings').then(res => {
      const ms = (res.data?.detectionInterval || 2) * 1000
      setPollInterval(ms)
    }).catch(() => {})
  }, [])

  // Poll for new logs every N seconds
  useEffect(() => {
    fetchLatestLogs()
    intervalRef.current = setInterval(fetchLatestLogs, pollInterval)
    return () => clearInterval(intervalRef.current)
  }, [pollInterval])

  // Poll for unknown vehicle detections             //! addedByVanshGarg
  useEffect(() => {
    const checkUnknown = async () => {
      try {
        const res = await api.get('/detect/unknown')
        if (res.data?.pending) {
          setUnknownVehicle(res.data.pending)
        }
      } catch (e) { /* silent */ }
    }
    const id = setInterval(checkUnknown, pollInterval)
    return () => clearInterval(id)
  }, [pollInterval])



  

  // Called when AI module detects an unknown plate via SSE / polling
  const triggerUnknown = (plateData) => {
    setUnknownVehicle(plateData)
  }

  const dismissUnknown = () => {
    setUnknownVehicle(null)
  }

  return (
    <DetectionContext.Provider value={{
      latestLogs,
      unknownVehicle,
      triggerUnknown,
      dismissUnknown,
      fetchLatestLogs,
    }}>
      {children}
    </DetectionContext.Provider>
  )
}

export const useDetection = () => useContext(DetectionContext)
