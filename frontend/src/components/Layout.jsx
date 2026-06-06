import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { logout, getRoleFromToken, getUserFromStorage } from '../api/auth'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = getRoleFromToken()
  const user = getUserFromStorage() || { name: 'ERP User', email: '' }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Symmetric SVG Icons for Sidebar
  const icons = {
    dashboard: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
    vendors: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
    rfqs: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    ),
    quotations: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    approvals: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    pos: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    ),
    invoices: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
    )
  }

  const menusByRole = {
    Vendor: [
      { to: '/', label: 'Dashboard', icon: icons.dashboard },
      { to: '/rfqs', label: 'My RFQs', icon: icons.rfqs },
      { to: '/quotations', label: 'My Quotations', icon: icons.quotations },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: icons.pos },
      { to: '/invoices', label: 'Invoices', icon: icons.invoices }
    ],
    Manager: [
      { to: '/', label: 'Dashboard', icon: icons.dashboard },
      { to: '/approvals', label: 'Approvals', icon: icons.approvals },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: icons.pos },
      { to: '/invoices', label: 'Invoices', icon: icons.invoices }
    ],
    ProcurementOfficer: [
      { to: '/', label: 'Dashboard', icon: icons.dashboard },
      { to: '/vendors', label: 'Vendors', icon: icons.vendors },
      { to: '/rfqs', label: 'RFQs', icon: icons.rfqs },
      { to: '/quotations', label: 'Quotations', icon: icons.quotations },
      { to: '/approvals', label: 'Approvals', icon: icons.approvals },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: icons.pos },
      { to: '/invoices', label: 'Invoices', icon: icons.invoices }
    ],
    Admin: [
      { to: '/', label: 'Dashboard', icon: icons.dashboard },
      { to: '/vendors', label: 'Vendors', icon: icons.vendors },
      { to: '/rfqs', label: 'RFQs', icon: icons.rfqs },
      { to: '/quotations', label: 'Quotations', icon: icons.quotations },
      { to: '/approvals', label: 'Approvals', icon: icons.approvals },
      { to: '/purchase-orders', label: 'Purchase Orders', icon: icons.pos },
      { to: '/invoices', label: 'Invoices', icon: icons.invoices }
    ]
  }

  const menu = menusByRole[role] || [{ to: '/', label: 'Dashboard', icon: icons.dashboard }]

  // Role Badge Styling
  const badgeClasses = {
    Admin: 'bg-emerald-950 text-emerald-300 border-emerald-500/20',
    ProcurementOfficer: 'bg-blue-950 text-blue-300 border-blue-500/20',
    Manager: 'bg-amber-950 text-amber-300 border-amber-500/20',
    Vendor: 'bg-purple-950 text-purple-300 border-purple-500/20'
  }
  const badgeClass = badgeClasses[role] || 'bg-slate-800 text-slate-300'

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-5">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
              V
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VendorBridge
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {menu.map(m => {
              const active = location.pathname === m.to
              return (
                <Link
                  key={m.to}
                  to={m.to}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Profile and Logout Card */}
        <div className="p-4 border-t border-slate-900 bg-slate-950">
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-slate-300 text-xs">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                {role || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors duration-150"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {location.pathname === '/' ? 'Dashboard Overview' : location.pathname.substring(1).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </h1>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>System Active</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/60">
          {children}
        </main>
      </div>
    </div>
  )
}
