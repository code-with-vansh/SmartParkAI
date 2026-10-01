// ─── Guests Management Page ───────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import ManagementTable from '../../components/ui/ManagementTable'
import api from '../../utils/api'

const COLUMNS = [
  { key: 'name',        label: 'Name' },
  { key: 'flatNumber',  label: 'Visiting Flat' },
  { key: 'plateNumber', label: 'Plate', render: v => (
    <span className="font-mono font-bold tracking-wider text-gray-900 dark:text-white">{v}</span>
  )},
  { key: 'mobile',      label: 'Mobile' },
  { key: 'isInside',    label: 'Status', render: v => (
    <span className={v ? 'badge-entry' : 'text-xs text-gray-400'}>{v ? 'Inside' : 'Outside'}</span>
  )},
  { key: 'lastSeen', label: 'Last Seen', render: v => (
    <span className="text-xs text-gray-400">{v ? new Date(v).toLocaleDateString() : '—'}</span>
  )},
]

const FORM_FIELDS = [
  { name: 'name',        label: 'Full Name',    required: true, fullWidth: true, placeholder: 'Jane Smith' },
  { name: 'flatNumber',  label: 'Visiting Flat',required: true, placeholder: 'B-202' },
  { name: 'mobile',      label: 'Mobile',       placeholder: '+91 98765 43210' },
  { name: 'plateNumber', label: 'Plate Number', required: true, placeholder: 'MH14XY5678', fullWidth: true },
]

const DEFAULT_FORM = { name: '', flatNumber: '', mobile: '', plateNumber: '', type: 'Guest' }

export default function Guests() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try { const r = await api.get('/guests'); setItems(r.data) }
    catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const onAdd    = async (form) => { await api.post('/guests', { ...form, type: 'Guest' }); await fetch() }
  const onUpdate = async (id, form) => { await api.put(`/guests/${id}`, form); await fetch() }
  const onDelete = async (id) => { await api.delete(`/guests/${id}`); await fetch() }

  return (
    <ManagementTable
      title="Guests" icon={Users} color="purple"
      items={items} loading={loading}
      columns={COLUMNS} formFields={FORM_FIELDS}
      defaultForm={DEFAULT_FORM}
      onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete}
    />
  )
}
