import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { emitCartUpdated, formatPrice, getProductImage, handleProductImageError } from '../utils/cart'

const SAVED_ITEMS_KEY = 'amazon_clone_saved_items'

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0 })
  const [notice, setNotice] = useState('')
  const [savedItems, setSavedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || '[]')
    } catch {
      return []
    }
  })
  const navigate = useNavigate()

  const load = async () => {
    const res = await api.get('/cart')
    setCart(res.data)

    const quantityCount = res.data.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = res.data.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
    const shipping = res.data.length === 0 || subtotal === 0 ? 0 : subtotal > 999 ? 0 : 49

    setSummary({ subtotal, shipping, total: subtotal + shipping })
    emitCartUpdated({ count: quantityCount })
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItems))
  }, [savedItems])

  const update = async (id, quantity) => {
    if (quantity <= 0) {
      await remove(id)
      return
    }

    try {
      await api.put(`/cart/${id}`, { quantity })
      setNotice('Cart updated')
      load()
    } catch (err) {
      setNotice(err.response?.data?.detail || 'Could not update cart quantity.')
    }
  }

  const remove = async (id) => {
    await api.delete(`/cart/${id}`)
    setNotice('Item removed from cart')
    load()
  }

  const saveForLater = async (item) => {
    setSavedItems((current) => {
      if (current.some((saved) => saved.product.id === item.product.id)) {
        return current
      }
      return [...current, item]
    })
    await api.delete(`/cart/${item.id}`)
    setNotice(`${item.product.name} moved to Saved for later`)
    load()
  }

  const moveToCart = async (item) => {
    try {
      await api.post('/cart/add', { product_id: item.product.id, quantity: 1 })
      setSavedItems((current) => current.filter((saved) => saved.product.id !== item.product.id))
      setNotice(`${item.product.name} moved to cart`)
      load()
    } catch (err) {
      setNotice(err.response?.data?.detail || 'Could not move saved item to cart.')
    }
  }

  const quantityCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const amountLeftForFreeDelivery = Math.max(0, 999 - summary.subtotal)

  return (
    <div className="page-shell mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {notice && (
          <div className="rounded-xl border border-[#cce3de] bg-[#f0faf8] px-4 py-3 text-sm text-[#067d62]">
            {notice}
          </div>
        )}

        <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
          <h1 className="text-2xl font-normal sm:text-3xl">Shopping Cart</h1>
          <div className="mt-2 border-b border-[#e7e7e7] pb-4 text-sm text-slate-500">
            {cart.length === 0 ? 'No items selected' : `${quantityCount} item${quantityCount > 1 ? 's' : ''} ready for checkout`}
          </div>

          {cart.length === 0 ? (
            <p className="py-10 text-slate-600">
              Your Amazon cart is empty. <Link className="text-[#007185]" to="/">Shop today’s deals</Link>
            </p>
          ) : (
            <>
              <div className="py-4 text-sm text-[#067d62]">
                {amountLeftForFreeDelivery === 0 ? 'Your order qualifies for FREE Delivery.' : `Add ${formatPrice(amountLeftForFreeDelivery)} more to qualify for FREE Delivery.`}
              </div>

              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item.id} className="grid gap-4 border-b border-[#e7e7e7] pb-5 md:grid-cols-[180px_1fr]">
                    <div className="flex h-32 items-center justify-center rounded-xl bg-[#f7f7f7] p-4 sm:h-40">
                      <img src={getProductImage(item.product)} alt={item.product.name} onError={(event) => handleProductImageError(event, item.product.name)} className="max-h-full w-full object-contain" />
                    </div>

                    <div>
                      <div className="flex flex-col justify-between gap-3 md:flex-row">
                        <div>
                          <Link to={`/product/${item.product.id}`} className="text-base hover:text-[#c7511f] sm:text-lg">{item.product.name}</Link>
                          <div className="mt-1 text-sm text-[#067d62]">{item.product.stock > 0 ? 'In stock' : 'Out of stock'}</div>
                          <div className="mt-1 text-sm text-slate-600">Sold by {item.product.brand}</div>
                          <div className="mt-1 text-sm text-slate-600">Eligible for FREE Shipping</div>
                        </div>
                        <div className="text-left text-lg font-semibold md:text-right md:text-xl">{formatPrice(item.product.price)}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center overflow-hidden rounded-full border border-[#d5d9d9]">
                          <button className="px-3 py-1.5 hover:bg-slate-100" onClick={() => update(item.id, item.quantity - 1)}>-</button>
                          <span className="px-3 py-1.5">{item.quantity}</span>
                          <button className="px-3 py-1.5 hover:bg-slate-100" onClick={() => update(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <button className="text-[#007185]" onClick={() => remove(item.id)}>Delete</button>
                        <button className="text-[#007185]" onClick={() => saveForLater(item)}>Save for later</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-5 text-left text-lg sm:text-xl md:text-right">
                Subtotal ({quantityCount} items): <span className="font-bold">{formatPrice(summary.subtotal)}</span>
              </div>
            </>
          )}
        </div>

        {savedItems.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
            <h2 className="text-xl font-bold sm:text-2xl">Saved for later</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {savedItems.map((item) => (
                <div key={item.product.id} className="rounded-xl border border-[#e7e7e7] p-4">
                  <div className="flex gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#f7f7f7] p-3">
                      <img src={getProductImage(item.product)} alt={item.product.name} onError={(event) => handleProductImageError(event, item.product.name)} className="max-h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.product.id}`} className="max-h-12 overflow-hidden font-semibold hover:text-[#c7511f]">{item.product.name}</Link>
                      <div className="mt-2 text-lg font-semibold">{formatPrice(item.product.price)}</div>
                      <button onClick={() => moveToCart(item)} className="mt-3 rounded-full bg-[#ffd814] px-4 py-2 text-sm font-medium hover:bg-[#f7ca00]">
                        Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-fit rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
        <div className="text-sm text-[#067d62]">
          {summary.shipping === 0 && summary.subtotal > 0 ? 'Part of your order qualifies for FREE Delivery.' : 'Standard shipping applied.'}
        </div>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">Subtotal ({quantityCount} items): {formatPrice(summary.subtotal)}</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><span>Items</span><span>{formatPrice(summary.subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}</span></div>
          <div className="flex justify-between border-t border-[#e7e7e7] pt-3 text-lg font-bold"><span>Order total</span><span>{formatPrice(summary.total)}</span></div>
        </div>
        <button
          disabled={cart.length === 0}
          onClick={() => navigate('/checkout')}
          className="mt-5 w-full rounded-full bg-[#ffd814] py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          Proceed to checkout
        </button>
        <button onClick={() => navigate('/')} className="mt-3 w-full rounded-full border border-[#d5d9d9] py-3 text-sm font-medium">
          Continue shopping
        </button>
      </div>
    </div>
  )
}
