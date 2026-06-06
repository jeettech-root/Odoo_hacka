import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { getRoleFromToken } from '../api/auth'

export default function Dashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    rfqs: 0,
    approvals: 0,
    pos: 0,
    invoices: 0,
    charts: {
      monthlyProcurement: [],
      vendorPerformance: [],
      spendingSummary: []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const role = getRoleFromToken()

  async function loadDashboardStats() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/dashboard/stats')
      setStats(res.data || stats)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load dashboard statistics')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardStats()
  }, [role])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Assembling ERP insights...</p>
      </div>
    )
  }

  // Calculate values for Donut Chart
  const categoriesData = stats.charts?.spendingSummary || []
  const totalCategorySpend = categoriesData.reduce((sum, c) => sum + c.value, 0)
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

  let accumulatedPercent = 0

  return (
    <div className="space-y-8 animate-fadeIn">
      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Vendors', val: stats.vendors, icon: (
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          ), bg: 'from-indigo-600/10 to-indigo-900/5' },
          { label: 'Active RFQs', val: stats.rfqs, icon: (
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          ), bg: 'from-blue-600/10 to-blue-900/5' },
          { label: 'Pending Approvals', val: stats.approvals, icon: (
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622"/>
            </svg>
          ), bg: 'from-amber-600/10 to-amber-900/5' },
          { label: 'Purchase Orders', val: stats.pos, icon: (
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
            </svg>
          ), bg: 'from-emerald-600/10 to-emerald-900/5' },
          { label: 'Invoices Generated', val: stats.invoices, icon: (
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01"/>
            </svg>
          ), bg: 'from-pink-600/10 to-pink-900/5' }
        ].map((card, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${card.bg} border border-slate-800 p-6 rounded-2xl shadow-xl hover:scale-105 hover:border-slate-700 transition-all duration-300 flex items-center justify-between`}>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
              <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{card.val}</h2>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* SVG Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Procurement Spend (Custom SVG Bar Chart) */}
        <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Monthly Procurement</h3>
            <p className="text-xs text-slate-400 mb-6">Total procurement spend ($) aggregated over the last 6 months</p>
          </div>
          
          <div className="w-full flex items-center justify-center">
            {stats.charts?.monthlyProcurement?.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No spend recorded.</div>
            ) : (
              <svg className="w-full max-w-xl h-64 overflow-visible" viewBox="0 0 500 240">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3"/>
                <line x1="40" y1="80" x2="480" y2="80" stroke="#1e293b" strokeDasharray="3 3"/>
                <line x1="40" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="3 3"/>
                <line x1="40" y1="200" x2="480" y2="200" stroke="#334155" />

                {(() => {
                  const data = stats.charts.monthlyProcurement
                  const maxAmt = Math.max(...data.map(d => d.amount), 500)
                  return data.map((item, index) => {
                    const barHeight = (item.amount / maxAmt) * 160
                    const barWidth = 32
                    const gap = (440 - barWidth * data.length) / (data.length - 1)
                    const x = 50 + index * (barWidth + gap)
                    const y = 200 - barHeight
                    return (
                      <g key={index} className="group cursor-pointer">
                        {/* Hover Tooltip/Value Label */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fill="#a5b4fc"
                          fontSize="10"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold"
                        >
                          ${item.amount.toLocaleString()}
                        </text>
                        {/* Rounded Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={5}
                          fill="url(#barGradient)"
                          className="hover:fill-indigo-400 hover:opacity-90 transition-all duration-300"
                        />
                        {/* Label x-axis */}
                        <text
                          x={x + barWidth / 2}
                          y={220}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="11"
                          fontWeight="600"
                        >
                          {item.name}
                        </text>
                      </g>
                    )
                  })
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Spending Category Summary (Donut Chart) */}
        <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Spending Summary</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution of spending across vendor categories</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            {categoriesData.length === 0 ? (
              <div className="text-slate-500 text-sm mb-4">No categories recorded.</div>
            ) : (
              <div className="flex items-center space-x-6 w-full px-2">
                <svg className="w-32 h-32 flex-shrink-0" viewBox="0 0 100 100">
                  {categoriesData.map((c, i) => {
                    const percent = totalCategorySpend > 0 ? c.value / totalCategorySpend : 0
                    const strokeDash = percent * 314.16
                    const strokeOffset = 314.16 - strokeDash + (accumulatedPercent * 314.16)
                    accumulatedPercent -= percent
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="30"
                        fill="transparent"
                        stroke={colors[i % colors.length]}
                        strokeWidth="12"
                        strokeDasharray="188.49"
                        strokeDashoffset={188.49 - (percent * 188.49) + (accumulatedPercent * 188.49)}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500 hover:stroke-white cursor-pointer"
                      />
                    )
                  })}
                  <circle cx="50" cy="50" r="23" fill="#020617" />
                </svg>
                
                {/* Legend details */}
                <div className="flex-1 space-y-2 text-xs">
                  {categoriesData.map((c, i) => {
                    const p = totalCategorySpend > 0 ? (c.value / totalCategorySpend * 100).toFixed(0) : 0
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full block flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></span>
                          <span className="text-slate-300 font-medium truncate capitalize">{c.name}</span>
                        </div>
                        <span className="text-slate-400 font-bold ml-2">{p}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Performance Gauge / Progress Cards */}
      <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-1">Top Vendor Performance</h3>
        <p className="text-xs text-slate-400 mb-6">Efficiency metrics computed from order completion values and prices</p>

        {stats.charts?.vendorPerformance?.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">No vendor transactions recorded.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.charts.vendorPerformance.map((v, i) => {
              const colorVal = v.score > 80 ? 'from-emerald-500 to-teal-600' : (v.score > 60 ? 'from-amber-400 to-orange-500' : 'from-red-500 to-rose-600')
              const textVal = v.score > 80 ? 'text-emerald-400' : (v.score > 60 ? 'text-amber-400' : 'text-red-400')
              return (
                <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm truncate max-w-[150px]">{v.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{v.poCount} Orders Issued</p>
                    </div>
                    <span className={`text-sm font-extrabold ${textVal}`}>{v.score}% Score</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Performance Gauge</span>
                      <span>Total Value: ${v.totalSpend.toLocaleString()}</span>
                    </div>
                    {/* Performance Progress bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full bg-gradient-to-r ${colorVal} rounded-full`} style={{ width: `${v.score}%` }}></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
