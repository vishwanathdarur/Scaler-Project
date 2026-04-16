export const CART_UPDATED_EVENT = 'cart:updated'

export function emitCartUpdated(detail = {}) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail }))
}

export function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export function getFallbackProductImage(label = 'Product') {
  const safeLabel = String(label).replace(/[<&>]/g, '')
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e7edf3"/>
          <stop offset="100%" stop-color="#f8fbfd"/>
        </linearGradient>
      </defs>
      <rect width="500" height="500" rx="32" fill="url(#bg)"/>
      <rect x="110" y="120" width="280" height="180" rx="18" fill="#d5dee8"/>
      <circle cx="180" cy="190" r="28" fill="#bcc9d6"/>
      <path d="M150 270l60-60 48 44 38-30 54 46v24H150z" fill="#b1bfcd"/>
      <text x="250" y="365" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#44556a">${safeLabel}</text>
    </svg>`
  )}`
}

export function getProductImage(product) {
  return product.images?.[0]?.image_url || getFallbackProductImage(product?.name || 'Product')
}

export function handleProductImageError(event, label = 'Product') {
  if (event.currentTarget.dataset.fallbackApplied === 'true') {
    return
  }

  event.currentTarget.dataset.fallbackApplied = 'true'
  event.currentTarget.src = getFallbackProductImage(label)
}

export function getProductRating(product) {
  const base = Number(product.id || 1)
  return (3.8 + (base % 11) * 0.11).toFixed(1)
}

export function getRatingCount(product) {
  const base = Number(product.id || 1)
  return (124 + base * 37).toLocaleString('en-IN')
}

export function getDeliveryText(product) {
  if (product.stock <= 0) {
    return 'Currently unavailable.'
  }
  if (product.stock <= 5) {
    return 'Delivery by tomorrow if you order within 5 hrs.'
  }
  return 'FREE delivery by Tomorrow on eligible orders.'
}
