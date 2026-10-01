// ─── Delivery Management Page ─────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { Truck } from 'lucide-react'
import ManagementTable from '../../components/ui/ManagementTable'
import api from '../../utils/api'

const COLUMNS = [
  { key: 'name',        label: 'Name' },
  { key: 'type',        label: 'Type', render: v => <span className="badge-delivery">{v}</span> },
  { key: 'flatNumber',  label: 'Delivering To' },
  { key: 'plateNumber', label: 'Plate', render: v => (
    <span className="font-mono font-bold tracking-wider text-gray-900 dark:text-white">{v}</span>
  )},
  { key: 'mobile', label: 'Mobile' },
  { key: 'isInside', label: 'Status', render: v => (
    <span className={v ? 'badge-entry' : 'text-xs text-gray-400'}>{v ? 'Inside' : 'Outside'}</span>
  )},
]

const FORM_FIELDS = [
  { name: 'name',        label: 'Driver Name',   required: true, fullWidth: true, placeholder: 'Rahul Kumar' },
  { name: 'type',        label: 'Service Type',  type: 'select',
    options: ['Delivery', 'Amazon', 'Swiggy', 'Zomato', 'Dunzo', 'Other Delivery'] },
  { name: 'flatNumber',  label: 'Delivering To', required: true, placeholder: 'C-303' },
  { name: 'mobile',      label: 'Mobile',        placeholder: '+91 98765 43210' },
  { name: 'plateNumber', label: 'Plate Number',  required: true, placeholder: 'MH01ZZ9999', fullWidth: true },
]

const DEFAULT_FORM = { name: '', type: 'Delivery', flatNumber: '', mobile: '', plateNumber: '' }

export default function Delivery() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try { const r = await api.get('/delivery'); setItems(r.data) }
    catch (e) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const onAdd    = async (form) => { await api.post('/delivery', form); await fetch() }
  const onUpdate = async (id, form) => { await api.put(`/delivery/${id}`, form); await fetch() }
  const onDelete = async (id) => { await api.delete(`/delivery/${id}`); await fetch() }

  return (
    <ManagementTable
      title="Delivery Vehicles" icon={Truck} color="amber"
      items={items} loading={loading}
      columns={COLUMNS} formFields={FORM_FIELDS}
      defaultForm={DEFAULT_FORM}
      onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete}
    />
  )
}
