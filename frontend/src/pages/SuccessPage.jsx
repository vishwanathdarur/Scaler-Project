import { Link, useLocation, useParams } from 'react-router-dom'
import { formatPrice } from '../utils/cart'

export default function SuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const orderData = location.state

  return (
    <div className="page-shell mx-auto max-w-[1000px] px-4 py-8 sm:py-10">
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7e7e7] pb-6">
          <div>
            <div className="mb-3 text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-[#067d62] sm:text-3xl">Order placed, thanks!</h1>
            <p className="mt-2 text-slate-600">
              {orderData?.email?.sent
                ? `Confirmation email sent to ${orderData.email.recipient}.`
                : 'Order placed successfully. Email delivery is best-effort in this demo.'}
            </p>
          </div>
          <div className="w-full rounded-2xl bg-[#f7f7f7] px-5 py-4 sm:w-auto">
            <div className="text-sm text-slate-500">Order ID</div>
            <div className="text-2xl font-bold">#{orderData?.orderNumber || orderId}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#d5d9d9] p-5">
            <h2 className="text-lg font-bold sm:text-xl">Delivery details</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {orderData?.shippingAddress || 'Your shipping address was saved with the order.'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d5d9d9] p-5">
            <h2 className="text-lg font-bold sm:text-xl">Payment summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Items</span><span>{orderData?.itemCount || 0}</span></div>
              <div className="flex justify-between"><span>Order total</span><span className="font-semibold">{formatPrice(orderData?.summary?.total || 0)}</span></div>
            </div>
          </div>
        </div>

        {orderData?.email && (
          <div className="mt-6 rounded-2xl border border-[#d5d9d9] bg-[#f7f7f7] p-5 text-sm text-slate-700">
            <div><span className="font-semibold">Email status:</span> {orderData.email.reason}</div>
            <div className="mt-1"><span className="font-semibold">Recipient:</span> {orderData.email.recipient || 'No recipient resolved'}</div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/orders" className="rounded-full bg-[#ffd814] px-5 py-3 text-center font-semibold">View Your Orders</Link>
          <Link to="/" className="rounded-full border border-[#d5d9d9] px-5 py-3 text-center font-semibold">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
