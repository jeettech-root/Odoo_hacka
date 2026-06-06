import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function Approvals() {
  const [approvals, setApprovals] = useState([])
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states (Procurement Officer)
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [remarksInput, setRemarksInput] = useState('')
  
  // Remarks state per approval card (Manager)
  const [cardRemarks, setCardRemarks] = useState({})
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('Pending')

  const role = getRoleFromToken()
  const canRequest = role === 'Admin' || role === 'ProcurementOfficer'
  const isManager = role === 'Manager' || role === 'Admin'

  function idOf(val) {
    return typeof val === 'string' ? val : val?._id || ''
  }

  async function fetchApprovals() {
    setLoading(true)
    setError('')
    try {
      // Fetch approvals with the current status filter
      const res = await api.get(`/api/approvals/pending?status=${statusFilter}`)
      setApprovals(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load approvals')
    }
    setLoading(false)
  }

  async function fetchQuotations() {
    if (!canRequest) return
    try {
      const res = await api.get('/api/quotations?status=submitted')
      setQuotations(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load quotations')
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [role, statusFilter])

  useEffect(() => {
    fetchQuotations()
  }, [role])

  async function handleRequest(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedQuoteId) return setError('Please select a quotation')

    try {
      const q = quotations.find(x => x._id === selectedQuoteId)
      const rfqId = idOf(q?.rfqId)
      await api.post('/api/approvals', {
        quotationId: selectedQuoteId,
        rfqId,
        remarks: remarksInput
      })
      setSuccess('Approval request submitted successfully!')
      setSelectedQuoteId('')
      setRemarksInput('')
      fetchQuotations()
      fetchApprovals()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to request approval')
    }
  }

  async function handleApprovalAction(id, action) {
    setError('')
    setSuccess('')
    const remarks = cardRemarks[id] || ''
    try {
      if (action === 'approve') {
        await api.post(`/api/approvals/${id}/approve`, { remarks })
        setSuccess('Quotation approved successfully!')
      } else {
        await api.post(`/api/approvals/${id}/reject`, { remarks })
        setSuccess('Quotation rejected.')
      }
      // Clear input state
      setCardRemarks({ ...cardRemarks, [id]: '' })
      fetchApprovals()
    } catch (err) {
      setError(err?.response?.data?.error || 'Action failed')
    }
  }

  const badgeColors = {
    Pending: 'bg-amber-950 text-amber-300 border-amber-500/20',
    Approved: 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
    Rejected: 'bg-rose-950 text-rose-300 border-rose-500/20'
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Approvals Listing (Left column - takes 2 cols on lg screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Approvals Hub</h2>
              <p className="text-xs text-slate-400">Review status and authorize procurement operations</p>
            </div>
            
            <div className="flex gap-2">
              {['Pending', 'Approved', 'Rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all duration-150 ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Fetching approvals list...</div>
          ) : approvals.length === 0 ? (
            <div className="bg-slate-950/20 border border-slate-800/50 p-12 text-center rounded-2xl">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <h3 className="font-semibold text-slate-300">No Approvals Found</h3>
              <p className="text-xs text-slate-500 mt-1">There are no {statusFilter.toLowerCase()} approvals at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map(a => {
                const quote = a.quotationId || {}
                const vendor = quote.vendorId || {}
                const rfq = quote.rfqId || {}
                return (
                  <div key={a._id} className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl hover:border-slate-700/80 transition-all duration-200 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 font-mono">{a._id}</span>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColors[a.status]}`}>
                            {a.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-100 mt-2 text-md">
                          RFQ: {rfq.title || 'Unknown Product'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Product: {rfq.productName} ({rfq.quantity} {rfq.unit})
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Quoted Price</span>
                        <span className="text-lg font-extrabold text-white">${quote.price || 0}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block">Vendor Company</span>
                        <span className="text-slate-300 font-semibold">{vendor.companyName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Delivery Time</span>
                        <span className="text-slate-300 font-semibold">{quote.deliveryDays || 0} Days</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Requested By</span>
                        <span className="text-slate-300 font-semibold">{a.requesterId?.name || 'Procurement Officer'}</span>
                      </div>
                    </div>

                    {quote.notes && (
                      <div className="text-xs text-slate-400 bg-slate-900/20 p-3 rounded-lg border border-slate-900/60">
                        <strong>Quotation Notes:</strong> {quote.notes}
                      </div>
                    )}

                    {a.remarks && (
                      <div className="text-xs text-slate-300 bg-indigo-950/20 p-3 rounded-lg border border-indigo-950/50">
                        <strong>Approval Remarks:</strong> {a.remarks}
                      </div>
                    )}

                    {/* Actions panel (Only for managers, on Pending status) */}
                    {isManager && a.status === 'Pending' && (
                      <div className="pt-2 border-t border-slate-900/60 flex flex-col md:flex-row items-center gap-3">
                        <textarea
                          placeholder="Enter approval/rejection remarks..."
                          value={cardRemarks[a._id] || ''}
                          onChange={e => setCardRemarks({ ...cardRemarks, [a._id]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700 h-16 resize-none"
                        />
                        <div className="flex w-full md:w-auto gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprovalAction(a._id, 'approve')}
                            className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors duration-150"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprovalAction(a._id, 'reject')}
                            className="flex-1 md:flex-initial bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors duration-150"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Request Approval Form (Right column) */}
        <div className="space-y-4">
          {canRequest ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Request Approval</h2>
              <p className="text-xs text-slate-400 mb-6">Request managerial approval for a submitted quotation</p>
              
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Quotation
                  </label>
                  <select
                    value={selectedQuoteId}
                    onChange={e => setSelectedQuoteId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Select a submitted quote</option>
                    {quotations.map(q => {
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Remarks / Notes
                  </label>
                  <textarea
                    placeholder="Enter context, details, or reasons..."
                    value={remarksInput}
                    onChange={e => setRemarksInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700 h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition-colors duration-150 shadow-lg shadow-indigo-600/15"
                >
                  Request Approval
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only Procurement Officers or Admins may create approval requests.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
