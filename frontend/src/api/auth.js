import api from './axios'

export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password })
  if (res.data && res.data.token) {
    localStorage.setItem('token', res.data.token)
    if (res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
  }
  return res.data
}

export async function register(payload) {
  const res = await api.post('/api/auth/register', payload)
  return res.data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getToken() { return localStorage.getItem('token') }

export function getRoleFromToken() {
  const t = getToken()
  if (!t) return null
  try {
    const p = t.split('.')
    if (p.length < 2) return null
    const payload = JSON.parse(atob(p[1].replace(/-/g,'+').replace(/_/g,'/')))
    return payload.role || null
  } catch (err) {
    return null
  }
}

export function getUserFromStorage() {
  try {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  } catch (e) {
    return null
  }
}
