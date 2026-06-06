import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [issuedPOs, setIssuedPOs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [selectedPoId, setSelectedPoId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sendingEmailId, setSendingEmailId] = useState(null)

  // Details Modal state
  const [viewingInvoice, setViewingInvoice] = useState(null)

  const role = getRoleFromToken()
  const canManage = role === 'Admin' || role === 'ProcurementOfficer'

  function idOf(value) {
    return typeof value === 'string' ? value : value?._id || ''
  }

  async function fetchInvoices() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/invoices')
      setInvoices(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load invoices')
    }
    setLoading(false)
  }

  async function fetchIssuedPOs() {
    if (!canManage) return
    try {
      const res = await api.get('/api/purchase-orders')
      // Only POs with status 'Issued' or 'Completed' can be invoiced
      setIssuedPOs((res.data || []).filter(p => p.status === 'Issued' || p.status === 'Completed'))
    } catch (e) {}
  }

  useEffect(() => {
    fetchInvoices()
    fetchIssuedPOs()
  }, [role])

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedPoId) return setError('Please select an Issued Purchase Order')

    setGenerating(true)
    try {
      await api.post('/api/invoices/generate', { poId: selectedPoId })
      setSuccess('Invoice generated successfully!')
      setSelectedPoId('')
      fetchInvoices()
      fetchIssuedPOs()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate Invoice')
    }
    setGenerating(false)
  }

  async function handleStatusChange(invoiceId, newStatus) {
    setError('')
    setSuccess('')
    try {
      await api.post(`/api/invoices/${invoiceId}/status`, { status: newStatus, remarks: `Status changed to ${newStatus}` })
      setSuccess(`Invoice status updated to ${newStatus}`)
      fetchInvoices()
      if (viewingInvoice && viewingInvoice._id === invoiceId) {
        setViewingInvoice({ ...viewingInvoice, status: newStatus })
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update invoice status')
    }
  }

  async function downloadPDF(id, invoiceNumber) {
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token') || ''
      const baseURL = api.defaults.baseURL || 'http://localhost:3000'
      const url = `${baseURL}/api/invoices/${id}/pdf?token=${encodeURIComponent(token)}`

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`)
      link.setAttribute('target', '_blank')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setSuccess('PDF download initiated!')
    } catch (err) {
      setError('Failed to download invoice PDF.')
    }
  }

  async function sendEmail(id) {
    setError('')
    setSuccess('')
    setSendingEmailId(id)
    try {
      const res = await api.post(`/api/invoices/${id}/email`)
      setSuccess(res.data?.message || 'Invoice email sent successfully!')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to email invoice.')
    }
    setSendingEmailId(null)
  }

  async function openInvoiceDetails(invoiceId) {
    try {
      const res = await api.get(`/api/invoices/${invoiceId}`)
      setViewingInvoice(res.data)
    } catch (err) {
      setError('Failed to load invoice details')
    }
  }

  const badgeColors = {
    Draft: 'bg-slate-800 text-slate-300 border-slate-700/60',
    Sent: 'bg-blue-950 text-blue-300 border-blue-500/20',
    Paid: 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
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
        
        {/* Invoice List (Left Column) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white">Invoices Registry</h2>
            <p className="text-xs text-slate-400">View billing statements, tax details, and operations history</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Fetching Invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No Invoices found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="p-4">Invoice Number</th>
                      <th className="p-4">Related PO</th>
                      <th className="p-4">Grand Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {invoices.map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-900/40 transition-colors duration-150">
                        <td className="p-4 font-bold text-slate-200">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-4">
                          {inv.poId?.poNumber || idOf(inv.poId)}
                        </td>
                        <td className="p-4 font-extrabold text-white">
                          ${inv.totalAmount?.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColors[inv.status]}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openInvoiceDetails(inv._id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => downloadPDF(inv._id, inv.invoiceNumber)}
                            className="bg-indigo-650 hover:bg-indigo-550 text-white px-2 py-1 rounded text-[10px] transition"
                          >
                            PDF
                          </button>
                          {canManage && (
                            <button
                              onClick={() => sendEmail(inv._id)}
                              disabled={sendingEmailId === inv._id}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-2 py-1 rounded text-[10px] transition"
                            >
                              {sendingEmailId === inv._id ? 'Sending...' : 'Email'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Generate Invoice Form (Right column) */}
        <div className="space-y-4">
          {canManage ? (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-2">Generate Invoice</h2>
              <p className="text-xs text-slate-400 mb-6">Create a tax invoice from an Issued Purchase Order</p>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Issued Purchase Order
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={e => setSelectedPoId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Select Issued PO</option>
                    {issuedPOs.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.poNumber} (${p.amount})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/10"
                >
                  {generating ? 'Creating Invoice...' : 'Generate Invoice'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-slate-800/40 p-6 rounded-2xl text-center text-xs text-slate-400">
              Only Procurement Officers or Admins may generate billing Invoices.
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details Modal Sheet */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setViewingInvoice(null)}
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
                  <h3 className="text-xl font-extrabold text-white">TAX INVOICE</h3>
                  <span className="text-xs text-indigo-400 font-mono mt-1 block">{viewingInvoice.invoiceNumber}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeColors[viewingInvoice.status]}`}>
                  {viewingInvoice.status}
                </span>
              </div>

              {/* Vendor & Client Details */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Company)</h4>
                  <p className="font-semibold text-white">VendorBridge Procurement Corp</p>
                  <p>100 Innovation Way, Tech Park</p>
                  <p>GSTIN: 29AAACV1234F1Z0</p>
                  <p>finance@vendorbridge.com</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed By (Vendor)</h4>
                  <p className="font-semibold text-white">{viewingInvoice.vendorId?.companyName || 'N/A'}</p>
                  <p>{viewingInvoice.vendorId?.address || 'Address not listed'}</p>
                  <p>GSTIN: {viewingInvoice.vendorId?.gstNumber || 'N/A'}</p>
                  <p>Email: {viewingInvoice.vendorId?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Invoice lines */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-slate-900/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <div className="col-span-2">Product Description</div>
                  <div>Qty</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 border-b border-slate-900">
                  <div className="col-span-2 font-semibold text-white">
                    {viewingInvoice.poId?.rfqId?.productName || 'Procured Items'}
                  </div>
                  <div>{viewingInvoice.poId?.rfqId?.quantity || 1} {viewingInvoice.poId?.rfqId?.unit || 'pcs'}</div>
                  <div className="text-right">${viewingInvoice.subtotal?.toFixed(2)}</div>
                </div>
              </div>

              {/* Summary Calculations (with CGST, SGST) */}
              <div className="flex justify-between items-end border-t border-slate-800 pt-4">
                <div className="text-[10px] text-slate-500">
                  <div>Reference PO #: {viewingInvoice.poId?.poNumber}</div>
                  <div className="mt-1">Generated At: {viewingInvoice.generatedAt ? new Date(viewingInvoice.generatedAt).toLocaleString() : 'N/A'}</div>
                </div>
                
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold">${viewingInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CGST (9.0%):</span>
                    <span>${(viewingInvoice.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SGST (9.0%):</span>
                    <span>${(viewingInvoice.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm border-t border-slate-900 pt-2">
                    <span>Grand Total:</span>
                    <span>${viewingInvoice.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Options (Procurement/Admin only) */}
              {canManage && viewingInvoice.status !== 'Paid' && viewingInvoice.status !== 'Cancelled' && (
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Mark Invoice status:</span>
                  <div className="flex gap-2">
                    {viewingInvoice.status === 'Draft' && (
                      <button
                        onClick={() => handleStatusChange(viewingInvoice._id, 'Sent')}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Mark Sent
                      </button>
                    )}
                    {viewingInvoice.status === 'Sent' && (
                      <button
                        onClick={() => handleStatusChange(viewingInvoice._id, 'Paid')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(viewingInvoice._id, 'Cancelled')}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Void / Cancel
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
