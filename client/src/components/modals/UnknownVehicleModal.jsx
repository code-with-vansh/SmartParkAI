// ─── Unknown Vehicle Modal ────────────────────────────────────────────────────
// Pops up when AI detects a plate not in the database
import React, { useState } from 'react'
import { X, AlertTriangle, Car } from 'lucide-react'
import { useDetection } from '../../context/DetectionContext'
import api from '../../utils/api'

const TYPES = ['Guest', 'Delivery', 'Plumber', 'Electrician', 'Other']

export default function UnknownVehicleModal() {
  const { unknownVehicle, dismissUnknown, fetchLatestLogs } = useDetection()

  const [form, setForm] = useState({ name: '', type: 'Guest', mobile: '', flatNumber: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!unknownVehicle) return null

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    if (!form.flatNumber.trim()) return setError('Flat number is required')
    setError('')
    setLoading(true)

    try {
      await api.post('/detect/register', {
        plateNumber: unknownVehicle.plateNumber,
        plateImage:  unknownVehicle.plateImage || '',
        confidence:  unknownVehicle.confidence || 0,
        ...form,
      })
      fetchLatestLogs()
      dismissUnknown()
      setForm({ name: '', type: 'Guest', mobile: '', flatNumber: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Unknown Vehicle Detected</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Register this vehicle to grant entry</p>
            </div>
          </div>
          <button
            onClick={dismissUnknown}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Plate preview */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Car className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Detected Plate</p>
              <p className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wider">
                {unknownVehicle.plateNumber}
              </p>
            </div>
            {unknownVehicle.plateImage && (
              <img
                src={`/plates/${unknownVehicle.plateImage}`}
                alt="plate"
                className="ml-auto h-10 rounded object-contain border border-gray-200 dark:border-gray-700"
                onError={e => e.target.style.display = 'none'}
              />
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name" value={form.name} onChange={handleChange}
                placeholder="John Doe"
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="text-rose-500">*</span>
              </label>
              <select name="type" value={form.type} onChange={handleChange} className="form-input">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Flat Number <span className="text-rose-500">*</span>
              </label>
              <input
                name="flatNumber" value={form.flatNumber} onChange={handleChange}
                placeholder="A-101"
                className="form-input"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                name="mobile" value={form.mobile} onChange={handleChange}
                placeholder="+91 98765 43210"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={dismissUnknown} className="btn-secondary flex-1">
              Deny Entry
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Registering...' : 'Allow Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
