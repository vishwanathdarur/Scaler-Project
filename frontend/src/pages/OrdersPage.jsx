import { useEffect, useState } from 'react'
import api from '../services/api'
import { formatPrice, getProductImage, handleProductImageError } from '../utils/cart'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-shell mx-auto max-w-[1200px] px-3 py-6 sm:px-4">
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-6">
        <h1 className="text-2xl font-normal sm:text-3xl">Your Orders</h1>
        <p className="mt-2 text-sm text-slate-600">Track, review, and revisit everything you’ve ordered.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_14px_rgba(15,17,17,0.08)]">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
          <h2 className="text-2xl font-bold">No orders yet</h2>
          <p className="mt-2 text-slate-600">Once you place an order, it will show up here just like Amazon’s order history.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-2xl border border-[#d5d9d9] bg-white shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
              <div className="grid gap-4 bg-[#f0f2f2] px-4 py-4 text-sm sm:px-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Ordered on</div>
                  <div className="mt-1 font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Ship to</div>
                  <div className="mt-1 line-clamp-2 font-medium">{order.shipping_address}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
                  <div className="mt-1 font-medium">{formatPrice(order.total_amount)}</div>
                </div>
                <div className="md:text-right">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Order #</div>
                  <div className="mt-1 font-medium">{order.user_order_number}</div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-[#067d62]">Delivered</div>
                    <div className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-slate-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="grid gap-4 border-t border-[#e7e7e7] pt-4 md:grid-cols-[88px_1fr_auto]">
                      <div className="flex h-24 items-center justify-center rounded-xl bg-[#f7f7f7] p-3">
                        <img src={getProductImage(item.product)} alt={item.product.name} onError={(event) => handleProductImageError(event, item.product.name)} className="max-h-full w-full object-contain" />
                      </div>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.product.brand} • Qty: {item.quantity}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.product.category?.name}</div>
                      </div>
                      <div className="text-left font-semibold md:text-right">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
