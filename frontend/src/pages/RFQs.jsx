import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function RFQs() {
  const [rfqs, setRfqs] = useState([])
  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    productName: '',
    quantity: 1,
    unit: 'pcs',
    deadline: '',
    assignedVendors: [],
    status: 'open'
  })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const role = getRoleFromToken()
  const canManage = role === 'Admin' || role === 'ProcurementOfficer'

  async function fetchAll() {
    setError('')
    try {
      const [rRes, vRes] = await Promise.all([
        api.get('/api/rfqs'),
        api.get('/api/vendors')
      ])
      setRfqs(rRes.data || [])
      setVendors(vRes.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load RFQs or Vendors')
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        assignedVendors: (form.assignedVendors || []).map(v => typeof v === 'string' ? v : v._id)
      }
      if (!payload.deadline) delete payload.deadline

      if (editingId) {
        await api.put(`/api/rfqs/${editingId}`, payload)
        setSuccess('RFQ updated successfully!')
      } else {
        await api.post('/api/rfqs', payload)
        setSuccess('RFQ created successfully!')
      }

      setForm({
        title: '',
        description: '',
        productName: '',
        quantity: 1,
        unit: 'pcs',
        deadline: '',
        assignedVendors: [],
        status: 'open'
      })
      setEditingId(null)
      fetchAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Save failed')
    }
  }

  function startEdit(r) {
    setEditingId(r._id)
    setForm({
      title: r.title || '',
      description: r.description || '',
      productName: r.productName || '',
      quantity: r.quantity || 1,
      unit: r.unit || 'pcs',
      deadline: r.deadline ? r.deadline.split('T')[0] : '',
      assignedVendors: (r.assignedVendors || []).map(v => typeof v === 'string' ? v : v._id),
      status: r.status || 'open'
    })
  }

  async function handleAssign(rfqId) {
    setError('')
    setSuccess('')
    try {
      await api.post(`/api/rfqs/${rfqId}/assign-vendors`, {
        assignedVendors: (form.assignedVendors || []).map(v => typeof v === 'string' ? v : v._id)
      })
      setSuccess('Vendors assigned successfully!')
      fetchAll()
    } catch (e) {
      setError('Assign failed')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this RFQ?')) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/rfqs/${id}`)
      setSuccess('RFQ deleted.')
      fetchAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-sm">
          <span>{success}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white">Requests for Quotations (RFQs)</h2>
        <p className="text-xs text-slate-400">Launch procurement requirements and invite commercial bids</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RFQ List (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {rfqs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No RFQs recorded.</div>
            ) : (
              rfqs.map(r => (
                <div key={r._id} className="p-6 hover:bg-slate-900/30 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-100 text-sm">{r.title}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === 'open' ? 'bg-blue-950 text-blue-300 border-blue-500/20' : 'bg-slate-850 text-slate-400 border-slate-750'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    {r.description && <p className="text-xs text-slate-400">{r.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                      <span>Product: <strong className="text-slate-300">{r.productName}</strong></span>
                      <span>Qty: <strong className="text-slate-300">{r.quantity} {r.unit}</strong></span>
                      {r.deadline && (
                        <span>Deadline: <strong className="text-slate-300">{new Date(r.deadline).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                    <div className="text-[10px] text-indigo-400 pt-1 font-semibold">
                      Assigned Vendors: {(r.assignedVendors || []).length}
                    </div>
                  </div>

                  <div className="flex gap-2 self-start md:self-center">
                    {canManage && (
                      <button
                        onClick={() => startEdit(r)}
                        className="bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                      >
                        Edit
                      </button>
                    )}
                    {role === 'Admin' && (
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="bg-slate-900 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create / Edit Form (Right Column) */}
        <div>
          {canManage ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-md font-bold text-white">{editingId ? 'Edit RFQ Details' : 'Create RFQ'}</h2>
                <p className="text-[10px] text-slate-400">Initiate a new procurement request</p>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Title</label>
                  <input
                    required
                    placeholder="e.g. Q3 Office Stationary Supply"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                  <textarea
                    placeholder="Provide detailed requirements..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Product Name</label>
                  <input
                    required
                    placeholder="What product/service is required?"
                    value={form.productName}
                    onChange={e => setForm({ ...form, productName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Unit</label>
                    <input
                      placeholder="e.g. pcs, kgs, hrs"
                      value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Assign Vendors</label>
                  <select
                    multiple
                    value={form.assignedVendors}
                    onChange={e => {
                      const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                      setForm({ ...form, assignedVendors: opts })
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 h-28 focus:outline-none"
                  >
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.companyName}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">Hold Ctrl (Cmd) to select multiple vendors</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition"
                  >
                    {editingId ? 'Save RFQ' : 'Create RFQ'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setForm({
                          title: '',
                          description: '',
                          productName: '',
                          quantity: 1,
                          unit: 'pcs',
                          deadline: '',
                          assignedVendors: [],
                          status: 'open'
                        })
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => handleAssign(editingId)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-xl transition font-bold"
                    >
                      Assign
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only Procurement Officers or Admins may create or edit RFQs.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
