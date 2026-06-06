import axios from 'axios'

const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const instance = axios.create({
  baseURL: base,
  headers: { 'Content-Type': 'application/json' }
})

// attach token
instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default instance
