import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="page-shell flex items-center justify-center px-4 py-8 sm:py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Sign in</h1>
        <p className="mb-6 text-sm text-slate-500">Access your cart, checkout, and order history.</p>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <input className="mb-4 w-full rounded-lg border px-4 py-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="mb-4 w-full rounded-lg border px-4 py-3" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full rounded-full bg-[#ffd814] py-3 font-semibold">Login</button>
        <p className="mt-4 text-sm">New here? <Link className="text-blue-600" to="/signup">Create account</Link></p>
      </form>
    </div>
  )
}
