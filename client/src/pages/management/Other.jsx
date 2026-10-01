// ─── Other Vehicles Page (Plumber, Electrician, etc.) ────────────────────────
import React, { useState, useEffect } from 'react'
import { Wrench } from 'lucide-react'
import ManagementTable from '../../components/ui/ManagementTable'
import api from '../../utils/api'

const COLUMNS = [
  { key: 'name',        label: 'Name' },
  { key: 'type',        label: 'Type', render: v => <span className="badge-other">{v}</span> },
  { key: 'flatNumber',  label: 'Working At' },
  { key: 'plateNumber', label: 'Plate', render: v => (
    <span className="font-mono font-bold tracking-wider text-gray-900 dark:text-white">{v}</span>
  )},
  { key: 'mobile', label: 'Mobile' },
  { key: 'isInside', label: 'Status', render: v => (
    <span className={v ? 'badge-entry' : 'text-xs text-gray-400'}>{v ? 'Inside' : 'Outside'}</span>
  )},
]

const FORM_FIELDS = [
  { name: 'name',        label: 'Full Name',    required: true, fullWidth: true, placeholder: 'Suresh Patel' },
  { name: 'type',        label: 'Profession',   type: 'select',
    options: ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Security', 'Cleaner', 'Other'] },
  { name: 'flatNumber',  label: 'Working At',   required: true, placeholder: 'D-404' },
  { name: 'mobile',      label: 'Mobile',       placeholder: '+91 98765 43210' },
  { name: 'plateNumber', label: 'Plate Number', required: true, placeholder: 'MH03WW1111', fullWidth: true },
]

const DEFAULT_FORM = { name: '', type: 'Plumber', flatNumber: '', mobile: '', plateNumber: '' }

export default function Other() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  // Other type vehicles are stored in the Delivery collection with non-delivery types
  const fetch = async () => {
    try {
      const r = await api.get('/delivery')
      // Filter for non-delivery service types
      const others = r.data.filter(d =>
        ['Plumber','Electrician','Carpenter','Painter','Security','Cleaner','Other'].includes(d.type)
      )
      setItems(others)
    } catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const onAdd    = async (form) => { await api.post('/delivery', form); await fetch() }
  const onUpdate = async (id, form) => { await api.put(`/delivery/${id}`, form); await fetch() }
  const onDelete = async (id) => { await api.delete(`/delivery/${id}`); await fetch() }

  return (
    <ManagementTable
      title="Other Vehicles (Service Personnel)" icon={Wrench} color="gray"
      items={items} loading={loading}
      columns={COLUMNS} formFields={FORM_FIELDS}
      defaultForm={DEFAULT_FORM}
      onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete}
    />
  )
}
