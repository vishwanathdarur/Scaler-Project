import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { emitCartUpdated, formatPrice, getDeliveryText, getFallbackProductImage, getProductRating, getRatingCount, handleProductImageError } from '../utils/cart'

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [activeImg, setActiveImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/products/${id}`)
      setProduct(res.data)
      const sim = await api.get(`/products/${id}/similar`)
      setSimilar(sim.data || [])
    }

    load()
  }, [id])

  const addToCart = async (nextQuantity = quantity) => {
    try {
      await api.post('/cart/add', { product_id: product.id, quantity: nextQuantity })
      setNotice(`${product.name} added to cart`)
      emitCartUpdated()
      return true
    } catch (err) {
      setNotice(err.response?.data?.detail || 'Could not add this item to cart.')
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
  const quantityOptions = Array.from({ length: Math.max(1, Math.min(product.stock || 1, 10)) }, (_, index) => index + 1)
  const specifications = [
    ['Brand', product.brand],
    ['Category', product.category?.name || 'General'],
    ['Availability', product.stock > 0 ? `${product.stock} units in stock` : 'Currently unavailable'],
    ['Delivery', getDeliveryText(product)],
    ['Model use', 'Daily shopping and home delivery'],
    ['Customer rating', `${rating} / 5 (${ratingCount} ratings)`]
  ]

  return (
    <div className="page-shell mx-auto max-w-[1500px] px-4 py-6">
      {notice && (
        <div className="mb-4 rounded-xl border border-[#cce3de] bg-[#f0faf8] px-4 py-3 text-sm text-[#067d62]">
          {notice}
        </div>
      )}

      <div className="grid gap-5 rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-6 xl:grid-cols-[90px_1.1fr_1fr_320px]">
        <div className="order-2 amazon-scrollbar flex gap-2 overflow-x-auto xl:order-none xl:flex-col xl:overflow-visible">
          {images.map((img, idx) => (
            <button key={idx} onClick={() => setActiveImg(idx)} className={`rounded-lg border p-1 ${idx === activeImg ? 'border-[#e77600] shadow-[0_0_0_2px_rgba(231,118,0,0.2)]' : 'border-[#d5d9d9]'}`}>
              <img src={img.image_url} alt={`${product.name} ${idx + 1}`} onError={(event) => handleProductImageError(event, product.name)} className="h-16 w-16 rounded object-cover" />
            </button>
          ))}
        </div>

        <div className="order-1 flex items-start justify-center xl:order-none">
          <img src={images[activeImg].image_url} alt={product.name} onError={(event) => handleProductImageError(event, product.name)} className="max-h-[340px] w-full object-contain sm:max-h-[420px] xl:max-h-[520px]" />
        </div>

        <div className="order-3">
          <p className="text-sm text-[#007185]">{product.brand} Brand Store</p>
          <h1 className="mt-1 text-2xl leading-tight text-[#0f1111] sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 border-b border-[#e7e7e7] pb-4 text-sm text-[#007185]">
            <span>{rating} ★★★★☆</span>
            <span>{ratingCount} ratings</span>
          </div>
          <div className="mt-4 text-sm text-slate-500">Limited time deal</div>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-sm">₹</span>
            <span className="text-3xl leading-none sm:text-4xl">{rupees}</span>
            <span className="pb-1 text-sm">{paise}</span>
          </div>
          <div className="mt-1 text-sm text-slate-500">
            M.R.P.: <span className="line-through">{formatPrice(mrp)}</span>
          </div>
          <p className="mt-2 text-sm text-[#067d62]">{getDeliveryText(product)}</p>
          <p className={`mt-2 text-sm font-medium ${product.stock > 0 ? 'text-[#067d62]' : 'text-red-600'}`}>
            {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
          </p>
          <div className="mt-6 rounded-xl bg-[#f8fafb] p-4">
            <h2 className="text-lg font-semibold">About this item</h2>
            <p className="mt-2 leading-7 text-slate-700">{product.description}</p>
          </div>
          <div className="mt-6 rounded-xl border border-[#e7e7e7] p-4">
            <h2 className="text-lg font-semibold">Product specifications</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {specifications.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#f8fafb] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                  <div className="mt-1 text-sm text-slate-700">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="order-4 h-fit rounded-2xl border border-[#d5d9d9] p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)] xl:order-none">
          <div className="text-2xl sm:text-3xl">{formatPrice(product.price)}</div>
          <p className="mt-2 text-sm text-slate-700">{getDeliveryText(product)}</p>
          <p className="mt-2 text-sm text-[#067d62]">{product.stock > 0 ? 'In Stock' : 'Unavailable'}</p>

          <label className="mt-4 block text-sm font-medium">
            Quantity
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-[#d5d9d9] px-3 py-2"
            >
              {quantityOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <div className="mt-5 space-y-3">
            <button
              onClick={user ? () => addToCart(quantity) : () => navigate('/login')}
              className="w-full rounded-full bg-[#ffd814] px-5 py-3 font-semibold hover:bg-[#f7ca00]"
            >
              Add to Cart
            </button>
            <button onClick={buyNow} className="w-full rounded-full bg-[#ffa41c] px-5 py-3 font-semibold hover:bg-[#fa8900]">
              Buy Now
            </button>
          </div>

          <div className="mt-5 text-sm text-slate-600">
            <div>Ships from: Amazon Clone</div>
            <div className="mt-1">Sold by: {product.brand}</div>
            <div className="mt-1">Category: {product.category?.name}</div>
          </div>
        </aside>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">Products related to this item</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {similar.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onAddToCart={user ? async () => {
                await api.post('/cart/add', { product_id: item.id, quantity: 1 })
                setNotice(`${item.name} added to cart`)
                emitCartUpdated()
              } : () => navigate('/login')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
