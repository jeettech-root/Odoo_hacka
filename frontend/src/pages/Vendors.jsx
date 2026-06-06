import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const role = getRoleFromToken()

  const [form, setForm] = useState({
    companyName: '',
    gstNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    status: 'active'
  })
  const [editingId, setEditingId] = useState(null)

  const canManage = role === 'Admin' || role === 'ProcurementOfficer'

  function idOf(value) {
    return typeof value === 'string' ? value : value?._id || ''
  }

  const [approvedQuotes, setApprovedQuotes] = useState([])
  const [poGeneratingId, setPoGeneratingId] = useState(null)

  async function fetchApprovedQuotes() {
    if (!canManage) return
    try {
      const [posRes, quotesRes] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/quotations?status=accepted')
      ])
      const posList = posRes.data || []
      const quotesList = quotesRes.data || []
      
      const poQuoteIds = posList.map(p => idOf(p.quotationId))
      const availableQuotes = quotesList.filter(q => !poQuoteIds.includes(q._id))
      setApprovedQuotes(availableQuotes)
    } catch (e) {
      console.error('Failed to load approved quotations or POs in Vendors page', e)
    }
  }

  async function handleGeneratePo(quoteId) {
    setError('')
    setSuccess('')
    setPoGeneratingId(quoteId)
    try {
      await api.post('/api/purchase-orders/generate', { quotationId: quoteId })
      setSuccess('Purchase Order generated successfully!')
      fetchApprovedQuotes()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate Purchase Order')
    }
    setPoGeneratingId(null)
  }

  async function fetchVendors(q = '') {
    setLoading(true)
    setError('')
    try {
      const url = q ? `/api/vendors?q=${encodeURIComponent(q)}` : '/api/vendors'
      const res = await api.get(url)
      setVendors(res.data || [])
    } catch (e) {
      setError('Failed to load vendors')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVendors()
    fetchApprovedQuotes()
  }, [role])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await api.put(`/api/vendors/${editingId}`, form)
        setSuccess('Vendor updated successfully!')
      } else {
        await api.post('/api/vendors', form)
        setSuccess('Vendor registered successfully!')
      }
      setForm({
        companyName: '',
        gstNumber: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        status: 'active'
      })
      setEditingId(null)
      fetchVendors(search)
      fetchApprovedQuotes()
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Save failed')
    }
  }

  function startEdit(v) {
    setEditingId(v._id)
    setForm({
      companyName: v.companyName || '',
      gstNumber: v.gstNumber || '',
      contactPerson: v.contactPerson || '',
      email: v.email || '',
      phone: v.phone || '',
      address: v.address || '',
      category: v.category || '',
      status: v.status || 'active'
    })
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this vendor record?')) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/api/vendors/${id}`)
      setSuccess('Vendor deleted successfully.')
      fetchVendors(search)
      fetchApprovedQuotes()
    } catch (e) {
      setError(e?.response?.data?.error || 'Delete failed')
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    fetchVendors(search)
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

      {/* Header and Search control */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Vendor Directory</h2>
          <p className="text-xs text-slate-400">Manage vendor contact details, tax numbers, and registration statuses</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-700"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vendors List (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading vendors directory...</div>
            ) : vendors.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No vendors registered yet.</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {vendors.map(v => (
                  <div key={v._id} className="p-6 hover:bg-slate-900/30 transition-colors duration-150 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-100 text-sm">{v.companyName}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          v.status === 'active' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/20' : 'bg-slate-850 text-slate-400 border-slate-750'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Contact: <span className="text-slate-300 font-semibold">{v.contactPerson || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Email: <span className="text-slate-300">{v.email || 'N/A'}</span> | Phone: <span className="text-slate-300">{v.phone || 'N/A'}</span>
                      </p>
                      {v.address && (
                        <p className="text-xs text-slate-500 truncate max-w-sm md:max-w-md">
                          Address: {v.address}
                        </p>
                      )}
                      <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
                        <span>GST: <strong className="text-slate-400">{v.gstNumber || 'N/A'}</strong></span>
                        <span>Category: <strong className="text-slate-400 capitalize">{v.category || 'General'}</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canManage && (
                        <button
                          onClick={() => startEdit(v)}
                          className="bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                        >
                          Edit
                        </button>
                      )}
                      {role === 'Admin' && (
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="bg-slate-900 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create / Edit Form & PO Generator (Right Column) */}
        <div className="space-y-6">
          {canManage ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-md font-bold text-white">{editingId ? 'Edit Vendor Profile' : 'Register Vendor'}</h2>
                <p className="text-[10px] text-slate-400">Setup company accounts and details</p>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Company Name</label>
                  <input
                    required
                    placeholder="Enter company name"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">GST Number</label>
                  <input
                    placeholder="e.g. 29AAAAA1111A1Z1"
                    value={form.gstNumber}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Contact Person</label>
                  <input
                    placeholder="Full name of representative"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                  <input
                    placeholder="e.g. +91 9999999999"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Office Address</label>
                  <input
                    placeholder="Street, City, Zip"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Category / Tag</label>
                  <input
                    placeholder="e.g. Logistics, IT Services"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition"
                  >
                    {editingId ? 'Save Profile' : 'Register Vendor'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setForm({
                          companyName: '',
                          gstNumber: '',
                          contactPerson: '',
                          email: '',
                          phone: '',
                          address: '',
                          category: '',
                          status: 'active'
                        })
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only Procurement Officers or Admins may register or edit vendors.
            </div>
          )}

          {canManage && (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-md font-bold text-white">Generate Purchase Orders</h2>
                <p className="text-[10px] text-slate-400">Approved quotations ready for contract issuance</p>
              </div>

              {approvedQuotes.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-800/60 rounded-xl text-slate-500 text-xs">
                  No approved quotations pending PO generation.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {approvedQuotes.map(q => {
                    const rfqTitle = q.rfqId && typeof q.rfqId === 'object' ? q.rfqId.productName || q.rfqId.title : 'RFQ'
                    const vendorName = q.vendorId && typeof q.vendorId === 'object' ? q.vendorId.companyName : 'Vendor'
                    return (
                      <div key={q._id} className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{rfqTitle}</h4>
                          <p className="text-[10px] text-indigo-400 font-semibold">{vendorName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Bid Amount: <span className="text-emerald-400 font-bold">${q.price?.toLocaleString()}</span></p>
                        </div>
                        <button
                          disabled={poGeneratingId === q._id}
                          onClick={() => handleGeneratePo(q._id)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition flex-shrink-0"
                        >
                          {poGeneratingId === q._id ? 'Generating...' : 'Generate PO'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
