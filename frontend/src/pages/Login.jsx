import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data && data.token) {
        navigate('/')
      } else {
        setError('Invalid login response')
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        
        {/* Logo and title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-4 text-xl">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">VendorBridge ERP</h1>
          <p className="text-xs text-slate-400 mt-2">Sign in to manage procurement operations</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. procurement@vendorbridge.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-xs text-center text-slate-400 pt-2 border-t border-slate-900">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  )
}
