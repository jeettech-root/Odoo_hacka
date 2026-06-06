import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function Quotations() {
  const [quotations, setQuotations] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [order, setOrder] = useState('asc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states (Vendor)
  const [form, setForm] = useState({ rfqId: '', vendorId: '', price: '', deliveryDays: '', notes: '' })
  const [vendors, setVendors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const role = getRoleFromToken()
  const isProcurement = role === 'Admin' || role === 'ProcurementOfficer'
  const isVendor = role === 'Vendor'

  function idOf(value) {
    return typeof value === 'string' ? value : value?._id || ''
  }

  function vendorLabel(q) {
    if (q.vendorName) return q.vendorName
    if (q.vendorId && typeof q.vendorId === 'object') {
      return q.vendorId.companyName || q.vendorId.email || q.vendorId._id
    }
    return q.vendorId || ''
  }

  async function fetchRFQs() {
    try {
      const res = await api.get('/api/rfqs')
      const list = res.data || []
      setRfqs(list)
      if (list.length > 0 && isProcurement) {
        setSelectedRfq(list[0]._id)
        fetchQuotations(list[0]._id, sortBy, order)
      }
    } catch (e) {
      setError('Failed to fetch RFQs')
    }
  }

  async function fetchVendors() {
    if (!isVendor) return
    try {
      const res = await api.get('/api/vendors')
      setVendors(res.data || [])
    } catch (e) {}
  }

  async function fetchQuotations(rfqId = selectedRfq, s = sortBy, o = order) {
    if (!isProcurement) return
    setLoading(true)
    setError('')
    try {
      if (!rfqId) {
        setQuotations([])
        setLoading(false)
        return
      }
      const url = `/api/quotations/rfq/${rfqId}?sortBy=${encodeURIComponent(s)}&order=${encodeURIComponent(o)}`
      const res = await api.get(url)
      setQuotations(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch quotations')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRFQs()
    fetchVendors()
  }, [])

  async function handleFilter(e) {
    e?.preventDefault()
    fetchQuotations(selectedRfq, sortBy, order)
  }

  async function handleRequestApproval(qId, rfqId) {
    setError('')
    setSuccess('')
    try {
      await api.post('/api/approvals', {
        quotationId: qId,
        rfqId,
        remarks: 'Approval requested from Quotations list.'
      })
      setSuccess('Approval requested successfully!')
      fetchQuotations()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to request approval')
    }
  }

  async function handleVendorSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        deliveryDays: Number(form.deliveryDays)
      }
      await api.post('/api/quotations', payload)
      setSuccess('Quotation submitted successfully!')
      setForm({ rfqId: '', vendorId: '', price: '', deliveryDays: '', notes: '' })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit quotation')
    }
    setSubmitting(false)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quotations comparison (Left column - takes 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Quotation Comparison</h2>
              <p className="text-xs text-slate-400">Select an RFQ to compare prices, delivery times, and requests</p>
            </div>

            {isProcurement && (
              <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">RFQ</label>
                  <select
                    value={selectedRfq}
                    onChange={e => setSelectedRfq(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                  >
                    <option value="">Select RFQ</option>
                    {rfqs.map(r => (
                      <option key={r._id} value={r._id}>{r.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                  >
                    <option value="price">Price</option>
                    <option value="deliveryDays">Delivery Days</option>
                    <option value="createdAt">Date Submitted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Order</label>
                  <select
                    value={order}
                    onChange={e => setOrder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-all"
                >
                  Apply Filter
                </button>
              </form>
            )}
          </div>

          {/* Quotations Table */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
            {!isProcurement ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Quotation comparative analysis is restricted to procurement and administrative users.
              </div>
            ) : loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Fetching quotations...</div>
            ) : quotations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No quotations submitted for the selected RFQ.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Delivery</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {quotations.map(q => {
                      const isL = q.isLowest
                      return (
                        <tr
                          key={q._id}
                          className={`hover:bg-slate-900/40 transition-colors duration-150 ${
                            isL ? 'bg-emerald-950/10' : ''
                          }`}
                        >
                          <td className="p-4 font-semibold text-slate-200">
                            <div className="flex flex-col">
                              <span>{vendorLabel(q)}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{q._id}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-100 text-sm">${q.price}</span>
                              {isL && (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  Best Bid
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">{q.deliveryDays} Days</td>
                          <td className="p-4 capitalize">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              q.status === 'accepted' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/20' : 
                              (q.status === 'rejected' ? 'bg-rose-950 text-rose-300 border-rose-500/20' : 'bg-slate-900 text-slate-400 border-slate-800')
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {q.status === 'submitted' && (
                              <button
                                onClick={() => handleRequestApproval(q._id, idOf(q.rfqId))}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                              >
                                Request Approval
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Submit Quotation Form (Right column, Vendor only) */}
        <div className="space-y-4">
          {isVendor ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Submit Quotation</h2>
              <p className="text-xs text-slate-400 mb-6">Submit a formal commercial quote against assigned RFQ</p>
              
              <form onSubmit={handleVendorSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select RFQ
                  </label>
                  <select
                    value={form.rfqId}
                    onChange={e => setForm({ ...form, rfqId: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Select an assigned RFQ</option>
                    {rfqs.map(r => (
                      <option key={r._id} value={r._id}>{r.title} ({r.productName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Vendor Profile
                  </label>
                  <select
                    value={form.vendorId}
                    onChange={e => setForm({ ...form, vendorId: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Select your vendor identity</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Total Bid Price ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter total amount"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Delivery Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Estimated lead time in days"
                    value={form.deliveryDays}
                    onChange={e => setForm({ ...form, deliveryDays: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Quotation Remarks
                  </label>
                  <textarea
                    placeholder="Provide any terms, clarifications, or comments..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 h-20 resize-none focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-600/10"
                >
                  {submitting ? 'Submitting Quotation...' : 'Submit Quotation'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only registered Vendors can submit formal quotations.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
