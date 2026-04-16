import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()
const DEMO_LOGIN_DISABLED_KEY = 'demo_login_disabled'
const DEMO_USER = {
  email: 'charlie@amazonclone.dev',
  password: 'charlie123'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const loginWithDemoUser = async () => {
    if (sessionStorage.getItem(DEMO_LOGIN_DISABLED_KEY) === 'true') {
      setLoading(false)
      return
    }

    try {
      const res = await api.post('/auth/login', DEMO_USER)
      localStorage.setItem('token', res.data.access_token)
      await fetchMe()
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchMe()
      return
    }
    loginWithDemoUser()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.access_token)
    sessionStorage.removeItem(DEMO_LOGIN_DISABLED_KEY)
    await fetchMe()
  }

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password })
    localStorage.setItem('token', res.data.access_token)
    sessionStorage.removeItem(DEMO_LOGIN_DISABLED_KEY)
    await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.setItem(DEMO_LOGIN_DISABLED_KEY, 'true')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
