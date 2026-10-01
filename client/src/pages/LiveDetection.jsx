// ─── Live Detection Page  v2 (Fixed) ─────────────────────────────────────────
// FIX 4: Uses MJPEG /stream endpoint instead of polling /frame every second.
//        The <img> tag's src is set ONCE to the MJPEG URL; the browser handles
//        continuous decoding — no React state churn, no frame lag.

import React, { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import { useDetection } from '../context/DetectionContext'

const AI_BASE = 'http://localhost:5001'

export default function LiveDetection() {
  const { latestLogs } = useDetection()
  const [settings, setSettings] = useState({})
  const [aiStatus, setAiStatus] = useState('idle')  // idle | running | error
  const imgRef = useRef(null)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  // ── Start: point <img> at the MJPEG stream ────────────────────────────────
  const startFeed = async () => {
    // First check the AI module is reachable
    try {
      const res = await fetch(`${AI_BASE}/status`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) throw new Error('not ok')
    } catch {
      setAiStatus('error')
      return
    }

    setAiStatus('running')
    // Assign MJPEG stream URL once — browser streams it natively
    if (imgRef.current) {
      imgRef.current.src = `${AI_BASE}/stream`
    }
  }

  // ── Stop: clear the src so the browser closes the stream connection ───────
  const stopFeed = () => {
    if (imgRef.current) {
      imgRef.current.src = ''
    }
    setAiStatus('idle')
  }

  // Cleanup on unmount
  useEffect(() => () => stopFeed(), [])

  const sourceLabel = {
    webcam: '📷 Webcam',
    ip:     '🌐 IP Camera',
    video:  '🎬 Video File',
  }[settings.cameraSource] || '📷 Webcam'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Video Feed Panel ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {aiStatus === 'running'
                ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                : <span className="w-2 h-2 rounded-full bg-gray-300" />}
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Camera Feed</h2>
              <span className="text-xs text-gray-400 ml-1">({sourceLabel})</span>
            </div>

            <div className="flex gap-2">
              {aiStatus !== 'running' ? (
                <button onClick={startFeed} className="btn-primary flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Start Feed
                </button>
              ) : (
                <button onClick={stopFeed} className="btn-danger flex items-center gap-1.5">
                  <CameraOff className="w-3.5 h-3.5" /> Stop Feed
                </button>
              )}
            </div>
          </div>

          {/* Video area */}
          <div className="aspect-video bg-gray-950 flex items-center justify-center relative overflow-hidden">

            {/* MJPEG image — always rendered; src is set/cleared by startFeed/stopFeed */}
            <img
              ref={imgRef}
              alt="ANPR live feed"
              className={`w-full h-full object-contain ${aiStatus === 'running' ? 'block' : 'hidden'}`}
              onError={() => setAiStatus('error')}
            />

            {/* Error state */}
            {aiStatus === 'error' && (
              <div className="text-center text-gray-400 space-y-2">
                <AlertCircle className="w-10 h-10 mx-auto text-rose-400" />
                <p className="text-sm">Cannot connect to AI module</p>
                <p className="text-xs">Make sure the Python AI module is running on port 5001</p>
                <button onClick={startFeed} className="btn-secondary mt-2">
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retry
                </button>
              </div>
            )}

            {/* Idle placeholder */}
            {aiStatus === 'idle' && (
              <div className="text-center text-gray-600 space-y-3">
                <Camera className="w-12 h-12 mx-auto opacity-30" />
                <div>
                  <p className="text-sm">Camera feed inactive</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Start Feed" — ensure the AI module is running
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-mono bg-gray-900 rounded-lg p-3 text-left max-w-xs mx-auto">
                  <p className="text-gray-400 mb-1"># Run AI module:</p>
                  <p>cd ai && python detector/main.py</p>
                </div>
              </div>
            )}

            {/* LIVE badge */}
            {aiStatus === 'running' && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {/* Info bar */}
          <div className="px-5 py-3 flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
            <span>Real-time MJPEG stream</span>
            <span>·</span>
            <span>Duplicate window: {settings.duplicateWindow || 10}s</span>
            <span>·</span>
            <span>Source: {sourceLabel}</span>
          </div>
        </div>

        {/* ── Recent Detections Panel ───────────────────────────────────── */}
        <div className="card flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Detections</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {latestLogs.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-xs text-center p-4">
                No detections yet.<br />Start the AI module to begin.
              </div>
            ) : latestLogs.map(log => (
              <div
                key={log._id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-gray-900 dark:text-white truncate">
                    {log.plateNumber}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {log.personName} · {log.personType}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={log.action === 'ENTRY' ? 'badge-entry' : 'badge-exit'}>
                    {log.action}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
