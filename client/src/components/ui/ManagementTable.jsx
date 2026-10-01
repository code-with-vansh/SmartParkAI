// ─── ManagementTable ─────────────────────────────────────────────────────────
// Generic CRUD table used by Members, Guests, Delivery, Other pages
import React, { useState } from 'react'
import { Pencil, Trash2, Plus, Search, X, Check } from 'lucide-react'

export default function ManagementTable({
  title, icon: Icon, color = 'blue',
  items, loading,
  columns,           // [{ key, label, render? }]
  formFields,        // [{ name, label, type, options?, required? }]
  defaultForm,
  onAdd, onUpdate, onDelete,
}) {
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(defaultForm)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState(null)

  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    gray:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  }

  // Filter items by any string field
  const filtered = items.filter(item =>
    Object.values(item).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  )

  const openAdd = () => {
    setEditItem(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ ...defaultForm, ...item })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditItem(null)
    setForm(defaultForm)
  }

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await onUpdate(editItem._id, form)
      } else {
        await onAdd(form)
      }
      closeForm()
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    setDeleteId(id)
    try {
      await onDelete(id)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="card p-4 flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">{title}</h2>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="form-input pl-8 w-56 text-xs"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                {columns.map(c => (
                  <th key={c.key} className="px-4 py-3 text-left">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-12 text-gray-400 text-sm">No records found</td></tr>
              ) : filtered.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {c.render ? c.render(item[c.key], item) : (item[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleteId === item._id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          {filtered.length} records
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editItem ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {formFields.map(field => (
                  <div key={field.name} className={field.fullWidth ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        className="form-input"
                      >
                        {field.options.map(o => (
                          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={field.name}
                        type={field.type || 'text'}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        className="form-input"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
