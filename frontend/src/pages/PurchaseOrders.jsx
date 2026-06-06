import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function PurchaseOrders() {
  const [pos, setPos] = useState([])
  const [approvedQuotes, setApprovedQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  
  // Details Modal state
  const [viewingPo, setViewingPo] = useState(null)

  const role = getRoleFromToken()
  const canManage = role === 'Admin' || role === 'ProcurementOfficer'

  function idOf(value) {
    return typeof value === 'string' ? value : value?._id || ''
  }

  async function fetchPOsAndApprovedQuotes() {
    setLoading(true)
    setError('')
    try {
      const [posRes, quotesRes] = await Promise.all([
        api.get('/api/purchase-orders'),
        canManage ? api.get('/api/quotations?status=accepted') : Promise.resolve({ data: [] })
      ])
      const posList = posRes.data || []
      const quotesList = quotesRes.data || []

      setPos(posList)

      // Dynamically filter out accepted quotations that already have POs
      const poQuoteIds = posList.map(p => idOf(p.quotationId))
      const availableQuotes = quotesList.filter(q => !poQuoteIds.includes(q._id))
      setApprovedQuotes(availableQuotes)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load POs or Quotations')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPOsAndApprovedQuotes()
  }, [role])

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedQuoteId) return setError('Please select an approved quotation')

    try {
      await api.post('/api/purchase-orders/generate', { quotationId: selectedQuoteId })
      setSuccess('Purchase Order generated successfully!')
      setSelectedQuoteId('')
      fetchPOsAndApprovedQuotes()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate Purchase Order')
    }
  }

  async function handleStatusChange(poId, newStatus) {
    setError('')
    setSuccess('')
    try {
      await api.post(`/api/purchase-orders/${poId}/status`, { status: newStatus, remarks: `Status changed to ${newStatus}` })
      setSuccess(`PO status updated to ${newStatus}`)
      fetchPOsAndApprovedQuotes()
      if (viewingPo && viewingPo._id === poId) {
        setViewingPo({ ...viewingPo, status: newStatus })
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update PO status')
    }
  }

  async function openPoDetails(poId) {
    try {
      const res = await api.get(`/api/purchase-orders/${poId}`)
      setViewingPo(res.data)
    } catch (err) {
      setError('Failed to load purchase order details')
    }
  }

  const badgeColors = {
    Draft: 'bg-slate-800 text-slate-300 border-slate-700/60',
    Issued: 'bg-blue-950 text-blue-300 border-blue-500/20',
    Completed: 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
    Cancelled: 'bg-rose-950 text-rose-300 border-rose-500/20'
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
        
        {/* PO Table (Left column - takes 2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white">Purchase Orders</h2>
            <p className="text-xs text-slate-400">Track purchase order numbers, vendor execution, and statuses</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Fetching POs...</div>
            ) : pos.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No Purchase Orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="p-4">PO Number</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {pos.map(p => {
                      const vendor = p.vendorId || {}
                      return (
                        <tr key={p._id} className="hover:bg-slate-900/40 transition-colors duration-150">
                          <td className="p-4 font-bold text-slate-200">
                            {p.poNumber}
                          </td>
                          <td className="p-4">
                            {vendor.companyName || vendor.email || idOf(p.vendorId)}
                          </td>
                          <td className="p-4 font-semibold text-slate-100">
                            ${p.amount?.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColors[p.status]}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {canManage && p.status === 'Draft' && (
                              <button
                                onClick={() => handleStatusChange(p._id, 'Issued')}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                              >
                                Issue PO
                              </button>
                            )}
                            <button
                              onClick={() => openPoDetails(p._id)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] transition"
                            >
                              Details
                            </button>
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

        {/* Generate PO Form (Right column) */}
        <div className="space-y-4">
          {canManage ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Generate Purchase Order</h2>
              <p className="text-xs text-slate-400 mb-6">Create a legal purchase order from an approved quotation</p>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Approved Quotation
                  </label>
                  <select
                    value={selectedQuoteId}
                    onChange={e => setSelectedQuoteId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Select approved quote</option>
                    {approvedQuotes.map(q => {
                      const rfqTitle = q.rfqId && typeof q.rfqId === 'object' ? q.rfqId.title : 'RFQ'
                      const vendorName = q.vendorId && typeof q.vendorId === 'object' ? q.vendorId.companyName : 'Vendor'
                      return (
                        <option key={q._id} value={q._id}>
                          {rfqTitle} - {vendorName} (${q.price})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/10"
                >
                  Generate PO Document
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only Procurement Officers or Admins may generate Purchase Orders.
            </div>
          )}
        </div>
      </div>

      {/* PO Details Modal Sheet */}
      {viewingPo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setViewingPo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Print Layout Sheet */}
            <div className="space-y-6 text-slate-300">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">PURCHASE ORDER</h3>
                  <span className="text-xs text-indigo-400 font-mono mt-1 block">{viewingPo.poNumber}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeColors[viewingPo.status]}`}>
                  {viewingPo.status}
                </span>
              </div>

              {/* Vendor & Client Details */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Company / Client</h4>
                  <p className="font-semibold text-white">VendorBridge Procurement Corp</p>
                  <p>100 Innovation Way, Tech Park</p>
                  <p>GSTIN: 29AAACV1234F1Z0</p>
                  <p>finance@vendorbridge.com</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor Details</h4>
                  <p className="font-semibold text-white">{viewingPo.vendorId?.companyName || 'N/A'}</p>
                  <p>{viewingPo.vendorId?.address || 'Address not listed'}</p>
                  <p>GSTIN: {viewingPo.vendorId?.gstNumber || 'N/A'}</p>
                  <p>Email: {viewingPo.vendorId?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Items Table details */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <div className="col-span-2">Item Description</div>
                  <div>Qty</div>
                  <div className="text-right">Price</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 border-b border-slate-900">
                  <div className="col-span-2 font-semibold text-white">
                    {viewingPo.rfqId?.productName || 'Items procured'}
                  </div>
                  <div>{viewingPo.rfqId?.quantity || 1} {viewingPo.rfqId?.unit || 'pcs'}</div>
                  <div className="text-right">${viewingPo.amount?.toLocaleString()}</div>
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                <div className="text-[10px] text-slate-500">
                  <div>Reference Quote ID: {idOf(viewingPo.quotationId)}</div>
                  <div className="mt-1">Generated At: {viewingPo.generatedAt ? new Date(viewingPo.generatedAt).toLocaleString() : 'N/A'}</div>
                </div>
                
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold">${viewingPo.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (GST 18%):</span>
                    <span>${(viewingPo.amount * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm border-t border-slate-900 pt-2">
                    <span>Total Cost:</span>
                    <span>${(viewingPo.amount * 1.18).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Manager Actions inside details */}
              {canManage && viewingPo.status !== 'Completed' && viewingPo.status !== 'Cancelled' && (
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Modify Document Status:</span>
                  <div className="flex gap-2">
                    {viewingPo.status === 'Draft' && (
                      <button
                        onClick={() => handleStatusChange(viewingPo._id, 'Issued')}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Issue
                      </button>
                    )}
                    {viewingPo.status === 'Issued' && (
                      <button
                        onClick={() => handleStatusChange(viewingPo._id, 'Completed')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(viewingPo._id, 'Cancelled')}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Cancel PO
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
