import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { emitCartUpdated, formatPrice, getProductImage, handleProductImageError } from '../utils/cart'

export default function CheckoutPage() {
  const [cart, setCart] = useState([])
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  })
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0 })
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/cart')
      setCart(res.data)
      const subtotal = res.data.reduce((a, i) => a + Number(i.product.price) * i.quantity, 0)
      const shipping = res.data.length === 0 || subtotal === 0 ? 0 : subtotal > 999 ? 0 : 49
      setSummary({ subtotal, shipping, total: subtotal + shipping })
    }
    load()
  }, [])

  const address = [
    shippingForm.fullName,
    shippingForm.street,
    shippingForm.landmark ? `Landmark: ${shippingForm.landmark}` : '',
    `${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`,
    `Phone: ${shippingForm.phone}`
  ]
    .filter(Boolean)
    .join(', ')

  const isAddressValid = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'].every((field) => shippingForm[field].trim())

  const placeOrder = async () => {
    if (!isAddressValid || cart.length === 0 || placingOrder) {
      return
    }

    try {
      setPlacingOrder(true)
      setError('')
      const res = await api.post('/orders', { shipping_address: address })
      emitCartUpdated({ count: 0 })
      navigate(`/order-success/${res.data.order_id}`, {
        state: {
          orderNumber: res.data.order_id,
          shippingAddress: address,
          summary,
          itemCount: cart.reduce((count, item) => count + item.quantity, 0)
        }
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not place your order right now.')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="page-shell mx-auto grid max-w-[1500px] gap-6 px-3 py-6 sm:px-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e7e7] pb-4">
            <div>
              <h1 className="text-2xl font-normal sm:text-3xl">Checkout</h1>
              <p className="mt-1 text-sm text-slate-600">Review your shipping details and order before placing it.</p>
            </div>
            <Link to="/cart" className="text-sm text-[#007185]">Back to Cart</Link>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold sm:text-xl">1. Shipping address</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input value={shippingForm.fullName} onChange={(e) => setShippingForm((current) => ({ ...current, fullName: e.target.value }))} placeholder="Full name" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
              <input value={shippingForm.phone} onChange={(e) => setShippingForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Mobile number" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
              <textarea value={shippingForm.street} onChange={(e) => setShippingForm((current) => ({ ...current, street: e.target.value }))} placeholder="Flat, house no., building, company, area, street" className="min-h-28 rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847] md:col-span-2" />
              <input value={shippingForm.city} onChange={(e) => setShippingForm((current) => ({ ...current, city: e.target.value }))} placeholder="Town/City" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
              <input value={shippingForm.state} onChange={(e) => setShippingForm((current) => ({ ...current, state: e.target.value }))} placeholder="State" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
              <input value={shippingForm.pincode} onChange={(e) => setShippingForm((current) => ({ ...current, pincode: e.target.value }))} placeholder="Pincode" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
              <input value={shippingForm.landmark} onChange={(e) => setShippingForm((current) => ({ ...current, landmark: e.target.value }))} placeholder="Landmark (optional)" className="rounded-lg border border-[#d5d9d9] px-4 py-3 outline-none focus:border-[#f3a847]" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
          <h2 className="text-lg font-bold sm:text-xl">2. Review items and delivery</h2>
          <div className="mt-4 space-y-5">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                Your cart is empty. Add items before checkout.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="grid gap-4 border-b border-[#e7e7e7] pb-5 md:grid-cols-[120px_1fr]">
                  <div className="flex h-28 items-center justify-center rounded-xl bg-[#f7f7f7] p-3">
                    <img src={getProductImage(item.product)} alt={item.product.name} onError={(event) => handleProductImageError(event, item.product.name)} className="max-h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <div className="text-base font-medium sm:text-lg">{item.product.name}</div>
                      <div className="mt-1 text-sm text-[#067d62]">In stock</div>
                      <div className="mt-1 text-sm text-slate-600">Quantity: {item.quantity}</div>
                      <div className="mt-1 text-sm text-slate-600">Delivery: Tomorrow</div>
                    </div>
                    <div className="text-left text-base font-semibold sm:text-lg md:text-right">{formatPrice(Number(item.product.price) * item.quantity)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-fit rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
          <button
            disabled={!isAddressValid || cart.length === 0 || placingOrder}
            onClick={placeOrder}
            className="w-full rounded-full bg-[#ffd814] py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? 'Placing your order...' : 'Place your order'}
          </button>
          <p className="mt-3 text-xs text-slate-500">By placing your order, you agree to Amazon Clone&apos;s privacy notice and conditions of use.</p>

          <div className="mt-5 border-t border-[#e7e7e7] pt-4">
            <h2 className="text-lg font-bold sm:text-xl">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Items</span><span>{formatPrice(summary.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}</span></div>
              <div className="flex justify-between border-t border-[#e7e7e7] pt-3 text-base font-bold text-[#b12704] sm:text-lg"><span>Order total</span><span>{formatPrice(summary.total)}</span></div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#e7e7e7] pt-4">
            <h3 className="font-bold">Deliver to</h3>
            <p className="mt-2 text-sm text-slate-600">{address || 'Enter your shipping details to preview the delivery address.'}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
