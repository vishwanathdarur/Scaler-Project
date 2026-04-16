import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import SuccessPage from './pages/SuccessPage'
import OrdersPage from './pages/OrdersPage'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  const [homeFiltersOpen, setHomeFiltersOpen] = useState(false)

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar onToggleHomeFilters={() => setHomeFiltersOpen((current) => !current)} />
      <Routes>
        <Route path="/" element={<HomePage filtersOpen={homeFiltersOpen} setFiltersOpen={setHomeFiltersOpen} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/order-success/:orderId" element={<PrivateRoute><SuccessPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      </Routes>
      <footer className="mt-10">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#37475a] px-4 py-4 text-sm font-medium text-white transition hover:bg-[#485769]"
        >
          Back to top
        </button>

        <div className="bg-[#232f3e] px-4 py-10 text-white sm:px-6">
          <div className="mx-auto grid max-w-[1200px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold">Get to Know Us</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>About Amazon Clone</div>
                <div>Careers</div>
                <div>Press Releases</div>
                <div>Amazon Science</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold">Connect with Us</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>Facebook</div>
                <div>Twitter</div>
                <div>Instagram</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold">Make Money with Us</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>Sell on Amazon</div>
                <div>Become an Affiliate</div>
                <div>Advertise Your Products</div>
                <div>Amazon Pay on Merchants</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold">Let Us Help You</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>Your Account</div>
                <div>Returns Centre</div>
                <div>100% Purchase Protection</div>
                <div>Help</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#232f3e] px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-4 text-slate-300 md:flex-row md:gap-6">
            <div className="text-4xl font-bold tracking-tight text-white">
              amazon<span className="text-[#f3a847]">.in</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="rounded border border-slate-500 px-4 py-2">English</div>
              <div className="rounded border border-slate-500 px-4 py-2">India</div>
            </div>
          </div>
        </div>

        <div className="bg-[#131a22] px-4 py-6 text-center text-xs leading-6 text-slate-400 sm:px-6">
          <div className="mx-auto max-w-[1200px]">
            Conditions of Use & Sale • Privacy Notice • Interest-Based Ads
          </div>
          <div className="mt-2">Built for your Amazon-style full stack project. Search, cart, checkout, and order history are all wired together.</div>
        </div>
      </footer>
    </BrowserRouter>
  )
}
