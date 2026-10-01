// ─── Settings Page ────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Save, Sun, Moon, Camera, Clock, ParkingSquare } from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({
    zoneACapacity:     50,
    zoneBCapacity:     30,
    cameraSource:      'webcam',
    ipCameraUrl:       'http://192.168.1.100:8080/video',
    videoFilePath:     'sample.mp4',
    detectionInterval: 2,
    duplicateWindow:   10,
  })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/settings').then(r => {
      setForm(prev => ({ ...prev, ...r.data }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleChange = e => {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading settings...</div>
  )

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">

      {/* Theme */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Currently: {theme === 'light' ? '☀️ Light mode' : '🌙 Dark mode'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Zone Capacities */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ParkingSquare className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Zone Capacities</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zone A — Total Slots (Members)
            </label>
            <input
              name="zoneACapacity" type="number" min="1" max="500"
              value={form.zoneACapacity} onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zone B — Total Slots (Guests / Others)
            </label>
            <input
              name="zoneBCapacity" type="number" min="1" max="500"
              value={form.zoneBCapacity} onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Camera Source */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Camera Source</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['webcam', 'ip', 'video'].map(src => (
            <button
              key={src}
              onClick={() => setForm(f => ({ ...f, cameraSource: src }))}
              className={`p-3 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                form.cameraSource === src
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">
                {src === 'webcam' ? '📷' : src === 'ip' ? '🌐' : '🎬'}
              </div>
              {src === 'webcam' ? 'Webcam' : src === 'ip' ? 'IP Camera' : 'Video File'}
            </button>
          ))}
        </div>

        {form.cameraSource === 'ip' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              IP Camera URL (RTSP / HTTP)
            </label>
            <input
              name="ipCameraUrl" type="text"
              value={form.ipCameraUrl} onChange={handleChange}
              placeholder="http://192.168.1.100:8080/video"
              className="form-input font-mono text-xs"
            />
            <p className="text-xs text-gray-400 mt-1">
              Example: http://192.168.1.102:4746/video or rtsp://user:pass@192.168.1.100/stream
            </p>
          </div>
        )}

        {form.cameraSource === 'video' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video File Path (relative to /ai folder)
            </label>
            <input
              name="videoFilePath" type="text"
              value={form.videoFilePath} onChange={handleChange}
              placeholder="sample.mp4"
              className="form-input font-mono text-xs"
            />
          </div>
        )}
      </div>

      {/* Detection Settings */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Detection Settings</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Detection Interval (seconds)
            </label>
            <input
              name="detectionInterval" type="number" min="1" max="300"
              value={form.detectionInterval} onChange={handleChange}
              className="form-input"
            />
            <p className="text-xs text-gray-400 mt-1">How often AI processes a frame</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duplicate Window (seconds)
            </label>
            <input
              name="duplicateWindow" type="number" min="3" max="300"
              value={form.duplicateWindow} onChange={handleChange}
              className="form-input"
            />
            <p className="text-xs text-gray-400 mt-1">Ignore same plate within this window</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
            ✓ Settings saved successfully
          </span>
        )}
      </div>
    </div>
  )
}
