import { useEffect, useMemo, useState } from 'react'
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
  const [notice, setNotice] = useState(null)
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
              category_id: categoryId || undefined,
            },
          }),
          api.get('/products/meta/categories'),
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

  useEffect(() => {
    if (!notice) {
      return
    }

    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const addToCart = async (product) => {
    try {
      await api.post('/cart/add', { product_id: product.id, quantity: 1 })
      setNotice({ type: 'success', message: `${product.name} added to cart` })
      emitCartUpdated()
    } catch (err) {
      setNotice({ type: 'error', message: err.response?.data?.detail || 'Could not add this item to cart.' })
    }
  }

  const searchLabel = params.get('search')
  const activeCategoryId = params.get('category_id')
  const featured = products.slice(0, 8)
  const deals = [...products].sort((a, b) => a.price - b.price).slice(0, 4)
  const premium = [...products].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 4)
  const trending = [...products].sort((a, b) => b.stock - a.stock).slice(0, 4)
  const everyday = [...products].slice(8, 12)
  const bannerProducts = [...products].slice(0, 4)

  const filteredProducts = useMemo(
    () =>
      products
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
        }),
    [priceFilter, products, ratingFilter, sortBy]
  )

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
  }, [filtersOpen, priceFilter, ratingFilter, sortBy])

  useEffect(() => {
    setFiltersOpen(false)
  }, [params, setFiltersOpen])

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

  const promoCards = [
    {
      title: 'Continue shopping deals',
      action: 'See more deals',
      items: featured.slice(0, 4),
    },
    {
      title: 'Appliances for your home | Up to 55% off',
      action: 'See more',
      items: deals,
    },
    {
      title: 'Revamp your home in style',
      action: 'Explore all',
      items: premium,
    },
    {
      title: 'Bulk order discounts + Up to 18% GST savings',
      action: 'Create a free account',
      items: everyday.length ? everyday : trending,
    },
  ]

  return (
    <div className="page-shell bg-[#e3e6e6] pb-12">
      {filtersOpen && (
        <>
          <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="fixed inset-0 z-40 bg-black/45" />
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
                <button onClick={clearDraftFilters} className="text-sm text-[#007185]">
                  Clear all
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ['featured', 'Featured'],
                  ['price-low-high', 'Price: Low to High'],
                  ['price-high-low', 'Price: High to Low'],
                  ['rating', 'Avg. Customer Review'],
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
                    ['above-20000', 'Over ₹20,000'],
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
                    ['4_3plus', '4.3★ & above'],
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

      <section className="relative w-full">
        <div className="relative min-h-[260px] overflow-hidden bg-[linear-gradient(180deg,#9ed4f2_0%,#d9ecfb_38%,#f8d9df_72%,#f8eadb_100%)] px-4 pb-24 pt-7 sm:min-h-[320px] sm:px-8 sm:pt-9 lg:min-h-[360px] lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="max-w-[520px]">
              <div className="text-[clamp(2.1rem,5vw,4.2rem)] font-bold leading-none tracking-tight text-[#0f1111]">Up to 50% off</div>
              <div className="mt-2 text-[clamp(1.45rem,3vw,3rem)] leading-none text-[#0f1111]">Everyday needs</div>
              <div className="mt-6 flex items-center gap-4 text-[#0f1111] sm:mt-8">
                <span className="text-[0.95rem] leading-tight sm:text-[1.1rem]">Top brands</span>
                <span className="h-10 w-px bg-black/25 sm:h-12" />
                <span className="text-[0.95rem] leading-tight sm:text-[1.1rem]">Wide selection</span>
              </div>
            </div>

            <div className="hidden items-end justify-center gap-3 md:flex lg:gap-4">
              {bannerProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex h-[120px] w-[104px] items-end justify-center rounded-[22px] bg-white/18 p-3 shadow-[0_16px_35px_rgba(15,17,17,0.12)] backdrop-blur-[2px] sm:h-[140px] sm:w-[120px] lg:h-[160px] lg:w-[140px] lg:rounded-[26px]"
                  style={{ transform: `translateY(${index % 2 === 0 ? 18 : 0}px)` }}
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(event) => handleProductImageError(event, product.name)}
                    className="max-h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
              ))}
            </div>
          </div>

          <button className="absolute left-3 top-1/2 hidden h-20 w-12 -translate-y-1/2 items-center justify-center border border-black/15 bg-white/35 text-5xl text-[#0f1111] lg:flex">
            ‹
          </button>
          <button className="absolute right-3 top-1/2 hidden h-20 w-12 -translate-y-1/2 items-center justify-center border border-black/15 bg-white/35 text-5xl text-[#0f1111] lg:flex">
            ›
          </button>
        </div>

        <div className="relative z-10 -mt-14 grid gap-4 px-0 pb-4 sm:-mt-16 lg:-mt-20 md:grid-cols-2 xl:grid-cols-4">
          {promoCards.map((card) => (
            <div key={card.title} className="bg-white p-4 shadow-[0_2px_6px_rgba(15,17,17,0.14)] sm:p-5 lg:p-6">
              <h2 className="text-[1.05rem] font-bold leading-8 text-[#0f1111] sm:text-[1.25rem]">{card.title}</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                {card.items.map((item) => (
                  <button key={item.id} onClick={() => navigate(`/product/${item.id}`)} className="text-left">
                    <div className="flex h-[110px] items-center justify-center bg-[#f7f7f7] p-2 sm:h-[120px]">
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        onError={(event) => handleProductImageError(event, item.name)}
                        className="max-h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 line-clamp-2 text-[0.9rem] leading-5 text-[#0f1111] sm:text-[0.95rem] sm:leading-6">{item.name}</div>
                  </button>
                ))}
              </div>
              <button className="mt-5 text-sm text-[#2162a1] hover:text-[#c7511f]">{card.action}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full px-0 py-2">
        {loading ? (
          <div className="bg-white p-8 text-center shadow-[0_2px_6px_rgba(15,17,17,0.14)]">Loading products...</div>
        ) : error ? (
          <div className="bg-white p-8 text-center shadow-[0_2px_6px_rgba(15,17,17,0.14)]">{error}</div>
        ) : (
          <>
            <div className="bg-white px-5 py-6 shadow-[0_2px_6px_rgba(15,17,17,0.14)]">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-[1.35rem] font-bold text-[#0f1111]">
                    {searchLabel ? `Results for "${searchLabel}"` : 'Keep shopping for more'}
                  </h2>
                  <div className="mt-1 text-sm text-[#565959]">
                    {filteredProducts.length} of {products.length} items shown
                  </div>
                </div>
                <div className="text-sm text-[#2162a1]">{filterCount > 0 ? `${filterCount} filters active` : 'Recommended for you'}</div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="border border-dashed border-slate-300 p-8 text-center text-slate-600">
                  No products matched those filters. Try changing one or two options.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={user ? addToCart : () => navigate('/login')} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 bg-white px-5 py-6 shadow-[0_2px_6px_rgba(15,17,17,0.14)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-[1.35rem] font-bold text-[#0f1111]">Starting ₹199 | Pick up where you left off</h2>
                <button className="hidden text-sm text-[#2162a1] md:block">See all offers</button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {featured.slice(0, 4).map((product) => (
                  <button key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="text-left">
                    <div className="flex h-[190px] items-center justify-center bg-[#f7f7f7] p-4">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        onError={(event) => handleProductImageError(event, product.name)}
                        className="max-h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-3 text-[15px] font-medium text-[#0f1111]">{product.name}</div>
                    <div className="mt-1 text-sm text-[#565959]">{formatPrice(product.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="bg-white px-5 py-6 shadow-[0_2px_6px_rgba(15,17,17,0.14)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-[1.35rem] font-bold text-[#0f1111]">Deals based on your interests</h2>
                  <button className="text-sm text-[#2162a1]">See more</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {deals.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={user ? addToCart : () => navigate('/login')} />
                  ))}
                </div>
              </div>

              <div className="bg-white px-5 py-6 shadow-[0_2px_6px_rgba(15,17,17,0.14)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-[1.35rem] font-bold text-[#0f1111]">Trending now</h2>
                  <button className="text-sm text-[#2162a1]">Explore all</button>
                </div>
                <div className="space-y-4">
                  {trending.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex w-full items-center gap-4 border border-[#e7e7e7] p-3 text-left transition hover:border-[#c7511f]"
                    >
                      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center bg-[#f7f7f7] p-2">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          onError={(event) => handleProductImageError(event, product.name)}
                          className="max-h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase tracking-wide text-[#565959]">#{index + 1} Bestseller</div>
                        <div className="mt-1 truncate text-[16px] font-medium text-[#0f1111]">{product.name}</div>
                        <div className="mt-1 text-sm text-[#565959]">
                          {product.brand} • {formatPrice(product.price)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 bg-white px-5 py-6 shadow-[0_2px_6px_rgba(15,17,17,0.14)]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-[1.35rem] font-bold text-[#0f1111]">Shop by category</h2>
                <button className="text-sm text-[#2162a1]">View all categories</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/?category_id=${category.id}`)}
                    className={`border px-5 py-4 text-left transition ${
                      String(activeCategoryId) === String(category.id)
                        ? 'border-[#c7511f] bg-[#fff7f2] text-[#c7511f]'
                        : 'border-[#e7e7e7] bg-white hover:border-[#c7511f]'
                    }`}
                  >
                    <div className="text-[16px] font-medium">{category.name}</div>
                    <div className="mt-1 text-sm text-[#565959]">Explore more picks</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

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
