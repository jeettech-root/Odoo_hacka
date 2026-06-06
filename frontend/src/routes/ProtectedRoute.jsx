import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { getRoleFromToken } from '../api/auth'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  const role = getRoleFromToken()
  const location = useLocation()

  // map path prefixes to allowed roles
  const accessMap = [
    { prefix: '/users', roles: ['Admin'] },
    { prefix: '/vendors', roles: ['Admin','ProcurementOfficer'] },
    { prefix: '/rfqs', roles: ['Admin','ProcurementOfficer','Vendor'] },
    { prefix: '/quotations', roles: ['Admin','ProcurementOfficer','Vendor'] },
    { prefix: '/approvals', roles: ['Admin','Manager','ProcurementOfficer'] },
    { prefix: '/purchase-orders', roles: ['Admin','ProcurementOfficer','Manager','Vendor'] },
    { prefix: '/invoices', roles: ['Admin','ProcurementOfficer','Manager','Vendor'] }
  ]

  const path = location.pathname
  const rule = accessMap.find(r => path === r.prefix || path.startsWith(r.prefix + '/'))
  if (rule && (!role || !rule.roles.includes(role))) {
    // unauthorized for this path
    return <Navigate to="/" replace />
  }

  return <Layout>{children}</Layout>
}
