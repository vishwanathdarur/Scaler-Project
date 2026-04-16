import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  emitCartUpdated,
  formatPrice,
  getDeliveryText,
  getFallbackProductImage,
  getProductRating,
  getRatingCount,
  handleProductImageError
} from '../utils/cart'

const OFFER_CARDS = [
  { title: 'Cashback', body: 'Up to 5% cashback on eligible Amazon Pay and card payments.', link: '1 offer' },
  { title: 'Bank Offer', body: 'Instant discount on select cards and EMI transactions.', link: '3 offers' },
  { title: 'No Cost EMI', body: 'Split payments into easy monthly instalments on qualifying orders.', link: '2 offers' },
  { title: 'Partner Offer', body: 'Extra savings when you bundle with frequently bought items.', link: 'Shop deals' },
]

const BENEFITS = [
  ['10 days', 'Returnable'],
  ['Amazon', 'Delivered'],
  ['Free', 'Delivery'],
  ['Secure', 'Transaction'],
]

function getStarRow(rating) {
  const filled = Math.round(Number(rating))
  return `${'★'.repeat(filled)}${'☆'.repeat(Math.max(0, 5 - filled))}`
}

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [activeImg, setActiveImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/products/${id}`)
      setProduct(res.data)
      setActiveImg(0)
      const sim = await api.get(`/products/${id}/similar`)
      setSimilar(sim.data || [])
    }

    load()
  }, [id])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const addToCart = async (nextQuantity = quantity) => {
    try {
      await api.post('/cart/add', { product_id: product.id, quantity: nextQuantity })
      setNotice({ type: 'success', message: `${product.name} added to cart` })
      emitCartUpdated()
      return true
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.detail || 'Could not add this item to cart.' })
      return false
    }
  }

  const buyNow = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const didAdd = await addToCart(quantity)
    if (didAdd) {
      navigate('/checkout')
    }
  }

  if (!product) {
    return <div className="page-shell p-8">Loading...</div>
  }

  const images = product.images?.length ? product.images : [{ image_url: getFallbackProductImage(product.name) }]
  const rating = getProductRating(product)
  const ratingCount = getRatingCount(product)
  const decimalPrice = Number(product.price).toFixed(2)
  const [rupees, paise] = decimalPrice.split('.')
  const mrp = Number(product.price) * 1.18
  const savings = Math.max(0, mrp - Number(product.price))
  const discountPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0
  const isOutOfStock = product.stock <= 0
  const quantityOptions = Array.from({ length: Math.min(product.stock || 0, 10) }, (_, index) => index + 1)
  const breadcrumb = ['Home', product.category?.name || 'Category', product.brand, product.name].filter(Boolean)
  const detailRows = [
    ['Brand', product.brand],
    ['Category', product.category?.name || 'General'],
    ['Availability', product.stock > 0 ? `${product.stock} units in stock` : 'Currently unavailable'],
    ['Delivery', getDeliveryText(product)],
    ['Sold by', `${product.brand} Store`],
    ['Customer rating', `${rating} out of 5 stars`],
  ]

  return (
    <div className="page-shell w-full px-0 py-4">
      <div className="mb-4 overflow-x-auto px-4 text-sm text-[#565959] xl:px-6">
        <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
          {breadcrumb.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span className="text-slate-400">›</span>}
              <span className={index === breadcrumb.length - 1 ? 'text-[#0f1111]' : ''}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white px-4 xl:px-6">
        <div className="grid gap-6 xl:grid-cols-[96px_minmax(360px,620px)_minmax(320px,1fr)_300px]">
          <div className="order-2 xl:order-1">
            <div className="amazon-scrollbar flex gap-3 overflow-x-auto xl:flex-col xl:overflow-visible">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`shrink-0 rounded-md border bg-white p-1.5 transition ${
                    idx === activeImg ? 'border-[#e77600] shadow-[0_0_0_2px_rgba(231,118,0,0.18)]' : 'border-[#d5d9d9] hover:border-[#888c8c]'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${product.name} ${idx + 1}`}
                    onError={(event) => handleProductImageError(event, product.name)}
                    className="h-16 w-16 rounded object-cover sm:h-20 sm:w-20 xl:h-[72px] xl:w-[72px]"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="order-1 xl:order-2">
            <div className="rounded-lg border border-[#f0f2f2] bg-[#fcfcfc] p-4 sm:p-6">
              <div className="flex min-h-[340px] items-center justify-center sm:min-h-[460px]">
                <img
                  src={images[activeImg].image_url}
                  alt={product.name}
                  onError={(event) => handleProductImageError(event, product.name)}
                  className="max-h-[520px] w-full object-contain"
                />
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-[#007185]">Click image to explore more views</div>
          </div>

          <div className="order-3 min-w-0">
            <div className="border-b border-[#e7e7e7] pb-3">
              <div className="text-sm text-[#007185]">Visit the {product.brand} Store</div>
              <h1 className="mt-1 text-[28px] leading-[1.25] text-[#0f1111]">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-[#0f1111]">{rating}</span>
                <span className="tracking-[1px] text-[#de7921]">{getStarRow(rating)}</span>
                <span className="text-[#007185]">{ratingCount} ratings</span>
              </div>
            </div>

            <div className="border-b border-[#e7e7e7] py-4">
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-[32px] font-light text-[#cc0c39]">-{discountPercent}%</span>
                <div className="flex items-start text-[#0f1111]">
                  <span className="mr-1 mt-1 text-sm">₹</span>
                  <span className="text-[42px] leading-none">{rupees}</span>
                  <span className="ml-0.5 mt-1 text-sm">{paise}</span>
                </div>
              </div>
              <div className="mt-1 text-sm text-[#565959]">
                M.R.P.: <span className="line-through">{formatPrice(mrp)}</span>
              </div>
              <div className="mt-1 text-sm text-[#565959]">Inclusive of all taxes</div>
              <div className="mt-2 text-sm text-[#0f1111]">
                EMI starts at <span className="font-medium">{formatPrice(Number(product.price) / 6)}</span>. No Cost EMI available.
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-[#ffefc6] px-2 py-1 font-semibold text-[#0f1111]">Coupon</span>
                <span>Apply</span>
                <span className="font-semibold">{formatPrice(Math.max(50, Math.round(Number(product.price) * 0.05)))}</span>
                <span>coupon on checkout</span>
              </div>
            </div>

            <div className="border-b border-[#e7e7e7] py-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {OFFER_CARDS.map((offer) => (
                  <div key={offer.title} className="rounded-lg border border-[#d5d9d9] p-3 shadow-[0_1px_3px_rgba(15,17,17,0.06)]">
                    <div className="text-sm font-bold text-[#0f1111]">{offer.title}</div>
                    <div className="mt-2 text-sm leading-6 text-[#0f1111]">{offer.body}</div>
                    <div className="mt-2 text-sm text-[#007185]">{offer.link}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-[#e7e7e7] py-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BENEFITS.map(([top, bottom]) => (
                  <div key={bottom} className="rounded-lg border border-[#edf1f1] bg-[#fbfcfc] px-3 py-4 text-center">
                    <div className="text-sm font-semibold text-[#007185]">{top}</div>
                    <div className="mt-1 text-sm text-[#0f1111]">{bottom}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-4">
              <h2 className="text-lg font-bold text-[#0f1111]">About this item</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#0f1111]">
                <li>{product.description}</li>
                <li>Designed by {product.brand} for dependable everyday use and simple home delivery.</li>
                <li>{product.stock > 0 ? `Currently available with ${product.stock} units ready to ship.` : 'This item is temporarily unavailable right now.'}</li>
                <li>Popular in {product.category?.name || 'this category'} for balanced pricing and dependable quality.</li>
              </ul>

              <div className="mt-6 overflow-hidden rounded-lg border border-[#e7e7e7]">
                {detailRows.map(([label, value], index) => (
                  <div key={label} className={`grid grid-cols-[140px_1fr] text-sm ${index !== detailRows.length - 1 ? 'border-b border-[#e7e7e7]' : ''}`}>
                    <div className="bg-[#f3f3f3] px-4 py-3 font-semibold text-[#0f1111]">{label}</div>
                    <div className="px-4 py-3 text-[#0f1111]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="order-4 h-fit rounded-lg border border-[#d5d9d9] p-4 shadow-[0_2px_8px_rgba(15,17,17,0.08)] xl:sticky xl:top-24">
            <div className="flex items-start text-[#0f1111]">
              <span className="mr-1 mt-1 text-sm">₹</span>
              <span className="text-[36px] leading-none">{rupees}</span>
              <span className="ml-0.5 mt-1 text-sm">{paise}</span>
            </div>
            <div className="mt-3 text-sm leading-6 text-[#0f1111]">
              <span className="font-semibold">FREE delivery</span> {getDeliveryText(product).replace('FREE delivery ', '')}
            </div>
            <button className="mt-2 text-left text-sm text-[#007185]">Delivering to your saved address</button>
            <div className={`mt-4 text-2xl ${isOutOfStock ? 'text-[#b12704]' : 'text-[#007600]'}`}>
              {isOutOfStock ? 'Out of stock' : 'In stock'}
            </div>

            <div className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 text-sm text-[#565959]">
              <div>Ships from</div>
              <div className="text-[#0f1111]">Amazon Clone</div>
              <div>Sold by</div>
              <div className="text-[#007185]">{product.brand}</div>
              <div>Payment</div>
              <div className="text-[#007185]">Secure transaction</div>
            </div>

            <label className="mt-5 block text-sm text-[#0f1111]">
              <span className="mb-2 block">Quantity:</span>
              <select
                value={isOutOfStock ? '' : quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isOutOfStock}
                className="w-full rounded-xl border border-[#888c8c] bg-[#f0f2f2] px-3 py-2.5 outline-none focus:border-[#e77600]"
              >
                {isOutOfStock && <option value="">Out of stock</option>}
                {quantityOptions.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <div className="mt-5 space-y-3">
              <button
                onClick={user ? () => addToCart(quantity) : () => navigate('/login')}
                disabled={isOutOfStock}
                className="w-full rounded-full bg-[#ffd814] px-5 py-2.5 font-medium text-black transition enabled:hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:bg-[#e7e7e7] disabled:text-[#565959]"
              >
                Add to Cart
              </button>
              <button
                onClick={buyNow}
                disabled={isOutOfStock}
                className="w-full rounded-full bg-[#ffa41c] px-5 py-2.5 font-medium text-black transition enabled:hover:bg-[#fa8900] disabled:cursor-not-allowed disabled:bg-[#e7e7e7] disabled:text-[#565959]"
              >
                Buy Now
              </button>
              <button className="w-full rounded-lg border border-[#888c8c] bg-white px-4 py-2.5 text-left text-sm text-[#0f1111] transition hover:bg-[#f7fafa]">
                Add to Wish List
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-4 mt-10 rounded-xl border border-[#e7e7e7] bg-white p-5 shadow-[0_2px_8px_rgba(15,17,17,0.05)] xl:mx-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-[#0f1111]">Products related to this item</h2>
          <Link to="/" className="hidden text-sm text-[#007185] sm:block">See more from this category</Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {similar.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onAddToCart={user ? async () => {
                await api.post('/cart/add', { product_id: item.id, quantity: 1 })
                setNotice({ type: 'success', message: `${item.name} added to cart` })
                emitCartUpdated()
              } : () => navigate('/login')}
            />
          ))}
        </div>
      </div>

      {notice && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[70] max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,17,17,0.18)] backdrop-blur-sm ${
              notice.type === 'error'
                ? 'border-[#f1b6b6] bg-[#fff5f5] text-[#b12704]'
                : 'border-[#b9e3d8] bg-[#f2fbf8] text-[#067d62]'
            }`}
          >
            <div className="text-sm font-medium">{notice.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}
