import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CART_UPDATED_EVENT } from '../utils/cart'

const NAV_CATEGORIES = [
  { label: 'All', to: '/' },
  { label: 'Electronics', to: '/?category_id=1', id: '1' },
  { label: 'Fashion', to: '/?category_id=2', id: '2' },
  { label: 'Home & Kitchen', to: '/?category_id=3', id: '3' },
  { label: 'Books', to: '/?category_id=4', id: '4' },
  { label: 'Sports', to: '/?category_id=5', id: '5' },
]

export default function Navbar({ onToggleHomeFilters }) {
  const { user, logout } = useAuth()
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const activeCategoryId = new URLSearchParams(location.search).get('category_id') || ''

  useEffect(() => {
    setQ(new URLSearchParams(location.search).get('search') || '')
  }, [location.search])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (q.trim().length < 2) {
        setSuggestions([])
        return
      }

      try {
        const res = await api.get('/search/suggest', { params: { q } })
        setSuggestions(res.data.suggestions || [])
      } catch {
        setSuggestions([])
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    setSuggestions([])
  }, [location.pathname])

  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    const loadCartCount = async () => {
      try {
        const res = await api.get('/cart')
        const count = res.data.reduce((total, item) => total + item.quantity, 0)
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    }

    loadCartCount()

    const handleCartUpdated = (event) => {
      if (typeof event.detail?.count === 'number') {
        setCartCount(event.detail.count)
        return
      }
      loadCartCount()
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [user, location.pathname])

  const submit = (value) => {
    const nextValue = (value || q).trim()
    navigate(nextValue ? `/?search=${encodeURIComponent(nextValue)}` : '/')
    setSuggestions([])
  }

  const cartIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current stroke-[1.8]">
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l2.1 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.7L20 8H7.2" />
    </svg>
  )

  const amazonLogo = (
    <div className="relative inline-flex items-end leading-none text-white">
      <span className="text-[2.2rem] font-bold tracking-[-0.06em]">amazon</span>
      <span className="mb-[0.22rem] ml-0.5 text-[1.05rem] font-medium tracking-[-0.02em]">.in</span>
      <svg
        viewBox="0 0 92 24"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 left-2 h-4 w-[74px] text-[#f3a847]"
      >
        <path
          d="M4 8c14 12 44 14 70 1"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M67 4l9 3-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 shadow-[0_2px_8px_rgba(15,17,17,0.22)]">
      <div className="bg-[#131921] text-white">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 md:gap-3 md:px-4 lg:grid-cols-[auto_auto_1fr_auto]">
          <Link to="/" className="rounded border border-transparent px-1 py-2 hover:border-white/70 md:px-2">
            {amazonLogo}
          </Link>

          <div className="hidden rounded border border-transparent px-2 py-1 text-xs leading-tight text-slate-200 lg:block hover:border-white/70">
            <div>Delivering across India</div>
            <div className="font-bold text-white">Select your location</div>
          </div>

          <div className="relative col-span-3 order-3 md:col-span-1 md:order-none">
            <div className="flex overflow-hidden rounded-md ring-2 ring-transparent focus-within:ring-[#f3a847]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Search Amazon.in"
                className="w-full min-w-0 border-0 px-3 py-2.5 text-sm text-black outline-none md:px-4"
              />
              <button onClick={() => submit()} className="bg-[#febd69] px-4 text-sm font-medium text-black transition hover:bg-[#f3a847] md:px-5">
                Search
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-md border border-slate-200 bg-white text-black shadow-xl">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1 text-xs sm:text-sm md:gap-2">
            {user ? (
              <>
                <div className="hidden rounded border border-transparent px-2 py-1 leading-tight md:block hover:border-white/70">
                  <div className="text-xs text-slate-200">Hello, {user.name}</div>
                  <div className="font-bold">Account & Lists</div>
                </div>
                <Link to="/orders" className="rounded border border-transparent px-1.5 py-1 leading-tight hover:border-white/70 md:px-2">
                  <div className="text-xs text-slate-200">Returns</div>
                  <div className="font-bold">& Orders</div>
                </Link>
                <Link to="/cart" className="relative rounded border border-transparent px-1.5 py-1 hover:border-white/70 md:px-2">
                  <span className="absolute left-5 top-0 text-sm font-bold text-[#f3a847] md:left-6">{cartCount}</span>
                  <div className="flex items-end gap-1 pt-1">
                    <span className="text-white">{cartIcon}</span>
                    <span className="font-bold">Cart</span>
                  </div>
                </Link>
                <button onClick={logout} className="rounded border border-transparent px-1.5 py-1 text-slate-200 hover:border-white/70 hover:text-white md:px-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded border border-transparent px-1.5 py-1 leading-tight hover:border-white/70 md:px-2">
                  <div className="text-xs text-slate-200">Hello, sign in</div>
                  <div className="font-bold">Account</div>
                </Link>
                <Link to="/signup" className="rounded border border-transparent px-1.5 py-1 font-bold hover:border-white/70 md:px-2">
                  Start here
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#232f3e] text-sm text-white">
        <div className="flex items-center px-3 py-2.5 lg:hidden">
          {isHomePage && (
            <button
              onClick={onToggleHomeFilters}
              aria-label="Open filters"
              className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/35 hover:bg-white/12"
            >
              <span className="text-lg leading-none">☰</span>
            </button>
          )}
        </div>

        <div className="amazon-scrollbar hidden w-full items-center gap-4 overflow-x-auto px-4 py-2.5 lg:flex xl:gap-6">
          {isHomePage && (
            <button
              onClick={onToggleHomeFilters}
              aria-label="Open filters"
              className="flex items-center justify-center rounded border border-transparent px-2 py-0.5 hover:border-white/70"
            >
              <span className="text-lg leading-none">☰</span>
            </button>
          )}
          {NAV_CATEGORIES.map((category) => {
            const isActive = category.id ? category.id === activeCategoryId : !activeCategoryId
            return (
              <Link
                key={category.label}
                to={category.to}
                className={`whitespace-nowrap rounded border px-2 py-0.5 transition ${
                  isActive ? 'border-white/70 font-semibold' : 'border-transparent hover:border-white/70'
                }`}
              >
                {category.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
