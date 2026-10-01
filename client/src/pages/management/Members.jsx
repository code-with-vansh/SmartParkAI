// ─── Members Management Page ──────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { UserCheck } from 'lucide-react'
import ManagementTable from '../../components/ui/ManagementTable'
import api from '../../utils/api'

const COLUMNS = [
  { key: 'name',        label: 'Name' },
  { key: 'flatNumber',  label: 'Flat' },
  { key: 'plateNumber', label: 'Plate', render: v => (
    <span className="font-mono font-bold tracking-wider text-gray-900 dark:text-white">{v}</span>
  )},
  { key: 'mobile',      label: 'Mobile' },
  { key: 'vehicleType', label: 'Vehicle' },
  { key: 'zone',        label: 'Zone', render: v => (
    <span className="badge-member">Zone {v}</span>
  )},
  { key: 'isInside',    label: 'Status', render: v => (
    <span className={v ? 'badge-entry' : 'text-xs text-gray-400'}>
      {v ? 'Inside' : 'Outside'}
    </span>
  )},
]

const FORM_FIELDS = [
  { name: 'name',        label: 'Full Name',    required: true,  fullWidth: true, placeholder: 'John Doe' },
  { name: 'flatNumber',  label: 'Flat Number',  required: true,  placeholder: 'A-101' },
  { name: 'mobile',      label: 'Mobile',       required: false, placeholder: '+91 98765 43210' },
  { name: 'plateNumber', label: 'Plate Number', required: true,  placeholder: 'MH12AB1234', fullWidth: true },
  { name: 'vehicleType', label: 'Vehicle Type', type: 'select',
    options: ['Car', 'Bike', 'SUV', 'Van', 'Truck'] },
  { name: 'zone', label: 'Zone', type: 'select',
    options: [{ value: 'A', label: 'Zone A (Members)' }, { value: 'B', label: 'Zone B' }] },
]

const DEFAULT_FORM = { name: '', flatNumber: '', mobile: '', plateNumber: '', vehicleType: 'Car', zone: 'A' }

export default function Members() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try { const r = await api.get('/members'); setItems(r.data) }
    catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const onAdd    = async (form) => { await api.post('/members', form); await fetch() }
  const onUpdate = async (id, form) => { await api.put(`/members/${id}`, form); await fetch() }
  const onDelete = async (id) => { await api.delete(`/members/${id}`); await fetch() }

  return (
    <ManagementTable
      title="Members" icon={UserCheck} color="blue"
      items={items} loading={loading}
      columns={COLUMNS} formFields={FORM_FIELDS}
      defaultForm={DEFAULT_FORM}
      onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete}
    />
  )
}
