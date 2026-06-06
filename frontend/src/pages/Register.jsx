import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('Vendor')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function validEmail(e) {
    const re = /^\S+@\S+\.\S+$/
    return re.test(e)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name || !email || !password || !confirm) return setError('All fields are required')
    if (!validEmail(email)) return setError('Invalid email address')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await register({ name, email, password, role })
      setSuccess(res?.message || 'Registered successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        
        {/* Title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg mx-auto mb-4 text-xl">
            V
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create Account</h1>
          <p className="text-xs text-slate-400 mt-2">Join VendorBridge ERP Procurement Network</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs text-center animate-pulse">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. johndoe@company.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              System Role / Profile
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 focus:outline-none"
            >
              <option value="Vendor">Vendor</option>
              <option value="ProcurementOfficer">Procurement Officer</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                placeholder="Confirm password"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/10"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-xs text-center text-slate-400 pt-2 border-t border-slate-900">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
