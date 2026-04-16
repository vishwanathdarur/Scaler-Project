import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { emitCartUpdated, formatPrice, getProductImage, getProductRating, handleProductImageError } from '../utils/cart'

export default function HomePage({ filtersOpen, setFiltersOpen }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [priceFilter, setPriceFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [draftSortBy, setDraftSortBy] = useState('featured')
  const [draftPriceFilter, setDraftPriceFilter] = useState('all')
  const [draftRatingFilter, setDraftRatingFilter] = useState('all')
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const search = params.get('search') || ''
        const categoryId = params.get('category_id') || ''

        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products', {
            params: {
              search: search || undefined,
              category_id: categoryId || undefined
            }
          }),
          api.get('/products/meta/categories')
        ])

        setProducts(productsRes.data)
        setCategories(categoriesRes.data)
      } catch {
        setError('We could not load products right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params])

  const addToCart = async (product) => {
    try {
      await api.post('/cart/add', { product_id: product.id, quantity: 1 })
      setNotice(`${product.name} added to cart`)
      emitCartUpdated()
    } catch (err) {
      setNotice(err.response?.data?.detail || 'Could not add this item to cart.')
    }
  }

  const featured = products.slice(0, 4)
  const deals = [...products].sort((a, b) => a.price - b.price).slice(0, 8)
  const trending = [...products].sort((a, b) => b.stock - a.stock).slice(0, 4)
  const searchLabel = params.get('search')
  const activeCategoryId = params.get('category_id')
  const filteredProducts = products
    .filter((product) => {
      if (priceFilter === 'under-5000') {
        return Number(product.price) < 5000
      }
      if (priceFilter === '5000-20000') {
        return Number(product.price) >= 5000 && Number(product.price) <= 20000
      }
      if (priceFilter === 'above-20000') {
        return Number(product.price) > 20000
      }
      return true
    })
    .filter((product) => {
      if (ratingFilter === '4plus') {
        return Number(getProductRating(product)) >= 4
      }
      if (ratingFilter === '4_3plus') {
        return Number(getProductRating(product)) >= 4.3
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price-low-high') {
        return Number(a.price) - Number(b.price)
      }
      if (sortBy === 'price-high-low') {
        return Number(b.price) - Number(a.price)
      }
      if (sortBy === 'rating') {
        return Number(getProductRating(b)) - Number(getProductRating(a))
      }
      return 0
    })
  const resetFilters = () => {
    setSortBy('featured')
    setPriceFilter('all')
    setRatingFilter('all')
  }
  const filterCount = [sortBy !== 'featured', priceFilter !== 'all', ratingFilter !== 'all'].filter(Boolean).length

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

  useEffect(() => {
    if (filtersOpen) {
      setDraftSortBy(sortBy)
      setDraftPriceFilter(priceFilter)
      setDraftRatingFilter(ratingFilter)
    }
  }, [filtersOpen, sortBy, priceFilter, ratingFilter])

  useEffect(() => {
    setFiltersOpen(false)
  }, [params, setFiltersOpen])

  const clearAllFilters = () => {
    resetFilters()
    setFiltersOpen(false)
  }

  const clearDraftFilters = () => {
    setDraftSortBy('featured')
    setDraftPriceFilter('all')
    setDraftRatingFilter('all')
  }

  const applyFilters = () => {
    setSortBy(draftSortBy)
    setPriceFilter(draftPriceFilter)
    setRatingFilter(draftRatingFilter)
    setFiltersOpen(false)
  }

  return (
    <div className="page-shell pb-10">
      {filtersOpen && (
        <>
          <button
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 z-40 bg-black/45"
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-full max-w-[360px] overflow-y-auto bg-white shadow-[8px_0_24px_rgba(15,17,17,0.28)]">
            <div className="flex items-center justify-between border-b border-[#e7e7e7] px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">Filter Products</h2>
                <p className="text-sm text-slate-500">{filterCount} active</p>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full border border-[#d5d9d9] px-3 py-1 text-sm">
                Close
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Sort by</h3>
                <button onClick={clearDraftFilters} className="text-sm text-[#007185]">Clear all</button>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ['featured', 'Featured'],
                  ['price-low-high', 'Price: Low to High'],
                  ['price-high-low', 'Price: High to Low'],
                  ['rating', 'Avg. Customer Review']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setDraftSortBy(value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      draftSortBy === value ? 'border-[#c7511f] bg-[#fff7f2] text-[#c7511f]' : 'border-[#e7e7e7] hover:border-[#c7511f]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-base font-bold">Price</h3>
                <div className="mt-3 space-y-2">
                  {[
                    ['all', 'All Prices'],
                    ['under-5000', 'Under ₹5,000'],
                    ['5000-20000', '₹5,000 to ₹20,000'],
                    ['above-20000', 'Over ₹20,000']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setDraftPriceFilter(value)}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        draftPriceFilter === value ? 'border-[#c7511f] bg-[#fff7f2] text-[#c7511f]' : 'border-[#e7e7e7] hover:border-[#c7511f]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-base font-bold">Customer Reviews</h3>
                <div className="mt-3 space-y-2">
                  {[
                    ['all', 'All Ratings'],
                    ['4plus', '4★ & above'],
                    ['4_3plus', '4.3★ & above']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setDraftRatingFilter(value)}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        draftRatingFilter === value ? 'border-[#c7511f] bg-[#fff7f2] text-[#c7511f]' : 'border-[#e7e7e7] hover:border-[#c7511f]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={applyFilters} className="flex-1 rounded-full bg-[#ffd814] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#f7ca00]">
                  Apply Filters
                </button>
                <button onClick={() => setFiltersOpen(false)} className="rounded-full border border-[#d5d9d9] px-4 py-2.5 text-sm font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <section className="w-full px-3 pt-4 md:px-4">
        <div className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#dbeafe] via-[#fef3c7] to-[#fde68a] shadow-[0_8px_24px_rgba(15,17,17,0.12)]">
          <div className="grid gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c7511f]">Amazon.in inspired storefront</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-[#131921] sm:text-4xl md:text-5xl">
                Daily deals, fast checkout, and a homepage that feels much closer to the real marketplace.
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-700 sm:text-lg">
                Browse popular picks, filter by category, search instantly, and move from product discovery to checkout in a few clicks.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => navigate('/?category_id=1')} className="rounded-full bg-[#ffd814] px-5 py-2.5 font-semibold text-black hover:bg-[#f7ca00]">
                  Shop Electronics
                </button>
                <button onClick={() => navigate('/orders')} className="rounded-full border border-[#131921] px-5 py-2.5 font-semibold text-[#131921] hover:bg-white/50">
                  View Orders
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="rounded-2xl bg-white/90 p-4 text-left shadow-[0_6px_18px_rgba(15,17,17,0.12)] transition hover:-translate-y-1"
                >
                  <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[#f7f7f7] p-3">
                    <img src={getProductImage(product)} alt={product.name} onError={(event) => handleProductImageError(event, product.name)} className="max-h-full w-full object-contain" />
                  </div>
                  <div className="min-h-[2.5rem] overflow-hidden text-sm font-semibold text-[#0f1111]">{product.name}</div>
                  <div className="mt-2 text-lg font-bold">{formatPrice(product.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-[-24px] w-full px-3 md:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
            <h2 className="text-xl font-bold">Top categories for you</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {categories.slice(0, 4).map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/?category_id=${category.id}`)}
                  className={`rounded-xl border p-3 text-left text-sm transition hover:border-[#c7511f] hover:text-[#c7511f] ${
                    String(activeCategoryId) === String(category.id) ? 'border-[#c7511f] bg-[#fff7f2]' : 'border-[#e7e7e7]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
            <h2 className="text-xl font-bold">Free delivery</h2>
            <p className="mt-3 text-sm text-slate-600">Eligible orders above ₹999 already qualify in your cart and checkout summary.</p>
            <div className="mt-6 rounded-xl bg-[#eaf6ff] p-4 text-sm text-[#007185]">Order now and get a more Amazon-like delivery message across products and cart.</div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
            <h2 className="text-xl font-bold">Secure checkout</h2>
            <p className="mt-3 text-sm text-slate-600">Login-gated cart, order placement, and order history are wired end to end.</p>
            <button onClick={() => navigate(user ? '/cart' : '/login')} className="mt-5 rounded-full bg-[#ffd814] px-4 py-2 text-sm font-semibold">
              {user ? 'Go to Cart' : 'Sign in to shop'}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
            <h2 className="text-xl font-bold">Search highlights</h2>
            <p className="mt-3 text-sm text-slate-600">
              {searchLabel ? `Showing matches for "${searchLabel}".` : 'Use the top search bar to jump straight to products and suggestions.'}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full px-3 py-6 md:px-4">
        {notice && (
          <div className="mb-4 rounded-xl border border-[#cce3de] bg-[#f0faf8] px-4 py-3 text-sm text-[#067d62]">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_14px_rgba(15,17,17,0.08)]">Loading products...</div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_14px_rgba(15,17,17,0.08)]">{error}</div>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(15,17,17,0.08)] sm:p-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#0f1111] sm:text-2xl">
                      {searchLabel ? `Results for "${searchLabel}"` : 'Recommended picks inspired by Amazon.in'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {filteredProducts.length} of {products.length} items shown
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {filterCount > 0 ? `${filterCount} filters active` : 'No filters applied'}
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                    No products matched those filters. Try clearing one or two options.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={user ? addToCart : () => navigate('/login')} />
                    ))}
                  </div>
                )}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Budget deals</h2>
                  <span className="text-sm text-[#007185]">Under control pricing</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {deals.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={user ? addToCart : () => navigate('/login')} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_4px_14px_rgba(15,17,17,0.08)]">
                <h2 className="text-2xl font-bold">Trending now</h2>
                <div className="mt-4 space-y-4">
                  {trending.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex w-full items-center gap-4 rounded-xl border border-[#e7e7e7] p-3 text-left transition hover:border-[#c7511f]"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#f7f7f7] p-2">
                        <img src={getProductImage(product)} alt={product.name} onError={(event) => handleProductImageError(event, product.name)} className="max-h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase tracking-wide text-slate-400">#{index + 1} bestselling pick</div>
                        <div className="truncate font-semibold">{product.name}</div>
                        <div className="text-sm text-slate-500">
                          {product.brand} • {formatPrice(product.price)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
