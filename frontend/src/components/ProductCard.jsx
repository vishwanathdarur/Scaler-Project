import { Link } from 'react-router-dom'
import { formatPrice, getDeliveryText, getProductImage, getProductRating, getRatingCount, handleProductImageError } from '../utils/cart'

export default function ProductCard({ product, onAddToCart }) {
  const image = getProductImage(product)
  const rating = getProductRating(product)
  const ratingCount = getRatingCount(product)
  const decimalPrice = Number(product.price).toFixed(2)
  const [rupees, paise] = decimalPrice.split('.')
  const mrp = Number(product.price) * 1.18

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#d5d9d9] bg-white p-4 transition hover:shadow-[0_4px_14px_rgba(15,17,17,0.12)]">
      <Link to={`/product/${product.id}`} className="block">
        <div className="flex h-56 items-center justify-center rounded-lg bg-[#f7f7f7] p-4">
          <img src={image} alt={product.name} onError={(event) => handleProductImageError(event, product.name)} className="max-h-full w-full object-contain" />
        </div>
        <h3 className="mt-4 min-h-[3.4rem] overflow-hidden text-[15px] leading-6 text-[#0f1111] hover:text-[#c7511f]">
          {product.name}
        </h3>
      </Link>
      <div className="mt-2 flex items-center gap-2 text-sm text-[#007185]">
        <span>{rating} ★★★★☆</span>
        <span>{ratingCount}</span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-sm">₹</span>
        <span className="text-3xl leading-none">{rupees}</span>
        <span className="pb-0.5 text-sm">{paise}</span>
      </div>
      <div className="mt-1 text-sm text-slate-500">
        M.R.P.: <span className="line-through">{formatPrice(mrp)}</span>
      </div>
      <p className="mt-1 text-sm text-slate-700">{getDeliveryText(product)}</p>
      <p className="mb-4 mt-1 text-sm text-[#067d62]">{product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
      <button onClick={() => onAddToCart?.(product)} className="mt-auto rounded-full bg-[#ffd814] py-2 text-sm font-medium text-black hover:bg-[#f7ca00]">
        Add to Cart
      </button>
    </div>
  )
}
